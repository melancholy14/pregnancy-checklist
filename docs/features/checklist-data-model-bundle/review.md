# checklist-data-model-bundle 리뷰

> 작성일: 2026-06-05
> 상태: draft
> size: L
> 관련 스펙: [spec.md](./spec.md) (생성 예정)
> 출처: [phase-4.5.md §3.1 P1·P5, §2.3 C1](../../plan/phase-4.5.md), [p1-priority-note-edit/review.md](../p1-priority-note-edit/review.md) (P1 단독 가정 컨텍스트)

## 1. 기능 요약

phase-4.5 §3.1 P1 deferred 결정을 묶음으로 해소한다. 3개 항목 통합 결정: (P1) 편집 모드에서 customItems의 priority/note 수정 허용 여부, (§2.3 C1) priority 시각 표현을 색에서 아이콘/약식 텍스트로 다운그레이드, (P5) zustand persist에 schema versioning 인프라 도입. customItems schema 변경이 동반되므로 P5가 P1의 인프라 의무. P2·P6·P7은 phase-4.5에서 이미 별도 처리 완료.

## 2. 적용 페어 + 선택 이유

- **planner × designer**: P1(편집 허용) + §2.3 C1(priority 시각 다운그레이드)의 핵심 충돌. planner §7.5 본질 도구 우선·§7.6 측정 동반 vs designer §3 원칙 5 한 화면 결정 1개·N4 다크 패턴·§2 도메인 컨텍스트. 사용자 자율성·데이터 일관성 vs 폼 단순성·시각 정직성 축.
- **dev × planner**: P5(localStorage schema versioning) 인프라 묶음 도입 시점·범위. dev §6.3 migrate 의무 + §6.6 임의 결정 X vs planner §7.5 본질 도구 + §7.6 측정 동반. 단계적 도입·인프라 분리 vs 본질 도구 가치 보호·측정 동반 축.
- **dev × qa**: schema v0→v1 migrate 함수 + customItems 분기 폭증 = 기존 unit/E2E 영향 분석. dev §6.3 vs qa §3.6 기존 spec 영향 + §7.3 데이터 픽스 + §7.4 안전망 우회. 책임 분담 단순화·기존 패턴 활용 vs 영향 분석 스캔 의무·헬퍼 신설·회귀 가드 다층화 축.

제외한 페어:
- dev × designer — C1 토큰 변경 작업 부담은 작고 시각 다운그레이드 디테일 충돌 약함 (둘 다 동의 가능)
- planner × marketer / designer × marketer — GA4 이벤트 신설은 측정 룰에 모두 동의, 광고 영향 미약
- planner × qa — MVP 범위 충돌은 dev × planner와 중복

## 3. 페어별 충돌

### 3.1 planner × designer

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 페어 시작: planner × designer
- 이전 페어 [없음 — 첫 페어] 의 양보·합의는 이 페어에 영향 없음.
- planner, designer 의 persona.md "양보 거부 / Non-Negotiables" 섹션을 다시 참조함.
  · planner 인용 후보: §7.1 사용자 데이터 무결성, §7.5 체크리스트=본질 도구 우선, §7.6 측정 없는 기능 도입 거부
  · designer 인용 후보: §3 원칙 5 "한 화면 결정 1개", N4 다크 패턴 거부, N7 사용자 데이터 무결성, §2 "신체 변화·민감 시기 — 빨간 경고색·과도한 알림 지양"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**[planner] 단독 입장**

- 잃는 것: 폼 단순함, custom 항목 SoT(`src/data/checklist_items.json`)와 사용자 override 데이터의 경계 명료성, P5 schema versioning 묶음 도입 부담을 P1과 같이 떠안음
- 양보 거부 인용: "**§7.1 사용자 데이터 무결성 — localStorage 스키마 변경은 zustand `persist`의 `migrate` 함수 없이 배포 금지. 항목 ID는 절대 재사용·재배치하지 않는다**" — docs/content/persona.md §7.1. "**§7.5 체크리스트 = 본질 도구 우선**" — §7.5. 사용자가 추가한 custom 항목의 priority·note를 못 바꾸면 본질 도구의 핵심 행동에서 도구 가치가 깎임. "**§7.6 측정 없는 기능 도입 거부**" — §7.6. priority/note 편집 도입 시 `custom_item_priority_set`·`custom_item_note_set` 이벤트 신설 의무.
- 주장:
  - (a) **편집 허용 — custom 항목 한정**. 기본 항목 priority/note override 거부 (§5.1 항목 ID·필드는 운영자 SoT).
  - (b) priority + note 둘 다 편집 허용. 사용자 작성 note는 P7 분류 대상에서 명시 제외.
  - (c) **P5 schema versioning 동시 도입 의무** — customItems에 `priority?`, `note?` optional 필드 추가 = schema 변경이고, 기존 사용자 데이터에 두 필드가 없을 수 있음 → migrate 함수 없이 배포 = §7.1 양보 거부 위반.
  - (d) §2.3 C1과의 묶음 결정은 designer에 양보.
