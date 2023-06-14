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
    private fallVoidStock: VoidStock<Card>;
    private stopVoidStocks: VoidStock<Card>[] = [];
    private teaseTimers: number[] = [];
    
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

        const endGame = Number(gamedatas.gamestate.id) >= 90; // score or end

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
        this.createPlayerPanels(gamedatas, endGame);
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

        this.fallVoidStock = new VoidStock<Card>(this.cardsManager, document.getElementById('overall-footer'));

        new HelpManager(this, { 
            buttons: [
                new BgaHelpPopinButton({
                    title: _("Card details").toUpperCase(),
                    html: this.getHelpHtml(),
                    buttonBackground: '#070407',
                }),
            ]
        });
        this.setupNotifications();
        this.setupPreferences();

        if (endGame) { // score or end
            this.onEnteringShowScore(true);
        }

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
            case 'pickCard':
            case 'revealDeckCard':
                this.onEnteringRevealDeckCard();
                break;
            case 'endScore':
                this.onEnteringShowScore();
                break;
        }
    }
    
    private onEnteringPlayCard() {
        if ((this as any).isCurrentPlayerActive()) {
            this.tableCenter.makeDecksSelectable(true);
            this.getCurrentPlayerTable()?.makeCardsSelectable(true);
        }
    }
    
    private onEnteringRevealDeckCard() {
        if ((this as any).isCurrentPlayerActive()) {
            this.tableCenter.makeDecksSelectable(true);
        }
    }

    onEnteringShowScore(fromReload: boolean = false) {
        document.getElementById('score').style.display = 'flex';

        const headers = document.getElementById('scoretr');
        if (!headers.childElementCount) {
            let html = `
                <th></th>`;
            [1, 2, 3, 4].forEach(i => {
                html += `
                    <th id="th-round${i}-score" class="round-score">${_("Round ${number}").replace('${number}', i)}</th>
                `;
            });
            html += `
                <th id="th-end-score" class="end-score">${_("Final score")}</th>
            `;
            dojo.place(html, headers);
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
                <td id="end-score${player.id}" class="total">${player.score ?? ''}</td>
            </tr>
            `;
            dojo.place(html, 'score-table-body');
        });
    }

    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

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

    private onLeavingPlayCard() {
        this.tableCenter.makeDecksSelectable(false);
        this.getCurrentPlayerTable()?.makeCardsSelectable(false);
    }

    private onLeavingRevealDeckCard() {
        this.tableCenter.makeDecksSelectable(false);
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

    private createPlayerPanels(gamedatas: SkateLegendGamedatas, endGame: boolean) {

        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);  
             

            // hand + scored cards counter + helmets counter
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
            </div>
            <div class="counters">
                <div id="player-helmets-counter-wrapper-${player.id}" class="player-helmets-counter">
                    <div class="player-helmets"></div> 
                    <span id="player-helmets-counter-${player.id}"></span>
                </div>
            </div>
            <div id="tease-${player.id}-wrapper" class="tease-wrapper">            
                <div class="bubble-wrapper">
                    <div id="player-${player.id}-discussion-bubble" class="discussion_bubble" data-visible="false"></div>
                </div>
            </div>
            <div id="round-points-${player.id}"></div>
            `, `player_board_${player.id}`);

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
                document.getElementById(`tease-${player.id}-wrapper`).insertAdjacentHTML('beforeend', `         
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
                    });

                if (player.roundPoints) {
                    this.setRoundPoints(playerId, player.roundPoints);
                }
            }

            this.stopVoidStocks[playerId] = new VoidStock<Card>(this.cardsManager, document.getElementById(`scored-counter-${playerId}`));

        });

        this.setTooltipToClass('playerhand-counter', _('Cards in hand'));
        this.setTooltipToClass('played-counter', _('Size of the current sequence'));
        this.setTooltipToClass('scored-counter', _('Number of scored cards'));
        this.setTooltipToClass('player-helmets-counter', _('Number of helmets'));
    }

    public showTease(playerId: number, sentence: string) {
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

    private getHelpHtml() {
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

    public tease(sentence: number) {
        this.takeNoLockAction('tease', {
            sentence
        });
    }

    public takeAction(action: string, data?: any) {
        data = data || {};
        data.lock = true;
        (this as any).ajaxcall(`/skatelegend/skatelegend/${action}.html`, data, this, () => {});
    }

    public takeNoLockAction(action: string, data?: any) {
        data = data || {};
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
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });

        (this as any).notifqueue.setIgnoreNotificationCheck('addCardToHand', (notif: Notif<NotifAddCardToHandArgs>) => 
            notif.args.playerId == this.getPlayerId() && !this.cardsManager.isCardVisible(notif.args.card)
        );
    }

    notif_flipCard(notif: Notif<NotifFlipTopDeckArgs>) {
        this.cardsManager.updateCardInformations(notif.args.card);
    }

    notif_playCard(notif: Notif<NotifPlayCardArgs>) {
        const playerId = notif.args.playerId;
        const fromDeck = notif.args.fromDeck;
        const playerTable = this.getPlayerTable(playerId);
        const currentPlayer = this.getPlayerId() == playerId;
        playerTable.played.addCard(notif.args.card, {
            fromElement: currentPlayer || fromDeck ? undefined : document.getElementById(`player-table-${playerId}-name`)
        }, { updateInformations: true, });
        if (fromDeck > 0) {
            this.tableCenter.decks[fromDeck].setCardNumber(notif.args.deckCount, notif.args.deckTopCard);
        } else { // from hand
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

        const notice = document.createElement('div');
        notice.classList.add('fall-notice');
        notice.innerHTML = _('${player_name} falls!').replace('${player_name}', `<div style="color: #${this.getPlayerColor(playerId)}">${this.getPlayerName(playerId)}</div>`)

        this.animationManager.attachWithAnimation(
            new BgaSlideAnimation({
                element: notice,
                duration: ANIMATION_MS * 3,
                fromElement: document.getElementById('page-title'),
            }), 
            document.getElementById(`player-table-${playerId}-played`),
        ).then(() => {
            notice?.remove();
            this.getPlayerTable(playerId).fall(this.fallVoidStock);
            this.helmetCounters[playerId].incValue(1);
            this.setPlayerActive(playerId, false);
            this.playedCounters[playerId].toValue(0);
        });
    }

    notif_closeSequence(notif: Notif<NotifCloseSequenceArgs>) {
        const playerId = notif.args.playerId;
        this.getPlayerTable(playerId).closeSequence(this.stopVoidStocks[playerId]);
        this.setPlayerActive(playerId, false);
        this.playedCounters[playerId].toValue(0);
        this.scoredCounters[playerId].incValue(notif.args.sequence.length);

        if (playerId == this.getPlayerId()) {
            this.setRoundPoints(playerId, notif.args.roundPoints);
        }
    }
    
    private setRoundPoints(playerId: number, roundPoints: number | null = null) {
        document.getElementById(`round-points-${playerId}`).innerHTML = roundPoints ? _('You scored ${points} points this round').replace('${points}', roundPoints) : '';
    }

    notif_newRound(notif: Notif<NotifNewRoundArgs>) {
        this.roundCounter.toValue(notif.args.roundNumber);
        Object.keys(this.gamedatas.players).forEach(id => {
            const playerId = Number(id);
            this.setPlayerActive(playerId, true);
        });
        this.setRoundPoints(this.getPlayerId());
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
        if (notif.args.perfectLanding) {
            this.getPlayerTable(playerId).played.addCard(notif.args.card);
        } else if (currentPlayer) {
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
            this.stopVoidStocks[playerId].addCard(notif.args.card);
        }
        this.tableCenter.decks[notif.args.fromDeckNumber].setCardNumber(notif.args.deckCount, notif.args.deckTopCard);

        this.handCounters[playerId].incValue(1);
    }

    notif_splitDecks(notif: Notif<NotifSplitDecksArgs>) {
        [1, 2].forEach(deckId => {
            if (notif.args.decks[deckId].top) {
                this.tableCenter.decks[deckId].addCard(notif.args.decks[deckId].top, {
                    fromStock: notif.args.fromDeck != deckId ? this.tableCenter.decks[notif.args.fromDeck] : undefined,
                });
            }
            this.tableCenter.decks[deckId].setCardNumber(notif.args.decks[deckId].count);
        });
    }

    notif_tease(notif: Notif<NotifTeaseArgs>) {
        this.showTease(notif.args.playerId, notif.args.sentence);
    }
    
    private setScore(playerId: number | string, column: number, score: number) { // column 1 for first round ... 5 for final score
        const cell = (document.getElementById(`score${playerId}`).getElementsByTagName('td')[column] as HTMLTableDataCellElement);
        cell.innerHTML = `${score ?? '-'}`;
    }

    notif_detailledScore(notif: Notif<NotifDetailledScoreArgs>) {
        log('notif_detailledScore', notif.args);

        Object.entries(notif.args.roundScores).forEach(entry => {
            const playerId = Number(entry[0]);
            entry[1].forEach((roundPoints, index) => this.setScore(playerId, index + 1, roundPoints));
            const total = entry[1].filter(n => n !== null).reduce((a, b) => a + b, 0);
            this.setScore(playerId, 5, total);
            (this as any).scoreCtrl[playerId]?.toValue(total);
            this.setPlayerActive(playerId, true);
        });
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