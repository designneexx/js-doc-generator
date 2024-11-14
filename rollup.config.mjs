import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import {dts} from 'rollup-plugin-dts';
import json from '@rollup/plugin-json';
import del from 'rollup-plugin-delete';
import external from 'rollup-plugin-peer-deps-external';
import commonjs from '@rollup/plugin-commonjs';
import shebang from 'rollup-plugin-preserve-shebang';
import resolve from '@rollup/plugin-node-resolve'
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
                extend: true,
                entryFileNames: '[name].js',
                format: 'commonjs',
                interop: 'auto',
            },
        ],
        plugins: [
            del({ targets: 'dist/*' }),
            typescript({tsconfig: './tsconfig.json'}),
            resolve(),
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
