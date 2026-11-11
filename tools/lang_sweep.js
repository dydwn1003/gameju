// 언어별 전체 화면 점검: 탭·하위 메뉴·버튼 창을 모두 열고 오류 + 번역 안 된 한글을 모은다
const {chromium}=require('playwright');(async()=>{const lang=process.argv[2]||'en';const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::|supabase|favicon|CORS/i.test(m.text()))errs.push('console: '+m.text().slice(0,150));});
await p.addInitScript(l=>{localStorage.setItem('reaper_lang',l);document.addEventListener('DOMContentLoaded',()=>{try{CLOUD.url=''}catch(e){}});},lang);
await p.goto('file:///home/user/gameju/reaper/index.html');await p.waitForSelector('#loading',{state:'detached',timeout:20000});
await p.evaluate(()=>{const S=Game.S;S.kind='m';S.name='Tester';S.tut='done';S.otut='done';S.story={ch:4,q:1,intro:true};S.rank=3;S.jade=5000;S.souls=1e12;S.tickets=3;
 Object.assign(S.upg,{pen:300,step:80,call:70,hand:80,minion:14,luck:30,drill:100,ledger:20});S.flowers=S.flowers||{};Game.save();Game.apply();});
const hangul=new Map(), clip=new Map(), sent=new Map();const grab=async(where)=>{const t=await p.evaluate(()=>{const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const s=n.textContent.trim();if(!s||!/[가-힣]/.test(s))continue;const e=n.parentElement;if(!e||e.closest('script,style,[hidden]'))continue;const r=e.getBoundingClientRect();if(r.width===0&&r.height===0)continue;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')continue;out.push(s.slice(0,80));}return out;});t.forEach(s=>{if(!hangul.has(s))hangul.set(s,where);});
 const bt=await p.evaluate(()=>[...document.querySelectorAll('p, .ds, .nm, button, h2, h3, .note, .q-help, .toast, .lore, small, li, .sub, label, .tut-box p, .mem-card p, em, b')].filter(e=>{const r=e.getBoundingClientRect();if(!r.width)return false;const cs=getComputedStyle(e);return cs.display!=='none'&&cs.visibility!=='hidden';}).map(e=>e.innerText.trim().replace(/\s+/g,' ')).filter(x=>x&&x.length>1&&/[A-Za-z\u3040-\u30ff\u4e00-\u9fff가-힣]/.test(x)));bt.forEach(x=>{if(!sent.has(x))sent.set(x,where);});
 const c=await p.evaluate(()=>[...document.querySelectorAll('button, .nm, .tab, h2, h3, .sub, small, .toast span')].filter(e=>{const r=e.getBoundingClientRect();if(!r.width||r.bottom<0||r.top>innerHeight)return false;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')return false;return e.scrollWidth>e.clientWidth+2&&(cs.overflow==='hidden'||cs.textOverflow==='ellipsis'||cs.whiteSpace==='nowrap')||r.right>innerWidth+1;}).map(e=>e.textContent.trim().replace(/\s+/g,' ').slice(0,50)).filter(Boolean));c.forEach(s=>{if(!clip.has(s))clip.set(s,where);});};
const close=()=>p.evaluate(()=>{document.querySelector('#modal').classList.remove('on');document.querySelectorAll('.overlay,.tk-bg').forEach(e=>e.remove());});
const clk=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(e){e.click();return true}return false},sel);
await close();await grab('메인');
for(const t of ['grow','minion','life','pet','rank','shop']){await close();await clk(`#tabs [data-tab="${t}"]`);await p.waitForTimeout(250);await grab('탭 '+t);
 if(t==='life')for(const s of ['garden','tavern','expe','dex']){await clk(`[data-sub="${s}"]`);await p.waitForTimeout(200);await grab('생활 '+s);}
 if(t==='shop'){await p.evaluate(()=>document.querySelectorAll('.subtabs button,[data-cat],[data-scat]').forEach((b,i)=>{}));}}
await p.evaluate(()=>{try{closeSheet&&closeSheet()}catch(e){}});
for(const id of ['btn-attend','btn-boost','btn-mail','btn-notice','btn-parade','btn-quest','btn-rankb','btn-set','story-bar']){await close();await clk('#'+id);await p.waitForTimeout(350);await grab('버튼 '+id);}
// 설정 안의 버튼들
await close();await clk('#btn-set');await p.waitForTimeout(300);const setBtns=await p.evaluate(()=>[...document.querySelectorAll('#modal button')].map((b,i)=>i));
for(const i of setBtns){await close();await clk('#btn-set');await p.waitForTimeout(250);await p.evaluate(i=>{const b=[...document.querySelectorAll('#modal button')][i];if(b&&!/삭제|delete|削除|删除|로그아웃|logout|reset|초기화/i.test(b.textContent+b.id))b.click();},i);await p.waitForTimeout(300);await grab('설정 버튼 '+i);}
// 집무실
await close();await clk('#btn-office');await p.waitForTimeout(800);await grab('집무실');
for(const id of ['of-docs','of-expe','of-judge']){await close();await clk('#'+id);await p.waitForTimeout(400);await grab('집무실 '+id);}
await p.evaluate(()=>{try{leaveOffice&&leaveOffice()}catch(e){}});
// 영물 상세, 도감 상세, 구매 확인
await close();await clk('#tabs [data-tab="life"]');await clk('[data-sub="dex"]');await p.waitForTimeout(200);await clk('[data-dexi]');await p.waitForTimeout(250);await grab('도감 상세');
await close();await clk('#tabs [data-tab="minion"]');await p.waitForTimeout(200);await clk('[data-mcap]');await p.waitForTimeout(250);await grab('정원 구매 확인');
await close();await clk('#tabs [data-tab="life"]');await clk('[data-sub="expe"]');await p.waitForTimeout(200);await clk('[data-slot]');await p.waitForTimeout(250);await grab('파견 칸 구매 확인');

// 더 많은 화면: 상점 하위 분류, 펫 화면 버튼, 승진 탭, 스토리, 기억, 다시 보기, 영물 상세, 씨앗/달이기 확인
await close();await clk('#tabs [data-tab="shop"]');await p.waitForTimeout(250);
const cats=await p.evaluate(()=>[...document.querySelectorAll('#panel [data-cat],#panel [data-scat],#panel .subtabs button,#panel [data-shop]')].length);
for(let i=0;i<cats;i++){await p.evaluate(i=>{const b=[...document.querySelectorAll('#panel [data-cat],#panel [data-scat],#panel .subtabs button,#panel [data-shop]')][i];b&&b.click()},i);await p.waitForTimeout(200);await grab('상점 분류 '+i);}
await close();await clk('#tabs [data-tab="pet"]');await p.waitForTimeout(250);const pb=await p.evaluate(()=>[...document.querySelectorAll('#panel button:not([data-pull])')].length);
for(let i=0;i<Math.min(pb,12);i++){await close();await clk('#tabs [data-tab="pet"]');await p.waitForTimeout(150);await p.evaluate(i=>{const b=[...document.querySelectorAll('#panel button:not([data-pull])')][i];b&&b.click()},i);await p.waitForTimeout(250);await grab('펫 버튼 '+i);}
await close();await clk('#story-bar');await p.waitForTimeout(250);await clk('#st-mem');await p.waitForTimeout(250);await grab('기억 조각');
await close();await clk('#story-bar');await p.waitForTimeout(250);await clk('#st-replay');await p.waitForTimeout(250);await grab('다시 보기');
await close();await clk('#tabs [data-tab="life"]');await clk('[data-sub="garden"]');await p.waitForTimeout(200);await clk('[data-seed]');await p.waitForTimeout(250);await grab('씨앗 구매 확인');
await close();await clk('#tabs [data-tab="life"]');await clk('[data-sub="tavern"]');await p.waitForTimeout(200);await clk('[data-brew]');await p.waitForTimeout(250);await grab('달이기 확인');
await close();await clk('#tabs [data-tab="rank"]');await p.waitForTimeout(250);const rb=await p.evaluate(()=>[...document.querySelectorAll('#panel button')].length);
for(let i=0;i<rb;i++){await close();await clk('#tabs [data-tab="rank"]');await p.waitForTimeout(150);await p.evaluate(i=>{const b=[...document.querySelectorAll('#panel button')][i];if(b&&!/reborn|윤회|輪廻|轮回|Be reborn/.test(b.textContent+b.dataset.act))b.click()},i);await p.waitForTimeout(300);await grab('승진 버튼 '+i);}
await p.evaluate(()=>{const S=Game.S;S.parade.next=Date.now()+600e3;});await close();await clk('#btn-parade');await p.waitForTimeout(250);await grab('백귀야행 대기');
await p.evaluate(()=>{const S=Game.S;S.parade.day={d:new Date().toISOString().slice(0,10),n:5,buy:1};});await close();await clk('#btn-parade');await p.waitForTimeout(250);await grab('백귀야행 추가');
await p.screenshot({path:`qaout/sweep_${lang}.png`});
const name=/Tester/;const list=[...hangul].filter(([s])=>!name.test(s));
console.log(`[${lang}] 페이지 오류 ${errs.length}건`);errs.slice(0,8).forEach(e=>console.log('  ✗',e));
if(lang!=='ko'){console.log(`[${lang}] 번역 안 된 한글 ${list.length}건`);list.slice(0,60).forEach(([s,w])=>console.log('  ·',w,'|',s));}
console.log(`[${lang}] 잘리거나 화면 밖 글자 ${clip.size}건`);[...clip].slice(0,30).forEach(([s,w])=>console.log('  ✂',w,'|',s));
require('fs').writeFileSync(`qaout/sent_${lang}.txt`,[...sent].map(([x,w])=>w+'\t'+x).join('\n'));console.log(`[${lang}] 문장 ${sent.size}개 저장`);
await b.close();})();
