/* ==========================================================================
   motion-replay.js — повтор коротких «привертаючих увагу» анімацій
   Рішення Насті 11.11 (WCAG 2.2.2): пульс бейджа / статус-пігулки і bob
   скрол-підказки грають ~5 с і зупиняються (скінченна кількість циклів у CSS).
   Цей файл програє їх знову:
   - на hover або focus елемента з атрибутом data-motion-replay;
   - коли сторінку прокрутили вниз і повернулись на самий верх.
   Повторюємо лише анімації, що вже відіграли: поки вони йдуть або ще не
   стартували (hero чекає ротації ролі), нічого не робимо.
   Як Smart Animate з «After delay»: кадри ті самі, просто запускаємо ще раз.
   Без JS пульс на 404 і «Кейсі у роботі» грає один раз, а в hero анімацій
   немає (старт дає hero-role.js). При «Зменшити рух» — нічого.
   ========================================================================== */
(function () {
  var targets = document.querySelectorAll('[data-motion-replay]');
  if (!targets.length || !Element.prototype.getAnimations) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // getAnimations({ subtree: true }) бачить і анімації ::after (ореол пульсу).
  // Завершену анімацію браузер повертає лише з fill-mode forwards (є в CSS);
  // play() на ній перемотує на початок.
  function replay(el) {
    el.getAnimations({ subtree: true }).forEach(function (animation) {
      if (animation.playState === 'finished') animation.play();
    });
  }

  Array.prototype.forEach.call(targets, function (el) {
    el.addEventListener('pointerenter', function () { replay(el); });
    el.addEventListener('focusin', function () { replay(el); });
  });

  // Повернення до верху: спершу треба відійти вниз (більше за 48 px —
  // щоб «пружина» Safari біля нуля не запускала повтор)
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
