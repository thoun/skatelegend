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

    private getPower(power: number) {
        switch (power) {
            case 10: return _('TODO POWER_FLIP_DECK');
            case 21: return _('TODO POWER_PLAY_AGAIN');
            case 22: return _('TODO POWER_PLAY_AGAIN_TWICE');
            case 31: return _('TODO POWER_PICK_CARD');
            case 32: return _('TODO POWER_PICK_CARD_TWICE');
        }
    }

    private getCondition(condition: number[]) {
        switch (condition[1]) {
            case 1: return _('TODO CONDITION_EQUAL');
            case 2: return _('TODO CONDITION_DANGER');
            case 3: return _('TODO CONDITION_YELLOW_GREEN');
            case 4: return _('TODO CONDITION_CARDS');
            case 5: return _('TODO CONDITION_DIFFERENT');
            case 6: return _('TODO CONDITION_RED');
        }
    }
    

    private getTooltip(card: Card) {
        let html = `
            <div><strong>${_('Color:')}</strong> ${this.getColorName(card.color)}</div>
            <div><strong>${_('Wheels:')}</strong> ${card.wheels}</div>
        `;

        if (card.danger) {
            html += `<div><strong style="color: darkred">${_('Danger')}</strong></div>`;
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