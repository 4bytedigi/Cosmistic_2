import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createAssistant} from '../assistant-service.mjs';

const fixture=vm.createContext({window:{},Intl});
for(const name of ['products.js','prices.js','i18n.js','assistant-engine.js'])vm.runInContext(fs.readFileSync(new URL('../dist/'+name,import.meta.url),'utf8'),fixture);
const knowledge=JSON.parse(fs.readFileSync(new URL('../assistant-knowledge.json',import.meta.url),'utf8'));
const base={products:fixture.window.OLIVECO_PRODUCTS,guide:fixture.window.OlivecoGuide,info:fixture.window.OlivecoI18n,pricing:fixture.window.OLIVECO_PRICING,knowledge};
const answer={answer:'Silk & Shine lists jojoba oil; Mega-10 is a styling cream.',productIds:['silk-shine','mega-10'],contactSeller:false};
const make=(extra={})=>createAssistant({...base,env:{},...extra});
const detailsFrom=request=>JSON.parse(request.instructions.split('Relevant product details: ')[1].split('\nLast relevant')[0]);

test('ordinary needs find the relevant catalogue products in English and Myanmar',async()=>{
  const cases=[
    ['Something for dry hair','olive-tonic-60'],
    ['I would like shiny hair','silk-shine'],
    ['A product for counting cash','thai-tha'],
    ['A moisturiser for chapped lips','pure-vaseline'],
    ['Floor cleaning','vertex-pine'],
    ['ဆံပင်ခြောက်နေလို့','olive-tonic-60'],
    ['ဆံသားတောက်ပြောင်ချင်တယ်','silk-shine'],
    ['ငွေရေဖို့','thai-tha']
  ];
  for(const [message,expected] of cases){
    const result=await make().reply({message,language:'en'});
    assert.ok(result.products.includes(expected),message);
  }
});

test('more-detail requests stay with the product instead of forcing a sales handoff',async()=>{
  for(const message of ['I want more detailed information','Tell me more','အသေးစိတ် သိချင်ပါတယ်']){
    let request;
    const result=await make({env:{AI_API_KEY:'test-only-placeholder'},generate:async input=>{request=input;return {output:answer};}}).reply({message,language:'en',context:['silk-shine']});
    assert.equal(result.mode,'ai',message);
    assert.deepEqual(result.actions,[]);
    assert.match(detailsFrom(request)[0].approvedDetails,/[\u1000-\u102a]/.test(message)?/ဂျိုဂျိုဘာ/:/jojoba/);
  }
  const unknown=await make().reply({message:'Tell me more',language:'en'});
  assert.match(unknown.text,/Which product/);
  assert.deepEqual(Array.from(unknown.actions),[]);
});

test('compare them supplies both detailed sheets and keeps the previous order',async()=>{
  let request;
  const result=await make({env:{AI_API_KEY:'test-only-placeholder'},generate:async input=>{request=input;return {output:answer};}}).reply({message:'Compare them',language:'en',context:['silk-shine','mega-10']});
  assert.equal(result.mode,'ai');
  assert.deepEqual(detailsFrom(request).map(p=>p.id),['silk-shine','mega-10']);
  assert.match(detailsFrom(request)[1].approvedDetails,/style throughout the day/);
  assert.doesNotMatch(result.text,/Which product/);
});

test('a customer can select the first or second product in a follow-up',async()=>{
  const result=await make().reply({message:'Tell me more about the second one',language:'en',context:['silk-shine','mega-10']});
  assert.deepEqual(Array.from(result.products),['mega-10']);
  assert.match(result.text,/non-greasy/);
  assert.doesNotMatch(result.text,/jojoba/);
});

test('ingredient follow-ups keep the current product when the ingredient is also a product name',async()=>{
  let request;
  await make({env:{AI_API_KEY:'test-only-placeholder'},generate:async input=>{request=input;return {output:answer};}}).reply({message:'Does it contain glycerin?',language:'en',context:['herbal-lotion']});
  const relevant=detailsFrom(request);
  assert.deepEqual(relevant.map(p=>p.id),['herbal-lotion']);
  assert.match(relevant[0].approvedDetails,/glycerin/i);
});

test('a partial ingredient list never becomes a claim that an ingredient is absent',async()=>{
  const result=await make().reply({message:'Is Silk and Shine fragrance free?',language:'en'});
  assert.match(result.text,/fragrance/);
  assert.doesNotMatch(result.text,/is fragrance.free/i);
  const ingredients=await make().reply({message:'What ingredients does it have?',language:'en',context:['silk-shine']});
  assert.match(ingredients.text,/not a complete ingredient list/);
  assert.match(ingredients.text,/not confirmed absent/);
});

test('pack-size answers preserve the photographed label discrepancy and unknown tall volume',async()=>{
  const service=make();
  const lotion=await service.reply({message:'What size is it?',language:'en',context:['herbal-lotion']});
  assert.match(lotion.text,/120 g/);assert.match(lotion.text,/100 g/);assert.match(lotion.text,/confirm/);
  const tonic=await service.reply({message:'What size is it?',language:'en',context:['olive-tonic-tall']});
  assert.match(tonic.text,/volume is not stated/);
  assert.match(tonic.text,/separate glass bottle/);
});

test('conflicting facial-foam directions stay unconfirmed in chat and public product details',async()=>{
  const service=make();
  const result=await service.reply({message:'How do I use Herbal Q10?',language:'en'});
  assert.match(result.text,/Directions need confirmation/);
  assert.doesNotMatch(result.text,/leave for about 20|three uses a week/i);
  const publicProduct=base.products.find(p=>p.id==='herbal-q10');
  assert.match(publicProduct.description,/Directions need confirmation/);
  assert.match(base.info.facts['herbal-q10'][1],/Directions need confirmation/);
});

