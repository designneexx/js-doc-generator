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
    const { node, jsDocableNodes, jsDocOptions } = params;
    const {
        isShowJSDocDescription = true,
        isShowJSDocTags = true,
        allowedJSDocTags = [],
        disabledJSDocTags = [],
        mode = InsertModeJSDocTypes.AppendMode,
        prefixDescription = '',
        postfixDescription = ''
    } = jsDocOptions;
    const isReplaceMode = mode === 'ReplaceMode' || mode === InsertModeJSDocTypes.ReplaceMode;
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
        const data = { ...jsDocStructure };
        const { tags = [] } = data;

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
        const nodeJSDocs = deepNode.getJsDocs();
        const filteredJSDocs = jsDocsStructure.filter((_, index) => !nodeJSDocs[index]);
        const isHaveDescription =
            filteredJSDocs.length > 0 &&
            filteredJSDocs.some(
                (item) =>
                    item.description ||
                    (typeof item.description === 'string' && item.description.trim())
            );

        if (isReplaceMode) {
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
        const jsDocableNode = jsDocableNodes.at(index);

        if (!jsDocableNode) return;

        const jsDocsNode = jsDocableNode?.getJsDocs() || [];
        const jsDocStructure = jsDocsNode.map(getJSDocStructure);
        const filteredJSDocStructure = jsDocStructure.reduce(formatJSDocStructure, []);

        appendJSDocsWithMode(filteredJSDocStructure, deepNode);
    });
}
