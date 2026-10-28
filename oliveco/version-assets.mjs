import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const dist=fileURLToPath(new URL('./dist/',import.meta.url));
const {business}=JSON.parse(fs.readFileSync(new URL('./assistant-knowledge.json',import.meta.url),'utf8'));
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const contacts=[];
if(business.phone){
  if(typeof business.phone!=='string'||!/^\+?[0-9][0-9 ()-]{5,24}$/.test(business.phone))throw new Error('Use a plain, confirmed contact phone number.');
  contacts.push({kind:'phone',label:'Call us',value:business.phone,href:'tel:'+business.phone.replace(/[ ()-]/g,'')});
}
if(business.email){
  if(typeof business.email!=='string'||!/^\S+@[^\s@?&]+\.[^\s@?&]+$/.test(business.email))throw new Error('Use a plain, confirmed contact email address.');
  contacts.push({kind:'email',label:'Email us',value:business.email,href:'mailto:'+business.email});
}
function contactLinks(compact=false){
  if(!contacts.length)return '';
  return `<div class="${compact?'footer-contact-links':'contact-details'}">`+contacts.map(c=>`<a class="contact-link" data-contact="${c.kind}" data-contact-value="${escape(c.value)}" href="${escape(c.href)}" aria-label="${c.label}: ${escape(c.value)}"><span data-icon="${c.kind}"></span><span>${compact?'':`<span class="contact-link-label" data-contact-label="${c.kind}">${c.label}</span>`}<span class="contact-link-value">${escape(c.value)}</span></span></a>`).join('')+'</div>';
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
console.log('Contact links and asset versions are current.');
