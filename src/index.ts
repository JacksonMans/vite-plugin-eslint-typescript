import { ESLint } from 'eslint';
import { PluginOption } from 'vite';
import { defaultOptions } from './constants';
import {
  formatEslintForHmrOverlay,
  formatEslintForCustomOverlay,
} from 'formatters';
import { ViteEslintPluginOptions, OverlayIds, OverlayClassNames } from 'types';
import fs from 'fs';

const script = fs.readFileSync(
  './node_modules/@mawns/vite-plugin-eslint/dist/script/index.mjs',
  'utf-8'
);
const styles = fs.readFileSync(
  './node_modules/@mawns/vite-plugin-eslint/dist/style/index.css',
  'utf-8'
);

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
          tag: 'style',
          attrs: {
            type: 'text/css',
          },
          injectTo: 'head',
          children: styles,
        },
        {
          tag: 'script',
          attrs: {
            type: 'module',
          },
          injectTo: 'head',
          children: script,
        },
        {
          tag: 'div',
          attrs: {
            id: OverlayIds.outer,
          },
          injectTo: 'body',
          children: [
            {
              tag: 'div',
              attrs: {
                id: OverlayIds.inner,
              },
              children: [
                {
                  tag: 'div',
                  attrs: {
                    class: OverlayClassNames.header,
                  },
                },
                {
                  tag: 'div',
                  attrs: {
                    class: OverlayClassNames.content,
                  },
                },
                {
                  tag: 'div',
                  attrs: {
                    class: OverlayClassNames.footer,
                  },
                },
              ],
            },
          ],
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
        ctx.server.ws.send({
          type: 'custom',
          event: 'lint',
          data: customFormat,
        });
        return [];
      }
      return;
    },
  };
};

export default viteEslintPlugin;
