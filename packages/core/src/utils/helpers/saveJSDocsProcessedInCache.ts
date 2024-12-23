import { FileNodeSourceCode } from 'core/types/common';
import { Cache } from 'file-system-cache';
import { FileCacheManagerMap } from '../FileCacheManagerMap';
import { getCacheFromNodeSourceFile } from './getCacheFromNodeSourceFile';

/**
 * Параметры для сохранения обработанных JSDoc в кэше
 */
interface SaveJSDocProcessedInCacheParams {
    fileNodeSourceCodeList: FileNodeSourceCode[];
    /**
     * Кэш, в который нужно сохранить обработанные JSDoc
     */
    cache: Cache;
}

/**
 * Сохраняет обработанные JSDoc в кэше.
 * @param {SaveJSDocProcessedInCacheParams} params - Параметры для сохранения JSDoc в кэше.
 * @param {ProjectOptions} params.projectOptions - Опции проекта.
 * @param {string[]} params.files - Список путей к файлам.
 * @param {string[]} params.kinds - Список типов для фильтрации JSDoc.
 * @param {Map<string, FileCacheManager>} params.fileCacheManagerMap - Карта менеджеров кэша файлов.
 * @param {Cache} params.cache - Кэш для сохранения.
 */
export function saveJSDocProcessedInCache(
    params: SaveJSDocProcessedInCacheParams
): Promise<{ path: string }> {
    const { fileNodeSourceCodeList, cache } = params;
    const fileCacheManagerMap = new FileCacheManagerMap();

    fileNodeSourceCodeList.forEach((fileNodeSourceCode) => {
        /**
         * Получает кэш из узла и файла исходного кода.
         * @param {GetCacheFromNodeSourceFileParams} params - Параметры для получения кэша.
         * @param {Node} params.node - Узел.
         * @param {SourceFile} params.sourceFile - Файл исходного кода.
         * @param {Map<string, FileCacheManager>} params.fileCacheManagerMap - Карта менеджеров кэша файлов.
         * @returns {CacheData} - Данные кэша.
         */
        const data = getCacheFromNodeSourceFile({ fileNodeSourceCode, fileCacheManagerMap });
        /**
         * Получает кэш из узла и файла исходного кода.
         * @param {GetCacheFromNodeSourceFileParams} params - Параметры для получения кэша.
         * @param {Node} params.node - Узел.
         * @param {SourceFile} params.sourceFile - Файл исходного кода.
         * @param {Map<string, FileCacheManager>} params.fileCacheManagerMap - Карта менеджеров кэша файлов.
         * @returns {CacheData} - Данные кэша.
         */
        const { hashCodeSnippet, hashSourceCode, codeSnippetHashMap } = data;

        codeSnippetHashMap.set(hashCodeSnippet, {
            fileSourceCodeHash: hashSourceCode,
            nodeSourceCodeHash: hashCodeSnippet
        });
        fileCacheManagerMap.set(hashSourceCode, codeSnippetHashMap);
    });

    return fileCacheManagerMap.save(cache);
}
