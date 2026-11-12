
(() => {
  const COPIED_MS = 2000;

  document.querySelectorAll('.email-copy').forEach((root) => {
    const button = root.querySelector('.email-copy__button');
    const address = root.querySelector('.email-copy__address');
    const status = root.querySelector('.email-copy__status');
    if (!button || !address || !status || !navigator.clipboard?.writeText) return;

    button.hidden = false;
    let timer;

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(address.textContent.trim());
      } catch {
        button.hidden = true;
        return;
      }

      root.setAttribute('data-copied', '');
      status.textContent = root.dataset.copiedLabel;

      clearTimeout(timer);
      timer = setTimeout(() => {
        root.removeAttribute('data-copied');
        status.textContent = '';
      }, COPIED_MS);
    });
  });
})();
