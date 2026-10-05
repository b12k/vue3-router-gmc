import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    { format: 'esm', syntax: 'esnext', dts: { distPath: './dist' } },
    {
      format: 'cjs',
      syntax: 'esnext',
      dts: { autoExtension: true, distPath: './dist/cjs' },
      output: { distPath: { root: './dist/cjs' } },
    },
  ],
  source: { entry: { index: './src/index.ts' } },
  output: { cleanDistPath: true, minify: true },
});
