/* Editable single-table input and XLSX round-trip, with review before shared save. */
(function(root){
'use strict';
root.createVendorDataEntry=function(ctx){
 const D=root.VendorDataCore,scope=D.scopes[ctx.scope],prefix=ctx.scope,esc=ctx.esc,defs=D.scopeDefs(scope),allowed=scope.kinds;
 const $=s=>document.querySelector(s.replace('#data','#'+prefix));
 document.getElementById(prefix).innerHTML=`<div class="section-head"><div><div class="eyebrow">VENDOR DATA INPUT</div><h2>${esc(scope.title)}</h2><p>${esc(scope.description)}</p></div>${prefix==='partner-data'?'<button class="btn" data-new="partners">파트너 수·활성 기준 입력</button>':''}</div>
 <div id="${prefix}Controls"><div class="data-toolbar"><button class="btn" id="${prefix}Template">엑셀 양식 받기</button><button class="btn" id="${prefix}Export">현재 표 엑셀 내려받기</button><label class="btn data-file">엑셀 불러오기<input aria-label="${esc(scope.title)} 엑셀 불러오기" id="${prefix}File" type="file" accept=".xlsx,.xls,.csv"></label><button class="btn" id="${prefix}Load">저장된 최신 데이터 불러오기</button></div>
 <div class="data-toolbar"><label ${allowed.length===1?'hidden':''}>추가할 데이터 <select id="${prefix}AddType"></select></label><button class="btn primary" id="${prefix}Add">+ 행 추가</button><label ${allowed.length===1?'hidden':''}>표시 구분 <select id="${prefix}Filter"></select></label><span class="data-count" id="${prefix}Count"></span></div>
 <details class="data-help"><summary>입력 방법과 열 설명</summary><p>${esc(scope.help)}</p><ul><li>이 화면의 전용 엑셀 양식을 사용하세요. 여러 셀을 복사해 표에 붙여넣을 수도 있습니다. 날짜는 YYYY-MM-DD, 금액은 K USD(천 달러)입니다.</li><li>기존 수정은 ‘현재 표 엑셀 내려받기’를 사용하고 숨겨진 데이터ID·수정기준 열을 유지하세요. 빈칸은 미입력으로 저장합니다.</li><li>표에서 제외해도 저장된 자료는 삭제되지 않습니다.${allowed.includes('promotion')?' 같은 프로모션의 목표 행을 제외하면 저장 시 목표 구성이 바뀝니다.':''}</li></ul></details></div>
 <p class="data-status" id="${prefix}Status" role="status" aria-live="polite"></p><p class="data-error" id="${prefix}Error" role="alert"></p><div id="${prefix}Table" class="scroll data-table"></div><div class="data-pagination"><button class="btn" id="${prefix}Prev">이전 50행</button><button class="btn" id="${prefix}Next">다음 50행</button></div><div class="data-review" id="${prefix}Review" hidden></div><div class="data-savebar"><button class="btn" id="${prefix}Check">오류·변경 확인</button><button class="btn primary" id="${prefix}Save" disabled>검토한 데이터 공유 저장</button><a class="btn" href="#overview">대시보드 확인</a></div>`;
 let rows=[],dirty=false,loaded=false,busy=false,review=null,page=0,filter=allowed[0],loadingFile=false,loadedSignature='';
 const records=()=>ctx.records().filter(r=>allowed.includes(r.kind)),makeId=()=>crypto.randomUUID().replaceAll('-','');
 const text=v=>String(v??'').trim(),display=(kind,key,v)=>{const opts=D.options(kind,key);return opts?.find(([id,label])=>id===v||label===v)?.[1]??v??'';};
 const visible=()=>rows.map((r,i)=>({r,i})).filter(({r})=>filter==='all'||r.kind===filter);
 const setError=e=>$('#dataError').textContent=e?.message||e||'';
 const status=s=>$('#dataStatus').textContent=s;
 function invalidate(){dirty=true;review=null;$('#dataSave').disabled=true;$('#dataReview').hidden=true;status('작성 중 · 오류·변경 확인 후 저장해 주세요.');}
 const signature=()=>records().filter(r=>Object.hasOwn(D.kinds,r.kind)).map(r=>r.key+':'+D.version(r)).sort().join(';');
 function load(reset=true){loadedSignature=signature();rows=D.rowsFrom(records(),ctx.name);loaded=true;dirty=false;review=null;if(reset)page=0;$('#dataSave').disabled=true;$('#dataReview').hidden=true;draw();status(`저장된 데이터 ${rows.length.toLocaleString()}행 · ${ctx.name}`);}
 function bookingTotal(r){const values=[r.newBooking,r.renewalBooking].map(v=>text(v).replaceAll(',',''));return values.every(v=>v!==''&&Number.isFinite(Number(v))&&Number(v)>=0)?(Number(values[0])+Number(values[1])).toLocaleString('en-US',{maximumFractionDigits:3}):'—';}
 function draw(){
  const list=visible(),pages=Math.max(1,Math.ceil(list.length/50));page=Math.min(page,pages-1);
  const keys=['kind',...(filter==='all'?defs.map(d=>d[0]).filter(k=>!['vendor','kind','id','version'].includes(k)):D.fields[filter])];
  $('#dataCount').textContent=`전체 ${rows.length.toLocaleString()}행 · 표시 ${list.length.toLocaleString()}행 · ${page+1}/${pages} 페이지`;
  $('#dataPrev').disabled=page===0;$('#dataNext').disabled=page===pages-1;
  $('#dataTable').innerHTML=`<table class="data-grid"><thead><tr><th class="data-rownum">행</th>${keys.map(k=>`<th>${esc(defs.find(d=>d[0]===k)[1])}</th>`).join('')}${allowed.includes('partnerBooking')?'<th>합계 (K USD) · 자동</th>':''}<th>행 관리</th></tr></thead><tbody>${list.slice(page*50,page*50+50).map(({r,i})=>`<tr><th class="data-rownum">${i+1}</th>${keys.map(k=>{
   if(k==='kind')return `<td class="data-kind">${D.kinds[r.kind]}${r.version?'<small>기존</small>':'<small>신규</small>'}</td>`;
   if(!D.fields[r.kind].includes(k))return '<td class="data-unused">—</td>';
   const def=defs.find(d=>d[0]===k),value=display(r.kind,k,r[k]),opts=D.options(r.kind,k),attr=`data-row="${i}" data-field="${k}" aria-label="${i+1}행 ${esc(def[1])}"`;
   if(opts)return `<td><select ${attr}><option value="">선택</option>${opts.map(([id,label])=>`<option value="${esc(label)}" ${value===label?'selected':''}>${esc(label)}</option>`).join('')}</select></td>`;
   return `<td><input ${attr} type="text" ${def[2]==='number'?'inputmode="decimal"':''} value="${esc(value)}" placeholder="${def[2]==='date'?'YYYY-MM-DD':''}" maxlength="4000"></td>`;
  }).join('')}${r.kind==='partnerBooking'?`<td class="data-total" data-total="${i}">${bookingTotal(r)}</td>`:''}<td class="data-row-actions">${r.kind==='promotion'?`<button type="button" data-goal-row="${i}" class="btn">목표 추가</button>`:''}<button type="button" data-remove-row="${i}" class="btn">표에서 제외</button></td></tr>`).join('')||`<tr><td colspan="${keys.length+2+(allowed.includes('partnerBooking')?1:0)}" class="live-empty">입력할 행을 추가하거나 엑셀 파일을 불러오세요.</td></tr>`}</tbody></table>`;
 }
 function add(kind){if(busy||!allowed.includes(kind))return;if(rows.length>=5000){setError('한 번에 5,000행까지 입력할 수 있습니다.');return;}rows.push(D.blank(kind,ctx.name,ctx.settings(),ctx.today(),makeId()));filter=kind;$('#dataFilter').value=kind;page=Math.floor((visible().length-1)/50);invalidate();draw();}
 function spreadsheet(template=false){
  if(!root.XLSX)throw Error('엑셀 기능을 불러오지 못했습니다. 새로고침해 주세요.');
  const data=template?allowed.flatMap(k=>k==='metric'?['신규','리뉴얼'].map(m=>({...D.blank(k,ctx.name,ctx.settings(),ctx.today(),''),metric:m})):[D.blank(k,ctx.name,ctx.settings(),ctx.today(),'')]):rows;
  const matrix=[defs.map(d=>d[1]),...data.map(r=>defs.map(([k,,type])=>{if(!['vendor','kind','id','version'].includes(k)&&!D.fields[r.kind].includes(k))return '';let v=k==='vendor'?ctx.name:k==='kind'?D.kinds[r.kind]:display(r.kind,k,r[k]);if(type==='number'&&text(v)!==''&&/^\d+(\.\d+)?$/.test(text(v).replaceAll(',','')))v=Number(text(v).replaceAll(',',''));return v;}))];
  const ws=XLSX.utils.aoa_to_sheet(matrix);ws['!cols']=defs.map(([k,,type])=>({wch:k==='title'||['content','scheme','rule','response'].includes(k)?32:type==='number'?16:22,hidden:['id','version'].includes(k)}));ws['!autofilter']={ref:ws['!ref']};
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,scope.sheet);XLSX.writeFile(wb,ctx.name+'_'+scope.sheet+(template?'_입력양식':'_현재데이터')+'.xlsx');
 }
 async function importFile(file){
  if(!file)return;if(dirty&&!confirm('작성 중인 표를 선택한 파일의 내용으로 바꿀까요? 아직 공유 저장되지 않은 입력은 대체됩니다.'))return;
  loadingFile=true;setError('');
  try{
   if(file.size>10*1024*1024)throw Error('파일은 10MB 이하로 올려 주세요.');if(!root.XLSX)throw Error('엑셀 기능을 불러오지 못했습니다.');
   const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false}),ws=wb.Sheets[scope.sheet]||wb.Sheets[wb.SheetNames[0]];
   if(!ws?.['!ref'])throw Error('데이터가 없는 파일입니다.');const range=XLSX.utils.decode_range(ws['!ref']);if(range.e.r>5000||range.e.c>100)throw Error('한 번에 5,000행·100열 이내의 파일을 올려 주세요.');
   for(const [cell,v] of Object.entries(ws))if(!cell.startsWith('!')&&v?.f)throw Error('수식은 엑셀에서 계산 후 값으로 붙여넣어 주세요. ('+cell+')');
   const matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true}),headers=matrix.shift().map(text);
   const missing=defs.filter(([,label])=>!headers.includes(label));if(missing.length)throw Error('입력 양식의 열이 없습니다: '+missing.map(d=>d[1]).join(', ')+'. 이 화면의 양식을 사용해 주세요.');
   if(new Set(headers.filter(Boolean)).size!==headers.filter(Boolean).length)throw Error('중복된 열 제목이 있습니다.');
   const imported=matrix.filter(row=>row.some(v=>text(v))).map((line,i)=>{
    const row=Object.fromEntries(defs.map(([k,label,type])=>{let v=line[headers.indexOf(label)]??'';if(type==='date'&&text(v))v=root.VendorLeadImport.date(v);return [k,v];}));
    const kind=Object.keys(D.kinds).find(k=>k===row.kind||D.kinds[k]===row.kind);if(!kind)throw Error(`${i+2}행: 데이터 구분을 확인해 주세요.`);if(!allowed.includes(kind))throw Error(`${i+2}행: ${scope.title} 전용 양식입니다. 해당 항목의 입력 탭을 이용해 주세요.`);row.kind=kind;
    if(text(row.vendor)!==ctx.name)throw Error(`${i+2}행: 현재 벤더는 ${ctx.name}입니다. 벤더별 파일을 구분해 주세요.`);return row;
   });
   rows=imported;page=0;filter=allowed.length===1?allowed[0]:'all';$('#dataFilter').value=filter;invalidate();draw();status(`${file.name} · ${rows.length}행 불러옴. 아직 저장되지 않았습니다.`);
  }catch(e){setError(e);}finally{loadingFile=false;$('#dataFile').value='';}
 }
 function reviewHTML(result){
  const {entries,errors}=result,counts=key=>entries.filter(e=>e.status===key).length;
  $('#dataReview').hidden=false;
  $('#dataReview').innerHTML=`<h3>반영 전 확인</h3><p>신규 ${counts('new')}건 · 수정 ${counts('update')}건 · 변경 없음 ${counts('skip')}건 · 오류 ${errors.length}건</p>${errors.length?`<ul class="data-errors">${errors.slice(0,50).map(e=>`<li>${e.row}행: ${esc(e.message)}</li>`).join('')}</ul>`:''}<div class="scroll"><table><thead><tr><th>행</th><th>구분</th><th>처리</th><th>반영 내용</th></tr></thead><tbody>${entries.filter(e=>e.status!=='skip').slice(0,100).map(e=>`<tr><td>${e.rows.join(', ')}</td><td>${D.kinds[e.kind]}</td><td>${e.status==='new'?'신규':'수정'}</td><td>${esc(summary(e))}</td></tr>`).join('')}</tbody></table></div><p>${allowed.includes('promotion')?'프로모션은 같은 ID의 목표 행을 함께 저장합니다. ':''}표에서 제외한 기존 데이터는 삭제되지 않습니다.</p>`;
 }
 function summary(e){const p=e.payload,b=e.before,fmt=v=>v??'미입력',changed=(name,k)=>`${name} ${b?fmt(b[k])+' → ':''}${fmt(p[k])}`;
  if(e.kind==='partnerBooking')return `${p.partnerName} · ${p.quarterStart} · ${changed('신규 부킹','newBooking')} / ${changed('리뉴얼 부킹','renewalBooking')} K USD · 기준일 ${p.asOf}`;
  if(e.kind==='metric'||e.kind==='annual')return `${p.quarterStart||e.recordId} · ${{deal_new:'신규',deal_renewal:'리뉴얼',deal_total:'전체 합계'}[p.metricId]} · ${changed('실적','actual')} / ${changed('타겟','target')} K USD · 기준일 ${p.asOf}${e.kind==='annual'?' · 타겟 '+({set:'있음',none:'없음',pending:'확인 중'})[p.mode]:' · '+changed('YoY 비교값','yoy')+' · '+changed('QoQ 비교값','qoq')}`;
  if(e.kind==='partners')return `${e.recordId} · ${changed('등록','registered')} / ${changed('활성','active')}개사 · ${changed('신규 활성','newActive')} / ${changed('재활성','reactivated')} · 기준일 ${p.asOf}`;
  if(e.kind==='promotion')return `${p.title} · ${p.start}~${p.end} · 목표 ${b?(b.goals||[]).length+' → ':''}${p.goals.length}개 · ${p.goals.map(g=>`${g.name} ${fmt(g.actual)}/${g.target} ${g.unit}`).join(' / ')}`;
  if(e.kind==='lead')return `${p.name} · ${D.states.lead[p.stage]} · ${p.owner} · ${p.next||''}`;
  return `${p.title} · ${D.states[e.kind][p.status]} · ${p.owner} · 기한 ${p.due} · ${e.kind==='request'?p.history?.at(-1)?.text||'':p.criteria}`;
 }
 async function check(){
  if(busy||ctx.saving())return;busy=true;$('#dataControls').inert=true;$('#dataTable').inert=true;$('#dataCheck').disabled=true;setError('');review=null;$('#dataSave').disabled=true;
  try{await ctx.refresh();const result=D.preview(rows,{vendor:ctx.name,records:records(),settings:ctx.settings(),date:ctx.today(),author:ctx.user(),allowedKinds:allowed,makeId});
   review={...result,settingsHeads:ctx.settingsHeads()};if(!result.errors.length&&!result.entries.some(e=>e.status!=='skip'))dirty=false;draw();reviewHTML(result);$('#dataSave').disabled=result.errors.length>0||!result.entries.some(e=>e.status!=='skip');status('검토 결과를 확인한 뒤 공유 저장을 누르세요.');
  }catch(e){setError(e);}finally{busy=false;$('#dataControls').inert=false;$('#dataTable').inert=false;$('#dataCheck').disabled=false;}
 }
 async function save(){
  if(busy||ctx.saving()||!review||review.errors.length)return;const entries=review.entries.filter(e=>e.status!=='skip');if(!entries.length)return;
  busy=true;$('#dataSave').disabled=true;$('#dataCheck').disabled=true;setError('');$('#dataControls').inert=true;$('#dataTable').inert=true;
  try{await ctx.save(entries,n=>status(`${n}/${entries.length}건 공유 저장 중…`),review.settingsHeads);load();ctx.notice(`${scope.title} ${entries.length}건을 저장했습니다. 대시보드에 반영되었습니다.`);status('공유 저장 완료 · 대시보드에서 확인하세요.');}
  catch(e){review=null;$('#dataReview').hidden=true;setError(e.message+' 이미 저장된 건은 다시 검토하면 변경 없음으로 표시됩니다.');status('표를 유지했습니다. 오류·변경 확인 후 다시 저장해 주세요.');}
  finally{busy=false;$('#dataControls').inert=false;$('#dataTable').inert=false;$('#dataCheck').disabled=false;}
 }
 $('#dataAddType').innerHTML=allowed.map(k=>[k,D.kinds[k]]).map(([k,l])=>`<option value="${k}">${l}</option>`).join('');
 $('#dataFilter').innerHTML='<option value="all">전체 구분</option>'+allowed.map(k=>[k,D.kinds[k]]).map(([k,l])=>`<option value="${k}" ${k===filter?'selected':''}>${l}</option>`).join('');
 $('#dataFilter').onchange=e=>{if(busy)return;filter=e.target.value;page=0;draw();};$('#dataAdd').onclick=()=>add($('#dataAddType').value);
 $('#dataPrev').onclick=()=>{if(page>0){page--;draw();}};$('#dataNext').onclick=()=>{page++;draw();};
 $('#dataLoad').onclick=async()=>{if(busy||ctx.saving())return;if(dirty&&!confirm('작성 중인 표를 저장된 최신 데이터로 바꿀까요?'))return;busy=true;try{await ctx.refresh();load();setError('');}catch(e){setError(e);}finally{busy=false;}};
 $('#dataTemplate').onclick=()=>{try{spreadsheet(true);}catch(e){setError(e);}};$('#dataExport').onclick=()=>{try{spreadsheet();}catch(e){setError(e);}};
 $('#dataFile').onchange=e=>importFile(e.target.files[0]);$('#dataCheck').onclick=check;$('#dataSave').onclick=save;
 $('#dataTable').addEventListener('input',e=>{const r=e.target.dataset.row,k=e.target.dataset.field;if(r!==undefined&&k&&!busy){rows[r][k]=e.target.value;const total=$('#dataTable').querySelector(`[data-total="${r}"]`);if(total)total.textContent=bookingTotal(rows[r]);invalidate();}});
 $('#dataTable').addEventListener('change',e=>{const r=e.target.dataset.row,k=e.target.dataset.field;if(r!==undefined&&k&&!busy){rows[r][k]=e.target.value;const total=$('#dataTable').querySelector(`[data-total="${r}"]`);if(total)total.textContent=bookingTotal(rows[r]);invalidate();}});
 $('#dataTable').addEventListener('click',e=>{if(busy)return;const remove=e.target.closest('[data-remove-row]'),goal=e.target.closest('[data-goal-row]');
  if(remove){rows.splice(Number(remove.dataset.removeRow),1);invalidate();draw();}
  if(goal){if(rows.length>=5000){setError('5,000행까지 입력할 수 있습니다.');return;}const i=Number(goal.dataset.goalRow),r=rows[i];r.id||=makeId();rows.splice(i+1,0,{...r,goalName:'',target:'',actual:'',rule:''});invalidate();draw();}
 });
 $('#dataTable').addEventListener('paste',e=>{
  const row=Number(e.target.dataset.row),key=e.target.dataset.field,content=e.clipboardData?.getData('text/plain');if(busy||!key||!content||!/[\t\n]/.test(content))return;e.preventDefault();
  try{const matrix=XLSX.utils.sheet_to_json(XLSX.read(content,{type:'string',FS:'\t',raw:true}).Sheets.Sheet1,{header:1,defval:'',raw:true});const kind=rows[row].kind,keys=D.fields[kind],offset=keys.indexOf(key);
   if(matrix.length+rows.length>5000||matrix.some(r=>r.length>keys.length-offset))throw Error('붙여넣을 행·열 범위를 확인해 주세요.');
   const positions=visible().map(x=>x.i),start=positions.indexOf(row);const copy=rows.map(r=>({...r}));
   matrix.forEach((values,n)=>{let index=positions[start+n];if(index===undefined){index=copy.length;copy.push(D.blank(kind,ctx.name,ctx.settings(),ctx.today(),makeId()));}if(copy[index].kind!==kind)throw Error('같은 데이터 구분의 행에 붙여넣어 주세요.');values.forEach((value,col)=>{copy[index][keys[offset+col]]=value;});});rows=copy;invalidate();draw();setError('');
  }catch(err){setError(err);}
 });
 window.addEventListener('beforeunload',e=>{if(dirty||busy||loadingFile){e.preventDefault();e.returnValue='';}});
 return {render(){if(!loaded||!dirty&&!busy&&loadedSignature!==signature())load(false);},isBusy:()=>busy};
};
})(window);
