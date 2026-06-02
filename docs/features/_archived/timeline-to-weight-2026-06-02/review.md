# timeline-to-weight 리뷰

> 작성일: 2026-05-31
> 상태: decided (페이즈 4 휴먼 게이트 통과 2026-05-31)
> size: L
> 관련 스펙: [spec.md](./spec.md) (생성 후)
> phase-4.6 §2 타임라인 흡수 (T1=A 확정 — 체중관리로 흡수, 2026-05-26 결정 라운드)

## 1. 기능 요약

phase-4.6 §2 타임라인 흡수 — `/timeline` 라우트 폐기 후 `useTimelineStore`·`timeline_items.json`·timeline 컴포넌트·GA4 `timeline_*` 이벤트를 `/weight` 화면 / 흡수처 store / `weight_*` namespace 로 마이그레이션. zustand `persist.migrate` 함수 + `timeline-migrate.spec.ts` 신규 E2E 가 phase-4.6 §7.1·§8.4 양보 거부 항목으로 의무.

## 2. 적용 페어 + 선택 이유

- **dev × qa** (도메인 계산·시간 의존 함수·store schema): `useTimelineStore.migrate` testability + 주차 계산 today 주입 가능성. phase-4.6 §7.1 양보 거부 직결.
- **dev × marketer** (이벤트성·실험성): `timeline_*` deprecated 4주 grace vs 즉시 cutover. marketer §3.6 측정 락인 vs dev §6.3 schema clean cut. ga4.md §7 변경 정책 직결.
- **planner × designer** (스펙 명확성 vs 사용자 흐름): `/weight` 흡수 후 정보 위계. planner §7.5 체크리스트=본질 + §3.2 도구 정체성 vs designer §3.5 인지부하 최소화 + N7 사용자 데이터 무결성.

탈락한 페어: `qa × planner` (dev × qa 안에서 흡수), `dev × planner` (일정 슬립이 phase 문서에 이미 반영), `planner × marketer` (V1=A 확정 후 영상 출시 시점 충돌 사라짐).

## 3. 페어별 충돌

### 3.1 페어 1: dev × qa

```
🆕 페어 시작: dev × qa
- 이전 페어 [없음] 의 양보·합의는 이 페어에 영향 없음.
- dev 인용 후보: §6.3 "schema 변경 시 항상 migrate 핸들러 또는 명시적 fallback"
- qa 인용 후보: §3.5 "today 주입받아야 unit 가능", §7.4 "fs-level grep 가드 절대 삭제 X"
```

**[dev] 단독 입장**
- 잃는 것: zustand `persist.migrate` 를 store 안 inline 으로 처리하면 schema migration 핵심 분기(v0 형태 누락 / 항목 ID 없음 / 부분 누락)를 unit test 로 못 잡음. 모든 검증이 E2E 페이지 로드 후로 밀림.
- 희생 거부 인용: "schema 변경 시 항상 migrate 핸들러 또는 명시적 fallback. '키 그냥 바꾸자' 답변 안 함." — docs/tech/persona.md §6.3
- 주장: zustand `persist.migrate` 를 store 옵션 안 inline 으로. 양보 가능 §7 "완벽한 추상화 — 중복 두 번까지는 인라인 OK, 세 번째 등장 시 추출" 룰 적용. migration 은 1회성이라 추출 안 함. E2E `timeline-migrate.spec.ts` 1개로 검증 충분.
- 잔재 자기검증: 이전 페어 없음 — N

