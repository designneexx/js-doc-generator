import sha1 from 'crypto-js/sha1.js';
import { Cache } from 'file-system-cache';
import { FileNodeSourceCode, JSDocOptions, type FileCacheHashMetadata } from 'src/types/common';
import { getCacheList } from './helpers/getCacheList';

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

    jsDocOptions: JSDocOptions;
}

/**
 * Ключ для кэширования
 * @type {string}
 */
export const CACHE_KEY = 'CACHE_KEY';

/**
 * Класс для управления кэшем файлов с использованием Map
 */
export class FileCacheManagerMap extends Map<string, Map<string, FileCacheHashMetadata>> {
    /**
     * Сохраняет кэш в хранилище
     * @param cache - объект кэша для сохранения
     * @returns Результат сохранения кэша
     */
    save(cache: Cache): Promise<{ path: string }> {
        /**
         * Получает список кэшей из текущего хранилища
         * @param entry - элемент хранилища
         * @returns Список кэшей
         */
        const entries = Array.from(this.entries());
        const savings = entries.flatMap(getCacheList);

        return cache.set(CACHE_KEY, savings);
    }

    getCacheFromNodeSourceFile(
        fileNodeSourceCode: FileNodeSourceCode
    ): GetCacheFromNodeSourceFileReturn {
        const { fileSourceCode, nodeSourceCode, jsDocOptions } = fileNodeSourceCode;
        const hashDigestCodeSnippet = sha1(nodeSourceCode);
        const hashDigestSourceCode = sha1(fileSourceCode);
        const hashCodeSnippet = hashDigestCodeSnippet.toString();
        const hashSourceCode = hashDigestSourceCode.toString();
        const codeSnippetHashMap = this.get(hashSourceCode) || new Map();

        return { hashCodeSnippet, hashSourceCode, codeSnippetHashMap, jsDocOptions };
    }

    isNodeInCache(fileNodeSourceCode: FileNodeSourceCode): boolean {
        const { jsDocOptions } = fileNodeSourceCode;
        const data = this.getCacheFromNodeSourceFile(fileNodeSourceCode);
        const { codeSnippetHashMap, hashCodeSnippet } = data;
        const fileCacheHashMetadata = codeSnippetHashMap.get(hashCodeSnippet);

        return (
            codeSnippetHashMap.has(hashCodeSnippet) &&
            JSON.stringify(fileCacheHashMetadata?.jsDocOptions || {}) ===
                JSON.stringify(jsDocOptions)
        );
    }
}
