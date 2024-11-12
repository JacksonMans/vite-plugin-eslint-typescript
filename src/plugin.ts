import { ESLint, Linter } from "eslint";
import { PluginOption } from "vite";

interface ViteEslintPluginOptions {
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

const defaultOptions: ViteEslintPluginOptions = {
  useCache: true,
  useConsole: false,
  useHmrOverlay: true,
  showWarnings: true,
};

const formatEslintForHmrOverlay = (lintResults: ESLint.LintResult[]) => {
  const formatMessage = (message: Linter.LintMessage) =>
    `${message.line}:${message.column}  ${
      message.severity === 1 ? "Warning" : "Error"
    }  ${message.message}  ${message.ruleId}`;

  const formatLintResult = (result: ESLint.LintResult) =>
    `${result.filePath}\n  ${result.messages.map(formatMessage).join("\n")}`;

  return lintResults
    .filter((el) => el.messages.length)
    .map(formatLintResult)
    .join("\n");
};

export const viteEslintPlugin = (
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
    name: "@mans/vite-plugin-eslint",
    handleHotUpdate: async (ctx) => {
      if (ctx.timestamp - prevTimeStamp < 1000) {
        return;
      }
      prevTimeStamp = ctx.timestamp;

      const eslintResults = await linter.lintFiles("*/**/*");

      if (useConsole) {
        const formatter = await linter.loadFormatter("stylish");
        const consoleFormat = await formatter.format(eslintResults);
        if (consoleFormat) {
          console.log(consoleFormat);
        }
      }

      if (useHmrOverlay) {
        const textFormat = formatEslintForHmrOverlay(eslintResults);
        if (textFormat) {
          ctx.server.ws.send({
            type: "error",
            err: {
              message: textFormat,
              stack: "",
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
