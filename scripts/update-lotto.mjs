import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,'..');
const DATA=path.join(ROOT,'data','lotto.json');
const API='https://api.taiwanlottery.com/TLCAPIWeB/Lottery/Lotto649Result';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pad=n=>String(n).padStart(2,'0');
const monthKey=(d)=>`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}`;
const addMonths=(d,n)=>new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+n,1));
const validDraw=a=>Array.isArray(a)&&new Set(a).size===6&&a.every(n=>Number.isInteger(n)&&n>=1&&n<=49);
async function fetchMonth(month){
  const url=`${API}?period=&month=${encodeURIComponent(month)}&pageNum=1&pageSize=50&_=${Date.now()}`;
  let last;
  for(let i=0;i<3;i++){
    try{
      const c=new AbortController();const t=setTimeout(()=>c.abort(),15000);
      const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'lotto-analysis-web/1.0'},signal:c.signal});clearTimeout(t);
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const j=await r.json();const rows=j?.content?.lotto649Res;if(!Array.isArray(rows))throw new Error('Unexpected API payload');
      return rows.map(item=>{
        const raw=Array.from(item.drawNumberAppear||item.drawNumberSize||[]).map(Number);
        const draw=[...new Set(raw.slice(0,6))].sort((a,b)=>a-b);
        const special=Number(raw[6]);
        return {period:item.period?String(item.period):null,date:item.lotteryDate?String(item.lotteryDate).slice(0,10):null,draw,special:Number.isInteger(special)&&special>=1&&special<=49&&!draw.includes(special)?special:null};
      }).filter(r=>validDraw(r.draw));
    }catch(e){last=e;if(i<2)await sleep(1000*(i+1));}
  }
  throw last;
}
function key(r){return r.period?`p:${r.period}`:`d:${r.date}|${r.draw.join('-')}`}
function merge(a,b){const m=new Map();for(const r of [...a,...b])m.set(key(r),r);return [...m.values()].sort((x,y)=>(x.date||'').localeCompare(y.date||'')||(x.period||'').localeCompare(y.period||''));}
function pctDist(records,fn,keys){const c=Object.fromEntries(keys.map(k=>[String(k),0]));for(const r of records){const k=String(fn(r.draw));if(k in c)c[k]++;}const n=records.length;return Object.fromEntries(Object.entries(c).map(([k,v])=>[k,n?v/n*100:0]));}
function span(d){return Math.max(...d)-Math.min(...d)}
function sum(d){return d.reduce((a,b)=>a+b,0)}
function spanLabel(d){const s=span(d);if(s<=13)return'5–13';if(s<=22)return'14–22';if(s<=31)return'23–31';if(s<=40)return'32–40';return'41–48'}
function tailKinds(d){return new Set(d.map(n=>n%10)).size}
function oddCount(d){return d.filter(n=>n%2).length}
function overdue20(records){const last=Array(50).fill(-1);records.forEach((r,i)=>r.draw.forEach(n=>last[n]=i));const i=records.length;const out=[];for(let n=1;n<=49;n++)if((i-1)-last[n]>=20)out.push(n);return out}
let old={recent:[]};try{old=JSON.parse(fs.readFileSync(DATA,'utf8'))}catch{}
let records=Array.isArray(old.records)?old.records.filter(r=>validDraw(r.draw)):[];
const now=new Date();const current=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));
if(records.length<500){
  let cursor=current;let empty=0;
  for(let i=0;i<84&&records.length<500;i++){
    const rows=await fetchMonth(monthKey(cursor));records=merge(records,rows);empty=rows.length?0:empty+1;if(empty>=4&&records.length===0)throw new Error('No lottery data returned');cursor=addMonths(cursor,-1);await sleep(120);
  }
}else{
  for(const offset of [0,-1]){records=merge(records,await fetchMonth(monthKey(addMonths(current,offset))));await sleep(120)}
}
records=records.slice(-500);
if(!records.length)throw new Error('No valid records');
const latest=records.at(-1);const out={updatedAt:new Date().toISOString(),recordCount:records.length,latest:{...latest,span:span(latest.draw),sum:sum(latest.draw)},stats:{spanPct:pctDist(records,spanLabel,['5–13','14–22','23–31','32–40','41–48']),tailKindsPct:pctDist(records,tailKinds,[1,2,3,4,5,6]),oddPct:pctDist(records,oddCount,[0,1,2,3,4,5,6])},overdue20:overdue20(records),recent:records.slice(-10).reverse().map(r=>({...r,span:span(r.draw),sum:sum(r.draw)})),records};
fs.writeFileSync(DATA,JSON.stringify(out,null,2)+'\n');
console.log(`Updated ${records.length} records; latest=${latest.period||latest.date}`);
