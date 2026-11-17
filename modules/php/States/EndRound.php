<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Skatelegend\Game;

class EndRound extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: ST_END_ROUND,
            type: StateType::GAME,
            name: 'endRound',
            updateGameProgression: true,
        );
    }

    public function onEnteringState(): string {
        $this->game->bga->tableStats->inc('roundNumber', 1);

        $lastRound = intval($this->game->bga->tableStats->get('roundNumber')) >= 4;

        return $lastRound ? EndScore::class : NewRound::class;
    }
}
