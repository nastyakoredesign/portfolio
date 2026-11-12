/* ==========================================================================
   compare.js — порівняння до/після з лінією (рішення Web portal у кейсі)
   Figma: компонент Compare (288:404), View=Slider. Spec: docs/specs/before-after-spec.md.
   Лише Desktop (≥ 768): показує повзунок і додає .compare--enhanced — скріни
   накладаються, значення повзунка йде в змінну --pos на кадрі.
   На Mobile перемикач Before | After на радіо (CSS :has()); JS лише заздалегідь
   вантажить прихований скрін.
   Без JS — два скріни поруч, кожен зі своєю міткою.
   ========================================================================== */
(function () {
  var desktop = window.matchMedia('(width >= 768px)');
  var compares = document.querySelectorAll('.compare');

  compares.forEach(function (compare) {
    // На Mobile видно один скрін, а другий («лінивий», loading=lazy) почав би вантажитись
    // лише після перемикання. Щойно видимий завантажився — підтягуємо й решту заздалегідь.
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

    // Браузер може відновити значення повзунка після перезавантаження — беремо його
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
