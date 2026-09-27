(function(root){
'use strict';
const valid=m=>/^\d{4}-(0[1-9]|1[0-2])$/.test(m||'');
function add(m,n){const [y,mon]=m.split('-').map(Number),d=new Date(Date.UTC(y,mon-1+n,1));return d.toISOString().slice(0,7);}
const label=m=>`${Number(m.slice(0,4))}년 ${Number(m.slice(5))}월`;
function eventMonth(e){if(valid(e.yearMonth))return e.yearMonth;const year=Number(e.year)||Number(String(e.date||'').slice(0,4))||2026,month=Number(e.month)||Number(String(e.date||'').slice(5,7));return month>=1&&month<=12?`${year}-${String(month).padStart(2,'0')}`:'2026-09';}
function range(events,docs){let first='2026-09',last='2026-12';for(const e of events||[]){const m=eventMonth(e);if(m<first)first=m;if(m>last)last=m;}for(const doc of Object.values(docs||{})){const m=doc?._calendarMonths;if(m?.schema===1&&valid(m.endMonth)&&m.endMonth>last)last=m.endMonth;}return {first,last};}
const api={valid,add,label,eventMonth,range};root.CalendarMonthsCore=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
