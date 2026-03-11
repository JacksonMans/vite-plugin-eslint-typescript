import { defineConfig } from 'vite';
import { viteEslintPlugin } from './src/plugin/plugin';
import dts from 'vite-plugin-dts';
import path from 'path';
import * as sass from 'sass';
import { OverlayEvents } from './src/plugin/types';
const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  build: {
    lib: {
      entry: {
        plugin: './src/plugin/plugin.ts',
        script: './src/plugin/script.ts',
        'typescript-worker': './src/plugin/typescript-worker.ts',
      },
      formats: ['es'],
    },
    copyPublicDir: true,
    minify: 'esbuild',
    outDir: 'dist',
    rollupOptions: {
      external: [
          'sass',
          'eslint',
          'typescript',
          'worker_threads',
          'path',
          'url',
          'fs',
        ],
      output: {
        format: 'es',
        interop: 'auto',
      },
    },
  },
  define: !isDev
    ? {
        'import.meta.hot': 'import.meta.hot',
        'import.meta.env.DEV': 'true',
      }
    : {},
  plugins: [
    {
      name: 'update-imports',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('script.ts')) {
          const cssContent = sass.compile(
            path.resolve(__dirname, 'src/plugin/style.scss'),
            { style: 'compressed' },
          ).css;

          return code.replaceAll(`'cssToBeReplaced'`, `\`${cssContent}\``);
        }
      },
    },
    {
      name: 'rewrite-script-import',
      enforce: 'pre',
      apply: 'build',
      transform(code, id) {
        if (id.endsWith('plugin.ts')) {
          return code.replaceAll(
            `/src/plugin/script`,
            '@mawns/vite-plugin-eslint/script',
          );
        }
      },
    },
    {
      name: 'reinject-sass',
      handleHotUpdate({ server }) {
        const cssContent = sass.compile(
          path.resolve(__dirname, 'src/plugin/style.scss'),
          {
            style: 'compressed',
          },
        ).css;
        server.ws.send({
          type: 'custom',
          event: OverlayEvents.styleUpdate,
          data: cssContent,
        });
        return;
      },
    },
    dts({
      outDir: 'dist',
      entryRoot: './src/plugin',
      tsconfigPath: './tsconfig.json',
      rollupTypes: true,
      compilerOptions: { removeComments: true },
    }),
    viteEslintPlugin(),
  ],
});
