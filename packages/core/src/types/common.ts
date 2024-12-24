import { FileCacheManagerMap } from 'core/utils/FileCacheManagerMap';
import { type FileSystemCache } from 'file-system-cache';
import { JSDocableNode, SyntaxKind, Node, ts, SourceFile, type ProjectOptions } from 'ts-morph';

/**
 * Опции для кэша файловой системы.
 * Этот тип представляет собой набор опций, которые могут быть переданы в конструктор класса FileSystemCache.
 */
type FileSystemCacheOptions = Exclude<
    ConstructorParameters<typeof FileSystemCache>[number],
    undefined
>;

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

/**
 * Опции сервиса искусственного интеллекта.
 * Этот тип представляет собой объект, где ключи являются строками, а значения - любого типа.
 */
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
export interface InitJSDocFactoryParams<Kind extends KindDeclarationNames> {
    /**
     * Вид узла AST, для которого применяется JSDoc.
     * Это значение возвращается методом `getKindName` узла.
     */
    kind: Kind;
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
export interface SetJSDocToNodeParams<
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
 * Интерфейс JSDocNodeSetter представляет собой обобщенный тип, который определяет метод установки JSDoc к узлу AST.
 * @template Kind - Тип декларации узла.
 */
export interface JSDocNodeSetter<Kind extends KindDeclarationNames = KindDeclarationNames> {
    /**
     * Тип декларации узла.
     */
    kind: Kind;
    /**
     * Устанавливает JSDoc к указанному узлу AST.
     * @template CurrentNode - Текущий узел AST, который поддерживает JSDoc.
     * @template CurrentAIServiceOptions - Опции сервиса искусственного интеллекта для текущего узла.
     * @param {SetJSDocToNodeParams<CurrentNode, CurrentAIServiceOptions>} params - Параметры для установки JSDoc.
     * @returns {Promise<void>} - Промис, который разрешается после установки JSDoc.
     */
    setJSDocToNode<
        CurrentNode extends ASTJSDocableNode,
        CurrentAIServiceOptions extends AIServiceOptions
    >(
        params: SetJSDocToNodeParams<CurrentNode, CurrentAIServiceOptions>
    ): Promise<void>;
}

/**
 * Интерфейс, представляющий исходный код файла и исходный код узла
 */
export interface FileNodeSourceCode {
    /**
     * Исходный код файла
     */
    fileSourceCode: string;
    /**
     * Исходный код узла
     */
    nodeSourceCode: string;
}
