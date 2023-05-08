<?php

/*
 * Powers
 */
define('POWER_FLIP_DECK', 10);
define('POWER_PLAY_AGAIN', 21);
define('POWER_PLAY_AGAIN_TWICE', 22);
define('POWER_PICK_CARD', 31);
define('POWER_PICK_CARD_TWICE', 32);

/*
 * Conditions
 */
define('CONDITION_EQUAL', 1);
define('CONDITION_DANGER', 2);
define('CONDITION_YELLOW_GREEN', 3);
define('CONDITION_CARDS', 4);
define('CONDITION_DIFFERENT', 5);
define('CONDITION_RED', 6);

/*
 * Colors
 */
define('GRAY', 0);
define('BLUE', 1);
define('YELLOW', 2);
define('RED', 3);
define('GREEN', 4);

/*
 * State constants
 */
define('ST_BGA_GAME_SETUP', 1);

define('ST_NEW_ROUND', 20);

define('ST_PLAYER_CHOOSE_CONTINUE', 30);

define('ST_PLAYER_PLAY_CARD', 40);

define('ST_PLAYER_PLAY_HELMET', 50);

define('ST_FALL', 60);

define('ST_STOP', 70);

define('ST_NEXT_PLAYER', 80);

define('ST_END_ROUND', 85);
define('ST_END_SCORE', 90);

define('ST_END_GAME', 99);
define('END_SCORE', 100);

/*
 * Constants
 */

/*
 * Global Variables
 */
define('VISIBLE_TOP_DECKS', 'VisibleTopDecks');

?>
