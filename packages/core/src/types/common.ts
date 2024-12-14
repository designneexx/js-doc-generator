import { type FileSystemCache } from 'file-system-cache';
import { FileCacheManagerMap } from 'core/utils/FileCacheManagerMap';
import {
    JSDocableNode,
    SyntaxKind,
    Node,
    ts,
    SourceFile,
    type ProjectOptions,
    InterfaceDeclaration,
    VariableStatement,
    EnumDeclaration,
    FunctionDeclaration,
    ClassDeclaration,
    TypeAliasDeclaration
} from 'ts-morph';
import winston from 'winston';

/**
 * Опции для кэша файловой системы.
 * Этот тип представляет собой набор опций, которые могут быть переданы в конструктор класса FileSystemCache.
 */
type FileSystemCacheOptions = Exclude<ConstructorParameters<typeof FileSystemCache>[number], undefined>;

/**
 * Тип KindVariants представляет собой строку, которая должна быть одним из вариантов перечисления SyntaxKind или ключом этого перечисления.
 * @typedef {string} KindVariants
 */
export type KindVariants = `${SyntaxKind}` | keyof typeof SyntaxKind | SyntaxKind;

/**
 * Тип ASTJSDocableNode представляет узел абстрактного синтаксического дерева (AST),
 * который может содержать JSDoc комментарии.
 */
export type ASTJSDocableNode = JSDocableNode & Node<ts.Node>;

export type AIServiceOptions = Record<string, unknown>;

/**
 * Перечисление для определения режима вставки элементов.
 * Определяет способы обновления или расширения коллекции элементов.
 */
export enum InsertModeJSDocTypes {
    /**
     * Режим замены, при котором новые элементы заменяют существующие.
     * Полезно, когда необходимо обновить текущую коллекцию новыми данными,
     * полностью заменяя старые значения.
     */
    ReplaceMode,
    /**
     * Режим добавления, при котором новые элементы добавляются к существующим.
     * Используется, когда необходимо расширить текущую коллекцию, добавляя
     * новые данные к уже существующим.
     */
    AppendMode
}

/**
 * Опции для генерации JSDoc комментариев.
 */
export interface JSDocOptions {
    /**
     * Режим вставки JSDoc комментариев.
     *
     * Определяет, каким образом будут вставляться JSDoc комментарии.
     * Может принимать значения из перечисления `InsertModeJSDocTypes` или их строковые представления.
     */
    mode?: InsertModeJSDocTypes | keyof typeof InsertModeJSDocTypes;
    /**
     * Глубина вложенности JSDoc комментариев.
     *
     * Указывает, насколько глубоко будут вложены JSDoc комментарии в структуре кода.
     * Значение по умолчанию может варьироваться в зависимости от реализации.
     */
    depth?: number;
    /**
     * Флаг для отображения описания в JSDoc комментариях.
     *
     * Если установлен в `true`, JSDoc комментарии будут включать описание соответствующих элементов кода.
     */
    isShowJSDocDescription?: boolean;
    /**
     * Флаг для отображения тегов в JSDoc комментариях.
     *
     * Если установлен в `true`, JSDoc комментарии будут включать теги, такие как `@param`, `@returns` и другие.
     */
    isShowJSDocTags?: boolean;
    /**
     * Разрешенные теги JSDoc.
     *
     * Список строк, определяющий, какие теги JSDoc разрешены для использования.
     * Если не указан, разрешены все теги.
     */
    allowedJSDocTags?: string[];
    /**
     * Запрещенные теги JSDoc.
     *
     * Список строк, определяющий, какие теги JSDoc запрещены для использования.
     * Эти теги не будут включены в сгенерированные комментарии, даже если они указаны в `allowedJSDocTags`.
     */
    disabledJSDocTags?: string[];
    /**
     * Флаг для отключения опции.
     *
     * Если установлен в `true`, все настройки JSDoc будут игнорироваться и комментарии не будут генерироваться.
     */
    disabled?: boolean;
}

/**
 * Тип функции, которая принимает опции для генерации JSDoc и опции для AI-сервиса,
 * и возвращает обещание сгенерированного JSDoc кода в виде строки.
 * @template CurrentAIServiceOptions - текущие опции для AI-сервиса, по умолчанию AIServiceOptions
 * @param {JSDocGeneratorServiceOptions} options - опции для генерации JSDoc
 * @param {CurrentAIServiceOptions} aiServiceOptions - опции для AI-сервиса
 * @returns {Promise<string>} - обещание сгенерированного JSDoc кода в виде строки
 */
