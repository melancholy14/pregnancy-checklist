# design-bundle-d-uncheck-toggle-dday 리뷰

> 작성일: 2026-05-10
> 상태: draft
> size: L
> 관련 스펙: [spec.md](./spec.md) (생성 후)

## 1. 기능 요약

phase-4.5.md §2.6 UX 기회 1·2를 한 라운드에 마감. (1) 체크리스트 영역(`/checklist/<slug>`)에 "미체크만 보기" 토글 도입 — 32개 항목 중 8개 남았을 때 스크롤 부담 해소. (2) ChecklistItemRow에 임신 주차 D-day 컨텍스트 라벨 추가 — `recommendedWeek` ↔ `currentWeek` 매칭. P3·P4(예정일 직접 입력 + 자동 주차 산출, 2026-05 머지)와 P6(`recommendedWeek=0` = "주차 무관" 명문화)가 선결 완료라 unblock 상태.

⚠️ **사전 인지된 결정 의존성**: P2(`isHighlighted` 부활, 2026-05 머지)로 ChecklistItemRow에 이미 "이번 주차 추천" CalendarCheck 마이크로 라벨이 박혀 있음 — 본 묶음의 D-day 라벨과 시맨틱·시각 충돌 가능. 페어 1(planner × designer) 핵심 충돌 축.

## 2. 적용 페어 + 선택 이유

- **planner × designer**: P2 부활 라벨과 D-day 라벨의 통합/별도/대체 결정 + 매칭 범위·카피·`recommendedWeek=0`·미입력 사용자 처리까지 결정 다발이 첨예. designer N1·N2·N4 vs planner §5.4·§7.5 충돌.
- **dev × marketer**: `checklist_filter` 신규 GA4 이벤트 정의 + 파라미터 정합 + PII 보호 + 측정 락인. dev §6.3 vs marketer §3.1·§3.6 충돌.
- **dev × designer**: 신규 토글 UI 위치·focus ring·빈 상태·영속성·모바일 정합. dev §6.3·§6.6 vs designer N1·N2·N7 충돌.

## 3. 페어별 충돌

### 페어 1: planner × designer

**T0 — 페어 시작 선언**: 이전 페어 [없음] 영향 없음. planner §7.7·§7.5·§5.3 / designer N1·N2·N4 인용.

**[planner] 단독 입장**:

- **잃는 것**: D-day 라벨의 매칭 범위 결정 — (b) 지난 주차 라벨 도입 시 "이미 챙겼어야 할 항목" 시각 강조로 임산부 불안 조장 위험. P2 부활이 "이번 주 추천" 단일 분기로 핵심 케이스 커버 중이라 D-day가 미래·지난 어느 쪽을 더할지 첨예.
- **희생 거부 인용**: "'이거 모르면 큰일 나요' 류 카피, 불안 조장 광고 톤 거부." — docs/content/persona.md §7.7.
- **주장**: D-day 라벨 매칭 범위 = `recommendedWeek > currentWeek` 미래 권장 한정. 지난 주차 라벨 도입 X. 카피 = "N주 후 권장"·"D-N주" 등 임산부 친근 톤 (구체 카피는 페이즈 4 또는 페이즈 5 진입 전 기획자 검토). recommendedWeek=0 → 라벨 0. currentWeek null → 모든 D-day 라벨 비표시.
- **잔재 자기검증**: 이전 페어 없음 — N

**[designer] 반박 입장**:

- **A 발언 반박**: planner의 "미래만 노출"은 §7.7 정합 OK. 다만 미래만 박으면 ChecklistItemRow 정보 위계가 평탄(N1 ARIA 정합성 약화). 절충: 라벨은 미래 한정, 지난 주차 미체크 항목은 "미체크만 보기" 토글로 사용자 능동 검색 위임 — 공포 카피 0 + 시각 위계 회복.
- **잃는 것**: 시각 분기 3종(미래·현재·과거)을 미래·현재 2분기로 좁힘. 지난 주차 시각 구분은 토글 행동으로 위임.
- **희생 거부 인용**: "색 대비, 키보드 도달, ARIA 정합성, 스크린리더 라벨." — docs/design/persona.md N1. + "role/시맨틱과 시각이 일치." — N2.
- **주장**: D-day 라벨 시각 시안 — (a) 아이콘: P2의 CalendarCheck와 다른 lucide `Clock`/`CalendarClock` (시맨틱 분리) (b) 위치: P2 라벨 슬롯과 동일, 분기로 동시 노출 X, isChecked 시 비표시 (c) 시각 톤: `text-muted-foreground font-normal` (P2 `text-foreground font-medium`보다 약함, 어텐션 위계 "지금 > N주 후") (d) 카피는 기획자 영역, 검토 1회 위임 (e) focus-visible은 ChecklistItemRow 기존 ring에 의존.
- **잔재 자기검증**: 이전 페어 없음 — N

