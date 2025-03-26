import type {
    ASTJSDocableNode,
    CreateJSDocNodeSetterParams,
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

/**
 * Создает функцию-установщик JSDoc для узла AST определенного типа.
 * @template Kind - Тип объявления узла AST.
 * @param {CreateJSDocNodeSetterParams<Kind>} data - Параметры для создания функции-установщика JSDoc.
 * @returns {JSDocNodeSetter<Kind>} - Функция-установщик JSDoc для узла AST.
 */
export function createJSDocNodeSetter<Kind extends KindDeclarationNames>(
    data: CreateJSDocNodeSetterParams<Kind>
): JSDocNodeSetter<Kind> {
    const { kind, getJSDocableCodeSnippet } = data;
    const emptyProject = new Project();
    const cloneNodeAsFile = cloneNodeAsFileFactory(emptyProject);

    return {
        kind,
        setJSDocToNode: async <CurrentNode extends ASTJSDocableNode>(
            params: SetJSDocToNodeParams<CurrentNode>
        ): Promise<string> => {
            const {
                jsDocGeneratorService,
                node,
                jsDocOptions,
                sourceFile,
                isSaveAfterEachIteration
            } = params;

            const clonedSourceFile = cloneNodeAsFile(sourceFile);
            const codeSnippet = node.getText();
            const referencedSourceFiles = sourceFile.getReferencedSourceFiles();
            const referencedMinifiedSourceCode = referencedSourceFiles
                .filter(isProjectDependency)
                .map(cloneNodeAsFile)
                .map(getMinifySourceCode);
            const minifiedSourceFile = getMinifySourceCode(clonedSourceFile);

            const jsDocCodeSnippet = await getJSDocableCodeSnippet({
                jsDocGeneratorService,
                jsDocGeneratorServiceOptions: {
                    codeSnippet,
                    sourceFile: minifiedSourceFile,
                    referencedSourceFiles: referencedMinifiedSourceCode
                }
            });

            const jsDocableNodes = getJSDocableNodesFromCodeSnippet(jsDocCodeSnippet);

            /**
             * Применяет JSDoc к узлу AST.
             * @param {ASTJSDocableNode} node - Узел AST, к которому применяется JSDoc.
             * @param {JSDoc[]} jsDocs - Список JSDoc для применения.
             * @param {JSDocOptions} jsDocOptions - Опции JSDoc.
             */
            applyJSDoc({ node, jsDocableNodes, jsDocOptions });

            if (isSaveAfterEachIteration) {
                await sourceFile.save();
            }

            return jsDocCodeSnippet;
        }
    };
}
