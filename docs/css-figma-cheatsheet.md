# Шпаргалка: CSS ↔ Figma

## Головна ідея

- **HTML** — це дерево шарів (панель **Layers**).
- **CSS** — це панель **Design**, винесена окремо від шарів.
- **`class="..."`** підключає шар до CSS-правила, як інстанс до головного компонента. Змінили правило, і змінилися всі шари з цим класом.

## Основна таблиця

| CSS | Figma |
|---|---|
| `div` / `section` | Frame |
| `class` + CSS-правило | Компонент / стиль |
| `padding` | Auto Layout padding |
| `gap` | Gap between items |
| `margin` | Відступ, який задає сам дочірній шар (у Figma окремо його немає) |
| `display: grid` / `flex` | Auto Layout (Grid / Horizontal / Vertical) |
| `max-width` | Max width |
| `border` | Stroke |
| `border-radius` | Corner radius |
| `overflow: hidden` | Clip content |
| `aspect-ratio: 4 / 3` | Lock aspect ratio |
| `place-items: center` | Вирівнювання по центру в Auto Layout |
| `var(--...)` | Variables |
| `@media (prefers-color-scheme: dark)` | Variable mode Dark |
| `:hover` + `transition` | Варіант Hover + Smart Animate |
| `:focus-visible` | Варіант Focus (фокус з клавіатури; мишею не вмикається) |
| `:active` | Варіант Pressed (поки кнопку натиснуто) |
| `@keyframes` + `animation` | Ключові кадри на таймлайні (як Smart Animate з кількома проміжними кадрами) |
| `clip-path: inset(...)` | Маска-прямокутник, яку «відсувають» (виділення вордмарка) |
| `@media (hover: hover)` | Hover показуємо лише там, де є курсор (на телефоні його немає) |
| `.a:has(> .b)` | «Якщо всередині є шар `.b`»: стиль залежить від того, чи є дочірній шар (як Show/hide layer property) |
| `transform: translateY(-4px)` | Зсув по Y без впливу на сусідів (як Ignore auto layout) |

## Як читати скорочення `padding` / `margin`

| Запис | Значення |
|---|---|
| `padding: 24px` | Усі чотири сторони 24 |
| `padding: 0 16px` | Верх/низ 0, ліво/право 16 |
| `padding: 96px 0 64px` | Верх 96, боки 0, низ 64 |
| `padding: 10px 20px 30px 40px` | Верх, право, низ, ліво (за годинниковою стрілкою) |

## Одиниці

| Одиниця | Що означає | У Figma |
|---|---|---|
| `px` | Пікселі | Звичайні значення |
| `rem` | Від базового розміру шрифту: `1rem` = 16px | — |
| `em` | Від розміру шрифту самого шару | Відсотки в Letter spacing (`-0.03em` = −3%) |
| `vw` | Відсоток ширини вікна (`7vw` = 7%) | Немає прямого відповідника |
| `line-height: 1.5` | Множник від розміру шрифту | Line height 150% |

Корисні перерахунки: `0.8125rem` = 13px, `0.875rem` = 14px, `1.25rem` = 20px, `2.5rem` = 40px, `4.5rem` = 72px.

## Текст

| CSS | Figma (панель Text) |
|---|---|
| `font-family` | Font |
| `font-size` | Size |
| `font-weight: 400 / 500 / 600 / 700` | Regular / Medium / Semi Bold / Bold |
| `letter-spacing` | Letter spacing |
| `line-height` | Line height |
| `text-transform: uppercase` | Case: UPPER CASE |
| `color` | Fill тексту (успадковується вкладеними шарами) |
| `clamp(min, бажане, max)` | Адаптивний розмір. У Figma для цього роблять окремі фрейми Mobile і Desktop |

## Корисні «скидання»

- `box-sizing: border-box`: padding і stroke всередині розміру, як у Figma.
- `margin: 0`: прибрати відступи, які браузер додає сам.
- `color: inherit; text-decoration: none;`: прибрати синій колір і підкреслення посилань.

## Теги ↔ шари

| Тег | Значення | У Figma |
|---|---|---|
| `<div>` | Контейнер без смислу | Frame |
| `<header>`, `<main>`, `<section>` | Контейнер зі смислом: шапка, основний вміст, розділ | Frame з назвою, яку розуміють скрінрідери й пошуковики |
| `<h1>`–`<h3>` | Заголовки 1–3 рівня | Text із заголовковим стилем |
| `<p>` | Абзац | Text |
| `<span>` | Шматок тексту | Text |
| `<a href="...">` | Посилання | Prototype → On click → Navigate to |

## Додано під час налаштування репо (06.10.2026)

| CSS | Figma | Де в нас |
|---|---|---|
| `@media (width < 768px) { :root { --x: … } }` | Перемкнути мод змінних Desktop → Mobile | `tokens.css`, внизу |
| `width: min(100% - 32px, 1200px)` | Fill container + Max width 1200 | `.container` у `base.css` |
| `<link rel="stylesheet" href="…">` | Підключити бібліотеку до файлу | `<head>` у `en/index.html` |
| `.case-card`, `.case-card__media`, `.case-card--featured` | Компонент / шар усередині компонента / варіант | правило назв класів (BEM) |
| `:focus-visible` | Варіант State=Focus (лише з клавіатури) | `base.css` |
| `@media (prefers-reduced-motion: reduce)` | Прототип без Smart Animate — переходи Instant | `base.css` |
| `.visually-hidden` | Шар, який не видно, але скрінрідер читає (як назва шару для доступності) | повний h1 у hero |
| `font-variation-settings: "FLAR" 50` | Variable font axes у панелі Text (Commissioner Flair) | заголовки в `base.css` |

