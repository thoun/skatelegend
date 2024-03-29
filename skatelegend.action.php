<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * SkateLegend implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 * 
 * skatelegend.action.php
 *
 * SkateLegend main action entry point
 *
 *
 * In this file, you are describing all the methods that can be called from your
 * user interface logic (javascript).
 *       
 * If you define a method "myAction" here, then you can call it from your javascript code with:
 * this.ajaxcall( "/skatelegend/skatelegend/myAction.html", ...)
 *
 */
  
  
  class action_skatelegend extends APP_GameAction { 
    // Constructor: please do not modify
   	public function __default() {
  	    if( self::isArg( 'notifwindow') ) {
            $this->view = "common_notifwindow";
  	        $this->viewArgs['table'] = self::getArg( "table", AT_posint, true );
  	    } else {
            $this->view = "skatelegend_skatelegend";
            self::trace( "Complete reinitialization of board game" );
      }
  	} 

    public function continue() {
      self::setAjaxMode();

      $this->game->continue();

      self::ajaxResponse();
    }

    public function stop() {
      self::setAjaxMode();

      $this->game->stop();

      self::ajaxResponse();
    }
  	
    public function playCardFromHand() {
      self::setAjaxMode();

      $id = self::getArg("id", AT_posint, true);

      $this->game->playCardFromHand($id);

      self::ajaxResponse();
    }
  	
    public function playCardFromDeck() {
      self::setAjaxMode();

      $number = self::getArg("number", AT_posint, true);

      $this->game->playCardFromDeck($number);

      self::ajaxResponse();
    }

    public function playHelmet() {
      self::setAjaxMode();

      $this->game->playHelmet();

      self::ajaxResponse();
    }

    public function skipHelmet() {
      self::setAjaxMode();

      $this->game->skipHelmet();

      self::ajaxResponse();
    }
  	
    public function pickCard() {
      self::setAjaxMode();

      $number = self::getArg("number", AT_posint, true);

      $this->game->pickCard($number);

      self::ajaxResponse();
    }
  	
    public function revealTopDeckCard() {
      self::setAjaxMode();

      $number = self::getArg("number", AT_posint, true);

      $this->game->revealTopDeckCard($number);

      self::ajaxResponse();
    }
  	
    public function tease() {
      self::setAjaxMode();

      $sentence = self::getArg("sentence", AT_posint, true);

      $this->game->tease($sentence);

      self::ajaxResponse();
    }
  }
  