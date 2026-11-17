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
  * Game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */

declare(strict_types=1);

namespace Bga\Games\Skatelegend;

use Bga\Games\Skatelegend\Models\Card;
use Bga\Games\Skatelegend\States\NewRound;
use Bga\GameFramework\Components\Deck;
use Bga\GameFramework\Table;
use Bga\GameFramework\Actions\CheckAction;
use Bga\GameFramework\Actions\Types\IntParam;

require_once __DIR__ . '/constants.inc.php';

class Game extends Table {
    use UtilTrait;
    use DebugUtilTrait;

    public Deck $cards;
    public array $CARDS_TYPE;
    public array $SENTENCES;

	function __construct() {
        require __DIR__ . '/material.inc.php';

        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        $this->initGameStateLabels([
            PICK_CARDS => 10,
            PLAY_AGAIN => 11,
        ]);
		
        $this->cards = $this->bga->deckFactory->createDeck("card");
        $this->cards->autoreshuffle = false;        
	}	

    /*
        setupNewGame:
        
        This method is called only once, when a new game is launched.
        In this method, you must setup the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame($players, $options = []) {    
        // Set the colors of the players with HTML color code
        // The default below is red/green/blue/orange/brown
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];
 
        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_name, player_round_points) VALUES ";
        $values = [];
        foreach( $players as $player_id => $player ) {
            $color = array_shift( $default_colors );
            $values[] = "('".$player_id."','$color','".addslashes( $player['player_name'] )."', '[null, null, null, null]')";
        }
        $sql .= implode(',', $values);
        self::DbQuery( $sql );
        $this->reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        $this->reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        // Init global values with their initial values
        $this->setGameStateInitialValue(PICK_CARDS, 0);
        $this->setGameStateInitialValue(PLAY_AGAIN, 0);
        
        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.json file)
        // 10+ : rounds/turns        
        $this->bga->tableStats->init('roundNumber', 0);
        /*foreach([
            // 10+ : rounds/turns        
            'roundsAsFirstPlayer', 'checkedMercenaries', 'numberOfZones', 'numberOfLines', 'figuresOver6',
            // 50+ : scoring
            'scoreTerritoryControl', 'scoreDiscoverTiles', 'scoreObjectiveTokens',
        ] as $name) {
            $this->initStat('player', $name, 0);
        }

        foreach(['table', 'player'] as $type) {
            foreach([
                // 10+ : rounds/turns
                'completedObjectives', 'tokensFromMissions', 'playObtained', 'moveObtained',
                // 20+ : territories 
                'controlledTerritories', 'tieControlTerritories', 'controlledTerritories1', 'controlledTerritories3', 'controlledTerritories5', 'controlledTerritories7',
                // 30+ : fighters
                'placedFighters', 'movedFighters', 'activatedFighters', 'placedMercenaries', 'playedActions',
            ] as $name) {
                $this->initStat($type, $name, 0);
            }
        }*/


        $this->setupCards(array_keys($players));

        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        return NewRound::class;
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas(): array {
        $result = [];
    
        $currentPlayerId = $this->getCurrentPlayerId();    // !! We must only return informations visible by this player !!
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score, player_no playerNo, player_helmets helmets, player_active active, player_helmet_card_id helmetCardId, player_round_points allRoundsPoints FROM player ";
        $result['players'] = self::getCollectionFromDb($sql);

        $roundNumber = intval($this->bga->tableStats->get('roundNumber'));
        $isEndScore = $this->gamestate->getCurrentMainStateId() >= ST_END_SCORE;
        
        foreach($result['players'] as $playerId => &$player) {

            $player['playerNo'] = intval($player['playerNo']);
            $player['helmets'] = intval($player['helmets']);
            $player['active'] = boolval($player['active']);
            $player['allRoundsPoints'] = $player['allRoundsPoints'] === null ? null : json_decode($player['allRoundsPoints'], true);
            $player['helmetCardId'] = intval($player['helmetCardId']) == -1 ? null : intval($player['helmetCardId']);
            
            $player['played'] = $this->getCardsByLocation('played'.$playerId);
            $player['handCount'] = intval($this->cards->countCardInLocation('hand', $playerId));
            $player['scoredCount'] = intval($this->cards->countCardInLocation('scored', $playerId));

            if ($currentPlayerId == $playerId) {
                $player['hand'] = $this->getCardsByLocation('hand', $playerId);
                if (!$isEndScore && !$player['active'] && $player['allRoundsPoints'][$roundNumber] !== null) {
                    $player['roundPoints'] = $player['allRoundsPoints'][$roundNumber];
                }
            }

            if (!$isEndScore) {
                unset($player['score']);
                unset($player['allRoundsPoints']);
            }
        }
        
        $decks = [];
        $decks[0] = [
            'count' => intval($this->cards->countCardInLocation('decklegend')),
            'top' => $this->getCardFromDb($this->cards->getCardOnTop('decklegend')),
        ];

        $visibleTopDecks = $this->getVisibleTopDecks();
        for ($i = 1; $i <= 2; $i++) {
            $topDeckCard = $this->getCardFromDb($this->cards->getCardOnTop('deck'.$i));
            $decks[$i] = [
                'count' => intval($this->cards->countCardInLocation('deck'.$i)),
                'top' => in_array($i, $visibleTopDecks) ? $topDeckCard : Card::onlyId($topDeckCard),
            ];
        }

        $result['decks'] = $decks;
        $result['roundNumber'] = $roundNumber + 1;
        $result['remainingHelmets'] = $this->getRemainingHelmets();
        $result['SENTENCES'] = $this->SENTENCES;
  
        return $result;
    }

    /*
        getGameProgression:
        
        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).
    
        This method is called each time we are in a game state with the "updateGameProgression" property set to true 
        (see modules/php/States)
    */
    function getGameProgression() {
        return intval($this->bga->tableStats->get('roundNumber')) * 25;
    }

    #[CheckAction(false)]
    public function actTease(#[IntParam(min: 0)] int $sentence, int $currentPlayerId) {
        $sentence = $this->SENTENCES[$sentence];

        $this->bga->notify->all('tease', clienttranslate('${player_name} says: ${sentence}'), [
            'playerId' => $currentPlayerId,
            'player_name' => $this->getPlayerName($currentPlayerId),
            'sentence' => $sentence,
            'i18n' => ['sentence'],
        ]);
    }

///////////////////////////////////////////////////////////////////////////////////:
////////// DB upgrade
//////////

    /*
        upgradeTableDb:
        
        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.
    
    */
    
    function upgradeTableDb($from_version) {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345
        
        // Example:
//        if( $from_version <= 1404301345 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//        }
//        if( $from_version <= 1405061421 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//        }
//        // Please add your future database scheme changes here
//
//


    }    
}
