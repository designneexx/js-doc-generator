import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { createJSDocNodeSetter } from '../helpers/createJSDocNodeSetter';

export const jsDocClassSetter: JSDocNodeSetter<KindDeclarationNames.ClassDeclaration> =
    createJSDocNodeSetter({
        kind: KindDeclarationNames.ClassDeclaration,
        async getJSDocableCodeSnippet(params) {
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions } = params;

            return jsDocGeneratorService.createJSDocClass(jsDocGeneratorServiceOptions);
        }
    });