- 잔재 자기검증: 이전 페어 없음 — N

**[designer] 반박 입장**

- A 발언 명시 반박:
  - "custom만 허용"은 N4 다크 패턴 거부와 충돌. 같은 ChecklistItemRow 컴포넌트가 custom과 기본 항목을 둘 다 렌더하는데, 편집 모드에서만 분기되면 "같은 UI인데 어떨 땐 되고 어떨 땐 안 됨" = 가짜 인터랙티브 신호 (N4 변형).
  - planner의 (b) "priority + note 둘 다"는 §3 원칙 5 "한 화면 결정 1개"와 정면 충돌. 모바일 320px 폭에서 편집 모드에 title input + priority 셀렉터 + note textarea 3개 동시 = 인지 부하 폭증.
- 잃는 것: 사용자 자율성 일부 차단, priority 시각 표현(C1)의 의미 가치 (색에서 아이콘으로 다운그레이드 시 priority "감"이 약해짐)
- 양보 거부 인용: "**§3 원칙 5 — 인지 부하 최소화. 한 화면에 결정 1개. 같은 정보 중복 표시 금지**" — docs/design/persona.md §3. "**N4 다크 패턴 거부 — 의도적 시각 위계 왜곡**" — N4. priority 색이 강제되는데 사용자는 못 바꾸면 가짜 인터랙티브. "**§2 도메인 컨텍스트 — 신체 변화·민감 시기. 빨간 경고색·과도한 알림 지양**" — §2 표. "**N7 사용자 데이터 무결성**" — N7. planner §7.1과 동일 정렬.
- 주장:
  - (a) **§2.3 C1 priority 시각 다운그레이드를 P1·P5와 한 묶음 결정**. C1 채택 = priority 색 → 아이콘/약식 텍스트. priority의 시각 강제가 약해지면 "사용자가 priority를 직접 고르는 가치"도 자연스럽게 낮아짐.
  - (b) C1 채택 시 → P1 (a) **편집 미허용**도 자연스럽게 정당화. ChecklistAddForm 신규 항목 추가 시에만 priority 셀렉터 노출 (현재 `medium` 하드코딩 → 셀렉터 또는 default 유지 중 선택).
  - (c) **note 편집은 별도 결정** — priority 결정과 묶지 말 것. §3 원칙 5에 따라 편집 모드에서 title·priority·note 3가지를 동시에 다루지 않는 별도 UI 권장.
  - (d) C1·P1·P5는 한 묶음으로 도입, PR은 C1 → P5 → P1 순으로 분리.
- 잔재 자기검증: 이전 페어 없음 — N

**T3 핵심 충돌 + 숨은 가정**

- 핵심 충돌: **사용자 자율성·custom SoT 보호 + 측정 동반** (planner: custom만 허용 + priority/note 둘 다 + P5 동시) vs **시각 정직성·인지 부하 최소화** (designer: C1 다운그레이드 → 편집 미허용 또는 추가 시에만 + note 별도 결정)
- 숨은 가정: 양쪽 다 "사용자가 priority/note 편집을 실제로 원한다"고 암묵 가정. 운영 데이터 부재 — `custom_item_priority_set`·`custom_item_note_set` 이벤트로 1~2주 사용률 측정 후 결정 옵션이 양쪽 룰 모두와 정합. planner의 "custom 항목과 기본 항목이 사용자 관점에서 구별된다" 가정은 ChecklistItemRow가 둘을 같은 시각으로 렌더하므로 깨질 가능성.

### 3.2 dev × planner

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 페어 시작: dev × planner
- 이전 페어 [planner × designer] 의 양보·합의는 이 페어에 영향 없음.
- dev, planner 의 persona.md "희생 거부 / 양보 거부" 섹션을 다시 참조함.
  · dev 인용 후보: §6.3 localStorage 데이터 무결성, §6.5 안전망 우회, §6.6 임의 결정 X
  · planner 인용 후보: §7.1 데이터 무결성, §7.5 본질 도구 우선, §7.6 측정 없는 기능 도입 거부
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**[dev] 단독 입장**

