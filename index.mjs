import axios from "axios";

import chalk from "chalk";

import { ESLint } from "eslint";

import { Cache } from "file-system-cache";

import { Project, Node, SyntaxKind, ts } from "ts-morph";

import winston from "winston";

import sha1 from "crypto-js/sha1.js";

import { v4 } from "uuid";

/**
 * Перечисление, определяющее режимы вставки элементов.
 */ var InsertModeJSDocTypes;

(function(InsertModeJSDocTypes) {
    /**
     * Режим замены, при котором новые элементы заменяют существующие.
     * Полезно, когда необходимо обновить текущую коллекцию новыми данными,
     * полностью заменяя старые значения.
     */
    InsertModeJSDocTypes[InsertModeJSDocTypes["ReplaceMode"] = 0] = "ReplaceMode";
    /**
     * Режим добавления, при котором новые элементы добавляются к существующим.
     * Используется, когда необходимо расширить текущую коллекцию, добавляя
     * новые данные к уже существующим.
     */    InsertModeJSDocTypes[InsertModeJSDocTypes["AppendMode"] = 1] = "AppendMode";
})(InsertModeJSDocTypes || (InsertModeJSDocTypes = {}));

/**
 * Перечисление для различных видов объявлений в коде.
 */ var KindDeclarationNames;

(function(KindDeclarationNames) {
    /**
     * Объявление функции.
     */
    KindDeclarationNames["FunctionDeclaration"] = "FunctionDeclaration";
    /**
     * Объявление переменной.
     */    KindDeclarationNames["VariableStatement"] = "VariableStatement";
    /**
     * Объявление перечисления (enum).
     */    KindDeclarationNames["EnumDeclaration"] = "EnumDeclaration";
    /**
     * Объявление псевдонима типа.
     */    KindDeclarationNames["TypeAliasDeclaration"] = "TypeAliasDeclaration";
    /**
     * Объявление интерфейса.
     */    KindDeclarationNames["InterfaceDeclaration"] = "InterfaceDeclaration";
    /**
     * Объявление класса.
     */    KindDeclarationNames["ClassDeclaration"] = "ClassDeclaration";
})(KindDeclarationNames || (KindDeclarationNames = {}));

/**
 * Получает список кэша из входного массива, содержащего ключ и карту значений
 * @param entry - Входной массив, содержащий ключ и карту значений
 * @returns Объект, содержащий ключ и массив значений карты
 */ function getCacheList(entry) {
    const [key, map] = entry;
    return {
        key,
        value: Array.from(map.values())
    };
}

/**
 * Класс для управления кэшем файлов с использованием Map
 */ class FileCacheManagerMap extends Map {
    /**
     * Сохраняет кэш в хранилище
     * @param cache - объект кэша для сохранения
     * @returns Результат сохранения кэша
     */
    save(cache) {
        const entries = Array.from(this.entries());
        const savings = entries.map(getCacheList);
        return cache.save(savings);
    }
}

/**
 * Создает отображение менеджера кэша файлов на основе переданного кэша.
 * @param {Cache} cache - Кэш, из которого необходимо загрузить данные.
 * @returns {Promise<FileCacheManagerMap>} - Объект, представляющий отображение менеджера кэша файлов.
 */ async function createFileCacheManagerMap(cache) {
    const serializedCache = await cache.load();
    const {files} = serializedCache;
    const codeCacheHashMap = new FileCacheManagerMap;
    const flatFiles = files.flatMap((item => item.value));
    for (const serializedFile of flatFiles) {
        const {fileSourceCodeHash, nodeSourceCodeHash} = serializedFile;
        const nodesSet = codeCacheHashMap.get(fileSourceCodeHash) || new Map;
        nodesSet.set(nodeSourceCodeHash, {
            fileSourceCodeHash,
            nodeSourceCodeHash
        });
        codeCacheHashMap.set(fileSourceCodeHash, nodesSet);
    }
    return codeCacheHashMap;
}

/**
 * Извлекает объявления из файла и возвращает объект с различными типами объявлений.
 * @param {SourceFile} sourceFile - Исходный файл, из которого нужно извлечь объявления
 * @returns {ExtractedDeclarations} - Объект с извлеченными объявлениями различных типов
 */ function extractDeclarationsFromSourceFile(sourceFile) {
    const functions = sourceFile.getFunctions();
    const variableStatements = sourceFile.getVariableStatements();
    const enums = sourceFile.getEnums();
    const typeAliases = sourceFile.getTypeAliases();
    const interfaces = sourceFile.getInterfaces();
    const classes = sourceFile.getClasses();
    const extractedDeclarations = [ {
        kind: KindDeclarationNames.InterfaceDeclaration,
        nodes: interfaces
    }, {
        kind: KindDeclarationNames.FunctionDeclaration,
        nodes: functions
    }, {
        kind: KindDeclarationNames.EnumDeclaration,
        nodes: enums
    }, {
        kind: KindDeclarationNames.TypeAliasDeclaration,
        nodes: typeAliases
    }, {
        kind: KindDeclarationNames.VariableStatement,
        nodes: variableStatements
    }, {
        kind: KindDeclarationNames.ClassDeclaration,
        nodes: classes
    } ];
    return extractedDeclarations;
}

/**
 * Фильтрует извлеченные декларации по указанным видам.
 * @param {ExtractedDeclarations} extractedDeclarations - Массив извлеченных деклараций.
 * @param {`${KindDeclarationNames}`[]} kinds - Массив видов деклараций, по которым нужно отфильтровать.
 * @returns {ExtractedDeclarations} - Отфильтрованный массив извлеченных деклараций.
 */ function filterExtractedDeclarationsByKinds(extractedDeclarations, kinds) {
    /**
     * Функция для фильтрации деклараций по указанным видам.
     * @param {ExtractedDeclarations[number]} value - Значение для фильтрации.
     * @returns {boolean} - Результат проверки на соответствие видам.
     */
    function filter(value) {
        return kinds.length === 0 || kinds.includes(value.kind);
    }
    return extractedDeclarations.filter(filter);
}

