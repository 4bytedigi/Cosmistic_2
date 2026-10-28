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
  function reply(message,{language='my',context=[]}={}){
    const my=language!=='en',q=norm(message),choose=(mm,en)=>my?mm:en;
    const validContext=Array.isArray(context)?context.filter(id=>products.some(p=>p.id===id)).slice(0,4):[];
    const ranked=products.map(p=>({p,n:score(p,q)})).filter(x=>x.n>=4).sort((a,b)=>b.n-a.n);
    const followup=/\bit\b|\bthis\b|\bthese\b|ingredients|size|more detail|ဘယ်လို|ပါဝင်|ဒီပစ္စည်း|အသုံးပြု|အရွယ်|ဘာအတွက်/.test(q);
    const matches=ranked.length?ranked.slice(0,3).map(x=>x.p):followup&&validContext.length?validContext.map(id=>products.find(p=>p.id===id)):[];
    const ids=matches.map(p=>p.id);
    const response=(text,extra={})=>({text,products:ids,actions:[],context:ids.length?ids:validContext,mode:'guide',...extra});
    if(/price|cost|how much|buy|purchase|order|delivery|shipping|payment|wholesale|stock|available|ဈေး|စျေး|ဘယ်လောက်|ဝယ်|မှာယူ|ပို့ဆောင်|လက်ကား|ရနိုင်/.test(q))return response(choose('ဈေးနှုန်း၊ ပစ္စည်းရရှိနိုင်မှု၊ ပို့ဆောင်မှုနဲ့ လက်ကားအရေအတွက်ကို Oliveco အရောင်းအဖွဲ့က အတည်ပြုပေးပါမယ်။ စိတ်ဝင်စားတဲ့ပစ္စည်းတွေကို ရွေးချယ်စာရင်းထဲ ထည့်ပြီး စာရင်းကူးယူကာ Facebook မှာ ပို့မေးနိုင်ပါတယ်။ ဒီနေရာမှာ ငွေပေးချေစနစ် မရှိပါဘူး။','The Oliveco team confirms prices, stock, delivery and wholesale quantities. Add the products you like to your selection, copy the list, and share it with the seller on Facebook. No payment is taken here.'),{actions:['selection','contact']});
    if(/cure|treat|diagnos|dosage|dose|pregnan|baby|children|allerg|safe for|swallow|drink|ကုသ|ကိုယ်ဝန်|ကလေး|ဘေးကင်း|သောက်|ဘယ်နှစ်|ဓာတ်မတည့်/.test(q))return response(choose('ပစ္စည်းအချက်အလက်ကို ကူညီရှာပေးနိုင်ပါတယ်။ ဒါပေမဲ့ ရောဂါကုသမှု၊ သောက်သုံးပမာဏ၊ ကလေးနဲ့ ကိုယ်ဝန်ဆောင်အတွက် သင့်တော်မှုကို ဒီအချက်အလက်တွေနဲ့ အတည်မပြုနိုင်ပါဘူး။ မူရင်းဘူးအညွှန်းကို ဖတ်ပြီး ကျန်းမာရေးပညာရှင်နဲ့ တိုင်ပင်ပါ။','I can help identify products, but the supplied information doesn’t establish treatment, dosage, or suitability for children, pregnancy or allergies. Follow the original label and ask a qualified healthcare professional.'),{actions:['contact']});
    if(/contact|facebook|seller|ဆက်သွယ်|အရောင်း/.test(q))return response(choose('Oliveco အရောင်းအဖွဲ့ကို Facebook မှ တိုက်ရိုက်ဆက်သွယ်နိုင်ပါတယ်။ ရွေးထားတဲ့ ပစ္စည်းစာရင်းကို ကူးယူပြီး တစ်ခါတည်း ပို့မေးနိုင်ပါတယ်။','You can contact the Oliveco team directly on Facebook. Copy your selected product list and share it with them in one enquiry.'),{products:[],actions:['selection','contact']});
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
