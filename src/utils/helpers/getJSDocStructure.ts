import { JSDoc } from 'ts-morph';

/**
 * Получает структуру JSDoc комментария
 * @param {JSDoc} jsDoc - JSDoc комментарий
 * @returns {JSDocStructure} - Структура JSDoc комментария
 */
export function getJSDocStructure(jsDoc: JSDoc) {
    return jsDoc.getStructure();
}