- 잃는 것: 작업 범위 (P5 인프라 코드 + customItems migrate 함수 + 폼 UI 컨트롤 + GA4 이벤트 2개), 기존 4개 store(useDueDateStore v1 이미 적용, useChecklistStore·useTimelineStore·useWeightStore)의 schema version 부여 횡단 작업
- 희생 거부 인용: "**§6.3 localStorage 사용자 데이터 무결성 — schema 변경 시 항상 migrate 핸들러 또는 명시적 fallback. '키 그냥 바꾸자' 답변 안 함**" — docs/tech/persona.md §6.3. "**§6.5 안전망 우회 — `--no-verify` X, E2E 빨강 무시 X**" — §6.5. P5 versioning 인프라 박지 않고 P1만 출시 시 다음 schema 변경에서 동일 문제 반복. "**§6.6 디자인 시스템·면책 문구·콘텐츠 카피의 임의 결정 X**" — §6.6. §2.3 C1 시각 결정 전에 priority 색을 셀렉터에 노출 = 시각 위계 굳음.
- 주장:
  - **P5 versioning 인프라는 단독 결정 가능 — P1 결정 대기 거부**. P5 인프라 PR 먼저 박고, 그 위에 P1 customItems 스키마 추가. 다른 3개 store도 같이 v1 부여.
  - P5 형태: zustand `persist`의 `migrate` 옵션 + `version` 필드. helper 분리 없이 store 파일 안에 inline migrate (현재 useDueDateStore 패턴 유지).
  - 버전 충돌 시 — **보존 우선**. 정적 사이트 + 백엔드 없음 환경에서 자동 백업 불가능. migrate가 모르는 버전을 만나면 fallback to default + 콘솔 경고 (UX 알림 X — 도구 가치 깎임).
  - (c) note 편집 도입은 P7 결정 후로 미룸 — 페어 ① planner 주장에 반대.
  - (d) **P5 + §2.3 C1 + P1 한 묶음 도입 의무** — designer 페어 ① 주장 인정. PR은 분리 가능, 도입 시점은 같이.
- 잔재 자기검증: 이전 페어 [planner × designer] 영향 없음 — N — 페어 ①은 P1 (a) 편집 허용 + (b) custom vs 기본 범위 축, 이번 페어는 P5 인프라 단독 도입 가능 여부 + (c) note 도입 시점 축으로 발화 동기 분리.

**[planner] 반박 입장**

- A 발언 명시 반박:
  - dev의 "P5 단독 인프라 PR 우선"은 §7.6 측정 없는 기능 도입 거부와 정렬 안 됨. P5는 사용자 가치가 직접 보이지 않는 인프라 — `schema_migration_run` 같은 이벤트로 가치 입증 의무. P5 단독 PR도 이벤트 동반 필수.
  - dev의 "note 편집은 P7 후로 미룸"은 §7.5 본질 도구 우선 위반 가능성. 사용자가 추가한 항목의 note가 영원히 못 바뀌면 본질 도구의 핵심 가치 훼손. customItems의 note는 사용자 자유 작성 string — 운영자 데이터(P7 분류 대상)와 다름.
  - dev의 "버전 충돌 시 fallback to default + 콘솔 경고"는 §7.1 사용자 데이터 무결성 정신 위반 가능 — silent corruption. 토스트 + 명시적 알림 필요.
- 잃는 것: 구현 부담 (폼 UI 컨트롤 +1, store update path +1, GA4 이벤트 2개 동반 의무), P7 향후 분리 시 "사용자 작성 note는 분류 안 함" 룰을 §5.1 콘텐츠 운영 룰에 명시 박아야 함
- 양보 거부 인용: "**§7.5 체크리스트 = 본질 도구 우선**" — docs/content/persona.md §7.5. "**§7.6 측정 없는 기능 도입 거부**" — §7.6. P5 단독 PR이라도 `schema_migration_run` 이벤트 신설 의무. "**§7.1 사용자 데이터 무결성**" — §7.1. dev §6.3과 동일 정렬, 단 silent fallback은 §7.1 정신 위반.
- 주장:
  - **P5 + P1 묶음 도입** (dev "P5 단독" 반대). 인프라만 박고 사용자 가치를 다음 PR로 미루면 §7.6 위반.
  - (c) priority + note 둘 다 편집 허용 — 사용자 작성 note는 P7 분류 대상에서 명시 제외 (P7은 운영자 노트 한정). §5.1 콘텐츠 운영 룰에 명문화 의무.
  - 버전 충돌 시 — **보존 우선 + 사용자 알림**. migrate 실패 시 sonner toast "체크리스트 데이터 복구 중 일부 항목이 초기화됐어요" 안내. 동시에 `schema_migration_run`·`schema_migration_failed` 이벤트 발사.
  - (d) P5 + §2.3 C1 + P1 한 묶음 — dev 의견 인정. GA4 이벤트는 묶음 도입 PR 안에 동반 필수.
