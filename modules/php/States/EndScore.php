<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Skatelegend\Game;

class EndScore extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: ST_END_SCORE,
            type: StateType::GAME,
            name: 'endScore',
        );
    }

    public function onEnteringState(): int {
        $dbResults = $this->game->getCollectionFromDb("SELECT player_id, player_round_points FROM `player` ORDER BY player_no", true);
        $roundScores = array_map(fn($dbResult) => $dbResult === null ? null : json_decode($dbResult, true), $dbResults);
        $helmetScores = [];

        $playersIds = $this->game->getPlayersIds();
        foreach ($playersIds as $playerId) {
            $helmets = $this->game->getPlayerHelmets($playerId);
            $helmetScore = $helmets * 2;
            $helmetScores[$playerId] = $helmetScore;

            if ($helmets > 0) {
                $this->game->bga->playerScore->inc($playerId, $helmetScore, null);

                $this->game->bga->notify->all('helmetScore', clienttranslate('${player_name} scores ${helmet_points} points with ${helmets} remaining helmet(s)'), [
                    'player_name' => $this->game->getPlayerName($playerId),
                    'helmets' => $helmets, // for logs
                    'helmet_points' => $helmetScore, // for logs
                ]);
            }
        }

        $this->game->bga->notify->all('detailledScore', '', [
            'roundScores' => $roundScores,
            'helmetScores' => $helmetScores,
        ]);

        return ST_END_GAME;
    }
}
