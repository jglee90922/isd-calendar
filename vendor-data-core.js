/* One vendor input table, normalized into the existing revision records. */
(function(root){
'use strict';
const C=typeof module==='object'?require('./vendor-dashboard-core.js'):root.VendorDashboardCore;
const L=typeof module==='object'?require('./vendor-lead-import.js'):root.VendorLeadImport;
const R=typeof module==='object'?require('./vendor-requests.js'):root.VendorRequests;
const kinds={metric:'분기 실적',annual:'연간 실적',partners:'파트너',partnerBooking:'파트너 부킹',promotion:'프로모션',lead:'리드',action:'액션플랜',request:'커뮤니케이션'};
const states={promotion:{planned:'계획',confirmed:'확정',gate:'결정 시점',done:'완료'},lead:L.stages,action:{planned:'예정',working:'진행 중',hold:'보류',done:'완료'},request:{received:'접수',working:'진행 중',waiting:'회신 대기',done:'완료'}};
const metricNames={deal_new:'신규',deal_renewal:'리뉴얼',deal_total:'전체 합계'},modes={set:'있음',none:'없음',pending:'확인 중'},teams={business:'사업부',marketing:'마케팅',vendor:'벤더'};
const defs=[['partnerName','파트너명'],['newBooking','신규 부킹 (K USD)','number'],['renewalBooking','리뉴얼 부킹 (K USD)','number'],['vendor','벤더'],['kind','데이터 구분'],['id','데이터ID'],['version','수정기준 (자동)'],['period','분기/FY 시작일','date'],['asOf','집계 기준일','date'],['metric','딜 구분'],['actual','실적','number'],['target','타겟','number'],['yoy','YoY 비교실적','number'],['qoq','QoQ 비교실적','number'],['mode','연간 타겟 유무'],['registered','등록 파트너','number'],['active','활성 파트너','number'],['newActive','신규 활성','number'],['reactivated','재활성','number'],['title','제목/고객명'],['owner','담당자'],['status','진행 상태'],['start','시작일','date'],['end','종료일','date'],['scheme','보상 스킴'],['goalName','목표 지표'],['unit','단위'],['rule','인정/완료 기준'],['source','자료 출처/행사'],['note','비고'],['contact','고객 담당자'],['email','이메일'],['phone','전화번호'],['lastContact','최근 접촉일','date'],['next','다음 조치'],['due','처리/후속 기한','date'],['content','요청 내용'],['requester','요청 부서/요청자'],['created','요청일','date'],['requestTeam','요청 구분'],['marketingContact','마케팅 담당자'],['response','이번 대응 내용'],['priority','우선순위']];
const fields={partnerBooking:['period','asOf','partnerName','newBooking','renewalBooking','owner','note'],metric:['period','asOf','metric','unit','actual','target','yoy','qoq','source','note'],annual:['period','asOf','metric','unit','mode','target','actual','source'],partners:['period','asOf','registered','active','newActive','reactivated','rule'],promotion:['title','start','end','owner','status','scheme','goalName','unit','target','actual','rule'],lead:['title','contact','email','phone','source','status','owner','lastContact','next','due','note'],action:['period','title','rule','owner','due','status','note'],request:['requestTeam','title','content','marketingContact','requester','owner','created','due','priority','status','response','next']};
const scopes={
 data:{title:'통합입력',sheet:'통합입력',kinds:['metric','annual'],description:'분기 실적과 FY 누적·타겟을 입력합니다. 금액은 K USD입니다.',help:'신규·리뉴얼은 같은 집계일로 입력하세요. 연간 타겟이 없으면 타겟 유무를 ‘없음’으로 선택하세요.'},
 'partner-data':{title:'파트너 부킹 현황',sheet:'파트너부킹',kinds:['partnerBooking'],description:'파트너별 해당 Q 누적 부킹을 신규·리뉴얼로 나눠 입력합니다. 금액은 K USD입니다.',help:'파트너 1개사·분기당 한 행입니다. 신규·리뉴얼 부킹이 없으면 0을 입력하세요. 같은 분기의 집계일을 맞추면 입력 파트너의 합계와 부킹 발생 파트너 수를 대시보드에 표시합니다. 분기 실적·타겟 입력값과 별도로 집계합니다.'},
 'promotion-data':{title:'프로모션 입력',sheet:'프로모션',kinds:['promotion'],description:'기간·스킴과 DR·매출·부킹 등 목표별 실적을 관리합니다.',help:'목표 1개당 한 행입니다. ‘목표 추가’로 같은 프로모션의 목표를 늘립니다. 같은 ID의 행은 제목·기간·스킴·담당자를 동일하게 유지하세요. 캘린더에서 등록한 프로모션은 원본 캘린더에서 수정합니다.'},
 'lead-data':{title:'Lead follow-up 입력',sheet:'리드',kinds:['lead'],description:'고객·담당자·진행 단계·최근 접촉·다음 조치를 한 표로 관리합니다.',help:'리드 1건당 한 행입니다. 기존 목록 수정은 현재 표를 내려받아 작성하세요. 다른 형식의 기존 엑셀은 리드 상세 화면의 ‘기존 파일 열 연결’ 기능을 이용하세요.'},
 'action-data':{title:'액션플랜 입력',sheet:'액션플랜',kinds:['action'],description:'분기별 과제·완료 기준·담당자·기한·이행 상태를 관리합니다.',help:'과제 1건당 한 행입니다. 벤더 FY에 맞는 분기 시작일과 완료 기준을 입력하세요.'},
 'request-data':{title:'커뮤니케이션 입력',sheet:'커뮤니케이션',kinds:['request'],description:'사업부·마케팅·벤더 요청과 대응 현황을 관리합니다.',help:'요청 1건당 한 행입니다. 마케팅 담당자는 이준희 과장·이형걸 사원·최윤채 사원·이준구 부장 중 선택합니다. 새 요청의 대응 담당자는 비워 두고, 요청 목록에서 처리할 사람이 ‘제가 담당할게요’를 눌러 등록합니다. 접수 상태에는 다음 조치가 필요 없습니다. 기존 요청을 수정하거나 완료할 때 ‘이번 대응 내용’을 작성하세요. 이전 대응 이력은 유지됩니다.'}
};
const scopeLabels={partnerBooking:{period:'분기 시작일'},promotion:{title:'프로모션명',rule:'목표 인정 기준'},lead:{title:'고객 / 리드명',status:'리드 단계',source:'출처 / 행사명',due:'다음 조치 기한'},action:{period:'분기 시작일',title:'핵심 과제',rule:'완료 기준',note:'진행 내용'},request:{title:'요청 제목',owner:'대응 담당자',due:'처리 희망일',content:'요청 내용'}};
function scopeDefs(scope){const labels=scope.kinds.length===1?scopeLabels[scope.kinds[0]]||{}:{};const keys=['vendor','kind','id','version',...new Set(scope.kinds.flatMap(k=>fields[k]))];return keys.map(k=>{const d=defs.find(d=>d[0]===k);return [d[0],labels[k]||d[1],d[2]];});}
const partnerKey=p=>[p.quarterStart,txt(p.partnerName).normalize('NFKC').replace(/\s+/g,' ').toLowerCase()].join('|');
function validateBooking(p,settings,date){
 const q=C.quarter(p.quarterStart,settings);if(!q||q.start!==p.quarterStart)throw Error('벤더 FY 설정에 맞는 분기 시작일을 입력해 주세요.');
 if(!txt(p.partnerName))throw Error('파트너명을 입력해 주세요.');
 if(!C.validDate(p.asOf)||p.asOf<q.start||p.asOf>q.end||p.asOf>date)throw Error('부킹 집계일은 해당 Q 안의 오늘 이전 날짜여야 합니다.');
 if([p.newBooking,p.renewalBooking].some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0))throw Error('신규·리뉴얼 부킹을 0 이상으로 입력해 주세요. 실적이 없으면 0입니다.');
}
function bookingSummary(records,quarterStart){
 const items=records.filter(r=>r.kind==='partnerBooking'&&!r.current.deleted&&r.current.payload.quarterStart===quarterStart);
 const rows=items.map(r=>r.current.payload),valid=rows.length>0&&!items.some(r=>r.conflict)&&new Set(rows.map(p=>p.asOf)).size===1&&new Set(rows.map(partnerKey)).size===rows.length&&rows.every(p=>[p.newBooking,p.renewalBooking].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0));
 const sum=key=>valid?C.total(rows,key):null;
 return {count:rows.length,active:valid?rows.filter(p=>p.newBooking+p.renewalBooking>0).length:null,newBooking:sum('newBooking'),renewalBooking:sum('renewalBooking'),total:valid?sum('newBooking')+sum('renewalBooking'):null,asOf:valid?rows[0].asOf:'',valid};
}
const txt=v=>String(v??'').trim(),enumKey=(map,v)=>Object.keys(map).find(k=>k===v||map[k]===v)||'',label=(map,v)=>map[v]||v||'';
function number(v){const s=txt(v).replaceAll(',','');if(!s)return null;if(!/^\d+(\.\d+)?$/.test(s)||!Number.isFinite(Number(s)))throw Error('숫자는 0 이상으로 입력해 주세요.');return Number(s);}
const clean=v=>JSON.stringify(v,Object.keys(v).sort());
const version=r=>r.heads.map(h=>h.id).sort().join('|');
function rowFrom(r,vendor){
 const p=r.current.payload,k=r.kind,row={vendor,kind:k,id:r.recordId,version:version(r)};
 for(const field of fields[k])row[field]=p[field]??'';
 row.period=k==='annual'||k==='partners'?r.recordId:p.quarterStart||'';
 row.metric=label(metricNames,p.metricId);row.mode=label(modes,p.mode);row.status=label(states[k]||{},k==='lead'?p.stage:p.status);
 row.title=k==='lead'?p.name:p.title||'';row.rule=k==='action'?p.criteria:p.rule||'';row.requestTeam=label(teams,p.requestTeam);
 if(['metric','annual','partnerBooking'].includes(k))row.unit='K USD';
 if(k==='request')row.response='';
 if(k==='promotion')return (p.goals?.length?p.goals:[{}]).map(g=>({...row,goalName:g.name||'',unit:g.unit||'',target:g.target??'',actual:g.actual??'',rule:g.rule||''}));
 return [row];
}
function rowsFrom(records,vendor){return records.filter(r=>Object.hasOwn(kinds,r.kind)&&!r.current.deleted).flatMap(r=>rowFrom(r,vendor));}
function blank(kind,vendor,settings,date,id){const q=C.quarter(date,settings);return {vendor,kind,id:['metric','annual','partners'].includes(kind)?'':id,version:'',period:kind==='annual'?q?.fyStart||'':q?.start||'',asOf:date,metric:kind==='annual'?'전체 합계':'신규',unit:kind==='promotion'?'건':'K USD',status:({promotion:'계획',lead:'미접촉',action:'예정',request:'접수'})[kind]||'',created:date,priority:'보통',mode:'확인 중'};}
function hasInput(row){if(txt(row.version))return true;const keys={metric:['actual','target','yoy','qoq'],annual:['actual','target','mode'],partnerBooking:['partnerName','newBooking','renewalBooking'],partners:['registered','active','newActive','reactivated','rule']};return (keys[row.kind]||['title','content','goalName']).some(k=>txt(row[k])&&!(k==='mode'&&['확인 중','pending'].includes(row[k])));}
function normalized(row,kind,settings,date,old,author){
 const p={...(old||{})};
 for(const f of fields[kind]){
  const def=defs.find(d=>d[0]===f);const value=row[f];
  if(txt(value).length>4000)throw Error(def[1]+'은 4,000자 이내로 입력해 주세요.');
  p[f]=def[2]==='number'?number(value):def[2]==='date'?(txt(value)?L.date(value):''):txt(value);
 }
 const req=(key,description)=>{if(!p[key])throw Error(description+'을(를) 입력해 주세요.');};
 const quarter=()=>{const q=C.quarter(p.period,settings);if(!q||q.start!==p.period)throw Error('벤더 FY 설정에 맞는 분기 시작일을 입력해 주세요.');return q;};
 if(['metric','annual','partners','partnerBooking','action'].includes(kind)&&!C.quarter(date,settings))throw Error('상단 벤더 설정에서 FY 시작월을 먼저 저장해 주세요.');
 if(kind==='metric'){
  p.metricId=enumKey(metricNames,p.metric);if(!['deal_new','deal_renewal'].includes(p.metricId))throw Error('분기 실적의 딜 구분은 신규 또는 리뉴얼입니다.');
  if(p.unit!=='K USD')throw Error('금액 단위는 K USD(천 달러)입니다.');p.quarterStart=p.period;C.validateMetric(p,settings,date);
 }
 if(kind==='annual'){
  const q=C.quarter(p.period,settings);if(!q||q.fyStart!==p.period)throw Error('FY 시작일을 확인해 주세요.');
  p.metricId=enumKey(metricNames,p.metric);if(!p.metricId)throw Error('연간 실적의 딜 구분을 확인해 주세요.');
  if(p.unit!=='K USD')throw Error('금액 단위는 K USD(천 달러)입니다.');
  p.mode=enumKey(modes,p.mode);if(!p.mode)throw Error('연간 타겟 유무를 선택해 주세요.');
  if(p.mode==='set'&&!(p.target>0))throw Error('연간 타겟은 0보다 커야 합니다.');if(p.mode!=='set')p.target=null;
  if(!C.validDate(p.asOf)||p.asOf<q.fyStart||p.asOf>q.fyEnd||p.asOf>date)throw Error('집계 기준일은 해당 FY 안의 오늘 이전 날짜여야 합니다.');
 }
 if(kind==='partnerBooking'){p.quarterStart=p.period;validateBooking(p,settings,date);}
 if(kind==='partners'){
  const q=quarter();if(!C.validDate(p.asOf)||p.asOf<q.start||p.asOf>q.end||p.asOf>date)throw Error('파트너 기준일은 해당 Q 안의 오늘 이전 날짜여야 합니다.');req('rule','활성 파트너 인정 기준');
  for(const f of ['registered','active','newActive','reactivated'])if(p[f]!==null&&!Number.isInteger(p[f]))throw Error('파트너 수는 정수여야 합니다.');
  if(p.active!==null&&p.registered!==null&&p.active>p.registered)throw Error('활성 파트너 수가 등록 수보다 많습니다.');
  if(p.active!==null&&(p.newActive??0)+(p.reactivated??0)>p.active)throw Error('신규·재활성 합계가 활성 수보다 많습니다.');
 }
 if(kind==='promotion'){
  req('title','프로모션명');req('scheme','보상 스킴');req('start','시작일');req('end','종료일');if(p.end<p.start)throw Error('종료일은 시작일 이후여야 합니다.');
  req('goalName','목표 지표');req('rule','목표 인정 기준');if(!['건','K USD','개사','명'].includes(p.unit))throw Error('목표 단위를 확인해 주세요.');
  if(!(p.target>0))throw Error('프로모션 목표는 0보다 커야 합니다.');
  if(p.unit!=='K USD'&&(!Number.isInteger(p.target)||p.actual!==null&&!Number.isInteger(p.actual)))throw Error('건수·회사 수·인원은 정수여야 합니다.');
  p.goals=[{name:p.goalName,unit:p.unit,target:p.target,actual:p.actual,rule:p.rule}];
 }
 if(kind==='lead'){
  p.name=p.title;p.stage=enumKey(states.lead,p.status);L.validate(p,date);delete p.title;delete p.status;
 }
 if(kind==='action'){quarter();p.quarterStart=p.period;p.criteria=p.rule;req('title','핵심 과제');req('criteria','완료 기준');req('owner','담당자');req('due','처리 기한');delete p.rule;}
 if(kind==='request'){
  p.requestTeam=enumKey(teams,p.requestTeam);p.requester||=old?.requester||author;p.created||=old?.created||date;
  if(!['보통','높음','낮음'].includes(p.priority))throw Error('우선순위를 선택해 주세요.');
 }
 if(states[kind]&&kind!=='lead'){p.status=enumKey(states[kind],p.status);req('status','진행 상태');}
 if(kind==='request'&&p.status==='done')p.next='';
 const meta={period:p.period,response:p.response};
 for(const f of ['period','metric','unit','goalName','modeLabel'])delete p[f];
 if(kind==='promotion')for(const f of ['target','actual','rule'])delete p[f];
 return {p,...meta};
}
const identity=(kind,p)=>kind==='partnerBooking'?partnerKey(p):kind==='lead'?L.fingerprint(p):kind==='promotion'?[p.title,p.start,p.end].join('|'):kind==='action'?[p.title,p.quarterStart,p.owner].join('|'):[p.title,p.created,p.requester].join('|');
function preview(rows,{vendor,records,settings,date,author,quarterRecords=[],allowedKinds=null,makeId=()=>crypto.randomUUID().replaceAll('-','')}){
 if(rows.length>5000)throw Error('한 번에 5,000행까지 입력할 수 있습니다.');
 const entries=[],errors=[],byKey=new Map(records.map(r=>[r.key,r])),groups=new Map();
 rows.forEach((raw,i)=>{
  try{
   const kind=enumKey(kinds,txt(raw.kind)),row={...raw,kind};if(!kind)throw Error('데이터 구분을 확인해 주세요.');if(allowedKinds&&!allowedKinds.includes(kind))throw Error('이 양식에 해당하지 않는 데이터입니다. 해당 항목의 전용 양식을 사용해 주세요.');if(!hasInput(row))return;
   if(txt(row.vendor)!==vendor)throw Error('다른 벤더 자료입니다. 현재 벤더의 표를 사용해 주세요.');
   let id=txt(row.id),previous=id?byKey.get(kind+':'+id):null;
   if(previous&&kind!=='promotion'&&!previous.conflict&&!previous.current.deleted){
    const original=rowFrom(previous,vendor)[0];
    if(fields[kind].every(f=>txt(row[f])===txt(original[f]))){
     const key=kind+':'+id;if(groups.has(key))throw Error('같은 데이터가 표에 중복되었습니다.');
     groups.set(key,{kind,recordId:id,p:previous.current.payload,rows:[i+1],previous,preSkipped:true});return;
    }
   }
   let result=normalized(row,kind,settings,date,previous?.current.payload,author),p=result.p;
   const natural=kind==='metric'?p.metricId+':'+p.quarterStart:['annual','partners'].includes(kind)?result.period:null;
   if(natural){if(id&&id!==natural)throw Error('기존 행의 기간·딜 구분은 바꿀 수 없습니다. 새 행으로 추가해 주세요.');id=natural;previous=byKey.get(kind+':'+id);}
   else if(!id){const matches=records.filter(r=>r.kind===kind&&identity(kind,r.current.payload)===identity(kind,p));if(matches.length>1)throw Error('같은 자료가 여러 건입니다. 현재 데이터의 ID로 구분해 주세요.');previous=matches[0];id=previous?.recordId||makeId();}
   if(!/^[A-Za-z0-9_.:-]{1,100}$/.test(id))throw Error('데이터ID 형식을 확인해 주세요.');
   if(previous?.current.deleted)throw Error('보관된 자료입니다. 새 행을 만들어 주세요.');if(previous?.conflict)throw Error('동시 수정된 자료입니다. 상세 화면에서 먼저 확인해 주세요.');
   if(previous)({p,...result}=normalized(row,kind,settings,date,previous.current.payload,author));
   raw.id=id;
   const key=kind+':'+id,existing=groups.get(key);
   if(existing){
    if(kind!=='promotion')throw Error('같은 데이터가 표에 중복되었습니다.');
    const withoutGoals=x=>Object.fromEntries(Object.entries(x).filter(([k])=>k!=='goals'));
    if(clean(withoutGoals(existing.p))!==clean(withoutGoals(p))||txt(existing.version)!==txt(row.version))throw Error('같은 프로모션의 제목·기간·스킴·담당·수정기준은 모두 같아야 합니다.');
    if(existing.p.goals.some(g=>g.name===p.goals[0].name&&g.unit===p.goals[0].unit))throw Error('같은 프로모션 목표가 중복되었습니다.');
    existing.p.goals.push(...p.goals);existing.rows.push(i+1);return;
   }
   groups.set(key,{kind,recordId:id,p,rows:[i+1],version:txt(row.version),previous,response:result.response});
  }catch(e){errors.push({row:i+1,message:e.message});}
 });
 for(const item of groups.values())try{
  const {p,previous,kind}=item;if(item.preSkipped){entries.push({kind,recordId:item.recordId,payload:p,parents:previous.heads.map(h=>h.id),rows:item.rows,status:'skip',before:p});continue;}delete p.response;
  const payloadSame=previous&&Object.keys(p).filter(k=>k!=='history').every(k=>JSON.stringify(p[k]===''?null:p[k]??null)===JSON.stringify(previous.current.payload[k]===''?null:previous.current.payload[k]??null));
  const responseSame=!item.response||item.response===previous?.current.payload.history?.at(-1)?.text;
  const same=payloadSame&&responseSame;
  if(kind==='metric'&&!same&&quarterRecords.some(r=>r.kind==='quarterPerformance'&&r.recordId===p.quarterStart&&!r.current.deleted))throw Error('이 분기는 주차별 실적으로 관리 중입니다. 분기 실적 상세에서 수정해 주세요.');
  if(previous&&!same&&item.version!==version(previous))throw Error('기존 데이터가 변경되었습니다. 현재 데이터 불러오기 또는 새 엑셀 내려받기 후 수정해 주세요.');
  if(!previous&&item.version)throw Error('수정할 원본을 찾을 수 없습니다. 벤더와 데이터ID를 확인해 주세요.');
  if(kind==='request'&&!same){
   R.validate(p,{old:previous?.current.payload,date});
   if((previous||p.status==='done')&&!item.response)throw Error('요청 수정·완료에는 이번 대응 내용을 입력해 주세요.');
   p.history=[...(previous?.current.payload.history||[]),{date,at:new Date().toISOString(),by:author,status:p.status,text:item.response||'요청 접수'}];if(p.status==='done')p.next='';
  }
  entries.push({kind,recordId:item.recordId,payload:p,parents:previous?.heads.map(h=>h.id)||[],rows:item.rows,status:same?'skip':previous?'update':'new',before:previous?.current.payload||null});
 }catch(e){errors.push({row:item.rows[0],message:e.message});}
 const replacements=new Map(entries.filter(e=>e.kind==='partnerBooking').map(e=>[e.recordId,e]));
 const partners=records.filter(r=>r.kind==='partnerBooking'&&!r.current.deleted&&!replacements.has(r.recordId)).map(r=>({recordId:r.recordId,payload:r.current.payload,rows:[]})).concat([...replacements.values()]);
 const seenPartners=new Map();for(const e of partners){const key=partnerKey(e.payload),prior=seenPartners.get(key);if(prior){const affected=e.rows.length?e:prior;if(affected.rows.length)errors.push({row:affected.rows[0],message:'같은 분기의 파트너가 중복되었습니다. 기존 행을 수정해 주세요.'});}seenPartners.set(key,e);}
 return {entries,errors};
}
const options=(kind,key)=>kind==='request'&&key==='marketingContact'?R.contactOptions():key==='kind'?Object.entries(kinds):key==='metric'?Object.entries(metricNames).filter(([id])=>kind==='annual'||id!=='deal_total'):key==='mode'?Object.entries(modes):key==='status'?Object.entries(states[kind]||{}):key==='unit'?(kind==='promotion'?['건','K USD','개사','명']:['K USD']).map(v=>[v,v]):key==='requestTeam'?Object.entries(teams):key==='priority'?['보통','높음','낮음'].map(v=>[v,v]):null;
root.VendorDataCore={kinds,defs,fields,states,options,rowsFrom,blank,preview,hasInput,version,scopes,scopeDefs,partnerKey,validateBooking,bookingSummary};if(typeof module==='object')module.exports=root.VendorDataCore;
})(typeof window==='object'?window:globalThis);
