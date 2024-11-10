import { initJSDocFactory } from '../helpers/initJSDocFactory';

/**
 * Функция для создания JSDoc интерфейса.
 * @param {Object} params - Параметры для создания JSDoc интерфейса.
 * @param {Object} params.jsDocGeneratorService - Сервис для генерации JSDoc.
 * @param {Object} params.jsDocGeneratorServiceOptions - Опции для сервиса генерации JSDoc.
 * @param {Object} params.aiServiceOptions - Опции для AI сервиса.
 * @returns {string} - Сгенерированный JSDoc интерфейс.
 */
export const createJSDocInterface = initJSDocFactory({
    kind: 'InterfaceDeclaration',
    async getJSDocableCodeSnippet(params) {
        const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } = params;

        return jsDocGeneratorService.createJSDocInterface(
            jsDocGeneratorServiceOptions,
            aiServiceOptions
        );
    }
});
