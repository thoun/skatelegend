class CardsManager extends CardManager<Card> {
    constructor (public game: SkateLegendGame) {
        super(game, {
            getId: (card) => `card-${card.id}`,
            setupDiv: (card: Card, div: HTMLElement) => {
                /*div.classList.add('kot-card');
                div.dataset.cardId = ''+card.id;
                div.dataset.cardType = ''+card.type;*/
            },
            setupFrontDiv: (card: Card, div: HTMLElement) => {
                /*this.setFrontBackground(div as HTMLDivElement, card.type, card.side);
        
                if (FLIPPABLE_CARDS.includes(card.type)) {
                    this.setDivAsCard(div as HTMLDivElement, 301, 0); 
                } else if (card.type < 999) {
                    this.setDivAsCard(div as HTMLDivElement, card.type + (card.side || 0));
                }
                div.id = `${super.getId(card)}-front`;
                (this.game as any).addTooltipHtml(div.id, this.getTooltip(card.type, card.side));
                if (card.tokens > 0) {
                    this.placeTokensOnCard(card);
                }*/
            },
            setupBackDiv: (card: Card, div: HTMLElement) => {
                /*const darkEdition = this.game.isDarkEdition();
                if (card.type < 200) {
                    div.style.backgroundImage = `url('${g_gamethemeurl}img/${darkEdition ? 'dark/' : ''}card-back.jpg')`;
                } else if (card.type < 300) {
                    div.style.backgroundImage = `url('${g_gamethemeurl}img/card-back-costume.jpg')`;
                } else if (FLIPPABLE_CARDS.includes(card.type)) {
                    this.setFrontBackground(div as HTMLDivElement, card.type, card.side);
                    this.setDivAsCard(div as HTMLDivElement, 301, 1);
                    (this.game as any).addTooltipHtml(div.id, this.getTooltip(card.type, card.side));
                } else if (card.type == 999) {
                    this.setFrontBackground(div as HTMLDivElement, card.type, card.side);
                }*/
            }
        });
        this.EVOLUTION_CARDS_TYPES = (game as any).gamedatas.EVOLUTION_CARDS_TYPES;
    }

    public placeHelmetOnCard(card: Card, playerId: number) {
        /*const cardType = card.mimicType || card.type;

        if (![28, 41].includes(cardType)) {
            return;
        }

        const divId = this.getId(card);
        const div = document.getElementById(divId).getElementsByClassName('front')[0] as HTMLDivElement;
        if (!div) {
            return;
        }
        const cardPlaced: CardPlacedTokens = div.dataset.placed ? JSON.parse(div.dataset.placed) : { tokens: []};
        const placed: PlacedTokens[] = cardPlaced.tokens;


        // remove tokens
        for (let i = card.tokens; i < placed.length; i++) {
            if (cardType === 28 && playerId) {
                (this.game as any).slideToObjectAndDestroy(`${divId}-token${i}`, `energy-counter-${playerId}`);
            } else {
                (this.game as any).fadeOutAndDestroy(`${divId}-token${i}`);
            }
        }
        placed.splice(card.tokens, placed.length - card.tokens);

        // add tokens
        for (let i = placed.length; i < card.tokens; i++) {
            const newPlace = this.getPlaceOnCard(cardPlaced);

            placed.push(newPlace);
            let html = `<div id="${divId}-token${i}" style="left: ${newPlace.x - 16}px; top: ${newPlace.y - 16}px;" class="card-token `;
            if (cardType === 28) {
                html += `energy-cube cube-shape-${Math.floor(Math.random()*5)}`;
            } else if (cardType === 41) {
                html += `smoke-cloud token`;
            }
            html += `"></div>`;
            div.insertAdjacentHTML('beforeend', html);
        }

        div.dataset.placed = JSON.stringify(cardPlaced);*/
    }
}