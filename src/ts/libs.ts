import type * as Legacy from '../../.build/legacy-libs';

const BgaZoom: typeof globalThis.BgaZoom = await globalThis.importEsmLib('bga-zoom', '1.x');
const BgaJumpTo: typeof globalThis.BgaJumpTo = await globalThis.importEsmLib('bga-jump-to', '1.x');

const [BgaHelp, BgaAnimations, BgaCards] = await globalThis.importDojoLibs([
    g_gamethemeurl + 'modules/js/bga-help.js',
    g_gamethemeurl + 'modules/js/bga-animations.js',
    g_gamethemeurl + 'modules/js/bga-cards.js',
]);

export { BgaZoom, BgaJumpTo };
export const AnimationManager: typeof Legacy.AnimationManager = BgaAnimations.AnimationManager;
export type AnimationManager = Legacy.AnimationManager;
export const HelpManager: typeof Legacy.HelpManager = BgaHelp.HelpManager;
export const BgaHelpPopinButton: typeof Legacy.BgaHelpPopinButton = BgaHelp.BgaHelpPopinButton;
export const CardManager: typeof Legacy.CardManager = BgaCards.CardManager;
export const Deck: typeof Legacy.Deck = BgaCards.Deck;
export type Deck<T> = Legacy.Deck<T>;
export const LineStock: typeof Legacy.LineStock = BgaCards.LineStock;
export type LineStock<T> = Legacy.LineStock<T>;
export const SlotStock: typeof Legacy.SlotStock = BgaCards.SlotStock;
export type SlotStock<T> = Legacy.SlotStock<T>;
export const VoidStock: typeof Legacy.VoidStock = BgaCards.VoidStock;
export type VoidStock<T> = Legacy.VoidStock<T>;
export const BgaSlideAnimation: typeof Legacy.BgaSlideAnimation = BgaAnimations.BgaSlideAnimation;
