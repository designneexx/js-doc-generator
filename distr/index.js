"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  InsertModeJSDocTypes: () => InsertModeJSDocTypes,
  KindDeclarationNames: () => KindDeclarationNames,
  init: () => init
});
module.exports = __toCommonJS(src_exports);

// src/utils/init.ts
var import_chalk2 = __toESM(require("chalk"));
var import_eslint = require("eslint");
var import_file_system_cache = require("file-system-cache");
var import_ts_morph7 = require("ts-morph");
var import_winston = __toESM(require("winston"));

// src/types/common.ts
var InsertModeJSDocTypes = /* @__PURE__ */ ((InsertModeJSDocTypes2) => {
  InsertModeJSDocTypes2[InsertModeJSDocTypes2["ReplaceMode"] = 0] = "ReplaceMode";
  InsertModeJSDocTypes2[InsertModeJSDocTypes2["AppendMode"] = 1] = "AppendMode";
  return InsertModeJSDocTypes2;
})(InsertModeJSDocTypes || {});
var KindDeclarationNames = /* @__PURE__ */ ((KindDeclarationNames2) => {
  KindDeclarationNames2["FunctionDeclaration"] = "FunctionDeclaration";
  KindDeclarationNames2["VariableStatement"] = "VariableStatement";
  KindDeclarationNames2["EnumDeclaration"] = "EnumDeclaration";
  KindDeclarationNames2["TypeAliasDeclaration"] = "TypeAliasDeclaration";
  KindDeclarationNames2["InterfaceDeclaration"] = "InterfaceDeclaration";
  KindDeclarationNames2["ClassDeclaration"] = "ClassDeclaration";
  return KindDeclarationNames2;
})(KindDeclarationNames || {});

// src/utils/helpers/getCacheList.ts
function getCacheList(entry) {
  const [key, map] = entry;
  return {
    key,
    value: Array.from(map.values())
  };
}

// src/utils/FileCacheManagerMap.ts
var FileCacheManagerMap = class extends Map {
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
};

// src/utils/helpers/createFileCacheManagerMap.ts
async function createFileCacheManagerMap(cache) {
  const serializedCache = await cache.load();
  const { files } = serializedCache;
  const codeCacheHashMap = new FileCacheManagerMap();
  const flatFiles = files.flatMap((item) => item.value);
  for (const serializedFile of flatFiles) {
    const { fileSourceCodeHash, nodeSourceCodeHash } = serializedFile;
    const nodesSet = codeCacheHashMap.get(fileSourceCodeHash) || /* @__PURE__ */ new Map();
    nodesSet.set(nodeSourceCodeHash, { fileSourceCodeHash, nodeSourceCodeHash });
    codeCacheHashMap.set(fileSourceCodeHash, nodesSet);
  }
  return codeCacheHashMap;
}

// src/utils/helpers/extractDeclarationsFromSourceFile.ts
function extractDeclarationsFromSourceFile(sourceFile) {
  const functions = sourceFile.getFunctions();
  const variableStatements = sourceFile.getVariableStatements();
  const enums = sourceFile.getEnums();
  const typeAliases = sourceFile.getTypeAliases();
  const interfaces = sourceFile.getInterfaces();
  const classes = sourceFile.getClasses();
  const extractedDeclarations = [
    {
      kind: "InterfaceDeclaration" /* InterfaceDeclaration */,
      nodes: interfaces
    },
    {
      kind: "FunctionDeclaration" /* FunctionDeclaration */,
      nodes: functions
    },
    {
      kind: "EnumDeclaration" /* EnumDeclaration */,
      nodes: enums
    },
    {
      kind: "TypeAliasDeclaration" /* TypeAliasDeclaration */,
      nodes: typeAliases
    },
    {
      kind: "VariableStatement" /* VariableStatement */,
      nodes: variableStatements
    },
    {
      kind: "ClassDeclaration" /* ClassDeclaration */,
      nodes: classes
    }
  ];
  return extractedDeclarations;
}

// src/utils/helpers/filterExtractedDeclarationsByKinds.ts
function filterExtractedDeclarationsByKinds(extractedDeclarations, kinds) {
  function filter(value) {
    return kinds.length === 0 || kinds.includes(value.kind);
  }
  return extractedDeclarations.filter(filter);
}

