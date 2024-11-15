window.onload = () => {
  if (import.meta.hot)
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
  else
    throw new Error(
      'import.meta.hot is not defined but is required for vite-plugin-eslint to work.'
    );
};
