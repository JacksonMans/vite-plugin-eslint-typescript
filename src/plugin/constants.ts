import { ViteTypescriptEslintPluginOptions } from '@/plugin/types';

export const defaultOptions: ViteTypescriptEslintPluginOptions = {
  useConsole: false,
  useCustomOverlay: true,
  showWarnings: true,
  useTypeScript: true,
  cursorMode: 'deeplink',
  editor: 'cursor',
};
