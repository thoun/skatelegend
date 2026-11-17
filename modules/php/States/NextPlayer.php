<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Skatelegend\Game;

class NextPlayer extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: ST_NEXT_PLAYER,
            type: StateType::GAME,
            name: 'nextPlayer',
        );
    }

    public function onEnteringState(): string {
        /*if ($this->game->checkPlayerElimination()) {
            $this->game->gamestate->jumpToState(ST_END_GAME); // TODO
            return;
        }*/
        $this->game->setGameStateValue(PICK_CARDS, 0);
        $this->game->setGameStateValue(PLAY_AGAIN, 0);

        $playerId = intval($this->game->getActivePlayerId());

        $this->game->giveExtraTime($playerId);

        $remainingActivePlayersToEndRound = count($this->game->getPlayersIds()) == 2 ? 0 : 1;
        $remainingActivePlayersIds = $this->game->getRemainingActivePlayersIds();

        if (count($remainingActivePlayersIds) == $remainingActivePlayersToEndRound) {
            if (count($remainingActivePlayersIds) == 1) {
                $remainingPlayerId = $remainingActivePlayersIds[0];
                $this->game->gamestate->changeActivePlayer($remainingPlayerId); // will start next round


                $card = $this->game->getCardFromDb($this->game->cards->getCardOnTop('decklegend'));
                $perfectLanding = $card->typeArg == 1;
                if ($perfectLanding) { // take the legend card before closing if Perfect landing
                    $this->game->takeLegendCard($remainingPlayerId);
                }

                $this->game->closeSequence($remainingPlayerId, false);

                if (!$perfectLanding) { // take the legend card after closing in the other cases
                    $this->game->takeLegendCard($remainingPlayerId);
                }
            }
            return EndRound::class;
        } else {
            do {
                $playerId = intval($this->game->activeNextPlayer());
                $isActive = $this->getPlayerActive($playerId);
            } while (!$isActive);

            return ChooseContinue::class;
        }
    }

    private function getPlayerActive(int $playerId): bool {
        return boolval($this->game->getUniqueValueFromDB("SELECT player_active FROM player where `player_id` = $playerId"));
    }
}
