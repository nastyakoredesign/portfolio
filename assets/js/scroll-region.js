(function () {
  var ATTRS = ['tabindex', 'role', 'aria-label'];

  document.querySelectorAll('[data-scroll-region]').forEach(function (region) {
    var saved = {};
    ATTRS.forEach(function (name) {
      if (region.hasAttribute(name)) saved[name] = region.getAttribute(name);
    });

    function update() {
      var scrolls = region.scrollWidth > region.clientWidth + 1;
      ATTRS.forEach(function (name) {
        if (!(name in saved)) return;
        if (scrolls) region.setAttribute(name, saved[name]);
        else region.removeAttribute(name);
      });
    }

    if ('ResizeObserver' in window) new ResizeObserver(update).observe(region);
    else window.addEventListener('resize', update);
    update();
  });
})();
