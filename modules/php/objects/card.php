<?php

class CardType {
    public int $number;
    public int $color;
    public int $wheels;
    public bool $danger = false;
    public /* int | null*/ $power;
    public /* array | null*/ $condition;
  
    public function __construct(int $number, int $color, int $wheels, bool $danger = false, /* int | null*/ $power = null, /* array | null*/ $condition = null) {
        $this->number = $number;
        $this->color = $color;
        $this->wheels = $wheels;
        $this->danger = $danger;
        $this->power = $power;
        $this->condition = $condition;
    } 
}

class Card extends CardType {
    public int $id;
    public string $location;
    public int $locationArg;
    public int $type;
    public int $typeArg;

    public function __construct($dbCard, $CARDS_TYPE) {
        $this->id = intval($dbCard['card_id']);
        $this->location = $dbCard['card_location'];
        $this->locationArg = intval($dbCard['card_location_arg']);
        $this->type = intval($dbCard['card_type']);
        $this->typeArg = intval($dbCard['card_type_arg']);
        if ($this->typeArg) {
            $this->color = $CARDS_TYPE[$this->type][$this->typeArg]->color;
            $this->wheels = $CARDS_TYPE[$this->type][$this->typeArg]->wheels;
            $this->power = $CARDS_TYPE[$this->type][$this->typeArg]->power;
            $this->danger = $CARDS_TYPE[$this->type][$this->typeArg]->danger;
            $this->condition = $CARDS_TYPE[$this->type][$this->typeArg]->condition;
        }
    } 

    public static function onlyId(Card $card) {
        return new Card([
            'card_id' => $card->id,
            'card_location' => $card->location,
            'card_location_arg' => $card->locationArg,
            'card_type' => null,
            'card_type_arg' => null,
        ], null);
    }

    public static function onlyIds(array $cards) {
        return array_map(fn($card) => self::onlyId($card), $cards);
    }
}

?>