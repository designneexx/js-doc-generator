import sha1 from 'crypto-js/sha1.js';
import { Cache } from 'file-system-cache';
import { FileNodeSourceCode, JSDocOptions, type FileCacheHashMetadata } from 'src/types/common';
import { getCacheList } from './helpers/getCacheList';

/**
 * Интерфейс, представляющий результат получения кэша из исходного файла узла.
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

    /**
     * Опции JSDoc.
     */
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
        /**
         * Получает список кэшей из текущего хранилища
         * @param {Array<[string, Map<string, FileCacheHashMetadata>]>} entry - элемент хранилища
         * @returns {Array<FileCacheHashMetadata>} Список кэшей
         */
        const savings = entries.flatMap(getCacheList);

        return cache.set(CACHE_KEY, savings);
    }

    /**
     * Получает кэш из исходного кода узла файла
     * @param fileNodeSourceCode - объект с исходным кодом файла
     * @returns Объект с данными кэша из исходного кода файла
     */
    getCacheFromNodeSourceFile(
        fileNodeSourceCode: FileNodeSourceCode
    ): GetCacheFromNodeSourceFileReturn {
        /**
         * Получает кэш из исходного кода узла файла
         * @param {FileNodeSourceCode} fileNodeSourceCode - объект с исходным кодом файла
         * @returns {GetCacheFromNodeSourceFileReturn} Объект с данными кэша из исходного кода файла
         */
        const { fileSourceCode, nodeSourceCode, jsDocOptions } = fileNodeSourceCode;
        const hashDigestCodeSnippet = sha1(nodeSourceCode);
        const hashDigestSourceCode = sha1(fileSourceCode);
        const hashCodeSnippet = hashDigestCodeSnippet.toString();
        const hashSourceCode = hashDigestSourceCode.toString();
        const codeSnippetHashMap = this.get(hashSourceCode) || new Map();

        return { hashCodeSnippet, hashSourceCode, codeSnippetHashMap, jsDocOptions };
    }

    /**
     * Проверяет, содержится ли узел в кэше
     * @param fileNodeSourceCode - объект с исходным кодом файла
     * @returns Результат проверки наличия узла в кэше
     */
    isNodeInCache(fileNodeSourceCode: FileNodeSourceCode): boolean {
        /**
         * Проверяет, содержится ли узел в кэше
         * @param {FileNodeSourceCode} fileNodeSourceCode - объект с исходным кодом файла
         * @returns {boolean} Результат проверки наличия узла в кэше
         */
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
