
(() => {
  const root = document.querySelector(".hero-flow");
  const config = window.HERO_FLOW;
  if (!root || !config) return;

  const stage = root.querySelector(".hero-flow__stage");
  const cursor = root.querySelector(".hf-cursor");
  const toggle = root.querySelector(".hero-flow__toggle");
  const layers = [...root.querySelectorAll("[data-layer]")];
  const motion = config.motion;


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

  let transient = [];

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
        if (layer.dataset.visible !== "true") layer.offsetWidth;
      }
      layer.dataset.visible = state ? "true" : "false";
      layer.dataset.blur = state && state.blur ? "true" : "false";
    }
    return true;
  }


  let paused = false;
  let resume = null;
  const resumed = () => new Promise((r) => (resume = r));

  async function sleep(ms) {
    let left = ms;
    while (left > 0) {
      if (paused) await resumed();
      const start = performance.now();
      await new Promise((r) => setTimeout(r, Math.min(left, 50)));
      left -= performance.now() - start;
    }
  }


  const scale = () => stage.getBoundingClientRect().width / 1440;
  const target = (name) => root.querySelector(`[data-target="${name}"]`);

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


  function shapeOf(el) {
    if (el.matches(".hf-table__row")) return "arrow";
    return el.matches(".hf-field") && !el.querySelector(".hf-menu") ? "text" : "hand";
  }

  function cursorTip() {
    const r = cursor.getBoundingClientRect();
    const k = r.width / 20;
    return { x: r.left + 4 * k, y: r.top + 2.5 * k };
  }

  function isOver(el, { x, y }) {
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  let lastTarget = null;
  async function moveWithHover(el, ms) {
    const prev = lastTarget;
    lastTarget = el;
    let moving = true;
    const watch = () => {
      if (!moving) return;
      const tip = cursorTip();
      const onEl = isOver(el, tip);
      const onPrev = prev && prev !== el && isOver(prev, tip);
      if (onEl) el.dataset.hover = "true";
      else delete el.dataset.hover;
      if (prev && prev !== el && !onPrev) delete prev.dataset.hover;
      cursor.dataset.shape = onEl ? shapeOf(el) : onPrev ? shapeOf(prev) : "arrow";
      setTimeout(watch, 16);
    };
    watch();
    await sleep(ms);
    moving = false;
    el.dataset.hover = "true";
    cursor.dataset.shape = shapeOf(el);
    if (prev && prev !== el) delete prev.dataset.hover;
  }

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


  const VIEW = { w: 1440, h: 768 };
  const STAGE_H = 949;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

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
      if (action.async) return;
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
      const option = target(action.pick);
      const field = option.closest("[data-target]:has(.hf-menu)");
      option.dataset.pressed = "true";
      await sleep(motion.click);
      delete option.dataset.pressed;
      delete option.dataset.hover;
      if (field.classList.contains("hf-field--multi")) {
        option.dataset.picked = "true";
        root.querySelector(`[data-chip="${action.pick}"]`).dataset.picked = "true";
        return sleep(motion.afterType);
      }
      delete field.dataset.open;
      field.dataset.filled = "true";
      cursor.dataset.shape = "arrow";
      return sleep(motion.afterType);
    }
    if (action.set) {
      const layer = root.querySelector(`[data-layer="${action.set}"]`);
      for (const [key, value] of Object.entries(action)) {
        if (key === "set" || key === "ms") continue;
        layer.dataset[key] = value;
        transient.push([layer, key]);
      }
      return sleep(action.ms || 0);
    }
    if (action.apply) {
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


  async function morph(id, brand, origin) {
    const before = layers.map((layer) => ({ ...layer.dataset }));
    applyStep(id, { brand: root.dataset.brand, useStart: true });
    const copy = document.createElement("div");
    copy.className = "hf-morph";
    copy.dataset.brand = brand;
    copy.setAttribute("aria-hidden", "true");
    for (const layer of layers) copy.append(layer.cloneNode(true));
    layers.forEach((layer, i) => {
      for (const [key, value] of Object.entries(before[i])) {
        if (key !== "visible" && key !== "blur" && layer.dataset.visible === "true") layer.dataset[key] = value;
      }
    });
    await sleep(motion.fade);
    for (const el of copy.querySelectorAll("[data-target], [data-layer]")) {
      el.removeAttribute("data-target");
      el.removeAttribute("data-layer");
    }
    const { x, y } = centerOf(origin);
    const r = Math.hypot(Math.max(x, 1440 - x), Math.max(y, STAGE_H - y));
    copy.style.setProperty("--hf-morph-x", `${x}px`);
    copy.style.setProperty("--hf-morph-y", `${y}px`);
    copy.style.setProperty("--hf-morph-ms", `${motion.morph}ms`);
    stage.insertBefore(copy, cursor);
    copy.getBoundingClientRect();
    copy.style.setProperty("--hf-morph-r", `${r}px`);
    await sleep(motion.morph);
    applyStep(id, { useStart: true });
    root.dataset.brand = brand;
    await sleep(50);
    copy.remove();
  }

  function switchOrigin(prevId, brand) {
    const prev = prevId && config.steps[prevId];
    return prev && prev.switcher && prev.switcher.selected === brand && target(`brand-${brand}`);
  }


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
        applyStep(id);
        await sleep(step.hold - (performance.now() - started));
      }
    }
  }


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
    new IntersectionObserver(([entry]) => {
      hold("view", !entry.isIntersecting);
      if (entry.isIntersecting && autoplay) start();
    }, { threshold: 0.3 }).observe(root);
  }


  const params = new URLSearchParams(location.search);
  const frozen = params.get("step");
  if (frozen) {
    applyStep(frozen.padStart(2, "0"), { brand: params.get("brand") });
    return;
  }

  const autoplay = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!autoplay) {
    applyStep(config.poster);
    const playButton = root.querySelector(".hero-flow__play");
    playButton.hidden = false;
    playButton.addEventListener("click", () => {
      playButton.hidden = true;
      start();
      toggle.focus();
    });
  }
  setUpControls();
})();
