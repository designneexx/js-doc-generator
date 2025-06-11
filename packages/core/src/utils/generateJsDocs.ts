import path from 'path';
import { Cache } from 'file-system-cache';
import { Project, SourceFile, SyntaxKind } from 'ts-morph';
import {
    ASTJSDocableNode,
    FileNodeSourceCode,
    JSDocOptions,
    type InitParams
} from '../types/common';
import { FileCacheManagerMap } from './FileCacheManagerMap';
import { createFileCacheManagerMap } from './helpers/createFileCacheManagerMap';
import { retryJsDocGeneratorService } from './helpers/retryJsDocGeneratorService';
import { saveJSDocProcessedInCache } from './helpers/saveJSDocsProcessedInCache';

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
export async function* generateJsDocs(params: InitParams): AsyncGenerator<{
    sourceFile: SourceFile;
    node: ASTJSDocableNode;
    save(): Promise<FileNodeSourceCode>;
}> {
    /**
     * Параметры проекта и генерации документации.
     * @typedef {Object} ProjectOptions
     * @property {string} projectOptions - Опции проекта.
     * @property {string[]} files - Массив файлов для генерации документации.
     * @property {JsDocGeneratorService} jsDocGeneratorService - Сервис генерации JSDoc.
     * @property {Object} globalGenerationOptions - Глобальные опции генерации.
     * @property {Object} detailGenerationOptions - Опции детальной генерации.
     * @property {string} cacheDir - Директория для кэширования (по умолчанию DEFAULT_CACHE_DIR).
     * @property {Object} cacheOptions - Опции кэширования.
     * @property {boolean} disabledCached - Флаг отключения кэширования.
     * @property {number} retries - Количество попыток генерации.
     */
    const {
        projectOptions,
        files = [],
        jsDocGeneratorService,
        globalGenerationOptions,
        detailGenerationOptions,
        cacheDir = DEFAULT_CACHE_DIR,
        cacheOptions,
        disabledCached = false,
        retries = 1
    } = params;
    /**
     * @typedef {Object} FileNodeSourceCode - Информация о файле, узле и опциях JSDoc.
     * @property {string} fileSourceCode - Исходный код файла.
     * @property {string} nodeSourceCode - Исходный код узла.
     * @property {JSDocOptions} jsDocOptions - Опции JSDoc комментариев.
     */
    /**
     * Options for creating a cache instance.
     * @typedef {Object} CacheOptions
     * @property {string} basePath - The base path for the cache.
     * @property {string} ns - The namespace for the cache.
     * @property {string} hash - The hash algorithm for the cache.
     */
    const cache = new Cache({
        basePath: path.resolve(cacheDir || DEFAULT_CACHE_DIR),
        ns: 'jsdocgen',
        hash: 'sha1',
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

    /**
     * Массив видов (kinds) для глобальных опций генерации.
     * @type {string[]}
     */
    const kinds = globalGenerationOptions?.kinds || [];
    /**
     * Опции JSDoc для генерации, полученные из глобальных опций
     * @type {object}
     */
    const { jsDocOptions: globalJSDocOptions } = globalGenerationOptions || {};
    /**
     * Массив исходных файлов.
     * @type {Array<SourceFile>}
     */
    const sourceFiles = projectOptions?.skipAddingFilesFromTsConfig
        ? project.addSourceFilesAtPaths(files || [])
        : project.getSourceFiles();

    /**
     * Список функций-сеттеров для различных типов JSDoc узлов
     * @type {Function[]}
     */
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
        /**
         * Callback функция для фильтрации элементов jsDocNodeSetterList
         *
         * @param {JsDocNodeSetter} item - Элемент массива jsDocNodeSetterList
         * @returns {boolean} - Возвращает true, если элемент должен быть включен в allowedJsDocNodeSetterList
         */
        (item) => kinds.length === 0 || kinds.includes(item.kind)
    );

    /**
     * Переменная, содержащая сервис генерации JSDoc с возможностью повторных попыток
     * @type {JsDocGeneratorService}
     */
    const retriedJsDocGeneratorService = retryJsDocGeneratorService({
        jsDocGeneratorService,
        retries: retries || 1
    });
    /**
     * Массив промисов, ожидающих получение узлов файлового исходного кода.
     * @type {Promise<FileNodeSourceCode>[]}
     */
    const jsDocNodePromises: Promise<FileNodeSourceCode>[] = [];

    for (const sourceFile of sourceFiles) {
        /**
         * Полный текст исходного файла
         * @type {string}
         */
        const fileSourceCode = sourceFile.getFullText();

        for (const jsDocNodeSetter of allowedJsDocNodeSetterList) {
            /**
             * Объект, содержащий метод jsDocNodeSetter
             * @typedef {object} JsDocNodeSetterObject
             * @property {function} jsDocNodeSetter - Метод для установки jsDoc ноды
             */
            const { kind } = jsDocNodeSetter;
            /**
             * Массив узлов, представляющих все потомки файла исходного кода определенного вида.
             * @type {Node[]}
             */
            const nodes = sourceFile.getDescendantsOfKind(SyntaxKind[kind]);

            for (const node of nodes) {
                /**
                 * Строка с полным текстом узла
                 * @type {string}
                 */
                const nodeSourceCode = node.getFullText();
                /**
                 * Текущие опции генерации деталей.
                 * @type {object | undefined}
                 */
                const currentDetailGenerationOptions = detailGenerationOptions?.[kind];
                /**
                 * Опции для генерации JSDoc.
                 * @typedef {object} JSDocOptions
                 * @property {boolean} isEnabled - Флаг, указывающий, включены ли JSDoc опции.
                 */
                const detailJSDocOptions = currentDetailGenerationOptions?.jsDocOptions;
                /**
                 * Настройки JSDoc.
                 * @typedef {Object} JSDocOptions
                 * @property {Object} globalJSDocOptions - Глобальные настройки JSDoc.
                 * @property {Object} detailJSDocOptions - Детальные настройки JSDoc.
                 */
                const jsDocOptions: JSDocOptions = {
                    ...globalJSDocOptions,
                    ...detailJSDocOptions
                };
                /**
                 * Проверяет, содержится ли узел в кэше файлов
                 * @param {object} options - Объект с параметрами
                 * @param {string} options.fileSourceCode - Исходный код файла
                 * @param {string} options.nodeSourceCode - Исходный код узла
                 * @param {object} options.jsDocOptions - Опции JSDoc
                 * @returns {boolean} Результат проверки: находится ли узел в кэше
                 */
                const isCached = fileCacheManagerMap.isNodeInCache({
                    fileSourceCode,
                    nodeSourceCode,
                    jsDocOptions
                });

                if (isCached && !disabledCached) {
                    continue;
                }

                yield {
                    sourceFile,
                    node,
                    save() {
                        /**
                         * Устанавливает JSDoc к узлу с помощью указанного сервиса генерации JSDoc.
                         * @param {Object} options - Параметры для установки JSDoc.
                         * @param {Object} options.jsDocGeneratorService - Сервис генерации JSDoc.
                         * @param {Object} options.jsDocOptions - Опции JSDoc.
                         * @param {Object} options.node - Узел, к которому устанавливается JSDoc.
                         * @param {Object} options.sourceFile - Исходный файл.
                         * @returns {Promise} - Обещание установки JSDoc к узлу.
                         */
                        const jsDocSetPromise = jsDocNodeSetter.setJSDocToNode({
                            jsDocGeneratorService: retriedJsDocGeneratorService,
                            jsDocOptions,
                            node,
                            sourceFile
                        });
                        /**
                         * Переменная task, которая содержит результат выполнения промиса jsDocSetPromise
                         * @type {Promise<{ fileSourceCode: string, nodeSourceCode: string, jsDocOptions: any }>}
                         */
                        const task = jsDocSetPromise.then(() => ({
                            fileSourceCode: sourceFile.getFullText(),
                            nodeSourceCode: node.getFullText(),
                            jsDocOptions
                        }));

                        jsDocNodePromises.push(task);

                        return task;
                    }
                };
            }
        }
    }

    if (disabledCached) {
        return;
    }

    /**
     * Массив промисов, ожидающих завершения или отклонения.
     * @type {PromiseSettledResult[]}
     */
    const result = await Promise.allSettled(jsDocNodePromises);
    /**
     * Массив, содержащий только успешно завершенные промисы с результатами типа FileNodeSourceCode
     * @type {Array<PromiseFulfilledResult<FileNodeSourceCode>>}
     */
    const fulfilled = result.filter(
        /**
         * Callback функция для фильтрации массива промисов
         * @param {PromiseSettledResult<FileNodeSourceCode>} item - Элемент массива промисов
         * @returns {item is PromiseFulfilledResult<FileNodeSourceCode>} - Результат проверки успешного выполнения промиса
         */
        (item): item is PromiseFulfilledResult<FileNodeSourceCode> => item.status !== 'rejected'
    );
    /**
     * Массив объектов, содержащих исходный код узлов файла
     * @type {Array<Object>}
     */
    const fileNodeSourceCodeList = fulfilled.map(({ value }) => ({ ...value }));

    /**
     * Сохраняет обработанные JSDoc комментарии в кэше.
     */
    await saveJSDocProcessedInCache({
        cache,
        fileNodeSourceCodeList
    });
}
