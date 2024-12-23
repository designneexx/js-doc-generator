import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { initJSDocFactory } from '../helpers/initJSDocFactory';

/**
 * Функция для создания JSDoc для FunctionDeclaration.
 * @param {Object} params - Параметры для генерации JSDoc.
 * @param {JSDocGeneratorService} params.jsDocGeneratorService - Сервис для генерации JSDoc.
 * @param {JSDocGeneratorServiceOptions} params.jsDocGeneratorServiceOptions - Опции для генерации JSDoc.
 * @param {AIServiceOptions} params.aiServiceOptions - Опции для AI-сервиса.
 * @returns {string} - Сгенерированный JSDoc для FunctionDeclaration.
 */
export const jsDocFunctionSetter: JSDocNodeSetter<KindDeclarationNames.FunctionDeclaration> =
    initJSDocFactory({
        kind: KindDeclarationNames.FunctionDeclaration,
        /**
         * Асинхронная функция для получения фрагмента кода, подлежащего JSDoc.
         * @param {JSDocableCodeSnippetParams} params - Параметры для генерации JSDoc.
         * @returns {string} - Сгенерированный JSDoc для FunctionDeclaration.
         */
        async getJSDocableCodeSnippet(params) {
            /**
             * Деструктуризация параметров: jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions.
             */
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } =
                params;

            return jsDocGeneratorService.createJSDocFunction(
                jsDocGeneratorServiceOptions,
                aiServiceOptions
            );
        }
    });
