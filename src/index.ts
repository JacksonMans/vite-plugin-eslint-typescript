import { ESLint, Linter } from 'eslint';
import { PluginOption } from 'vite';
import { ViteEslintPluginOptions } from './types';
import { defaultOptions } from './constants';
import styles from './style';

const formatEslintForHmrOverlay = (lintResults: ESLint.LintResult[]) => {
  const formatMessage = (message: Linter.LintMessage) =>
    `${message.line}:${message.column}  ${
      message.severity === 1 ? 'Warning' : 'Error'
    }  ${message.message}  ${message.ruleId}`;

  const formatLintResult = (result: ESLint.LintResult) =>
    `${result.filePath}\n  ${result.messages.map(formatMessage).join('\n')}`;

  return lintResults
    .filter((el) => el.messages.length)
    .map(formatLintResult)
    .join('\n');
};

const viteEslintPlugin = (
  userOptions?: ViteEslintPluginOptions
): PluginOption => {
  const { useCache, useConsole, useHmrOverlay, showWarnings } = {
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
          attrs: { type: 'text/css' },
          children: styles,
        },
        {
          tag: 'div',
          attrs: {
            id: 'mawns_eslint-overlay-outer',
          },
          injectTo: 'body',
          children: [
            {
              tag: 'div',
              attrs: {
                id: 'mawns_eslint-overlay-inner',
              },
              children: [
                {
                  tag: 'div',
                  attrs: {
                    class: 'header',
                  },
                },
                {
                  tag: 'div',
                  attrs: {
                    class: 'content',
                  },
                },
                {
                  tag: 'div',
                  attrs: {
                    class: 'footer',
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
        } else {
          return;
        }
      }
      return;
    },
  };
};

export default viteEslintPlugin;
