import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { createJSDocNodeSetter } from '../helpers/createJSDocNodeSetter';

/**
 * Setter for JSDoc nodes related to ClassDeclaration.
 */
export const jsDocClassSetter: JSDocNodeSetter<KindDeclarationNames.ClassDeclaration> =
    createJSDocNodeSetter({
        kind: KindDeclarationNames.ClassDeclaration,
        /**
         * Retrieves a code snippet that can be documented with JSDoc.
         * @param params - Parameters for generating JSDoc.
         * @param params.jsDocGeneratorService - Service for generating JSDoc.
         * @param params.jsDocGeneratorServiceOptions - Options for JSDoc generation.
         * @returns A code snippet that can be documented with JSDoc.
         */
        async getJSDocableCodeSnippet(params) {
            /**
             * Сервис для генерации JSDoc комментариев
             * @type {Object}
             */
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions } = params;

            return jsDocGeneratorService.createJSDocClass(jsDocGeneratorServiceOptions);
        }
    });
