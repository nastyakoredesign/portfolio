(function () {
  var media = window.matchMedia('(hover: hover) and (pointer: fine) and (width >= 768px)');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  var OFFSET_X = 12;
  var OFFSET_Y = 16;
  var LAG = 8;
  var MAX_LAG = 8;
  var PREDICT = 10;

  function follow(area, tag) {
    var only = area.getAttribute('data-cursor-area');

    var pointer = null;
    var velocity = { x: 0, y: 0 };
    var lastEvent = 0;
    var frameId = 0;
    var tagAt = null;
    var lastTime = 0;

    function hide() {
      tag.removeAttribute('data-visible');
      tagAt = null;
    }

    function isOver() {
      var box = area.getBoundingClientRect();
      if (pointer.x < box.left || pointer.x > box.right ||
          pointer.y < box.top || pointer.y > box.bottom) return false;
      if (!only) return true;
      var under = document.elementFromPoint(pointer.x, pointer.y);
      return Boolean(under && under.closest(only) && area.contains(under));
    }

    function frame() {
      frameId = 0;
      if (!pointer || !media.matches || !isOver()) return hide();

      var now = performance.now();
      var dt = Math.max(1, Math.min(now - lastTime, 50));
      lastTime = now;

      var still = now - lastEvent > 60;
      var targetX = pointer.x + OFFSET_X + (still ? 0 : velocity.x * PREDICT);
      var targetY = pointer.y + OFFSET_Y + (still ? 0 : velocity.y * PREDICT);
      if (!tagAt) tagAt = { x: targetX, y: targetY };

      var k = reduced.matches ? 1 : 1 - Math.exp(-dt / LAG);
      tagAt.x += (targetX - tagAt.x) * k;
      tagAt.y += (targetY - tagAt.y) * k;

      var dx = targetX - tagAt.x;
      var dy = targetY - tagAt.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > MAX_LAG) {
        tagAt.x = targetX - dx * MAX_LAG / distance;
        tagAt.y = targetY - dy * MAX_LAG / distance;
      }

      tag.style.transform = 'translate(' + tagAt.x + 'px, ' + tagAt.y + 'px)';
      tag.setAttribute('data-visible', '');

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

    window.addEventListener('scroll', function () {
      if (pointer) start();
    }, { passive: true });
  }

  document.querySelectorAll('[data-cursor-area]').forEach(function (area) {
    var tag = area.querySelector(':scope > .cursor-tag:not(.cursor-tag--static)');
    if (tag) follow(area, tag);
  });
})();