export type CreateJSDocCodeSnippet<
    CurrentAIServiceOptions extends AIServiceOptions = AIServiceOptions
> = (
    options: JSDocGeneratorServiceOptions,
    aiServiceOptions: CurrentAIServiceOptions
) => Promise<string>;

/**
 * Интерфейс JSDocGeneratorService представляет собой сервис для генерации JSDoc комментариев.
 * @template CurrentAIServiceOptions - Обобщенный тип опций для AI-сервиса.
 */
export interface JSDocGeneratorService<
    CurrentAIServiceOptions extends AIServiceOptions = AIServiceOptions
> {
    /**
     * Метод для создания JSDoc комментария для интерфейса.
     *
     * @param options - Опции для генерации JSDoc комментария.
     * @returns JSDoc комментарий для интерфейса.
     */
    createJSDocInterface: CreateJSDocCodeSnippet<CurrentAIServiceOptions>;
    /**
     * Метод для создания JSDoc комментария для функции.
     *
     * @param options - Опции для генерации JSDoc комментария.
     * @returns JSDoc комментарий для функции.
     */
    createJSDocFunction: CreateJSDocCodeSnippet<CurrentAIServiceOptions>;
    /**
     * Метод для создания JSDoc комментария для перечисления.
     *
     * @param options - Опции для генерации JSDoc комментария.
     * @returns JSDoc комментарий для перечисления.
     */
    createJSDocEnum: CreateJSDocCodeSnippet<CurrentAIServiceOptions>;
    /**
     * Метод для создания JSDoc комментария для псевдонима типа.
     *
     * @param options - Опции для генерации JSDoc комментария.
     * @returns JSDoc комментарий для псевдонима типа.
     */
    createJSDocTypeAlias: CreateJSDocCodeSnippet<CurrentAIServiceOptions>;
    /**
     * Метод для создания JSDoc комментария для класса.
     *
     * @param options - Опции для генерации JSDoc комментария.
     * @returns JSDoc комментарий для класса.
     */
    createJSDocClass: CreateJSDocCodeSnippet<CurrentAIServiceOptions>;
    /**
     * Метод для создания JSDoc комментария для оператора объявления переменных.
     *
     * @param options - Опции для генерации JSDoc комментария.
     * @returns JSDoc комментарий для оператора объявления переменных.
     */
    createJSDocVariableStatement: CreateJSDocCodeSnippet<CurrentAIServiceOptions>;
}

/**
 * Интерфейс, представляющий сериализованный исходный файл.
 * Содержит текст исходного кода файла и путь к файлу на файловой системе.
 */
export interface SerializedSourceFile {
    /**
     * Строка, содержащая полный текст исходного кода файла.
     * Это может быть полезно для анализа или трансформации кода.
     */
    sourceCode: string;
    /**
     * Строка, представляющая абсолютный или относительный путь
     * к исходному файлу на файловой системе. Это позволяет
     * идентифицировать местоположение файла.
     */
    filePath: string;
}

/**
 * Опции для сервиса генерации JSDoc комментариев.
 */
export interface JSDocGeneratorServiceOptions {
    /**
     * Фрагмент кода, для которого нужно сгенерировать JSDoc.
     * Это строка, содержащая часть кода, для которой требуется создать документированные комментарии.
     */
    codeSnippet: string;
    /**
     * Сериализованный исходный файл, к которому относится фрагмент кода.
     * Этот объект содержит информацию о файле, в котором находится данный фрагмент кода.
     */
    sourceFile: SerializedSourceFile;
    /**
     * Сериализованные исходные файлы, на которые ссылается фрагмент кода.
     * Это массив объектов, каждый из которых представляет файл, на который ссылается код из `codeSnippet`.
     */
    referencedSourceFiles: SerializedSourceFile[];
}

/**
 * Параметры для получения фрагмента кода, поддерживающего JSDoc.
 */
export interface GetJSDocableCodeSnippetParams<
    CurrentAIServiceOptions extends AIServiceOptions = AIServiceOptions
