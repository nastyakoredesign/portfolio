(function () {
  document.querySelectorAll('.toggle').forEach(function (toggle) {
    var thumb = document.createElement('span');
    thumb.className = 'toggle__thumb';
    thumb.setAttribute('aria-hidden', 'true');
    toggle.prepend(thumb);
    toggle.classList.add('toggle--js');

    function place() {
      var input = toggle.querySelector('input:checked');
      var option = input && input.closest('.toggle__option');
      var box = option ? option.getBoundingClientRect() : null;
      if (!box || !box.width) {
        toggle.style.setProperty('--thumb-w', '0px');
        return;
      }
      var frame = toggle.getBoundingClientRect();
      toggle.style.setProperty('--thumb-x', (box.left - frame.left - toggle.clientLeft) + 'px');
      toggle.style.setProperty('--thumb-y', (box.top - frame.top - toggle.clientTop) + 'px');
      toggle.style.setProperty('--thumb-w', box.width + 'px');
      toggle.style.setProperty('--thumb-h', box.height + 'px');
    }

    place();
    toggle.addEventListener('change', place);
    var observer = new ResizeObserver(place);
    observer.observe(toggle);
    toggle.querySelectorAll('.toggle__option').forEach(function (option) {
      observer.observe(option);
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toggle.dataset.ready = '';
      });
    });
  });
})();
