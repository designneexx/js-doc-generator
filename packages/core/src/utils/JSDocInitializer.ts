import {
    ClassDeclaration,
    EnumDeclaration,
    FunctionDeclaration,
    InterfaceDeclaration,
    Project,
    SourceFile,
    SyntaxKind,
    TypeAliasDeclaration,
    VariableStatement
} from 'ts-morph';
import winston from 'winston';
import type {
    AIServiceOptions,
    ASTJSDocableNode,
    DetailGenerationOptions,
    GenerationOptions,
    IsNodeInCache,
    JSDocGeneratorService,
    PrepareAndApplyJSDoc
} from '../types/common';
import { FileCacheManagerMap } from './FileCacheManagerMap';
import { createJSDocClass } from './nodes/createJSDocClass';
import { createJSDocEnum } from './nodes/createJSDocEnum';
import { createJSDocFunction } from './nodes/createJSDocFunction';
import { createJSDocInterface } from './nodes/createJSDocInterface';
import { createJSDocTypeAlias } from './nodes/createJSDocTypeAlias';
import { createJSDocVariableStatement } from './nodes/createJSDocVariableStatement';

/**
 * Интерфейс конструктора инициализатора JSDoc.
 * Отвечает за создание экземпляра, который используется для генерации JSDoc-комментариев.
 */
export interface JSDocInitializerConstructor<
    CurrentAIServiceOptions extends AIServiceOptions = AIServiceOptions
> {
    /**
     * Ссылка на проект, представляющий собой контекст, в котором происходит
     * генерация JSDoc. Может включать информацию о структуре и конфигурации проекта.
     */
    project: Project;
    /**
     * Ссылка на сервис генерации JSDoc, который отвечает за создание
     * и управление JSDoc-комментариями на основе предоставленных данных и опций.
     */
    jsDocGeneratorService: JSDocGeneratorService<CurrentAIServiceOptions>;
    /**
     * Опции генерации деталей, которые могут быть использованы для
     * настройки специфических аспектов процесса генерации JSDoc.
     * Необязательное поле.
     */
    detailGenerationOptions?: DetailGenerationOptions<CurrentAIServiceOptions>;
    /**
     * Глобальные опции генерации, которые применяются ко всему процессу
     * генерации JSDoc и могут влиять на его поведение и результаты.
     * Необязательное поле.
     */
    globalGenerationOptions?: GenerationOptions<CurrentAIServiceOptions>;

    /**
     * Карта менеджеров кэша файлов, используемых для хранения информации о файлах.
     */
    fileCacheManagerMap: FileCacheManagerMap;

    /**
     * Функция, проверяющая наличие узла в кэше.
     */
    isNodeInCache: IsNodeInCache;

    /**
     * Экземпляр логгера winston для записи логов и отладочной информации.
     */
    logger: winston.Logger;
}

/**
 * Интерфейс для получения параметров подготовки данных JSDoc.
 */
interface GetPrepareParams<
    CurrentNode extends ASTJSDocableNode = ASTJSDocableNode,
    CurrentAIServiceOptions extends AIServiceOptions = AIServiceOptions
> {
    /**
     * Конфигурация для инициализации JSDoc.
     *
     * @type {JSDocInitializerConstructor<CurrentAIServiceOptions>}
     */
    config: JSDocInitializerConstructor<CurrentAIServiceOptions>;
    /**
     * Исходный файл, для которого выполняется подготовка данных.
     *
     * @type {SourceFile}
     */
    sourceFile: SourceFile;
    /**
     * Название типа узла синтаксического дерева, определенное в перечислении SyntaxKind.
     *
     * @type {keyof typeof SyntaxKind}
     */
    kindName: keyof typeof SyntaxKind;
    /**
     * Текущий узел с JSDoc.
     *
     * @type {CurrentNode}
     */
    node: CurrentNode;
}

/**
 * Функция для подготовки параметров на основе входных данных.
 * @template CurrentNode - Тип узла AST, который содержит JSDoc.
 * @template CurrentAIServiceOptions - Тип опций сервиса AI.
 * @param {GetPrepareParams<CurrentNode, CurrentAIServiceOptions>} params - Параметры для подготовки.
 * @returns {PrepareAndApplyJSDoc<CurrentNode, CurrentAIServiceOptions>} - Подготовленные параметры для применения JSDoc.
 */
function getPrepareParams<
    CurrentNode extends ASTJSDocableNode = ASTJSDocableNode,
    CurrentAIServiceOptions extends AIServiceOptions = AIServiceOptions