**T3 — 핵심 충돌 + 숨은 가정**:

- **핵심 충돌**: 매칭 범위 (가) 미래만 (planner §7.7 + designer 양보) vs (나) 미래+지난 (designer N1 위계). 양쪽이 (가)에 사실상 수렴 — 잔여 충돌은 시각 톤(text-muted-foreground)의 위계 정합성 + 토글로 지난 주차 식별 가설의 측정 검증.
- **숨은 가정**: P2 부활(2026-05 머지) 후 `recommended_item_view`/`check` 측정 누적 부족 — D-day 라벨이 P2 어텐션을 분산할지 시너지일지 가설 미검증. 양쪽 모두 "사용자가 P2 라벨을 학습했다"고 묵시 가정.

### 페어 2: dev × marketer

**T0 — 페어 시작 선언**: 이전 페어 [페어 1: planner × designer] 영향 없음. dev §6.3·§6.6 / marketer §3.1·§3.6 인용.

**[dev] 단독 입장**:

- **잃는 것**: (1) 토글 zustand persist 도입 시 schema 변경 — P5 schema versioning deferred 정책 깨야 함. (2) D-day 라벨 측정 정의가 명세되지 않은 채 코드 진입하면 임시 추정값이 영구 측정 모델로 박힘.
- **희생 거부 인용**: "schema 변경 시 항상 migrate 핸들러 또는 명시적 fallback." — docs/tech/persona.md §6.3. + "산출물 없으면 운영자에게 결정 요청. 임시 추정값으로 채우면 그게 영구가 된다." — §6.6.
- **주장**: marketer가 박아야 할 결정 — (a) `checklist_filter` 이벤트(`filter_type` enum, `value` 형식, 발사 시점) (b) D-day 라벨 측정(신규 이벤트 vs 기존 파라미터 추가) (c) 토글 영속성(persist + migrate 의무 vs 세션 한정).
- **잔재 자기검증**: 이전 페어 [페어 1: planner × designer] 영향 없음 — N — 매칭 범위 결정이 측정 이벤트 정의에 영향 없음.

**[marketer] 반박 입장**:

- **A 발언 반박**: `checklist_filter`는 phase-4.5.md §1.5에 이미 정의 박힘. MVP는 단일 토글이라 enum 확장 없이 "uncheck_only" 고정 OK. (b) D-day 측정은 락인 §3.6에 따라 신규 이벤트로 가야 정합 — 기존 파라미터 추가는 "변경"에 가까워 4주 grace period 부담. (c) 토글 영속성은 측정에 직접 영향 없음 → dev §6.3 + P5 deferred 존중해 세션 한정 양보.
- **잃는 것**: D-day 신규 이벤트 도입으로 GA4 카탈로그 +1~2건 추가, 분석 시 join 부담 ↑. 토글 persist 양보(세션 한정).
- **희생 거부 인용**: "이벤트·로그·user_property 어디에도 식별 정보 금지." — docs/marketing/persona.md §3.1. + "이벤트명·파라미터 키·user_property 정의 임의 변경/삭제. 신규는 추가만, 변경은 신/구 병행 4주 grace period." — §3.6.
- **주장**: (a) `checklist_filter` = `filter_type = "uncheck_only"` 단일 enum + `value = "on" | "off"` string + 토글 변경 시 1회 발사(페이지뷰 자동 발사 X) + ga4.md에 enum 확장 정책 메모. (b) D-day 라벨 측정 = 신규 `upcoming_item_view` 이벤트 (param: `item_id` string, `weeks_ahead` integer = recommendedWeek - currentWeek). PII 0. ChecklistItemRow 마운트 시 1회. `upcoming_item_check` 추가 여부는 페이즈 6 ga4 작성 시 검토. 기존 `recommended_item_view` 변경 0. (c) 토글 영속성 = 세션 한정.
- **잔재 자기검증**: 이전 페어 [페어 1: planner × designer] 영향 없음 — N — 라벨 시각 톤이 측정 정의에 영향 없음.

