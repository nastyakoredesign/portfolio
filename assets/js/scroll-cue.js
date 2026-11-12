(function () {
  var cue = document.querySelector('.scroll-cue');
  if (!cue) return;

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  cue.addEventListener('pointerleave', function (event) {
    if (event.pointerType === 'mouse') cue.setAttribute('data-leaving', '');
  });

  cue.addEventListener('pointerenter', function () {
    cue.removeAttribute('data-leaving');
  });

  cue.addEventListener('animationend', function (event) {
    if (event.animationName === 'scroll-cue-out') cue.removeAttribute('data-leaving');
  });
})();
