import { parentPort, workerData } from 'worker_threads';
import { ESLint, Linter } from 'eslint';

interface WorkerConfig {
  cwd: string;
  showWarnings: boolean;
}

const cls = {
  message: 'message',
  messageText: 'message-text',
  error: 'severity-error',
  warning: 'severity-warning',
  lineDetails: 'line-details',
  ruleId: 'rule-id',
  filePath: 'file-path',
  lintResult: 'lint-result',
};

function formatForOverlay(results: ESLint.LintResult[]): string {
  const fmtMsg = (m: Linter.LintMessage, filePath: string) =>
    `<p class="${cls.message}"><a class="${cls.lineDetails}" data-file="${filePath}" data-line="${m.line}" data-col="${m.column}">${m.line}:${m.column}</a> <span class="${
      m.severity === 1 ? cls.warning : cls.error
    }">${m.severity === 1 ? 'Warning' : 'Error'} </span>` +
    `<span class="${cls.messageText}">${m.message}</span>  <span class="${cls.ruleId}">${m.ruleId}</span></p>`;

  const fmtResult = (r: ESLint.LintResult) => {
    const first = r.messages[0];
    return `<div class="${cls.lintResult}"><a class="${cls.filePath}" data-file="${r.filePath}" data-line="${first?.line ?? 1}" data-col="${first?.column ?? 1}">${r.filePath}</a>  ${r.messages.map((m) => fmtMsg(m, r.filePath)).join(' ')}</div>`;
  };

  return results
    .filter((r) => r.messages.length)
    .map(fmtResult)
    .join(' ');
}

async function main() {
  const { cwd, showWarnings } = workerData as WorkerConfig;

  const linter = new ESLint({
    cache: true,
    cacheStrategy: 'content',
    cwd,
  });
  const pattern = ['**/*.{ts,tsx,js,jsx}'];

  let lastOverlayHtml = '';
  let lastConsoleOutput = '';
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let pendingRerun = false;

  function filterWarnings(results: ESLint.LintResult[]): ESLint.LintResult[] {
    if (showWarnings) return results;
    return results.map((r) => ({
      ...r,
      messages: r.messages.filter((m) => m.severity === 2),
      warningCount: 0,
      fixableWarningCount: 0,
    }));
  }

  async function lint() {
    if (running) {
      pendingRerun = true;
      return;
    }
    running = true;
    try {
      const results = filterWarnings(await linter.lintFiles(pattern));

      lastOverlayHtml = formatForOverlay(results);

      const formatter = await linter.loadFormatter('stylish');
      lastConsoleOutput = await formatter.format(results);

      parentPort?.postMessage({
        type: 'result',
        overlayHtml: lastOverlayHtml,
        consoleOutput: lastConsoleOutput,
      });
    } catch (err) {
      parentPort?.postMessage({
        type: 'error',
        message: err instanceof Error ? err.message : 'ESLint error',
      });
    } finally {
      running = false;
      if (pendingRerun) {
        pendingRerun = false;
        scheduleLint();
      }
    }
  }

  function scheduleLint() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(lint, 300);
  }

  parentPort?.on('message', (msg: { type: string }) => {
    if (msg.type === 'fileChanged') {
      scheduleLint();
    } else if (msg.type === 'getResult') {
      parentPort?.postMessage({
        type: 'result',
        overlayHtml: lastOverlayHtml,
        consoleOutput: lastConsoleOutput,
      });
    }
  });

  await lint();
}

main();
