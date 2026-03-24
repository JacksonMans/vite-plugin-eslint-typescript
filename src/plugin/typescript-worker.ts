import { parentPort, workerData } from 'worker_threads';
import path from 'path';

interface DiagnosticResult {
  filePath: string;
  line: number;
  column: number;
  message: string;
  code: number;
  category: 'error' | 'warning';
}

async function main() {
  let ts: typeof import('typescript');
  try {
    ts = (await import('typescript')).default;
  } catch {
    parentPort?.postMessage({
      type: 'error',
      message:
        'typescript is not installed — install it as a dev dependency or set useTypeScript: false',
    });
    return;
  }

  const cwd = workerData.cwd as string;
  let lastResult: DiagnosticResult[] = [];
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const diagnosticsByConfig = new Map<string, DiagnosticResult[]>();

  function broadcastDiagnostics() {
    lastResult = Array.from(diagnosticsByConfig.values()).flat();
    parentPort?.postMessage({ type: 'result', diagnostics: lastResult });
  }

  function scheduleBroadcast() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(broadcastDiagnostics, 100);
  }

  type BuilderProgram = ReturnType<
    typeof ts.createSemanticDiagnosticsBuilderProgram
  >;

  function collectDiagnostics(
    configKey: string,
    builderProgram: BuilderProgram,
  ) {
    const program = builderProgram.getProgram();
    const results: DiagnosticResult[] = [];

    const configDiags = builderProgram.getConfigFileParsingDiagnostics();
    const globalDiags = builderProgram.getGlobalDiagnostics();

    for (const d of [...configDiags, ...globalDiags]) {
      if (d.file && d.start != null) {
        const pos = ts.getLineAndCharacterOfPosition(d.file, d.start);
        results.push({
          filePath: d.file.fileName,
          line: pos.line + 1,
          column: pos.character + 1,
          message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
          code: d.code,
          category:
            d.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
        });
      }
    }

    for (const sf of program.getSourceFiles()) {
      if (sf.isDeclarationFile) continue;

      const syntactic = builderProgram.getSyntacticDiagnostics(sf);
      const semantic = builderProgram.getSemanticDiagnostics(sf);

      for (const d of [...syntactic, ...semantic]) {
        if (d.file && d.start != null) {
          const pos = ts.getLineAndCharacterOfPosition(d.file, d.start);
          results.push({
            filePath: d.file.fileName,
            line: pos.line + 1,
            column: pos.character + 1,
            message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
            code: d.code,
            category:
              d.category === ts.DiagnosticCategory.Error
                ? 'error'
                : 'warning',
          });
        }
      }
    }

    diagnosticsByConfig.set(configKey, results);
    scheduleBroadcast();
  }

  function startWatchProgram(configPath: string) {
    const host = ts.createWatchCompilerHost(
      configPath,
      { noEmit: true },
      ts.sys,
      ts.createSemanticDiagnosticsBuilderProgram,
      () => {},
      () => {},
    );

    const origAfterCreate = host.afterProgramCreate;
    host.afterProgramCreate = (builderProgram) => {
      origAfterCreate?.(builderProgram);
      collectDiagnostics(configPath, builderProgram);
    };

    ts.createWatchProgram(host);
  }

  function resolveRefConfigPath(
    baseDir: string,
    refPath: string,
  ): string | undefined {
    const resolved = path.resolve(baseDir, refPath);
    if (ts.sys.fileExists(resolved)) return resolved;
    const asDir = path.join(resolved, 'tsconfig.json');
    if (ts.sys.fileExists(asDir)) return asDir;
    return undefined;
  }

  const rootConfigPath = ts.findConfigFile(
    cwd,
    ts.sys.fileExists,
    'tsconfig.json',
  );

  if (!rootConfigPath) {
    parentPort?.postMessage({ type: 'result', diagnostics: [] });
  } else {
    const configFile = ts.readConfigFile(rootConfigPath, ts.sys.readFile);
    const refs = configFile.config?.references as
      | { path: string }[]
      | undefined;

    if (refs && refs.length > 0) {
      const baseDir = path.dirname(rootConfigPath);
      for (const ref of refs) {
        const refConfigPath = resolveRefConfigPath(baseDir, ref.path);
        if (refConfigPath) {
          startWatchProgram(refConfigPath);
        }
      }
    } else {
      startWatchProgram(rootConfigPath);
    }
  }

  parentPort?.on('message', (msg: { type: string }) => {
    if (msg.type === 'getResult') {
      parentPort?.postMessage({ type: 'result', diagnostics: lastResult });
    }
  });
}

main();
