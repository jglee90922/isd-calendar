/* Calendar weeks split at month boundaries; one saved sheet is one fiscal quarter. */
(function(root){
'use strict';
const C=typeof module==='object'?require('./vendor-dashboard-core.js'):root.VendorDashboardCore;
const base=[{id:'deal_new',name:'신규'},{id:'deal_renewal',name:'리뉴얼'}];
const iso=d=>d.toISOString().slice(0,10),num=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
const sum=values=>values.length&&values.every(v=>num(v)!==null)?Math.round(values.reduce((a,b)=>a+b,0)*1e6)/1e6:null;
const ratio=(a,b)=>num(a)!==null&&num(b)!==null&&b>0?a/b*100:null;
function months(start){
 if(!C.validDate(start))return [];
 const d=new Date(start+'T00:00:00Z');
 return Array.from({length:3},(_,i)=>{
  const first=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+i,1)),last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)),weeks=[];let day=1;
  while(day<=last.getUTCDate()){
   const from=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth(),day)),end=Math.min(day+6-(from.getUTCDay()+6)%7,last.getUTCDate());
   weeks.push({key:iso(from),start:iso(from),end:iso(new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth(),end))),label:(weeks.length+1)+'주',days:(day===end?day:day+'–'+end)+'일'});day=end+1;
  }
  return {index:i,label:(i+1)+'M',date:iso(first).slice(0,7),name:first.getUTCFullYear()+'년 '+(first.getUTCMonth()+1)+'월',weeks};
 });
}
function blank(start,date,metrics=[]){
 return {quarterStart:start,asOf:date,weekMode:'calendar-monday',rows:base.map(b=>{const p=metrics.find(m=>m.metricId===b.id&&m.quarterStart===start)||{};return {...b,values:{},target:num(p.target),yoy:num(p.yoy),qoq:num(p.qoq)};})};
}
function validate(p,settings,date){
 const q=C.quarter(p.quarterStart,settings);
 if(!q||q.start!==p.quarterStart)throw Error('벤더 FY에 맞는 분기를 선택해 주세요.');
 if(!C.validDate(p.asOf)||p.asOf<q.start||p.asOf>q.end||p.asOf>date)throw Error('집계일은 해당 분기 안의 오늘 이전 날짜여야 합니다.');
 if(p.weekMode!=='calendar-monday')throw Error('주차 기준을 확인해 주세요.');
 if(!Array.isArray(p.rows)||p.rows.length<2||p.rows.length>20)throw Error('항목은 신규·리뉴얼을 포함해 2~20개로 구성해 주세요.');
 const weeks=months(q.start).flatMap(m=>m.weeks),keys=new Set(weeks.map(w=>w.key)),ids=new Set(),names=new Set();
 for(const row of p.rows){
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(row.id)||ids.has(row.id))throw Error('항목 ID가 중복되었거나 올바르지 않습니다.');ids.add(row.id);
  const name=String(row.name||'').trim(),normalized=name.toLowerCase();if(!name||name.length>80||names.has(normalized))throw Error('항목명은 중복 없이 80자 이내로 입력해 주세요.');names.add(normalized);
  const fixed=base.find(b=>b.id===row.id);if(fixed&&name!==fixed.name)throw Error('신규·리뉴얼 항목명은 유지해 주세요.');
  for(const field of ['target','yoy','qoq'])if(row[field]!==null&&num(row[field])===null)throw Error(name+'의 타겟·비교값은 0 이상 숫자 또는 빈칸이어야 합니다.');
  if(!row.values||typeof row.values!=='object'||Array.isArray(row.values))throw Error('주차별 입력값을 확인해 주세요.');
  for(const [key,value] of Object.entries(row.values)){
   if(!keys.has(key))throw Error(name+'에 해당 분기 밖의 주차가 있습니다.');
   if(value!==null&&num(value)===null)throw Error(name+'의 주차 실적은 0 이상 숫자 또는 빈칸이어야 합니다.');
   if(key>p.asOf&&value!==null)throw Error(name+'의 '+key+' 주차는 집계일 이후입니다. 값을 비우거나 집계일을 확인해 주세요.');
  }
 }
 if(base.some(b=>!ids.has(b.id)))throw Error('신규·리뉴얼 항목은 삭제할 수 없습니다.');
}
function summarize(p){
 const periods=months(p.quarterStart),elapsed=periods.flatMap(m=>m.weeks).filter(w=>w.start<=p.asOf);
 const rows=(p.rows||[]).map(row=>{
  const values=Object.fromEntries(periods.flatMap(m=>m.weeks).map(w=>[w.key,w.start<=p.asOf?num(row.values?.[w.key]):null]));
  return {...row,metricId:row.id,quarterStart:p.quarterStart,asOf:p.asOf,values,
   monthly:periods.map(m=>sum(m.weeks.filter(w=>w.start<=p.asOf).map(w=>values[w.key]))),actual:sum(elapsed.map(w=>values[w.key])),achievement:ratio(sum(elapsed.map(w=>values[w.key])),row.target),missing:elapsed.filter(w=>values[w.key]===null).length};
 });
 const total={metricId:'deal_total',quarterStart:p.quarterStart,asOf:p.asOf,actual:sum(rows.map(r=>r.actual)),target:sum(rows.map(r=>r.target)),yoy:sum(rows.map(r=>r.yoy)),qoq:sum(rows.map(r=>r.qoq)),monthly:periods.map((m,i)=>sum(rows.map(r=>r.monthly[i]))),values:Object.fromEntries(periods.flatMap(m=>m.weeks).map(w=>[w.key,sum(rows.map(r=>r.values[w.key]))]))};
 total.achievement=ratio(total.actual,total.target);
 return {quarterStart:p.quarterStart,periods,rows,parts:rows,total,hasOther:rows.length>2,otherActual:rows.length>2?sum(rows.filter(r=>!base.some(b=>b.id===r.id)).map(r=>r.actual)):0,missing:rows.reduce((n,r)=>n+r.missing,0)};
}
function effective(records,start){
 const sheet=records.find(r=>r.kind==='quarterPerformance'&&r.recordId===start&&!r.current.deleted);
 if(sheet){if(sheet.conflict)return {quarterStart:start,parts:[],total:{actual:null,target:null,asOf:'',yoy:null,qoq:null},otherActual:null,hasOther:false,conflict:true};return summarize(sheet.current.payload);}
 const parts=base.map(b=>{const r=records.find(r=>r.kind==='metric'&&r.recordId===b.id+':'+start&&!r.current.deleted&&!r.conflict);return {metricId:b.id,...(r?.current.payload||{})};});
 return {quarterStart:start,parts,total:C.dealTotal(parts),otherActual:0,hasOther:false};
}
root.VendorQuarterCore={base,months,blank,validate,summarize,effective,num,sum,ratio};if(typeof module==='object')module.exports=root.VendorQuarterCore;
})(typeof window==='object'?window:globalThis);
