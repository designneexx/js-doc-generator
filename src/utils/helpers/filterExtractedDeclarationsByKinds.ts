import { type ExtractedDeclarations, KindDeclarationNames } from 'src/types/common';

/**
 * Функция для фильтрации деклараций по указанным видам.
 * @param {ExtractedDeclarations} extractedDeclarations - Массив извлеченных деклараций.
 * @param {`${KindDeclarationNames}`[]} kinds - Массив строк, представляющих виды деклараций.
 * @returns {ExtractedDeclarations} - Отфильтрованный массив деклараций.
 */
export function filterExtractedDeclarationsByKinds(
    extractedDeclarations: ExtractedDeclarations,
    kinds: `${KindDeclarationNames}`[]
): ExtractedDeclarations {
    /**
     * Функция для фильтрации деклараций по указанным видам.
     * @param {ExtractedDeclarations[number]} value - Значение для фильтрации.
     * @returns {boolean} - Результат проверки на соответствие видам.
     */
    function filter(value: ExtractedDeclarations[number]) {
        return kinds.length === 0 || kinds.includes(value.kind);
    }

    return extractedDeclarations.filter(filter);
}
