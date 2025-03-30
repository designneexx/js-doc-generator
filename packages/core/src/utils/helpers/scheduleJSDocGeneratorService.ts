import { JSDocGeneratorService, JSDocGeneratorServiceOptions } from 'src/types/common';
import { Scheduler, SuccessTask } from './createScheduler';
import { retryAsyncRequest } from './retryAsyncRequest';

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
    /**
     * Функция уведомления об успешном завершении с передачей данных и количеством повторов.
     */
    notifySuccess?(data: string, retries: number): void;
    /**
     * Функция уведомления об ошибке с передачей ошибки и количеством повторов.
     */
    notifyError?(error: unknown, retries: number): void;
}

/**
 * Генератор JSDoc сервиса по расписанию.
 * @param {ScheduleJSDocGeneratorServiceParams} params - Параметры для создания сервиса.
 * @returns {JSDocGeneratorService} Обёрнутый сервис JSDocGeneratorService.
 */
export function scheduleJSDocGeneratorService(
    params: ScheduleJSDocGeneratorServiceParams
): JSDocGeneratorService {
    const {
        jsDocGeneratorService,
        jsDocGeneratorServiceScheduler,
        retries = 1,
        notifyError,
        notifySuccess
    } = params;

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
                    retries,
                    notifySuccess: (result, currentRetries) =>
                        notifySuccess?.((result as SuccessTask<string>).value, currentRetries),
                    notifyError
                });

                if (result.success) {
                    return result.value;
                }

                throw result.error;
            }

            return jsDocGeneratorService[key](params);
        };
    };
    const wrappedJSDocGeneratorService: JSDocGeneratorService = {
        createJSDocClass: wrapGetJsDocServiceMethod('createJSDocClass'),
        createJSDocEnum: wrapGetJsDocServiceMethod('createJSDocEnum'),
        createJSDocFunction: wrapGetJsDocServiceMethod('createJSDocFunction'),
        createJSDocTypeAlias: wrapGetJsDocServiceMethod('createJSDocTypeAlias'),
        createJSDocInterface: wrapGetJsDocServiceMethod('createJSDocInterface'),
        createJSDocVariableStatement: wrapGetJsDocServiceMethod('createJSDocVariableStatement')
    };

    return wrappedJSDocGeneratorService;
}
