# vite-plugin-eslint-typescript

![Static Badge](https://img.shields.io/badge/ESLint->=9.0.0-blue)
![Static Badge](https://img.shields.io/badge/Vite->=7.0.0-blue)
![Static Badge](https://img.shields.io/badge/TypeScript->=5.0.0_(optional)-blue)
![Static Badge](https://img.shields.io/badge/License-MIT-green)

Vite plugin that runs ESLint and TypeScript type-checking during development, displaying errors and warnings in a custom HMR overlay and optionally in the console.

Both ESLint and TypeScript run in **background worker threads** so they never block the dev server. The overlay features clickable file paths that open your editor at the exact error location, and an optional "Fix in Cursor" button that can auto-fix errors via AI.

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
  editor: 'cursor',
  cursorMode: 'acp',
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

Display results in a custom in-browser overlay. The overlay groups errors by file and shows line/column details, severity, and rule IDs. File paths and line numbers are clickable and open the file in your editor at the exact error position.

---

### showWarnings

- Type: `boolean`
- Default: `true`

Include warnings (not just errors) in the output.

---

### useTypeScript

- Type: `boolean`
- Default: `true`

Enable TypeScript type-checking via a background worker thread. The worker uses `ts.createWatchProgram` with incremental compilation to keep the TypeScript program in memory and re-check only changed files. Requires `typescript` to be installed in your project.

Set to `false` to disable TypeScript checking entirely (e.g. if you don't use TypeScript or prefer a separate checker).

---

### editor

- Type: `'cursor' | 'vscode' | string`
- Default: `'cursor'`

Editor protocol used when clicking file paths in the overlay. Clicking a file path or line number opens the file at the error location using the `{editor}://file/...` URL scheme.

Built-in values:
- `'cursor'` — opens files in Cursor
- `'vscode'` — opens files in VS Code

Any other string is used directly as the protocol (e.g. `'windsurf'` becomes `windsurf://file/...`).

---

### cursorMode

- Type: `'deeplink' | 'acp'`
- Default: `'deeplink'`

Controls the "Fix in Cursor" button behavior in the overlay.

- `'deeplink'` — opens the Cursor editor with a pre-filled prompt containing the errors. The user reviews and confirms the fix.
- `'acp'` — spawns a headless Cursor agent via the Agent Client Protocol (ACP) that automatically fixes the errors without manual confirmation. The overlay streams the agent's progress in real time, showing thoughts, tool calls, and messages.

ACP mode requires the [Cursor Agent CLI](https://docs.cursor.com/agent/acp) to be installed and authenticated.

## How it works

- **ESLint** runs in a dedicated worker thread. When Vite detects a file change via `handleHotUpdate`, it notifies the worker which debounces and re-lints. Results are sent to the overlay and/or console via HMR websocket.
- **TypeScript** runs in a separate worker thread using `ts.createWatchProgram` with `incremental: true` for fast startup via `.tsbuildinfo` caching. It detects changes via OS file-system events and incrementally re-analyzes only affected files. Diagnostics are debounced and forwarded to the overlay.
- The **overlay** displays ESLint and TypeScript results in separate labeled sections with a combined error/warning badge. File paths and line numbers are clickable — they open the file in your editor at the exact error position.
- The **Fix in Cursor** button appears when errors are present. In deeplink mode it opens Cursor with a prompt; in ACP mode it spawns a headless agent and streams its progress live in the overlay.
- Projects using TypeScript **project references** (`tsconfig.json` with `references`) are fully supported — the worker creates a watch program per referenced config.

## License

MIT
