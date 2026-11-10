// 스토어 스크린샷 원본 캡처 (참고용: 경로는 만들 때 쓰던 임시 폴더 기준). 실행 → raw/<lang>_<ios|and>_<n>.png
// 언어별 게임 화면 원본 캡처: raw/<lang>_<plat>_<n>.png
const {chromium}=require('playwright');const fs=require('fs');
const ST=JSON.parse(fs.readFileSync('/tmp/claude-0/-home-user-gameju/a9e510cc-9039-5350-9a0b-cbc48e014662/scratchpad/prev/qaout/state3.json','utf8'));
const NAMES={ko:'저승이',en:'Reaper',ja:'しにがみ',zh:'小鬼差'};
const PLAT={ios:{w:430,h:932},and:{w:390,h:740}}; // ios ×3 = 1290×2796 (iPhone 6.9″)
const only=process.argv[2], onlyPlat=process.argv[3];
(async()=>{fs.mkdirSync('raw',{recursive:true});const b=await chromium.launch();
for(const lang of ['ko','en','ja','zh']){ if(only&&only!==lang)continue;
 for(const [plat,vp] of Object.entries(PLAT)){ if(onlyPlat&&onlyPlat!==plat)continue;
  const st=JSON.parse(JSON.stringify(ST));Object.assign(st,{name:NAMES[lang],rank:5,souls:2.5e17,jade:12850,tickets:12,noticeHide:9e15,last:Date.now(),merchant:null,boostUntil:Date.now()+25*60e3+30e3,tut:'done',otut:'done',nickSet:true,story:{ch:4,q:0,intro:true}});
  st.upg={pen:1380,step:200,call:200,hand:200,luck:150,minion:40,drill:300,ledger:40}; // 레벨 2511 (판관)
  const c=await b.newContext({viewport:{width:vp.w,height:vp.h},deviceScaleFactor:3,locale:lang});
  await c.addInitScript(([l,s])=>{localStorage.setItem('reaper_lang',l);if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('jeoseung_v1',s);}document.addEventListener('DOMContentLoaded',()=>{try{CLOUD.url=''}catch(e){}});},[lang,JSON.stringify(st)]);
  const p=await c.newPage();await p.goto('file:///home/user/gameju/reaper/index.html');await p.waitForSelector('#loading',{state:'detached',timeout:30000});await p.addStyleTag({content:'#toasts{display:none!important}'});await p.waitForTimeout(800);
  const clean=async()=>{for(let i=0;i<4;i++){await p.evaluate(()=>{document.querySelectorAll('#modal.on [data-act=close], #modal.on .m-x').forEach(x=>x.click());document.querySelectorAll('.toast,#toast > *').forEach(t=>t.remove());});await p.waitForTimeout(150);} };
  // 모든 영물 · 소품 갖기
  await p.evaluate(()=>{const S=Game.S;PETS.forEach((pt,i)=>{S.pets[pt.id]=1+(i%5);});S.petEq=(PETS.find(x=>x.g==='SSS')||PETS[0]).id;const own=Decor.ensure().own;DECOR.filter(d=>!d.cash).forEach(d=>own[d.id]=(own[d.id]||0)+1);own.cc5=1;Game.apply();Game.save();});
  await clean();await p.waitForTimeout(2500);await clean();
  const shot=async n=>{await clean();await p.screenshot({path:`raw/${lang}_${plat}_${n}.png`});};
  await shot(1); // 마을
  await p.click('[data-tab="grow"]');await p.waitForTimeout(700);await shot(2);
  await p.click('[data-tab="pet"]');await p.waitForTimeout(900);await shot(3);
  await p.click('[data-tab="rank"]');await p.waitForTimeout(700);await shot(5);
  // 집무실 꾸미기
  await p.evaluate(()=>{const m=document.querySelector('#menu');m&&m.classList.remove('open');});await p.waitForTimeout(400);
  await p.click('#btn-office').catch(()=>{});await p.waitForTimeout(1200);await clean();
  await p.evaluate(()=>{
    const ids=['cc5',...DECOR.filter(d=>!d.cash&&!d.ex&&!d.seat).sort((a,b)=>(b.price||0)-(a.price||0)).map(d=>d.id)];
    const pts=[];let n=0;
    for(const id of ids){ if(n>=18)break; const d=Decor.D(id);
      let best=null,bs=-1; for(let gy=0;gy<70;gy++)for(let gx=0;gx<40;gx++){ if(!Scene.officeFits(id,gx,gy))continue;
        const cx=gx+d.fw/2, cy=gy+d.fh/2; let md=pts.length?Math.min(...pts.map(q=>Math.hypot(q[0]-cx,q[1]-cy))):99; md=Math.min(md,8)+Math.random()*0.5; if(md>bs){bs=md;best=[gx,gy];} }
      if(best&&Decor.place(id,best[0],best[1])){pts.push([best[0]+d.fw/2,best[1]+d.fh/2]);n++;} }
  });
  await p.waitForTimeout(1200);await shot(4);
  console.log(lang,plat,'ok');await c.close();}}
await b.close();})();
