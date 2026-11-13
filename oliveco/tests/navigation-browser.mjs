// Optional: PLAYWRIGHT_PACKAGE may point to an installed Playwright package.json.
// Exercises the real header journeys with an isolated, guide-only local server.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
process.env.AI_API_KEY='';process.env.OPENAI_API_KEY='';
const {createAppServer}=await import('../server.mjs');
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||import.meta.url)('playwright');
const base='http://127.0.0.1:4187';
const server=createAppServer({env:{PORT:'4187',PUBLIC_ORIGIN:base}});
await new Promise(resolve=>server.listen(4187,'127.0.0.1',resolve));
fs.mkdirSync('output/navigation',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[];
try{
  for(const width of [320,390,701,768,901,1024,1440])for(const language of ['en','my']){
    const context=await browser.newContext({viewport:{width,height:900}});
    await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
    await context.addInitScript(language=>{
      localStorage.setItem('oliveco-language',language);
      if(!sessionStorage.getItem('navigation-fixture')){
        localStorage.setItem('oliveco-bag-v1',JSON.stringify({'silk-shine':2}));
        localStorage.setItem('oliveco-saved-v1',JSON.stringify(['herbal-q10']));
        sessionStorage.setItem('navigation-fixture','1');
      }
    },language);
    const page=await context.newPage();page.setDefaultTimeout(7000);page.on('pageerror',error=>errors.push(error.message));
    for(const [path,active] of [['/','home'],['/shop','shop'],['/our-story','story']]){
      await page.goto(base+path,{waitUntil:'networkidle'});
      assert.equal(await page.locator('.header [href*="#categories"],footer [href*="#categories"]').count(),0);
      assert.deepEqual(await page.locator('.desktop-nav [data-nav]').evaluateAll(links=>links.map(a=>a.dataset.nav)),['home','shop','story','contact']);
      assert.equal(await page.locator('.desktop-nav [aria-current="page"]').getAttribute('data-nav'),active);
      assert.equal(await page.locator('.desktop-nav [data-nav="story"]').textContent(),language==='en'?'Our story':'ကျွန်ုပ်တို့အကြောင်း');
      assert.equal(await page.locator('#bag-count').textContent(),language==='en'?'2':'၂');
      const layout=await page.locator('.header').evaluate(header=>{
        const visible=el=>getComputedStyle(el).display!=='none';
        const boxes=[...header.children].filter(el=>el.matches('.wordmark,.desktop-nav,.header-actions')&&visible(el)).map(el=>{const r=el.getBoundingClientRect();return {x:r.x,right:r.right};});
        return {width:innerWidth,boxes};
      });
      for(let i=0;i<layout.boxes.length;i++){
        const b=layout.boxes[i];assert.ok(b.x>=-1&&b.right<=layout.width+1,`Header leaves viewport: ${path} ${width} ${language}`);
        if(i)assert.ok(layout.boxes[i-1].right<=b.x+1,`Header groups overlap: ${path} ${width} ${language}`);
      }
      if(await page.locator('.desktop-nav').isVisible())assert.equal(await page.locator('.desktop-nav [data-nav="story"]').isVisible(),true);
      else{
        await page.locator('#menu-toggle').click();
        assert.equal(await page.locator('#mobile-nav').isVisible(),true);
        assert.equal(await page.locator('#mobile-nav [data-nav="home"]').isVisible(),true);
        await page.keyboard.press('Escape');assert.equal(await page.locator('#mobile-nav').isVisible(),false);
      }
      assert.ok(await page.locator('#saved-toggle').isVisible()||await page.locator('#menu-toggle').isVisible(),`Saved products must be accessible: ${path} ${width}`);
    }
    if(![320,1440].includes(width)){
      if(width===390&&language==='en')await page.screenshot({path:'output/navigation/story-390.png'});
      await context.close();console.log(JSON.stringify({width,language,pages:3,header:'passed'}));continue;
    }
    await page.locator('#search-toggle').click();
    assert.equal(await page.locator('#header-search').evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#search-toggle').evaluate(el=>el===document.activeElement),true);
    await page.locator('#search-toggle').click();await page.locator('#header-search').fill('Vertex');
    await page.locator('#header-search').press('Enter');await page.waitForURL('**/shop?q=Vertex');
    assert.ok(await page.locator('#product-grid .product-card').count()>0);
    await page.goto(base+'/our-story',{waitUntil:'networkidle'});
    if(await page.locator('#saved-toggle').isVisible())await page.locator('#saved-toggle').click();
    else{await page.locator('#menu-toggle').click();await page.locator('#mobile-saved').click();}
    await page.waitForURL('**/shop?saved=1');
    assert.equal(await page.locator('#product-grid .product-card').count(),1);
    await page.goto(base+'/our-story',{waitUntil:'networkidle'});
    await page.locator('#bag-toggle').click();await page.locator('#bag-dialog').waitFor({state:'visible'});
    assert.equal(await page.locator('#bag-content .bag-item').count(),1);
    await page.locator('[data-quantity="silk-shine"][data-step="1"]').click();
    await page.goto(base+'/our-story',{waitUntil:'networkidle'});
    assert.equal(await page.locator('#bag-count').textContent(),language==='en'?'3':'၃');
    if(language==='en'&&[390,1440].includes(width))await page.screenshot({path:`output/navigation/story-${width}.png`});
    await context.close();
    console.log(JSON.stringify({width,language,pages:3,search:'passed',saved:'passed',selection:'passed'}));
  }
  assert.deepEqual(errors,[]);console.log('Navigation journeys and responsive header checks passed; no browser errors or paid AI calls.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
