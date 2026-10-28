import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const dist=fileURLToPath(new URL('./dist/',import.meta.url));
const {business}=JSON.parse(fs.readFileSync(new URL('./assistant-knowledge.json',import.meta.url),'utf8'));
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function phone(value){
  if(typeof value!=='string'||!/^\+?[0-9][0-9 ()-]{5,24}$/.test(value))throw new Error('Use a plain, confirmed contact phone number.');
  const digits=value.replace(/[ ()-]/g,'');
  return digits.startsWith('0')?'+95'+digits.slice(1):digits;
}
const contacts=(business.phones||[business.phone]).filter(Boolean).map(value=>({kind:'phone',label:'Call us',value,href:'tel:'+phone(value)}));
const viber=business.viber?{number:business.viber,international:phone(business.viber),href:'viber://chat?number='+encodeURIComponent(phone(business.viber))}:null;
if(viber)contacts.push({kind:'viber',label:'Viber',value:viber.number,href:viber.href});
if(business.email){
  if(typeof business.email!=='string'||!/^[^\s@?&]+@[^\s@?&]+\.[^\s@?&]+$/.test(business.email))throw new Error('Use a plain, confirmed contact email address.');
  contacts.push({kind:'email',label:'Email us',value:business.email,href:'mailto:'+business.email});
}
const publicContact={viber,facebook:business.facebook,phones:contacts.filter(c=>c.kind==='phone').map(c=>({number:c.value,href:c.href})),address:business.address||null};
fs.writeFileSync(path.join(dist,'contact-data.js'),'// Generated from assistant-knowledge.json by npm run build.\nwindow.OLIVECO_CONTACT='+JSON.stringify(publicContact)+';\n');
function anchor(c,compact=false){
  return `<a class="contact-link" data-contact="${c.kind}" data-contact-value="${escape(c.value)}" href="${escape(c.href)}" aria-label="${c.label}: ${escape(c.value)}"><span data-icon="${c.kind}"></span><span class="contact-link-value">${compact&&c.kind==='viber'?'Viber · ':''}${escape(c.value)}</span></a>`;
}
function contactLinks(compact=false){
  if(compact){
    const chosen=contacts.filter(c=>c.kind!=='phone'||c.value===business.phone);
    return `<div class="footer-contact-links">${chosen.map(c=>anchor(c,true)).join('')}</div>`;
  }
  let html=Object.entries({phone:'Call us',viber:'Viber',email:'Email us'}).map(([kind,label])=>{
    const group=contacts.filter(c=>c.kind===kind);
    return group.length?`<div class="contact-group"><h3 data-contact-heading="${kind}">${label}</h3><div class="contact-number-list">${group.map(c=>anchor(c)).join('')}</div></div>`:'';
  }).join('');
  if(business.address){
    const en=typeof business.address==='string'?business.address:business.address.en||business.address.my;
    const my=typeof business.address==='string'?business.address:business.address.my||business.address.en;
    html+=`<div class="contact-group contact-address"><h3 data-contact-heading="address">Address</h3><address data-contact-address data-en="${escape(en)}" data-my="${escape(my)}">${escape(en)}</address></div>`;
  }
  return `<div class="contact-details">${html}</div>`;
}
for(const page of ['index.html','shop.html']){
  const file=path.join(dist,page);
  const original=fs.readFileSync(file,'utf8');
  const rendered=original
    .replace(/<!-- contact-details -->[\s\S]*?<!-- \/contact-details -->/g,`<!-- contact-details -->${contactLinks()}<!-- /contact-details -->`)
    .replace(/<!-- footer-contacts -->[\s\S]*?<!-- \/footer-contacts -->/g,`<!-- footer-contacts -->${contactLinks(true)}<!-- /footer-contacts -->`);
  const versioned=rendered.replace(/(src|href)="([a-zA-Z0-9_/-]+\.(?:js|css))(?:\?v=[a-f0-9]+)?"/g,(_,attribute,asset)=>{
    const hash=createHash('sha256').update(fs.readFileSync(path.join(dist,asset))).digest('hex').slice(0,12);
    return `${attribute}="${asset}?v=${hash}"`;
  });
  if(versioned!==original)fs.writeFileSync(file,versioned);
}
console.log('Contact details and asset versions are current.');
