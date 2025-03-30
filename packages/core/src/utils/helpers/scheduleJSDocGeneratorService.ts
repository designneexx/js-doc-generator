import { JSDocGeneratorService, JSDocGeneratorServiceOptions } from 'src/types/common';
import { Scheduler, SuccessTask } from './createScheduler';
import { retryAsyncRequest } from './retryAsyncRequest';

export interface ScheduleJSDocGeneratorServiceParams {
    jsDocGeneratorService: JSDocGeneratorService;
    jsDocGeneratorServiceScheduler?: Scheduler<string> | null;
    retries?: number;
    notifySuccess?(data: string, retries: number): void;
    notifyError?(error: unknown, retries: number): void;
}

/**
 * Генерирует обёртку вокруг сервиса генерации JSDoc.
 * @param {JSDocGeneratorService} jsDocGeneratorService - Сервис генерации JSDoc.
 * @param {Scheduler | null} [jsDocGeneratorServiceScheduler] - Планировщик задач для сервиса генерации JSDoc (необязательный).
 * @returns {JSDocGeneratorService} Обёртка вокруг сервиса генерации JSDoc.
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
