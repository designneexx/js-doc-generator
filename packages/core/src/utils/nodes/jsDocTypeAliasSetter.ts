import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { createJSDocNodeSetter } from '../helpers/createJSDocNodeSetter';

export const jsDocTypeAliasSetter: JSDocNodeSetter<KindDeclarationNames.TypeAliasDeclaration> =
    createJSDocNodeSetter({
        kind: KindDeclarationNames.TypeAliasDeclaration,
        async getJSDocableCodeSnippet(params) {
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions } = params;

            return jsDocGeneratorService.createJSDocTypeAlias(jsDocGeneratorServiceOptions);
        }
    });
