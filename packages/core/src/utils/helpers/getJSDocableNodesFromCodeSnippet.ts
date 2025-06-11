import { type ASTJSDocableNode } from 'core/types/common';
import { Node, Project } from 'ts-morph';
import { v4 } from 'uuid';

/**
 * Получает все узлы с JSDoc из фрагмента кода.
 *
 * @param codeSnippet - Фрагмент кода, из которого необходимо получить узлы с JSDoc.
 * @returns Массив узлов с JSDoc.
 */
export function getJSDocableNodesFromCodeSnippet(codeSnippet: string): ASTJSDocableNode[] {
    /**
     * Represents a project.
     * @constructor
     */
    const project = new Project();
    /**
     * Новый исходный файл, созданный в проекте.
     * @type {SourceFile}
     */
    const sourceFile = project.createSourceFile(`${v4()}.tsx`, codeSnippet);

    /**
     * All nodes in the abstract syntax tree of the source file, including the source file itself.
     * @type {Node[]}
     */
    const nodes = sourceFile.getDescendants();

    return nodes.filter(Node.isJSDocable);
}
