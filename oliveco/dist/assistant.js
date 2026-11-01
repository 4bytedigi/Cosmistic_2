(() => {
  'use strict';
  const I=window.OlivecoI18n,t=(key,values)=>I.t(key,values),shop=window.OlivecoShop,icon=shop.icon;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const host=document.createElement('div');host.id='assistant-widget';
  host.innerHTML=`<button class="chat-launcher" id="chat-launcher" aria-expanded="false" aria-controls="chat-panel">${icon('message')}<span></span><span class="chat-launcher-dot"></span></button><section class="chat-panel" id="chat-panel" aria-labelledby="chat-title" hidden><header class="chat-header"><img src="assets/oliveco-mark.webp" alt="" width="33" height="33"><div><h2 id="chat-title"></h2><p></p></div><button class="icon-button" type="button" id="chat-reset"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 7a7 7 0 0 1 11.5-1L20 9M4 15l2.4 3A7 7 0 0 0 17.9 17"/></svg></button><button class="icon-button" type="button" id="chat-close">${icon('close')}</button></header><div class="chat-messages" id="chat-messages" role="log" aria-live="polite" aria-relevant="additions"></div><div class="chat-suggestions" id="chat-suggestions"></div><div class="chat-recovery"><p id="chat-notice" role="status"></p><button type="button" class="chat-action" id="chat-retry" hidden></button></div><form class="chat-form" id="chat-form"><label class="sr-only" for="chat-input"></label><input id="chat-input" name="question" type="text" maxlength="500" autocomplete="off" aria-describedby="chat-notice" required><button class="chat-send" type="submit">${icon('arrow-right')}</button></form><p class="chat-mode" id="chat-mode"></p></section>`;
  document.body.appendChild(host);
  const $=s=>host.querySelector(s),panel=$('#chat-panel'),messages=$('#chat-messages'),input=$('#chat-input');
  let conversation=[],context=[],busy=false,requestController=null,aiConfigured=false,lastReplyWarning=null;
  let generation=0,connectionReady=false,connectionPromise=null,noticeKey=null,retryQuestion=null,cooldownUntil=0,cooldownTimer=null;
  const knownIds=new Set(window.OLIVECO_PRODUCTS.map(p=>p.id));
  const cleanIds=ids=>Array.isArray(ids)?[...new Set(ids.filter(id=>knownIds.has(id)))].slice(0,3):[];
  const cleanActions=actions=>Array.isArray(actions)?actions.filter(action=>typeof action==='string'&&['contact','enquiry','selection','category:skin','category:hair','category:personal','category:home','category:medical'].includes(action)):[];
  const chatVersion='2026-11-01';
  try{if(sessionStorage.getItem('oliveco-chat-version')!==chatVersion)sessionStorage.removeItem('oliveco-chat');const saved=JSON.parse(sessionStorage.getItem('oliveco-chat')||'[]');if(Array.isArray(saved))conversation=saved.filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.text==='string').slice(-20).map(m=>({role:m.role,text:m.text.slice(0,4000),products:cleanIds(m.products),actions:cleanActions(m.actions),context:cleanIds(m.context||m.products)}));context=[...conversation].reverse().find(m=>m.role==='assistant'&&m.context.length)?.context||[]}catch{}
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
    $('#chat-retry').hidden=!retryQuestion;$('#chat-retry').disabled=busy||waiting;
    $('#chat-retry').textContent=t('chatRetry');
    $('#chat-notice').textContent=waiting?t('chatCooldown',{minutes:Math.ceil((cooldownUntil-Date.now())/60000)}):noticeKey?t(noticeKey):'';
    clearTimeout(cooldownTimer);
    if(waiting)cooldownTimer=setTimeout(()=>{if(cooldownUntil<=Date.now())noticeKey=null;controls();},Math.min(60000,cooldownUntil-Date.now()+20));
  }
  function decorateReply(reply){
    const ids=Array.isArray(reply.products)?reply.products:[];
    const cards=ids.slice(0,3).map(id=>{const p=window.OLIVECO_PRODUCTS.find(p=>p.id===id);if(!p)return'';return`<button class="chat-product" data-detail="${p.id}"><span><img src="assets/${p.imageSrc || p.image+'.webp'}" alt="" loading="lazy"></span><span><strong>${esc(I.name(p))}</strong><small>${t('chatView')} ${icon('arrow-up-right')}</small></span></button>`}).join('');
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
  function open(){panel.hidden=false;$('#chat-launcher').setAttribute('aria-expanded','true');$('#chat-launcher').classList.add('chat-is-open');if(!matchMedia('(max-width:700px)').matches)input.focus();draw()}
  function close(){panel.hidden=true;$('#chat-launcher').setAttribute('aria-expanded','false');$('#chat-launcher').classList.remove('chat-is-open')}
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
      let fallback={text:t('chatError'),actions:['contact'],context};
      try{fallback=window.OlivecoGuide?.reply(text,{language:I.lang,context,knowledge:window.OLIVECO_KNOWLEDGE,pricing:window.OLIVECO_PRICING})||fallback;}catch{}
      context=cleanIds(fallback.context||context);
      conversation.push({role:'assistant',text:fallback.text||t('chatError'),products:cleanIds(fallback.products),actions:cleanActions(fallback.actions?.length?fallback.actions:['contact']),context,failed:true});
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
  host.addEventListener('click',e=>{const prompt=e.target.closest('[data-chat-prompt]');if(prompt)send(prompt.dataset.chatPrompt);const enquiry=e.target.closest('[data-chat-enquiry]');if(enquiry){document.dispatchEvent(new CustomEvent('oliveco:enquire',{detail:{productIds:cleanIds(enquiry.dataset.chatEnquiry.split(',')),question:[...conversation].reverse().find(m=>m.role==='user')?.text||''}}));}if(e.target.closest('[data-chat-selection]')){close();shop.showSelection()}if(e.target.closest('[data-category]'))close()});
  host.addEventListener('keydown',e=>{if(e.key==='Escape'){close();$('#chat-launcher').focus()}});
  document.addEventListener('oliveco:ask',e=>{open();if(e.detail?.productId){const p=window.OLIVECO_PRODUCTS.find(p=>p.id===e.detail.productId);if(p){context=[p.id];send(t('chatAskName',{name:I.name(p)}))}}});
  document.addEventListener('oliveco:language',translate);
  document.addEventListener('oliveco:enquiry-opening',close);
  translate();refreshConnection().catch(()=>{});
})();
