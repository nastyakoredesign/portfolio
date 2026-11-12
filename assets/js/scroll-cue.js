/* ==========================================================================
   scroll-cue.js — «слизняк» скрол-підказки: анімація повернення (out)
   Figma: 367:3054. CSS: components/hero.css (блок «Hover «слизняк»»).
   Ставить data-leaving, коли мишу прибрали з підказки, — CSS програє
   пружне повернення кола. Без цього файлу підказка працює: коло біліє
   на hover і просто повертається (лише для пристроїв з курсором).
   Під час прокрутки підказка не згасає (16.10, Настя).
   ========================================================================== */
(function () {
  var cue = document.querySelector('.scroll-cue');
  if (!cue) return;

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  cue.addEventListener('pointerleave', function (event) {
    if (event.pointerType === 'mouse') cue.setAttribute('data-leaving', '');
  });

  // Курсор повернувся — повернення скасовуємо, щоб воно не мигнуло зайвий раз
  cue.addEventListener('pointerenter', function () {
    cue.removeAttribute('data-leaving');
  });

  // Анімація відіграла — прибираємо маркер (animationend спливає й від стрілки)
  cue.addEventListener('animationend', function (event) {
    if (event.animationName === 'scroll-cue-out') cue.removeAttribute('data-leaving');
  });
})();
