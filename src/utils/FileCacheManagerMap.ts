import { Cache } from 'file-system-cache';
import { FileCacheHashMetadata } from 'src/types/common';
import { getCacheList } from './helpers/getCacheList';

/**
 * Класс для управления кэшем файлов с использованием Map
 */
export class FileCacheManagerMap extends Map<string, Map<string, FileCacheHashMetadata>> {
    /**
     * Сохраняет кэш в хранилище
     * @param cache - объект кэша для сохранения
     * @returns Результат сохранения кэша
     */
    save(cache: Cache) {
        /**
         * Получает список кэшей из текущего хранилища
         * @param entry - элемент хранилища
         * @returns Список кэшей
         */
        const entries = Array.from(this.entries());
        const savings = entries.map(getCacheList);

        return cache.save(savings);
    }
}
