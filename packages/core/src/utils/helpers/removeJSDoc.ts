import { JSDoc } from 'ts-morph';

/**
 * Удаляет JSDoc комментарий из узла.
 * @param {JSDoc} node - Узел JSDoc комментария для удаления.
 * @returns {void}
 */
export function removeJSDoc(node: JSDoc): void {
    return node.remove();
}