/**
 * Функция для сглаживания и обработки объявлений.
 * @param {JSDocProviderRegistry} jsDocProviderRegistry - Реестр провайдеров JSDoc.
 * @param {ExtractedDeclarations} extractedDeclarations - Извлеченные объявления.
 * @returns {JSDocableDeclarationRegistry[]} - Массив объявлений с JSDoc.
 */ function flattenAndProcessDeclarations(jsDocProviderRegistry, extractedDeclarations) {
    /**
     * Получает провайдеров JSDoc для указанного вида и узлов.
     * @template Kind - Тип вида объявления.
     * @template Nodes - Тип узлов объявления.
     * @param {Kind} kind - Вид объявления.
     * @param {Nodes} nodes - Узлы объявления.
     * @returns {JSDocProvider[]} - Массив провайдеров JSDoc.
     */
    function getJSDocProviders(kind, nodes) {
        return nodes.map(jsDocProviderRegistry[kind]);
    }
    /**
     * Сглаживает объявления.
     * @param {ExtractedDeclaration} item - Элемент извлеченных объявлений.
     * @returns {JSDocProvider[]} - Массив провайдеров JSDoc.
     */    function flattenDeclarations(item) {
        return getJSDocProviders(item.kind, item.nodes);
    }
    return extractedDeclarations.flatMap(flattenDeclarations);
}

/**
 * Получить кэш из узла исходного файла
 * @param {GetCacheFromNodeSourceFileParams} params - Параметры для получения кэша из узла исходного файла
 * @param {NodeSourceFile} params.sourceFile - Исходный файл узла
 * @param {Node} params.node - Узел
 * @param {Map<string, Map<string, any>>} params.fileCacheManagerMap - Карта кэша файлов
 * @returns {GetCacheFromNodeSourceFileReturn} - Объект с хэшами и карта кэша для фрагмента кода
 */ function getCacheFromNodeSourceFile(params) {
    const {sourceFile, node, fileCacheManagerMap} = params;
    const sourceCode = sourceFile.getFullText();
    const codeSnippet = node.getFullText();
    const hashDigestCodeSnippet = sha1(codeSnippet);
    const hashDigestSourceCode = sha1(sourceCode);
    const hashCodeSnippet = hashDigestCodeSnippet.toString();
    const hashSourceCode = hashDigestSourceCode.toString();
    const codeSnippetHashMap = fileCacheManagerMap.get(hashSourceCode) || new Map;
    return {
        hashCodeSnippet,
        hashSourceCode,
        codeSnippetHashMap
    };
}

/**
 * Проверяет, содержится ли узел в кэше.
 * @param {IsNodeInCacheParams} nodeCacheParams - Параметры для проверки кэша узла.
 * @param {Node} node - Узел, который нужно проверить.
 * @param {Map<string, FileCacheManager>} fileCacheManagerMap - Карта файлов и их менеджеров кэша.
 * @param {SourceFile} sourceFile - Исходный файл, в котором содержится узел.
 * @returns {boolean} - Результат проверки: содержится ли узел в кэше.
 */ function isNodeInCache(nodeCacheParams) {
    const {node, fileCacheManagerMap, sourceFile} = nodeCacheParams;
    const data = getCacheFromNodeSourceFile({
        node,
        sourceFile,
        fileCacheManagerMap
    });
    const {codeSnippetHashMap, hashCodeSnippet} = data;
    const isIdentityCache = codeSnippetHashMap.has(hashCodeSnippet);
    return isIdentityCache;
}

/**
 * Проверяет, является ли Promise успешно разрешенным и его значение true.
 * @param {PromiseSettledResult<boolean>} item - Результат выполнения Promise.
 * @returns {boolean} - true, если Promise успешно разрешен и его значение true, иначе false.
 */ function isPromiseResolvedAndTrue(item) {
    if (item.status === "fulfilled") {
        return item.value;
    }
    return false;
}

/**
 * Функция для выравнивания объявлений.
 * @param value - Значение для выравнивания.
 * @returns Массив значений узлов из объявлений.
 */ function flattenDeclarations(value) {
    return value.nodes;
}

/**
 * Сохраняет обработанные JSDoc в кэше.
 *
 * @param {SaveJSDocProcessedInCacheParams} params - Параметры для сохранения JSDoc в кэше.
 * @param {ProjectOptions} params.projectOptions - Опции проекта.
 * @param {string[]} params.files - Список путей к файлам.
 * @param {string[]} params.kinds - Список типов JSDoc для фильтрации.
 * @param {Map<string, Map<string, CodeSnippet>>} params.fileCacheManagerMap - Карта менеджеров кэша файлов.
 * @param {Cache} params.cache - Кэш для сохранения.
 * @returns {boolean} - Результат сохранения в кэше.
 */ function saveJSDocProcessedInCache(params) {
    const {projectOptions, files, kinds, fileCacheManagerMap, cache} = params;
    const project = new Project(projectOptions);
    const sourceFiles = project.addSourceFilesAtPaths(files);
    sourceFiles.forEach((sourceFile => {
        const extractedDeclarations = extractDeclarationsFromSourceFile(sourceFile);
        const allowedExtractedDeclarations = filterExtractedDeclarationsByKinds(extractedDeclarations, kinds);
        allowedExtractedDeclarations.flatMap(flattenDeclarations).forEach((node => {
            const data = getCacheFromNodeSourceFile({
                node,
                sourceFile,
                fileCacheManagerMap
            });
            const {hashCodeSnippet, hashSourceCode, codeSnippetHashMap} = data;
            codeSnippetHashMap.set(hashCodeSnippet, {
                fileSourceCodeHash: hashSourceCode,
                nodeSourceCodeHash: hashCodeSnippet
            });
            fileCacheManagerMap.set(hashSourceCode, codeSnippetHashMap);
        }));
    }));
    return fileCacheManagerMap.save(cache);
}

