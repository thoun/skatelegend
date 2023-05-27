class TableCenter {
    public decks: Deck<Card>[] = [];
    public legendDeck: Deck<Card>;
        
    constructor(private game: SkateLegendGame, gamedatas: SkateLegendGamedatas) {
        for (let i=1;i<=2;i++) {
            const deckDiv = document.getElementById(`deck${i}`);
            this.decks[i] = new Deck<Card>(game.cardsManager, deckDiv, {
                cardNumber: gamedatas.decks[i].count,
                topCard: gamedatas.decks[i].top,
            });
            deckDiv.addEventListener('click', () => this.game.onDeckClick(i));
        }

        this.legendDeck = new Deck<Card>(game.cardsManager, document.getElementById(`rewards`), {
            cardNumber: gamedatas.decks[0].count,
            topCard: gamedatas.decks[0].top,
        });
    }
    
    public updateLegendDeck(newCard: Card, newCount: number) {
        this.legendDeck.setCardNumber(newCount, newCard);
    }
    
    public makeDecksSelectable(selectable: boolean) {
        for (let i=1;i<=2;i++) {
            this.decks[i].setSelectionMode(selectable ? 'single' : 'none');
        }
    }
}