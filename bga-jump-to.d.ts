declare namespace BgaJumpTo {
    interface JumpToEntrySettings {
        /**
         * The border color. Usually, the player color, or the main color of the board.
         */
        color?: string;
        /**
         * Background image. Usually, the player avatar, or the image of the board.
         */
        backgroundImage?: string;
        /**
         * Background size, default contain.
         */
        backgroundSize?: string;
        /**
         * Background position, default center center.
         */
        backgroundPosition?: string;
        /**
         * Background repeat, default no-repeat.
         */
        backgroundRepeat?: string;
        /**
         * Classes to add to the element.
         */
        classes?: string;
        /**
         * add an id to the element.
         */
        id?: string;
        /**
         * Add HTML inside the element.
         */
        html?: string;
    }
    /**
     * Jump to entry.
     */
    class Entry {
        /**
         * Label shown on the entry. For players, it's player name.
         */
        label: string;
        /**
         * HTML Element or its id, to scroll into view when clicked.
         */
        target: string | HTMLElement;
        /**
         * Settings to customize the link.
         * Recommended to set are color and backgroundImage.
         */
        settings?: JumpToEntrySettings;
        constructor(
        /**
         * Label shown on the entry. For players, it's player name.
         */
        label: string,
        /**
         * HTML Element or its id, to scroll into view when clicked.
         */
        target: string | HTMLElement,
        /**
         * Settings to customize the link.
         * Recommended to set are color and backgroundImage.
         */
        settings?: JumpToEntrySettings);
    }
    interface BgaPlayerEntriesSettings {
        /**
         * The player ids, ordered. If unset, it will use `bga.gameui.gamedatas.playerorder`.
         */
        playerOrder?: number[];
        /**
         * Return the target, based on playerId/player.
         * Default is `player-table-${playerId}`
         */
        entryTarget?: (playerId: number, player: Player) => string | HTMLElement;
        /**
         * Return the entry settings, based on playerId/player.
         * Default is player color and player avatar as backgroundImage.
         * Defining this function will not replace all the settings object but complete/override it, so you can set only a value and the default one will still be set or be overriden.
         */
        entrySettings?: (playerId: number, player: Player) => JumpToEntrySettings;
    }
    /**
     * Map the players in `bga.gameui.gamedatas.players` to JumpToEntry, sorted by player order.
     *
     * By default, target is `player-table-${playerId}`, and entry setting is the player color and player avatar as backgroundImage.
     *
     * @param bga the Bga object (usually accessible on the Game class by `this.bga`)
     * @param settings the optional settings to customize the mapping
     * @returns an array of entries matchings the players at the table
     */
    function BgaPlayerEntries(bga: Bga, settings?: BgaPlayerEntriesSettings): Entry[];
    interface JumpToSettings {
        /**
         * The key used to persist the folded state on localStorage.
         * Default (unset) is no storage.
         */
        localStorageFoldedKey?: string;
        /**
         * Jump To menu entries. usually the table(s), then the players (real or fake). Use BgaPlayerEntries to automatically list all players in gamedatas. It should match display order in the game area.
         * Default (empty)
         */
        entries: Entry[];
        /**
         * Set if the controls are folded by default.
         * Default (false) is visible controls
         */
        defaultFolded?: boolean;
        /**
         * The element to attach the controls to. Default is #game_play_area_wrap
         */
        element?: HTMLElement;
    }
    class Manager {
        private settings;
        private controls;
        constructor(settings: JumpToSettings);
        private createPlayerJumps;
        jumpToggle(force?: boolean | undefined): void;
        private jumpTo;
    }
}
