import type {
    ASTJSDocableNode,
    CreateJSDocNodeSetterParams,
    JSDocNodeSetter,
    KindDeclarationNames,
    SetJSDocToNodeParams
} from 'core/types/common';
import { Project } from 'ts-morph';
import { applyJSDoc } from './applyJSDoc';
import { cloneNodeAsFileFactory } from './cloneNodeAsFileFactory';
import { getJSDocableNodesFromCodeSnippet } from './getJSDocableNodesFromCodeSnippet';
import { getMinifySourceCode } from './getMinifySourceCode';
import { isProjectDependency } from './isProjectDependency';

/**
 * Создает функцию-установщик JSDoc для узла AST определенного типа.
 * @template Kind - Тип объявления узла AST.
 * @param {CreateJSDocNodeSetterParams<Kind>} data - Параметры для создания функции-установщика JSDoc.
 * @returns {JSDocNodeSetter<Kind>} - Функция-установщик JSDoc для узла AST.
 */
export function createJSDocNodeSetter<Kind extends KindDeclarationNames>(
    data: CreateJSDocNodeSetterParams<Kind>
): JSDocNodeSetter<Kind> {
    /**
     * Данные, из которых извлекаются свойства kind и getJSDocableCodeSnippet.
     * @typedef {Object} Data
     * @property {string} kind - Тип данных
     * @property {Function} getJSDocableCodeSnippet - Функция для извлечения JSDoc-комментариев
     */
    const { kind, getJSDocableCodeSnippet } = data;
    /**
     * Пустой проект
     * @type {Project}
     */
    const emptyProject = new Project();
    /**
     * Функция для клонирования узла в виде файла.
     * @param node Узел, который необходимо клонировать.
     * @returns Файл, созданный на основе клонированного узла.
     */
    const cloneNodeAsFile = cloneNodeAsFileFactory(emptyProject);

    return {
        kind,
        setJSDocToNode: async <CurrentNode extends ASTJSDocableNode>(
            params: SetJSDocToNodeParams<CurrentNode>
        ): Promise<void> => {
            /**
             * Объект, содержащий параметры для генерации JSDoc
             * @typedef {Object} JsDocParams
             * @property {JsDocGeneratorService} jsDocGeneratorService - Сервис для генерации JSDoc
             * @property {Node} node - Узел AST (Abstract Syntax Tree)
             * @property {JsDocOptions} jsDocOptions - Опции для генерации JSDoc
             * @property {SourceFile} sourceFile - Исходный файл
             */
            const { jsDocGeneratorService, node, jsDocOptions, sourceFile } = params;

            /**
             * Клонирует узел и возвращает его в виде файла.
             * @param node Узел, который необходимо клонировать в виде файла
             * @returns Клон узла в виде файла
             */
            const clonedSourceFile = cloneNodeAsFile(sourceFile);
            /**
             * Содержит текстовое представление узла.
             * @type {string}
             */
            const codeSnippet = node.getText();
            /**
             * Массив файлов, на которые ссылается данный исходный файл.
             * @type {Array<import("typescript").SourceFile>}
             */
            const referencedSourceFiles = sourceFile.getReferencedSourceFiles();
            /**
             * Минифицированный исходный код, полученный из исходных файлов, отфильтрованных как зависимости проекта.
             * @type {string[]}
             */
            const referencedMinifiedSourceCode = referencedSourceFiles
                .filter(isProjectDependency)
                .map(cloneNodeAsFile)
                .map(getMinifySourceCode);
            /**
             * Минифицированный исходный файл.
             * @type {string}
             */
            const minifiedSourceFile = getMinifySourceCode(clonedSourceFile);

            /**
             * Ожидаемый код JSDoc, который будет сгенерирован на основе указанного фрагмента кода.
             * @typedef {Object} JSDocableCodeSnippet
             * @property {JSDocGeneratorService} jsDocGeneratorService - Сервис для генерации JSDoc.
             * @property {Object} jsDocGeneratorServiceOptions - Опции для сервиса генерации JSDoc.
             * @property {string} jsDocGeneratorServiceOptions.codeSnippet - Фрагмент исходного кода для генерации JSDoc.
             * @property {SourceFile} jsDocGeneratorServiceOptions.sourceFile - Минифицированный исходный файл.
             * @property {Array<SourceFile>} jsDocGeneratorServiceOptions.referencedSourceFiles - Список ссылочных минифицированных исходных файлов.
             */
            const jsDocCodeSnippet = await getJSDocableCodeSnippet({
                jsDocGeneratorService,
                jsDocGeneratorServiceOptions: {
                    codeSnippet,
                    sourceFile: minifiedSourceFile,
                    referencedSourceFiles: referencedMinifiedSourceCode
                }
            });

            if (typeof jsDocCodeSnippet !== 'string') {
                throw new Error(`Полученный ответ от сервиса не является строкой`);
            }

            /**
             * Массив узлов, к которым можно добавить JSDoc комментарии
             * @type {Node[]}
             */
            const jsDocableNodes = getJSDocableNodesFromCodeSnippet(jsDocCodeSnippet);

            /**
             * Применяет JSDoc к узлу AST.
             * @param {ASTJSDocableNode} node - Узел AST, к которому применяется JSDoc.
             * @param {JSDoc[]} jsDocs - Список JSDoc для применения.
             * @param {JSDocOptions} jsDocOptions - Опции JSDoc.
             */
            applyJSDoc({ node, jsDocableNodes, jsDocOptions });

            await sourceFile.save();
        }
    };
}
