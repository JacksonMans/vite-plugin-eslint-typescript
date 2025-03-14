import { ESLint } from 'eslint';
import { PluginOption } from 'vite';

import { defaultOptions } from './constants';
import { formatEslintForCustomOverlay } from './formatters';
import {
  OverlayAssets,
  OverlayEvents,
  ViteTypescriptEslintPluginOptions,
} from './types';

export const viteEslintPlugin = (
  userOptions?: ViteTypescriptEslintPluginOptions,
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
    name: '@mawns/vite-plugin-eslint',
    resolveId(id) {
      if (id === OverlayAssets.script) {
        return id;
      }
      if (id === OverlayAssets.badgeError) {
        return id;
      }
      if (id === OverlayAssets.badgeWarning) {
        return id;
      }
    },
    load(id) {
      if (id === OverlayAssets.script) {
        return `
        export { load } from "/src/plugin/script";
        `;
      }
      if (id === OverlayAssets.badgeError) {
        return `/badge-error.svg`;
      }
      if (id === OverlayAssets.badgeWarning) {
        return `/badge-warning.svg`;
      }
    },
    transformIndexHtml: {
      order: 'pre',
      handler: () => {
        return [
          {
            tag: 'script',
            attrs: {
              type: 'module',
            },
            children: `
              import { load } from "${OverlayAssets.script}";
              load();
              `,
          },
          {
            tag: 'mawns-vite-plugin-eslint-overlay',
            injectTo: 'body',
          },
        ];
      },
    },
    configureServer: async (server) => {
      server.ws.on(OverlayEvents.connected, async () => {
        try {
          const results = await linter.lintFiles(['**/*.{ts,tsx,js,jsx}']);

          if (useConsole) {
            const formatter = await linter.loadFormatter('stylish');
            const consoleFormat = await formatter.format(results);
            if (consoleFormat) {
              console.log(consoleFormat);
            }
          }

          if (useCustomOverlay) {
            const customFormat = formatEslintForCustomOverlay(results);

            server.ws.send({
              type: 'custom',
              event: OverlayEvents.lint,
              data: customFormat,
            });
          }
        } catch (error) {
          console.error('ESLint error:', error);
        }
      });
    },

    handleHotUpdate: async (ctx) => {
      try {
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
            event: OverlayEvents.lint,
            data: customFormat,
          });
        }
      } catch (error) {
        console.error('ESLint error:', error);
      }
    },
  };
};

export default viteEslintPlugin;
