<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Skatelegend\Game;
use Bga\Games\Skatelegend\ActionTrait;

class ChooseContinue extends GameState {
    use ActionTrait;

    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: ST_PLAYER_CHOOSE_CONTINUE,
            type: StateType::ACTIVE_PLAYER,
            name: 'chooseContinue',
            description: clienttranslate('${actplayer} must choose to continue or stop the sequence'),
            descriptionMyTurn: clienttranslate('${you} must choose to continue or stop the sequence'),
            transitions: ['continue' => ST_PLAYER_PLAY_CARD],
        );
    }

    public function getArgs(int $activePlayerId): array {

        $sequence = $this->game->getCardsByLocation('played'.$activePlayerId);
        $canStop = count($sequence) > 0;

        $shouldNotStop = true;
        if (count(array_filter($sequence, fn($card) => $card->danger)) >= 2) {
            $shouldNotStop = false;
        }

        $colorOfHelmet = $this->game->getColorOfHelmet($activePlayerId, $sequence);

        $colors = $this->game->getSequenceCardsByColor($sequence);
        foreach($colors as $color => $colorCards) {
            if ($color != $colorOfHelmet && count($colorCards) >= 2) {
                $shouldNotStop = false;
            }
        }

        return [
           'canStop' => $canStop,
           'shouldNotStop' => $shouldNotStop,
        ];
    }

    #[PossibleAction]
    public function actContinue(int $activePlayerId): void {
        $this->continueSequence($activePlayerId);
    }

    #[PossibleAction]
    public function actStop(): string {
        return Stop::class;
    }

    public function zombie(int $playerId, array $args): ?string {
        $choices = ['continue'];
        if ($args['canStop']) {
            $choices[] = 'stop';
        }

        if ($this->getRandomZombieChoice($choices) === 'stop') {
            return $this->actStop();
        }

        $this->actContinue($playerId);
        return null;
    }
}
