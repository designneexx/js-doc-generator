import { JSDoc, type JSDocStructure } from 'ts-morph';

/**
 * Получает структуру JSDoc комментария
 * @param {JSDoc} jsDoc - JSDoc комментарий
 * @returns {JSDocStructure} - Структура JSDoc комментария
 */
export function getJSDocStructure(jsDoc: JSDoc): JSDocStructure {
    return jsDoc.getStructure();
}
