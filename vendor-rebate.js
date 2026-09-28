/* Rebate amounts are entered from vendor statements, never inferred from sales. */
(function(root){
'use strict';
const C=typeof module==='object'?require('./vendor-dashboard-core.js'):root.VendorDashboardCore;
const states={planned:'예정',working:'진행 중',confirmed:'확정',waiting:'지급 대기',paid:'수령 완료',cancelled:'취소'};
const amounts=['expected','confirmed','received'];
function validate(p,settings){
 const q=C.quarter(p.quarterStart,settings);
 if(!q||q.start!==p.quarterStart)throw Error('벤더 FY에 맞는 분기 시작일을 입력해 주세요.');
 if(!String(p.title||'').trim())throw Error('리베이트명을 입력해 주세요.');
 if(!Object.hasOwn(states,p.status))throw Error('리베이트 진행 상태를 선택해 주세요.');
 for(const k of amounts)if(p[k]!==null&&(typeof p[k]!=='number'||!Number.isFinite(p[k])||p[k]<0))throw Error('리베이트 금액은 0 이상의 K USD로 입력해 주세요. 미확인 금액은 비워 두세요.');
 if(p.due&&!C.validDate(p.due))throw Error('지급 예정일을 확인해 주세요.');
}
function model({records=[],quarterStart=null,date}){
 const selected=records.filter(r=>r.kind==='rebate'&&!r.current.deleted&&(!quarterStart||r.current.payload.quarterStart===quarterStart));
 const active=selected.filter(r=>r.current.payload.status!=='cancelled'),conflict=selected.some(r=>r.conflict);
 const totals=Object.fromEntries(amounts.map(k=>[k,conflict?null:C.total(active.map(r=>r.current.payload),k)]));
 return {...totals,count:selected.length,included:active.length,cancelled:selected.length-active.length,conflict,
  outstanding:totals.confirmed!==null&&totals.received!==null?totals.confirmed-totals.received:null,
  overdue:active.filter(r=>r.current.payload.status!=='paid'&&C.validDate(r.current.payload.due)&&r.current.payload.due<date).length};
}
root.VendorRebate={states,amounts,validate,model};if(typeof module==='object')module.exports=root.VendorRebate;
})(typeof window==='object'?window:globalThis);