- 잔재 자기검증: 이전 페어 [planner × designer] 영향 없음 — N — 페어 ①에서 designer가 양보 거부한 §3 원칙 5(한 화면 결정 1개)와 이번 발언의 "priority + note 둘 다"는 직접 충돌이지만, 이번 페어의 발화 동기는 §7.5 본질 도구 가치 보호 vs §6.3 기술부채 회피 축이고 designer 입장은 페어 ①에서 처리된 별도 결정. 잔재 아님.

**T3 핵심 충돌 + 숨은 가정**

- 핵심 충돌: **단계적 도입·인프라 분리** (dev: P5 단독 PR 우선, note는 P7 후, 버전 충돌 시 silent fallback) vs **본질 도구 가치 보호·측정 동반·사용자 알림** (planner: P5+P1 묶음, priority+note 둘 다, 버전 충돌 시 toast)
- 숨은 가정: 양쪽 다 "P5 인프라가 customItems 외 다른 store 변경에도 곧 필요하다"고 가정. P5를 P1 한 번만 위해 도입하면 dev의 "단독 PR" 논리가 약해짐. planner의 "사용자 note는 자유 텍스트"가 향후 안 깨질지 검증 안 됨. 버전 충돌 빈도가 양쪽 다 "거의 안 일어남" 전제 — 자주 일어나면 silent corruption 위험 폭증.

### 3.3 dev × qa

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 페어 시작: dev × qa
- 이전 페어 [dev × planner] 의 양보·합의는 이 페어에 영향 없음.
- dev, qa 의 persona.md "희생 거부 / 양보 거부" 섹션을 다시 참조함.
  · dev 인용 후보: §6.3 localStorage 데이터 무결성, §6.5 안전망 우회
  · qa 인용 후보: §3.5 시간 의존성·today 주입, §3.6 기존 테스트 영향 분석, §7.3 테스트 데이터·시간 픽스, §7.4 안전망 우회
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**[dev] 단독 입장**

- 잃는 것: migrate 함수 testable 설계 의무 (기존 데이터 fixture), customItems schema v1 이후 v2·v3 변경 시 누적 migrate 체인 유지 부담, 기존 4개 store의 schema version 부여 시 각 store별 unit test 추가 부담
- 희생 거부 인용: "**§6.3 localStorage 사용자 데이터 무결성**" — docs/tech/persona.md §6.3. migrate 함수는 사용자 데이터 무결성의 최후 방어선이므로 unit test 의무. "**§6.5 안전망 우회 — E2E 빨강 무시 X**" — §6.5. 기존 E2E spec이 customItems 시드 패턴을 가정한다면 schema 변경 시 시드 코드 갱신 의무.
- 주장:
  - **migrate 함수는 unit으로 격리** — `(persistedState: unknown, version: number) => CurrentState` 시그니처는 pure function이라 mock 0개로 테스트 가능. `it.each`로 v0→v1 매트릭스.
  - **E2E 시드 코드 갱신은 신규 PR에서 함께** — `e2e/helpers/seedStorage.ts` 같은 헬퍼가 있다면 그 헬퍼만 업데이트. 없으면 inline seed 갱신.
  - **fs-level grep 가드 추가** — §2.3 C1 priority 색 토큰 다운그레이드 회귀 가드 ("기존 priority 색 토큰 사용 0건"). `design-bundle-cleanup-round.spec.ts (3)` 패턴 답습.
  - customItems 시드 패턴 가정하는 기존 spec 식별 책임 = qa (qa §3.6). dev는 변경 모듈 경로만 spec.md "기능 요구사항"에 제공.
- 잔재 자기검증: 이전 페어 [dev × planner] 영향 없음 — N — 페어 ②는 P5 인프라 단독 도입 가능 여부 + GA4 동반 의무 + 버전 충돌 UX 축, 이번 페어는 migrate 함수 testability + 기존 spec 영향 분석 + 회귀 가드 축으로 발화 동기 분리.

**[qa] 반박 입장**

- A 발언 명시 반박:
  - dev의 "migrate 함수는 unit으로 격리"는 정상이지만, §3.6 기존 테스트 영향 분석을 dev에 떠넘기지 말 것. QA가 식별 책임을 가지나 dev가 변경 모듈 경로를 spec.md "기능 요구사항"에 명시해야 §3.6 스캔이 작동.
  - dev의 "E2E 시드 헬퍼만 업데이트"는 helper가 없으면 깨진다. 현재 inline seed가 산재할 가능성을 dev가 확인 안 함.
  - dev의 "fs-level grep 가드 추가"는 OK이지만 §7.4 안전망 우회와 정렬해 기존 가드 약화 안 할 것 확인 필요.
