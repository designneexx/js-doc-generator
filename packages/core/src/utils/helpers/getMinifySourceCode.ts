import { formatCodeSettings } from 'core/consts/formatCodeSettings';
import { SerializedSourceFile } from 'core/types/common';
import { SourceFile } from 'ts-morph';

/**
 * Функция для минификации и получения сериализованного исходного кода файла
 * @param {SourceFile} sourceFile - Исходный файл, который нужно минифицировать
 * @returns {SerializedSourceFile} - Сериализованный исходный код файла
 */
export function getMinifySourceCode(sourceFile: SourceFile): SerializedSourceFile {
    sourceFile.formatText(formatCodeSettings);

    const sourceCode = sourceFile.getText();
    const filePath = sourceFile.getFilePath();

    return { sourceCode, filePath };
}
