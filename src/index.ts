import { ESLint } from 'eslint';
import { PluginOption } from 'vite';
import { defaultOptions } from './constants';
import {
  formatEslintForHmrOverlay,
  formatEslintForCustomOverlay,
} from 'formatters';
import { ViteEslintPluginOptions } from 'types';
//@ts-ignore
import script from 'inline:./script/index.mjs';

const viteEslintPlugin = (
  userOptions?: ViteEslintPluginOptions
): PluginOption => {
  const {
    useCache,
    useConsole,
    useHmrOverlay,
    showWarnings,
    useCustomOverlay,
  } = {
    ...defaultOptions,
    ...userOptions,
  };

  const linter = new ESLint({
    cache: useCache,
    warnIgnored: !showWarnings,
  });
  let prevTimeStamp = 0;

  return {
    name: '@mans/vite-plugin-eslint',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [
        {
          tag: 'script',
          attrs: {
            type: 'module',
          },
          injectTo: 'head',
          children: script,
        },
      ],
    },
    handleHotUpdate: async (ctx) => {
      if (ctx.timestamp - prevTimeStamp < 1000) {
        return;
      }
      prevTimeStamp = ctx.timestamp;

      const eslintResults = await linter.lintFiles('*/**/*');

      if (useConsole) {
        const formatter = await linter.loadFormatter('stylish');
        const consoleFormat = await formatter.format(eslintResults);
        if (consoleFormat) {
          console.log(consoleFormat);
        }
      }

      if (useHmrOverlay) {
        const textFormat = formatEslintForHmrOverlay(eslintResults);
        if (textFormat) {
          ctx.server.ws.send({
            type: 'error',
            err: {
              message: textFormat,
              stack: '',
            },
          });
          return [];
        }
        return;
      }
      if (useCustomOverlay) {
        const customFormat = formatEslintForCustomOverlay(eslintResults);
        if (customFormat) {
          ctx.server.ws.send({
            type: 'custom',
            event: 'lint',
            data: customFormat,
          });
          return [];
        }
      }
      return;
    },
  };
};

export default viteEslintPlugin;
