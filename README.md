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
После можете запустить npm run generate.

В ваш конфиг jsdocgen.config.ts вы можете добавлять следующие параметры
```typescript
/**
 * Интерфейс для параметров инициализации сервиса.
 */
export interface InitParams<CurrentAIServiceOptions extends AIServiceOptions = AIServiceOptions> {
    /**
     * Опции для генерации кэша
     * Тип из библиотеки file-system-cache
     */
    cacheOptions?: FileSystemCacheOptions;
    /**
     * Директория с кэшэм
     */
    cacheDir?: string;
    /**
     * Опции проекта, которые могут включать в себя настройки, специфичные для текущего проекта.
     * Тип из библиотеки ts-morph
     * @type {ProjectOptions}
     */
    projectOptions?: ProjectOptions;
    /**
     * Опции для настройки ESLint, инструмента для анализа кода.
     * Тип из библотеки ESLint
     * @type {ESLint.Options}
     */
    esLintOptions?: ESLint.Options;
    /**
     * Массив строк, представляющих пути к файлам, которые будут обрабатываться сервисом.
     *
     * @type {string[]}
     */
    files: string[];
    /**
     * Массив строк, представляющих пути к файлам, которые должны быть проигнорированы сервисом.
     *
     * @type {string[]}
     */
    ignoredFiles?: string[];
    /**
     * Экземпляр сервиса генерации JSDoc, который используется для автоматического создания документации.
     *
     * @type {JSDocGeneratorService<CurrentAIServiceOptions>}
     */
    jsDocGeneratorService: JSDocGeneratorService<CurrentAIServiceOptions>;
    /**
     * Глобальные опции генерации, которые применяются ко всему процессу генерации.
     *
     * @type {GenerationOptions<CurrentAIServiceOptions>}
    */
    globalGenerationOptions?: {
        /**
         * Массив, содержащий виды синтаксических элементов, которые будут использоваться
         * при генерации. Каждый элемент массива является ключом из перечисления SyntaxKind.
         */
        kinds: `${KindDeclarationNames}`[];
        /**
         * Опциональный объект, содержащий параметры для генерации JSDoc комментариев.
         * Может включать в себя различные настройки, влияющие на формат и содержание
         * генерируемых JSDoc комментариев.
         */
        jsDocOptions?: {
            /**
             * Режим вставки JSDoc комментариев.
             *
             * Определяет, каким образом будут вставляться JSDoc комментарии.
             * Может принимать значения из перечисления `InsertModeJSDocTypes` или их строковые представления.
             */
            mode?: InsertModeJSDocTypes | keyof typeof InsertModeJSDocTypes;
            /**
             * Глубина вложенности JSDoc комментариев.
             *
             * Указывает, насколько глубоко будут вложены JSDoc комментарии в структуре кода.
             * Значение по умолчанию может варьироваться в зависимости от реализации.
             */
            depth?: number;
            /**
             * Флаг для отображения описания в JSDoc комментариях.
             *
             * Если установлен в `true`, JSDoc комментарии будут включать описание соответствующих элементов кода.
             */
            isShowJSDocDescription?: boolean;
            /**
             * Флаг для отображения тегов в JSDoc комментариях.
             *
             * Если установлен в `true`, JSDoc комментарии будут включать теги, такие как `@param`, `@returns` и другие.
             */
            isShowJSDocTags?: boolean;
            /**
             * Разрешенные теги JSDoc.
             *
             * Список строк, определяющий, какие теги JSDoc разрешены для использования.
             * Если не указан, разрешены все теги.
             */
            allowedJSDocTags?: string[];
            /**
             * Запрещенные теги JSDoc.
             *
             * Список строк, определяющий, какие теги JSDoc запрещены для использования.
             * Эти теги не будут включены в сгенерированные комментарии, даже если они указаны в `allowedJSDocTags`.
             */
            disabledJSDocTags?: string[];
            /**
             * Флаг для отключения опции.
             *
             * Если установлен в `true`, все настройки JSDoc будут игнорироваться и комментарии не будут генерироваться.
             */
            disabled?: boolean;
        };
        /**
         * Объект, содержащий специфичные для текущего сервиса искусственного интеллекта
         * параметры. Эти параметры позволяют настраивать поведение сервиса в процессе
         * генерации. Тип определяется параметром CurrentAIServiceOptions.
         */
        aiServiceOptions: CurrentAIServiceOptions;
    };
    /**
     * Опции детальной генерации, которые могут быть применены к более специфичным аспектам генерации - конкретным узлам дерева AST.
     * @type {SyntaxKind} ClassDeclaration | InterfaceDeclaration | VariableStatement | FunctionDeclaration | EnumDeclaration | TypeAlias
     * @type {DetailGenerationOptions<CurrentAIServiceOptions>}
     */
    detailGenerationOptions?: Record<keyof typeof SyntaxKind, Omit<{
        /**
         * Массив, содержащий виды синтаксических элементов, которые будут использоваться
         * при генерации. Каждый элемент массива является ключом из перечисления SyntaxKind.
         */
        kinds: `${KindDeclarationNames}`[];
        /**
         * Опциональный объект, содержащий параметры для генерации JSDoc комментариев.
         * Может включать в себя различные настройки, влияющие на формат и содержание
         * генерируемых JSDoc комментариев.
         */
        jsDocOptions?: {
            /**
             * Режим вставки JSDoc комментариев.
             *
             * Определяет, каким образом будут вставляться JSDoc комментарии.
             * Может принимать значения из перечисления `InsertModeJSDocTypes` или их строковые представления.
             */
            mode?: InsertModeJSDocTypes | keyof typeof InsertModeJSDocTypes;
            /**
             * Глубина вложенности JSDoc комментариев.
             *
             * Указывает, насколько глубоко будут вложены JSDoc комментарии в структуре кода.
             * Значение по умолчанию может варьироваться в зависимости от реализации.
             */
            depth?: number;
            /**
             * Флаг для отображения описания в JSDoc комментариях.
             *
             * Если установлен в `true`, JSDoc комментарии будут включать описание соответствующих элементов кода.
             */
            isShowJSDocDescription?: boolean;
            /**
             * Флаг для отображения тегов в JSDoc комментариях.
             *
             * Если установлен в `true`, JSDoc комментарии будут включать теги, такие как `@param`, `@returns` и другие.
             */
            isShowJSDocTags?: boolean;
            /**
             * Разрешенные теги JSDoc.
             *
             * Список строк, определяющий, какие теги JSDoc разрешены для использования.
             * Если не указан, разрешены все теги.
             */
            allowedJSDocTags?: string[];
            /**
             * Запрещенные теги JSDoc.
             *
             * Список строк, определяющий, какие теги JSDoc запрещены для использования.
             * Эти теги не будут включены в сгенерированные комментарии, даже если они указаны в `allowedJSDocTags`.
             */
            disabledJSDocTags?: string[];
            /**
             * Флаг для отключения опции.
             *
             * Если установлен в `true`, все настройки JSDoc будут игнорироваться и комментарии не будут генерироваться.
             */
            disabled?: boolean;
        };
        /**
         * Объект, содержащий специфичные для текущего сервиса искусственного интеллекта
         * параметры. Эти параметры позволяют настраивать поведение сервиса в процессе
         * генерации. Тип определяется параметром CurrentAIServiceOptions.
         */
        aiServiceOptions: CurrentAIServiceOptions;
    }, 'kinds'>>
}
```