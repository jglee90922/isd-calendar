// 벤더별 구성 예시. 모든 수치와 비교값은 가상이며 새로고침하면 초기화된다.
(()=>{
const publicDefinition='https://www.sec.gov/Archives/edgar/data/1535527/000110465922057039/tm229592-1_def14a.htm';
const profiles={crowdstrike:{name:'CrowdStrike',metrics:[
 {id:'tcv',name:'TCV',summary:'전체 계약기간의 총 계약 금액',meaning:'Total Contract Value. 계약 전체 기간에 해당하는 금액을 보는 지표입니다. 회계상 매출 인식액과는 구분합니다.',rule:'대상 계약·서비스 범위, 취소·변경분 반영 방식 확인 필요.',date:'계약일·부킹일 등 포털의 인정 날짜 확인 필요.',current:480,yoy:400,qoq:450,unit:'K USD'},
 {id:'acv',name:'ACV',summary:'계약의 연간 가치',meaning:'Annual Contract Value. CrowdStrike의 공개 자료에서는 계약의 첫 12개월에 고객이 약정한 금액으로 설명합니다. 현재 포털의 인정 범위는 별도 확인합니다.',rule:'다년 계약·갱신·서비스의 포함 범위 확인 필요.',date:'포털의 실적 인정 날짜 확인 필요.',current:410,yoy:350,qoq:420,unit:'K USD',source:publicDefinition},
 {id:'npacv',name:'NPACV',summary:'신규·확장 계약의 New Platform ACV',meaning:'New Platform ACV. 공개 자료상 신규 고객 또는 기존 고객에서 연간 반복 수익(ARR)이 증가하는 플랫폼 계약을 뜻합니다. 신규 고객만을 의미하지 않습니다.',rule:'증액분과 갱신분 구분 및 현재 포털의 인정 방식 확인 필요.',date:'포털의 실적 인정 날짜 확인 필요.',current:320,yoy:250,qoq:300,unit:'K USD',source:publicDefinition},
 {id:'sourced',name:'Partner Sourced',summary:'파트너가 발굴한 New Platform ACV',meaning:'제공 화면의 New Platform ACV 중 Partner Sourced로 분류된 금액입니다. 파트너가 발굴한 영업 기회의 기여를 봅니다.',rule:'파트너 발굴 인정 요건·귀속 파트너·중복 기여 처리 확인 필요.',date:'New Platform ACV의 집계 날짜 확인 필요.',current:240,yoy:180,qoq:220,unit:'K USD'},
 {id:'dr',name:'Approved DR',summary:'승인된 딜 등록 건수',meaning:'Deal Registration(딜 등록) 중 승인된 건수입니다. 제공 화면은 By Converted Date 기준으로 표시합니다.',rule:'승인 상태·중복 등록·취소 건 제외 기준 확인 필요.',date:'Converted Date(전환일). 승인일과 같은 날짜인지는 확인 필요.',current:32,yoy:24,qoq:28,unit:'건'},
 {id:'logos',name:'New Logos',summary:'파트너가 발굴한 신규 고객 수',meaning:'제공 화면의 Partner Sourced 조건에 해당하는 신규 고객 수입니다. 단순 신규 등록 고객과 수주 고객 중 어떤 기준인지 확인합니다.',rule:'최초 고객 판정·수주 여부·고객 ID 중복 제거 기준 확인 필요.',date:'신규 고객 인정 날짜 확인 필요.',current:6,yoy:4,qoq:8,unit:'개사'},
 {id:'velocity',name:'Velocity',summary:'Velocity로 분류된 영업 기회 수',meaning:'제공 화면은 Opps(영업 기회)로 표시합니다. Velocity 분류에 해당하는 기회 수로 해석한 예시이며, 영업 속도나 소요 시간이라고 단정하지 않습니다.',rule:'Velocity 분류 조건·대상 영업 단계·금액 조건 확인 필요.',date:'기회 생성일·전환일·수주일 중 집계 날짜 확인 필요.',current:null,yoy:null,qoq:null,unit:'건'},
 {id:'flex',name:'Flex',summary:'Flex의 New Platform ACV',meaning:'제공 화면에서 Flex 항목으로 분류한 New Platform ACV 금액입니다. 전체 Flex 계약금액과 동일한지는 별도 확인합니다.',rule:'Flex 인정 대상·소진액과 계약액 구분·다른 지표와 중복 범위 확인 필요.',date:'New Platform ACV의 실적 인정 날짜 확인 필요.',current:150,yoy:null,qoq:120,unit:'K USD'},
 {id:'customers',name:'# of Customers',summary:'집계 대상 고객 수',meaning:'선택한 분기에 포털 집계 조건을 충족하는 고객 수입니다. 전체 보유 고객인지 거래 고객인지에 따라 값이 달라질 수 있습니다.',rule:'거래·계약 상태 등 포함 조건 및 고객 ID별 중복 제거 기준 확인 필요.',date:'기간 내 발생 기준인지 기준일 시점 보유 기준인지 확인 필요.',current:18,yoy:15,qoq:18,unit:'개사'},
 {id:'partners',name:'# of Partners',summary:'집계 대상 파트너 수',meaning:'포털 집계 조건을 충족하는 파트너 수입니다. 아래 ERP 거래 기준 Active partner와는 별도로 봅니다.',rule:'등록·거래·인증 중 대상 조건과 파트너 ID 중복 제거 기준 확인 필요.',date:'기간 내 활동 기준인지 기준일 시점 보유 기준인지 확인 필요.',current:9,yoy:8,qoq:10,unit:'개사'}
]},checkpoint:{name:'Check Point',metrics:[
 {id:'nb',name:'New Business',summary:'신규 사업 실적',meaning:'제공 표의 New Business 구분입니다. 신규 고객·추가 제품·기존 고객 증설 중 포함되는 범위는 벤더 기준을 확인합니다.',rule:'New Business와 Renew 구분, SA 인정 금액 범위 확인 필요.',date:'SA의 뜻·인정 날짜·원본 통화와 단위 확인 필요.',current:250,target:320,yoy:200,qoq:240,unit:'K USD'},
 {id:'renew',name:'Renew',summary:'갱신 실적',meaning:'제공 표의 갱신 구분입니다. 기존 계약의 갱신 실적을 별도로 관리합니다.',rule:'갱신·증설 배분, 취소 및 차감 반영 기준 확인 필요.',date:'SA의 뜻·인정 날짜·원본 통화와 단위 확인 필요.',current:70,target:180,yoy:80,qoq:60,unit:'K USD'}
 ]},okta:{name:'Okta',metrics:[
 {id:'upsell',name:'ARR - Upsell',summary:'기존 고객의 확장 ARR',meaning:'ARR(Annual Recurring Revenue, 연간 반복 수익) 중 기존 고객의 추가 도입·확장에 해당하는 항목입니다.',rule:'확장분의 인정 범위·갱신분 제외 방식 확인 필요.',date:'벤더의 ARR 인정 날짜 확인 필요.',current:120,target:160,yoy:100,qoq:110,unit:'K USD'},
 {id:'new',name:'ARR - New',summary:'신규 고객의 ARR',meaning:'신규 고객에서 발생한 ARR을 별도로 보는 항목입니다.',rule:'신규 고객 판정·제품 범위·고객 중복 제거 기준 확인 필요.',date:'벤더의 ARR 인정 날짜 확인 필요.',current:200,target:340,yoy:160,qoq:190,unit:'K USD'},
 {id:'sourced',name:'Partner Sourced ARR',summary:'파트너가 발굴한 ARR',meaning:'파트너 발굴로 인정된 ARR입니다. Total ARR과 중복될 수 있으므로 더하지 않습니다.',rule:'파트너 발굴 귀속 요건·괄호 안 별도 수치의 의미 확인 필요.',date:'ARR 실적 인정 날짜 확인 필요.',current:90,target:140,yoy:75,qoq:80,unit:'K USD'},
 {id:'active',name:'Active Partner',summary:'벤더 기준 활성 파트너 수',meaning:'Okta의 활성 기준을 충족하는 파트너 수입니다. ERP에서 거래가 발생한 파트너 수와는 다를 수 있습니다.',rule:'활성 요건·집계 기간·파트너 ID 중복 제거 기준 확인 필요. 타겟 미제공.',date:'활동 발생 기준 또는 기준일 시점 기준 확인 필요.',current:8,target:null,yoy:7,qoq:10,unit:'개사'},
 {id:'drRevenue',name:'DR Submission (Rev)',summary:'제출한 딜 등록의 금액',meaning:'딜 등록 제출 건에 연결된 금액입니다. 수주 실적이나 승인 DR 금액으로 자동 간주하지 않습니다.',rule:'금액 기준(ARR·계약금액 등)·상태·괄호 안 추가 수치 의미 확인 필요.',date:'딜 등록 제출일 및 상태 변경 반영 기준 확인 필요.',current:430,target:600,yoy:350,qoq:400,unit:'K USD'},
 {id:'drCount',name:'DR Submission (Count)',summary:'제출한 딜 등록 건수',meaning:'딜 등록을 제출한 건수입니다. 승인된 건수와 구분합니다.',rule:'재제출·취소·중복 건 제외 기준 확인 필요. 타겟 미제공.',date:'딜 등록 제출일 기준인지 확인 필요.',current:16,target:null,yoy:12,qoq:15,unit:'건'}
]},gigamon:{name:'Gigamon',metrics:[
 {id:'closed',name:'Closed Deal',summary:'마감된 딜의 실적 금액',meaning:'제공 화면의 Closed Deal 금액입니다. 수주 완료만 포함하는지, 부킹·계약금액 등 어떤 금액인지 벤더 기준을 확인합니다.',rule:'Closed Won 포함 여부·인정 금액·취소 반영 기준 확인 필요. 타겟 미제공.',date:'딜 마감일 기준인지 확인 필요.',current:320,yoy:null,qoq:null,unit:'K USD'},
 {id:'registrations',name:'Deal Registrations',summary:'딜 등록 건수',meaning:'제공 화면의 딜 등록 건수입니다. 제출·승인·유효 건 중 집계 대상 상태를 확인합니다.',rule:'딜 상태·중복·갱신·취소 제외 기준 확인 필요. 타겟 미제공.',date:'등록일·승인일 중 집계 날짜 확인 필요.',current:4,yoy:null,qoq:null,unit:'건'}
]}};
const chosen=Object.fromEntries(Object.entries(profiles).map(([key,p])=>[key,new Set(p.metrics.map(d=>d.id))]));
const grid=document.querySelector('#portalMetrics'), dialog=document.querySelector('#metricDialog'), form=document.querySelector('#metricDefinitionForm');
let selected='crowdstrike',editingId=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const value=(n,unit)=>n===null?'자료 미입력':`${n.toLocaleString('en-US')} ${unit}`;
function change(current,previous){
 if(current===null||previous===null)return {text:'자료 미입력',tone:'neutral'};
 if(previous===0)return {text:'산출 불가 · 기준값 0',tone:'neutral'};
 const pct=(current-previous)/Math.abs(previous)*100;
 return {text:`${pct>0?'↑ +':pct<0?'↓ −':''}${Math.abs(pct).toFixed(1)}%`,tone:pct>0?'up':pct<0?'down':'neutral'};
}
const rate=d=>d.target>0?`${(d.current/d.target*100).toFixed(1)}%`:'타겟 없음';
function comparison(d,key,label){const c=change(d.current,d[key]);return `<div class="metric-change ${c.tone}"><span>${label}</span><b>${c.text}</b></div>`;}
function descriptionButton(d){return `<button type="button" class="metric-explain" data-metric="${d.id}" aria-label="${esc(d.name)} 항목 설명">항목 설명 · 집계 기준 ↗</button>`;}
function draw(){
 const profile=profiles[selected], defs=profile.metrics;
 document.querySelector('#portalTitle').textContent=`${profile.name} 실적 지표`;
 document.querySelector('#portalSubtitle').textContent={crowdstrike:'CrowdStrike의 10개 지표 · 항목별 의미와 인정 기준',checkpoint:'Booking 양식 · New Business / Renew별 타겟과 SA 실적 · SA 정의·원본 단위 확인 필요',okta:'ARR·파트너·DR별 타겟과 실적 · 금액과 건수를 구분',gigamon:'Closed Deal 금액·Deal Registrations 건수 · 제공된 2개 항목만 표시'}[selected];
 document.querySelector('#portalSettings').hidden=selected!=='crowdstrike';
 document.querySelector('#portalNote').textContent={crowdstrike:'TCV·ACV·NPACV·Flex는 중복될 수 있어 합산하지 않습니다. 설명은 공개 자료와 제공 화면을 바탕으로 한 예시이며 세부 집계 기준은 벤더 확인 후 설정합니다.',checkpoint:'합계는 New Business + Renew, 전체 달성률은 합계 SA ÷ 합계 타겟으로 계산합니다. 금액은 K USD 가상값이며 원본 화면의 실제 수치·통화를 옮긴 것이 아닙니다.',okta:'Total ARR = ARR - Upsell + ARR - New. Partner Sourced ARR·DR 금액을 여기에 더하지 않습니다. 타겟이 없으면 달성률을 표시하지 않고, 원본의 괄호 안 추가 구분은 의미 확인 후 반영합니다.',gigamon:'현재 제공된 지표만 구성했습니다. 타겟과 과거 비교 자료는 미제공 상태이며, 항목과 비교값은 추후 추가할 수 있습니다.'}[selected];
 grid.classList.toggle('booking-view',['checkpoint','okta'].includes(selected));
 grid.classList.toggle('compact-metrics',selected==='gigamon');
 if(selected==='checkpoint'){
  const total={name:'Total (Overall)',summary:'전체 합계',target:0,current:0,yoy:0,qoq:0};
  for(const d of defs)for(const k of ['target','current','yoy','qoq'])total[k]+=d[k];
  grid.innerHTML=`<div class="scroll"><table class="booking-table"><caption>이번 Q 누적 · 금액 단위 K USD · 모두 가상값</caption><thead><tr><th scope="col">Booking 구분</th><th scope="col">이번 Q 타겟</th><th scope="col">이번 Q SA</th><th scope="col">Target Rate</th><th scope="col">YoY</th><th scope="col">QoQ</th></tr></thead><tbody>${[...defs,total].map(d=>`<tr${d.id?'':' class="booking-total"'}><th scope="row">${esc(d.name)}<small>${esc(d.summary)}</small>${d.id?descriptionButton(d):''}</th><td>${d.target.toLocaleString('en-US')}</td><td><b>${d.current.toLocaleString('en-US')}</b></td><td><b>${rate(d)}</b></td><td>${comparison(d,'yoy','YoY')}</td><td>${comparison(d,'qoq','QoQ')}</td></tr>`).join('')}</tbody></table></div>`;
 }else if(selected==='okta'){
  const total={name:'Total ARR',summary:'Upsell + New',target:0,current:0,yoy:0,qoq:0,unit:'K USD'};
  for(const d of defs.slice(0,2))for(const k of ['target','current','yoy','qoq'])total[k]+=d[k];
  const rows=[...defs.slice(0,2),total,...defs.slice(2)];
  grid.innerHTML=`<div class="scroll"><table class="booking-table"><caption>이번 Q 누적 · 모두 가상값</caption><thead><tr><th scope="col">Category / 항목</th><th scope="col">단위</th><th scope="col">Target</th><th scope="col">실적</th><th scope="col">달성률</th><th scope="col">YoY</th><th scope="col">QoQ</th><th scope="col">Remarks</th></tr></thead><tbody>${rows.map(d=>`<tr${d.id?'':' class="booking-total"'}><th scope="row">${esc(d.name)}<small>${esc(d.summary)}</small>${d.id?descriptionButton(d):''}</th><td>${d.unit}</td><td>${d.target===null?'—':d.target.toLocaleString('en-US')}</td><td><b>${d.current.toLocaleString('en-US')}</b></td><td>${d.target===null?'타겟 없음':rate(d)}</td><td>${comparison(d,'yoy','YoY')}</td><td>${comparison(d,'qoq','QoQ')}</td><td>${d.target===null?'타겟 미제공':d.id?'가상값':'합계 자동 계산'}</td></tr>`).join('')}</tbody></table></div>`;
 }else{
  grid.innerHTML=defs.filter(d=>chosen[selected].has(d.id)).map(d=>`<article class="portal-metric"><h3>${esc(d.name)}</h3><p class="metric-summary">${esc(d.summary)}</p><strong>${d.current===null?'—':d.current.toLocaleString('en-US')}<small>${d.current===null?'':d.unit}</small></strong><div class="muted">${d.current===null?'데이터 미입력':'이번 Q 누적 · 가상값'}</div><div class="metric-comparisons">${comparison(d,'yoy','YoY')}${comparison(d,'qoq','QoQ')}</div>${descriptionButton(d)}</article>`).join('')||'<p class="note">표시할 항목을 하나 이상 선택하세요.</p>';
 }
 document.querySelector('#portalMetricCount').textContent=`${chosen[selected].size}개 항목 표시`;
}
const options=document.querySelector('#portalOptions');
options.innerHTML=profiles.crowdstrike.metrics.map(d=>`<label><input type="checkbox" value="${d.id}" checked> ${esc(d.name)}</label>`).join('');
options.addEventListener('change',e=>{if(e.target.checked)chosen[selected].add(e.target.value);else chosen[selected].delete(e.target.value);draw();});
const selector=document.querySelector('#portalVendor');
selector.onchange=()=>{selected=selector.value;draw();document.querySelector('#metricStatus').textContent='';};
const initial=new URLSearchParams(location.search).get('metrics');
if(Object.hasOwn(profiles,initial)){selected=initial;selector.value=initial;}
function openDefinition(id){
 const d=profiles[selected].metrics.find(d=>d.id===id);editingId=d.id;
 document.querySelector('#metricTitle').textContent=`${d.name} · 항목 설명`;
 document.querySelector('#metricMeaning').textContent=d.meaning;
 document.querySelector('#metricRules').innerHTML=`<dt>집계 대상·제외 조건</dt><dd>${esc(d.rule)}</dd><dt>인정 날짜</dt><dd>${esc(d.date)}</dd><dt>이번 Q 누적</dt><dd>${value(d.current,d.unit)}</dd><dt>YoY 비교값 · 전년 동일 Q의 같은 경과 시점</dt><dd>${value(d.yoy,d.unit)}</dd><dt>QoQ 비교값 · 직전 Q의 같은 경과 시점</dt><dd>${value(d.qoq,d.unit)}</dd>`;
 const source=document.querySelector('#metricSource');source.hidden=!d.source;if(d.source)source.href=d.source;
 for(const key of ['summary','meaning','rule','date']){form.elements[key].value=d[key];form.elements[key].setCustomValidity('');}
 document.querySelector('#metricEditDetails').open=false;dialog.showModal();
}
 grid.addEventListener('click',e=>{const b=e.target.closest('[data-metric]');if(b)openDefinition(b.dataset.metric);});
 document.querySelector('#closeMetric').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>grid.querySelector(`[data-metric="${editingId}"]`)?.focus());
 form.addEventListener('submit',e=>{
  e.preventDefault();const d=profiles[selected].metrics.find(d=>d.id===editingId);
  for(const key of ['summary','meaning','rule','date']){const field=form.elements[key];field.setCustomValidity(field.value.trim()?'':'내용을 입력해 주세요.');}
  if(!form.reportValidity())return;
  for(const key of ['summary','meaning','rule','date'])d[key]=form.elements[key].value.trim();
  delete d.source;draw();dialog.close();document.querySelector('#metricStatus').textContent=`${d.name} 설명을 예시에 적용했습니다. 새로고침하면 초기화됩니다.`;
 });
 form.addEventListener('input',e=>e.target.setCustomValidity?.(''));
 draw();
})();
