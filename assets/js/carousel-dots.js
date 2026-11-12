(function () {
  document.querySelectorAll('.carousel-dots').forEach(function (dots) {
    var row = dots.previousElementSibling;
    var points = dots.children;
    if (!row || !points.length) return;

    var frameId = 0;
    var active = null;

    function update() {
      frameId = 0;
      var box = row.getBoundingClientRect();
      var center = box.left + box.width / 2;
      var nearest = 0;
      var best = Infinity;
      Array.prototype.forEach.call(row.children, function (card, index) {
        var rect = card.getBoundingClientRect();
        var distance = Math.abs(rect.left + rect.width / 2 - center);
        if (distance < best) {
          best = distance;
          nearest = index;
        }
      });

      var max = row.scrollWidth - row.clientWidth;
      if (row.scrollLeft <= 1) nearest = 0;
      else if (row.scrollLeft >= max - 1) nearest = row.children.length - 1;

      var point = points[Math.min(nearest, points.length - 1)];
      if (point === active) return;
      if (active) active.removeAttribute('data-active');
      point.setAttribute('data-active', '');
      active = point;
    }

    row.addEventListener('scroll', function () {
      if (!frameId) frameId = window.requestAnimationFrame(update);
    }, { passive: true });

    update();
    dots.setAttribute('data-ready', '');
  });
})();
