import { type FileCacheHashMetadata } from 'core/types/common';

/**
 * Возвращает массив метаданных файлов из кэша
 * @param entry - Входная запись кэша в формате [ключ, карта метаданных файлов]
 * @returns Массив метаданных файлов
 */
export function getCacheList(
    entry: [string, Map<string, FileCacheHashMetadata>]
): FileCacheHashMetadata[] {
    const [, map] = entry;

    return Array.from(map.values());
}
