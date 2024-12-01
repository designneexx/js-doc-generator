import { type KindVariants } from 'src/types/common';
import { SyntaxKind } from 'ts-morph';

/**
 * Проверяет, является ли переданный аргумент строкой и не является ли он числом
 * @param {KindVariants} kind - Переданный аргумент для проверки
 * @returns {kind is keyof typeof SyntaxKind} Результат проверки
 */
export function isMemberKind(kind: KindVariants): kind is keyof typeof SyntaxKind {
    return typeof kind === 'string' && Number.isNaN(Number(kind));
}