> {
    /**
     * Экземпляр сервиса, отвечающего за генерацию JSDoc комментариев.
     *
     * @type {JSDocGeneratorService<CurrentAIServiceOptions>}
     */
    jsDocGeneratorService: JSDocGeneratorService<CurrentAIServiceOptions>;
    /**
     * Конфигурационные опции для настройки сервиса генерации JSDoc.
     *
     * @type {JSDocGeneratorServiceOptions}
     */
    jsDocGeneratorServiceOptions: JSDocGeneratorServiceOptions;
    /**
     * Опции, специфичные для текущего сервиса ИИ, которые могут быть использованы для настройки его поведения.
     *
     * @type {CurrentAIServiceOptions}
     */
    aiServiceOptions: CurrentAIServiceOptions;
}

/**
 * Параметры инициализации фабрики JSDoc.
 */
export interface InitJSDocFactoryParams<
    CurrentNode extends ASTJSDocableNode = ASTJSDocableNode,
    Response = unknown
> {
    /**
     * Вид узла AST, для которого применяется JSDoc.
     * Это значение возвращается методом `getKindName` узла.
     */
    kind: ReturnType<CurrentNode['getKindName']>;
    /**
     * Функция для применения JSDoc к узлу AST.
     *
     * @param params - Параметры, необходимые для применения JSDoc к узлу.
     * @returns Результат применения JSDoc, тип которого определяется параметром Response.
     */
    applyJSDoc?(params: ApplyJSDocParams<CurrentNode>): Response;
    /**
     * Получает фрагмент кода, к которому можно применить JSDoc.
     *
     * @template CurrentAIServiceOptions - Тип опций, используемых текущей службой искусственного интеллекта.
     * @param params - Параметры, используемые для получения фрагмента кода.
     * @returns Обещание, которое разрешается в строку с фрагментом кода.
     */
    getJSDocableCodeSnippet<CurrentAIServiceOptions extends AIServiceOptions>(
        params: GetJSDocableCodeSnippetParams<CurrentAIServiceOptions>
    ): Promise<string>;
}

/**
 * Параметры для проверки наличия узла в кэше
 */
export interface IsNodeInCacheParams<CurrentNode extends ASTJSDocableNode = ASTJSDocableNode> {
    /**
     * Узел, который нужно проверить на наличие в кэше
     */
    node: CurrentNode;
    /**
     * Карта менеджеров кэша файлов
     */
    fileCacheManagerMap: FileCacheManagerMap;
    /**
     * Исходный файл, в котором находится узел
     */
    sourceFile: SourceFile;
}

/**
 * Функция типа, которая принимает параметры и возвращает булевое значение.
 * Проверяет наличие узла в кэше.
 * @template CurrentNode - тип узла, который должен быть ASTJSDocableNode
 * @param {IsNodeInCacheParams<CurrentNode>} params - параметры для проверки наличия узла в кэше
 * @returns {boolean} - булевое значение, указывающее наличие узла в кэше
 */
export type IsNodeInCache = <CurrentNode extends ASTJSDocableNode>(
    params: IsNodeInCacheParams<CurrentNode>
) => boolean;

/**
 * Интерфейс для подготовки и применения JSDoc комментариев.
 *
 * @template CurrentNode - Тип узла AST, к которому будет применяться JSDoc.
 * @template CurrentAIServiceOptions - Тип опций сервиса искусственного интеллекта.
 */
export interface PrepareAndApplyJSDoc<
    CurrentNode extends ASTJSDocableNode = ASTJSDocableNode,
    CurrentAIServiceOptions extends AIServiceOptions = AIServiceOptions
