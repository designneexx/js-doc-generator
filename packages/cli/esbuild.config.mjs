import { execSync } from 'child_process';
import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    outdir: 'dist',
    tsconfig: 'tsconfig.json',
    external: [
        'esbuild',
        '@auto-js-doc-generator/core',
        '@auto-js-doc-generator/cli',
        '@auto-js-doc-generator/client',
        'auto-js-doc-generator'
    ],
    plugins: [
        {
            name: 'TypeScriptDeclarationsPlugin',
            setup(build) {
                build.onEnd((result) => {
                    if (result.errors.length > 0) return;
                    execSync('tsc && tsc-alias');
                });
            }
        }
    ]
});