**T3 — 핵심 충돌 + 숨은 가정**:

- **핵심 충돌**: D-day 측정을 (i) 기존 파라미터 추가 vs (ii) 신규 `upcoming_item_view` — (ii)에 수렴(marketer §3.6 강함). 잔여: 토글 발사 시점 = 변경 시 1회만 (marketer 락인) vs 페이지뷰 시 현재 상태도(sticky 측정) — marketer 우선. 토글 영속성은 세션 한정 합의.
- **숨은 가정**: 사용자 미입력(currentWeek null) 상태에서 D-day 라벨 비표시 → `upcoming_item_view` 발사 0 → null 사용자 코호트 측정 사각지대. 양쪽이 null 사용자 비율을 측정 가설에 안 박음.

### 페어 3: dev × designer

**T0 — 페어 시작 선언**: 이전 페어 [페어 2: dev × marketer] 영향 없음. dev §6.6·§6.5 / designer N1·N2 인용.

**[dev] 단독 입장**:

- **잃는 것**: 토글 위치에 따라 React 변경 범위 1배~3배. 빈 상태에서 phase-4.5 P9 `AllDoneBadge`와 의미 분리·중복 회피 명세 미정. 모바일 320px 회귀 케이스. (영속성은 페어 2 세션 한정 결정 따름, 본 발화 한정 외)
- **희생 거부 인용**: "산출물 없으면 운영자에게 결정 요청. 임시 추정값으로 채우면 그게 영구가 된다." — docs/tech/persona.md §6.6. + "E2E 빨강을 무시하고 배포 X." — §6.5.
- **주장**: designer가 design.md에 박을 항목 — (a) 토글 위치 (b) 컴포넌트(Switch/Checkbox/커스텀) (c) focus-visible ring 토큰 (d) 빈 상태 처리(AllDoneBadge 재활용 vs 신규 인라인) (e) 모바일 320px 정합.
- **잔재 자기검증**: 이전 페어 [페어 2: dev × marketer] 영향 없음 — N — 영속성·이벤트 결정은 UI 위치·focus·빈 상태와 독립.

**[designer] 반박 입장**:

- **A 발언 반박**: (a)~(e) 합당. (d) 빈 상태 카피는 디자이너 영역 외 — 기획자 검토 영역. 페어 1·페어 2(묶음 L)에 이어 본 페어까지 dev의 카피 떠넘기기 패턴 반복 — 페르소나 책임 분리 위반.
- **잃는 것**: 토글 위치 단일 슬롯 박음. AllDoneBadge 재활용 거부, 신규 인라인 메시지로 시각만 정의, 카피는 기획자 위임. 모바일 320px에서 토글이 진행률 텍스트와 같은 행이면 줄바꿈 → 분리 행.
- **희생 거부 인용**: "색 대비, 키보드 도달, focus-visible, ARIA 정합성, 시맨틱 HTML, 스크린리더 라벨." — docs/design/persona.md N1. + "role/시맨틱과 시각이 일치." — N2 (switch=instant ON/OFF, checkbox=form submission).
- **주장**: (a) 위치 = ChecklistPage 진행률 카드 아래, ChecklistHub 첫 항목 위 슬롯 (b) shadcn `Switch` + `data-[state=checked]:bg-pastel-lavender` (c) `focus-visible:ring-2 focus-visible:ring-pastel-lavender focus-visible:ring-offset-2` (묶음 H 정합) (d) AllDoneBadge 재활용 X(의미 분리), 신규 컴포넌트 X, 인라인 메시지 `text-sm text-muted-foreground text-center py-6` + 카피 기획자 검토 (e) 320px = 토글+라벨 한 줄 OK, 진행률 텍스트와는 분리 행.
- **잔재 자기검증**: 이전 페어 [페어 2: dev × marketer] 영향 없음 — N — 영속성·이벤트 결정과 UI 시각·시맨틱은 독립.

**T3 — 핵심 충돌 + 숨은 가정**:

- **핵심 충돌**: 빈 상태 카피 책임 = 디자이너 외 영역(N1 기획자 검토 의무) — 카피 검토를 페이즈 5 진입 전 1회(묶음 L 패턴) vs design.md 임시 박고 추후 갱신. 토글 위치 단일 슬롯 결정이 묶음 F(M5·M6 허브 카드 패턴 통일) 후속 라운드와 충돌할지 미검토 — 페이즈 5 slot 명세 정확성 검증 필요.
- **숨은 가정**: 양쪽 모두 "ChecklistHub 진행률 슬롯이 안정 박혀 있다"고 가정 — 사실. 그러나 묶음 F 후속 라운드에서 ChecklistHub 구조 변경 시 본 묶음 토글 위치 충돌 가능성 미검토.

## 4. 미해결 트레이드오프

### 항목 1 — D-day 라벨 매칭 범위 + 카피 (페어 1)

페어 1에서 designer가 매칭 범위를 (가)로 양보(planner §7.7 공포 회피 + 토글로 지난 주차 식별 위임). 사용자 재확인 + 카피 결정 동시.

- [ ] **옵션 A**: "N주 후 권장" — 미선택
- [ ] **옵션 B**: "D-N주" — 미선택
- [x] **옵션 C**: 미래 권장 한정 (`recommendedWeek > currentWeek`), 카피 = "**N주차에 챙기기**" (행동 중심)
  - 즉시 비용: 행동 권유 톤이 친근. "주차"는 임신 주차 컨텍스트(사이트 도메인)에서 자연스럽게 인식.
  - 나중 비용: P2 "이번 주 추천"과 톤 정합 OK.
- [ ] **옵션 D**: 미래+지난 (페어 1 뒤집기) — 미선택
- **결정**: 옵션 C. 미래 권장 한정 + 카피 "N주차에 챙기기". 행동 중심 톤이 임산부 친근 + P2 "이번 주 추천"과 시맨틱 분기 명확. recommendedWeek=0·currentWeek null·과거 라벨 0.

### 항목 2 — D-day 라벨 측정 정의 (페어 2)

페어 2에서 dev가 marketer §3.6 락인 회피에 양보(신규 이벤트 `upcoming_item_view`로 결정 수렴). 사용자 재확인 + `upcoming_item_check` 페어 이벤트 추가 여부 결정.

- [ ] **옵션 A**: view만 신규 — 미선택
- [x] **옵션 B**: `upcoming_item_view` + `upcoming_item_check` 둘 다 신규 추가 (페어 이벤트)
  - 즉시 비용: GA4 카탈로그 +2건. 분석 시 view→check 전환율 + 미래 권장의 행동 영향 직접 측정 가능.
  - 나중 비용: 카탈로그 군더더기. 분석 join 부담 ↑.
- [ ] **옵션 C**: 기존 이벤트 파라미터 추가 — 미선택 (marketer §3.6 위반 회피)
- **결정**: 옵션 B. `upcoming_item_view` + `upcoming_item_check` 페어 신규 이벤트로 view→check 전환율 직접 측정. 측정 락인 회피(§3.6) + 미래 권장 라벨의 행동 영향 측정 가능.

### 항목 3 — 빈 상태 (토글 on + 미체크 0개) 카피 처리 (페어 3)

페어 3에서 designer가 카피를 기획자 영역으로 거부. 본 라운드에서 카피 결정 처리 방식 결정 필요.

- [ ] **옵션 A**: 임시 박고 추후 갱신 — 미선택
- [x] **옵션 B**: 페이즈 5 진입 전 content persona로 카피 검토 1회 — 묶음 L 패턴 동일
  - 즉시 비용: 페이즈 5 진입이 1회 사용자 입력 단계만큼 지연.
  - 나중 비용: 카피가 spec 처음부터 정합, 갱신 PR 누락 위험 0.
- **결정**: 옵션 B. 페이즈 5 진입 전 content persona 검토 1회. 검토 결과 박음 (§5 결정 섹션 참조).

### (참고) 페어 합의 사항 — 결정 영역에서 재확인 가능

다음은 페어에서 양쪽이 합의한 사항. 사용자가 뒤집고 싶으면 §5에 명시.