**[qa] 반박 입장**
- dev 발언 반박: "1회성이라 추출 안 함" 은 qa §3.6 "기존 테스트 영향 식별이 먼저" 와 충돌. zustand `partialize` schema 변경은 자동 §1.2 점검 대상. schema migration 의 분기 4~6개(빈 state / 부분 누락 / 항목 ID 충돌 / undefined dueDate)를 E2E 1개로 검증하면 회귀 알람이 둔해짐 — "CI 1초 안에 → unit" 룰 위반.
- 잃는 것: migration 로직을 별도 함수 `migrateTimelineToWeight(v0State): v1State` 로 추출하면 zustand persist API 의 자연스러운 사용 패턴에서 벗어남. store 옵션의 `migrate` 가 일급 시민에서 utility wrapper 로 강등.
- 희생 거부 인용: "`new Date()`를 그대로 쓰는 함수는 testable 설계 위반. 함수가 `today: Date = new Date()` 형태로 주입받아야 unit 가능. (…) 임의로 mock 하지 않음." — docs/qa/persona.md §3.5
- 주장: migration 로직을 `src/store/migrations/timeline-to-weight.ts` 별도 pure 함수로 추출 + unit test 4~6 케이스. E2E `timeline-migrate.spec.ts` 는 사용자 흐름 1개만. zustand store 옵션에서는 `migrate: (s, v) => migrateTimelineToWeight(s, v)` 한 줄로 위임.
- 잔재 자기검증: 이전 페어 없음 — N

**T3 — 핵심 충돌 + 숨은 가정**
- 핵심 충돌: zustand `persist.migrate` 를 store inline 으로 짤지 vs 별도 pure 함수 + unit test 4~6 case 로 추출할지. 후자는 testability ↑·phase-4.6 §7.1 정합, 코드 위치 분산·initial setup 1~2h ↑.
- 숨은 가정: `useTimelineStore` 의 주차 계산이 이미 today 주입을 받는다고 양쪽 다 가정. 안 받으면 흡수 작업 + `week-calculator` 리팩토링이 모두 selected — 작업량 산정 빗나감.

### 3.2 페어 2: dev × marketer

```
🆕 페어 시작: dev × marketer
- 이전 페어 [dev × qa] 의 양보·합의는 이 페어에 영향 없음.
- dev 인용 후보: §3.5 "한 커밋에 한 가지 의도", §7 양보 가능 (일정·범위)
- marketer 인용 후보: §3.6 "신규는 추가만, 변경은 신/구 병행 발사 4주 grace period"
```

**[dev] 단독 입장**
- 잃는 것: 4주 grace 동안 `timeline_*` 와 `weight_*` 양쪽 dual-fire 시 호출부에 두 줄 박힘. 4주 후 timeline_* 제거 PR 별도 — 1 PR 마이그레이션 + 1 PR cleanup = 2 PR.
- 인용 (희생 거부 아님, 작업 원칙): "한 커밋에 한 가지 의도. 리팩토링과 기능 추가 분리." — docs/tech/persona.md §3.5
- 주장: 즉시 cutover. `timeline_*` 발사 코드 제거하면서 `weight_*` 만 박음. phase-4.6 §1 V1=A 영상 자산이 자체 폐기로 자연 0건 발사라 이미 cutover — namespace 마이그레이션도 같은 패턴.
- 잔재 자기검증: 이전 페어 [dev × qa] 영향 없음 — N — testability 추출 결정은 코드 위치 축, GA4 cutover 는 측정 연속성 축, 독립적

**[marketer] 반박 입장**
- dev 발언 반박: "V1=A 가 즉시 cutover 라 일관성 ↑" 는 phase-4.6 §1 의 실제 처리를 잘못 읽음. ga4.md §3.C/§3.E/§6.3 가 `content_click(type=video)` 를 "deprecated 마킹 (4주 grace 후 spec 삭제)" 로 처리했고, 발사 0건은 영상 자산 자체가 폐기되어 발생한 결과 — namespace cutover 패턴이 아님. timeline 은 데이터·이벤트·UI 가 흡수처로 살아남으므로 사례가 다름.
- 잃는 것: 4주 grace 동안 dual-fire 시 funnel 보고서에서 double-count 위험. axis_enter / weight_week_view baseline 가 4주 동안 흐려짐. user_property 보조 분석에서 cohort 비교 시 noise floor 위로 시그널 끌어올리기 어려움 — 운영자가 결정 라운드(2026-05-26)에서 직접 겪은 표본 한계와 같은 종류 문제.
- 희생 거부 인용: "신규는 추가만, 변경은 신/구 병행 발사 **4주 grace period**, 삭제는 사실상 금지. (…) 과거 데이터 단절 = 의사결정 능력의 영구 손실." — docs/marketing/persona.md §3.6
- 주장: 4주 grace 신/구 병행 발사. `weight_week_view` 즉시 발사, `timeline_week_view` 는 ga4.md 에 deprecated 마킹 + 발사 유지, 4주 후 timeline_* 제거 PR. double-count 회피는 ga4.md §7 변경 정책에 "weight_* primary, timeline_* deprecated grace" 명시.
- 잔재 자기검증: 이전 페어 [dev × qa] 영향 없음 — N — store migration testability 결정은 GA4 namespace cutover 와 독립 축

