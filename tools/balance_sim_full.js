// 밸런스 모의 실행 (버프 전부 쓰는 플레이어). 실행: node tools/balance_sim_full.js run "[0,102,675,...]"  또는  solve "[180,1200,...초]"
// 버프를 다 쓰는 플레이어 모의 실행:
// 하루 4번 접속(첫날 60분, 이후 20분) · 접속 중 2배 부적(광고) · 탕약 ×1.5 · 운세 약간
// 영물(보유 수 · 장착 등급) · 집무실 꾸미기 · 도감 보너스가 시간에 따라 자람
// 결재 서류(2시간마다, 최대 3건) · 망자 심판(하루 5건, 70% 정답) · 파견(칸 수 × 하루 약 2.5시간치) · 오프라인(OFFLINE_RATE, 장부 한도)
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.addInitScript(()=>{localStorage.setItem('reaper_lang','ko');document.addEventListener('DOMContentLoaded',()=>{try{CLOUD.url=''}catch(e){}});});
await p.goto('file:///home/user/gameju/reaper/index.html');await p.waitForSelector('#loading',{state:'detached',timeout:20000}).catch(()=>{});await p.waitForTimeout(300);
const mode=process.argv[2], arg=JSON.parse(process.argv[3]);
const res=await p.evaluate(([mode,arg])=>{
 const DOC_SEC=[30,50,75,110,150,190,240,300,360], JUDGE_SEC=[15,25,40,60,80,105,135,165,200];
 const lerp=(pts,d)=>{for(let i=1;i<pts.length;i++){if(d<=pts[i][0]){const [d0,v0]=pts[i-1],[d1,v1]=pts[i];return v0+(v1-v0)*(d-d0)/(d1-d0);}}return pts[pts.length-1][1];};
 // 시간(일)에 따른 곱: 영물 보유(+1%씩) + 장착 영물 수확량, 꾸미기(최대 +40%), 도감(최대 +50%)
 const M=d=>(1+lerp([[0,0.03],[1,0.12],[3,0.25],[7,0.38],[14,0.47],[30,0.53]],d)+lerp([[0,0.03],[1,0.1],[3,0.17],[7,0.29],[14,0.35],[30,0.51]],d))*(1+lerp([[0,0],[0.5,0.05],[3,0.2],[7,0.32],[14,0.4]],d))*(1+lerp([[0,0],[0.3,0.1],[2,0.3],[5,0.45],[10,0.5]],d));
 const ACT=d=>2*(d<0.1?1:1.5)*1.05; // 접속 중: 2배 부적 × 탕약 × 운세
 function run(lvs,stopRank){lvs.forEach((v,i)=>RANKS[i].lv=v);const S=Game.S;S.created=0;S.kind='m';S.souls=0;S.upg={};S.rank=0;S.reborn=0;S.boostUntil=0;
  const ids=UPGRADES.map(u=>u.id);const times=[],dmg=[];let t=0,last=0,docsLast=0,judgeDay=-1;
  const inc=()=>Game.incomePerSec(true);
  const buy=()=>{for(let k=0;k<80;k++){let best=null,bv=0;const base=inc();
    for(const id of ids){const U=UPGRADES.find(u=>u.id===id);if(Game.lv(id)>=U.max)continue;const c=Game.cost(id);if(c>S.souls)continue;
     let v; if(id==='ledger'){v=c<=base*M(t/864e2)*1800?1e9:0;} else {S.upg[id]=Game.lv(id)+1;const dd=inc()-base;S.upg[id]--;v=dd/c;}
     if(v>bv){bv=v;best=id;}}
    if(!best)break;S.souls-=Game.cost(best);S.upg[best]=Game.lv(best)+1;}};
  const promo=()=>{while(Game.nextRank()&&Game.canTest()){dmg.push(30*(Game.wraithDps()+5*Game.tapDmg())*M(t/864e2));S.rank++;times.push(t);if(S.rank>=stopRank)return true;}return false;};
  const D0=[[0,60],[3,20],[6.5,20],[10,20],[14,20]], SESS=[[0,20],[4.5,20],[10,20],[14,20]];
  for(let day=0;day<60;day++){const SS=day?SESS:D0;for(let si=0;si<SS.length;si++){
   const st=(day*24+SS[si][0])*3600, dur=SS[si][1]*60, d=st/864e2;
   if(st>last){const away=st-last;S.souls+=inc()*M(d)*Math.min(away,Game.offHours()*3600)*Game.OFFLINE_RATE;
     // 파견: 칸 수 × 하루 약 2.5시간치(돌아올 때 받음)
     const slots=1+Math.floor(S.rank/2); S.souls+=inc()*M(d)*3600*1.25*slots*Math.min(away,86400)/86400;
     t=st;}
   // 결재 서류
   const nd=Math.min(3,Math.floor((st-docsLast)/7200)); if(nd>0){S.souls+=inc()*M(d)*DOC_SEC[Math.min(8,S.rank)]*nd; docsLast=nd>=3?st:docsLast+nd*7200;}
   // 망자 심판 (하루 첫 접속)
   if(judgeDay!==day){judgeDay=day;S.souls+=inc()*M(d)*JUDGE_SEC[Math.min(8,S.rank)]*(5*0.7+5*0.3*0.2);}
   buy();if(promo())return [times,dmg];
   for(let x=0;x<dur;x+=10){t=st+x+10;const dd=t/864e2;S.souls+=(inc()*10+Game.value()*1.5*3*10*0.3)*M(dd)*ACT(dd);buy();if(promo())return [times,dmg];}
   last=st+dur;}}
  return [times,dmg];}
 if(mode==='run'){const [tm,dm]=run(arg,8);return tm.map((x,i)=>[x,dm[i]]);}
 const tgt=arg, lvs=[0,1,2,3,4,5,6,7,8].map((_,i)=>i?1500+i:0);
 for(let k=1;k<=8;k++){let lo=lvs[k-1]+1,hi=2500;
  while(lo<hi){const mid=(lo+hi+1)>>1;lvs[k]=mid;for(let j=k+1;j<=8;j++)lvs[j]=4000+j;const [tm]=run(lvs,k);const tk=tm[k-1];if(tk==null||tk>tgt[k-1])hi=mid-1;else lo=mid;}
  lvs[k]=lo;}
 return lvs;},[mode,arg]);
const f=s=>{const h=s/3600;return h<1?(s/60).toFixed(0)+'분':h<48?h.toFixed(1)+'시간':(h/24).toFixed(1)+'일';};
if(mode==='run'){console.log(JSON.stringify(arg),'→',res.map(r=>f(r[0])).join(' , '));console.log('dmg',JSON.stringify(res.map(r=>+r[1].toPrecision(3))));}else console.log('lvs',JSON.stringify(res));
await b.close();})();
