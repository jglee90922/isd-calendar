/* Shared activity summaries. Counts use current, unarchived vendor records. */
(function(root){
'use strict';
const C=typeof module==='object'?require('./vendor-dashboard-core.js'):root.VendorDashboardCore;
const teams={business:'사업부',marketing:'마케팅',unclassified:'미분류'};
const team=p=>Object.hasOwn(teams,p.requestTeam)?p.requestTeam:'unclassified';
const late=(p,date)=>p.status!=='done'&&C.validDate(p.due)&&p.due<date;
function promotionState(p,date){
 if(p.status==='done')return 'ended';
 if(!C.validDate(p.start)||!C.validDate(p.end)||p.end<p.start)return 'undated';
 return p.end<date?'ended':p.start>date?'upcoming':'active';
}
function model({date,q=null,promotions=[],calendarPromotions=[],leads=[],actions=[],requests=[]}){
 const promos=[...promotions,...calendarPromotions.map(p=>({...p,start:p.date}))].map(p=>({...p,period:promotionState(p,date)}));
 const promoCounts=Object.fromEntries(['active','upcoming','ended','undated'].map(s=>[s,promos.filter(p=>p.period===s).length]));
 const rank={active:0,upcoming:1,undated:2,ended:3};
 const featured=[...promos].sort((a,b)=>rank[a.period]-rank[b.period]||String(a.end||'9999').localeCompare(String(b.end||'9999'))).slice(0,2);
 const stages={new:'미접촉',contacted:'접촉',qualified:'유효 리드',opportunity:'영업 기회',won:'수주',lost:'종료'};
 const leadCounts=Object.fromEntries(Object.keys(stages).map(s=>[s,leads.filter(p=>p.stage===s).length]));
 const currentActions=q?actions.filter(p=>p.quarterStart===q.start):[];
 const actionCounts=Object.fromEntries(['planned','working','hold','done'].map(s=>[s,currentActions.filter(p=>p.status===s).length]));
 const open=requests.filter(p=>p.status!=='done');
 return {
  promotions:{total:promos.length,...promoCounts,featured},
  leads:{total:leads.length,stages,counts:leadCounts,overdue:leads.filter(p=>!['won','lost'].includes(p.stage)&&C.validDate(p.due)&&p.due<date).length},
  actions:{total:q?currentActions.length:null,...actionCounts,overdue:currentActions.filter(p=>late(p,date)).length,rate:currentActions.length?actionCounts.done/currentActions.length*100:null},
  requests:{total:requests.length,open:open.length,done:requests.length-open.length,waiting:open.filter(p=>p.status==='waiting').length,overdue:open.filter(p=>late(p,date)).length,teams:Object.fromEntries(Object.keys(teams).map(t=>[t,open.filter(p=>team(p)===t).length]))}
 };
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n===null?'—':n.toLocaleString('en-US',{maximumFractionDigits:1});
const footer=(id,label,note)=>`<div class="overview-card-footer"><span>${esc(note)}</span><a href="#${id}" aria-label="${label} 상세보기">상세보기 →</a></div>`;
const stats=rows=>`<dl class="activity-stats">${rows.map(([label,n])=>`<div><dt>${label}</dt><dd>${fmt(n)}</dd></div>`).join('')}</dl>`;
function render(m){
 const p=m.promotions,l=m.leads;
 return `<article class="overview-card" aria-labelledby="ovPromoTitle"><div class="overview-card-head"><h3 id="ovPromoTitle">프로모션 현황</h3><span>전체 ${fmt(p.total)}건</span></div><div class="activity-hero"><strong>${fmt(p.active)}<small>건 진행 중</small></strong></div>
 ${stats([['예정',p.upcoming],['종료',p.ended],['기간 미정',p.undated]])}<p class="compact-note featured-promotion">${esc(p.featured[0]?.title||'등록된 프로모션이 없습니다.')}</p>${footer('promotions','프로모션','캘린더 프로모션 포함')}</article>
 <article class="overview-card" aria-labelledby="ovLeadTitle"><div class="overview-card-head"><h3 id="ovLeadTitle">Lead follow-up</h3><span>전체 리드</span></div><div class="activity-hero"><strong>${fmt(l.total)}<small>건</small></strong></div>
 <dl class="lead-mini-stages">${Object.entries(l.stages).map(([id,label])=>`<div><dt>${label}</dt><dd>${fmt(l.counts[id])}</dd></div>`).join('')}</dl>${footer('leads','리드 추적',`후속 기한 경과 ${fmt(l.overdue)}건`)}</article>`;
}
function shortcuts(m,q,mdf,rebate){
 const a=m.actions,r=m.requests;
 return `<nav class="overview-shortcuts" aria-label="추가 관리 현황">
 <a class="overview-shortcut" href="#actions" aria-label="액션플랜 이행 현황 상세보기"><div><span>액션플랜 이행 현황</span><strong>${a.rate===null?'—':fmt(a.rate)+'%'}<small>${q?`${a.done} / ${a.total}건 완료`:'FY 설정 필요'}</small></strong></div><span class="shortcut-tail">상세보기 →</span></a>
 <a class="overview-shortcut" href="#requests" aria-label="커뮤니케이션 현황 상세보기"><div><span>커뮤니케이션 현황</span><strong>${fmt(r.open)}<small>건 미완료 · 회신 대기 ${fmt(r.waiting)}건</small></strong></div><span class="shortcut-tail">상세보기 →</span></a>
 <a class="overview-shortcut" href="#mdf" aria-label="MDF 현황 상세보기"><div><span>MDF 현황</span><strong>${mdf?.count?fmt(mdf.spent):'—'}<small>${!q?'FY 설정 필요':mdf?.count?'K USD 집행 · '+mdf.count+'건':'등록된 MDF 없음'}</small></strong></div><span class="shortcut-tail">상세보기 →</span></a>
 <a class="overview-shortcut" href="#rebate" aria-label="리베이트 현황 상세보기"><div><span>리베이트 현황</span><strong>${rebate?.count?fmt(rebate.confirmed):'—'}<small>${!q?'FY 설정 필요':rebate?.count?'K USD 확정 · '+rebate.count+'건':'등록된 리베이트 없음'}</small></strong></div><span class="shortcut-tail">상세보기 →</span></a></nav>`;
}
root.VendorActivity={model,render,shortcuts,teams,team,promotionState};if(typeof module==='object')module.exports=root.VendorActivity;
})(typeof window==='object'?window:globalThis);
