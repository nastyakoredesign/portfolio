/* ==========================================================================
   cursor-tag.js — тег біля курсора, як у мультиплеєрі Figma (лише миша, Desktop)
   Spec: docs/specs/cursor-tag-spec.md. Стиль: components/cursor-tag.css.
   Зона — елемент з data-cursor-area, тег — її дочірній .cursor-tag:
   - hero: data-cursor-area без значення — тег «Guest» видно в усьому hero;
   - Work: data-cursor-area=".case-card" — тег «Discover» лише над картками;
   - посилання-заглушка (Coming soon…): зона — саме посилання <a data-cursor-area>,
     тег — його дочірній span. Другий тег .cursor-tag--static — для клавіатури,
     його показує лише CSS, цей скрипт його не чіпає.
   Тег іде за курсором із мінімальною затримкою: позиція доганяє курсор за
   кілька кадрів, а не стрибає; за швидкого руху миші відстає не більше ніж
   на MAX_LAG px. Тег лишається з одного боку курсора (праворуч-вниз); біля
   краю вікна він не підпирається в нього, а їде далі й ховається за екран.
   pointermove лише запам'ятовує, де курсор, а цикл requestAnimationFrame раз
   на кадр робить крок тега. Усе декоративне, aria-hidden.
   ========================================================================== */
(function () {
  var media = window.matchMedia('(hover: hover) and (pointer: fine) and (width >= 768px)');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  var OFFSET_X = 12;   // тег від вістря курсора
  var OFFSET_Y = 16;
  var LAG = 8;         // «інерція» тега, мс: менше — жорсткіше (0 = без затримки)
  var MAX_LAG = 8;     // найдалі, на скільки px тег може відстати від свого місця
  var PREDICT = 10;    // на скільки мс уперед «бачить» тег: системний курсор малюється
                       // раніше за сторінку, і без цього тег завжди трохи позаду

  function follow(area, tag) {
    var only = area.getAttribute('data-cursor-area'); // де показувати; порожньо — у всій зоні

    var pointer = null;      // { x, y } у координатах вікна
    var velocity = { x: 0, y: 0 };  // px/мс за останніми двома подіями
    var lastEvent = 0;
    var frameId = 0;
    var tagAt = null;        // де тег зараз
    var lastTime = 0;

    function hide() {
      tag.removeAttribute('data-visible');
      tagAt = null;
    }

    // Курсор над потрібним місцем? (для Work — над карткою, а не між ними)
    function isOver() {
      var box = area.getBoundingClientRect();
      if (pointer.x < box.left || pointer.x > box.right ||
          pointer.y < box.top || pointer.y > box.bottom) return false;
      if (!only) return true;
      var under = document.elementFromPoint(pointer.x, pointer.y);
      return Boolean(under && under.closest(only) && area.contains(under));
    }

    // Один кадр: крок тега до цілі
    function frame() {
      frameId = 0;
      if (!pointer || !media.matches || !isOver()) return hide();

      var now = performance.now();
      var dt = Math.max(1, Math.min(now - lastTime, 50));
      lastTime = now;

      // Курсор зупинився (давно не було подій) — прогнозу немає, тег сідає рівно
      var still = now - lastEvent > 60;
      var targetX = pointer.x + OFFSET_X + (still ? 0 : velocity.x * PREDICT);
      var targetY = pointer.y + OFFSET_Y + (still ? 0 : velocity.y * PREDICT);
      if (!tagAt) tagAt = { x: targetX, y: targetY }; // перша поява: без «прильоту» з кута

      var k = reduced.matches ? 1 : 1 - Math.exp(-dt / LAG);
      tagAt.x += (targetX - tagAt.x) * k;
      tagAt.y += (targetY - tagAt.y) * k;

      // Стеля відставання: швидкий рух миші не відриває тег від курсора
      var dx = targetX - tagAt.x;
      var dy = targetY - tagAt.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > MAX_LAG) {
        tagAt.x = targetX - dx * MAX_LAG / distance;
        tagAt.y = targetY - dy * MAX_LAG / distance;
      }

      tag.style.transform = 'translate(' + tagAt.x + 'px, ' + tagAt.y + 'px)';
      tag.setAttribute('data-visible', '');

      // Крутимо цикл, поки тег доганяє; зупинився — чекаємо наступного pointermove
      if (distance > 0.2 || !still) frameId = window.requestAnimationFrame(frame);
    }

    function start() {
      if (frameId) return;
      lastTime = performance.now() - 16;
      frameId = window.requestAnimationFrame(frame);
    }

    area.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'mouse') return;
      var now = performance.now();
      var elapsed = now - lastEvent;
      if (pointer && elapsed > 0 && elapsed < 60) {
        // швидкість, обмежена, щоб один різкий ривок не відкинув тег далеко
        velocity.x = Math.max(-3, Math.min(3, (event.clientX - pointer.x) / elapsed));
        velocity.y = Math.max(-3, Math.min(3, (event.clientY - pointer.y) / elapsed));
      } else {
        velocity.x = 0;
        velocity.y = 0;
      }
      lastEvent = now;
      pointer = { x: event.clientX, y: event.clientY };
      start();
    });

    area.addEventListener('pointerleave', function () {
      pointer = null;
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
      hide();
    });

    // Сторінка гортається під нерухомою мишею: тег перевіряє, над чим він тепер
    window.addEventListener('scroll', function () {
      if (pointer) start();
    }, { passive: true });
  }

  document.querySelectorAll('[data-cursor-area]').forEach(function (area) {
    var tag = area.querySelector(':scope > .cursor-tag:not(.cursor-tag--static)');
    if (tag) follow(area, tag);
  });
})();
