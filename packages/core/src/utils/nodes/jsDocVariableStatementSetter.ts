import { JSDocNodeSetter, KindDeclarationNames } from 'core/types/common';
import { createJSDocNodeSetter } from '../helpers/createJSDocNodeSetter';

export const jsDocVariableStatementSetter: JSDocNodeSetter<KindDeclarationNames.VariableStatement> =
    createJSDocNodeSetter({
        kind: KindDeclarationNames.VariableStatement,
        async getJSDocableCodeSnippet(params) {
            const { jsDocGeneratorService, jsDocGeneratorServiceOptions } = params;

            return jsDocGeneratorService.createJSDocVariableStatement(jsDocGeneratorServiceOptions);
        }
    });
