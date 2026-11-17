<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend;

use Bga\Games\Skatelegend\Models\Card;
use Bga\Games\Skatelegend\States\NextPlayer;
use Bga\Games\Skatelegend\States\PickCard;
use Bga\Games\Skatelegend\States\PlayCard;
use Bga\Games\Skatelegend\States\RevealDeckCard;

trait UtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

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

    function incPlayerScore(int $playerId, int $amount, $message = '', $args = []) {
        $this->bga->playerScore->inc($playerId, $amount, null);
            
        $logType = array_key_exists('scoreType', $args) && in_array($args['scoreType'], ['endControlTerritory']) ? $args['scoreType'] : 'score';
        $this->bga->notify->all($logType, $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $this->bga->playerScore->get($playerId),
            'incScore' => $amount,
        ] + $args);
    }

    function getCardFromDb(?array $dbCard) {
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

        $halfDeck = (int) floor(intval($this->cards->countCardInLocation('deck1')) / 2);
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

        $this->bga->notify->all('flipCard', '', [
            'card' => $card,
        ]);
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

        $card = \array_find($sequence, fn($c) => $c->id == $cardId);
        return $card->color;
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
                $hasYellowCard = \array_any($sequence, fn($card) => $card->color == YELLOW);
                $hasGreenCard = \array_any($sequence, fn($card) => $card->color == GREEN);
                return $hasYellowCard && $hasGreenCard;
            case CONDITION_RED:
                $dangerCards = array_filter($sequence, fn($card) => $card->color == RED);
                return count($dangerCards) >= $number;
        }

        $colors = $this->getSequenceCardsByColor($sequence);

        switch ($condition) {
            case CONDITION_EQUAL:
                return \array_any($colors, fn($colorCards) => count($colorCards) >= $number);
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
        $this->cards->moveCards(array_map(fn($card) => $card->id, $cardsToDiscard), 'discard');
        if (count($cardsToDiscard) > 0) {
            $sequence = $this->getCardsByLocation('played'.$playerId);
        }

        $wheels = 0;
        foreach ($sequence as $card) {
            $wheels += $card->wheels;
        }
        $this->cards->moveCards(array_map(fn($card) => $card->id, $sequence), 'scored', $playerId);

        $roundPointsJson = $this->getUniqueValueFromDB("SELECT `player_round_points` FROM `player` where player_id = $playerId");
        $roundPoints = $roundPointsJson === null ? null : json_decode($roundPointsJson, true);
        $roundPoints[intval($this->bga->tableStats->get('roundNumber'))] = $wheels;

        self::DbQuery("update player set player_helmet_card_id = -1, player_active = 0, player_round_points = '".json_encode($roundPoints)."' WHERE player_id = $playerId");
        $this->bga->playerScore->inc($playerId, $wheels, null);

        $message = $manuallyTriggered ? 
            clienttranslate('${player_name} chooses to stop their sequence') :
            clienttranslate('${player_name} automatically stops their sequence (last remaining active player)');
        $this->bga->notify->all('log', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
        ]);

        foreach ($cardsToDiscard as $card) {
            $this->bga->notify->all('discardedLegendCard', clienttranslate('${player_name} discards a legendary trick card because the condition isn\'t met'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
                'card' => $card,
            ]);
        }

        $this->bga->notify->all('closeSequence', clienttranslate('${player_name} score ${points} points with closed sequence'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'points' => $wheels, // for logs
            'roundPoints' => $wheels,
            'sequence' => $sequence,
        ]);
    }


    function afterPlayHelmet(int $playerId, Card $card): string {
        if (in_array($card->power, [POWER_PICK_CARD, POWER_PICK_CARD_TWICE])) {
            $this->incGameStateValue(PICK_CARDS, $card->power == POWER_PICK_CARD_TWICE ? 2 : 1);
        } else 
        if ($card->power == POWER_FLIP_DECK) {
            $visibleTopDecks = $this->getVisibleTopDecks();

            if (count($visibleTopDecks) == 0) {
                return RevealDeckCard::class;
            } else if (count($visibleTopDecks) == 1) {
                $deckId = $visibleTopDecks[0] == 1 ? 2 : 1;
                $this->makeTopDeckVisible($deckId, true);
            } // else nothing
        } else if (in_array($card->power, [POWER_PLAY_AGAIN, POWER_PLAY_AGAIN_TWICE])) {
            $this->incGameStateValue(PLAY_AGAIN, $card->power == POWER_PLAY_AGAIN_TWICE ? 2 : 1);
        }

        return $this->afterPlayPower();
    }

    function afterPlayPower(): string {
        if (intval($this->getGameStateValue(PICK_CARDS)) > 0) {
            $this->incGameStateValue(PICK_CARDS, -1);
            return PickCard::class;
        }

        if (intval($this->getGameStateValue(PLAY_AGAIN)) > 0) {
            $this->incGameStateValue(PLAY_AGAIN, -1);
            return PlayCard::class;
        }
        return NextPlayer::class;
    }

    function getRemainingActivePlayersIds() {
        return array_map(fn($dbPlayer) => intval($dbPlayer['player_id']), array_values($this->getCollectionFromDb('select player_id from player WHERE player_active = 1')));
    }

    function takeLegendCard(int $playerId) {
        $card = $this->getCardFromDb($this->cards->getCardOnTop('decklegend'));
        $perfectLanding = $card->typeArg == 1;

        if ($perfectLanding) {
            $this->cards->moveCard($card->id, 'played'.$playerId, intval($this->cards->countCardInLocation('played'.$playerId)));
        } else {
            $this->cards->moveCard($card->id, 'hand', $playerId);
        }

        $this->bga->notify->all('takeTrophyCard', clienttranslate('${player_name} takes the trophy card for being the last active player'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'perfectLanding' => $perfectLanding,
            'newCount' => intval($this->cards->countCardInLocation('decklegend')),
            'newCard' => $this->getCardFromDb($this->cards->getCardOnTop('decklegend')),
        ]);
    }

    function cardPickedFromDeck(int $deckId) {
        // set pile hidden if it was visible
        $visibleTopDecks = $this->getVisibleTopDecks();
        if (in_array($deckId, $visibleTopDecks)) {
            $visibleTopDecks = array_values(array_filter($visibleTopDecks, fn($deck) => $deck != $deckId));
            $this->setGlobalVariable(VISIBLE_TOP_DECKS, $visibleTopDecks);
        }

        // fill if it was empty
        $deckLocation = 'deck'.$deckId;
        if (intval($this->cards->countCardInLocation($deckLocation)) == 0) {
            $otherDeckId = $deckId == 2 ? 1 : 2;
            $otherDeckLocation = 'deck'.$otherDeckId;

            if (intval($this->cards->countCardInLocation($otherDeckLocation)) == 0) {
                $this->cards->moveAllCardsInLocation('discard', $otherDeckLocation);
                $this->cards->shuffle($otherDeckLocation);
            }

            $cardsToMove = $this->getCardsFromDb($this->cards->getCardsInLocation($otherDeckLocation, null, 'location_arg'));
            $cardsIds = array_map(fn($card) => $card->id, $cardsToMove);
            $cardsIds = array_slice($cardsIds, 0, (int) ceil(count($cardsIds) / 2));
            $this->cards->moveCards($cardsIds, $deckLocation);

            $decks = [];
            $visibleTopDecks = $this->getVisibleTopDecks();
            for ($i = 1; $i <= 2; $i++) {
                $topDeckCard = $this->getCardFromDb($this->cards->getCardOnTop('deck'.$i));
                $decks[$i] = [
                    'count' => intval($this->cards->countCardInLocation('deck'.$i)),
                    'top' => in_array($i, $visibleTopDecks) ? $topDeckCard : Card::onlyId($topDeckCard),
                ];
            }
            $this->bga->notify->all('splitDecks', '', [
                'fromDeck' => $otherDeckId,
                'decks' => $decks,
            ]);
        }
    }

    function getCardColor(int $color) {
        return match ($color) {
            GRAY => clienttranslate("Gray"),
            BLUE => clienttranslate("Blue"),
            YELLOW => clienttranslate("Yellow"),
            RED => clienttranslate("Red"),
            GREEN => clienttranslate("Green"),
            default => null,
        };
    }
    
}
