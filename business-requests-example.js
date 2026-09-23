// 사업부 요청과 대응 현황 예시. 운영 저장소와 연결하지 않는다.
(()=>{
const asOf='2026-09-23';
const states={received:'접수',working:'진행 중',waiting:'회신 대기',done:'완료'};
const requests=[
 {id:1,title:'신규 파트너 대상 프로모션 안내자료 요청',content:'대상 조건·보상·신청 방법을 정리한 파트너 안내자료가 필요합니다.',requester:'예시 사업부 / 요청자 A',owner:'마케팅 담당 A',priority:'높음',created:'2026-09-18',due:'2026-09-22',status:'working',next:'벤더의 보상 조건 확인 후 최종본 전달',history:[{date:'2026-09-18',status:'received',text:'사업부 요청 접수',by:'요청자 A'},{date:'2026-09-21',status:'working',text:'안내자료 초안 작성. 보상 지급 조건 확인 중.',by:'마케팅 담당 A'}]},
 {id:2,title:'파트너 교육 일정과 강사 지원 요청',content:'이번 Q 파트너 기술 교육의 일정과 벤더 강사 지원 가능 여부를 확인해 주세요.',requester:'예시 사업부 / 요청자 B',owner:'마케팅 담당 B',priority:'보통',created:'2026-09-20',due:'2026-09-27',status:'waiting',next:'벤더 회신 확인 후 교육 일정 확정',history:[{date:'2026-09-20',status:'received',text:'교육 지원 요청 접수',by:'요청자 B'},{date:'2026-09-22',status:'waiting',text:'벤더에 후보 일정 전달. 강사 가능 일정 회신 대기.',by:'마케팅 담당 B'}]},
 {id:3,title:'유효 리드 배분 결과 정리 요청',content:'행사 리드의 사업부 담당 배분 및 최초 연락 결과를 공유해 주세요.',requester:'예시 사업부 / 요청자 C',owner:'마케팅 담당 A',priority:'높음',created:'2026-09-23',due:'2026-09-25',status:'received',next:'리드 담당자별 접촉 결과 취합',history:[{date:'2026-09-23',status:'received',text:'요청 접수. 담당자별 결과 취합 예정.',by:'마케팅 담당 A'}]},
 {id:4,title:'고객 미팅용 제품 소개자료 요청',content:'고객 제안 미팅에서 사용할 제품 소개자료를 요청합니다.',requester:'예시 사업부 / 요청자 A',owner:'마케팅 담당 C',priority:'보통',created:'2026-09-15',due:'2026-09-19',status:'done',next:'',history:[{date:'2026-09-15',status:'received',text:'소개자료 요청 접수',by:'요청자 A'},{date:'2026-09-18',status:'done',text:'제품 소개자료 전달 및 사업부 수신 확인 완료.',by:'마케팅 담당 C'}]}
];
let editing=null,nextId=5;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const overdue=r=>r.status!=='done'&&r.due<asOf;
const cards=document.querySelector('#requestCards'),filter=document.querySelector('#requestFilter'),form=document.querySelector('#requestForm'),dialog=document.querySelector('#requestDialog');
function draw(){
 const open=requests.filter(r=>r.status!=='done').length, late=requests.filter(overdue).length;
 document.querySelector('#requestSummary').innerHTML=[['전체 요청',requests.length],['미완료',open],['기한 경과',late],['완료',requests.length-open]].map(([label,count])=>`<div class="request-stat"><span>${label}</span><b>${count}<small>건</small></b></div>`).join('');
 const visible=requests.filter(r=>filter.value==='all'||filter.value==='open'&&r.status!=='done'||filter.value==='overdue'&&overdue(r)||filter.value===r.status);
 cards.innerHTML=visible.map(r=>{const latest=r.history.at(-1);return `<article class="request-card${overdue(r)?' is-overdue':''}"><div class="row"><span class="muted">REQ-${String(r.id).padStart(3,'0')} · ${esc(r.priority)} 우선순위</span><span class="tag ${r.status==='done'?'good':overdue(r)?'warn':''}">${states[r.status]}${overdue(r)?' · 기한 경과':''}</span></div><h3>${esc(r.title)}</h3><p class="request-content">${esc(r.content)}</p><dl class="request-meta"><div><dt>요청 부서·요청자</dt><dd>${esc(r.requester)}</dd></div><div><dt>대응 담당자</dt><dd>${esc(r.owner)}</dd></div><div><dt>요청일</dt><dd>${r.created}</dd></div><div><dt>처리 기한</dt><dd>${r.due}</dd></div></dl><div class="request-response"><span>최근 대응 · ${latest.date}</span><p>${esc(latest.text)}</p>${r.next?`<p><b>다음 조치</b> ${esc(r.next)}</p>`:''}</div><div class="request-card-actions"><details><summary>대응 이력 ${r.history.length}건</summary><ol class="request-history">${r.history.map(h=>`<li><small>${h.date} · ${esc(h.by)} · ${states[h.status]}</small><p>${esc(h.text)}</p></li>`).join('')}</ol></details><button class="btn" type="button" data-request="${r.id}" aria-label="${esc(r.title)} 대응 업데이트">대응 업데이트</button></div></article>`;}).join('')||'<p class="note">해당하는 요청 사항이 없습니다.</p>';
}
filter.onchange=draw;
function openEditor(id){
 editing=id;form.reset();document.querySelector('#requestError').textContent='';
 const r=requests.find(r=>r.id===id);
 document.querySelector('#requestDialogTitle').textContent=r?'사업부 요청 · 대응 업데이트':'사업부 요청 추가';
 for(const key of ['title','content','requester','owner','priority','created','due','status','next'])form.elements[key].value=r?r[key]:({priority:'보통',created:asOf,due:asOf,status:'received'}[key]||'');
 form.elements.response.value='';form.elements.response.required=!!r;
 form.elements.response.placeholder=r?'이번에 진행한 내용과 결과를 입력하세요.':'접수할 때 남길 메모 (선택)';
 dialog.showModal();
}
cards.onclick=e=>{const b=e.target.closest('[data-request]');if(b)openEditor(Number(b.dataset.request));};
document.querySelector('#addRequest').onclick=()=>openEditor(null);
document.querySelector('#closeRequest').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{(editing===null?document.querySelector('#addRequest'):cards.querySelector(`[data-request="${editing}"]`))?.focus();});
form.onsubmit=e=>{
 e.preventDefault();const data={};for(const key of ['title','content','requester','owner','priority','created','due','status','next'])data[key]=form.elements[key].value.trim();
 const error=document.querySelector('#requestError'), response=form.elements.response.value.trim();
 if(['title','content','requester','owner'].some(key=>!data[key])){error.textContent='요청 내용과 요청자·대응 담당자를 입력해 주세요.';return;}
 if(data.due<data.created){error.textContent='처리 기한은 요청일 이후로 입력해 주세요.';return;}
 if(data.created>asOf){error.textContent='예시 기준일(2026-09-23) 이후 날짜로는 요청을 등록할 수 없습니다.';return;}
 if(editing!==null&&!response){error.textContent='이번 대응 내용을 입력해 주세요. 기존 이력은 함께 유지됩니다.';return;}
 if(data.status==='done'&&!response){error.textContent='완료 결과를 대응 내용에 입력해 주세요.';return;}
 if(data.status!=='done'&&!data.next){error.textContent='미완료 요청에는 다음 조치를 입력해 주세요.';return;}
 if(data.status==='done')data.next='';
 const historyEntry={date:asOf,status:data.status,text:response||'요청 접수',by:data.owner};
 if(editing===null)requests.unshift({id:nextId++,...data,history:[historyEntry]});
 else{const r=requests.find(r=>r.id===editing);Object.assign(r,data);r.history.push(historyEntry);}
 filter.value='all';draw();dialog.close();document.querySelector('#requestStatus').textContent='예시 화면에 적용했습니다. 새로고침하면 초기화됩니다.';
};
draw();
})();