// src/utils/helpers/flattentAndProcessDeclarations.ts
function flattenAndProcessDeclarations(jsDocProviderRegistry, extractedDeclarations) {
  function getJSDocProviders(kind, nodes) {
    return nodes.map(jsDocProviderRegistry[kind]);
  }
  function flattenDeclarations2(item) {
    return getJSDocProviders(item.kind, item.nodes);
  }
  return extractedDeclarations.flatMap(flattenDeclarations2);
}

// src/utils/helpers/getCacheFromNodeSourceFile.ts
var import_sha1 = __toESM(require("crypto-js/sha1.js"));
function getCacheFromNodeSourceFile(params) {
  const { sourceFile, node, fileCacheManagerMap } = params;
  const sourceCode = sourceFile.getFullText();
  const codeSnippet = node.getFullText();
  const hashDigestCodeSnippet = (0, import_sha1.default)(codeSnippet);
  const hashDigestSourceCode = (0, import_sha1.default)(sourceCode);
  const hashCodeSnippet = hashDigestCodeSnippet.toString();
  const hashSourceCode = hashDigestSourceCode.toString();
  const codeSnippetHashMap = fileCacheManagerMap.get(hashSourceCode) || /* @__PURE__ */ new Map();
  return { hashCodeSnippet, hashSourceCode, codeSnippetHashMap };
}

// src/utils/helpers/isNodeInCache.ts
function isNodeInCache(nodeCacheParams) {
  const { node, fileCacheManagerMap, sourceFile } = nodeCacheParams;
  const data = getCacheFromNodeSourceFile({ node, sourceFile, fileCacheManagerMap });
  const { codeSnippetHashMap, hashCodeSnippet } = data;
  const isIdentityCache = codeSnippetHashMap.has(hashCodeSnippet);
  return isIdentityCache;
}

// src/utils/helpers/isPromiseResolvedAndTrue.ts
function isPromiseResolvedAndTrue(item) {
  if (item.status === "fulfilled") {
    return item.value;
  }
  return false;
}

// src/utils/helpers/saveJSDocsProcessedInCache.ts
var import_ts_morph = require("ts-morph");

// src/utils/helpers/flattenDeclarations.ts
function flattenDeclarations(value) {
  return value.nodes;
}

