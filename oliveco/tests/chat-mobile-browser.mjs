// Optional Playwright regression: node tests/chat-mobile-browser.mjs
// PLAYWRIGHT_PACKAGE can point to an existing Playwright package.json.
// The isolated server does not load .env or make paid AI calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
process.env.AI_API_KEY='';process.env.OPENAI_API_KEY='';
const {createAppServer}=await import('../server.mjs');
const {chromium,webkit}=createRequire(process.env.PLAYWRIGHT_PACKAGE||import.meta.url)('playwright');
const port=4184,base=`http://127.0.0.1:${port}`;
const server=createAppServer({env:{PORT:String(port),PUBLIC_ORIGIN:base,CHAT_SESSION_SECRET:'mobile-layout-test-only',CHAT_REQUESTS_PER_MINUTE:'60',CHAT_REQUESTS_PER_HOUR:'500'}});
await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
fs.mkdirSync('output/mobile-chat',{recursive:true});
const engines=[['edge',()=>chromium.launch({channel:'msedge',headless:true})]];
if(webkit&&fs.existsSync(webkit.executablePath()))engines.push(['webkit',()=>webkit.launch({headless:true})]);
else console.log('WebKit binary unavailable; physical iPhone keyboard behavior is not verified by this test.');
try{
  assert.equal((await (await fetch(base+'/api/status')).json()).aiConfigured,false);
  for(const [engine,launch] of engines){
    const browser=await launch();
    try{
      for(const [width,language,path,selected] of [[390,'en','/',true],[390,'my','/shop',true],[320,'my','/',false],[430,'en','/shop',false]]){
        const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
        await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
        await context.addInitScript(({language,selected})=>{
          localStorage.setItem('oliveco-language',language);
          // Model iOS: the keyboard shrinks/pans only the visual viewport.
          const viewport=new EventTarget();
          Object.assign(viewport,{height:innerHeight,width:innerWidth,offsetTop:0,offsetLeft:0,scale:1});
          Object.defineProperty(window,'visualViewport',{value:viewport});
          window.setTestViewport=(height,offsetTop=0)=>{Object.assign(viewport,{height,offsetTop});viewport.dispatchEvent(new Event('resize'));viewport.dispatchEvent(new Event('scroll'));};
          if(selected)localStorage.setItem('oliveco-bag-v1',JSON.stringify({'silk-shine':1}));
        },{language,selected});
        const page=await context.newPage(),errors=[],requests=[];
        page.setDefaultTimeout(10000);
        page.on('pageerror',error=>errors.push(error.message));
        page.on('request',request=>{if(request.url()===base+'/api/chat'&&request.method()==='POST')requests.push(request.postDataJSON());});
        await page.goto(base+path);await page.waitForLoadState('networkidle');
        // The meta viewport is parsed after the init script.
        await page.evaluate(()=>window.setTestViewport(innerHeight));
        // Use the actual selection control; the storage shape may change.
        if(selected&&!await page.locator('#selection-summary').isVisible())await page.locator('[data-add="silk-shine"]').first().click();
        await page.evaluate(()=>window.scrollTo(0,450));
        const scrollBefore=await page.evaluate(()=>scrollY);
        await page.locator('#chat-launcher').click();
        await page.locator('#chat-input').fill(language==='en'?'Tell me about Silk and Shine':'Silk and Shine အကြောင်း ပြောပြပါ');
        await page.locator('.chat-send').click();
        await page.waitForFunction(()=>document.querySelector('#chat-form').getAttribute('aria-busy')==='false');
        await page.locator('#chat-input').focus();
        await page.locator('#chat-input').fill(language==='en'?'something for my hands':'လက်မှာလိမ်းဖို့ပါ');
        for(const [height,top] of [[360,150],[300,210],[420,80]]){
          await page.evaluate(([height,top])=>window.setTestViewport(height,top),[height,top]);
          await page.waitForFunction(({height,top})=>{
            const rect=document.querySelector('#chat-panel').getBoundingClientRect();
            return rect.top>=top&&rect.bottom<=top+height&&rect.height>=height-20;
          },{height,top});
          const geometry=await page.evaluate(()=>{
            const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,left:r.left,right:r.right};};
            return {panel:rect('#chat-panel'),header:rect('.chat-header'),form:rect('#chat-form'),messages:rect('#chat-messages'),inputFont:parseFloat(getComputedStyle(document.querySelector('#chat-input')).fontSize),overflow:document.documentElement.scrollWidth>innerWidth};
          });
          await page.screenshot({path:`output/mobile-chat/${engine}-${width}-${language}-${height}.png`});
          assert.ok(geometry.panel.top>=top,JSON.stringify({height,top,...geometry}));
          assert.ok(geometry.panel.bottom<=top+height,JSON.stringify({height,top,...geometry}));
          assert.ok(geometry.header.top>=geometry.panel.top&&geometry.header.bottom<=geometry.panel.bottom);
          assert.ok(geometry.form.top>=geometry.panel.top&&geometry.form.bottom<=geometry.panel.bottom);
          assert.ok(geometry.messages.height>=80,'Keep readable space for the conversation');
          assert.ok(geometry.inputFont>=16);assert.equal(geometry.overflow,false);
          assert.equal(await page.locator('#chat-launcher').isVisible(),false);
          assert.equal(await page.locator('#selection-summary').isVisible(),false);
          assert.equal(await page.locator('#chat-suggestions').isVisible(),false);
        }
        assert.match(await page.locator('#chat-input').inputValue(),language==='en'?/hands/:/လက်/);
        // Hidden suggestions/launcher must not leave keyboard focus behind the overlay.
        await page.locator('.chat-send').focus();await page.keyboard.press('Tab');
        assert.equal(await page.locator('#chat-reset').evaluate(el=>el===document.activeElement),true);
        await page.keyboard.press('Shift+Tab');
        assert.equal(await page.locator('.chat-send').evaluate(el=>el===document.activeElement),true);
        await page.locator('#chat-messages [data-chat-product="silk-shine"]').click();
        await page.waitForFunction(()=>document.querySelectorAll('#chat-messages .user').length===2&&document.querySelector('#chat-form').getAttribute('aria-busy')==='false');
        assert.equal(await page.locator('#detail-dialog').isVisible(),false);
        assert.deepEqual(requests.at(-1).context,['silk-shine']);
        assert.ok(requests.at(-1).history.length>0);
        assert.match(requests.at(-1).message,language==='en'?/Tell me more about/ : /နည်းနည်းထပ်ပြောပြပါ/);
        assert.match(await page.locator('#chat-messages .assistant').last().innerText(),/jojoba|ဂျိုဂျိုဘာ/);
        assert.equal(await page.locator('#chat-panel').isVisible(),true);
        await page.evaluate(()=>window.setTestViewport(844));
        await page.waitForFunction(()=>getComputedStyle(document.querySelector('#chat-suggestions')).display!=='none');
        assert.equal(await page.locator('#chat-suggestions').isVisible(),true);
        await page.locator('#chat-close').click();
        assert.equal(await page.locator('#chat-launcher').isVisible(),true);
        assert.equal(await page.locator('#selection-summary').isVisible(),selected);
        assert.equal(await page.evaluate(()=>document.body.classList.contains('mobile-chat-open')),false);
        assert.ok(Math.abs(await page.evaluate(()=>scrollY)-scrollBefore)<2,'Restore page position after closing chat');
        await page.locator('#chat-launcher').click();
        assert.equal(await page.locator('#chat-messages .user').count(),2);
        assert.match(await page.locator('#chat-input').inputValue(),language==='en'?/hands/:/လက်/);
        assert.deepEqual(errors,[]);
        console.log(JSON.stringify({engine,width,language,path,selected,keyboardResizeAndPan:'passed',draftAndMessages:'preserved',closeAndRestore:'passed',pageErrors:0}));
        await context.close();
      }
      // Native viewport resize/fallback, rotation and the desktop layout.
      const context=await browser.newContext({viewport:{width:390,height:844}});
      await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
      const page=await context.newPage();
      await page.goto(base);await page.waitForLoadState('networkidle');
      await page.locator('#chat-launcher').click();
      await page.locator('#chat-input').fill('Tell me about Silk and Shine');await page.locator('.chat-send').click();
      await page.waitForFunction(()=>document.querySelector('#chat-form').getAttribute('aria-busy')==='false');
      await page.locator('[data-chat-product="silk-shine"]').click();
      await page.waitForFunction(()=>document.querySelectorAll('#chat-messages .user').length===2&&document.querySelector('#chat-form').getAttribute('aria-busy')==='false');
      assert.match(await page.locator('#chat-messages .user').last().innerText(),/^Tell me more about/,'English conversation stays English despite Myanmar UI');
      assert.equal(await page.locator('#detail-dialog').isVisible(),false);
      await page.locator('#chat-input').fill('Keep this draft');
      await page.setViewportSize({width:390,height:360});
      await page.waitForFunction(()=>{const r=document.querySelector('#chat-panel').getBoundingClientRect();return r.y>=0&&r.bottom<=360;});
      let panel=await page.locator('#chat-panel').boundingBox();
      assert.ok(panel.y>=0&&panel.y+panel.height<=360);
      await page.setViewportSize({width:700,height:320});
      await page.waitForFunction(()=>{const r=document.querySelector('#chat-panel').getBoundingClientRect();return r.y>=0&&r.bottom<=320;});
      panel=await page.locator('#chat-panel').boundingBox();assert.ok(panel.y>=0&&panel.y+panel.height<=320);
      await page.setViewportSize({width:1440,height:900});
      await page.waitForFunction(()=>!document.body.classList.contains('mobile-chat-open'));
      assert.equal(await page.locator('#chat-launcher').isVisible(),true);
      assert.equal(await page.locator('#chat-panel').getAttribute('aria-modal'),null);
      assert.equal(await page.evaluate(()=>document.body.classList.contains('mobile-chat-open')),false);
      await page.locator('#chat-panel').evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));
      panel=await page.locator('#chat-panel').boundingBox();assert.equal(panel.width,390);
      assert.equal(await page.locator('#chat-input').inputValue(),'Keep this draft');
      await page.screenshot({path:`output/mobile-chat/${engine}-desktop.png`});
      console.log(JSON.stringify({engine,nativeResize:'passed',landscape:'passed',desktop:'passed'}));
      await context.close();
    }finally{await browser.close();}
  }
}finally{await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});}
