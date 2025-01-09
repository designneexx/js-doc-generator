import { JSDoc } from 'ts-morph';

/**
 * Удаляет JSDoc комментарий из узла.
 * @param {JSDoc} node - Узел, содержащий JSDoc комментарий.
 * @returns {void}
 */
export function removeJSDoc(node: JSDoc): void {
    return node.remove();
}
