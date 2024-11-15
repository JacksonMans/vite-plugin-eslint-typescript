import { defineConfig } from 'tsup';
import { sassPlugin } from 'esbuild-sass-plugin';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'], // Build for commonJS and ESmodules
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
    sassPlugin({
      type: 'css-text',
    }),
  ],
}));
