const BgaZoom = await globalThis.importEsmLib('bga-zoom', '1.x');
const BgaJumpTo = await globalThis.importEsmLib('bga-jump-to', '1.x');
const [BgaHelp, BgaAnimations, BgaCards] = await globalThis.importDojoLibs([
    g_gamethemeurl + 'modules/js/bga-help.js',
    g_gamethemeurl + 'modules/js/bga-animations.js',
    g_gamethemeurl + 'modules/js/bga-cards.js',
]);
const AnimationManager = BgaAnimations.AnimationManager;
const HelpManager = BgaHelp.HelpManager;
const BgaHelpPopinButton = BgaHelp.BgaHelpPopinButton;
const CardManager = BgaCards.CardManager;
const Deck = BgaCards.Deck;
const LineStock = BgaCards.LineStock;
const SlotStock = BgaCards.SlotStock;
const VoidStock = BgaCards.VoidStock;
const BgaSlideAnimation = BgaAnimations.BgaSlideAnimation;

const CARD_WIDTH = 140;
const CARD_HEIGHT = 280;
class CardsManager extends CardManager {
    constructor(skateGame) {
        super(skateGame.bga.gameui, {
            getId: (card) => `card-${card.id}`,
            setupDiv: (card, div) => {
                div.dataset.type = '' + card.type;
            },
            setupFrontDiv: (card, div) => {
                div.dataset.typeArg = '' + card.typeArg;
                if (card.typeArg) {
                    this.skateGame.setTooltip(div.id, this.getTooltip(card));
                }
            },
            isCardVisible: card => Boolean(card.typeArg),
            animationManager: skateGame.animationManager,
            cardWidth: CARD_WIDTH,
            cardHeight: CARD_HEIGHT,
        });
        this.skateGame = skateGame;
    }
    getColorName(color) {
        switch (color) {
            case 0: return _('Gray');
            case 1: return _('Blue');
            case 2: return _('Yellow');
            case 3: return _('Red');
            case 4: return _('Green');
        }
    }
    getPower(power) {
        switch (power) {
            case 10:
                return _('Turn the first card of either Trick pile face up. If both piles already have their first card face up, nothing happens.');
            case 21:
            case 22:
                return _('Immediately replay the "Perform a trick" action (${number}x). If the new card played has an Effect, apply it immediately.').replace('${number}', String(power - 20));
            case 31:
            case 32:
                return _('Add ${number} card to your hand from the Trick pile of your choice.').replace('${number}', String(power - 30));
        }
    }
    getCondition(condition) {
        switch (condition[1]) {
            case 1: return _('${number} same colors in the sequence.').replace('${number}', String(condition[0]));
            case 2: return _('${number} cards with the “Broken Board” icon in the sequence.').replace('${number}', String(condition[0]));
            case 3: return _('1 green and 1 yellow card in the sequence.');
            case 4: return _('${number} cards in the sequence.').replace('${number}', String(condition[0]));
            case 5: return _('${number} different colors in the sequence.').replace('${number}', String(condition[0]));
            case 6: return _('${number} red cards in the sequence.').replace('${number}', String(condition[0]));
        }
    }
    getTooltip(card) {
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

class PlayerTable {
    constructor(game, player, SENTENCES) {
        this.game = game;
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
        document.getElementById('tables').insertAdjacentHTML('beforeend', html);
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
            this.hand = new LineStock(this.game.cardsManager, handDiv, {
                sort: (a, b) => b.type - a.type,
            });
            this.hand.onCardClick = (card) => this.game.playCardFromHand(card.id);
            this.hand.addCards(player.hand);
        }
        this.voidStock = new VoidStock(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-name`));
        this.played = new LineStock(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-played`), {
            center: false,
        });
        this.played.addCards(player.played);
        if (player.helmetCardId) {
            this.addHelmet(this.played.getCards().find(card => card.id == player.helmetCardId));
        }
    }
    discardLegendCard(card) {
        this.played.removeCard(card);
    }
    fall(to) {
        //this.played.removeAll();
        to.addCards(this.played.getCards());
    }
    closeSequence(to) {
        //this.played.removeAll();
        to.addCards(this.played.getCards());
    }
    addHelmet(card) {
        this.played.getCardElement(card).insertAdjacentHTML('beforeend', `<div class="helmet"></div>`);
    }
    makeCardsSelectable(selectable) {
        this.hand?.setSelectionMode(selectable ? 'single' : 'none');
    }
    showTease(sentence) {
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

class TableCenter {
    constructor(game, gamedatas) {
        this.game = game;
        this.decks = [];
        for (let i = 1; i <= 2; i++) {
            const deckDiv = document.getElementById(`deck${i}`);
            this.decks[i] = new Deck(game.cardsManager, deckDiv, {
                cardNumber: gamedatas.decks[i].count,
                topCard: gamedatas.decks[i].top,
            });
            deckDiv.addEventListener('click', () => this.game.onDeckClick(i));
        }
        this.legendDeck = new Deck(game.cardsManager, document.getElementById(`rewards`), {
            cardNumber: gamedatas.decks[0].count,
            topCard: gamedatas.decks[0].top,
        });
    }
    updateLegendDeck(newCard, newCount) {
        this.legendDeck.setCardNumber(newCount, newCard);
    }
    makeDecksSelectable(selectable) {
        for (let i = 1; i <= 2; i++) {
            this.decks[i].setSelectionMode(selectable ? 'single' : 'none');
        }
    }
}

const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
const log = isDebug ? console.log.bind(window.console) : function () { };

const ANIMATION_MS = 500;
const ACTION_TIMER_DURATION = 5;
const LOCAL_STORAGE_ZOOM_KEY = 'SkateLegend-zoom';
const LOCAL_STORAGE_JUMP_TO_FOLDED_KEY = 'SkateLegend-jump-to-folded';
class Game {
    constructor(bga) {
        this.playersTables = [];
        this.handCounters = [];
        this.playedCounters = [];
        this.scoredCounters = [];
        this.helmetCounters = [];
        this.stopVoidStocks = [];
        //private teaseTimers: number[] = [];
        this.TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;
        this.bga = bga;
        /*const zoomStr = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
        if (zoomStr) {
            this.zoom = Number(zoomStr);
        }*/
    }
    /*
        setup:

        This method must set up the game user interface according to current game situation specified
        in parameters.

        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)

        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
    */
    setup(gamedatas) {
        log("Starting game setup");
        this.bga.gameArea.getElement().insertAdjacentHTML('beforeend', `
            <div id="score">
                <div id="table-wrapper">
                    <table>
                        <thead>
                            <tr id="scoretr"></tr>
                        </thead>
                        <tbody id="score-table-body">
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="table">
                <div id="round-counter-row">
                    <div id="round-counter-block"><span id="round-counter"></span> / 4</div>
                </div>
                <div id="centered-table">
                    <div id="tables-and-center">
                        <div id="table-center">
                            <div id="decks">
                                <div id="deck1"></div>
                                <div id="deck2"></div>
                            </div>
                            <div id="rewards"></div>
                        </div>
                        <div id="tables"></div>
                    </div>
                </div>
            </div>
        `);
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        const endGame = Number(gamedatas.gamestate.id) >= 90; // score or end
        this.animationManager = new AnimationManager(this.bga.gameui);
        this.cardsManager = new CardsManager(this);
        const entries = [
            new BgaJumpTo.Entry(_('Decks & reward'), 'table-center', {
                color: 'black',
                backgroundImage: `url('${this.bga.images.getImgUrl('cards.jpg')}')`,
                // The card back is the first of twelve tiles; cover the shortcut with that tile.
                backgroundSize: '1200% auto',
                backgroundPosition: 'left center',
            }),
        ];
        entries.push(...BgaJumpTo.BgaPlayerEntries(this.bga, {
            playerOrder: this.getOrderedPlayers(gamedatas).map(player => Number(player.id)),
            entrySettings: playerId => ({ id: `bga-jump-to_player-table-${playerId}` }),
        }));
        new BgaJumpTo.Manager({
            localStorageFoldedKey: LOCAL_STORAGE_JUMP_TO_FOLDED_KEY,
            entries,
        });
        this.tableCenter = new TableCenter(this, gamedatas);
        this.createPlayerPanels(gamedatas, endGame);
        this.createPlayerTables(gamedatas);
        this.zoomManager = new BgaZoom.Manager({
            element: document.getElementById('table'),
            localStorageZoomKey: LOCAL_STORAGE_ZOOM_KEY,
            /*autoZoom: {
                expectedWidth: this.factories.getWidth(),
            },*/
            // onDimensionsChange: (newZoom) => this.onTableCenterSizeChange(newZoom),
        });
        this.animationManager.setZoomManager(this.zoomManager);
        document.getElementById(`round-counter`).insertAdjacentHTML('beforebegin', _("Round number:") + ' ');
        this.roundCounter = new ebg.counter();
        this.roundCounter.create(`round-counter`);
        this.roundCounter.setValue(gamedatas.roundNumber);
        this.fallVoidStock = new VoidStock(this.cardsManager, document.getElementById('overall-footer'));
        new HelpManager(this.bga.gameui, {
            buttons: [
                new BgaHelpPopinButton({
                    title: _("Card details").toUpperCase(),
                    html: this.getHelpHtml(),
                    buttonBackground: '#070407',
                }),
            ]
        });
        this.setupNotifications();
        if (endGame) { // score or end
            this.onEnteringShowScore(true);
        }
        log("Ending game setup");
    }
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    onEnteringState(stateName, args) {
        log('Entering state: ' + stateName, args.args);
        switch (stateName) {
            case 'playCard':
                this.onEnteringPlayCard();
                break;
            case 'pickCard':
            case 'revealDeckCard':
                this.onEnteringRevealDeckCard();
                break;
            case 'endScore':
                this.onEnteringShowScore();
                break;
        }
    }
    onEnteringPlayCard() {
        if (this.bga.gameui.isCurrentPlayerActive()) {
            this.tableCenter.makeDecksSelectable(true);
            this.getCurrentPlayerTable()?.makeCardsSelectable(true);
        }
    }
    onEnteringRevealDeckCard() {
        if (this.bga.gameui.isCurrentPlayerActive()) {
            this.tableCenter.makeDecksSelectable(true);
        }
    }
    onEnteringShowScore(fromReload = false) {
        document.getElementById('score').style.display = 'flex';
        const headers = document.getElementById('scoretr');
        if (!headers.childElementCount) {
            let html = `
                <th></th>`;
            [1, 2, 3, 4].forEach(i => {
                html += `
                    <th id="th-round${i}-score" class="round-score">${_("Round ${number}").replace('${number}', String(i))}</th>
                `;
            });
            html += `
                <th id="th-helmet-score" class="helmet-score">${_("Helmet score")}</th>
                <th id="th-end-score" class="end-score">${_("Final score")}</th>
            `;
            headers.insertAdjacentHTML('beforeend', html);
        }
        const players = Object.values(this.gamedatas.players);
        players.forEach(player => {
            let html = `
                <tr id="score${player.id}">
                <td class="player-name" style="color: #${player.color}">${player.name}</td>`;
            [1, 2, 3, 4].forEach(i => {
                html += `
                    <td id="round-score${player.id}" class="round-score">${player.allRoundsPoints?.[i - 1] ?? '-'}</td>
                `;
            });
            html += `
                <td id="helmet-score${player.id}" class="helmet-score">${player.helmets * 2}</td>
                <td id="end-score${player.id}" class="total">${player.score ?? ''}</td>
            </tr>
            `;
            document.getElementById('score-table-body').insertAdjacentHTML('beforeend', html);
        });
    }
    onLeavingState(stateName) {
        log('Leaving state: ' + stateName);
        switch (stateName) {
            case 'playCard':
                this.onLeavingPlayCard();
                break;
            case 'pickCard':
            case 'revealDeckCard':
                this.onLeavingRevealDeckCard();
                break;
        }
    }
    onLeavingPlayCard() {
        this.tableCenter.makeDecksSelectable(false);
        this.getCurrentPlayerTable()?.makeCardsSelectable(false);
    }
    onLeavingRevealDeckCard() {
        this.tableCenter.makeDecksSelectable(false);
    }
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    onUpdateActionButtons(stateName, args) {
        if (this.bga.gameui.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseContinue':
                    const chooseContinueArgs = args;
                    this.bga.gameui.addActionButton(`continue_button`, _("Continue"), () => this.continue());
                    this.bga.gameui.addActionButton(`stop_button`, _("Stop"), () => this.stop(chooseContinueArgs.shouldNotStop));
                    if (!chooseContinueArgs.canStop) {
                        document.getElementById(`stop_button`).classList.add('disabled');
                    }
                    break;
                case 'playHelmet':
                    this.bga.gameui.addActionButton(`playHelmet_button`, _("Add helmet on last card"), () => this.playHelmet());
                    this.bga.gameui.addActionButton(`skipHelmet_button`, _("Skip"), () => this.skipHelmet());
                    break;
            }
        }
    }
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    setTooltip(id, html) {
        this.bga.gameui.addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    }
    setTooltipToClass(className, html) {
        this.bga.gameui.addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    }
    getPlayerId() {
        return Number(this.bga.gameui.player_id);
    }
    getPlayerName(playerId) {
        return this.gamedatas.players[playerId].name;
    }
    getPlayerColor(playerId) {
        return this.gamedatas.players[playerId].color;
    }
    getPlayerTable(playerId) {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }
    getCurrentPlayerTable() {
        return this.playersTables.find(playerTable => playerTable.playerId === this.getPlayerId());
    }
    getOrderedPlayers(gamedatas) {
        const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
        const playerIndex = players.findIndex(player => Number(player.id) === Number(this.bga.gameui.player_id));
        const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;
        return orderedPlayers;
    }
    createPlayerPanels(gamedatas, endGame) {
        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);
            // hand + scored cards counter + helmets counter
            this.bga.playerPanels.getElement(playerId).insertAdjacentHTML('beforeend', `<div class="counters">
                <div id="playerhand-counter-wrapper-${player.id}" class="playerhand-counter">
                    <div class="player-hand-card"></div> 
                    <span id="playerhand-counter-${player.id}"></span>
                </div>
                <div id="played-counter-wrapper-${player.id}" class="played-counter">
                    <div class="player-played-card"></div> 
                    <span id="played-counter-${player.id}"></span>
                </div>
                <div id="scored-counter-wrapper-${player.id}" class="scored-counter">
                    <div class="player-scored-card"></div> 
                    <span id="scored-counter-${player.id}"></span>
                </div>
            </div>
            <div class="counters">
                <div id="player-helmets-counter-wrapper-${player.id}" class="player-helmets-counter">
                    <div class="player-helmets"></div> 
                    <span id="player-helmets-counter-${player.id}"></span>
                </div>
            </div>
            <div id="round-points-${player.id}"></div>
            `);
            const handCounter = new ebg.counter();
            handCounter.create(`playerhand-counter-${playerId}`);
            handCounter.setValue(player.handCount);
            this.handCounters[playerId] = handCounter;
            const playedCounter = new ebg.counter();
            playedCounter.create(`played-counter-${playerId}`);
            playedCounter.setValue(player.played.length);
            this.playedCounters[playerId] = playedCounter;
            const scoredCounter = new ebg.counter();
            scoredCounter.create(`scored-counter-${playerId}`);
            scoredCounter.setValue(player.scoredCount);
            this.scoredCounters[playerId] = scoredCounter;
            const helmetCounter = new ebg.counter();
            helmetCounter.create(`player-helmets-counter-${playerId}`);
            helmetCounter.setValue(player.helmets);
            this.helmetCounters[playerId] = helmetCounter;
            if (!endGame) {
                this.setPlayerActive(playerId, player.active);
            }
            if (playerId == this.getPlayerId()) {
                /*document.getElementById(`tease-${player.id}-wrapper`).insertAdjacentHTML('beforeend', `
                <div class="bubble-wrapper">
                    <div id="player-${player.id}-action-bubble" class="discussion_bubble" data-visible="false"></div>
                </div>
                <button id="tease-${player.id}-button" class="bgabutton bgabutton_blue tease-button"><div class="tease-icon"></button>
                `);
                const actionBubble = document.getElementById(`player-${player.id}-action-bubble`);
                document.getElementById(`tease-${player.id}-button`).addEventListener('click', () => {
                    actionBubble.dataset.visible = actionBubble.dataset.visible == 'true' ? 'false' : 'true';
                });

                this.gamedatas.SENTENCES.forEach((sentence, index) => {
                    actionBubble.insertAdjacentHTML('beforeend', `<button id="tease-${player.id}-sentence-${index}" class="bgabutton bgabutton_blue">${_(sentence)}</button>`);
                    document.getElementById(`tease-${player.id}-sentence-${index}`).addEventListener('click', () => {
                        this.tease(index);
                        actionBubble.dataset.visible = 'false';
                    });
                });
                actionBubble.insertAdjacentHTML('beforeend', `<button id="tease-${player.id}-sentence-cancel" class="bgabutton bgabutton_gray">${_('Cancel')}</button>`);
                    document.getElementById(`tease-${player.id}-sentence-cancel`).addEventListener('click', () => {
                        actionBubble.dataset.visible = 'false';
                    });*/
                if (player.roundPoints) {
                    this.setRoundPoints(playerId, player.roundPoints);
                }
            }
            this.stopVoidStocks[playerId] = new VoidStock(this.cardsManager, document.getElementById(`scored-counter-${playerId}`));
        });
        this.setTooltipToClass('playerhand-counter', _('Cards in hand'));
        this.setTooltipToClass('played-counter', _('Size of the current sequence'));
        this.setTooltipToClass('scored-counter', _('Number of scored cards'));
        this.setTooltipToClass('player-helmets-counter', _('Number of helmets'));
    }
    /*public showTease(playerId: number, sentence: string) {
        if (this.teaseTimers[playerId]) {
            clearTimeout(this.teaseTimers[playerId]);
            this.teaseTimers[playerId] = null;
        }
        const bubble = document.getElementById(`player-${playerId}-discussion-bubble`);
        bubble.innerHTML = _(sentence);
        bubble.dataset.visible = 'true';
        this.teaseTimers[playerId] = setTimeout(() => {
            bubble.dataset.visible = 'false';
            this.teaseTimers[playerId] = null;
        }, 2000);
    }*/
    setPlayerActive(playerId, active) {
        document.getElementById(`overall_player_board_${playerId}`).classList.toggle('inactive', !active);
    }
    createPlayerTables(gamedatas) {
        const orderedPlayers = this.getOrderedPlayers(gamedatas);
        orderedPlayers.forEach(player => this.createPlayerTable(gamedatas, Number(player.id)));
    }
    createPlayerTable(gamedatas, playerId) {
        const table = new PlayerTable(this, gamedatas.players[playerId], gamedatas.SENTENCES);
        this.playersTables.push(table);
    }
    getHelpHtml() {
        let html = `
        <div id="help-popin">

        <h1>${_("Card effect")}</h1>
        <div class="row help-card-effect">`;
        [10, 21, 31].forEach(power => {
            html += `       
                <div class="help-icon" data-power="${power}"></div>
                <div class="help-label">${this.cardsManager.getPower(power)}</div>
            `;
        });
        html += `    </div>  
            <h1>${_("Conditions of Legendary Tricks card")}</h1>
            <div class="row help-condition">`;
        [[4, 4], [5, 4], [2, 2], [1, 3], [2, 6], [3, 5], [2, 1]].forEach(condition => {
            html += `
                <div class="help-icon" data-condition="${JSON.stringify(condition)}"></div>
                <div class="help-label">${this.cardsManager.getCondition(condition)}</div>

           `;
        });
        html += `    </div>  
        </div>
        `;
        return html;
    }
    onDeckClick(number) {
        if (this.gamedatas.gamestate.name == 'pickCard') {
            this.pickCard(number);
        }
        else if (this.gamedatas.gamestate.name == 'revealDeckCard') {
            this.revealTopDeckCard(number);
        }
        else {
            this.playCardFromDeck(number);
        }
    }
    continue() {
        this.bga.actions.performAction('actContinue');
    }
    stop(warning) {
        if (warning) {
            if (!this.bga.actions.checkAction('actStop')) {
                return;
            }
            this.bga.gameui.confirmationDialog(_("Are you sure you want to stop here? There is no risk if you continue the sequence."), () => this.stop(false));
            return;
        }
        this.bga.actions.performAction('actStop');
    }
    playCardFromHand(id) {
        this.bga.actions.performAction('actPlayCardFromHand', {
            id
        });
    }
    playCardFromDeck(number) {
        this.bga.actions.performAction('actPlayCardFromDeck', {
            number
        });
    }
    pickCard(number) {
        this.bga.actions.performAction('actPickCard', {
            number
        });
    }
    revealTopDeckCard(number) {
        this.bga.actions.performAction('actRevealTopDeckCard', {
            number
        });
    }
    playHelmet() {
        this.bga.actions.performAction('actPlayHelmet');
    }
    skipHelmet() {
        this.bga.actions.performAction('actSkipHelmet');
    }
    tease(sentence) {
        this.bga.actions.performAction('actTease', {
            sentence
        }, { lock: false, checkAction: false });
    }
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your pylos.game.php file.

    */
    setupNotifications() {
        //log( 'notifications subscriptions setup' );
        const notifs = [
            ['flipCard', ANIMATION_MS],
            ['playCard', ANIMATION_MS],
            ['discardedLegendCard', ANIMATION_MS],
            ['fall', ANIMATION_MS * 4],
            ['closeSequence', ANIMATION_MS],
            ['newRound', ANIMATION_MS * 3],
            ['addHelmet', ANIMATION_MS],
            ['takeTrophyCard', ANIMATION_MS],
            ['discardTrophyCard', ANIMATION_MS],
            ['addCardToHand', ANIMATION_MS],
            ['detailledScore', ANIMATION_MS],
            ['splitDecks', ANIMATION_MS],
            ['tease', 1],
        ];
        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], (...args) => this[`notif_${notif[0]}`](...args));
            this.bga.gameui.notifqueue.setSynchronous(notif[0], notif[1]);
        });
        this.bga.gameui.notifqueue.setIgnoreNotificationCheck('addCardToHand', (notif) => notif.args.playerId == this.getPlayerId() && !this.cardsManager.isCardVisible(notif.args.card));
    }
    notif_flipCard(notif) {
        this.cardsManager.updateCardInformations(notif.args.card);
    }
    notif_playCard(notif) {
        const playerId = notif.args.playerId;
        const fromDeck = notif.args.fromDeck;
        const playerTable = this.getPlayerTable(playerId);
        const currentPlayer = this.getPlayerId() == playerId;
        playerTable.played.addCard(notif.args.card, {
            fromElement: currentPlayer || fromDeck ? undefined : document.getElementById(`player-table-${playerId}-name`)
        }, { updateInformations: true, });
        if (fromDeck > 0) {
            this.tableCenter.decks[fromDeck].setCardNumber(notif.args.deckCount, notif.args.deckTopCard);
        }
        else { // from hand
            this.handCounters[playerId].incValue(-1);
        }
        this.playedCounters[playerId].incValue(1);
    }
    notif_discardedLegendCard(notif) {
        const playerId = notif.args.playerId;
        this.getPlayerTable(playerId).discardLegendCard(notif.args.card);
        this.playedCounters[playerId].incValue(-1);
    }
    notif_fall(notif) {
        const playerId = notif.args.playerId;
        const notice = document.createElement('div');
        notice.classList.add('fall-notice');
        notice.innerHTML = _('${player_name} falls!').replace('${player_name}', `<div style="color: #${this.getPlayerColor(playerId)}">${this.getPlayerName(playerId)}</div>`);
        this.animationManager.attachWithAnimation(new BgaSlideAnimation({
            element: notice,
            duration: ANIMATION_MS * 3,
            fromElement: document.getElementById('page-title'),
        }), document.getElementById(`player-table-${playerId}-played`)).then(() => {
            notice?.remove();
            this.getPlayerTable(playerId).fall(this.fallVoidStock);
            this.helmetCounters[playerId].incValue(1);
            this.setPlayerActive(playerId, false);
            this.playedCounters[playerId].toValue(0);
        });
    }
    notif_closeSequence(notif) {
        const playerId = notif.args.playerId;
        this.getPlayerTable(playerId).closeSequence(this.stopVoidStocks[playerId]);
        this.setPlayerActive(playerId, false);
        this.playedCounters[playerId].toValue(0);
        this.scoredCounters[playerId].incValue(notif.args.sequence.length);
        if (playerId == this.getPlayerId()) {
            this.setRoundPoints(playerId, notif.args.roundPoints);
        }
    }
    setRoundPoints(playerId, roundPoints = null) {
        document.getElementById(`round-points-${playerId}`).innerHTML = roundPoints ? _('You scored ${points} points this round').replace('${points}', '' + roundPoints) : '';
    }
    notif_newRound(notif) {
        this.roundCounter.toValue(notif.args.roundNumber);
        Object.keys(this.gamedatas.players).forEach(id => {
            const playerId = Number(id);
            this.setPlayerActive(playerId, true);
        });
        this.setRoundPoints(this.getPlayerId());
    }
    notif_addHelmet(notif) {
        const playerId = notif.args.playerId;
        this.getPlayerTable(playerId).addHelmet(notif.args.card);
        this.setPlayerActive(playerId, false);
        this.helmetCounters[playerId].incValue(-1);
    }
    notif_takeTrophyCard(notif) {
        const playerId = notif.args.playerId;
        const currentPlayer = this.getPlayerId() == playerId;
        if (notif.args.perfectLanding) {
            this.getPlayerTable(playerId).played.addCard(notif.args.card);
        }
        else if (currentPlayer) {
            this.getPlayerTable(playerId).hand.addCard(notif.args.card);
        }
        else {
            this.tableCenter.legendDeck.removeCard(notif.args.card);
        }
        this.tableCenter.updateLegendDeck(notif.args.newCard, notif.args.newCount);
        this.handCounters[playerId].incValue(1);
    }
    notif_discardTrophyCard(notif) {
        this.tableCenter.legendDeck.removeCard(notif.args.card);
        this.tableCenter.updateLegendDeck(notif.args.newCard, notif.args.newCount);
    }
    notif_addCardToHand(notif) {
        const playerId = notif.args.playerId;
        const currentPlayer = this.getPlayerId() == playerId;
        if (currentPlayer) {
            this.getPlayerTable(playerId).hand.addCard(notif.args.card, {
                fromElement: document.getElementById(`deck${notif.args.fromDeckNumber}`)
            });
        }
        else {
            this.stopVoidStocks[playerId].addCard(notif.args.card);
        }
        this.tableCenter.decks[notif.args.fromDeckNumber].setCardNumber(notif.args.deckCount, notif.args.deckTopCard);
        this.handCounters[playerId].incValue(1);
    }
    notif_splitDecks(notif) {
        [1, 2].forEach(deckId => {
            if (notif.args.decks[deckId].top) {
                this.tableCenter.decks[deckId].addCard(notif.args.decks[deckId].top, {
                    fromStock: notif.args.fromDeck != deckId ? this.tableCenter.decks[notif.args.fromDeck] : undefined,
                });
            }
            this.tableCenter.decks[deckId].setCardNumber(notif.args.decks[deckId].count);
        });
    }
    notif_tease(notif) {
        this.getPlayerTable(notif.args.playerId).showTease(notif.args.sentence);
    }
    setScore(playerId, column, score) {
        const cell = document.getElementById(`score${playerId}`).getElementsByTagName('td')[column];
        cell.innerHTML = `${score ?? '-'}`;
    }
    notif_detailledScore(notif) {
        log('notif_detailledScore', notif.args);
        Object.entries(notif.args.roundScores).forEach(entry => {
            const playerId = Number(entry[0]);
            entry[1].forEach((roundPoints, index) => this.setScore(playerId, index + 1, roundPoints));
            this.setScore(playerId, 5, notif.args.helmetScores[playerId]);
            let total = entry[1].filter(n => n !== null).reduce((a, b) => a + b, 0);
            total += notif.args.helmetScores[playerId];
            this.setScore(playerId, 6, total);
            this.bga.playerPanels.getScoreCounter(playerId).toValue(total);
            this.setPlayerActive(playerId, true);
        });
    }
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    bgaFormatText(log, args) {
        try {
            if (log && args && !args.processed) {
                if (args.announcement && args.announcement[0] != '<') {
                    args.announcement = `<strong style="color: darkred;">${_(args.announcement)}</strong>`;
                }
                if (args.call && args.call.length && args.call[0] != '<') {
                    args.call = `<strong class="title-bar-call">${_(args.call)}</strong>`;
                }
                ['discardNumber', 'roundPoints', 'cardsPoints', 'colorBonus', 'cardName', 'cardName1', 'cardName2', 'cardColor', 'cardColor1', 'cardColor2', 'points', 'result'].forEach(field => {
                    if (args[field] !== null && args[field] !== undefined && args[field][0] != '<') {
                        args[field] = `<strong>${_(args[field])}</strong>`;
                    }
                });
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return { log, args };
    }
}

export { Game };
