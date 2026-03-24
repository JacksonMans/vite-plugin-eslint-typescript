# vite-plugin-eslint-typescript

![Static Badge](https://img.shields.io/badge/ESLint->=9.0.0-blue)
![Static Badge](https://img.shields.io/badge/Vite->=7.0.0-blue)
![Static Badge](https://img.shields.io/badge/TypeScript->=5.0.0_(optional)-blue)
![Static Badge](https://img.shields.io/badge/License-MIT-green)

Vite plugin that runs ESLint and TypeScript type-checking during development, displaying errors and warnings in a custom HMR overlay and optionally in the console.

TypeScript checking runs in a **background worker thread** using the TypeScript watch API, so it never blocks the dev server and re-checks only changed files and their dependents.

## Install

```
npm install vite-plugin-eslint-typescript -D
# or
yarn add vite-plugin-eslint-typescript -D
```

## Prerequisites

- **ESLint >= 9.0.0** must be installed and configured in your project.
- **TypeScript >= 5.0.0** is required for type-checking (optional — the plugin works fine without it).

## Usage

```ts
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint-typescript';

export default defineConfig({
  plugins: [
    eslint(),
  ],
});
```

### With options

```ts
eslint({
  useCache: true,
  useConsole: false,
  useCustomOverlay: true,
  showWarnings: true,
  useTypeScript: true,
})
```

## Options

### useCache

- Type: `boolean`
- Default: `true`

Use ESLint's built-in caching to speed up subsequent lint runs.

---

### useConsole

- Type: `boolean`
- Default: `false`

Print ESLint and TypeScript diagnostics to the terminal console.

---

### useCustomOverlay

- Type: `boolean`
- Default: `true`

Display results in a custom in-browser overlay. The overlay groups errors by file and shows line/column details, severity, and rule IDs.

---

### showWarnings

- Type: `boolean`
- Default: `true`

Include warnings (not just errors) in the output.

---

### useTypeScript

- Type: `boolean`
- Default: `true`

Enable TypeScript type-checking via a background worker thread. The worker uses `ts.createWatchProgram` to keep the TypeScript program in memory and incrementally re-check only changed files. Requires `typescript` to be installed in your project.

Set to `false` to disable TypeScript checking entirely (e.g. if you don't use TypeScript or prefer a separate checker).

## How it works

- **ESLint** runs on `handleHotUpdate` (file save) and on initial overlay connection. Results are sent to the overlay and/or console.
- **TypeScript** runs in a separate `Worker` thread. A persistent watch program detects file changes via OS file-system events and incrementally re-analyzes only the affected files and their dependents. Diagnostics are debounced and forwarded to the overlay via Vite's HMR websocket.
- The overlay displays ESLint and TypeScript results in separate labeled sections, with a combined error/warning badge.
- Projects using TypeScript **project references** (`tsconfig.json` with `references`) are fully supported — the worker creates a watch program per referenced config.

## License

MIT
