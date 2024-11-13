import { defineConfig } from 'tsup';
import { sassPlugin } from 'esbuild-sass-plugin';

export default defineConfig((options) => ({
  entry: ['src/index.ts', 'src/style/index.scss'],
  format: ['cjs', 'esm'], // Build for commonJS and ESmodules
  outDir: 'dist',
  dts: true, // Generate declaration file (.d.ts)
  sourcemap: false,
  clean: true,
  tsconfig: './tsconfig.json',
  minify: !options.watch,
  target: ['es2020', 'node18'],
  esbuildPlugins: [
    sassPlugin({
      type: 'css',
    }),
  ],
}));
