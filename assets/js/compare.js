(function () {
  var desktop = window.matchMedia('(width >= 768px)');
  var compares = document.querySelectorAll('.compare');

  compares.forEach(function (compare) {
    var imgs = compare.querySelectorAll('.compare__img');
    imgs.forEach(function (img) {
      img.addEventListener('load', function () {
        imgs.forEach(function (other) { other.loading = 'eager'; });
      }, { once: true });
    });

    var media = compare.querySelector('.compare__media');
    var range = compare.querySelector('.compare__range');
    if (!media || !range) return;

    function setPos() {
      media.style.setProperty('--pos', range.value + '%');
    }

    setPos();
    range.addEventListener('input', setPos);
  });

  function update() {
    compares.forEach(function (compare) {
      var range = compare.querySelector('.compare__range');
      if (!range) return;
      compare.classList.toggle('compare--enhanced', desktop.matches);
      range.hidden = !desktop.matches;
    });
  }

  update();
  desktop.addEventListener('change', update);
})();
