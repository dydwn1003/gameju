// 스토어 스크린샷 · 헤더 합성 (참고용). raw/ 캡처에 언어별 문구를 넣어 out/ 에 저장
const {chromium}=require('playwright');const fs=require('fs');const D=__dirname;
const CAP={
 ko:[['떠도는 혼을 거두는','꼬마 저승사자','터치 한 번으로 혼령 수확'],['나만의 집무실','꾸미기','이웃 집무실에도 놀러 가요'],['영물 53종','수집','흑묘부터 SSS 신수까지'],['꺼 둬도 쑥쑥 크는','방치형 성장','끝없이 오르는 레벨'],['수습 차사에서','염라대왕까지','9단계 승진과 저승 이야기']],
 en:[['Reap wandering','souls','Tap to collect spirits'],['Decorate your','own office','Visit your neighbors too'],['Collect 53','mythical pets','From black cats to SSS beasts'],['Grows even','while offline','Endless upgrades'],['From Trainee','to King Yeomra','9 ranks & an afterlife story']],
 ja:[['さまよう魂を集める','ちびっこ死神','タップで霊を回収'],['自分だけの','執務室を飾ろう','お隣さんにも遊びに行こう'],['霊獣53種を','コレクション','黒猫からSSSの神獣まで'],['放置でも','ぐんぐん育つ','成長はどこまでも'],['見習い使者から','閻魔大王へ','9段階の昇進とあの世の物語']],
 zhs:[['收集游荡魂魄的','小小勾魂使者','轻点即可收魂'],['装饰你的','专属办公室','还能去邻居家串门'],['收集','53种灵兽','从黑猫到SSS神兽'],['离线也能','持续成长','成长永无止境'],['从见习差使','到阎罗王','9级晋升与冥府故事']],
 zht:[['收集遊蕩魂魄的','小小勾魂使者','輕點即可收魂'],['裝飾你的','專屬辦公室','還能去鄰居家串門'],['收集','53種靈獸','從黑貓到SSS神獸'],['離線也能','持續成長','成長永無止境'],['從見習差使','到閻羅王','9級晉升與冥府故事']],
};
const RAWL={ko:'ko',en:'en',ja:'ja',zhs:'zh',zht:'zh'};
const ORDER=[1,4,3,2,5];
const SIZE={ios:[1290,2796],and:[1080,1920]}; // ios = iPhone 6.9″
const TITLE={ko:['저승사자','키우기'],en:['Grim Reaper','Idle'],ja:['冥土の使者を','育てよう'],zhs:['冥府使者','养成记'],zht:['冥府使者','養成記']};
const TSUB={ko:'혼을 거두고 염라대왕이 되자!',en:'Reap souls & rise to King Yeomra!',ja:'魂を集めて閻魔大王を目指そう!',zhs:'收集魂魄,晋升阎罗王!',zht:'收集魂魄,晉升閻羅王!'};
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files']});const p=await b.newPage();
await p.goto('file:///home/user/gameju/reaper/index.html');await p.waitForFunction(()=>typeof SP!=='undefined');
await p.evaluate(()=>Promise.all(['700 40px Galmuri11','40px Galmuri11'].map(f=>document.fonts.load(f))));
fs.mkdirSync(D+'/out',{recursive:true});
const run=async(job)=>{const url=await p.evaluate(async j=>{
  const font=(l,sz,bold=true)=>((l.startsWith('zh')||l==='ja')?`${sz}px "WenQuanYi Zen Hei"`:`${bold?'700 ':''}${sz}px Galmuri11, "WenQuanYi Zen Hei"`);
  const load=src=>new Promise((r,e)=>{const i=new Image();i.onload=()=>r(i);i.onerror=e;i.src=src;});
  const [W,H]=j.size;const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  // 배경
  const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#2a0f2a');bg.addColorStop(0.45,'#150c26');bg.addColorStop(1,'#0b0a1c');g.fillStyle=bg;g.fillRect(0,0,W,H);
  const glow=g.createRadialGradient(W/2,H*0.12,10,W/2,H*0.12,W*0.8);glow.addColorStop(0,'rgba(200,50,60,0.35)');glow.addColorStop(1,'rgba(200,50,60,0)');g.fillStyle=glow;g.fillRect(0,0,W,H);
  let seed=j.seed;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<70;i++){const x=rnd()*W,y=rnd()*H,s=Math.ceil(rnd()*3)*(W/400);g.fillStyle=rnd()<0.5?'rgba(140,190,255,0.5)':'rgba(255,220,140,0.45)';g.fillRect(Math.round(x),Math.round(y),s,s);}
  const outlined=(t,x,y,sz,lang,fill)=>{g.font=font(lang,sz);g.textAlign='center';g.textBaseline='middle';const o=Math.max(3,sz*0.07);
    g.fillStyle='#000';g.fillText(t,x+o*0.9,y+o*1.1);g.fillStyle='#7e1f2a';for(let a=0;a<16;a++){g.fillText(t,x+Math.cos(a/16*6.283)*o,y+Math.sin(a/16*6.283)*o);}
    if(fill==='gold'){const fg=g.createLinearGradient(0,y-sz/2,0,y+sz/2);fg.addColorStop(0,'#fff3c4');fg.addColorStop(1,'#f0b13a');g.fillStyle=fg;}else g.fillStyle=fill;g.fillText(t,x,y);};
  const fitSize=(t,lang,sz,maxW)=>{g.font=font(lang,sz);const w=g.measureText(t).width;return w>maxW?Math.floor(sz*maxW/w):sz;};
  if(j.kind==='shot'){
    const capH=H*0.215, L1=j.cap[0],L2=j.cap[1],sub=j.cap[2];
    let s1=fitSize(L1,j.lang,W*0.085,W*0.9), s2=fitSize(L2,j.lang,W*0.105,W*0.9); 
    outlined(L1,W/2,capH*0.30,s1,j.lang,'#f1ecf8');outlined(L2,W/2,capH*0.30+s1*0.6+s2*0.75,s2,j.lang,'gold');
    g.font=font(j.lang,Math.round(W*0.042),false);g.fillStyle='#d8cdf0';g.textAlign='center';g.fillText(sub,W/2,capH*0.30+s1*0.6+s2*1.55+W*0.03);
    const im=await load(j.src); const top=capH+H*0.035, avail=H-top-H*0.03; let sh=avail, sw=sh*im.width/im.height; if(sw>W*0.86){sw=W*0.86;sh=sw*im.height/im.width;}
    const x=(W-sw)/2, y=top, r=W*0.045, bw=W*0.012;
    g.save();g.shadowColor='rgba(0,0,0,0.6)';g.shadowBlur=W*0.04;g.fillStyle='#e8b84a';g.beginPath();g.roundRect(x-bw,y-bw,sw+bw*2,sh+bw*2,r+bw);g.fill();g.restore();
    g.save();g.beginPath();g.roundRect(x,y,sw,sh,r);g.clip();g.imageSmoothingQuality='high';g.drawImage(im,x,y,sw,sh);g.restore();
  } else { // 가로 헤더 · 그래픽 이미지
    const sp=SP.reaper('m',8,'idle',0), sp2=SP.reaper('f',5,'idle',0); g.imageSmoothingEnabled=false;
    const k=Math.floor(H/sp.height*0.62), sx=W*0.70-sp.width*k/2, sy=H*0.56-sp.height*k/2;
    const halo=g.createRadialGradient(W*0.70,H*0.55,4,W*0.70,H*0.55,H*0.5);halo.addColorStop(0,'rgba(255,90,70,0.5)');halo.addColorStop(1,'rgba(255,90,70,0)');g.fillStyle=halo;g.fillRect(0,0,W,H);
    const k2=Math.floor(k*0.6);g.drawImage(sp2,W*0.88-sp2.width*k2/2,H*0.66-sp2.height*k2/2,sp2.width*k2,sp2.height*k2);
    g.drawImage(sp,sx,sy,sp.width*k,sp.height*k);
    const SPOT=[[0.53,0.22],[0.56,0.62],[0.84,0.20],[0.95,0.36],[0.60,0.86],[0.97,0.82]];SPOT.forEach(([px,py],i)=>{const so=SP.soul?SP.soul(i%4,0):null;if(so){const kk=Math.max(2,Math.floor(k*0.45));g.drawImage(so,W*px-so.width*kk/2,H*py-so.height*kk/2,so.width*kk,so.height*kk);}});
    const T=j.title, tx=W*0.27; let s1=fitSize(T[0],j.lang,H*0.17,W*0.46), s2=fitSize(T[1],j.lang,H*0.22,W*0.46);
    outlined(T[0],tx,H*0.30,s1,j.lang,'#f1ecf8');outlined(T[1],tx,H*0.30+s1*0.62+s2*0.72,s2,j.lang,'gold');
    g.font=font(j.lang,Math.round(fitSize(j.sub,j.lang,H*0.07,W*0.48)),false);g.fillStyle='#e6dcff';g.textAlign='center';g.fillText(j.sub,tx,H*0.30+s1*0.62+s2*1.5+H*0.06);
  }
  return c.toDataURL('image/png');},job);
  fs.writeFileSync(job.out,Buffer.from(url.split(',')[1],'base64'));};
const PLATS=(process.argv[2]||'ios,and').split(',');
for(const lang of Object.keys(CAP)){for(const plat of PLATS){for(let i=0;i<5;i++){const n=ORDER[i];
  await run({kind:'shot',lang,plat,size:SIZE[plat],cap:CAP[lang][i],src:`file://${D}/raw/${RAWL[lang]}_${plat}_${n}.png`,seed:7+i,out:`${D}/out/${plat==='ios'?'iphone':'android'}_${lang}_${i+1}.png`});}}
  if(PLATS.includes('and')){ await run({kind:'head',lang,size:[1024,500],title:TITLE[lang],sub:TSUB[lang],seed:3,out:`${D}/out/google_feature_${lang}.png`});
  await run({kind:'head',lang,size:[1920,1080],title:TITLE[lang],sub:TSUB[lang],seed:5,out:`${D}/out/header_${lang}.png`}); }
  console.log(lang,'ok');}
await b.close();})();