// src/utils/helpers/saveJSDocsProcessedInCache.ts
function saveJSDocProcessedInCache(params) {
  const { projectOptions, files, kinds, fileCacheManagerMap, cache } = params;
  const project = new import_ts_morph.Project(projectOptions);
  const sourceFiles = project.addSourceFilesAtPaths(files);
  sourceFiles.forEach((sourceFile) => {
    const extractedDeclarations = extractDeclarationsFromSourceFile(sourceFile);
    const allowedExtractedDeclarations = filterExtractedDeclarationsByKinds(
      extractedDeclarations,
      kinds
    );
    allowedExtractedDeclarations.flatMap(flattenDeclarations).forEach((node) => {
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

// src/utils/helpers/initJSDocFactory.ts
var import_chalk = __toESM(require("chalk"));
var import_ts_morph6 = require("ts-morph");

// src/utils/helpers/getAllJSDocableNodesFlatFactory.ts
var import_ts_morph2 = require("ts-morph");
function getAllJSDocableNodesFlatFactory(depthNodeWeakMap) {
  return (node) => {
    const children = node.getChildren();
    function deepGetJSDocable(depth) {
      return (acc, deepNode) => {
        const deepChildren = deepNode.getChildren();
        const deepJSDocableNodes = getJSDocables(
          import_ts_morph2.Node.isJSDocable(deepNode) && [
            import_ts_morph2.SyntaxKind.SingleLineCommentTrivia,
            import_ts_morph2.SyntaxKind.MultiLineCommentTrivia
          ].every((kind) => !deepNode.isKind(kind)) ? depth + 1 : depth,
          deepChildren
        );
        if (import_ts_morph2.Node.isJSDocable(deepNode) && [import_ts_morph2.SyntaxKind.SingleLineCommentTrivia, import_ts_morph2.SyntaxKind.MultiLineCommentTrivia].every(
          (kind) => !deepNode.isKind(kind)
        )) {
          depthNodeWeakMap?.set(deepNode, depth);
          return [...acc, deepNode, ...deepJSDocableNodes];
        }
        return [...acc, ...deepJSDocableNodes];
      };
    }
    function getJSDocables(depth, nodes) {
      return nodes.reduce(deepGetJSDocable(depth), []);
    }
    const jsDocableNodes = getJSDocables(1, children);
    let allJSDocableNodes = jsDocableNodes;
    if (import_ts_morph2.Node.isJSDocable(node) && [import_ts_morph2.SyntaxKind.SingleLineCommentTrivia, import_ts_morph2.SyntaxKind.MultiLineCommentTrivia].every(
      (kind) => !node.isKind(kind)
    )) {
      depthNodeWeakMap?.set(node, 0);
      allJSDocableNodes = [node, ...jsDocableNodes];
    }
    return allJSDocableNodes;
  };
}

// src/utils/helpers/getJSDocStructure.ts
function getJSDocStructure(jsDoc) {
  return jsDoc.getStructure();
}

// src/utils/helpers/removeJSDoc.ts
function removeJSDoc(node) {
  return node.remove();
}

// src/utils/helpers/applyJSDoc.ts
async function applyJSDoc(params) {
  const { node, jsDocs, jsDocOptions } = params;
  const {
    isShowJSDocDescription = true,
    isShowJSDocTags = true,
    allowedJSDocTags = [],
    disabledJSDocTags = [],
    mode = 0 /* ReplaceMode */,
    depth = Infinity
  } = jsDocOptions;
  const depthNodeWeakMap = /* @__PURE__ */ new Map();
  const getAllJSDocableNodesFlat = getAllJSDocableNodesFlatFactory(depthNodeWeakMap);
  const allJSDocableNodes = getAllJSDocableNodesFlat(node);
  function filterJSDocTags(jsDocTagStructure) {
    const { tagName } = jsDocTagStructure;
    if (allowedJSDocTags.length) {
      return allowedJSDocTags.includes(tagName);
    }
    if (disabledJSDocTags.length) {
      return !disabledJSDocTags.includes(tagName);
    }
    return true;
  }
  function formatJSDocStructure(acc, jsDocStructure) {
    const data = { ...jsDocStructure };
    const { tags = [] } = data;
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
    return [...acc, data];
  }
  function appendJSDocsWithMode(jsDocsStructure, deepNode) {
    const currentDepth = depthNodeWeakMap.get(deepNode) || 0;
    const nodeJSDocs = deepNode.getJsDocs();
    const filteredJSDocs = jsDocsStructure.filter((_, index) => !nodeJSDocs[index]);
    if (currentDepth > depth) {
      return;
    }
    if (mode === 0 /* ReplaceMode */) {
      nodeJSDocs.forEach(removeJSDoc);
      deepNode.addJsDocs(jsDocsStructure.slice(0, 1));
    } else {
      deepNode.addJsDocs(filteredJSDocs.slice(0, 1));
    }
  }
  allJSDocableNodes.forEach((deepNode, index) => {
    const jsDocableNode = jsDocs.at(index);
    if (!jsDocableNode) return;
    if (jsDocableNode.getText() !== deepNode.getText()) return;
    const jsDocsNode = jsDocableNode?.getJsDocs() || [];
    const jsDocStructure = jsDocsNode.map(getJSDocStructure);
    const filteredJSDocStructure = jsDocStructure.reduce(formatJSDocStructure, []);
    appendJSDocsWithMode(filteredJSDocStructure, deepNode);
  });
}

// src/utils/helpers/cloneNodeAsFileFactory.ts
var import_ts_morph3 = require("ts-morph");
var import_uuid = require("uuid");
function cloneNodeAsFileFactory(project) {
  const currentProject = project || new import_ts_morph3.Project();
  return (value) => {
    const copiedSourceFile = currentProject.createSourceFile(
      `${(0, import_uuid.v4)()}.tsx`,
      value.getFullText()
    );
    return copiedSourceFile;
  };
}

// src/utils/helpers/getJSDocableNodesFromCodeSnippet.ts
var import_ts_morph4 = require("ts-morph");
var import_uuid2 = require("uuid");
function getJSDocableNodesFromCodeSnippet(codeSnippet) {
  const project = new import_ts_morph4.Project();
  const sourceFile = project.createSourceFile(`${(0, import_uuid2.v4)()}.tsx`, codeSnippet);
  const children = sourceFile.getChildren();
  return children.flatMap(getAllJSDocableNodesFlatFactory());
}

// src/consts/formatCodeSettings.ts
var import_ts_morph5 = require("ts-morph");
var formatCodeSettings = {
  ensureNewLineAtEndOfFile: false,
  baseIndentSize: 0,
  indentSize: 0,
  convertTabsToSpaces: false,
  newLineCharacter: "",
  indentStyle: import_ts_morph5.ts.IndentStyle.None,
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
  semicolons: import_ts_morph5.ts.SemicolonPreference.Insert,
  indentSwitchCase: false
};

// src/utils/helpers/getMinifySourceCode.ts
function getMinifySourceCode(sourceFile) {
  sourceFile.formatText(formatCodeSettings);
  const sourceCode = sourceFile.getText();
  const filePath = sourceFile.getFilePath();
  return { sourceCode, filePath };
}

// src/utils/helpers/isProjectDependency.ts
function isProjectDependency(sourceFile) {
  return !sourceFile.isFromExternalLibrary();
}

// src/utils/helpers/initJSDocFactory.ts
function initJSDocFactory(factoryParams) {
  const { applyJSDoc: applyJSDoc2 = applyJSDoc, getJSDocableCodeSnippet } = factoryParams;
  const project = new import_ts_morph6.Project();
  const cloneNodeAsFile = cloneNodeAsFileFactory(project);
  return async (prepareParams) => {
    const {
      jsDocGeneratorService,
      node,
      jsDocOptions,
      sourceFile,
      aiServiceOptions,
      fileCacheManagerMap,
      isNodeInCache: isNodeInCache2,
      esLint,
      logger
    } = prepareParams;
    logger.info(`\u041E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u044E \u0443\u0437\u0435\u043B: ${import_chalk.default.bgBlue(node.getKindName())}`);
    const hasCached = isNodeInCache2({ node, sourceFile, fileCacheManagerMap });
    logger.info(
      hasCached ? import_chalk.default.green("\u0414\u0430\u043D\u043D\u044B\u0439 \u0443\u0437\u0435\u043B \u0443\u0436\u0435 \u0435\u0441\u0442\u044C \u0432 \u043A\u044D\u0448\u0435, \u043F\u0440\u043E\u043F\u0443\u0441\u043A\u0430\u044E \u0435\u0433\u043E") : import_chalk.default.italic("\u0423\u0437\u043B\u0430 \u0435\u0449\u0435 \u043D\u0435\u0442 \u0432 \u043A\u044D\u0448\u0435")
    );
    if (hasCached) {
      return false;
    }
    const clonedSourceFile = cloneNodeAsFile(sourceFile);
    const codeSnippet = node.getText();
    const referencedSourceFiles = sourceFile.getReferencedSourceFiles();
    const referencedMinifiedSourceCode = referencedSourceFiles.filter(isProjectDependency).map(cloneNodeAsFile).map(getMinifySourceCode);
    const minifiedSourceFile = getMinifySourceCode(clonedSourceFile);
    logger.info(import_chalk.default.underline("\u0414\u0435\u043B\u0430\u044E \u0437\u0430\u043F\u0440\u043E\u0441 \u0432 \u0441\u0435\u0440\u0432\u0438\u0441 \u043F\u043E \u043A\u043E\u0434\u043E\u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 JSDoc"));
    const jsDocableCodeSnippet = await getJSDocableCodeSnippet({
      jsDocGeneratorService,
      jsDocGeneratorServiceOptions: {
        codeSnippet,
        sourceFile: minifiedSourceFile,
        referencedSourceFiles: referencedMinifiedSourceCode
      },
      aiServiceOptions
    });
    logger.info(import_chalk.default.green("\u0423\u0441\u043F\u0435\u0448\u043D\u044B\u0439 \u043E\u0442\u0432\u0435\u0442 \u043E\u0442 \u0441\u0435\u0440\u0432\u0438\u0441\u0430 \u043F\u043E \u043A\u043E\u0434\u043E\u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438."));
    logger.info(
      `${import_chalk.default.underline("\u0424\u043E\u0440\u043C\u0430\u0442\u0438\u0440\u0443\u044E \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442 \u043A\u043E\u0434\u0430 \u0447\u0435\u0440\u0435\u0437 ")} ${import_chalk.default.yellow("ESLint")}`
    );
    const [lintResult] = await esLint.lintText(jsDocableCodeSnippet);
    logger.info(import_chalk.default.green("\u041A\u043E\u0434 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0444\u043E\u0440\u043C\u0430\u0442\u0438\u0440\u043E\u0432\u0430\u043D."));
    const jsDocs = getJSDocableNodesFromCodeSnippet(lintResult?.output || jsDocableCodeSnippet);
    applyJSDoc2({ node, jsDocs, jsDocOptions });
    logger.info(
      `${import_chalk.default.green("JSDoc \u0431\u044B\u043B \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D \u0432 \u0443\u0437\u0435\u043B: ")} ${import_chalk.default.bgBlue(node.getKindName())}`
    );
    return true;
  };
}

// src/utils/nodes/createJSDocClass.ts
var createJSDocClass = initJSDocFactory({
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
    const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } = params;
    return jsDocGeneratorService.createJSDocClass(
      jsDocGeneratorServiceOptions,
      aiServiceOptions
    );
  }
});

// src/utils/nodes/createJSDocEnum.ts
var createJSDocEnum = initJSDocFactory({
  kind: "EnumDeclaration",
  async getJSDocableCodeSnippet(params) {
    const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } = params;
    return jsDocGeneratorService.createJSDocEnum(
      jsDocGeneratorServiceOptions,
      aiServiceOptions
    );
  }
});

// src/utils/nodes/createJSDocFunction.ts
var createJSDocFunction = initJSDocFactory({
  kind: "FunctionDeclaration",
  async getJSDocableCodeSnippet(params) {
    const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } = params;
    return jsDocGeneratorService.createJSDocFunction(
      jsDocGeneratorServiceOptions,
      aiServiceOptions
    );
  }
});

// src/utils/nodes/createJSDocInterface.ts
var createJSDocInterface = initJSDocFactory({
  kind: "InterfaceDeclaration",
  async getJSDocableCodeSnippet(params) {
    const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } = params;
    return jsDocGeneratorService.createJSDocInterface(
      jsDocGeneratorServiceOptions,
      aiServiceOptions
    );
  }
});

