import path from 'path';
import { Cache } from 'file-system-cache';
import { Project, SyntaxKind } from 'ts-morph';
import { v4 } from 'uuid';
import {
    FileNodeSourceCode,
    JSDocOptions,
    LoggerErrorParams,
    LoggerInfoParams,
    SourceFileProgressData,
    type InitParams
} from '../types/common';
import { FileCacheManagerMap } from './FileCacheManagerMap';
import { createFileCacheManagerMap } from './helpers/createFileCacheManagerMap';
import { createScheduler, SuccessTask, TaskResult } from './helpers/createScheduler';
import { saveJSDocProcessedInCache } from './helpers/saveJSDocsProcessedInCache';
import {
    JSDocGeneratorServiceWithRetries,
    scheduleJSDocGeneratorService
} from './helpers/scheduleJSDocGeneratorService';
import { sleep } from './helpers/sleep';
import { jsDocClassSetter } from './nodes/jsDocClassSetter';
import { jsDocEnumSetter } from './nodes/jsDocEnumSetter';
import { jsDocFunctionSetter } from './nodes/jsDocFunctionSetter';
import { jsDocInterfaceSetter } from './nodes/jsDocInterfaceSetter';
import { jsDocTypeAliasSetter } from './nodes/jsDocTypeAliasSetter';
import { jsDocVariableStatementSetter } from './nodes/jsDocVariableStatementSetter';

/**
 * Путь к каталогу кэша по умолчанию.
 * @type {string}
 */
const DEFAULT_CACHE_DIR = '.cache';

/**
 * Инициализирует процесс генерации JSDoc комментариев для указанных файлов и опций проекта.
 * @param {InitParams} params - Параметры инициализации.
 * @returns {Promise<void>} - Промис без возвращаемого значения.
 */
