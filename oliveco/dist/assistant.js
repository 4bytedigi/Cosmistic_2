(() => {
  'use strict';
  const I=window.OlivecoI18n,t=(key,values)=>I.t(key,values),shop=window.OlivecoShop,icon=shop.icon;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const host=document.createElement('div');host.id='assistant-widget';
  host.innerHTML=`<button class="chat-launcher" id="chat-launcher" aria-expanded="false" aria-controls="chat-panel">${icon('message')}<span></span><span class="chat-launcher-dot"></span></button><section class="chat-panel" id="chat-panel" aria-labelledby="chat-title" hidden><header class="chat-header"><img src="assets/oliveco-mark.webp" alt="" width="33" height="33"><div><h2 id="chat-title"></h2><p></p></div><button class="icon-button" id="chat-reset">${icon('plus')}</button><button class="icon-button" id="chat-close">${icon('close')}</button></header><div class="chat-messages" id="chat-messages" role="log" aria-live="polite" aria-relevant="additions"></div><div class="chat-suggestions" id="chat-suggestions"></div><form class="chat-form" id="chat-form"><label class="sr-only" for="chat-input"></label><input id="chat-input" type="text" maxlength="500" autocomplete="off" required><button class="chat-send" type="submit">${icon('arrow-right')}</button></form><p class="chat-mode" id="chat-mode"></p></section>`;
  document.body.appendChild(host);
  const $=s=>host.querySelector(s),panel=$('#chat-panel'),messages=$('#chat-messages'),input=$('#chat-input');
  let conversation=[],context=[],busy=false,requestController=null,aiConfigured=false,lastReplyWarning=null;
  const knownIds=new Set(window.OLIVECO_PRODUCTS.map(p=>p.id));
  const cleanIds=ids=>Array.isArray(ids)?[...new Set(ids.filter(id=>knownIds.has(id)))].slice(0,3):[];
  const cleanActions=actions=>Array.isArray(actions)?actions.filter(action=>typeof action==='string'&&['contact','selection','category:skin','category:hair','category:personal','category:home','category:medical'].includes(action)):[];
  try{const saved=JSON.parse(sessionStorage.getItem('oliveco-chat')||'[]');if(Array.isArray(saved))conversation=saved.filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.text==='string').slice(-20).map(m=>({role:m.role,text:m.text.slice(0,4000),products:cleanIds(m.products),actions:cleanActions(m.actions),context:cleanIds(m.context||m.products)}));context=[...conversation].reverse().find(m=>m.role==='assistant'&&m.context.length)?.context||[]}catch{}
  function persist(){try{sessionStorage.setItem('oliveco-chat',JSON.stringify(conversation.slice(-20)))}catch{}}
  function updateMode(){
    $('.chat-header p').textContent=t(aiConfigured?'chatSubtitleAi':'chatSubtitle');
    $('#chat-mode').textContent=t(aiConfigured?(lastReplyWarning?'chatFallback':'chatConnected'):'chatMode');
  }
  async function refreshConnection(){
    try{const response=await fetch('/api/status',{signal:AbortSignal.timeout(5000)});if(response.ok){const status=await response.json();aiConfigured=status.aiConfigured===true;}}
    catch{}
    updateMode();
  }
  function decorateReply(reply){
    const ids=Array.isArray(reply.products)?reply.products:[];
    const cards=ids.slice(0,3).map(id=>{const p=window.OLIVECO_PRODUCTS.find(p=>p.id===id);if(!p)return'';return`<button class="chat-product" data-detail="${p.id}"><span><img src="assets/${p.image}.webp" alt="" loading="lazy"></span><span><strong>${esc(I.name(p))}</strong><small>${t('chatView')} ${icon('arrow-up-right')}</small></span></button>`}).join('');
    const actions=(reply.actions||[]).map(action=>action==='contact'?`<a class="chat-action" href="https://www.facebook.com/olivecomdy/" target="_blank" rel="noopener">${t('facebookContact')} ${icon('arrow-up-right')}</a>`:action==='selection'?`<button class="chat-action" data-chat-selection>${t('bagTitle')} ${icon('bag')}</button>`:action.startsWith('category:')?`<button class="chat-action" data-category="${esc(action.split(':')[1])}">${t('chatMore')} ${icon('arrow-right')}</button>`:'').join('');
    return cards+actions;
  }
  function draw(){
    messages.innerHTML=`<div class="chat-bubble assistant"><p>${esc(t('chatWelcome'))}</p></div>`+conversation.map(m=>`<div class="chat-bubble ${m.role}"><p>${esc(m.text).replaceAll('\n','<br>')}</p>${m.role==='assistant'?decorateReply(m):''}</div>`).join('');
    if(busy)messages.insertAdjacentHTML('beforeend',`<div class="chat-bubble assistant chat-loading" role="status">${t('chatTyping')}</div>`);
    messages.scrollTop=messages.scrollHeight;
  }
  function translate(){
    $('#chat-launcher>span:first-of-type').textContent=t('chatLauncher');$('#chat-title').textContent=t('chatTitle');$('.chat-header p').textContent=t('chatSubtitle');$('#chat-close').setAttribute('aria-label',t('chatClose'));$('#chat-reset').setAttribute('aria-label',t('chatClear'));$('#chat-launcher').setAttribute('aria-label',t('chatTitle'));$('.chat-form label').textContent=t('chatPlaceholder');input.placeholder=t('chatPlaceholder');$('.chat-send').setAttribute('aria-label',t('chatSend'));$('#chat-mode').textContent=t('chatMode');
    $('#chat-suggestions').innerHTML=['chatSuggestionSkin','chatSuggestionHair','chatSuggestionOrder','chatSuggestionHours'].map(k=>`<button type="button" data-chat-prompt="${esc(t(k))}">${t(k)}</button>`).join('');updateMode();draw();
  }
  function open(){panel.hidden=false;$('#chat-launcher').setAttribute('aria-expanded','true');$('#chat-launcher').classList.add('chat-is-open');if(!matchMedia('(max-width:700px)').matches)input.focus();draw()}
  function close(){panel.hidden=true;$('#chat-launcher').setAttribute('aria-expanded','false');$('#chat-launcher').classList.remove('chat-is-open')}
  async function send(text){
    text=text.trim().slice(0,500);if(!text||busy)return;input.value='';conversation.push({role:'user',text});busy=true;$('.chat-send').disabled=true;draw();requestController=new AbortController();const timeout=setTimeout(()=>requestController.abort(),30000);
    try{
    const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,language:I.lang,context,history:conversation.slice(-7,-1).map(m=>({role:m.role,content:m.text.slice(0,900)}))}),signal:requestController.signal});
      if(!res.ok)throw new Error('chat unavailable');const reply=await res.json();if(typeof reply.text!=='string')throw new Error('invalid reply');context=cleanIds(reply.context||reply.products);conversation.push({role:'assistant',text:reply.text,products:cleanIds(reply.products),actions:cleanActions(reply.actions),context});aiConfigured=reply.aiConfigured===true||reply.mode==='ai';lastReplyWarning=reply.warning||null;
    }catch(error){lastReplyWarning='ai_unavailable';conversation.push({role:'assistant',text:t('chatError'),actions:['contact'],context})}
    finally{clearTimeout(timeout);requestController=null;busy=false;$('.chat-send').disabled=false;updateMode();persist();draw()}
  }
  $('#chat-launcher').addEventListener('click',()=>panel.hidden?open():close());$('#chat-close').addEventListener('click',()=>{close();$('#chat-launcher').focus()});
  $('#chat-reset').addEventListener('click',()=>{if(busy)return;conversation=[];context=[];lastReplyWarning=null;persist();updateMode();draw();input.focus()});
  $('#chat-form').addEventListener('submit',e=>{e.preventDefault();send(input.value)});
  host.addEventListener('click',e=>{const prompt=e.target.closest('[data-chat-prompt]');if(prompt)send(prompt.dataset.chatPrompt);if(e.target.closest('[data-chat-selection]')){close();shop.showSelection()}if(e.target.closest('[data-detail],[data-category]'))close()});
  host.addEventListener('keydown',e=>{if(e.key==='Escape'){close();$('#chat-launcher').focus()}});
  document.addEventListener('oliveco:ask',e=>{open();if(e.detail?.productId){const p=window.OLIVECO_PRODUCTS.find(p=>p.id===e.detail.productId);if(p){context=[p.id];send(t('chatAskName',{name:I.name(p)}))}}});
  document.addEventListener('oliveco:language',translate);
  translate();refreshConnection();
})();
