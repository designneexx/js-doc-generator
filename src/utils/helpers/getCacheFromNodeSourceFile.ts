import sha1 from 'crypto-js/sha1.js';
import { ASTJSDocableNode, FileCacheHashMetadata } from 'src/types/common';
import { SourceFile } from 'ts-morph';
import { FileCacheManagerMap } from '../FileCacheManagerMap';

/**
 * Параметры для получения кэша из узла исходного файла.
 * @template CurrentNode - Текущий узел, который должен быть ASTJSDocableNode или его наследником.
 */
interface GetCacheFromNodeSourceFileParams<
    CurrentNode extends ASTJSDocableNode = ASTJSDocableNode
> {
    /**
     * Исходный файл, из которого нужно получить кэш.
     */
    sourceFile: SourceFile;
    /**
     * Узел, для которого нужно получить кэш.
     */
    node: CurrentNode;
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
    const { sourceFile, node, fileCacheManagerMap } = params;
    const sourceCode = sourceFile.getFullText();
    const codeSnippet = node.getFullText();
    const hashDigestCodeSnippet = sha1(codeSnippet);
    const hashDigestSourceCode = sha1(sourceCode);
    const hashCodeSnippet = hashDigestCodeSnippet.toString();
    const hashSourceCode = hashDigestSourceCode.toString();
    const codeSnippetHashMap = fileCacheManagerMap.get(hashSourceCode) || new Map();

    return { hashCodeSnippet, hashSourceCode, codeSnippetHashMap };
}
