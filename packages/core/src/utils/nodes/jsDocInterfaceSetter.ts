import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { initJSDocFactory } from '../helpers/initJSDocFactory';

/**
 * Функция для создания JSDoc интерфейса.
 * @param {Object} params - Параметры для создания JSDoc интерфейса.
 * @param {Object} params.jsDocGeneratorService - Сервис для генерации JSDoc.
 * @param {Object} params.jsDocGeneratorServiceOptions - Опции для сервиса генерации JSDoc.
 * @param {Object} params.aiServiceOptions - Опции для AI сервиса.
 * @returns {string} - Сгенерированный JSDoc интерфейс.
 */
export const jsDocInterfaceSetter: JSDocNodeSetter<KindDeclarationNames.InterfaceDeclaration> =
    initJSDocFactory({
        kind: KindDeclarationNames.InterfaceDeclaration,
        /**
         * Retrieves JSDoc-able code snippet for InterfaceDeclaration kind.
         * @param {JSDocableCodeSnippetParams} params - Parameters for generating JSDoc.
         * @param {JSDocGeneratorService} params.jsDocGeneratorService - JSDoc generator service.
         * @param {JSDocGeneratorServiceOptions} params.jsDocGeneratorServiceOptions - Options for JSDoc generator service.
         * @param {AIServiceOptions} params.aiServiceOptions - Options for AI service.
         * @returns {string} - JSDoc-able code snippet for InterfaceDeclaration kind.
         */
        async getJSDocableCodeSnippet(params) {
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } =
                params;

            return jsDocGeneratorService.createJSDocInterface(
                jsDocGeneratorServiceOptions,
                aiServiceOptions
            );
        }
    });