test('greetings and thanks do not incur an AI call or repeat the opening pitch',async()=>{
  const service=make({env:{AI_API_KEY:'test-only-placeholder'},generate:async()=>{throw new Error('No model needed');}});
  const hi=await service.reply({message:'Hello!',language:'en'});
  assert.match(hi.text,/Welcome to Oliveco/);assert.equal(hi.definitive,true);
  const thanks=await service.reply({message:'Thank you!',language:'en',context:['mega-10']});
  assert.match(thanks.text,/welcome/);assert.doesNotMatch(thanks.text,/What.*looking|Hello/);
  assert.equal(thanks.definitive,true);assert.deepEqual(Array.from(thanks.products),[]);
  assert.deepEqual(Array.from(thanks.context),['mega-10']);
});

test('every catalogue product has reviewed provenance and discovery terms',()=>{
  for(const p of base.products){
    const record=knowledge.products[p.id];
    assert.equal(record.catalogueRef.id,p.catalogue,p.id);
    assert.ok(record.catalogueRef.pages.includes(p.page),p.id);
    assert.ok(record.en&&record.my&&record.searchTerms.length,p.id);
  }
  assert.equal(knowledge.sources.catalogues.files.reduce((n,file)=>n+file.pages,0),29);
});

test('Gemini request uses the selected model, JSON schema, minimal thinking and output cap without network access',async()=>{
  const calls=[];
  const service=make({
    env:{AI_API_KEY:'test-only-placeholder',AI_PROVIDER:'compatible',AI_BASE_URL:'https://generativelanguage.googleapis.com/v1beta/openai',AI_MODEL:'gemini-3.1-flash-lite'},
    fetch:async(url,init)=>{
      calls.push({url:String(url),body:JSON.parse(init.body)});
      return Response.json({id:'mock-completion',object:'chat.completion',created:1,model:'gemini-3.1-flash-lite',choices:[{index:0,message:{role:'assistant',content:JSON.stringify(answer)},finish_reason:'stop'}],usage:{prompt_tokens:100,completion_tokens:30,total_tokens:130}});
    }
  });
  const result=await service.reply({message:'Compare Silk and Shine with Mega-10',language:'en'});
  assert.equal(result.mode,'ai');assert.equal(calls.length,1);
  const request=calls[0];
  assert.equal(request.url,'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
  assert.equal(request.body.model,'gemini-3.1-flash-lite');
  assert.equal(request.body.reasoning_effort,'minimal');
  assert.equal(request.body.max_tokens,700);
  assert.equal(request.body.response_format.type,'json_schema');
  assert.ok(request.body.response_format.json_schema.schema.properties.productIds);
  assert.match(request.body.messages.find(m=>m.role==='system').content,/helpful shop assistant/);
  assert.doesNotMatch(JSON.stringify(request.body),/test-only-placeholder/);
  assert.deepEqual(result.products,['silk-shine','mega-10']);
});

test('Gemini authorization and quota failures do not retry or switch to another model',async()=>{
  for(const status of [401,429]){
    const models=[];
    const service=make({
      env:{AI_API_KEY:'test-only-placeholder',AI_PROVIDER:'compatible',AI_BASE_URL:'https://generativelanguage.googleapis.com/v1beta/openai',AI_MODEL:'gemini-3.1-flash-lite'},
      fetch:async(url,init)=>{
        models.push(JSON.parse(init.body).model);
        return Response.json({error:{message:'Private provider error',code:status}},{status});
      }
    });
    const question={message:'Tell me more about Silk and Shine',language:'en'};
    const result=await service.reply(question);
    assert.equal(result.mode,'guide');assert.equal(result.warning,'ai_unavailable');
    assert.match(result.text,/jojoba/);assert.doesNotMatch(result.text,/Private provider error/);
    await service.reply({...question,clientId:'another-customer'});
    assert.deepEqual(models,['gemini-3.1-flash-lite']);
  }
});

test('repeat spam and obvious junk fall back without another paid request',async()=>{
  let calls=0,time=0;
  const service=make({env:{AI_API_KEY:'test-only-placeholder'},now:()=>time,generate:async()=>{calls++;return {output:answer};}});
  const question={message:'Tell me about Silk and Shine',language:'en',clientId:'same-address'};
  assert.equal((await service.reply(question)).mode,'ai');
  const repeated=await service.reply({...question,message:'TELL ME ABOUT SILK AND SHINE!!!',history:[{role:'user',content:'new conversation'}]});
  assert.equal(repeated.warning,'ai_rate_limited');
  assert.match(repeated.text,/jojoba/);
  for(const message of ['!?'.repeat(30),'z'.repeat(200),'stuff '.repeat(50)])await service.reply({...question,message});
  assert.equal(calls,1);
  time=30001;assert.equal((await service.reply(question)).mode,'ai');assert.equal(calls,2);
});

test('distributed bursts stop at the global minute cap while local answers still work',async()=>{
  let calls=0;
  const service=make({env:{AI_API_KEY:'test-only-placeholder'},generate:async()=>{calls++;return {output:answer};}});
  for(let i=0;i<30;i++)assert.equal((await service.reply({message:'Tell me more about Silk and Shine',language:'en',clientId:'client-'+i})).mode,'ai');
  const blocked=await service.reply({message:'Tell me more about Silk and Shine',language:'en',clientId:'another-client'});
  assert.equal(blocked.warning,'ai_budget_limited');assert.equal(calls,30);
  assert.match((await service.reply({message:'About Oliveco',language:'en',clientId:'another-client'})).text,/1986/);
});
