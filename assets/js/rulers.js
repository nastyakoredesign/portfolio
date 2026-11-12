(function () {
  if (!('ResizeObserver' in window)) return;

  var STEP = 200;
  var MIN_GAP = 45;

  document.querySelectorAll('.rulers[data-target]').forEach(function (rulers) {
    var target = document.querySelector(rulers.getAttribute('data-target'));
    var top = rulers.querySelector('.rulers__top');
    var left = rulers.querySelector('.rulers__left');
    if (!target || !top || !left) return;

    function makeLabel(parent, extra) {
      var label = document.createElement('span');
      label.className = 'rulers__label' + (extra ? ' ' + extra : '');
      parent.appendChild(label);
      return label;
    }

    var bound = {
      x1: makeLabel(top, 'rulers__label--bound'),
      x2: makeLabel(top, 'rulers__label--bound'),
      y1: makeLabel(left, 'rulers__label--bound'),
      y2: makeLabel(left, 'rulers__label--bound')
    };
    var marks = [];

    function setPos(label, px) {
      label.style.setProperty('--pos', px + 'px');
    }

    function update() {
      var box = rulers.getBoundingClientRect();
      if (!box.width) return;

      var rect = target.getBoundingClientRect();
      var x1 = Math.round(rect.left - box.left);
      var x2 = Math.round(rect.right - box.left);
      var y1 = Math.round(rect.top - box.top);
      var y2 = Math.round(rect.bottom - box.top);

      rulers.style.setProperty('--x1', x1 + 'px');
      rulers.style.setProperty('--x2', x2 + 'px');
      rulers.style.setProperty('--y1', y1 + 'px');
      rulers.style.setProperty('--y2', y2 + 'px');

      bound.x1.textContent = x1; setPos(bound.x1, x1);
      bound.x2.textContent = x2; setPos(bound.x2, x2);
      bound.y1.textContent = y1; setPos(bound.y1, y1);
      bound.y2.textContent = y2; setPos(bound.y2, y2);

      var count = Math.floor(box.width / STEP);
      while (marks.length < count) marks.push(makeLabel(top));
      marks.forEach(function (label, i) {
        var value = (i + 1) * STEP;
        label.textContent = value;
        setPos(label, value);
        label.hidden = i >= count ||
          Math.abs(value - x1) < MIN_GAP || Math.abs(value - x2) < MIN_GAP;
      });

      rulers.setAttribute('data-ready', '');
    }

    var observer = new ResizeObserver(update);
    observer.observe(rulers);
    observer.observe(target);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
    update();
  });
})();
