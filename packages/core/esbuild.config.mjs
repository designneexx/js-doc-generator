import { execSync } from 'child_process';
import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    external: ['esbuild', 'ts-morph'],
    outdir: 'dist',
    tsconfig: 'tsconfig.json',
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