**T3 — 핵심 충돌 + 숨은 가정**
- 핵심 충돌: timeline_* → weight_* GA4 namespace 마이그레이션을 즉시 cutover 할지 vs 4주 grace 신/구 병행 발사 후 cutover 할지. 후자는 측정 연속성 ↑·marketer §3.6 정합, 코드 dual-fire 4주 부담 + double-count 회피 보고서 룰 의무.
- 숨은 가정: 양쪽 다 timeline_* 호출 지점이 src/components/timeline/ 안 한정으로 ~3~5 개라고 가정. 흡수 작업으로 timeline 컴포넌트가 weight/ 로 이동·통합되면 호출 지점이 늘어날 수도 있음.

### 3.3 페어 3: planner × designer

```
🆕 페어 시작: planner × designer
- 이전 페어 [dev × marketer] 의 양보·합의는 이 페어에 영향 없음.
- planner 인용 후보: §7.5 "체크리스트 = 본질 도구 우선", §3.2 "체크리스트로 가는 흐름"
- designer 인용 후보: §3.5 "인지 부하 최소화 — 한 화면에 결정 1개", §3 N7 "사용자 데이터 무결성"
```

**[planner] 단독 입장**
- 잃는 것: 흡수 후 /weight 화면이 "체중 입력 도구"의 단일 정체성에서 벗어남. timeline 컨텍스트(현재 주차·D-day·이번 주 권장 체중·이번 주 할 일) 4블록 + 체중 입력·그래프 행동 영역 = 한 화면 5블록 부담.
- 희생 거부 인용: "콘텐츠가 늘어도 사용자 흐름은 **유입(SEO) → 콘텐츠 → 체크리스트**로 흘러야 한다. 체크리스트와 분리된 콘텐츠 페이지 양산 거부. (…) 우선순위가 뒤집히면 '위젯이 붙은 블로그'로 분류된다." — docs/content/persona.md §7.5
- 주장: /weight 흡수 후에도 단일 행동축 보존 — 체중 입력·그래프가 핵심, timeline 컨텍스트는 화면 상단 정적 표시(주차 + D-day + 이번 주 권장 체중)만. "이번 주 할 일" 은 별도 블록 X, `/checklist` 로 가는 1줄 CTA(`이번 주 해야 할 일 12개 →`) 로 다운그레이드. phase-4.6 §3.2 H1 "체중 카드 안 '이번 주 권장량/체중'" 표현 그대로.
- 잔재 자기검증: 이전 페어 [dev × marketer] 영향 없음 — N — GA4 namespace cutover 는 측정 축, /weight 화면 정보 위계는 UX 축, 독립적

**[designer] 반박 입장**
- planner 발언 반박: "정적 표시 + CTA 1줄" 은 §3.5 "한 화면 결정 1개" 와 정합이지만, 동시에 주장하는 "체크리스트 흐름 CTA 박음" 은 두 번째 결정(체중 입력 + 체크리스트 진입)을 끼움. 또 흡수된 timeline_items.json 항목들이 "1줄 CTA" 로 압축되면 §3 N7 "기존 데이터 보존" 룰에 silent 폐기 위험 — phase-4.6 §2.3 "항목 ID 재사용 금지·기존 timeline 항목 ID는 흡수처에서도 그대로 보존" 룰과 충돌.
- 잃는 것: /weight 가 "체중 입력 단일 도구"로 좁혀지면 흡수된 timeline 4블록 중 2개만 살아남고(주차·권장 체중), D-day 는 홈 4축 허브로 이동 가능하나 "이번 주 할 일" 은 /checklist 허브 상단 외 갈 곳 없음 — 즉 D2-Hybrid.
- 희생 거부 인용: "사용자가 입력한 값(체중·체크·커스텀 항목·dueDate)을 임의로 변형·삭제하지 않음. localStorage 스키마 변경 시 **마이그레이션 의무** — 기존 데이터 보존 또는 명시적 사용자 알림 후 폐기." — docs/design/persona.md §3 N7
- 주장: D2-Hybrid 부활 — /weight 에는 "임신 주차 + 권장 체중 + 체중 그래프" 3블록, "이번 주 할 일" 은 `/checklist` 허브 상단으로 이동. phase-4.6 §2.2 D2-Hybrid 가 결정 라운드에서 기각된 사유는 데이터 노이즈 플로어이지 §3.5 인지부하 룰로 기각된 게 아님. T1=A 유지하되 흡수처 2곳 분산은 D2-Hybrid 의 운영적 재해석으로 정당.
- 잔재 자기검증: 이전 페어 [dev × marketer] 영향 없음 — N — namespace cutover 결정과 화면 위계 독립

