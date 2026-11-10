const {chromium}=require('playwright');const fs=require('fs');(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file:///home/user/gameju/reaper/index.html');await p.waitForFunction(()=>typeof SP!=='undefined');
await p.evaluate(()=>document.fonts.load('700 44px Galmuri11'));await p.waitForTimeout(500);
const L=JSON.parse(process.argv[2]);const out=await p.evaluate((L)=>{
 const G=256, S=4;
 // 염라대왕 스프라이트 (투명 여백 잘라내기)
 const sp=SP.reaper('m',8,'idle',0), sg=sp.getContext('2d'), d=sg.getImageData(0,0,sp.width,sp.height).data;
 let x0=99,y0=99,x1=0,y1=0;for(let y=0;y<sp.height;y++)for(let x=0;x<sp.width;x++)if(d[(y*sp.width+x)*4+3]>0){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 const sw=x1-x0+1, sh=y1-y0+1;
 function compose(bg){
  const c=document.createElement('canvas');c.width=c.height=G;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  if(bg){const gr=g.createRadialGradient(G/2,G*0.52,8,G/2,G*0.52,G*0.72);gr.addColorStop(0,'#6b1424');gr.addColorStop(0.45,'#2a0d22');gr.addColorStop(1,'#0b0a1c');g.fillStyle=gr;g.fillRect(0,0,G,G);}
  // 뒤쪽 붉은 후광
  const halo=g.createRadialGradient(G/2,G*0.52,4,G/2,G*0.52,78);halo.addColorStop(0,'rgba(255,90,70,0.45)');halo.addColorStop(1,'rgba(255,90,70,0)');g.fillStyle=halo;g.beginPath();g.arc(G/2,G*0.52,80,0,7);g.fill();
  // 혼불 (픽셀)
  // 혼불 픽셀 그림 (. 빈칸, r 붉은 · o 주황 · y 노랑 · w 흰빛)
  const FL=['...r...','..ror..','..ror..','.rooor.','.royor.','royyyor','roywyor','.royyor.'.slice(0,7),'..rrr..'];
  const COL={r:'#c8361e',o:'#ff8a2a',y:'#ffd34a',w:'#fff6d0'};
  const flame=(fx,fy,s)=>{FL.forEach((row,yy)=>[...row].forEach((ch,xx)=>{if(COL[ch]){g.fillStyle=COL[ch];g.fillRect(fx+xx*s,fy+yy*s,s,s);}}));};
  if(bg){flame(26,104,3);flame(210,92,3);flame(40,170,2);flame(206,160,2);}
  // 스프라이트 ×3 가운데
  const k=3, w=sw*k, h=sh*k, sx=Math.round(G/2-w/2), sy=Math.round(G*0.515-h/2);
  g.drawImage(sp,x0,y0,sw,sh,sx,sy,w,h);
  // 글자
  const txt=(t,y,size)=>{g.font=L.font.replace('SZ',size);const mw=G*0.86;let w=g.measureText(t).width;if(w>mw){size=Math.floor(size*mw/w);g.font=L.font.replace('SZ',size);}g.textAlign='center';g.textBaseline='middle';
   g.fillStyle='#000';for(const [dx,dy] of [[4,4],[3,4],[4,3]])g.fillText(t,G/2+dx,y+dy);
   g.fillStyle='#7e1f2a';for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++)if(dx*dx+dy*dy<=10)g.fillText(t,G/2+dx,y+dy);
   const fg=g.createLinearGradient(0,y-size/2,0,y+size/2);fg.addColorStop(0,'#fff3c4');fg.addColorStop(1,'#f0b13a');g.fillStyle=fg;g.fillText(t,G/2,y);};
  txt(L.t1,40,L.s1||40);txt(L.t2,G-38,L.s2||40);
  // 픽셀 느낌: 알파 경계 정리
  return c;}
 const up=(c,size)=>{const o=document.createElement('canvas');o.width=o.height=size;const g=o.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(c,0,0,size,size);return o;};
 const full=up(compose(true),1024);
 // 안드로이드 적응형 아이콘 앞면: 가운데 안전 영역(약 60%) 안에 들어가게 줄여서
 const fgc=compose(false), f=document.createElement('canvas');f.width=f.height=1024;const fg=f.getContext('2d');fg.imageSmoothingEnabled=false;const s2=Math.round(1024*0.82);fg.drawImage(fgc,(1024-s2)/2,(1024-s2)/2,s2,s2);
 // 스플래시: 큰 배경 가운데에 아이콘 그림
 const sp2=document.createElement('canvas');sp2.width=sp2.height=2732;const sg2=sp2.getContext('2d');sg2.fillStyle='#0b0a1c';sg2.fillRect(0,0,2732,2732);sg2.imageSmoothingEnabled=false;sg2.drawImage(compose(true),(2732-1024)/2,(2732-1024)/2,1024,1024);
 return {full:full.toDataURL(),info:[sw,sh]};},L);
fs.writeFileSync(L.out,Buffer.from(out.full.split(',')[1],'base64'));
console.log(out.info);await b.close();})();
