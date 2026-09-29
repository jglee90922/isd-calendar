/* Dashboard view model and accessible charts, derived from the shared records. */
(function(root){
'use strict';
const C=typeof module==='object'?require('./vendor-dashboard-core.js'):root.VendorDashboardCore;
const number=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
const ratio=(a,b)=>number(a)!==null&&number(b)!==null&&b>0?a/b*100:null;
const cap=v=>v===null?0:Math.max(0,Math.min(v,100));
function model({date,settings,metrics=[],performance=[],annual=null,partners=null,booking=null}){
 const q=C.quarter(date,settings),byKey=new Map(metrics.map(p=>[p.metricId+':'+p.quarterStart,p]));
 const pair=start=>['deal_new','deal_renewal'].map(id=>byKey.get(id+':'+start)||{});
 const sheets=new Map(performance.map(p=>[p.quarterStart,p])),group=start=>sheets.get(start)||{parts:pair(start),total:C.dealTotal(pair(start)),otherActual:0,hasOther:false};
 const currentGroup=q?group(q.start):{parts:[],total:{actual:null,target:null,asOf:'',yoy:null,qoq:null},otherActual:0,hasOther:false},parts=['deal_new','deal_renewal'].map(id=>currentGroup.parts.find(p=>p.metricId===id)||{}),current=currentGroup.total,achievement=ratio(current.actual,current.target);
 const quarters=q?Array.from({length:q.q},(_,i)=>{const period=C.quarter(date,settings,i-q.q+1),total=group(period.start).total;return {...period,...total,complete:number(total.actual)!==null&&(i===q.q-1||total.asOf===period.end)};}):[];
 const completed=quarters.filter(p=>p.complete).length;
 const annualMatches=!!(q&&annual?.metricId==='deal_total');
 const manualValid=annualMatches&&number(annual.actual)!==null&&C.validDate(annual.asOf)&&annual.asOf>=q.fyStart&&annual.asOf<=date;
 const automatic=quarters.length>0&&completed===quarters.length;
 const fyActual=manualValid?annual.actual:automatic?C.total(quarters,'actual'):null;
 const target=annualMatches&&annual.mode==='set'&&number(annual.target)>0?annual.target:null;
 const registered=number(partners?.registered),active=number(partners?.active);
 return {q,booking,current,otherActual:currentGroup.otherActual,hasOther:currentGroup.hasOther,newShare:ratio(number(current.actual)!==null?parts[0].actual:null,current.actual),currentSource:q&&sheets.has(q.start)?'weekly':'aggregate',achievement,progress:cap(achievement),newActual:number(parts[0].actual),renewalActual:number(parts[1].actual),renewalShare:ratio(number(current.actual)!==null?parts[1].actual:null,current.actual),
  mixNote:number(current.actual)!==null?(current.actual===0?'집계 실적 0 · 구성 비율 없음':current.asOf+' 기준'):parts[0].asOf&&parts[1].asOf&&parts[0].asOf!==parts[1].asOf?'신규·리뉴얼 집계 기준일을 맞춰 주세요.':currentGroup.missing?'주차별 미입력 값 확인 필요':currentGroup.conflict?'동시 수정 내용 확인 필요':'신규·리뉴얼 실적 입력 필요',
  partner:{registered,active,inactive:registered!==null&&active!==null&&active<=registered?registered-active:null,rate:active!==null&&registered!==null&&active<=registered?ratio(active,registered):null,newActive:number(partners?.newActive),reactivated:number(partners?.reactivated),asOf:partners?.asOf||'',rule:partners?.rule||''},
  fy:{actual:fyActual,target,achievement:ratio(fyActual,target),mode:annualMatches?annual.mode:'pending',source:manualValid?'manual':automatic?'quarters':'missing',asOf:manualValid?annual.asOf:automatic?quarters.at(-1).asOf:'',completed,expected:quarters.length,metricMismatch:!!annual&&!annualMatches}
 };
}
const fmt=v=>number(v)===null?'—':v.toLocaleString('en-US',{maximumFractionDigits:1});
const percent=v=>v===null?'—':fmt(v)+'%';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function changes(current,base,label){const n=C.growth(current,base);return `<span>${label} <b>${n===null?'—':`${n>0?'+':n<0?'−':''}${fmt(Math.abs(n))}%`}</b></span>`;}
function render(m,activityCards=''){
 const q=m.q,p=m.partner,fy=m.fy,b=m.booking,actual=m.current.actual,target=m.current.target;
 const ringNote=!q?'FY 설정 필요':number(actual)===null?'실적 입력 필요':number(target)===null?'분기 타겟 미입력':achievementLabel(m.achievement);
 const quarterLabel=q?q.label:'이번 Q',fyLabel=q?q.fy:'현재 FY';
 const source=fy.source==='manual'?'FY 누적 입력값':fy.source==='quarters'?'이번 Q까지 자동 합산':fy.metricMismatch?'전체 합계 기준 입력 필요':q?`${fy.completed} / ${fy.expected}개 Q 집계 완료`:'FY 설정 후 집계';
 const targetLabel=fy.mode==='none'?'연간 타겟 없음':fy.target!==null?fmt(fy.target)+' K USD':'연간 타겟 미입력';
 const remaining=number(actual)!==null&&number(target)!==null?Math.max(0,target-actual):null;
 return `<div class="overview-layout">
 <article class="overview-card overview-quarter" aria-labelledby="ovQuarterTitle"><div class="overview-card-head"><h3 id="ovQuarterTitle">분기 타겟 달성률</h3><span>${esc(quarterLabel)}</span></div>
 <div class="quarter-focus"><div class="overview-ring" role="img" aria-label="분기 실적 ${fmt(actual)} K USD, 타겟 ${fmt(target)} K USD, 달성률 ${percent(m.achievement)}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-track" cx="60" cy="60" r="50"/><circle class="ring-value" cx="60" cy="60" r="50" pathLength="100" stroke-dasharray="${m.progress} 100"/></svg><div class="ring-label"><strong>${percent(m.achievement)}</strong><span>${ringNote}</span></div></div>
 <dl class="overview-pair"><div><dt>이번 Q 실적</dt><dd>${fmt(actual)}<small>K USD</small></dd></div><div><dt>분기 타겟</dt><dd>${fmt(target)}<small>K USD</small></dd></div></dl>
 <div class="quarter-gap">${remaining===null?'실적·타겟 입력 후 달성률을 계산합니다.':remaining===0?'분기 타겟을 달성했습니다.':`목표까지 <b>${fmt(remaining)} K USD</b>`}</div>
 <div class="overview-changes">${changes(actual,m.current.yoy,'YoY')}${changes(actual,m.current.qoq,'QoQ')}</div>
 <div class="quarter-mix"><div class="overview-mix" role="img" aria-label="신규 ${fmt(m.newActual)} K USD, 리뉴얼 ${fmt(m.renewalActual)} K USD, 리뉴얼 비중 ${percent(m.renewalShare)}${m.hasOther?`, 기타 ${fmt(m.otherActual)} K USD`:''}">${m.renewalShare===null?'':`<span class="mix-new" style="width:${cap(m.newShare)}%"></span><span class="mix-renewal" style="width:${cap(m.renewalShare)}%"></span>${m.hasOther?`<span class="mix-other" style="width:${cap(ratio(m.otherActual,actual))}%"></span>`:''}`}</div><div class="mix-caption"><span>신규 <b>${fmt(m.newActual)}</b></span><span>리뉴얼 <b>${fmt(m.renewalActual)}</b> · ${percent(m.renewalShare)}</span>${m.hasOther?`<span>기타 <b>${fmt(m.otherActual)}</b></span>`:''}<small>K USD</small></div></div></div>
 <div class="overview-card-footer"><span>${esc(m.current.asOf?m.current.asOf+' 기준':m.mixNote)}</span><a href="#performance" aria-label="분기 실적 상세보기">상세보기 →</a></div></article>
 <div class="overview-secondary-grid">
 <article class="overview-card" aria-labelledby="ovPartnerTitle"><div class="overview-card-head"><h3 id="ovPartnerTitle">파트너 현황</h3><span>이번 Q</span></div><div class="overview-hero"><span>Active partner</span><strong>${fmt(p.active)}<small>개사</small></strong></div>
 <div class="overview-bar-caption"><span>등록 ${fmt(p.registered)}개사</span><b>활성 ${percent(p.rate)}</b></div><div class="overview-track" role="img" aria-label="파트너 활성 비율 ${percent(p.rate)}"><span style="width:${cap(p.rate)}%"></span></div>
 <p class="compact-note">신규 활성 ${fmt(p.newActive)} · 재활성 ${fmt(p.reactivated)}개사</p>${b?.count?`<p class="compact-note">입력 파트너 부킹 <b>${fmt(b.total)} K USD</b>${b.valid?'':' · 집계 확인 필요'}</p>`:''}
 <div class="overview-card-footer"><span>${esc(p.asOf?p.asOf+' 기준':'파트너 현황 미입력')}</span><a href="#partners" aria-label="파트너 현황 상세보기">상세보기 →</a></div></article>
 <article class="overview-card overview-fy" aria-labelledby="ovFyTitle"><div class="overview-card-head"><h3 id="ovFyTitle">${esc(fyLabel)} 전체 실적</h3><span>FY 누적</span></div><div class="overview-hero"><span>전체 딜 누적</span><strong>${fmt(fy.actual)}<small>K USD</small></strong></div>
 <div class="overview-bar-caption"><span>연간 달성률</span><b>${fy.mode==='none'?'타겟 없음':percent(fy.achievement)}</b></div><div class="overview-track" role="img" aria-label="연간 타겟 ${esc(targetLabel)}, 달성률 ${percent(fy.achievement)}"><span style="width:${cap(fy.achievement)}%"></span></div>
 <p class="compact-note">${fy.target!==null?'연간 타겟 ':''}${targetLabel}</p><p class="compact-note">${esc(source)}</p><div class="overview-card-footer"><span>${esc(fy.asOf?fy.asOf+' 기준':'누적 실적 미입력')}</span><a href="#annual" aria-label="FY 전체 실적 상세보기">상세보기 →</a></div></article>
 ${activityCards}</div></div>`;
}
function achievementLabel(n){return n===null?'집계 대기':n>=100?'타겟 달성':'타겟 대비';}
root.VendorOverview={model,render};if(typeof module==='object')module.exports=root.VendorOverview;
})(typeof window==='object'?window:globalThis);
