const CARD_WIDTH = 140;
const CARD_HEIGHT = 280;

class CardsManager extends CardManager<Card> {
    constructor (public game: SkateLegendGame) {
        super(game, {
            getId: (card) => `card-${card.id}`,
            setupDiv: (card: Card, div: HTMLElement) => {
                div.dataset.type = ''+card.type;
            },
            setupFrontDiv: (card: Card, div: HTMLElement) => {
                div.dataset.typeArg = ''+card.typeArg;
                if (card.typeArg) {
                    this.game.setTooltip(div.id, this.getTooltip(card));
                }
            },
            isCardVisible: card => Boolean(card.typeArg),
            animationManager: game.animationManager,
            cardWidth: CARD_WIDTH,
            cardHeight: CARD_HEIGHT,
        });
    }

    private getColorName(color: number) {
        switch (color) {
            case 0: return _('Gray');
            case 1: return _('Blue');
            case 2: return _('Yellow');
            case 3: return _('Red');
            case 4: return _('Green');
        }
    }

    public getPower(power: number) {
        switch (power) {
            case 10: 
                return _('Turn the first card of either Trick pile face up. If both piles already have their first card face up, nothing happens.');
            case 21: 
            case 22: 
                return _('Immediately replay the "Perform a trick" action. If the new card played has an Effect, apply it immediately.');
            case 31: 
            case 32:
                return _('Add ${number} card to your hand from the Trick pile of your choice.').replace('${number}', power - 30);
        }
    }

    public getCondition(condition: number[]) {
        switch (condition[1]) {
            case 1: return _('${number} same colors in the sequence.').replace('${number}', condition[0]);
            case 2: return _('${number} cards with the “Broken Board” icon in the sequence.').replace('${number}', condition[0]);
            case 3: return _('1 green and 1 yellow card in the sequence.');
            case 4: return _('${number} cards in the sequence.').replace('${number}', condition[0]);
            case 5: return _('${number} different colors in the sequence.').replace('${number}', condition[0]);
            case 6: return _('${number} red cards in the sequence.').replace('${number}', condition[0]);
        }
    }
    

    private getTooltip(card: Card) {
        let html = `
            <div><strong>${_('Color:')}</strong> ${this.getColorName(card.color)}</div>
            <div><strong>${_('Prestige Points:')}</strong> ${card.wheels}</div>
        `;

        if (card.danger) {
            html += `<div><strong style="color: darkred">${_('Broken Board')}</strong></div>`;
        }
        if (card.power) {
            html += `
                <div><strong>${_('Power:')}</strong> ${this.getPower(card.power)}</div>
            `;
        }
        if (card.condition) {
            html += `
                <div><strong>${_('Condition:')}</strong> ${this.getCondition(card.condition)}</div>
            `;
        }

        return html;
    }
}