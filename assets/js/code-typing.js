(function () {
  var media = document.querySelector('.code-card__media--code');
  var code = media && media.querySelector('code');
  if (!code || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.location.hash === '#code') return;

  var CHAR = 15;
  var LINE_END = 90;

  var pre = code.parentElement;
  var finalHTML = code.innerHTML;

  var lines = [[]];
  Array.prototype.forEach.call(code.childNodes, function (node) {
    var name = node.nodeType === 1 ? node.className : '';
    node.textContent.split('\n').forEach(function (text, index) {
      if (index > 0) lines.push([]);
      if (text) lines[lines.length - 1].push({ text: text, name: name });
    });
  });
  if (!lines[lines.length - 1].length) lines.pop();

  var caret = document.createElement('span');
  caret.className = 'code-snippet__caret';

  function placeCaret(lineIndex) {
    code.appendChild(caret);
    var style = getComputedStyle(media);
    var visible = media.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    var lineHeight = parseFloat(getComputedStyle(pre).lineHeight);
    var shift = Math.max(0, (lineIndex + 1) * lineHeight - visible);
    pre.style.transform = shift ? 'translateY(' + -shift + 'px)' : '';
    if (shift) media.setAttribute('data-scrolled', '');
  }

  function finish() {
    caret.setAttribute('data-blink', '');
    caret.addEventListener('animationend', function () {
      code.innerHTML = finalHTML;
      pre.style.transform = '';
      media.removeAttribute('data-typing');
    }, { once: true });
  }

  function schedule() {
    var steps = [];
    var time = 0;
    lines.forEach(function (line, lineIndex) {
      if (lineIndex > 0) {
        time += LINE_END;
        steps.push({ at: time, line: lineIndex, newline: true });
      }
      line.forEach(function (part, partIndex) {
        var indent = partIndex === 0 ? part.text.length - part.text.replace(/^ +/, '').length : 0;
        steps.push({ at: time, line: lineIndex, part: part, text: part.text.slice(0, indent) });
        for (var i = indent; i < part.text.length; i++) {
          time += CHAR;
          steps.push({ at: time, line: lineIndex, text: part.text.charAt(i) });
        }
      });
    });
    return steps;
  }

  function type() {
    var steps = schedule();
    var next = 0;
    var target = null;
    var start = performance.now();

    function apply(step) {
      if (step.newline) {
        code.appendChild(document.createTextNode('\n'));
      } else if (step.part) {
        target = document.createElement('span');
        if (step.part.name) target.className = step.part.name;
        target.textContent = step.text;
        code.appendChild(target);
      } else {
        target.textContent += step.text;
      }
    }

    function tick(now) {
      var line = -1;
      while (next < steps.length && steps[next].at <= now - start) {
        apply(steps[next]);
        line = steps[next].line;
        next += 1;
      }
      if (line >= 0) placeCaret(line);
      if (next < steps.length) window.requestAnimationFrame(tick);
      else finish();
    }

    window.requestAnimationFrame(tick);
  }

  function inView(entry) {
    return entry.intersectionRatio >= 0.5 ||
      (entry.rootBounds && entry.intersectionRect.height >= entry.rootBounds.height / 2);
  }

  var observer = new IntersectionObserver(function (entries) {
    var entry = entries[0];
    if (!observer.started) {
      observer.started = true;
      if (inView(entry)) return observer.disconnect();
      code.textContent = '';
      media.setAttribute('data-typing', '');
      placeCaret(0);
      return;
    }
    if (!inView(entry)) return;
    observer.disconnect();
    type();
  }, { threshold: [0, 0.25, 0.5] });

  observer.observe(media.closest('.code-card'));
})();