/**
 * Функция для создания фабрики, возвращающей функцию, получающую все JSDocable узлы из узла AST.
 *
 * @param {WeakMap<ASTJSDocableNode, number>} [depthNodeWeakMap] - Слабая карта для хранения глубины узлов AST.
 * @returns {(node: CurrentNode) => ASTJSDocableNode[]} - Функция, возвращающая все JSDocable узлы из узла AST.
 */ function getAllJSDocableNodesFlatFactory(depthNodeWeakMap) {
    return node => {
        /**
         * Получение всех дочерних узлов текущего узла AST.
         */
        const children = node.getChildren();
        /**
         * Функция для рекурсивного получения JSDocable узлов из узлов AST.
         *
         * @param {number} depth - Глубина текущего узла AST.
         * @returns {(acc: ASTJSDocableNode[], deepNode: DeepNode) => ASTJSDocableNode[]} - Функция, обрабатывающая узлы AST и возвращающая массив JSDocable узлов.
         */        function deepGetJSDocable(depth) {
            return (acc, deepNode) => {
                /**
                 * Получение всех дочерних узлов текущего узла AST.
                 */
                const deepChildren = deepNode.getChildren();
                /**
                 * Получение всех JSDocable узлов из дочерних узлов.
                 */                const deepJSDocableNodes = getJSDocables(Node.isJSDocable(deepNode) && [ SyntaxKind.SingleLineCommentTrivia, SyntaxKind.MultiLineCommentTrivia ].every((kind => !deepNode.isKind(kind))) ? depth + 1 : depth, deepChildren);
                if (Node.isJSDocable(deepNode) && [ SyntaxKind.SingleLineCommentTrivia, SyntaxKind.MultiLineCommentTrivia ].every((kind => !deepNode.isKind(kind)))) {
                    depthNodeWeakMap?.set(deepNode, depth);
                    return [ ...acc, deepNode, ...deepJSDocableNodes ];
                }
                return [ ...acc, ...deepJSDocableNodes ];
            };
        }
        /**
         * Получение всех JSDocable узлов из массива узлов AST.
         *
         * @param {number} depth - Глубина текущего узла AST.
         * @param {Node<ts.Node>[]} nodes - Массив узлов AST.
         * @returns {ASTJSDocableNode[]} - Массив JSDocable узлов.
         */        function getJSDocables(depth, nodes) {
            return nodes.reduce(deepGetJSDocable(depth), []);
        }
        /**
         * Получение всех JSDocable узлов из дочерних узлов.
         */        const jsDocableNodes = getJSDocables(1, children);
        let allJSDocableNodes = jsDocableNodes;
        if (Node.isJSDocable(node) && [ SyntaxKind.SingleLineCommentTrivia, SyntaxKind.MultiLineCommentTrivia ].every((kind => !node.isKind(kind)))) {
            depthNodeWeakMap?.set(node, 0);
            allJSDocableNodes = [ node, ...jsDocableNodes ];
        }
        return allJSDocableNodes;
    };
}

/**
 * Получает структуру JSDoc комментария.
 * @param {JSDoc} jsDoc - JSDoc комментарий.
 * @returns {JSDocStructure} - Структура JSDoc комментария.
 */ function getJSDocStructure(jsDoc) {
    return jsDoc.getStructure();
}

/**
 * Удаляет JSDoc комментарий из узла.
 * @param {JSDoc} node - Узел, содержащий JSDoc комментарий.
 * @returns {void} - Функция ничего не возвращает.
 */ function removeJSDoc(node) {
    return node.remove();
}

