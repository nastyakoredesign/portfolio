(function () {
  var targets = document.querySelectorAll('[data-motion-replay]');
  if (!targets.length || !Element.prototype.getAnimations) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function replay(el) {
    el.getAnimations({ subtree: true }).forEach(function (animation) {
      if (animation.playState === 'finished') animation.play();
    });
  }

  Array.prototype.forEach.call(targets, function (el) {
    el.addEventListener('pointerenter', function () { replay(el); });
    el.addEventListener('focusin', function () { replay(el); });
  });

  var away = false;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (y > 48) {
      away = true;
    } else if (away && y <= 0) {
      away = false;
      Array.prototype.forEach.call(targets, replay);
    }
  }, { passive: true });
})();
