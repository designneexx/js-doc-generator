import { JSDoc, type JSDocStructure } from 'ts-morph';

/**
 * Получает структуру JSDoc
 * @param {JSDoc} jsDoc - JSDoc для извлечения структуры
 * @returns {JSDocStructure} - Структура JSDoc
 */
export function getJSDocStructure(jsDoc: JSDoc): JSDocStructure {
    return jsDoc.getStructure();
}
