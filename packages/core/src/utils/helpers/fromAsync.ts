/**
 * Преобразует асинхронный итерируемый объект в массив значений.
 * @template T
 * @param {AsyncIterable<T>} list - Асинхронный итерируемый объект.
 * @returns {Promise<T[]>} - Обещание массива значений.
 */
export async function fromAsync<T>(list: AsyncIterable<T>): Promise<T[]> {
    /**
     * Массив, содержащий элементы типа T
     * @type {T[]}
     */
    const result: T[] = [];

    for await (const item of list) {
        result.push(item);
    }

    return result;
}
