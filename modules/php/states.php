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

        /* TODO
        STOP his sequence: On his turn, a player can decide to stop his chain and thus validate it. In this
case, he does not add a card to his chain. If the player has one or more Legendary Figure cards in
his chain, he checks if they meet their condition (if not, they are discarded). He collects the cards
that make up his chain of events into a pile and places it next to him, discarding any HELMET
tokens played.
These cards will give him points at the end of the game.
*/ 

        $this->gamestate->nextState('next');
    }

    function stFall() {
        $playerId = intval($this->getActivePlayerId());

        /* TODO When a player falls, he takes a HELMET as compensation. In the next round, on his turn, he can
            decide to place it on the card he has just played (only one HELMET per sequence). In this case,
            the color of the card in question can no longer cause this player to fall.
            */

        $this->gamestate->nextState('next');
    }

    function stNextPlayer() {
        /*if ($this->checkPlayerElimination()) {
            $this->gamestate->jumpToState(ST_END_GAME); // TODO
            return;
        }*/

        $playerId = intval($this->getActivePlayerId());

        $this->giveExtraTime($playerId);

        $isLastRemainingPlayer = false; // TODO

        if ($isLastRemainingPlayer) {
            /* TODO
            If this player has one or more Legendary Figure cards in his chain, he checks if they
            meet their condition (if not they are discarded).
            He collects the cards that make up his chain into a pile and places it next to him (these cards will
            earn him points at the end of the game) and discards the eventual Helmet played. Then he adds the
            visible card from the prize deck to his hand (revealing the Legendary Figure/Trophy card for the
            next round).
            A Legendary Figure card can be played by the player in possession of it exactly like a Figure card in
            the next round, however, the points they earn are subject to conditions (see paragraph Legendary
            Figure).*/
            $this->gamestate->nextState('endRound');
        } else {
            $this->activeNextPlayer();
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
