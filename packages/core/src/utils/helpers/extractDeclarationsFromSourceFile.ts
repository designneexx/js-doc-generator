import { type ExtractedDeclarations, KindDeclarationNames } from 'core/types/common';
import { SourceFile } from 'ts-morph';

/**
 * Извлекает объявления из файла и возвращает их в виде объекта ExtractedDeclarations.
 * @param {SourceFile} sourceFile - Исходный файл, из которого нужно извлечь объявления.
 * @returns {ExtractedDeclarations} - Извлеченные объявления в виде объекта ExtractedDeclarations.
 */
export function extractDeclarationsFromSourceFile(sourceFile: SourceFile): ExtractedDeclarations {
    const functions = sourceFile.getFunctions();
    const variableStatements = sourceFile.getVariableStatements();
    const enums = sourceFile.getEnums();
    const typeAliases = sourceFile.getTypeAliases();
    const interfaces = sourceFile.getInterfaces();
    const classes = sourceFile.getClasses();
    const extractedDeclarations: ExtractedDeclarations = [
        {
            kind: KindDeclarationNames.InterfaceDeclaration,
            nodes: interfaces
        },
        {
            kind: KindDeclarationNames.FunctionDeclaration,
            nodes: functions
        },
        {
            kind: KindDeclarationNames.EnumDeclaration,
            nodes: enums
        },
        {
            kind: KindDeclarationNames.TypeAliasDeclaration,
            nodes: typeAliases
        },
        {
            kind: KindDeclarationNames.VariableStatement,
            nodes: variableStatements
        },
        {
            kind: KindDeclarationNames.ClassDeclaration,
            nodes: classes
        }
    ];

    return extractedDeclarations;
}
