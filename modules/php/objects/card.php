<?php

class CardType {
    public int $type; // 1 for basic fighter, 2 for mercenaries, 3 for glow actions, 4 for secret missions
    public int $number;
    public int $strength;
    public /* int | null*/ $power;
  
    public function __construct(int $type, int $number, int $strength, /* int | null*/ $power = null) {
        $this->type = $type;
        $this->number = $number;
        $this->strength = $strength;
        $this->power = $power;
    } 
}

class Card extends CardType {
    public int $id;
    public string $location;
    public int $locationArg;
    public int $subType;
    public int $playerId;
    public bool $played;

    public function __construct($dbCard, $CARDS_TYPE) {
        $this->id = intval($dbCard['card_id']);
        $this->location = $dbCard['card_location'];
        $this->locationArg = intval($dbCard['card_location_arg']);
        $this->type = intval($dbCard['card_type']);
        $this->subType = intval($dbCard['card_type_arg']);
        $this->playerId = intval($dbCard['player_id']);
        $this->played = boolval($dbCard['played']);
        if ($this->subType) {
            $this->strength = $CARDS_TYPE[$this->subType]->strength;
            $this->power = $CARDS_TYPE[$this->subType]->power;
        }
    } 

    public static function onlyId(Card $card) {
        return new Card([
            'card_id' => $card->id,
            'card_location' => $card->location,
            'card_location_arg' => $card->locationArg,
            'card_type' => null,
            'card_type_arg' => null,
            'player_id' => null,
            'played' => null,
        ], null);
    }

    public static function onlyIds(array $cards) {
        return array_map(fn($card) => self::onlyId($card), $cards);
    }

    public function getStrength() {
        if ($this->played) {
            if ($this->power === POWER_WEAVER || $this->power === POWER_ROOTSPRING) {
                return 1;
            } else if ($this->power === POWER_METAMORPH) {
                return 3;
            } else {
                return $this->strength;
            }
        } else {
            return $this->strength;
        }
    }
}

?>