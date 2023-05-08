const CARD_WIDTH = 140;
const CARD_HEIGHT = 280;

class TableCenter {
    public decks: HiddenDeck<Card>[] = [];
    public legendDeck: VisibleDeck<Card>;
        
    constructor(private game: SkateLegendGame, gamedatas: SkateLegendGamedatas) {
        for (let i=1;i<=2;i++) {
            const deckDiv = document.getElementById(`deck${i}`);
            this.decks[i] = new HiddenDeck<Card>(game.cardsManager, deckDiv, {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                cardNumber: gamedatas.decks[i].count,
            });
            deckDiv.addEventListener('click', () => this.game.playCardFromDeck(i));
            if (gamedatas.decks[i].top) {
                this.decks[i].setCardNumber(gamedatas.decks[i].count - 1);
                this.decks[i].addCard(gamedatas.decks[i].top);
            }
        }

        this.legendDeck = new VisibleDeck<Card>(game.cardsManager, document.getElementById(`rewards`), {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            cardNumber: gamedatas.decks[0].count - (gamedatas.decks[0].top ? 1 : 0),
        });
        if (gamedatas.decks[0].top) {
            this.legendDeck.addCard(gamedatas.decks[0].top);
        }
    }

    public flipTopDeck(deckId: number, card: Card) {
        this.decks[deckId].addCard(card, undefined, {
            visible: false,
            autoUpdateCardNumber: false,
        });
        this.game.cardsManager.flipCard(card);
    }
}