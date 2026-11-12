/* ==========================================================================
   code-typing.js — код у картці «This site» набирається, як у редакторі
   Spec: docs/specs/code-typing-spec.md. Figma: розкадровка 248:1664,
   фінальний кадр 68:727 (Desktop) / 68:744 (Mobile).
   - Один раз, коли картка ≥ 50 % у полі зору. Уже видна при завантаженні —
     лишаємо фінальний кадр (інакше код блимнув би «повний → порожній»).
   - ~15 мс на символ, +90 мс у кінці рядка; відступ з'являється одразу.
   - Курсор нижче видимої області — код піднімається (автоскрол).
   - У кінці курсор блимає 3 рази й зникає; вікно знову вирівняне донизу.
   Текст береться з HTML (<pre> з повним кодом) — без JS і з reduced-motion
   лишається фінальний кадр.
   ========================================================================== */
(function () {
  var media = document.querySelector('.code-card__media--code');
  var code = media && media.querySelector('code');
  if (!code || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Перехід за посиланням на #code: сторінка ще доїжджає (плавний скрол), а людина
  // прийшла саме подивитись на картку — одразу фінальний кадр
  if (window.location.hash === '#code') return;

  var CHAR = 15;       // мс на символ
  var LINE_END = 90;   // мс паузи в кінці рядка

  var pre = code.parentElement;
  var finalHTML = code.innerHTML;

  // Розбираємо код на рядки, рядок — на шматки: { text, name } (name — підсвічена назва)
  var lines = [[]];
  Array.prototype.forEach.call(code.childNodes, function (node) {
    var name = node.nodeType === 1 ? node.className : '';
    node.textContent.split('\n').forEach(function (text, index) {
      if (index > 0) lines.push([]);
      if (text) lines[lines.length - 1].push({ text: text, name: name });
    });
  });
  if (!lines[lines.length - 1].length) lines.pop(); // перенос після останньої «}»

  var caret = document.createElement('span');
  caret.className = 'code-snippet__caret';

  // Курсор у кінці коду; якщо він нижче вікна — піднімаємо код
  function placeCaret(lineIndex) {
    code.appendChild(caret);
    var style = getComputedStyle(media);
    var visible = media.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    var lineHeight = parseFloat(getComputedStyle(pre).lineHeight);
    var shift = Math.max(0, (lineIndex + 1) * lineHeight - visible);
    pre.style.transform = shift ? 'translateY(' + -shift + 'px)' : '';
    if (shift) media.setAttribute('data-scrolled', ''); // зверху є схований код — Top fade
  }

  function finish() {
    caret.setAttribute('data-blink', '');
    caret.addEventListener('animationend', function () {
      // Фінальний кадр з HTML: вікно вирівняне донизу, як без JS (той самий вигляд)
      code.innerHTML = finalHTML;
      pre.style.transform = '';
      media.removeAttribute('data-typing');
    }, { once: true });
  }

  // Розклад набору: кожен крок знає свій час від старту (мс).
  // Час рахуємо від годинника, а не ланцюжком setTimeout: таймери запізнюються,
  // і замість ~4.5 с набір розтягувався б за межу 5 с
  function schedule() {
    var steps = [];
    var time = 0;
    lines.forEach(function (line, lineIndex) {
      if (lineIndex > 0) {
        time += LINE_END; // пауза в кінці попереднього рядка
        steps.push({ at: time, line: lineIndex, newline: true });
      }
      line.forEach(function (part, partIndex) {
        // Відступ на початку рядка — одразу, як автовідступ у редакторі
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
    var target = null; // шматок, у який зараз дописуємо
    var start = performance.now();

    function apply(step) {
      if (step.newline) {
        code.appendChild(document.createTextNode('\n'));
      } else if (step.part) {
        target = document.createElement('span');
        if (step.part.name) target.className = step.part.name; // колір назви — з першого символу
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

  // Картка в полі зору хоча б наполовину. Якщо екран нижчий за пів картки
  // (телефон у ландшафті), достатньо, що вона займає пів екрана
  function inView(entry) {
    return entry.intersectionRatio >= 0.5 ||
      (entry.rootBounds && entry.intersectionRect.height >= entry.rootBounds.height / 2);
  }

  var observer = new IntersectionObserver(function (entries) {
    var entry = entries[0];
    if (!observer.started) {
      observer.started = true;
      // Перша перевірка одразу після завантаження: картка вже видна — фінал без руху
      if (inView(entry)) return observer.disconnect();
      // State 0: вікно порожнє, курсор у рядку 1
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
