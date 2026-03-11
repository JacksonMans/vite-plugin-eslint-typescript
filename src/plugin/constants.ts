import { ViteTypescriptEslintPluginOptions } from '@/plugin/types';

export const defaultOptions: ViteTypescriptEslintPluginOptions = {
  useCache: true,
  useConsole: false,
  useCustomOverlay: true,
  showWarnings: true,
  useTypeScript: true,
};
