import { type IsNodeInCacheParams } from 'src/types/common';
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
    const data = getCacheFromNodeSourceFile({ node, sourceFile, fileCacheManagerMap });
    const { codeSnippetHashMap, hashCodeSnippet } = data;
    const isIdentityCache = codeSnippetHashMap.has(hashCodeSnippet);

    return isIdentityCache;
}
