import chalk from 'chalk';
import { Cache } from 'file-system-cache';
import { Project } from 'ts-morph';
import winston from 'winston';
import { type AIServiceOptions, type InitParams, KindDeclarationNames } from '../types/common';
import { createFileCacheManagerMap } from './helpers/createFileCacheManagerMap';
import { extractDeclarationsFromSourceFile } from './helpers/extractDeclarationsFromSourceFile';
import { filterExtractedDeclarationsByKinds } from './helpers/filterExtractedDeclarationsByKinds';
import { flattenAndProcessDeclarations } from './helpers/flattentAndProcessDeclarations';
import { isNodeInCache } from './helpers/isNodeInCache';
import { isPromiseResolvedAndTrue } from './helpers/isPromiseResolvedAndTrue';
import { saveJSDocProcessedInCache } from './helpers/saveJSDocsProcessedInCache';
import { JSDocInitializer, type JSDocInitializerConstructor } from './JSDocInitializer';

/**
 * Инициализирует процесс генерации JSDoc комментариев для заданных исходных файлов проекта.
 *
 * @template CurrentAIServiceOptions - Тип опций для текущего AI сервиса.
 * @param {InitParams<CurrentAIServiceOptions>} params - Параметры инициализации, включающие в себя:
 * @param {ProjectOptions} params.projectOptions - Опции для создания проекта.
 * @param {ESLint.Options} params.esLintOptions - Опции для конфигурации ESLint.
 * @param {string[]} params.files - Массив путей к файлам, для которых будет выполнена генерация JSDoc.
 * @param {JSDocGeneratorService} params.jsDocGeneratorService - Сервис для генерации JSDoc.
 * @param {GlobalGenerationOptions} params.globalGenerationOptions - Глобальные опции генерации.
 * @param {DetailGenerationOptions} params.detailGenerationOptions - Детализированные опции генерации.
 * @returns {Promise<void>} - Возвращает Promise, который разрешается после завершения генерации JSDoc и сохранения изменений.
 */
export async function init<CurrentAIServiceOptions extends AIServiceOptions>(
    params: InitParams<CurrentAIServiceOptions>
): Promise<void> {
    const {
        projectOptions,
        files,
        jsDocGeneratorService,
        globalGenerationOptions,
        detailGenerationOptions,
        cacheDir = './.cache',
        cacheOptions
    } = params;
    const cache = new Cache({
        basePath: cacheDir, // (optional) Path where cache files are stored (default).
        ns: 'jsdocgen', // (optional) A grouping namespace for items.
        hash: 'sha1', // (optional) A hashing algorithm used within the cache key.
        ...cacheOptions
    });
    const logger = winston.createLogger({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        transports: [new winston.transports.Console()]
    });

    logger.info(`Запуск кодогенерации ${chalk.yellow('designexx JSDocGenerator')}`);

    const project = new Project({ ...projectOptions });

    logger.info(chalk.yellow('Пытаюсь получить информацию из кэша...'));

    const fileCacheManagerMap = await createFileCacheManagerMap(cache);

    logger.info(
        fileCacheManagerMap.size === 0
            ? chalk.gray('База кэша пуста')
            : chalk.green('Успешно загружена информация из кэша')
    );

    const config: JSDocInitializerConstructor<CurrentAIServiceOptions> = {
        project,
        jsDocGeneratorService,
        globalGenerationOptions,
        detailGenerationOptions,
        fileCacheManagerMap,
        isNodeInCache,
        logger
    };
    const kinds = globalGenerationOptions?.kinds || [];
    const sourceFiles = project.addSourceFilesAtPaths(files);

    logger.info(`${chalk.gray('Файлов в проекте загружено: ')} ${chalk.bold(sourceFiles.length.toString())}`);

    const sourceFilesJSDocProcess = sourceFiles.map(async (sourceFile) => {
        logger.info(
            `${chalk.gray('Обработка всех документируемых узлов в файле ')} ${chalk.bold(sourceFile.getFilePath())}`
        );

        const jsDocInitializer = new JSDocInitializer(config, sourceFile);
        const jsDocProviderRegistry = {
            [KindDeclarationNames.ClassDeclaration]: jsDocInitializer.createJSDocClass,
            [KindDeclarationNames.EnumDeclaration]: jsDocInitializer.createJSDocEnum,
            [KindDeclarationNames.InterfaceDeclaration]: jsDocInitializer.createJSDocInterface,
            [KindDeclarationNames.FunctionDeclaration]: jsDocInitializer.createJSDocFunction,
            [KindDeclarationNames.VariableStatement]: jsDocInitializer.createJSDocVariableStatement,
            [KindDeclarationNames.TypeAliasDeclaration]: jsDocInitializer.createJSDocTypeAlias
        };
        const extractedDeclarations = extractDeclarationsFromSourceFile(sourceFile);
        const allowedExtractedDeclarations = filterExtractedDeclarationsByKinds(
            extractedDeclarations,
            kinds
        );
        const listOfFlattenedJSDocProcess = flattenAndProcessDeclarations(
            jsDocProviderRegistry,
            allowedExtractedDeclarations
        );
        const processedDeclarations = await Promise.allSettled(listOfFlattenedJSDocProcess);
        const processedDeclarationErrors: PromiseRejectedResult[] = processedDeclarations.filter(
            (item) => item.status === 'rejected'
        );
        const isDeclarationSucessProcessed = processedDeclarations.some(
            isPromiseResolvedAndTrue,
            false
        );

        if (processedDeclarationErrors.length === processedDeclarations.length) {
            throw new Error(
                'Не удалось сохранить изменения в файле, так как обработка всех узлов завершилась с ошибками'
            );
        }

        return isDeclarationSucessProcessed;
    });
    const sourceFilesJSDocProcessed = await Promise.allSettled(sourceFilesJSDocProcess);

    const isSourceFileSuccessProcessed = sourceFilesJSDocProcessed.some(
        isPromiseResolvedAndTrue,
        false
    );

    if (isSourceFileSuccessProcessed) {
        logger.info(chalk.gray('Сохраняю все изменения в проекте...'));

        try {
            await project.save();
        } catch (e) {
            logger.error(chalk.red('Не удалось сохранить проект:\n', JSON.stringify(e)));

            return;
        }

        logger.info(chalk.green('Проект успешно сохранен.'));

        logger.info('Сохраняю данные в кэш');

        try {
            await saveJSDocProcessedInCache({
                cache,
                projectOptions,
                kinds,
                files
            });

            logger.info(chalk.green('Обработка сохранена в кэше'));
        } catch (e) {
            logger.error(chalk.red('Не удалось сохранить кэш'), e);
        }
    } else {
        logger.info(chalk.green('Нет изменений для сохранения'));
    }
}
