/* Editable fiscal-quarter sheet; all figures come from shared data or explicit user input. */
(function(root){
'use strict';
root.createVendorQuarter=function(ctx){
 const P=root.VendorQuarterCore,C=root.VendorDashboardCore,el=document.querySelector('#quarterPerformance'),esc=ctx.esc;
 const $=s=>el.querySelector(s),fmt=n=>P.num(n)===null?'—':n.toLocaleString('en-US',{maximumFractionDigits:2}),percent=n=>n===null?'—':fmt(n)+'%';
 let selected='',draft=null,editing=false,dirty=false,busy=false,parents=[],sourceHeads=[],settingsHeads=[],reviewed=null,initialRows=[],removed=[];
 el.innerHTML=`<div class="quarter-sheet-toolbar"><div class="button-group"><button class="btn" id="qpPrev" aria-label="이전 분기">←</button><select id="qpPeriod" aria-label="분기 실적 조회 분기"></select><button class="btn" id="qpNext" aria-label="다음 분기">→</button></div><div class="button-group"><button class="btn" id="qpExport">엑셀 내려받기</button><button class="btn primary" id="qpEdit">주차별 실적 입력</button></div></div>
 <div id="qpSummary" class="quarter-sheet-summary"></div><p id="qpBasis" class="muted"></p>
 <div id="qpControls" class="quarter-sheet-controls" hidden><label>집계 기준일 <input id="qpAsOf" type="date"></label><button class="btn" id="qpAdd">+ 구분 추가</button><button class="btn" id="qpZero">미입력 주차 0 채우기</button><span>금액 K USD · 실적이 없으면 0, 확인 전이면 빈칸</span></div>
 <div class="quarter-row-feedback" id="qpRowFeedback" hidden><span id="qpRowStatus" role="status"></span><button class="btn" id="qpUndo" hidden>삭제 취소</button></div><p id="qpHint" class="quarter-sheet-hint"></p><p id="qpError" role="alert" class="quarter-sheet-error"></p><div id="qpTable" class="quarter-sheet-scroll" tabindex="0" role="region" aria-label="월별 주차 실적 표"></div>
 <details id="qpComparison"><summary>YoY · QoQ 비교값</summary><p>현재 집계일과 동일한 경과 시점의 전년 동기·직전 분기 실적을 입력합니다. 금액은 K USD입니다.</p><div id="qpComparisonRows" class="quarter-compare-rows"></div></details>
 <div id="qpActions" class="quarter-sheet-actions" hidden><button class="btn" id="qpCancel">취소</button><button class="btn primary" id="qpReview">입력 내용 검토</button></div>
 <div id="qpReviewPanel" class="quarter-sheet-review" hidden><h3>공유 저장 전 확인</h3><p id="qpReviewText"></p><button class="btn primary" id="qpSave">확인한 실적 공유 저장</button></div>`;
 const rec=()=>ctx.records().find(r=>r.kind==='quarterPerformance'&&r.recordId===selected&&!r.current.deleted);
 const legacy=()=>ctx.records().filter(r=>r.kind==='metric'&&!r.current.deleted&&!r.conflict&&r.current.payload.quarterStart===selected).map(r=>r.current.payload);
 const period=()=>C.quarter(selected,ctx.settings());
 const model=()=>P.summarize(draft),savedTotal=()=>P.effective(ctx.records(),selected).total;
 const error=e=>$('#qpError').textContent=e?.message||e||'';
 function invalidate(){dirty=true;reviewed=null;$('#qpReviewPanel').hidden=true;error('');}
 function load(){const q=period(),r=rec();draft=r?structuredClone(r.current.payload):P.blank(q.start,q.end<ctx.today()?q.end:ctx.today(),legacy());}
 function summary(total){$('#qpSummary').innerHTML=[[total.partial?'분기 실적 · 입력분':'분기 실적',fmt(total.actual),'K USD'],['분기 타겟',fmt(total.target),'K USD'],['타겟 달성률',percent(P.ratio(total.actual,total.target)),'']].map(([label,value,unit])=>`<div><span>${label}</span><strong>${value}<small>${unit}</small></strong></div>`).join('');}
 function value(m,row,key){const r=row==='total'?m.total:m.rows.find(r=>r.id===row);return key.startsWith('month-')?r.monthly[Number(key.slice(6))]:key==='achievement'?P.ratio(r.actual,r.target):r[key];}
 function calcCell(m,row,key,cls=''){const v=value(m,row,key);return `<td class="${cls}" data-sum-row="${esc(row)}" data-sum-key="${key}">${key==='achievement'?percent(v):fmt(v)}</td>`;}
 function displayModel(){const m=model();if(!editing&&!rec()){
  const prior=P.effective(ctx.records(),selected);m.rows.forEach(r=>{const p=prior.parts.find(p=>p.metricId===r.id)||{};Object.assign(r,{actual:P.num(p.actual),target:P.num(p.target),yoy:P.num(p.yoy),qoq:P.num(p.qoq)});});Object.assign(m.total,prior.total,{partial:false,missing:0});
 }return m;}
 function refreshSums(){
  const m=editing?model():displayModel();summary(m.total);
  el.querySelectorAll('[data-sum-row]').forEach(cell=>{const v=value(m,cell.dataset.sumRow,cell.dataset.sumKey);cell.textContent=cell.dataset.sumKey==='achievement'?percent(v):fmt(v);});
  el.querySelectorAll('[data-week-total]').forEach(cell=>cell.textContent=fmt(m.total.values[cell.dataset.weekTotal]));
  if(editing)$('#qpHint').textContent=`월요일~일요일 기준 · 월이 바뀌면 주차를 나눕니다. 집계일까지 미입력 ${m.missing}칸${m.missing?' · 입력한 금액만 합산합니다.':''} 엑셀에서 복사한 여러 셀을 주차 칸에 붙여넣을 수 있습니다.`;
 }
 function draw(){
  $('#qpRowFeedback').hidden=!editing||!removed.length;$('#qpUndo').hidden=!removed.length;$('#qpRowStatus').textContent=removed.length?removed.at(-1).row.name+' 구분을 삭제했습니다. 저장 전까지 되돌릴 수 있습니다.':'';
  const q=period(),r=rec(),m=displayModel();summary(m.total);
  $('#qpEdit').textContent=r?'구분·실적 수정':'구분·실적 입력';$('#qpEdit').hidden=editing;$('#qpControls').hidden=!editing;$('#qpActions').hidden=!editing;
  $('#qpAsOf').value=draft.asOf;$('#qpAsOf').min=q.start;$('#qpAsOf').max=q.end<ctx.today()?q.end:ctx.today();
  $('#qpBasis').textContent=`${ctx.name} · ${q.label} · ${q.start} — ${q.end} · ${ctx.settings()?.performanceBasis||'실적 인정 기준 미설정'} · ${!editing&&!r?(m.total.asOf?m.total.asOf+' 기준 기존 분기 누적':'주차별 자료 미입력'):draft.asOf+' 기준 주차 합산'}`;
  $('#qpHint').textContent=r?'금액 K USD · 달력 주차(월~일), 월 경계에서 구분 · 표를 좌우로 움직여 전체 주차와 분기 합계를 확인하세요.':'기존 분기 누적은 오른쪽 합계에 표시합니다. 주차별 자료는 임의 배분하지 않습니다. 주차 실적을 저장하면 해당 분기의 대시보드·FY 합계에 반영됩니다.';
  if(r?.conflict&&!editing){summary({});$('#qpTable').innerHTML='<div class="live-empty">동시에 수정된 분기 실적이 있습니다. 내용을 확인해 주세요.<button class="btn" id="qpConflict">수정 내용 확인</button></div>';$('#qpConflict').onclick=()=>ctx.conflict(r);$('#qpComparison').hidden=true;return;}
  const head=`<thead><tr><th rowspan="2" class="qp-rowhead">구분</th>${m.periods.map(month=>`<th colspan="${month.weeks.length+1}" scope="colgroup" class="qp-month">${month.label}<span>${month.name}</span></th>`).join('')}<th rowspan="2" class="qp-quarter">분기 실적</th><th rowspan="2" class="qp-quarter">분기 타겟</th><th rowspan="2" class="qp-quarter">달성률</th></tr><tr>${m.periods.map(month=>month.weeks.map(w=>`<th scope="col" class="${w.start>draft.asOf?'qp-future':''}">${w.label}<small>${w.days}</small></th>`).join('')+'<th class="qp-subtotal" scope="col">월 합계</th>').join('')}</tr></thead>`;
  const rows=m.rows.map(row=>`<tr><th scope="row" class="qp-rowhead">${editing?`<input data-row-name="${esc(row.id)}" aria-label="${esc(row.name)} 구분명" maxlength="80" value="${esc(row.name)}"><button class="qp-remove" data-remove="${esc(row.id)}" aria-label="${esc(row.name)} 구분 삭제">삭제</button>`:esc(row.name)}</th>${m.periods.map((month,i)=>month.weeks.map(w=>`<td class="${w.start>draft.asOf?'qp-future':''}">${editing?`<input data-row-id="${esc(row.id)}" data-week="${w.key}" aria-label="${esc(row.name)} ${month.date} ${w.label}" inputmode="decimal" value="${esc(draft.rows.find(r=>r.id===row.id).values[w.key]??'')}" placeholder="${w.start>draft.asOf?'예정':'—'}">`:fmt(row.values[w.key])}</td>`).join('')+calcCell(m,row.id,'month-'+i,'qp-subtotal')).join('')}${calcCell(m,row.id,'actual','qp-quarter')}<td class="qp-quarter">${editing?`<input data-row-id="${esc(row.id)}" data-amount="target" aria-label="${esc(row.name)} 분기 타겟" inputmode="decimal" value="${esc(row.target??'')}" placeholder="—">`:fmt(row.target)}</td>${calcCell(m,row.id,'achievement','qp-rate')}</tr>`).join('');
  $('#qpTable').innerHTML=`<table class="quarter-sheet"><caption class="sr-only">${esc(ctx.name)} ${q.label} 월별·주차별 실적, 월 합계, 분기 타겟 대비 달성률</caption>${head}<tbody>${rows||`<tr><td colspan="${m.periods.reduce((n,p)=>n+p.weeks.length+1,4)}" class="qp-empty">구분이 없습니다. ‘+ 구분 추가’로 입력할 구분을 만드세요.</td></tr>`}</tbody><tfoot><tr><th scope="row" class="qp-rowhead">전체 합계</th>${m.periods.map((month,i)=>month.weeks.map(w=>`<td data-week-total="${w.key}">${fmt(m.total.values[w.key])}</td>`).join('')+calcCell(m,'total','month-'+i,'qp-subtotal')).join('')}${calcCell(m,'total','actual','qp-quarter')}${calcCell(m,'total','target','qp-quarter')}${calcCell(m,'total','achievement','qp-rate')}</tr></tfoot></table>`;
  $('#qpComparison').hidden=false;
  $('#qpComparisonRows').innerHTML=m.rows.map(row=>`<div><b data-compare-name="${esc(row.id)}">${esc(row.name)}</b>${[['yoy','전년 동기'],['qoq','직전 분기']].map(([key,label])=>`<label>${label} ${editing?`<input data-row-id="${esc(row.id)}" data-amount="${key}" aria-label="${esc(row.name)} ${label} 비교값" inputmode="decimal" value="${esc(row[key]??'')}" placeholder="—">`:`<strong>${fmt(row[key])}</strong>`}</label>`).join('')}</div>`).join('');
  if(!editing&&m.total.partial)$('#qpHint').textContent+=' 미입력 '+m.total.missing+'칸 · 현재 합계는 입력분 기준입니다.';if(editing)refreshSums();
 }
 function render(){
  const current=C.quarter(ctx.today(),ctx.settings());if(selected&&!editing&&C.quarter(selected,ctx.settings())?.start!==selected)selected='';if(!current){el.hidden=true;return;}el.hidden=false;selected||=current.start;
  const starts=[...new Set([selected,...Array.from({length:9},(_,i)=>C.quarter(ctx.today(),ctx.settings(),-i).start),...ctx.records().filter(r=>['metric','quarterPerformance'].includes(r.kind)&&!r.current.deleted).map(r=>r.current.payload.quarterStart)])].filter(Boolean).sort().reverse();
  $('#qpPeriod').innerHTML=starts.map(start=>`<option value="${start}" ${start===selected?'selected':''}>${esc(C.quarter(start,ctx.settings())?.label||start)} · ${start.slice(0,7)}</option>`).join('');$('#qpNext').disabled=selected>=current.start||busy;$('#qpPrev').disabled=busy;$('#qpPeriod').disabled=busy;
  if(!editing){load();draw();}
 }
 function choose(start){if(busy||ctx.saving())return false;if(dirty&&!confirm('작성 중인 주차 실적을 취소하고 다른 분기를 볼까요?'))return false;selected=start;editing=false;dirty=false;reviewed=null;removed=[];$('#qpReviewPanel').hidden=true;error('');render();return true;}
 function edit(seed=null,heads=null){
  if(busy||ctx.saving())return;const r=rec();if(r?.conflict&&!seed){ctx.conflict(r);return;}
  load();if(seed)draft=structuredClone(seed);initialRows=structuredClone(draft.rows);removed=[];parents=heads||r?.heads.map(h=>h.id)||[];sourceHeads=ctx.records().filter(r=>r.kind==='metric'&&r.current.payload.quarterStart===selected).map(r=>({key:r.key,heads:r.heads.map(h=>h.id)}));settingsHeads=ctx.settingsHeads();editing=true;dirty=false;reviewed=null;$('#qpReviewPanel').hidden=true;error('');draw();
 }
 function updateLabels(row){
  for(const input of el.querySelectorAll('[data-row-id]'))if(input.dataset.rowId===row.id){const week=input.dataset.week,w=week&&P.months(selected).flatMap(m=>m.weeks).find(w=>w.key===week);input.setAttribute('aria-label',row.name+' '+(w?week.slice(0,7)+' '+w.label:({target:'분기 타겟',yoy:'전년 동기 비교값',qoq:'직전 분기 비교값'}[input.dataset.amount])));}
  for(const label of el.querySelectorAll('[data-compare-name]'))if(label.dataset.compareName===row.id)label.textContent=row.name;
  for(const button of el.querySelectorAll('[data-remove]'))if(button.dataset.remove===row.id)button.setAttribute('aria-label',row.name+' 구분 삭제');
 }
 const parse=v=>{const s=String(v).trim().replaceAll(',','');return s===''?null:/^\d+(\.\d+)?$/.test(s)?Number(s):NaN;};
 el.addEventListener('input',e=>{if(!editing||busy)return;const input=e.target,row=draft.rows.find(r=>r.id===(input.dataset.rowId||input.dataset.rowName));if(!row)return;
  if(input.dataset.week)row.values[input.dataset.week]=parse(input.value);else if(input.dataset.amount)row[input.dataset.amount]=parse(input.value);else if(input.dataset.rowName){row.name=input.value;updateLabels(row);}invalidate();refreshSums();
 });
 $('#qpAsOf').onchange=()=>{draft.asOf=$('#qpAsOf').value;invalidate();draw();};
 $('#qpPrev').onclick=()=>choose(C.quarter(selected,ctx.settings(),-1).start);$('#qpNext').onclick=()=>choose(C.quarter(selected,ctx.settings(),1).start);
 $('#qpPeriod').onchange=e=>{if(!choose(e.target.value))e.target.value=selected;};$('#qpEdit').onclick=()=>edit();
 $('#qpAdd').onclick=()=>{if(!editing||busy)return;if(draft.rows.length>=20){error('구분은 최대 20개까지 추가할 수 있습니다.');return;}let n=1;while(draft.rows.some(r=>r.name==='구분 '+n))n++;draft.rows.push({id:'extra_'+crypto.randomUUID().replaceAll('-',''),name:'구분 '+n,values:{},target:null,yoy:null,qoq:null});invalidate();draw();};
 el.addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(!b||!editing||busy)return;const index=draft.rows.findIndex(r=>r.id===b.dataset.remove);if(index<0)return;removed.push({row:structuredClone(draft.rows[index]),index});draft.rows.splice(index,1);invalidate();draw();});
 $('#qpUndo').onclick=()=>{if(!editing||busy||!removed.length)return;if(draft.rows.length>=20){error('삭제를 되돌리려면 구분을 20개 미만으로 줄여 주세요.');return;}const last=removed.pop();draft.rows.splice(Math.min(last.index,draft.rows.length),0,last.row);invalidate();draw();};
 $('#qpZero').onclick=()=>{for(const row of draft.rows)for(const w of P.months(selected).flatMap(m=>m.weeks))if(w.start<=draft.asOf&&row.values[w.key]==null)row.values[w.key]=0;invalidate();draw();};
 $('#qpCancel').onclick=()=>{if(busy||dirty&&!confirm('작성 중인 주차 실적을 취소할까요?'))return;editing=false;dirty=false;reviewed=null;$('#qpReviewPanel').hidden=true;error('');render();};
 $('#qpReview').onclick=()=>{try{P.validate(draft,ctx.settings(),ctx.today());const m=model(),prior=savedTotal(),changes=P.rowChanges(initialRows,draft.rows);reviewed=JSON.stringify(draft);$('#qpReviewText').textContent=`${period().label} · ${draft.asOf} 기준 · ${draft.rows.length}개 항목. 분기 실적 ${fmt(prior.actual)} → ${fmt(m.total.actual)} K USD / 타겟 ${fmt(m.total.target)} K USD / 달성률 ${percent(m.total.achievement)}. ${m.missing?'미입력 '+m.missing+'칸이 있어 입력한 금액만 합산합니다. ':''}현재 표의 구분만 합산해 대시보드·FY 누적에 반영합니다. 구분 간 금액이 중복되지 않도록 입력하세요.${changes.length?' 구분 변경: '+changes.join(' / ')+'.'+(changes.some(c=>c.startsWith('삭제:'))?' 삭제한 구분의 값은 합계에서 제외됩니다.':''):''}`;$('#qpReviewPanel').hidden=false;error('');}catch(e){error(e);}};
 $('#qpSave').onclick=async()=>{if(busy||ctx.saving()||reviewed!==JSON.stringify(draft))return;busy=true;$('#qpSave').disabled=true;$('#qpControls').inert=true;$('#qpTable').inert=true;$('#qpComparison').inert=true;$('#qpActions').inert=true;
  try{P.validate(draft,ctx.settings(),ctx.today());await ctx.save(structuredClone(draft),parents,sourceHeads,settingsHeads);editing=false;dirty=false;reviewed=null;$('#qpReviewPanel').hidden=true;error('');render();ctx.notice('주차 실적을 저장했습니다. 대시보드·분기 비교·FY 누적에 반영되었습니다.');}
  catch(e){error(e);}finally{busy=false;$('#qpSave').disabled=false;$('#qpControls').inert=false;$('#qpTable').inert=false;$('#qpComparison').inert=false;$('#qpActions').inert=false;render();}
 };
 $('#qpTable').addEventListener('paste',e=>{if(!editing||busy||!e.target.dataset.week)return;const text=e.clipboardData?.getData('text/plain');if(!text||!/[\t\n]/.test(text))return;e.preventDefault();
  try{const lines=text.replace(/\r/g,'').replace(/\n$/,'').split('\n').map(line=>line.split('\t')),weeks=P.months(selected).flatMap(m=>m.weeks),start=weeks.findIndex(w=>w.key===e.target.dataset.week),rowIndex=draft.rows.findIndex(r=>r.id===e.target.dataset.rowId);
   if(lines.length+rowIndex>draft.rows.length||lines.some(line=>line.length+start>weeks.length))throw Error('항목·주차 범위를 넘었습니다. 필요한 항목을 먼저 추가해 주세요.');
   const next=structuredClone(draft);lines.forEach((line,i)=>line.forEach((v,j)=>{const n=parse(v);if(n!==null&&!Number.isFinite(n))throw Error('주차 실적에는 숫자만 붙여넣어 주세요.');next.rows[rowIndex+i].values[weeks[start+j].key]=n;}));draft=next;invalidate();draw();
  }catch(e){error(e);}
 });
 $('#qpExport').onclick=()=>{try{const m=displayModel(),rows=[['벤더',ctx.name,'분기',period().label,'기준일',m.total.asOf||'','단위','K USD','집계 상태',m.total.partial?'입력분 · 미입력 '+m.total.missing+'칸':'누적 실적'],['구분',...m.periods.flatMap(month=>[...month.weeks.map(w=>month.date+' '+w.label+' ('+w.days+')'),month.date+' 합계']),'분기 실적','분기 타겟','달성률 (%)'],...m.rows.map(r=>[r.name,...m.periods.flatMap((month,i)=>[...month.weeks.map(w=>r.values[w.key]),r.monthly[i]]),r.actual,r.target,P.ratio(r.actual,r.target)]),['전체 합계',...m.periods.flatMap((month,i)=>[...month.weeks.map(w=>m.total.values[w.key]),m.total.monthly[i]]),m.total.actual,m.total.target,P.ratio(m.total.actual,m.total.target)]];
  const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=rows[1].map((_,i)=>({wch:i?16:24}));XLSX.utils.book_append_sheet(wb,ws,'분기 주차 실적');XLSX.writeFile(wb,ctx.name+'_'+period().label.replace(' ','_')+'_주차실적.xlsx');
 }catch(e){error(e);}};
 window.addEventListener('beforeunload',e=>{if(dirty||busy){e.preventDefault();e.returnValue='';}});
 return {render,choose,resolve(r,p){if(choose(r.recordId))edit(p,r.heads.map(h=>h.id));},isEditing:()=>editing};
};
})(window);
