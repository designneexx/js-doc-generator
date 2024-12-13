import { type KindVariants } from 'core/types/common';
import { SyntaxKind } from 'ts-morph';
import { isMemberKind } from './isMemberKind';
import { isStringKind } from './isStringKind';

/**
 * Возвращает синтаксический вид (SyntaxKind) на основе переданного варианта kind.
 * @param {KindVariants} kind - Вариант kind, для которого нужно получить SyntaxKind.
 * @returns {SyntaxKind} - Синтаксический вид (SyntaxKind) на основе переданного kind.
 */
export function getKind(kind: KindVariants): SyntaxKind {
    if (isMemberKind(kind)) {
        return SyntaxKind[kind];
    }

    if (isStringKind(kind)) {
        return Number(kind);
    }

    return kind;
}
