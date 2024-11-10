import {
    ExtractedDeclarations,
    JSDocableDeclarationRegistry,
    JSDocProviderRegistry
} from 'src/types/common';

/**
 * Функция для сглаживания и обработки объявлений.
 * @param {JSDocProviderRegistry} jsDocProviderRegistry - Реестр провайдеров JSDoc.
 * @param {ExtractedDeclarations} extractedDeclarations - Извлеченные объявления.
 * @returns {JSDocProvider[]} - Массив провайдеров JSDoc.
 */
export function flattenAndProcessDeclarations(
    jsDocProviderRegistry: JSDocProviderRegistry,
    extractedDeclarations: ExtractedDeclarations
) {
    /**
     * Получает провайдеров JSDoc для указанного вида и узлов.
     * @template Kind - Тип вида объявления.
     * @template Nodes - Тип узлов объявления.
     * @param {Kind} kind - Вид объявления.
     * @param {Nodes} nodes - Узлы объявления.
     * @returns {JSDocProvider[]} - Массив провайдеров JSDoc.
     */
    function getJSDocProviders<
        Kind extends keyof JSDocableDeclarationRegistry,
        Nodes extends JSDocableDeclarationRegistry[Kind][]
    >(kind: Kind, nodes: Nodes) {
        return nodes.map(jsDocProviderRegistry[kind]);
    }

    /**
     * Сглаживает объявления.
     * @param {ExtractedDeclaration} item - Элемент извлеченных объявлений.
     * @returns {JSDocProvider[]} - Массив провайдеров JSDoc.
     */
    function flattenDeclarations(item: ExtractedDeclarations[number]) {
        return getJSDocProviders(item.kind, item.nodes);
    }

    return extractedDeclarations.flatMap(flattenDeclarations);
}
