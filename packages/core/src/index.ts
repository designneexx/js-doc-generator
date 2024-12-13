#!/usr/bin/env node
import { runByCli } from './cli';

export * from './utils/init';
export * from './types/common';

function main() {
    runByCli().parse(process.argv);
}

if (require.main === module) {
    main();
}
