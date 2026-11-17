<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Skatelegend\Game;
use Bga\Games\Skatelegend\Models\Card;

class PlayHelmet extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: ST_PLAYER_PLAY_HELMET,
            type: StateType::ACTIVE_PLAYER,
            name: 'playHelmet',
            description: clienttranslate('${actplayer} can play a helmet'),
            descriptionMyTurn: clienttranslate('${you} can play a helmet'),
        );
    }

    #[PossibleAction]
    public function actPlayHelmet(int $activePlayerId): string {
        $card = $this->game->getCardFromDb($this->game->cards->getCardOnTop('played'.$activePlayerId));
        $this->addHelmet($activePlayerId, $card);
        return $this->game->afterPlayHelmet($activePlayerId, $card);
    }

    #[PossibleAction]
    public function actSkipHelmet(int $activePlayerId): string {
        $card = $this->game->getCardFromDb($this->game->cards->getCardOnTop('played'.$activePlayerId));
        return $this->game->afterPlayHelmet($activePlayerId, $card);
    }

    private function addHelmet(int $playerId, Card $card): void {
        $this->game->DbQuery("update player set player_helmet_card_id = $card->id, player_helmets = player_helmets - 1 WHERE player_id = $playerId");

        $this->game->bga->notify->all('addHelmet', clienttranslate('${player_name} adds a helmet on the last played card'), [
            'playerId' => $playerId,
            'player_name' => $this->game->getPlayerName($playerId),
            'card' => $card,
        ]);
    }

    public function zombie(int $playerId): string {
        $choices = ['actSkipHelmet'];
        if ($this->game->getPlayerHelmets($playerId) > 0) {
            $choices[] = 'actPlayHelmet';
        }

        $action = $this->getRandomZombieChoice($choices);
        return $this->{$action}($playerId);
    }
}
