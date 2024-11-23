#!/usr/bin/env node
import { Command } from 'commander';
import packageJSON from '../package.json';
import { AIServiceOptions, InitParams } from './types/common';
import { loadConfig } from './utils/helpers/loadConfigFile';
import { init } from '.';

const program = new Command();

program
    .name('js-doc-generator')
    .description('CLI для автоматической генерации JSDoc')
    .version(packageJSON.version);

program
    .command('generate')
    .description(
        'Автоматически добавить комментарии JSDoc к вашему списку файлов. Поддерживается только TypeScript'
    )
    .argument('<string>', 'glob ваши файлы для обработки')
    .action(async (files) => {
        await start({ files: [files] });
    });

program.parse();

export async function start<CurrentAIServiceOptions extends AIServiceOptions>(
    overrideConfig?: Partial<InitParams<CurrentAIServiceOptions>>
) {
    const config = await loadConfig<CurrentAIServiceOptions>();

    if(!config) return;

    await init({ ...config, ...overrideConfig });
}
