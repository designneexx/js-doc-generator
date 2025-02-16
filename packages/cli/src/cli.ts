import { createJSDocGeneratorService } from '@auto-js-doc-generator/client';
import { type InitParams, init } from '@auto-js-doc-generator/core';
import { Command } from 'commander';
import packageJSON from '../package.json';
import { loadConfig } from './loadConfigFile';

/**
 * Represents a type that makes all properties of the original type `T` optional recursively.
 * If `T` is an object, each property will be optional, including nested properties.
 * If `T` is not an object, it will remain as is.
 * @template T - The original type to make partial.
 */
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

/**
 * Интерфейс для параметров конфигурации.
 */
export interface ConfigParams {
    /**
     * Путь к файлу tsconfig.json.
     */
    tsConfig?: string;
    /**
     * Рабочая директория, в которой будет выполняться процесс.
     */
    cwd?: string;
    /**
     * Путь к файлу конфигурации.
     */
    config?: string;
    /**
     * URL-адрес, который может быть использован в конфигурации.
     */
    url?: string;
}

/**
 * Функция для запуска CLI генератора документации JSDoc.
 * @returns {Command} - Объект Command для настройки CLI команд.
 */
export function runByCli(): Command {
    const command = new Command();

    command
        .name('js-doc-generator')
        .description(
            'CLI для автоматической генерации документации JSDoc к вашему коду на TypeScript или JavaSript'
        )
        .version(packageJSON.version);

    command
        .command('generate')
        .option(
            '--cwd',
            'Базовая директория для началы работы генерации документации. Библиотека берет от начала этого пути конфигурационный файл и читает tsconfig.json, если конфиг написан на TS'
        )
        .option(
            '--tsconfig <tsconfig>',
            'Путь до конфига TypeScript, если конфигурационный файл написан на TS. По умолчанию tsconfig.json'
        )
        .option(
            '--config',
            'Путь до файла конфигурации. По умолчанию jsdocgen.config.{js,cjs,mjs,ts,cts,mts}',
            ''
        )
        .option('--url <url>', 'Путь до вашего сервера с ИИ', '')
        .action(async (opts: ConfigParams) => {
            /**
             * @typedef {Object} ConfigParams
             * @property {string} cwd - Базовая директория для начала работы генерации документации.
             * @property {string} tsConfig - Путь до конфига TypeScript.
             * @property {string} config - Путь до файла конфигурации.
             */
            const { cwd, tsConfig, config, url } = opts;

            await start({ cwd, tsConfig, config, url });
        });

    return command;
}

/**
 * Функция для запуска процесса инициализации с заданными параметрами конфигурации и возможностью их переопределения.
 * @param {ConfigParams | null} configParams - Параметры конфигурации, которые можно передать для загрузки.
 * @param {DeepPartial<InitParams>} overrideConfig - Переопределенные параметры инициализации.
 * @returns {Promise<void>} - Промис, который завершится после успешного завершения инициализации.
 */
export async function start(
    configParams?: ConfigParams | null,
    overrideConfig?: DeepPartial<InitParams>
): Promise<void> {
    try {
        const { url, ...params } = configParams || {};
        const config = await loadConfig({ ...params }).catch(() => ({}) as Partial<InitParams>);

        let client;

        if (url?.trim()) {
            client = createJSDocGeneratorService(url);
        }

        await init({
            files: [],
            jsDocGeneratorService: client,
            ...config,
            ...overrideConfig,
            projectOptions: {
                ...config?.projectOptions,
                ...overrideConfig?.projectOptions,
                tsConfigFilePath:
                    params.tsConfig ||
                    config?.projectOptions?.tsConfigFilePath ||
                    overrideConfig?.projectOptions?.tsConfigFilePath ||
                    'tsconfig.json'
            },
            globalGenerationOptions: {
                ...config.globalGenerationOptions,
                ...overrideConfig?.globalGenerationOptions
            }
        } as InitParams);
    } catch (e) {
        const err = e as Error;
        console.log(
            'Не удалось прочитать файл конфигурации или запустить генерацию js doc. Подробнее об ошибке: ',
            err.message
        );
        process.exit(1);
    }
}
