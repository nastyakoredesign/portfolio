/* hero-flow.config.js — 13 станів демо-флоу (+ проміжний крок 09s) як дані (Figma: обгортка 493:17152).
   Тут лише дані: бренд, які шари видно і в якому варіанті, скільки триває крок.
   Змінити таймінг чи стан = змінити цей файл; hero-flow.js не чіпати.

   Шари (data-layer у розмітці):
     grid      — таблиця портфелів; rows: 6 | 7 (з новим рядком)
     dim       — затемнення під попапом
     popup     — New Portfolio; panel: general | holdings; fill: 0 | 1 | 2; holdings: empty | saved
     dim2      — друге затемнення під шухлядою
     drawer    — Add Holding; fill: 0 | 1
     switcher  — «Switch label»; selected: centology | lca | ebc | dma
   blur: true — шар розмитий (пауза з перемикачем). Шар, якого немає в кроці, схований.

   Програвання:
     sequence — порядок кроків у циклі: 01–13 (з 09s після 09), після 13 знову 01.
     hold     — мінімальна тривалість кроку, мс (якщо дії довші — крок триває, скільки дії).
     start    — стан шарів на початку кроку, поки йдуть дії (наприклад, порожня форма перед набором);
                може додати шар, якого в кінці немає, або сховати його (null).
                без start крок одразу показує свій кінцевий стан. ?step=NN завжди показує кінцевий.
     actions  — дії курсора по черзі, ціль = data-target у розмітці:
                { move: "ціль", ms }  — курсор їде до центру цілі
                { click: "ціль" }     — коротке pressed на цілі
                { type: "ціль" }      — набір значення текстового поля, текст береться з розмітки
                { open: "ціль" }      — відкрити список дропдауну
                { pick: "ціль" }      — вибрати варіант списку (ціль "<поле>-<значення>", напр. "status-proposed");
                                        дропдауни не набираються: open → move до варіанта → pick.
                                        У мультивиборі (advisers) варіант стає тегом, список лишається відкритим
                { close: "ціль" }     — закрити список мультивибору
                { set: "шар", ключ: значення } — змінити атрибут шару посеред кроку
                                        (data-rows / data-total шухляди); наступний стан його прибирає
                { apply: true }       — показати кінцевий стан кроку ще до кінця дій
                                        (шухляда закрилась після Save, далі курсор іде до Save попапа)
                { wait: ms }          — пауза
                { zoom: "ціль", k }   — камера наближається до цілі (k ≤ motion.zoomMax)
                { zoom: 1 }           — камера віддаляється до загального плану
                async: true           — камера їде одночасно з наступною дією (стежить за курсором)
                Перед перемиканням бренду — завжди { zoom: 1 }: зміну бренду видно цілою.
     Морф бренду: якщо в попередньому кроці перемикач обрав бренд цього кроку, новий бренд
     відкривається колом від того варіанта (motion.morph мс), а вже потім ідуть actions. */

