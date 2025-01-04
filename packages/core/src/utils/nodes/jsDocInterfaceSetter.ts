import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { createJSDocNodeSetter } from '../helpers/createJSDocNodeSetter';

/**
 * Setter for JSDoc nodes related to Interface Declarations.
 * @type {JSDocNodeSetter<KindDeclarationNames.InterfaceDeclaration>}
 */
export const jsDocInterfaceSetter: JSDocNodeSetter<KindDeclarationNames.InterfaceDeclaration> =
    createJSDocNodeSetter({
        kind: KindDeclarationNames.InterfaceDeclaration,
        /**
         * Retrieves a code snippet that can be documented with JSDoc.
         * @param {JSDocableCodeSnippetParams} params - Parameters for generating JSDocable code snippet.
         * @returns {string} - JSDocable code snippet for Interface Declaration.
         */
        async getJSDocableCodeSnippet(params) {
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions } = params;

            return jsDocGeneratorService.createJSDocInterface(jsDocGeneratorServiceOptions);
        }
    });
