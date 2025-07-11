// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { type FileSystemCache } from 'file-system-cache';
import { JSDocableNode, SyntaxKind, Node, ts, SourceFile, type ProjectOptions } from 'ts-morph';

/**
 * Опции для кэша файловой системы.
 * Исключает из типа `ConstructorParameters<typeof FileSystemCache>[number]` значение `undefined`.
 */
type FileSystemCacheOptions = Exclude<
    ConstructorParameters<typeof FileSystemCache>[number],
    undefined
>;

/**
 * Тип, представляющий узел абстрактного синтаксического дерева (AST), который поддерживает JSDoc комментарии.
 * Расширяет интерфейс JSDocableNode и Node из библиотеки TypeScript.
 */
export type ASTJSDocableNode = JSDocableNode & Node<ts.Node>;

/**
 * Перечисление, определяющее режимы вставки элементов.
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
    mode?: keyof typeof InsertModeJSDocTypes | InsertModeJSDocTypes;
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

    /**
     * Префикс для описания в JSDoc комментариях.
     */
    prefixDescription?: string;

    /**
     * Постфикс для описания в JSDoc комментариях.
     */
    postfixDescription?: string;
}

/**
 * Тип, представляющий функцию для создания JSDoc кодового фрагмента
 * @param options - параметры сервиса генерации JSDoc
 * @returns Promise<string> - обещание строки, представляющей JSDoc кодовый фрагмент
 */
export type CreateJSDocCodeSnippet = (options: JSDocGeneratorServiceOptions) => Promise<string>;

/**
 * Сервис для генерации JSDoc комментариев.
 */
export interface JSDocGeneratorService {
    /**
     * Метод для создания JSDoc комментария для интерфейса.
     *
     * @param options - Опции для генерации JSDoc комментария.
     * @returns JSDoc комментарий для интерфейса.
     */
    createJSDocInterface: CreateJSDocCodeSnippet;
    /**
     * Метод для создания JSDoc комментария для функции.
     *
     * @param options - Опции для генерации JSDoc комментария.
     * @returns JSDoc комментарий для функции.
     */
    createJSDocFunction: CreateJSDocCodeSnippet;
    /**
     * Метод для создания JSDoc комментария для перечисления.
     *
     * @param options - Опции для генерации JSDoc комментария.
     * @returns JSDoc комментарий для перечисления.
     */
    createJSDocEnum: CreateJSDocCodeSnippet;
    /**
     * Метод для создания JSDoc комментария для псевдонима типа.
     *
     * @param options - Опции для генерации JSDoc комментария.
     * @returns JSDoc комментарий для псевдонима типа.
     */
    createJSDocTypeAlias: CreateJSDocCodeSnippet;
    /**
     * Метод для создания JSDoc комментария для класса.
     *
     * @param options - Опции для генерации JSDoc комментария.
     * @returns JSDoc комментарий для класса.
     */
    createJSDocClass: CreateJSDocCodeSnippet;
    /**
     * Метод для создания JSDoc комментария для оператора объявления переменных.
     *
     * @param options - Опции для генерации JSDoc комментария.
     * @returns JSDoc комментарий для оператора объявления переменных.
     */
    createJSDocVariableStatement: CreateJSDocCodeSnippet;
}

/**
 * Интерфейс, представляющий сериализованный исходный файл.
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
 * Опции для сервиса генерации JSDoc.
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
 * Параметры для получения фрагмента кода, подлежащего JSDoc аннотации.
 */
export interface GetJSDocableCodeSnippetParams {
    /**
     * Сервис для генерации JSDoc с возможностью повторных попыток.
     */
    jsDocGeneratorService: JSDocGeneratorService;
    /**
     * Конфигурационные опции для настройки сервиса генерации JSDoc.
     *
     * @type {JSDocGeneratorServiceOptions}
     */
    jsDocGeneratorServiceOptions: JSDocGeneratorServiceOptions;
}

/**
 * Параметры для установки JSDoc узла AST.
 */
export interface CreateJSDocNodeSetterParams<Kind extends KindDeclarationNames> {
    /**
     * Вид узла AST, для которого применяется JSDoc.
     * Это значение возвращается методом `getKindName` узла.
     */
    kind: Kind;
    /**
     * Функция, которая возвращает фрагмент кода, к которому можно применить JSDoc.
     * @param params - Параметры для получения фрагмента кода.
     * @returns Фрагмент кода, к которому можно применить JSDoc.
     */
    getJSDocableCodeSnippet(params: GetJSDocableCodeSnippetParams): Promise<string>;
}

/**
 * Параметры для установки JSDoc комментариев к узлу AST.
 */