- 잃는 것: 기존 E2E spec 갱신 작업량 (현재 customItems 의존 spec 개수 미식별 상태), migrate 함수 unit test 범위 + 사용자 알림 toast E2E 시나리오
- 양보 거부 인용: "**§3.6 기존 테스트 영향 분석 — 신규 테스트 작성보다 기존 테스트 영향 식별이 먼저. feature-plan Phase 8-A 의 스캔 절차가 이를 강제**" — docs/qa/persona.md §3.6. "**§7.3 테스트 데이터·시간 픽스 — `src/data/*.json` 실제 데이터를 테스트용 fake로 갈아끼우지 않음**" — §7.3. "**§7.4 안전망 우회 — fs-level grep 가드는 다른 테스트가 못 잡는 회귀를 막는다. 절대 삭제 X**" — §7.4.
- 주장:
  - §1 영향 분석을 spec.md "기능 요구사항" 작성과 동시에. dev 책임은 "어디를 건드리나" 명시, QA 책임은 "어떤 기존 테스트가 깨지나" 식별.
  - migrate 함수 unit 시나리오: v0 (priority·note 없음) → v1 (optional 추가) happy path / 미지의 v999 → 페어 ② 결정 따름 (silent vs toast) / 손상된 JSON → fallback. `it.each` 매트릭스.
  - **E2E 시드 헬퍼 신설을 묶음에 포함** — 현재 inline seed가 박혀 있다면 헬퍼 도입이 회귀 위험을 줄임. dev 작업 범위.
  - 버전 충돌 toast (페어 ② planner 주장 채택 시) → E2E 시나리오 추가 (시드된 미지 버전 → 페이지 로드 → toast 노출).
  - §2.3 C1 회귀 가드 — 기존 priority 색 토큰 사용처 0건 grep 가드 신설.
  - GA4 이벤트 검증 — `custom_item_priority_set`·`custom_item_note_set`·`schema_migration_run` 발사 검증.
- 잔재 자기검증: 이전 페어 [dev × planner] 영향 없음 — N — 페어 ② planner "버전 충돌 시 toast" 결정은 이번 페어의 E2E 시나리오 입력값으로만 사용. 어느 쪽 결정이 채택돼도 이번 페어 입장 (영향 분석 + 헬퍼 신설 + 회귀 가드)는 동일.

**T3 핵심 충돌 + 숨은 가정**

- 핵심 충돌: **책임 분담 단순화·기존 패턴 활용** (dev: migrate는 unit, 시드 헬퍼만 업데이트, 가드 추가만) vs **영향 분석 스캔 의무·헬퍼 신설·회귀 가드 다층화** (qa: spec.md 변경 모듈 명시 → §1 스캔, E2E 시드 헬퍼 신설, C1 시각 회귀 가드 + GA4 발사 검증)
- 숨은 가정: 양쪽 다 "현재 `e2e/` 폴더에 customItems 시드 패턴이 어떻게 박혀 있는지" 모르는 상태로 발언. 페이즈 8-A 스캔 결과가 결정. dev는 "fs-level grep 가드가 자동으로 잘 작동"한다고 가정 — 새 가드와 기존 가드의 충돌 가능성도 같이 검증해야 함.

## 4. 미해결 트레이드오프

### 4.1 §2.3 C1 priority 시각 표현 다운그레이드 채택 여부

페어 ① T3의 핵심 충돌 압축 — 이 항목이 4.2~4.4의 전제. 가장 먼저 결정.

- [ ] **결정**:
  - 옵션 A: **채택** — priority 색 강조(현재 pink/destructive-tinted) → 아이콘(예: lucide ChevronUp·Minus·ChevronDown) 또는 약식 텍스트("높음/보통/낮음" small muted)로 다운그레이드
    - 즉시 비용: DESIGN.md priority 토큰 절 갱신, `ChecklistItemRow` priority 표시 부분 + 우선순위 배지 자리 재디자인, 기존 priority 색 사용처 0건 회귀 가드 신설 (qa §7.4)
    - 나중 비용: priority의 시각 강제 약화 → 사용자가 priority를 직접 고르는 가치도 자연스럽게 낮아짐 (4.2 미허용을 자연스럽게 정당화). designer §2 도메인 컨텍스트 정렬 (빨간 경고색 지양)
  - 옵션 B: **현 상태 유지** — priority 색 그대로
    - 즉시 비용: 0 (작업 없음)
    - 나중 비용: 4.2에서 미허용 선택 시 "색은 강조되는데 사용자는 못 바꿈" 가짜 인터랙티브 잔존 (designer N4 변형 우려). 4.2에서 허용 선택 시 톤 과잉 (designer §2 우려) + 사용자가 priority 색을 직접 만지는 부담
