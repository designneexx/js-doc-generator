import { Cache } from 'file-system-cache';
import { KindDeclarationNames } from 'core/types/common';
import { Project, type ProjectOptions } from 'ts-morph';
import { FileCacheManagerMap } from '../FileCacheManagerMap';
import { extractDeclarationsFromSourceFile } from './extractDeclarationsFromSourceFile';
import { filterExtractedDeclarationsByKinds } from './filterExtractedDeclarationsByKinds';
import { flattenDeclarations } from './flattenDeclarations';
import { getCacheFromNodeSourceFile } from './getCacheFromNodeSourceFile';

/**
 * Параметры для сохранения обработанных JSDoc в кэше
 */
interface SaveJSDocProcessedInCacheParams {
    /**
     * Опции проекта
     */
    projectOptions?: ProjectOptions;
    /**
     * Список файлов, в которых нужно сохранить обработанные JSDoc
     */
    files: string[];
    /**
     * Список видов деклараций, которые необходимо сохранить
     */
    kinds: `${KindDeclarationNames}`[];
    /**
     * Кэш, в который нужно сохранить обработанные JSDoc
     */
    cache: Cache;
}

/**
 * Сохраняет обработанные JSDoc в кэше.
 * @param {SaveJSDocProcessedInCacheParams} params - Параметры для сохранения JSDoc в кэше.
 * @param {ProjectOptions} params.projectOptions - Опции проекта.
 * @param {string[]} params.files - Список путей к файлам.
 * @param {string[]} params.kinds - Список типов для фильтрации JSDoc.
 * @param {Map<string, FileCacheManager>} params.fileCacheManagerMap - Карта менеджеров кэша файлов.
 * @param {Cache} params.cache - Кэш для сохранения.
 */
export function saveJSDocProcessedInCache(
    params: SaveJSDocProcessedInCacheParams
): Promise<{ path: string }> {
    const { projectOptions, files, kinds, cache } = params;
    const project = new Project(projectOptions);
    const sourceFiles = project.addSourceFilesAtPaths(files);
    const fileCacheManagerMap = new FileCacheManagerMap();

    sourceFiles.forEach((sourceFile) => {
        /**
         * Извлекает объявления из файла исходного кода.
         * @param {SourceFile} sourceFile - Файл исходного кода.
         * @returns {ExtractedDeclaration[]} - Извлеченные объявления.
         */
        const extractedDeclarations = extractDeclarationsFromSourceFile(sourceFile);
        /**
         * Фильтрует извлеченные объявления по типам.
         * @param {ExtractedDeclaration[]} declarations - Извлеченные объявления.
         * @param {string[]} kinds - Список типов для фильтрации.
         * @returns {ExtractedDeclaration[]} - Отфильтрованные объявления.
         */
        const allowedExtractedDeclarations = filterExtractedDeclarationsByKinds(
            extractedDeclarations,
            kinds
        );

        allowedExtractedDeclarations.flatMap(flattenDeclarations).forEach((node) => {
            /**
             * Получает кэш из узла и файла исходного кода.
             * @param {GetCacheFromNodeSourceFileParams} params - Параметры для получения кэша.
             * @param {Node} params.node - Узел.
             * @param {SourceFile} params.sourceFile - Файл исходного кода.
             * @param {Map<string, FileCacheManager>} params.fileCacheManagerMap - Карта менеджеров кэша файлов.
             * @returns {CacheData} - Данные кэша.
             */
            const data = getCacheFromNodeSourceFile({ node, sourceFile, fileCacheManagerMap });
            const { hashCodeSnippet, hashSourceCode, codeSnippetHashMap } = data;

            codeSnippetHashMap.set(hashCodeSnippet, {
                fileSourceCodeHash: hashSourceCode,
                nodeSourceCodeHash: hashCodeSnippet
            });
            fileCacheManagerMap.set(hashSourceCode, codeSnippetHashMap);
        });
    });

    return fileCacheManagerMap.save(cache);
}
