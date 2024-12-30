import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { createJSDocNodeSetter } from '../helpers/createJSDocNodeSetter';

export const jsDocInterfaceSetter: JSDocNodeSetter<KindDeclarationNames.InterfaceDeclaration> =
    createJSDocNodeSetter({
        kind: KindDeclarationNames.InterfaceDeclaration,
        async getJSDocableCodeSnippet(params) {
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions } = params;

            return jsDocGeneratorService.createJSDocInterface(jsDocGeneratorServiceOptions);
        }
    });
