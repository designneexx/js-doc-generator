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
        /**
         * Resolved path based on the current working directory and jsDocGenConfig.
         * @type {string}
         */
        const resolvedPath = path.resolve(cwd, jsDocGenConfig);

        if (existsSync(resolvedPath)) {
            return resolvedPath;
        }
    }

    for (const configFile of possibleConfigFiles) {
        /**
         * Resolved path to the configuration file.
         * @type {string}
         */
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
    /**
     * Параметры для настройки генерации JSDoc.
     * @typedef {Object} JsDocGenParams
     * @property {string} [cwd=process.cwd()] - Текущая рабочая директория.
     * @property {string} [currentDir=__dirname] - Текущая директория.
     * @property {Object} jsDocGenConfig - Конфигурация для генерации JSDoc.
     * @property {string} [tsConfig=tsconfig.json] - Базовый конфигурационный файл TypeScript.
     */
    const {
        cwd = process.cwd(),
        currentDir = __dirname,
        jsDocGenConfig,
        tsConfig: tsConfigBase = 'tsconfig.json'
    } = params || {};
    /**
     * Путь к файлу tsconfig.json, объединяющий текущую рабочую директорию и базовое имя файла tsconfig.
     * @type {string}
     */
    const tsConfig = path.resolve(cwd, tsConfigBase);
    /**
     * Путь к файлу конфигурации.
     * @type {string}
     */
    const configPath = findConfigFile(cwd, jsDocGenConfig);
    /**
     * Информация о файле
     * @typedef {Object} Stats
     * @property {number} size - Размер файла в байтах
     * @property {Date} atime - Время последнего доступа к файлу
     * @property {Date} mtime - Время последнего изменения файла
     * @property {Date} ctime - Время последнего изменения статуса файла
     * @property {Date} birthtime - Время создания файла
     */
    const fileStat = await stat(configPath);
    /**
     * Время последнего изменения файла в миллисекундах.
     * @type {number}
     */
    const mtime = fileStat.mtime.getTime();
    /**
     * Уникальный идентификатор, созданный на основе времени изменения файла.
     * @type {string}
     */
    const uuid = v5(mtime.toString(), v5.URL);

    /**
     * Переменная, содержащая модуль esbuild
     * @type {Object}
     */
    const esbuild = await import('esbuild');
    /**
     * Полный путь к файлу, который будет создан
     * @type {string}
     */
    const outfile = path.resolve(currentDir, uuid);
    /**
     * Переменная, содержащая URL файла.
     * @type {URL}
     */
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

    /**
     * Конфигурационный объект, содержащий параметры инициализации
     * @typedef {Object} Config
     * @property {Object} default - Объект с параметрами по умолчанию
     * @property {Partial<InitParams>} default.default - Частичные параметры инициализации
     */
    const config: { default: { default: Partial<InitParams> } } = await import(fileURL.href);

    await unlink(outfile);

    return config.default.default;
}
