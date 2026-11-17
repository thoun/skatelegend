<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend\Models;

class Card extends CardType {
    public int $id;
    public string $location;
    public int $locationArg;
    public ?int $type;
    public ?int $typeArg;

    public function __construct($dbCard, $CARDS_TYPE) {
        $this->id = intval($dbCard['card_id'] ?? $dbCard['id']);
        $this->location = $dbCard['card_location'] ?? $dbCard['location'];
        $this->locationArg = intval($dbCard['card_location_arg'] ?? $dbCard['location_arg']);
        $this->type = array_key_exists('card_type', $dbCard) || array_key_exists('type', $dbCard) ? intval($dbCard['card_type'] ?? $dbCard['type']) : null;
        $this->typeArg = array_key_exists('card_type_arg', $dbCard) || array_key_exists('type_arg', $dbCard) ? intval($dbCard['card_type_arg'] ?? $dbCard['type_arg']) : null;
        if ($this->typeArg) {
            $this->color = $CARDS_TYPE[$this->type][$this->typeArg]->color;
            $this->wheels = $CARDS_TYPE[$this->type][$this->typeArg]->wheels;
            $this->power = $CARDS_TYPE[$this->type][$this->typeArg]->power;
            $this->danger = $CARDS_TYPE[$this->type][$this->typeArg]->danger;
            $this->condition = $CARDS_TYPE[$this->type][$this->typeArg]->condition;
        }
    } 

    public static function onlyId(?Card $card) {
        if ($card == null) {
            return null;
        }

        return new Card([
            'card_id' => $card->id,
            'card_location' => $card->location,
            'card_location_arg' => $card->locationArg,
            'card_type' => $card->type,
        ], null);
    }

    public static function onlyIds(array $cards) {
        return array_map(fn($card) => self::onlyId($card), $cards);
    }
}
