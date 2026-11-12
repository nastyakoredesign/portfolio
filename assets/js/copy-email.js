/* ==========================================================================
   copy-email.js — кнопка Copy біля email у секції Contact
   Spec: docs/specs/ds-components.md → «Contact (14.10)»; рішення 14.10.
   Прогресивне покращення: кнопка в розмітці має hidden. Якщо JS вимкнено
   або немає Clipboard API, вона лишається схованою — адресу видно текстом.
   Текст «Copied» лежить у HTML (data-copied-label), не тут.
   ========================================================================== */

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
        // Браузер не дав доступ до буфера: ховаємо кнопку, адреса лишається текстом
        button.hidden = true;
        return;
      }

      // data-copied перемикає іконку copy → check (CSS), aria-live читає підпис
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
