(function(root){
  'use strict';
  const products=root.OLIVECO_PRODUCTS;
  const I=root.OlivecoI18n;
  const aliases={
    'herbal-q10':['q10','q 10','nature','facial foam','face wash','cleanser','neem','မျက်နှာသစ်','မျက်နှာသန့်'],
    'olive-tonic-60':['olive oil','hair tonic','green tea','သံလွင်','ဆံပင်လိမ်းဆီ'],
    'herbal-lotion':['lemon','body lotion','peter jour','သံပရာ','ကိုယ်လိမ်း'],
    'silk-shine':['silk','shine','perfect','coat oil','jojoba','ဂျိုဂျိုဘာ'],
    'pure-vaseline':['vaseline','petroleum','ဗက်စလင်း'],
    'mega-10':['mega','hair cream','ဆံပင်လိမ်းခရင်မ်'],
    'denny-original':['denny','roll on','deodorant','ချွေးနံ့'],
    'denny-blue':['denny','roll on','deodorant','ချွေးနံ့'],
    'glycerin-pure':['glycerin','glycerine','ဂလစ်ဆရင်'],
    'glycerin-sealed':['glycerin','glycerine','ဂလစ်ဆရင်'],
    'glycerin-450':['glycerin','glycerine','ဂလစ်ဆရင်'],
    'olive-tonic-tall':['olive oil','hair tonic','green tea','သံလွင်'],
    'floral-hair-oil':['floral','ပန်းရနံ့'],
    'thai-tha':['thai','moistener','paper','လက်ချောင်း','စာရွက်'],
    'vertex-pine':['pine','floor','အိမ်သုံးသန့်','ကြမ်းပြင်'],
    'vertex-1000':['vertex','toilet','အိမ်သာ'],
    'vertex-500':['vertex','toilet','အိမ်သာ'],
    'asepsotol-100':['asepsotol','antiseptic','ပိုးသတ်'],
    'asepsotol-500':['asepsotol','antiseptic','ပိုးသတ်'],
    'rc-cream':['r&c','r c','အရေပြားလိမ်းခရင်မ်'],
    'caldryl-sealed':['caldryl','calamine','ကယ်လ်ဒရိုင်း'],
    'caldryl-yellow':['caldryl','calamine','ကယ်လ်ဒရိုင်း'],
    'eusol':['eusol','ယူဆော'],
    'hydrogen-peroxide':['hydrogen','peroxide','ပါအောက်ဆိုဒ်'],
    'king-lotion':['king lotion','မိတ်ပျောက်'],
    'king-mixture':['mixture','cough','ချောင်းဆိုး'],
    'methylated-small':['methylated','spirit','မီသိုင်း','အယ်လ်ကိုဟော'],
    'methylated-500':['methylated','spirit','မီသိုင်း','အယ်လ်ကိုဟော']
  };
  const norm=s=>String(s).toLowerCase().normalize('NFKC').replace(/[’'·+.,?!၊။-]/g,' ').replace(/\s+/g,' ').trim();
  const stop=new Set(['what','which','is','are','a','the','do','you','have','for','i','me','tell','about','can','how','it','this','used','use','of','and','please','want','need','show','products','product','oliveco','with','in','to']);
  function score(p,q){let n=0;for(const a of aliases[p.id]||[])if(q.includes(norm(a)))n+=4+norm(a).length/10;for(const token of norm(p.name).split(' '))if(token.length>2&&!stop.has(token)&&q.split(' ').includes(token))n+=2;if(q.includes('500')&&p.size==='500 ml')n+=2;if((q.includes('1000')||q.includes('1 l'))&&p.size==='1,000 ml')n+=3;if(q.includes('450')&&p.size==='450 ml')n+=3;return n}
  function category(q){if(/hair|scalp|shampoo|ဆံပင်/.test(q))return'hair';if(/home|house|cleaning|အိမ်သုံး|သန့်ရှင်းရေး/.test(q))return'home';if(/medical|medicine|ဆေးဝါး/.test(q))return'medical';if(/personal|တစ်ကိုယ်ရေ/.test(q))return'personal';if(/skin|face|moisturi|အသားအရေ|အလှကုန်/.test(q))return'skin';return null}
  function reply(message,{language='my',context=[],knowledge={},pricing={}}={}){
    const my=language!=='en',q=norm(message),choose=(mm,en)=>my?mm:en;
    const validContext=Array.isArray(context)?context.filter(id=>products.some(p=>p.id===id)).slice(0,4):[];
    const ranked=products.map(p=>({p,n:score(p,q)})).filter(x=>x.n>=4).sort((a,b)=>b.n-a.n);
    const followup=/\bit\b|\bthis\b|\bthese\b|ingredients|size|more detail|ဘယ်လို|ပါဝင်|ဒီပစ္စည်း|အသုံးပြု|အရွယ်|ဘာအတွက်/.test(q);
    const matches=ranked.length?ranked.slice(0,3).map(x=>x.p):followup&&validContext.length?validContext.map(id=>products.find(p=>p.id===id)):[];
    const ids=matches.map(p=>p.id);
    const response=(text,extra={})=>({text,products:ids,actions:[],context:ids.length?ids:validContext,mode:'guide',...extra});
    if(/cure|treat|diagnos|dosage|dose|pregnan|baby|children|allerg|safe for|swallow|drink|ကုသ|ကိုယ်ဝန်|ကလေး|ဘေးကင်း|သောက်|ဘယ်နှစ်|ဓာတ်မတည့်/.test(q))return response(choose('ပစ္စည်းအချက်အလက်ကို ကူညီရှာပေးနိုင်ပါတယ်။ ရောဂါကုသမှု၊ သောက်သုံးပမာဏ၊ ကလေး၊ ကိုယ်ဝန်ဆောင်နှင့် ဓာတ်မတည့်မှုအတွက် သင့်တော်မှုကို မူရင်းဘူးအညွှန်းနှင့် ကျန်းမာရေးပညာရှင်ထံ အတည်ပြုပါ။ ပြင်ပသုံးပစ္စည်းကို မသောက်သုံးပါနှင့်။','I can help with product information, but a qualified healthcare professional should confirm treatment, dosage, and suitability for children, pregnancy or allergies. Follow the original label. Do not ingest external-use products.'),{actions:['contact'],definitive:true});
    const business=knowledge.business||{};
    const seller=business.viber?choose(`Viber ${business.viber}`,`Viber at ${business.viber}`):'Facebook';
    const salesActions=business.viber?['enquiry','contact']:['contact'];
    const policies=[
      {test:/opening|closing|\bhours\b|what time.*(?:open|close)|\bopen (?:today|now|on)|\b(?:are you|is (?:the )?(?:shop|store)) open\b|\bclose[sd]?\b|ဆိုင်ဖွင့်|ဆိုင်ပိတ်|ဖွင့်ချိန်|ပိတ်ချိန်|ဘယ်အချိန်/,key:'hours',label:['ဆိုင်ဖွင့်ပိတ်ချိန်','Opening and closing hours']},
      {test:/where.*(?:shop|store|office|located)|\baddress\b|\blocation\b|ဆိုင်လိပ်စာ|ဘယ်မှာရှိ|တည်နေရာ/,key:'address',label:['ဆိုင်လိပ်စာ','The shop address']},
      {test:/deliver|shipping|ပို့ဆောင်|အိမ်အရောက်|ပို့ခ/,key:'delivery',label:['ပို့ဆောင်နိုင်သည့် နေရာ၊ ပို့ခနှင့် ကြာချိန်','Delivery areas, fees and timing']},
      {test:/payment|\bpay\b|cash on delivery|\bcod\b|ငွေပေး|ငွေချေ/,key:'payment',label:['လက်ခံသော ငွေပေးချေနည်းများ','Accepted payment methods']},
      {test:/return|refund|exchange|ပြန်လဲ|ပြန်အမ်း/,key:'returns',label:['ပစ္စည်းပြန်လဲခြင်းနှင့် ငွေပြန်အမ်းခြင်း မူဝါဒ','Returns and refunds']},
      {test:/wholesale|minimum order|\bmoq\b|လက်ကား/,key:'wholesale',label:['လက်ကားဈေးနှုန်းနှင့် အနည်းဆုံးမှာယူရမည့် အရေအတွက်','Wholesale terms and minimum quantities']},
      {test:/\bviber\b|ဗိုက်ဘာ|ဗိုင်ဘာ/,key:'viber',label:['Viber နံပါတ်','The Viber number']},
      {test:/\bphone\b|ဖုန်း/,key:'phone',label:['ဆက်သွယ်ရန် ဖုန်းနံပါတ်','The contact phone number']},
      {test:/\bemail\b|အီးမေးလ်/,key:'email',label:['ဆက်သွယ်ရန် အီးမေးလ်','The contact email']}
    ];
    const policy=policies.find(item=>item.test.test(q));
    if(policy){
      const fact=policy.key==='phone'&&Array.isArray(business.phones)?business.phones.join(', '):business[policy.key];
      const confirmed=typeof fact==='string'?fact:fact&&(my?(fact.my||fact.en):(fact.en||fact.my));
      const text=confirmed||choose(`${policy.label[0]}ကို အတည်ပြုထားသော အချက်အလက် မရရှိသေးပါ။ Oliveco အဖွဲ့ကို ${seller} မှ ဆက်သွယ်မေးမြန်းနိုင်ပါတယ်။`,`I don't have confirmed information about ${policy.label[1].toLowerCase()} yet. Please contact the Oliveco team on ${seller} to confirm.`);
      return response(text,{products:[],actions:salesActions,definitive:matches.length===0});
    }
    if(/price|cost|how much|ဈေး|စျေး|ဘယ်လောက်/.test(q)&&matches.length===1){
      const amount=pricing.amounts?.[matches[0].id];
      if(typeof amount==='number'&&Number.isFinite(amount)&&amount>=0)return response(`${my?(I.names[matches[0].id]||matches[0].name):matches[0].name}: ${pricing.currency||'MMK'} ${new Intl.NumberFormat('en').format(amount)}`,{actions:['selection'],definitive:true});
    }
    if(/price|cost|how much|buy|purchase|order|stock|available|more detail|detailed information|talk.*(?:human|person|sales)|speak.*(?:human|person|sales)|call me|callback|ဈေး|စျေး|ဘယ်လောက်|ဝယ်|မှာယူ|ရနိုင်|အသေးစိတ်.*(?:မေး|သိ)|လူနဲ့|ပြန်ဆက်သွယ်/.test(q))return response(choose(`ဈေးနှုန်း၊ ရရှိနိုင်မှုနှင့် အသေးစိတ်အတွက် Oliveco အရောင်းအဖွဲ့ကို ${seller} မှ ဆက်သွယ်ပါ။ မေးမြန်းစာတွင် သင့်အမည်၊ ပြန်ဆက်သွယ်ရန် ဖုန်းနှင့် စိတ်ဝင်စားသော ပစ္စည်းများကို ဖြည့်ပြီး Viber မှာ ကူးထည့်ပို့နိုင်ပါတယ်။`,`For prices, availability or detailed enquiries, contact the Oliveco sales team on ${seller}. Prepare an enquiry with your name, callback phone and products, then paste and send it in Viber.`),{actions:[...salesActions,'selection'],definitive:true});
    if(/contact|facebook|seller|ဆက်သွယ်|အရောင်း/.test(q))return response(choose(`Oliveco အရောင်းအဖွဲ့ကို ${seller} မှ ဆက်သွယ်နိုင်ပါတယ်။ အမည်၊ ပြန်ဆက်သွယ်ရန် ဖုန်းနှင့် မေးမြန်းလိုသည်ကို ပြင်ဆင်ပြီး ပို့ပါ။`,`Contact the Oliveco team on ${seller}. Prepare your name, callback phone and question, then send the enquiry there.`),{products:[],actions:salesActions,definitive:true});
    if(matches.length){
      let text=matches.map(p=>`${my?(I.names[p.id]||p.name):p.name}\n${(I.facts[p.id]||[p.description,p.description])[my?0:1]}${my?'\nထုပ်ပိုးမှု: ':'\nFormat: '}${my?I.size(p):p.size}`).join('\n\n');
      if(/ingredient|ပါဝင်/.test(q)&&!matches.some(p=>['herbal-q10','silk-shine','olive-tonic-60','olive-tonic-tall','herbal-lotion'].includes(p.id)))text+='\n\n'+choose('ပါဝင်ပစ္စည်းစာရင်း အပြည့်အစုံကို အတည်ပြုဖို့ Oliveco ကို ဆက်သွယ်မေးမြန်းပါ။','Contact Oliveco to confirm the complete ingredient list.');
      if(matches.some(p=>p.category==='medical'))text+='\n\n'+choose('ဆေးဝါးအသုံးပြုမှုအတွက် မူရင်းအညွှန်းနှင့် ကျန်းမာရေးပညာရှင်၏ အကြံပြုချက်ကို လိုက်နာပါ။','For medical use, follow the original label and professional advice.');
      return response(text);
    }
    const cat=category(q);
    if(cat){const list=products.filter(p=>p.category===cat).slice(0,3);return response(choose('ဒီအမျိုးအစားထဲက ပစ္စည်းလေးတွေကို ကြည့်နိုင်ပါတယ်။ အသုံးပြုပုံကို သိချင်ရင် ပစ္စည်းနာမည်နဲ့ မေးပါ သို့မဟုတ် အသေးစိတ်ခလုတ်ကို နှိပ်ပါ။','Here are a few products in this collection. Ask about one by name, or open its details to learn what it’s for.'),{products:list.map(p=>p.id),context:list.map(p=>p.id),actions:[`category:${cat}`]});}
    if(/^(hi|hello|hey|thanks|thank you|မင်္ဂလာပါ|ကျေးဇူး)/.test(q))return response(choose('မင်္ဂလာပါ။ ဘာပစ္စည်းရှာနေပါသလဲ။ မျက်နှာသစ်ဆေး၊ ဆံပင်လိမ်းဆီ၊ တစ်ကိုယ်ရေသုံး ဒါမှမဟုတ် အိမ်သုံးပစ္စည်းအကြောင်း မေးနိုင်ပါတယ်။','Hello! What are you looking for? Ask about facial foam, hair oils, personal care or household products.'),{products:[]});
    return response(choose('အဲဒီမေးခွန်းအတွက် အတည်ပြုထားတဲ့ အချက်အလက် မရှိသေးပါဘူး။ ပစ္စည်းနာမည် သို့မဟုတ် သင်ရှာနေတဲ့ အမျိုးအစားကို ပြောပြပေးပါ။ ဥပမာ “Herbal Q10 ကို ဘာအတွက်သုံးလဲ” လို့ မေးနိုင်ပါတယ်။','I don’t have confirmed information for that question yet. Tell me a product name or the collection you’re looking for. For example: “What is Herbal Q10 used for?”'),{products:[],actions:['contact']});
  }
  root.OlivecoGuide={reply};
})(typeof window==='undefined'?globalThis:window);
