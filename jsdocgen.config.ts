import 'dotenv/config';
import axios from 'axios';

/**
 * HTTP-клиент для выполнения запросов на сервер
 * @type {import("axios").AxiosInstance}
 */ const axiosClient = axios.create({
    baseURL: process.env.JS_DOC_GENERATOR_SERVICe
});

/**
 * Асинхронная функция для создания JSDoc комментариев на основе переданных параметров.
 * @template CurrentAIServiceOptions - обобщенный тип для параметра aiServiceOptions
 * @param {string} url - URL для отправки POST запроса
 * @param {JSDocGeneratorServiceOptions} options - Опции генерации JSDoc комментариев
 * @param {CurrentAIServiceOptions} aiServiceOptions - Опции AI сервиса
 * @returns {Promise<string>} - Возвращает сгенерированные JSDoc комментарии в виде строки
 */ async function createJSDoc(url, options, aiServiceOptions) {
    /**
     * Деструктуризация опций генерации JSDoc комментариев
     */
    const { codeSnippet, referencedSourceFiles, sourceFile } = options;
    /**
     * Отправка POST запроса с данными для получения JSDoc комментариев
     */ const response = await axiosClient.post(url, {
        aiServiceOptions,
        codeSnippet,
        referencedSourceFiles,
        sourceFile
    });
    return response.data.code;
}

const jsDocGeneratorService = {
    /**
     * Создает JSDoc для класса.
     * @param {Options} options - Опции для генерации JSDoc, которые могут включать в себя информацию о методах и свойствах класса.
     * @param {AiServiceOptions} aiServiceOptions - Опции сервиса искусственного интеллекта, используемые для улучшения генерации JSDoc.
     * @returns {string} - Сгенерированный JSDoc для класса, который может быть использован для документирования структуры и функциональности класса.
     */
    createJSDocClass(options, aiServiceOptions) {
        return createJSDoc('/class', options, aiServiceOptions);
    },
    /**
     * Создает JSDoc для перечисления (enum).
     * @param {Options} options - Опции для генерации JSDoc, которые могут включать в себя информацию о значениях и описаниях перечисления.
     * @param {AiServiceOptions} aiServiceOptions - Опции сервиса искусственного интеллекта, используемые для улучшения генерации JSDoc.
     * @returns {string} - Сгенерированный JSDoc для перечисления (enum), полезный для документирования возможных значений и их значений.
     */
    createJSDocEnum(options, aiServiceOptions) {
        return createJSDoc('/enum', options, aiServiceOptions);
    },
    /**
     * Создает JSDoc для функции.
     * @param {Options} options - Опции для генерации JSDoc, которые могут включать в себя информацию о параметрах и возвращаемых значениях функции.
     * @param {AiServiceOptions} aiServiceOptions - Опции сервиса искусственного интеллекта, используемые для улучшения генерации JSDoc.
     * @returns {string} - Сгенерированный JSDoc для функции, который может быть использован для документирования сигнатуры и поведения функции.
     */
    createJSDocFunction(options, aiServiceOptions) {
        return createJSDoc('/function', options, aiServiceOptions);
    },
    /**
     * Создает JSDoc для интерфейса.
     * @param {Options} options - Опции для генерации JSDoc, которые могут включать в себя информацию о структуре и свойствах интерфейса.
     * @param {AiServiceOptions} aiServiceOptions - Опции сервиса искусственного интеллекта, используемые для улучшения генерации JSDoc, такие как настройки модели или параметры обработки.
     * @returns {string} - Сгенерированный JSDoc для интерфейса, который может быть использован для документирования кода.
     */
    createJSDocInterface(options, aiServiceOptions) {
        return createJSDoc('/interface', options, aiServiceOptions);
    },
    /**
     * Создает JSDoc для псевдонима типа (type alias).
     * @param {Options} options - Опции для генерации JSDoc, которые могут включать в себя информацию о типах и их назначении.
     * @param {AiServiceOptions} aiServiceOptions - Опции сервиса искусственного интеллекта, используемые для улучшения генерации JSDoc.
     * @returns {string} - Сгенерированный JSDoc для псевдонима типа (type alias), полезный для документирования новых имен типов и их значений.
     */
    createJSDocTypeAlias(options, aiServiceOptions) {
        return createJSDoc('/type-alias', options, aiServiceOptions);
    },
    /**
     * Создает JSDoc для оператора объявления переменной (variable statement).
     * @param {Options} options - Опции для генерации JSDoc, которые могут включать в себя информацию о переменных и их значениях.
     * @param {AiServiceOptions} aiServiceOptions - Опции сервиса искусственного интеллекта, используемые для улучшения генерации JSDoc.
     * @returns {string} - Сгенерированный JSDoc для оператора объявления переменной (variable statement), полезный для документирования переменных и их использования.
     */
    createJSDocVariableStatement(options, aiServiceOptions) {
        return createJSDoc('/variable-statement', options, aiServiceOptions);
    }
};

export default {
    files: ['packages/**/*.{ts,tsx}'],
    jsDocGeneratorService,
    projectOptions: {
        tsConfigFilePath: 'tsconfig.json'
    },
    globalGenerationOptions: {
        jsDocOptions: {
            mode: 1
        }
    }
};
