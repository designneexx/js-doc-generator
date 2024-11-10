import { FunctionDeclaration } from 'ts-morph';
import { initJSDocFactory } from '../helpers/initJSDocFactory';

/**
 * Функция для создания JSDoc для FunctionDeclaration.
 * @param {Object} params - Параметры для генерации JSDoc.
 * @param {JSDocGeneratorService} params.jsDocGeneratorService - Сервис для генерации JSDoc.
 * @param {JSDocGeneratorServiceOptions} params.jsDocGeneratorServiceOptions - Опции для генерации JSDoc.
 * @param {AIServiceOptions} params.aiServiceOptions - Опции для AI-сервиса.
 * @returns {string} - Сгенерированный JSDoc для FunctionDeclaration.
 */
export const createJSDocFunction = initJSDocFactory<FunctionDeclaration>({
    kind: 'FunctionDeclaration',
    async getJSDocableCodeSnippet(params) {
        const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } = params;

        return jsDocGeneratorService.createJSDocFunction(
            jsDocGeneratorServiceOptions,
            aiServiceOptions
        );
    }
});
