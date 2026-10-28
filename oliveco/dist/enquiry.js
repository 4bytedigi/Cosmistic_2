(() => {
  'use strict';
  const I=window.OlivecoI18n,t=(key,values)=>I.t(key,values),shop=window.OlivecoShop;
  const contact=window.OLIVECO_CONTACT,model=window.OlivecoEnquiryMessage;
  if(!contact?.viber)return;
  const dialog=document.createElement('dialog');dialog.id='enquiry-dialog';dialog.className='enquiry-dialog';dialog.setAttribute('aria-labelledby','enquiry-title');
  dialog.innerHTML=`<div class="enquiry-heading"><h2 id="enquiry-title" tabindex="-1"></h2><button type="button" class="icon-button" id="enquiry-close">${shop.icon('close')}</button></div><p class="enquiry-destination" id="enquiry-destination"></p><form id="enquiry-form" novalidate><div class="enquiry-products" id="enquiry-products" hidden><h3 id="enquiry-products-label"></h3><ul id="enquiry-product-list"></ul></div><div class="enquiry-fields"><div class="enquiry-field"><label for="enquiry-name"></label><input id="enquiry-name" name="name" autocomplete="name" maxlength="80" required aria-describedby="enquiry-name-error"><p class="enquiry-error" id="enquiry-name-error"></p></div><div class="enquiry-field"><label for="enquiry-phone"></label><input id="enquiry-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="30" required aria-describedby="enquiry-phone-error"><p class="enquiry-error" id="enquiry-phone-error"></p></div><div class="enquiry-field enquiry-question"><label for="enquiry-question"></label><textarea id="enquiry-question" name="question" maxlength="1000" rows="3" aria-describedby="enquiry-question-error"></textarea><p class="enquiry-error" id="enquiry-question-error"></p></div></div><p class="enquiry-privacy" id="enquiry-privacy"></p><button type="submit" class="button button-primary" id="enquiry-copy"></button><div class="enquiry-handoff" id="enquiry-handoff" hidden><a class="button button-outline" id="enquiry-viber"></a><p id="enquiry-viber-help"></p></div><p class="enquiry-status" id="enquiry-status" role="status" aria-live="polite"></p><details class="enquiry-preview" id="enquiry-preview"><summary id="enquiry-review"></summary><textarea id="enquiry-message" rows="7" readonly></textarea></details></form>`;
  document.body.appendChild(dialog);
  const $=s=>dialog.querySelector(s),form=$('#enquiry-form'),name=$('#enquiry-name'),phone=$('#enquiry-phone'),question=$('#enquiry-question'),preview=$('#enquiry-message');
  let items=[],returnFocus=null,busy=false,generation=0,copyState=null;
  function productLines(){return items.map(item=>{const p=window.OLIVECO_PRODUCTS.find(p=>p.id===item.id);return `${I.name(p)} (${I.size(p)}) × ${I.num(item.quantity)}`;});}
  function message(){return model.compose({name:name.value,phone:phone.value,question:question.value,items:productLines()},{hello:t('enquiryHello'),name:t('enquiryName'),phone:t('enquiryPhone'),products:t('enquiryProducts'),question:t('enquiryQuestion'),end:t('enquiryEnd')});}
  function refreshPreview(){preview.value=message();}
  function translate(){
    $('#enquiry-title').textContent=t('enquiryTitle');$('#enquiry-close').setAttribute('aria-label',t('enquiryClose'));
    $('#enquiry-destination').textContent=t('enquiryDestination',{number:contact.viber.number});
    $('label[for="enquiry-name"]').textContent=t('enquiryName');$('label[for="enquiry-phone"]').textContent=t('enquiryPhone');
    $('label[for="enquiry-question"]').textContent=t(items.length?'enquiryQuestionOptional':'enquiryQuestion');question.required=!items.length;
    $('#enquiry-products').hidden=!items.length;$('#enquiry-products-label').textContent=t('enquiryProducts');
    const list=$('#enquiry-product-list');list.replaceChildren();productLines().forEach(text=>{const li=document.createElement('li');li.textContent=text;list.appendChild(li);});
    $('#enquiry-privacy').textContent=t('enquiryPrivacy');$('#enquiry-copy').innerHTML=shop.icon('copy')+' '+t(busy?'enquiryCopying':'enquiryCopy');
    $('#enquiry-review').textContent=t('enquiryPreview');preview.setAttribute('aria-label',t('enquiryMessageLabel'));
    $('#enquiry-viber').href=contact.viber.href;$('#enquiry-viber').innerHTML=shop.icon('viber')+' '+t('viberContact');$('#enquiry-viber-help').textContent=t('enquiryViberHelp',{number:contact.viber.number});
    if(copyState)$('#enquiry-status').textContent=t(copyState==='copied'?'enquiryReady':'enquiryManualCopy',{number:contact.viber.number});
    for(const field of [name,phone,question])if(field.hasAttribute('aria-invalid'))setError(field,t(field===name?'enquiryNameError':field===phone?'enquiryPhoneError':'enquiryQuestionError'));
    refreshPreview();
  }
  function setError(field,text){field.setAttribute('aria-invalid','true');$('#'+field.id+'-error').textContent=text;}
  function clearErrors(){for(const field of [name,phone,question]){field.removeAttribute('aria-invalid');$('#'+field.id+'-error').textContent='';}}
  function validate(){
    clearErrors();
    if(!name.value.trim())setError(name,t('enquiryNameError'));
    if(!model.validPhone(phone.value))setError(phone,t('enquiryPhoneError'));
    if(!items.length&&!question.value.trim())setError(question,t('enquiryQuestionError'));
    const invalid=$('[aria-invalid="true"]');if(invalid){invalid.focus();return false;}return true;
  }
  function open({productIds=[],question:initialQuestion=''}={}){
    if(dialog.open)return;
    returnFocus=document.activeElement?.closest('#bag-dialog')?document.querySelector('#bag-toggle'):document.activeElement;
    const selected=shop.selection().map(item=>({id:item.id,quantity:Math.max(1,Math.min(99,Math.trunc(Number(item.quantity)||1)))}));
    const known=new Set(window.OLIVECO_PRODUCTS.map(p=>p.id));
    items=selected.concat([...new Set(Array.isArray(productIds)?productIds:[])].filter(id=>known.has(id)&&!selected.some(item=>item.id===id)).map(id=>({id,quantity:1})));
    form.reset();clearErrors();copyState=null;$('#enquiry-status').textContent='';$('#enquiry-handoff').hidden=true;$('#enquiry-preview').open=false;
    question.value=String(initialQuestion).slice(0,1000);
    document.querySelectorAll('dialog[open]').forEach(other=>other.close());
    document.dispatchEvent(new CustomEvent('oliveco:enquiry-opening'));
    translate();dialog.showModal();if(matchMedia('(max-width:700px)').matches)$('#enquiry-title').focus();else name.focus();
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy||!validate())return;
    busy=true;const current=++generation;$('#enquiry-copy').disabled=true;for(const field of [name,phone,question])field.readOnly=true;translate();const text=message();preview.value=text;
    try{await navigator.clipboard.writeText(text);if(current!==generation)return;copyState='copied';}
    catch{if(current!==generation)return;copyState='manual';$('#enquiry-preview').open=true;preview.focus();preview.select();}
    finally{if(current===generation){busy=false;for(const field of [name,phone,question])field.readOnly=false;$('#enquiry-copy').disabled=false;$('#enquiry-handoff').hidden=false;translate();if(copyState==='copied')$('#enquiry-copy').focus();}}
  });
  form.addEventListener('input',event=>{
    if(![name,phone,question].includes(event.target))return;
    event.target.removeAttribute('aria-invalid');$('#'+event.target.id+'-error').textContent='';copyState=null;$('#enquiry-status').textContent='';$('#enquiry-handoff').hidden=true;refreshPreview();
  });
  $('#enquiry-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{
    generation++;busy=false;form.reset();clearErrors();for(const field of [name,phone,question])field.readOnly=false;items=[];preview.value='';copyState=null;$('#enquiry-copy').disabled=false;$('#enquiry-status').textContent='';$('#enquiry-handoff').hidden=true;
    const target=returnFocus?.isConnected&&returnFocus.getClientRects().length?returnFocus:document.querySelector('#chat-launcher');target?.focus();
  });
  document.addEventListener('click',event=>{if(event.target.closest('[data-enquiry]'))open();});
  document.addEventListener('oliveco:enquire',event=>open(event.detail||{}));
  document.addEventListener('oliveco:language',()=>{if(dialog.open){copyState=null;$('#enquiry-status').textContent='';$('#enquiry-handoff').hidden=true;translate();}});
})();
