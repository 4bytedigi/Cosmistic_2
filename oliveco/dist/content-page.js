(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const select = $('#language-switch'),menu = $('#mobile-nav'),toggle = $('#menu-toggle');
  const search = $('#search-panel'),searchToggle = $('#search-toggle'),input = $('#header-search');
  const paths = {
    search:'<circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 4.5 4.5"/>',
    heart:'<path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.3a5.5 5.5 0 0 0 0-7.8Z"/>',
    bag:'<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    phone:'<path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2Z"/>'
  };
  document.querySelectorAll('[data-icon]').forEach(el => {
    if(el.dataset.icon==='viber')el.innerHTML='<img class="viber-icon" src="assets/viber-white-v2.svg?v=plain-white" alt="" width="24" height="24">';
    else if(paths[el.dataset.icon])el.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[el.dataset.icon]}</svg>`;
  });
  let lang = 'my';
  try { lang = localStorage.getItem('oliveco-language') === 'en' ? 'en' : 'my'; } catch {}
  const number = value => lang==='my'?String(value).replace(/[0-9]/g,d=>'၀၁၂၃၄၅၆၇၈၉'[Number(d)]):String(value);
  function stored(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
  function updateCounts(){
    const bag=stored('oliveco-bag-v1',{}),saved=stored('oliveco-saved-v1',[]);
    const count=bag&&typeof bag==='object'&&!Array.isArray(bag)?Object.values(bag).filter(n=>Number.isInteger(n)&&n>0&&n<=99).reduce((sum,n)=>sum+n,0):0;
    const savedCount=Array.isArray(saved)?new Set(saved.filter(id=>typeof id==='string')).size:0;
    $('#bag-count').textContent=number(count);
    $('#bag-toggle').setAttribute('aria-label',lang==='my'?`ရွေးချယ်ထားသော ပစ္စည်း ${number(count)} ခုကို ကြည့်ရန်`:`Open selection, ${count} items`);
    $('.saved-count').textContent=number(savedCount);$('.saved-count').hidden=savedCount===0;
  }
  function apply() {
    document.documentElement.lang = lang;
    document.title = lang === 'my' ? 'Oliveco | ကျွန်ုပ်တို့အကြောင်း' : 'Our Story | Oliveco';
    select.value = lang;
    document.querySelectorAll('[data-copy]').forEach(el => { el.textContent = el.dataset[lang] || el.dataset.en; });
    document.querySelectorAll('[data-contact-address]').forEach(el => { el.textContent = el.dataset[lang]; });
    const labels = lang === 'my' ? {phone:'ဖုန်းဆက်ရန်', viber:'Viber', address:'လိပ်စာ'} : {phone:'Call us', viber:'Viber', address:'Address'};
    document.querySelectorAll('[data-contact-heading]').forEach(el => { el.textContent = labels[el.dataset.contactHeading]; });
    toggle.setAttribute('aria-label', lang === 'my' ? 'လမ်းညွှန် ဖွင့်ရန်' : 'Open navigation');
    searchToggle.setAttribute('aria-label',lang==='my'?'ထုတ်ကုန် ရှာဖွေရန်':'Search products');
    $('#search-close').setAttribute('aria-label',lang==='my'?'ရှာဖွေမှု ပိတ်ရန်':'Close search');
    $('#saved-toggle').setAttribute('aria-label',lang==='my'?'သိမ်းထားသော ပစ္စည်းများကို ကြည့်ရန်':'View saved products');
    $('.bag-label').textContent=lang==='my'?'ရွေးချယ်မှု':'My selection';
    $('label[for="header-search"]').textContent=lang==='my'?'နေ့စဉ်လိုအပ်တဲ့ ပစ္စည်းကို ရှာလိုက်ပါ':'Find your everyday essentials';
    input.placeholder=lang==='my'?'ပစ္စည်းအမည်ဖြင့် ရှာပါ…':'Try facial foam, hair oil, or Vertex…';
    updateCounts();
  }
  function closeMenu() { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
  function closeSearch(){search.hidden=true;searchToggle.setAttribute('aria-expanded','false');}
  select.addEventListener('change', () => { lang = select.value; try { localStorage.setItem('oliveco-language', lang); } catch {} apply(); });
  toggle.addEventListener('click',()=>{const open=menu.hidden;closeSearch();menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));});
  searchToggle.addEventListener('click',()=>{const open=search.hidden;closeMenu();search.hidden=!open;searchToggle.setAttribute('aria-expanded',String(open));if(open)input.focus();});
  $('#search-close').addEventListener('click',()=>{closeSearch();searchToggle.focus();});
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click',e=>{if(!e.target.closest('.header')){closeMenu();closeSearch();}});
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    if(!search.hidden){closeSearch();searchToggle.focus();}
    else if(!menu.hidden){closeMenu();toggle.focus();}
  });
  window.addEventListener('storage',updateCounts);
  window.addEventListener('pageshow',updateCounts);
  apply();
})();
