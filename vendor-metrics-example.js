// 벤더 포털 항목 구성 예시. 모든 실적은 가상이며 저장·포털 연동 없음.
(()=>{
const defs=[['tcv','TCV','',480,130,'K USD'],['acv','ACV','',410,110,'K USD'],['npacv','NPACV','New Platform ACV',320,85,'K USD'],['sourced','Partner Sourced','New Platform ACV',240,62,'K USD'],['dr','Approved DR','By Converted Date',32,9,'건'],['logos','New Logos','Partner Sourced',6,2,'개사'],['velocity','Velocity','Opps',null,null,'건'],['flex','Flex','New Platform ACV',150,40,'K USD'],['customers','# of Customers','',18,7,'개사'],['partners','# of Partners','포털 집계 기준',9,4,'개사']];
const chosen=new Set(defs.map(d=>d[0]));
const grid=document.querySelector('#portalMetrics');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function draw(){const quarter=document.querySelector('#portalPeriod').value==='quarter';grid.innerHTML=defs.filter(d=>chosen.has(d[0])).map(d=>{const n=d[quarter?3:4];return `<article class="portal-metric"><h3>${esc(d[1])}</h3><p>${esc(d[2]||'포털 실적')}</p><strong>${n===null?'—':n.toLocaleString('en-US')}<small>${n===null?'':d[5]}</small></strong><div class="muted">${n===null?'데이터 미입력':'가상 실적 · '+(quarter?'이번 Q 누적':'이번 달 누적')}</div><div class="portal-yoy">전년 동기 자료 미입력</div></article>`}).join('')||'<p class="note">표시할 항목을 하나 이상 선택하세요.</p>';document.querySelector('#portalMetricCount').textContent=`${chosen.size}개 항목 표시`;}
const options=document.querySelector('#portalOptions');options.innerHTML=defs.map(d=>`<label><input type="checkbox" value="${d[0]}" checked> ${esc(d[1])}</label>`).join('');options.onchange=e=>{if(e.target.checked)chosen.add(e.target.value);else chosen.delete(e.target.value);draw();};document.querySelector('#portalPeriod').onchange=draw;draw();
})();
