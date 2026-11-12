(function () {
  var output = document.querySelector('[data-computed="font-size"]');
  var title = document.querySelector('.hero__title');
  if (!output || !title || !('ResizeObserver' in window)) return;

  function update() {
    output.textContent = Math.round(parseFloat(getComputedStyle(title).fontSize)) + 'px';
  }

  new ResizeObserver(update).observe(title);
  update();
})();