export interface SetJSDocToNodeParams<CurrentNode extends ASTJSDocableNode = ASTJSDocableNode> {
    /**
     * Узел AST, к которому будет применяться JSDoc.
     *
     * @description
     * Этот узел представляет собой часть абстрактного синтаксического дерева, для которого
     * необходимо сгенерировать и применить JSDoc комментарии.
     */
    node: CurrentNode;

    /**
     * Сервис генерации JSDoc с возможностью повторных попыток.
     */
    jsDocGeneratorService: JSDocGeneratorService;
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
     * Флаг указывающий, нужно ли сохранять после каждой итерации.
     *
     * @description
     * Если установлен в true, то после каждой итерации генерации JSDoc комментариев
     * будет производиться сохранение изменений.
     */
    isSaveAfterEachIteration?: boolean;
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
    jsDocableNodes: ASTJSDocableNode[];
    /**
     * Настройки для применения JSDoc.
     *
     * @type {Partial<JSDocOptions>}
     */
    jsDocOptions: Partial<JSDocOptions>;
}

/**
 * Интерфейс, описывающий параметры для генерации кода.
 */
export interface GenerationOptions {
    /**
     * Массив, содержащий виды синтаксических элементов, которые будут использоваться
     * при генерации. Каждый элемент массива является ключом из перечисления SyntaxKind.
     */
    kinds?: `${KindDeclarationNames}`[] | null;
    /**
     * Опциональный объект, содержащий параметры для генерации JSDoc комментариев.
     * Может включать в себя различные настройки, влияющие на формат и содержание
     * генерируемых JSDoc комментариев.
     */
    jsDocOptions?: JSDocOptions | null;
}

/**
 * Опции для генерации деталей по различным типам синтаксических узлов.
 * Этот тип представляет собой частичное отображение типа SyntaxKind на опции генерации,
 * исключая типы узлов, указанные в поле `kinds`.
 */
export type DetailGenerationOptions = Partial<
    Record<keyof typeof SyntaxKind, Omit<GenerationOptions, 'kinds'>>
>;

/**
 * Интерфейс для данных о прогрессе обработки исходного файла.
 */
export interface SourceFileProgressData {
    /**
     * Путь к файлу.
     */
    filePath: string;
    /**
     * Исходный код файла.
     */
    sourceCode: string;
}

/**
 * Интерфейс для параметров базового прогресса
 */
export interface BaseProgressParams {
    /**
     * Кодовый фрагмент
     */
    codeSnippet: string;
    /**
     * Исходный файл
     */
    sourceFile: SourceFileProgressData;
    /**
     * Общее количество файлов
     */
    totalFiles: number;
    /**
     * Количество кодовых фрагментов в файле
     */
    codeSnippetsInFile: number;
    /**
     * Общее количество кодовых фрагментов во всех файлах
     */
    codeSnippetsInAllFiles: number;
    /**
     * Индекс исходного файла
     */
    sourceFileIndex: number;
    /**
     * Индекс кодового фрагмента
     */
    codeSnippetIndex: number;
    /**
     * Текущий общий индекс
     */
    currentGeneralIndex: number;
    /**
     * Идентификатор
     */
    id: string;
}

/**
 * Интерфейс, представляющий параметры успешного завершения операции
 */
export interface OnSuccessParams extends BaseProgressParams {
    /**
     * Ответ от операции в виде строки
     */
    response: string;
}

/**
 * Интерфейс, описывающий параметры ошибки.
 */
export interface OnErrorParams extends BaseProgressParams {
    /**
     * Объект ошибки, который может быть любого типа.
     */
    error: unknown;
}

/**
 * Интерфейс для параметров прогресса
 */
export interface ProgressParams {
    /**
     * Кодовый фрагмент
     */
    codeSnippet: string;
    /**
     * Исходный файл
     */
    sourceFile: SourceFileProgressData;
    /**
     * Общее количество файлов
     */
    totalFiles: number;
    /**
     * Количество кодовых фрагментов в файле
     */
    codeSnippetsInFile: number;
    /**
     * Общее количество кодовых фрагментов во всех файлах
     */
    codeSnippetsInAllFiles: number;
    /**
     * Индекс исходного файла
     */
    sourceFileIndex: number;
    /**
     * Индекс кодового фрагмента
     */
    codeSnippetIndex: number;
    /**
     * Текущий общий индекс
     */
    currentGeneralIndex: number;
    /**
     * Флаг успешности выполнения
     */
    isSuccess: boolean;
    /**
     * Флаг ожидания
     */
    isPending: boolean;
    /**
     * Ошибка (необязательно)
     */
    error?: unknown;
    /**
     * Ответ
     */
    response?: string;
    /**
     * Идентификатор
     */
    id: string;
}

