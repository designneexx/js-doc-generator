/**
 * Класс представляет ошибку, возникающую при итерации по всем узлам во всех файлах
 */
export class AllJSDocIterationError extends Error {
    /**
     * Создает экземпляр ошибки при итерации по всем узлам во всех файлах
     * @param errorList Список результатов отклоненных обещаний
     * @param message Сообщение об ошибке (по умолчанию 'Ошибка при итерации по всем узлам во всех файлах')
     * @param options Дополнительные параметры ошибки
     */
    constructor(
        public readonly errorList: PromiseRejectedResult[],
        public readonly message = 'Ошибка при итерации по всем узлам во всех файлах'
    ) {
        super(message);
    }
}
