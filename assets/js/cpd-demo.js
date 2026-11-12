(function () {
  var demo = document.querySelector('.cpd-demo');
  if (!demo || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var toggle = demo.querySelector('.hero-flow__toggle');

  var START = { chart: 'start', page: 'start', banner: 'on', camera: 'page', tooltip: 'none', cursor: 'off' };

  var TIMELINE = [
    { at: 1500, set: { camera: 'chart' } },
    { at: 2300, set: { cursor: 'total' } },
    { at: 2450, set: { tooltip: 'total-start' } },
    { at: 3900, set: { cursor: 'structured' } },
    { at: 4050, set: { tooltip: 'structured' } },
    { at: 5500, set: { tooltip: 'none', cursor: 'off', camera: 'page' } },
    { at: 6500, set: { page: 'end', banner: 'off' } },
    { at: 7600, set: { chart: 'end' } },
    { at: 8500, set: { camera: 'chart' } },
    { at: 9300, set: { cursor: 'total-end' } },
    { at: 9450, set: { tooltip: 'total-end' } },
    { at: 10900, set: { camera: 'page' } }
  ];
  var END_AT = 11600;
  var REWIND = 1300;

  var playing = false;
  var holds = { user: false, view: false };
  var frozen = false;

  function apply(state) {
    Object.keys(state).forEach(function (key) {
      demo.setAttribute('data-' + key, state[key]);
    });
  }

  function updateToggle() {
    toggle.setAttribute('aria-pressed', String(!playing || holds.user));
  }

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
    var rewind = demo.getAttribute('data-page') === 'end';
    var offset = rewind ? REWIND : 0;
    playing = true;
    holds.user = false;
    if (!rewind) {
      apply(START);
      demo.offsetWidth;
    }
    demo.setAttribute('data-playing', '');
    if (rewind) apply(START);
    updateToggle();

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
  apply(START);
  var started = false;

  new IntersectionObserver(function (entries) {
    var visible = entries[0].isIntersecting;
    hold('view', !visible);
    if (visible && !started) {
      started = true;
      play();
    }
  }, { threshold: 0.5 }).observe(demo);

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    demo.querySelector('.cpd-demo__screen').addEventListener('pointerenter', function (event) {
      if (event.pointerType !== 'mouse' || playing || !started) return;
      play();
    });
  }
})();
