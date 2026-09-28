/* Hash routes retain existing deep links while showing one detail at a time. */
(()=>{
'use strict';
const titles={overview:'대시보드',data:'통합입력','partner-data':'파트너 부킹 현황','promotion-data':'프로모션 입력','lead-data':'Lead follow-up 입력','action-data':'액션플랜 입력','request-data':'커뮤니케이션 입력',performance:'분기 실적',annual:'FY 전체 실적·연간 타겟',history:'5개 Q 비교',partners:'파트너 현황',promotions:'프로모션 현황',leads:'리드 추적',actions:'액션플랜 이행 현황',requests:'커뮤니케이션',contacts:'담당자·전략',mdf:'MDF 현황'};
function show(focus=false){
 const raw=location.hash.slice(1),id=Object.hasOwn(titles,raw)?raw:'overview';
 document.querySelectorAll('[data-view]').forEach(el=>{el.hidden=el.id!==id;});
 document.querySelector('#inputTabs').hidden=!document.getElementById(id)?.hasAttribute('data-input-scope');
 document.querySelectorAll('#inputTabs a').forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 document.querySelector('#detailToolbar').hidden=id==='overview';
 document.querySelector('#detailViewTitle').textContent=titles[id];
 if(focus&&!document.querySelector('#app').hidden){
  const heading=document.querySelector('#'+id+' h2');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'instant'});
 }
}
window.addEventListener('hashchange',()=>show(true));show();
})();
