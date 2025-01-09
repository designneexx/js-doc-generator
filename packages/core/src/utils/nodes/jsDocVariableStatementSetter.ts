import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { createJSDocNodeSetter } from '../helpers/createJSDocNodeSetter';

/**
 * Переменная jsDocVariableStatementSetter представляет собой объект, который содержит методы для установки JSDoc к утверждению переменной.
 */
export const jsDocVariableStatementSetter: JSDocNodeSetter<KindDeclarationNames.VariableStatement> =
    createJSDocNodeSetter({
        kind: KindDeclarationNames.VariableStatement,
        /**
         * Получает фрагмент кода, к которому можно добавить JSDoc.
         * @param {JSDocableCodeSnippetParams} params - Параметры для генерации JSDoc.
         * @returns {string} - Сгенерированный фрагмент кода с JSDoc.
         */
        async getJSDocableCodeSnippet(params) {
            /**
             * Параметры для генерации JSDoc.
             * @typedef {Object} JSDocableCodeSnippetParams
             * @property {JSDocGeneratorService} jsDocGeneratorService - Сервис для генерации JSDoc.
             * @property {JSDocGeneratorServiceOptions} jsDocGeneratorServiceOptions - Опции для генерации JSDoc.
             */
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions } = params;

            return jsDocGeneratorService.createJSDocVariableStatement(jsDocGeneratorServiceOptions);
        }
    });
