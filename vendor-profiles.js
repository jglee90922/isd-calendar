/* 벤더별 표시 양식과 정의. 실적 데이터 없음. */
window.VENDOR_PROFILES={
  "crowdstrike": {
    "name": "CrowdStrike",
    "metrics": [
      {
        "id": "tcv",
        "name": "TCV",
        "summary": "전체 계약기간의 총 계약 금액",
        "meaning": "Total Contract Value. 계약 전체 기간에 해당하는 금액을 보는 지표입니다. 회계상 매출 인식액과는 구분합니다.",
        "rule": "대상 계약·서비스 범위, 취소·변경분 반영 방식 확인 필요.",
        "date": "계약일·부킹일 등 포털의 인정 날짜 확인 필요.",
        "unit": "K USD"
      },
      {
        "id": "acv",
        "name": "ACV",
        "summary": "계약의 연간 가치",
        "meaning": "Annual Contract Value. CrowdStrike의 공개 자료에서는 계약의 첫 12개월에 고객이 약정한 금액으로 설명합니다. 현재 포털의 인정 범위는 별도 확인합니다.",
        "rule": "다년 계약·갱신·서비스의 포함 범위 확인 필요.",
        "date": "포털의 실적 인정 날짜 확인 필요.",
        "unit": "K USD",
        "source": "https://www.sec.gov/Archives/edgar/data/1535527/000110465922057039/tm229592-1_def14a.htm"
      },
      {
        "id": "npacv",
        "name": "NPACV",
        "summary": "신규·확장 계약의 New Platform ACV",
        "meaning": "New Platform ACV. 공개 자료상 신규 고객 또는 기존 고객에서 연간 반복 수익(ARR)이 증가하는 플랫폼 계약을 뜻합니다. 신규 고객만을 의미하지 않습니다.",
        "rule": "증액분과 갱신분 구분 및 현재 포털의 인정 방식 확인 필요.",
        "date": "포털의 실적 인정 날짜 확인 필요.",
        "unit": "K USD",
        "source": "https://www.sec.gov/Archives/edgar/data/1535527/000110465922057039/tm229592-1_def14a.htm"
      },
      {
        "id": "sourced",
        "name": "Partner Sourced",
        "summary": "파트너가 발굴한 New Platform ACV",
        "meaning": "제공 화면의 New Platform ACV 중 Partner Sourced로 분류된 금액입니다. 파트너가 발굴한 영업 기회의 기여를 봅니다.",
        "rule": "파트너 발굴 인정 요건·귀속 파트너·중복 기여 처리 확인 필요.",
        "date": "New Platform ACV의 집계 날짜 확인 필요.",
        "unit": "K USD"
      },
      {
        "id": "dr",
        "name": "Approved DR",
        "summary": "승인된 딜 등록 건수",
        "meaning": "Deal Registration(딜 등록) 중 승인된 건수입니다. 제공 화면은 By Converted Date 기준으로 표시합니다.",
        "rule": "승인 상태·중복 등록·취소 건 제외 기준 확인 필요.",
        "date": "Converted Date(전환일). 승인일과 같은 날짜인지는 확인 필요.",
        "unit": "건"
      },
      {
        "id": "logos",
        "name": "New Logos",
        "summary": "파트너가 발굴한 신규 고객 수",
        "meaning": "제공 화면의 Partner Sourced 조건에 해당하는 신규 고객 수입니다. 단순 신규 등록 고객과 수주 고객 중 어떤 기준인지 확인합니다.",
        "rule": "최초 고객 판정·수주 여부·고객 ID 중복 제거 기준 확인 필요.",
        "date": "신규 고객 인정 날짜 확인 필요.",
        "unit": "개사"
      },
      {
        "id": "velocity",
        "name": "Velocity",
        "summary": "Velocity로 분류된 영업 기회 수",
        "meaning": "제공 화면은 Opps(영업 기회)로 표시합니다. Velocity 분류에 해당하는 기회 수로 해석한 예시이며, 영업 속도나 소요 시간이라고 단정하지 않습니다.",
        "rule": "Velocity 분류 조건·대상 영업 단계·금액 조건 확인 필요.",
        "date": "기회 생성일·전환일·수주일 중 집계 날짜 확인 필요.",
        "unit": "건"
      },
      {
        "id": "flex",
        "name": "Flex",
        "summary": "Flex의 New Platform ACV",
        "meaning": "제공 화면에서 Flex 항목으로 분류한 New Platform ACV 금액입니다. 전체 Flex 계약금액과 동일한지는 별도 확인합니다.",
        "rule": "Flex 인정 대상·소진액과 계약액 구분·다른 지표와 중복 범위 확인 필요.",
        "date": "New Platform ACV의 실적 인정 날짜 확인 필요.",
        "unit": "K USD"
      },
      {
        "id": "customers",
        "name": "# of Customers",
        "summary": "집계 대상 고객 수",
        "meaning": "선택한 분기에 포털 집계 조건을 충족하는 고객 수입니다. 전체 보유 고객인지 거래 고객인지에 따라 값이 달라질 수 있습니다.",
        "rule": "거래·계약 상태 등 포함 조건 및 고객 ID별 중복 제거 기준 확인 필요.",
        "date": "기간 내 발생 기준인지 기준일 시점 보유 기준인지 확인 필요.",
        "unit": "개사"
      },
      {
        "id": "partners",
        "name": "# of Partners",
        "summary": "집계 대상 파트너 수",
        "meaning": "포털 집계 조건을 충족하는 파트너 수입니다. 아래 ERP 거래 기준 Active partner와는 별도로 봅니다.",
        "rule": "등록·거래·인증 중 대상 조건과 파트너 ID 중복 제거 기준 확인 필요.",
        "date": "기간 내 활동 기준인지 기준일 시점 보유 기준인지 확인 필요.",
        "unit": "개사"
      }
    ]
  },
  "checkpoint": {
    "name": "Check Point",
    "metrics": [
      {
        "id": "nb",
        "name": "New Business",
        "summary": "신규 사업 실적",
        "meaning": "제공 표의 New Business 구분입니다. 신규 고객·추가 제품·기존 고객 증설 중 포함되는 범위는 벤더 기준을 확인합니다.",
        "rule": "New Business와 Renew 구분, SA 인정 금액 범위 확인 필요.",
        "date": "SA의 뜻·인정 날짜·원본 통화와 단위 확인 필요.",
        "unit": "K USD"
      },
      {
        "id": "renew",
        "name": "Renew",
        "summary": "갱신 실적",
        "meaning": "제공 표의 갱신 구분입니다. 기존 계약의 갱신 실적을 별도로 관리합니다.",
        "rule": "갱신·증설 배분, 취소 및 차감 반영 기준 확인 필요.",
        "date": "SA의 뜻·인정 날짜·원본 통화와 단위 확인 필요.",
        "unit": "K USD"
      }
    ]
  },
  "okta": {
    "name": "Okta",
    "metrics": [
      {
        "id": "upsell",
        "name": "ARR - Upsell",
        "summary": "기존 고객의 확장 ARR",
        "meaning": "ARR(Annual Recurring Revenue, 연간 반복 수익) 중 기존 고객의 추가 도입·확장에 해당하는 항목입니다.",
        "rule": "확장분의 인정 범위·갱신분 제외 방식 확인 필요.",
        "date": "벤더의 ARR 인정 날짜 확인 필요.",
        "unit": "K USD"
      },
      {
        "id": "new",
        "name": "ARR - New",
        "summary": "신규 고객의 ARR",
        "meaning": "신규 고객에서 발생한 ARR을 별도로 보는 항목입니다.",
        "rule": "신규 고객 판정·제품 범위·고객 중복 제거 기준 확인 필요.",
        "date": "벤더의 ARR 인정 날짜 확인 필요.",
        "unit": "K USD"
      },
      {
        "id": "sourced",
        "name": "Partner Sourced ARR",
        "summary": "파트너가 발굴한 ARR",
        "meaning": "파트너 발굴로 인정된 ARR입니다. Total ARR과 중복될 수 있으므로 더하지 않습니다.",
        "rule": "파트너 발굴 귀속 요건·괄호 안 별도 수치의 의미 확인 필요.",
        "date": "ARR 실적 인정 날짜 확인 필요.",
        "unit": "K USD"
      },
      {
        "id": "active",
        "name": "Active Partner",
        "summary": "벤더 기준 활성 파트너 수",
        "meaning": "Okta의 활성 기준을 충족하는 파트너 수입니다. ERP에서 거래가 발생한 파트너 수와는 다를 수 있습니다.",
        "rule": "활성 요건·집계 기간·파트너 ID 중복 제거 기준 확인 필요. 타겟 미제공.",
        "date": "활동 발생 기준 또는 기준일 시점 기준 확인 필요.",
        "unit": "개사"
      },
      {
        "id": "drRevenue",
        "name": "DR Submission (Rev)",
        "summary": "제출한 딜 등록의 금액",
        "meaning": "딜 등록 제출 건에 연결된 금액입니다. 수주 실적이나 승인 DR 금액으로 자동 간주하지 않습니다.",
        "rule": "금액 기준(ARR·계약금액 등)·상태·괄호 안 추가 수치 의미 확인 필요.",
        "date": "딜 등록 제출일 및 상태 변경 반영 기준 확인 필요.",
        "unit": "K USD"
      },
      {
        "id": "drCount",
        "name": "DR Submission (Count)",
        "summary": "제출한 딜 등록 건수",
        "meaning": "딜 등록을 제출한 건수입니다. 승인된 건수와 구분합니다.",
        "rule": "재제출·취소·중복 건 제외 기준 확인 필요. 타겟 미제공.",
        "date": "딜 등록 제출일 기준인지 확인 필요.",
        "unit": "건"
      }
    ]
  },
  "gigamon": {
    "name": "Gigamon",
    "metrics": [
      {
        "id": "closed",
        "name": "Closed Deal",
        "summary": "마감된 딜의 실적 금액",
        "meaning": "제공 화면의 Closed Deal 금액입니다. 수주 완료만 포함하는지, 부킹·계약금액 등 어떤 금액인지 벤더 기준을 확인합니다.",
        "rule": "Closed Won 포함 여부·인정 금액·취소 반영 기준 확인 필요. 타겟 미제공.",
        "date": "딜 마감일 기준인지 확인 필요.",
        "unit": "K USD"
      },
      {
        "id": "registrations",
        "name": "Deal Registrations",
        "summary": "딜 등록 건수",
        "meaning": "제공 화면의 딜 등록 건수입니다. 제출·승인·유효 건 중 집계 대상 상태를 확인합니다.",
        "rule": "딜 상태·중복·갱신·취소 제외 기준 확인 필요. 타겟 미제공.",
        "date": "등록일·승인일 중 집계 날짜 확인 필요.",
        "unit": "건"
      }
    ]
  }
};
