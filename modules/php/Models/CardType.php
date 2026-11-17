<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend\Models;

class CardType {
    // Card's constructor bypasses this constructor, so these defaults must remain on the properties.
    public bool $danger = false;
    public ?int $power = null;
    public ?array $condition = null;
  
    /**
     * @param array{0: int, 1: int}|null $condition Required count and condition code.
     */
    public function __construct(
        public int $number,
        public int $color,
        public int $wheels,
        bool $danger = false,
        ?int $power = null,
        ?array $condition = null,
    ) {
        $this->danger = $danger;
        $this->power = $power;
        $this->condition = $condition;
    } 
}
