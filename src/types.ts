export interface ViteEslintPluginOptions {
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
  useHmrOverlay?: boolean;
  /** Whether or not the plugin should send results to the plugins Custom overlay
   *
   * default: true
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
  error = 'severity-error',
  warning = 'severity-warning',
  lineDetails = 'line-details',
  ruleId = 'rule-id',
  filePath = 'file-path',
  lintResult = 'lint-result',
}

export enum OverlayIds {
  outer = 'mawns_eslint-overlay-outer',
  inner = 'mawns_eslint-overlay-inner',
}
