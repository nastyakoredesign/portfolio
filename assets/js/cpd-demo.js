/* ==========================================================================
   cpd-demo.js — демо Training & CPD у секції Process (один прохід, без циклу)
   Spec: docs/specs/process-cpd-animation-spec.md, п. 6–7 і 10. CSS: components/cpd-demo.css.
   - У HTML кінцевий стан (END). Без JS і з prefers-reduced-motion так і лишається, кнопки паузи немає.
   - START до першого малювання ставить інлайн-скрипт одразу після блоку (у HTML); цей файл
     позначає блок data-ready (інакше інлайн-скрипт на load повертає END).
   - Перший прохід — коли блок ≥ 50 % у полі зору: доскролили до секції, або вона вже на екрані
     після перезавантаження (Настя 20.10).
   - Пауза: кнопка (як у hero, aria-pressed) і автоматично, поки блок поза екраном.
     Після кінця кнопка програє прохід знову; наведення миші — теж (лише hover + точний вказівник).
   - Повтор починається з «перемотки»: END плавно перетікає в START (банер проявляється,
     новий рядок зникає, стовпчики спадають), а не перескакує.
   JS лише міняє атрибути; як виглядає кожен стан і переходи — у CSS.
   ========================================================================== */
(function () {
  var demo = document.querySelector('.cpd-demo');
  if (!demo || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var toggle = demo.querySelector('.hero-flow__toggle');

  // Той самий START, що й в інлайн-скрипті після блоку (у HTML)
  var START = { chart: 'start', page: 'start', banner: 'on', camera: 'page', tooltip: 'none', cursor: 'off' };

  // Таймлайн, мс від старту (spec п. 10). Камера, стовпчики, банер, рядок, кругові — 700 мс (--duration-intro)
  var TIMELINE = [
    { at: 1500, set: { camera: 'chart' } },                                 // 1.5 с на загальний план, потім до графіка
    { at: 2300, set: { cursor: 'total' } },                                 // курсор на Total (300 мс)
    { at: 2450, set: { tooltip: 'total-start' } },                          // тултіп, щойно курсор доїхав: 34h / 35h
    { at: 3900, set: { cursor: 'structured' } },                            // курсор на Structured
    { at: 4050, set: { tooltip: 'structured' } },                           // 18h 30m / 21h
    { at: 5500, set: { tooltip: 'none', cursor: 'off', camera: 'page' } },  // назад до всієї сторінки
    { at: 6500, set: { page: 'end', banner: 'off' } },                      // новий рядок, CPD Data 6, кругові; банер згортається
    { at: 7600, set: { chart: 'end' } },                                    // стовпчики ростуть, підписи темніють
    { at: 8500, set: { camera: 'chart' } },                                 // знову до графіка
    { at: 9300, set: { cursor: 'total-end' } },                             // курсор на Total
    { at: 9450, set: { tooltip: 'total-end' } },                            // 36h 30m / 35h — лишається
    { at: 10900, set: { camera: 'page' } }                                  // фініш: уся сторінка з тултіпом
  ];
  var END_AT = 11600; // остання камера (700 мс) доїхала
  var REWIND = 1300;  // перемотка END → START перед повтором (найдовший перехід — банер і рядок: 200 + 700)

  var playing = false;
  var holds = { user: false, view: false }; // причини паузи: кнопка і «поза екраном»
  var frozen = false;

  function apply(state) {
    Object.keys(state).forEach(function (key) {
      demo.setAttribute('data-' + key, state[key]);
    });
  }

  // Кнопка «натиснута» (показує ▶), коли демо не йде: пауза, кінець або ще не стартувало
  function updateToggle() {
    toggle.setAttribute('aria-pressed', String(!playing || holds.user));
  }

  // Пауза зупиняє і годинник, і переходи, що вже їдуть (вони — CSS transitions)
  function hold(reason, on) {
    holds[reason] = on;
    var held = holds.user || holds.view;
    if (held !== frozen) {
      frozen = held;
      demo.getAnimations({ subtree: true }).forEach(function (animation) {
        if (held) animation.pause();
        else animation.play();
      });
    }
    updateToggle();
  }

  function play() {
    // Із кінцевого стану — перемотка з переходами; зі START (перший прохід) — одразу таймлайн
    var rewind = demo.getAttribute('data-page') === 'end';
    var offset = rewind ? REWIND : 0;
    playing = true;
    holds.user = false;
    if (!rewind) {
      apply(START); // без переходів: data-playing ще немає
      demo.offsetWidth; // зафіксувати START, перш ніж увімкнути переходи
    }
    demo.setAttribute('data-playing', '');
    if (rewind) apply(START);
    updateToggle();

    // Годинник: рахує лише час програвання (на паузі стоїть); крок кадру ≤ 100 мс,
    // щоб після прихованої вкладки кроки не посипались усі разом
    var elapsed = 0;
    var last = null;
    var next = 0;
    function tick(now) {
      if (last !== null && !frozen) elapsed += Math.min(now - last, 100);
      last = now;
      while (next < TIMELINE.length && TIMELINE[next].at + offset <= elapsed) {
        apply(TIMELINE[next].set);
        next++;
      }
      if (elapsed < END_AT + offset) {
        requestAnimationFrame(tick);
      } else {
        demo.removeAttribute('data-playing');
        playing = false;
        updateToggle();
      }
    }
    requestAnimationFrame(tick);
  }

  toggle.hidden = false;
  updateToggle();
  toggle.addEventListener('click', function () {
    if (playing) hold('user', !holds.user);
    else play();
  });

  demo.setAttribute('data-ready', '');
  apply(START); // уже стоїть з інлайн-скрипту; тут — на випадок, якщо його прибрали
  var started = false;

  // Старт — коли блок ≥ 50 % у полі зору; поза ним прохід стоїть на паузі
  new IntersectionObserver(function (entries) {
    var visible = entries[0].isIntersecting;
    hold('view', !visible);
    if (visible && !started) {
      started = true;
      play();
    }
  }, { threshold: 0.5 }).observe(demo);

  // Повтор наведенням (як ротація ролі в hero): лише коли попередній прохід завершився.
  // Слухаємо сцену, а не рамку: курсор, що прийшов просто на кнопку в кутку, повтор не запускає
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    demo.querySelector('.cpd-demo__screen').addEventListener('pointerenter', function (event) {
      if (event.pointerType !== 'mouse' || playing || !started) return;
      play();
    });
  }
})();
