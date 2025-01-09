import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { createJSDocNodeSetter } from '../helpers/createJSDocNodeSetter';

/**
 * JSDocNodeSetter for FunctionDeclaration.
 */
export const jsDocFunctionSetter: JSDocNodeSetter<KindDeclarationNames.FunctionDeclaration> =
    createJSDocNodeSetter({
        kind: KindDeclarationNames.FunctionDeclaration,
        /**
         * Retrieves the JSDocable code snippet for a FunctionDeclaration.
         * @param {JSDocNodeSetterParams} params - Parameters for generating JSDoc.
         * @param {JSDocGeneratorService} params.jsDocGeneratorService - JSDoc generator service.
         * @param {JSDocGeneratorServiceOptions} params.jsDocGeneratorServiceOptions - Options for JSDoc generation.
         * @returns {string} - The JSDocable code snippet for the FunctionDeclaration.
         */
        async getJSDocableCodeSnippet(params) {
            /**
             * Destructuring parameters for easier access.
             * @type {JSDocNodeSetterParams}
             */
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions } = params;

            return jsDocGeneratorService.createJSDocFunction(jsDocGeneratorServiceOptions);
        }
    });