- **페어 1**: D-day 라벨 매칭 범위 = `recommendedWeek > currentWeek` 미래만 (지난 주차 라벨 도입 X)
- **페어 1**: 라벨 시각 톤 = `text-muted-foreground font-normal` (P2 "이번 주 추천"의 `text-foreground font-medium`보다 약함, 어텐션 위계 "지금 > N주 후")
- **페어 1**: 라벨 아이콘 = lucide `Clock` 또는 `CalendarClock` (P2 CalendarCheck와 시맨틱 분리)
- **페어 2**: `checklist_filter` = `filter_type = "uncheck_only"` 단일 enum, `value = "on"|"off"`, 토글 변경 시 1회 발사
- **페어 2**: 토글 영속성 = 세션 한정(zustand persist X)
- **페어 3**: 토글 위치 = ChecklistPage 진행률 카드 아래, ChecklistHub 첫 항목 위 슬롯
- **페어 3**: 토글 컴포넌트 = shadcn `Switch` + `data-[state=checked]:bg-pastel-lavender`
- **페어 3**: focus-visible ring = `focus-visible:ring-2 focus-visible:ring-pastel-lavender focus-visible:ring-offset-2`
- **페어 3**: 빈 상태 = AllDoneBadge 재활용 X, 신규 인라인 메시지 (시각: `text-sm text-muted-foreground text-center py-6`)

## 5. 결정

**페이즈 4 휴먼 게이트 결정 (사용자 입력, 2026-05-10)**:

- **항목 1 (D-day 라벨 매칭 범위 + 카피)**: **옵션 C — 미래 권장 한정 + 카피 "N주차에 챙기기"**. 매칭 = `recommendedWeek > currentWeek`. recommendedWeek=0·currentWeek null·과거(`recommendedWeek < currentWeek`) 모두 라벨 0. 행동 중심 톤 + P2 "이번 주 추천"과 시맨틱 분기 명확.
- **항목 2 (D-day 라벨 측정 정의)**: **옵션 B — `upcoming_item_view` + `upcoming_item_check` 페어 신규 이벤트 둘 다**. param: `item_id` (string), `weeks_ahead` (integer = recommendedWeek - currentWeek). PII 0. view = ChecklistItemRow 마운트 시 1회. check = 사용자 체크 액션 시 발사. 기존 `recommended_item_view`/`recommended_item_check` 변경 0 (락인 §3.6 정합).
- **항목 3 (빈 상태 카피)**: **옵션 B 검토 결과 = "지금 보이는 항목은 모두 체크했어요"** (content persona §6 친근 + §7.7 공포 0 + §5.5 사이트 톤 정합). AllDoneBadge "모든 항목을 챙기셨어요"와 "지금 보이는" 한 마디로 의미 분리.

**페어 합의 사항 (사용자 뒤집기 없음, 그대로 채택)**:

- 페어 1: 라벨 시각 톤 = `text-muted-foreground font-normal` (P2 `text-foreground font-medium`보다 약함, 어텐션 위계 "지금 > N주차")
- 페어 1: 라벨 아이콘 = lucide `Clock` 또는 `CalendarClock` (P2 CalendarCheck와 시맨틱 분리, 페이즈 7 design.md에서 최종 lucide 1개 확정)
- 페어 2: `checklist_filter` = `filter_type = "uncheck_only"` 단일 enum + `value = "on"|"off"` string + 토글 변경 시 1회 발사 (페이지뷰 자동 발사 X)
- 페어 2: 토글 영속성 = 세션 한정 (zustand persist X, P5 schema versioning deferred 정책 존중)
- 페어 3: 토글 위치 = ChecklistPage 진행률 카드 아래, ChecklistHub 첫 항목 위 슬롯
- 페어 3: 토글 컴포넌트 = shadcn `Switch` + `data-[state=checked]:bg-pastel-lavender`
- 페어 3: focus-visible ring = `focus-visible:ring-2 focus-visible:ring-pastel-lavender focus-visible:ring-offset-2` (묶음 H 정합)
- 페어 3: 빈 상태 = AllDoneBadge 재활용 X, 신규 인라인 메시지 (`text-sm text-muted-foreground text-center py-6`)

## 6. 우선순위 영향

- phase-4.5.md §2.6 UX 기회 1·2 마감. §1.8 묶음 H의 `checklist_filter` 이벤트 정의 일부 흡수.
- P5 localStorage schema versioning(deferred): 토글 상태를 zustand persist에 추가하면 schema 변동. 페어 3에서 다룰 항목 — migrate 핸들러 의무 검토.
- P2 부활 라벨과 통합/별도 결정에 따라 [docs/features/checklist-recommendation-semantics](../checklist-recommendation-semantics/README.md)의 시맨틱 표면이 갱신될 수 있음.
