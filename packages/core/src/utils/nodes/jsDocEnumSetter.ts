import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { createJSDocNodeSetter } from '../helpers/createJSDocNodeSetter';

/**
 * Setter for JSDoc related to EnumDeclaration nodes.
 */
export const jsDocEnumSetter: JSDocNodeSetter<KindDeclarationNames.EnumDeclaration> =
    createJSDocNodeSetter({
        kind: KindDeclarationNames.EnumDeclaration,
        /**
         * Asynchronously retrieves the JSDocable code snippet for EnumDeclaration nodes.
         * @param params - Parameters needed to generate the JSDoc.
         * @param params.jsDocGeneratorService - The service responsible for generating JSDoc.
         * @param params.jsDocGeneratorServiceOptions - Options for JSDoc generation.
         * @returns The JSDoc snippet for EnumDeclaration nodes.
         */
        async getJSDocableCodeSnippet(params) {
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions } = params;

            return jsDocGeneratorService.createJSDocEnum(jsDocGeneratorServiceOptions);
        }
    });
