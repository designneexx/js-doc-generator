import path from 'path';
import { Cache } from 'file-system-cache';
import { Project, SyntaxKind } from 'ts-morph';
import { v4 } from 'uuid';
import {
    JSDocGenerationInfo,
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
        timeoutBetweenRequests = 0,
        waitTimeBetweenProgressNotifications = 0,
        isSaveAfterEachIteration = false,
        disabledCached = false,
        signal,
        retries = 1,
        logger
    } = params;
    /**
     * @typedef {Object} FileNodeSourceCode - Информация о файле, узле и опциях JSDoc.
     * @property {string} fileSourceCode - Исходный код файла.
     * @property {string} nodeSourceCode - Исходный код узла.
     * @property {JSDocOptions} jsDocOptions - Опции JSDoc комментариев.
     */
    const cache = new Cache({
        basePath: path.resolve(cacheDir || DEFAULT_CACHE_DIR),
        ns: 'jsdocgen',
        hash: 'sha1',
        ...cacheOptions
    });

    /**
     * Следует ли запускать генерацию на каждый узел и файл параллельно
     */
    const isParallel = !timeoutBetweenRequests;

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
    const scheduler = createScheduler<JSDocGenerationInfo>(0, signal);
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
            const nodes = sourceFile.getDescendantsOfKind(SyntaxKind[kind]);

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

                    const run = async () => {
                        try {
                            if (isParallel) {
                                await sleep(waitTimeBetweenProgressNotifications || 0);
                            }

                            const { value, retries } = await promise;
                            const newCodeSnippet = node.getFullText();
                            const newFileSourceCode = sourceFile.getFullText();
                            const logParams: LoggerInfoParams = {
                                codeSnippet: nodeSourceCode,
                                response: value,
                                sourceFilePath: filePath,
                                lineNumbers: [node.getStartLineNumber(), node.getEndLineNumber()],
                                kind,
                                retries,
                                generationWaitingTimeMs: endTime
                            };
                            const params = {
                                sourceFile: {
                                    ...sourceFileProgressData,
                                    sourceCode: newFileSourceCode
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

                            if (newCodeSnippet.trim() === nodeSourceCode.trim()) {
                                throw new Error('Нет изменений по узлу после генерации');
                            }

                            logger?.info?.(logParams);

                            await onSuccess?.(params);

                            return {
                                sourceFile,
                                node,
                                kind
                            };
                        } catch (error) {
                            const newFileSourceCode = sourceFile.getFullText();
                            const logParams: LoggerErrorParams = {
                                codeSnippet: nodeSourceCode,
                                error,
                                sourceFilePath: filePath,
                                lineNumbers: [node.getStartLineNumber(), node.getEndLineNumber()],
                                kind,
                                generationWaitingTimeMs: endTime
                            };
                            const params = {
                                sourceFile: {
                                    ...sourceFileProgressData,
                                    sourceCode: newFileSourceCode
                                },
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
                                sourceFile,
                                node,
                                kind
                            };
                        } finally {
                            if (isParallel) {
                                await sleep(waitTimeBetweenProgressNotifications || 0);
                            }
                        }
                    };

                    if (!isParallel) {
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
                                sourceFile,
                                node,
                                kind
                            };
                        });
                    }

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

                    if (isParallel) {
                        acc.push(
                            Promise.resolve()
                                .then(() => run())
                                .then((value) => ({ success: true as const, value }))
                                .catch((error) => ({ success: false, error }))
                        );
                    } else {
                        const scheduled = scheduler.runTask(run);
                        acc.push(scheduled);
                    }

                    return acc;
                },
                [] as Promise<TaskResult<JSDocGenerationInfo>>[]
            );
        });
    });

    const iterationResult = await Promise.allSettled(jsDocNodePromises);
    const successResult = iterationResult.filter(
        (item): item is PromiseFulfilledResult<SuccessTask<JSDocGenerationInfo>> =>
            item.status !== 'rejected' && item.value.success
    );

    if (!isSaveAfterEachIteration) {
        await project.save();
    }

    if (disabledCached) {
        return;
    }

    const fileNodeSourceCodeList = successResult.map((item) => {
        const data = item.value.value;
        const { sourceFile, node, kind } = data;
        const fileSourceCode = sourceFile.getFullText();
        const currentDetailGenerationOptions = detailGenerationOptions?.[kind];
        const detailJSDocOptions = currentDetailGenerationOptions?.jsDocOptions;
        const jsDocOptions: JSDocOptions = {
            ...globalJSDocOptions,
            ...detailJSDocOptions
        };

        return {
            fileSourceCode,
            nodeSourceCode: node.getFullText(),
            jsDocOptions
        };
    });

    if (fileNodeSourceCodeList.length === 0) {
        return;
    }

    /**
     * Сохраняет обработанные JSDoc комментарии в кэше.
     */
    await saveJSDocProcessedInCache({
        cache,
        fileNodeSourceCodeList
    });
}
