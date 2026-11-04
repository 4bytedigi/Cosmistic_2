import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {isIP} from 'node:net';

const bounded=(value,fallback,max)=>Math.max(1,Math.min(max,Math.floor(Number(value)||fallback)));

// Short-lived keyed hashes only: never retain customer messages or raw IPs.
// History is deliberately excluded so padding history cannot bypass duplicates.
export function createAIAbuseGuard({now=Date.now,capacity=10000}={}){
  const secret=randomBytes(32),recent=new Map();
  const digest=value=>createHmac('sha256',secret).update(value).digest('hex');
  function inspect({clientId,message,language,context=[]}){
    const normalized=String(message).normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}\p{M}\s]/gu,' ').replace(/\s+/g,' ').trim();
    const characters=Array.from(normalized.replace(/\s/g,''));
    const words=normalized.split(' ');
    const counts=new Map();
    for(const character of characters)counts.set(character,(counts.get(character)||0)+1);
    const repetitive=characters.length>=16&&Math.max(...counts.values())/characters.length>=0.9;
    if(!/[\p{L}\p{N}]/u.test(normalized)||repetitive||(words.length>=8&&new Set(words).size<=2))return {allowed:false,retryAfter:30};
    const time=now();
    for(const [id,until] of recent)if(until<=time)recent.delete(id);
    const id=digest(JSON.stringify([clientId,normalized,language,context]));
    const until=recent.get(id);
    if(until)return {allowed:false,retryAfter:Math.max(1,Math.ceil((until-time)/1000))};
    if(recent.size>=capacity)return {allowed:false,retryAfter:30};
    return {allowed:true,record:()=>recent.set(id,time+30000)};
  }
  return {inspect};
}

// Bounded, expiring counters. No messages, raw IPs or customer details are retained.
export function createWindowLimiter({now=Date.now,capacity=10000}={}) {
  const buckets=new Map();
  return {
    take(key,windows){
      const time=now();
      for(const [id,bucket] of buckets)if(bucket.expires<=time)buckets.delete(id);
      let bucket=buckets.get(key);
      if(!bucket){
        if(buckets.size>=capacity)return {allowed:false,retryAfter:60};
        bucket={windows:windows.map(w=>({count:0,until:time+w.ms})),expires:0};
        buckets.set(key,bucket);
      }
      bucket.windows.forEach((w,i)=>{if(w.until<=time){w.count=0;w.until=time+windows[i].ms;}});
      const blocked=bucket.windows.filter((w,i)=>w.count>=windows[i].max);
      bucket.expires=Math.max(...bucket.windows.map(w=>w.until));
      if(blocked.length)return {allowed:false,retryAfter:Math.max(1,Math.ceil(Math.max(...blocked.map(w=>w.until-time))/1000))};
      bucket.windows.forEach(w=>w.count++);
      return {allowed:true};
    }
  };
}

export function clientAddress(req,trustProxy=false){
  const peer=String(req.socket.remoteAddress||'unknown').replace(/^::ffff:/,'');
  // Only accept Cloudflare's identity header behind an explicitly trusted, private proxy.
  const privatePeer=peer==='::1'||/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(peer);
  const forwarded=String(req.headers['cf-connecting-ip']||'');
  const address=trustProxy&&privatePeer&&isIP(forwarded)?forwarded:peer;
  if(isIP(address)===6){
    // Use the network prefix so IPv6 privacy-address rotation cannot reset a quota.
    const url=new URL(`http://[${address}]/`).hostname.slice(1,-1);
    const parts=url.split('::');
    const left=parts[0]?parts[0].split(':'):[];
    const right=parts[1]?parts[1].split(':'):[];
    const expanded=parts.length===2?[...left,...Array(8-left.length-right.length).fill('0'),...right]:left;
    return expanded.slice(0,4).map(p=>p.padStart(4,'0')).join(':')+'::/64';
  }
  return address;
}

export function createChatSecurity({env=process.env,now=Date.now}={}){
  const secret=env.CHAT_SESSION_SECRET||randomBytes(32).toString('hex');
  const sign=value=>createHmac('sha256',secret).update(value).digest('base64url');
  const fingerprint=value=>sign(String(value)).slice(0,32);
  const limiter=createWindowLimiter({now});
  const cookieName='oliveco_chat';
  const minute=bounded(env.CHAT_REQUESTS_PER_MINUTE,20,60);
  const hour=bounded(env.CHAT_REQUESTS_PER_HOUR,120,500);
  function session(req,res){
    const value=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1);
    if(value&&value.length<220){
      const [id,expiry,signature,...extra]=value.split('.');
      const unsigned=id+'.'+expiry;
      const expected=sign(unsigned);
      if(!extra.length&&/^[A-Za-z0-9_-]{24}$/.test(id)&&Number(expiry)>now()&&Number(expiry)<=now()+86400000&&/^[A-Za-z0-9_-]{43}$/.test(signature||'')&&timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return id;
    }
    const id=randomBytes(18).toString('base64url');
    const unsigned=id+'.'+(now()+86400000);
    const secure=String(env.PUBLIC_ORIGIN||'').startsWith('https://')?'; Secure':'';
    res.setHeader('Set-Cookie',`${cookieName}=${unsigned}.${sign(unsigned)}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=86400${secure}`);
    return null;
  }
  return {
    session,
    identify:req=>fingerprint(clientAddress(req,env.TRUST_PROXY==='true')),
    allow:clientId=>limiter.take(clientId,[{ms:60000,max:minute},{ms:3600000,max:hour}]),
    allowGlobal:()=>limiter.take('global-http',[{ms:60000,max:300}])
  };
}
