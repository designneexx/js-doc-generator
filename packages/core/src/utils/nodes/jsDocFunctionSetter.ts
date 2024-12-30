import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { createJSDocNodeSetter } from '../helpers/createJSDocNodeSetter';

export const jsDocFunctionSetter: JSDocNodeSetter<KindDeclarationNames.FunctionDeclaration> =
    createJSDocNodeSetter({
        kind: KindDeclarationNames.FunctionDeclaration,
        async getJSDocableCodeSnippet(params) {
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions } = params;

            return jsDocGeneratorService.createJSDocFunction(jsDocGeneratorServiceOptions);
        }
    });
