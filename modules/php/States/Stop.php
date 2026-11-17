<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Skatelegend\Game;

class Stop extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: ST_STOP,
            type: StateType::GAME,
            name: 'stop',
        );
    }

    public function onEnteringState(): string {
        $playerId = intval($this->game->getActivePlayerId());

        $playersIds = $this->game->getPlayersIds();
        if (count($playersIds) == 2) {
            $remainingActivePlayersIds = $this->game->getRemainingActivePlayersIds();
            if (count($remainingActivePlayersIds) <= 1) { 
                // last player in 2 player-mode choses to stop
                $this->game->takeLegendCard($playerId);
            }
        }

        $this->game->closeSequence($playerId, true);

        return NextPlayer::class;
    }
}
