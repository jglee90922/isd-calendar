(()=>{
'use strict';
const C=window.VendorDashboardCore,API=document.currentScript.dataset.api,$=s=>document.querySelector(s);
const slug=new URLSearchParams(location.search).get('vendor'),name=C.vendors[slug];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const fmt=n=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:2}):'—';
const pct=(n,t)=>typeof n==='number'&&typeof t==='number'&&t>0?`${fmt(n/t*100)}%`:'—';
const uid=()=>crypto.randomUUID().replaceAll('-','');
let key='',user='',state=null,records=[],editing=null,saving=false,refreshing=false,lastLoaded='',importRows=[];
try{key=localStorage.getItem('isd-cal-key')||'';user=localStorage.getItem('isd-cal-user')||'';}catch(_){}
const requestStates={received:'접수',working:'진행 중',waiting:'회신 대기',done:'완료'},actionStates={planned:'예정',working:'진행 중',hold:'보류',done:'완료'},leadStates={new:'미접촉',contacted:'접촉',qualified:'유효 리드',opportunity:'영업 기회',won:'수주',lost:'종료'};
const kindNames={settings:'벤더 설정',definition:'실적 항목',metric:'분기 실적',annual:'연간 타겟',partners:'파트너 현황',promotion:'프로모션',lead:'리드',action:'액션 플랜',request:'사업부 요청'};
async function api(method,path,body){
 let r;try{r=await fetch(API+path,{method,cache:'no-store',headers:{'x-cal-key':encodeURIComponent(key),'x-cal-user':encodeURIComponent(user),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});}catch(_){throw Error('네트워크 연결을 확인해 주세요. 입력 내용은 저장되지 않았습니다.');}
 if(r.status===401){lock();throw Error('비밀번호를 다시 확인해 주세요.');}if(!r.ok)throw Error(`저장소 연결 오류 (${r.status}). 잠시 후 다시 시도해 주세요.`);return r.status===204?null:r.json();
}
function lock(){state=null;records=[];$('#app').hidden=true;$('#authGate').hidden=false;document.body.classList.add('locked');}
function ingest(s){state=s;records=C.index(s.vendors,slug);lastLoaded=new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});}
const record=(kind,id)=>records.find(r=>r.kind===kind&&r.recordId===id);
const data=(kind,id)=>{const r=record(kind,id);return r&&!r.current.deleted?r.current.payload:null;};
const list=kind=>records.filter(r=>r.kind===kind&&!r.current.deleted);
const settings=()=>data('settings','main');
const currentQ=()=>C.quarter(today(),settings());
function metrics(){
 const defs=new Map((window.VENDOR_PROFILES[slug]?.metrics||[]).map(d=>[d.id,{...d}]));
 for(const r of list('definition'))defs.set(r.recordId,{...r.current.payload,id:r.recordId});
 return [...defs.values()].filter(d=>!d.hidden);
}
const metricRecord=(id,start)=>record('metric',`${id}:${start}`);
const metricData=(id,start)=>data('metric',`${id}:${start}`);
const primary=()=>metrics().find(m=>m.id===(settings()?.primaryMetric||$('#historyMetric').value))||metrics()[0];
const empty=(text,button='')=>`<div class="live-empty">${esc(text)}${button}</div>`;
const editButton=r=>`<button class="btn" data-edit-kind="${r.kind}" data-record="${esc(r.recordId)}">${r.conflict?'동시 수정 확인':'수정'}</button>`;
const newButton=(kind,label)=>`<button class="btn" data-new="${kind}">${label}</button>`;
const overdue=p=>p.status!=='done'&&p.due&&p.due<today();
function growthHTML(v,b,label){const g=C.growth(v,b);return `<div class="metric-change ${g===null?'neutral':g<0?'down':'up'}"><span>${label}</span><b>${g===null?(b===0?'산출 불가 · 기준 0':'비교 자료 없음'):`${g>0?'↑ +':g<0?'↓ −':''}${fmt(Math.abs(g))}%`}</b></div>`;}
function notice(text,error=false){const el=$('#saveNotice');el.textContent=text;el.hidden=false;el.classList.toggle('is-error',error);}
async function refresh(){if(refreshing||saving||!key)return;refreshing=true;try{ingest(await api('GET','/state'));render();}catch(e){if(state)$('#syncStatus').textContent='갱신 실패 · 마지막 확인 '+lastLoaded;else $('#loginError').textContent=e.message;}finally{refreshing=false;}}
async function saveRecord(kind,recordId,payload,parents,deleted=false){
 // Always re-read the record. Every write creates a unique revision document,
 // so even a simultaneous write between read and save cannot erase another edit.
 ingest(await api('GET','/state'));const latest=record(kind,recordId),heads=latest?.heads.map(h=>h.id)||[];
 if(!C.sameHeads(heads,parents))throw Error('다른 사람이 이 항목을 수정했습니다. 입력 내용은 그대로 두었습니다. 닫고 최신 내용을 확인한 뒤 다시 저장해 주세요.');
 const id='vd_'+slug+'_'+uid(),revision={schema:1,vendorId:slug,kind,recordId,parents:[...heads],payload,deleted,savedAt:new Date().toISOString(),author:user};
 const summary=summaryText(kind,payload);
 const body={vendor:name,title:`${name} · ${kindNames[kind]||kind} · ${payload.title||payload.name||payload.metricId||''}`.slice(0,120),dashboard_action:deleted?'보관':latest?'수정':'추가',detailSummary:summary,detailBefore:latest?summaryText(kind,latest.current.payload):"",_dashboard:revision};
 try{await api('PUT','/vendors/'+id,body);}catch(error){const latestState=await api('GET','/state').catch(()=>null);if(!latestState?.vendors?.[id])throw error;}
 ingest(await api('GET','/state'));if(!state.vendors[id])throw Error('저장 결과를 아직 확인하지 못했습니다. 새로고침 후 다시 확인해 주세요.');return id;
}
function summaryText(kind,p){if(kind==='metric')return `${p.metricId} · ${p.quarterStart} · 실적 ${fmt(p.actual)} / 타겟 ${fmt(p.target)}`;if(kind==='request')return `${p.title} · ${requestStates[p.status]} · 담당 ${p.owner} · 기한 ${p.due} · ${p.history?.at(-1)?.text||''}`;if(kind==='promotion')return `${p.title} · ${p.start}~${p.end} · ${(p.goals||[]).map(g=>`${g.name} ${fmt(g.actual)}/${fmt(g.target)} ${g.unit}`).join(' / ')}`;return Object.entries(p).filter(([k,v])=>!['history','goals'].includes(k)&&v!==''&&v!==null).map(([k,v])=>`${fieldLabels[k]||k}: ${typeof v==='object'?JSON.stringify(v):v}`).join(' · ').slice(0,1500);}
function render(){
 if(!state)return;$('#vendorName').textContent=name;document.title=name+' | 인성디지탈';$('#syncStatus').textContent=`공유 저장 연결 · ${user} · ${lastLoaded} 확인`;
 const q=currentQ();$('#fyLabel').textContent=q?q.label:'회계연도 설정 필요';$('#fyDates').textContent=q?`${q.start} — ${q.end} · 종료까지 ${Math.max(0,Math.round((Date.parse(q.end)-Date.parse(today()))/86400000))}일`:(state.vendors[slug]?.fy||'벤더의 FY 시작월을 설정해 주세요.');
 const conflicts=records.filter(r=>r.conflict);$('#conflictNotice').hidden=!conflicts.length;$('#conflictNotice').innerHTML=conflicts.length?`동시에 수정된 항목 ${conflicts.length}건이 있습니다. 두 내용 모두 보관되어 있습니다. ${conflicts.map(r=>`<button class="btn" data-conflict="${esc(r.key)}">${esc(kindNames[r.kind])} 내용 확인</button>`).join('')}`:'';
 renderMetrics(q);renderAnnual(q);renderHistory(q);renderPartners(q);renderPromotions();renderLeads();renderActions(q);renderRequests();renderContacts();
}
function renderMetrics(q){
 const defs=metrics();$('#metricHint').textContent=q?(window.VENDOR_PROFILES[slug]?`${name} 항목 · ${q.label} 누적`:'벤더에 맞는 실적 항목을 추가해 사용하세요.'):'먼저 벤더 설정에서 회계연도와 비교 기준 지표를 등록해 주세요.';
 if(!defs.length){$('#liveMetrics').innerHTML=empty('아직 등록된 실적 항목이 없습니다. '+name+'에서 사용하는 항목을 추가해 주세요.');return;}
 const rows=defs.map(d=>({...d,...(q?metricData(d.id,q.start):{}),def:d,r:q?metricRecord(d.id,q.start):null}));
 const controls=d=>`<div class="metric-actions"><button class="metric-explain" data-info="${esc(d.id)}">항목 설명</button><button class="btn" data-value="${esc(d.id)}">실적 입력</button></div>`;
 if(['okta','checkpoint'].includes(slug)){
  const sumIds=slug==='okta'?['upsell','new']:['nb','renew'];const summands=rows.filter(d=>sumIds.includes(d.id));const sameUnit=summands.length===2&&summands.every(d=>d.unit==='K USD');const sameDate=summands.length===2&&!!summands[0].asOf&&summands.every(d=>d.asOf===summands[0].asOf);const sum=field=>sameUnit&&(field==='target'||sameDate)?C.total(summands,field):null;
  const total={name:slug==='okta'?'Total ARR':'Total (Overall)',summary:(slug==='okta'?'Upsell + New':'New Business + Renew')+(!sameDate?' · 동일 기준일 입력 필요':''),unit:'K USD',actual:sum('actual'),target:sum('target'),yoy:sum('yoy'),qoq:sum('qoq')};
  const complete=[...rows];complete.splice(slug==='okta'?2:rows.length,0,total);
  $('#liveMetrics').innerHTML=`<div class="scroll"><table class="booking-table"><thead><tr><th>항목</th><th>단위</th><th>분기 타겟</th><th>${slug==='checkpoint'?'SA 실적':'실적'}</th><th>달성률</th><th>YoY</th><th>QoQ</th><th>기준일 / 입력</th></tr></thead><tbody>${complete.map(d=>`<tr class="${d.id?'':'booking-total'}"><th>${esc(d.name)}<small>${esc(d.summary)}</small>${d.id?`<button class="metric-explain" data-info="${esc(d.id)}">항목 설명</button>`:''}</th><td>${esc(d.unit)}</td><td>${fmt(d.target)}</td><td>${fmt(d.actual)}</td><td>${pct(d.actual,d.target)}</td><td>${growthHTML(d.actual,d.yoy,'YoY')}</td><td>${growthHTML(d.actual,d.qoq,'QoQ')}</td><td>${d.id?`${esc(d.asOf||'미입력')}<br><button class="btn" data-value="${esc(d.id)}">실적 입력</button>`:'합계 자동 계산'}</td></tr>`).join('')}</tbody></table></div>`;
 }else $('#liveMetrics').innerHTML=`<div class="live-metric-grid">${rows.map(d=>`<article class="portal-metric"><h3>${esc(d.name)}</h3><p class="metric-summary">${esc(d.summary)}</p><strong>${fmt(d.actual)} <small>${esc(d.unit)}</small></strong><div class="muted">${d.asOf?esc(d.asOf)+' 기준':'실적 미입력'}</div>${d.target!=null?`<p>타겟 ${fmt(d.target)} · 달성 ${pct(d.actual,d.target)}</p>`:''}<div class="metric-comparisons">${growthHTML(d.actual,d.yoy,'YoY')}${growthHTML(d.actual,d.qoq,'QoQ')}</div>${controls(d)}</article>`).join('')}</div>`;
}
function renderAnnual(q){
 $('#annualHeading').textContent=q?q.fy+' 연간 벤더 타겟':'연간 벤더 타겟';const p=q?data('annual',q.fyStart):null;
 $('#annualBasis').textContent=p?`${metrics().find(m=>m.id===p.metricId)?.name||p.metricId} · ${p.asOf||'기준일 미입력'} 기준`:q?`${q.fyStart} — ${q.fyEnd}`:'회계연도 설정 후 입력할 수 있습니다.';
 if(!p){$('#annualContent').innerHTML=empty('연간 타겟과 누적 실적이 아직 입력되지 않았습니다.');return;}
 const unit=metrics().find(m=>m.id===p.metricId)?.unit||'K USD',items=p.mode==='set'?[['연간 타겟',fmt(p.target)+' '+unit],['FY 누적 실적',fmt(p.actual)+' '+unit],['달성률',pct(p.actual,p.target)],['잔여 타겟',p.actual===null?'—':fmt(Math.max(0,p.target-p.actual))+' '+unit]]:[['연간 타겟',p.mode==='none'?'없음':'확인 중'],['FY 누적 실적',fmt(p.actual)+' '+unit]];
 $('#annualContent').innerHTML=`<div class="annual-metrics">${items.map(([k,v])=>`<div><small>${k}</small><strong>${esc(v)}</strong></div>`).join('')}</div>`;
}
function renderHistory(q){const defs=metrics(),selection=$('#historyMetric').value||settings()?.primaryMetric;$('#historyMetric').innerHTML=defs.map(m=>`<option value="${esc(m.id)}" ${m.id===selection?'selected':''}>${esc(m.name)} (${esc(m.unit)})</option>`).join('');const m=defs.find(d=>d.id===$('#historyMetric').value);
 if(!q||!m){$('#historyContent').innerHTML=empty('회계연도와 실적 지표를 설정하면 5개 분기를 비교할 수 있습니다.');return;}
 $('#historyContent').innerHTML=`<table><thead><tr><th>분기</th><th>기간</th><th>타겟 (${esc(m.unit)})</th><th>실적 (${esc(m.unit)})</th><th>달성률</th><th>집계 기준일</th><th>입력</th></tr></thead><tbody>${[-4,-3,-2,-1,0].map(offset=>{const p=C.quarter(today(),settings(),offset),v=metricData(m.id,p.start)||{};return `<tr><td>${esc(p.label)}${offset===0?' · 현재':''}</td><td>${p.start}~${p.end}</td><td>${fmt(v.target)}</td><td>${fmt(v.actual)}</td><td>${pct(v.actual,v.target)}</td><td>${esc(v.asOf||'미입력')}</td><td><button class="btn" data-value="${esc(m.id)}" data-period="${p.start}">입력</button></td></tr>`}).join('')}</tbody></table>`;
}
function renderPartners(q){const p=q?data('partners',q.start):null;if(!p){$('#partnerContent').innerHTML=empty('이번 Q의 파트너 현황이 아직 입력되지 않았습니다.');return;}const inactive=p.registered!==null&&p.active!==null?p.registered-p.active:null;$('#partnerContent').innerHTML=`<div class="partner-stats">${[['등록 파트너',p.registered,'개사'],['Active partner',p.active,'개사'],['비활성 파트너',inactive,'개사'],['활성 비율',p.registered>0&&p.active!==null?p.active/p.registered*100:null,'%']].map(([label,n,u])=>`<div class="partner-stat"><span>${label}</span><strong>${fmt(n)}<small>${u}</small></strong></div>`).join('')}</div><p>${esc(p.rule)} · ${esc(p.asOf)} 기준</p><p class="muted">이번 Q 신규 활성 ${fmt(p.newActive)}개사 · 재활성 ${fmt(p.reactivated)}개사</p>`;}
function renderPromotions(){
 const native=list('promotion'),calendar=state.events.filter(e=>e.vendor===name&&e.type==='promotion');
 const goalsHTML=goals=>(goals||[]).map(g=>`<div class="metric"><div class="row"><b>${esc(g.name)}</b><strong>${pct(g.actual,g.target)}</strong></div><p>${fmt(g.actual)} / ${fmt(g.target)} ${esc(g.unit)}</p><small>인정 기준: ${esc(g.rule||'미입력')}</small></div>`).join('');
 $('#promotionContent').innerHTML=native.map(r=>{const p=r.current.payload,done=p.goals?.length&&p.goals.every(g=>g.actual!==null&&g.target>0&&g.actual>=g.target);return `<article class="promo-card"><div class="row"><h3>${esc(p.title)}</h3>${editButton(r)}</div><p>${esc(p.start)} — ${esc(p.end)} <span class="tag">${done?'목표 달성':p.end<today()?'종료':p.start>today()?'예정':'진행 중'}</span></p><p>${esc(p.scheme||'스킴 미입력')}</p>${goalsHTML(p.goals)}<small>목표가 여러 개면 모두 충족할 때 달성으로 표시합니다.</small></article>`}).join('')+calendar.map(e=>`<article class="promo-card"><div class="row"><h3>${esc(e.title)}</h3><a class="btn" href="./?event=${encodeURIComponent(e.id)}">캘린더에서 수정</a></div><p>${esc(e.date||'시작 미정')} — ${esc(e.end||'종료 미정')} <span class="tag">캘린더 연동</span></p><dl class="compact-kv">${[['대상',e.audience],['조건',e.condition],['보상 스킴',e.reward],['목표',e.goal],['목표 DR',e.target_dr],['결과 DR',e.result_dr],['진행',e.progress],['담당',e.owner]].filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></article>`).join('')||empty('등록된 프로모션이 없습니다.');
}
function renderLeads(){const rows=list('lead');$('#leadSummary').innerHTML=Object.entries(leadStates).map(([k,v])=>`<div class="stage"><small>${v}</small><b>${rows.filter(r=>r.current.payload.stage===k).length}</b></div>`).join('');$('#leadContent').innerHTML=rows.length?`<table><thead><tr><th>고객 / 리드</th><th>출처</th><th>단계</th><th>담당</th><th>최근 접촉</th><th>다음 조치 / 기한</th><th>수정</th></tr></thead><tbody>${rows.map(r=>{const p=r.current.payload;return `<tr><td>${esc(p.name)}</td><td>${esc(p.source)}</td><td>${leadStates[p.stage]}</td><td>${esc(p.owner)}</td><td>${esc(p.lastContact||'미입력')}</td><td>${esc(p.next)}<small>${esc(p.due||'')}</small></td><td>${editButton(r)}</td></tr>`}).join('')}</tbody></table>`:empty('등록된 리드가 없습니다.');}
function renderActions(q){const rows=list('action').filter(r=>q&&r.current.payload.quarterStart===q.start);$('#actionSummary').textContent=q?`${q.label} · 전체 ${rows.length}건 · 완료 ${rows.filter(r=>r.current.payload.status==='done').length}건 · 기한 경과 ${rows.filter(r=>overdue(r.current.payload)).length}건`:'회계연도 설정 후 이번 Q 액션을 등록합니다.';$('#actionContent').innerHTML=rows.length?`<table><thead><tr><th>핵심 과제</th><th>완료 기준</th><th>담당</th><th>기한</th><th>상태</th><th>수정</th></tr></thead><tbody>${rows.map(r=>{const p=r.current.payload;return `<tr><td>${esc(p.title)}</td><td>${esc(p.criteria)}</td><td>${esc(p.owner)}</td><td>${esc(p.due)}</td><td><span class="tag ${overdue(p)?'warn':''}">${actionStates[p.status]}${overdue(p)?' · 기한 경과':''}</span></td><td>${editButton(r)}</td></tr>`}).join('')}</tbody></table>`:empty('이번 Q에 등록된 액션이 없습니다.');}
function renderRequests(){const all=list('request'),filter=$('#requestFilter').value;$('#requestSummary').innerHTML=[['전체 요청',all.length],['미완료',all.filter(r=>r.current.payload.status!=='done').length],['기한 경과',all.filter(r=>overdue(r.current.payload)).length],['완료',all.filter(r=>r.current.payload.status==='done').length]].map(([k,v])=>`<div class="request-stat"><span>${k}</span><b>${v}<small>건</small></b></div>`).join('');const rows=all.filter(r=>filter==='all'||filter==='open'&&r.current.payload.status!=='done'||filter==='overdue'&&overdue(r.current.payload)||r.current.payload.status===filter);$('#requestContent').innerHTML=rows.map(r=>{const p=r.current.payload,h=p.history||[],last=h.at(-1);return `<article class="request-card ${overdue(p)?'is-overdue':''}"><div class="row"><span class="tag ${overdue(p)?'warn':p.status==='done'?'good':''}">${requestStates[p.status]}${overdue(p)?' · 기한 경과':''}</span>${editButton(r)}</div><h3>${esc(p.title)}</h3><p class="request-content">${esc(p.content)}</p><dl class="request-meta">${[['요청 부서·요청자',p.requester],['대응 담당자',p.owner],['요청일',p.created],['처리 기한',p.due]].map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><div class="request-response"><span>최근 대응 · ${esc(last?.date||'—')}</span><p>${esc(last?.text||'대응 기록 없음')}</p>${p.next?`<p><b>다음 조치</b> ${esc(p.next)}</p>`:''}</div><details><summary>대응 이력 ${h.length}건</summary><ol class="request-history">${h.map(x=>`<li><small>${esc(x.date)} · ${esc(x.by)} · ${requestStates[x.status]||''}</small><p>${esc(x.text)}</p></li>`).join('')}</ol></details></article>`}).join('')||empty('해당하는 요청 사항이 없습니다.');}
function renderContacts(){const d=state.vendors[slug]||{};const fields=[['head','지사장'],['channel','채널 담당'],['vmkt','벤더 마케팅'],['am','벤더 AM'],['sales','인성 영업'],['mkt','인성 마케팅'],['fy','회계연도 메모'],['direction','전략 방향'],['actions','핵심 활동'],['risk','리스크']];$('#contactsContent').innerHTML=`<dl class="contact-grid">${fields.map(([k,l])=>`<div><dt>${l}</dt><dd>${esc(d[k]||'미입력')}</dd></div>`).join('')}</dl>`;$('#editContacts').href='./?editVendor='+encodeURIComponent(slug);}
const fieldLabels={title:'제목',name:'이름',metricId:'실적 지표',quarterStart:'분기 시작일',asOf:'집계 기준일',actual:'실적',target:'타겟',yoy:'전년 동일 시점 실적',qoq:'직전 Q 동일 시점 실적',source:'출처',note:'비고',startMonth:'FY 시작월',fyNaming:'FY 표기 기준',primaryMetric:'대표 실적 지표',mode:'연간 타겟',registered:'등록 파트너',active:'활성 파트너',newActive:'신규 활성',reactivated:'재활성',rule:'인정 기준',summary:'한 줄 설명',meaning:'항목 의미',date:'실적 인정 날짜',unit:'단위',start:'시작일',end:'종료일',scheme:'보상 스킴',owner:'담당자',stage:'리드 단계',lastContact:'최근 접촉일',next:'다음 조치',due:'처리 기한',criteria:'완료 기준',status:'상태',content:'요청 내용',requester:'요청 부서·요청자',created:'요청일',priority:'우선순위',response:'이번 대응 내용'};
const opt=map=>Object.entries(map);
function schema(kind){const defs=metrics().map(d=>[d.id,d.name+' ('+d.unit+')']);switch(kind){
 case 'settings':return [['startMonth','FY 시작월','select',true,Array.from({length:12},(_,i)=>[i+1,(i+1)+'월'])],['fyNaming','FY 연도 표기','select',true,[['start','시작 연도'],['end','종료 연도']]],['primaryMetric','대표 실적 지표','select',false,defs]];
 case 'definition':return [['name','항목명','text',true],['unit','단위','select',true,[['K USD','K USD (천 달러)'],['건','건'],['개사','개사'],['명','명']]],['summary','한 줄 설명','text',true],['meaning','항목의 의미','textarea',true],['rule','집계 대상·제외 조건','textarea',false],['date','실적 인정 날짜','text',false]];
 case 'metric':return [['metricId','실적 지표','select',true,defs],['quarterStart','분기 시작일','date',true],['asOf','집계 기준일','date',true],['actual','이번 Q 누적 실적','number',false],['target','분기 타겟 (없으면 비움)','number',false],['yoy','전년 동일 Q · 같은 경과 시점 실적','number',false],['qoq','직전 Q · 같은 경과 시점 실적','number',false],['source','자료 출처','text',false],['note','비고','textarea',false]];
 case 'annual':return [['metricId','연간 비교 지표','select',true,defs],['mode','연간 타겟 유무','select',true,[['set','있음'],['none','없음'],['pending','확인 중']]],['target','연간 타겟','number',false],['actual','FY 누적 실적','number',false],['asOf','집계 기준일','date',true],['source','자료 출처','text',false]];
 case 'partners':return [['asOf','집계 기준일','date',true],['registered','등록 파트너 (개사)','number',false],['active','활성 파트너 (개사)','number',false],['newActive','신규 활성 (개사)','number',false],['reactivated','재활성 (개사)','number',false],['rule','활성 파트너 인정 기준','textarea',true]];
 case 'promotion':return [['title','프로모션명','text',true],['start','시작일','date',true],['end','종료일','date',true],['owner','담당자','text',false],['status','일정 상태','select',true,[['planned','계획'],['confirmed','확정'],['gate','결정 시점'],['done','완료']]],['scheme','보상 스킴','textarea',true]];
 case 'lead':return [['name','고객 / 리드명','text',true],['source','출처 / 행사명','text',false],['stage','현재 단계','select',true,opt(leadStates)],['owner','담당자','text',true],['lastContact','최근 접촉일','date',false],['next','다음 조치','text',false],['due','다음 조치 기한','date',false],['note','비고','textarea',false]];
 case 'action':return [['title','핵심 과제','text',true],['quarterStart','분기 시작일','date',true],['criteria','완료 기준','textarea',true],['owner','담당자','text',true],['due','처리 기한','date',true],['status','상태','select',true,opt(actionStates)],['note','진행 내용','textarea',false]];
 case 'request':return [['title','요청 제목','text',true],['content','요청 내용','textarea',true],['requester','요청 부서·요청자','text',true],['owner','대응 담당자','text',true],['created','요청일','date',true],['due','처리 기한','date',true],['priority','우선순위','select',true,[['보통','보통'],['높음','높음'],['낮음','낮음']]],['status','진행 상태','select',true,opt(requestStates)],['response','이번 대응 내용','textarea',false],['next','다음 조치','textarea',false]];
 default:return [];
}}
function fieldHTML(field,value){const [id,label,type,required,options]=field;const common=`name="${id}" id="field-${id}" ${required?'required':''}`;const wide=['textarea'].includes(type)||['title','name','summary','source','rule','date'].includes(id);let control;
 if(type==='select')control=`<select ${common}><option value="">선택하세요</option>${options.map(([v,l])=>`<option value="${esc(v)}" ${String(value)===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
 else if(type==='textarea')control=`<textarea ${common} rows="3" maxlength="4000">${esc(value??'')}</textarea>`;
 else control=`<input ${common} type="${type}" value="${esc(value??'')}" ${type==='number'?'min="0" step="any"':'maxlength="200"'}>`;
 return `<label class="${wide?'wide':''}">${label}${control}</label>`;
}
function requireQuarter(){if(!currentQ()){openEditor('settings','main');$('#editorHint').textContent='실적·타겟·파트너·액션을 등록하기 전에 FY 시작월과 표기 기준을 저장해 주세요.';return false;}return true;}
function openEditor(kind,id=null,seed={},resolve=false){
 if(saving)return;
 if(['metric','annual','partners','action'].includes(kind)&&!requireQuarter())return;
 if(['metric','annual'].includes(kind)&&!metrics().length){openEditor('definition');return;}
 const q=currentQ();if(!id){if(kind==='settings')id='main';else if(kind==='annual')id=q.fyStart;else if(kind==='partners')id=q.start;else if(kind==='metric')id=(seed.metricId||primary()?.id)+':'+(seed.quarterStart||q.start);else id=uid();}
 const r=record(kind,id);if(r?.conflict&&!resolve){showConflict(r);return;}
 const old=r&&!r.current.deleted?r.current.payload:null;
 const inputQ=C.quarter(seed.quarterStart||old?.quarterStart||q?.start,settings());
 const initial={...{asOf:inputQ&&inputQ.end<today()?inputQ.end:today(),created:today(),quarterStart:q?.start,metricId:primary()?.id,unit:'K USD',priority:'보통',status:kind==='request'?'received':'planned',stage:'new'},...old,...seed};
 editing={kind,id,parents:r?.heads.map(h=>h.id)||[],old:old||{},exists:!!old};
 $('#editorTitle').textContent=(kindNames[kind]||kind)+(old?' 수정':' 입력');
 $('#editorHint').textContent=kind==='metric'?'빈 값은 미입력으로 저장됩니다. 금액은 K USD, 건수·회사 수는 항목 단위를 따릅니다. 과거 분기도 분기 시작일로 지정할 수 있습니다.':kind==='definition'?'이 벤더에서 사용할 항목과 정의를 설정합니다.':'저장하면 이 벤더의 공유 화면에 반영됩니다.';
 $('#editorFields').innerHTML=schema(kind).map(f=>fieldHTML(f,initial[f[0]])).join('');$('#extraFields').innerHTML='';
 if(kind==='promotion'){$('#extraFields').innerHTML='<div id="liveGoals"></div><button class="btn" id="addLiveGoal" type="button">+ 목표 추가</button>';for(const g of initial.goals||[{}])addGoal(g);}
 if(kind==='metric'&&old){$('#field-metricId').disabled=true;$('#field-quarterStart').readOnly=true;}
 if(kind==='settings'&&old&&list('metric').length){$('#field-startMonth').disabled=true;$('#editorHint').textContent='실적이 저장된 후 FY 시작월은 변경할 수 없습니다. 기존 분기 구분을 유지합니다.';}
 $('#editorError').textContent='';$('#archiveButton').hidden=!old||['settings','annual','partners','metric'].includes(kind)||(kind==='definition'&&(window.VENDOR_PROFILES[slug]?.metrics||[]).some(d=>d.id===id));$('#saveButton').disabled=false;$('#saveButton').textContent='공유 저장';$('#editor').showModal();
 if(kind==='annual')updateAnnualMode();
}
function addGoal(g={}){$('#liveGoals').insertAdjacentHTML('beforeend',`<fieldset class="goal-form"><legend>프로모션 목표</legend><div class="form-grid"><label>목표 지표<input name="goalName" list="goalTypes" required value="${esc(g.name||'')}" placeholder="DR 등록·매출·부킹 등"></label><label>단위<select name="goalUnit">${['건','K USD','개사','명'].map(u=>`<option ${g.unit===u?'selected':''}>${u}</option>`).join('')}</select></label><label>목표<input name="goalTarget" type="number" min="0.001" step="any" required value="${esc(g.target??'')}"></label><label>실적<input name="goalActual" type="number" min="0" step="any" value="${esc(g.actual??'')}"></label><label class="wide">인정 기준<input name="goalRule" required value="${esc(g.rule||'')}"></label></div><button type="button" class="btn" data-remove-goal>목표 삭제</button></fieldset>`);}
function updateAnnualMode(){const set=$('#field-mode').value==='set';$('#field-target').disabled=!set;$('#field-target').required=set;}
function formPayload(){const p={};for(const [id,,type] of schema(editing.kind)){const el=$('#editorForm').elements[id],v=el.value.trim();p[id]=type==='number'?(v===''?null:Number(v)):v;}if(editing.kind==='settings')p.startMonth=Number(p.startMonth);return p;}
function validate(kind,p){
 const now=today(),q=currentQ();
 for(const [id,label,type,required] of schema(kind)){if(required&&(p[id]===''||p[id]==null))throw Error(label+'을(를) 입력해 주세요.');if(type==='number'&&p[id]!==null&&(!Number.isFinite(p[id])||p[id]<0))throw Error(label+'은(는) 0 이상의 숫자로 입력해 주세요.');if(type==='date'&&p[id]&&!C.validDate(p[id]))throw Error(label+' 날짜를 확인해 주세요.');}
 if(kind==='metric'){
  C.validateMetric(p,settings(),now);const m=metrics().find(m=>m.id===p.metricId);if(!m)throw Error('실적 항목을 확인해 주세요.');
  if(m.unit!=='K USD'&&['actual','target','yoy','qoq'].some(k=>p[k]!==null&&!Number.isInteger(p[k])))throw Error('건수·회사 수·인원은 정수로 입력해 주세요.');
 }
 if(kind==='settings'&&(!Number.isInteger(p.startMonth)||p.startMonth<1||p.startMonth>12||!['start','end'].includes(p.fyNaming)))throw Error('회계연도 설정을 확인해 주세요.');
 if(kind==='definition'&&(list('metric').some(r=>r.current.payload.metricId===editing.id)||list('annual').some(r=>r.current.payload.metricId===editing.id))&&metrics().find(m=>m.id===editing.id)?.unit!==p.unit)throw Error('실적이 있는 항목의 단위는 변경할 수 없습니다. 다른 단위는 새 항목으로 등록해 주세요.');
 if(kind==='definition'&&metrics().some(m=>m.name.toLowerCase()===p.name.toLowerCase()&&m.id!==editing.id))throw Error('같은 이름의 지표가 있습니다. 기존 항목을 수정해 주세요.');
 if(kind==='annual'){if(p.mode==='set'&&!(p.target>0))throw Error('연간 타겟은 0보다 커야 합니다.');if(p.mode!=='set')p.target=null;if(p.asOf<q.fyStart||p.asOf>now)throw Error('집계 기준일은 이번 FY 시작 이후, 오늘 이전으로 입력해 주세요.');}
 if(kind==='partners'){
  for(const k of ['registered','active','newActive','reactivated'])if(p[k]!==null&&!Number.isInteger(p[k]))throw Error('파트너 수는 정수로 입력해 주세요.');
  if(p.registered!==null&&p.active!==null&&p.active>p.registered)throw Error('활성 파트너 수가 등록 파트너 수보다 많습니다.');
  if(p.active!==null&&((p.newActive??0)+(p.reactivated??0)>p.active))throw Error('신규·재활성 합계가 활성 파트너 수보다 많습니다.');
  if(p.asOf<q.start||p.asOf>now)throw Error('파트너 집계 기준일은 이번 Q 안의 오늘 이전 날짜로 입력해 주세요.');
 }
 if(kind==='promotion'){
  if(p.end<p.start)throw Error('종료일은 시작일 이후로 입력해 주세요.');
  p.goals=[...$('#liveGoals').children].map(el=>{const get=n=>el.querySelector(`[name=${n}]`).value.trim();return {name:get('goalName'),unit:get('goalUnit'),target:Number(get('goalTarget')),actual:get('goalActual')===''?null:Number(get('goalActual')),rule:get('goalRule')};});
  if(p.goals.some(g=>g.unit!=='K USD'&&(!Number.isInteger(g.target)||(g.actual!==null&&!Number.isInteger(g.actual)))))throw Error('건수·회사 수·인원 목표와 실적은 정수로 입력해 주세요.');
  if(!p.goals.length||p.goals.some(g=>!g.name||!g.rule||!Number.isFinite(g.target)||g.target<=0||(g.actual!==null&&(!Number.isFinite(g.actual)||g.actual<0))))throw Error('목표 지표·양수 목표·인정 기준을 입력해 주세요.');
 }
 if(kind==='action'){const period=C.quarter(p.quarterStart,settings());if(!period||period.start!==p.quarterStart)throw Error('분기 시작일이 회계연도 설정과 맞지 않습니다.');}
 if(kind==='lead'&&p.lastContact>now)throw Error('최근 접촉일은 오늘 이전으로 입력해 주세요.');
 if(kind==='request'){
  if(p.due<p.created||p.created>now)throw Error('요청일과 처리 기한을 확인해 주세요.');
  if(p.status!=='done'&&!p.next)throw Error('미완료 요청에는 다음 조치를 입력해 주세요.');
  if((editing.exists||p.status==='done')&&!p.response)throw Error('이번 대응 내용 또는 완료 결과를 입력해 주세요.');
  p.history=[...(editing.old.history||[]),{date:now,at:new Date().toISOString(),by:user,status:p.status,text:p.response||'요청 접수'}];delete p.response;if(p.status==='done')p.next='';
 }
}
async function submitEditor(e){e.preventDefault();if(saving||!editing)return;const edit=editing;try{const p=formPayload();validate(edit.kind,p);const id=edit.kind==='metric'?`${p.metricId}:${p.quarterStart}`:edit.id;const parents=id===edit.id?edit.parents:(record(edit.kind,id)?.heads.map(h=>h.id)||[]);
 // New metric forms must not silently overwrite an existing period selected after opening.
 if(edit.kind==='metric'&&id!==edit.id&&record(edit.kind,id))throw Error('선택한 분기에 이미 실적이 있습니다. 닫고 해당 분기의 입력 버튼으로 수정해 주세요.');
 saving=true;$('#saveButton').disabled=true;$('#saveButton').textContent='저장 중…';await saveRecord(edit.kind,id,p,parents);$('#editor').close();editing=null;render();notice('공유 저장소에 저장했습니다. 다른 사용자의 화면에도 반영됩니다.');
 }catch(error){$('#editorError').textContent=error.message;}finally{saving=false;$('#saveButton').disabled=false;$('#saveButton').textContent='공유 저장';}}
async function archive(){if(!editing||saving)return;if(!confirm('이 항목을 보관할까요? 이전 기록은 저장소에 유지됩니다.'))return;try{saving=true;await saveRecord(editing.kind,editing.id,editing.old,editing.parents,true);$('#editor').close();editing=null;render();notice('보관했습니다. 이전 수정 기록은 유지됩니다.');}catch(e){$('#editorError').textContent=e.message;}finally{saving=false;}}
function showInfo(id){const m=metrics().find(m=>m.id===id);if(!m)return;$('#infoTitle').textContent=m.name+' · 항목 설명';$('#infoContent').innerHTML=`<p>${esc(m.meaning||m.summary)}</p><dl class="metric-rules"><dt>집계 대상·제외 조건</dt><dd>${esc(m.rule||'확인 필요')}</dd><dt>인정 날짜</dt><dd>${esc(m.date||'확인 필요')}</dd><dt>단위</dt><dd>${esc(m.unit)}</dd></dl><button class="btn" data-definition="${esc(m.id)}">설명·항목 설정 수정</button>`;$('#infoDialog').showModal();}
function showConflict(r){$('#infoTitle').textContent='동시에 수정된 내용 확인';$('#infoContent').innerHTML='<p>두 수정본이 모두 남아 있습니다. 기준으로 삼을 내용을 선택한 뒤 필요한 내용을 합쳐 저장해 주세요.</p>'+r.heads.map(h=>`<article class="conflict-version"><b>${esc(h.author)} · ${esc(h.savedAt)}</b><p>${esc(summaryText(r.kind,h.payload))}</p><button class="btn" data-resolve="${esc(r.key)}" data-head="${h.id}">이 내용으로 편집</button></article>`).join('');$('#infoDialog').showModal();}
const importHeaders=['벤더','지표ID','지표명','단위','분기시작일','집계기준일','실적','분기타겟','YoY비교실적','QoQ비교실적','출처'];
function downloadTemplate(){if(!window.XLSX){$('#importError').textContent='엑셀 기능을 불러오지 못했습니다. 새로고침해 주세요.';return;}const q=currentQ();const rows=metrics().map(m=>[name,m.id,m.name,m.unit,q.start,today(),'','','','','']);const wb=XLSX.utils.book_new();const ws=XLSX.utils.aoa_to_sheet([importHeaders,...rows]);ws['!cols']=importHeaders.map((_,i)=>({wch:i===2?24:18}));XLSX.utils.book_append_sheet(wb,ws,'분기실적');XLSX.writeFile(wb,name+'_분기실적_양식.xlsx');}
async function previewImport(e){importRows=[];$('#confirmImport').disabled=true;$('#importError').textContent='';$('#importPreview').innerHTML='';const file=e.target.files[0];if(!file)return;
 try{if(file.size>5*1024*1024)throw Error('파일은 5MB 이하로 올려 주세요.');if(!window.XLSX)throw Error('엑셀 기능을 불러오지 못했습니다. 새로고침해 주세요.');
  const wb=XLSX.read(await file.arrayBuffer(),{type:'array',dateNF:'yyyy-mm-dd'}),sheet=wb.Sheets[wb.SheetNames[0]];
  const header=XLSX.utils.sheet_to_json(sheet,{header:1,raw:false})[0]||[];if(!['벤더','지표ID','단위','분기시작일','집계기준일','실적'].every(h=>header.includes(h)))throw Error('필수 열이 없습니다. 이 화면의 엑셀 양식을 사용해 주세요.');
  const rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});if(rows.length>200)throw Error('한 번에 200행까지 반영할 수 있습니다.');
  const seen=new Set();ingest(await api('GET','/state'));
  for(let i=0;i<rows.length;i++){
   const row=rows[i],s=k=>String(row[k]??'').trim();if(!['실적','분기타겟','YoY비교실적','QoQ비교실적'].some(k=>s(k)!==''))continue;
   const m=metrics().find(m=>m.id===s('지표ID'));if(s('벤더')!==name||!m||s('단위')!==m.unit)throw Error(`${i+2}행: 벤더·지표ID·단위가 이 벤더의 설정과 맞지 않습니다.`);
   const num=k=>{const raw=s(k).replaceAll(',','');if(!raw)return null;if(!/^\d+(\.\d+)?$/.test(raw))throw Error(`${i+2}행: ${k} 숫자 형식을 확인해 주세요.`);return Number(raw);};
   const p={metricId:m.id,quarterStart:s('분기시작일'),asOf:s('집계기준일'),actual:num('실적'),target:num('분기타겟'),yoy:num('YoY비교실적'),qoq:num('QoQ비교실적'),source:s('출처')||file.name,note:''};
   C.validateMetric(p,settings(),today());if(m.unit!=='K USD'&&['actual','target','yoy','qoq'].some(k=>p[k]!==null&&!Number.isInteger(p[k])))throw Error(`${i+2}행: 건수·회사 수·인원은 정수로 입력하세요.`);
   const id=m.id+':'+p.quarterStart;if(seen.has(id))throw Error(`${i+2}행: 같은 지표·분기가 중복되어 있습니다.`);seen.add(id);
   const r=record('metric',id);p.note=r?.current.payload.note||'';if(r?.conflict)throw Error(`${i+2}행: 동시 수정된 항목을 먼저 확인해 주세요.`);
   importRows.push({id,p,parents:r?.heads.map(h=>h.id)||[],label:m.name,unit:m.unit,exists:!!r});
  }
  if(!importRows.length)throw Error('입력된 실적이나 타겟이 없습니다.');
  $('#importPreview').innerHTML=`<p>${importRows.length}건을 검토한 뒤 저장해 주세요.</p><table><thead><tr><th>항목</th><th>분기 시작</th><th>기준일</th><th>실적</th><th>타겟</th><th>단위</th><th>YoY 비교값</th><th>QoQ 비교값</th><th>처리</th></tr></thead><tbody>${importRows.map(r=>`<tr><td>${esc(r.label)}</td><td>${r.p.quarterStart}</td><td>${r.p.asOf}</td><td>${fmt(r.p.actual)}</td><td>${fmt(r.p.target)}</td><td>${esc(r.unit)}</td><td>${fmt(r.p.yoy)}</td><td>${fmt(r.p.qoq)}</td><td>${r.exists?'기존 실적 수정':'새 실적 등록'}</td></tr>`).join('')}</tbody></table>`;$('#confirmImport').disabled=false;
 }catch(error){importRows=[];$('#importError').textContent=error.message;}
}
async function commitImport(){if(saving||!importRows.length)return;saving=true;$('#confirmImport').disabled=true;$('#importFile').disabled=true;let done=0;try{for(const row of importRows){await saveRecord('metric',row.id,row.p,row.parents);done++;$('#importError').textContent=`${done} / ${importRows.length}건 저장 중…`;}$('#importDialog').close();notice(`실적 ${done}건을 공유 저장소에 반영했습니다.`);importRows=[];render();}catch(error){importRows=importRows.slice(done);$('#importError').textContent=`${done}건 저장 완료. 남은 ${importRows.length}건은 저장하지 못했습니다. ${error.message}`;$('#confirmImport').disabled=!importRows.length;render();}finally{saving=false;$('#importFile').disabled=false;}}
function bind(){
 $('#vendorSelect').innerHTML=Object.entries(C.vendors).map(([id,n])=>`<option value="${id}" ${id===slug?'selected':''}>${esc(n)}</option>`).join('');$('#vendorSelect').onchange=e=>location.href='vendor.html?vendor='+encodeURIComponent(e.target.value);
 $('#settingsButton').onclick=()=>openEditor('settings','main');$('#addMetric').onclick=()=>openEditor('definition');$('#enterMetric').onclick=()=>openEditor('metric');$('#historyMetric').onchange=()=>renderHistory(currentQ());$('#requestFilter').onchange=renderRequests;
 $('#editorForm').onsubmit=submitEditor;$('#archiveButton').onclick=archive;
 $('#closeEditor').onclick=()=>{if(!saving)$('#editor').close();};$('#editor').addEventListener('cancel',e=>{if(saving)e.preventDefault();});
 $('#closeInfo').onclick=()=>$('#infoDialog').close();$('#closeImport').onclick=()=>{if(!saving)$('#importDialog').close();};$('#importDialog').addEventListener('cancel',e=>{if(saving)e.preventDefault();});
 $('#editorForm').onchange=e=>{if(e.target.id==='field-mode')updateAnnualMode();};
 $('#extraFields').onclick=e=>{if(e.target.id==='addLiveGoal')addGoal();if(e.target.hasAttribute('data-remove-goal')){if($('#liveGoals').children.length<2){$('#editorError').textContent='목표는 하나 이상 필요합니다.';return;}e.target.closest('fieldset').remove();}};
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-new],[data-edit-kind],[data-info],[data-value],[data-definition],[data-conflict],[data-resolve]');if(!b||saving)return;
  if(b.dataset.new)openEditor(b.dataset.new);
  else if(b.dataset.editKind)openEditor(b.dataset.editKind,b.dataset.record);
  else if(b.dataset.info)showInfo(b.dataset.info);
  else if(b.dataset.value)openEditor('metric',null,{metricId:b.dataset.value,quarterStart:b.dataset.period||currentQ()?.start});
  else if(b.dataset.definition){const m=metrics().find(d=>d.id===b.dataset.definition);$('#infoDialog').close();openEditor('definition',m.id,m);}
  else if(b.dataset.conflict)showConflict(records.find(r=>r.key===b.dataset.conflict));
  else if(b.dataset.resolve){const r=records.find(r=>r.key===b.dataset.resolve),h=r.heads.find(h=>h.id===b.dataset.head);$('#infoDialog').close();openEditor(r.kind,r.recordId,h.payload,true);if(r.kind==='request'){const all=r.heads.flatMap(h=>h.payload.history||[]),dedup=new Map(all.map(x=>[JSON.stringify([x.at||x.date,x.by,x.text]),x]));editing.old.history=[...dedup.values()].sort((a,b)=>(a.at||a.date).localeCompare(b.at||b.date));}}
 });
 $('#uploadButton').onclick=()=>{if(!requireQuarter())return;if(!metrics().length){openEditor('definition');return;}$('#importError').textContent='';$('#importPreview').innerHTML='';$('#importFile').value='';$('#confirmImport').disabled=true;importRows=[];$('#importDialog').showModal();};
 $('#downloadTemplate').onclick=downloadTemplate;$('#importFile').onchange=previewImport;$('#confirmImport').onclick=commitImport;
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});setInterval(()=>{if(!document.hidden&&state)refresh();},15000);
}
async function start(){
 if(!name){$('#loginError').textContent='벤더를 찾을 수 없습니다. 캘린더에서 다시 선택해 주세요.';return;}
 await api('POST','/check');ingest(await api('GET','/state'));$('#authGate').hidden=true;$('#app').hidden=false;document.body.classList.remove('locked');render();
}
$('#loginUser').value=user;$('#loginForm').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;key=$('#loginKey').value.trim();user=$('#loginUser').value.trim();$('#loginError').textContent='';try{await start();try{localStorage.setItem('isd-cal-key',key);localStorage.setItem('isd-cal-user',user);}catch(_){}}catch(error){$('#loginError').textContent=error.message;}finally{b.disabled=false;}};
bind();if(key&&user)start().catch(error=>$('#loginError').textContent=error.message);
})();
