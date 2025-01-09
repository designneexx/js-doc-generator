import { type ASTJSDocableNode } from 'core/types/common';
import { Node, SyntaxKind, ts } from 'ts-morph';

/**
 * Функция, возвращающая функцию для получения всех JSDocable узлов из узлов AST.
 *
 * @param {WeakMap<ASTJSDocableNode, number>} [depthNodeWeakMap] - Слабая карта для хранения глубины узлов AST.
 * @returns {(node: CurrentNode) => ASTJSDocableNode[]} - Функция для получения всех JSDocable узлов из узлов AST.
 */
export function getAllJSDocableNodesFlatFactory(
    depthNodeWeakMap?: WeakMap<ASTJSDocableNode, number>
): <CurrentNode extends Node<ts.Node>>(node: CurrentNode) => ASTJSDocableNode[] {
    return <CurrentNode extends Node<ts.Node>>(node: CurrentNode): ASTJSDocableNode[] => {
        /**
         * Получение всех дочерних узлов текущего узла AST.
         */
        const children = node.getChildren();

        /**
         * Функция для рекурсивного получения JSDocable узлов из узлов AST.
         *
         * @param {number} depth - Глубина текущего узла AST.
         * @returns {(acc: ASTJSDocableNode[], deepNode: DeepNode) => ASTJSDocableNode[]} - Функция, обрабатывающая узлы AST и возвращающая массив JSDocable узлов.
         */
        function deepGetJSDocable(depth: number) {
            return <DeepNode extends Node<ts.Node>>(
                acc: ASTJSDocableNode[],
                deepNode: DeepNode
            ): ASTJSDocableNode[] => {
                /**
                 * Получение всех дочерних узлов текущего узла AST.
                 */
                const deepChildren = deepNode.getChildren();
                /**
                 * Получение всех JSDocable узлов из дочерних узлов.
                 */
                const deepJSDocableNodes = getJSDocables(
                    Node.isJSDocable(deepNode) &&
                        [
                            SyntaxKind.SingleLineCommentTrivia,
                            SyntaxKind.MultiLineCommentTrivia
                        ].every((kind) => !deepNode.isKind(kind))
                        ? depth + 1
                        : depth,
                    deepChildren
                );

                if (
                    Node.isJSDocable(deepNode) &&
                    [SyntaxKind.SingleLineCommentTrivia, SyntaxKind.MultiLineCommentTrivia].every(
                        (kind) => !deepNode.isKind(kind)
                    )
                ) {
                    depthNodeWeakMap?.set(deepNode, depth);
                    return [...acc, deepNode, ...deepJSDocableNodes];
                }

                return [...acc, ...deepJSDocableNodes];
            };
        }

        /**
         * Получение всех JSDocable узлов из массива узлов AST.
         *
         * @param {number} depth - Глубина текущего узла AST.
         * @param {Node<ts.Node>[]} nodes - Массив узлов AST.
         * @returns {ASTJSDocableNode[]} - Массив JSDocable узлов.
         */
        function getJSDocables(depth: number, nodes: Node<ts.Node>[]): ASTJSDocableNode[] {
            return nodes.reduce(deepGetJSDocable(depth), [] as ASTJSDocableNode[]);
        }

        /**
         * Получение всех JSDocable узлов из дочерних узлов.
         */
        const jsDocableNodes = getJSDocables(1, children);
        let allJSDocableNodes = jsDocableNodes;

        if (
            Node.isJSDocable(node) &&
            [SyntaxKind.SingleLineCommentTrivia, SyntaxKind.MultiLineCommentTrivia].every(
                (kind) => !node.isKind(kind)
            )
        ) {
            depthNodeWeakMap?.set(node, 0);

            allJSDocableNodes = [node, ...jsDocableNodes];
        }

        return allJSDocableNodes;
    };
}
