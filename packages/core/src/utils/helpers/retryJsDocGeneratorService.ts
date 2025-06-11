import { JSDocGeneratorService } from 'src/types/common';
import { fromAsync } from './fromAsync';

/**
 * Параметры сервиса генерации JSDoc для повторной попытки.
 */
interface RetryJsDocGeneratorServiceParams {
    /**
     * Сервис генерации JSDoc.
     */
    jsDocGeneratorService: JSDocGeneratorService;
    /**
     * Количество попыток повторной генерации.
     */
    retries: number;
}

/**
 * Перечисление для типов ответов
 */
enum ResponseTypes {
    /**
     * Успешный ответ
     */
    Success = 1 << 1,
    /**
     * Ответ с ошибкой
     */
    Failure = 1 << 2
}

/**
 * Интерфейс для представления успешного ответа с определенным значением.
 * @template Value - тип значения успешного ответа
 */
interface SuccessResponse<Value = string> {
    /**
     * Статус успешного ответа.
     */
    status: ResponseTypes;
    /**
     * Значение успешного ответа.
     */
    value: Value;
}

/**
 * Интерфейс для представления ответа об ошибке.
 * @template DetailError Тип детальной ошибки, наследуемой от Error по умолчанию.
 */
interface FailureResponse<DetailError extends Error = Error> {
    /**
     * Статус ответа.
     */
    status: ResponseTypes;
    /**
     * Объект ошибки.
     */
    error: DetailError;
}

/**
 * Интерфейс для параметров выполнения асинхронной функции с возможностью повторных попыток
 * @template PromiseType Тип возвращаемого значения обещания
 */
interface ExecuteAsyncWithRetriesParams<PromiseType> {
    /**
     * Количество попыток выполнения функции
     */
    retries: number;
    /**
     * Функция, которая будет выполнена асинхронно
     * @returns Обещание с возвращаемым значением типа PromiseType
     */
    execute: () => Promise<PromiseType>;
}

/**
 * Асинхронно выполняет функцию с возможностью повторных попыток в случае ошибки.
 * @template PromiseType Тип возвращаемого значения обещания
 * @param {ExecuteAsyncWithRetriesParams<PromiseType>} params Параметры выполнения с повторными попытками
 * @returns {AsyncGenerator<AsyncResponse<PromiseType>, void, unknown>} Генератор асинхронных ответов
 */
async function* executeAsyncWithRetries<PromiseType>({
    retries,
    execute
}: ExecuteAsyncWithRetriesParams<PromiseType>) {
    /**
     * Индекс элемента
     * @type {number}
     */
    let index = 0;

    while (index < retries) {
        index++;
        try {
            /**
             * Результат выполнения асинхронной функции execute
             * @type {any}
             */
            const value = await execute();
            yield { status: ResponseTypes.Success, value };
            break;
        } catch (error) {
            yield { status: ResponseTypes.Failure, error };
        }
    }
}

/**
 * Генератор JSDoc сервиса с возможностью повторных попыток выполнения.
 * @param {RetryJsDocGeneratorServiceParams} params - Параметры для генератора JSDoc сервиса.
 * @returns {JSDocGeneratorService} - Прокси-объект для JSDoc сервиса с повторными попытками выполнения.
 */
export function retryJsDocGeneratorService(
    params: RetryJsDocGeneratorServiceParams
): JSDocGeneratorService {
    /**
     * Параметры для функции
     * @typedef {Object} Params
     * @property {Object} jsDocGeneratorService - Сервис для генерации JSDoc
     * @property {number} retries - Количество попыток
     */
    const { jsDocGeneratorService, retries } = params;

    /**
     * Сервис для генерации JSDoc комментариев
     */
    const jsDocGeneratorServiceProxy = new Proxy(jsDocGeneratorService, {
        /**
         * Перехватывает доступ к свойствам объекта JSDocGeneratorService
         * @template Prop - ключ доступа к свойству JSDocGeneratorService
         * @param {JSDocGeneratorService} target - целевой объект JSDocGeneratorService
         * @param {Prop} prop - свойство, к которому происходит доступ
         * @returns {Promise<unknown>} - результат выполнения асинхронной функции
         */
        get<Prop extends keyof JSDocGeneratorService>(target: JSDocGeneratorService, prop: Prop) {
            /**
             * Оригинальный метод, который был сохранен до перезаписи
             * @type {Function}
             */
            const originalMethod = target[prop];

            return async function (...args: Parameters<JSDocGeneratorService[Prop]>) {
                /**
                 * Переменная, содержащая результат выполнения асинхронной функции с возможностью повторных попыток
                 * @type {Object}
                 */
                const executors = executeAsyncWithRetries({
                    retries,
                    execute: originalMethod.bind(target, ...args)
                });
                /**
                 * Результат выполнения асинхронной функции.
                 * @type {any}
                 */
                const result = await fromAsync(executors);
                /**
                 * Переменная successResponse содержит первый элемент массива result, удовлетворяющий условию
                 * @type {SuccessResponse}
                 */
                const successResponse = result.find(
                    /**
                     * Функция обратного вызова, проверяющая статус элемента массива
                     * @param {Item} item - Элемент массива
                     * @returns {boolean} - Возвращает true, если статус элемента соответствует ResponseTypes.Success
                     */
                    (item) => item.status & ResponseTypes.Success
                ) as SuccessResponse;

                if (successResponse) {
                    return successResponse.value;
                }

                /**
                 * Последний элемент в массиве result, удовлетворяющий условию поиска.
                 * @type {FailureResponse}
                 */
                const failureResponse = result.findLast(
                    /**
                     * Функция, определяющая удовлетворение элемента условию поиска.
                     * @param {Item} item - Элемент массива result.
                     * @returns {boolean} - Результат проверки на соответствие условию.
                     */
                    (item) => item.status & ResponseTypes.Failure
                ) as FailureResponse;

                if (failureResponse) {
                    throw failureResponse.error;
                }

                throw new Error('The request limit has been reached');
            };
        }
    });

    return jsDocGeneratorServiceProxy;
}
