import chalk from 'chalk';
import type {
    AIServiceOptions,
    ASTJSDocableNode,
    InitJSDocFactoryParams,
    PrepareAndApplyJSDoc
} from 'core/types/common';
import { Project } from 'ts-morph';
import { applyJSDoc as applyJSDocDefault } from './applyJSDoc';
import { cloneNodeAsFileFactory } from './cloneNodeAsFileFactory';
import { getJSDocableNodesFromCodeSnippet } from './getJSDocableNodesFromCodeSnippet';
import { getMinifySourceCode } from './getMinifySourceCode';
import { isProjectDependency } from './isProjectDependency';

/**
 * Инициализирует фабрику JSDoc.
 * @template CurrentNode - Текущий узел AST, который поддерживает JSDoc.
 * @template Response - Тип возвращаемого значения.
 * @param {InitJSDocFactoryParams<CurrentNode, Response>} factoryParams - Параметры инициализации фабрики JSDoc.
 * @returns {Promise<boolean>} - Промис с результатом применения JSDoc.
 */
export function initJSDocFactory<
    CurrentNode extends ASTJSDocableNode = ASTJSDocableNode,
    Response = unknown
>(
    factoryParams: InitJSDocFactoryParams<CurrentNode, Response>
): <CurrentAIServiceOptions extends AIServiceOptions>(
    prepareParams: PrepareAndApplyJSDoc<CurrentNode, CurrentAIServiceOptions>
) => Promise<boolean> {
    const { applyJSDoc = applyJSDocDefault, getJSDocableCodeSnippet } = factoryParams;
    const project = new Project();
    const cloneNodeAsFile = cloneNodeAsFileFactory(project);

    return async <CurrentAIServiceOptions extends AIServiceOptions>(
        prepareParams: PrepareAndApplyJSDoc<CurrentNode, CurrentAIServiceOptions>
    ): Promise<boolean> => {
        const {
            jsDocGeneratorService,
            node,
            jsDocOptions,
            sourceFile,
            aiServiceOptions,
            fileCacheManagerMap,
            isNodeInCache,
            logger
        } = prepareParams;
        logger.info(`Обрабатываю узел: ${chalk.bgBlue(node.getKindName())}`);

        const hasCached = isNodeInCache({ node, sourceFile, fileCacheManagerMap });

        logger.info(
            hasCached
                ? chalk.green('Данный узел уже есть в кэше, пропускаю его')
                : chalk.italic('Узла еще нет в кэше')
        );

        if (hasCached) {
            return false;
        }

        const clonedSourceFile = cloneNodeAsFile(sourceFile);
        const codeSnippet = node.getText();
        const referencedSourceFiles = sourceFile.getReferencedSourceFiles();
        const referencedMinifiedSourceCode = referencedSourceFiles
            .filter(isProjectDependency)
            .map(cloneNodeAsFile)
            .map(getMinifySourceCode);
        const minifiedSourceFile = getMinifySourceCode(clonedSourceFile);

        logger.info(chalk.underline('Делаю запрос в сервис по кодогенерации JSDoc'));

        const jsDocableCodeSnippet = await getJSDocableCodeSnippet({
            jsDocGeneratorService,
            jsDocGeneratorServiceOptions: {
                codeSnippet,
                sourceFile: minifiedSourceFile,
                referencedSourceFiles: referencedMinifiedSourceCode
            },
            aiServiceOptions
        });

        logger.info(chalk.green('Успешный ответ от сервиса по кодогенерации.'));

        logger.info(
            `${chalk.underline('Форматирую фрагмент кода через ')} ${chalk.yellow('ESLint')}`
        );

        logger.info(chalk.green('Код успешно форматирован.'));

        const jsDocs = getJSDocableNodesFromCodeSnippet(jsDocableCodeSnippet);

        /**
         * Применяет JSDoc к узлу AST.
         * @param {ASTJSDocableNode} node - Узел AST, к которому применяется JSDoc.
         * @param {JSDoc[]} jsDocs - Список JSDoc для применения.
         * @param {JSDocOptions} jsDocOptions - Опции JSDoc.
         */
        applyJSDoc({ node, jsDocs, jsDocOptions });

        logger.info(
            `${chalk.green('JSDoc был успешно добавлен в узел: ')} ${chalk.bgBlue(node.getKindName())}`
        );

        return true;
    };
}
