/* ==========================================================================
   toggle.js — повзунок сегментованого перемикача (toggle.css, компонент Toggle 875:1694)
   Додає в кожен .toggle одну заливку (.toggle__thumb) і переносить її під вибраний сегмент:
   позиція й розмір ідуть у змінні --thumb-x / -y / -w / -h, анімацію робить CSS.
   Без JS заливка стоїть на самому вибраному сегменті (toggle.css), тож усе працює й так.
   Reduced motion: base.css вимикає transition — повзунок просто стає на місце.
   ========================================================================== */
(function () {
  document.querySelectorAll('.toggle').forEach(function (toggle) {
    var thumb = document.createElement('span');
    thumb.className = 'toggle__thumb';
    thumb.setAttribute('aria-hidden', 'true');
    toggle.prepend(thumb);
    toggle.classList.add('toggle--js');

    function place() {
      var input = toggle.querySelector('input:checked');
      var option = input && input.closest('.toggle__option');
      // Вибраний сегмент схований (напр. View на Mobile) — повзунок нульового розміру
      var box = option ? option.getBoundingClientRect() : null;
      if (!box || !box.width) {
        toggle.style.setProperty('--thumb-w', '0px');
        return;
      }
      // Відстань від внутрішнього краю рамки перемикача (clientLeft/Top = товщина рамки)
      var frame = toggle.getBoundingClientRect();
      toggle.style.setProperty('--thumb-x', (box.left - frame.left - toggle.clientLeft) + 'px');
      toggle.style.setProperty('--thumb-y', (box.top - frame.top - toggle.clientTop) + 'px');
      toggle.style.setProperty('--thumb-w', box.width + 'px');
      toggle.style.setProperty('--thumb-h', box.height + 'px');
    }

    place();
    toggle.addEventListener('change', place);
    // Ширина сегментів змінюється з шириною вікна, шрифтом, показом картки каруселі
    var observer = new ResizeObserver(place);
    observer.observe(toggle);
    toggle.querySelectorAll('.toggle__option').forEach(function (option) {
      observer.observe(option);
    });

    // Анімацію вмикаємо після першого кадру, коли повзунок уже на місці
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toggle.dataset.ready = '';
      });
    });
  });
})();
