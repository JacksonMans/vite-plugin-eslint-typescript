import { ESLint } from 'eslint';
import path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import type { PluginOption } from 'vite';

import { defaultOptions } from './constants';
import {
  formatEslintForCustomOverlay,
  formatTypescriptForConsole,
  formatTypescriptForCustomOverlay,
} from './formatters';
import {
  OverlayAssets,
  OverlayEvents,
  TypescriptDiagnostic,
  ViteTypescriptEslintPluginOptions,
} from './types';

export const viteEslintPlugin = (
  userOptions?: ViteTypescriptEslintPluginOptions,
) => {
  const {
    useCache,
    useConsole,
    showWarnings,
    useCustomOverlay,
    useTypeScript,
  } = {
    ...defaultOptions,
    ...userOptions,
  };

  const eslintPattern = ['**/*.{ts,tsx,js,jsx}'];
  const linter = new ESLint({ cache: useCache });
  let prevTimeStamp = 0;
  let tsWorker: Worker | null = null;
  let cachedOverlayHtml: string | null = null;
  let cachedConsoleOutput: string | null = null;
  let lastLoggedEslintOutput: string | null = null;
  let lastLoggedTsOutput: string | null = null;
  let initialRunStarted = false;
  let eslintRunning = false;

  function filterWarnings(results: ESLint.LintResult[]): ESLint.LintResult[] {
    if (showWarnings) return results;
    return results.map((r) => ({
      ...r,
      messages: r.messages.filter((m) => m.severity === 2),
      warningCount: 0,
      fixableWarningCount: 0,
    }));
  }

  async function runEslint() {
    if (eslintRunning) return;
    eslintRunning = true;
    try {
      const results = filterWarnings(await linter.lintFiles(eslintPattern));

      if (useConsole) {
        const formatter = await linter.loadFormatter('stylish');
        cachedConsoleOutput = await formatter.format(results);
      }

      if (useCustomOverlay) {
        cachedOverlayHtml = formatEslintForCustomOverlay(results);
      }
    } finally {
      eslintRunning = false;
    }
  }

  function logEslintToConsole() {
    if (
      useConsole &&
      cachedConsoleOutput &&
      cachedConsoleOutput !== lastLoggedEslintOutput
    ) {
      lastLoggedEslintOutput = cachedConsoleOutput;
      console.log(cachedConsoleOutput);
    }
  }

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
      if (useTypeScript) {
        try {
          const pluginDir = path.dirname(fileURLToPath(import.meta.url));
          const workerPath = path.join(pluginDir, 'typescript-worker.js');
          tsWorker = new Worker(workerPath, {
            workerData: { cwd: server.config.root },
          });

          tsWorker.on(
            'message',
            (msg: {
              type: string;
              diagnostics?: TypescriptDiagnostic[];
              message?: string;
            }) => {
              if (msg.type === 'result' && msg.diagnostics) {
                if (useConsole) {
                  const output = formatTypescriptForConsole(msg.diagnostics);
                  if (output && output !== lastLoggedTsOutput) {
                    lastLoggedTsOutput = output;
                    console.log(output);
                  }
                }
                if (useCustomOverlay) {
                  server.ws.send({
                    type: 'custom',
                    event: OverlayEvents.typescript,
                    data: formatTypescriptForCustomOverlay(msg.diagnostics),
                  });
                }
              } else if (msg.type === 'error') {
                console.warn(
                  `[@mawns/vite-plugin-eslint] ${msg.message}`,
                );
                tsWorker?.terminate();
                tsWorker = null;
              }
            },
          );

          tsWorker.on('error', (err: Error) => {
            console.warn(
              `[@mawns/vite-plugin-eslint] TypeScript checking disabled: ${err.message}`,
            );
            tsWorker = null;
          });

          server.httpServer?.on('close', () => {
            tsWorker?.terminate();
            tsWorker = null;
          });
        } catch {
          console.warn(
            '[@mawns/vite-plugin-eslint] Failed to start TypeScript worker',
          );
        }
      }

      function sendEslintToOverlay() {
        if (useCustomOverlay && cachedOverlayHtml !== null) {
          server.ws.send({
            type: 'custom',
            event: OverlayEvents.lint,
            data: cachedOverlayHtml,
          });
        }
      }

      server.ws.on(OverlayEvents.connected, async () => {
        if (cachedOverlayHtml !== null) {
          sendEslintToOverlay();
        } else if (!initialRunStarted) {
          initialRunStarted = true;
          try {
            await runEslint();
            logEslintToConsole();
            sendEslintToOverlay();
          } catch (error) {
            console.error('ESLint error:', error);
          }
        }

        tsWorker?.postMessage({ type: 'getResult' });
      });
    },

    handleHotUpdate: async (ctx) => {
      try {
        if (ctx.timestamp - prevTimeStamp < 1000) {
          return;
        }
        prevTimeStamp = ctx.timestamp;

        await runEslint();
        logEslintToConsole();

        if (useCustomOverlay && cachedOverlayHtml !== null) {
          ctx.server.ws.send({
            type: 'custom',
            event: OverlayEvents.lint,
            data: cachedOverlayHtml,
          });
        }
      } catch (error) {
        console.error('ESLint error:', error);
      }
    },
  } satisfies PluginOption as any;
};

export default viteEslintPlugin;
