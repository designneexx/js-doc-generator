import path from 'path';
import fs from 'fs';
import tsnode from 'ts-node'
import { AIServiceOptions, InitParams } from 'src/types/common';

function findConfigFile() {
    const possibleConfigFiles = [
        'jsdocgen.config.ts',
        'jsdocgen.config.mts',
        'jsdocgen.config.cts'
    ];

    for (const configFile of possibleConfigFiles) {
        const resolvedPath = path.resolve(process.cwd(), configFile);
        if (fs.existsSync(resolvedPath)) {
            return resolvedPath;
        }
    }

    throw new Error('Конфигурационный файл не найден');
}

export async function loadConfig<CurrentAIServiceOptions extends AIServiceOptions>(): Promise<InitParams<CurrentAIServiceOptions>> {
    tsnode.register();
    
    const configPath = findConfigFile();
    const config = await import(configPath);

    return config;
}
