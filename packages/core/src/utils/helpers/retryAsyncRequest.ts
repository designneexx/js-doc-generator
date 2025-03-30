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
    /**
     * Функция обратного вызова, вызываемая при успешном выполнении запроса
     * @param data - данные типа T, полученные из запроса
     * @param retries - количество попыток, затраченных на выполнение запроса
     */
    notifySuccess?(data: T, retries: number): void;
    /**
     * Функция обратного вызова, вызываемая при возникновении ошибки при выполнении запроса
     * @param error - ошибка, полученная при выполнении запроса
     * @param retries - количество попыток, затраченных на выполнение запроса
     */
    notifyError?(error: unknown, retries: number): void;
}

/**
 * Повторяет асинхронный запрос с заданными параметрами
 * @template T - тип возвращаемого значения
 * @param {RetryAsyncRequestParams<T>} params - Параметры для повтора запроса
 * @returns {Promise<T>} - Промис с результатом запроса
 */
export async function retryAsyncRequest<T>(params: RetryAsyncRequestParams<T>): Promise<T> {
    const { run, retries = 1, notifyError, notifySuccess } = params;
    let lastValue: T | null = null;
    let lastError: unknown = null;

    for (let i = 1; i <= retries; i++) {
        try {
            const data = await run();
            lastValue = data;
            lastError = null;

            notifySuccess?.(data, i);

            break;
        } catch (error) {
            lastError = error;
        }
    }

    if (lastError === null) {
        return lastValue as T;
    }

    notifyError?.(lastError, retries);

    throw lastError;
}
