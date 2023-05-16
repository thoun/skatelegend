var DEFAULT_ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
var ZoomManager = /** @class */ (function () {
    /**
     * Place the settings.element in a zoom wrapper and init zoomControls.
     *
     * @param settings: a `ZoomManagerSettings` object
     */
    function ZoomManager(settings) {
        var _this = this;
        var _a, _b, _c, _d, _e;
        this.settings = settings;
        if (!settings.element) {
            throw new DOMException('You need to set the element to wrap in the zoom element');
        }
        this.zoomLevels = (_a = settings.zoomLevels) !== null && _a !== void 0 ? _a : DEFAULT_ZOOM_LEVELS;
        this._zoom = this.settings.defaultZoom || 1;
        if (this.settings.localStorageZoomKey) {
            var zoomStr = localStorage.getItem(this.settings.localStorageZoomKey);
            if (zoomStr) {
                this._zoom = Number(zoomStr);
            }
        }
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'bga-zoom-wrapper';
        this.wrapElement(this.wrapper, settings.element);
        this.wrapper.appendChild(settings.element);
        settings.element.classList.add('bga-zoom-inner');
        if ((_b = settings.smooth) !== null && _b !== void 0 ? _b : true) {
            settings.element.dataset.smooth = 'true';
            settings.element.addEventListener('transitionend', function () { return _this.zoomOrDimensionChanged(); });
        }
        if ((_d = (_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.visible) !== null && _d !== void 0 ? _d : true) {
            this.initZoomControls(settings);
        }
        if (this._zoom !== 1) {
            this.setZoom(this._zoom);
        }
        window.addEventListener('resize', function () {
            var _a;
            _this.zoomOrDimensionChanged();
            if ((_a = _this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth) {
                _this.setAutoZoom();
            }
        });
        if (window.ResizeObserver) {
            new ResizeObserver(function () { return _this.zoomOrDimensionChanged(); }).observe(settings.element);
        }
        if ((_e = this.settings.autoZoom) === null || _e === void 0 ? void 0 : _e.expectedWidth) {
            this.setAutoZoom();
        }
    }
    Object.defineProperty(ZoomManager.prototype, "zoom", {
        /**
         * Returns the zoom level
         */
        get: function () {
            return this._zoom;
        },
        enumerable: false,
        configurable: true
    });
    ZoomManager.prototype.setAutoZoom = function () {
        var _this = this;
        var _a, _b, _c;
        var zoomWrapperWidth = document.getElementById('bga-zoom-wrapper').clientWidth;
        if (!zoomWrapperWidth) {
            setTimeout(function () { return _this.setAutoZoom(); }, 200);
            return;
        }
        var expectedWidth = (_a = this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth;
        var newZoom = this.zoom;
        while (newZoom > this.zoomLevels[0] && newZoom > ((_c = (_b = this.settings.autoZoom) === null || _b === void 0 ? void 0 : _b.minZoomLevel) !== null && _c !== void 0 ? _c : 0) && zoomWrapperWidth / newZoom < expectedWidth) {
            newZoom = this.zoomLevels[this.zoomLevels.indexOf(newZoom) - 1];
        }
        if (this._zoom == newZoom) {
            if (this.settings.localStorageZoomKey) {
                localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
            }
        }
        else {
            this.setZoom(newZoom);
        }
    };
    /**
     * Set the zoom level. Ideally, use a zoom level in the zoomLevels range.
     * @param zoom zool level
     */
    ZoomManager.prototype.setZoom = function (zoom) {
        var _a, _b, _c, _d;
        if (zoom === void 0) { zoom = 1; }
        this._zoom = zoom;
        if (this.settings.localStorageZoomKey) {
            localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom);
        (_a = this.zoomInButton) === null || _a === void 0 ? void 0 : _a.classList.toggle('disabled', newIndex === this.zoomLevels.length - 1);
        (_b = this.zoomOutButton) === null || _b === void 0 ? void 0 : _b.classList.toggle('disabled', newIndex === 0);
        this.settings.element.style.transform = zoom === 1 ? '' : "scale(".concat(zoom, ")");
        (_d = (_c = this.settings).onZoomChange) === null || _d === void 0 ? void 0 : _d.call(_c, this._zoom);
        this.zoomOrDimensionChanged();
    };
    /**
     * Call this method for the browsers not supporting ResizeObserver, everytime the table height changes, if you know it.
     * If the browsert is recent enough (>= Safari 13.1) it will just be ignored.
     */
    ZoomManager.prototype.manualHeightUpdate = function () {
        if (!window.ResizeObserver) {
            this.zoomOrDimensionChanged();
        }
    };
    /**
     * Everytime the element dimensions changes, we update the style. And call the optional callback.
     */
    ZoomManager.prototype.zoomOrDimensionChanged = function () {
        var _a, _b;
        this.settings.element.style.width = "".concat(this.wrapper.getBoundingClientRect().width / this._zoom, "px");
        this.wrapper.style.height = "".concat(this.settings.element.getBoundingClientRect().height, "px");
        (_b = (_a = this.settings).onDimensionsChange) === null || _b === void 0 ? void 0 : _b.call(_a, this._zoom);
    };
    /**
     * Simulates a click on the Zoom-in button.
     */
    ZoomManager.prototype.zoomIn = function () {
        if (this._zoom === this.zoomLevels[this.zoomLevels.length - 1]) {
            return;
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom) + 1;
        this.setZoom(newIndex === -1 ? 1 : this.zoomLevels[newIndex]);
    };
    /**
     * Simulates a click on the Zoom-out button.
     */
    ZoomManager.prototype.zoomOut = function () {
        if (this._zoom === this.zoomLevels[0]) {
            return;
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom) - 1;
        this.setZoom(newIndex === -1 ? 1 : this.zoomLevels[newIndex]);
    };
    /**
     * Changes the color of the zoom controls.
     */
    ZoomManager.prototype.setZoomControlsColor = function (color) {
        if (this.zoomControls) {
            this.zoomControls.dataset.color = color;
        }
    };
    /**
     * Set-up the zoom controls
     * @param settings a `ZoomManagerSettings` object.
     */
    ZoomManager.prototype.initZoomControls = function (settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.zoomControls = document.createElement('div');
        this.zoomControls.id = 'bga-zoom-controls';
        this.zoomControls.dataset.position = (_b = (_a = settings.zoomControls) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : 'top-right';
        this.zoomOutButton = document.createElement('button');
        this.zoomOutButton.type = 'button';
        this.zoomOutButton.addEventListener('click', function () { return _this.zoomOut(); });
        if ((_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.customZoomOutElement) {
            settings.zoomControls.customZoomOutElement(this.zoomOutButton);
        }
        else {
            this.zoomOutButton.classList.add("bga-zoom-out-icon");
        }
        this.zoomInButton = document.createElement('button');
        this.zoomInButton.type = 'button';
        this.zoomInButton.addEventListener('click', function () { return _this.zoomIn(); });
        if ((_d = settings.zoomControls) === null || _d === void 0 ? void 0 : _d.customZoomInElement) {
            settings.zoomControls.customZoomInElement(this.zoomInButton);
        }
        else {
            this.zoomInButton.classList.add("bga-zoom-in-icon");
        }
        this.zoomControls.appendChild(this.zoomOutButton);
        this.zoomControls.appendChild(this.zoomInButton);
        this.wrapper.appendChild(this.zoomControls);
        this.setZoomControlsColor((_f = (_e = settings.zoomControls) === null || _e === void 0 ? void 0 : _e.color) !== null && _f !== void 0 ? _f : 'black');
    };
    /**
     * Wraps an element around an existing DOM element
     * @param wrapper the wrapper element
     * @param element the existing element
     */
    ZoomManager.prototype.wrapElement = function (wrapper, element) {
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    };
    return ZoomManager;
}());
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/**
 * Jump to entry.
 */
var JumpToEntry = /** @class */ (function () {
    function JumpToEntry(
    /**
     * Label shown on the entry. For players, it's player name.
     */
    label, 
    /**
     * HTML Element id, to scroll into view when clicked.
     */
    targetId, 
    /**
     * Any element that is useful to customize the link.
     * Basic ones are 'color' and 'colorback'.
     */
    data) {
        if (data === void 0) { data = {}; }
        this.label = label;
        this.targetId = targetId;
        this.data = data;
    }
    return JumpToEntry;
}());
var JumpToManager = /** @class */ (function () {
    function JumpToManager(game, settings) {
        var _a, _b, _c;
        this.game = game;
        this.settings = settings;
        var entries = __spreadArray(__spreadArray([], ((_a = settings === null || settings === void 0 ? void 0 : settings.topEntries) !== null && _a !== void 0 ? _a : []), true), ((_b = settings === null || settings === void 0 ? void 0 : settings.playersEntries) !== null && _b !== void 0 ? _b : this.createEntries(Object.values(game.gamedatas.players))), true);
        this.createPlayerJumps(entries);
        var folded = (_c = settings === null || settings === void 0 ? void 0 : settings.defaultFolded) !== null && _c !== void 0 ? _c : false;
        if (settings === null || settings === void 0 ? void 0 : settings.localStorageFoldedKey) {
            var localStorageValue = localStorage.getItem(settings.localStorageFoldedKey);
            if (localStorageValue) {
                folded = localStorageValue == 'true';
            }
        }
        document.getElementById('bga-jump-to-controls').classList.toggle('folded', folded);
    }
    JumpToManager.prototype.createPlayerJumps = function (entries) {
        var _this = this;
        var _a, _b, _c, _d;
        document.getElementById("game_play_area_wrap").insertAdjacentHTML('afterend', "\n        <div id=\"bga-jump-to-controls\">        \n            <div id=\"bga-jump-to-toggle\" class=\"bga-jump-to-link ".concat((_b = (_a = this.settings) === null || _a === void 0 ? void 0 : _a.entryClasses) !== null && _b !== void 0 ? _b : '', " toggle\" style=\"--color: ").concat((_d = (_c = this.settings) === null || _c === void 0 ? void 0 : _c.toggleColor) !== null && _d !== void 0 ? _d : 'black', "\">\n                \u21D4\n            </div>\n        </div>"));
        document.getElementById("bga-jump-to-toggle").addEventListener('click', function () { return _this.jumpToggle(); });
        entries.forEach(function (entry) {
            var _a, _b, _c, _d, _e;
            document.getElementById("bga-jump-to-controls").insertAdjacentHTML('beforeend', "<div id=\"bga-jump-to-".concat(entry.targetId, "\" class=\"bga-jump-to-link ").concat((_b = (_a = _this.settings) === null || _a === void 0 ? void 0 : _a.entryClasses) !== null && _b !== void 0 ? _b : '', "\">\n                    ").concat(((_d = (_c = _this.settings) === null || _c === void 0 ? void 0 : _c.showEye) !== null && _d !== void 0 ? _d : true) ? "<div class=\"eye\"></div>" : "", "\n                    <span class=\"bga-jump-to-label\">").concat(entry.label, "</span>\n                </div>"));
            var entryDiv = document.getElementById("bga-jump-to-".concat(entry.targetId));
            Object.getOwnPropertyNames((_e = entry.data) !== null && _e !== void 0 ? _e : []).forEach(function (key) {
                entryDiv.dataset[key] = entry.data[key];
                entryDiv.style.setProperty("--".concat(key), entry.data[key]);
            });
            entryDiv.addEventListener('click', function () { return _this.jumpTo(entry.targetId); });
        });
        var jumpDiv = document.getElementById("bga-jump-to-controls");
        jumpDiv.style.marginTop = "-".concat(Math.round(jumpDiv.getBoundingClientRect().height / 2), "px");
    };
    JumpToManager.prototype.jumpToggle = function () {
        var _a;
        var jumpControls = document.getElementById('bga-jump-to-controls');
        jumpControls.classList.toggle('folded');
        if ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.localStorageFoldedKey) {
            localStorage.setItem(this.settings.localStorageFoldedKey, jumpControls.classList.contains('folded').toString());
        }
    };
    JumpToManager.prototype.jumpTo = function (targetId) {
        document.getElementById(targetId).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    };
    JumpToManager.prototype.getOrderedPlayers = function (unorderedPlayers) {
        var _this = this;
        var players = unorderedPlayers.sort(function (a, b) { return Number(a.playerNo) - Number(b.playerNo); });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.game.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex), true), players.slice(0, playerIndex), true) : players;
        return orderedPlayers;
    };
    JumpToManager.prototype.createEntries = function (players) {
        var orderedPlayers = this.getOrderedPlayers(players);
        return orderedPlayers.map(function (player) { return new JumpToEntry(player.name, "player-table-".concat(player.id), {
            'color': '#' + player.color,
            'colorback': player.color_back ? '#' + player.color_back : null,
        }); });
    };
    return JumpToManager;
}());
/**
 * Linear slide of the card from origin to destination.
 *
 * @param element the element to animate. The element should be attached to the destination element before the animation starts.
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
function slideAnimation(element, settings) {
    var promise = new Promise(function (success) {
        var _a, _b, _c, _d, _e;
        // should be checked at the beginning of every animation
        if (!shouldAnimate(settings)) {
            success(false);
            return promise;
        }
        var _f = getDeltaCoordinates(element, settings), x = _f.x, y = _f.y;
        var duration = (_a = settings === null || settings === void 0 ? void 0 : settings.duration) !== null && _a !== void 0 ? _a : 500;
        var originalZIndex = element.style.zIndex;
        var originalTransition = element.style.transition;
        element.style.zIndex = "".concat((_b = settings === null || settings === void 0 ? void 0 : settings.zIndex) !== null && _b !== void 0 ? _b : 10);
        element.style.transition = null;
        element.offsetHeight;
        element.style.transform = "translate(".concat(-x, "px, ").concat(-y, "px) rotate(").concat((_c = settings === null || settings === void 0 ? void 0 : settings.rotationDelta) !== null && _c !== void 0 ? _c : 0, "deg)");
        (_d = settings.animationStart) === null || _d === void 0 ? void 0 : _d.call(settings, element);
        var timeoutId = null;
        var cleanOnTransitionEnd = function () {
            var _a;
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            (_a = settings.animationEnd) === null || _a === void 0 ? void 0 : _a.call(settings, element);
            success(true);
            element.removeEventListener('transitioncancel', cleanOnTransitionEnd);
            element.removeEventListener('transitionend', cleanOnTransitionEnd);
            document.removeEventListener('visibilitychange', cleanOnTransitionEnd);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
        var cleanOnTransitionCancel = function () {
            var _a;
            element.style.transition = "";
            element.offsetHeight;
            element.style.transform = (_a = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _a !== void 0 ? _a : null;
            element.offsetHeight;
            cleanOnTransitionEnd();
        };
        element.addEventListener('transitioncancel', cleanOnTransitionCancel);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);
        element.offsetHeight;
        element.style.transition = "transform ".concat(duration, "ms linear");
        element.offsetHeight;
        element.style.transform = (_e = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _e !== void 0 ? _e : null;
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
function shouldAnimate(settings) {
    var _a;
    return document.visibilityState !== 'hidden' && !((_a = settings === null || settings === void 0 ? void 0 : settings.game) === null || _a === void 0 ? void 0 : _a.instantaneousMode);
}
/**
 * Return the x and y delta, based on the animation settings;
 *
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
function getDeltaCoordinates(element, settings) {
    var _a;
    if (!settings.fromDelta && !settings.fromRect && !settings.fromElement) {
        throw new Error("[bga-animation] fromDelta, fromRect or fromElement need to be set");
    }
    var x = 0;
    var y = 0;
    if (settings.fromDelta) {
        x = settings.fromDelta.x;
        y = settings.fromDelta.y;
    }
    else {
        var originBR = (_a = settings.fromRect) !== null && _a !== void 0 ? _a : settings.fromElement.getBoundingClientRect();
        // TODO make it an option ?
        var originalTransform = element.style.transform;
        element.style.transform = '';
        var destinationBR = element.getBoundingClientRect();
        element.style.transform = originalTransform;
        x = (destinationBR.left + destinationBR.right) / 2 - (originBR.left + originBR.right) / 2;
        y = (destinationBR.top + destinationBR.bottom) / 2 - (originBR.top + originBR.bottom) / 2;
    }
    if (settings.scale) {
        x /= settings.scale;
        y /= settings.scale;
    }
    return { x: x, y: y };
}
function logAnimation(element, settings) {
    console.log(element, element.getBoundingClientRect(), element.style.transform, settings);
    return Promise.resolve(false);
}
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var AnimationManager = /** @class */ (function () {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `AnimationManagerSettings` object
     */
    function AnimationManager(game, settings) {
        this.game = game;
        this.settings = settings;
        this.zoomManager = settings === null || settings === void 0 ? void 0 : settings.zoomManager;
    }
    /**
     * Attach an element to a parent, then play animation from element's origin to its new position.
     *
     * @param element the element to animate
     * @param toElement the destination parent
     * @param fn the animation function
     * @param settings the animation settings
     * @returns a promise when animation ends
     */
    AnimationManager.prototype.attachWithAnimation = function (element, toElement, fn, settings) {
        var _a, _b, _c, _d, _e, _f;
        var fromRect = element.getBoundingClientRect();
        toElement.appendChild(element);
        (_a = settings === null || settings === void 0 ? void 0 : settings.afterAttach) === null || _a === void 0 ? void 0 : _a.call(settings, element, toElement);
        return (_f = fn(element, __assign(__assign({ duration: (_c = (_b = this.settings) === null || _b === void 0 ? void 0 : _b.duration) !== null && _c !== void 0 ? _c : 500, scale: (_e = (_d = this.zoomManager) === null || _d === void 0 ? void 0 : _d.zoom) !== null && _e !== void 0 ? _e : undefined }, settings !== null && settings !== void 0 ? settings : {}), { game: this.game, fromRect: fromRect }))) !== null && _f !== void 0 ? _f : Promise.resolve(false);
    };
    /**
     * Attach an element to a parent with a slide animation.
     *
     * @param card the card informations
     */
    AnimationManager.prototype.attachWithSlideAnimation = function (element, toElement, settings) {
        return this.attachWithAnimation(element, toElement, slideAnimation, settings);
    };
    /**
     * Attach an element to a parent with a slide animation.
     *
     * @param card the card informations
     */
    AnimationManager.prototype.attachWithShowToScreenAnimation = function (element, toElement, settingsOrSettingsArray) {
        var _this = this;
        var cumulatedAnimation = function (element, settings) { return cumulatedAnimations(element, [
            showScreenCenterAnimation,
            pauseAnimation,
            function (element) { return _this.attachWithSlideAnimation(element, toElement); },
        ], settingsOrSettingsArray); };
        return this.attachWithAnimation(element, toElement, cumulatedAnimation, null);
    };
    /**
     * Slide from an element.
     *
     * @param element the element to animate
     * @param fromElement the origin element
     * @param settings the animation settings
     * @returns a promise when animation ends
     */
    AnimationManager.prototype.slideFromElement = function (element, fromElement, settings) {
        var _a, _b, _c, _d, _e;
        return (_e = slideAnimation(element, __assign(__assign({ duration: (_b = (_a = this.settings) === null || _a === void 0 ? void 0 : _a.duration) !== null && _b !== void 0 ? _b : 500, scale: (_d = (_c = this.zoomManager) === null || _c === void 0 ? void 0 : _c.zoom) !== null && _d !== void 0 ? _d : undefined }, settings !== null && settings !== void 0 ? settings : {}), { game: this.game, fromElement: fromElement }))) !== null && _e !== void 0 ? _e : Promise.resolve(false);
    };
    AnimationManager.prototype.getZoomManager = function () {
        return this.zoomManager;
    };
    /**
     * Set the zoom manager, to get the scale of the current game.
     *
     * @param zoomManager the zoom manager
     */
    AnimationManager.prototype.setZoomManager = function (zoomManager) {
        this.zoomManager = zoomManager;
    };
    AnimationManager.prototype.getSettings = function () {
        return this.settings;
    };
    return AnimationManager;
}());
/**
 * The abstract stock. It shouldn't be used directly, use stocks that extends it.
 */
var CardStock = /** @class */ (function () {
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function CardStock(manager, element, settings) {
        this.manager = manager;
        this.element = element;
        this.cards = [];
        this.selectedCards = [];
        this.selectionMode = 'none';
        manager.addStock(this);
        element === null || element === void 0 ? void 0 : element.classList.add('card-stock' /*, this.constructor.name.split(/(?=[A-Z])/).join('-').toLowerCase()* doesn't work in production because of minification */);
        this.bindClick();
        this.sort = settings === null || settings === void 0 ? void 0 : settings.sort;
    }
    /**
     * @returns the cards on the stock
     */
    CardStock.prototype.getCards = function () {
        return this.cards.slice();
    };
    /**
     * @returns if the stock is empty
     */
    CardStock.prototype.isEmpty = function () {
        return !this.cards.length;
    };
    /**
     * @returns the selected cards
     */
    CardStock.prototype.getSelection = function () {
        return this.selectedCards.slice();
    };
    /**
     * @param card a card
     * @returns if the card is present in the stock
     */
    CardStock.prototype.contains = function (card) {
        var _this = this;
        return this.cards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
    };
    // TODO keep only one ?
    CardStock.prototype.cardInStock = function (card) {
        var element = document.getElementById(this.manager.getId(card));
        return element ? this.cardElementInStock(element) : false;
    };
    CardStock.prototype.cardElementInStock = function (element) {
        return (element === null || element === void 0 ? void 0 : element.parentElement) == this.element;
    };
    /**
     * @param card a card in the stock
     * @returns the HTML element generated for the card
     */
    CardStock.prototype.getCardElement = function (card) {
        return document.getElementById(this.manager.getId(card));
    };
    /**
     * Checks if the card can be added. By default, only if it isn't already present in the stock.
     *
     * @param card the card to add
     * @param settings the addCard settings
     * @returns if the card can be added
     */
    CardStock.prototype.canAddCard = function (card, settings) {
        return !this.cardInStock(card);
    };
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    CardStock.prototype.addCard = function (card, animation, settings) {
        var _a, _b;
        if (!this.canAddCard(card, settings)) {
            return Promise.resolve(false);
        }
        var promise;
        // we check if card is in stock then we ignore animation
        var currentStock = this.manager.getCardStock(card);
        var index = this.getNewCardIndex(card);
        var settingsWithIndex = __assign({ index: index }, (settings !== null && settings !== void 0 ? settings : {}));
        if (currentStock === null || currentStock === void 0 ? void 0 : currentStock.cardInStock(card)) {
            var element = document.getElementById(this.manager.getId(card));
            promise = this.moveFromOtherStock(card, element, __assign(__assign({}, animation), { fromStock: currentStock }), settingsWithIndex);
            element.dataset.side = ((_a = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _a !== void 0 ? _a : true) ? 'front' : 'back';
        }
        else if ((animation === null || animation === void 0 ? void 0 : animation.fromStock) && animation.fromStock.cardInStock(card)) {
            var element = document.getElementById(this.manager.getId(card));
            promise = this.moveFromOtherStock(card, element, animation, settingsWithIndex);
        }
        else {
            var element = this.manager.createCardElement(card, ((_b = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _b !== void 0 ? _b : true));
            promise = this.moveFromElement(card, element, animation, settingsWithIndex);
        }
        this.setSelectableCard(card, this.selectionMode != 'none');
        if (settingsWithIndex.index !== null && settingsWithIndex.index !== undefined) {
            this.cards.splice(index, 0, card);
        }
        else {
            this.cards.push(card);
        }
        if (!promise) {
            console.warn("CardStock.addCard didn't return a Promise");
            return Promise.resolve(false);
        }
        return promise;
    };
    CardStock.prototype.getNewCardIndex = function (card) {
        if (this.sort) {
            var otherCards = this.getCards();
            for (var i = 0; i < otherCards.length; i++) {
                var otherCard = otherCards[i];
                if (this.sort(card, otherCard) < 0) {
                    return i;
                }
            }
            return otherCards.length;
        }
        else {
            return undefined;
        }
    };
    CardStock.prototype.addCardElementToParent = function (cardElement, settings) {
        var _a;
        var parent = (_a = settings === null || settings === void 0 ? void 0 : settings.forceToElement) !== null && _a !== void 0 ? _a : this.element;
        if ((settings === null || settings === void 0 ? void 0 : settings.index) === null || (settings === null || settings === void 0 ? void 0 : settings.index) === undefined || !parent.children.length || (settings === null || settings === void 0 ? void 0 : settings.index) >= parent.children.length) {
            parent.appendChild(cardElement);
        }
        else {
            parent.insertBefore(cardElement, parent.children[settings.index]);
        }
    };
    CardStock.prototype.moveFromOtherStock = function (card, cardElement, animation, settings) {
        var promise;
        this.addCardElementToParent(cardElement, settings);
        cardElement.classList.remove('selectable', 'selected', 'disabled');
        promise = this.animationFromElement(cardElement, animation.fromStock.element, {
            originalSide: animation.originalSide,
            rotationDelta: animation.rotationDelta,
            animation: animation.animation,
        });
        // in the case the card was move inside the same stock we don't remove it
        if (animation.fromStock != this) {
            animation.fromStock.removeCard(card);
        }
        if (!promise) {
            console.warn("CardStock.moveFromOtherStock didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise;
    };
    CardStock.prototype.moveFromElement = function (card, cardElement, animation, settings) {
        var promise;
        this.addCardElementToParent(cardElement, settings);
        if (animation) {
            if (animation.fromStock) {
                promise = this.animationFromElement(cardElement, animation.fromStock.element, {
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
                animation.fromStock.removeCard(card);
            }
            else if (animation.fromElement) {
                promise = this.animationFromElement(cardElement, animation.fromElement, {
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
            }
        }
        else {
            promise = Promise.resolve(false);
        }
        if (!promise) {
            console.warn("CardStock.moveFromElement didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise;
    };
    /**
     * Add an array of cards to the stock.
     *
     * @param cards the cards to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @param shift if number, the number of milliseconds between each card. if true, chain animations
     */
    CardStock.prototype.addCards = function (cards, animation, settings, shift) {
        var _this = this;
        if (shift === void 0) { shift = false; }
        if (shift === true) {
            if (cards.length) {
                this.addCard(cards[0], animation, settings).then(function () { return _this.addCards(cards.slice(1), animation, settings, shift); });
            }
            return;
        }
        if (shift) {
            var _loop_1 = function (i) {
                setTimeout(function () { return _this.addCard(cards[i], animation, settings); }, i * shift);
            };
            for (var i = 0; i < cards.length; i++) {
                _loop_1(i);
            }
        }
        else {
            cards.forEach(function (card) { return _this.addCard(card, animation, settings); });
        }
    };
    /**
     * Remove a card from the stock.
     *
     * @param card the card to remove
     */
    CardStock.prototype.removeCard = function (card) {
        if (this.cardInStock(card)) {
            this.manager.removeCard(card);
        }
        this.cardRemoved(card);
    };
    CardStock.prototype.cardRemoved = function (card) {
        var _this = this;
        var index = this.cards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
        if (index !== -1) {
            this.cards.splice(index, 1);
        }
        if (this.selectedCards.find(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); })) {
            this.unselectCard(card);
        }
    };
    /**
     * Remove a set of card from the stock.
     *
     * @param cards the cards to remove
     */
    CardStock.prototype.removeCards = function (cards) {
        var _this = this;
        cards.forEach(function (card) { return _this.removeCard(card); });
    };
    /**
     * Remove all cards from the stock.
     */
    CardStock.prototype.removeAll = function () {
        var _this = this;
        var cards = this.getCards(); // use a copy of the array as we iterate and modify it at the same time
        cards.forEach(function (card) { return _this.removeCard(card); });
    };
    CardStock.prototype.setSelectableCard = function (card, selectable) {
        var element = this.getCardElement(card);
        element.classList.toggle('selectable', selectable);
    };
    /**
     * Set if the stock is selectable, and if yes if it can be multiple.
     * If set to 'none', it will unselect all selected cards.
     *
     * @param selectionMode the selection mode
     */
    CardStock.prototype.setSelectionMode = function (selectionMode) {
        var _this = this;
        if (selectionMode === 'none') {
            this.unselectAll(true);
        }
        this.cards.forEach(function (card) { return _this.setSelectableCard(card, selectionMode != 'none'); });
        this.element.classList.toggle('selectable', selectionMode != 'none');
        this.selectionMode = selectionMode;
    };
    /**
     * Set selected state to a card.
     *
     * @param card the card to select
     */
    CardStock.prototype.selectCard = function (card, silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        if (this.selectionMode == 'none') {
            return;
        }
        if (this.selectionMode === 'single') {
            this.cards.filter(function (c) { return _this.manager.getId(c) != _this.manager.getId(card); }).forEach(function (c) { return _this.unselectCard(c, true); });
        }
        var element = this.getCardElement(card);
        element.classList.add('selected');
        this.selectedCards.push(card);
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), card);
        }
    };
    /**
     * Set unselected state to a card.
     *
     * @param card the card to unselect
     */
    CardStock.prototype.unselectCard = function (card, silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        var element = this.getCardElement(card);
        element.classList.remove('selected');
        var index = this.selectedCards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
        if (index !== -1) {
            this.selectedCards.splice(index, 1);
        }
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), card);
        }
    };
    /**
     * Select all cards
     */
    CardStock.prototype.selectAll = function (silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        if (this.selectionMode == 'none') {
            return;
        }
        this.cards.forEach(function (c) { return _this.selectCard(c, true); });
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), null);
        }
    };
    /**
     * Unelect all cards
     */
    CardStock.prototype.unselectAll = function (silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        var cards = this.getCards(); // use a copy of the array as we iterate and modify it at the same time
        cards.forEach(function (c) { return _this.unselectCard(c, true); });
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), null);
        }
    };
    CardStock.prototype.bindClick = function () {
        var _this = this;
        var _a;
        (_a = this.element) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function (event) {
            var cardDiv = event.target.closest('.card');
            if (!cardDiv) {
                return;
            }
            var card = _this.cards.find(function (c) { return _this.manager.getId(c) == cardDiv.id; });
            if (!card) {
                return;
            }
            _this.cardClick(card);
        });
    };
    CardStock.prototype.cardClick = function (card) {
        var _this = this;
        var _a;
        if (this.selectionMode != 'none') {
            var alreadySelected = this.selectedCards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
            if (alreadySelected) {
                this.unselectCard(card);
            }
            else {
                this.selectCard(card);
            }
        }
        (_a = this.onCardClick) === null || _a === void 0 ? void 0 : _a.call(this, card);
    };
    /**
     * @param element The element to animate. The element is added to the destination stock before the animation starts.
     * @param fromElement The HTMLElement to animate from.
     */
    CardStock.prototype.animationFromElement = function (element, fromElement, settings) {
        var _a, _b, _c, _d, _e, _f;
        var side = element.dataset.side;
        if (settings.originalSide && settings.originalSide != side) {
            var cardSides_1 = element.getElementsByClassName('card-sides')[0];
            cardSides_1.style.transition = 'none';
            element.dataset.side = settings.originalSide;
            setTimeout(function () {
                cardSides_1.style.transition = null;
                element.dataset.side = side;
            });
        }
        var animation = (_a = settings.animation) !== null && _a !== void 0 ? _a : slideAnimation;
        return (_f = animation(element, __assign(__assign({ duration: (_c = (_b = this.manager.animationManager.getSettings()) === null || _b === void 0 ? void 0 : _b.duration) !== null && _c !== void 0 ? _c : 500, scale: (_e = (_d = this.manager.animationManager.getZoomManager()) === null || _d === void 0 ? void 0 : _d.zoom) !== null && _e !== void 0 ? _e : undefined }, settings !== null && settings !== void 0 ? settings : {}), { game: this.manager.game, fromElement: fromElement }))) !== null && _f !== void 0 ? _f : Promise.resolve(false);
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     */
    CardStock.prototype.setCardVisible = function (card, visible, settings) {
        this.manager.setCardVisible(card, visible, settings);
    };
    /**
     * Flips the card.
     *
     * @param card the card informations
     */
    CardStock.prototype.flipCard = function (card, settings) {
        this.manager.flipCard(card, settings);
    };
    return CardStock;
}());
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * Abstract stock to represent a deck. (pile of cards, with a fake 3d effect of thickness).
 */
