import { formatCodeSettings } from 'core/consts/formatCodeSettings';
import { SerializedSourceFile } from 'core/types/common';
import { SourceFile } from 'ts-morph';

/**
 * Функция для минификации исходного кода файла и возврата сериализованного исходного файла.
 * @param {SourceFile} sourceFile - Исходный файл, который нужно минифицировать.
 * @returns {SerializedSourceFile} - Сериализованный исходный файл с минифицированным кодом и путем к файлу.
 */
export function getMinifySourceCode(sourceFile: SourceFile): SerializedSourceFile {
    /**
     * Форматирует текст исходного файла с использованием настроек форматирования кода
     */
    sourceFile.formatText(formatCodeSettings);

    /**
     * Получаем исходный код из файла
     * @type {string}
     */
    const sourceCode = sourceFile.getText();
    /**
     * Получаем путь к файлу
     * @type {string}
     */
    const filePath = sourceFile.getFilePath();

    return { sourceCode, filePath };
}
