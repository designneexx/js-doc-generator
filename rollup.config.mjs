import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import {dts} from 'rollup-plugin-dts';
import json from '@rollup/plugin-json';
import del from 'rollup-plugin-delete';
import external from 'rollup-plugin-peer-deps-external';
import commonjs from '@rollup/plugin-commonjs';
import shebang from 'rollup-plugin-preserve-shebang';
import { globSync } from 'glob';

/**
 * @type {import('rollup').RollupOptions[]}
 */
export default [
    {
        input: [ 'src/index.ts', 'src/cli.ts'],
        output: [
            {
                dir: 'dist',
                exports: 'named',
                externalImportAttributes: true,
                externalLiveBindings: true,
                extend: true,
                entryFileNames: '[name].cjs',
                format: 'cjs',
                interop: 'auto',
            },
            {
                dir: 'dist',
                interop: 'auto',
                externalImportAttributes: true,
                externalLiveBindings: true,
                extend: true,
                exports: 'named',
                entryFileNames: '[name].mjs',
                format: 'esm',
            },
        ],
        plugins: [
            del({ targets: 'dist/*' }),
            typescript({tsconfig: './tsconfig.json'}),
            json(),
            commonjs(),
            external(),
            terser({
                format: {
                    comments: 'all',
                    beautify: true,
                    ecma: '2022'
                },
                compress: false,
                mangle: false,
                module: true
            }),
        ]
    },
    {
        input: 'dist/dts/index.d.ts',
        output: [{ dir: 'dist', entryFileNames: '[name].ts', format: 'es' }],
        plugins: [
            del({targets: 'dist/dts/*', hook: 'buildEnd'}),
            dts({tsconfig: './tsconfig.json'}),
        ]
    },
]
