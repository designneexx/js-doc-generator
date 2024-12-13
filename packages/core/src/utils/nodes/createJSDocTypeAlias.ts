import { type CreateJSDoc } from 'core/types/common';
import { TypeAliasDeclaration } from 'ts-morph';
import { initJSDocFactory } from '../helpers/initJSDocFactory';

/**
 * Функция для создания JSDoc алиаса типа.
 * @param {Object} params - Параметры для генерации JSDoc.
 * @param {JSDocGeneratorService} params.jsDocGeneratorService - Сервис для генерации JSDoc.
 * @param {JSDocGeneratorServiceOptions} params.jsDocGeneratorServiceOptions - Опции для сервиса генерации JSDoc.
 * @param {AIServiceOptions} params.aiServiceOptions - Опции для AI-сервиса.
 * @returns {string} - Сгенерированный JSDoc алиас типа.
 */
export const createJSDocTypeAlias: CreateJSDoc<TypeAliasDeclaration> = initJSDocFactory({
    kind: 'TypeAliasDeclaration',
    async getJSDocableCodeSnippet(params) {
        const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } = params;

        return jsDocGeneratorService.createJSDocTypeAlias(
            jsDocGeneratorServiceOptions,
            aiServiceOptions
        );
    }
});
