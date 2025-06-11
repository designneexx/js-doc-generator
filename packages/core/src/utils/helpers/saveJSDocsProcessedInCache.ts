import { FileNodeSourceCode } from 'core/types/common';
import { Cache } from 'file-system-cache';
import { FileCacheManagerMap } from '../FileCacheManagerMap';

/**
 * Параметры для сохранения обработанных JSDoc в кэше
 */
interface SaveJSDocProcessedInCacheParams {
    /**
     * Список исходных кодов узлов файлов, содержащих JSDoc
     */
    fileNodeSourceCodeList: FileNodeSourceCode[];
    /**
     * Кэш, в который нужно сохранить обработанные JSDoc
     */
    cache: Cache;
}

/**
 * Сохраняет обработанные JSDoc в кэше.
 * @param {SaveJSDocProcessedInCacheParams} params - Параметры для сохранения JSDoc в кэше.
 * @param {NodeSourceCode[]} params.fileNodeSourceCodeList - Список узлов исходного кода файлов.
 * @param {Cache} params.cache - Кэш.
 * @returns {Promise<{ path: string }>} - Объект с путем к сохраненному кэшу.
 */
export function saveJSDocProcessedInCache(
    params: SaveJSDocProcessedInCacheParams
): Promise<{ path: string }> {
    /**
     * Список исходных кодов узлов файла.
     * @type {Array}
     */
    const { fileNodeSourceCodeList, cache } = params;
    /**
     * Маппинг для управления кэшем файлов.
     * @type {FileCacheManagerMap}
     */
    const fileCacheManagerMap = new FileCacheManagerMap();

    fileNodeSourceCodeList.forEach((fileNodeSourceCode) => {
        /**
         * Кэшированные данные файла.
         * @type {any}
         */
        const data = fileCacheManagerMap.getCacheFromNodeSourceFile(fileNodeSourceCode);
        /**
         * Получает кэш из узла и файла исходного кода.
         * @param {GetCacheFromNodeSourceFileParams} params - Параметры для получения кэша.
         * @param {Node} params.node - Узел.
         * @param {SourceFile} params.sourceFile - Файл исходного кода.
         * @param {Map<string, FileCacheManager>} params.fileCacheManagerMap - Карта менеджеров кэша файлов.
         * @returns {CacheData} - Данные кэша.
         */
        /**
         * Функция для работы с данными, содержащими информацию о хэш-кодах и исходном коде
         * @param {Data} data - Объект с данными
         */
        const { hashCodeSnippet, hashSourceCode, codeSnippetHashMap, jsDocOptions } = data;

        /**
         * Получает кэш из узла и файла исходного кода.
         * @param {GetCacheFromNodeSourceFileParams} params - Параметры для получения кэша.
         * @param {Node} params.node - Узел.
         * @param {SourceFile} params.sourceFile - Файл исходного кода.
         * @param {Map<string, FileCacheManager>} params.fileCacheManagerMap - Карта менеджеров кэша файлов.
         * @returns {CacheData} - Данные кэша.
         */
        codeSnippetHashMap.set(hashCodeSnippet, {
            fileSourceCodeHash: hashSourceCode,
            nodeSourceCodeHash: hashCodeSnippet,
            jsDocOptions
        });

        fileCacheManagerMap.set(hashSourceCode, codeSnippetHashMap);
    });

    return fileCacheManagerMap.save(cache);
}
