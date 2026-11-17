<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Skatelegend\Game;
use Bga\GameFramework\Actions\Types\IntParam;

class RevealDeckCard extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: ST_PLAYER_REVEAL_DECK_CARD,
            type: StateType::ACTIVE_PLAYER,
            name: 'revealDeckCard',
            description: clienttranslate('${actplayer} must choose a deck to reveal its top card'),
            descriptionMyTurn: clienttranslate('${you} must choose a deck to reveal its top card'),
        );
    }

    #[PossibleAction]
    public function actRevealTopDeckCard(#[IntParam(name: 'number', min: 0)] int $deckId): string {
        $this->game->makeTopDeckVisible($deckId, true);

        return $this->game->afterPlayPower();
    }

    public function zombie(int $playerId): string {
        $visibleTopDecks = $this->game->getVisibleTopDecks();
        $choices = array_values(array_filter([1, 2], fn(int $deckId) =>
            !in_array($deckId, $visibleTopDecks) && $this->game->cards->countCardInLocation('deck'.$deckId) > 0
        ));
        if ($choices === []) {
            $this->game->DbQuery("update player set player_active = 0 WHERE player_id = $playerId");
            return NextPlayer::class;
        }

        $deckId = $this->getRandomZombieChoice($choices);
        return $this->actRevealTopDeckCard($deckId);
    }
}
