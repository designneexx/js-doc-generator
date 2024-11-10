import { ASTJSDocableNode } from 'src/types/common';
import { Project } from 'ts-morph';
import { v4 } from 'uuid';
import { getAllJSDocableNodesFlatFactory } from './getAllJSDocableNodesFlatFactory';

/**
 * Получает все узлы с JSDoc из фрагмента кода.
 *
 * @param {string} codeSnippet - Фрагмент кода для анализа.
 * @returns {ASTJSDocableNode[]} - Массив узлов с JSDoc.
 */
export function getJSDocableNodesFromCodeSnippet(codeSnippet: string): ASTJSDocableNode[] {
    const project = new Project();
    const sourceFile = project.createSourceFile(`${v4()}.tsx`, codeSnippet);
    const children = sourceFile.getChildren();

    return children.flatMap(getAllJSDocableNodesFlatFactory());
}
