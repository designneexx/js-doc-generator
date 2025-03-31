import { JSDocGeneratorService, JSDocGeneratorServiceOptions } from 'src/types/common';
import { Scheduler } from './createScheduler';
import { RetriedResponse, retryAsyncRequest } from './retryAsyncRequest';

/**
 * Параметры для службы генерации JSDoc расписания.
 */
export interface ScheduleJSDocGeneratorServiceParams {
    /**
     * Служба генерации JSDoc.
     */
    jsDocGeneratorService: JSDocGeneratorService;
    /**
     * Планировщик для службы генерации JSDoc. Может быть null.
     */
    jsDocGeneratorServiceScheduler?: Scheduler<string> | null;
    /**
     * Количество попыток повтора.
     */
    retries?: number;
}

/**
 * Тип JSDocGeneratorServiceWithRetries представляет собой объект, который содержит асинхронные функции для генерации JSDoc с возможностью повторных попыток.
 * Ключи объекта соответствуют ключам из типа JSDocGeneratorService, а значения - функциям, возвращающим Promise с результатом типа RetriedResponse<string>.
 */
export type JSDocGeneratorServiceWithRetries = {
    [Key in keyof JSDocGeneratorService]: (
        options: JSDocGeneratorServiceOptions
    ) => Promise<RetriedResponse<string>>;
};

/**
 * Генератор JSDoc сервиса по расписанию.
 * @param {ScheduleJSDocGeneratorServiceParams} params - Параметры для создания сервиса.
 * @returns {JSDocGeneratorService} Обёрнутый сервис JSDocGeneratorService.
 */
export function scheduleJSDocGeneratorService(
    params: ScheduleJSDocGeneratorServiceParams
): JSDocGeneratorServiceWithRetries {
    const { jsDocGeneratorService, jsDocGeneratorServiceScheduler, retries = 1 } = params;

    /**
     * Обёртка вокруг метода сервиса JSDocGeneratorService.
     * @param {keyof JSDocGeneratorService} key - Ключ метода сервиса JSDocGeneratorService.
     * @returns {Promise<any>} Результат выполнения метода сервиса JSDocGeneratorService.
     */
    const wrapGetJsDocServiceMethod = (key: keyof JSDocGeneratorService) => {
        return async (params: JSDocGeneratorServiceOptions) => {
            if (jsDocGeneratorServiceScheduler) {
                const result = await retryAsyncRequest({
                    run: () =>
                        jsDocGeneratorServiceScheduler.runTask(() =>
                            jsDocGeneratorService[key](params)
                        ),
                    retries
                });

                if (result.value.success) {
                    return { retries: result.retries, value: result.value.value };
                }

                throw result.value.error;
            }

            const result = await retryAsyncRequest({
                run: () => jsDocGeneratorService[key](params),
                retries
            });

            return result;
        };
    };
    const wrappedJSDocGeneratorService: JSDocGeneratorServiceWithRetries = {
        createJSDocClass: wrapGetJsDocServiceMethod('createJSDocClass'),
        createJSDocEnum: wrapGetJsDocServiceMethod('createJSDocEnum'),
        createJSDocFunction: wrapGetJsDocServiceMethod('createJSDocFunction'),
        createJSDocTypeAlias: wrapGetJsDocServiceMethod('createJSDocTypeAlias'),
        createJSDocInterface: wrapGetJsDocServiceMethod('createJSDocInterface'),
        createJSDocVariableStatement: wrapGetJsDocServiceMethod('createJSDocVariableStatement')
    };

    return wrappedJSDocGeneratorService;
}
