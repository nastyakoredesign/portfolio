/* hero-flow.js — рушій демо-флоу в hero кейсу Centology.
   Лише ставить атрибути на шари й рухає курсор за hero-flow.config.js;
   текстів і селекторів під конкретний текст тут немає (тексти — у розмітці, цілі — data-target).
   ?step=09&brand=ebc — заморозка: рівно цей стан, без анімації й автопрогравання. */

(() => {
  const root = document.querySelector(".hero-flow");
  const config = window.HERO_FLOW;
  if (!root || !config) return;

  const stage = root.querySelector(".hero-flow__stage");
  const cursor = root.querySelector(".hf-cursor");
  const toggle = root.querySelector(".hero-flow__toggle");
  const layers = [...root.querySelectorAll("[data-layer]")];
  const motion = config.motion;

  // ---------- Стан кроку → атрибути шарів ----------

  // Прибрати слід дій попереднього кроку: набір, заповнені й натиснуті цілі
  function resetTargets() {
    for (const el of root.querySelectorAll("[data-target]")) {
      delete el.dataset.typing;
      delete el.dataset.filled;
      delete el.dataset.pressed;
      delete el.dataset.open;
      delete el.dataset.hover;
      delete el.dataset.picked;
      el.style.removeProperty("--hf-typed");
    }
    for (const chip of root.querySelectorAll("[data-chip]")) delete chip.dataset.picked;
  }

  // Атрибути, які поставила дія { set } посеред кроку: наступний стан їх прибирає
  let transient = [];

  // Стан шару: кінцевий, а з useStart — start поверх нього
  // (start може додати шар, якого в кінці немає, або сховати його: null)
  function layerState(step, name, useStart) {
    const start = useStart && step.start ? step.start[name] : undefined;
    if (start === null) return null;
    if (!step[name] && !start) return null;
    return { ...step[name], ...start };
  }

  function applyStep(id, { brand, useStart = false } = {}) {
    const step = config.steps[id];
    if (!step) return false;

    root.dataset.step = id;
    root.dataset.brand = brand || step.brand;
    resetTargets();
    for (const [layer, key] of transient) delete layer.dataset[key];
    transient = [];

    for (const layer of layers) {
      const name = layer.dataset.layer;
      const state = layerState(step, name, useStart);
      if (state) {
        for (const [key, value] of Object.entries(state)) {
          if (key !== "blur") layer.dataset[key] = value;
        }
        // Шар з'являється: його стан застосувати ще схованим (без анімацій), потім показати
        if (layer.dataset.visible !== "true") layer.offsetWidth;
      }
      layer.dataset.visible = state ? "true" : "false";
      layer.dataset.blur = state && state.blur ? "true" : "false";
    }
    return true;
  }

  // ---------- Годинник, що зупиняється на паузі ----------

  let paused = false;
  let resume = null;
  const resumed = () => new Promise((r) => (resume = r));

  // Чекати ms часу програвання: на паузі відлік стоїть
  async function sleep(ms) {
    let left = ms;
    while (left > 0) {
      if (paused) await resumed();
      const start = performance.now();
      await new Promise((r) => setTimeout(r, Math.min(left, 50)));
      left -= performance.now() - start;
    }
  }

  // ---------- Дії курсора ----------

  const scale = () => stage.getBoundingClientRect().width / 1440;
  const target = (name) => root.querySelector(`[data-target="${name}"]`);

  // Центр цілі в координатах сцени 1440 × 949 — за розкладкою (offset*), без transform:
  // камера й курсор цілять туди, де ціль буде, навіть якщо попап ще виїжджає
  function centerOf(el) {
    let x = el.offsetWidth / 2;
    let y = el.offsetHeight / 2;
    for (let node = el; node && node !== stage; node = node.offsetParent) {
      x += node.offsetLeft;
      y += node.offsetTop;
    }
    return { x, y };
  }

  function placeCursor(x, y, ms = 0) {
    cursor.style.setProperty("--hf-move", `${ms}ms`);
    cursor.style.setProperty("--hf-x", `${x}px`);
    cursor.style.setProperty("--hf-y", `${y}px`);
  }

  // ---------- Hover і форма курсора ----------

  // Над чим курсор: текстове поле — риска вводу, рядок таблиці — стрілка, усе інше клікабельне — рука
  function shapeOf(el) {
    if (el.matches(".hf-table__row")) return "arrow";
    return el.matches(".hf-field") && !el.querySelector(".hf-menu") ? "text" : "hand";
  }

  // Вістря стрілки (4 × 2.5 у курсорі 20 × 20) у координатах екрана
  function cursorTip() {
    const r = cursor.getBoundingClientRect();
    const k = r.width / 20;
    return { x: r.left + 4 * k, y: r.top + 2.5 * k };
  }

  function isOver(el, { x, y }) {
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  // Поки курсор їде, щокадру: hover і форма вмикаються, щойно вістря зайшло на ціль,
  // і вимикаються, щойно воно зійшло з попередньої
  let lastTarget = null;
  async function moveWithHover(el, ms) {
    const prev = lastTarget;
    lastTarget = el;
    let moving = true;
    const watch = () => {
      if (!moving) return; // рух скінчився — далі вирішує кінець moveWithHover
      const tip = cursorTip();
      const onEl = isOver(el, tip);
      const onPrev = prev && prev !== el && isOver(prev, tip);
      if (onEl) el.dataset.hover = "true";
      else delete el.dataset.hover;
      if (prev && prev !== el && !onPrev) delete prev.dataset.hover;
      cursor.dataset.shape = onEl ? shapeOf(el) : onPrev ? shapeOf(prev) : "arrow";
      setTimeout(watch, 16); // ~кадр; не rAF — щоб працювало й у фоновій вкладці
    };
    watch();
    await sleep(ms);
    moving = false;
    // Наприкінці руху курсор точно на цілі (кадр міг не встигнути)
    el.dataset.hover = "true";
    cursor.dataset.shape = shapeOf(el);
    if (prev && prev !== el) delete prev.dataset.hover;
  }

  // Набір: текст лишається в розмітці, JS лише відкриває його по символу (clip-path, --hf-typed)
  async function typeInto(field) {
    const value = field.querySelector(".hf-input__value");
    const text = value.firstChild;
    const range = document.createRange();
    field.dataset.typing = "true";
    for (let i = 1; i <= text.length; i++) {
      range.setStart(text, 0);
      range.setEnd(text, i);
      field.style.setProperty("--hf-typed", `${range.getBoundingClientRect().width / scale()}px`);
      await sleep(motion.typeChar);
    }
    delete field.dataset.typing;
    field.dataset.filled = "true";
    await sleep(motion.afterType);
  }

  // ---------- Камера ----------

  // Видима частина сцени: кадр 1200 : 640 показує 1440 × 768 з 1440 × 949
  const VIEW = { w: 1440, h: 768 };
  const STAGE_H = 949;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  // Камера наводиться на центр цілі з наближенням k; межі сцени не дають показати порожнечу
  function cameraTo(name, k, ms) {
    let x = 0;
    let y = 0;
    if (name !== 1) {
      const c = centerOf(target(name));
      const w = VIEW.w / k;
      const h = VIEW.h / k;
      x = clamp(c.x - w / 2, 0, VIEW.w - w);
      y = clamp(c.y - h / 2, 0, STAGE_H - h);
    } else {
      k = 1;
    }
    stage.style.setProperty("--hf-cam-ms", `${ms}ms`);
    stage.style.setProperty("--hf-cam-k", k);
    stage.style.setProperty("--hf-cam-x", `${-k * x}px`);
    stage.style.setProperty("--hf-cam-y", `${-k * y}px`);
  }

  async function run(action) {
    if (action.wait) return sleep(action.wait);
    if (action.zoom) {
      const ms = action.ms || motion.zoom;
      cameraTo(action.zoom, Math.min(action.k || 1, motion.zoomMax), ms);
      if (action.async) return; // камера їде разом із наступною дією (курсором), не чекаючи
      return sleep(ms);
    }
    if (action.move) {
      const ms = action.ms || motion.move;
      const el = target(action.move);
      const { x, y } = centerOf(el);
      placeCursor(x, y, ms);
      return moveWithHover(el, ms);
    }
    if (action.open) {
      target(action.open).dataset.open = "true";
      return sleep(motion.open);
    }
    if (action.pick) {
      // Вибір варіанта: коротке pressed, список закривається, у полі — значення з розмітки
      const option = target(action.pick);
      const field = option.closest("[data-target]:has(.hf-menu)");
      option.dataset.pressed = "true";
      await sleep(motion.click);
      delete option.dataset.pressed;
      delete option.dataset.hover;
      // Мультивибір: варіант стає тегом і зникає зі списку, список лишається відкритим
      if (field.classList.contains("hf-field--multi")) {
        option.dataset.picked = "true";
        root.querySelector(`[data-chip="${action.pick}"]`).dataset.picked = "true";
        return sleep(motion.afterType);
      }
      delete field.dataset.open;
      field.dataset.filled = "true";
      cursor.dataset.shape = "arrow"; // список закрився — під курсором уже не варіант
      return sleep(motion.afterType);
    }
    if (action.set) {
      // Змінити атрибути шару посеред кроку: { set: "drawer", rows: 2, total: 65 }
      const layer = root.querySelector(`[data-layer="${action.set}"]`);
      for (const [key, value] of Object.entries(action)) {
        if (key === "set" || key === "ms") continue;
        layer.dataset[key] = value;
        transient.push([layer, key]);
      }
      return sleep(action.ms || 0);
    }
    if (action.apply) {
      // Кінцевий стан кроку раніше за кінець дій (наприклад, шухляда закрилась після Save)
      applyStep(root.dataset.step);
      return sleep(action.apply === true ? 0 : action.apply);
    }
    if (action.close) {
      const field = target(action.close);
      delete field.dataset.open;
      field.dataset.filled = "true";
      return sleep(motion.afterType);
    }
    if (action.click) {
      const el = target(action.click);
      el.dataset.pressed = "true";
      await sleep(motion.click);
      delete el.dataset.pressed;
      return;
    }
    if (action.type) return typeInto(target(action.type));
  }

  // ---------- Морф бренду ----------

  // Новий бренд — копія шарів сцени з іншим data-brand поверх старої; коло відкриває її від варіанта
  // перемикача (origin). Після кола бренд переходить на корінь, копія зникає непомітно
  async function morph(id, brand, origin) {
    // Вміст шарів до морфу (кількість рядків тощо): знизу лишається він, новий — лише в колі.
    // Так цикл 13 → 01 не стрибає: 7 рядків DMA зникають під колом, а не перед ним
    const before = layers.map((layer) => ({ ...layer.dataset }));
    applyStep(id, { brand: root.dataset.brand, useStart: true });
    const copy = document.createElement("div");
    copy.className = "hf-morph";
    copy.dataset.brand = brand;
    copy.setAttribute("aria-hidden", "true");
    for (const layer of layers) copy.append(layer.cloneNode(true));
    // Знизу: старий бренд і старий вміст; блюр і перемикач зникають (visible / blur — з нового стану)
    layers.forEach((layer, i) => {
      for (const [key, value] of Object.entries(before[i])) {
        if (key !== "visible" && key !== "blur" && layer.dataset.visible === "true") layer.dataset[key] = value;
      }
    });
    await sleep(motion.fade); // спершу перемикач згасає й блюр зникає, лише тоді коло (Настя)
    for (const el of copy.querySelectorAll("[data-target], [data-layer]")) {
      el.removeAttribute("data-target");
      el.removeAttribute("data-layer");
    }
    const { x, y } = centerOf(origin);
    const r = Math.hypot(Math.max(x, 1440 - x), Math.max(y, STAGE_H - y)); // до найдальшого кута сцени
    copy.style.setProperty("--hf-morph-x", `${x}px`);
    copy.style.setProperty("--hf-morph-y", `${y}px`);
    copy.style.setProperty("--hf-morph-ms", `${motion.morph}ms`);
    stage.insertBefore(copy, cursor); // курсор лишається зверху
    copy.getBoundingClientRect(); // зафіксувати коло 0, щоб перехід стартував
    copy.style.setProperty("--hf-morph-r", `${r}px`);
    await sleep(motion.morph);
    applyStep(id, { useStart: true }); // знизу тепер те саме, що в колі
    root.dataset.brand = brand;
    await sleep(50); // дати кореню перемалюватись новим брендом, поки копія ще зверху
    copy.remove();
  }

  // Морф — лише коли бренд обрали в перемикачі попереднього кроку; інакше бренд міняється одразу
  function switchOrigin(prevId, brand) {
    const prev = prevId && config.steps[prevId];
    return prev && prev.switcher && prev.switcher.selected === brand && target(`brand-${brand}`);
  }

  // ---------- Таймлайн ----------

  async function play() {
    root.dataset.autoplay = "true";
    root.dataset.playing = "true";
    placeCursor(900, 520);
    let prevId = null;
    for (;;) {
      for (const id of config.sequence) {
        const step = config.steps[id];
        const started = performance.now();
        const origin = step.brand !== root.dataset.brand && switchOrigin(prevId, step.brand);
        if (origin) await morph(id, step.brand, origin);
        else applyStep(id, { useStart: true });
        prevId = id;
        for (const action of step.actions || []) await run(action);
        applyStep(id); // кінцевий стан кроку
        await sleep(step.hold - (performance.now() - started));
      }
    }
  }

  // ---------- Пауза: кнопка і поза екраном ----------

  // Причини паузи: "user" — кнопка, "view" — hero поза екраном (паузи на hover немає: Настя 19.10).
  // Демо йде, лише коли причин немає; кнопка показує тільки паузу користувача
  const holds = new Set();
  function hold(reason, on) {
    if (on) holds.add(reason);
    else holds.delete(reason);
    paused = holds.size > 0;
    toggle.setAttribute("aria-pressed", String(holds.has("user")));
    if (!paused && resume) resume();
  }

  let started = false;
  function start() {
    if (started) return;
    started = true;
    toggle.hidden = false;
    play();
  }

  function setUpControls() {
    toggle.addEventListener("click", () => hold("user", !holds.has("user")));
    // Стартує, коли hero у полі зору; поза ним — пауза
    new IntersectionObserver(([entry]) => {
      hold("view", !entry.isIntersecting);
      if (entry.isIntersecting && autoplay) start();
    }, { threshold: 0.3 }).observe(root);
  }

  // ---------- Старт ----------

  const params = new URLSearchParams(location.search);
  const frozen = params.get("step");
  if (frozen) {
    applyStep(frozen.padStart(2, "0"), { brand: params.get("brand") });
    return;
  }

  // Зменшений рух: без автопрогравання — постер (перший кадр) і кнопка «Play demo»
  const autoplay = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!autoplay) {
    applyStep(config.poster);
    const playButton = root.querySelector(".hero-flow__play");
    playButton.hidden = false;
    playButton.addEventListener("click", () => {
      playButton.hidden = true;
      start();
      toggle.focus(); // фокус не губиться: кнопка запуску зникла, далі — пауза
    });
  }
  setUpControls();
})();
