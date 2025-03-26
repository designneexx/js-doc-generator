import { JSDocGeneratorService, JSDocGeneratorServiceOptions } from 'src/types/common';
import { Scheduler } from './createScheduler';

/**
 * Генерирует обёртку вокруг сервиса генерации JSDoc.
 * @param {JSDocGeneratorService} jsDocGeneratorService - Сервис генерации JSDoc.
 * @param {Scheduler | null} [jsDocGeneratorServiceScheduler] - Планировщик задач для сервиса генерации JSDoc (необязательный).
 * @returns {JSDocGeneratorService} Обёртка вокруг сервиса генерации JSDoc.
 */
export function scheduleJSDocGeneratorService(
    jsDocGeneratorService: JSDocGeneratorService,
    jsDocGeneratorServiceScheduler?: Scheduler<string> | null
): JSDocGeneratorService {
    /**
     * Обёртка вокруг метода сервиса JSDocGeneratorService.
     * @param {keyof JSDocGeneratorService} key - Ключ метода сервиса JSDocGeneratorService.
     * @returns {Promise<any>} Результат выполнения метода сервиса JSDocGeneratorService.
     */
    const wrapGetJsDocServiceMethod = (key: keyof JSDocGeneratorService) => {
        return async (params: JSDocGeneratorServiceOptions) => {
            if (jsDocGeneratorServiceScheduler) {
                const result = await jsDocGeneratorServiceScheduler.runTask(() =>
                    jsDocGeneratorService[key](params)
                );

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
