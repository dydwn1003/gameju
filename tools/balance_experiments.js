const {execFile}=require('child_process');const L='[0,20,39,60,69,83,89,96,99]';
const F8=[[0,10],[2,10],[4,10],[6,10],[8,10],[10,10],[12,10],[14,10]];
const E=[['꾸준히(기준·하루4~5번 20분)',{}],['가볍게(버프X·하루4번)',{MODE:'casual'}],['소과금',{MODE:'payer'}],['과금 많이',{MODE:'whale'}],
['직장인(아침15분·저녁30분)',{SESS:[[0,15],[12,30]]}],['자주(2시간마다 10분×8)',{SESS:F8}],['몰아서(하루 1번 2시간)',{SESS:[[0,120]]}],['하루 1번 10분',{SESS:[[0,10]]}],
['광고 안 봄',{NOAD:1}],['옥 안 씀(정원·파견칸X)',{NOJADE:1}],['광고X+옥X',{NOAD:1,NOJADE:1}],['소과금+자주',{MODE:'payer',SESS:F8}],['과금+하루1번10분',{MODE:'whale',SESS:[[0,10]]}],['가볍게+하루1번10분',{MODE:'casual',SESS:[[0,10]]}]];
let i=0,act=0;const out=[];const next=()=>{while(act<4&&i<E.length){const k=i++,[n,o]=E[k];act++;execFile('node',[require('path').join(__dirname,'balance_sim_full.js'),'run',L,JSON.stringify(o)],{timeout:1500000},(e,so)=>{out[k]=n+' → '+(so||'').split('\n')[0].replace(/.*→ /,'')+(e?' (오류 '+e.message.slice(0,60)+')':'');console.log(out[k]);act--;if(i>=E.length&&!act){console.log('\n=== 순서대로 ===');out.forEach(x=>console.log(x));}else next();});}};next();
