/**
 * Проверяет, было ли обещание разрешено и результат равен true
 * @param {PromiseSettledResult<boolean>} item - Результат обещания
 * @returns {boolean} - true, если обещание было разрешено и результат равен true, иначе false
 */
export function isPromiseResolvedAndTrue(item: PromiseSettledResult<boolean>): boolean {
    if (item.status === 'fulfilled') {
        return item.value;
    }

    return false;
}
