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
   * default: true
   */
  useHmrOverlay?: boolean;
  /** Whether or not the plugin should inclide warnings in the output
   *
   * default: true
   */
  showWarnings?: boolean;
}
