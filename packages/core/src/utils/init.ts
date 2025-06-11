import { type InitParams } from '../types/common';

import { generateJsDocs } from './generateJsDocs';
import { fromAsync } from './helpers/fromAsync';

/**
 * Инициализирует процесс генерации JSDoc комментариев для указанных файлов и опций проекта.
 * @param {InitParams} params - Параметры инициализации.
 * @returns {Promise<void>} - Промис без возвращаемого значения.
 */
export async function init(params: InitParams): Promise<void> {
    /**
     * Переменная items содержит результат выполнения асинхронной функции fromAsync с аргументом, который является результатом выполнения функции generateJsDocs с параметром params.
     * @type {Array<any>} Массив элементов, полученных после обработки параметров функцией generateJsDocs и передачи их в функцию fromAsync.
     */
    const items = await fromAsync(generateJsDocs(params));
    /**
     * Массив промисов, возвращаемых из метода save каждого элемента массива items.
     * @type {Promise<void>[]}
     */
    const promises = items.map((item) => item.save());

    /**
     * Дожидается разрешения всех промисов сохранения.
     */
    await Promise.allSettled(promises);
}
