import { existsSync } from 'fs';
import { unlink, stat } from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import type { AIServiceOptions, InitParams } from 'core/types/common';
import { v5 } from 'uuid';

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
    jsDocGenConfig?: string;
}

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

export async function loadConfig<CurrentAIServiceOptions extends AIServiceOptions>(
    params?: LoadConfigParams
): Promise<Partial<InitParams<CurrentAIServiceOptions>>> {
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
        external: ['auto-js-doc-generator', 'esbuild', '@auto-js-doc-generator/core'],
        platform: 'node',
        outfile,
        tsconfig: tsConfig
    });

    const config: { default: { default: Partial<InitParams<CurrentAIServiceOptions>> } } =
        await import(fileURL.href);

    await unlink(outfile);

    return config.default.default;
}
