import { type KindVariants } from 'src/types/common';
import { SyntaxKind } from 'ts-morph';

/**
 * Проверяет, является ли переданный аргумент строковым представлением значения перечисления KindVariants
 * @param {KindVariants} kind - Переменная, которую необходимо проверить
 * @returns {boolean} - Результат проверки: true, если kind является строковым представлением значения перечисления KindVariants, иначе false
 */
export function isStringKind(kind: KindVariants): kind is `${SyntaxKind}` {
    return typeof kind === 'string' && !Number.isNaN(Number(kind));
}
