import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/mock.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'Workast',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    footer: {
      js: 'Workast = Workast.Workast;',
    },
  },
]);
