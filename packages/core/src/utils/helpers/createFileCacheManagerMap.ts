import { type FileCacheHashMetadata } from 'core/types/common';
import { Cache } from 'file-system-cache';
import { FileCacheManagerMap } from '../FileCacheManagerMap';

/**
 * Создает отображение менеджера кэша файлов на основе переданного кэша.
 * @param {Cache} cache - Кэш, из которого нужно создать отображение менеджера кэша файлов.
 * @returns {Promise<FileCacheManagerMap>} - Объект FileCacheManagerMap, содержащий отображение менеджера кэша файлов.
 */
export async function createFileCacheManagerMap(cache: Cache): Promise<FileCacheManagerMap> {
    /**
     * Переменная, содержащая сериализованный кеш
     * @type {any}
     */
    const serializedCache = await cache.load();
    /**
     * Объект, содержащий кэшированные файлы
     * @typedef {Object} SerializedCache
     * @property {Array<string>} files - Массив строк, представляющих кэшированные файлы
     */
    const { files } = serializedCache;
    /**
     * Хэш-карта для кеширования кода.
     * @type {FileCacheManagerMap}
     */
    const codeCacheHashMap = new FileCacheManagerMap();
    /**
     * Массив метаданных файлов, хранящихся в кэше
     */
    const flatFiles: FileCacheHashMetadata[] = files.flatMap((item) => item.value);

    for (const serializedFile of flatFiles) {
        /**
         * Хэш-код исходного кода файла.
         * @type {string}
         */
        const { fileSourceCodeHash, nodeSourceCodeHash } = serializedFile;
        /**
         * Сет узлов.
         * @type {Map<string, any>}
         */
        const nodesSet = codeCacheHashMap.get(fileSourceCodeHash) || new Map();

        nodesSet.set(nodeSourceCodeHash, { fileSourceCodeHash, nodeSourceCodeHash });
        codeCacheHashMap.set(fileSourceCodeHash, nodesSet);
    }

    return codeCacheHashMap;
}
