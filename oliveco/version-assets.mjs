import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const dist=fileURLToPath(new URL('./dist/',import.meta.url));
for(const page of ['index.html','shop.html']){
  const file=path.join(dist,page);
  const original=fs.readFileSync(file,'utf8');
  const versioned=original.replace(/(src|href)="([a-zA-Z0-9_/-]+\.(?:js|css))(?:\?v=[a-f0-9]+)?"/g,(_,attribute,asset)=>{
    const hash=createHash('sha256').update(fs.readFileSync(path.join(dist,asset))).digest('hex').slice(0,12);
    return `${attribute}="${asset}?v=${hash}"`;
  });
  if(versioned!==original)fs.writeFileSync(file,versioned);
}
console.log('Script and stylesheet URLs match their current contents.');
