import { Cache } from 'file-system-cache';
import { Project, SyntaxKind } from 'ts-morph';
import { v4 } from 'uuid';
import {
    FileNodeSourceCode,
    JSDocGeneratorService,
    JSDocOptions,
    SourceFileProgressData,
    type InitParams
} from '../types/common';
import { AllJSDocIterationError } from './AllJSDocIterationError';
import { FileCacheManagerMap } from './FileCacheManagerMap';
import { createFileCacheManagerMap } from './helpers/createFileCacheManagerMap';
import { createScheduler } from './helpers/createScheduler';
import { saveJSDocProcessedInCache } from './helpers/saveJSDocsProcessedInCache';
import { scheduleJSDocGeneratorService } from './helpers/scheduleJSDocGeneratorService';
import { sleep } from './helpers/sleep';
import { jsDocClassSetter } from './nodes/jsDocClassSetter';
import { jsDocEnumSetter } from './nodes/jsDocEnumSetter';
import { jsDocFunctionSetter } from './nodes/jsDocFunctionSetter';
import { jsDocInterfaceSetter } from './nodes/jsDocInterfaceSetter';
import { jsDocTypeAliasSetter } from './nodes/jsDocTypeAliasSetter';
import { jsDocVariableStatementSetter } from './nodes/jsDocVariableStatementSetter';

const DEFAULT_CACHE_DIR = './.cache';

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
        timeoutBetweenRequests,
        waitTimeBetweenProgressNotifications,
        isSaveAfterEachIteration = false,
        disabledCached,
        signal
    } = params;
    /**
     * @typedef {Object} FileNodeSourceCode - Информация о файле, узле и опциях JSDoc.
     * @property {string} fileSourceCode - Исходный код файла.
     * @property {string} nodeSourceCode - Исходный код узла.
     * @property {JSDocOptions} jsDocOptions - Опции JSDoc комментариев.
     */
    const cache = new Cache({
        basePath: cacheDir || DEFAULT_CACHE_DIR, // (optional) Path where cache files are stored (default).
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
    const scheduler = createScheduler<void>(0, signal);
    const jsDocGeneratorServiceScheduler = createScheduler<string>(
        timeoutBetweenRequests || 0,
        signal
    );
    const wrappedJSDocGeneratorService: JSDocGeneratorService = scheduleJSDocGeneratorService(
        jsDocGeneratorService,
        timeoutBetweenRequests ? jsDocGeneratorServiceScheduler : null
    );

    const jsDocNodePromises = sourceFiles.flatMap((sourceFile, fileIndex) => {
        const fileSourceCode = sourceFile.getFullText();
        const filePath = sourceFile.getFilePath();

        return allowedJsDocNodeSetterList.flatMap((jsDocNodeSetter) => {
            const { kind, setJSDocToNode } = jsDocNodeSetter;
            const nodes = sourceFile.getChildrenOfKind(SyntaxKind[kind]);

            return nodes.reduce((acc, node, index) => {
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

                    return onProgress?.({
                        sourceFile: sourceFileProgressData,
                        codeSnippet: nodeSourceCode,
                        codeSnippetIndex: index,
                        sourceFileIndex: fileIndex,
                        totalFiles: sourceFiles.length,
                        codeSnippetsInFile: nodes.length,
                        isPending: isCached ? false : true,
                        isSuccess: true,
                        codeSnippetsInAllFiles: total,
                        currentGeneralIndex,
                        id
                    });
                });

                const promise = setJSDocToNode({
                    jsDocGeneratorService: wrappedJSDocGeneratorService,
                    jsDocOptions,
                    node,
                    sourceFile,
                    isSaveAfterEachIteration: isSaveAfterEachIteration || false
                });

                scheduler.runTask(async () => {
                    try {
                        await sleep(waitTimeBetweenProgressNotifications || 0);

                        const value = await promise;

                        return onProgress?.({
                            sourceFile: {
                                ...sourceFileProgressData,
                                sourceCode: sourceFile.getFullText()
                            },
                            codeSnippet: node.getFullText(),
                            codeSnippetIndex: index,
                            sourceFileIndex: fileIndex,
                            totalFiles: sourceFiles.length,
                            codeSnippetsInFile: nodes.length,
                            isPending: false,
                            isSuccess: true,
                            codeSnippetsInAllFiles: total,
                            response: value,
                            currentGeneralIndex,
                            id
                        });
                    } catch (error) {
                        return onProgress?.({
                            sourceFile: sourceFileProgressData,
                            codeSnippet: nodeSourceCode,
                            codeSnippetIndex: index,
                            sourceFileIndex: fileIndex,
                            totalFiles: sourceFiles.length,
                            codeSnippetsInFile: nodes.length,
                            isPending: false,
                            isSuccess: false,
                            codeSnippetsInAllFiles: total,
                            error,
                            currentGeneralIndex,
                            id
                        });
                    } finally {
                        await sleep(waitTimeBetweenProgressNotifications || 0);
                    }
                });

                acc.push(promise);

                return acc;
            }, [] as Promise<string>[]);
        });
    });

    const iterationResult = await Promise.allSettled(jsDocNodePromises);

    if (iterationResult.every((item) => item.status === 'rejected')) {
        throw new AllJSDocIterationError(iterationResult);
    }

    await Promise.all(scheduler.promises);

    if (!isSaveAfterEachIteration) {
        await project.save();
    }

    if (disabledCached) {
        return;
    }

    const fileNodeSourceCodeList = sourceFiles.flatMap((sourceFile) => {
        const fileSourceCode = sourceFile.getFullText();

        return allowedJsDocNodeSetterList.flatMap((jsDocNodeSetter) => {
            const { kind } = jsDocNodeSetter;
            const nodes = sourceFile.getChildrenOfKind(SyntaxKind[kind]);

            return nodes.reduce((acc, node) => {
                const currentDetailGenerationOptions = detailGenerationOptions?.[kind];
                const detailJSDocOptions = currentDetailGenerationOptions?.jsDocOptions;
                const jsDocOptions: JSDocOptions = {
                    ...globalJSDocOptions,
                    ...detailJSDocOptions
                };

                acc.push({
                    fileSourceCode,
                    nodeSourceCode: node.getFullText(),
                    jsDocOptions
                });

                return acc;
            }, [] as FileNodeSourceCode[]);
        });
    });

    /**
     * Сохраняет обработанные JSDoc комментарии в кэше.
     */
    await saveJSDocProcessedInCache({
        cache,
        fileNodeSourceCodeList
    });
}
