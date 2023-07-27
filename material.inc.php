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
        1 => new CardType(10, BLUE, 1, false, POWER_FLIP_DECK),
        2 => new CardType(16, BLUE, 1),
        3 => new CardType(6, BLUE, 1, true),
        4 => new CardType(12, YELLOW, 1),
        5 => new CardType(12, YELLOW, 2, true),
        6 => new CardType(12, RED, 1),
        7 => new CardType(22, RED, 1, false, POWER_PICK_CARD),
        8 => new CardType(2, RED, 1, true),
        9 => new CardType(10, GREEN, 1),
        10 => new CardType(12, GREEN, 1, false, POWER_PLAY_AGAIN),
        11 => new CardType(6, GREEN, 1, true),
    ],
    2 => [ // legend cards
        1 => new CardType(1, GRAY, 5),
        2 => new CardType(1, YELLOW, 4, true, null, [2, CONDITION_EQUAL]),
        3 => new CardType(1, BLUE, 4, false, POWER_FLIP_DECK, [2, CONDITION_DANGER]),
        4 => new CardType(1, GRAY, 4, false, null, [1, CONDITION_YELLOW_GREEN]),
        5 => new CardType(1, GRAY, 4, false, null, [4, CONDITION_CARDS]),
        6 => new CardType(1, GRAY, 4, false, null, [5, CONDITION_CARDS]),
        7 => new CardType(1, GRAY, 4, false, null, [3, CONDITION_DIFFERENT]),
        8 => new CardType(1, GRAY, 4, false, null, [2, CONDITION_RED]),
        9 => new CardType(1, RED, 2, false, POWER_PICK_CARD_TWICE),
        10 => new CardType(1, GREEN, 5, false, POWER_PLAY_AGAIN_TWICE),
    ],
];

$this->SENTENCES = [
    clienttranslate("you should stop... 😬"),
    clienttranslate("go and play, you're safe! 😇"),
    clienttranslate("you're going down, for sure 😈"),
    clienttranslate("haha told you! 😂"),
];
