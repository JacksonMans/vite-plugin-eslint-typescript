import { ESLint } from 'eslint';
import { PluginOption } from 'vite';
import { defaultOptions } from './constants';
import { formatEslintForCustomOverlay } from 'formatters';
import { ViteEslintPluginOptions } from 'types';
//@ts-ignore
import script from 'inline:./script/index.mjs';

const viteEslintPlugin = (
  userOptions?: ViteEslintPluginOptions
): PluginOption => {
  const { useCache, useConsole, showWarnings, useCustomOverlay } = {
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
    configureServer: async (server) => {
      server.hot.on('vite-plugin-eslint:connected', async () => {
        const eslintResults = await linter.lintFiles('*/**/*');

        if (useConsole) {
          const formatter = await linter.loadFormatter('stylish');
          const consoleFormat = await formatter.format(eslintResults);
          if (consoleFormat) {
            console.log(consoleFormat);
          }
        }

        if (useCustomOverlay) {
          const customFormat = formatEslintForCustomOverlay(eslintResults);

          server.ws.send({
            type: 'custom',
            event: 'lint',
            data: customFormat,
          });
        }
      });
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

      if (useCustomOverlay) {
        const customFormat = formatEslintForCustomOverlay(eslintResults);

        ctx.server.ws.send({
          type: 'custom',
          event: 'lint',
          data: customFormat,
        });
      }
    },
  };
};

export default viteEslintPlugin;
