import { Cache } from 'file-system-cache';
import { Project, SyntaxKind } from 'ts-morph';
import { FileNodeSourceCode, type InitParams } from '../types/common';
import { createFileCacheManagerMap } from './helpers/createFileCacheManagerMap';
import { isNodeInCache } from './helpers/isNodeInCache';
import { saveJSDocProcessedInCache } from './helpers/saveJSDocsProcessedInCache';
import { jsDocClassSetter } from './nodes/jsDocClassSetter';
import { jsDocEnumSetter } from './nodes/jsDocEnumSetter';
import { jsDocFunctionSetter } from './nodes/jsDocFunctionSetter';
import { jsDocInterfaceSetter } from './nodes/jsDocInterfaceSetter';
import { jsDocTypeAliasSetter } from './nodes/jsDocTypeAliasSetter';
import { jsDocVariableStatementSetter } from './nodes/jsDocVariableStatementSetter';

export async function init(params: InitParams): Promise<void> {
    const {
        projectOptions,
        files,
        jsDocGeneratorService,
        globalGenerationOptions,
        detailGenerationOptions,
        cacheDir = './.cache',
        cacheOptions
    } = params;
    /**
     * Создает новый объект кэша для хранения кэшированных данных.
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
    const project = new Project({ ...projectOptions, skipAddingFilesFromTsConfig: true });

    /**
     * Создает карту менеджеров кэша для файлов.
     */
    const fileCacheManagerMap = await createFileCacheManagerMap(cache);

    const kinds = globalGenerationOptions?.kinds || [];
    const { jsDocOptions: globalJSDocOptions } = globalGenerationOptions || {};
    const sourceFiles = project.addSourceFilesAtPaths(files);

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

    const jsDocNodePromises = sourceFiles.flatMap((sourceFile) => {
        return allowedJsDocNodeSetterList.flatMap((jsDocNodeSetter) => {
            const { kind, setJSDocToNode } = jsDocNodeSetter;
            const nodes = sourceFile.getChildrenOfKind(SyntaxKind[kind]);

            return nodes.reduce((acc, node) => {
                const hasCached = isNodeInCache({ node, fileCacheManagerMap, sourceFile });

                if (hasCached) {
                    return acc;
                }

                const currentDetailGenerationOptions = detailGenerationOptions?.[kind];
                const detailJSDocOptions = currentDetailGenerationOptions?.jsDocOptions;
                const jsDocOptions = {
                    ...globalJSDocOptions,
                    ...detailJSDocOptions
                };

                acc.push(
                    setJSDocToNode({
                        jsDocGeneratorService,
                        jsDocOptions,
                        node,
                        sourceFile
                    })
                );

                return acc;
            }, [] as Promise<void>[]);
        });
    });

    await Promise.all(jsDocNodePromises);

    await project.save();

    const fileNodeSourceCodeList = sourceFiles.flatMap((sourceFile) => {
        return allowedJsDocNodeSetterList.flatMap((jsDocNodeSetter) => {
            const { kind } = jsDocNodeSetter;
            const nodes = sourceFile.getChildrenOfKind(SyntaxKind[kind]);

            return nodes.reduce((acc, node) => {
                acc.push({
                    fileSourceCode: sourceFile.getFullText(),
                    nodeSourceCode: node.getFullText()
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
