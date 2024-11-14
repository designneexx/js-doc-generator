import fs from 'fs';
import fsAsync from 'fs/promises';
import path from 'path';
import 'ts-node/register';
import { pathToFileURL } from 'url';
import { AIServiceOptions, InitParams } from 'src/types/common';
import { Project } from 'ts-morph';

const possibleConfigFiles = [
    'jsdocgen.config.ts',
    'jsdocgen.config.mts',
    'jsdocgen.config.cts',
    'jsdocgen.config.js',
    'jsdocgen.config.mjs',
    'jsdocgen.config.cjs'
];

function findConfigFile() {
    for (const configFile of possibleConfigFiles) {
        const resolvedPath = path.resolve(process.cwd(), configFile);
        if (fs.existsSync(resolvedPath)) {
            return resolvedPath;
        }
    }

    throw new Error('Конфигурационный файл не найден');
}

export async function loadConfig<CurrentAIServiceOptions extends AIServiceOptions>(): Promise<
    InitParams<CurrentAIServiceOptions> | null
> {
    const configPath = findConfigFile();

    const project = new Project({
        tsConfigFilePath: 'tsconfig.json',
        compilerOptions: {
            outDir: path.resolve(import.meta.dirname, 'compiled')
        },
        skipAddingFilesFromTsConfig: true
    });
    project.addSourceFileAtPath(configPath);
    const memoryEmitResult = await project.emitToMemory();
    const memoryEmitResultFiles = memoryEmitResult.getFiles();
    const findedConfigFile = memoryEmitResultFiles.find((file) =>
        possibleConfigFiles.includes(path.basename(file.filePath))
    );

    if (!findedConfigFile) {
        return null;
    }

    await memoryEmitResult.saveFiles();

    const dir = path.dirname(findedConfigFile.filePath);
    const oldPath = path.join(dir, path.basename(findedConfigFile.filePath));
    const newPath = path.join(dir, 'jsdocgen.config.mjs');

    await fsAsync.rename(oldPath, newPath);

    const config = await import(pathToFileURL(newPath).href);

    return config.default;
}
