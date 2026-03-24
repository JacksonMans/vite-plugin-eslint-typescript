import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

function resolveAgentBinary(): string | null {
  const isWin = process.platform === 'win32';

  const candidates: string[] = [];

  if (isWin) {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      candidates.push(path.join(localAppData, 'cursor-agent', 'agent.cmd'));
      candidates.push(path.join(localAppData, 'cursor-agent', 'agent.exe'));
    }
  } else {
    const home = process.env.HOME;
    if (home) {
      candidates.push(path.join(home, '.local', 'bin', 'agent'));
    }
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function sendFixPrompt(
  cwd: string,
  promptText: string,
  onStatus?: (status: string, detail?: string) => void,
): Promise<{ success: boolean; error?: string }> {
  let agent: ChildProcess;

  const agentBin = resolveAgentBinary();
  if (!agentBin) {
    return { success: false, error: 'agent-not-found' };
  }

  try {
    agent = spawn(`"${agentBin}" acp`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });
  } catch {
    return { success: false, error: 'agent-not-found' };
  }

  return new Promise((resolve) => {
    let nextId = 1;
    const pending = new Map<
      number,
      {
        resolve: (value: Record<string, unknown>) => void;
        reject: (error: Error) => void;
      }
    >();
    let settled = false;
    let stderrOutput = '';

    const cleanup = () => {
      if (!settled) {
        settled = true;
        agent.stdin?.end();
        agent.kill();
      }
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve({ success: false, error: 'timeout' });
    }, 120_000);

    agent.stderr?.on('data', (chunk: Buffer) => {
      stderrOutput += chunk.toString();
    });

    agent.on('error', () => {
      clearTimeout(timeout);
      cleanup();
      resolve({ success: false, error: 'agent-not-found' });
    });

    agent.on('exit', (code) => {
      clearTimeout(timeout);
      if (!settled) {
        settled = true;
        const detail = stderrOutput.trim();
        const errorMsg = detail
          ? `agent-crashed: ${detail.slice(0, 300)}`
          : `agent-crashed: exit code ${code}`;
        resolve({ success: false, error: errorMsg });
      }
    });

    function send(
      method: string,
      params?: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
      const id = nextId++;
      const msg: JsonRpcRequest = { jsonrpc: '2.0', id, method, params };
      agent.stdin?.write(JSON.stringify(msg) + '\n');
      return new Promise((res, rej) => {
        pending.set(id, { resolve: res, reject: rej });
      });
    }

    function respond(id: number, result: Record<string, unknown>) {
      agent.stdin?.write(
        JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n',
      );
    }

    const rl = readline.createInterface({ input: agent.stdout! });
    let promptRequestId: number | null = null;

    rl.on('line', (line) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(line);
      } catch {
        return;
      }

      const msgId = msg.id as number | string | undefined;
      const numId = typeof msgId === 'string' ? parseInt(msgId, 10) : msgId;

      if (numId != null && pending.has(numId)) {
        const waiter = pending.get(numId)!;
        pending.delete(numId);
        if (msg.error) {
          const err = msg.error as { message?: string };
          waiter.reject(new Error(err.message ?? 'unknown'));
        } else {
          waiter.resolve((msg.result as Record<string, unknown>) ?? {});
        }
        return;
      }

      const method = msg.method as string | undefined;

      if (method === 'session/request_permission' && msgId != null) {
        respond(typeof msgId === 'number' ? msgId : parseInt(msgId as string, 10), {
          outcome: { outcome: 'selected', optionId: 'allow-always' },
        });
        onStatus?.('tool', 'Permission granted');
        return;
      }

      if (method === 'session/update' && msg.params) {
        const params = msg.params as Record<string, unknown>;
        const update = (params.update ?? params) as Record<string, unknown>;
        const updateType = update.sessionUpdate as string | undefined;

        if (updateType === 'agent_message_chunk' || updateType === 'agent_thought_chunk') {
          const content = update.content as Record<string, unknown> | undefined;
          const text = content?.text as string | undefined;
          if (text) {
            onStatus?.(updateType === 'agent_thought_chunk' ? 'thought' : 'chunk', text);
            return;
          }
        }

        if (updateType === 'tool_call') {
          const title = update.title as string | undefined;
          const kind = update.kind as string | undefined;
          const status = update.status as string | undefined;
          if (title && status === 'pending') {
            const icon = kind === 'edit' ? '✏️' : kind === 'read' ? '📄' : kind === 'execute' ? '⚡' : '🔧';
            onStatus?.('tool_start', `${icon} ${title}`);
          }
          return;
        }

        if (updateType === 'tool_call_update' || updateType === 'available_commands_update') {
          return;
        }
      }

      if (promptRequestId != null) {
        console.log(`[acp-debug] Unhandled msg (prompt pending as id=${promptRequestId}): ${JSON.stringify(msg).slice(0, 500)}`);
      }
    });

    (async () => {
      try {
        onStatus?.('connecting');

        await send('initialize', {
          protocolVersion: 1,
          clientCapabilities: {
            fs: { readTextFile: false, writeTextFile: false },
            terminal: false,
          },
          clientInfo: {
            name: 'vite-plugin-eslint-typescript',
            version: '1.0.0',
          },
        });

        onStatus?.('step', 'Authenticated');

        await send('authenticate', { methodId: 'cursor_login' });

        onStatus?.('step', 'Session created');

        const session = (await send('session/new', {
          cwd,
          mcpServers: [],
        })) as { sessionId?: string };

        if (!session.sessionId) {
          cleanup();
          clearTimeout(timeout);
          resolve({ success: false, error: 'no-session' });
          return;
        }

        onStatus?.('step', 'Agent is working...');

        promptRequestId = nextId;
        const result = (await send('session/prompt', {
          sessionId: session.sessionId,
          prompt: [{ type: 'text', text: promptText }],
        })) as { stopReason?: string };

        clearTimeout(timeout);
        cleanup();
        resolve({
          success: result.stopReason === 'end_turn' || result.stopReason === 'stop',
        });
      } catch (err) {
        clearTimeout(timeout);
        cleanup();
        resolve({
          success: false,
          error: err instanceof Error ? err.message : 'unknown',
        });
      }
    })();
  });
}
