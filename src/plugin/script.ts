import badgeError from './badge-error.svg';
import badgeWarning from './badge-warning.svg';
import { OverlayEvents } from './types';

export const load = () => {
  const overlay = document.querySelector('mawns-vite-plugin-eslint-overlay');
  if (!overlay) return;

  const shadowDom = overlay.attachShadow({ mode: 'closed' });
  const badge = document.createElement('badge');
  const outer = document.createElement('outer');
  const inner = document.createElement('inner');
  const header = document.createElement('header');
  const footer = document.createElement('footer');
  const content = document.createElement('content');
  badge.setAttribute('class', 'badge');
  outer.setAttribute('class', 'outer');
  inner.setAttribute('class', 'inner');
  header.setAttribute('class', 'header');
  footer.setAttribute('class', 'footer');
  content.setAttribute('class', 'content');
  inner.appendChild(header);
  inner.appendChild(content);
  inner.appendChild(footer);
  outer.appendChild(inner);

  const styles = document.createElement('style');
  styles.innerHTML = 'cssToBeReplaced';
  shadowDom.appendChild(styles);
  shadowDom.appendChild(outer);
  shadowDom.appendChild(badge);

  outer.addEventListener('click', (event: MouseEvent) => {
    if (event.target && event.target instanceof HTMLElement) {
      if (event.target.tagName === 'OUTER') {
        outer.setAttribute('style', 'display: none;');
        badge.setAttribute('style', 'display: flex;');
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

  const connect = () => {
    if (import.meta.hot) {
      import.meta.hot.on(OverlayEvents.styleUpdate, (cssContent) => {
        styles.innerHTML = cssContent;
      });
    }
    if (import.meta.env.DEV && import.meta.hot) {
      import.meta.hot.on(OverlayEvents.lint, (o) => {
        content.innerHTML = o;
        const errors = o.match(/class="severity-error"/g)?.length || 0;
        const warnings = o.match(/class="severity-warning"/g)?.length || 0;
        let badgeContent = '';
        if (errors > 0) {
          badgeContent += `<img class="badge-error" src="${badgeError}" alt="errors"> ${errors}`;
        }
        if (warnings > 0) {
          badgeContent += `<img class="badge-warning" src="${badgeWarning}" alt="warnings"> ${warnings}`;
        }
        badge.innerHTML = badgeContent;
        if (o) {
          outer.setAttribute('style', 'display: none;');
          badge.setAttribute('style', 'display: flex;');
          header.innerHTML = `<p>ESLint run resulted in <span class="severity-error">${errors} errors</span> and <span class="severity-warning">${warnings} warnings</span>!</p>`;
        } else {
          outer.setAttribute('style', 'display: none;');
          badge.setAttribute('style', 'display: none;');
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
