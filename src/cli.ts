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

export interface ParsedOptions {
    kinds?: `${KindDeclarationNames}` | `${KindDeclarationNames}`[] | null;
    files?: string[] | string | null;
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
        .option('--kinds [value]', 'Список узлов для генерации документации', [] as string[])
        .option('--files [value]', 'Список файлов для генерации комментариев JSDoc', [] as string[])
        .action(async (_arg, options) => {
            const parsedOptions: ParsedOptions = options;
            const { files, kinds } = parsedOptions;
            const overrideConfig: DeepPartial<InitParams> = {};

            if (files) {
                overrideConfig.files = Array.isArray(files) ? files : [files];
            }

            if (kinds) {
                overrideConfig.globalGenerationOptions = {
                    kinds: Array.isArray(kinds) ? kinds : [kinds]
                };
            }

            await start(overrideConfig);
        });

    return command;
}

export async function start<CurrentAIServiceOptions extends AIServiceOptions>(
    overrideConfig?: DeepPartial<InitParams<CurrentAIServiceOptions>>
): Promise<void> {
    const config = await loadConfig<CurrentAIServiceOptions>();

    await init({
        ...config,
        ...overrideConfig,
        globalGenerationOptions: {
            ...config.globalGenerationOptions,
            ...overrideConfig?.globalGenerationOptions
        }
    } as InitParams<CurrentAIServiceOptions>);
}