/**
 * Применяет JSDoc комментарии к узлу AST в соответствии с заданными параметрами.
 * @template CurrentNode - Тип узла AST, который поддерживает JSDoc комментарии.
 * @param {ApplyJSDocParams<CurrentNode>} params - Параметры для применения JSDoc.
 */ async function applyJSDoc(params) {
    const {node, jsDocs, jsDocOptions} = params;
    const {isShowJSDocDescription = true, isShowJSDocTags = true, allowedJSDocTags = [], disabledJSDocTags = [], mode = InsertModeJSDocTypes.ReplaceMode, depth = Infinity} = jsDocOptions;
    const depthNodeWeakMap = new Map;
    const getAllJSDocableNodesFlat = getAllJSDocableNodesFlatFactory(depthNodeWeakMap);
    const allJSDocableNodes = getAllJSDocableNodesFlat(node);
    /**
     * Фильтрует JSDoc теги в соответствии с настройками.
     * @param {OptionalKind<JSDocTagStructure>} jsDocTagStructure - Структура JSDoc тега.
     * @returns {boolean} - Результат фильтрации тега.
     */    function filterJSDocTags(jsDocTagStructure) {
        const {tagName} = jsDocTagStructure;
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
     */    function formatJSDocStructure(acc, jsDocStructure) {
        const data = {
            ...jsDocStructure
        };
        const {tags = []} = data;
        data.tags = tags.filter(filterJSDocTags);
        if (!isShowJSDocDescription) {
            data.description = "";
        }
        if (!isShowJSDocTags) {
            data.tags = [];
        }
        if (!data.description && !data.tags.length) {
            return acc;
        }
        return [ ...acc, data ];
    }
    /**
     * Добавляет JSDoc комментарии к узлу в соответствии с режимом вставки.
     * @template DeepNode - Тип узла AST, который поддерживает JSDoc комментарии.
     * @param {JSDocStructure[]} jsDocsStructure - Структура JSDoc комментариев.
     * @param {DeepNode} deepNode - Узел AST.
     */    function appendJSDocsWithMode(jsDocsStructure, deepNode) {
        const currentDepth = depthNodeWeakMap.get(deepNode) || 0;
        const nodeJSDocs = deepNode.getJsDocs();
        const filteredJSDocs = jsDocsStructure.filter(((_, index) => !nodeJSDocs[index]));
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
    allJSDocableNodes.forEach(((deepNode, index) => {
        const jsDocableNode = jsDocs.at(index) || null;
        const jsDocsNode = jsDocableNode?.getJsDocs() || [];
        const jsDocStructure = jsDocsNode.map(getJSDocStructure);
        const filteredJSDocStructure = jsDocStructure.reduce(formatJSDocStructure, []);
        appendJSDocsWithMode(filteredJSDocStructure, deepNode);
    }));
}

/**
 * Функция создания фабрики клонирования узлов в виде файла.
 *
 * @param {Project} [project] - Проект, в который будут клонироваться узлы. Если не передан, будет создан новый проект.
 * @returns {Function} - Функция, которая принимает узел для клонирования и возвращает клонированный и сохраненный в проекте файл.
 */ function cloneNodeAsFileFactory(project) {
    const currentProject = project || new Project;
    return value => {
        /**
         * Создание клонированного и сохраненного в проекте файла на основе переданного узла.
         *
         * @param {Value} value - Узел, который будет клонирован в виде файла.
         * @returns {SourceFile} - Клонированный и сохраненный в проекте файл.
         */
        const copiedSourceFile = currentProject.createSourceFile(`${v4()}.tsx`, value.getFullText());
        return copiedSourceFile;
    };
}

/**
 * Получает узлы с JSDoc из фрагмента кода.
 * @param {string} codeSnippet - Фрагмент кода, из которого нужно получить узлы с JSDoc.
 * @returns {ASTJSDocableNode[]} - Массив узлов с JSDoc.
 */ function getJSDocableNodesFromCodeSnippet(codeSnippet) {
    const project = new Project;
    const sourceFile = project.createSourceFile(`${v4()}.tsx`, codeSnippet);
    const children = sourceFile.getChildren();
    return children.flatMap(getAllJSDocableNodesFlatFactory());
}

/**
 * Настройки форматирования кода.
 */ const formatCodeSettings = {
    ensureNewLineAtEndOfFile: false,
    baseIndentSize: 0,
    indentSize: 0,
    convertTabsToSpaces: false,
    newLineCharacter: "",
    indentStyle: ts.IndentStyle.None,
    trimTrailingWhitespace: true,
    insertSpaceAfterCommaDelimiter: false,
    insertSpaceAfterSemicolonInForStatements: false,
    insertSpaceBeforeAndAfterBinaryOperators: false,
    insertSpaceAfterConstructor: false,
    insertSpaceAfterKeywordsInControlFlowStatements: false,
    insertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: false,
    insertSpaceAfterOpeningAndBeforeClosingEmptyBraces: false,
    insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
    insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: false,
    insertSpaceAfterTypeAssertion: false,
    insertSpaceBeforeFunctionParenthesis: false,
    placeOpenBraceOnNewLineForFunctions: false,
    placeOpenBraceOnNewLineForControlBlocks: false,
    insertSpaceBeforeTypeAnnotation: false,
    indentMultiLineObjectLiteralBeginningOnBlankLine: false,
    semicolons: ts.SemicolonPreference.Insert,
    indentSwitchCase: false
};

/**
 * Функция для получения минифицированного исходного кода файла
 * @param {SourceFile} sourceFile - Исходный файл, который нужно минифицировать
 * @returns {SerializedSourceFile} - Объект с минифицированным исходным кодом и путем к файлу
 */ function getMinifySourceCode(sourceFile) {
    sourceFile.formatText(formatCodeSettings);
    const sourceCode = sourceFile.getText();
    const filePath = sourceFile.getFilePath();
    return {
        sourceCode,
        filePath
    };
}

/**
 * Проверяет, является ли файл зависимостью проекта
 * @param {SourceFile} sourceFile - Файл для проверки
 * @returns {boolean} - Результат проверки: true, если файл не является внешней библиотекой, иначе false
 */ function isProjectDependency(sourceFile) {
    return !sourceFile.isFromExternalLibrary();
}

/**
 * Инициализирует фабрику JSDoc.
 * @template CurrentNode - Текущий узел AST, который поддерживает JSDoc.
 * @template Response - Тип возвращаемого значения.
 * @param {InitJSDocFactoryParams<CurrentNode, Response>} factoryParams - Параметры инициализации фабрики JSDoc.
 * @returns {Promise<boolean>} - Промис с булевым значением, указывающим на успешность применения JSDoc.
 */ function initJSDocFactory(factoryParams) {
    const {applyJSDoc: applyJSDoc$1 = applyJSDoc, getJSDocableCodeSnippet} = factoryParams;
    const project = new Project;
    const cloneNodeAsFile = cloneNodeAsFileFactory(project);
    return async prepareParams => {
        const {jsDocGeneratorService, node, jsDocOptions, sourceFile, aiServiceOptions, fileCacheManagerMap, isNodeInCache, esLint, logger} = prepareParams;
        logger.info(`Обрабатываю узел: ${chalk.bgBlue(node.getKindName())}`);
        const hasCached = isNodeInCache({
            node,
            sourceFile,
            fileCacheManagerMap
        });
        logger.info(hasCached ? chalk.green("Данный узел уже есть в кэше, пропускаю его") : chalk.italic("Узла еще нет в кэше"));
        if (hasCached) {
            return false;
        }
        const clonedSourceFile = cloneNodeAsFile(sourceFile);
        const codeSnippet = node.getText();
        const referencedSourceFiles = sourceFile.getReferencedSourceFiles();
        const referencedMinifiedSourceCode = referencedSourceFiles.filter(isProjectDependency).map(cloneNodeAsFile).map(getMinifySourceCode);
        const minifiedSourceFile = getMinifySourceCode(clonedSourceFile);
        logger.info(chalk.underline("Делаю запрос в сервис по кодогенерации JSDoc"));
        const jsDocableCodeSnippet = await getJSDocableCodeSnippet({
            jsDocGeneratorService,
            jsDocGeneratorServiceOptions: {
                codeSnippet,
                sourceFile: minifiedSourceFile,
                referencedSourceFiles: referencedMinifiedSourceCode
            },
            aiServiceOptions
        });
        logger.info(chalk.green("Успешный ответ от сервиса по кодогенерации."));
        logger.info(`${chalk.underline("Форматирую фрагмент кода через ")} ${chalk.yellow("ESLint")}`);
        const [lintResult] = await esLint.lintText(jsDocableCodeSnippet);
        logger.info(chalk.green("Код успешно форматирован."));
        const jsDocs = getJSDocableNodesFromCodeSnippet(lintResult?.output || jsDocableCodeSnippet);
        /**
         * Применяет JSDoc к узлу AST.
         * @param {ASTJSDocableNode} node - Узел AST, к которому применяется JSDoc.
         * @param {JSDoc[]} jsDocs - Список JSDoc для применения.
         * @param {JSDocOptions} jsDocOptions - Опции JSDoc.
         */        applyJSDoc$1({
            node,
            jsDocs,
            jsDocOptions
        });
        logger.info(`${chalk.green("JSDoc был успешно добавлен в узел: ")} ${chalk.bgBlue(node.getKindName())}`);
        return true;
    };
}

/**
 * Фабричная функция для создания класса с JSDoc-комментариями.
 *
 * @param {Object} initParams - Параметры инициализации.
 * @param {string} initParams.kind - Тип объявления (ClassDeclaration).
 * @returns {Object} - Возвращает объект с методом для асинхронного получения JSDoc-комментариев для класса.
 */ const createJSDocClass = initJSDocFactory({
    kind: "ClassDeclaration",
    /**
     * Асинхронно получает фрагмент кода с комментариями JSDoc для класса.
     *
     * @param {Object} params - Параметры, необходимые для генерации JSDoc.
     * @param {Object} params.jsDocGeneratorService - Сервис для генерации JSDoc.
     * @param {Object} params.jsDocGeneratorServiceOptions - Опции для сервиса генерации JSDoc.
     * @param {Object} params.aiServiceOptions - Опции для AI сервиса, используемого при генерации.
     * @returns {Promise<string>} - Возвращает промис, который разрешается в строку с JSDoc-комментариями для класса.
     */
    async getJSDocableCodeSnippet(params) {
        const {jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions} = params;
        return jsDocGeneratorService.createJSDocClass(jsDocGeneratorServiceOptions, aiServiceOptions);
    }
});

/**
 * Функция для создания JSDocEnum.
 * @param {Object} params - Параметры для создания JSDocEnum.
 * @param {Object} params.jsDocGeneratorService - Сервис для генерации JSDoc.
 * @param {Object} params.jsDocGeneratorServiceOptions - Опции для сервиса генерации JSDoc.
 * @param {Object} params.aiServiceOptions - Опции для AI-сервиса.
 * @returns {string} - Сгенерированный JSDocEnum.
 */ const createJSDocEnum = initJSDocFactory({
    kind: "EnumDeclaration",
    async getJSDocableCodeSnippet(params) {
        /**
         * Деструктуризация параметров.
         */
        const {jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions} = params;
        return jsDocGeneratorService.createJSDocEnum(jsDocGeneratorServiceOptions, aiServiceOptions);
    }
});

/**
 * Функция для создания JSDoc для FunctionDeclaration.
 * @param {Object} params - Параметры для генерации JSDoc.
 * @param {JSDocGeneratorService} params.jsDocGeneratorService - Сервис для генерации JSDoc.
 * @param {JSDocGeneratorServiceOptions} params.jsDocGeneratorServiceOptions - Опции для генерации JSDoc.
 * @param {AIServiceOptions} params.aiServiceOptions - Опции для AI-сервиса.
 * @returns {string} - Сгенерированный JSDoc для FunctionDeclaration.
 */ const createJSDocFunction = initJSDocFactory({
    kind: "FunctionDeclaration",
    async getJSDocableCodeSnippet(params) {
        const {jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions} = params;
        return jsDocGeneratorService.createJSDocFunction(jsDocGeneratorServiceOptions, aiServiceOptions);
    }
});

/**
 * Функция для создания JSDoc интерфейса.
 * @param {Object} params - Параметры для создания JSDoc интерфейса.
 * @param {Object} params.jsDocGeneratorService - Сервис для генерации JSDoc.
 * @param {Object} params.jsDocGeneratorServiceOptions - Опции для сервиса генерации JSDoc.
 * @param {Object} params.aiServiceOptions - Опции для AI сервиса.
 * @returns {string} - Сгенерированный JSDoc интерфейс.
 */ const createJSDocInterface = initJSDocFactory({
    kind: "InterfaceDeclaration",
    async getJSDocableCodeSnippet(params) {
        const {jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions} = params;
        return jsDocGeneratorService.createJSDocInterface(jsDocGeneratorServiceOptions, aiServiceOptions);
    }
});

/**
 * Функция для создания JSDoc для TypeAliasDeclaration.
 * @param {Object} params - Параметры для генерации JSDoc.
 * @param {Object} params.jsDocGeneratorService - Сервис для генерации JSDoc.
 * @param {Object} params.jsDocGeneratorServiceOptions - Опции для генерации JSDoc.
 * @param {Object} params.aiServiceOptions - Опции для AI-сервиса.
 * @returns {string} - Сгенерированный JSDoc для TypeAliasDeclaration.
 */ const createJSDocTypeAlias = initJSDocFactory({
    kind: "TypeAliasDeclaration",
    async getJSDocableCodeSnippet(params) {
        const {jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions} = params;
        return jsDocGeneratorService.createJSDocTypeAlias(jsDocGeneratorServiceOptions, aiServiceOptions);
    }
});

/**
 * Фабричная функция для создания переменной с JSDoc комментариями.
 *
 * @param {JSDocFactoryParams} params - Параметры для инициализации фабрики JSDoc.
 * @returns {JSDocVariableStatement} Возвращает объект с асинхронной функцией для получения фрагмента кода с JSDoc комментариями.
 */ const createJSDocVariableStatement = initJSDocFactory({
    kind: "VariableStatement",
    /**
     * Асинхронная функция для получения фрагмента кода с JSDoc комментариями.
     *
     * @param {CreateJSDocVariableStatementParams} params - Параметры, необходимые для генерации JSDoc комментариев.
     * @returns {Promise<string>} Возвращает промис, который разрешается в строку с фрагментом кода, содержащим JSDoc комментарии.
     */
    async getJSDocableCodeSnippet(params) {
        const {jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions} = params;
        return jsDocGeneratorService.createJSDocVariableStatement(jsDocGeneratorServiceOptions, aiServiceOptions);
    }
});

/**
 * Получает и подготавливает параметры для генерации JSDoc.
 * @template CurrentNode - Текущий узел AST, расширяющий ASTJSDocableNode.
 * @template CurrentAIServiceOptions - Текущие опции сервиса AI, расширяющие AIServiceOptions.
 * @param {GetPrepareParams<CurrentNode, CurrentAIServiceOptions>} params - Параметры для подготовки.
 * @returns {PrepareAndApplyJSDoc<CurrentNode, CurrentAIServiceOptions>} - Подготовленные параметры для генерации JSDoc.
 */ function getPrepareParams(params) {
    const {config, sourceFile, kindName, node} = params;
    const {detailGenerationOptions, globalGenerationOptions, jsDocGeneratorService, fileCacheManagerMap, isNodeInCache, esLint, logger} = config;
    const {aiServiceOptions: globalAiServiceOptions, jsDocOptions: globalJSDocOptions} = globalGenerationOptions || {};
    const currentDetailGenerationOptions = detailGenerationOptions?.[kindName];
    const detailJSDocOptions = currentDetailGenerationOptions?.jsDocOptions || {};
    const detailAiServiceOptions = currentDetailGenerationOptions?.aiServiceOptions || {};
    const aiServiceOptions = {
        ...globalAiServiceOptions,
        ...detailAiServiceOptions
    };
    const jsDocOptions = {
        ...globalJSDocOptions,
        ...detailJSDocOptions
    };
    return {
        jsDocGeneratorService,
        sourceFile,
        jsDocOptions,
        aiServiceOptions,
        node,
        fileCacheManagerMap,
        isNodeInCache,
        esLint,
        logger
    };
}

class JSDocInitializer {
    config;
    sourceFile;
    /**
     * Конструктор класса JSDocInitializer.
     *
     * @param {JSDocInitializerConstructor<CurrentAIServiceOptions>} config - конфигурация инициализатора JSDoc
     * @param {SourceFile} sourceFile - исходный файл, для которого создаются JSDoc комментарии
     */
    constructor(config, sourceFile) {
        this.config = config;
        this.sourceFile = sourceFile;
    }
    /**
     * Создает JSDoc комментарий для интерфейса.
     *
     * @param {InterfaceDeclaration} node - узел AST интерфейса
     * @returns {string} - сгенерированный JSDoc комментарий
     */    createJSDocInterface=node => createJSDocInterface(getPrepareParams({
        config: this.config,
        sourceFile: this.sourceFile,
        node,
        kindName: "InterfaceDeclaration"
    }));
    /**
     * Создает JSDoc комментарий для функции.
     *
     * @param {FunctionDeclaration} node - узел AST функции
     * @returns {string} - сгенерированный JSDoc комментарий
     */
    createJSDocFunction=node => createJSDocFunction(getPrepareParams({
        config: this.config,
        sourceFile: this.sourceFile,
        node,
        kindName: "FunctionDeclaration"
    }));
    /**
     * Создает JSDoc комментарий для перечисления.
     *
     * @param {EnumDeclaration} node - узел AST перечисления
     * @returns {string} - сгенерированный JSDoc комментарий
     */
    createJSDocEnum=node => createJSDocEnum(getPrepareParams({
        config: this.config,
        sourceFile: this.sourceFile,
        node,
        kindName: "EnumDeclaration"
    }));
    /**
     * Создает JSDoc комментарий для псевдонима типа.
     *
     * @param {TypeAliasDeclaration} node - узел AST псевдонима типа
     * @returns {string} - сгенерированный JSDoc комментарий
     */
    createJSDocTypeAlias=node => createJSDocTypeAlias(getPrepareParams({
        config: this.config,
        sourceFile: this.sourceFile,
        node,
        kindName: "TypeAliasDeclaration"
    }));
    /**
     * Создает JSDoc комментарий для оператора объявления переменных.
     *
     * @param {VariableStatement} node - узел AST оператора объявления переменных
     * @returns {string} - сгенерированный JSDoc комментарий
     */
    createJSDocVariableStatement=node => createJSDocVariableStatement(getPrepareParams({
        config: this.config,
        sourceFile: this.sourceFile,
        node,
        kindName: "VariableStatement"
    }));
    /**
     * Создает JSDoc комментарий для класса.
     *
     * @param {ClassDeclaration} node - узел AST класса
     * @returns {string} - сгенерированный JSDoc комментарий
     */
    createJSDocClass=node => createJSDocClass(getPrepareParams({
        config: this.config,
        sourceFile: this.sourceFile,
        node,
        kindName: "ClassDeclaration"
    }));
}

/**
 * Инициализирует процесс генерации JSDoc комментариев для заданных исходных файлов проекта.
 *
 * @template CurrentAIServiceOptions - Тип опций для текущего AI сервиса.
 * @param {InitParams<CurrentAIServiceOptions>} params - Параметры инициализации, включающие в себя:
 * @param {ProjectOptions} params.projectOptions - Опции для создания проекта.
 * @param {ESLint.Options} params.esLintOptions - Опции для конфигурации ESLint.
 * @param {string[]} params.files - Массив путей к файлам, для которых будет выполнена генерация JSDoc.
 * @param {JSDocGeneratorService} params.jsDocGeneratorService - Сервис для генерации JSDoc.
 * @param {GlobalGenerationOptions} params.globalGenerationOptions - Глобальные опции генерации.
 * @param {DetailGenerationOptions} params.detailGenerationOptions - Детализированные опции генерации.
 * @returns {Promise<void>} - Возвращает Promise, который разрешается после завершения генерации JSDoc и сохранения изменений.
 */ async function init(params) {
    const {projectOptions, esLintOptions, files, jsDocGeneratorService, globalGenerationOptions, detailGenerationOptions} = params;
    const cache = new Cache({
        basePath: "./.cache",
        // (optional) Path where cache files are stored (default).
        ns: "my-namespace",
        // (optional) A grouping namespace for items.
        hash: "sha1"
    });
    const logger = winston.createLogger({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        transports: [ new winston.transports.Console ]
    });
    logger.info(`Запуск кодогенерации ${chalk.yellow("designexx JSDocGenerator")}`);
    const project = new Project(projectOptions);
    const esLint = new ESLint({
        ...esLintOptions,
        fix: true,
        overrideConfig: {
            files
        }
    });
    logger.info(chalk.yellow("Пытаюсь получить информацию из кэша..."));
    const fileCacheManagerMap = await createFileCacheManagerMap(cache);
    logger.info(fileCacheManagerMap.size === 0 ? chalk.gray("База кэша пуста") : chalk.green("Успешно загружена информация из кэша"));
    const config = {
        project,
        esLint,
        jsDocGeneratorService,
        globalGenerationOptions,
        detailGenerationOptions,
        fileCacheManagerMap,
        isNodeInCache,
        logger
    };
    const kinds = globalGenerationOptions?.kinds || [];
    const sourceFiles = project.addSourceFilesAtPaths(files);
    logger.info(`${chalk.gray("Файлов в проекте загружено: ")} ${chalk.bold(sourceFiles.length)}`);
    const sourceFilesJSDocProcess = sourceFiles.map((async sourceFile => {
        logger.info(`${chalk.gray("Обработка всех документируемых узлов в файле ")} ${chalk.bold(sourceFile.getFilePath())}`);
        const jsDocInitializer = new JSDocInitializer(config, sourceFile);
        const jsDocProviderRegistry = {
            [KindDeclarationNames.ClassDeclaration]: jsDocInitializer.createJSDocClass,
            [KindDeclarationNames.EnumDeclaration]: jsDocInitializer.createJSDocEnum,
            [KindDeclarationNames.InterfaceDeclaration]: jsDocInitializer.createJSDocInterface,
            [KindDeclarationNames.FunctionDeclaration]: jsDocInitializer.createJSDocFunction,
            [KindDeclarationNames.VariableStatement]: jsDocInitializer.createJSDocVariableStatement,
            [KindDeclarationNames.TypeAliasDeclaration]: jsDocInitializer.createJSDocTypeAlias
        };
        const extractedDeclarations = extractDeclarationsFromSourceFile(sourceFile);
        const allowedExtractedDeclarations = filterExtractedDeclarationsByKinds(extractedDeclarations, kinds);
        const listOfFlattenedJSDocProcess = flattenAndProcessDeclarations(jsDocProviderRegistry, allowedExtractedDeclarations);
        const processedDeclarations = await Promise.allSettled(listOfFlattenedJSDocProcess);
        const isDeclarationSucessProcessed = processedDeclarations.some(isPromiseResolvedAndTrue, false);
        if (isDeclarationSucessProcessed) {
            await sourceFile.save();
        }
        logger.info(`${chalk.green("Успешная обработка файла ")} ${chalk.bold(sourceFile.getFilePath())}`);
        return isDeclarationSucessProcessed;
    }));
    const sourceFilesJSDocProcessed = await Promise.allSettled(sourceFilesJSDocProcess);
    logger.info(chalk.green("Все файлы были обработаны."));
    const isSourceFileSuccessProcessed = sourceFilesJSDocProcessed.some(isPromiseResolvedAndTrue, false);
    if (isSourceFileSuccessProcessed) {
        logger.info(chalk.gray("Сохраняю все изменения в проекте..."));
        await project.save();
        logger.info(chalk.green("Проект успешно сохранен."));
        logger.info(chalk.gray("Отдаю код в ESLint для восстановления форматирования..."));
        const results = await esLint.lintFiles(files);
        logger.info(chalk.gray("Применяю изменения линтера к файлам"));
        await ESLint.outputFixes(results);
        logger.info(chalk.green("Линтинг был успешно завершен."));
        await saveJSDocProcessedInCache({
            cache,
            fileCacheManagerMap,
            projectOptions,
            kinds,
            files
        });
    }
}

/**
 * HTTP-клиент для выполнения запросов на сервер
 * @type {import("axios").AxiosInstance}
 */ const axiosClient = axios.create({
    baseURL: "http://localhost:3002"
});

/**
 * Асинхронная функция для создания JSDoc комментариев на основе переданных параметров.
 * @template CurrentAIServiceOptions - обобщенный тип для параметра aiServiceOptions
 * @param {string} url - URL для отправки POST запроса
 * @param {JSDocGeneratorServiceOptions} options - Опции генерации JSDoc комментариев
 * @param {CurrentAIServiceOptions} aiServiceOptions - Опции AI сервиса
 * @returns {Promise<string>} - Возвращает сгенерированные JSDoc комментарии в виде строки
 */ async function createJSDoc(url, options, aiServiceOptions) {
    /**
     * Деструктуризация опций генерации JSDoc комментариев
     */
    const {referencedSourceFiles, codeSnippet, sourceFile} = options;
    /**
     * Отправка POST запроса с данными для получения JSDoc комментариев
     */    const response = await axiosClient.post(url, {
        codeSnippet,
        sourceFile,
        referencedSourceFiles,
        aiServiceOptions
    });
    return response.data.code;
}

const jsDocGeneratorService = {
    /**
     * Создает JSDoc для интерфейса.
     * @param {Options} options - Опции для генерации JSDoc, которые могут включать в себя информацию о структуре и свойствах интерфейса.
     * @param {AiServiceOptions} aiServiceOptions - Опции сервиса искусственного интеллекта, используемые для улучшения генерации JSDoc, такие как настройки модели или параметры обработки.
     * @returns {string} - Сгенерированный JSDoc для интерфейса, который может быть использован для документирования кода.
     */
    createJSDocInterface(options, aiServiceOptions) {
        return createJSDoc("/interface", options, aiServiceOptions);
    },
    /**
     * Создает JSDoc для перечисления (enum).
     * @param {Options} options - Опции для генерации JSDoc, которые могут включать в себя информацию о значениях и описаниях перечисления.
     * @param {AiServiceOptions} aiServiceOptions - Опции сервиса искусственного интеллекта, используемые для улучшения генерации JSDoc.
     * @returns {string} - Сгенерированный JSDoc для перечисления (enum), полезный для документирования возможных значений и их значений.
     */
    createJSDocEnum(options, aiServiceOptions) {
        return createJSDoc("/enum", options, aiServiceOptions);
    },
    /**
     * Создает JSDoc для класса.
     * @param {Options} options - Опции для генерации JSDoc, которые могут включать в себя информацию о методах и свойствах класса.
     * @param {AiServiceOptions} aiServiceOptions - Опции сервиса искусственного интеллекта, используемые для улучшения генерации JSDoc.
     * @returns {string} - Сгенерированный JSDoc для класса, который может быть использован для документирования структуры и функциональности класса.
     */
    createJSDocClass(options, aiServiceOptions) {
        return createJSDoc("/class", options, aiServiceOptions);
    },
    /**
     * Создает JSDoc для псевдонима типа (type alias).
     * @param {Options} options - Опции для генерации JSDoc, которые могут включать в себя информацию о типах и их назначении.
     * @param {AiServiceOptions} aiServiceOptions - Опции сервиса искусственного интеллекта, используемые для улучшения генерации JSDoc.
     * @returns {string} - Сгенерированный JSDoc для псевдонима типа (type alias), полезный для документирования новых имен типов и их значений.
     */
    createJSDocTypeAlias(options, aiServiceOptions) {
        return createJSDoc("/type-alias", options, aiServiceOptions);
    },
    /**
     * Создает JSDoc для оператора объявления переменной (variable statement).
     * @param {Options} options - Опции для генерации JSDoc, которые могут включать в себя информацию о переменных и их значениях.
     * @param {AiServiceOptions} aiServiceOptions - Опции сервиса искусственного интеллекта, используемые для улучшения генерации JSDoc.
     * @returns {string} - Сгенерированный JSDoc для оператора объявления переменной (variable statement), полезный для документирования переменных и их использования.
     */
    createJSDocVariableStatement(options, aiServiceOptions) {
        return createJSDoc("/variable-statement", options, aiServiceOptions);
    },
    /**
     * Создает JSDoc для функции.
     * @param {Options} options - Опции для генерации JSDoc, которые могут включать в себя информацию о параметрах и возвращаемых значениях функции.
     * @param {AiServiceOptions} aiServiceOptions - Опции сервиса искусственного интеллекта, используемые для улучшения генерации JSDoc.
     * @returns {string} - Сгенерированный JSDoc для функции, который может быть использован для документирования сигнатуры и поведения функции.
     */
    createJSDocFunction(options, aiServiceOptions) {
        return createJSDoc("/function", options, aiServiceOptions);
    }
};

init({
    files: [ "src/**/*.{ts,tsx}" ],
    ignoredFiles: [ "src/hi.tsx" ],
    jsDocGeneratorService,
    projectOptions: {
        tsConfigFilePath: "tsconfig.json"
    }
});
