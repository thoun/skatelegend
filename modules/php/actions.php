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
        
        $playerId = intval($this->getActivePlayerId());

        self::notifyAllPlayers('log', clienttranslate('${player_name} chooses to continue their sequence'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
        ]);

        $this->gamestate->nextState('continue');
    }

    public function stop() {
        $this->checkAction('stop');
        
        $this->gamestate->nextState('stop');
    }
  	
    public function playCardFromHand(int $id) {
        $this->checkAction('playCardFromHand'); 

        if (intval($this->gamestate->state_id()) == ST_PLAYER_CHOOSE_CONTINUE) {
            $this->continue();
        }
        
        $playerId = intval($this->getActivePlayerId());
        
        $args = $this->argPlayCard();
        $card = $this->array_find($args['playableCards'], fn($c) => $c->id == $id);

        if ($card == null || $card->location != 'hand' || $card->locationArg != $playerId) {
            throw new BgaUserException("You can't play this card");
        }

        $this->playCard($playerId, $card, -1);
    }
    
    public function playCardFromDeck(int $deckId) {
        $this->checkAction('playCardFromDeck');  

        if (intval($this->gamestate->state_id()) == ST_PLAYER_CHOOSE_CONTINUE) {
            $this->continue();
        }
        
        $playerId = intval($this->getActivePlayerId());

        $visibleTopDecks = $this->getVisibleTopDecks();
        if (!in_array($deckId, $visibleTopDecks)) {
            $this->makeTopDeckVisible($deckId, false);
        }

        $card = $this->getCardFromDb($this->cards->getCardOnTop('deck'.$deckId));
        $this->playCard($playerId, $card, $deckId);
    }

    public function playHelmet() {
        $this->checkAction('playHelmet'); 
        
        $playerId = intval($this->getActivePlayerId());
        $card = $this->getCardFromDb($this->cards->getCardOnTop('played'.$playerId));
        $this->addHelmet($playerId, $card);
        $this->afterPlayHelmet($playerId, $card);
    }

    public function skipHelmet() {
        $this->checkAction('skipHelmet'); 
        
        $playerId = intval($this->getActivePlayerId());
        $card = $this->getCardFromDb($this->cards->getCardOnTop('played'.$playerId));
        $this->afterPlayHelmet($playerId, $card);
    }
  	
    public function pickCard(int $deckId) {
        $this->checkAction('pickCard'); 
        
        $playerId = intval($this->getActivePlayerId());

        $card = $this->getCardFromDb($this->cards->getCardOnTop('deck'.$deckId));
        $this->cards->moveCard($card->id, 'hand', $playerId);

        self::notifyPlayer($playerId, 'addCardToHand', clienttranslate('${player_name} takes the top card from deck ${deck_number}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'fromDeckNumber' => $deckId,
            'deck_number' => $deckId,
            'deckCount' => intval($this->cards->countCardInLocation('deck'.$deckId)),
            'deckTopCard' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'.$deckId))),
        ]);

        self::notifyAllPlayers('addCardToHand', clienttranslate('${player_name} takes the top card from deck ${deck_number}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => Card::onlyId($card),
            'fromDeckNumber' => $deckId,
            'deck_number' => $deckId,
            'deckCount' => intval($this->cards->countCardInLocation('deck'.$deckId)),
            'deckTopCard' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'.$deckId))),
        ]);

        $this->cardPickedFromDeck($deckId);

        $this->afterPlayPower();
    }
  	
    public function revealTopDeckCard(int $deckId) {
        $this->checkAction('revealTopDeckCard'); 

        $this->makeTopDeckVisible($deckId, true);

        $this->afterPlayPower();
    }
  	
    public function tease(int $sentence) {        
        $playerId = intval($this->getCurrentPlayerId());

        $sentence = $this->SENTENCES[$sentence];

        self::notifyAllPlayers('tease', clienttranslate('${player_name} says: ${sentence}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'sentence' => $sentence,
            'i18n' => ['sentence'],
        ]);
    }
}
