declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

const ANIMATION_MS = 500;
const ACTION_TIMER_DURATION = 5;

const LOCAL_STORAGE_ZOOM_KEY = 'SkateLegend-zoom';
const LOCAL_STORAGE_JUMP_TO_FOLDED_KEY = 'SkateLegend-jump-to-folded';

class SkateLegend implements SkateLegendGame {
    public animationManager: AnimationManager;
    public cardsManager: CardsManager;

    private zoomManager: ZoomManager;
    private gamedatas: SkateLegendGamedatas;
    private tableCenter: TableCenter;
    private playersTables: PlayerTable[] = [];
    private handCounters: Counter[] = [];
    private playedCounters: Counter[] = [];
    private scoredCounters: Counter[] = [];
    private helmetCounters: Counter[] = [];
    private roundCounter: Counter;
    
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

        this.animationManager = new AnimationManager(this);
        this.cardsManager = new CardsManager(this);
        new JumpToManager(this, {
            localStorageFoldedKey: LOCAL_STORAGE_JUMP_TO_FOLDED_KEY,
            topEntries: [
                new JumpToEntry(_('Decks & reward'), 'table-center', { color: 'black' })
            ],
            entryClasses: 'round-point',
        });
        this.tableCenter = new TableCenter(this, gamedatas);
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

        document.getElementById(`round-counter`).insertAdjacentHTML('beforebegin', _("Round number:") + ' ');
        this.roundCounter = new ebg.counter();
        this.roundCounter.create(`round-counter`);
        this.roundCounter.setValue(gamedatas.roundNumber);