**T3 — 핵심 충돌 + 숨은 가정**
- 핵심 충돌: 흡수된 "이번 주 할 일" 데이터를 /weight 화면에서 CTA 1줄로 다운그레이드할지 vs /checklist 허브 상단으로 분산(D2-Hybrid 부활)할지. 전자는 흡수처 단일·planner §7.5 정합·1줄 CTA 데이터 압축, 후자는 데이터 보존·designer §3.5 인지부하 ↓·흡수처 2곳 작업·T1=A 결정 미세 확장.
- 숨은 가정: 양쪽 다 timeline_items.json 의 주차별 "이번 주 할 일" 항목이 충분히 많아 별도 위치를 차지할 가치가 있다고 가정. 실제 항목이 주차당 1~2개면 별도 블록·CTA 자체가 과잉이고 단순 텍스트 1줄로 충분 — phase 8 §1.2 schema 점검 시 실제 데이터 확인 의무.

## 4. 미해결 트레이드오프

- [ ] **항목 1 — Migration 함수 위치 (페어 1)**: zustand `persist.migrate` 를 store inline 으로 짤지 vs 별도 pure 함수 + unit test 로 추출할지
  - 옵션 A — store inline migrate: 즉시 비용 적음 (~30분), 나중 비용: schema migration 회귀를 E2E 페이지 로드로만 검증 → CI 1초 안에 못 잡고 알람 둔감
  - 옵션 B — `src/store/migrations/timeline-to-weight.ts` 별도 pure 함수 + unit test 4~6 case: 즉시 비용 1~2h ↑ (별도 파일·테스트), 나중 비용: 회귀 가드 견고, phase-4.6 §7.1·§8.4 양보 거부 정합, qa §3.5 today 주입 룰 자동 충족
  - **결정:** _(사용자 작성 영역)_

- [ ] **항목 2 — GA4 namespace cutover (페어 2)**: timeline_* → weight_* 즉시 cutover vs 4주 grace 신/구 병행
  - 옵션 A — 즉시 cutover: 즉시 비용 적음·코드 깔끔(1 PR), 나중 비용: marketer §3.6 락인 깨기 위반, 4주 baseline 데이터 단절, ga4.md §7 변경 정책 위반
  - 옵션 B — 4주 grace 신/구 병행: 즉시 비용 dual-fire 코드 4주 살이 + 1 PR 마이그레이션 + 1 PR cleanup = 2 PR, 나중 비용: 측정 연속성 ↑, marketer §3.6 정합. 보고서 룰 의무: weight_* primary, timeline_* deprecated grace
  - **결정:** _(사용자 작성 영역)_

