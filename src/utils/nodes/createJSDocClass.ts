import { type CreateJSDoc } from 'src/types/common';
import { ClassDeclaration } from 'ts-morph';
import { initJSDocFactory } from '../helpers/initJSDocFactory';

/**
 * Фабричная функция для создания объекта, который генерирует фрагмент кода с комментариями JSDoc для класса.
 *
 * @param {Object} config - Конфигурация для инициализации фабрики.
 * @param {string} config.kind - Тип объявления (ClassDeclaration).
 * @returns {Object} - Возвращает объект с методом getJSDocableCodeSnippet.
 */
export const createJSDocClass: CreateJSDoc<ClassDeclaration> = initJSDocFactory({
    kind: 'ClassDeclaration',
    /**
     * Асинхронно получает фрагмент кода с комментариями JSDoc для класса.
     *
     * @param {Object} params - Параметры, необходимые для генерации JSDoc.
     * @param {Object} params.jsDocGeneratorService - Сервис для генерации JSDoc.
     * @param {Object} params.jsDocGeneratorServiceOptions - Опции для сервиса генерации JSDoc.
     * @param {Object} params.aiServiceOptions - Опции для AI сервиса, используемого при генерации.
     * @returns {Promise<string>} - Возвращает промис, который разрешается в строку с JSDoc-комментариями для класса.
     */
    async getJSDocableCodeSnippet(params) {
        const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } = params;

        return jsDocGeneratorService.createJSDocClass(
            jsDocGeneratorServiceOptions,
            aiServiceOptions
        );
    }
});
