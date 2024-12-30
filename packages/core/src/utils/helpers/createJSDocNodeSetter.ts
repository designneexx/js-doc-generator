import type {
    ASTJSDocableNode,
    createJSDocNodeSetterParams,
    JSDocNodeSetter,
    KindDeclarationNames,
    SetJSDocToNodeParams
} from 'core/types/common';
import { Project } from 'ts-morph';
import { applyJSDoc } from './applyJSDoc';
import { cloneNodeAsFileFactory } from './cloneNodeAsFileFactory';
import { getJSDocableNodesFromCodeSnippet } from './getJSDocableNodesFromCodeSnippet';
import { getMinifySourceCode } from './getMinifySourceCode';
import { isProjectDependency } from './isProjectDependency';

export function createJSDocNodeSetter<Kind extends KindDeclarationNames>(
    data: createJSDocNodeSetterParams<Kind>
): JSDocNodeSetter<Kind> {
    const { kind, getJSDocableCodeSnippet } = data;
    const project = new Project();
    const cloneNodeAsFile = cloneNodeAsFileFactory(project);

    return {
        kind,
        setJSDocToNode: async <CurrentNode extends ASTJSDocableNode>(
            params: SetJSDocToNodeParams<CurrentNode>
        ): Promise<void> => {
            const { jsDocGeneratorService, node, jsDocOptions, sourceFile } = params;

            const clonedSourceFile = cloneNodeAsFile(sourceFile);
            const codeSnippet = node.getText();
            const referencedSourceFiles = sourceFile.getReferencedSourceFiles();
            const referencedMinifiedSourceCode = referencedSourceFiles
                .filter(isProjectDependency)
                .map(cloneNodeAsFile)
                .map(getMinifySourceCode);
            const minifiedSourceFile = getMinifySourceCode(clonedSourceFile);

            const jsDocableCodeSnippet = await getJSDocableCodeSnippet({
                jsDocGeneratorService,
                jsDocGeneratorServiceOptions: {
                    codeSnippet,
                    sourceFile: minifiedSourceFile,
                    referencedSourceFiles: referencedMinifiedSourceCode
                }
            });

            const jsDocs = getJSDocableNodesFromCodeSnippet(jsDocableCodeSnippet);

            /**
             * Применяет JSDoc к узлу AST.
             * @param {ASTJSDocableNode} node - Узел AST, к которому применяется JSDoc.
             * @param {JSDoc[]} jsDocs - Список JSDoc для применения.
             * @param {JSDocOptions} jsDocOptions - Опции JSDoc.
             */
            applyJSDoc({ node, jsDocs, jsDocOptions });
        }
    };
}
