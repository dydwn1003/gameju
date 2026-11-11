const {execFile}=require('child_process');const L='[0,20,39,60,69,83,89,96,99]';
const E=[['꾸준히 · 의뢰 옥 0 (의뢰 안 함)',{QJ:0}],['꾸준히 · 의뢰 옥 150 (이번)',{QJ:150}],['꾸준히 · 의뢰 옥 250',{QJ:250}],['꾸준히 · 의뢰 옥 450',{QJ:450}],
['꾸준히 · 의뢰 150 + 광고 안 봄',{QJ:150,NOAD:1}],['가볍게 · 의뢰 150 (75%만 함)',{QJ:150,MODE:'casual'}],['가볍게 · 의뢰 450',{QJ:450,MODE:'casual'}],['꾸준히 · 옥 안 씀',{NOJADE:1}]];
let i=0,act=0;const out=[];const next=()=>{while(act<4&&i<E.length){const k=i++,[n,o]=E[k];act++;execFile('node',[require('path').join(__dirname,'balance_sim_full.js'),'run',L,JSON.stringify(o)],{timeout:1500000},(e,so)=>{out[k]=n+' → '+(so||'').split('\n')[0].replace(/.*→ /,'');act--;if(i>=E.length&&!act){out.forEach(x=>console.log(x));}else next();});}};next();
