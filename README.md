# @mawns/vite-plugin-eslint

![Static Badge](https://img.shields.io/badge/ESLint-9.x.x-blue)
![Static Badge](https://img.shields.io/badge/Vite-5.x.x-blue)
![Static Badge](https://img.shields.io/badge/License-MIT-green)

Plugin to show ESLint output in vite HMR overlay

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

## Options

You can pass an options object to the plugin in order to customize some of its behaviour

### useCache

- Type: `boolean`
- Default: `true`

Cache previous eslint results to speed up process.

### useConsole

- Type: `boolean`
- Default: `false`

Print output to the console.

### useHmrOverlay

- Type: `boolean`
- Default: `true`

Print output to the HMR overlay.

### showWarnings

- Type: `boolean`
- Default: `true`

Include eslint Warnings in the output.

## License

MIT
