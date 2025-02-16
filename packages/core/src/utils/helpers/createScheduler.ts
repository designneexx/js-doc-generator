import { sleep } from './sleep';

/**
 * Интерфейс, представляющий успешное выполнение задачи.
 * @template Value Тип значения, возвращаемого при успешном выполнении задачи.
 */
export interface SuccessTask<Value> {
    /**
     * Флаг успешного выполнения задачи.
     */
    success: true;
    /**
     * Значение, возвращаемое при успешном выполнении задачи.
     */
    value: Value;
}

/**
 * Интерфейс, представляющий информацию о задаче, которая завершилась неудачей.
 */
export interface FailedTask {
    /**
     * Флаг, указывающий на неудачное завершение задачи.
     */
    success: false;
    /**
     * Ошибка, которая привела к неудачному завершению задачи.
     */
    error: unknown;
}

/**
 * Обобщенный тип TaskResult представляет собой результат выполнения задачи.
 * Может быть либо успешным результатом типа SuccessTask, либо неудачным результатом FailedTask.
 * @template Value - обобщенный тип значения успешного результата
 */
export type TaskResult<Value> = SuccessTask<Value> | FailedTask;

/**
 * Интерфейс Scheduler представляет собой планировщик задач.
 */
export interface Scheduler {
    /**
     * Запускает задачу и возвращает результат выполнения.
     * @param callback Функция обратного вызова, представляющая собой асинхронную задачу.
     * @returns Промис с результатом выполнения задачи.
     */
    runTask<T>(callback: () => Promise<T>): Promise<TaskResult<T>>;
}

/**
 * Создает планировщик задач с указанным временем ожидания между выполнением задач
 * @param {number} ms - Время ожидания в миллисекундах между выполнением задач (по умолчанию 0)
 * @returns {Scheduler} - Возвращает объект планировщика задач
 */
export function createScheduler(ms = 0): Scheduler {
    const queueSet = new Set<() => Promise<unknown>>();
    /**
     * Генератор, который поочередно выполняет задачи из очереди
     * @yields {TaskResult} - Результат выполнения задачи
     */
    async function* generator() {
        for (const callback of queueSet) {
            try {
                const value = await callback();

                yield { success: true as const, value };

                await sleep(ms);
            } catch (error) {
                yield { success: false as const, error };
            }
        }
    }
    const iterator = generator();

    return {
        /**
         * Добавляет задачу в очередь и запускает выполнение следующей задачи
         * @param {Function} callback - Функция-задача, которая возвращает Promise
         * @returns {Promise<TaskResult>} - Результат выполнения задачи
         */
        async runTask<T>(callback: () => Promise<T>): Promise<TaskResult<T>> {
            queueSet.add(callback);
            const iteratorResult = await iterator.next();

            if (!iteratorResult.done) {
                return iteratorResult.value as TaskResult<T>;
            }

            throw new Error("Can't get task");
        }
    };
}
