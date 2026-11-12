/* ==========================================================================
   scroll-region.js — ряд, що гортається, фокусується лише поки він справді гортається
   Каруселі кейсу (Solutions: ряд рішень і телефони) на Mobile скролляться
   стрілками з клавіатури — для цього ряду потрібен tabindex="0" (і role/aria-label,
   щоб скрінрідер назвав область). На Desktop ряд не скролиться, і tabindex там
   дав би зайву зупинку Tab. Розмітка тримає ці атрибути завжди (без JS Mobile
   працює), скрипт прибирає їх, коли scrollWidth не більший за clientWidth,
   і повертає назад, коли ряд знову гортається (resize, поворот екрана).
   HTML: <div data-scroll-region tabindex="0" role="region" aria-label="…">
   Якщо ряд — сам список (<ol>/<ul>: журні UX research, телефони MVP), role не ставимо:
   role="region" стер би семантику списку, а aria-label на списку вже називає область
   («Journey stages, list, 6 items»).
   ========================================================================== */
(function () {
  var ATTRS = ['tabindex', 'role', 'aria-label'];

  document.querySelectorAll('[data-scroll-region]').forEach(function (region) {
    var saved = {};
    ATTRS.forEach(function (name) {
      if (region.hasAttribute(name)) saved[name] = region.getAttribute(name);
    });

    function update() {
      var scrolls = region.scrollWidth > region.clientWidth + 1;
      ATTRS.forEach(function (name) {
        if (!(name in saved)) return;
        if (scrolls) region.setAttribute(name, saved[name]);
        else region.removeAttribute(name);
      });
    }

    if ('ResizeObserver' in window) new ResizeObserver(update).observe(region);
    else window.addEventListener('resize', update);
    update();
  });
})();
