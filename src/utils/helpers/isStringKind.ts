import { SyntaxKind } from 'ts-morph';
import { KindVariants } from '../../types/common';

/**
 * Проверяет, является ли переданный аргумент строковым представлением значения перечисления KindVariants
 * @param {KindVariants} kind - Переменная, которую необходимо проверить
 * @returns {boolean} - Результат проверки: true, если kind является строковым представлением значения перечисления KindVariants, иначе false
 */
export function isStringKind(kind: KindVariants): kind is `${SyntaxKind}` {
    return typeof kind === 'string' && !Number.isNaN(Number(kind));
}