// src/utils/nodes/createJSDocTypeAlias.ts
var createJSDocTypeAlias = initJSDocFactory({
  kind: "TypeAliasDeclaration",
  async getJSDocableCodeSnippet(params) {
    const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } = params;
    return jsDocGeneratorService.createJSDocTypeAlias(
      jsDocGeneratorServiceOptions,
      aiServiceOptions
    );
  }
});

// src/utils/nodes/createJSDocVariableStatement.ts
var createJSDocVariableStatement = initJSDocFactory({
  kind: "VariableStatement",
  /**
   * Асинхронная функция для получения фрагмента кода с JSDoc комментариями.
   *
   * @param {CreateJSDocVariableStatementParams} params - Параметры, необходимые для генерации JSDoc комментариев.
   * @returns {Promise<string>} Возвращает промис, который разрешается в строку с фрагментом кода, содержащим JSDoc комментарии.
   */
  async getJSDocableCodeSnippet(params) {
    const { jsDocGeneratorService, jsDocGeneratorServiceOptions, aiServiceOptions } = params;
    return jsDocGeneratorService.createJSDocVariableStatement(
      jsDocGeneratorServiceOptions,
      aiServiceOptions
    );
  }
});

// src/utils/JSDocInitializer.ts
function getPrepareParams(params) {
  const { config, sourceFile, kindName, node } = params;
  const {
    detailGenerationOptions,
    globalGenerationOptions,
    jsDocGeneratorService,
    fileCacheManagerMap,
    isNodeInCache: isNodeInCache2,
    esLint,
    logger
  } = config;
  const { aiServiceOptions: globalAiServiceOptions, jsDocOptions: globalJSDocOptions } = globalGenerationOptions || {};
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
    isNodeInCache: isNodeInCache2,
    esLint,
    logger
  };
}
var JSDocInitializer = class {
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
   */
  createJSDocInterface = (node) => {
    return createJSDocInterface(
      getPrepareParams({
        config: this.config,
        sourceFile: this.sourceFile,
        node,
        kindName: "InterfaceDeclaration"
      })
    );
  };
  /**
   * Создает JSDoc комментарий для функции.
   *
   * @param {FunctionDeclaration} node - узел AST функции
   * @returns {string} - сгенерированный JSDoc комментарий
   */
  createJSDocFunction = (node) => {
    return createJSDocFunction(
      getPrepareParams({
        config: this.config,
        sourceFile: this.sourceFile,
        node,
        kindName: "FunctionDeclaration"
      })
    );
  };
  /**
   * Создает JSDoc комментарий для перечисления.
   *
   * @param {EnumDeclaration} node - узел AST перечисления
   * @returns {string} - сгенерированный JSDoc комментарий
   */
  createJSDocEnum = (node) => {
    return createJSDocEnum(
      getPrepareParams({
        config: this.config,
        sourceFile: this.sourceFile,
        node,
        kindName: "EnumDeclaration"
      })
    );
  };
  /**
   * Создает JSDoc комментарий для псевдонима типа.
   *
   * @param {TypeAliasDeclaration} node - узел AST псевдонима типа
   * @returns {string} - сгенерированный JSDoc комментарий
   */
  createJSDocTypeAlias = (node) => {
    return createJSDocTypeAlias(
      getPrepareParams({
        config: this.config,
        sourceFile: this.sourceFile,
        node,
        kindName: "TypeAliasDeclaration"
      })
    );
  };
  /**
   * Создает JSDoc комментарий для оператора объявления переменных.
   *
   * @param {VariableStatement} node - узел AST оператора объявления переменных
   * @returns {string} - сгенерированный JSDoc комментарий
   */
  createJSDocVariableStatement = (node) => {
    return createJSDocVariableStatement(
      getPrepareParams({
        config: this.config,
        sourceFile: this.sourceFile,
        node,
        kindName: "VariableStatement"
      })
    );
  };
  /**
   * Создает JSDoc комментарий для класса.
   *
   * @param {ClassDeclaration} node - узел AST класса
   * @returns {string} - сгенерированный JSDoc комментарий
   */
  createJSDocClass = (node) => {
    return createJSDocClass(
      getPrepareParams({
        config: this.config,
        sourceFile: this.sourceFile,
        node,
        kindName: "ClassDeclaration"
      })
    );
  };
};

