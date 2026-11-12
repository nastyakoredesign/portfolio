/* ==========================================================================
   hero-size.js — реальний розмір медіа в пігулці під hero кейсу
   Spec: docs/specs/hifi-case.md → «Hero кейсу: фон і анімація», п. 2.
   Читає межі кадру getBoundingClientRect() — справжні значення, як панель розмірів
   у Figma, — і пише «ширина × висота». Слідкує за кадром (ResizeObserver): число
   оновлюється на ресайзі й повороті екрана. Без JS лишається запасне число з розмітки.
   ========================================================================== */
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