## Додано під час верстки Work (07.10.2026)

| CSS | Figma | Де в нас |
|---|---|---|
| `grid-column: 1 / -1` | Шар у Grid Auto Layout, розтягнутий на всі колонки (span) | featured-картка, `case-card.css` |
| `overflow-x: auto` + `scroll-snap-type: x mandatory` + `scroll-snap-align: center` | Прототип: Overflow scrolling Horizontal, картка «прилипає» до центру після гортання | мобільна карусель, `work.css` |
| `.case-card__link::after { position: absolute; inset: 0 }` | Hotspot посилання розтягнуто на весь фрейм картки, хоча сам шар-посилання маленький | CTA «Open case →», `case-card.css` |
| `color-mix(in srgb, var(--color-accent) 10%, transparent)` | Колір змінної + Opacity 10 % на заливці чи stroke | колонки й скелет медіа, `media.css`, `media-nda.css` |
| `grid-template-columns: repeat(auto-fit, minmax(420px, 1fr))` | Auto Layout з Wrap + Min width у дочірніх: скільки влазить карток ≥ 420, стільки в ряду, решта переноситься | сітка Work на Desktop, `work.css` |

## Додано під час верстки hero, прохід 3 (14.10.2026)

| CSS / JS | Figma | Де в нас |
|---|---|---|
| Змінна, яку **задає батько**, а читає дитина: `--grid-line-color`, `--column-grid-top` | Властивість компонента (Variable mode / component property): один компонент «Layout grid», а колір лінії обирає місце, де його поставили | `column-grid.css`: Головна й кейс беруть той самий клас, колір різний |
| `getBoundingClientRect()` | Панель розмірів і позиції (X, Y, W, H) виділеного шару у правій панелі: JS читає справжні значення | `rulers.js`: цифри на лінійках — реальні межі рамки ролі |
| `ResizeObserver` | «Слідкувач за розміром»: коли шар змінив ширину (Hug content, інший шрифт, ресайз), підписані на нього значення оновлюються самі | `rulers.js`: діапазон на лінійках їде за рамкою без `resize`-слухачів |
| `repeating`-подібні `background-size` з `linear-gradient` | Fill «Pattern» / Tiled image: одна риска повторюється кожні 10 / 50 / 100 px | риски лінійок, `rulers.css` |
| `hidden` на елементі + `element.hidden = true` | Eye icon у шарах: шар є, але не показується | підписи лінійок, що ближче 45 px до меж |
| `data-phase="out"` / `data-rotation="running"` + CSS `[data-phase="out"] { … }` | Варіант компонента (Property = Value): JS лише переключає варіант, а вигляд і переходи між ними — у CSS, як Smart Animate | ротація ролі, `hero.css` + `hero-role.js` |
| `transitionend` | «On animation end» у прототипі: наступний крок стартує, коли попередній перехід завершився | `hero-role.js`: нове слово заходить, коли старе зникло |
| `Promise.race([шрифт, таймер 1 с])` | «Що закінчиться раніше»: або шрифт готовий, або минула секунда — далі діємо за тим, що було першим | таймаут шрифту в `hero-role.js` |
| `<pre>` | Текстовий шар з моноширинним шрифтом, пробіли й переноси зберігаються як у макеті | код у куті hero |
| `pointermove` + `requestAnimationFrame` | Подія «On drag / While hovering» з оновленням раз на кадр: курсор рухається частіше, ніж екран перемальовується, тож рахуємо лише один раз на кадр | `hero-cursor.js`, `hero-measure.js` |
| `matchMedia('(hover: hover) and (pointer: fine)')` | Перемикач «Prototype device: Desktop з мишею, а не Mobile»: чи є справжній курсор | перевірка перед курсорними ефектами |
| `Range.getBoundingClientRect()` | Розмір саме тексту (як Hug content у текстового шару), а не блоку, у якому він лежить (Fill container) | ширина lead у вимірюваннях |
| `position: fixed` + `transform: translate()` | Елемент прикріплений до екрана, а не до сторінки, як Fixed position у Auto Layout; зсув ставимо `transform`, щоб не перераховувати розкладку | тег «Guest» |
| `animation-timeline: view()` + `animation-range: exit 0% exit 50%` | Scroll-triggered «Smart Animate» у прототипі: прогрес анімації прив'язаний до того, наскільки блок виїхав з екрана, а не до часу | згасання фону hero при скролі |
| `@supports (animation-timeline: view()) { … }` | «Якщо ця функція Figma доступна — застосуй, інакше лишається статичний кадр» | згасання фону лише там, де підтримується |
| `animation-delay: calc(var(--column-index) * var(--duration-stagger))` | Smart Animate з Delay, що росте на кожну колонку: «хвиля» зліва направо | інтро колонок hero |
| `:where(…)` | Селектор без «ваги»: правило діє, але його легко перекрити будь-яким іншим (як стан з нижчим пріоритетом) | bob кола підказки, який hover перекриває |

