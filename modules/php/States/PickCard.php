<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Skatelegend\Game;
use Bga\GameFramework\Actions\Types\IntParam;
use Bga\Games\Skatelegend\Models\Card;

class PickCard extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: ST_PLAYER_PICK_CARD,
            type: StateType::ACTIVE_PLAYER,
            name: 'pickCard',
            description: clienttranslate('${actplayer} must pick a card from a deck'),
            descriptionMyTurn: clienttranslate('${you} must pick a card from a deck'),
        );
    }

    #[PossibleAction]
    public function actPickCard(#[IntParam(name: 'number', min: 0)] int $deckId, int $activePlayerId): string {
        $card = $this->game->getCardFromDb($this->game->cards->getCardOnTop('deck'.$deckId));
        $this->game->cards->moveCard($card->id, 'hand', $activePlayerId);

        $this->game->bga->notify->player($activePlayerId, 'addCardToHand', clienttranslate('${player_name} takes the top card from deck ${deck_number}'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerName($activePlayerId),
            'card' => $card,
            'fromDeckNumber' => $deckId,
            'deck_number' => $deckId,
            'deckCount' => intval($this->game->cards->countCardInLocation('deck'.$deckId)),
            'deckTopCard' => Card::onlyId($this->game->getCardFromDb($this->game->cards->getCardOnTop('deck'.$deckId))),
        ]);

        $this->game->bga->notify->all('addCardToHand', clienttranslate('${player_name} takes the top card from deck ${deck_number}'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerName($activePlayerId),
            'card' => Card::onlyId($card),
            'fromDeckNumber' => $deckId,
            'deck_number' => $deckId,
            'deckCount' => intval($this->game->cards->countCardInLocation('deck'.$deckId)),
            'deckTopCard' => Card::onlyId($this->game->getCardFromDb($this->game->cards->getCardOnTop('deck'.$deckId))),
        ]);

        $this->game->cardPickedFromDeck($deckId);

        return $this->game->afterPlayPower();
    }

    public function zombie(int $playerId): string {
        $choices = array_values(array_filter([1, 2], fn(int $deckId) =>
            $this->game->cards->countCardInLocation('deck'.$deckId) > 0
        ));
        if ($choices === []) {
            $this->game->DbQuery("update player set player_active = 0 WHERE player_id = $playerId");
            return NextPlayer::class;
        }

        $deckId = $this->getRandomZombieChoice($choices);
        return $this->actPickCard($deckId, $playerId);
    }
}
