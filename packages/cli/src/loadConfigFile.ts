import { existsSync } from 'fs';
import { unlink, stat } from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import type { InitParams } from '@auto-js-doc-generator/core';
import { v5 } from 'uuid';

/**
 * Массив возможных конфигурационных файлов для JSDocGen.
 * @type {string[]}
 */
const possibleConfigFiles = [
    'jsdocgen.config.ts',
    'jsdocgen.config.mts',
    'jsdocgen.config.cts',
    'jsdocgen.config.js',
    'jsdocgen.config.mjs',
    'jsdocgen.config.cjs'
];

/**
 * Параметры конфигурации загрузки.
 */
export interface LoadConfigParams {
    /**
     * Текущая рабочая директория.
     */
    cwd?: string;
    /**
     * Текущая директория.
     */
    currentDir?: string;
    /**
     * Путь к файлу tsconfig.
     */
    tsConfig?: string;
    /**
     * Путь к файлу конфигурации jsDocGen.
     */
    jsDocGenConfig?: string;
}

/**
 * Находит конфигурационный файл для jsDocGen.
 * @param {string} [cwd=process.cwd()] - Текущая рабочая директория.
 * @param {string} [jsDocGenConfig=''] - Путь к пользовательскому конфигу.
 * @returns {string} - Путь к найденному конфигурационному файлу.
 */
export function findConfigFile(cwd: string = process.cwd(), jsDocGenConfig = ''): string {
    if (jsDocGenConfig) {
        const resolvedPath = path.resolve(cwd, jsDocGenConfig);

        if (existsSync(resolvedPath)) {
            return resolvedPath;
        }
    }

    for (const configFile of possibleConfigFiles) {
        const resolvedPath = path.resolve(cwd, configFile);
        if (existsSync(resolvedPath)) {
            return resolvedPath;
        }
    }

    throw new Error('Конфигурационный файл jsdocgen.config.{js,cjs,mjs,ts,cts,mts} не найден');
}

/**
 * Асинхронно загружает конфигурацию и возвращает часть параметров инициализации.
 * @param {LoadConfigParams} [params] - Параметры загрузки конфигурации.
 * @returns {Promise<Partial<InitParams>>} Часть параметров инициализации.
 */
export async function loadConfig(params?: LoadConfigParams): Promise<Partial<InitParams>> {
    const {
        cwd = process.cwd(),
        currentDir = __dirname,
        jsDocGenConfig,
        tsConfig: tsConfigBase = 'tsconfig.json'
    } = params || {};
    const tsConfig = path.resolve(cwd, tsConfigBase);
    const configPath = findConfigFile(cwd, jsDocGenConfig);
    const fileStat = await stat(configPath);
    const mtime = fileStat.mtime.getTime();
    const uuid = v5(mtime.toString(), v5.URL);

    const esbuild = await import('esbuild');
    const outfile = path.resolve(currentDir, uuid);
    const fileURL = pathToFileURL(outfile);

    fileURL.searchParams.append('mtime', mtime.toString());

    await esbuild.build({
        entryPoints: [configPath],
        bundle: true,
        packages: 'external',
        external: [
            'auto-js-doc-generator',
            'esbuild',
            '@auto-js-doc-generator/core',
            '@auto-js-doc-generator/client',
            'auto-js-doc-generator'
        ],
        platform: 'node',
        outfile,
        tsconfig: tsConfig
    });

    const config: { default: { default: Partial<InitParams> } } = await import(fileURL.href);

    await unlink(outfile);

    return config.default.default;
}
