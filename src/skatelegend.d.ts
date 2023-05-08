/**
 * Your game interfaces
 */

interface Card {
    id: number;
    type: number;
    typeArg: number;
    //color: number;
}

interface SkateLegendPlayer extends Player {
    playerNo: number;
    active: boolean;
    helmets: number;
    helmetCardId: number | null;

    hand?: Card[];
    played: Card[];
    handCount: number;
    scoredCount: number;
}

interface SkateLegendGamedatas {
    current_player_id: string;
    decision: {decision_type: string};
    game_result_neutralized: string;
    gamestate: Gamestate;
    gamestates: { [gamestateId: number]: Gamestate };
    neutralized_player_id: string;
    notifications: {last_packet_id: string, move_nbr: string}
    playerorder: (string | number)[];
    players: { [playerId: number]: SkateLegendPlayer };
    tablespeed: string;

    // Add here variables you set up in getAllDatas
    roundNumber: number;
    decks: { [deckId: number]: { count: number; top: Card | null; } };
}

interface SkateLegendGame extends Game {
    cardsManager: CardsManager;

    getPlayerId(): number;
    getPlayerName(playerId: number): string;
    getPlayerColor(playerId: number): string;

    setTooltip(id: string, html: string): void;
    playCardFromHand(id: number): void;
    onDeckClick(number: number): void;
}

interface EnteringChooseContinueArgs {
    canStop: boolean;
    shouldNotStop: boolean;
}

/*interface EnteringPlayCardArgs {
    _private?: {
        cards: Card[];
    }
    cards: Card[];
    discardNumber?: number;
    remainingCardsInDeck: number;
}*/

// flipTopDeck
interface NotifFlipTopDeckArgs {
    deckId: number;
    card: Card;
}

// playCard
interface NotifPlayCardArgs {
    playerId: number;
    card: Card;
    fromDeck: boolean;
} 

// discardedLegendCard
interface NotifDiscardedLegendCardArgs {
    playerId: number;
    card: Card;
} 

// fall
interface NotifFallArgs {
    playerId: number;
} 

// closeSequence
interface NotifCloseSequenceArgs {
    playerId: number;
    sequence: Card[];
} 

// newRound
interface NotifNewRoundArgs {
    roundNumber: number;
}

// addHelmet
interface NotifAddHelmetArgs {
    playerId: number;
    card: Card;
}

// takeTrophyCard / discardTrophyCard
interface NotifTakeTrophyCardArgs {
    playerId: number;
    card: Card;
    perfectLanding: boolean;
    newCount: number;
    newCard: Card | null;
}

// addCardToHand
interface NotifAddCardToHandArgs {
    playerId: number;
    card: Card;
    fromDeckNumber: number;
}
