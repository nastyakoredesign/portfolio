/* ==========================================================================
   hero-snippet.js — чесний розмір шрифту в коді у куті hero
   Рядок-коментар «104px · Commissioner 600» має показувати те, що справді на
   сторінці: беремо computed font-size заголовка (на 768–1000 px це 11.2vw,
   а не токен). Spec: hero-v2-spec.md, розділ 4. HTML: span[data-computed].
   Без JS лишається «104px» з HTML.
   ========================================================================== */
(function () {
  var output = document.querySelector('[data-computed="font-size"]');
  var title = document.querySelector('.hero__title');
  if (!output || !title || !('ResizeObserver' in window)) return;

  function update() {
    output.textContent = Math.round(parseFloat(getComputedStyle(title).fontSize)) + 'px';
  }

  // Розмір шрифту змінюється разом із висотою заголовка
  new ResizeObserver(update).observe(title);
  update();
})();
