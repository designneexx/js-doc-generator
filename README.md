## Запуск проекта

Создайте файл jsdocgen.config.{ts,js} в корне вашего проекта, добавьте в него следующий код:

```typescript
import { AIServiceOptions, InitParams, JSDocGeneratorService, JSDocGeneratorServiceOptions } from "auto-js-doc-generator/dist/src/types/common";
import axios from "axios";

/**
 * Интерфейс, представляющий ответ с кодом JSDoc.
 */
export interface GetJSDocCodeReponse {
    /**
     * Строковое значение, представляющее сгенерированный или полученный код JSDoc.
     */
    code: string;
}

/**
 * HTTP-клиент для выполнения запросов на сервер
 * @type {import("axios").AxiosInstance}
 */
export const axiosClient = axios.create({
    /** 
     * Адрес до вашего сервиса с ИИ
    */
    baseURL: 'http://localhost:3002'
});

/**
 * Асинхронная функция для создания JSDoc комментариев.
 * @template CurrentAIServiceOptions - обобщенный тип для опций сервиса AI
 * @param {string} url - URL для отправки POST запроса
 * @param {JSDocGeneratorServiceOptions} options - Опции генератора JSDoc комментариев
 * @param {CurrentAIServiceOptions} aiServiceOptions - Опции сервиса AI
 * @returns {Promise<string>} - Обещание сгенерированных JSDoc комментариев
 */
export async function createJSDoc<CurrentAIServiceOptions extends AIServiceOptions>(
    url: string,
    options: JSDocGeneratorServiceOptions,
    aiServiceOptions: CurrentAIServiceOptions
) {
    /**
     * Деструктуризация опций генерации JSDoc комментариев
     */
    const { referencedSourceFiles, codeSnippet, sourceFile } = options;

    /**
     * Отправка POST запроса с данными для получения JSDoc комментариев
     */
    const response = await axiosClient.post<GetJSDocCodeReponse>(url, {
        codeSnippet,
        sourceFile,
        referencedSourceFiles,
        aiServiceOptions
    });

    return response.data.code;
}

/**
 * Сервис для генерации JSDoc комментариев.
 */
export const jsDocGeneratorService: JSDocGeneratorService = {
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
     * Создает JSDoc для перечисления (enum).
     * @param {Options} options - Опции для генерации JSDoc, которые могут включать в себя информацию о значениях и описаниях перечисления.
     * @param {AiServiceOptions} aiServiceOptions - Опции сервиса искусственного интеллекта, используемые для улучшения генерации JSDoc.
     * @returns {string} - Сгенерированный JSDoc для перечисления (enum), полезный для документирования возможных значений и их значений.
     */
    createJSDocEnum(options, aiServiceOptions) {
        return createJSDoc('/enum', options, aiServiceOptions);
    },
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
    },
    /**
     * Создает JSDoc для функции.
     * @param {Options} options - Опции для генерации JSDoc, которые могут включать в себя информацию о параметрах и возвращаемых значениях функции.
     * @param {AiServiceOptions} aiServiceOptions - Опции сервиса искусственного интеллекта, используемые для улучшения генерации JSDoc.
     * @returns {string} - Сгенерированный JSDoc для функции, который может быть использован для документирования сигнатуры и поведения функции.
     */
    createJSDocFunction(options, aiServiceOptions) {
        return createJSDoc('/function', options, aiServiceOptions);
    }
};

export default {
    jsDocGeneratorService
} as InitParams
```
Затем добавьте в package.json:
```json
{
    "scripts": {
        "generate": "auto-js-doc-gen generate \"src/**/*.{ts,tsx}\""
    }
}
```
После можете запустить npm run generate