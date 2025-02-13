import { Cache } from 'file-system-cache';
import { Project, SyntaxKind } from 'ts-morph';
import { FileNodeSourceCode, JSDocOptions, type InitParams } from '../types/common';
import { createFileCacheManagerMap } from './helpers/createFileCacheManagerMap';
import { saveJSDocProcessedInCache } from './helpers/saveJSDocsProcessedInCache';
import { jsDocClassSetter } from './nodes/jsDocClassSetter';
import { jsDocEnumSetter } from './nodes/jsDocEnumSetter';
import { jsDocFunctionSetter } from './nodes/jsDocFunctionSetter';
import { jsDocInterfaceSetter } from './nodes/jsDocInterfaceSetter';
import { jsDocTypeAliasSetter } from './nodes/jsDocTypeAliasSetter';
import { jsDocVariableStatementSetter } from './nodes/jsDocVariableStatementSetter';

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
        cacheDir = './.cache',
        cacheOptions,
        onProgress
    } = params;
    /**
     * @typedef {Object} FileNodeSourceCode - Информация о файле, узле и опциях JSDoc.
     * @property {string} fileSourceCode - Исходный код файла.
     * @property {string} nodeSourceCode - Исходный код узла.
     * @property {JSDocOptions} jsDocOptions - Опции JSDoc комментариев.
     */
    const cache = new Cache({
        basePath: cacheDir, // (optional) Path where cache files are stored (default).
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
    const fileCacheManagerMap = await createFileCacheManagerMap(cache);

    const kinds = globalGenerationOptions?.kinds || [];
    const { jsDocOptions: globalJSDocOptions } = globalGenerationOptions || {};
    const sourceFiles = projectOptions?.skipAddingFilesFromTsConfig
        ? project.addSourceFilesAtPaths(files)
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

    const total = sourceFiles.flatMap((sourceFile) =>
        allowedJsDocNodeSetterList.flatMap((jsDocNodeSetter) => {
            const { kind } = jsDocNodeSetter;
            const nodes = sourceFile.getChildrenOfKind(SyntaxKind[kind]);

            return nodes;
        })
    );

    const jsDocNodePromises = sourceFiles.flatMap((sourceFile, fileIndex) => {
        const fileSourceCode = sourceFile.getFullText();

        return allowedJsDocNodeSetterList.flatMap((jsDocNodeSetter) => {
            const { kind, setJSDocToNode } = jsDocNodeSetter;
            const nodes = sourceFile.getChildrenOfKind(SyntaxKind[kind]);

            return nodes.reduce((acc, node, index) => {
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

                onProgress?.({
                    sourceFile,
                    codeSnippet: node,
                    codeSnippetIndex: index,
                    sourceFileIndex: fileIndex,
                    totalFiles: sourceFiles.length,
                    codeSnippetsInFile: nodes.length,
                    isPending: isCached ? false : true,
                    isSuccess: true,
                    codeSnippetsInAllFiles: total.length,
                    isCached: isCached
                });

                if (isCached) {
                    return acc;
                }

                acc.push(
                    setJSDocToNode({
                        jsDocGeneratorService,
                        jsDocOptions,
                        node,
                        sourceFile
                    })
                        .then((value) => {
                            onProgress?.({
                                sourceFile,
                                codeSnippet: node,
                                codeSnippetIndex: index,
                                sourceFileIndex: fileIndex,
                                totalFiles: sourceFiles.length,
                                codeSnippetsInFile: nodes.length,
                                isPending: false,
                                isSuccess: true,
                                codeSnippetsInAllFiles: total.length,
                                response: value,
                                isCached: false
                            });
                        })
                        .catch((error) => {
                            onProgress?.({
                                sourceFile,
                                codeSnippet: node,
                                codeSnippetIndex: index,
                                sourceFileIndex: fileIndex,
                                totalFiles: sourceFiles.length,
                                codeSnippetsInFile: nodes.length,
                                isPending: false,
                                isSuccess: false,
                                codeSnippetsInAllFiles: total.length,
                                error,
                                isCached: false
                            });
                        })
                );

                return acc;
            }, [] as Promise<void>[]);
        });
    });

    await Promise.all(jsDocNodePromises);

    await project.save();

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
