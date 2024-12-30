import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { createJSDocNodeSetter } from '../helpers/createJSDocNodeSetter';

export const jsDocEnumSetter: JSDocNodeSetter<KindDeclarationNames.EnumDeclaration> =
    createJSDocNodeSetter({
        kind: KindDeclarationNames.EnumDeclaration,
        async getJSDocableCodeSnippet(params) {
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions } = params;

            return jsDocGeneratorService.createJSDocEnum(jsDocGeneratorServiceOptions);
        }
    });
