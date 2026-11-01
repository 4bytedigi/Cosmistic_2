(() => {
  'use strict';
  const select = document.querySelector('#language-switch');
  const menu = document.querySelector('#mobile-nav');
  const toggle = document.querySelector('#menu-toggle');
  let lang = 'my';
  try { lang = localStorage.getItem('oliveco-language') === 'en' ? 'en' : 'my'; } catch {}
  function apply() {
    document.documentElement.lang = lang;
    document.title = lang === 'my' ? 'Oliveco | ကျွန်ုပ်တို့အကြောင်း' : 'Our Story | Oliveco';
    select.value = lang;
    document.querySelectorAll('[data-copy]').forEach(el => { el.textContent = el.dataset[lang] || el.dataset.en; });
    document.querySelectorAll('[data-contact-address]').forEach(el => { el.textContent = el.dataset[lang]; });
    const labels = lang === 'my' ? {phone:'ဖုန်းဆက်ရန်', viber:'Viber', address:'လိပ်စာ'} : {phone:'Call us', viber:'Viber', address:'Address'};
    document.querySelectorAll('[data-contact-heading]').forEach(el => { el.textContent = labels[el.dataset.contactHeading]; });
    toggle.setAttribute('aria-label', lang === 'my' ? 'လမ်းညွှန် ဖွင့်ရန်' : 'Open navigation');
  }
  function closeMenu() { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
  select.addEventListener('change', () => { lang = select.value; try { localStorage.setItem('oliveco-language', lang); } catch {} apply(); });
  toggle.addEventListener('click', () => { menu.hidden = !menu.hidden; toggle.setAttribute('aria-expanded', String(!menu.hidden)); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { closeMenu(); toggle.focus(); } });
  apply();
})();
