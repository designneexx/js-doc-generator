import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { AIServiceOptions, InitParams } from 'src/types/common';

const compiledJSDocGenConfigFileName = 'jsdocgen.config.js';

const possibleConfigFiles = [
    'jsdocgen.config.ts',
    'jsdocgen.config.mts',
    'jsdocgen.config.cts',
    'jsdocgen.config.js',
    'jsdocgen.config.mjs',
    'jsdocgen.config.cjs'
];

export interface LoadConfigParams {
    cwd?: string;
    currentDir?: string;
    tsConfig?: string;
    outDir?: string;
}

export function findConfigFile(cwd = process.cwd()) {
    for (const configFile of possibleConfigFiles) {
        const resolvedPath = path.resolve(cwd, configFile);
        if (fs.existsSync(resolvedPath)) {
            return resolvedPath;
        }
    }

    throw new Error('Конфигурационный файл не найден');
}

export async function loadConfig<CurrentAIServiceOptions extends AIServiceOptions>(
    params?: LoadConfigParams
): Promise<InitParams<CurrentAIServiceOptions> | null> {
    const {
        cwd = process.cwd(),
        currentDir = __dirname,
        outDir = path.resolve(currentDir, 'compiled'),
        tsConfig = path.resolve(cwd, 'tsconfig.json')
    } = params || {};
    const configPath = findConfigFile(cwd);
    const esbuild =  await import('esbuild');

    await esbuild.build({
        entryPoints: [configPath],
        bundle: true,
        external: ['auto-js-doc-generator', 'esbuild'],
        platform: 'node',
        outfile: path.resolve(outDir, compiledJSDocGenConfigFileName),
        tsconfig: tsConfig
    });

    const newPath = path.resolve(outDir, compiledJSDocGenConfigFileName);
    const isExists = fs.existsSync(newPath);
    const isExistsHref = fs.existsSync(pathToFileURL(newPath).href);
    console.log({isExists, isExistsHref});
    const config = await import(pathToFileURL(newPath).href);

    return config.default;
}