- [ ] **항목 3 — "이번 주 할 일" 흡수처 (페어 3)**: /weight 1줄 CTA 다운그레이드 vs /checklist 허브 상단 분산 (D2-Hybrid 부활)
  - 옵션 A — /weight 단일 + 1줄 CTA: 즉시 비용 적음, 나중 비용: /weight 단일 정체성 보존·planner §7.5 정합. 단 timeline_items.json "이번 주 할 일" 데이터 일부 silent 폐기 위험 (designer N7 위반 가능, phase-4.6 §2.3 항목 ID 보존 룰 충돌)
  - 옵션 B — /weight (시계열·권장 체중) + /checklist 허브 상단 ("이번 주 할 일"): 즉시 비용 흡수처 2곳 작업·zustand store 도 weight·checklist 양쪽 schema 갱신, 나중 비용: 데이터 보존·designer §3.5 인지부하 ↓. T1=A 결정의 운영적 확장 (Hybrid)
  - 옵션 C — 텍스트 1줄 다운그레이드 (양쪽 다 안 둠): timeline_items.json "이번 주 할 일" 이 실제로 주차당 1~2개에 불과하면 "23주차: 입체 초음파 검사·태교 음악 시작" 같은 텍스트 1줄을 /weight 상단 컨텍스트에 박음. 즉시 비용 적음, 나중 비용: 데이터 검증 후 결정 가능 (phase 8 §1.2 schema 점검 선행 의무)
  - **결정:** _(사용자 작성 영역)_

## 5. 결정 (2026-05-31, 휴먼 게이트 통과)

### 항목 1 — Migration 함수 위치
**옵션 B 채택 — 별도 pure 함수 + unit test 추출**

- 위치: `src/store/migrations/timeline-to-weight.ts`
- 시그니처: `migrateTimelineToWeight(persistedState: unknown, version: number, today?: Date): MigratedWeightContextState`
- Unit test: `src/store/migrations/__tests__/timeline-to-weight.test.ts` 4~6 case
  - happy (v0 → v1 정상 변환)
  - 빈 state (신규 사용자)
  - 부분 누락 (`linked_checklist_ids` 없는 항목)
  - 항목 ID 충돌 (기존 weight store 와 동일 ID — phase-4.6 §2.3 항목 ID 보존 룰)
  - undefined dueDate (주차 계산 불가)
  - today 주입 (qa §3.5)
- zustand `useWeightStore` (또는 신규 흡수처 store) 의 `persist.migrate` 옵션에서 한 줄로 위임
- phase-4.6 §7.1 양보 거부 항목 정합

### 항목 2 — GA4 namespace cutover
**옵션 B 채택 — 4주 grace 신/구 병행 발사**

- 흡수 머지 시점: `weight_*` 이벤트 즉시 발사 시작
- `timeline_*` 이벤트: 동시에 4주간 발사 유지 (deprecated 마킹은 ga4.md §7 에)
- 4주 후 cleanup PR: timeline_* 발사 코드 제거 + ga4.md spec 삭제
- double-count 회피: ga4.md §7 변경 정책에 "weight_* primary, timeline_* deprecated grace" 명시, funnel 보고서에서 weight_* 만 카운트
- PR 분할: 1) 흡수 + dual-fire 시작, 2) 4주 후 cleanup
- 일정 영향: cleanup PR ~ 2026-07-06 (흡수 머지 ~ 2026-06-08 가정 + 4주). AdSense 신청(2026-06-15) 이후라 신청 시점 영향 없음. 단 7월 휴가 백스톱 전 cleanup 완료 의무

### 항목 3 — "이번 주 할 일" 흡수처
**옵션 C 변형 채택 — /weight 상단 클릭 가능한 텍스트 1줄**

- 근거: timeline_items.json 실측 — 총 36개, **주차당 정확히 1개 항목** (2026-05-31 검증). D2-Hybrid 의 별도 블록은 데이터 분포와 불일치 (블록 무게 vs 1줄 내용)
- /weight 화면 상단: `{weekN}주차 · {title} →` 형식의 클릭 가능한 1줄
  - `linked_checklist_ids` 있는 17개 항목: 클릭 시 `/checklist?slug={linked_checklist_slug}` 진입
  - linked 없는 19개 항목: 클릭 시 /weight 안에서 description expand
- /checklist 허브: 별도 "이번 주 할 일" 블록 **추가 없음** (designer §3.5·planner §7.5 정합)
- 데이터: `src/data/timeline_items.json` → `src/data/weight_context_items.json` rename (항목 ID·linked_checklist_ids·title·description·type·priority·week·seo_slug 모두 보존)
- type 필드는 weight 흡수 후 활용 여지 (admin·prep·wellbeing 별 시각 분류). 현 phase 에서는 시각 분류 결정 미루고 데이터만 보존
- phase-4.6 §3.2 H1 "체중 카드 안 '이번 주 권장량/체중'" 표현 유지 — 1줄 컨텍스트는 그 위 또는 안에 박힘 (디자인 결정은 design.md 에서)

