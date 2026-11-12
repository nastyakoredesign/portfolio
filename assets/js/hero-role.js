/* ==========================================================================
   hero-role.js — ротація ролі в заголовку hero (один прохід, без циклу)
   UX/UI designer → Design engineer → Product designer → стоп.
   Spec: docs/specs/hero-v2-spec.md, розділ 2. CSS: components/hero.css.
   Слова беремо з data-roles в HTML (тексти не в JS). Інлайн-скрипт після h1 уже
   підмінив слово на перше, тут лише грає перехід. Як Smart Animate між кадрами:
   старе слово йде за --duration-exit, нове заходить за --duration-base,
   рамка Selection змінює ширину за --duration-slow (transition у CSS).
   Шрифт чекаємо не довше 1 с: інакше ротацію пропускаємо й лишаємо фінал
   (рішення 14.10). Без JS і при prefers-reduced-motion — одразу «Product designer».
   Перезапуск (14.10, ідея Насті): коли ротація завершилась, наведення курсора
   на роль програє її знову з першого слова. Лише для миші, і тільки після
   завершення: під час руху наведення нічого не робить.
   ========================================================================== */
(function () {
  var role = document.querySelector('.hero__role[data-rotation="pending"]');
  if (!role) return; // reduced-motion або інлайн-скрипт не запускався

  var text = role.firstElementChild;
  var roles = role.getAttribute('data-roles').split('|');
  var FONT_TIMEOUT = 1000;       // стільки чекаємо шрифт, мс
  var STEP_AT = [1100, 2600];    // коли стартує перехід на 2-гу й 3-тю роль, мс від старту
  var FONT = '600 1em Commissioner';

  function html(name) {
    var words = name.split(' ');
    return words[0] + ' <em>' + words[1] + '</em>';
  }

  // Ротація скінчилась: далі ~5 с грають пульс бейджа і bob підказки (CSS читає
  // data-motion на hero). Перезапуск ролі за hover їх не повторює — це робить
  // motion-replay.js (hover і focus на них самих, повернення до верху).
  var hero = role.closest('.hero');

  function finish() {
    role.style.width = '';
    role.setAttribute('data-rotation', 'done');
    if (hero) hero.setAttribute('data-motion', 'settled');
  }

  // Ширина слова: невидима копія в тому самому шрифті й розмірі
  function measure(name) {
    var probe = document.createElement('span');
    probe.className = 'hero__role-text hero__role-text--probe';
    probe.innerHTML = html(name);
    role.appendChild(probe);
    var width = probe.getBoundingClientRect().width;
    role.removeChild(probe);
    return width;
  }

  // Подія transitionend з запасним таймером: перехід міг не стартувати
  function once(target, property, callback, fallback) {
    var done = false;
    function run() {
      if (done) return;
      done = true;
      target.removeEventListener('transitionend', onEnd);
      callback();
    }
    function onEnd(event) {
      if (event.target === target && event.propertyName === property) run();
    }
    target.addEventListener('transitionend', onEnd);
    setTimeout(run, fallback);
  }

  var widths;

  function swap(index, isLast) {
    role.style.width = widths[index] + 'px';           // рамка їде за шириною
    text.setAttribute('data-phase', 'out');            // старе слово йде вгору

    once(text, 'opacity', function () {
      text.innerHTML = html(roles[index]);
      text.setAttribute('data-phase', 'pre-in');       // нове слово: знизу, невидиме
      void text.offsetWidth;                           // застосувати стартову позу
      text.removeAttribute('data-phase');              // …і заїжджає на місце
      if (isLast) once(role, 'width', finish, 600);
    }, 400);
  }

  // Один прохід. Перезапуск стартує з поточного слова: спершу перехід на перше
  function play(isReplay) {
    widths = roles.map(measure);
    role.setAttribute('data-rotation', 'running');
    if (isReplay) {
      // ширина з Hug → явна, щоб рамка поїхала до першого слова (auto не анімується)
      role.style.width = role.getBoundingClientRect().width + 'px';
      void role.offsetWidth;
      swap(0, false);
    } else {
      role.style.width = widths[0] + 'px';
    }
    STEP_AT.forEach(function (delay, i) {
      setTimeout(function () {
        swap(i + 1, i === STEP_AT.length - 1);
      }, delay);
    });
  }

  // Перезапуск: лише курсором і лише коли попередній прохід завершений
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    role.addEventListener('pointerenter', function (event) {
      if (event.pointerType !== 'mouse') return;
      if (role.getAttribute('data-rotation') !== 'done') return;
      play(true);
    });
  }

  function skip() {
    text.innerHTML = html(roles[roles.length - 1]);
    finish();
  }

  if (!document.fonts || !document.fonts.load) return skip();

  Promise.race([
    document.fonts.load(FONT),
    new Promise(function (resolve) { setTimeout(resolve, FONT_TIMEOUT); })
  ]).then(function () {
    if (document.fonts.check(FONT)) play(false);
    else skip();
  }, skip);
})();
