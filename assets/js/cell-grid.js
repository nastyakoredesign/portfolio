/* ==========================================================================
   cell-grid.js — клітинки фону Contact реагують на курсор (лише миша, Desktop)
   CSS: components/cell-grid.css. Як колонки в hero (hero-cursor.js), але слід:
   клітинка, з якої курсор пішов, не гасне миттєво, а повільно (--duration-slow).
   Тому підсвіток кілька (POOL) — беремо їх по колу, найстаріша вже згасла.
   pointermove лише запам'ятовує, де курсор; клітинку рахує requestAnimationFrame.
   ========================================================================== */
(function () {
  var media = window.matchMedia('(hover: hover) and (pointer: fine) and (width >= 768px)');
  var POOL = 8;

  document.querySelectorAll('.cell-grid').forEach(function (grid) {
    var area = grid.parentElement;
    var cells = [];
    for (var i = 0; i < POOL; i++) cells.push(grid.appendChild(document.createElement('span')));

    var pointer = null;
    var frameId = 0;
    var current = null;   // підсвітка під курсором
    var currentKey = '';  // «колонка:рядок» клітинки під курсором
    var next = 0;

    function clear() {
      if (current) current.removeAttribute('data-active');
      current = null;
      currentKey = '';
    }

    function frame() {
      frameId = 0;
      if (!pointer || !media.matches) return clear();

      var box = grid.getBoundingClientRect();
      var size = parseFloat(getComputedStyle(grid).getPropertyValue('--cell-size'));
      // Плитка фону по центру (background-position: center top), тож клітинки
      // відраховуємо від лівого краю центральної
      var originX = (box.width - size) / 2;
      var x = pointer.x - box.left;
      var y = pointer.y - box.top;
      if (x < 0 || y < 0 || x > box.width || y > box.height) return clear();

      var column = Math.floor((x - originX) / size);
      var row = Math.floor(y / size);
      var key = column + ':' + row;
      if (key === currentKey) return;

      clear();
      current = cells[next];
      next = (next + 1) % POOL;
      current.style.transform = 'translate(' + (originX + column * size) + 'px, ' + row * size + 'px)';
      current.setAttribute('data-active', '');
      currentKey = key;
    }

    function start() {
      if (!frameId) frameId = window.requestAnimationFrame(frame);
    }

    area.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY };
      start();
    });

    area.addEventListener('pointerleave', function () {
      pointer = null;
      start();
    });

    // Сторінка гортається під нерухомою мишею: підсвітка йде за клітинками
    window.addEventListener('scroll', function () {
      if (pointer) start();
    }, { passive: true });
  });
})();
