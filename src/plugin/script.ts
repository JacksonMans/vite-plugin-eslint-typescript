import badgeError from './badge-error.svg';
import badgeWarning from './badge-warning.svg';
import { OverlayEvents } from './types';

interface OverlayConfig {
  cursorMode?: 'deeplink' | 'acp';
}

const MAX_DEEPLINK_LENGTH = 8000;

const ACP_ERROR_INFO: Record<string, { title: string; body: string; hint?: string }> = {
  'agent-not-found': {
    title: 'Cursor Agent CLI not installed',
    body: 'The "agent" command is not available. ACP mode requires the standalone Cursor Agent CLI, which is separate from the Cursor editor.',
    hint: 'Install it by running this in PowerShell:\nirm \'https://cursor.com/install?win32=true\' | iex\n\nThen restart your terminal and Vite dev server.',
  },
  'timeout': {
    title: 'ACP request timed out',
    body: 'The Cursor agent took too long to respond (120s limit). This can happen if the agent is processing a very large codebase.',
  },
  'agent-exited-unexpectedly': {
    title: 'Cursor agent crashed',
    body: 'The agent process exited before completing. Make sure you are authenticated.',
    hint: 'Run "agent login" in your terminal first, then restart your Vite dev server.',
  },
  'no-session': {
    title: 'Could not create ACP session',
    body: 'The agent started but failed to create a session. Make sure you are authenticated.',
    hint: 'Run "agent login" in your terminal to authenticate, then restart your Vite dev server.',
  },
};

function getErrorInfo(errorType: string): { title: string; body: string; hint?: string } {
  if (errorType.startsWith('agent-crashed:')) {
    const detail = errorType.slice('agent-crashed:'.length).trim();
    return {
      title: 'Cursor agent crashed',
      body: detail || 'The agent process exited before completing.',
      hint: 'Run "agent login" in your terminal to authenticate, then try "agent acp" to test manually.',
    };
  }
  return ACP_ERROR_INFO[errorType] ?? {
    title: 'ACP fix failed',
    body: `An unexpected error occurred: ${errorType}`,
    hint: 'Try running "agent acp" manually in your terminal to diagnose the issue.',
  };
}

function openDeeplink(diagnosticText: string) {
  const prompt = `Fix the following ESLint and TypeScript errors:\n\n${diagnosticText}`;
  const url = new URL('cursor://anysphere.cursor-deeplink/prompt');
  url.searchParams.set('text', prompt);

  let link = url.toString();
  if (link.length > MAX_DEEPLINK_LENGTH) {
    const overflow = link.length - MAX_DEEPLINK_LENGTH;
    const truncated =
      prompt.slice(0, prompt.length - overflow - 20) + '\n\n[truncated]';
    url.searchParams.set('text', truncated);
    link = url.toString();
  }

  window.open(link, '_blank');
}

