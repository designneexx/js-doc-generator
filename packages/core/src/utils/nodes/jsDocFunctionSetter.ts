import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { createJSDocNodeSetter } from '../helpers/createJSDocNodeSetter';

/**
 * Setter for JSDoc nodes of FunctionDeclaration kind.
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
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions } = params;

            return jsDocGeneratorService.createJSDocFunction(jsDocGeneratorServiceOptions);
        }
    });
