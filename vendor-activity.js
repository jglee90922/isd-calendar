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
function render(m,q){
 const p=m.promotions,l=m.leads,a=m.actions,r=m.requests;
 const periodLabel={active:'진행 중',upcoming:'예정',ended:'종료',undated:'기간 미정'};
 return `<div class="overview-grid activity-grid">
 <article class="overview-card" aria-labelledby="ovPromoTitle"><div class="overview-card-head"><h3 id="ovPromoTitle">프로모션 현황</h3><span>전체 등록 ${fmt(p.total)}건</span></div><div class="activity-hero"><strong>${fmt(p.active)}<small>건 진행 중</small></strong></div>
 ${stats([['예정',p.upcoming],['종료',p.ended],['기간 미정',p.undated]])}<ul class="activity-preview">${p.featured.map(x=>`<li><span class="tag">${periodLabel[x.period]}</span><span>${esc(x.title)}</span></li>`).join('')||'<li class="muted">등록된 프로모션이 없습니다.</li>'}</ul>${footer('promotions','프로모션','캘린더와 등록 프로모션 · 기간 기준')}</article>
 <article class="overview-card" aria-labelledby="ovLeadTitle"><div class="overview-card-head"><h3 id="ovLeadTitle">Lead follow-up 현황</h3><span>리드 추적</span></div><div class="activity-hero"><strong>${fmt(l.total)}<small>건 전체 리드</small></strong><span class="${l.overdue?'attention':''}">후속 기한 경과 ${fmt(l.overdue)}건</span></div>
 <dl class="activity-stages">${Object.entries(l.stages).map(([id,label])=>`<div><dt>${label}</dt><dd><span class="stage-track" aria-hidden="true"><i style="width:${l.total?l.counts[id]/l.total*100:0}%"></i></span><b>${fmt(l.counts[id])}</b></dd></div>`).join('')}</dl>${footer('leads','리드 추적','전체 등록 리드 · 엑셀 일괄 관리')}</article>
 <article class="overview-card" aria-labelledby="ovActionTitle"><div class="overview-card-head"><h3 id="ovActionTitle">액션플랜 이행 현황</h3><span>${esc(q?q.label:'FY 설정 필요')}</span></div><div class="activity-hero"><strong>${a.rate===null?'—':fmt(a.rate)+'%'}<small>이행률</small></strong><span>${q?`전체 ${a.total}건 중 ${a.done}건 완료`:'FY 설정 후 이번 Q 과제를 집계합니다.'}</span></div>
 <div class="overview-track" role="img" aria-label="액션플랜 이행률 ${a.rate===null?'집계 없음':fmt(a.rate)+'%'}"><span style="width:${a.rate??0}%"></span></div>${stats([['예정',q?a.planned:null],['진행 중',q?a.working:null],['보류',q?a.hold:null]])}<p class="activity-status ${a.overdue?'attention':''}">${q?`기한 경과 ${a.overdue}건`:'이번 Q 미설정'}</p>${footer('actions','액션플랜','이번 Q 과제 기준')}</article>
 <article class="overview-card" aria-labelledby="ovRequestTitle"><div class="overview-card-head"><h3 id="ovRequestTitle">커뮤니케이션</h3><span>사업부 & 마케팅</span></div><div class="activity-hero"><strong>${fmt(r.open)}<small>건 미완료 요청</small></strong><span>전체 ${fmt(r.total)}건 · 완료 ${fmt(r.done)}건</span></div>
 ${stats([['사업부',r.teams.business],['마케팅',r.teams.marketing],['미분류',r.teams.unclassified]])}<div class="activity-request-note"><span>회신 대기 <b>${fmt(r.waiting)}건</b></span><span class="${r.overdue?'attention':''}">기한 경과 <b>${fmt(r.overdue)}건</b></span></div>${footer('requests','커뮤니케이션','요청 구분별 미완료 · 대응 이력 관리')}</article>
 </div>`;
}
root.VendorActivity={model,render,teams,team,promotionState};if(typeof module==='object')module.exports=root.VendorActivity;
})(typeof window==='object'?window:globalThis);
