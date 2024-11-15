window.onload = () => {
  const attempt = (retry = 1) => {
    if (import.meta.hot) {
      console.log(`Connected to websockets successfully`);
      import.meta.hot.on('lint', (o) => {
        const outer = document.querySelector('#mawns_eslint-overlay-outer');
        if (!outer) return;
        const content = outer.querySelector('.content');
        if (!content) return;
        content.innerHTML = o;
        if (o) {
          outer.setAttribute('style', 'display: flex;');
        } else {
          outer.setAttribute('style', 'display: none;');
        }
      });
    } else {
      if (retry <= 10) {
        console.log(`connection failed, retrying in ${retry} second(s)`);
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

  console.log('attempting to connect to vite websockets');
  attempt();
};
