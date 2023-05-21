/**
 * Your game interfaces
 */

interface Card {
    id: number;
    type: number;
    typeArg: number;
    color: number;
    condition : number[] | null;
    danger: boolean;
    power: number;
    wheels: number;
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
    roundPoints?: number;
    allRoundsPoints?: number[];
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
    decks: { [deckId: number]: { count: number; top?: Card; } };
}

interface SkateLegendGame extends Game {
    animationManager: AnimationManager;
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

// flipCard
interface NotifFlipTopDeckArgs {
    card: Card;
}

// playCard
interface NotifPlayCardArgs {
    playerId: number;
    card: Card;
    fromDeck: number; // 0 means hand
    deckCount?: number;
    deckTopCard?: Card;
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
    roundPoints: number;
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
    deckCount: number;
    deckTopCard?: Card;
}

// detailledScore
interface NotifDetailledScoreArgs {
    roundScores: { [playerId: number | string]: number[]};
}

// splitDecks
interface NotifSplitDecksArgs {
    fromDeck: number;
    decks: { [deckId: number]: { count: number; top?: Card; } };
}
