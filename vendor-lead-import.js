/* Spreadsheet normalization and matching. No network access or workbook mutation. */
(function(root){
'use strict';
const stages={new:'미접촉',contacted:'접촉',qualified:'유효 리드',opportunity:'영업 기회',won:'수주',lost:'종료'};
const columns=[
 ['id','리드ID',['leadid','id']],['name','고객 / 리드명',['고객명','고객사','회사명','리드명','company','account','leadname'],true],
 ['contact','고객 담당자',['고객담당자명','성명','contact','contactname']],['email','이메일',['email','emailaddress']],['phone','전화번호',['연락처','휴대폰','phone','mobile']],
 ['source','출처 / 행사명',['출처','행사명','캠페인','source','campaign']],['stage','현재 단계',['단계','진행상태','status','stage']],
 ['owner','담당자',['영업담당자','담당','owner'],true],['lastContact','최근 접촉일',['최근접촉','lastcontact']],
 ['next','다음 조치',['후속조치','nextaction']],['due','다음 조치 기한',['기한','due','duedate']],['note','비고',['메모','note','notes']]
];
const text=v=>String(v??'').trim(),norm=v=>text(v).normalize('NFKC').toLowerCase().replace(/[\s_\-/()]/g,'');
const fingerprint=p=>[p.name,p.source,p.email||p.contact||''].map(norm).join('|');
function mapping(headers){return Object.fromEntries(columns.map(([key,label,aliases])=>{const names=[key,label,...aliases].map(norm);return [key,headers.findIndex(h=>names.includes(norm(h)))];}));}
function date(v){
 if(v instanceof Date){if(!Number.isFinite(+v))throw Error('존재하지 않는 날짜입니다.');return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`;}
 const s=text(v);if(!s)return '';
 if(typeof v==='number'&&v>0&&v<100000){if(Math.floor(v)===60)throw Error('존재하지 않는 엑셀 날짜입니다.');return new Date(Date.UTC(1899,11,30)+Math.round(v)*86400000).toISOString().slice(0,10);}
 const m=s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\.?$/);if(!m)throw Error('날짜는 YYYY-MM-DD 형식으로 입력해 주세요.');
 const iso=`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
 const d=new Date(iso+'T00:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==iso)throw Error('존재하지 않는 날짜입니다.');return iso;
}
function validate(p,today){
 if(!p.name||!p.owner)throw Error('고객 / 리드명과 담당자는 필수입니다.');
 if(!Object.hasOwn(stages,p.stage))throw Error('단계는 미접촉·접촉·유효 리드·영업 기회·수주·종료 중 하나여야 합니다.');
 if(p.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))throw Error('이메일 형식을 확인해 주세요.');
 for(const [k,label] of columns.filter(([k])=>k!=='id'))if(text(p[k]).length>(k==='note'?4000:200))throw Error(label+'이(가) 너무 깁니다.');
 for(const k of ['lastContact','due'])if(p[k])date(p[k]);
 if(p.lastContact&&p.lastContact>today)throw Error('최근 접촉일은 오늘 이전으로 입력해 주세요.');
}
function preview(rows,map,records,today,makeId){
 const entries=[],errors=[];const byId=new Map(records.map(r=>[r.recordId,r])),byIdentity=new Map(),seenIds=new Set(),seenIdentity=new Map();
 const selected=Object.values(map).filter(i=>i>=0);
 if(new Set(selected).size!==selected.length)throw Error('같은 열을 두 항목에 연결할 수 없습니다.');
 for(const [k,label,,required] of columns)if(required&&!(map[k]>=0))throw Error(label+' 열을 연결해 주세요.');
 for(const r of records){const k=fingerprint(r.current.payload);if(!byIdentity.has(k))byIdentity.set(k,[]);byIdentity.get(k).push(r);}
 for(let i=0;i<rows.length;i++){
  const row=rows[i];if(!row.some(v=>text(v)))continue;
  try{
   const input=Object.fromEntries(columns.map(([k])=>[k,map[k]>=0?row[map[k]]:'']));
   const explicit=text(input.id);if(explicit&&!/^[A-Za-z0-9_.:-]{1,100}$/.test(explicit))throw Error('리드ID는 영문·숫자 및 _ . : - 로 100자 이내로 입력해 주세요.');
   const identity=fingerprint(input);let previous=explicit?byId.get(explicit):null;
   if(!explicit){const matches=byIdentity.get(identity)||[];if(matches.length>1)throw Error('같은 고객·출처·연락 대상이 여러 건입니다. 기존 목록의 리드ID로 구분해 주세요.');previous=matches[0];}
   if(previous?.current.deleted)throw Error('보관된 리드입니다. 신규 등록하려면 새 리드ID를 지정해 주세요.');
   if(previous?.conflict)throw Error('동시 수정된 리드입니다. 화면에서 충돌을 먼저 확인해 주세요.');
   const id=previous?.recordId||explicit||makeId(),p={...(previous?.current.payload||{})};
   for(const [k] of columns){if(k==='id')continue;const value=input[k];if(text(value)!=='')p[k]=['lastContact','due'].includes(k)?date(value):text(value);else if(p[k]==null)p[k]='';}
   const stage=Object.entries(stages).find(([k,label])=>norm(k)===norm(p.stage)||norm(label)===norm(p.stage));p.stage=stage?.[0]||(p.stage?'invalid':'new');
   validate(p,today);
   const previousRow=seenIdentity.get(identity);
   if(seenIds.has(id)||previousRow&&(!explicit||!previousRow.explicit))throw Error('파일 안에 같은 리드가 중복되었습니다. 서로 다른 리드는 리드ID로 구분해 주세요.');
   seenIds.add(id);seenIdentity.set(identity,{explicit});
   const unchanged=previous&&columns.filter(([k])=>k!=='id').every(([k])=>text(previous.current.payload[k])===text(p[k]));
   entries.push({row:i+2,id,p,parents:previous?.heads.map(h=>h.id)||[],status:unchanged?'skip':previous?'update':'new'});
  }catch(e){errors.push({row:i+2,name:text(row[map.name]),message:e.message});}
 }
 return {entries,errors};
}
const api={columns,stages,mapping,date,validate,preview,fingerprint};root.VendorLeadImport=api;if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