- **결정:** B

### 4.2 편집 모드에서 priority/note 수정 허용 여부 (P1)

페어 ① T3·페어 ② T3 종합. 4.1 결정에 종속될 수 있음.

- [ ] **결정**:
  - 옵션 A: **둘 다 허용** — priority 셀렉터 + note textarea 모두 편집 모드에 노출
    - 즉시 비용: ChecklistItemRow 편집 모드 UI 변경(input + select + textarea), ChecklistAddForm priority/note 입력 추가, GA4 이벤트 2개(`custom_item_priority_set`·`custom_item_note_set`) 신설, 4.3 적용 범위 동시 결정 의무
    - 나중 비용: designer §3 원칙 5 위반 ("한 화면 결정 3개" — title·priority·note). 4.1에서 C1 채택 안 하면 N4 변형 우려
  - 옵션 B: **priority만 허용, note는 별도 결정** — note 편집은 P7 결정 후로 분리
    - 즉시 비용: 폼 UI 컨트롤 +1, GA4 이벤트 1개(`custom_item_priority_set`)
    - 나중 비용: 사용자 추가 항목의 note 오타 수정 불가 — planner §7.5 본질 도구 가치 훼손 가능성
  - 옵션 C: **미허용** — 편집 모드는 title만 (현 상태 유지), 신규 추가 시 ChecklistAddForm에서만 priority 선택
    - 즉시 비용: ChecklistAddForm priority 셀렉터 추가만 (현재 medium 하드코딩 → 셀렉터). 폼 변경 최소
    - 나중 비용: "추가는 되는데 편집은 안 됨" 비대칭. designer 페어 ① (a) 정렬, planner §7.5 가치 훼손
  - 옵션 D: **측정 먼저** — 4.1·4.3·4.4 결정 보류, 신규 추가 시에만 priority 셀렉터 + `custom_item_priority_set` 이벤트로 1~2주 사용률 측정 후 4.2 재결정
    - 즉시 비용: ChecklistAddForm priority 셀렉터 + GA4 이벤트 1개. 다른 결정 모두 보류
    - 나중 비용: 의사결정 1~2주 지연. P5 인프라 도입도 지연 → 다른 schema 변경 트리거 시 다시 부담
- **결정:** A

### 4.3 적용 범위 (4.2 = A 또는 B 선택 시)

4.2 = C·D면 이 항목 결정 불요 (skip).

- [ ] **결정**:
  - 옵션 A: **custom 항목만** — 기본 항목 priority/note 편집 불가 (운영자 SoT 보호)
    - 즉시 비용: 폼 분기 단순. ChecklistItemRow에 `if (item.isCustom) editable` 분기 추가
    - 나중 비용: 사용자가 폼에서 비대칭 인지("custom은 되는데 기본은 안 됨") — designer N4 변형. 카피로 보완 필요 (편집 버튼이 custom 항목에만 노출되거나 disabled 명시)
  - 옵션 B: **custom + 기본 항목 override 레이어** — 기본 항목 priority/note override 신규 store 키 도입
    - 즉시 비용: store에 `overrides: Record<string, Partial<ChecklistItem>>` 신규 키, 운영자가 기본 항목 priority 변경 시 override가 막아야 할지 갱신해야 할지 룰 결정 의무
    - 나중 비용: 운영자 데이터 변경(P10 ID 변경 룰)과 사용자 override의 dangling reference 처리 부채. planner §7.1 "항목 ID 절대 재사용·재배치하지 않는다" 룰과 충돌 가능성
- **결정:** A

### 4.4 묶음 도입 vs 단계적 도입 (P5 시점)

페어 ② T3 압축.

