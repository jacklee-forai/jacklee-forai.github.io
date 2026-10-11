(function(){
  const $=(id)=>document.getElementById(id);
  const fmt=n=>Number(n||0).toFixed(1)+'%';
  function balls(draw,special){
    const main=(draw||[]).map(n=>`<span class="ball">${String(n).padStart(2,'0')}</span>`).join('');
    const sp=special?`<span class="ball special" title="特別號">${String(special).padStart(2,'0')}</span>`:'';
    return main+sp;
  }
  function mini(draw){return (draw||[]).map(n=>`<span class="mini-ball">${String(n).padStart(2,'0')}</span>`).join('')}
  function bars(id,labels,obj){const el=$(id);if(!el||!obj)return;el.innerHTML=labels.map(([key,label])=>{const v=Number(obj[key]||0);return `<div class="bar-row"><span>${label}</span><div class="bar"><i style="width:${Math.min(100,v)}%"></i></div><strong>${fmt(v)}</strong></div>`}).join('')}
  function render(data){
    const latest=data.latest||{};
    if($('latestBalls'))$('latestBalls').innerHTML=balls(latest.draw,latest.special);
    if($('latestMeta'))$('latestMeta').textContent=latest.period?`第 ${latest.period} 期｜${latest.date||''}`:(latest.date||'等待最新資料');
    if($('updatedAt'))$('updatedAt').textContent=data.updatedAt?new Date(data.updatedAt).toLocaleString('zh-TW',{hour12:false}):'—';
    if($('recordCount'))$('recordCount').textContent=String(data.recordCount||0);
    if($('latestSpan'))$('latestSpan').textContent=latest.span==null?'—':String(latest.span);
    if($('latestSum'))$('latestSum').textContent=latest.sum==null?'—':String(latest.sum);
    if($('overdueCount'))$('overdueCount').textContent=String((data.overdue20||[]).length);
    if($('overdueNums'))$('overdueNums').innerHTML=(data.overdue20||[]).length?(data.overdue20||[]).map(n=>`<span class="chip">${String(n).padStart(2,'0')}</span>`).join(''):'<span class="loading">目前沒有 20 期以上未開出的號碼</span>';
    bars('spanBars',[['5–13','5–13'],['14–22','14–22'],['23–31','23–31'],['32–40','32–40'],['41–48','41–48']],data.stats?.spanPct);
    bars('tailBars',[['1','1 種'],['2','2 種'],['3','3 種'],['4','4 種'],['5','5 種'],['6','6 種']],data.stats?.tailKindsPct);
    bars('oddBars',[['0','0 奇'],['1','1 奇'],['2','2 奇'],['3','3 奇'],['4','4 奇'],['5','5 奇'],['6','6 奇']],data.stats?.oddPct);
    if($('recentBody'))$('recentBody').innerHTML=(data.recent||[]).map(r=>`<tr><td>${r.period||'—'}</td><td>${r.date||'—'}</td><td><div class="mini-balls">${mini(r.draw)}</div></td><td>${r.span}</td><td>${r.sum}</td></tr>`).join('');
  }
  async function load(){
    try{const r=await fetch('./data/lotto.json?ts='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);render(await r.json());}
    catch(e){document.querySelectorAll('[data-live]').forEach(el=>el.classList.add('error'));if($('latestMeta'))$('latestMeta').textContent='即時資料更新中，稍後再重新整理';}
  }
  load();
})();
