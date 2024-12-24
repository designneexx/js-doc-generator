import type { FileCacheHashMetadata, FileNodeSourceCode } from 'core/types/common';
import sha1 from 'crypto-js/sha1.js';
import { FileCacheManagerMap } from '../FileCacheManagerMap';

/**
 * Параметры для получения кэша из узла исходного файла.
 * @template CurrentNode - Текущий узел, который должен быть ASTJSDocableNode или его наследником.
 */
interface GetCacheFromNodeSourceFileParams {
    /**
     * Код исходного файла узла.
     */
    fileNodeSourceCode: FileNodeSourceCode;
    /**
     * Карта менеджеров кэша файлов.
     */
    fileCacheManagerMap: FileCacheManagerMap;
}

/**
 * Возвращаемый объект из кэша для исходного файла узла.
 */
interface GetCacheFromNodeSourceFileReturn {
    /**
     * Сниппет хэш-кода.
     */
    hashCodeSnippet: string;
    /**
     * Исходный код хэша.
     */
    hashSourceCode: string;
    /**
     * Хэш-карта кодовых сниппетов.
     */
    codeSnippetHashMap: Map<string, FileCacheHashMetadata>;
}

/**
 * Получить кэш из узла исходного файла.
 * @param {GetCacheFromNodeSourceFileParams} params - Параметры для получения кэша из узла исходного файла.
 * @param {NodeSourceFile} params.sourceFile - Исходный файл узла.
 * @param {Node} params.node - Узел, для которого нужно получить кэш.
 * @param {Map<string, Map<string, any>>} params.fileCacheManagerMap - Карта кэша файлов.
 * @returns {GetCacheFromNodeSourceFileReturn} - Объект с хэшами и карта кэша кода.
 */
export function getCacheFromNodeSourceFile(
    params: GetCacheFromNodeSourceFileParams
): GetCacheFromNodeSourceFileReturn {
    const { fileNodeSourceCode, fileCacheManagerMap } = params;
    const { fileSourceCode, nodeSourceCode } = fileNodeSourceCode;
    const hashDigestCodeSnippet = sha1(nodeSourceCode);
    const hashDigestSourceCode = sha1(fileSourceCode);
    const hashCodeSnippet = hashDigestCodeSnippet.toString();
    const hashSourceCode = hashDigestSourceCode.toString();
    const codeSnippetHashMap = fileCacheManagerMap.get(hashSourceCode) || new Map();

    return { hashCodeSnippet, hashSourceCode, codeSnippetHashMap };
}
