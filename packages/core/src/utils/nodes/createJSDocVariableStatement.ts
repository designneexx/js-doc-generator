import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { initJSDocFactory } from '../helpers/initJSDocFactory';

/**
 * Фабричная функция для создания переменной с JSDoc комментариями.
 *
 * @param {InitJSDocFactoryParams} initParams - Параметры инициализации фабричной функции.
 * @returns {JSDocVariableStatement} Возвращает переменную с JSDoc комментариями.
 */
export const JSDocVariableStatementSetter: JSDocNodeSetter<KindDeclarationNames.VariableStatement> =
    initJSDocFactory({
        kind: KindDeclarationNames.VariableStatement,
        /**
         * Асинхронная функция для получения фрагмента кода с JSDoc комментариями.
         *
         * @param {CreateJSDocVariableStatementParams} params - Параметры, необходимые для генерации JSDoc комментариев.
         * @returns {Promise<string>} Возвращает промис, который разрешается в строку с фрагментом кода, содержащим JSDoc комментарии.
         */
        async getJSDocableCodeSnippet(params) {
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } =
                params;

            return jsDocGeneratorService.createJSDocVariableStatement(
                jsDocGeneratorServiceOptions,
                aiServiceOptions
            );
        }
    });
