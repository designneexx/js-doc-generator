import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts', 'src/cli.ts'],
  bundle: true,
  platform: 'node',
  outdir: 'dist',
  packages: 'external',
});

await esbuild.build({
    entryPoints: ['src/cli.ts'],
    bundle: true,
    external: ['.'],
    platform: 'node',
    outdir: 'dist',
    packages: 'external',
})