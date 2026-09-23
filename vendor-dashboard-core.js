/* Shared pure functions; revision documents never overwrite calendar or contact records. */
(function(root){
'use strict';
const vendors={crowdstrike:'CrowdStrike',okta:'Okta',menlo:'Menlo Security',extrahop:'ExtraHop',claroty:'Claroty',sonicwall:'SonicWall',fortra:'Fortra',sonatype:'Sonatype',checkpoint:'Check Point',gigamon:'Gigamon'};
const iso=d=>d.toISOString().slice(0,10);
function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&iso(d)===s;}
function quarter(date,settings,offset=0){
 if(!validDate(date)||!settings||!Number.isInteger(settings.startMonth)||settings.startMonth<1||settings.startMonth>12)return null;
 const d=new Date(date+'T00:00:00Z'),m=d.getUTCMonth(),y=d.getUTCFullYear(),startMonth=settings.startMonth-1;
 const fyStartYear=y-(m<startMonth?1:0),qIndex=Math.floor(((m-startMonth+12)%12)/3);
 const start=new Date(Date.UTC(fyStartYear,startMonth+(qIndex+offset)*3,1)),end=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+3,0));
 const fyY=start.getUTCFullYear()-(start.getUTCMonth()<startMonth?1:0),q=1+Math.floor(((start.getUTCMonth()-startMonth+12)%12)/3);
 const fyLabelYear=fyY+(settings.fyNaming==='end'&&startMonth!==0?1:0);
 return {start:iso(start),end:iso(end),fyStart:iso(new Date(Date.UTC(fyY,startMonth,1))),fyEnd:iso(new Date(Date.UTC(fyY+1,startMonth,0))),q,label:`FY${String(fyLabelYear).slice(-2)} Q${q}`,fy:`FY${String(fyLabelYear).slice(-2)}`};
}
function index(vendorDocs,vendorId){
 const groups=new Map();for(const [id,doc] of Object.entries(vendorDocs||{})){
  const r=doc?._dashboard;if(!r||r.schema!==1||r.vendorId!==vendorId||!r.kind||!r.recordId||!Array.isArray(r.parents))continue;
  const key=r.kind+':'+r.recordId;if(!groups.has(key))groups.set(key,[]);groups.get(key).push({...r,id});
 }
 const records=[];for(const revisions of groups.values()){
  const parents=new Set(revisions.flatMap(r=>r.parents));const heads=revisions.filter(r=>!parents.has(r.id)).sort((a,b)=>(a.savedAt||'').localeCompare(b.savedAt||'')||a.id.localeCompare(b.id));
  if(heads.length)records.push({key:heads[0].kind+':'+heads[0].recordId,kind:heads[0].kind,recordId:heads[0].recordId,heads,current:heads.at(-1),conflict:heads.length>1,revisions});
 }
 return records;
}
function calendarPromotions(vendorDocs,year=2026){
 const events=[];for(const [vendorId,name] of Object.entries(vendors))for(const r of index(vendorDocs,vendorId)){
  if(r.kind!=='promotion'||r.current.deleted)continue;const p=r.current.payload;
  if(!validDate(p.start)||Number(p.start.slice(0,4))!==year)continue;
  events.push({id:'dashboard-'+r.recordId,vendor:name,type:'promotion',title:p.title,date:p.start,end:p.end,month:Number(p.start.slice(5,7)),status:p.status||'planned',owner:p.owner||'',reward:p.scheme||'',goal:(p.goals||[]).map(g=>`${g.name}: ${g.actual??'미입력'} / ${g.target} ${g.unit}`).join(' · '),note:'벤더 상세 페이지에서 등록',dashboardVendor:vendorId,order:0});
 }return events;
}
const sameHeads=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
const amount=n=>typeof n==='number'&&Number.isFinite(n)?n:null;
function growth(current,base){if(amount(current)===null||amount(base)===null)return null;if(base===0)return null;return (current-base)/Math.abs(base)*100;}
function total(rows,field){const nums=rows.map(x=>amount(x?.[field]));return nums.length&&nums.every(n=>n!==null)?nums.reduce((a,b)=>a+b,0):null;}
function validateMetric(p,settings,today){
 if(!p.metricId||!validDate(p.quarterStart)||!validDate(p.asOf))throw Error('항목·분기 시작일·집계 기준일을 확인해 주세요.');
 const q=quarter(p.quarterStart,settings);if(!q||q.start!==p.quarterStart)throw Error('분기 시작일이 회계연도 설정과 맞지 않습니다.');
 if(p.asOf<p.quarterStart||p.asOf>q.end||p.asOf>today)throw Error('집계 기준일은 해당 분기 안의 오늘 이전 날짜여야 합니다.');
 for(const k of ['actual','target','yoy','qoq'])if(p[k]!==null&&(amount(p[k])===null||p[k]<0))throw Error('금액·건수는 0 이상의 숫자로 입력해 주세요.');
 if(p.target===0)throw Error('타겟이 없으면 비워 두세요. 타겟은 0보다 커야 합니다.');
}
root.VendorDashboardCore={vendors,validDate,quarter,index,sameHeads,growth,total,validateMetric,calendarPromotions};
if(typeof module==='object')module.exports=root.VendorDashboardCore;
})(typeof window==='object'?window:globalThis);
