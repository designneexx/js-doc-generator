import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import {dts} from 'rollup-plugin-dts';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

import del from 'rollup-plugin-delete';
import external from 'rollup-plugin-peer-deps-external';
import commonjs from '@rollup/plugin-commonjs';
import { globSync } from 'glob';
import shebang from 'rollup-plugin-preserve-shebang';


/**
 * @type {import('rollup').RollupOptions[]}
 */
export default [
    {
        input: 'src/index.ts',
        output: [
            {
                dir: 'dist',
                entryFileNames: '[name].js',
                format: 'cjs',
            },
            {
                dir: 'dist',
                entryFileNames: '[name].es.js',
                format: 'esm',
            },
        ],
        plugins: [
            shebang(),
            del({ targets: 'dist/*' }),
            typescript({tsconfig: './tsconfig.json'}),
            // nodeResolve(),
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
    // {
    //     input: 'src/index.ts',
    //     output: [
    //       {
    //         format: 'esm',
    //         dir: 'dist',
    //         entryFileNames: '[name].d.ts',            
    //       },
    //     ],
    //     plugins: [dts()],
    //   },
    // {
    //     input: './dist/dts/index.d.ts',
    //     output: [{ file: 'dist/index.d.ts', format: 'es' }],
    //     plugins: [
    //         dts(),
    //         del({ hook: "buildEnd", targets: "./dist/dts" }), //<------ New Addition
    //     ]
    // }
]