export const load = (config?: OverlayConfig) => {
  const cursorMode = config?.cursorMode ?? 'deeplink';

  const overlay = document.querySelector('mawns-vite-plugin-eslint-overlay');
  if (!overlay) return;

  const shadowDom = overlay.attachShadow({ mode: 'closed' });
  const badge = document.createElement('badge');
  const outer = document.createElement('outer');
  const inner = document.createElement('inner');
  const header = document.createElement('header');
  const footer = document.createElement('footer');
  const content = document.createElement('content');
  const fixButton = document.createElement('button');
  const toast = document.createElement('div');
  const agentLog = document.createElement('div');
  const agentLogHeader = document.createElement('div');
  const agentLogBody = document.createElement('div');

  badge.setAttribute('class', 'badge');
  outer.setAttribute('class', 'outer');
  inner.setAttribute('class', 'inner');
  header.setAttribute('class', 'header');
  footer.setAttribute('class', 'footer');
  content.setAttribute('class', 'content');
  fixButton.setAttribute('class', 'fix-button');
  fixButton.textContent = 'Fix in Cursor';
  fixButton.style.display = 'none';
  toast.setAttribute('class', 'acp-toast');
  agentLog.setAttribute('class', 'agent-log');
  agentLogHeader.setAttribute('class', 'agent-log-header');
  agentLogHeader.textContent = 'Cursor Agent';
  agentLogBody.setAttribute('class', 'agent-log-body');

  agentLog.appendChild(agentLogHeader);
  agentLog.appendChild(agentLogBody);
  inner.appendChild(header);
  inner.appendChild(content);
  inner.appendChild(agentLog);
  inner.appendChild(footer);
  footer.appendChild(fixButton);
  inner.appendChild(toast);
  outer.appendChild(inner);

  const styles = document.createElement('style');
  styles.innerHTML = 'cssToBeReplaced';
  shadowDom.appendChild(styles);
  shadowDom.appendChild(outer);
  shadowDom.appendChild(badge);

  let lastDiagnosticText = '';
  let fixing = false;
  let agentLogVisible = false;
  let eslintHtml = '';
  let typescriptHtml = '';

  function showAgentView() {
    content.style.display = 'none';
    agentLog.style.display = 'flex';
    agentLogVisible = true;
    agentLogBody.innerHTML = '';
    agentLogHeader.textContent = 'Cursor Agent';
    fixButton.style.display = 'none';
  }

  function hideAgentView() {
    agentLog.style.display = 'none';
    content.style.display = 'flex';
    agentLogVisible = false;
  }

  function showToast(errorType: string) {
    const info = getErrorInfo(errorType);
    toast.innerHTML = `
      <div class="acp-toast-title">${info.title}</div>
      <div class="acp-toast-body">${info.body}</div>
      ${info.hint ? `<div class="acp-toast-hint">${info.hint}</div>` : ''}
      <div class="acp-toast-actions">
        <button class="acp-toast-btn acp-toast-btn-primary" data-action="deeplink">Open in Cursor via deeplink</button>
        <button class="acp-toast-btn" data-action="dismiss">Dismiss</button>
      </div>
    `;
    toast.style.display = 'flex';

    toast.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = (btn as HTMLElement).dataset.action;
        if (action === 'deeplink' && lastDiagnosticText) {
          openDeeplink(lastDiagnosticText);
        }
        toast.style.display = 'none';
      });
    });
  }

  function hideToast() {
    toast.style.display = 'none';
  }

  outer.addEventListener('click', (event: MouseEvent) => {
    if (event.target && event.target instanceof HTMLElement) {
      if (event.target.tagName === 'OUTER') {
        outer.setAttribute('style', 'display: none;');
        const hasErrors = eslintHtml || typescriptHtml;
        badge.setAttribute('style', hasErrors ? 'display: flex;' : 'display: none;');
        hideToast();
        if (agentLogVisible && !fixing) {
          hideAgentView();
        }
      }
    }
  });

  badge.addEventListener('click', (event: MouseEvent) => {
    if (event.target && event.target instanceof HTMLElement) {
      if (
        event.target.tagName === 'BADGE' ||
        event.target.parentElement?.tagName === 'BADGE'
      ) {
        outer.setAttribute('style', 'display: flex;');
        badge.setAttribute('style', 'display: none;');
      }
    }
  });

  function setFixButtonState(state: 'idle' | 'loading' | 'done' | 'error') {
    fixButton.classList.remove('loading', 'done', 'error');
    switch (state) {
      case 'loading':
        fixButton.classList.add('loading');
        fixButton.textContent = 'Fixing...';
        fixButton.disabled = true;
        fixing = true;
        break;
      case 'done':
        fixButton.classList.add('done');
        fixButton.textContent = 'Done!';
        fixButton.disabled = true;
        fixing = false;
        break;
      case 'error':
        fixButton.classList.add('error');
        fixButton.textContent = 'Failed';
        fixButton.disabled = true;
        fixing = false;
        setTimeout(() => {
          setFixButtonState('idle');
          hideAgentView();
          render();
        }, 3000);
        break;
      default:
        fixButton.textContent = 'Fix in Cursor';
        fixButton.disabled = false;
        fixing = false;
    }
  }

  fixButton.addEventListener('click', (event: MouseEvent) => {
    event.stopPropagation();
    if (fixing) return;

    const diagnosticText = content.innerText.trim();
    if (!diagnosticText) return;

    lastDiagnosticText = diagnosticText;
    hideToast();

    if (cursorMode === 'acp' && import.meta.hot) {
      setFixButtonState('loading');
      showAgentView();
      header.innerHTML = '<p>Cursor Agent is fixing errors...</p>';
      import.meta.hot.send(OverlayEvents.fixRequest, diagnosticText);
    } else {
      openDeeplink(diagnosticText);
    }
  });

  function render() {
    let combined = '';
    if (typescriptHtml) {
      combined += `<div class="section"><div class="section-label">TypeScript</div>${typescriptHtml}</div>`;
    }
    if (eslintHtml) {
      combined += `<div class="section"><div class="section-label">ESLint</div>${eslintHtml}</div>`;
    }
    content.innerHTML = combined;

    const errors = combined.match(/class="severity-error"/g)?.length || 0;
    const warnings = combined.match(/class="severity-warning"/g)?.length || 0;

    let badgeContent = '';
    if (errors > 0) {
      badgeContent += `<img class="badge-error" src="${badgeError}" alt="errors"> ${errors}`;
    }
    if (warnings > 0) {
      badgeContent += `<img class="badge-warning" src="${badgeWarning}" alt="warnings"> ${warnings}`;
    }
    badge.innerHTML = badgeContent;

    if (agentLogVisible) {
      outer.setAttribute('style', 'display: flex;');
      badge.setAttribute('style', 'display: none;');
      if (!fixing && !combined) {
        header.innerHTML = '<p>All errors fixed</p>';
        agentLogHeader.textContent = 'Cursor Agent — Done';
      }
    } else if (combined) {
      outer.setAttribute('style', 'display: flex;');
      badge.setAttribute('style', 'display: none;');
      header.innerHTML = `<p><span class="severity-error">${errors} errors</span> and <span class="severity-warning">${warnings} warnings</span></p>`;
      if (!fixing) {
        setFixButtonState('idle');
        fixButton.style.display = 'inline-block';
      }
    } else {
      outer.setAttribute('style', 'display: none;');
      badge.setAttribute('style', 'display: none;');
      fixButton.style.display = 'none';
      hideToast();
    }
  }

  const connect = () => {
    if (import.meta.hot) {
      import.meta.hot.on(OverlayEvents.styleUpdate, (cssContent) => {
        styles.innerHTML = cssContent;
      });
    }
    if (import.meta.env.DEV && import.meta.hot) {
      import.meta.hot.on(OverlayEvents.lint, (o) => {
        eslintHtml = o;
        render();
      });
      import.meta.hot.on(OverlayEvents.typescript, (o) => {
        typescriptHtml = o;
        render();
      });

      import.meta.hot.on(OverlayEvents.fixStatus, (status: string) => {
        if (status === 'done') {
          setFixButtonState('done');
          header.innerHTML = '<p>Cursor Agent — Done</p>';
          agentLogHeader.textContent = 'Cursor Agent — Done';

          const doneEl = document.createElement('div');
          doneEl.setAttribute('class', 'agent-log-done');
          doneEl.textContent = '✓ Agent finished';
          agentLogBody.appendChild(doneEl);
          agentLogBody.scrollTop = agentLogBody.scrollHeight;

          const backBtn = document.createElement('button');
          backBtn.setAttribute('class', 'agent-log-back');
          backBtn.textContent = 'Close';
          backBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hideAgentView();
            setFixButtonState('idle');
            render();
          });
          agentLogHeader.appendChild(backBtn);
        } else if (status.startsWith('error:')) {
          const errorType = status.slice(6);
          setFixButtonState('error');
          hideAgentView();
          showToast(errorType);
        } else if (status.startsWith('thought:')) {
          const text = status.slice(8);
          let thoughtSpan = agentLogBody.querySelector('.agent-thought-current');
          if (!thoughtSpan) {
            thoughtSpan = document.createElement('span');
            thoughtSpan.setAttribute('class', 'agent-thought agent-thought-current');
            agentLogBody.appendChild(thoughtSpan);
          }
          thoughtSpan.textContent += text;
          agentLogBody.scrollTop = agentLogBody.scrollHeight;
        } else if (status.startsWith('chunk:')) {
          const currentThought = agentLogBody.querySelector('.agent-thought-current');
          if (currentThought) currentThought.classList.remove('agent-thought-current');
          const text = status.slice(6);
          let messageSpan = agentLogBody.querySelector('.agent-message-current');
          if (!messageSpan) {
            messageSpan = document.createElement('span');
            messageSpan.setAttribute('class', 'agent-message agent-message-current');
            agentLogBody.appendChild(messageSpan);
          }
          messageSpan.textContent += text;
          agentLogBody.scrollTop = agentLogBody.scrollHeight;
        } else if (status.startsWith('tool_start:')) {
          const currentThought = agentLogBody.querySelector('.agent-thought-current');
          if (currentThought) currentThought.classList.remove('agent-thought-current');
          const currentMessage = agentLogBody.querySelector('.agent-message-current');
          if (currentMessage) currentMessage.classList.remove('agent-message-current');
          const toolText = status.slice(11);
          const lastTool = agentLogBody.querySelector('.agent-log-tool:last-of-type') as HTMLElement | null;
          const lastToolBase = lastTool?.dataset.toolName;
          if (lastTool && lastToolBase === toolText) {
            const count = parseInt(lastTool.dataset.toolCount || '1', 10) + 1;
            lastTool.dataset.toolCount = String(count);
            lastTool.textContent = `${toolText}  ×${count}`;
          } else {
            const toolEl = document.createElement('div');
            toolEl.setAttribute('class', 'agent-log-tool');
            toolEl.dataset.toolName = toolText;
            toolEl.dataset.toolCount = '1';
            toolEl.textContent = toolText;
            agentLogBody.appendChild(toolEl);
          }
          agentLogBody.scrollTop = agentLogBody.scrollHeight;
        } else if (status.startsWith('step:')) {
          const stepText = status.slice(5);
          const stepEl = document.createElement('div');
          stepEl.setAttribute('class', 'agent-log-step');
          stepEl.textContent = stepText;
          agentLogBody.appendChild(stepEl);
          agentLogBody.scrollTop = agentLogBody.scrollHeight;
        } else if (status === 'connecting') {
          agentLogBody.textContent = '';
          const stepEl = document.createElement('div');
          stepEl.setAttribute('class', 'agent-log-step');
          stepEl.textContent = 'Connecting to Cursor agent...';
          agentLogBody.appendChild(stepEl);
        }
      });

      import.meta.hot.send(OverlayEvents.connected);
    } else {
      outer.setAttribute('style', 'display: none;');
      console.log('ESLint overlay is disabled in production mode');
    }
  };

  connect();
};