- [ ] **결정**:
  - 옵션 A: **P5 + §2.3 C1 + P1 한 묶음 도입** (designer·dev 페어 ① (d) 합치 의견)
    - 즉시 비용: 작업 범위 가장 큼 — P5 schema versioning 인프라 + C1 시각 다운그레이드 + P1 폼 노출 + GA4 이벤트 2~3개. PR은 분리 가능 (C1 → P5 → P1 순)
    - 나중 비용: 부채 0. 향후 store schema 변경 트리거 시 인프라 활용
  - 옵션 B: **P5 단독 인프라 PR 먼저, P1·C1 다음 PR** (dev 페어 ② 주장)
    - 즉시 비용: P5 인프라(4개 store v1 부여 + migrate 함수) + `schema_migration_run` 이벤트. UI 변경 0
    - 나중 비용: 두 PR로 나뉘어 작업 시간 분산, planner §7.6 측정 동반 룰 충족 (이벤트 동반). dev §6.6 임의 결정 X 룰 충족 (C1 시각 결정 전 priority 셀렉터 노출 안 함)
  - 옵션 C: **P1만 단독 도입, P5·C1은 후속**
    - 즉시 비용: 가장 작음, P1 단독 PR
    - 나중 비용: customItems 스키마 변경이 migrate 함수 없이 배포 — dev §6.3·planner §7.1 양쪽 양보 거부 위반. **사실상 채택 불가 옵션** (참고용으로만 명시).
- **결정:** A

### 4.5 버전 충돌 시 사용자 UX

페어 ② T3 압축. P5 인프라 도입 결정 시 동반 결정.

- [ ] **결정**:
  - 옵션 A: **보존 우선 + silent fallback** — migrate가 모르는 버전 만나면 default state로 fallback, 콘솔 경고만 (UX 알림 X)
    - 즉시 비용: migrate 함수 코드 단순. UI 변경 0
    - 나중 비용: silent corruption 위험 — 사용자가 데이터 손실을 모름. planner §7.1 정신 위반 가능성
  - 옵션 B: **보존 우선 + toast 알림** — sonner toast로 "체크리스트 데이터 복구 중 일부 항목이 초기화됐어요" 안내 + `schema_migration_failed` 이벤트 발사
    - 즉시 비용: migrate 함수 + toast 트리거 + GA4 이벤트 1개. E2E 시나리오 추가 (qa 페어 ③)
    - 나중 비용: 부채 0. 사용자에게 명시적 신호 → 신뢰 보존
  - 옵션 C: **보존 + 사용자 확정 대기** — migrate 실패 시 modal로 "데이터를 초기화할까요? / 그대로 시도할까요?" 선택
    - 즉시 비용: modal UI 신규, migrate 흐름 분기, hydration 타이밍 복잡도 폭증
    - 나중 비용: 거의 발생 안 하는 케이스에 UI 자원 과투자. 임산부 사용자에게 "데이터 손상" 신호 = 불안 자극 (planner §7.7 공포 마케팅 거부와 무관하지만 톤 무거움)
- **결정:** B

### 4.6 priority/note 편집 UI 패턴 (4.2 = A 또는 B 선택 시)

페어 ① T3·designer (c) 압축. 4.2 결정에 종속.

- [ ] **결정**:
  - 옵션 A: **편집 모드 진입 시 title + priority + note 모두 한 폼** (planner 페어 ① (b) 정렬)
    - 즉시 비용: 폼 컴포넌트 단일. 모바일 320px에서 input + select + textarea 세로 스택
    - 나중 비용: designer §3 원칙 5 "한 화면 결정 1개" 위반. 인지 부하
  - 옵션 B: **편집 모드는 title만, "메모 편집"·"우선순위 변경"은 별도 칩/액션** (designer 페어 ① (c) 정렬)
    - 즉시 비용: 칩 UI 신규, 칩 클릭 시 별도 sheet 또는 inline 입력 영역
    - 나중 비용: 사용자 액션 횟수 증가 ("편집" → "메모" → 저장 = 3탭). designer §N8 사용자 시간 도둑질 회색지대
  - 옵션 C: **편집 모드는 title + priority(셀렉터), note는 별도 칩** (절충안)
    - 즉시 비용: priority는 inline 셀렉터, note는 별도 칩 → sheet
    - 나중 비용: 두 패턴 혼재 — UI 컨벤션 학습 비용
- **결정:** A

### 4.7 E2E 시드 헬퍼 신설 여부

페어 ③ T3 압축. 페이즈 8-A 스캔 결과로 일부 확정 가능하지만, dev/qa 합의가 필요.

