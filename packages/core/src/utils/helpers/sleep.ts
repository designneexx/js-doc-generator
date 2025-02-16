/**
 * Функция задержки выполнения на указанное количество миллисекунд
 * @param {number} ms - Количество миллисекунд для задержки
 * @returns {Promise<void>} - Промис, который разрешается после указанной задержки
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
