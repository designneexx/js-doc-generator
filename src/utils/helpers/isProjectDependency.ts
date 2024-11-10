import { SourceFile } from 'ts-morph';

/**
 * Проверяет, является ли файл зависимостью проекта.
 * @param {SourceFile} sourceFile - Исходный файл для проверки
 * @returns {boolean} - Результат проверки: true, если файл не является из внешней библиотеки, иначе false
 */
export function isProjectDependency(sourceFile: SourceFile) {
    return !sourceFile.isFromExternalLibrary();
}