> {
    /**
     * Узел AST, к которому будет применяться JSDoc.
     *
     * @description
     * Этот узел представляет собой часть абстрактного синтаксического дерева, для которого
     * необходимо сгенерировать и применить JSDoc комментарии.
     */
    node: CurrentNode;
    /**
     * Сервис генерации JSDoc для указанных параметров и опций.
     *
     * @description
     * Этот сервис отвечает за создание JSDoc комментариев на основе предоставленных
     * параметров и опций, обеспечивая автоматизацию процесса документирования кода.
     */
    jsDocGeneratorService: JSDocGeneratorService<CurrentAIServiceOptions>;
    /**
     * Частичные опции JSDoc для настройки генерации JSDoc.
     *
     * @description
     * Эти опции позволяют настроить процесс генерации JSDoc, предоставляя возможность
     * указать специфические настройки, которые будут учтены при создании комментариев.
     */
    jsDocOptions: Partial<JSDocOptions>;
    /**
     * Исходный файл, к которому относится узел AST.
     *
     * @description
     * Этот файл содержит исходный код, в котором находится узел AST, и служит контекстом
     * для генерации JSDoc комментариев.
     */
    sourceFile: SourceFile;
    /**
     * Параметры сервиса искусственного интеллекта, используемые при генерации JSDoc.
     *
     * @description
     * Эти параметры определяют конфигурацию и поведение сервиса искусственного интеллекта,
     * который используется для автоматической генерации JSDoc комментариев.
     */
    aiServiceOptions: CurrentAIServiceOptions;

    /**
     * Карта менеджеров кэша файлов.
     *
     * @description
     * Эта карта содержит менеджеры кэша файлов для управления кэшированием различных файлов
     * и обеспечения быстрого доступа к ним при необходимости.
     */
    fileCacheManagerMap: FileCacheManagerMap;

    /**
     * Проверяет, находится ли узел в кэше.
     *
     * @param params - Параметры для проверки наличия узла в кэше.
     * @returns Возвращает true, если узел находится в кэше, в противном случае - false.
     */
    isNodeInCache(params: IsNodeInCacheParams): boolean;

    /**
     * Логгер для записи информационных сообщений.
     *
     * @description
     * Этот логгер предназначен для записи различных информационных сообщений и отладочной информации
     * в процессе работы с JSDoc и другими компонентами системы.
     */
    logger: winston.Logger;
}

/**
 * Параметры для применения JSDoc к узлу AST.
 */
export interface ApplyJSDocParams<Node extends ASTJSDocableNode = ASTJSDocableNode> {
    /**
     * Узел AST, к которому применяется JSDoc.
     *
     * @type {Node}
     */
    node: Node;
    /**
     * Список JSDoc комментариев, которые будут применены к узлу AST.
     *
     * @type {ASTJSDocableNode[]}
     */
    jsDocs: ASTJSDocableNode[];
    /**
     * Настройки для применения JSDoc.
     *
     * @type {Partial<JSDocOptions>}
     */
    jsDocOptions: Partial<JSDocOptions>;
}

/**
 * Интерфейс, описывающий параметры генерации кода.
 * @template CurrentAIServiceOptions - тип параметров для текущего сервиса искусственного интеллекта
 */
export interface GenerationOptions<
    CurrentAIServiceOptions extends AIServiceOptions = AIServiceOptions
> {
    /**
     * Массив, содержащий виды синтаксических элементов, которые будут использоваться
     * при генерации. Каждый элемент массива является ключом из перечисления SyntaxKind.
     */
    kinds: `${KindDeclarationNames}`[];
    /**
     * Опциональный объект, содержащий параметры для генерации JSDoc комментариев.
     * Может включать в себя различные настройки, влияющие на формат и содержание
     * генерируемых JSDoc комментариев.
     */
    jsDocOptions?: JSDocOptions;
    /**
     * Объект, содержащий специфичные для текущего сервиса искусственного интеллекта
     * параметры. Эти параметры позволяют настраивать поведение сервиса в процессе
     * генерации. Тип определяется параметром CurrentAIServiceOptions.
     */
    aiServiceOptions: CurrentAIServiceOptions;
}

/**
 * Опции для генерации деталей синтаксических элементов.
 * Этот тип представляет собой частичное соответствие между типами синтаксических элементов и опциями генерации.
 * Каждому типу синтаксического элемента соответствует набор опций генерации, за исключением поля 'kinds'.
 * @template CurrentAIServiceOptions - Текущие опции сервиса ИИ, по умолчанию равны AIServiceOptions
 */
export type DetailGenerationOptions<
    CurrentAIServiceOptions extends AIServiceOptions = AIServiceOptions
> = Partial<
    Record<keyof typeof SyntaxKind, Omit<GenerationOptions<CurrentAIServiceOptions>, 'kinds'>>
>;

/**
 * Интерфейс для параметров инициализации сервиса.
 */
