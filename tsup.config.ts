import { defineConfig } from "tsup";
import tsconfig from "./tsconfig.json";

export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"], // Build for commonJS and ESmodules
  dts: true, // Generate declaration file (.d.ts)
  experimentalDts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  tsconfig: "./tsconfig.json",
  minify: !options.watch,
  target: tsconfig.compilerOptions.target,
}));
