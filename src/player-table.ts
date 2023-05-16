const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
const log = isDebug ? console.log.bind(window.console) : function () { };

class PlayerTable {
    public playerId: number;
    public voidStock: VoidStock<Card>;
    public hand?: LineStock<Card>;
    public played: LineStock<Card>;

    private currentPlayer: boolean;

    constructor(private game: SkateLegendGame, player: SkateLegendPlayer) {
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();

        let html = `
        <div id="player-table-${this.playerId}" class="player-table" style="--player-color: #${player.color};">
            <div id="player-table-${this.playerId}-name" class="name-wrapper">${player.name}</div>
            <div class="cards">
                <div class="block-with-text visible-cards">
                    <div class="block-label">${this.currentPlayer ? _('Your sequence') : _('${player_name}\'s sequence').replace('${player_name}', `<span style="color: #${this.game.getPlayerColor(this.playerId)}">${this.game.getPlayerName(this.playerId)}</span>`)}</div>
                    <div id="player-table-${this.playerId}-played" class="cards"></div>
                </div>
            </div>
        </div>
        `;
        dojo.place(html, document.getElementById('tables'));

        if (this.currentPlayer) {
            document.getElementById(`table`).insertAdjacentHTML('afterbegin', `
            <div class="block-with-text hand-wrapper cards">
                <div class="block-label">${_('Your hand')}</div>
                <div id="player-table-${this.playerId}-hand" class="hand cards"></div>
            </div>
            `)

            const handDiv = document.getElementById(`player-table-${this.playerId}-hand`);
            this.hand = new LineStock<Card>(this.game.cardsManager, handDiv, {
                sort: (a: Card, b: Card) => b.type - a.type,
            });
            this.hand.onCardClick = (card: Card) => this.game.playCardFromHand(card.id);
            
            this.hand.addCards(player.hand);

        }
        this.voidStock = new VoidStock<Card>(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-name`));
        
        this.played = new LineStock<Card>(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-played`), {
            center: false,
        });
        this.played.addCards(player.played);

        if (player.helmetCardId) {
            this.addHelmet(this.played.getCards().find(card => card.id == player.helmetCardId));
        }
    }
    
    public discardLegendCard(card: Card) {
        this.played.removeCard(card);
    }

    public fall(to: VoidStock<Card>) {
        //this.played.removeAll();
        to.addCards(this.played.getCards());
    }

    public closeSequence(to: VoidStock<Card>) {
        //this.played.removeAll();
        to.addCards(this.played.getCards());
    }
    
    public addHelmet(card: Card) {
        this.played.getCardElement(card).querySelector('.front').insertAdjacentHTML('beforeend', `<div class="helmet"></div>`);
    }
    
    public makeCardsSelectable(selectable: boolean) {
        this.hand?.setSelectionMode(selectable ? 'single' : 'none');
    }
}