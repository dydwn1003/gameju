// 가짜 스토어(CdvPurchase)로 결제 상황 재현
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('reaper_lang','ko');
 window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'ios',Plugins:{}};
 const fin=window.__fin=[];let appr=null;window.__owned=new Set();
 const mkTx=(sid,id)=>({transactionId:id,products:[{id:sid}],finish(){fin.push(id);}});
 window.__deliver=(sid,id)=>appr(mkTx(sid,id));
 window.CdvPurchase={LogLevel:{WARNING:1},ProductType:{CONSUMABLE:'c',NON_CONSUMABLE:'n'},Platform:{APPLE_APPSTORE:'ios',GOOGLE_PLAY:'g'},ErrorCode:{PAYMENT_CANCELLED:6777006},
  store:{register(){},when(){const o={approved(f){appr=f;return o;},productUpdated(){return o;}};return o;},
   initialize(){ // 게임 준비 전에 미처리 거래 1건이 먼저 도착 (앱을 껐다 켠 상황)
     appr(mkTx('jade_100','early-1'));return Promise.resolve();},
   owned(id){return window.__owned.has(id);},get(id){return {getOffer(){return {pricingPhases:[{price:'₩1,200'}],order:async()=>{window.__orders=(window.__orders||0)+1;await new Promise(r=>setTimeout(r,800));return null;}}}};},
   restorePurchases:async()=>{await new Promise(r=>setTimeout(r,300));window.__restores=(window.__restores||0)+1;}}};
 document.addEventListener('DOMContentLoaded',()=>{try{CLOUD.url=''}catch(e){}});});
await p.goto('file:///home/user/gameju/reaper/index.html');await p.waitForSelector('#loading',{state:'detached',timeout:20000});
await p.evaluate(()=>{const S=Game.S;S.kind='m';S.name='t';S.tut='done';S.otut='done';S.story={ch:3,q:0,intro:true};S.noticeHide=Date.now()+864e5;Game.save();document.querySelector('#modal').classList.remove('on');});
await p.waitForTimeout(500);
const st=()=>p.evaluate(()=>({jade:Game.S.jade,starter:(Game.S.bought||{}).starter||0,noAds:!!Game.S.noAds,promo:(Game.S.bought||{}).promo||0,fin:window.__fin.length,txSaved:(Game.S.txDone||[]).length}));
console.log('1) 게임 준비 전에 온 거래(early-1) → 준비 뒤 지급·끝냄:',JSON.stringify(await st()));
const j0=(await st()).jade;
await p.evaluate(()=>{__deliver('jade_100','t2');__deliver('jade_100','t2');}); // 같은 거래 두 번
console.log('2) 같은 거래 두 번 → 옥 +100 한 번만:',(await st()).jade-j0);
await p.evaluate(()=>{__deliver('starter_pack','s1');__deliver('starter_pack','s2-restored');}); // 신입 패키지 두 번 (복원 거래)
console.log('3) 신입 패키지 두 거래 → 1번만 지급:',JSON.stringify(await st()));
await p.evaluate(()=>{Game.S.iapDay={day:new Date().toISOString().slice(0,10),n:{promo:1}};__deliver('promo_pack','p1');}); // 하루 한도 넘은 뒤 결제 도착
console.log('4) 승진 응원 패키지 하루 한도 뒤 결제 도착 → 그래도 지급:',JSON.stringify(await st()));
await p.evaluate(()=>{Game.S.rank=0;__deliver('chair_cc8','c1');});console.log('5) 계급 낮아도 결제한 의자 지급:',await p.evaluate(()=>Decor.owned('cc8')));
// 6) 다시 설치 (이 기기 기록 지움) → 게임 저장에 남은 기록으로 중복 막기
await p.evaluate(()=>{localStorage.removeItem('reaper_tx_done');const j=Game.S.jade;__deliver('jade_100','t2');window.__j=Game.S.jade-j;});console.log('6) 기기 기록 지운 뒤 같은 거래 → 추가 지급',await p.evaluate(()=>window.__j));
// 7) 구매 버튼 연타
const r=await p.evaluate(async()=>{const a=Native.buy('jade100'),b2=Native.buy('jade100'),c=Native.buy('jade100');return [await a,await b2,await c];});console.log('7) 연타 3번 → 주문',await p.evaluate(()=>window.__orders),'번 · 응답',JSON.stringify(r));
// 8) 구매 복원 연타
const rr=await p.evaluate(async()=>{window.__owned.add('remove_ads');const a=Native.restore(),b2=Native.restore();return [await a,await b2];});console.log('8) 복원 연타 → 실제 복원',await p.evaluate(()=>window.__restores),'번 · 광고 제거',(await st()).noAds,JSON.stringify(rr));
console.log('오류',errs.length?errs:'없음');await b.close();})();
