(function () {
  var frame = document.querySelector('.case-hero__frame');
  var size = document.querySelector('.case-hero__size');
  if (!frame || !size || !('ResizeObserver' in window)) return;

  function update() {
    var rect = frame.getBoundingClientRect();
    if (!rect.width) return;
    size.textContent = Math.round(rect.width) + ' × ' + Math.round(rect.height);
  }

  new ResizeObserver(update).observe(frame);
  update();
})();
