<?php

declare(strict_types=1);

namespace Bga\Games\Skatelegend;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\UserException;
use Bga\Games\Skatelegend\Models\Card;
use Bga\Games\Skatelegend\States\Fall;
use Bga\Games\Skatelegend\States\PlayHelmet;

trait ActionTrait {

    #[PossibleAction]
    public function actPlayCardFromHand(#[IntParam(min: 0)] int $id, int $activePlayerId): string {
        if ($this->game->gamestate->getCurrentMainStateId() == ST_PLAYER_CHOOSE_CONTINUE) {
            $this->continueSequence($activePlayerId);
        }

        $args = $this->getPlayCardArgs($activePlayerId);
        $card = \array_find($args['playableCards'], fn($c) => $c->id == $id);

        if ($card == null || $card->location != 'hand' || $card->locationArg != $activePlayerId) {
            throw new UserException("You can't play this card");
        }

        return $this->playCard($activePlayerId, $card, -1);
    }

    #[PossibleAction]
    public function actPlayCardFromDeck(#[IntParam(name: 'number', min: 0)] int $deckId, int $activePlayerId): string {
        if ($this->game->gamestate->getCurrentMainStateId() == ST_PLAYER_CHOOSE_CONTINUE) {
            $this->continueSequence($activePlayerId);
        }

        $visibleTopDecks = $this->game->getVisibleTopDecks();
        if (!in_array($deckId, $visibleTopDecks)) {
            $this->game->makeTopDeckVisible($deckId, false);
        }

        $card = $this->game->getCardFromDb($this->game->cards->getCardOnTop('deck'.$deckId));
        return $this->playCard($activePlayerId, $card, $deckId);
    }

    private function continueSequence(int $activePlayerId): void {
        $this->game->bga->notify->all('log', clienttranslate('${player_name} chooses to continue their sequence'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerName($activePlayerId),
        ]);

        $this->game->gamestate->nextState('continue');
    }

    private function getPlayCardArgs(int $activePlayerId): array {

        $hand = $this->game->getCardsByLocation('hand', $activePlayerId);

        $playableCards = $hand; // TODO

        return [
            'playableCards' => $playableCards,
        ];
    }

    private function playCard(int $playerId, Card $card, int $deckId): string {
        $this->game->cards->moveCard($card->id, 'played'.$playerId, intval($this->game->cards->countCardInLocation('played'.$playerId)));

        $message = $deckId > 0 ?
            clienttranslate('${player_name} plays a ${card_color} card from deck ${deck_number}') :
            clienttranslate('${player_name} plays a ${card_color} card from their hand');

        $args = [
            'playerId' => $playerId,
            'player_name' => $this->game->getPlayerName($playerId),
            'card' => $card,
            'fromDeck' => $deckId,
            'card_color' => $this->game->getCardColor($card->color), // for logs
            'deck_number' => $deckId,
            'i18n' => ['card_color'],
        ];

        if ($deckId > 0) {
            $args['deckCount'] = intval($this->game->cards->countCardInLocation('deck'.$deckId));
            $args['deckTopCard'] = Card::onlyId($this->game->getCardFromDb($this->game->cards->getCardOnTop('deck'.$deckId)));
        }

        $this->game->bga->notify->all('playCard', $message, $args);

        if ($deckId > 0) {
            $this->game->cardPickedFromDeck($deckId);
        }

        $sequence = $this->game->getCardsByLocation('played'.$playerId);
        $fall = $this->isFall($playerId, $sequence);
        if ($fall > 0) {
            return Fall::class;
        }

        $helmets = $this->game->getPlayerHelmets($playerId);
        if ($helmets > 0 && intval($this->game->getUniqueValueFromDB("SELECT player_helmet_card_id FROM player WHERE player_id = $playerId")) != -1) {
            $helmets = 0; // can't play a helmet, already played one this round
        }

        if ($helmets > 0) {
            $colors = $this->game->getSequenceCardsByColor($sequence);
            if (count($colors[$card->color]) < 2) {
                $helmets = 0; // don't ask if the player doesn't have 2 cards of this color
            }
        }

        /*$this->game->incStat(1, 'playedCards');
        $this->game->incStat(1, 'playedCards', $playerId);
        $this->game->incStat(1, 'playedCards'.$card->cardType);
        $this->game->incStat(1, 'playedCards'.$card->cardType, $playerId);*/

        if ($helmets > 0) {
            return PlayHelmet::class;
        } else {
            return $this->game->afterPlayHelmet($playerId, $card);
        }
    }

    private function isFall(int $playerId, array $sequence): int {
        if (count(array_filter($sequence, fn($card) => $card->danger)) >= 3) {
            return 1; // fall with danger symbol
        }

        $colorOfHelmet = $this->game->getColorOfHelmet($playerId, $sequence);

        $colors = $this->game->getSequenceCardsByColor($sequence);
        foreach($colors as $color => $colorCards) {
            if ($color != $colorOfHelmet && count($colorCards) >= 3) {
                return 2; // fall with color
            }
        }

        return 0;
    }
}
