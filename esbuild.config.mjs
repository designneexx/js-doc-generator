import * as esbuild from 'esbuild';
import { dtsPlugin } from "esbuild-plugin-d.ts";

await esbuild.build({
  entryPoints: ['src/index.ts', 'src/cli.ts'],
  bundle: true,
  platform: 'node',
  outdir: 'dist',
  // external: ['esbuild'],
  packages: 'external',
  plugins: [dtsPlugin()]
});

await esbuild.build({
    entryPoints: ['src/cli.ts'],
    bundle: true,
    external: ['.'],
    platform: 'node',
    outdir: 'dist',
    packages: 'external',
    external: ['esbuild'],
})