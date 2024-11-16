import { defineConfig } from 'tsup';
import { sassPlugin } from 'esbuild-sass-plugin';
import inlineImportPlugin from 'esbuild-plugin-inline-import';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['esm'], // Build for commonJS and ESmodules
  outDir: 'dist',
  experimentalDts: false,
  dts: true, // Generate declaration file (.d.ts)
  sourcemap: false,
  clean: true,
  tsconfig: './tsconfig.json',
  splitting: false,
  minify: !options.watch,
  target: ['es2020', 'node18'],
  esbuildPlugins: [
    inlineImportPlugin(),
    sassPlugin({
      type: 'css',
    }),
  ],
}));