// src/utils/init.ts
async function init(params) {
  const {
    projectOptions,
    esLintOptions,
    files,
    jsDocGeneratorService,
    globalGenerationOptions,
    detailGenerationOptions
  } = params;
  const cache = new import_file_system_cache.Cache({
    basePath: "./.cache",
    // (optional) Path where cache files are stored (default).
    ns: "my-namespace",
    // (optional) A grouping namespace for items.
    hash: "sha1"
    // (optional) A hashing algorithm used within the cache key.
  });
  const logger = import_winston.default.createLogger({
    format: import_winston.default.format.combine(import_winston.default.format.colorize(), import_winston.default.format.simple()),
    transports: [new import_winston.default.transports.Console()]
  });
  logger.info(`\u0417\u0430\u043F\u0443\u0441\u043A \u043A\u043E\u0434\u043E\u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 ${import_chalk2.default.yellow("designexx JSDocGenerator")}`);
  const project = new import_ts_morph7.Project(projectOptions);
  const esLint = new import_eslint.ESLint({ ...esLintOptions, fix: true, overrideConfig: { files } });
  logger.info(import_chalk2.default.yellow("\u041F\u044B\u0442\u0430\u044E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044E \u0438\u0437 \u043A\u044D\u0448\u0430..."));
  const fileCacheManagerMap = await createFileCacheManagerMap(cache);
  logger.info(
    fileCacheManagerMap.size === 0 ? import_chalk2.default.gray("\u0411\u0430\u0437\u0430 \u043A\u044D\u0448\u0430 \u043F\u0443\u0441\u0442\u0430") : import_chalk2.default.green("\u0423\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u0430 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u0438\u0437 \u043A\u044D\u0448\u0430")
  );
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
  logger.info(`${import_chalk2.default.gray("\u0424\u0430\u0439\u043B\u043E\u0432 \u0432 \u043F\u0440\u043E\u0435\u043A\u0442\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E: ")} ${import_chalk2.default.bold(sourceFiles.length)}`);
  const sourceFilesJSDocProcess = sourceFiles.map(async (sourceFile) => {
    logger.info(
      `${import_chalk2.default.gray("\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0432\u0441\u0435\u0445 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0438\u0440\u0443\u0435\u043C\u044B\u0445 \u0443\u0437\u043B\u043E\u0432 \u0432 \u0444\u0430\u0439\u043B\u0435 ")} ${import_chalk2.default.bold(sourceFile.getFilePath())}`
    );
    const jsDocInitializer = new JSDocInitializer(config, sourceFile);
    const jsDocProviderRegistry = {
      ["ClassDeclaration" /* ClassDeclaration */]: jsDocInitializer.createJSDocClass,
      ["EnumDeclaration" /* EnumDeclaration */]: jsDocInitializer.createJSDocEnum,
      ["InterfaceDeclaration" /* InterfaceDeclaration */]: jsDocInitializer.createJSDocInterface,
      ["FunctionDeclaration" /* FunctionDeclaration */]: jsDocInitializer.createJSDocFunction,
      ["VariableStatement" /* VariableStatement */]: jsDocInitializer.createJSDocVariableStatement,
      ["TypeAliasDeclaration" /* TypeAliasDeclaration */]: jsDocInitializer.createJSDocTypeAlias
    };
    const extractedDeclarations = extractDeclarationsFromSourceFile(sourceFile);
    const allowedExtractedDeclarations = filterExtractedDeclarationsByKinds(
      extractedDeclarations,
      kinds
    );
    const listOfFlattenedJSDocProcess = flattenAndProcessDeclarations(
      jsDocProviderRegistry,
      allowedExtractedDeclarations
    );
    const processedDeclarations = await Promise.allSettled(listOfFlattenedJSDocProcess);
    const isDeclarationSucessProcessed = processedDeclarations.some(
      isPromiseResolvedAndTrue,
      false
    );
    if (isDeclarationSucessProcessed) {
      await sourceFile.save();
    }
    logger.info(
      `${import_chalk2.default.green("\u0423\u0441\u043F\u0435\u0448\u043D\u0430\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0444\u0430\u0439\u043B\u0430 ")} ${import_chalk2.default.bold(sourceFile.getFilePath())}`
    );
    return isDeclarationSucessProcessed;
  });
  const sourceFilesJSDocProcessed = await Promise.allSettled(sourceFilesJSDocProcess);
  logger.info(import_chalk2.default.green("\u0412\u0441\u0435 \u0444\u0430\u0439\u043B\u044B \u0431\u044B\u043B\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u044B."));
  const isSourceFileSuccessProcessed = sourceFilesJSDocProcessed.some(
    isPromiseResolvedAndTrue,
    false
  );
  if (isSourceFileSuccessProcessed) {
    logger.info(import_chalk2.default.gray("\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u044E \u0432\u0441\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0432 \u043F\u0440\u043E\u0435\u043A\u0442\u0435..."));
    await project.save();
    logger.info(import_chalk2.default.green("\u041F\u0440\u043E\u0435\u043A\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D."));
    logger.info(import_chalk2.default.gray("\u041E\u0442\u0434\u0430\u044E \u043A\u043E\u0434 \u0432 ESLint \u0434\u043B\u044F \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0444\u043E\u0440\u043C\u0430\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F..."));
    const results = await esLint.lintFiles(files);
    logger.info(import_chalk2.default.gray("\u041F\u0440\u0438\u043C\u0435\u043D\u044F\u044E \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043B\u0438\u043D\u0442\u0435\u0440\u0430 \u043A \u0444\u0430\u0439\u043B\u0430\u043C"));
    await import_eslint.ESLint.outputFixes(results);
    logger.info(import_chalk2.default.green("\u041B\u0438\u043D\u0442\u0438\u043D\u0433 \u0431\u044B\u043B \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D."));
    await saveJSDocProcessedInCache({
      cache,
      fileCacheManagerMap,
      projectOptions,
      kinds,
      files
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InsertModeJSDocTypes,
  KindDeclarationNames,
  init
});
