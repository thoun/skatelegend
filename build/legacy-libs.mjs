import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Preserve the pinned unofficial sources for type checking. Runtime loading uses
// their separate AMD files, matching Castle Combo.
const root = new URL('../', import.meta.url);
const sources = [
    "node_modules/bga-help/src/help-manager.ts",
    "node_modules/bga-animations/src/animations.ts",
    "node_modules/bga-animations/src/animations/attach-with-animation.ts",
    "node_modules/bga-animations/src/animations/cumulated-animations.ts",
    "node_modules/bga-animations/src/animations/slide-animation.ts",
    "node_modules/bga-animations/src/animations/slide-to-animation.ts",
    "node_modules/bga-animations/src/animations/pause-animation.ts",
    "node_modules/bga-animations/src/animations-utils.ts",
    "node_modules/bga-animations/src/animation-manager.ts",
    "node_modules/bga-cards/src/animations.ts",
    "node_modules/bga-cards/src/sort.ts",
    "node_modules/bga-cards/src/stocks/card-stock.ts",
    "node_modules/bga-cards/src/stocks/deck.ts",
    "node_modules/bga-cards/src/stocks/line-stock.ts",
    "node_modules/bga-cards/src/stocks/slot-stock.ts",
    "node_modules/bga-cards/src/stocks/void-stock.ts",
    "node_modules/bga-cards/src/card-manager.ts"
];
const output = new URL('.build/legacy-libs.ts', root);
const code = [
    '// Generated from pinned unofficial library sources. Do not edit.',
    // These libraries consume the framework GUI, not the standalone Game class.
    'type Game = GameGui;',
    ...sources.map(source => `// ${source}\n${readFileSync(new URL(source, root), 'utf8')}`),
    'export { AnimationManager, HelpManager, BgaHelpPopinButton, CardManager, Deck, LineStock, SlotStock, VoidStock, BgaSlideAnimation };',
].join('\n\n');
mkdirSync(new URL('.build/', root), { recursive: true });
writeFileSync(fileURLToPath(output), code + '\n');

// The published files omit constructors already used by the game from their
// AMD export objects. Extend those export maps without changing implementations.
mkdirSync(new URL('modules/js/', root), { recursive: true });
for (const [name, extraExports] of [
    ['bga-help', ['BgaHelpPopinButton']],
    ['bga-animations', ['AnimationManager']],
    ['bga-cards', []],
]) {
    const source = readFileSync(new URL(`node_modules/${name}/${name}.js`, root), 'utf8');
    const marker = 'define({';
    if (source.split(marker).length !== 2) {
        throw new Error(`Expected one AMD export map in ${name}`);
    }
    const additions = extraExports.map(symbol => `    ${symbol}: ${symbol},`).join('\n');
    const code = additions ? source.replace(marker, `${marker}\n${additions}`) : source;
    writeFileSync(new URL(`modules/js/${name}.js`, root), code);
}