## 6. 우선순위 영향

- **항목 1 결정 (B 채택)** → phase 8 qa.md §1.4 작업량 산정: unit test 4~6개 + E2E `timeline-migrate.spec.ts` 1개 + 신규 모듈 1개 (`src/store/migrations/timeline-to-weight.ts`). qa §3.5 today 주입 의무 자동 적용 — `useTimelineStore` 현 코드의 today 주입 여부를 phase 8 §1.2 schema 점검 시 확인 필수. 미주입이면 `week-calculator` 리팩토링이 흡수 작업에 선행
- **항목 2 결정 (B 채택)** → ga4.md §7 변경 정책에 "weight_* primary, timeline_* deprecated grace 4주 (~2026-07-06)" 명시. cleanup PR 일정 2026-07-06 (7월 휴가 백스톱 전 완료 의무). phase-4.5 §1.5 GA4 카탈로그 갱신 시 `weight_week_view` 신규 + `timeline_week_view` deprecated 둘 다 등재
- **항목 3 결정 (C 변형 채택)** → phase-4.6 §3.2 H1 화면 영향: /weight 상단 1줄 컨텍스트 추가 (디자인 design.md). /checklist 허브 변경 없음 — 체크리스트 허브의 첫 화면 결정과 무관. `weight_context_items.json` rename 으로 `scripts/generate-crosslinks.ts`·`crosslink-utils.ts` 의 timeline 참조도 갱신 대상
- 다른 phase-4.6 결정(V1=A, H1=A, N1=A)에는 변경 없음
- phase 5 spec.md §"기능 요구사항" 에 위 결정 3개를 review 참조 섹션으로 박고, 본문이 어긋나면 결정 보호 룰 발동

## 7. Addendum: 흡수 후 UX gap 보강 (2026-06-01)

> 추가 작성일: 2026-06-01
> 상태: decided (운영자 1인 의사결정, 출산 D-day 임박 시간 압박 하 휴먼 게이트 통과)
> 트리거: 흡수 머지(65a11aa) 후 운영자 실측 — 카드 약속과 도착 화면 불일치
> 관련: [spec.md §6](./spec.md), [design.md §7](./design.md), [ga4.md §8](./ga4.md), [qa.md §7](./qa.md)

### 7.1 발견된 gap (요약)

흡수 직후 운영자 실측:

1. `/checklist` "주차별 타임라인" 카드 약속 ("4~40주 검사·준비") ≠ 도착 `/weight` 화면 (H1 "체중 기록", timeline 정보 1줄)
2. `weight_context_items.json` 36개 콘텐츠가 "현재 주차 1개" 로 squash — 다른 주차는 검색·우연 외 동선 없음

본 Addendum 은 1·2 를 한 번에 해소. 라우트 부활(`/timeline` 복원) 은 명시적 거부.

### 7.2 검토한 대안

| 옵션 | 즉시 비용 | 보존 비용 | UX 회복 | 정보구조 결정 무손상 |
|---|---|---|---|---|
| A — `/timeline` 라우트 부활 | 매우 큼 (9 컴포넌트 + store + type + 17 link + GA4 + sitemap revert) | 4축 → 5축, BottomNav 5탭/햄버거, AdSense 정책 노이즈 | 큼 (멘탈 모델 회복) | X (phase-4.6 §2 T1=A 결정 도미노로 흔들림) |
| B — 카드 카피 정정만 | 매우 적음 (~30분) | 카드 약속 정합화. 콘텐츠 squash 미해결 | 중 | O |
| **C — B + `/weight` 내부 "전체 주차 보기" expand** (채택) | 중간 (반나절 ~ 1일) | 카드 약속 정합화 + 36개 콘텐츠 노출 동선 확보 | 큼 | O (`/weight` 내부 작업만, 정보구조 결정 무손상) |

### 7.3 의사결정 (1인 운영자 휴먼 게이트, 2026-06-01)

#### 결정 4 — 카드 카피·메트릭·본문 정정

