import { type FileCacheHashMetadata } from 'core/types/common';

/**
 * Получает список кэша из входного элемента.
 * @param entry - Входной элемент, содержащий ключ и карту значений кэша.
 * @returns Объект, содержащий ключ и массив значений кэша.
 */
export function getCacheList(
    entry: [string, Map<string, FileCacheHashMetadata>]
): FileCacheHashMetadata[] {
    const [, map] = entry;

    return Array.from(map.values());
}
