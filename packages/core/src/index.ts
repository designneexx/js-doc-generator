#!/usr/bin/env node
import { runByCli } from './cli';

export * from './utils/init';
export * from './types/common';
export * from './utils/helpers/loadConfigFile';

/**
 * Основная функция, запускающая парсер командной строки
 */
function main() {
    runByCli().parse(process.argv);
}

if (require.main === module) {
    main();
}
