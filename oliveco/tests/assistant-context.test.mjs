import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createAssistant} from '../assistant-service.mjs';

const fixture=vm.createContext({window:{},Intl});
for(const name of ['products.js','prices.js','i18n.js','assistant-engine.js'])vm.runInContext(fs.readFileSync(new URL('../dist/'+name,import.meta.url),'utf8'),fixture);
const knowledge=JSON.parse(fs.readFileSync(new URL('../assistant-knowledge.json',import.meta.url),'utf8'));
const base={products:fixture.window.OLIVECO_PRODUCTS,guide:fixture.window.OlivecoGuide,info:fixture.window.OlivecoI18n,pricing:fixture.window.OLIVECO_PRICING,knowledge};
const catalogueFrom=request=>JSON.parse(request.instructions.split('Catalogue index: ')[1].split('\nRelevant product details:')[0]);

test('the reported ingredient and hands conversation reaches Gemini with complete facts and history',async()=>{
  const requests=[];
  const outputs=[
    {answer:'Silk & Shine lists olive oil and is for hair. Are you looking for hair or skin care?',productIds:['silk-shine'],contactSeller:false},
    {answer:'For your hands, our face and body lotion lists lanolin and mineral oils. Are your hands feeling dry?',productIds:['herbal-lotion'],contactSeller:false}
  ];
  const service=createAssistant({...base,env:{AI_API_KEY:'test-only-placeholder'},generate:async request=>{requests.push(request);return {output:outputs[requests.length-1]};}});
  const firstQuestion='do you have anything that has like olives in it ?';
  const first=await service.reply({message:firstQuestion,language:'en'});
  assert.equal(first.mode,'ai');assert.deepEqual(first.actions,[]);
  const history=[{role:'user',content:firstQuestion},{role:'assistant',content:first.text}];
  const next=await service.reply({message:'something with like oil that can help with my hands ?',language:'en',context:first.context,history});
  assert.equal(next.mode,'ai');assert.deepEqual(next.actions,[]);assert.deepEqual(next.products,['herbal-lotion']);
  assert.equal(requests.length,2);
  assert.deepEqual(requests[1].messages.slice(0,2),history);
  for(const request of requests){
    const catalogue=catalogueFrom(request);
    assert.equal(catalogue.length,28);
    assert.ok(catalogue.every(p=>typeof p.approvedDetails==='string'&&p.approvedDetails.length));
    assert.match(catalogue.find(p=>p.id==='herbal-lotion').approvedDetails,/face and body|Face & Body/);
    assert.match(catalogue.find(p=>p.id==='herbal-lotion').listedIngredients.join(' '),/mineral oil/);
    assert.match(catalogue.find(p=>p.id==='pure-vaseline').approvedDetails,/dry, rough or chapped skin/);
    assert.ok(!catalogue.find(p=>p.id==='herbal-lotion').listedIngredients.includes('olive oil'));
    assert.match(catalogue.find(p=>p.id==='herbal-q10').approvedDetails,/Directions need confirmation/);
    assert.equal(request.maxRetries,0);assert.equal(request.maxOutputTokens,700);
  }
});

test('unmatched conversational wording can use the approved catalogue rather than forcing a generic handoff',async()=>{
  let request;
  const service=createAssistant({...base,env:{AI_API_KEY:'test-only-placeholder'},generate:async input=>{request=input;return {output:{answer:'What would you like it to help with?',productIds:[],contactSeller:false}};}});
  const result=await service.reply({message:'my palms feel like sandpaper lately',language:'en'});
  assert.equal(result.mode,'ai');assert.deepEqual(result.actions,[]);
  assert.match(catalogueFrom(request).find(p=>p.id==='pure-vaseline').approvedDetails,/rough/);
});

test('Burmese and mixed-language discovery receive Myanmar instructions even with English UI selected',async()=>{
  const requests=[];
  const service=createAssistant({...base,env:{AI_API_KEY:'test-only-placeholder'},generate:async input=>{requests.push(input);return {output:{answer:'လက်အသားအရေ ခြောက်သွေ့တာအတွက် လိမ်းဖို့ ရှာနေတာလား။',productIds:['herbal-lotion'],contactSeller:false}};}});
  for(const message of ['သံလွင်ဆီပါတာရှိလား','လက်မှာလိမ်းဖို့ပါ','olive oil ပါတဲ့ဟာလိုချင်လို့']){
    const result=await service.reply({message,language:'en',clientId:message});
    assert.equal(result.mode,'ai');assert.deepEqual(result.actions,[]);
    assert.match(requests.at(-1).instructions,/Reply in natural Myanmar/);
    assert.match(requests.at(-1).instructions,/everyday Burmese/);
  }
});

test('English discovery replies in English even when the interface defaults to Myanmar',async()=>{
  let request;
  const service=createAssistant({...base,env:{AI_API_KEY:'test-only-placeholder'},generate:async input=>{request=input;return {output:{answer:'Silk & Shine lists olive oil and is a hair product.',productIds:['silk-shine'],contactSeller:false}};}});
  const result=await service.reply({message:'Anything with olives in it?',language:'my'});
  assert.equal(result.mode,'ai');assert.match(request.instructions,/Reply in English/);assert.deepEqual(result.actions,[]);
});
