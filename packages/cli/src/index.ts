#!/usr/bin/env node
import { runByCli } from './cli';

/**
 * Основная функция, запускающая парсер командной строки
 */
function main() {
    runByCli().parse(process.argv);
}

if (require.main === module) {
    main();
}