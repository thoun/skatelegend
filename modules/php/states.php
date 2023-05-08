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

        // TODO probably place cards  

        $this->gamestate->nextState('next');
    }    

    function stChooseContinue() {
        $playerId = intval($this->getActivePlayerId());

        // TODO automatically continue if no cards, or no danger ?

        //$this->gamestate->nextState('continue');
    } 

    function stStop() {
        $this->closeSequence(intval($this->getActivePlayerId()), true);

        $this->gamestate->nextState('next');
    }

    function stFall() {
        $playerId = intval($this->getActivePlayerId());

        self::DbQuery("update player set player_helmets = player_helmets + 1, player_helmet_card_id = -1, player_active = 0 WHERE player_id = $playerId");

        $sequence = $this->getCardsByLocation('played'.$playerId);
        $this->cards->moveCards(array_map(fn($card) => $card->id, $sequence), 'discard', $playerId);

        self::notifyAllPlayers('fall', clienttranslate('${player_name} falls! The sequence is discarded, but he gains one helmet'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
        ]);

        $this->gamestate->nextState('next');
    }

    function stNextPlayer() {
        /*if ($this->checkPlayerElimination()) {
            $this->gamestate->jumpToState(ST_END_GAME); // TODO
            return;
        }*/

        $playerId = intval($this->getActivePlayerId());

        $this->giveExtraTime($playerId);

        $remainingActivePlayersToEndRound = count($this->getPlayersIds()) == 2 ? 0 : 1;
        $remainingActivePlayersIds = array_map(fn($dbPlayer) => intval($dbPlayer['player_id']), array_values($this->getCollectionFromDb('select player_id from player WHERE player_active = 1')));

        if (count($remainingActivePlayersIds) == $remainingActivePlayersToEndRound) {
            if (count($remainingActivePlayersIds) == 1) {
                $this->closeSequence($remainingActivePlayersIds[0], false);
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
        $playersIds = $this->getPlayersIds();

        /* TODO $scenarioId = $this->getScenarioId();
        $scenario = $this->getScenario();

        $this->scoreMissions($playersIds, $scenario);
        $this->scoreTerritoryControl($playersIds, $scenario);
        $this->scoreDiscoverTiles($playersIds);
        $this->scoreScenarioEndgameObjectives($scenarioId);
        $this->scoreObjectiveTokens($playersIds);

        // update player_score_aux
        $initiativeMarkerControlledPlayer = $this->getTerritoryControlledPlayer(intval($this->getGameStateValue(INITIATIVE_MARKER_TERRITORY)));
        if ($initiativeMarkerControlledPlayer !== null) {
            $this->DbQuery("UPDATE `player` SET `player_score_aux` = 1 WHERE `player_id` = $initiativeMarkerControlledPlayer"); 
        }

        $this->endStats($playersIds);*/

        $this->gamestate->nextState('endGame');
    }
}
