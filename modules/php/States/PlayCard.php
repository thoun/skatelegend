<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Skatelegend\Game;
use Bga\Games\Skatelegend\ActionTrait;

class PlayCard extends GameState {
    use ActionTrait;

    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: ST_PLAYER_PLAY_CARD,
            type: StateType::ACTIVE_PLAYER,
            name: 'playCard',
            description: clienttranslate('${actplayer} must play a card'),
            descriptionMyTurn: clienttranslate('${you} must play a card'),
        );
    }

    public function getArgs(int $activePlayerId): array {
        return $this->getPlayCardArgs($activePlayerId);
    }

    public function zombie(int $playerId, array $args): string {
        $choices = [];
        foreach ($args['playableCards'] as $card) {
            $choices[] = ['source' => 'hand', 'id' => $card->id];
        }
        foreach ([1, 2] as $deckId) {
            if ($this->game->cards->countCardInLocation('deck'.$deckId) > 0) {
                $choices[] = ['source' => 'deck', 'id' => $deckId];
            }
        }

        if ($choices === []) {
            $this->game->DbQuery("update player set player_active = 0 WHERE player_id = $playerId");
            return NextPlayer::class;
        }

        $choice = $this->getRandomZombieChoice($choices);
        if ($choice['source'] === 'hand') {
            return $this->actPlayCardFromHand($choice['id'], $playerId);
        }
        return $this->actPlayCardFromDeck($choice['id'], $playerId);
    }
}
