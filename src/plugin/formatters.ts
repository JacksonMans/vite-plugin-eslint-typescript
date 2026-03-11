import { ESLint, Linter } from 'eslint';
import { OverlayClassNames, TypescriptDiagnostic } from './types';

export const formatEslintForCustomOverlay = (
  lintResults: ESLint.LintResult[],
) => {
  const formatMessage = (message: Linter.LintMessage) =>
    `<p class="${OverlayClassNames.message}"><span class="${
      OverlayClassNames.lineDetails
    }">${message.line}:${message.column}</span> <span class="${
      message.severity === 1
        ? OverlayClassNames.warning
        : OverlayClassNames.error
    }">${message.severity === 1 ? 'Warning' : 'Error'} </span>
    <span class="${OverlayClassNames.messageText}">${
      message.message
    }</span>  <span class="${OverlayClassNames.ruleId}">${
      message.ruleId
    }</span></p>`;

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

export const formatTypescriptForCustomOverlay = (
  diagnostics: TypescriptDiagnostic[],
) => {
  const byFile = new Map<string, TypescriptDiagnostic[]>();
  for (const d of diagnostics) {
    const existing = byFile.get(d.filePath) || [];
    existing.push(d);
    byFile.set(d.filePath, existing);
  }

  return Array.from(byFile.entries())
    .map(
      ([filePath, diags]) =>
        `<div class="${OverlayClassNames.lintResult}"><p class="${
          OverlayClassNames.filePath
        }">${filePath}</p> ${diags
          .map(
            (d) =>
              `<p class="${OverlayClassNames.message}"><span class="${
                OverlayClassNames.lineDetails
              }">${d.line}:${d.column}</span> <span class="${
                d.category === 'error'
                  ? OverlayClassNames.error
                  : OverlayClassNames.warning
              }">${
                d.category === 'error' ? 'Error' : 'Warning'
              } </span> <span class="${OverlayClassNames.messageText}">${
                d.message
              }</span> <span class="${OverlayClassNames.ruleId}">TS${
                d.code
              }</span></p>`,
          )
          .join(' ')}</div>`,
    )
    .join(' ');
};

const ansi = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  underline: '\x1b[4m',
};

export const formatTypescriptForConsole = (
  diagnostics: TypescriptDiagnostic[],
) => {
  if (diagnostics.length === 0) return '';

  const byFile = new Map<string, TypescriptDiagnostic[]>();
  for (const d of diagnostics) {
    const existing = byFile.get(d.filePath) || [];
    existing.push(d);
    byFile.set(d.filePath, existing);
  }

  let errorCount = 0;
  let warningCount = 0;
  const sections: string[] = [];

  for (const [filePath, diags] of byFile) {
    const lines: string[] = [
      `${ansi.underline}${filePath}${ansi.reset}`,
    ];

    for (const d of diags) {
      if (d.category === 'error') errorCount++;
      else warningCount++;

      const severity =
        d.category === 'error'
          ? `${ansi.red}error${ansi.reset}`
          : `${ansi.yellow}warning${ansi.reset}`;
      const location = `${ansi.dim}${d.line}:${d.column}${ansi.reset}`;
      const rule = `${ansi.dim}TS${d.code}${ansi.reset}`;

      lines.push(`  ${location}  ${severity}  ${d.message}  ${rule}`);
    }

    sections.push(lines.join('\n'));
  }

  const summary: string[] = [];
  if (errorCount > 0)
    summary.push(`${ansi.bold}${ansi.red}${errorCount} error${errorCount !== 1 ? 's' : ''}${ansi.reset}`);
  if (warningCount > 0)
    summary.push(`${ansi.bold}${ansi.yellow}${warningCount} warning${warningCount !== 1 ? 's' : ''}${ansi.reset}`);

  return `\n${sections.join('\n\n')}\n\n${ansi.bold}TypeScript:${ansi.reset} ${summary.join(' and ')}\n`;
};
