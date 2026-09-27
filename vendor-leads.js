(function(root){
'use strict';
root.createVendorLeads=function(host){
 const L=root.VendorLeadImport,$=s=>document.querySelector(s),esc=host.esc;
 let page=0,workbook=null,preview=null,reading=false,busy=false,token=0;
 const rows=()=>host.records().filter(r=>!r.current.deleted);
 function render(){
  const all=rows(),query=$('#leadSearch').value.trim().toLocaleLowerCase(),stage=$('#leadStage').value;
  $('#leadSummary').innerHTML=Object.entries(L.stages).map(([k,v])=>`<div class="stage"><small>${v}</small><b>${all.filter(r=>r.current.payload.stage===k).length.toLocaleString()}</b></div>`).join('');
  const filtered=all.filter(r=>(!stage||r.current.payload.stage===stage)&&(!query||Object.values(r.current.payload).some(v=>String(v).toLocaleLowerCase().includes(query)))).sort((a,b)=>(b.current.savedAt||'').localeCompare(a.current.savedAt||'')||a.recordId.localeCompare(b.recordId));
  page=Math.max(0,Math.min(page,Math.ceil(filtered.length/50)-1));const visible=filtered.slice(page*50,page*50+50);
  $('#leadCount').textContent=`전체 ${all.length.toLocaleString()}건 · 검색 ${filtered.length.toLocaleString()}건${filtered.length?` · ${page*50+1}–${Math.min((page+1)*50,filtered.length)} 표시`:''}`;
  $('#leadPrev').disabled=page===0;$('#leadNext').disabled=(page+1)*50>=filtered.length;$('#exportLeads').disabled=!all.length;
  $('#leadContent').innerHTML=visible.length?`<table><thead><tr><th>고객 / 리드</th><th>연락 대상</th><th>출처</th><th>단계</th><th>담당</th><th>최근 접촉</th><th>다음 조치 / 기한</th><th>수정</th></tr></thead><tbody>${visible.map(r=>{const p=r.current.payload;return `<tr><td>${esc(p.name)}</td><td>${esc(p.contact||'')}<small>${esc(p.email||'')}</small><small>${esc(p.phone||'')}</small></td><td>${esc(p.source)}</td><td>${esc(L.stages[p.stage]||p.stage)}</td><td>${esc(p.owner)}</td><td>${esc(p.lastContact||'미입력')}</td><td>${esc(p.next)}<small>${esc(p.due||'')}</small></td><td><button class="btn" data-edit-kind="lead" data-record="${esc(r.recordId)}">${r.conflict?'동시 수정 확인':'수정'}</button></td></tr>`}).join('')}</tbody></table>`:`<div class="live-empty">${all.length?'검색 조건에 맞는 리드가 없습니다.':'등록된 리드가 없습니다.'}</div>`;
 }
 function writeFile(data,file,sheet='리드목록'){
  if(!root.XLSX)throw Error('엑셀 기능을 불러오지 못했습니다. 새로고침해 주세요.');
  const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(data);ws['!cols']=data[0].map((_,i)=>({wch:i===0?36:i===11?48:24}));
  XLSX.utils.book_append_sheet(wb,ws,sheet);XLSX.writeFile(wb,file);
 }
 const headings=L.columns.map(c=>c[1]);
 function exportLeads(){writeFile([headings,...rows().map(r=>L.columns.map(([k])=>k==='id'?r.recordId:k==='stage'?L.stages[r.current.payload.stage]:r.current.payload[k]||''))],host.name+'_리드목록.xlsx');}
 function template(){writeFile([headings],host.name+'_리드입력_양식.xlsx');}
 function resetPreview(){preview=null;$('#saveLeadImport').disabled=true;$('#leadImportPreview').innerHTML='';$('#leadImportErrors').innerHTML='';$('#leadImportStatus').textContent='';}
 function setBusy(value){busy=value;$('#leadImportFile').disabled=value;$('#leadSheet').disabled=value;$('#checkLeads').disabled=value;$('#leadMapping').querySelectorAll('select').forEach(x=>x.disabled=value);$('#closeLeadImport').disabled=value;$('#downloadLeadTemplate').disabled=value;$('#saveLeadImport').disabled=value||!preview||!!preview.errors.length||!preview.entries.some(r=>r.status!=='skip');}
 function mapSheet(){
  token++;resetPreview();const ws=workbook?.Sheets[$('#leadSheet').value];if(!ws)return;
  const ref=ws['!ref'];if(ref){const range=XLSX.utils.decode_range(ref);if(range.e.r>5000||range.e.c>200)throw Error('한 시트에 5,000행, 201열까지 읽을 수 있습니다. 첫 행은 열 제목으로 작성해 주세요.');}
  const grid=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:'',blankrows:true}),headers=(grid[0]||[]).map(String);
  const suggested=L.mapping(headers);$('#leadMapping').innerHTML=L.columns.map(([k,label,,required])=>`<label>${esc(label)}${required?' *':''}<select data-map="${k}" aria-label="${esc(label)} 열 연결"><option value="-1">연결 안 함</option>${headers.map((h,i)=>`<option value="${i}" ${suggested[k]===i?'selected':''}>${i+1}열 · ${esc(h||'(빈 제목)')}</option>`).join('')}</select></label>`).join('');
  $('#leadMappingPanel').hidden=false;$('#checkLeads').disabled=false;return grid;
 }
 async function loadFile(e){
  workbook=null;token++;const job=token;resetPreview();$('#leadMappingPanel').hidden=true;$('#checkLeads').disabled=true;const file=e.target.files[0];if(!file)return;
  reading=true;$('#leadImportStatus').textContent='파일을 읽는 중…';
  try{
   if(file.size>10*1024*1024)throw Error('파일은 10MB 이하로 올려 주세요.');
   if(!/\.(xlsx|xls|csv)$/i.test(file.name))throw Error('xlsx, xls, csv 파일을 선택해 주세요.');
   const bytes=await file.arrayBuffer();if(job!==token)return;
   workbook=XLSX.read(bytes,{type:'array',cellDates:false,cellNF:true,raw:true});
   // Convert date cells using the workbook's own date system; preserve phone/ID display formats.
   for(const ws of Object.values(workbook.Sheets))for(const [address,cell] of Object.entries(ws)){
    if(address.startsWith('!')||!cell||cell.t!=='n')continue;
    if(cell.w&&/^0\d/.test(cell.w)&&!XLSX.SSF.is_date(cell.z||''))cell.v=cell.w;
   }
   $('#leadSheet').innerHTML=workbook.SheetNames.map(s=>`<option>${esc(s)}</option>`).join('');mapSheet();$('#leadImportStatus').textContent='열 연결을 확인하고 미리보기를 눌러 주세요.';
  }catch(error){workbook=null;$('#leadImportStatus').textContent=error.message;}finally{reading=false;}
 }
 async function check(){
  if(busy||reading||!workbook)return;const job=++token;resetPreview();$('#checkLeads').disabled=true;$('#leadImportStatus').textContent='최신 리드와 대조 중…';
  try{
   const ws=workbook.Sheets[$('#leadSheet').value],grid=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:'',blankrows:true});
   if(grid.length>5001)throw Error('한 번에 5,000건까지 올릴 수 있습니다.');
   const map=Object.fromEntries([...$('#leadMapping').querySelectorAll('select')].map(el=>[el.dataset.map,Number(el.value)]));
   for(const k of ['lastContact','due'])if(map[k]>=0)for(let i=1;i<grid.length;i++)if(typeof grid[i][map[k]]==='number'){
    const d=XLSX.SSF.parse_date_code(grid[i][map[k]],{date1904:!!workbook.Workbook?.WBProps?.date1904});
    if(d)grid[i][map[k]]=`${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
   }
   await host.refresh();if(job!==token)return;
   preview=L.preview(grid.slice(1),map,host.records(),host.today(),()=>crypto.randomUUID().replaceAll('-',''));
   const count=s=>preview.entries.filter(r=>r.status===s).length;
   $('#leadImportStatus').textContent=`신규 ${count('new')}건 · 수정 ${count('update')}건 · 변경 없음 ${count('skip')}건 · 오류 ${preview.errors.length}건`;
   $('#leadImportErrors').innerHTML=preview.errors.length?`<p>오류를 고친 파일로 다시 올려 주세요. 아직 저장하지 않았습니다.</p><ul>${preview.errors.slice(0,30).map(e=>`<li>${e.row}행 · ${esc(e.name)}: ${esc(e.message)}</li>`).join('')}</ul>${preview.errors.length>30?'<p>처음 30개 오류를 표시합니다.</p>':''}`:'';
   const labels={new:'신규',update:'수정',skip:'변경 없음'};
   $('#leadImportPreview').innerHTML=preview.entries.length?`<p>검토 ${preview.entries.length.toLocaleString()}건 · 미리보기는 처음 50건 표시</p><table><thead><tr><th>행</th><th>처리</th><th>고객 / 리드</th><th>연락 대상</th><th>출처</th><th>단계</th><th>담당</th><th>다음 조치</th></tr></thead><tbody>${preview.entries.slice(0,50).map(r=>`<tr><td>${r.row}</td><td>${labels[r.status]}</td><td>${esc(r.p.name)}</td><td>${esc(r.p.email||r.p.contact||'')}</td><td>${esc(r.p.source)}</td><td>${esc(L.stages[r.p.stage])}</td><td>${esc(r.p.owner)}</td><td>${esc(r.p.next)}<small>${esc(r.p.due)}</small></td></tr>`).join('')}</tbody></table>`:'';
   if(!preview.entries.length&&!preview.errors.length)$('#leadImportStatus').textContent='입력된 리드가 없습니다.';
   $('#saveLeadImport').disabled=!!preview.errors.length||!preview.entries.some(r=>r.status!=='skip');
  }catch(error){$('#leadImportStatus').textContent=error.message;}finally{if(job===token)$('#checkLeads').disabled=false;}
 }
 async function commit(){
  if(busy||!preview||preview.errors.length)return;const queue=preview.entries.filter(r=>r.status!=='skip');if(!queue.length)return;
  setBusy(true);let done=0;
  try{
   await host.saveBatch(queue.map(r=>({kind:'lead',recordId:r.id,payload:r.p,parents:r.parents})),n=>{done=n;$('#leadImportStatus').textContent=`${n.toLocaleString()} / ${queue.length.toLocaleString()}건 저장 완료 · 창을 닫지 마세요.`;});
   $('#leadImportDialog').close();host.notice(`리드 ${done.toLocaleString()}건을 공유 저장했습니다.`);preview=null;page=0;render();
  }catch(error){resetPreview();$('#leadImportStatus').textContent=`${done.toLocaleString()}건 저장 완료. 나머지는 저장 여부를 다시 확인해야 합니다. 미리보기를 다시 눌러 주세요. ${error.message}`;render();}
  finally{setBusy(false);}
 }
 $('#leadSearch').oninput=()=>{page=0;render();};$('#leadStage').innerHTML='<option value="">전체 단계</option>'+Object.entries(L.stages).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');$('#leadStage').onchange=()=>{page=0;render();};
 $('#leadPrev').onclick=()=>{page--;render();};$('#leadNext').onclick=()=>{page++;render();};
 $('#exportLeads').onclick=()=>{try{exportLeads();}catch(e){host.notice(e.message,true);}};
 $('#uploadLeads').onclick=()=>{if(host.saving())return;token++;workbook=null;resetPreview();$('#leadImportFile').value='';$('#leadMappingPanel').hidden=true;$('#checkLeads').disabled=true;$('#leadImportVendor').textContent=host.name;$('#leadImportDialog').showModal();};
 $('#downloadLeadTemplate').onclick=()=>{try{template();}catch(e){$('#leadImportStatus').textContent=e.message;}};
 $('#leadImportFile').onchange=loadFile;$('#leadSheet').onchange=()=>{try{mapSheet();}catch(e){$('#leadImportStatus').textContent=e.message;}};
 $('#leadMapping').onchange=()=>{token++;resetPreview();};$('#checkLeads').onclick=check;$('#saveLeadImport').onclick=commit;
 $('#closeLeadImport').onclick=()=>{if(!busy){token++;$('#leadImportDialog').close();}};$('#leadImportDialog').addEventListener('cancel',e=>{if(busy)e.preventDefault();else token++;});
 window.addEventListener('beforeunload',e=>{if(busy){e.preventDefault();e.returnValue='';}});
 return {render};
};
})(window);
