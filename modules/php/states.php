<?php

trait StateTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stNewRound() {
        self::DbQuery("update player set player_active = 1 WHERE player_eliminated = 0");

        $roundNumber = intval($this->getStat('roundNumber')) + 1;

        self::notifyAllPlayers('newRound', clienttranslate('Round ${round_number} / 4 starts'), [
            'round_number' => $roundNumber, // for logs
            'roundNumber' => $roundNumber,
        ]);

        // TODO probably place cards ?

        $this->gamestate->nextState('next');
    }

    function stStop() {
        $playerId = intval($this->getActivePlayerId());

        $playersIds = $this->getPlayersIds();
        if (count($playersIds) == 2) {
            $remainingActivePlayersIds = $this->getRemainingActivePlayersIds();
            if (count($remainingActivePlayersIds) <= 1) { 
                // last player in 2 player-mode choses to stop
                $this->takeLegendCard($playerId);
            }
        }

        $this->closeSequence($playerId, true);

        $this->gamestate->nextState('next');
    }

    function stFall() {
        $playerId = intval($this->getActivePlayerId());

        self::DbQuery("update player set player_helmets = player_helmets + 1, player_helmet_card_id = -1, player_active = 0 WHERE player_id = $playerId");

        $sequence = $this->getCardsByLocation('played'.$playerId);
        $this->cards->moveCards(array_map(fn($card) => $card->id, $sequence), 'discard');

        self::notifyAllPlayers('fall', clienttranslate('${player_name} falls! The sequence is discarded, but he gains one helmet'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
        ]);

        $remainingActivePlayersIds = $this->getRemainingActivePlayersIds();
        if (count($remainingActivePlayersIds) == 0) { 
            // last player in 2 player-mode falls

            $card = $this->getCardFromDb($this->cards->getCardOnTop('decklegend'));
            $this->cards->moveCard($card->id, 'discard');

            self::notifyAllPlayers('discardTrophyCard', clienttranslate('The trophy card is discarded as the last active player fell'), [
                'card' => $card,
                'newCount' => intval($this->cards->countCardInLocation('decklegend')),
                'newCard' => $this->getCardFromDb($this->cards->getCardOnTop('decklegend')),
            ]);
        }

        $this->gamestate->nextState('next');
    }

    function stNextPlayer() {
        /*if ($this->checkPlayerElimination()) {
            $this->gamestate->jumpToState(ST_END_GAME); // TODO
            return;
        }*/
        $this->setGameStateValue(PICK_CARDS, 0);
        $this->setGameStateValue(PLAY_AGAIN, 0);

        $playerId = intval($this->getActivePlayerId());

        $this->giveExtraTime($playerId);

        $remainingActivePlayersToEndRound = count($this->getPlayersIds()) == 2 ? 0 : 1;
        $remainingActivePlayersIds = $this->getRemainingActivePlayersIds();

        if (count($remainingActivePlayersIds) == $remainingActivePlayersToEndRound) {
            if (count($remainingActivePlayersIds) == 1) {
                $remainingPlayerId = $remainingActivePlayersIds[0];
                $this->gamestate->changeActivePlayer($remainingPlayerId); // will start next round

                
                $card = $this->getCardFromDb($this->cards->getCardOnTop('decklegend'));
                $perfectLanding = $card->typeArg == 1;
                if ($perfectLanding) { // take the legend card before closing if Perfect landing
                    $this->takeLegendCard($remainingPlayerId);
                }

                $this->closeSequence($remainingPlayerId, false);

                if (!$perfectLanding) { // take the legend card after closing in the other cases
                    $this->takeLegendCard($remainingPlayerId);
                }
            }
            $this->gamestate->nextState('endRound');
        } else {
            do {
                $playerId = intval($this->activeNextPlayer());
                $isActive = $this->getPlayerActive($playerId);
            } while (!$isActive);

            $this->gamestate->nextState('nextPlayer');
        }
    }

    function stEndRound() {
        $this->incStat(1, 'roundNumber');

        $lastRound = intval($this->getStat('roundNumber')) >= 4;

        $this->gamestate->nextState($lastRound ? 'endScore' : 'newRound');
    }

    function stEndScore() {
        $dbResults = $this->getCollectionFromDb("SELECT player_id, player_round_points FROM `player` ORDER BY player_no", true);
        $roundScores = array_map(fn($dbResult) => json_decode($dbResult, true), $dbResults);        
        $helmetScores = [];

        $playersIds = $this->getPlayersIds();
        foreach ($playersIds as $playerId) {
            $helmets = $this->getPlayerHelmets($playerId);
            $helmetScore = $helmets * 2;
            $helmetScores[$playerId] = $helmetScore;

            if ($helmets > 0) {
                self::DbQuery("update player set player_score = player_score + $helmetScore WHERE player_id = $playerId");

                self::notifyAllPlayers('helmetScore', clienttranslate('${player_name} scores ${helmet_points} points with ${helmets} remaining helmet(s)'), [
                    'player_name' => $this->getPlayerName($playerId),
                    'helmets' => $helmets, // for logs
                    'helmet_points' => $helmetScore, // for logs
                ]);
            }
        }

        $this->notifyAllPlayers('detailledScore', '', [
            'roundScores' => $roundScores,
            'helmetScores' => $helmetScores,
        ]);

        $this->gamestate->nextState('endGame');
    }
}
