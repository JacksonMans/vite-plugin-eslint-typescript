export interface ViteTypescriptEslintPluginOptions {
  /** Whether or not to use eslints caching option
   *
   * default: true
   */
  useCache?: boolean;
  /** Whether or not the plugin should log results to the console
   *
   * default: false
   */
  useConsole?: boolean;
  /** Whether or not the plugin should send results to Vite's HMR overlay
   *
   * default: false
   */
  useCustomOverlay?: boolean;
  /** Whether or not the plugin should inclide warnings in the output
   *
   * default: true
   */
  showWarnings?: boolean;
}

export enum OverlayClassNames {
  header = 'header',
  content = 'content',
  footer = 'footer',
  message = 'message',
  messageText = 'message-text',
  error = 'severity-error',
  warning = 'severity-warning',
  lineDetails = 'line-details',
  ruleId = 'rule-id',
  filePath = 'file-path',
  lintResult = 'lint-result',
}

export enum OverlayAssets {
  style = '/@mawns/vite-plugin-eslint/style.css',
  script = '/@mawns/vite-plugin-eslint/script',
  badgeError = '/@mawns/vite-plugin-eslint/badge-error.svg',
  badgeWarning = '/@mawns/vite-plugin-eslint/badge-warning.svg',
}

export enum OverlayEvents {
  connected = '@mawns/vite-plugin-eslint:connected',
  lint = '@mawns/vite-plugin-eslint:lint',
  styleUpdate = '@mawns/vite-plugin-eslint:style-update',
}
