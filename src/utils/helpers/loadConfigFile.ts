import fs from 'fs';
import fsAsync from 'fs/promises';
import path from 'path';
import 'ts-node/register';
import { pathToFileURL } from 'url';
import { AIServiceOptions, InitParams } from 'src/types/common';
import { Project } from 'ts-morph';

const possibleConfigFiles = ['jsdocgen.config.ts', 'jsdocgen.config.mts', 'jsdocgen.config.cts'];

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
    InitParams<CurrentAIServiceOptions>
> {
    const configPath = findConfigFile();

    const project = new Project({
        tsConfigFilePath: 'tsconfig.json',
        compilerOptions: {
            outDir: pathToFileURL(path.resolve(import.meta.dirname, 'compiled')).href
        }
    });
    project.addSourceFileAtPath(configPath);
    const memoryEmitResult = await project.emitToMemory();
    const memoryEmitResultFiles = memoryEmitResult.getFiles();
    const findIndexFile = memoryEmitResultFiles.find((file) =>
        possibleConfigFiles.includes(path.basename(file.filePath))
    );
    const url = findIndexFile && pathToFileURL(findIndexFile.filePath);

    if (!url) {
        throw new Error('');
    }

    await memoryEmitResult.saveFiles();

    const dir = path.dirname(findIndexFile.filePath);
    const oldPath = path.join(dir, path.basename(findIndexFile.filePath));
    const newPath = path.join(dir, 'jsdocgen.config.mjs');

    await fsAsync.rename(oldPath, newPath);

    const config = await import(pathToFileURL(newPath).href);

    return config.default;
}
