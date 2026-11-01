import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createAssistant} from './assistant-service.mjs';
import {createChatSecurity} from './chat-security.mjs';
const project=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(project,'dist');
const MAX_BODY_BYTES=24000;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const context=vm.createContext({window:{},Intl});
for(const file of ['products.js','prices.js','i18n.js','assistant-engine.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const catalogue=context.window.OLIVECO_PRODUCTS;
const guide=context.window.OlivecoGuide;
const info=context.window.OlivecoI18n;
const knowledge=JSON.parse(fs.readFileSync(path.join(project,'assistant-knowledge.json'),'utf8'));
const assistant=createAssistant({products:catalogue,guide,info,pricing:context.window.OLIVECO_PRICING,knowledge});
const json=(res,code,body)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body))};
function readJson(req){
  return new Promise((resolve,reject)=>{
    const chunks=[];let bytes=0;
    const cleanup=()=>{req.off('data',data);req.off('end',end);req.off('error',fail);req.off('aborted',aborted);};
    const fail=error=>{cleanup();reject(error);};
    const aborted=()=>fail(new Error('Aborted request'));
    const data=chunk=>{
      bytes+=chunk.length;
      if(bytes>MAX_BODY_BYTES){fail(Object.assign(new Error('Too large'),{status:413}));req.resume();return;}
      chunks.push(chunk);
    };
    const end=()=>{cleanup();try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch(error){reject(error);}};
    req.on('data',data);req.on('end',end);req.on('error',fail);req.on('aborted',aborted);
  });
}

export function createAppServer({env=process.env,service=assistant}={}){
const port=Number(env.PORT||4173);
const allowedOrigins=new Set([`http://localhost:${port}`,`http://127.0.0.1:${port}`]);
if(env.PUBLIC_ORIGIN)allowedOrigins.add(new URL(env.PUBLIC_ORIGIN).origin);
const security=createChatSecurity({env});
async function chat(req,res){
  const origin=req.headers.origin;
  if(!origin||!allowedOrigins.has(origin)||req.headers['sec-fetch-site']==='cross-site'){json(res,403,{error:'origin_not_allowed'});return}
  const clientId=security.identify(req);
  const quota=security.allow(clientId),globalQuota=security.allowGlobal();
  if(!quota.allowed||!globalQuota.allowed){const retryAfter=Math.max(quota.retryAfter||0,globalQuota.retryAfter||0);res.setHeader('Retry-After',retryAfter);json(res,429,{error:'chat_rate_limited',retryAfter});return}
  if(!/^application\/json(?:\s*;|$)/i.test(String(req.headers['content-type']||''))){json(res,415,{error:'json_required'});return}
  const sessionId=security.session(req,res);
  if(!sessionId){json(res,403,{error:'chat_session_required'});return}
  const sessionQuota=security.allow('session:'+sessionId);
  if(!sessionQuota.allowed){res.setHeader('Retry-After',sessionQuota.retryAfter);json(res,429,{error:'chat_rate_limited',retryAfter:sessionQuota.retryAfter});return}
  if(Number(req.headers['content-length'])>MAX_BODY_BYTES){req.resume();json(res,413,{error:'request_too_large'});return}
  let input;try{input=await readJson(req)}catch(error){if(!res.destroyed)json(res,error.status||400,{error:error.status===413?'request_too_large':'invalid_request'});return}
  if(!input||typeof input.message!=='string'||!input.message.trim()||input.message.length>500||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(input.message)){json(res,400,{error:'invalid_question'});return}
  const language=input.language==='en'?'en':'my';
  if(res.destroyed)return;
  const controller=new AbortController();
  const disconnect=()=>{if(!res.writableFinished)controller.abort();};
  res.once('close',disconnect);
  try{
    const result=await service.reply({message:input.message.trim(),language,context:input.context,history:input.history,clientId,signal:controller.signal});
    if(!res.destroyed)json(res,200,result);
  }finally{res.off('close',disconnect);}
}
const server=http.createServer({maxHeaderSize:8192,requestTimeout:15000,headersTimeout:10000},async(req,res)=>{
  // Aborted/oversized bodies may emit transport errors after parsing has stopped.
  req.on('error',()=>{});
  res.on('error',()=>{});
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','SAMEORIGIN');
  let name;try{name=decodeURIComponent(new URL(req.url,`http://localhost:${port}`).pathname)}catch{res.writeHead(400);res.end('Bad request');return}
  if(name==='/api/chat'&&req.method==='POST'){try{await chat(req,res)}catch{if(!res.headersSent&&!res.destroyed)json(res,500,{error:'chat_unavailable'})}return}
  if(name==='/api/status'&&req.method==='GET'){security.session(req,res);json(res,200,service.status());return}
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end('Method not allowed');return}
  if(name==='/shop/'){res.writeHead(308,{'Location':'/shop'+new URL(req.url,`http://localhost:${port}`).search});res.end();return}
  if(name==='/__qa/mobile'){const requested=Number(new URL(req.url,`http://localhost:${port}`).searchParams.get('width')||390);const width=[320,360,375,390,430,768,1440].includes(requested)?requested:390;const html=`<!doctype html><html><head><title>Oliveco ${width}px preview</title><style>body{margin:0;display:flex;justify-content:center;background:#d5dccb}iframe{width:${width}px;height:844px;border:0;flex-shrink:0;background:white}</style></head><body><iframe title="Oliveco ${width}px preview" src="/"></iframe></body></html>`;res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return}
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name==='/shop'?'/shop.html':name==='/our-story'?'/our-story.html':name));
  if(!file.startsWith(root+path.sep)||name.includes('\\')){res.writeHead(403);res.end('Forbidden');return}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end('Not found');return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data)});
});
return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1';
  createAppServer().listen(port,host,()=>console.log(`Oliveco: http://${host}:${port}\nAssistant: ${assistant.status().aiConfigured?'AI provider configured':'Local product guide — API key not configured'}`));
}
