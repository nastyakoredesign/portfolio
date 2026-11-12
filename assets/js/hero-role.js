(function () {
  var role = document.querySelector('.hero__role[data-rotation="pending"]');
  if (!role) return;

  var text = role.firstElementChild;
  var roles = role.getAttribute('data-roles').split('|');
  var FONT_TIMEOUT = 1000;
  var STEP_AT = [1100, 2600];
  var FONT = '600 1em Commissioner';

  function html(name) {
    var words = name.split(' ');
    return words[0] + ' <em>' + words[1] + '</em>';
  }

  var hero = role.closest('.hero');

  function finish() {
    role.style.width = '';
    role.setAttribute('data-rotation', 'done');
    if (hero) hero.setAttribute('data-motion', 'settled');
  }

  function measure(name) {
    var probe = document.createElement('span');
    probe.className = 'hero__role-text hero__role-text--probe';
    probe.innerHTML = html(name);
    role.appendChild(probe);
    var width = probe.getBoundingClientRect().width;
    role.removeChild(probe);
    return width;
  }

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
    role.style.width = widths[index] + 'px';
    text.setAttribute('data-phase', 'out');

    once(text, 'opacity', function () {
      text.innerHTML = html(roles[index]);
      text.setAttribute('data-phase', 'pre-in');
      void text.offsetWidth;
      text.removeAttribute('data-phase');
      if (isLast) once(role, 'width', finish, 600);
    }, 400);
  }

  function play(isReplay) {
    widths = roles.map(measure);
    role.setAttribute('data-rotation', 'running');
    if (isReplay) {
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
