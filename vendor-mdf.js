/* MDF records are kept per vendor and quarter, separate from performance. */
(function(root){
'use strict';
const C=typeof module==='object'?require('./vendor-dashboard-core.js'):root.VendorDashboardCore;
const states={planned:'계획',applying:'신청 중',approved:'승인',executing:'집행 중',claiming:'청구 중',settled:'정산 완료',cancelled:'취소'};
const amounts=['budget','spent','claimed','reimbursed'];
function validate(p,settings){
 const q=C.quarter(p.quarterStart,settings);
 if(!q||q.start!==p.quarterStart)throw Error('벤더 FY에 맞는 분기 시작일을 입력해 주세요.');
 if(!String(p.title||'').trim())throw Error('MDF 활동명을 입력해 주세요.');
 if(!Object.hasOwn(states,p.status))throw Error('MDF 진행 상태를 선택해 주세요.');
 for(const k of amounts)if(p[k]!==null&&(typeof p[k]!=='number'||!Number.isFinite(p[k])||p[k]<0))throw Error('MDF 금액은 0 이상의 K USD로 입력해 주세요. 미확인 금액은 비워 두세요.');
 if(p.due&&!C.validDate(p.due))throw Error('청구 기한 날짜를 확인해 주세요.');
}
function model({records=[],quarterStart=null,date}){
 const selected=records.filter(r=>r.kind==='mdf'&&!r.current.deleted&&(!quarterStart||r.current.payload.quarterStart===quarterStart));
 const active=selected.filter(r=>r.current.payload.status!=='cancelled'),conflict=active.some(r=>r.conflict);
 const totals=Object.fromEntries(amounts.map(k=>[k,conflict?null:C.total(active.map(r=>r.current.payload),k)]));
 return {...totals,count:selected.length,included:active.length,cancelled:selected.length-active.length,conflict,
  remaining:totals.budget!==null&&totals.spent!==null?totals.budget-totals.spent:null,
  outstanding:totals.claimed!==null&&totals.reimbursed!==null?totals.claimed-totals.reimbursed:null,
  overdue:active.filter(r=>!['settled'].includes(r.current.payload.status)&&C.validDate(r.current.payload.due)&&r.current.payload.due<date).length};
}
root.VendorMdf={states,amounts,validate,model};if(typeof module==='object')module.exports=root.VendorMdf;
})(typeof window==='object'?window:globalThis);
