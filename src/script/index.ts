const cssText =
  '#mawns_eslint-overlay-outer{position:fixed;top:0;left:0;width:100%;height:100%;background-color:transparent;z-index:9999999999;justify-content:center;align-items:center;background-color:#464646e6;display:none}#mawns_eslint-overlay-outer .active{display:flex}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner{display:block;border:1px solid rgb(58,58,58);max-width:1000px;width:90%;height:95%;background-color:#131313e6;z-index:9999999999;border-radius:.5rem;overflow:hidden;display:flex;flex-direction:column}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar{width:14px;height:14px}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-button{display:none;width:0;height:0}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-corner{background-color:transparent}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-track{background:transparent}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-thumb{height:6px;border:4px solid rgba(0,0,0,0);background-color:#0003;background-clip:padding-box;-webkit-border-radius:7px;-webkit-box-shadow:inset -1px -1px 0px rgba(0,0,0,.05),inset 1px 1px 0px rgba(0,0,0,.05)}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner ::-webkit-scrollbar-thumb:hover{background-color:#0006}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .header{background-color:#08080880;height:3rem;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;padding:1rem 0}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .header .severity-warning{color:#d8b724}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .header .severity-error{color:#b33b3b}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content{display:flex;flex-direction:column;flex-grow:1;overflow:auto;padding:1rem 2rem}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .lint-result{padding-bottom:1rem;margin-bottom:1rem;border-bottom:1px solid rgb(105,105,105)}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .result{margin:0}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .file-path{margin-bottom:.2rem;color:#fff;text-decoration:underline}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .severity-warning{color:#d8b724;margin-right:1rem}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .severity-error{color:#b33b3b;margin-right:1rem}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .line-details{margin-right:1rem;color:#636363}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .message-text{color:#bdbdbd}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .content .rule-id{margin-left:1rem;color:#636363}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .footer{background-color:#08080880;height:3rem;color:#887833;display:flex;align-items:center;justify-content:center;text-align:center;padding:1rem 0}#mawns_eslint-overlay-outer #mawns_eslint-overlay-inner .footer:before{content:"Press ESC or click anywhere outside this window to close"}';

window.onload = () => {
  const body = document.querySelector('body');
  if (!body) return;
  const root = document.createElement('div');
  root.setAttribute('id', 'mawns_eslint-overlay-root');
  body.appendChild(root);

  const shadowDom = root.attachShadow({ mode: 'closed' });
  const outer = document.createElement('div');
  const inner = document.createElement('div');
  const header = document.createElement('div');
  const content = document.createElement('div');
  // const footer = document.createElement('div');
  outer.setAttribute('id', 'mawns_eslint-overlay-outer');
  inner.setAttribute('id', 'mawns_eslint-overlay-inner');
  header.setAttribute('class', 'header');
  content.setAttribute('class', 'content');
  // footer.setAttribute('class', 'footer');
  inner.appendChild(header);
  inner.appendChild(content);
  // inner.appendChild(footer);
  outer.appendChild(inner);

  const styles = document.createElement('style');
  styles.setAttribute('type', 'text/css');
  styles.innerHTML = cssText as string;

  shadowDom.appendChild(styles);
  shadowDom.appendChild(outer);

  const attempt = (retry = 1) => {
    if (import.meta.hot) {
      import.meta.hot.on('lint', (o) => {
        content.innerHTML = o;
        const errors = o.match(/class="severity-error"/g)?.length || 0;
        const warnings = o.match(/class="severity-warning"/g)?.length || 0;
        if (o) {
          outer.setAttribute('style', 'display: flex;');
          header.innerHTML = `<p>ESLint run resulted in <span class="severity-error">${errors} errors</span> and <span class="severity-warning">${warnings} warnings</span>!</p>`;
        } else {
          outer.setAttribute('style', 'display: none;');
        }
      });
      import.meta.hot.send('vite-plugin-eslint:connected');
    } else {
      if (retry <= 10) {
        console.log(`ws connection failed, retrying in ${retry} second(s)`);
        setTimeout(() => {
          attempt(retry + 1);
        }, 1000 * retry);
      } else {
        console.error(
          'Failed to load ESLint overlay. import.meta.hot is not available.'
        );
      }
    }
  };

  attempt();
};