**옵션 채택: ChecklistHub "주차별 타임라인" 카드 카피·메트릭 + 페이지 본문 `PageDescription` 동시 정정**

- 카드 제목: `"주차별 타임라인"` → `"체중과 주차별 가이드"` (한국어 자연어, "&" 대신 "과" 조사. 형제 카드 명사구 톤 정합 + 도착 H1 "체중 기록" 첫 단어 일치)
- 카드 설명: `"이번 주 행정 일정과 체중 변화를 함께 확인하세요"` ("행정 일정" 으로 timeline 콘텐츠 가치 묘사, "함께" 가 흡수의 본질)
- 진행률 Progress bar 제거 — weight 축은 누적·시간 도구, "달성률" 의미 약함. 다른 체크리스트 카드 3개와 의미 중복 회피
- 메트릭 배지: `{N}주차` + `체중 기록 N건 · 최근 M/D` (기록 0건 시 `"기록 시작하기"` peach 톤 CTA)
- **페이지 본문 `PageDescription` 동시 정정**: `"주차별 타임라인부터 출산가방·남편준비·…"` → `"체중·주차 가이드부터 출산가방·남편준비·…"`. 카드만 바꾸면 본문이 어긋남 + fs-level 가드 (`"주차별 타임라인" 0건`) 본문에서 트리거
- 근거: review §3.3 페어 3 designer §3.5 인지부하 + planner §7.5 체크리스트 흐름. 흡수 의도 (4축 정돈) 보존하면서 진입점 정직성 회복

**카피 후보 비교 (자기 검토 기록)**

| 후보 | 채택 여부 | 사유 |
|---|---|---|
| `주차별 가이드 & 체중` | X | `&` 한국어 UI 부적절, 형제 카드 (명사구) 톤 불일치 |
| `이번 주 가이드 · 체중 기록` | X | "이번 주" 가 약속 → 전체 보기 콘텐츠 못 본다고 오해 |
| `체중 기록 · 주차 가이드` | X | "주차 가이드" 모호 (timeline 정확한 묘사 X) |
| `체중과 주차별 가이드` | **채택** | 한국어 자연 + 형제 카드 톤 + H1 첫 단어 일치 |

#### 결정 5 — `/weight` 내부 "전체 주차 보기" expand

**옵션 채택: WeightChart 아래 토글 + 트라이메스터 3그룹 + 36개 mini row**

