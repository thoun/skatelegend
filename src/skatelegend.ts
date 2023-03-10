declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

const ANIMATION_MS = 500;
const ACTION_TIMER_DURATION = 5;

const LOCAL_STORAGE_ZOOM_KEY = 'SkateLegend-zoom';

class SkateLegend implements SkateLegendGame {
    public cardsManager: CardsManager;

    private zoomManager: ZoomManager;
    private gamedatas: SkateLegendGamedatas;
    private playersTables: PlayerTable[] = [];
    private selectedCards: number[];
    private helmetCounters: Counter[] = [];
    private roundNumberCounter: Counter;
    
    private TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;

    constructor() {
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

    public setup(gamedatas: SkateLegendGamedatas) {
        log( "Starting game setup" );
        
        this.gamedatas = gamedatas;

        log('gamedatas', gamedatas);

        //this.cards = new Cards(this);
        //this.stacks = new Stacks(this, this.gamedatas);
        this.createPlayerPanels(gamedatas);
        this.createPlayerTables(gamedatas);

        
        this.zoomManager = new ZoomManager({
            element: document.getElementById('table'),
            smooth: false,
            localStorageZoomKey: LOCAL_STORAGE_ZOOM_KEY,
            /*autoZoom: {
                expectedWidth: this.factories.getWidth(),
            },*/
            // onDimensionsChange: (newZoom) => this.onTableCenterSizeChange(newZoom),
        });

        this.roundNumberCounter = new ebg.counter();
        this.roundNumberCounter.create(`round-number-counter`);
        this.roundNumberCounter.setValue(this.gamedatas.roundNumber);

        this.setupNotifications();
        this.setupPreferences();
        this.addHelp();

        (this as any).onScreenWidthChange = () => {
            this.updateTableHeight();
            this.onTableCenterSizeChange();
        };

        log( "Ending game setup" );
    }

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    public onEnteringState(stateName: string, args: any) {
        log('Entering state: ' + stateName, args.args);

        switch (stateName) {
            case 'takeCards':
                this.onEnteringTakeCards(args);
                break;
            /*case 'chooseCard':
                this.onEnteringChooseCard(args.args);
                break;
            case 'putDiscardPile':
                this.onEnteringPutDiscardPile(args.args);
                break;
            case 'playCards':
                this.onEnteringPlayCards();
                break;
            case 'chooseDiscardPile':
                this.onEnteringChooseDiscardPile();
                break;
            case 'chooseDiscardCard':
                this.onEnteringChooseDiscardCard(args.args);
                break;
            case 'chooseOpponent':
                this.onEnteringChooseOpponent(args.args);
                break;*/
        }
    }
    
    private setGamestateDescription(property: string = '') {
        const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = `${originalState['description' + property]}`; 
        this.gamedatas.gamestate.descriptionmyturn = `${originalState['descriptionmyturn' + property]}`;
        (this as any).updatePageTitle();
    }
    
    private onEnteringTakeCards(argsRoot: { args: EnteringChooseContinueArgs, active_player: string }) {
        const args = argsRoot.args;

        /*if (!args.canTakeFromDiscard.length) {
            this.setGamestateDescription('NoDiscard');
        }*/

        if ((this as any).isCurrentPlayerActive()) {
            //this.stacks.makeDeckSelectable(args.canTakeFromDeck);
            //this.stacks.makeDiscardSelectable(true);
        }
    }
    
    /*private onEnteringChooseCard(args: EnteringChooseCardArgs) {
        this.stacks.showPickCards(true, args._private?.cards ?? args.cards);
        if ((this as any).isCurrentPlayerActive()) {
            setTimeout(() => this.stacks.makePickSelectable(true), 500);
        } else {
            this.stacks.makePickSelectable(false);
        }        
        this.stacks.setDeckCount(args.remainingCardsInDeck);
    }
    
    private onEnteringPutDiscardPile(args: EnteringChooseCardArgs) {
        this.stacks.showPickCards(true, args._private?.cards ?? args.cards);
        this.stacks.makeDiscardSelectable((this as any).isCurrentPlayerActive());
    }

    private onEnteringPlayCards() {
        this.stacks.showPickCards(false);
        this.selectedCards = [];

        this.updateDisabledPlayCards();
    }
    
    private onEnteringChooseDiscardPile() {
        this.stacks.makeDiscardSelectable((this as any).isCurrentPlayerActive());
    }
    
    private onEnteringChooseDiscardCard(args: EnteringChooseCardArgs) {
        const cards = args._private?.cards || args.cards;
        const pickDiv = document.getElementById('discard-pick');
        pickDiv.innerHTML = '';
        pickDiv.dataset.visible = 'true';

        cards?.forEach(card => {
            this.cards.createMoveOrUpdateCard(card, `discard-pick`, false, 'discard'+args.discardNumber);
            if ((this as any).isCurrentPlayerActive()) {
                document.getElementById(`card-${card.id}`).classList.add('selectable');
            }
        });

        this.updateTableHeight();
    }
    
    private onEnteringChooseOpponent(args: EnteringChooseOpponentArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            args.playersIds.forEach(playerId => 
                document.getElementById(`player-table-${playerId}-hand-cards`).dataset.canSteal = 'true'
            );
        }
    }*/

    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

        switch (stateName) {
           /* case 'takeCards':
                this.onLeavingTakeCards();
                break;
            case 'chooseCard':
                this.onLeavingChooseCard();
                break;
            case 'putDiscardPile':
                this.onLeavingPutDiscardPile();
                break;
            case 'playCards':
                this.onLeavingPlayCards();
                break;
            case 'chooseDiscardCard':
                this.onLeavingChooseDiscardCard();
                break;*/
            case 'chooseOpponent':
                this.onLeavingChooseOpponent();
                break;
        }
    }

