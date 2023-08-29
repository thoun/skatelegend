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
 * states.inc.php
 *
 * SkateLegend game states description
 *
 */

/*
   Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
   in a very easy way from this configuration file.

   Please check the BGA Studio presentation about game state to understand this, and associated documentation.

   Summary:

   States types:
   _ activeplayer: in this type of state, we expect some action from the active player.
   _ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
   _ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide what is the next game state.
   _ manager: special type for initial and final state

   Arguments of game states:
   _ name: the name of the GameState, in order you can recognize it on your own code.
   _ description: the description of the current game state is always displayed in the action status bar on
                  the top of the game. Most of the time this is useless for game state with "game" type.
   _ descriptionmyturn: the description of the current game state when it's your turn.
   _ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
   _ action: name of the method to call when this game state become the current game state. Usually, the
             action method is prefixed by "st" (ex: "stMyGameStateName").
   _ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
                      method on both client side (Javacript: this.checkAction) and server side (PHP: self::checkAction).
   _ transitions: the transitions are the possible paths to go from a game state to another. You must name
                  transitions in order to use transition names in "nextState" PHP method, and use IDs to
                  specify the next game state for each transition.
   _ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
           client side to be used on "onEnteringState" or to set arguments in the gamestate description.
   _ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
                            method).
*/
require_once("modules/php/constants.inc.php");

$playCardTransitions = [    
    "helmet" => ST_PLAYER_PLAY_HELMET,
    "pickCard" => ST_PLAYER_PICK_CARD,
    "revealCard" => ST_PLAYER_REVEAL_DECK_CARD,
    "next" => ST_NEXT_PLAYER,
    "fall" => ST_FALL,
    "playAgain" => ST_PLAYER_PLAY_CARD,
];

$basicGameStates = [

    // The initial state. Please do not modify.
    ST_BGA_GAME_SETUP => [
        "name" => "gameSetup",
        "description" => clienttranslate("Game setup"),
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => [ "" => ST_NEW_ROUND ]
    ],
   
    // Final state.
    // Please do not modify.
    ST_END_GAME => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd",
    ],
];

$playerActionsGameStates = [

    ST_PLAYER_CHOOSE_CONTINUE => [
        "name" => "chooseContinue",
        "description" => clienttranslate('${actplayer} must choose to continue or stop the sequence'),
        "descriptionmyturn" => clienttranslate('${you} must choose to continue or stop the sequence'),
        "type" => "activeplayer",
        "args" => "argChooseContinue",
        "possibleactions" => [ 
            "continue",
            "stop",
            "playCardFromHand",
            "playCardFromDeck",
        ],
        "transitions" => [
            "continue" => ST_PLAYER_PLAY_CARD,
            "stop" => ST_STOP,
        ]
    ],

    ST_PLAYER_PLAY_CARD => [
        "name" => "playCard",
        "description" => clienttranslate('${actplayer} must play a card'),
        "descriptionmyturn" => clienttranslate('${you} must play a card'),
        "type" => "activeplayer",    
        "args" => "argPlayCard",
        "possibleactions" => [ 
            "playCardFromHand",
            "playCardFromDeck",
        ],
        "transitions" => $playCardTransitions,
    ],

    ST_PLAYER_PLAY_HELMET => [
        "name" => "playHelmet",
        "description" => clienttranslate('${actplayer} can play a helmet'),
        "descriptionmyturn" => clienttranslate('${you} can play a helmet'),
        "type" => "activeplayer",
        "possibleactions" => [ 
            "playHelmet",
            "skipHelmet",
        ],
        "transitions" => $playCardTransitions,
    ],

    ST_PLAYER_PICK_CARD => [
        "name" => "pickCard",
        "description" => clienttranslate('${actplayer} must pick a card from a deck'),
        "descriptionmyturn" => clienttranslate('${you} must pick a card from a deck'),
        "type" => "activeplayer",
        "possibleactions" => [ 
            "pickCard",
        ],
        "transitions" => $playCardTransitions,
    ],

    ST_PLAYER_REVEAL_DECK_CARD => [
        "name" => "revealDeckCard",
        "description" => clienttranslate('${actplayer} must choose a deck to reveal its top card'),
        "descriptionmyturn" => clienttranslate('${you} must choose a deck to reveal its top card'),
        "type" => "activeplayer",
        "possibleactions" => [ 
            "revealTopDeckCard",
        ],
        "transitions" => $playCardTransitions,
    ],
];

$gameGameStates = [

    ST_NEW_ROUND => [
        "name" => "newRound",
        "description" => "",
        "type" => "game",
        "action" => "stNewRound",
        "updateGameProgression" => true,
        "transitions" => [
            "next" => ST_PLAYER_CHOOSE_CONTINUE,
        ],
    ],

    ST_STOP => [
        "name" => "stop",
        "description" => "",
        "type" => "game",
        "action" => "stStop",
        "transitions" => [
            "next" => ST_NEXT_PLAYER,
        ],
    ],

    ST_FALL => [
        "name" => "fall",
        "description" => "",
        "type" => "game",
        "action" => "stFall",
        "transitions" => [
            "next" => ST_NEXT_PLAYER,
        ],
    ],

    ST_NEXT_PLAYER => [
        "name" => "nextPlayer",
        "description" => "",
        "type" => "game",
        "action" => "stNextPlayer",
        "transitions" => [
            "nextPlayer" => ST_PLAYER_CHOOSE_CONTINUE,
            "endRound" => ST_END_ROUND,
        ],
    ],

    ST_END_ROUND => [
        "name" => "endRound",
        "description" => "",
        "type" => "game",
        "action" => "stEndRound",
        "updateGameProgression" => true,
        "transitions" => [
            "newRound" => ST_NEW_ROUND,
            "endScore" => ST_END_SCORE,
        ],
    ],

    ST_END_SCORE => [
        "name" => "endScore",
        "description" => "",
        "type" => "game",
        "action" => "stEndScore",
        "transitions" => [
            "endGame" => ST_END_GAME,
        ],
    ],
];
 
$machinestates = $basicGameStates + $playerActionsGameStates + $gameGameStates;



