import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {isIP} from 'node:net';
import {createAssistant} from './assistant-service.mjs';
const project=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(project,'dist');
const port=Number(process.env.PORT||4173);
const host=process.env.HOST||'127.0.0.1';
const allowedOrigins=new Set([`http://localhost:${port}`,`http://127.0.0.1:${port}`]);
if(process.env.PUBLIC_ORIGIN)allowedOrigins.add(new URL(process.env.PUBLIC_ORIGIN).origin);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const context=vm.createContext({window:{},Intl});
for(const file of ['products.js','prices.js','i18n.js','assistant-engine.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const catalogue=context.window.OLIVECO_PRODUCTS;
const guide=context.window.OlivecoGuide;
const info=context.window.OlivecoI18n;
const knowledge=JSON.parse(fs.readFileSync(path.join(project,'assistant-knowledge.json'),'utf8'));
const assistant=createAssistant({products:catalogue,guide,info,pricing:context.window.OLIVECO_PRICING,knowledge});
const json=(res,code,body)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body))};
async function readJson(req){let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>24000)throw new Error('Request is too large')}return JSON.parse(body)}
async function chat(req,res){
  const origin=req.headers.origin;
  if(origin&&!allowedOrigins.has(origin)){json(res,403,{error:'Origin not allowed'});return}
  if(!String(req.headers['content-type']||'').startsWith('application/json')){json(res,415,{error:'JSON required'});return}
  let input;try{input=await readJson(req)}catch{json(res,400,{error:'Invalid request'});return}
  if(!input||typeof input.message!=='string'||!input.message.trim()||input.message.length>500){json(res,400,{error:'A question of 1 to 500 characters is required'});return}
  const language=input.language==='en'?'en':'my';
  const proxyAddress=String(req.headers['cf-connecting-ip']||'');
  const clientId=process.env.TRUST_PROXY==='true'&&isIP(proxyAddress)?proxyAddress:req.socket.remoteAddress;
  const result=await assistant.reply({message:input.message.trim(),language,context:input.context,history:input.history,clientId});
  json(res,200,result);
}
const server=http.createServer(async(req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,`http://localhost:${port}`).pathname)}catch{res.writeHead(400);res.end('Bad request');return}
  if(name==='/api/chat'&&req.method==='POST'){try{await chat(req,res)}catch{if(!res.headersSent)json(res,500,{error:'Chat unavailable'})}return}
  if(name==='/api/status'&&req.method==='GET'){json(res,200,assistant.status());return}
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end('Method not allowed');return}
  if(name==='/shop/'){res.writeHead(308,{'Location':'/shop'+new URL(req.url,`http://localhost:${port}`).search});res.end();return}
  if(name==='/__qa/mobile'){const requested=Number(new URL(req.url,`http://localhost:${port}`).searchParams.get('width')||390);const width=[320,360,375,390,430,768,1440].includes(requested)?requested:390;const html=`<!doctype html><html><head><title>Oliveco ${width}px preview</title><style>body{margin:0;display:flex;justify-content:center;background:#d5dccb}iframe{width:${width}px;height:844px;border:0;flex-shrink:0;background:white}</style></head><body><iframe title="Oliveco ${width}px preview" src="/"></iframe></body></html>`;res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return}
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name==='/shop'?'/shop.html':name));
  if(!file.startsWith(root+path.sep)||name.includes('\\')){res.writeHead(403);res.end('Forbidden');return}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end('Not found');return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data)});
});
server.listen(port,host,()=>console.log(`Oliveco: http://${host}:${port}\nAssistant: ${assistant.status().aiConfigured?'AI provider configured':'Local product guide — API key not configured'}`));
