import { ESLint, Linter } from 'eslint';
import { OverlayClassNames } from 'types';

export const formatEslintForHmrOverlay = (lintResults: ESLint.LintResult[]) => {
  const formatMessage = (message: Linter.LintMessage) =>
    `${message.line}:${message.column}  ${
      message.severity === 1 ? 'Warning' : 'Error'
    }  ${message.message}  ${message.ruleId}`;

  const formatLintResult = (result: ESLint.LintResult) =>
    `${result.filePath}\n  ${result.messages.map(formatMessage).join('\n')}`;

  return lintResults
    .filter((el) => el.messages.length)
    .map(formatLintResult)
    .join('\n');
};

export const formatEslintForCustomOverlay = (
  lintResults: ESLint.LintResult[]
) => {
  const formatMessage = (message: Linter.LintMessage) =>
    `<p class="${OverlayClassNames.message}"><span class="${
      OverlayClassNames.lineDetails
    }">${message.line}:${message.column}</span> <span class="${
      message.severity === 1
        ? OverlayClassNames.warning
        : OverlayClassNames.error
    }">${message.severity === 1 ? 'Warning' : 'Error'} </span>${
      message.message
    }  <span class="${OverlayClassNames.ruleId}">${message.ruleId}</span></p>`;

  const formatLintResult = (result: ESLint.LintResult) =>
    `<div class="${OverlayClassNames.lintResult}"><p class="${
      OverlayClassNames.filePath
    }">${result.filePath}</p>  ${result.messages
      .map(formatMessage)
      .join(' ')}</div>`;

  return lintResults
    .filter((el) => el.messages.length)
    .map(formatLintResult)
    .join(' ');
};
