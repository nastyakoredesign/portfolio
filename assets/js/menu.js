const menu = document.getElementById('site-menu');
const burger = document.querySelector('.site-header__burger');

if (menu && burger) {
  const background = [...document.body.children].filter((el) => el !== menu);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastPointer = '';

  menu.addEventListener('beforetoggle', (event) => {
    const isOpen = event.newState === 'open';

    burger.setAttribute('aria-expanded', String(isOpen));

    background.forEach((el) => {
      el.inert = isOpen;
    });
  });

  document.addEventListener('pointerdown', (event) => {
    lastPointer = event.pointerType;
  });

  menu.tabIndex = -1;
  menu.addEventListener('toggle', (event) => {
    if (event.newState === 'open' && lastPointer === 'touch') menu.focus();
  });

  function closeMenu() {
    if (!menu.matches(':popover-open') || menu.hasAttribute('data-closing')) return;
    if (reduceMotion.matches) {
      menu.hidePopover();
      return;
    }
    menu.setAttribute('data-closing', '');
    const finish = () => {
      if (!menu.hasAttribute('data-closing')) return;
      menu.removeEventListener('animationend', onEnd);
      menu.hidePopover();
      getComputedStyle(menu).display;
      menu.removeAttribute('data-closing');
    };
    const onEnd = (event) => {
      if (event.target === menu) finish();
    };
    menu.addEventListener('animationend', onEnd);
    const duration = parseFloat(getComputedStyle(menu).animationDuration) * 1000 || 0;
    setTimeout(finish, duration + 100);
  }

  menu.addEventListener('click', (event) => {
    if (event.target.closest('[popovertargetaction="hide"]')) {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.target.closest('a')) closeMenu();
  });
}
