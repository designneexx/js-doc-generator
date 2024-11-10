import { SourceFile } from 'ts-morph';

/**
 * Получает исходный код из файла SourceFile.
 * @param {SourceFile} sourceFile - Файл исходного кода, из которого нужно получить исходный код.
 * @returns {string} - Возвращает исходный код из файла SourceFile.
 */
export function getSourceCodeFromFile(sourceFile: SourceFile) {
    return sourceFile.getText({ includeJsDocComments: false, trimLeadingIndentation: false });
}
