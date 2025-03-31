/**
 * Интерфейс для параметров повторного асинхронного запроса с возможностью повтора в случае ошибки
 * @template T - тип данных, возвращаемых из запроса
 */
interface RetryAsyncRequestParams<T> {
    /**
     * Функция, которая выполняет асинхронный запрос и возвращает Promise с данными типа T
     * @returns Promise<T>
     */
    run(): Promise<T>;
    /**
     * Количество попыток повтора запроса в случае ошибки (по умолчанию 1)
     */
    retries?: number;
}

/**
 * Интерфейс RetriedResponse представляет собой объект, содержащий информацию о количестве попыток и значении.
 * @template T - обобщенный тип значения
 */
export interface RetriedResponse<T> {
    /**
     * Количество попыток, которые были предприняты для получения значения.
     */
    retries: number;
    /**
     * Значение, полученное после попыток.
     */
    value: T;
}

/**
 * Повторяет асинхронный запрос с заданными параметрами
 * @template T - тип возвращаемого значения
 * @param {RetryAsyncRequestParams<T>} params - Параметры для повтора запроса
 * @returns {Promise<T>} - Промис с результатом запроса
 */
export async function retryAsyncRequest<T>(
    params: RetryAsyncRequestParams<T>
): Promise<RetriedResponse<T>> {
    const { run, retries = 1 } = params;
    let lastValue: T | null = null;
    let lastError: unknown = null;
    let i = 1;

    for (; i <= retries; i++) {
        try {
            const data = await run();
            lastValue = data;
            lastError = null;

            break;
        } catch (error) {
            lastError = error;
        }
    }

    if (lastError === null) {
        return { retries: i, value: lastValue as T };
    }

    throw lastError;
}
