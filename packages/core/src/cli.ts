import { Command } from 'commander';
import packageJSON from '../package.json';
import {
    type AIServiceOptions,
    type DeepPartial,
    type InitParams,
    KindDeclarationNames
} from './types/common';
import { loadConfig } from './utils/helpers/loadConfigFile';
import { init } from './utils/init';

export interface ConfigParams {
    tsConfig?: string;
    cwd?: string;
    config?: string;
}

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
            const parsedOptions: ConfigParams = options;
            const { cwd, tsConfig, config } = parsedOptions;

            await start({cwd, tsConfig, config});
        });

    return command;
}

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
