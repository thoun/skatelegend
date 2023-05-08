<?php

trait UtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function array_find(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return $value;
            }
        }
        return null;
    }

    function array_find_key(array $array, callable $fn) {
        foreach ($array as $key => $value) {
            if($fn($value)) {
                return $key;
            }
        }
        return null;
    }

    function array_some(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return true;
            }
        }
        return false;
    }
    
    function array_every(array $array, callable $fn) {
        foreach ($array as $value) {
            if(!$fn($value)) {
                return false;
            }
        }
        return true;
    }

    function array_identical(array $a1, array $a2) {
        if (count($a1) != count($a2)) {
            return false;
        }
        for ($i=0;$i<count($a1);$i++) {
            if ($a1[$i] != $a2[$i]) {
                return false;
            }
        }
        return true;
    }

    function setGlobalVariable(string $name, /*object|array*/ $obj) {
        /*if ($obj == null) {
            throw new \Error('Global Variable null');
        }*/
        $jsonObj = json_encode($obj);
        $this->DbQuery("INSERT INTO `global_variables`(`name`, `value`)  VALUES ('$name', '$jsonObj') ON DUPLICATE KEY UPDATE `value` = '$jsonObj'");
    }

    function getGlobalVariable(string $name, $asArray = null) {
        $json_obj = $this->getUniqueValueFromDB("SELECT `value` FROM `global_variables` where `name` = '$name'");
        if ($json_obj) {
            $object = json_decode($json_obj, $asArray);
            return $object;
        } else {
            return null;
        }
    }

    function deleteGlobalVariable(string $name) {
        $this->DbQuery("DELETE FROM `global_variables` where `name` = '$name'");
    }

    function deleteGlobalVariables(array $names) {
        $this->DbQuery("DELETE FROM `global_variables` where `name` in (".implode(',', array_map(fn($name) => "'$name'", $names)).")");
    }

    function getVisibleTopDecks() {
        return $this->getGlobalVariable(VISIBLE_TOP_DECKS, true) ?? [];
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getPlayerName(int $playerId) {
        return self::getUniqueValueFromDB("SELECT player_name FROM player WHERE player_id = $playerId");
    }

    function getPlayerHelmets(int $playerId) {
        return intval(self::getUniqueValueFromDB("SELECT player_helmets FROM player WHERE player_id = $playerId"));
    }

    function getRemainingHelmets() {
        return 9 - intval(self::getUniqueValueFromDB("SELECT sum(player_helmets) FROM player"));
    }

    function getPlayerScore(int $playerId) {
        return intval($this->getUniqueValueFromDB("SELECT player_score FROM player where `player_id` = $playerId"));
    }

    function getPlayerActive(int $playerId) {
        return boolval($this->getUniqueValueFromDB("SELECT player_active FROM player where `player_id` = $playerId"));
    }

    function incPlayerScore(int $playerId, int $amount, $message = '', $args = []) {
        $this->DbQuery("UPDATE player SET `player_score` = `player_score` + $amount WHERE player_id = $playerId");
            
        $logType = array_key_exists('scoreType', $args) && in_array($args['scoreType'], ['endControlTerritory']) ? $args['scoreType'] : 'score';
        $this->notifyAllPlayers($logType, $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $this->getPlayerScore($playerId),
            'incScore' => $amount,
        ] + $args);
    }

    function getCardFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Card($dbCard, $this->CARDS_TYPE);
    }

    function getCardsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbCards));
    }

    function getCardById(int $id) {
        $sql = "SELECT * FROM `card` WHERE `card_id` = $id";
        $dbResults = $this->getCollectionFromDb($sql);
        $cards = array_map(fn($dbCard) => new Card($dbCard, $this->CARDS_TYPE), array_values($dbResults));
        return count($cards) > 0 ? $cards[0] : null;
    }

    function getCardsByLocation(string $location, /*int|null*/ $location_arg = null, /*int|null*/ $type = null, /*int|null*/ $subType = null) {
        $sql = "SELECT * FROM `card` WHERE `card_location` = '$location'";
        if ($location_arg !== null) {
            $sql .= " AND `card_location_arg` = $location_arg";
        }
        if ($type !== null) {
            $sql .= " AND `card_type` = $type";
        }
        if ($subType !== null) {
            $sql .= " AND `card_type_arg` = $subType";
        }
        $sql .= " ORDER BY `card_location_arg`";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbCard) => new Card($dbCard, $this->CARDS_TYPE), array_values($dbResults));
    }

    function setupCards(array $playersIds) {
        // legend cards
        foreach ($this->CARDS_TYPE[2] as $subType => $cardType) {
            $cards[] = [ 'type' => 2, 'type_arg' => $subType, 'nbr' => $cardType->number ];
        }
        $this->cards->createCards($cards, 'initdecklegend');
        $this->cards->shuffle('initdecklegend');

        $trophyCard = $this->getCardsByLocation('initdecklegend', null, 2, 1)[0];
        $this->cards->moveCard($trophyCard->id, 'decklegend', 0);
        for ($i = 1; $i <= 3; $i++) {
            $this->cards->pickCardForLocation('initdecklegend', 'decklegend', $i);
        }

        // cards
        $cards = [];
        foreach ($this->CARDS_TYPE[1] as $subType => $cardType) {
            $cards[] = [ 'type' => 1, 'type_arg' => $subType, 'nbr' => $cardType->number ];
        }
        $this->cards->createCards($cards, 'deck1');
        $this->cards->shuffle('deck1');

        foreach ($playersIds as $playerId) {
            $this->cards->pickCard('deck1', $playerId);
        }

        $halfDeck = floor(intval($this->cards->countCardInLocation('deck1')) / 2);
        $this->cards->pickCardsForLocation($halfDeck, 'deck1', 'deck2');
    } 

    function makeTopDeckVisible(int $deckId, bool $persist = false) {
        if ($persist) {
            $visibleTopDecks = $this->getVisibleTopDecks();
            if (!in_array($deckId, $visibleTopDecks)) {
                $visibleTopDecks[] = $deckId;
                $this->setGlobalVariable(VISIBLE_TOP_DECKS, $visibleTopDecks);
            } else {
                return;
            }
        }

        $card = $this->getCardFromDb($this->cards->getCardOnTop('deck'.$deckId));

        self::notifyAllPlayers('flipTopDeck', '', [
            'deckId' => $deckId,
            'card' => $card,
        ]);
    }

    function playCard(int $playerId, Card $card, bool $fromDeck) {
        $this->cards->moveCard($card->id, 'played'.$playerId, intval($this->cards->countCardInLocation('played'.$playerId)) - 1);
        
        $message = '';/* TODO $fromDeck ?
            clienttranslate('${player_name} plays a ${card_color} ${card_type} card from their hand (paid ${types}) ${card_display}') :
            clienttranslate('${player_name} plays a ${card_color} ${card_type} card from their hand ${card_display}');*/
        
        self::notifyAllPlayers('playCard', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'fromDeck' => $fromDeck,
            /*'newCount' => intval($this->cards->countCardInLocation('hand', $playerId)),
            'discardedTokens' => $tokens,
            'types' => array_map(fn($token) => $token->type, $tokens), // for logs
            'card_type' => $this->getCardType($card->cardType), // for logs
            'card_color' => $this->getCardColor($card->color), // for logs
            'card_display' => 100 * $card->color + $card->number, // for logs*/
        ]);

        $sequence = $this->getCardsByLocation('played'.$playerId);
        $fall = $this->isFall($playerId, $sequence);
        if ($fall > 0) {
            $this->gamestate->nextState('fall');
            return;
        }

        $helmets = $this->getPlayerHelmets($playerId);
        if ($helmets > 0 && intval(self::getUniqueValueFromDB("SELECT player_helmet_card_id = -1 FROM player WHERE player_id = $playerId")) != -1) {
            $helmets = 0; // can't play a helmet, already played one this round
        }

        /*$this->incStat(1, 'playedCards');
        $this->incStat(1, 'playedCards', $playerId);
        $this->incStat(1, 'playedCards'.$card->cardType);
        $this->incStat(1, 'playedCards'.$card->cardType, $playerId);*/

        if ($helmets > 0) {
            $this->gamestate->nextState('helmet');
        } else {
            $this->afterPlayHelmet($playerId, $card);
        }
    }

    function getSequenceCardsByColor(array $sequence) {
        $colors = [];
        foreach($sequence as $card) {
            $colors[$card->color][] = $card;
        }
        return $colors;
    }

    function getColorOfHelmet(int $playerId, array $sequence) {
        $cardId = intval(self::getUniqueValueFromDB("SELECT player_helmet_card_id FROM player WHERE player_id = $playerId"));
        if ($cardId == -1) {
            return -1;
        }

        $card = $this->array_find($sequence, fn($c) => $c->id == $cardId);
        return $card->color;
    }

    function isFall(int $playerId, array $sequence) {
        if (count(array_filter($sequence, fn($card) => $card->danger)) >= 3) { 
            return 1; // fall with danger symbol
        }

        $colorOfHelmet = $this->getColorOfHelmet($playerId, $sequence);

        $colors = $this->getSequenceCardsByColor($sequence);
        foreach($colors as $color => $colorCards) {
            if ($color != $colorOfHelmet && count($colorCards) >= 3) {
                return 2; // fall with color
            }
        }

        return 0;
    }

    function isConditionValidated(array $sequence, array $conditionArray) {
        $number = $conditionArray[0];
        $condition = $conditionArray[1];

        switch ($condition) {
            case CONDITION_DANGER:
                $dangerCards = array_filter($sequence, fn($card) => $card->danger);
                return count($dangerCards) >= $number;
            case CONDITION_CARDS:
                return count($sequence) >= $number;
            case CONDITION_YELLOW_GREEN:
                $hasYellowCard = $this->array_some($sequence, fn($card) => $card->color == YELLOW);
                $hasGreenCard = $this->array_some($sequence, fn($card) => $card->color == GREEN);
                return $hasYellowCard && $hasGreenCard;
            case CONDITION_RED:
                $dangerCards = array_filter($sequence, fn($card) => $card->color == RED);
                return count($dangerCards) >= $number;
        }

        $colors = $this->getSequenceCardsByColor($sequence);

        switch ($condition) {
            case CONDITION_EQUAL:
                return $this->array_some($colors, fn($colorCards) => count($colorCards) >= $number);
            case CONDITION_DIFFERENT:
                return count($colors) >= $number;
        }
        
    }

    function closeSequence(int $playerId, bool $manuallyTriggered) {
        $sequence = $this->getCardsByLocation('played'.$playerId);

        $cardsToDiscard = [];
        foreach ($sequence as $card) {
            if ($card->type == 2 && $card->condition != null) {
                if (!$this->isConditionValidated($sequence, $card->condition)) {
                    $cardsToDiscard[] = $card;
                }
            }
        }
        $this->cards->moveCards(array_map(fn($card) => $card->id, $cardsToDiscard), 'discard', $playerId);
        if (count($cardsToDiscard) > 0) {
            $sequence = $this->getCardsByLocation('played'.$playerId);
        }

        $wheels = 0;
        foreach ($sequence as $card) {
            $wheels += $card->wheels;
        }
        $this->cards->moveCards(array_map(fn($card) => $card->id, $sequence), 'scored', $playerId);

        self::DbQuery("update player set player_helmet_card_id = -1, player_active = 0, player_score = player_score + $wheels WHERE player_id = $playerId");
        // TODO TOCHECK score now or at the end ?

        $message = $manuallyTriggered ? 
            clienttranslate('${player_name} chooses to stop their sequence') :
            clienttranslate('${player_name} automatically stops their sequence (last remaining active player)');
        self::notifyAllPlayers('log', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
        ]);

        foreach ($cardsToDiscard as $card) {
            self::notifyAllPlayers('discardedLegendCard', clienttranslate('${player_name} discards a legend card because the condition isn\'t met'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
                'card' => $card,
            ]);
        }

        self::notifyAllPlayers('closeSequence', clienttranslate('${player_name} score ${points} points with closed sequence'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'points' => $wheels,
        ]);
    }

    function addHelmet(int $playerId, Card $card) {
        self::DbQuery("update player set player_helmet_card_id = $card->id, player_helmets = player_helmets - 1 WHERE player_id = $playerId");

        self::notifyAllPlayers('addHelmet', clienttranslate('${player_name} adds a helmet on the last played card'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
        ]);
    }

    function afterPlayHelmet(int $playerId, Card $card) {
        // TODO handle powers
        $this->gamestate->nextState('next');
    }

    function getRemainingActivePlayersIds() {
        return array_map(fn($dbPlayer) => intval($dbPlayer['player_id']), array_values($this->getCollectionFromDb('select player_id from player WHERE player_active = 1')));
    }

    function takeLegendCard(int $playerId) {
        $card = $this->getCardFromDb($this->cards->getCardOnTop('decklegend'));
        $this->cards->moveCard($card->id, 'hand', $playerId);

        self::notifyAllPlayers('takeTrophyCard', clienttranslate('${player_name} takes the trophy card for being the last active player'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'newCount' => intval($this->cards->countCardInLocation('decklegend')),
            'newCard' => $this->getCardFromDb($this->cards->getCardOnTop('decklegend')),
        ]);
    }
    
}
