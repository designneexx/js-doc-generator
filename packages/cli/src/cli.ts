import { Command } from 'commander';
import packageJSON from '../package.json';
import {
    type AIServiceOptions,
    type InitParams,
    init
} from '@auto-js-doc-generator/core';
import { loadConfig } from './loadConfigFile';

/**
 * Represents a type that makes all properties of the original type optional recursively.
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
}

/**
 * Функция для запуска CLI генератора документации JSDoc.
 * @returns {Command} Возвращает объект Command для дальнейшей настройки CLI.
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
        .option('--cwd', 'Базовая директория для началы работы генерации документации. Библиотека берет от начала этого пути конфигурационный файл и читает tsconfig.json, если конфиг написан на TS')
        .option('--tsconfig', 'Путь до конфига TypeScript, если конфигурационный файл написан на TS. По умолчанию tsconfig.json')
        .option('--config', 'Путь до файла конфигурации. По умолчанию jsdocgen.config.{js,cjs,mjs,ts,cts,mts}', '')
        .action(async (_arg, options) => {
            /**
             * @typedef {Object} ConfigParams
             * @property {string} cwd - Базовая директория для начала работы генерации документации.
             * @property {string} tsConfig - Путь до конфига TypeScript.
             * @property {string} config - Путь до файла конфигурации.
             */
            const parsedOptions: ConfigParams = options;
            const { cwd, tsConfig, config } = parsedOptions;

            await start({cwd, tsConfig, config});
        });

    return command;
}

/**
 * Функция start запускает процесс инициализации и запуска генерации документации по переданным параметрам конфигурации.
 *
 * @template CurrentAIServiceOptions - обобщенный тип параметров сервиса AI
 * @param {ConfigParams | null} [configParams] - параметры конфигурации, которые могут быть переданы или оставлены пустыми
 * @param {DeepPartial<InitParams<CurrentAIServiceOptions>>} [overrideConfig] - переопределенные параметры конфигурации
 * @returns {Promise<void>} - промис, который завершается после успешной инициализации и запуска генерации
 */
export async function start<CurrentAIServiceOptions extends AIServiceOptions>(
    configParams?: ConfigParams | null,
    overrideConfig?: DeepPartial<InitParams<CurrentAIServiceOptions>>
): Promise<void> {
    try {
        const config = await loadConfig<CurrentAIServiceOptions>({...configParams});

        await init({
            ...config,
            ...overrideConfig,
            globalGenerationOptions: {
                ...config.globalGenerationOptions,
                ...overrideConfig?.globalGenerationOptions
            }
        } as InitParams<CurrentAIServiceOptions>);
    } catch(e) {
        const err = e as Error;
        console.log('Не удалось прочитать файл конфигурации или запустить генерацию js doc. Подробнее об ошибке: ', err.message);
        process.exit(1);
    }
}