export interface InitParams<CurrentAIServiceOptions extends AIServiceOptions = AIServiceOptions> {
    /**
     * Опции для генерации кэша
     */
    cacheOptions?: FileSystemCacheOptions;
    /**
     * Директория с кэшэм
     */
    cacheDir?: string;
    /**
     * Опции проекта, которые могут включать в себя настройки, специфичные для текущего проекта.
     *
     * @type {ProjectOptions}
     */
    projectOptions?: ProjectOptions;
    /**
     * Опции для настройки ESLint, инструмента для анализа кода.
     *
     * @type {ESLint.Options}
     */
    // esLintOptions?: ESLint.Options;
    /**
     * Массив строк, представляющих пути к файлам, которые будут обрабатываться сервисом.
     *
     * @type {string[]}
     */
    files: string[];
    /**
     * Массив строк, представляющих пути к файлам, которые должны быть проигнорированы сервисом.
     *
     * @type {string[]}
     */
    ignoredFiles?: string[];
    /**
     * Экземпляр сервиса генерации JSDoc, который используется для автоматического создания документации.
     *
     * @type {JSDocGeneratorService<CurrentAIServiceOptions>}
     */
    jsDocGeneratorService: JSDocGeneratorService<CurrentAIServiceOptions>;
    /**
     * Глобальные опции генерации, которые применяются ко всему процессу генерации.
     *
     * @type {GenerationOptions<CurrentAIServiceOptions>}
     */
    globalGenerationOptions?: GenerationOptions<CurrentAIServiceOptions>;
    /**
     * Опции детальной генерации, которые могут быть применены к более специфичным аспектам генерации.
     *
     * @type {DetailGenerationOptions<CurrentAIServiceOptions>}
     */
    detailGenerationOptions?: DetailGenerationOptions<CurrentAIServiceOptions>;
}

/**
 * Интерфейс метаданных хэша кэша файла
 */
export interface FileCacheHashMetadata {
    /**
     * Хэш исходного кода файла
     */
    fileSourceCodeHash: string;
    /**
     * Хэш исходного кода узла (Node)
     */
    nodeSourceCodeHash: string;
}

/**
 * Перечисление для различных видов объявлений в коде.
 */
export enum KindDeclarationNames {
    /**
     * Объявление функции.
     */
    FunctionDeclaration = 'FunctionDeclaration',
    /**
     * Объявление переменной.
     */
    VariableStatement = 'VariableStatement',
    /**
     * Объявление перечисления (enum).
     */
    EnumDeclaration = 'EnumDeclaration',
    /**
     * Объявление псевдонима типа.
     */
    TypeAliasDeclaration = 'TypeAliasDeclaration',
    /**
     * Объявление интерфейса.
     */
    InterfaceDeclaration = 'InterfaceDeclaration',
    /**
     * Объявление класса.
     */
    ClassDeclaration = 'ClassDeclaration'
}

/**
 * Тип, представляющий извлеченное объявление.
 * @template Kind - Тип объявления.
 * @template CurrentNode - Текущий узел AST с JSDoc.
 */
export type ExtractedDeclaration<
    Kind extends `${KindDeclarationNames}` = `${KindDeclarationNames}`,
    CurrentNode extends ASTJSDocableNode = ASTJSDocableNode
> = {
    /**
     * Тип объявления.
     */
    kind: Kind;
    /**
     * Массив узлов текущего AST с JSDoc.
     */
    nodes: CurrentNode[];
};

/**
 * Преобразует кортеж в массив объединения типов
 * @template T - кортеж, который нужно преобразовать
 */
export type TupleToUnionArray<T extends unknown[]> = T[number][];

/**
 * Объявление типа, представляющее извлеченный интерфейс
 * @template K - тип значения, представляющий имя объявления
 * @template T - тип значения, представляющий интерфейсное объявление
 */
export type ExtractedInterfaceDeclaration = ExtractedDeclaration<
    KindDeclarationNames.InterfaceDeclaration,
    InterfaceDeclaration
>;

/**
 * Тип, представляющий извлеченное выражение переменной.
 */
export type ExtractedVariableStatement = ExtractedDeclaration<
    KindDeclarationNames.VariableStatement,
    VariableStatement
>;

/**
 * Тип, представляющий извлеченное объявление перечисления
 * @template TKind - тип значения, указывающий на вид объявления
 * @template TDeclaration - тип объявления перечисления
 */
