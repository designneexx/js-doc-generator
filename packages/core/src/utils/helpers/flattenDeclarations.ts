import type { ExtractedDeclarations, TupleToUnionArray } from 'core/types/common';

/**
 * Функция для выравнивания объявлений.
 * @param value - Значение для выравнивания.
 * @returns Массив узлов объявлений в виде объединенного кортежа.
 */
export function flattenDeclarations(
    value: ExtractedDeclarations[number]
): TupleToUnionArray<ExtractedDeclarations[number]['nodes']> {
    return value.nodes;
}
