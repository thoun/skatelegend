<?php

trait ActionTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    
    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in nicodemus.action.php)
    */

    public function continue() {
        $this->checkAction('continue'); 

        $this->gamestate->nextState('continue');
    }

    public function stop() {
        $this->checkAction('stop'); 
        
        $this->gamestate->nextState('stop');
    }
  	
    public function playCardFromHand(int $id) {
        $this->checkAction('playCardFromHand'); 
        
        $playerId = intval($this->getActivePlayerId());
        
        $args = $this->argPlayCard();
        $card = $this->array_find($args['playableCards'], fn($c) => $c->id == $id);

        if ($card == null || $card->location != 'hand' || $card->locationArg != $playerId) {
            throw new BgaUserException("You can't play this card");
        }

        $this->playCard($playerId, $card, false);
    }
    
    public function playCardFromDeck(int $deckId) {
        $this->checkAction('playCardFromDeck'); 
        
        $playerId = intval($this->getActivePlayerId());

        $visibleTopDecks = $this->getVisibleTopDecks();
        if (!in_array($deckId, $visibleTopDecks)) {
            $this->makeTopDeckVisible($deckId, true);
        }

        $card = $this->getCardFromDb($this->cards->getCardOnTop('deck'.$deckId));
        $this->playCard($playerId, $card, false);
    }
}