export type ExtractedEnumDeclaration = ExtractedDeclaration<
    KindDeclarationNames.EnumDeclaration,
    EnumDeclaration
>;

/**
 * Тип, представляющий извлеченное объявление функции.
 */
export type ExtractedFunctionDeclaration = ExtractedDeclaration<
    KindDeclarationNames.FunctionDeclaration,
    FunctionDeclaration
>;

/**
 * Тип данных, представляющий извлеченное объявление класса.
 * @template K - тип значения, представляющий вид объявления
 * @template T - тип данных, представляющий объявление класса
 */
export type ExtractedClassDeclaration = ExtractedDeclaration<
    KindDeclarationNames.ClassDeclaration,
    ClassDeclaration
>;

/**
 * Объявление типа, извлеченное из исходного кода
 */
export type ExtractedTypeAliasDeclaration = ExtractedDeclaration<
    KindDeclarationNames.TypeAliasDeclaration,
    TypeAliasDeclaration
>;

export type ExtractedDeclarationsTuple = [
    ExtractedClassDeclaration,
    ExtractedInterfaceDeclaration,
    ExtractedEnumDeclaration,
    ExtractedFunctionDeclaration,
    ExtractedVariableStatement,
    ExtractedTypeAliasDeclaration
];

/**
 * Тип ExtractedDeclarations представляет собой объединение всех типов, содержащихся в TupleToUnionArray.
 */
export type ExtractedDeclarations = TupleToUnionArray<ExtractedDeclarationsTuple>;

/**
 * Реестр объявлений с возможностью добавления JSDoc.
 */
export interface JSDocableDeclarationRegistry {
    /**
     * Объявление класса.
     */
    [KindDeclarationNames.ClassDeclaration]: ClassDeclaration;
    /**
     * Объявление перечисления.
     */
    [KindDeclarationNames.EnumDeclaration]: EnumDeclaration;
    /**
     * Объявление интерфейса.
     */
    [KindDeclarationNames.InterfaceDeclaration]: InterfaceDeclaration;
    /**
     * Объявление функции.
     */
    [KindDeclarationNames.FunctionDeclaration]: FunctionDeclaration;
    /**
     * Объявление переменной.
     */
    [KindDeclarationNames.VariableStatement]: VariableStatement;
    /**
     * Объявление псевдонима типа.
     */
    [KindDeclarationNames.TypeAliasDeclaration]: TypeAliasDeclaration;
}

/**
 * Реестр провайдеров JSDoc, которые ассоциированы с определениями, поддерживающими JSDoc.
 */
export type JSDocProviderRegistry = {
    [key in keyof JSDocableDeclarationRegistry]: (
        node: JSDocableDeclarationRegistry[key]
    ) => Promise<boolean>;
};

/**
 * Тип CreateJSDoc представляет собой функцию, которая принимает prepareParams и возвращает Promise<boolean>.
 * @template CurrentNode - тип узла AST, который имеет JSDoc
 * @template CurrentAIServiceOptions - тип параметров службы AI
 * @param prepareParams - функция подготовки и применения JSDoc к узлу AST
 * @returns Promise<boolean> - промис с булевым значением
 */
export type CreateJSDoc<CurrentNode extends ASTJSDocableNode = ASTJSDocableNode> = <
    CurrentAIServiceOptions extends AIServiceOptions
>(
    prepareParams: PrepareAndApplyJSDoc<CurrentNode, CurrentAIServiceOptions>
) => Promise<boolean>;

/**
 * Represents a type that makes all properties of the original type optional recursively.
 * @template T - The original type to make partial.
 */
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

/**
 * Обобщенный тип DefaultModule, представляющий модуль по умолчанию.
 * @template DefaultModule - Тип модуля по умолчанию.
 * @template Module - Тип модуля, который должен содержать все поля типа DefaultModule и не содержать поле default.
 */
export type DefaultModule<
    DefaultModule = unknown,
    Module extends (Record<string, unknown> & {default: never}) = Record<string, unknown> & {default: never & void}
> = Module & {
    /**
     * Поле default, представляющее модуль по умолчанию.
     * @type {Module & { default: DefaultModule }}
     */
    default: Module & {
        default: DefaultModule;
    };
};

