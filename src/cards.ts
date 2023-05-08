class CardsManager extends CardManager<Card> {
    constructor (public game: SkateLegendGame) {
        super(game, {
            getId: (card) => `card-${card.id}`,
            setupDiv: (card: Card, div: HTMLElement) => {
                div.dataset.type = ''+card.type;
                div.dataset.typeArg = ''+card.typeArg;
            },
            setupFrontDiv: (card: Card, div: HTMLElement) => {},
            setupBackDiv: (card: Card, div: HTMLElement) => {},
            
        });
    }
}