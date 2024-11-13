import { ESLint, Linter } from 'eslint';
import { PluginOption } from 'vite';
import { ViteEslintPluginOptions } from './types';
import { defaultOptions } from './constants';

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
          children: `#mawns_eslint-overlay-outer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  z-index: 1000;
  justify-content: center;
  align-items: center;
  background-color: rgba(70, 70, 70, 0.5);
  display: none;
}
#mawns_eslint-overlay-outer .active {
  display: flex;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner {
  display: block;
  border: 1px solid rgb(58, 58, 58);
  max-width: 1000px;
  width: 90%;
  height: 95%;
  background-color: rgba(19, 19, 19, 0.5);
  z-index: 1001;
  border-radius: 0.5rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar {
  width: 14px;
  height: 14px;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-corner {
  background-color: transparent;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-track {
  background: transparent;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-thumb {
  height: 6px;
  border: 4px solid rgba(0, 0, 0, 0);
  background-color: rgba(0, 0, 0, 0.2);
  background-clip: padding-box;
  -webkit-border-radius: 7px;
  -webkit-box-shadow: inset -1px -1px 0px rgba(0, 0, 0, 0.05), inset 1px 1px 0px rgba(0, 0, 0, 0.05);
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.4);
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .header {
  background-color: rgba(8, 8, 8, 0.5);
  height: 3rem;
  color: rgb(179, 59, 59);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem 0;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .header::before {
  content: "ESLint run resulted in errors and/or warnings!";
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: auto;
  padding: 1rem 2rem;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .file-wrapper {
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgb(105, 105, 105);
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .result {
  margin: 0;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .file {
  margin-bottom: 0.2rem;
  color: white;
  text-decoration: underline;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .warning {
  color: rgb(216, 183, 36);
  margin-right: 1rem;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .error {
  color: rgb(179, 59, 59);
  margin-right: 1rem;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .row-details {
  margin-right: 1rem;
  color: #636363;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .error-name {
  margin-left: 1rem;
  color: #636363;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .footer {
  background-color: rgba(8, 8, 8, 0.5);
  height: 3rem;
  color: rgb(136, 120, 51);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem 0;
}
#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .footer::before {
  content: "Press ESC or click anywhere outside this window to close";
}`,
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