- [ ] **결정**:
  - 옵션 A: **`e2e/helpers/seedStorage.ts` 신설을 묶음 PR에 포함** (qa 주장)
    - 즉시 비용: 헬퍼 1개 신규, 기존 customItems 시드 박힌 spec 일괄 이관 (페이즈 8-A 스캔으로 개수 확정)
    - 나중 비용: 다음 schema 변경 시 헬퍼 1곳만 갱신 → 회귀 위험 감소
  - 옵션 B: **기존 inline seed 유지, 영향 받는 spec만 갱신** (dev 주장)
    - 즉시 비용: 영향 spec 개별 갱신 (페이즈 8-A 스캔 결과 따름)
    - 나중 비용: 다음 schema 변경 시 다시 산재 갱신 부담
  - 옵션 C: **페이즈 8-A 스캔 후 결정** — 영향 spec ≥3개면 옵션 A, 1~2개면 옵션 B
    - 즉시 비용: 0 (스캔 후 결정)
    - 나중 비용: spec.md 작성 직후 페이즈 8-A 스캔 결과 보고 후 운영자 추가 결정 1회
- **결정:** A

## 5. 결정

> 페이즈 4 휴먼 게이트 (2026-06-05) 사용자 결정 완료.

- 4.1 §2.3 C1 priority 시각 다운그레이드: **B** — 현 상태 유지 (priority 색 강조 그대로)
- 4.2 편집 허용 여부 (P1): **A** — priority + note 둘 다 허용
- 4.3 적용 범위: **A** — custom 항목만 (운영자 SoT 보호)
- 4.4 묶음 도입 vs 단계적: **A** — 한 묶음 도입. 4.1=B이므로 실질 묶음 = **P5 + P1** (C1 빠짐). PR은 분리 가능 (P5 인프라 → P1 폼 노출 순)
- 4.5 버전 충돌 시 UX: **B** — 보존 우선 + sonner toast 알림 + `schema_migration_failed` 이벤트 발사
- 4.6 편집 UI 패턴: **A** — 편집 모드 진입 시 title + priority + note 모두 한 폼
- 4.7 E2E 시드 헬퍼: **A** — `e2e/helpers/seedStorage.ts` 신설 + 기존 customItems 시드 박힌 spec 일괄 이관

### 잔존 디자인 우려 (의식적 감수)

운영자가 명시적으로 채택한 결정 조합에서 다음 페어 ① designer 우려가 잔존함. 구현 시 카피·시각으로 완화 가능 범위 내에서 처리:

- **designer §3 원칙 5 "한 화면 결정 1개" 위반** — 4.2=A + 4.6=A 결합으로 편집 모드에 title·priority·note 3개 동시. 모바일 320px 폭 인지 부하 폭증 인정. 완화: 라벨·여백 최소화, 셀렉터·textarea 자리 차지 최소화.
- **designer N4 변형 가짜 인터랙티브 우려** — 4.1=B + 4.3=A 결합으로 priority 색이 강조되는데 기본 항목 사용자는 못 바꿈. 완화: ChecklistItemRow에서 기본 항목 편집 버튼 자체를 노출 안 함 (custom 항목에만 편집 진입 가능) → "편집 가능한 항목만 편집 버튼 보임"으로 비대칭 신호 자체를 차단.

## 6. 우선순위 영향

- **phase-4.5 P1 deferred 해소** — 본 결정으로 [phase-4.5.md §3.1 P1](../../plan/phase-4.5.md) deferred 상태 종료. [features/p1-priority-note-edit/meta.md](../p1-priority-note-edit/meta.md) status=deferred → archived 처리 가능.
- **P5 localStorage schema versioning** — 4.4=A·B 선택 시 4개 store 횡단 도입. 이후 phase-5 통합 검색·"공유된 체크 상태 복원" 등 schema 변경 트리거 시 인프라 활용.
- **§2.3 C1 priority 배지 5-pastel role** — 4.1=A 선택 시 DESIGN.md priority 토큰 절 갱신, [phase-4.5.md §2.3 C1](../../plan/phase-4.5.md) 종료.
- **P7 note_type 분류** — 4.2=A 선택 시 "사용자 작성 note는 분류 제외" 룰을 [docs/content/persona.md §5.1](../../content/persona.md)에 명시 추가 의무. 4.2=B·C·D면 P7 결정에 종속되지 않음.
- **§1.5 GA4 이벤트 카탈로그** — 4.2=A 또는 D 선택 시 `custom_item_priority_set` / `custom_item_note_set` / `schema_migration_run` / `schema_migration_failed` 신설 (4.5=B 채택 시 후자 포함).
- **P10 운영자 가이드** — 4.3=B 선택 시 "기본 항목 priority 변경 시 사용자 override 갱신 룰" 명시. P10 deferred 잔여와 묶음 가능.
- **다른 3개 store(useChecklistStore·useTimelineStore·useWeightStore)** — 4.4=A·B 선택 시 v1 부여 횡단 작업. 변경 모듈 경로는 spec.md "기능 요구사항"에 명시 (페어 ③ 합의).