        this.setupNotifications();
        this.setupPreferences();
        this.addHelp();

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
            case 'playCard':
                this.onEnteringPlayCard();
                break;
        }
    }
    
    private onEnteringPlayCard() {
        if ((this as any).isCurrentPlayerActive()) {
            this.tableCenter.makeDecksSelectable(true);
            this.getCurrentPlayerTable()?.makeCardsSelectable(true);
        }
    }

    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

        switch (stateName) {
           case 'playCard':
                this.onLeavingPlayCard();
                break;
        }
    }

    private onLeavingPlayCard() {
        this.tableCenter.makeDecksSelectable(false);
        this.getCurrentPlayerTable()?.makeCardsSelectable(false);
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
                    if (!chooseContinueArgs.canStop) {
                        document.getElementById(`stop_button`).classList.add('disabled');
                    }
                    break;
                case 'playHelmet':
                    (this as any).addActionButton(`playHelmet_button`, _("Add helmet on last card"), () => this.playHelmet());
                    (this as any).addActionButton(`skipHelmet_button`, _("Skip"), () => this.skipHelmet());
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

    public getPlayerName(playerId: number): string {
        return this.gamedatas.players[playerId].name;
    }

    public getPlayerColor(playerId: number): string {
        return this.gamedatas.players[playerId].color;
    }

    private getPlayerTable(playerId: number): PlayerTable {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }

    private getCurrentPlayerTable(): PlayerTable | null {
        return this.playersTables.find(playerTable => playerTable.playerId === this.getPlayerId());
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
             

            // hand + scored cards counter
            dojo.place(`<div class="counters">
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
            </div>`, `player_board_${player.id}`);

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

            // helmets counter
            dojo.place(`<div class="counters">
                <div id="player-helmets-counter-wrapper-${player.id}" class="player-helmets-counter">
                    <div class="player-helmets"></div> 
                    <span id="player-helmets-counter-${player.id}"></span>
                </div>
            </div>`, `player_board_${player.id}`);

            const helmetCounter = new ebg.counter();
            helmetCounter.create(`player-helmets-counter-${playerId}`);
            helmetCounter.setValue(player.helmets);
            this.helmetCounters[playerId] = helmetCounter;

            this.setPlayerActive(playerId, player.active);
        });

        this.setTooltipToClass('player-helmets-counter', _('Number of helmets'));
    }
    
    public setPlayerActive(playerId: number, active: boolean): void {
        document.getElementById(`overall_player_board_${playerId}`).classList.toggle('inactive', !active);
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

    private addHelp() {
        dojo.place(`
            <button id="skatelegend-help-button">?</button>
        `, 'left-side');
        document.getElementById('skatelegend-help-button').addEventListener('click', () => this.showHelp());
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
    
    public onDeckClick(number: number): void {
        if (this.gamedatas.gamestate.name == 'pickCard') {
            this.pickCard(number);
        } else if (this.gamedatas.gamestate.name == 'revealDeckCard') {
            this.revealTopDeckCard(number);
        } else {
            this.playCardFromDeck(number);
        }
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
            return;
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
  	
    public pickCard(number: number) {
        if(!(this as any).checkAction('pickCard')) {
            return;
        }

        this.takeAction('pickCard', {
            number
        });
    }
  	
    public revealTopDeckCard(number: number) {
        if(!(this as any).checkAction('revealTopDeckCard')) {
            return;
        }

        this.takeAction('revealTopDeckCard', {
            number
        });
    }

    public playHelmet() {
        if(!(this as any).checkAction('playHelmet')) {
            return;
        }

        this.takeAction('playHelmet');
    }

    public skipHelmet() {
        if(!(this as any).checkAction('skipHelmet')) {
            return;
        }

        this.takeAction('skipHelmet');
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
            ['flipTopDeck', ANIMATION_MS],
            ['playCard', ANIMATION_MS],
            ['discardedLegendCard', ANIMATION_MS],
            ['fall', ANIMATION_MS],
            ['closeSequence', ANIMATION_MS],
            ['newRound', ANIMATION_MS],
            ['addHelmet', ANIMATION_MS],
            ['takeTrophyCard', ANIMATION_MS],
            ['discardTrophyCard', ANIMATION_MS],
            ['addCardToHand', ANIMATION_MS],
        ];
    
        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });

        /*(this as any).notifqueue.setIgnoreNotificationCheck('cardInHandFromPick', (notif: Notif<NotifCardInHandFromPickArgs>) => 
            notif.args.playerId == this.getPlayerId() && !notif.args.card.category
        );*/
    }

    notif_flipTopDeck(notif: Notif<NotifFlipTopDeckArgs>) {
        this.tableCenter.flipTopDeck(notif.args.deckId, notif.args.card);
    }

    notif_playCard(notif: Notif<NotifPlayCardArgs>) {
        const playerId = notif.args.playerId;
        const fromDeck = notif.args.fromDeck;
        const playerTable = this.getPlayerTable(playerId);
        const currentPlayer = this.getPlayerId() == playerId;
        playerTable.played.addCard(notif.args.card, {
            fromElement: currentPlayer || fromDeck ? undefined : document.getElementById(`player-table-${playerId}-name`)
        });
        if (!fromDeck) { // from hand
            this.handCounters[playerId].incValue(-1);
        }
        this.playedCounters[playerId].incValue(1);
    }

    notif_discardedLegendCard(notif: Notif<NotifDiscardedLegendCardArgs>) {
        const playerId = notif.args.playerId;
        this.getPlayerTable(playerId).discardLegendCard(notif.args.card);
        this.playedCounters[playerId].incValue(-1);
    }

    notif_fall(notif: Notif<NotifFallArgs>) {
        const playerId = notif.args.playerId;
        this.getPlayerTable(playerId).fall();
        this.helmetCounters[playerId].incValue(1);
        this.setPlayerActive(playerId, false);
        this.playedCounters[playerId].toValue(0);
    }

    notif_closeSequence(notif: Notif<NotifCloseSequenceArgs>) {
        const playerId = notif.args.playerId;
        this.getPlayerTable(playerId).closeSequence();
        this.setPlayerActive(playerId, false);
        this.playedCounters[playerId].toValue(0);
        this.scoredCounters[playerId].incValue(notif.args.sequence.length);
    }

    notif_newRound(notif: Notif<NotifNewRoundArgs>) {
        this.roundCounter.toValue(notif.args.roundNumber);
        Object.keys(this.gamedatas.players).forEach(id => {
            const playerId = Number(id);
            this.setPlayerActive(playerId, true);
        });
    }

    notif_addHelmet(notif: Notif<NotifAddHelmetArgs>) {
        const playerId = notif.args.playerId;
        this.getPlayerTable(playerId).addHelmet(notif.args.card);
        this.setPlayerActive(playerId, false);
        this.helmetCounters[playerId].incValue(-1);
    }

    notif_takeTrophyCard(notif: Notif<NotifTakeTrophyCardArgs>) {
        const playerId = notif.args.playerId;
        const currentPlayer = this.getPlayerId() == playerId;
        if (currentPlayer && !notif.args.perfectLanding) {
            this.getPlayerTable(playerId).hand.addCard(notif.args.card);
        } else {
            this.tableCenter.legendDeck.removeCard(notif.args.card);
        }
        this.tableCenter.updateLegendDeck(notif.args.newCard, notif.args.newCount);
        this.handCounters[playerId].incValue(1);
    }

    notif_discardTrophyCard(notif: Notif<NotifTakeTrophyCardArgs>) {
        this.tableCenter.legendDeck.removeCard(notif.args.card);
        this.tableCenter.updateLegendDeck(notif.args.newCard, notif.args.newCount);
    }

    notif_addCardToHand(notif: Notif<NotifAddCardToHandArgs>) {
        const playerId = notif.args.playerId;
        const currentPlayer = this.getPlayerId() == playerId;
        if (currentPlayer) {
            this.getPlayerTable(playerId).hand.addCard(notif.args.card, {
                fromElement: document.getElementById(`deck${notif.args.fromDeckNumber}`)
            });
        } else {
            // TODO if card is visible, make it invisible
        }
        this.handCounters[playerId].incValue(1);
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