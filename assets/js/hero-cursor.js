/* ==========================================================================
   hero-cursor.js — hero «слідкує» за курсором (лише миша, Desktop)
   Spec: docs/specs/hero-v2-spec.md, розділ 4.3.
   Підсвічує колонку сітки під курсором (data-active); працює в hero Головної і кейсу. Тег «Guest» біля
   курсора — окремий спільний скрипт cursor-tag.js (той самий тег у Work).
   pointermove лише запам'ятовує, де курсор; колонку рахує requestAnimationFrame.
   Усе декоративне, aria-hidden.
   ========================================================================== */
(function () {
  var hero = document.querySelector('.hero, .case-hero'); // Головна або кейс
  if (!hero) return;

  var media = window.matchMedia('(hover: hover) and (pointer: fine) and (width >= 768px)');
  var columns = Array.prototype.slice.call(hero.querySelectorAll('.column-grid span'));

  var pointer = null;      // { x, y } у координатах вікна
  var frameId = 0;
  var activeColumn = null;

  function hide() {
    if (activeColumn) {
      activeColumn.removeAttribute('data-active');
      activeColumn = null;
    }
  }

  function frame() {
    frameId = 0;
    if (!pointer || !media.matches) return hide();

    var box = hero.getBoundingClientRect();
    if (pointer.x < box.left || pointer.x > box.right ||
        pointer.y < box.top || pointer.y > box.bottom) return hide();

    var under = null;
    columns.forEach(function (column) {
      var rect = column.getBoundingClientRect();
      if (pointer.x >= rect.left && pointer.x <= rect.right) under = column;
    });
    if (under === activeColumn) return;
    if (activeColumn) activeColumn.removeAttribute('data-active');
    if (under) under.setAttribute('data-active', '');
    activeColumn = under;
  }

  function start() {
    if (!frameId) frameId = window.requestAnimationFrame(frame);
  }

  hero.addEventListener('pointermove', function (event) {
    if (event.pointerType !== 'mouse') return;
    pointer = { x: event.clientX, y: event.clientY };
    start();
  });

  hero.addEventListener('pointerleave', function () {
    pointer = null;
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
    hide();
  });

  // Сторінка гортається під нерухомою мишею: підсвітка має йти за hero
  window.addEventListener('scroll', function () {
    if (pointer) start();
  }, { passive: true });
})();