export async function init(params: InitParams): Promise<void> {
    const {
        projectOptions,
        files = [],
        jsDocGeneratorService,
        globalGenerationOptions,
        detailGenerationOptions,
        cacheDir = DEFAULT_CACHE_DIR,
        cacheOptions,
        onProgress,
        onError,
        onSuccess,
        timeoutBetweenRequests,
        waitTimeBetweenProgressNotifications,
        isSaveAfterEachIteration = false,
        disabledCached,
        signal,
        retries,
        logger
    } = params;
    /**
     * @typedef {Object} FileNodeSourceCode - Информация о файле, узле и опциях JSDoc.
     * @property {string} fileSourceCode - Исходный код файла.
     * @property {string} nodeSourceCode - Исходный код узла.
     * @property {JSDocOptions} jsDocOptions - Опции JSDoc комментариев.
     */
    const cache = new Cache({
        basePath: path.resolve(cacheDir || DEFAULT_CACHE_DIR), // (optional) Path where cache files are stored (default).
        ns: 'jsdocgen', // (optional) A grouping namespace for items.
        hash: 'sha1', // (optional) A hashing algorithm used within the cache key.
        ...cacheOptions
    });

    /**
     * Создает новый объект проекта TypeScript.
     */
    const project = new Project({ ...projectOptions });

    /**
     * Создает карту менеджеров кэша для файлов.
     */
    const fileCacheManagerMap = disabledCached
        ? new FileCacheManagerMap()
        : await createFileCacheManagerMap(cache);

    const kinds = globalGenerationOptions?.kinds || [];
    const { jsDocOptions: globalJSDocOptions } = globalGenerationOptions || {};
    const sourceFiles = projectOptions?.skipAddingFilesFromTsConfig
        ? project.addSourceFilesAtPaths(files || [])
        : project.getSourceFiles();

    const jsDocNodeSetterList = [
        jsDocClassSetter,
        jsDocInterfaceSetter,
        jsDocFunctionSetter,
        jsDocEnumSetter,
        jsDocTypeAliasSetter,
        jsDocVariableStatementSetter
    ];

    /**
     * Фильтрует список функций установки JSDoc комментариев в соответствии с указанными видами узлов.
     */
    const allowedJsDocNodeSetterList = jsDocNodeSetterList.filter(
        (item) => kinds.length === 0 || kinds.includes(item.kind)
    );

    let total = 0;
    const scheduler = createScheduler<FileNodeSourceCode>(0, signal);
    const jsDocGeneratorServiceScheduler = createScheduler<string>(
        timeoutBetweenRequests || 0,
        signal
    );
    const wrappedJSDocGeneratorService: JSDocGeneratorServiceWithRetries =
        scheduleJSDocGeneratorService({
            jsDocGeneratorService,
            jsDocGeneratorServiceScheduler: timeoutBetweenRequests
                ? jsDocGeneratorServiceScheduler
                : null,
            retries: retries || 1
        });

    const jsDocNodePromises = sourceFiles.flatMap((sourceFile, fileIndex) => {
        const fileSourceCode = sourceFile.getFullText();
        const filePath = sourceFile.getFilePath();

        return allowedJsDocNodeSetterList.flatMap((jsDocNodeSetter) => {
            const { kind, setJSDocToNode } = jsDocNodeSetter;
            const nodes = sourceFile.getChildrenOfKind(SyntaxKind[kind]);

            return nodes.reduce(
                (acc, node, index) => {
                    const currentGeneralIndex = total;
                    total += 1;
                    const sourceFileProgressData: SourceFileProgressData = {
                        filePath,
                        sourceCode: fileSourceCode
                    };
                    const nodeSourceCode = node.getFullText();
                    const currentDetailGenerationOptions = detailGenerationOptions?.[kind];
                    const detailJSDocOptions = currentDetailGenerationOptions?.jsDocOptions;
                    const jsDocOptions: JSDocOptions = {
                        ...globalJSDocOptions,
                        ...detailJSDocOptions
                    };
                    const isCached = fileCacheManagerMap.isNodeInCache({
                        fileSourceCode,
                        nodeSourceCode,
                        jsDocOptions
                    });
                    const id = v4();

                    if (isCached && !disabledCached) {
                        return acc;
                    }

                    scheduler.runTask(async () => {
                        await sleep(0);

                        await onProgress?.({
                            sourceFile: sourceFileProgressData,
                            codeSnippet: nodeSourceCode,
                            codeSnippetIndex: index,
                            sourceFileIndex: fileIndex,
                            totalFiles: sourceFiles.length,
                            codeSnippetsInFile: nodes.length,
                            codeSnippetsInAllFiles: total,
                            currentGeneralIndex,
                            id
                        });

                        return {
                            fileSourceCode,
                            nodeSourceCode,
                            jsDocOptions
                        };
                    });

                    const startTime = performance.now();
                    let endTime = startTime;

                    const promise = setJSDocToNode({
                        jsDocGeneratorService: wrappedJSDocGeneratorService,
                        jsDocOptions,
                        node,
                        sourceFile,
                        isSaveAfterEachIteration: isSaveAfterEachIteration || false
                    });

                    promise.then(() => {
                        const currentTime = performance.now();

                        endTime = currentTime - startTime;
                    });

                    const scheduled = scheduler.runTask(async () => {
                        try {
                            await sleep(waitTimeBetweenProgressNotifications || 0);

                            const { value, retries } = await promise;
                            const newCodeSnippet = node.getFullText();

                            const logParams: LoggerInfoParams = {
                                codeSnippet: nodeSourceCode,
                                response: value,
                                sourceFilePath: filePath,
                                lineNumbers: [node.getStartLineNumber(), node.getEndLineNumber()],
                                kind,
                                retries,
                                generationWaitingTimeMs: endTime
                            };
                            const newFileSourceCode = sourceFile.getFullText();
                            const params = {
                                sourceFile: {
                                    ...sourceFileProgressData,
                                    sourceCode: fileSourceCode
                                },
                                codeSnippet: newCodeSnippet,
                                codeSnippetIndex: index,
                                sourceFileIndex: fileIndex,
                                totalFiles: sourceFiles.length,
                                codeSnippetsInFile: nodes.length,
                                codeSnippetsInAllFiles: total,
                                response: value,
                                currentGeneralIndex,
                                id
                            };

                            logger?.info?.(logParams);

                            await onSuccess?.(params);

                            return {
                                fileSourceCode: newFileSourceCode,
                                nodeSourceCode: newCodeSnippet,
                                jsDocOptions
                            };
                        } catch (error) {
                            const logParams: LoggerErrorParams = {
                                codeSnippet: nodeSourceCode,
                                error,
                                sourceFilePath: filePath,
                                lineNumbers: [node.getStartLineNumber(), node.getEndLineNumber()],
                                kind,
                                generationWaitingTimeMs: endTime
                            };
                            const params = {
                                sourceFile: sourceFileProgressData,
                                codeSnippet: nodeSourceCode,
                                codeSnippetIndex: index,
                                sourceFileIndex: fileIndex,
                                totalFiles: sourceFiles.length,
                                codeSnippetsInFile: nodes.length,
                                codeSnippetsInAllFiles: total,
                                error,
                                currentGeneralIndex,
                                id
                            };

                            logger?.error?.(logParams);

                            await onError?.(params);

                            return {
                                fileSourceCode,
                                nodeSourceCode: nodeSourceCode,
                                jsDocOptions
                            };
                        } finally {
                            await sleep(waitTimeBetweenProgressNotifications || 0);
                        }
                    });

                    acc.push(scheduled);

                    return acc;
                },
                [] as Promise<TaskResult<FileNodeSourceCode>>[]
            );
        });
    });

    const iterationResult = await Promise.allSettled(jsDocNodePromises);
    const successResult = iterationResult.filter(
        (item): item is PromiseFulfilledResult<SuccessTask<FileNodeSourceCode>> =>
            item.status !== 'rejected' && item.value.success
    );

    if (!isSaveAfterEachIteration) {
        await project.save();
    }

    if (disabledCached) {
        return;
    }

    const fileNodeSourceCodeList = successResult.map((item) => item.value.value);

    /**
     * Сохраняет обработанные JSDoc комментарии в кэше.
     */
    await saveJSDocProcessedInCache({
        cache,
        fileNodeSourceCodeList
    });
}
