import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { initJSDocFactory } from '../helpers/initJSDocFactory';

/**
 * Функция для создания JSDoc алиаса типа.
 * @param {Object} params - Параметры для генерации JSDoc.
 * @param {JSDocGeneratorService} params.jsDocGeneratorService - Сервис для генерации JSDoc.
 * @param {JSDocGeneratorServiceOptions} params.jsDocGeneratorServiceOptions - Опции для сервиса генерации JSDoc.
 * @param {AIServiceOptions} params.aiServiceOptions - Опции для AI-сервиса.
 * @returns {string} - Сгенерированный JSDoc алиас типа.
 */
export const jsDocTypeAliasSetter: JSDocNodeSetter<KindDeclarationNames.TypeAliasDeclaration> =
    initJSDocFactory({
        kind: KindDeclarationNames.TypeAliasDeclaration,
        /**
         * Retrieves the JSDocable code snippet for TypeAliasDeclaration nodes.
         * @param {JSDocNodeSetterParams} params - Parameters for retrieving JSDocable code snippet.
         * @param {JSDocGeneratorService} params.jsDocGeneratorService - JSDoc generator service.
         * @param {JSDocGeneratorServiceOptions} params.jsDocGeneratorServiceOptions - Options for JSDoc generator service.
         * @param {AiServiceOptions} params.aiServiceOptions - Options for AI service.
         * @returns {string} - JSDoc for TypeAliasDeclaration node.
         */
        async getJSDocableCodeSnippet(params) {
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } =
                params;

            return jsDocGeneratorService.createJSDocTypeAlias(
                jsDocGeneratorServiceOptions,
                aiServiceOptions
            );
        }
    });