/**
 * Интерфейс параметров для логирования базового логгера.
 */
export interface BaseLoggerLogParams {
    /**
     * Фрагмент кода, который требуется залогировать.
     */
    codeSnippet: string;
    /**
     * Путь к файлу источнику, откуда был вызван логгер.
     */
    sourceFilePath: string;
    /**
     * Диапазон строк в коде, которые требуется залогировать.
     */
    lineNumbers: [number, number];
    /**
     * Вид объявления, к которому относится лог.
     */
    kind: KindDeclarationNames;

    /**
     * Время ожидания генерации в миллисекундах.
     */
    generationWaitingTimeMs: number;
}

/**
 * Интерфейс для параметров логирования информационного сообщения
 */
export interface LoggerInfoParams extends BaseLoggerLogParams {
    /**
     * Ответ, полученный в результате операции
     */
    response: string;
    /**
     * Количество попыток, предпринятых для выполнения операции
     */
    retries: number;
}

/**
 * Интерфейс для параметров логирования ошибки.
 */
export interface LoggerErrorParams extends BaseLoggerLogParams {
    /**
     * Объект ошибки.
     */
    error: unknown;
}

/**
 * Интерфейс Logger представляет собой контракт для объектов, способных логгировать информацию и ошибки.
 */
export interface Logger {
    /**
     * Метод info принимает сообщение типа string и возвращает строку.
     * @param message - Сообщение для логгирования типа string.
     * @returns Строка, представляющая логгированное информационное сообщение.
     */
    info?: ((log: LoggerInfoParams) => void) | null;
    /**
     * Метод error принимает сообщение типа string и возвращает строку.
     * @param message - Сообщение об ошибке типа string.
     * @returns Строка, представляющая логгированное сообщение об ошибке.
     */
    error?: ((log: LoggerErrorParams) => void) | null;
}

/**
 * Параметры инициализации для сервиса генерации JSDoc.
 */
export interface InitParams {
    /**
     * Опции для генерации кэша.
     */
    cacheOptions?: FileSystemCacheOptions | null;
    /**
     * Директория, в которой хранится кэш.
     */
    cacheDir?: string | null;
    /**
     * Опции проекта, которые могут включать в себя настройки, специфичные для текущего проекта.
     *
     * @type {ProjectOptions}
     */
    projectOptions?: Partial<ProjectOptions> | null;
    /**
     * Массив строк, представляющих пути к файлам, которые будут обрабатываться сервисом.
     *
     * @type {string[]}
     */
    files?: string[] | null;

    /**
     * Сервис для генерации JSDoc.
     */
    jsDocGeneratorService: JSDocGeneratorService;

    /**
     * Глобальные опции генерации.
     */
    globalGenerationOptions?: GenerationOptions | null;

    /**
     * Опции детальной генерации.
     */
    detailGenerationOptions?: DetailGenerationOptions | null;

    /**
     * Флаг указывающий, отключено ли кэширование.
     */
    disabledCached?: boolean | null;

    /**
     * Количество попыток повторения операции в случае неудачи.
     */
    retries?: number | null;
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
    /**
     * Опции JSDoc
     */
    jsDocOptions: JSDocOptions;
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
 * Интерфейс для установки JSDoc комментариев к узлам.
 * @template Kind - Тип декларации узла.
 */
export interface JSDocNodeSetter<Kind extends KindDeclarationNames = KindDeclarationNames> {
    /**
     * Тип декларации узла.
     */
    kind: Kind;
    /**
     * Устанавливает JSDoc комментарий к узлу.
     * @template CurrentNode - Текущий узел, который поддерживает JSDoc комментарии.
     * @param {SetJSDocToNodeParams<CurrentNode>} params - Параметры для установки JSDoc комментария.
     * @returns {Promise<void>} - Промис, который резолвится после установки JSDoc комментария.
     */
    setJSDocToNode<CurrentNode extends ASTJSDocableNode>(
        params: SetJSDocToNodeParams<CurrentNode>
    ): Promise<void>;
}

/**
 * Интерфейс, представляющий исходный код файла и узла
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

    /**
     * Настройки JSDoc
     */
    jsDocOptions: JSDocOptions;
}

/**
 * Информация, необходимая для генерации JSDoc комментариев.
 */
export interface JSDocGenerationInfo {
    /**
     * Файл исходного кода, к которому относится узел.
     */
    sourceFile: SourceFile;
    /**
     * Узел (Node) в абстрактном синтаксическом дереве (AST).
     */
    node: Node;
    /**
     * Тип объявления (например, переменная, функция, класс).
     */
    kind: KindDeclarationNames;
}