>(
    params: GetPrepareParams<CurrentNode, CurrentAIServiceOptions>
): PrepareAndApplyJSDoc<CurrentNode, CurrentAIServiceOptions> {
    const { config, sourceFile, kindName, node } = params;
    const {
        detailGenerationOptions,
        globalGenerationOptions,
        jsDocGeneratorService,
        fileCacheManagerMap,
        isNodeInCache,
        logger
    } = config;
    const { aiServiceOptions: globalAiServiceOptions, jsDocOptions: globalJSDocOptions } =
        globalGenerationOptions || {};
    const currentDetailGenerationOptions = detailGenerationOptions?.[kindName];
    const detailJSDocOptions = currentDetailGenerationOptions?.jsDocOptions || {};
    const detailAiServiceOptions = currentDetailGenerationOptions?.aiServiceOptions || {};
    const aiServiceOptions = {
        ...globalAiServiceOptions,
        ...detailAiServiceOptions
    } as CurrentAIServiceOptions;
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
        logger
    };
}

/**
 * Класс JSDocInitializer представляет собой инициализатор для создания JSDoc комментариев.
 * @template CurrentAIServiceOptions - текущие опции сервиса AI
 */
export class JSDocInitializer<CurrentAIServiceOptions extends AIServiceOptions = AIServiceOptions> {
    /**
     * Конструктор класса JSDocInitializer.
     *
     * @param {JSDocInitializerConstructor<CurrentAIServiceOptions>} config - конфигурация инициализатора JSDoc
     * @param {SourceFile} sourceFile - исходный файл, для которого создаются JSDoc комментарии
     */
    constructor(
        public readonly config: JSDocInitializerConstructor<CurrentAIServiceOptions>,
        public readonly sourceFile: SourceFile
    ) {}

    /**
     * Создает JSDoc комментарий для интерфейса.
     *
     * @param {InterfaceDeclaration} node - узел AST интерфейса
     * @returns {string} - сгенерированный JSDoc комментарий
     */
    createJSDocInterface = (node: InterfaceDeclaration): Promise<boolean> => {
        return createJSDocInterface(
            getPrepareParams({
                config: this.config,
                sourceFile: this.sourceFile,
                node,
                kindName: 'InterfaceDeclaration'
            })
        );
    };

    /**
     * Создает JSDoc комментарий для функции.
     *
     * @param {FunctionDeclaration} node - узел AST функции
     * @returns {string} - сгенерированный JSDoc комментарий
     */
    createJSDocFunction = (node: FunctionDeclaration): Promise<boolean> => {
        return createJSDocFunction(
            getPrepareParams({
                config: this.config,
                sourceFile: this.sourceFile,
                node,
                kindName: 'FunctionDeclaration'
            })
        );
    };

    /**
     * Создает JSDoc комментарий для перечисления.
     *
     * @param {EnumDeclaration} node - узел AST перечисления
     * @returns {string} - сгенерированный JSDoc комментарий
     */
    createJSDocEnum = (node: EnumDeclaration): Promise<boolean> => {
        return createJSDocEnum(
            getPrepareParams({
                config: this.config,
                sourceFile: this.sourceFile,
                node,
                kindName: 'EnumDeclaration'
            })
        );
    };

    /**
     * Создает JSDoc комментарий для псевдонима типа.
     *
     * @param {TypeAliasDeclaration} node - узел AST псевдонима типа
     * @returns {string} - сгенерированный JSDoc комментарий
     */
    createJSDocTypeAlias = (node: TypeAliasDeclaration): Promise<boolean> => {
        return createJSDocTypeAlias(
            getPrepareParams({
                config: this.config,
                sourceFile: this.sourceFile,
                node,
                kindName: 'TypeAliasDeclaration'
            })
        );
    };

    /**
     * Создает JSDoc комментарий для оператора объявления переменных.
     *
     * @param {VariableStatement} node - узел AST оператора объявления переменных
     * @returns {string} - сгенерированный JSDoc комментарий
     */
    createJSDocVariableStatement = (node: VariableStatement): Promise<boolean> => {
        return createJSDocVariableStatement(
            getPrepareParams({
                config: this.config,
                sourceFile: this.sourceFile,
                node,
                kindName: 'VariableStatement'
            })
        );
    };

    /**
     * Создает JSDoc комментарий для класса.
     *
     * @param {ClassDeclaration} node - узел AST класса
     * @returns {string} - сгенерированный JSDoc комментарий
     */
    createJSDocClass = (node: ClassDeclaration): Promise<boolean> => {
        return createJSDocClass(
            getPrepareParams({
                config: this.config,
                sourceFile: this.sourceFile,
                node,
                kindName: 'ClassDeclaration'
            })
        );
    };
}
