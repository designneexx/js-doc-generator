import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { createJSDocNodeSetter } from '../helpers/createJSDocNodeSetter';

/**
 * Setter for JSDoc nodes of TypeAliasDeclaration kind.
 */
export const jsDocTypeAliasSetter: JSDocNodeSetter<KindDeclarationNames.TypeAliasDeclaration> =
    createJSDocNodeSetter({
        kind: KindDeclarationNames.TypeAliasDeclaration,
        /**
         * Retrieves the code snippet that can be documented with JSDoc.
         * @param {JSDocableCodeSnippetParams} params - Parameters for generating JSDoc.
         * @param {JSDocGeneratorService} params.jsDocGeneratorService - JSDoc generator service.
         * @param {JSDocGeneratorServiceOptions} params.jsDocGeneratorServiceOptions - Options for JSDoc generation.
         * @returns {string} - Code snippet with JSDoc for TypeAliasDeclaration.
         */
        async getJSDocableCodeSnippet(params) {
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions } = params;

            return jsDocGeneratorService.createJSDocTypeAlias(jsDocGeneratorServiceOptions);
        }
    });
