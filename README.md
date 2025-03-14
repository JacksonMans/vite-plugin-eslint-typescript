# @mawns/vite-plugin-eslint

![Static Badge](https://img.shields.io/badge/ESLint-^9.0.0-blue)
![Static Badge](https://img.shields.io/badge/Vite-^6.0.0-blue)
![Static Badge](https://img.shields.io/badge/License-MIT-green)

Plugin to show ESLint output in custom HMR overlay, (working on typescript)

## Install

```
npm install @mawns/vite-plugin-eslint -D
# or
yarn add @mawns/vite-plugin-eslint -D
```

## Usage

```js
import { defineConfig } from 'vite';
import eslintOverlay from '@mawns/vite-plugin-eslint';

export default defineConfig({
  ...
  plugins: [
    ...
    eslintOverlay()
  ]
});
```

#### This plugin uses configuration from an existing ESLint config file and ESLint should be set up in your project beforehand.

## Options

You can pass an options object to the plugin in order to customize some of its behaviour

#### useCache

- Type: `boolean`
- Default: `true`

Cache previous eslint results to speed up process.

---
#### useConsole

- Type: `boolean`
- Default: `false`

Print output to the console.

---
#### useCustomOverlay

- Type: `boolean`
- Default: `true`

Print output to the custom HMR overlay.

---
#### showWarnings

- Type: `boolean`
- Default: `true`

Include eslint Warnings in the output.

## License - MIT