const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
const log = isDebug ? console.log.bind(window.console) : function () { };

class PlayerTable {
    public playerId: number;
    public voidStock: VoidStock<Card>;
    public hand?: LineStock<Card>;
    public played: LineStock<Card>;

    private currentPlayer: boolean;
    private teaseTimer: number;

    constructor(private game: SkateLegendGame, player: SkateLegendPlayer, SENTENCES: string[]) {
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();

        let html = `
        <div id="player-table-${this.playerId}" class="player-table" style="--player-color: #${player.color};">
            <div id="player-table-${this.playerId}-name" class="name-wrapper">${player.name}</div>
            <div id="tease-${this.playerId}-wrapper" class="tease-wrapper">            
                <div class="bubble-wrapper">
                    <div id="player-${this.playerId}-discussion-bubble" class="discussion_bubble" data-visible="false"></div>
                </div>
            </div>
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
            let html = `
            <div class="hand-and-speak">
                <div class="block-with-text hand-wrapper cards">
                    <div class="block-label">${_('Your hand')}</div>
                    <div id="player-table-${this.playerId}-hand" class="hand cards"></div>
                </div>
                <div class="speak">
                    <div class="tease-icon"></div>`;

            SENTENCES.forEach((sentence, index) => {
                html += `<button id="tease-${player.id}-sentence-${index}" class="bgabutton bgabutton_gray">${_(sentence)}</button>`;
            });

            html += `    </div>
            </div>
            `;
            document.getElementById(`table`).insertAdjacentHTML('afterbegin', html);

            SENTENCES.forEach((sentence, index) => {
                document.getElementById(`tease-${player.id}-sentence-${index}`).addEventListener('click', () => {
                    this.game.tease(index);
                });
            });

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
        this.played.getCardElement(card).insertAdjacentHTML('beforeend', `<div class="helmet"></div>`);
    }
    
    public makeCardsSelectable(selectable: boolean) {
        this.hand?.setSelectionMode(selectable ? 'single' : 'none');
    }
    
    public showTease(sentence: string) {
        if (this.teaseTimer) {
            clearTimeout(this.teaseTimer);
            this.teaseTimer = null;
        }
        const bubble = document.getElementById(`player-${this.playerId}-discussion-bubble`);
        bubble.innerHTML = _(sentence);
        bubble.dataset.visible = 'true';
        this.teaseTimer = setTimeout(() => {
            bubble.dataset.visible = 'false';
            this.teaseTimer = null;
        }, 2000);
    }
}