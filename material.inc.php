<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * SkateLegend implementation : © <Your name here> <Your email address here>
 * 
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * material.inc.php
 *
 * SkateLegend game material description
 *
 * Here, you can describe the material of your game with PHP variables.
 *   
 * This file is loaded in your game logic class constructor, ie these variables
 * are available everywhere in your game logic code.
 *
 */

 require_once(__DIR__.'/modules/php/constants.inc.php');
 require_once(__DIR__.'/modules/php/objects/card.php');

// __construct(int $number, int $color, int $wheels, bool $danger = false, /* int | null*/ $power = null) { 
$this->CARDS_TYPE = [
    1 => [ // base cards
        1 => new CardType(10, BLUE, 1, false, 1),
        2 => new CardType(16, BLUE, 1),
        3 => new CardType(6, BLUE, 1, true),
        4 => new CardType(12, YELLOW, 1),
        5 => new CardType(12, YELLOW, 2, true),
        6 => new CardType(12 /* 10 + 2 ?*/, RED, 1),
        7 => new CardType(22, RED, 1, false, 2),
        8 => new CardType(2, RED, 1, true),
        9 => new CardType(10, GREEN, 1),
        10 => new CardType(12, GREEN, 1, false, 3),
        11 => new CardType(6, GREEN, 1, true),
    ],
    2 => [ // legend cards
        1 => new CardType(1, GRAY, 5),
        2 => new CardType(1, YELLOW, 4 /* TODO*/, true),
        3 => new CardType(1, BLUE, 4 /* TODO*/, false, 1),
        4 => new CardType(1, GRAY, 4 /* TODO*/),
        5 => new CardType(1, GRAY, 4 /* TODO*/),
        6 => new CardType(1, GRAY, 4 /* TODO*/),
        7 => new CardType(1, GRAY, 4 /* TODO*/),
        8 => new CardType(1, GRAY, 4 /* TODO*/),
        9 => new CardType(1, RED, 2, false, 2 /* TODO x2 */),
        10 => new CardType(1, GREEN, 5, false, 3 /* TODO x2 */),
    ],
];
