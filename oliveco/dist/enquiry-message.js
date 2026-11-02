(function(root){
  'use strict';
  const digits=value=>String(value).normalize('NFKC').replace(/[၀-၉]/g,d=>String('၀၁၂၃၄၅၆၇၈၉'.indexOf(d)));
  const phone=value=>digits(value).trim().replace(/[\s().-]/g,'');
  const validPhone=value=>/^\+?[0-9]{7,15}$/.test(phone(value))&&!/^\+?0+$/.test(phone(value));
  const clean=(value,max)=>String(value||'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').trim().slice(0,max);
  function compose({name,phone:contactPhone,question,items=[]},labels){
    return [labels.hello,`${labels.name}: ${clean(name,80).replace(/\s+/g,' ')}`,`${labels.phone}: ${phone(contactPhone)}`,items.length?labels.products+':\n'+items.map(item=>'- '+clean(item,250)).join('\n'):'',clean(question,1000)?labels.question+':\n'+clean(question,1000):'',labels.end].filter(Boolean).join('\n\n');
  }
  function copyAndOpen(text,{copy,open}){
    let copied;
    try{copied=Promise.resolve(copy(text)).then(()=>true,()=>false);}
    catch{copied=Promise.resolve(false);}
    // An external-app link must run inside the original click, even if copy is denied.
    try{open();}catch{/* The visible Viber link remains available for another attempt. */}
    return copied;
  }
  root.OlivecoEnquiryMessage={phone,validPhone,compose,copyAndOpen};
})(typeof window==='undefined'?globalThis:window);