var Deck = /** @class */ (function (_super) {
    __extends(Deck, _super);
    function Deck(manager, element, settings) {
        var _this = this;
        var _a, _b, _c, _d;
        _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('deck');
        _this.element.style.setProperty('--width', settings.width + 'px');
        _this.element.style.setProperty('--height', settings.height + 'px');
        _this.thicknesses = (_a = settings.thicknesses) !== null && _a !== void 0 ? _a : [0, 2, 5, 10, 20, 30];
        _this.setCardNumber((_b = settings.cardNumber) !== null && _b !== void 0 ? _b : 52);
        _this.autoUpdateCardNumber = (_c = settings.autoUpdateCardNumber) !== null && _c !== void 0 ? _c : true;
        var shadowDirection = (_d = settings.shadowDirection) !== null && _d !== void 0 ? _d : 'bottom-right';
        var shadowDirectionSplit = shadowDirection.split('-');
        var xShadowShift = shadowDirectionSplit.includes('right') ? 1 : (shadowDirectionSplit.includes('left') ? -1 : 0);
        var yShadowShift = shadowDirectionSplit.includes('bottom') ? 1 : (shadowDirectionSplit.includes('top') ? -1 : 0);
        _this.element.style.setProperty('--xShadowShift', '' + xShadowShift);
        _this.element.style.setProperty('--yShadowShift', '' + yShadowShift);
        return _this;
    }
    Deck.prototype.setCardNumber = function (cardNumber) {
        var _this = this;
        this.cardNumber = cardNumber;
        this.element.dataset.empty = (this.cardNumber == 0).toString();
        var thickness = 0;
        this.thicknesses.forEach(function (threshold, index) {
            if (_this.cardNumber >= threshold) {
                thickness = index;
            }
        });
        this.element.style.setProperty('--thickness', thickness + 'px');
    };
    Deck.prototype.addCard = function (card, animation, settings) {
        var _a;
        if (this.autoUpdateCardNumber && ((_a = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _a !== void 0 ? _a : true)) {
            this.setCardNumber(this.cardNumber + 1);
        }
        return _super.prototype.addCard.call(this, card, animation, settings);
    };
    Deck.prototype.cardRemoved = function (card) {
        if (this.autoUpdateCardNumber) {
            this.setCardNumber(this.cardNumber - 1);
        }
        _super.prototype.cardRemoved.call(this, card);
    };
    return Deck;
}(CardStock));
/**
 * A basic stock for a list of cards, based on flex.
 */
var LineStock = /** @class */ (function (_super) {
    __extends(LineStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     * @param settings a `LineStockSettings` object
     */
    function LineStock(manager, element, settings) {
        var _this = this;
        var _a, _b, _c, _d;
        _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('line-stock');
        element.dataset.center = ((_a = settings === null || settings === void 0 ? void 0 : settings.center) !== null && _a !== void 0 ? _a : true).toString();
        element.style.setProperty('--wrap', (_b = settings === null || settings === void 0 ? void 0 : settings.wrap) !== null && _b !== void 0 ? _b : 'wrap');
        element.style.setProperty('--direction', (_c = settings === null || settings === void 0 ? void 0 : settings.direction) !== null && _c !== void 0 ? _c : 'row');
        element.style.setProperty('--gap', (_d = settings === null || settings === void 0 ? void 0 : settings.gap) !== null && _d !== void 0 ? _d : '8px');
        return _this;
    }
    return LineStock;
}(CardStock));
/**
 * A stock with fixed slots (some can be empty)
 */
var SlotStock = /** @class */ (function (_super) {
    __extends(SlotStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     * @param settings a `SlotStockSettings` object
     */
    function SlotStock(manager, element, settings) {
        var _this = this;
        var _a, _b;
        _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        _this.slotsIds = [];
        _this.slots = [];
        element.classList.add('slot-stock');
        _this.mapCardToSlot = settings.mapCardToSlot;
        _this.slotsIds = (_a = settings.slotsIds) !== null && _a !== void 0 ? _a : [];
        _this.slotClasses = (_b = settings.slotClasses) !== null && _b !== void 0 ? _b : [];
        _this.slotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
        return _this;
    }
    SlotStock.prototype.createSlot = function (slotId) {
        var _a;
        this.slots[slotId] = document.createElement("div");
        this.slots[slotId].dataset.slotId = slotId;
        this.element.appendChild(this.slots[slotId]);
        (_a = this.slots[slotId].classList).add.apply(_a, __spreadArray(['slot'], this.slotClasses, true));
    };
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardToSlotSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    SlotStock.prototype.addCard = function (card, animation, settings) {
        var _a, _b;
        var slotId = (_a = settings === null || settings === void 0 ? void 0 : settings.slot) !== null && _a !== void 0 ? _a : (_b = this.mapCardToSlot) === null || _b === void 0 ? void 0 : _b.call(this, card);
        if (slotId === undefined) {
            throw new Error("Impossible to add card to slot : no SlotId. Add slotId to settings or set mapCardToSlot to SlotCard constructor.");
        }
        if (!this.slots[slotId]) {
            throw new Error("Impossible to add card to slot \"".concat(slotId, "\" : slot \"").concat(slotId, "\" doesn't exists."));
        }
        var newSettings = __assign(__assign({}, settings), { forceToElement: this.slots[slotId] });
        return _super.prototype.addCard.call(this, card, animation, newSettings);
    };
    /**
     * Change the slots ids. Will empty the stock before re-creating the slots.
     *
     * @param slotsIds the new slotsIds. Will replace the old ones.
     */
    SlotStock.prototype.setSlotsIds = function (slotsIds) {
        var _this = this;
        if (slotsIds.length == this.slotsIds.length && slotsIds.every(function (slotId, index) { return _this.slotsIds[index] === slotId; })) {
            // no change
            return;
        }
        this.removeAll();
        this.element.innerHTML = '';
        this.slotsIds = slotsIds !== null && slotsIds !== void 0 ? slotsIds : [];
        this.slotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
    };
    SlotStock.prototype.cardElementInStock = function (element) {
        return (element === null || element === void 0 ? void 0 : element.parentElement.parentElement) == this.element;
    };
    SlotStock.prototype.canAddCard = function (card, settings) {
        var _a, _b;
        if (!this.cardInStock(card)) {
            return true;
        }
        else {
            var currentCardSlot = this.getCardElement(card).closest('.slot').dataset.slotId;
            var slotId = (_a = settings === null || settings === void 0 ? void 0 : settings.slot) !== null && _a !== void 0 ? _a : (_b = this.mapCardToSlot) === null || _b === void 0 ? void 0 : _b.call(this, card);
            return currentCardSlot != slotId;
        }
    };
    return SlotStock;
}(LineStock));
/**
 * A stock to make cards disappear (to automatically remove discarded cards, or to represent a bag)
 */
var VoidStock = /** @class */ (function (_super) {
    __extends(VoidStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function VoidStock(manager, element) {
        var _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('void-stock');
        return _this;
    }
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    VoidStock.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        // center the element
        var cardElement = this.getCardElement(card);
        cardElement.style.left = "".concat((this.element.clientWidth - cardElement.clientWidth) / 2, "px");
        cardElement.style.top = "".concat((this.element.clientHeight - cardElement.clientHeight) / 2, "px");
        if (!promise) {
            console.warn("VoidStock.addCard didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise.then(function (result) {
            _this.removeCard(card);
            return result;
        });
    };
    return VoidStock;
}(CardStock));
var HiddenDeck = /** @class */ (function (_super) {
    __extends(HiddenDeck, _super);
    function HiddenDeck(manager, element, settings) {
        var _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('hidden-deck');
        _this.element.appendChild(_this.manager.createCardElement({ id: "".concat(element.id, "-hidden-deck-back") }, false));
        return _this;
    }
    HiddenDeck.prototype.addCard = function (card, animation, settings) {
        var _a;
        var newSettings = __assign(__assign({}, settings), { visible: (_a = settings === null || settings === void 0 ? void 0 : settings.visible) !== null && _a !== void 0 ? _a : false });
        return _super.prototype.addCard.call(this, card, animation, newSettings);
    };
    return HiddenDeck;
}(Deck));
var VisibleDeck = /** @class */ (function (_super) {
    __extends(VisibleDeck, _super);
    function VisibleDeck(manager, element, settings) {
        var _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('visible-deck');
        return _this;
    }
    VisibleDeck.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var currentCard = this.cards[this.cards.length - 1];
        if (currentCard) {
            // we remove the card under, only when the animation is done. TODO use promise result
            setTimeout(function () {
                _this.removeCard(currentCard);
                // counter the autoUpdateCardNumber as the card isn't really removed, we just remove it from the dom so player cannot see it's content.
                if (_this.autoUpdateCardNumber) {
                    _this.setCardNumber(_this.cardNumber + 1);
                }
            }, 600);
        }
        return _super.prototype.addCard.call(this, card, animation, settings);
    };
    return VisibleDeck;
}(Deck));
var CardManager = /** @class */ (function () {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `CardManagerSettings` object
     */
    function CardManager(game, settings) {
        var _a;
        this.game = game;
        this.settings = settings;
        this.stocks = [];
        this.animationManager = (_a = settings.animationManager) !== null && _a !== void 0 ? _a : new AnimationManager(game);
    }
    CardManager.prototype.addStock = function (stock) {
        this.stocks.push(stock);
    };
    /**
     * @param card the card informations
     * @return the id for a card
     */
    CardManager.prototype.getId = function (card) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.settings).getId) === null || _b === void 0 ? void 0 : _b.call(_a, card)) !== null && _c !== void 0 ? _c : "card-".concat(card.id);
    };
    CardManager.prototype.createCardElement = function (card, visible) {
        var _a, _b, _c, _d, _e, _f;
        if (visible === void 0) { visible = true; }
        var id = this.getId(card);
        var side = visible ? 'front' : 'back';
        // TODO check if exists
        var element = document.createElement("div");
        element.id = id;
        element.dataset.side = '' + side;
        element.innerHTML = "\n            <div class=\"card-sides\">\n                <div class=\"card-side front\">\n                </div>\n                <div class=\"card-side back\">\n                </div>\n            </div>\n        ";
        element.classList.add('card');
        document.body.appendChild(element);
        (_b = (_a = this.settings).setupDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element);
        (_d = (_c = this.settings).setupFrontDiv) === null || _d === void 0 ? void 0 : _d.call(_c, card, element.getElementsByClassName('front')[0]);
        (_f = (_e = this.settings).setupBackDiv) === null || _f === void 0 ? void 0 : _f.call(_e, card, element.getElementsByClassName('back')[0]);
        document.body.removeChild(element);
        return element;
    };
    /**
     * @param card the card informations
     * @return the HTML element of an existing card
     */
    CardManager.prototype.getCardElement = function (card) {
        return document.getElementById(this.getId(card));
    };
    CardManager.prototype.removeCard = function (card) {
        var _a;
        var id = this.getId(card);
        var div = document.getElementById(id);
        if (!div) {
            return;
        }
        // if the card is in a stock, notify the stock about removal
        (_a = this.getCardStock(card)) === null || _a === void 0 ? void 0 : _a.cardRemoved(card);
        div.id = "deleted".concat(id);
        // TODO this.removeVisibleInformations(div);
        div.remove();
    };
    /**
     * @param card the card informations
     * @return the stock containing the card
     */
    CardManager.prototype.getCardStock = function (card) {
        return this.stocks.find(function (stock) { return stock.contains(card); });
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     */
    CardManager.prototype.setCardVisible = function (card, visible, settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g;
        var element = this.getCardElement(card);
        if (!element) {
            return;
        }
        element.dataset.side = visible ? 'front' : 'back';
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.updateFront) !== null && _a !== void 0 ? _a : true) {
            (_c = (_b = this.settings).setupFrontDiv) === null || _c === void 0 ? void 0 : _c.call(_b, card, element.getElementsByClassName('front')[0]);
        }
        if ((_d = settings === null || settings === void 0 ? void 0 : settings.updateBack) !== null && _d !== void 0 ? _d : false) {
            (_f = (_e = this.settings).setupBackDiv) === null || _f === void 0 ? void 0 : _f.call(_e, card, element.getElementsByClassName('back')[0]);
        }
        if ((_g = settings === null || settings === void 0 ? void 0 : settings.updateData) !== null && _g !== void 0 ? _g : true) {
            // card data has changed
            var stock = this.getCardStock(card);
            var cards = stock.getCards();
            var cardIndex = cards.findIndex(function (c) { return _this.getId(c) === _this.getId(card); });
            if (cardIndex !== -1) {
                stock.cards.splice(cardIndex, 1, card);
            }
        }
    };
    /**
     * Flips the card.
     *
     * @param card the card informations
     */
    CardManager.prototype.flipCard = function (card, settings) {
        var element = this.getCardElement(card);
        var currentlyVisible = element.dataset.side === 'front';
        this.setCardVisible(card, !currentlyVisible, settings);
    };
    return CardManager;
}());
var CardsManager = /** @class */ (function (_super) {
    __extends(CardsManager, _super);
    function CardsManager(game) {
        var _this = _super.call(this, game, {
            getId: function (card) { return "card-".concat(card.id); },
            setupDiv: function (card, div) {
                div.dataset.type = '' + card.type;
                div.dataset.typeArg = '' + card.typeArg;
            },
            setupFrontDiv: function (card, div) {
                div.id = "card-".concat(card.id, "-front");
                _this.game.setTooltip(div.id, _this.getTooltip(card));
            },
            setupBackDiv: function (card, div) { },
        }) || this;
        _this.game = game;
        return _this;
    }
    CardsManager.prototype.getColorName = function (color) {
        switch (color) {
            case 0: return _('Gray');
            case 1: return _('Blue');
            case 2: return _('Yellow');
            case 3: return _('Red');
            case 4: return _('Green');
        }
    };
    CardsManager.prototype.getPower = function (power) {
        switch (power) {
            case 10: return _('TODO POWER_FLIP_DECK');
            case 21: return _('TODO POWER_PLAY_AGAIN');
            case 22: return _('TODO POWER_PLAY_AGAIN_TWICE');
            case 31: return _('TODO POWER_PICK_CARD');
            case 32: return _('TODO POWER_PICK_CARD_TWICE');
        }
    };
    CardsManager.prototype.getCondition = function (condition) {
        switch (condition[1]) {
            case 1: return _('TODO CONDITION_EQUAL');
            case 2: return _('TODO CONDITION_DANGER');
            case 3: return _('TODO CONDITION_YELLOW_GREEN');
            case 4: return _('TODO CONDITION_CARDS');
            case 5: return _('TODO CONDITION_DIFFERENT');
            case 6: return _('TODO CONDITION_RED');
        }
    };
    CardsManager.prototype.getTooltip = function (card) {
        var html = "\n            <div><strong>".concat(_('Color:'), "</strong> ").concat(this.getColorName(card.color), "</div>\n            <div><strong>").concat(_('Wheels:'), "</strong> ").concat(card.wheels, "</div>\n        ");
        if (card.danger) {
            html += "<div><strong style=\"color: darkred\">".concat(_('Danger'), "</strong></div>");
        }
        if (card.power) {
            html += "\n                <div><strong>".concat(_('Power:'), "</strong> ").concat(this.getPower(card.power), "</div>\n            ");
        }
        if (card.condition) {
            html += "\n                <div><strong>".concat(_('Condition:'), "</strong> ").concat(this.getCondition(card.condition), "</div>\n            ");
        }
        return html;
    };
    return CardsManager;
}(CardManager));
var isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
var log = isDebug ? console.log.bind(window.console) : function () { };
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();
        var html = "\n        <div id=\"player-table-".concat(this.playerId, "\" class=\"player-table\" style=\"--player-color: #").concat(player.color, ";\">\n            <div id=\"player-table-").concat(this.playerId, "-name\" class=\"name-wrapper\">").concat(player.name, "</div>\n            <div class=\"cards\">\n                <div class=\"block-with-text visible-cards\">\n                    <div class=\"block-label\">").concat(this.currentPlayer ? _('Your sequence') : _('${player_name}\'s sequence').replace('${player_name}', "<span style=\"color: #".concat(this.game.getPlayerColor(this.playerId), "\">").concat(this.game.getPlayerName(this.playerId), "</span>")), "</div>\n                    <div id=\"player-table-").concat(this.playerId, "-played\" class=\"cards\"></div>\n                </div>\n            </div>\n        </div>\n        ");
        dojo.place(html, document.getElementById('tables'));
        if (this.currentPlayer) {
            document.getElementById("table").insertAdjacentHTML('afterbegin', "\n            <div class=\"block-with-text hand-wrapper cards\">\n                <div class=\"block-label\">".concat(_('Your hand'), "</div>\n                <div id=\"player-table-").concat(this.playerId, "-hand\" class=\"hand cards\"></div>\n            </div>\n            "));
            var handDiv = document.getElementById("player-table-".concat(this.playerId, "-hand"));
            this.hand = new LineStock(this.game.cardsManager, handDiv, {
                sort: function (a, b) { return b.type - a.type; },
            });
            this.hand.onCardClick = function (card) { return _this.game.playCardFromHand(card.id); };
            this.hand.addCards(player.hand);
        }
        this.voidStock = new VoidStock(this.game.cardsManager, document.getElementById("player-table-".concat(this.playerId, "-name")));
        this.played = new LineStock(this.game.cardsManager, document.getElementById("player-table-".concat(this.playerId, "-played")), {
            center: false,
        });
        this.played.addCards(player.played);
        if (player.helmetCardId) {
            this.addHelmet(this.played.getCards().find(function (card) { return card.id == player.helmetCardId; }));
        }
    }
    PlayerTable.prototype.discardLegendCard = function (card) {
        this.played.removeCard(card);
    };
    PlayerTable.prototype.fall = function () {
        this.played.removeAll();
    };
    PlayerTable.prototype.closeSequence = function () {
        this.played.removeAll();
    };
    PlayerTable.prototype.addHelmet = function (card) {
        this.played.getCardElement(card).querySelector('.front').insertAdjacentHTML('beforeend', "<div class=\"helmet\"></div>");
    };
    PlayerTable.prototype.makeCardsSelectable = function (selectable) {
        var _a;
        (_a = this.hand) === null || _a === void 0 ? void 0 : _a.setSelectionMode(selectable ? 'single' : 'none');
    };
    return PlayerTable;
}());
var CARD_WIDTH = 140;
var CARD_HEIGHT = 280;
var TableCenter = /** @class */ (function () {
    function TableCenter(game, gamedatas) {
        var _this = this;
        this.game = game;
        this.decks = [];
        var _loop_2 = function (i) {
            var deckDiv = document.getElementById("deck".concat(i));
            this_1.decks[i] = new HiddenDeck(game.cardsManager, deckDiv, {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                cardNumber: gamedatas.decks[i].count,
            });
            deckDiv.addEventListener('click', function () { return _this.game.onDeckClick(i); });
            if (gamedatas.decks[i].top) {
                this_1.decks[i].setCardNumber(gamedatas.decks[i].count - 1);
                this_1.decks[i].addCard(gamedatas.decks[i].top, undefined, {
                    visible: true,
                });
            }
        };
        var this_1 = this;
        for (var i = 1; i <= 2; i++) {
            _loop_2(i);
        }
        this.legendDeck = new VisibleDeck(game.cardsManager, document.getElementById("rewards"), {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            cardNumber: gamedatas.decks[0].count - (gamedatas.decks[0].top ? 1 : 0),
        });
        if (gamedatas.decks[0].top) {
            this.legendDeck.addCard(gamedatas.decks[0].top);
        }
    }
    TableCenter.prototype.flipTopDeck = function (deckId, card) {
        this.decks[deckId].addCard(card, undefined, {
            visible: false,
            autoUpdateCardNumber: false,
        });
        this.game.cardsManager.flipCard(card);
    };
    TableCenter.prototype.updateLegendDeck = function (newCard, newCount) {
        if (newCard) {
            this.legendDeck.addCard(newCard);
        }
        this.legendDeck.setCardNumber(newCount);
    };
    TableCenter.prototype.makeDecksSelectable = function (selectable) {
        for (var i = 1; i <= 2; i++) {
            this.decks[i].setSelectionMode(selectable ? 'single' : 'none');
        }
    };
    return TableCenter;
}());
var ANIMATION_MS = 500;
var ACTION_TIMER_DURATION = 5;
var LOCAL_STORAGE_ZOOM_KEY = 'SkateLegend-zoom';
var LOCAL_STORAGE_JUMP_TO_FOLDED_KEY = 'SkateLegend-jump-to-folded';
var SkateLegend = /** @class */ (function () {
    function SkateLegend() {
        this.playersTables = [];
        this.handCounters = [];
        this.playedCounters = [];
        this.scoredCounters = [];
        this.helmetCounters = [];
        this.TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;
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
    SkateLegend.prototype.setup = function (gamedatas) {
        log("Starting game setup");
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
        document.getElementById("round-counter").insertAdjacentHTML('beforebegin', _("Round number:") + ' ');
        this.roundCounter = new ebg.counter();
        this.roundCounter.create("round-counter");
        this.roundCounter.setValue(gamedatas.roundNumber);
        this.setupNotifications();
        this.setupPreferences();
        this.addHelp();
        log("Ending game setup");
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    SkateLegend.prototype.onEnteringState = function (stateName, args) {
        log('Entering state: ' + stateName, args.args);
        switch (stateName) {
            case 'playCard':
                this.onEnteringPlayCard();
                break;
        }
    };
    SkateLegend.prototype.onEnteringPlayCard = function () {
        var _a;
        if (this.isCurrentPlayerActive()) {
            this.tableCenter.makeDecksSelectable(true);
            (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.makeCardsSelectable(true);
        }
    };
    SkateLegend.prototype.onLeavingState = function (stateName) {
        log('Leaving state: ' + stateName);
        switch (stateName) {
            case 'playCard':
                this.onLeavingPlayCard();
                break;
        }
    };
    SkateLegend.prototype.onLeavingPlayCard = function () {
        var _a;
        this.tableCenter.makeDecksSelectable(false);
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.makeCardsSelectable(false);
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    SkateLegend.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseContinue':
                    var chooseContinueArgs_1 = args;
                    this.addActionButton("continue_button", _("Continue"), function () { return _this.continue(); });
                    this.addActionButton("stop_button", _("Stop"), function () { return _this.stop(chooseContinueArgs_1.shouldNotStop); });
                    if (!chooseContinueArgs_1.canStop) {
                        document.getElementById("stop_button").classList.add('disabled');
                    }
                    break;
                case 'playHelmet':
                    this.addActionButton("playHelmet_button", _("Add helmet on last card"), function () { return _this.playHelmet(); });
                    this.addActionButton("skipHelmet_button", _("Skip"), function () { return _this.skipHelmet(); });
                    break;
            }
        }
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    SkateLegend.prototype.setTooltip = function (id, html) {
        this.addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    };
    SkateLegend.prototype.setTooltipToClass = function (className, html) {
        this.addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    };
    SkateLegend.prototype.getPlayerId = function () {
        return Number(this.player_id);
    };
    SkateLegend.prototype.getPlayerName = function (playerId) {
        return this.gamedatas.players[playerId].name;
    };
    SkateLegend.prototype.getPlayerColor = function (playerId) {
        return this.gamedatas.players[playerId].color;
    };
    SkateLegend.prototype.getPlayerTable = function (playerId) {
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === playerId; });
    };
    SkateLegend.prototype.getCurrentPlayerTable = function () {
        var _this = this;
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === _this.getPlayerId(); });
    };
    SkateLegend.prototype.setupPreferences = function () {
        var _this = this;
        // Extract the ID and value from the UI control
        var onchange = function (e) {
            var match = e.target.id.match(/^preference_[cf]ontrol_(\d+)$/);
            if (!match) {
                return;
            }
            var prefId = +match[1];
            var prefValue = +e.target.value;
            _this.prefs[prefId].value = prefValue;
        };
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        // Call onPreferenceChange() now
        dojo.forEach(dojo.query("#ingame_menu_content .preference_control"), function (el) { return onchange({ target: el }); });
    };
    SkateLegend.prototype.getOrderedPlayers = function (gamedatas) {
        var _this = this;
        var players = Object.values(gamedatas.players).sort(function (a, b) { return a.playerNo - b.playerNo; });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex), true), players.slice(0, playerIndex), true) : players;
        return orderedPlayers;
    };
    SkateLegend.prototype.createPlayerPanels = function (gamedatas) {
        var _this = this;
        Object.values(gamedatas.players).forEach(function (player) {
            var playerId = Number(player.id);
            // hand + scored cards counter
            dojo.place("<div class=\"counters\">\n                <div id=\"playerhand-counter-wrapper-".concat(player.id, "\" class=\"playerhand-counter\">\n                    <div class=\"player-hand-card\"></div> \n                    <span id=\"playerhand-counter-").concat(player.id, "\"></span>\n                </div>\n                <div id=\"played-counter-wrapper-").concat(player.id, "\" class=\"played-counter\">\n                    <div class=\"player-played-card\"></div> \n                    <span id=\"played-counter-").concat(player.id, "\"></span>\n                </div>\n                <div id=\"scored-counter-wrapper-").concat(player.id, "\" class=\"scored-counter\">\n                    <div class=\"player-scored-card\"></div> \n                    <span id=\"scored-counter-").concat(player.id, "\"></span>\n                </div>\n            </div>"), "player_board_".concat(player.id));
            var handCounter = new ebg.counter();
            handCounter.create("playerhand-counter-".concat(playerId));
            handCounter.setValue(player.handCount);
            _this.handCounters[playerId] = handCounter;
            var playedCounter = new ebg.counter();
            playedCounter.create("played-counter-".concat(playerId));
            playedCounter.setValue(player.played.length);
            _this.playedCounters[playerId] = playedCounter;
            var scoredCounter = new ebg.counter();
            scoredCounter.create("scored-counter-".concat(playerId));
            scoredCounter.setValue(player.scoredCount);
            _this.scoredCounters[playerId] = scoredCounter;
            // helmets counter
            dojo.place("<div class=\"counters\">\n                <div id=\"player-helmets-counter-wrapper-".concat(player.id, "\" class=\"player-helmets-counter\">\n                    <div class=\"player-helmets\"></div> \n                    <span id=\"player-helmets-counter-").concat(player.id, "\"></span>\n                </div>\n            </div>"), "player_board_".concat(player.id));
            var helmetCounter = new ebg.counter();
            helmetCounter.create("player-helmets-counter-".concat(playerId));
            helmetCounter.setValue(player.helmets);
            _this.helmetCounters[playerId] = helmetCounter;
            _this.setPlayerActive(playerId, player.active);
        });
        this.setTooltipToClass('player-helmets-counter', _('Number of helmets'));
    };
    SkateLegend.prototype.setPlayerActive = function (playerId, active) {
        document.getElementById("overall_player_board_".concat(playerId)).classList.toggle('inactive', !active);
    };
    SkateLegend.prototype.createPlayerTables = function (gamedatas) {
        var _this = this;
        var orderedPlayers = this.getOrderedPlayers(gamedatas);
        orderedPlayers.forEach(function (player) {
            return _this.createPlayerTable(gamedatas, Number(player.id));
        });
    };
    SkateLegend.prototype.createPlayerTable = function (gamedatas, playerId) {
        var table = new PlayerTable(this, gamedatas.players[playerId]);
        this.playersTables.push(table);
    };
    SkateLegend.prototype.addHelp = function () {
        var _this = this;
        dojo.place("\n            <button id=\"skatelegend-help-button\">?</button>\n        ", 'left-side');
        document.getElementById('skatelegend-help-button').addEventListener('click', function () { return _this.showHelp(); });
    };
    SkateLegend.prototype.showHelp = function () {
        var helpDialog = new ebg.popindialog();
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
    };
    SkateLegend.prototype.onDeckClick = function (number) {
        if (this.gamedatas.gamestate.name == 'pickCard') {
            this.pickCard(number);
        }
        else if (this.gamedatas.gamestate.name == 'revealDeckCard') {
            this.revealTopDeckCard(number);
        }
        else {
            this.playCardFromDeck(number);
        }
    };
    SkateLegend.prototype.continue = function () {
        if (!this.checkAction('continue')) {
            return;
        }
        this.takeAction('continue');
    };
    SkateLegend.prototype.stop = function (warning) {
        var _this = this;
        if (!this.checkAction('stop')) {
            return;
        }
        if (warning) {
            this.confirmationDialog(_("Are you sure you want to stop here? There is no risk if you continue the sequence."), function () { return _this.stop(false); });
            return;
        }
        this.takeAction('stop');
    };
    SkateLegend.prototype.playCardFromHand = function (id) {
        if (!this.checkAction('playCardFromHand')) {
            return;
        }
        this.takeAction('playCardFromHand', {
            id: id
        });
    };
    SkateLegend.prototype.playCardFromDeck = function (number) {
        if (!this.checkAction('playCardFromDeck')) {
            return;
        }
        this.takeAction('playCardFromDeck', {
            number: number
        });
    };
    SkateLegend.prototype.pickCard = function (number) {
        if (!this.checkAction('pickCard')) {
            return;
        }
        this.takeAction('pickCard', {
            number: number
        });
    };
    SkateLegend.prototype.revealTopDeckCard = function (number) {
        if (!this.checkAction('revealTopDeckCard')) {
            return;
        }
        this.takeAction('revealTopDeckCard', {
            number: number
        });
    };
    SkateLegend.prototype.playHelmet = function () {
        if (!this.checkAction('playHelmet')) {
            return;
        }
        this.takeAction('playHelmet');
    };
    SkateLegend.prototype.skipHelmet = function () {
        if (!this.checkAction('skipHelmet')) {
            return;
        }
        this.takeAction('skipHelmet');
    };
    SkateLegend.prototype.takeAction = function (action, data) {
        data = data || {};
        data.lock = true;
        this.ajaxcall("/skatelegend/skatelegend/".concat(action, ".html"), data, this, function () { });
    };
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your pylos.game.php file.

    */
    SkateLegend.prototype.setupNotifications = function () {
        //log( 'notifications subscriptions setup' );
        var _this = this;
        var notifs = [
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
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_".concat(notif[0]));
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
        /*(this as any).notifqueue.setIgnoreNotificationCheck('cardInHandFromPick', (notif: Notif<NotifCardInHandFromPickArgs>) =>
            notif.args.playerId == this.getPlayerId() && !notif.args.card.category
        );*/
    };
    SkateLegend.prototype.notif_flipTopDeck = function (notif) {
        this.tableCenter.flipTopDeck(notif.args.deckId, notif.args.card);
    };
    SkateLegend.prototype.notif_playCard = function (notif) {
        var playerId = notif.args.playerId;
        var fromDeck = notif.args.fromDeck;
        var playerTable = this.getPlayerTable(playerId);
        var currentPlayer = this.getPlayerId() == playerId;
        playerTable.played.addCard(notif.args.card, {
            fromElement: currentPlayer || fromDeck ? undefined : document.getElementById("player-table-".concat(playerId, "-name"))
        });
        if (!fromDeck) { // from hand
            this.handCounters[playerId].incValue(-1);
        }
        this.playedCounters[playerId].incValue(1);
    };
    SkateLegend.prototype.notif_discardedLegendCard = function (notif) {
        var playerId = notif.args.playerId;
        this.getPlayerTable(playerId).discardLegendCard(notif.args.card);
        this.playedCounters[playerId].incValue(-1);
    };
    SkateLegend.prototype.notif_fall = function (notif) {
        var playerId = notif.args.playerId;
        this.getPlayerTable(playerId).fall();
        this.helmetCounters[playerId].incValue(1);
        this.setPlayerActive(playerId, false);
        this.playedCounters[playerId].toValue(0);
    };
    SkateLegend.prototype.notif_closeSequence = function (notif) {
        var playerId = notif.args.playerId;
        this.getPlayerTable(playerId).closeSequence();
        this.setPlayerActive(playerId, false);
        this.playedCounters[playerId].toValue(0);
        this.scoredCounters[playerId].incValue(notif.args.sequence.length);
    };
    SkateLegend.prototype.notif_newRound = function (notif) {
        var _this = this;
        this.roundCounter.toValue(notif.args.roundNumber);
        Object.keys(this.gamedatas.players).forEach(function (id) {
            var playerId = Number(id);
            _this.setPlayerActive(playerId, true);
        });
    };
    SkateLegend.prototype.notif_addHelmet = function (notif) {
        var playerId = notif.args.playerId;
        this.getPlayerTable(playerId).addHelmet(notif.args.card);
        this.setPlayerActive(playerId, false);
        this.helmetCounters[playerId].incValue(-1);
    };
    SkateLegend.prototype.notif_takeTrophyCard = function (notif) {
        var playerId = notif.args.playerId;
        var currentPlayer = this.getPlayerId() == playerId;
        if (currentPlayer && !notif.args.perfectLanding) {
            this.getPlayerTable(playerId).hand.addCard(notif.args.card);
        }
        else {
            this.tableCenter.legendDeck.removeCard(notif.args.card);
        }
        this.tableCenter.updateLegendDeck(notif.args.newCard, notif.args.newCount);
        this.handCounters[playerId].incValue(1);
    };
    SkateLegend.prototype.notif_discardTrophyCard = function (notif) {
        this.tableCenter.legendDeck.removeCard(notif.args.card);
        this.tableCenter.updateLegendDeck(notif.args.newCard, notif.args.newCount);
    };
    SkateLegend.prototype.notif_addCardToHand = function (notif) {
        var playerId = notif.args.playerId;
        var currentPlayer = this.getPlayerId() == playerId;
        if (currentPlayer) {
            this.getPlayerTable(playerId).hand.addCard(notif.args.card, {
                fromElement: document.getElementById("deck".concat(notif.args.fromDeckNumber))
            });
        }
        else {
            // TODO if card is visible, make it invisible
        }
        this.handCounters[playerId].incValue(1);
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    SkateLegend.prototype.format_string_recursive = function (log, args) {
        try {
            if (log && args && !args.processed) {
                if (args.announcement && args.announcement[0] != '<') {
                    args.announcement = "<strong style=\"color: darkred;\">".concat(_(args.announcement), "</strong>");
                }
                if (args.call && args.call.length && args.call[0] != '<') {
                    args.call = "<strong class=\"title-bar-call\">".concat(_(args.call), "</strong>");
                }
                ['discardNumber', 'roundPoints', 'cardsPoints', 'colorBonus', 'cardName', 'cardName1', 'cardName2', 'cardColor', 'cardColor1', 'cardColor2', 'points', 'result'].forEach(function (field) {
                    if (args[field] !== null && args[field] !== undefined && args[field][0] != '<') {
                        args[field] = "<strong>".concat(_(args[field]), "</strong>");
                    }
                });
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return this.inherited(arguments);
    };
    return SkateLegend;
}());
define([
    "dojo", "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
], function (dojo, declare) {
    return declare("bgagame.skatelegend", ebg.core.gamegui, new SkateLegend());
});
