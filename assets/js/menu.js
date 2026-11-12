// Мобільне меню (popover). Відкриття, закриття, Esc і повернення фокусу
// браузер робить сам — тут лише те, чого popover не вміє.
const menu = document.getElementById('site-menu');
const burger = document.querySelector('.site-header__burger');

if (menu && burger) {
  // Усе на сторінці, крім меню: хедер, main, футер…
  const background = [...document.body.children].filter((el) => el !== menu);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastPointer = '';

  // beforetoggle спрацьовує ДО відкриття/закриття — так бургер встигає «ожити»,
  // і браузер може повернути на нього фокус після закриття меню.
  menu.addEventListener('beforetoggle', (event) => {
    const isOpen = event.newState === 'open';

    // Скрінрідер чує, чи меню відкрите: aria-expanded на бургері
    burger.setAttribute('aria-expanded', String(isOpen));

    // Поки меню відкрите, сторінка під ним неактивна (inert): Tab ходить лише
    // по меню і не губиться на прихованих під ним посиланнях.
    background.forEach((el) => {
      el.inert = isOpen;
    });
  });

  // Яким пальцем/пристроєм натиснули востаннє (mouse, pen, touch)
  document.addEventListener('pointerdown', (event) => {
    lastPointer = event.pointerType;
  });

  // Відкрили тапом — фокус на саме меню, а не на кнопку «Закрити» (autofocus):
  // інакше Safari малює на ній рамку фокуса, хоча клавіатури немає.
  menu.tabIndex = -1;
  menu.addEventListener('toggle', (event) => {
    if (event.newState === 'open' && lastPointer === 'touch') menu.focus();
  });

  // Закрити з анімацією: коло стягується в кнопку (header.css, data-closing),
  // і лише потім меню ховається. Без руху — одразу.
  function closeMenu() {
    if (!menu.matches(':popover-open') || menu.hasAttribute('data-closing')) return;
    if (reduceMotion.matches) {
      menu.hidePopover();
      return;
    }
    menu.setAttribute('data-closing', '');
    const finish = () => {
      if (!menu.hasAttribute('data-closing')) return; // уже закрили
      menu.removeEventListener('animationend', onEnd);
      menu.hidePopover();
      // Спершу браузер має «побачити» меню схованим, поки діє transition: none,
      // інакше CSS-перехід закриття ще раз потримав би його на екрані
      getComputedStyle(menu).display;
      menu.removeAttribute('data-closing');
    };
    const onEnd = (event) => {
      if (event.target === menu) finish(); // анімації вкладених елементів не рахуються
    };
    menu.addEventListener('animationend', onEnd);
    // Запасний таймер: якщо animationend не прийде (вкладка у фоні), меню однаково закриється
    const duration = parseFloat(getComputedStyle(menu).animationDuration) * 1000 || 0;
    setTimeout(finish, duration + 100);
  }

  menu.addEventListener('click', (event) => {
    // Кнопка «Закрити»: скасовуємо миттєве закриття браузером і закриваємо з анімацією
    if (event.target.closest('[popovertargetaction="hide"]')) {
      event.preventDefault();
      closeMenu();
      return;
    }
    // Клік на пункт меню (Work, Contact…) — закрити меню, щоб було видно, куди перейшли
    if (event.target.closest('a')) closeMenu();
  });
}
