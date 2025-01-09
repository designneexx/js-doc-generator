import { type ASTJSDocableNode } from 'core/types/common';
import { Project } from 'ts-morph';
import { v4 } from 'uuid';
import { getAllJSDocableNodesFlatFactory } from './getAllJSDocableNodesFlatFactory';

/**
 * Получает все узлы с JSDoc из фрагмента кода.
 *
 * @param codeSnippet - Фрагмент кода, из которого необходимо получить узлы с JSDoc.
 * @returns Массив узлов с JSDoc.
 */
export function getJSDocableNodesFromCodeSnippet(codeSnippet: string): ASTJSDocableNode[] {
    const project = new Project();
    const sourceFile = project.createSourceFile(`${v4()}.tsx`, codeSnippet);
    const children = sourceFile.getChildren();

    return children.flatMap(getAllJSDocableNodesFlatFactory());
}
