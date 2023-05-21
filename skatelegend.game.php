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
  * skatelegend.game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */


require_once( APP_GAMEMODULE_PATH.'module/table/table.game.php' );

require_once('modules/php/constants.inc.php');
require_once('modules/php/utils.php');
require_once('modules/php/actions.php');
require_once('modules/php/states.php');
require_once('modules/php/args.php');
require_once('modules/php/debug-util.php');

class SkateLegend extends Table {
    use UtilTrait;
    use ActionTrait;
    use StateTrait;
    use ArgsTrait;
    use DebugUtilTrait;

	function __construct() {
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        self::initGameStateLabels([
            PICK_CARDS => 10,
            PLAY_AGAIN => 11,
        ]);
		
        $this->cards = $this->getNew("module.common.deck");
        $this->cards->init("card");
        $this->cards->autoreshuffle = false;        
	}
	
    protected function getGameName() {
		// Used for translations and stuff. Please do not modify.
        return "skatelegend";
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
        $gameinfos = self::getGameinfos();
        $default_colors = $gameinfos['player_colors'];
 
        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar, player_round_points) VALUES ";
        $values = [];
        foreach( $players as $player_id => $player ) {
            $color = array_shift( $default_colors );
            $values[] = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."', '[null, null, null, null]')";
        }
        $sql .= implode(',', $values);
        self::DbQuery( $sql );
        self::reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        self::reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        // Init global values with their initial values
        $this->setGameStateInitialValue(PICK_CARDS, 0);
        $this->setGameStateInitialValue(PLAY_AGAIN, 0);
        
        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        // 10+ : rounds/turns        
        $this->initStat('table', 'roundNumber', 0);
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

        // TODO TEMP
        $this->debugSetup();

        /************ End of the game initialization *****/
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas() {
        $result = [];
    
        $currentPlayerId = self::getCurrentPlayerId();    // !! We must only return informations visible by this player !!
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score, player_no playerNo, player_helmets helmets, player_active active, player_helmet_card_id helmetCardId, player_round_points allRoundsPoints FROM player ";
        $result['players'] = self::getCollectionFromDb($sql);

        $roundNumber = intval($this->getStat('roundNumber'));
        $isEndScore = intval($this->gamestate->state_id()) >= ST_END_SCORE;
        
        foreach($result['players'] as $playerId => &$player) {

            $player['playerNo'] = intval($player['playerNo']);
            $player['helmets'] = intval($player['helmets']);
            $player['active'] = boolval($player['active']);
            $player['allRoundsPoints'] = json_decode($player['allRoundsPoints'], true);
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
  
        return $result;
    }

    /*
        getGameProgression:
        
        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).
    
        This method is called each time we are in a game state with the "updateGameProgression" property set to true 
        (see states.inc.php)
    */
    function getGameProgression() {
        return intval($this->getStat('roundNumber')) * 25;
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Zombie
////////////

    /*
        zombieTurn:
        
        This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
        You can do whatever you want in order to make sure the turn of this player ends appropriately
        (ex: pass).
        
        Important: your zombie code will be called when the player leaves the game. This action is triggered
        from the main site and propagated to the gameserver from a server, not from a browser.
        As a consequence, there is no current player associated to this action. In your zombieTurn function,
        you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged" error message. 
    */

    function zombieTurn( $state, $active_player ) {
    	$statename = $state['name'];
    	
        if ($state['type'] === "activeplayer") {
            switch ($statename) {
                default:
                    self::DbQuery("update player set player_active = 0 WHERE player_id = $active_player");
                    $this->gamestate->nextState( "zombiePass" );
                	break;
            }

            return;
        }

        if ($state['type'] === "multipleactiveplayer") {
            // Make sure player is in a non blocking status for role turn
            $this->gamestate->setPlayerNonMultiactive( $active_player, '' );
            
            return;
        }

        throw new feException( "Zombie mode not supported at this game state: ".$statename );
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
//            self::applyDbUpgradeToAllDB( $sql );
//        }
//        if( $from_version <= 1405061421 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            self::applyDbUpgradeToAllDB( $sql );
//        }
//        // Please add your future database scheme changes here
//
//


    }    
}
