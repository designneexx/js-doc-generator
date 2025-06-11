import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const __dirname = import.meta.dirname;

const compat = new FlatCompat({
    baseDirectory: __dirname, // optional; default: process.cwd()
    recommendedConfig: js.configs.recommended // optional unless using "eslint:recommended"
});

const config = tseslint.config(
    {
        ignores: ['node_modules', 'packages/*/node_modules', 'packages/*/dist']
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...compat.config({
        extends: ['plugin:import/recommended', 'plugin:prettier/recommended'],
        plugins: ['unused-imports', 'prettier'],
        rules: {
            'class-methods-use-this': 'error',
            'import/namespace': 'error',
            'import/no-unresolved': 'off',
            'import/order': [
                'error',
                {
                    alphabetize: {
                        caseInsensitive: true,
                        order: 'asc'
                    }
                }
            ],
            'prettier/prettier': [
                'error',
                {
                    endOfLine: 'auto'
                }
            ],
            'unused-imports/no-unused-imports': ['error']
        }
    })
);

export default config;
