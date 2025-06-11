import { type FileCacheHashMetadata } from 'core/types/common';

/**
 * Возвращает массив метаданных файлов из кэша
 * @param entry - Входная запись кэша в формате [ключ, карта метаданных файлов]
 * @returns Массив метаданных файлов
 */
export function getCacheList(
    entry: [string, Map<string, FileCacheHashMetadata>]
): FileCacheHashMetadata[] {
    /**
     * Деструктурированное присваивание массива entry.
     * entry - массив, из которого берется второй элемент.
     * map - второй элемент массива entry, присваивается переменной map.
     */
    const [, map] = entry;

    return Array.from(map.values());
}
