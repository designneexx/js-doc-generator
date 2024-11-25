import { JSDocStructure, JSDocTagStructure, OptionalKind } from 'ts-morph';
import { ApplyJSDocParams, ASTJSDocableNode, InsertModeJSDocTypes } from '../../types/common';
import { getAllJSDocableNodesFlatFactory } from './getAllJSDocableNodesFlatFactory';
import { getJSDocStructure } from './getJSDocStructure';
import { removeJSDoc } from './removeJSDoc';

/**
 * Применяет JSDoc комментарии к узлу AST в соответствии с заданными параметрами.
 * @template CurrentNode - Тип узла AST, который поддерживает JSDoc комментарии.
 * @param {ApplyJSDocParams<CurrentNode>} params - Параметры применения JSDoc.
 */
export async function applyJSDoc<CurrentNode extends ASTJSDocableNode = ASTJSDocableNode>(
    params: ApplyJSDocParams<CurrentNode>
) {
    const { node, jsDocs, jsDocOptions } = params;
    const {
        isShowJSDocDescription = true,
        isShowJSDocTags = true,
        allowedJSDocTags = [],
        disabledJSDocTags = [],
        mode = InsertModeJSDocTypes.ReplaceMode,
        depth = Infinity
    } = jsDocOptions;
    const depthNodeWeakMap = new Map<ASTJSDocableNode, number>();
    const getAllJSDocableNodesFlat = getAllJSDocableNodesFlatFactory(depthNodeWeakMap);
    const allJSDocableNodes = getAllJSDocableNodesFlat(node);

    /**
     * Фильтрует JSDoc теги в соответствии с настройками.
     * @param {OptionalKind<JSDocTagStructure>} jsDocTagStructure - Структура JSDoc тега.
     * @returns {boolean} - Результат фильтрации тега.
     */
    function filterJSDocTags(jsDocTagStructure: OptionalKind<JSDocTagStructure>): boolean {
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
     * Форматирует структуру JSDoc комментария в соответствии с настройками.
     * @param {JSDocStructure[]} acc - Аккумулятор структур JSDoc комментариев.
     * @param {JSDocStructure} jsDocStructure - Структура JSDoc комментария.
     * @returns {JSDocStructure[]} - Отформатированный массив структур JSDoc комментариев.
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

        if (!data.description && !data.tags.length) {
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
        const currentDepth = depthNodeWeakMap.get(deepNode) || 0;
        const nodeJSDocs = deepNode.getJsDocs();
        const filteredJSDocs = jsDocsStructure.filter((_, index) => !nodeJSDocs[index]);

        if (currentDepth > depth) {
            return;
        }

        if (mode === InsertModeJSDocTypes.ReplaceMode) {
            nodeJSDocs.forEach(removeJSDoc);
            deepNode.addJsDocs(jsDocsStructure.slice(0, 1));
        } else {
            deepNode.addJsDocs(filteredJSDocs.slice(0, 1));
        }
    }

    allJSDocableNodes.forEach((deepNode, index) => {
        const jsDocableNode = jsDocs.at(index);

        if (!jsDocableNode) return;

        const jsDocsNode = jsDocableNode?.getJsDocs() || [];
        const jsDocStructure = jsDocsNode.map(getJSDocStructure);
        const filteredJSDocStructure = jsDocStructure.reduce(formatJSDocStructure, []);

        appendJSDocsWithMode(filteredJSDocStructure, deepNode);
    });
}
