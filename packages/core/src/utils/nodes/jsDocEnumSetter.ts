import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { initJSDocFactory } from '../helpers/initJSDocFactory';

/**
 * Функция для создания JSDoc для перечисления.
 * @param {Object} params - Параметры для генерации JSDoc.
 * @param {Object} params.jsDocGeneratorService - Сервис для генерации JSDoc.
 * @param {Object} params.jsDocGeneratorServiceOptions - Опции для сервиса генерации JSDoc.
 * @param {Object} params.aiServiceOptions - Опции для сервиса искусственного интеллекта.
 * @returns {string} - Сгенерированный JSDoc для перечисления.
 */
export const jsDocEnumSetter: JSDocNodeSetter<KindDeclarationNames.EnumDeclaration> =
    initJSDocFactory({
        kind: KindDeclarationNames.EnumDeclaration,
        /**
         * Асинхронный метод для получения фрагмента кода, подлежащего JSDoc.
         * @param {JSDocableCodeSnippetParams} params - Параметры для генерации JSDoc.
         * @returns {string} - Сгенерированный JSDoc для EnumDeclaration.
         */
        async getJSDocableCodeSnippet(params) {
            /**
             * Деструктуризация параметров.
             */
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } =
                params;

            return jsDocGeneratorService.createJSDocEnum(
                jsDocGeneratorServiceOptions,
                aiServiceOptions
            );
        }
    });
