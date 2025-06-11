import { JSDocGeneratorServiceOptions, JSDocGeneratorService } from '@auto-js-doc-generator/core';
import axios from 'axios';

/**
 * Функция для создания сервиса генерации JSDoc комментариев
 * @param {string} [baseURL] - Опциональный базовый URL для HTTP-клиента
 * @returns {JSDocGeneratorService} - Возвращает объект сервиса генерации JSDoc комментариев
 */
export function createJSDocGeneratorService(baseURL?: string): JSDocGeneratorService {
    /**
     * HTTP-клиент для выполнения запросов на сервер
     * @type {import("axios").AxiosInstance}
     */
    const axiosClient = axios.create({
        baseURL: baseURL || process.env.JS_DOC_GENERATOR_SERVICE
    });

    /**
     * Функция для создания JSDoc комментариев
     * @param {string} url - URL для отправки запроса
     * @param {JSDocGeneratorServiceOptions} options - Опции генерации JSDoc комментариев
     * @returns {Promise<string>} - Возвращает сгенерированные JSDoc комментарии в виде строки
     */
    async function createJSDoc(url: string, options: JSDocGeneratorServiceOptions) {
        /**
         * Деструктуризация опций генерации JSDoc комментариев
         */
        /**
         * Фрагмент кода
         * @type {string}
         */
        const { codeSnippet, referencedSourceFiles, sourceFile } = options;
        /**
         * Отправка POST запроса с данными для получения JSDoc комментариев
         */
        /**
         * Отправляет POST запрос с указанными данными
         * @async
         * @function sendPostRequest
         * @param {string} url - URL для отправки запроса
         * @param {Object} data - Данные для отправки
         * @param {string} data.codeSnippet - Кодовый фрагмент
         * @param {Array<string>} data.referencedSourceFiles - Список файлов, на которые ссылаются
         * @param {string} data.sourceFile - Исходный файл
         * @returns {Promise<Response>} - Промис с ответом от сервера
         */
        const response = await axiosClient.post(url, {
            codeSnippet,
            referencedSourceFiles,
            sourceFile
        });
        return response.data.code;
    }

    /**
     * Объект сервиса генерации JSDoc комментариев
     * @type {JSDocGeneratorService}
     */
    const jsDocGeneratorService: JSDocGeneratorService = {
        /**
         * Создает JSDoc комментарий для класса.
         * @param {JSDocOptions} options - Опции для генерации комментария.
         * @returns {string} - Сгенерированный JSDoc комментарий для класса.
         */
        createJSDocClass(options) {
            return createJSDoc('/class', options);
        },
        /**
         * Создает JSDoc комментарий для перечисления (enum).
         * @param {JSDocOptions} options - Опции для генерации комментария.
         * @returns {string} - Сгенерированный JSDoc комментарий для перечисления.
         */
        createJSDocEnum(options) {
            return createJSDoc('/enum', options);
        },
        /**
         * Создает JSDoc комментарий для функции.
         * @param {JSDocOptions} options - Опции для генерации комментария.
         * @returns {string} - Сгенерированный JSDoc комментарий для функции.
         */
        createJSDocFunction(options) {
            return createJSDoc('/function', options);
        },
        /**
         * Создает JSDoc комментарий для интерфейса.
         * @param {JSDocOptions} options - Опции для генерации комментария.
         * @returns {string} - Сгенерированный JSDoc комментарий для интерфейса.
         */
        createJSDocInterface(options) {
            return createJSDoc('/interface', options);
        },
        /**
         * Создает JSDoc комментарий для псевдонима типа (type alias).
         * @param {JSDocOptions} options - Опции для генерации комментария.
         * @returns {string} - Сгенерированный JSDoc комментарий для псевдонима типа.
         */
        createJSDocTypeAlias(options) {
            return createJSDoc('/type-alias', options);
        },
        /**
         * Создает JSDoc комментарий для оператора объявления переменных (variable statement).
         * @param {JSDocOptions} options - Опции для генерации комментария.
         * @returns {string} - Сгенерированный JSDoc комментарий для оператора объявления переменных.
         */
        createJSDocVariableStatement(options) {
            return createJSDoc('/variable-statement', options);
        }
    };

    return jsDocGeneratorService;
}
