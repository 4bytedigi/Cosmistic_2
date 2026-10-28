import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const fixture=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(new URL('../dist/enquiry-message.js',import.meta.url),'utf8'),fixture);
const {phone,validPhone,compose}=fixture.window.OlivecoEnquiryMessage;
const labels={hello:'Hello Oliveco',name:'Name',phone:'Callback phone',products:'Products',question:'Question',end:'Please confirm the details.'};

test('customer phone input supports Myanmar digits and international formatting',()=>{
  assert.equal(phone('၀၉ ၂၁၅၀၄၄၀'),'092150440');
  assert.equal(phone(' +95 (9) 215-0440 '),'+9592150440');
  assert.ok(validPhone('၀၉ ၂၁၅၀၄၄၀'));
  for(const value of ['', '09','00000000','a092150440','+95+92150440','1234567890123456'])assert.equal(validPhone(value),false,value);
});

test('the complete enquiry keeps callback details, product quantities and multiline questions',()=>{
  const result=compose({name:'  Test Customer  ',phone:'၀၉ ၂၁၅၀၄၄၀',question:'What is the price?\nCan I collect it?',items:['Herbal Q10+ Facial Foam (100 g) × 2','Olive Oil Plus Hair Tonic (60 ml) × 1']},labels);
  assert.match(result,/Name: Test Customer/);
  assert.match(result,/Callback phone: 092150440/);
  assert.match(result,/Facial Foam \(100 g\) × 2/);
  assert.match(result,/Hair Tonic \(60 ml\) × 1/);
  assert.match(result,/What is the price\?\nCan I collect it\?/);
  assert.doesNotMatch(result,/https?:|viber:\/\//);
});

test('message preparation bounds user text and removes control characters without dropping Myanmar',()=>{
  const result=compose({name:'မမ\u0000',phone:'092150440',question:'က'.repeat(1200),items:[]},labels);
  assert.match(result,/မမ/);
  assert.doesNotMatch(result,/\u0000/);
  assert.equal(result.match(/က/g).length,1000);
  assert.doesNotMatch(result,/Products:/);
});
