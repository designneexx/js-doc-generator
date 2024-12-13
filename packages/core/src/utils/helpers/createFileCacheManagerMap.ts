import { Cache } from 'file-system-cache';
import { type FileCacheHashMetadata } from 'core/types/common';
import { FileCacheManagerMap } from '../FileCacheManagerMap';

/**
 * Создает отображение менеджера кэша файлов на основе переданного кэша.
 * @param {Cache} cache - Кэш, из которого нужно загрузить данные.
 * @returns {Promise<FileCacheManagerMap>} - Объект, представляющий отображение менеджера кэша файлов.
 */
export async function createFileCacheManagerMap(cache: Cache): Promise<FileCacheManagerMap> {
    const serializedCache = await cache.load();
    const { files } = serializedCache;
    const codeCacheHashMap = new FileCacheManagerMap();
    const flatFiles: FileCacheHashMetadata[] = files.flatMap((item) => item.value);

    for (const serializedFile of flatFiles) {
        const { fileSourceCodeHash, nodeSourceCodeHash } = serializedFile;
        const nodesSet = codeCacheHashMap.get(fileSourceCodeHash) || new Map();

        nodesSet.set(nodeSourceCodeHash, { fileSourceCodeHash, nodeSourceCodeHash });
        codeCacheHashMap.set(fileSourceCodeHash, nodesSet);
    }

    return codeCacheHashMap;
}