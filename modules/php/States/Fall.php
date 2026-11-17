<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Skatelegend\Game;

class Fall extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: ST_FALL,
            type: StateType::GAME,
            name: 'fall',
        );
    }

    public function onEnteringState(): string {
        $playerId = intval($this->game->getActivePlayerId());

        $this->game->DbQuery("update player set player_helmets = player_helmets + 1, player_helmet_card_id = -1, player_active = 0 WHERE player_id = $playerId");

        $sequence = $this->game->getCardsByLocation('played'.$playerId);
        $this->game->cards->moveCards(array_map(fn($card) => $card->id, $sequence), 'discard');

        $this->game->bga->notify->all('fall', clienttranslate('${player_name} falls! The sequence is discarded, but he gains one helmet'), [
            'playerId' => $playerId,
            'player_name' => $this->game->getPlayerName($playerId),
        ]);

        $remainingActivePlayersIds = $this->game->getRemainingActivePlayersIds();
        if (count($remainingActivePlayersIds) == 0) { 
            // last player in 2 player-mode falls

            $card = $this->game->getCardFromDb($this->game->cards->getCardOnTop('decklegend'));
            $this->game->cards->moveCard($card->id, 'discard');

            $this->game->bga->notify->all('discardTrophyCard', clienttranslate('The trophy card is discarded as the last active player fell'), [
                'card' => $card,
                'newCount' => intval($this->game->cards->countCardInLocation('decklegend')),
                'newCard' => $this->game->getCardFromDb($this->game->cards->getCardOnTop('decklegend')),
            ]);
        }

        return NextPlayer::class;
    }
}
