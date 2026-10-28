(() => {
  'use strict';
  const products = window.OLIVECO_PRODUCTS;
  const I = window.OlivecoI18n;
  const t = (key, values) => I.t(key, values);
  const productName = p => I.name(p);
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const iconPaths = {
    phone:'<path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2Z"/>',
    email:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    'arrow-right':'<path d="M4 12h15m-6-6 6 6-6 6"/>',
    'arrow-up-right':'<path d="M6 18 18 6M6 6h12v12"/>',
    'chevron-down':'<path d="m6 9 6 6 6-6"/>',
    search:'<circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 4.5 4.5"/>',
    heart:'<path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.3a5.5 5.5 0 0 0 0-7.8Z"/>',
    bag:'<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
    leaf:'<path d="M20 3C7 2 2 8 5 16c7 7 15 1 15-13Z"/><path d="M3 21 16 8M9 15v-4m0 4h5"/>',
    flower:'<path d="M12 8c-6-8-10 0-5 3-9 3-2 11 2 6 2 9 11 4 7-2 8-1 5-10-1-8-1-7-9-5-7 1"/><circle cx="12" cy="12" r="2"/>',
    home:'<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/>',
    message:'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H6l-4 2 2-6v-4.5A8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5Z"/><path d="M8 11h9M8 15h6"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    minus:'<path d="M5 12h14"/>',
    sliders:'<path d="M3 7h6m4 0h8M3 17h10m4 0h4M9 4v6m4 4v6"/>',
    file:'<path d="M13 2H5v20h14V8l-6-6Zm0 0v6h6M8 13h8M8 17h5"/>',
    facebook:'<path d="M14 22v-9h3l.5-4H14V7c0-1.2.3-2 2-2h2V1.4C17 1.2 16 1 15 1c-3.3 0-5 2-5 5.5V9H7v4h3v9"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    check:'<path d="m5 12 4 4L19 6"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.leaf}</svg>`;
  function hydrateIcons(root = document) { $$('[data-icon]', root).forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let categoryNames = I.categories();
  function readState(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
  let bag = readState('oliveco-bag-v1', {});
  if (!bag || typeof bag !== 'object' || Array.isArray(bag)) bag = {};
  bag = Object.fromEntries(Object.entries(bag).filter(([id, n]) => products.some(p => p.id === id) && Number.isInteger(n) && n > 0 && n <= 99));
  const rawSaved = readState('oliveco-saved-v1', []);
  let saved = new Set(Array.isArray(rawSaved) ? rawSaved.filter(id => products.some(p => p.id === id)) : []);
  const isShopPage = document.body.dataset.page === 'shop';
  const defaultLimit = isShopPage ? products.length : 8;
  const params = new URLSearchParams(isShopPage ? location.search : '');
  const state = {
    category:Object.hasOwn(categoryNames,params.get('category'))?params.get('category'):'all',
    query:(params.get('q')||'').slice(0,120),
    sort:['az','za'].includes(params.get('sort'))?params.get('sort'):'featured',
    limit:defaultLimit,
    savedOnly:params.get('saved')==='1'
  };
  function shopUrl(filters=state) {
    const query = new URLSearchParams();
    if (filters.category && filters.category !== 'all') query.set('category',filters.category);
    if (filters.query) query.set('q',filters.query);
    if (filters.sort && filters.sort !== 'featured') query.set('sort',filters.sort);
    if (filters.savedOnly) query.set('saved','1');
    return '/shop' + (query.size ? '?' + query : '');
  }
  function syncSearchInputs() { $$('#header-search, #shop-search').forEach(input => { input.value = state.query; }); }
  const grid = $('#product-grid');
  const detailDialog = $('#detail-dialog');
  const bagDialog = $('#bag-dialog');
  let toastTimer;
  let activeDetailId = null;
  function persist() { try { localStorage.setItem('oliveco-bag-v1', JSON.stringify(bag)); localStorage.setItem('oliveco-saved-v1', JSON.stringify([...saved])); } catch {} }
  function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 3000); }
  function updateCounts() {
    const count = Object.values(bag).reduce((a,b) => a+b,0);
    $('#bag-count').textContent = I.num(count);
    $('#bag-toggle').setAttribute('aria-label', t('openBag', {n:I.num(count)}));
    $('.saved-count').textContent = saved.size;
    $('.saved-count').hidden = saved.size === 0;
    $('#saved-toggle').setAttribute('aria-pressed', String(state.savedOnly));
    $('#selection-summary').hidden=count===0;
    $('#selection-summary>span').textContent=I.lang==='my'?`ပစ္စည်း ${I.num(count)} ခု ရွေးထားသည်`:`${count} ${count===1?'item':'items'} selected`;
    $('#selection-summary-open').innerHTML=(I.lang==='my'?'စာရင်းကြည့်ရန်':'View selection')+` ${icon('arrow-right')}`;
    document.body.classList.toggle('has-selection',count>0);
  }
  function addToBag(id) {
    const p = products.find(p => p.id === id);
    if (!p) return;
    if ((bag[id] || 0) >= 99) { toast(t('maxQty')); return; }
    bag[id] = (bag[id] || 0) + 1;
    persist(); updateCounts();
    if (bagDialog.open) renderBag();
    if (detailDialog.open) { const button = $('[data-add]', detailDialog); if (button) { button.innerHTML = `${t('addedButton')} ${icon('check')}`; setTimeout(() => { if (button.isConnected) button.innerHTML = `${t('addButton')} ${icon('plus')}`; },1800); } }
    toast(t('selected', {name:productName(p)}));
  }
  function saveProduct(id) {
    if (saved.has(id)) { saved.delete(id); toast(t('unsaved')); } else { saved.add(id); toast(t('saved')); }
    persist(); updateCounts();
    if (state.savedOnly) renderProducts(); else $$('.save-product').filter(el => el.dataset.save === id).forEach(el => {
      el.setAttribute('aria-pressed', String(saved.has(id)));
      el.setAttribute('aria-label', t(saved.has(id) ? 'unsave' : 'save', {name:productName(products.find(p=>p.id===id))}));
    });
  }
  function renderCategories() {
    if (!$('#category-grid')) return;
    const cats = [{key:'skin',image:'cosmetics-8',second:'cosmetics-13'},{key:'hair',image:'cosmetics-11',second:'cosmetics-9'},{key:'personal',image:'cosmetics-2'},{key:'home',image:'consumer-2',second:'consumer-4'},{key:'medical',image:'medical-2',second:'medical-4'}];
    $('#category-grid').innerHTML = cats.map(c => `<button class="category-card" data-category="${c.key}" aria-label="${esc(t('browse',{name:categoryNames[c.key]}))}"><span class="category-image"><img src="assets/${c.image}.webp" alt="" loading="lazy">${c.second ? `<img class="secondary-category-img" src="assets/${c.second}.webp" alt="" loading="lazy">` : ''}</span><span class="category-text">${categoryNames[c.key]}${icon('arrow-up-right')}</span></button>`).join('');
  }
  function priceMarkup(p) {
    const pricing=window.OLIVECO_PRICING||{};
    const amount=pricing.amounts?.[p.id];
    const pending=typeof amount!=='number'||!Number.isFinite(amount)||amount<0;
    const currency=/^[A-Z]{3}$/.test(pricing.currency||'')?pricing.currency:'MMK';
    const value=pending?'—':I.num(amount);
    const label=I.lang==='my'&&currency==='MMK'?`${value} ကျပ်`:`${currency} ${value}`;
    return `<span class="product-price${pending?' price-pending':''}"${pending?` aria-label="${esc(t('pricePending'))}"`:''}>${esc(label)}</span>`;
  }
  function productCard(p) {
    const name=productName(p);
    return `<article class="product-card"><div class="product-visual"><button class="product-image-button" data-detail="${p.id}" aria-label="${esc(t('view',{name}))}"><img src="assets/${p.image}.webp" alt="${esc(name)}" loading="lazy" width="260" height="280"></button><button class="icon-button save-product" data-save="${p.id}" aria-pressed="${saved.has(p.id)}" aria-label="${esc(t(saved.has(p.id)?'unsave':'save',{name}))}">${icon('heart')}</button><button class="quick-add" data-add="${p.id}" aria-label="${esc(t('add',{name}))}">${icon('plus')}</button></div><div class="product-meta"><span>${esc(p.brand)}</span><span>${esc(I.size(p))}</span></div><h3 class="product-name"><button data-detail="${p.id}">${esc(name)}</button></h3>${priceMarkup(p)}</article>`;
  }
  function renderProducts() {
    const q = state.query.trim().toLocaleLowerCase();
    let filtered = products.filter(p => (state.category === 'all' || p.category === state.category) && (!state.savedOnly || saved.has(p.id)) && (!q || `${p.name} ${I.name(p)} ${I.names[p.id]} ${p.brand} ${p.size} ${categoryNames[p.category]}`.toLocaleLowerCase().includes(q)));
    if (state.sort !== 'featured') filtered.sort((a,b) => state.sort === 'az' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    const shown = filtered.slice(0, state.limit);
    if (filtered.length) grid.innerHTML = shown.map(productCard).join('');
    else grid.innerHTML = `<div class="empty-state"><span>${icon(state.savedOnly ? 'heart' : 'search')}</span><h3>${t(state.savedOnly?'emptySaved':'emptySearch')}</h3><p>${t(state.savedOnly?'emptySavedBody':'emptySearchBody')}</p><button class="button button-primary" data-reset>${t('explore')} ${icon('arrow-right')}</button></div>`;
    $('#collection-count').textContent = filtered.length===1?t('oneProduct'):t('products',{n:I.num(filtered.length)});
    $('#product-progress').textContent = filtered.length?t('progress',{shown:I.num(shown.length),total:I.num(filtered.length)}):'';
    const viewAll = $('#load-more');
    if (viewAll) { viewAll.href = shopUrl(); $('.load-more-row').hidden = !filtered.length; }
    $$('.filter-tab').forEach(b => { const active = b.dataset.filter === state.category; b.classList.toggle('selected', active); b.setAttribute('aria-pressed', String(active)); });
    $('#collection-heading').textContent = state.savedOnly?t('savedHeading'):state.category==='all'?t(isShopPage?'shopHeading':'allHeading'):t('categoryHeading',{name:categoryNames[state.category]});
    $('#active-query').hidden = !state.query && !state.savedOnly;
    $('#active-query>span').textContent = [state.savedOnly?t('savedProducts'):'',state.query?t('searchResults',{query:state.query}):''].filter(Boolean).join(' · ');
    if (isShopPage) history.replaceState(null,'',shopUrl()+location.hash);
    updateCounts();
  }
  function scrollToCollection() { $('#collection').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'}); }
  function chooseCategory(key) {
    if (!Object.hasOwn(categoryNames,key)) return;
    if (!isShopPage) { location.assign(shopUrl({category:key})); return; }
    Object.assign(state,{category:key,limit:defaultLimit,savedOnly:false,query:''}); syncSearchInputs(); renderProducts(); scrollToCollection();
  }
  function resetFilters() { Object.assign(state,{category:'all',query:'',savedOnly:false,limit:defaultLimit}); syncSearchInputs(); renderProducts(); }
  function showSaved(force=false) {
    if (!isShopPage) { location.assign('/shop?saved=1'); return; }
    Object.assign(state,{savedOnly:force||!state.savedOnly,category:'all',query:'',limit:defaultLimit}); syncSearchInputs(); renderProducts(); scrollToCollection();
  }
  function openDetails(id) {
    const p = products.find(p => p.id === id); if (!p) return;
    activeDetailId=id;
    $('#detail-content').innerHTML = `<div class="detail-layout"><div class="detail-image"><img src="assets/${p.image}.webp" alt="${esc(productName(p))}"></div><div class="detail-info"><div class="product-meta"><span>${esc(p.brand)}</span><span>${categoryNames[p.category]}</span></div><h2 id="detail-title">${esc(productName(p))}</h2><p>${esc(I.description(p))}</p><div class="detail-size"><span>${t('format')}</span><strong>${esc(I.size(p))}</strong></div><button class="button button-primary" data-add="${p.id}">${t('addButton')} ${icon('plus')}</button><button class="text-link" data-ask-product="${p.id}">${t('askProduct')} ${icon('message')}</button><p class="detail-note">${t('detailNote')}${p.category==='medical'?' '+t('medicalNote'):''}</p></div></div>`;
    if (!detailDialog.open) detailDialog.showModal();
  }
  function renderBag() {
    const items = products.filter(p => bag[p.id]);
    $('#bag-bottom').hidden = !items.length;
    $('#bag-content').innerHTML=items.length?items.map(p=>`<article class="bag-item"><button class="bag-item-image" data-bag-detail="${p.id}" aria-label="${esc(t('view',{name:productName(p)}))}"><img src="assets/${p.image}.webp" alt=""></button><div><h3>${esc(productName(p))}</h3><p>${esc(p.brand)} · ${esc(I.size(p))}</p><div class="bag-item-controls"><div class="qty-control"><button data-quantity="${p.id}" data-step="-1" aria-label="${esc(t('decrease',{name:productName(p)}))}">${icon('minus')}</button><span aria-label="${esc(t('quantity',{n:I.num(bag[p.id])}))}">${I.num(bag[p.id])}</span><button data-quantity="${p.id}" data-step="1" aria-label="${esc(t('increase',{name:productName(p)}))}" ${bag[p.id]>=99?'disabled':''}>${icon('plus')}</button></div><button class="remove-item" data-remove="${p.id}" aria-label="${esc(t('removeLabel',{name:productName(p)}))}">${t('remove')}</button></div></div></article>`).join(''):`<div class="bag-empty"><span>${icon('bag')}</span><h3>${t('emptyBag')}</h3><p>${t('emptyBagBody')}</p><button class="button button-primary" data-browse>${t('explore')} ${icon('arrow-right')}</button></div>`;
  }
  async function copyEnquiry() {
    const lines=products.filter(p=>bag[p.id]).map(p=>`- ${productName(p)} (${I.size(p)}) × ${I.num(bag[p.id])}`);
    const message=`${t('helloEnquiry')}\n\n${lines.join('\n')}\n\n${t('endEnquiry')}`;
    try{await navigator.clipboard.writeText(message);$('#copy-enquiry').innerHTML=`${icon('check')} ${t('copied')}`;setTimeout(()=>{$('#copy-enquiry').innerHTML=`${icon('copy')} ${t('copy')}`},3000)}
    catch{let textarea=$('.enquiry-fallback');if(!textarea){textarea=document.createElement('textarea');textarea.className='enquiry-fallback';textarea.setAttribute('aria-label',t('copyLabel'));$('#bag-bottom').appendChild(textarea)}textarea.value=message;textarea.focus();textarea.select();$('#copy-enquiry').textContent=t('copyFallback')}
  }
  document.addEventListener('click', e => {
    const ask=e.target.closest('[data-ask-product]');if(ask){if(detailDialog.open)detailDialog.close();document.dispatchEvent(new CustomEvent('oliveco:ask',{detail:{productId:ask.dataset.askProduct}}));return;}
    if(e.target.closest('.story-link')){e.preventDefault();document.dispatchEvent(new CustomEvent('oliveco:ask'));return;}
    const add = e.target.closest('[data-add]'); if (add) { addToBag(add.dataset.add); return; }
    const save = e.target.closest('[data-save]'); if (save) { saveProduct(save.dataset.save); return; }
    const detail = e.target.closest('[data-detail]'); if (detail) { openDetails(detail.dataset.detail); return; }
    const category = e.target.closest('[data-category]'); if (category) { chooseCategory(category.dataset.category); return; }
    const filter = e.target.closest('[data-filter]'); if (filter) { state.category = filter.dataset.filter; state.limit = defaultLimit; renderProducts(); return; }
    const close = e.target.closest('[data-close-dialog]'); if (close) { close.closest('dialog').close(); return; }
    if (e.target.closest('[data-reset]')) { resetFilters(); return; }
    if (e.target.closest('[data-browse]')) { bagDialog.close(); resetFilters(); scrollToCollection(); return; }
    const quantity = e.target.closest('[data-quantity]'); if (quantity) {
      const id = quantity.dataset.quantity; const n = Math.max(0, Math.min(99, (bag[id] || 0) + Number(quantity.dataset.step)));
      if (n) bag[id] = n; else delete bag[id]; persist(); updateCounts(); renderBag();
      const nextControl = $(`[data-quantity="${id}"][data-step="${quantity.dataset.step}"]`,bagDialog); if (nextControl) nextControl.focus(); return;
    }
    const remove = e.target.closest('[data-remove]'); if (remove) { delete bag[remove.dataset.remove]; persist(); updateCounts(); renderBag(); return; }
    const bagDetail = e.target.closest('[data-bag-detail]'); if (bagDetail) { bagDialog.close(); openDetails(bagDetail.dataset.bagDetail); return; }
    if (!e.target.closest('.header')) closeSearch();
  });
  $('#sort-products').addEventListener('change', e => { state.sort = e.target.value; renderProducts(); });
  $('#clear-filters').addEventListener('click', resetFilters);
  $('#saved-toggle').addEventListener('click',()=>showSaved());
  $('#mobile-saved').addEventListener('click',()=>{$('#mobile-nav').hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');showSaved(true)});
  $('#selection-summary-open').addEventListener('click',()=>{renderBag();bagDialog.showModal()});
  $('#bag-toggle').addEventListener('click', () => { if (detailDialog.open) detailDialog.close(); renderBag(); bagDialog.showModal(); closeSearch(); });
  $('#copy-enquiry').addEventListener('click', copyEnquiry);
  function closeSearch() { $('#search-panel').hidden = true; $('#search-toggle').setAttribute('aria-expanded','false'); }
  $('#search-toggle').addEventListener('click', () => { const open = $('#search-panel').hidden; $('#search-panel').hidden = !open; $('#search-toggle').setAttribute('aria-expanded',String(open)); $('#mobile-nav').hidden = true; $('#menu-toggle').setAttribute('aria-expanded','false'); if (open) $('#header-search').focus(); });
  $('#search-close').addEventListener('click', () => { closeSearch(); $('#search-toggle').focus(); });
  $$('#header-search, #shop-search').forEach(input => input.addEventListener('input', e => { state.query = e.target.value.slice(0,120); state.limit = defaultLimit; state.savedOnly = false; state.category = 'all'; syncSearchInputs(); renderProducts(); }));
  $('#header-search').addEventListener('keydown', e => { if (e.key === 'Enter') { if (!isShopPage) { location.assign(shopUrl()); return; } closeSearch(); scrollToCollection(); } });
  $('#menu-toggle').addEventListener('click', () => { const open = $('#mobile-nav').hidden; $('#mobile-nav').hidden = !open; $('#menu-toggle').setAttribute('aria-expanded',String(open)); closeSearch(); });
  $$('#mobile-nav a').forEach(a => a.addEventListener('click', () => { $('#mobile-nav').hidden = true; $('#menu-toggle').setAttribute('aria-expanded','false'); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSearch(); $('#mobile-nav').hidden = true; $('#menu-toggle').setAttribute('aria-expanded','false'); } });
  $$('dialog').forEach(dialog => dialog.addEventListener('click', e => { if (e.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close(); }));
  $('#year').textContent = new Date().getFullYear();
  $('#language-switch').addEventListener('change',e=>I.setLanguage(e.target.value));
  document.addEventListener('oliveco:language',()=>{categoryNames=I.categories();hydrateIcons();renderCategories();renderProducts();if(bagDialog.open)renderBag();if(detailDialog.open&&activeDetailId)openDetails(activeDetailId)});
  window.OlivecoShop={openDetails,chooseCategory,addToBag,showSelection(){renderBag();bagDialog.showModal()},icon};
  I.apply();hydrateIcons();renderCategories();syncSearchInputs();$('#sort-products').value=state.sort;renderProducts();updateCounts();
})();
