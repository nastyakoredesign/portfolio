/* ==========================================================================
   hero-measure.js — вимірювання відстаней при наведенні на рамку (як Alt у Figma)
   CSS: components/measure.css. Spec: docs/specs/hero-v2-spec.md, розділ 4.4
   (Головна) і docs/specs/hifi-case.md → «Hero кейсу», п. 4 (кейс).
   Наведення на рамку показує відстані від країв САМОЇ рамки:
   - Головна: від бейджа до верху рамки ролі, від низу рамки до lead, а
     горизонтально — від країв контейнера (сітки) до країв рамки, по її центру;
   - кейс: від мета-пігулок до верху медіа, а горизонтально — від країв hero
     (екрана) до країв медіа: ті самі числа, що підписані на лінійках.
   Числа справжні: getBoundingClientRect() і Math.round — сайт сам показує,
   що макет і код збігаються. Лише миша й ширина ≥ 768 px.
   Конфіг кожного hero — в CONFIGS: селектори елементів. below — необов'язковий;
   edges: 'container' (краї контейнера) або 'hero' (краї самого hero).
   ========================================================================== */
(function () {
  var CONFIGS = [
    { hero: '.hero', content: '.hero__content', frame: '.hero__role .selection',
      above: '.badge', below: '.hero__lead', edges: 'container' },
    { hero: '.case-hero', content: '.case-hero__content', frame: '.case-hero__frame',
      above: '.meta-pills', below: null, edges: 'hero' }
  ];

  var media = window.matchMedia('(hover: hover) and (pointer: fine) and (width >= 768px)');

  function init(config) {
    var hero = document.querySelector(config.hero);
    if (!hero) return;

    var content = hero.querySelector(config.content);
    var frame = hero.querySelector(config.frame);
    var above = hero.querySelector(config.above);
    var below = config.below ? hero.querySelector(config.below) : null;
    if (!content || !frame || !above || (config.below && !below)) return;

    // Шар вимірювань — над вмістом, як панель Alt у Figma
    var layer = document.createElement('div');
    layer.className = 'measure';
    layer.setAttribute('aria-hidden', 'true');
    hero.appendChild(layer);

    function makeItem(kind) {
      var item = document.createElement('span');
      item.className = 'measure__item measure__item--' + kind;
      var pill = document.createElement('b');
      pill.className = 'measure__pill';
      item.appendChild(pill);
      layer.appendChild(item);
      return { element: item, pill: pill };
    }

    var items = { above: makeItem('v'), left: makeItem('h'), right: makeItem('h') };
    if (below) items.below = makeItem('v');

    var pointer = null;
    var queued = false;

    function contains(rect, point) {
      return point.x >= rect.left && point.x <= rect.right &&
        point.y >= rect.top && point.y <= rect.bottom;
    }

    function clear() {
      Object.keys(items).forEach(function (key) {
        items[key].element.removeAttribute('data-on');
      });
    }

    function show(item, x, y, length, value) {
      if (length < 1) return item.element.removeAttribute('data-on');
      item.element.style.setProperty('--x', x + 'px');
      item.element.style.setProperty('--y', y + 'px');
      item.element.style.setProperty('--len', length + 'px');
      item.pill.textContent = Math.round(value);
      item.element.setAttribute('data-on', '');
    }

    function update() {
      queued = false;
      if (!pointer || !media.matches) return clear();

      var box = frame.getBoundingClientRect();
      if (!contains(box, pointer)) return clear();

      var origin = hero.getBoundingClientRect();
      var edges = config.edges === 'hero' ? origin : content.getBoundingClientRect();
      var aboveBox = above.getBoundingClientRect();
      var centerX = (box.left + box.right) / 2 - origin.left;
      var centerY = (box.top + box.bottom) / 2 - origin.top;

      clear();
      show(items.above, centerX, aboveBox.bottom - origin.top, box.top - aboveBox.bottom, box.top - aboveBox.bottom);
      if (below) {
        var belowBox = below.getBoundingClientRect();
        show(items.below, centerX, box.bottom - origin.top, belowBox.top - box.bottom, belowBox.top - box.bottom);
      }
      show(items.left, edges.left - origin.left, centerY, box.left - edges.left, box.left - edges.left);
      show(items.right, box.right - origin.left, centerY, edges.right - box.right, edges.right - box.right);
    }

    function schedule() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }

    hero.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    });

    hero.addEventListener('pointerleave', function () {
      pointer = null;
      clear();
    });

    window.addEventListener('scroll', function () {
      if (pointer) schedule();
    }, { passive: true });

    // Рамка змінила розмір (ротація ролі, ресайз): числа мають оновитись
    if ('ResizeObserver' in window) {
      var observer = new ResizeObserver(function () {
        if (pointer) schedule();
      });
      observer.observe(frame);
      observer.observe(hero);
    }
  }

  CONFIGS.forEach(init);
})();
