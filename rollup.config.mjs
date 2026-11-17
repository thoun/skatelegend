import './build/legacy-libs.mjs';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/ts/Game.ts',
    output: {
        file: 'modules/js/Game.js',
        format: 'es',
        sourcemap: false,
        inlineDynamicImports: true,
    },
    plugins: [
        typescript({
            tsconfig: './tsconfig.json',
            outDir: 'modules/js',
        }),
    ],
    treeshake: false,
};
