/* Marketing contact is selected by the requester; the handler claims separately. */
(function(root){
'use strict';
const C=typeof module==='object'?require('./vendor-dashboard-core.js'):root.VendorDashboardCore;
const marketingContacts=['이준희 과장','이형걸 사원','최윤채 사원','이준구 부장'];
const states={received:'접수',working:'진행 중',waiting:'회신 대기',done:'완료'};
function contactOptions(previous=''){
 const names=marketingContacts.slice();if(previous&&!names.includes(previous))names.push(previous);
 return names.map(name=>[name,name]);
}
function validate(p,{old=null,date}){
 for(const [k,label] of [['title','요청 제목'],['content','요청 내용'],['requester','요청자'],['created','접수일']])if(!String(p[k]||'').trim())throw Error(label+'을(를) 입력해 주세요.');
 if(!['business','marketing','vendor'].includes(p.requestTeam))throw Error('요청 구분을 사업부·마케팅·벤더 중 선택해 주세요.');
 if(!marketingContacts.includes(p.marketingContact)&&!(old&&(p.marketingContact||'')===(old.marketingContact||'')))throw Error('마케팅 담당자는 지정된 4명 중 선택해 주세요.');
 if(!C.validDate(p.created)||p.created>date||p.due&&(!C.validDate(p.due)||p.due<p.created))throw Error('접수일과 처리 희망일을 확인해 주세요.');
 if(!Object.hasOwn(states,p.status))throw Error('진행 상태를 확인해 주세요.');
 if(!old&&p.status!=='received')throw Error('새 요청은 접수 상태로 등록해 주세요.');
 if((p.owner||'')!==(old?.owner||''))throw Error('대응 담당자는 요청 목록에서 본인이 ‘제가 담당할게요’를 눌러 등록합니다.');
 if(p.status!=='received'&&!p.owner)throw Error('처리할 사람이 먼저 ‘제가 담당할게요’를 눌러 주세요.');
 if(['working','waiting'].includes(p.status)&&!p.next)throw Error('진행 중·회신 대기 요청에는 다음 조치를 입력해 주세요.');
}
function claim(p,{author,date,at}){
 if(!String(author||'').trim())throw Error('로그인 이름을 확인해 주세요.');
 if(p.owner)throw Error('이미 담당자가 등록된 요청입니다. 최신 내용을 확인해 주세요.');
 if(p.status==='done')throw Error('완료된 요청은 담당할 수 없습니다.');
 const status=p.status==='received'?'working':p.status;
 return {...p,owner:author,claimedAt:at,status,history:[...(p.history||[]),{date,at,by:author,status,text:author+' 담당 등록'}]};
}
root.VendorRequests={marketingContacts,states,contactOptions,validate,claim};if(typeof module==='object')module.exports=root.VendorRequests;
})(typeof window==='object'?window:globalThis);
