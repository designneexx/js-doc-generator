import { JSDocGeneratorServiceOptions, JSDocGeneratorService } from '@auto-js-doc-generator/core';
import axios from 'axios';

/**
 * Функция для создания сервиса генерации JSDoc комментариев.
 * @param {string} [baseURL] - Базовый URL для HTTP-клиента, если не передан, то используется значение из переменной окружения JS_DOC_GENERATOR_SERVICE
 * @returns {JSDocGeneratorService} - Возвращает объект сервиса генерации JSDoc комментариев
 */
export function createJSDocGeneratorService(baseURL?: string): JSDocGeneratorService {
    /**
     * HTTP-клиент для выполнения запросов на сервер
     * @type {import("axios").AxiosInstance}
     */ const axiosClient = axios.create({
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
        const { codeSnippet, referencedSourceFiles, sourceFile } = options;
        /**
         * Отправка POST запроса с данными для получения JSDoc комментариев
         */ const response = await axiosClient.post(url, {
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
        createJSDocClass(options) {
            return createJSDoc('/class', options);
        },
        createJSDocEnum(options) {
            return createJSDoc('/enum', options);
        },
        createJSDocFunction(options) {
            return createJSDoc('/function', options);
        },
        createJSDocInterface(options) {
            return createJSDoc('/interface', options);
        },
        createJSDocTypeAlias(options) {
            return createJSDoc('/type-alias', options);
        },
        createJSDocVariableStatement(options) {
            return createJSDoc('/variable-statement', options);
        }
    };

    return jsDocGeneratorService;
}