- 위치: **WeightChart 아래**, 체중 리스트 위 (사용자 진입 의도 1순위 = 체중 도구 보존 — chart 즉시 노출 우선. 전체 주차 미리보기는 3순위)
- 토글 텍스트: `"전체 40주 미리 보기 (1·2·3기)"` (콘텐츠 양 + 구조 명시로 발견율 ↑)
- 디자인 일관: page card `rounded-2xl` / 모든 row (WeekContextRow + mini row) `rounded-xl` **2단계 사다리** (이전 3단계 안에서 mini row `rounded-lg` 제거 — 2px 차이 인지 미미, 위계는 size·tone·left-border 로 충분)
- 트라이메스터 (실측 분포): 1기 4~13주 **9개** (6주차 데이터 누락) / 2기 14~27주 14개 / 3기 28~40주 13개. 합계 36개
- 현재 주차 mini row 강조: **`border-l-4 border-l-pastel-pink/60`** 좌측 thick — list-selection 익숙 패턴 (Notion·Linear·VSCode 사이드바). 전체 둘러싸기 X (pink 가 CTA 색이라 "클릭하면 뭔가 일어남" 오해 방지). AP1 예외 사유 강화 — focus indicator `ring-pink/60` 과도 시각 분리
- mini row 클릭 동작 (실측 비율): linked 있음 **4개** (4·32·35·36주차) → `/checklist?slug=…` (`axis_cross_link source="browse_all"`) / linked 없음 **32개 — 주된 동선** → inline expand
- **WeekContextRow swap 금지**: 사용자가 자기 주차 상실 위험 (spec §6.2.3 won't 명문화)
- 근거: review §3.3 페어 3 designer §3 N7 "데이터 보존" — 흡수 시 보존된 36개 항목이 실제 노출 동선을 가짐. planner §7.5 "체크리스트 흐름" 충돌 0건 — `/weight` 내부 작업이라 체크리스트 허브 위계는 무손상

**디자인 결정 자기 검토 기록**

| 항목 | 초안 | 정정 | 사유 |
|---|---|---|---|
| 토글 위치 | WeightChart 위 | WeightChart 아래 | 체중 도구 가시성 우선 (사용자 진입 의도 1순위 = 체중) |
| 토글 텍스트 | "전체 주차 보기" | "전체 40주 미리 보기 (1·2·3기)" | 콘텐츠 양·구조 명시로 발견율 ↑ |
| 현재 주차 강조 | `border border-pink/40` 전체 둘러싸기 | `border-l-4 border-l-pink/60` 좌측 thick | CTA 오해 방지 + list-selection 보편 패턴 |
| mini row radius | `rounded-lg` | `rounded-xl` (WeekContextRow 와 일관) | 2px 차이 인지 미미, 위계 단순화 |
| 1기 카운트 | 10 (가정) | 9 (실측 — 6주차 누락) | spec §6.3 보정 |
| linked 비율 | 17개 (review §5 결정 3 본문 가정) | 4개 (실측 — 4·32·35·36) | linked 동선은 보조, expand 가 주된 동선 |

### 7.4 명시적 거부 항목 (do-not 리스트)

- `/timeline` 라우트 부활: §7.2 옵션 A. phase-4.6 §2 T1=A 결정 (2026-05-26) 의 운영자 의도 (4축 + AdSense 정책 통과 2026-06-15) 가 본 Addendum 작성 시점에도 유효. UX gap 은 라우트 부활 없이 §7.3 결정 4·5 로 해소 가능
- `/checklist` 허브에 별도 "이번 주" 블록 추가: review §5 결정 3 의 거부 유지 (카피만 정정)
- WeekContextRow 의 "현재 주차" 다른 주차로 swap: spec §6.2.3 won't 명문화. 자기 주차 상실 위험
- `weight_context_items.json` 항목 추가·편집: 본 Addendum 은 노출 UX 만 다룸

### 7.5 페어 단축 사유

본 Addendum 은 흡수 머지 후 발견 gap 의 보강이라 review §3 의 페어 충돌 라운드 (T1·T2·T3) 를 다시 돌리지 않음. 사유:

- 핵심 의사결정 축 (정보구조·측정·UX) 은 §5 결정 1·2·3 으로 이미 확정. 본 Addendum 의 결정 4·5 는 그 결정의 운영적 확장이지 새 축 아님
- 운영자 1인 환경, 출산 D-day 임박 (2026-08-13, D-73) — 페어 라운드 풀로 돌릴 시간 비용 > Addendum 결정의 위험도
- 결정 4 (카드 카피) 는 reversible (텍스트 변경) — 페어 라운드 자료 없이도 사후 조정 가능
- 결정 5 (전체 주차 보기) 는 새 컴포넌트지만 기존 패턴 재사용 (WeekContextRow·WeekContextExpanded) — 새 디자인 결정 최소화

### 7.6 우선순위 영향

- **결정 4** → ChecklistHub 카피·메트릭 정정 1 PR. `e2e/checklist-hub.spec.ts` 의 "주차별 타임라인" 텍스트 assertion 갱신 (qa §7 참조). 회귀 가드: `grep -rn "주차별 타임라인" src/` 0건
- **결정 5** → `/weight` 내부 신규 컴포넌트 `WeekContextBrowseAll.tsx` (또는 기존 컴포넌트 확장). 트라이메스터 그룹 로직 pure fn `groupItemsByTrimester(items: WeightContextItem[])` 추출 가능 — unit test 1 case. e2e 1 spec 신규 (qa §7.2)
- **GA4 신규 이벤트** `week_context_browse_all_toggle` 추가 + 기존 `axis_cross_link`·`week_context_expand` 의 `source` 파라미터 확장 — ga4.md §8 의무
- 다른 결정 (1·2·3) 에는 변경 없음. cleanup PR (2026-07-06 timeline_* 발사 제거) 일정도 무손상
- 본 Addendum 작업은 `/feature-pipeline` 의 `/implement-feature` 단계로 진입 (size: M, 반나절~1일 예상)
