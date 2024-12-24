import type {
    AIServiceOptions,
    ASTJSDocableNode,
    InitJSDocFactoryParams,
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
 * Инициализирует фабрику JSDoc.
 * @template CurrentNode - Текущий узел AST, который поддерживает JSDoc.
 * @template Response - Тип возвращаемого значения.
 * @param {InitJSDocFactoryParams<CurrentNode, Response>} factoryParams - Параметры инициализации фабрики JSDoc.
 * @returns {Promise<boolean>} - Промис с результатом применения JSDoc.
 */
export function initJSDocFactory<Kind extends KindDeclarationNames>(
    factoryParams: InitJSDocFactoryParams<Kind>
): JSDocNodeSetter<Kind> {
    const { kind, getJSDocableCodeSnippet } = factoryParams;
    const project = new Project();
    const cloneNodeAsFile = cloneNodeAsFileFactory(project);

    return {
        kind,
        /**
         * Устанавливает JSDoc для узла AST.
         * @template CurrentNode - Текущий узел AST.
         * @template CurrentAIServiceOptions - Опции сервиса AI.
         * @param {SetJSDocToNodeParams<CurrentNode, CurrentAIServiceOptions>} params - Параметры установки JSDoc.
         * @returns {Promise<void>} - Промис, завершающийся после установки JSDoc.
         */
        async setJSDocToNode<
            CurrentNode extends ASTJSDocableNode,
            CurrentAIServiceOptions extends AIServiceOptions
        >(params: SetJSDocToNodeParams<CurrentNode, CurrentAIServiceOptions>): Promise<void> {
            const { jsDocGeneratorService, node, jsDocOptions, sourceFile, aiServiceOptions } =
                params;

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
                },
                aiServiceOptions
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
