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
    outDir?: string;
}

export function findConfigFile(cwd: string = process.cwd()): string {
    for (const configFile of possibleConfigFiles) {
        const resolvedPath = path.resolve(cwd, configFile);
        if (existsSync(resolvedPath)) {
            return resolvedPath;
        }
    }

    throw new Error('Конфигурационный файл не найден');
}

export async function loadConfig<CurrentAIServiceOptions extends AIServiceOptions>(
    params?: LoadConfigParams
): Promise<Partial<InitParams<CurrentAIServiceOptions>>> {
    const {
        cwd = process.cwd(),
        currentDir = __dirname,
        tsConfig = path.resolve(cwd, 'tsconfig.json')
    } = params || {};
    const configPath = findConfigFile(cwd);
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
        external: ['auto-js-doc-generator', 'esbuild'],
        platform: 'node',
        outfile,
        tsconfig: tsConfig
    });

    const config: { default: { default: Partial<InitParams<CurrentAIServiceOptions>> } } =
        await import(fileURL.href);

    await unlink(outfile);

    return config.default.default;
}