window.HERO_FLOW = {
  // «Зменшити рух»: замість автопрогравання — цей стан (перший кадр; бриф §6 радив 12, Настя 19.10 — 01)
  poster: "01",

  sequence: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "09s", "10", "11", "12", "13"],

  // Темп руху: курсор, клік, набір 28–40 мс на символ (бриф §5); цикл ≈ 40 с (скорочено 19.10)
  motion: { move: 550, click: 140, typeChar: 30, afterType: 180, zoom: 500, zoomMax: 1.8, open: 250, morph: 900, fade: 450 }, // fade = --hf-duration-switch у hero-flow-tokens.css

  steps: {
    "01": { brand: "centology", hold: 1800, frame: "495:21720",
      grid: { rows: 6 },
      actions: [{ zoom: 1 }, { wait: 300 }, { zoom: "add-portfolio", k: 1.4 }, { move: "add-portfolio" }, { click: "add-portfolio" },
        { zoom: 1 }] }, // спершу камера віддаляється, потім (крок 02) виїжджає попап
    "02": { brand: "centology", hold: 900, frame: "495:21898",
      grid: { rows: 6 }, dim: {}, popup: { panel: "general", fill: 0 } },
    "03": { brand: "centology", hold: 3200, frame: "497:22568",
      grid: { rows: 6 }, dim: {}, popup: { panel: "general", fill: 1 },
      start: { popup: { panel: "general", fill: 0 } },
      actions: [
        { zoom: "status", k: 1.5 },
        { move: "status", ms: 380 }, { click: "status" }, { open: "status" },
        { move: "status-proposed", ms: 300 }, { pick: "status-proposed" },
        { zoom: "name", k: 1.5, ms: 380, async: true }, { move: "name", ms: 380 }, { click: "name" }, { type: "name" },
        { zoom: "short-name", k: 1.5, ms: 380, async: true }, { move: "short-name", ms: 380 }, { click: "short-name" }, { type: "short-name" },
        { zoom: "type", k: 1.5, ms: 380, async: true }, { move: "type", ms: 380 }, { click: "type" }, { open: "type" },
        { move: "type-mps", ms: 300 }, { pick: "type-mps" },
        { wait: 200 }, { zoom: 1 }, { wait: 500 }, // загальний план встигає «осісти» до перемикача (Настя)
      ] },
    "04": { brand: "centology", hold: 1100, frame: "499:20855",
      grid: { rows: 6, blur: true }, dim: {}, popup: { panel: "general", fill: 1, blur: true },
      switcher: { selected: "lca" },
      start: { switcher: { selected: "centology" } },
      actions: [{ wait: 350 }, { move: "brand-lca", ms: 380 }, { wait: 100 }, { click: "brand-lca" }] },
    "05": { brand: "lca", hold: 2600, frame: "497:24680",
      grid: { rows: 6 }, dim: {}, popup: { panel: "general", fill: 2 },
      start: { popup: { panel: "general", fill: 1 } },
      actions: [
        { wait: 900 }, // роздивитись нові кольори LCA до зуму (Настя)
        { zoom: "advisers", k: 1.5, ms: 380, async: true }, { move: "advisers", ms: 380 }, { click: "advisers" }, { open: "advisers" },
        { move: "advisers-acme-advisers", ms: 300 }, { pick: "advisers-acme-advisers" },
        { move: "advisers-northwind-wealth", ms: 300 }, { pick: "advisers-northwind-wealth" },
        { close: "advisers" }, // Risk Profile вмикається лише тепер (правило продукту)
        { zoom: "risk", k: 1.5, ms: 380, async: true }, { move: "risk", ms: 380 }, { click: "risk" }, { open: "risk" },
        { move: "risk-balanced", ms: 300 }, { pick: "risk-balanced" },
        { wait: 200 }, { zoom: 1 }, { wait: 500 },
      ] },
    "06": { brand: "lca", hold: 1100, frame: "499:21247",
      grid: { rows: 6, blur: true }, dim: {}, popup: { panel: "general", fill: 2, blur: true },
      switcher: { selected: "ebc" },
      start: { switcher: { selected: "lca" } },
      actions: [{ wait: 350 }, { move: "brand-ebc", ms: 380 }, { wait: 100 }, { click: "brand-ebc" }] },
    "07": { brand: "ebc", hold: 1600, frame: "506:29281",
      grid: { rows: 6 }, dim: {}, popup: { panel: "holdings", holdings: "empty" },
      start: { popup: { panel: "general", fill: 2 } },
      actions: [
        { wait: 900 }, // роздивитись кольори EBC
        { move: "tab-holdings" }, { click: "tab-holdings" },
      ] },
    "08": { brand: "ebc", hold: 1000, frame: "507:28932",
      grid: { rows: 6 }, dim: {}, popup: { panel: "holdings", holdings: "empty" },
      dim2: {}, drawer: { fill: 0 },
      start: { dim2: null, drawer: null },
      actions: [{ wait: 250 }, { move: "add-holding" }, { click: "add-holding" }] },
    // Рядок 1 — курсором, рядки 2–4 з'являються по черзі, Total рахує (рішення Насті 19.10).
    "09": { brand: "ebc", hold: 4000, frame: "506:23725",
      grid: { rows: 6 }, dim: {}, popup: { panel: "holdings", holdings: "empty" },
      dim2: {}, drawer: { fill: 1 },
      start: { drawer: { fill: 0 } },
      actions: [
        { wait: 350 }, // шухляда доїжджає
        { zoom: "h-date", k: 1.5, ms: 380, async: true }, { move: "h-date", ms: 380 }, { click: "h-date" }, { type: "h-date" },
        { set: "drawer", rows: 1 },
        { zoom: "h-type", k: 1.5, ms: 380, async: true }, { move: "h-type", ms: 380 }, { click: "h-type" }, { open: "h-type" },
        { move: "h-type-debt-instruments", ms: 300 }, { pick: "h-type-debt-instruments" },
        { zoom: "h-security", k: 1.5, ms: 380, async: true }, { move: "h-security", ms: 380 }, { click: "h-security" }, { open: "h-security" },
        { move: "h-security-northwind-uk-gilt-inflation-linked-2031", ms: 300 }, { pick: "h-security-northwind-uk-gilt-inflation-linked-2031" },
        { zoom: "h-percent", k: 1.5, ms: 380, async: true }, { move: "h-percent", ms: 380 }, { click: "h-percent" }, { type: "h-percent" },
        { set: "drawer", total: 40, ms: 300 },
        { zoom: 1 }, // спершу загальний план, потім автозаповнені рядки (Настя)
        { set: "drawer", rows: 2, total: 65, ms: 300 },
        { set: "drawer", rows: 3, total: 85, ms: 300 },
        { set: "drawer", rows: 4, total: 100, ms: 700 },
      ] },
    // Холдинг зберігається ще в EBC, бренд змінюється вже після (Настя 19.10; у Figma на кадрі 10
    // шухляда ще відкрита). Кадру 09s у Figma немає: це кадр 11 у кольорах EBC
    "09s": { brand: "ebc", hold: 1500, frame: "506:28284",
      grid: { rows: 6 }, dim: {}, popup: { panel: "holdings", holdings: "saved" },
      start: { popup: { panel: "holdings", holdings: "empty" }, dim2: {}, drawer: { fill: 1 } },
      actions: [
        { move: "drawer-save", ms: 500 }, { click: "drawer-save" },
        { apply: 1100 }, // шухляда закрилась: діаграма й таблиця збереженого холдингу
      ] },
    "10": { brand: "ebc", hold: 1100, frame: "506:25949",
      grid: { rows: 6, blur: true }, dim: {}, popup: { panel: "holdings", holdings: "saved", blur: true },
      switcher: { selected: "dma" },
      start: { switcher: { selected: "ebc" } },
      actions: [{ wait: 350 }, { move: "brand-dma", ms: 380 }, { wait: 100 }, { click: "brand-dma" }] },
    "11": { brand: "dma", hold: 1600, frame: "506:28284",
      grid: { rows: 6 }, dim: {}, popup: { panel: "holdings", holdings: "saved" },
      actions: [
        { wait: 900 }, // роздивитись кольори DMA
        { move: "popup-save", ms: 550 }, { click: "popup-save" },
      ] },
    // Попап виїжджає, лише потім зверху з'являється новий рядок; курсор зупиняється на ньому (hover рядка)
    "12": { brand: "dma", hold: 2000, frame: "506:30283",
      grid: { rows: 7 },
      start: { grid: { rows: 6 } },
      actions: [{ wait: 400 }, { apply: 300 }, { move: "new-row", ms: 500 }, { wait: 800 }] },
    // Назад до Centology: морф відкриває крок 01 (6 рядків, як на початку) — цикл без шва
    "13": { brand: "dma", hold: 1100, frame: "508:27872",
      grid: { rows: 7, blur: true }, dim: {}, switcher: { selected: "centology" },
      start: { switcher: { selected: "dma" } },
      actions: [{ wait: 350 }, { move: "brand-centology", ms: 380 }, { wait: 100 }, { click: "brand-centology" }] },
  },
};
