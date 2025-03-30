import fsPromises from 'fs/promises';
import path from 'path';
import { Cache } from 'file-system-cache';
import { Project, SyntaxKind } from 'ts-morph';
import { v4 } from 'uuid';
import winston from 'winston';
import {
    FileNodeSourceCode,
    JSDocGeneratorService,
    JSDocOptions,
    SourceFileProgressData,
    type InitParams
} from '../types/common';
import { FileCacheManagerMap } from './FileCacheManagerMap';
import { createFileCacheManagerMap } from './helpers/createFileCacheManagerMap';
import { createScheduler, SuccessTask, TaskResult } from './helpers/createScheduler';
import { saveJSDocProcessedInCache } from './helpers/saveJSDocsProcessedInCache';
import { scheduleJSDocGeneratorService } from './helpers/scheduleJSDocGeneratorService';
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
        logsFilePath,
        isSaveLogs = true,
        retries,
        isDeleteLogFileBeforeGeneration = true,
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
    const logFile = path.resolve(logsFilePath || path.join('.logs', 'debug.log'));

    if (isDeleteLogFileBeforeGeneration) {
        try {
            await fsPromises.access(logFile);
            await fsPromises.unlink(logFile);
        } catch (error) {
            console.log('err', error);
        }
    }

    const winstonLogger = winston.createLogger({
        transports: [new winston.transports.Console()]
    });

    if (isSaveLogs && !logger) {
        winstonLogger.add(new winston.transports.File({ filename: logFile }));
    }

    const currentLogger = logger || winstonLogger;

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
    const wrappedJSDocGeneratorService: JSDocGeneratorService = scheduleJSDocGeneratorService({
        jsDocGeneratorService,
        jsDocGeneratorServiceScheduler: timeoutBetweenRequests
            ? jsDocGeneratorServiceScheduler
            : null,
        retries: retries || 1,
        notifySuccess(data, retries) {
            if (retries > 1) {
                currentLogger.info(
                    JSON.stringify(
                        { isSuccess: true, isError: false, retries, response: data },
                        null,
                        2
                    )
                );
            }
        },
        notifyError(error, retries) {
            if (retries > 1) {
                currentLogger.error(
                    JSON.stringify(
                        {
                            isError: true,
                            isSuccess: false,
                            retries,
                            error: error?.toString?.() || ''
                        },
                        null,
                        2
                    )
                );
            }
        }
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

                    const promise = setJSDocToNode({
                        jsDocGeneratorService: wrappedJSDocGeneratorService,
                        jsDocOptions,
                        node,
                        sourceFile,
                        isSaveAfterEachIteration: isSaveAfterEachIteration || false
                    });

                    const scheduled = scheduler.runTask(async () => {
                        try {
                            await sleep(waitTimeBetweenProgressNotifications || 0);

                            const value = await promise;

                            const newCodeSnippet = node.getFullText();
                            const logParams = {
                                codeSnippet: newCodeSnippet,
                                response: value,
                                sourceFilePath: filePath,
                                lineNumbers: [node.getStartLineNumber(), node.getEndLineNumber()],
                                kind,
                                isError: false,
                                isSuccess: true
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

                            currentLogger.info(JSON.stringify(logParams, null, 2));

                            await onSuccess?.(params);

                            return {
                                fileSourceCode: newFileSourceCode,
                                nodeSourceCode: newCodeSnippet,
                                jsDocOptions
                            };
                        } catch (error) {
                            const logParams = {
                                codeSnippet: nodeSourceCode,
                                error: error?.toString?.() || 'UNKNOWN_ERROR',
                                sourceFilePath: filePath,
                                lineNumbers: [node.getStartLineNumber(), node.getEndLineNumber()],
                                kind,
                                isError: true,
                                isSuccess: false
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

                            currentLogger.error(JSON.stringify(logParams, null, 2));

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
