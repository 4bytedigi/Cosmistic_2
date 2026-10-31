import test from 'node:test';
import assert from 'node:assert/strict';
import {createWindowLimiter,createChatSecurity,clientAddress} from '../chat-security.mjs';
import {createAppServer} from '../server.mjs';

test('counter windows expire independently and a new minute does not reset the hourly cap',()=>{
  let time=0;
  const limiter=createWindowLimiter({now:()=>time,capacity:2});
  const windows=[{ms:60000,max:1},{ms:3600000,max:2}];
  assert.equal(limiter.take('a',windows).allowed,true);
  assert.equal(limiter.take('a',windows).retryAfter,60);
  assert.equal(limiter.take('b',windows).allowed,true);
  assert.equal(limiter.take('c',windows).allowed,false);
  time=60001;assert.equal(limiter.take('a',windows).allowed,true);
  time=120002;assert.equal(limiter.take('a',windows).allowed,false);
  time=3600001;assert.equal(limiter.take('a',windows).allowed,true);
});

test('proxy headers are ignored unless an explicitly trusted private proxy supplies them',()=>{
  const request={headers:{'cf-connecting-ip':'198.51.100.9'},socket:{remoteAddress:'203.0.113.4'}};
  assert.equal(clientAddress(request,true),'203.0.113.4');
  request.socket.remoteAddress='::ffff:127.0.0.1';
  assert.equal(clientAddress(request,false),'127.0.0.1');
  assert.equal(clientAddress(request,true),'198.51.100.9');
  request.headers['cf-connecting-ip']='invalid';assert.equal(clientAddress(request,true),'127.0.0.1');
  request.socket.remoteAddress='2001:db8:abcd:12::1';
  const first=clientAddress(request);request.socket.remoteAddress='2001:db8:abcd:12::ffff';
  assert.equal(clientAddress(request),first);
});

test('signed chat sessions reject forged, expired and malformed cookies',()=>{
  let time=0;
  const security=createChatSecurity({env:{CHAT_SESSION_SECRET:'test-session-secret',PUBLIC_ORIGIN:'https://oliveco.test'},now:()=>time});
  const headers={},response={setHeader:(name,value)=>{headers[name]=value;}};
  assert.equal(security.session({headers:{}},response),null);
  assert.match(headers['Set-Cookie'],/HttpOnly; SameSite=Strict.*Secure/);
  const cookie=headers['Set-Cookie'].split(';')[0];
  const id=security.session({headers:{cookie}},response);assert.equal(typeof id,'string');
  const forged=cookie.slice(0,-3)+'AAA';assert.equal(security.session({headers:{cookie:forged}},response),null);
  const unicode=cookie.slice(0,-43)+'é'.repeat(43);assert.doesNotThrow(()=>security.session({headers:{cookie:unicode}},response));
  time=86400001;assert.equal(security.session({headers:{cookie}},response),null);
});

async function fixture(t,extra={}){
  const calls=[];
  const service={status:()=>({mode:'guide',aiConfigured:false}),reply:async input=>{calls.push(input);return {text:'Verified product information.',products:[],mode:'guide'};}};
  const server=createAppServer({env:{PUBLIC_ORIGIN:'http://oliveco.test',CHAT_SESSION_SECRET:'test-only',...extra},service});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
  const base='http://127.0.0.1:'+server.address().port;
  const session=await fetch(base+'/api/status');
  const cookie=session.headers.get('set-cookie').split(';')[0];
  const headers={Origin:'http://oliveco.test','Content-Type':'application/json',Cookie:cookie};
  const post=(body={message:'About Oliveco'},replace={})=>fetch(base+'/api/chat',{method:'POST',headers:{...headers,...replace},body:typeof body==='string'?body:JSON.stringify(body)});
  return {post,calls,headers,base};
}

test('chat requires the configured origin and a signed browser session',async t=>{
  const {post,calls}=await fixture(t);
  assert.equal((await post({}, {Origin:''})).status,403);
  assert.equal((await post({}, {Origin:'https://attacker.test'})).status,403);
  assert.equal((await post({}, {'Sec-Fetch-Site':'cross-site'})).status,403);
  assert.equal((await post({message:'About Oliveco'},{Cookie:'oliveco_chat=forged'})).status,403);
  const missing=await post({message:'About Oliveco'},{Cookie:''});
  assert.equal(missing.status,403);assert.ok(missing.headers.get('set-cookie'));
  assert.equal((await post({message:'About Oliveco'})).status,200);
  assert.equal(calls.length,1);assert.doesNotMatch(calls[0].clientId,/127\.0\.0\.1/);
});

test('malformed, oversized and invalid chat payloads fail before any model call',async t=>{
  const {post,calls}=await fixture(t);
  assert.equal((await post('not json')).status,400);
  assert.equal((await post({message:'x'}, {'Content-Type':'text/plain'})).status,415);
  assert.equal((await post({message:' '})).status,400);
  assert.equal((await post({message:'x'.repeat(501)})).status,400);
  assert.equal((await post({message:'hello',history:'က'.repeat(9000)})).status,413);
  assert.equal((await post({message:'hello\u0000'})).status,400);
  assert.equal(calls.length,0);
});

test('bounded Myanmar history fits the UTF-8 request budget',async t=>{
  const {post}=await fixture(t);
  const history=Array.from({length:6},()=>({role:'user',content:'က'.repeat(900)}));
  assert.equal((await post({message:'က'.repeat(500),history})).status,200);
});

test('HTTP spam limits include free answers and cannot be reset by a new cookie or spoofed IP',async t=>{
  const {post,calls,base}=await fixture(t,{CHAT_REQUESTS_PER_MINUTE:'2'});
  assert.equal((await post()).status,200);assert.equal((await post()).status,200);
  const nextSession=await fetch(base+'/api/status');
  const blocked=await post({message:'About Oliveco'},{Cookie:nextSession.headers.get('set-cookie').split(';')[0],'cf-connecting-ip':'198.51.100.42'});
  assert.equal(blocked.status,429);assert.ok(Number(blocked.headers.get('retry-after'))>0);
  assert.equal((await blocked.json()).error,'chat_rate_limited');assert.equal(calls.length,2);
});
