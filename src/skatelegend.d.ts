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
    /*handCards: Card[];
    tableCards: Card[];
    endCall?: {
        announcement: string;
        cardsPoints: number;
        betResult?: string;
    };
    endRoundPoints?: NotifUpdateCardsPointsArgs;
    scoringDetail?: ScoreDetails;*/
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
}

interface SkateLegendGame extends Game {
    cardsManager: CardsManager;

    getPlayerId(): number;
    getPlayerColor(playerId: number): string;

    updateTableHeight(): void;
    setTooltip(id: string, html: string): void;
    playCardFromHand(id: number): void;
    playCardFromDeck(number: number): void;
}

interface EnteringChooseContinueArgs {
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

interface NotifCardInDiscardFromDeckArgs {
    card: Card;
    discardId: number;
    remainingCardsInDeck: number;
}

interface NotifCardInHandFromDiscardArgs {
    playerId: number;
    card: Card;
    discardId: number;
    newDiscardTopCard: Card | null;
    remainingCardsInDiscard: number;
}

interface NotifCardInHandFromPickArgs {
    playerId: number;
    card?: Card;
}

interface NotifCardInDiscardFromPickArgs {
    playerId: number;
    card: Card;
    discardId: number;
    remainingCardsInDiscard: number;
}

interface NotifScoreArgs {
    playerId: number;
    newScore: number;
    incScore: number;
}

interface NotifPlayCardsArgs {
    playerId: number;
    cards: Card[];
}

interface NotifRevealHandArgs extends NotifPlayCardsArgs {
    playerPoints: number;
}

interface NotifAnnounceEndRoundArgs {
    playerId: number;
    announcement: string;
}

interface NotifBetResultArgs {
    playerId: number;
    result: string;
}

interface NotifUpdateCardsPointsArgs {
    cardsPoints: number;
}

interface NotifStealCardArgs {
    playerId: number;
    opponentId: number;
    card: Card;
}
