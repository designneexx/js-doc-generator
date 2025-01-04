import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { createJSDocNodeSetter } from '../helpers/createJSDocNodeSetter';

/**
 * Переменная jsDocVariableStatementSetter представляет собой функцию, которая устанавливает JSDoc для утверждения переменной.
 * @type {JSDocNodeSetter<KindDeclarationNames.VariableStatement>}
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
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions } = params;

            return jsDocGeneratorService.createJSDocVariableStatement(jsDocGeneratorServiceOptions);
        }
    });
