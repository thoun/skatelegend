<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Skatelegend\Game;

class NewRound extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: ST_NEW_ROUND,
            type: StateType::GAME,
            name: 'newRound',
            updateGameProgression: true,
        );
    }

    public function onEnteringState(): string {
        $this->game->DbQuery("update player set player_active = 1 WHERE player_eliminated = 0");

        $roundNumber = intval($this->game->bga->tableStats->get('roundNumber')) + 1;

        $this->game->bga->notify->all('newRound', clienttranslate('Round ${round_number} / 4 starts'), [
            'round_number' => $roundNumber, // for logs
            'roundNumber' => $roundNumber,
        ]);

        // TODO probably place cards ?

        return ChooseContinue::class;
    }
}
