import { Cache } from 'file-system-cache';
import { type FileCacheHashMetadata } from 'src/types/common';
import { getCacheList } from './helpers/getCacheList';

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
}
