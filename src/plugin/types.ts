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
  /** Whether or not the plugin should include warnings in the output
   *
   * default: true
   */
  showWarnings?: boolean;
  /** Enable TypeScript type-checking via a background worker thread.
   * Requires `typescript` to be installed as a dependency.
   *
   * default: true
   */
  useTypeScript?: boolean;
  /** How the "Fix in Cursor" button behaves.
   * - 'deeplink': opens Cursor UI with a pre-filled prompt (user confirms)
   * - 'acp': spawns a headless Cursor agent that auto-fixes without confirmation
   *
   * default: 'deeplink'
   */
  cursorMode?: 'deeplink' | 'acp';
}

export interface TypescriptDiagnostic {
  filePath: string;
  line: number;
  column: number;
  message: string;
  code: number;
  category: 'error' | 'warning';
}

export enum OverlayClassNames {
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
  script = '/vite-plugin-eslint-typescript/script',
  badgeError = '/vite-plugin-eslint-typescript/badge-error.svg',
  badgeWarning = '/vite-plugin-eslint-typescript/badge-warning.svg',
}

export enum OverlayEvents {
  connected = 'vite-plugin-eslint-typescript:connected',
  lint = 'vite-plugin-eslint-typescript:lint',
  typescript = 'vite-plugin-eslint-typescript:typescript',
  styleUpdate = 'vite-plugin-eslint-typescript:style-update',
  fixRequest = 'vite-plugin-eslint-typescript:fix-request',
  fixStatus = 'vite-plugin-eslint-typescript:fix-status',
}
