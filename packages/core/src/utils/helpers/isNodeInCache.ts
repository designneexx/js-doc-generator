import { FileNodeSourceCode, type IsNodeInCacheParams } from 'core/types/common';
import { getCacheFromNodeSourceFile } from './getCacheFromNodeSourceFile';

/**
 * Проверяет, содержится ли узел в кэше.
 * @param {IsNodeInCacheParams} nodeCacheParams - Параметры для проверки узла в кэше.
 * @param {Node} node - Узел, который необходимо проверить.
 * @param {Map<string, FileCacheManager>} fileCacheManagerMap - Карта управления кэшем файлов.
 * @param {SourceFile} sourceFile - Исходный файл, содержащий узел.
 * @returns {boolean} - Возвращает true, если узел содержится в кэше, иначе false.
 */
export function isNodeInCache(nodeCacheParams: IsNodeInCacheParams): boolean {
    const { node, fileCacheManagerMap, sourceFile } = nodeCacheParams;
    /**
     * Информация о коде файла и узла.
     * @typedef {Object} FileNodeSourceCode
     * @property {string} fileSourceCode - Полный текст исходного файла.
     * @property {string} nodeSourceCode - Полный текст узла.
     */
    const fileNodeSourceCode: FileNodeSourceCode = {
        fileSourceCode: sourceFile.getFullText(),
        nodeSourceCode: node.getFullText()
    };
    /**
     * Данные, полученные из кэша на основе исходного кода файла и узла.
     * @typedef {Object} CacheData
     * @property {Map<string, string>} codeSnippetHashMap - Хэш-карта кодовых фрагментов.
     * @property {string} hashCodeSnippet - Хэш-код текущего фрагмента кода.
     */
    const data = getCacheFromNodeSourceFile({ fileNodeSourceCode, fileCacheManagerMap });
    const { codeSnippetHashMap, hashCodeSnippet } = data;
    const isIdentityCache = codeSnippetHashMap.has(hashCodeSnippet);

    return isIdentityCache;
}
