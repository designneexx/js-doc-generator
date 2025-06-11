import {
    type ApplyJSDocParams,
    type ASTJSDocableNode,
    InsertModeJSDocTypes
} from 'core/types/common';
import { Node, type JSDocStructure, type JSDocTagStructure, type OptionalKind } from 'ts-morph';
import { getJSDocStructure } from './getJSDocStructure';

/**
 * Применяет JSDoc комментарии к узлу AST в соответствии с заданными параметрами.
 * @template CurrentNode - Тип узла AST, который поддерживает JSDoc комментарии.
 * @param {ApplyJSDocParams<CurrentNode>} params - Параметры для применения JSDoc.
 * @returns {Promise<void>} - Промис без возвращаемого значения.
 */
export async function applyJSDoc<CurrentNode extends ASTJSDocableNode = ASTJSDocableNode>(
    params: ApplyJSDocParams<CurrentNode>
): Promise<void> {
    /**
     * Переменная, содержащая различные параметры для обработки
     * @typedef {Object} Params
     * @property {Node} node - Узел AST (Abstract Syntax Tree), с которым будет производиться работа
     * @property {JsDocableNode[]} jsDocableNodes - Массив узлов AST, поддерживающих JSDoc
     * @property {JsDocOptions} jsDocOptions - Опции для обработки JSDoc
     */
    const { node, jsDocableNodes, jsDocOptions } = params;
    /**
     * Опции для JSDoc комментариев
     * @typedef {Object} JSDocOptions
     * @property {boolean} [isShowJSDocDescription=true] - Флаг отображения описания JSDoc
     * @property {boolean} [isShowJSDocTags=true] - Флаг отображения тегов JSDoc
     * @property {string[]} [allowedJSDocTags=[]] - Разрешенные теги JSDoc
     * @property {string[]} [disabledJSDocTags=[]] - Запрещенные теги JSDoc
     * @property {InsertModeJSDocTypes} [mode=InsertModeJSDocTypes.AppendMode] - Режим вставки JSDoc
     * @property {string} [prefixDescription=''] - Префикс для описания JSDoc
     * @property {string} [postfixDescription=''] - Постфикс для описания JSDoc
     */
    const {
        isShowJSDocDescription = true,
        isShowJSDocTags = true,
        allowedJSDocTags = [],
        disabledJSDocTags = [],
        mode = InsertModeJSDocTypes.AppendMode,
        prefixDescription = '',
        postfixDescription = ''
    } = jsDocOptions;
    /**
     * Флаг, указывающий на то, что режим замены активен
     * @type {boolean}
     */
    const isReplaceMode = mode === 'ReplaceMode' || mode === InsertModeJSDocTypes.ReplaceMode;
    /**
     * Массив всех узлов, подлежащих документированию JSDoc.
     * @type {Node[]}
     */
    const allJSDocableNodes = [node, ...node.getDescendants().filter(Node.isJSDocable)];

    /**
     * Фильтрует JSDoc теги в соответствии с настройками.
     * @param {OptionalKind<JSDocTagStructure>} jsDocTagStructure - Структура JSDoc тега.
     * @returns {boolean} - Результат фильтрации тега.
     */
    function filterJSDocTags(jsDocTagStructure: OptionalKind<JSDocTagStructure>): boolean {
        /**
         * Форматирует структуру JSDoc комментария в соответствии с настройками.
         * @param {JSDocStructure[]} acc - Аккумулятор структур JSDoc комментариев.
         * @param {JSDocStructure} jsDocStructure - Структура JSDoc комментария.
         * @returns {JSDocStructure[]} - Отформатированный массив структур JSDoc комментариев.
         */
        /**
         * Имя тега JSDoc.
         * @type {string}
         */
        const { tagName } = jsDocTagStructure;

        if (allowedJSDocTags.length) {
            return allowedJSDocTags.includes(tagName);
        }

        if (disabledJSDocTags.length) {
            return !disabledJSDocTags.includes(tagName);
        }

        return true;
    }

    /**
     * Добавляет JSDoc комментарии к узлу в соответствии с режимом вставки.
     * @template DeepNode - Тип узла AST, который поддерживает JSDoc комментарии.
     * @param {JSDocStructure[]} jsDocsStructure - Структура JSDoc комментариев.
     * @param {DeepNode} deepNode - Узел AST.
     */
    function formatJSDocStructure(acc: JSDocStructure[], jsDocStructure: JSDocStructure) {
        /**
         * Структура данных, скопированная из jsDocStructure
         * @type {object}
         */
        const data = { ...jsDocStructure };
        /**
         * Массив тегов.
         * @type {Array<string>}
         */
        const { tags = [] } = data;

        /**
         * Фильтрует теги JSDoc с помощью заданной функции.
         * @param {JSDocTag} tag - Тег JSDoc для фильтрации.
         * @returns {boolean} - Результат фильтрации тега.
         */
        data.tags = tags.filter(filterJSDocTags);

        if (!isShowJSDocDescription) {
            data.description = '';
        }

        if (!isShowJSDocTags) {
            data.tags = [];
        }

        if (
            (!data.description ||
                (typeof data.description === 'string' && !data.description.trim())) &&
            !data.tags.length
        ) {
            return acc;
        }

        return [...acc, data];
    }

    /**
     * Добавляет JSDoc комментарии к узлу в соответствии с режимом вставки.
     * @template DeepNode - Тип узла AST, который поддерживает JSDoc комментарии.
     * @param {JSDocStructure[]} jsDocsStructure - Структура JSDoc комментариев.
     * @param {DeepNode} deepNode - Узел AST.
     */
    function appendJSDocsWithMode<DeepNode extends ASTJSDocableNode = ASTJSDocableNode>(
        jsDocsStructure: JSDocStructure[],
        deepNode: DeepNode
    ) {
        /**
         * Массив JSDoc комментариев узла.
         * @type {Array<Object>}
         */
        const nodeJSDocs = deepNode.getJsDocs();
        /**
         * Массив отфильтрованных JSDoc комментариев.
         * @type {Array}
         */
        const filteredJSDocs = jsDocsStructure.filter((_, index) => !nodeJSDocs[index]);
        /**
         * Переменная, указывающая на наличие описания в отфильтрованных JSDoc комментариях
         * @type {boolean}
         */
        const isHaveDescription = filteredJSDocs.length > 0;

        if (isReplaceMode && filteredJSDocs.length > 0) {
            nodeJSDocs.at(0)?.remove();
        }

        if (prefixDescription && isHaveDescription) {
            deepNode.addJsDoc({ description: prefixDescription });
        }

        if (isReplaceMode) {
            deepNode.addJsDocs(jsDocsStructure.slice(0, 1));
        } else {
            deepNode.addJsDocs(filteredJSDocs.slice(0, 1));
        }

        if (postfixDescription && isHaveDescription) {
            deepNode.addJsDoc({ description: postfixDescription });
        }
    }

    allJSDocableNodes.forEach((deepNode, index) => {
        /**
         * Узел, поддерживающий JSDoc
         * @type {JsDocableNode}
         */
        const jsDocableNode = jsDocableNodes.at(index);

        if (!jsDocableNode) return;

        /**
         * Переменная, содержащая массив JSDoc комментариев для узла, поддерживающего JSDoc
         * @type {Array<Object>}
         */
        const jsDocsNode = jsDocableNode?.getJsDocs() || [];
        /**
         * Структура JSDoc
         * @typedef {Object} JSDocStructure
         * @property {string} description - Описание JSDoc
         * @property {string[]} tags - Теги JSDoc
         */
        const jsDocStructure = jsDocsNode.map(getJSDocStructure);
        /**
         * Структура JSDoc
         * @typedef {Object} JSDocStructure
         * @property {string} name - Название JSDoc
         * @property {string} description - Описание JSDoc
         */
        const filteredJSDocStructure = jsDocStructure.reduce(formatJSDocStructure, []);

        appendJSDocsWithMode(filteredJSDocStructure, deepNode);
    });
}
