(() => {
  'use strict';
  const I=window.OlivecoI18n,t=(key,values)=>I.t(key,values),shop=window.OlivecoShop,icon=shop.icon;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const host=document.createElement('div');host.id='assistant-widget';
  host.innerHTML=`<button class="chat-launcher" id="chat-launcher" aria-expanded="false" aria-controls="chat-panel">${icon('message')}<span></span><span class="chat-launcher-dot"></span></button><section class="chat-panel" id="chat-panel" aria-labelledby="chat-title" hidden><header class="chat-header"><img src="assets/favicon-v2-192.png" alt="" width="33" height="33"><div><h2 id="chat-title"></h2><p></p></div><button class="icon-button" type="button" id="chat-reset"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/></svg></button><button class="icon-button" type="button" id="chat-close">${icon('close')}</button></header><div class="chat-messages" id="chat-messages" role="log" aria-live="polite" aria-relevant="additions"></div><div class="chat-suggestions" id="chat-suggestions"></div><div class="chat-recovery"><p id="chat-notice" role="status"></p><button type="button" class="chat-action" id="chat-retry" hidden></button></div><form class="chat-form" id="chat-form"><label class="sr-only" for="chat-input"></label><input id="chat-input" name="question" type="text" maxlength="500" autocomplete="off" aria-describedby="chat-notice" required><button class="chat-send" type="submit">${icon('arrow-right')}</button></form><p class="chat-mode" id="chat-mode"></p></section>`;
  document.body.appendChild(host);
  const $=s=>host.querySelector(s),panel=$('#chat-panel'),messages=$('#chat-messages'),input=$('#chat-input');
  const mobileLayout=matchMedia('(max-width:700px)');
  let pageScroll=null,viewportFrame=0;
  function fitMobileViewport(){
    if(panel.hidden||!mobileLayout.matches){
      host.classList.remove('chat-compact');
      panel.removeAttribute('role');panel.removeAttribute('aria-modal');
      if(pageScroll!==null){
        document.body.classList.remove('mobile-chat-open');
        document.body.style.removeProperty('--chat-page-top');
        window.scrollTo({top:pageScroll,behavior:'instant'});pageScroll=null;
      }
      return;
    }
    if(pageScroll===null){
      pageScroll=window.scrollY;
      document.body.style.setProperty('--chat-page-top',`${-pageScroll}px`);
      document.body.classList.add('mobile-chat-open');
    }
    // On iOS the keyboard resizes/pans the visual viewport, not 100dvh.
    const viewport=window.visualViewport,height=viewport?.height||window.innerHeight;
    host.style.setProperty('--chat-viewport-top',`${Math.max(0,viewport?.offsetTop||0)}px`);
    host.style.setProperty('--chat-viewport-height',`${height}px`);
    host.classList.toggle('chat-compact',height<500);
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
    if(document.activeElement===input)messages.scrollTop=messages.scrollHeight;
  }
  function scheduleViewport(){
    cancelAnimationFrame(viewportFrame);viewportFrame=requestAnimationFrame(fitMobileViewport);
  }
  window.visualViewport?.addEventListener('resize',scheduleViewport);
  window.visualViewport?.addEventListener('scroll',scheduleViewport);
  window.addEventListener('resize',scheduleViewport);
  mobileLayout.addEventListener('change',scheduleViewport);
  input.addEventListener('focus',scheduleViewport);
  let conversation=[],context=[],busy=false,requestController=null,aiConfigured=false,lastReplyWarning=null;
  let generation=0,connectionReady=false,connectionPromise=null,noticeKey=null,retryQuestion=null,cooldownUntil=0,cooldownTimer=null;
  const knownIds=new Set(window.OLIVECO_PRODUCTS.map(p=>p.id));
  const cleanIds=ids=>Array.isArray(ids)?[...new Set(ids.filter(id=>knownIds.has(id)))].slice(0,3):[];
  const cleanActions=actions=>Array.isArray(actions)?actions.filter(action=>typeof action==='string'&&['contact','enquiry','selection','category:skin','category:hair','category:personal','category:home','category:medical'].includes(action)):[];
  const chatVersion='2026-11-01';
  try{
    // Keep chat while browsing the site, but a browser refresh starts over.
    const refreshed=performance.getEntriesByType('navigation')[0]?.type==='reload';
    if(refreshed||sessionStorage.getItem('oliveco-chat-version')!==chatVersion)sessionStorage.removeItem('oliveco-chat');
    const saved=JSON.parse(sessionStorage.getItem('oliveco-chat')||'[]');
    if(Array.isArray(saved))conversation=saved.filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.text==='string').slice(-20).map(m=>({role:m.role,text:m.text.slice(0,4000),products:cleanIds(m.products),actions:cleanActions(m.actions),context:cleanIds(m.context||m.products)}));
    context=[...conversation].reverse().find(m=>m.role==='assistant'&&m.context.length)?.context||[];
  }catch{}
  function persist(){try{sessionStorage.setItem('oliveco-chat-version',chatVersion);sessionStorage.setItem('oliveco-chat',JSON.stringify(conversation.slice(-20)))}catch{}}
  function updateMode(){
    $('.chat-header p').textContent=t(aiConfigured?'chatSubtitleAi':'chatSubtitle');
    $('#chat-mode').textContent=t(aiConfigured&&!lastReplyWarning?'chatConnected':'chatMode');
  }
  function refreshConnection(){
    if(!connectionPromise)connectionPromise=(async()=>{
      const response=await fetch('/api/status',{signal:AbortSignal.timeout(5000),credentials:'same-origin'});
      if(!response.ok)throw new Error('connection');
      const status=await response.json();aiConfigured=status.aiConfigured===true;connectionReady=true;updateMode();
    })().finally(()=>{connectionPromise=null;});
    return connectionPromise;
  }
  function controls(){
    const waiting=cooldownUntil>Date.now();
    $('.chat-send').disabled=busy||waiting;
    $('#chat-form').setAttribute('aria-busy',String(busy));
    $('#chat-suggestions').querySelectorAll('button').forEach(button=>button.disabled=busy||waiting);
    messages.querySelectorAll('.chat-product').forEach(button=>button.disabled=busy||waiting);
    $('#chat-retry').hidden=!retryQuestion;$('#chat-retry').disabled=busy||waiting;
    $('#chat-retry').textContent=t('chatRetry');
    $('#chat-notice').textContent=waiting?t('chatCooldown',{minutes:Math.ceil((cooldownUntil-Date.now())/60000)}):noticeKey?t(noticeKey):'';
    clearTimeout(cooldownTimer);
    if(waiting)cooldownTimer=setTimeout(()=>{if(cooldownUntil<=Date.now())noticeKey=null;controls();},Math.min(60000,cooldownUntil-Date.now()+20));
  }
  function decorateReply(reply){
    const ids=Array.isArray(reply.products)?reply.products:[];
    const cards=ids.slice(0,3).map(id=>{const p=window.OLIVECO_PRODUCTS.find(p=>p.id===id);if(!p)return'';return`<button class="chat-product" data-chat-product="${p.id}"${busy||cooldownUntil>Date.now()?' disabled':''}><span><img src="assets/${p.imageSrc || p.image+'.webp'}" alt="" loading="lazy"></span><span><strong>${esc(I.name(p))}</strong><small>${t('chatView')} ${icon('message')}</small></span></button>`}).join('');
    const viber=window.OLIVECO_CONTACT?.viber;
    const actions=(reply.actions||[]).map(action=>action==='contact'?`<a class="chat-action" href="${esc(viber?.href||'https://www.facebook.com/olivecomdy/')}"${viber?'':' target="_blank" rel="noopener"'}>${t(viber?'viberContact':'facebookContact')} ${icon('arrow-up-right')}</a>`:action==='enquiry'?`<button class="chat-action" data-chat-enquiry="${esc((reply.context||ids).join(','))}">${t('prepareEnquiry')} ${icon('message')}</button>`:action==='selection'?`<button class="chat-action" data-chat-selection>${t('bagTitle')} ${icon('bag')}</button>`:action.startsWith('category:')?`<button class="chat-action" data-category="${esc(action.split(':')[1])}">${esc(t('browse',{name:I.categories()[action.split(':')[1]]}))} ${icon('arrow-right')}</button>`:'').join('');
    return cards+actions;
  }
  function draw(){
    const template=document.createElement('template');
    template.innerHTML=`<div class="chat-bubble assistant"><p>${esc(t('chatWelcome'))}</p></div>`+conversation.map(m=>`<div class="chat-bubble ${m.role}"><p>${esc(m.text).replaceAll('\n','<br>')}</p>${m.role==='assistant'?decorateReply(m):''}</div>`).join('')+(busy?`<div class="chat-bubble assistant chat-loading" role="status">${t('chatTyping')}</div>`:'');
    const next=[...template.content.children];
    next.forEach((node,index)=>{const current=messages.children[index];if(!current)messages.appendChild(node);else if(current.outerHTML!==node.outerHTML)current.replaceWith(node);});
    while(messages.children.length>next.length)messages.lastElementChild.remove();
    messages.scrollTop=messages.scrollHeight;
  }
  function translate(){
    $('#chat-launcher>span:first-of-type').textContent=t('chatLauncher');$('#chat-title').textContent=t('chatTitle');$('.chat-header p').textContent=t('chatSubtitle');$('#chat-close').setAttribute('aria-label',t('chatClose'));$('#chat-reset').setAttribute('aria-label',t('chatClear'));$('#chat-reset').title=t('chatClear');$('#chat-launcher').setAttribute('aria-label',t('chatTitle'));$('.chat-form label').textContent=t('chatPlaceholder');input.placeholder=t('chatPlaceholder');$('.chat-send').setAttribute('aria-label',t('chatSend'));$('#chat-mode').textContent=t('chatMode');
    $('#chat-suggestions').innerHTML=['chatSuggestionSkin','chatSuggestionHair','chatSuggestionOrder','chatSuggestionCompany'].map(k=>`<button type="button" data-chat-prompt="${esc(t(k))}">${t(k)}</button>`).join('');updateMode();controls();draw();
  }
  function open(){panel.hidden=false;$('#chat-launcher').setAttribute('aria-expanded','true');$('#chat-launcher').classList.add('chat-is-open');fitMobileViewport();if(mobileLayout.matches)$('#chat-close').focus({preventScroll:true});else input.focus();draw()}
  function close(){input.blur();panel.hidden=true;$('#chat-launcher').setAttribute('aria-expanded','false');$('#chat-launcher').classList.remove('chat-is-open');fitMobileViewport()}
  function askProduct(id){
    if(busy||cooldownUntil>Date.now())return;
    const product=window.OLIVECO_PRODUCTS.find(p=>p.id===id);if(!product)return;
    const lastQuestion=[...conversation].reverse().find(m=>m.role==='user'&&/[a-z\u1000-\u102a]/i.test(m.text))?.text||'';
    const language=/[\u1000-\u102a]/.test(lastQuestion)?'my':/[a-z]/i.test(lastQuestion)?'en':I.lang;
    context=[id];
    const draft=input.value;
    send(I.t('chatAskName',{name:I.name(product,language)},language));
    input.value=draft;
  }
  async function send(text,{retry=false}={}){
    text=text.trim().slice(0,500);if(!text||busy||cooldownUntil>Date.now())return;
    input.value='';
    if(retry&&conversation.at(-1)?.failed)conversation.pop();
    if(!retry)conversation.push({role:'user',text});
    conversation=conversation.slice(-20);busy=true;noticeKey=null;retryQuestion=null;
    const turn=++generation,controller=new AbortController();requestController=controller;
    let timedOut=false;
    const timeout=setTimeout(()=>{timedOut=true;controller.abort();},30000);
    controls();draw();
    try{
      if(!connectionReady)await refreshConnection();
      if(turn!==generation)return;
      const request=()=>fetch('/api/chat',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,language:I.lang,context,history:conversation.slice(-7,-1).filter(m=>!m.failed).map(m=>({role:m.role,content:m.text.slice(0,900)}))}),signal:controller.signal});
      let res=await request(),reply=await res.json();
      // A server restart/expired cookie returns a fresh signed session. Retry once only.
      if(res.status===403&&reply.error==='chat_session_required'){res=await request();reply=await res.json();}
      if(turn!==generation)return;
      if(res.status===429){cooldownUntil=Date.now()+Math.max(1,Math.min(86400,Number(reply.retryAfter)||60))*1000;throw new Error('rate_limited');}
      if(!res.ok||typeof reply.text!=='string'||reply.text.length>4000)throw new Error('unavailable');
      context=cleanIds(reply.context||reply.products);conversation.push({role:'assistant',text:reply.text,products:cleanIds(reply.products),actions:cleanActions(reply.actions),context});aiConfigured=reply.aiConfigured===true||reply.mode==='ai';lastReplyWarning=reply.warning||null;
      if(reply.warning)noticeKey=['ai_rate_limited','ai_budget_limited'].includes(reply.warning)?'chatAiLimit':reply.warning==='ai_busy'?'chatBusy':'chatGuideRecovery';
    }catch(error){
      if(turn!==generation)return;
      lastReplyWarning='ai_unavailable';
      noticeKey=error.message==='rate_limited'?'chatCooldown':timedOut?'chatTimeout':navigator.onLine===false?'chatOffline':'chatNetworkError';
      let fallback={text:t('chatError'),actions:[],context};
      try{fallback=window.OlivecoGuide?.reply(text,{language:I.lang,context,knowledge:window.OLIVECO_KNOWLEDGE,pricing:window.OLIVECO_PRICING})||fallback;}catch{}
      context=cleanIds(fallback.context||context);
      conversation.push({role:'assistant',text:fallback.text||t('chatError'),products:cleanIds(fallback.products),actions:cleanActions(fallback.actions||[]),context,failed:true});
      retryQuestion=text;
    }finally{
      clearTimeout(timeout);
      if(turn===generation){requestController=null;busy=false;conversation=conversation.slice(-20);updateMode();persist();controls();draw();}
    }
  }
  $('#chat-launcher').addEventListener('click',()=>panel.hidden?open():close());$('#chat-close').addEventListener('click',()=>{close();$('#chat-launcher').focus()});
  $('#chat-reset').addEventListener('click',()=>{generation++;requestController?.abort();requestController=null;busy=false;conversation=[];context=[];input.value='';lastReplyWarning=null;noticeKey=null;retryQuestion=null;try{sessionStorage.removeItem('oliveco-chat');}catch{}updateMode();controls();draw();input.focus()});
  $('#chat-retry').addEventListener('click',()=>{if(retryQuestion)send(retryQuestion,{retry:true});});
  $('#chat-form').addEventListener('submit',e=>{e.preventDefault();send(input.value)});
  host.addEventListener('click',e=>{const product=e.target.closest('[data-chat-product]');if(product)askProduct(product.dataset.chatProduct);});
  host.addEventListener('click',e=>{const prompt=e.target.closest('[data-chat-prompt]');if(prompt)send(prompt.dataset.chatPrompt);const enquiry=e.target.closest('[data-chat-enquiry]');if(enquiry){document.dispatchEvent(new CustomEvent('oliveco:enquire',{detail:{productIds:cleanIds(enquiry.dataset.chatEnquiry.split(',')),question:[...conversation].reverse().find(m=>m.role==='user')?.text||''}}));}if(e.target.closest('[data-chat-selection]')){close();shop.showSelection()}if(e.target.closest('[data-category]'))close()});
  host.addEventListener('keydown',e=>{
    if(e.key==='Escape'){close();$('#chat-launcher').focus();}
    if(e.key==='Tab'&&!panel.hidden&&mobileLayout.matches){
      const controls=[...panel.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled)')].filter(el=>el.getClientRects().length);
      const first=controls[0],last=controls.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
  });
  document.addEventListener('oliveco:ask',e=>{open();if(e.detail?.productId)askProduct(e.detail.productId);});
  document.addEventListener('oliveco:language',translate);
  document.addEventListener('oliveco:enquiry-opening',close);
  translate();refreshConnection().catch(()=>{});
})();
