<?php

trait ArgsTrait {
    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */
   
    function argChooseContinue() {
        $playerId = intval($this->getActivePlayerId());

        $sequence = $this->getCardsByLocation('played'.$playerId);
        $canStop = count($sequence) > 0;

        $shouldNotStop = true;
        if (count(array_filter($sequence, fn($card) => $card->danger)) >= 2) { 
            $shouldNotStop = false;
        }

        $colorOfHelmet = $this->getColorOfHelmet($playerId, $sequence);

        $colors = $this->getSequenceCardsByColor($sequence);
        foreach($colors as $color => $colorCards) {
            if ($color != $colorOfHelmet && count($colorCards) >= 2) {
                $shouldNotStop = false;
            }
        }
    
        return [
           'canStop' => $canStop,
           'shouldNotStop' => $shouldNotStop,
        ];
    }
   
    function argPlayCard() {
        $playerId = intval($this->getActivePlayerId());

        $hand = $this->getCardsByLocation('hand', $playerId);

        $playableCards = $hand; // TODO
    
        return [
            'playableCards' => $playableCards,
        ];
    }
} 
