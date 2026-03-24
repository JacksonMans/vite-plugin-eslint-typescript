import path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import type { PluginOption } from 'vite';

import { defaultOptions } from './constants';
import {
  formatTypescriptForConsole,
  formatTypescriptForCustomOverlay,
} from './formatters';
import {
  OverlayAssets,
  OverlayEvents,
  TypescriptDiagnostic,
  ViteTypescriptEslintPluginOptions,
} from './types';
import { sendFixPrompt } from './acp-client';

export const viteEslintPlugin = (
  userOptions?: ViteTypescriptEslintPluginOptions,
) => {
  const {
    useConsole,
    showWarnings,
    useCustomOverlay,
    useTypeScript,
    cursorMode,
    editor,
  } = {
    ...defaultOptions,
    ...userOptions,
  };

  let tsWorker: Worker | null = null;
  let eslintWorker: Worker | null = null;
  let lastLoggedTsOutput: string | null = null;
  let lastLoggedEslintOutput: string | null = null;

  return {
    name: 'vite-plugin-eslint-typescript',
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
              load(${JSON.stringify({ cursorMode, editor })});
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
      const pluginDir = path.dirname(fileURLToPath(import.meta.url));

      // --- TypeScript worker ---
      if (useTypeScript) {
        try {
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
                  `[vite-plugin-eslint-typescript] ${msg.message}`,
                );
                tsWorker?.terminate();
                tsWorker = null;
              }
            },
          );

          tsWorker.on('error', (err: Error) => {
            console.warn(
              `[vite-plugin-eslint-typescript] TypeScript checking disabled: ${err.message}`,
            );
            tsWorker = null;
          });
        } catch {
          console.warn(
            '[vite-plugin-eslint-typescript] Failed to start TypeScript worker',
          );
        }
      }

      // --- ESLint worker ---
      try {
        const workerPath = path.join(pluginDir, 'eslint-worker.js');
        eslintWorker = new Worker(workerPath, {
          workerData: {
            cwd: server.config.root,
            showWarnings,
          },
        });

        eslintWorker.on(
          'message',
          (msg: {
            type: string;
            overlayHtml?: string;
            consoleOutput?: string;
            message?: string;
          }) => {
            if (msg.type === 'result') {
              if (useConsole && msg.consoleOutput) {
                if (msg.consoleOutput !== lastLoggedEslintOutput) {
                  lastLoggedEslintOutput = msg.consoleOutput;
                  console.log(msg.consoleOutput);
                }
              }
              if (useCustomOverlay) {
                server.ws.send({
                  type: 'custom',
                  event: OverlayEvents.lint,
                  data: msg.overlayHtml ?? '',
                });
              }
            } else if (msg.type === 'error') {
              console.warn(
                `[vite-plugin-eslint-typescript] ESLint worker: ${msg.message}`,
              );
            }
          },
        );

        eslintWorker.on('error', (err: Error) => {
          console.warn(
            `[vite-plugin-eslint-typescript] ESLint worker failed: ${err.message}`,
          );
          eslintWorker = null;
        });
      } catch {
        console.warn(
          '[vite-plugin-eslint-typescript] Failed to start ESLint worker',
        );
      }

      // --- Cleanup on server close ---
      server.httpServer?.on('close', () => {
        tsWorker?.terminate();
        tsWorker = null;
        eslintWorker?.terminate();
        eslintWorker = null;
      });

      // --- Overlay connected: send cached results ---
      server.ws.on(OverlayEvents.connected, () => {
        eslintWorker?.postMessage({ type: 'getResult' });
        tsWorker?.postMessage({ type: 'getResult' });
      });

      // --- ACP fix request ---
      server.ws.on(OverlayEvents.fixRequest, async (diagnosticText: string) => {
        if (cursorMode !== 'acp') return;

        const sendStatus = (status: string, detail?: string) => {
          server.ws.send({
            type: 'custom',
            event: OverlayEvents.fixStatus,
            data: detail ? `${status}:${detail}` : status,
          });
        };

        const prompt = `Fix the following ESLint and TypeScript errors:\n\n${diagnosticText}`;

        const result = await sendFixPrompt(
          server.config.root,
          prompt,
          sendStatus,
        );

        if (!result.success) {
          console.warn(`[vite-plugin-eslint-typescript] ACP fix failed: ${result.error}`);
        }

        sendStatus(result.success ? 'done' : `error:${result.error}`);
      });
    },
    handleHotUpdate({ file }) {
      const lintable = /\.(ts|tsx|js|jsx)$/.test(file);
      if (lintable && eslintWorker) {
        eslintWorker.postMessage({ type: 'fileChanged' });
      }
    },
  } satisfies PluginOption as any;
};

export default viteEslintPlugin;
