import * as esbuild from 'esbuild';
import { dtsPlugin } from "esbuild-plugin-d.ts";

await Promise.all([
  esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    outdir: 'dist',
    plugins: [dtsPlugin()]
  }),
  esbuild.build({
    entryPoints: ['src/cli.ts'],
    bundle: true,
    external: ['.'],
    platform: 'node',
    outdir: 'dist',
    packages: 'external',
    external: ['esbuild'],
  })
]);