   /* private onLeavingTakeCards() {
        this.stacks.makeDeckSelectable(false);
        this.stacks.makeDiscardSelectable(false);
    }
    
    private onLeavingChooseCard() {
        this.stacks.makePickSelectable(false);
    }

    private onLeavingPutDiscardPile() {
        this.stacks.makeDiscardSelectable(false);
    }

    private onLeavingPlayCards() {
        this.selectedCards = null;
        this.getCurrentPlayerTable()?.setSelectable(false);
    }

    private onLeavingChooseDiscardCard() {
        const pickDiv = document.getElementById('discard-pick');
        pickDiv.dataset.visible = 'false';
        this.updateTableHeight();
    }*/

    private onLeavingChooseOpponent() {
        (Array.from(document.querySelectorAll('[data-can-steal]')) as HTMLElement[]).forEach(elem => elem.dataset.canSteal = 'false');
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        if ((this as any).isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseContinue':
                    const chooseContinueArgs = args as EnteringChooseContinueArgs;
                    (this as any).addActionButton(`continue_button`, _("Continue"), () => this.continue());
                    (this as any).addActionButton(`stop_button`, _("Stop"), () => this.stop(chooseContinueArgs.shouldNotStop));
                    break;
            }
        }
    }

    ///////////////////////////////////////////////////
    //// Utility methods


    ///////////////////////////////////////////////////

    public setTooltip(id: string, html: string) {
        (this as any).addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    }
    public setTooltipToClass(className: string, html: string) {
        (this as any).addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    }

    public getPlayerId(): number {
        return Number((this as any).player_id);
    }

    public getPlayerColor(playerId: number): string {
        return this.gamedatas.players[playerId].color;
    }

    private getPlayer(playerId: number): SkateLegendPlayer {
        return Object.values(this.gamedatas.players).find(player => Number(player.id) == playerId);
    }

    private getPlayerTable(playerId: number): PlayerTable {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }

    private getCurrentPlayerTable(): PlayerTable | null {
        return this.playersTables.find(playerTable => playerTable.playerId === this.getPlayerId());
    }

    public updateTableHeight() {
        // setTimeout(() => document.getElementById('zoom-wrapper').style.height = `${document.getElementById('full-table').getBoundingClientRect().height}px`, 600);
    }

    private onTableCenterSizeChange() {
        /*const maxWidth = document.getElementById('full-table').clientWidth;
        const tableCenterWidth = document.getElementById('table-center').clientWidth + 20;
        const playerTableWidth = 650 + 20;
        const tablesMaxWidth = maxWidth - tableCenterWidth;
     
        let width = 'unset';
        if (tablesMaxWidth < playerTableWidth * this.gamedatas.playerorder.length) {
            const reduced = (Math.floor(tablesMaxWidth / playerTableWidth) * playerTableWidth);
            if (reduced > 0) {
                width = `${reduced}px`;
            }
        }
        document.getElementById('tables').style.width = width;*/
    }

    private setupPreferences() {
        // Extract the ID and value from the UI control
        const onchange = (e) => {
          var match = e.target.id.match(/^preference_[cf]ontrol_(\d+)$/);
          if (!match) {
            return;
          }
          var prefId = +match[1];
          var prefValue = +e.target.value;
          (this as any).prefs[prefId].value = prefValue;
        }
        
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        
        // Call onPreferenceChange() now
        dojo.forEach(
          dojo.query("#ingame_menu_content .preference_control"),
          el => onchange({ target: el })
        );
    }

    private getOrderedPlayers(gamedatas: SkateLegendGamedatas) {
        const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
        const playerIndex = players.findIndex(player => Number(player.id) === Number((this as any).player_id));
        const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;
        return orderedPlayers;
    }

    private createPlayerPanels(gamedatas: SkateLegendGamedatas) {

        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);   

            // hand cards counter
            dojo.place(`<div class="counters">
                <div id="player-helmets-counter-wrapper-${player.id}" class="player-helmets-counter">
                    <div class="player-hand-card"></div> 
                    <span id="player-helmets-counter-${player.id}"></span>
                </div>
            </div>`, `player_board_${player.id}`);

            const helmetCounter = new ebg.counter();
            helmetCounter.create(`player-helmets-counter-${playerId}`);
            helmetCounter.setValue(player.helmets);
            this.helmetCounters[playerId] = helmetCounter;
        });

        this.setTooltipToClass('player-helmets-counter', _('Number of helmets'));
    }

    private createPlayerTables(gamedatas: SkateLegendGamedatas) {
        const orderedPlayers = this.getOrderedPlayers(gamedatas);

        orderedPlayers.forEach(player => 
            this.createPlayerTable(gamedatas, Number(player.id))
        );
    }

    private createPlayerTable(gamedatas: SkateLegendGamedatas, playerId: number) {
        const table = new PlayerTable(this, gamedatas.players[playerId]);
        this.playersTables.push(table);
    }

    private updateDisabledPlayCards() {
        this.getCurrentPlayerTable()?.updateDisabledPlayCards(this.selectedCards, this.gamedatas.gamestate.args.playableDuoCards);        
        document.getElementById(`playCards_button`)?.classList.toggle(`disabled`, this.selectedCards.length != 2);
    }
    
    public onCardClick(card: Card): void {
        const cardDiv = document.getElementById(`card-${card.id}`);
        const parentDiv = cardDiv.parentElement;

        if (cardDiv.classList.contains('disabled')) {
            return;
        }

        /*switch (this.gamedatas.gamestate.name) {
            case 'takeCards':
                if (parentDiv.dataset.discard) {
                    this.takeCardFromDiscard(Number(parentDiv.dataset.discard));
                }
                break;
            case 'chooseCard':
                if (parentDiv.id == 'pick') {
                    this.chooseCard(card.id);
                }
                break;
            case 'playCards':
                if (parentDiv.dataset.myHand == `true`) {
                    if (this.selectedCards.includes(card.id)) {
                        this.selectedCards.splice(this.selectedCards.indexOf(card.id), 1);
                        cardDiv.classList.remove('selected');
                    } else {
                        this.selectedCards.push(card.id);
                        cardDiv.classList.add('selected');
                    }
                    this.updateDisabledPlayCards();
                }
                break;
            case 'chooseDiscardCard':
                if (parentDiv.id == 'discard-pick') {
                    this.chooseDiscardCard(card.id);
                }
                break;
            case 'chooseOpponent':
                const chooseOpponentArgs = this.gamedatas.gamestate.args as EnteringChooseContinueArgs;
                if (parentDiv.dataset.currentPlayer == 'false') {
                    const stealPlayerId = Number(parentDiv.dataset.playerId);
                    if (chooseOpponentArgs.playersIds.includes(stealPlayerId)) {
                        this.chooseOpponent(stealPlayerId);
                    }
                }
                break;
        }*/
    }

    private addHelp() {
        let labels = [
            _('Dark blue'),
            _('Light blue'),
            _('Black'),
            _('Yellow'),
            _('Green'),
            _('White'),
            _('Purple'),
            _('Gray'),
            _('Light orange'),
            _('Pink'),
            _('Orange'),
        ].map((label, index) => `<span class="label" data-row="${Math.floor(index / 2)}"  data-column="${Math.floor(index % 2)}">${label}</span>`).join('');
        dojo.place(`
            <button id="skatelegend-help-button">?</button>
            <button id="color-help-button" data-folded="true">${labels}</button>
        `, 'left-side');
        document.getElementById('skatelegend-help-button').addEventListener('click', () => this.showHelp());
        const helpButton = document.getElementById('color-help-button');
        helpButton.addEventListener('click', () => helpButton.dataset.folded = helpButton.dataset.folded == 'true' ? 'false' : 'true');
    }

    private showHelp() {
        const helpDialog = new ebg.popindialog();
        helpDialog.create('skatelegendHelpDialog');
        helpDialog.setTitle(_("Card details").toUpperCase());

        /*const duoCards = [1, 2, 3].map(family => `
        <div class="help-section">
            <div id="help-pair-${family}"></div>
            <div>${this.cards.getTooltip(2, family)}</div>
        </div>
        `).join('');

        const duoSection = `
        ${duoCards}
        <div class="help-section">
            <div id="help-pair-4"></div>
            <div id="help-pair-5"></div>
            <div>${this.cards.getTooltip(2, 4)}</div>
        </div>
        ${_("Note: The points for duo cards count whether the cards have been played or not. However, the effect is only applied when the player places the two cards in front of them.")}`;

        const mermaidSection = `
        <div class="help-section">
            <div id="help-mermaid"></div>
            <div>${this.cards.getTooltip(1)}</div>
        </div>`;

        const collectorSection = [1, 2, 3, 4].map(family => `
        <div class="help-section">
            <div id="help-collector-${family}"></div>
            <div>${this.cards.getTooltip(3, family)}</div>
        </div>
        `).join('');

        const multiplierSection = [1, 2, 3, 4].map(family => `
        <div class="help-section">
            <div id="help-multiplier-${family}"></div>
            <div>${this.cards.getTooltip(4, family)}</div>
        </div>
        `).join('');
        
        let html = `
        <div id="help-popin">
            ${_("<strong>Important:</strong> When it is said that the player counts or scores the points on their cards, it means both those in their hand and those in front of them.")}

            <h1>${_("Duo cards")}</h1>
            ${duoSection}
            <h1>${_("Mermaid cards")}</h1>
            ${mermaidSection}
            <h1>${_("Collector cards")}</h1>
            ${collectorSection}
            <h1>${_("Point Multiplier cards")}</h1>
            ${multiplierSection}
        </div>
        `;
        
        // Show the dialog
        helpDialog.setContent(html);

        helpDialog.show();

        // pair
        [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]].forEach(([family, color]) => this.cards.createMoveOrUpdateCard({id: 1020 + family, category: 2, family, color, index: 0 } as any, `help-pair-${family}`));
        // mermaid
        this.cards.createMoveOrUpdateCard({id: 1010, category: 1 } as any, `help-mermaid`);
        // collector
        [[1, 1], [2, 2], [3, 6], [4, 9]].forEach(([family, color]) => this.cards.createMoveOrUpdateCard({id: 1030 + family, category: 3, family, color, index: 0 } as any, `help-collector-${family}`));
        // multiplier
        [1, 2, 3, 4].forEach(family => this.cards.createMoveOrUpdateCard({id: 1040 + family, category: 4, family } as any, `help-multiplier-${family}`));*/
    }

    public continue() {
        if(!(this as any).checkAction('continue')) {
            return;
        }

        this.takeAction('continue');
    }

    public stop(warning: boolean) {
        if(!(this as any).checkAction('stop')) {
            return;
        }

        if (warning) {
            (this as any).confirmationDialog(
                _("Are you sure you want to stop here? There is no risk if you continue the sequence."), 
                () => this.stop(false)
            );
        }

        this.takeAction('stop');
    }
  	
    public playCardFromHand(id: number) {
        if(!(this as any).checkAction('playCardFromHand')) {
            return;
        }

        this.takeAction('playCardFromHand', {
            id
        });
    }
  	
    public playCardFromDeck(number: number) {
        if(!(this as any).checkAction('playCardFromDeck')) {
            return;
        }

        this.takeAction('playCardFromDeck', {
            number
        });
    }

    public takeAction(action: string, data?: any) {
        data = data || {};
        data.lock = true;
        (this as any).ajaxcall(`/skatelegend/skatelegend/${action}.html`, data, this, () => {});
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
            ['cardInDiscardFromDeck', ANIMATION_MS],
            ['cardInHandFromDiscard', ANIMATION_MS],
            ['cardInHandFromDiscardCrab', ANIMATION_MS],
            ['cardInHandFromPick', ANIMATION_MS],
            ['cardInHandFromDeck', ANIMATION_MS],
            ['cardInDiscardFromPick', ANIMATION_MS],
            ['playCards', ANIMATION_MS],
            ['stealCard', ANIMATION_MS],
            ['revealHand', ANIMATION_MS * 2],
            ['announceEndRound', ANIMATION_MS * 2],
            ['betResult', ANIMATION_MS * 2],
            ['endRound', ANIMATION_MS * 2],
            ['score', ANIMATION_MS * 3],
            ['newRound', 1],
            ['updateCardsPoints', 1],
            ['emptyDeck', 1],
        ];
    
        /*notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });

        (this as any).notifqueue.setIgnoreNotificationCheck('cardInHandFromPick', (notif: Notif<NotifCardInHandFromPickArgs>) => 
            notif.args.playerId == this.getPlayerId() && !notif.args.card.category
        );
        (this as any).notifqueue.setIgnoreNotificationCheck('cardInHandFromDeck', (notif: Notif<NotifCardInHandFromPickArgs>) => 
            notif.args.playerId == this.getPlayerId() && !notif.args.card.category
        );
        (this as any).notifqueue.setIgnoreNotificationCheck('cardInHandFromDiscardCrab', (notif: Notif<NotifCardInHandFromDiscardArgs>) => 
            notif.args.playerId == this.getPlayerId() && !notif.args.card.category
        );
        (this as any).notifqueue.setIgnoreNotificationCheck('stealCard', (notif: Notif<NotifStealCardArgs>) => 
            [notif.args.playerId, notif.args.opponentId].includes(this.getPlayerId()) && !(notif.args as any).cardName
        );*/
    }

    notif_betResult(notif: Notif<NotifBetResultArgs>) {
        //this.getPlayerTable(notif.args.playerId).showAnnouncementBetResult(notif.args.result);
    }


    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
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
                })

            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}