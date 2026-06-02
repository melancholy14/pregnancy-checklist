# timeline-to-weight 테스트 전략

> 작성일: 2026-05-31  size: L
> 관련 리뷰: [review.md](./review.md)
> 관련 기획: [spec.md](./spec.md)
> 측정 설계: [ga4.md](./ga4.md)
> 디자인: [design.md](./design.md)
> 페르소나 SoT: [docs/qa/persona.md](../../qa/persona.md)

> **이 문서는 `/feature-pipeline` 안의 `write-unit-tests` · `write-e2e-tests` 스킬이 입력으로 읽습니다.**

## review.md 결정사항 참조

- **결정 1 (B)**: `src/store/migrations/timeline-to-weight.ts` 별도 pure 함수 추출 + unit test 4~6 case + E2E `timeline-migrate.spec.ts` 1개. qa §3.5 today 주입 의무 자동 충족 — `week-calculator` 가 이미 `today: Date = new Date()` 받음 (영향 스캔 §1.1 확인).
- **결정 2 (B)**: GA4 dual-fire 4주. E2E 에서 weight_* 발사 검증, timeline_* 도 동시 발사 검증 (4주 grace 기간). cleanup PR 머지 후 timeline_* 0건 발사 별도 검증.
- **결정 3 (C 변형)**: /weight 상단 1줄 클릭 시 linked 분기 두 가지 → E2E 2개 시나리오 (linked 있음 → /checklist 이동, linked 없음 → expand).

## 1. 기존 테스트 영향 분석

### 1.1 스캔 결과 (2026-05-31 실측)

수정/추가 대상 파일 (spec.md §3.1 + 영향 스캔 확장):

- 신규: `src/store/migrations/timeline-to-weight.ts`, `src/components/weight/WeekContextRow.tsx`, `src/components/weight/WeekContextExpanded.tsx`, `e2e/timeline-migrate.spec.ts`
- 변경: `src/store/useWeightStore.ts` (schema 확장), `src/data/timeline_items.json → weight_context_items.json` (rename), `src/lib/checklist-week-map.ts` (TimelineItem 의존 → WeightContextItem)
- 폐기: `src/store/useTimelineStore.ts`, `src/types/timeline.ts`, `src/components/timeline/` 통째 (AccordionCard 만 weight 폴더로 이동)
- 라우트: `src/app/timeline/page.tsx` → meta-refresh redirect 페이지로 재작성
- 내부 링크 갱신 17개 (spec.md §3.1 의 5개 → **실측 17개로 확장 필요** — phase 9 cross-check 에서 spec 갱신):
  - `src/app/sitemap.ts`, `src/lib/search.ts`, `src/lib/checklist-week-map.ts`
  - `src/components/home/HomeContent.tsx`, `src/components/search/SearchModal.tsx`
  - `src/components/articles/TimelineCTA.tsx`, `src/components/onboarding/OnboardingFlow.tsx`
  - `src/components/providers/OnboardingBannerProvider.tsx`
  - `src/components/checklist/ChecklistHub.tsx`, `src/components/checklist/ChecklistRelatedContent.tsx`
  - `src/components/timeline/*` (UnifiedAddForm·TimelineContainer·TimelineAccordionCard 폐기·이동)
  - `src/content/articles/weekly-prenatal-checklist.md` (본문 /timeline 링크 갱신)
- scripts: `scripts/generate-crosslinks.ts`, `scripts/lighthouse-check.sh`, `scripts/weekly-report/ga4-queries.ts·prompt-shared.ts·types.ts`

#### 영향받는 기존 unit/E2E 테스트

| 영향받는 테스트 파일 | 어떤 부분이 영향받나 | 깨질 가능성 | 수정 방향 |
|---|---|---|---|
| `src/lib/__tests__/checklist-week-map.test.ts` | `TimelineItem` import + `getChecklistByWeek(timelineItems, ...)` 시그니처 | 높음 | `WeightContextItem` 타입으로 교체, 함수 시그니처 갱신 + test fixture 데이터 갱신 |
| `src/lib/__tests__/week-calculator.test.ts` | TimelineItem 무관 — 단 today 주입 패턴이 migration 함수의 참고 | 낮음 | 변경 없음. migration unit test 작성 시 참고 |
| `src/lib/__tests__/date-kst.test.ts` | TimelineItem 무관 | 0% | 변경 없음 |
| `e2e/timeline.spec.ts` | `/timeline` 진입 + customItems CRUD + 영상 link 시나리오 잔재 | 100% | **통째 폐기** (phase-4.6 §8.1 표) |
| `e2e/timeline-enhancement.spec.ts` | `/timeline` 진입 + 강조 동작 | 100% | **통째 폐기** |
| `e2e/timeline-retention.spec.ts` | `/timeline` 진입 + 리텐션 시나리오 | 100% | **통째 폐기** — 리텐션 시나리오는 weight_week_view 발사로 axis-funnel.spec.ts 신규로 이동 (phase-4.6 §8.3 순서 4) |
| `e2e/checklist-week-bug.spec.ts` | `/timeline` 진입 + customItems 시드 | 높음 | `/weight` 로 path 갱신, customItems 시드는 `useWeightStore.weekContext.customItems` 로 키 변경 |
| `e2e/gamification.spec.ts` | `/timeline` 진입 + customItems 시드 | 높음 | 같음 — path + 시드 키 갱신 |
| `e2e/phase-4-step-5-crosslinks.spec.ts` | useTimelineStore 시드 + linked_video_ids 잔여 | 중간 | `useWeightStore` 시드로 키 변경, linked_video_ids 시나리오는 phase-4.6 §1 에서 이미 제거됨 |
| `e2e/design-bundle-k-delete-pattern.spec.ts` | useTimelineStore 의 delete 패턴 | 중간 | weight store 의 weekContext.customItems delete 로 마이그레이션 |
| `e2e/ga4-events.spec.ts` | `timeline_week_view` 발사 검증 + `/timeline` 진입 | 높음 | dual-fire 검증 추가 (weight_* + timeline_* 4주 grace), 4주 후 cleanup PR 에서 timeline_* assertion 제거 |
| `e2e/marketing-events-wiring.spec.ts` | `/timeline` 진입 시 wire 발사 | 중간 | `/weight` path 로 교체 + weight_week_view assertion |
| `e2e/navigation.spec.ts` | "타임라인" nav 라벨 검증 | 중간 | "정보" 항목 phase-4.6 §4 N1=A 와 함께 처리 — 본 phase 에서는 path 만 갱신 |
| `e2e/home.spec.ts` | "타임라인" 카드 + `/timeline` 진입 | 중간 | phase-4.6 §3 H1 작업과 겹침. 본 phase 에서는 path 만 |
| `e2e/onboarding-flow.spec.ts` | OnboardingFlow 의 `/timeline` 진입 | 중간 | `/weight` path 교체 |
| `e2e/pregnancy-week-onboarding.spec.ts` | onboarding 후 `/timeline` 진입 | 중간 | `/weight` path 교체 |
| `e2e/checklist-recommendation-semantics.spec.ts` | `/timeline` 진입 보조 | 낮음 | path 교체 |
| `e2e/cross-links.spec.ts` | `/timeline` ↔ /weight 크로스링크 | 중간 | timeline 진입 부분 제거, weight 측 시나리오만 보존 |
| `e2e/client-search.spec.ts` | search 결과의 /timeline 항목 | 중간 | search 결과에서 /weight 로 path 갱신 |
| `e2e/seo-meta.spec.ts`·`e2e/seo-metadata.spec.ts`·`e2e/page-description.spec.ts`·`e2e/sticky-header.spec.ts`·`e2e/lighthouse-seo.spec.ts` | `TARGET_PAGES`·`paths` 배열에 `/timeline` | 높음 | `/timeline` 제거 후 `/weight` 추가 (이미 있으면 중복 제거). title/canonical 기댓값 갱신 |
| `e2e/design-bundle-g-pastel-remap.spec.ts`·`-h-tab-filter-color`·`-b-i-row-tokens` | timeline 컴포넌트의 토큰 검증 | 중간 | timeline 컴포넌트 폐기 → 해당 검증 통째 제거, weight 의 WeekContextRow 토큰 검증으로 마이그레이션 |
| `e2e/plan.spec.ts`·`e2e/checklist-week-bug.spec.ts`·`e2e/phase-4-step-1-checklist-hub.spec.ts`·`e2e/phase-4-step-4-share.spec.ts` | "타임라인" 텍스트 또는 `/timeline` 진입 보조 | 낮음 | path/텍스트 교체 |
| `e2e/design-bundle-cleanup-round.spec.ts` | fs-level grep 가드 — `useTimelineStore` import 차단 | 트리거됨 | 가드 약화 X. timeline 자산이 실제로 0건이 되었는지 검증 (즉 가드가 잡으려는 회귀가 일어나지 않음). qa §7.4 정합 |
| `e2e/design-bundle-j-share-button-position.spec.ts` | "타임라인" 위치 검증 | 중간 | timeline 폐기 → 해당 검증 통째 제거 |
| `e2e/design-bundle-d-uncheck-toggle-dday.spec.ts` | fs-level 가드 | 낮음 | 영향 없음 — D-day 검증은 timeline 무관 |

**합계**: 갱신 19개 + 통째 폐기 3개 + 신규 1개 + unit 갱신 1개 (checklist-week-map.test.ts) = **24개 e2e/unit 작업**

### 1.2 데이터·schema 변경 점검 — **Y**

- localStorage 키 변경: `timeline-storage` (useTimelineStore) → `weight-storage` (useWeightStore.weekContext.customItems 흡수)
- Zustand store schema 변경: `useWeightStore` v0 (`logs` 만) → v1 (`logs` + `weekContext: { customItems: TimelineItem[] }`)
- src/data/*.json 구조 변경: `timeline_items.json` → `weight_context_items.json` rename, 필드 보존
- 기존 E2E 의 `localStorage.setItem("timeline-storage", ...)` 시드 코드가 v1 schema 와 호환 안 됨 → migration 핸들러가 `timeline-storage` 키도 읽어와 흡수해야 함 (호환 또는 신규 사용자는 자동 v1 생성). E2E 시드는 신규 키 `weight-storage` v1 schema 로 갱신
- **migration 핸들러 없으면 사용자 데이터 손실 위험** (dev §6.3, designer N7) — review §5 결정 1 B 채택으로 자동 해결

### 1.3 회귀 가드와 충돌 점검 — **부분 Y, 우회 X**

- `design-bundle-cleanup-round.spec.ts` (fs-level grep 가드 — qa §7.4 보존 의무):
  - **트리거되는 가드**: `useTimelineStore` import 0건, `/timeline` 라우트 ref 0건 (deprecated 표기·redirect 페이지 제외) 검증할 가능성
  - **대응**: 가드 약화 X. 실제로 useTimelineStore 가 코드에서 완전 제거되었는지 확인 — phase-4.6 §1 영상 자산 처리와 동일 패턴 (가드가 잡으려는 회귀가 일어나지 않으면 가드는 그대로 통과)
- `marketing-weekly-report.spec.ts`·`ga4-events.spec.ts`·`p9-empty-state.spec.ts`·`phase-4-step-5-crosslinks.spec.ts`·`lighthouse-seo.spec.ts` (fs guard 7개): 갱신 없이 통과 가능 여부 각각 점검 — 변경이 가드 약화로 처리되지 않게

### 1.4 영향 요약

- **갱신 필요한 기존 테스트**: 23개 (e2e 22개 + unit 1개)
- **신규 테스트 작성 대상**: 5개
  - unit: `src/store/migrations/__tests__/timeline-to-weight.test.ts` 4~6 case
  - e2e: `e2e/timeline-migrate.spec.ts` 1개
  - e2e: WeekContextRow click 분기 검증 (linked 있음 → /checklist, linked 없음 → expand) — 별도 spec 또는 기존 weight spec 확장
  - (cleanup PR 별도, 본 phase 범위 밖) `e2e/axis-funnel.spec.ts` 의 timeline_* 0건 발사 assertion
- **합계 (write 단계 작업량)**: **28개**

## 2. 테스트 레이어 분류 (피라미드 결정)

spec.md §2 시나리오 6개를 unit/e2e 하나에 명시 분류 — qa §3.3 "같은 명세를 양쪽에 박지 않음" 룰.

| 시나리오 (spec §2) | 레이어 | 근거 |
|---|---|---|
| 1. 기존 사용자 진입 (migration v0→v1) | **unit + e2e** (다른 명세) | unit 은 migrate 함수의 분기 검증 (4~6 case), e2e 는 사용자가 실제 페이지에서 무손실 체험. 같은 assertion 아님 — unit 은 state transform, e2e 는 UI 노출 |
| 2. 신규 사용자 진입 | **unit** | migrate 함수의 빈 state 분기 — unit case 1개로 커버 |
| 3. /weight 상단 1줄 클릭 (linked 있음) | **e2e** | UI 흐름 + 라우팅 + GA4 발사 — pure fn 아님 |
| 4. /weight 상단 1줄 클릭 (linked 없음) | **e2e** | UI 흐름 + accordion expand + GA4 발사 |
| 5. GA4 funnel 발사 (dual-fire) | **e2e** | 실제 발사 시점 + DebugView 검증 — pure fn 아님 |
| 6. 외부 링크 진입 `/timeline?week=24` | **e2e** | meta-refresh redirect + searchParams 매핑 — UI 흐름 |

## 3. Unit 테스트 대상

### 3.1 대상 함수·store

- `src/store/migrations/timeline-to-weight.ts::migrateTimelineToWeight` — review §5 결정 1 B 의 핵심 함수 — **신규**
- `src/lib/checklist-week-map.ts::getChecklistByWeek` — `TimelineItem` → `WeightContextItem` 타입 교체 — **갱신**
- `src/lib/checklist-week-map.ts::getUnassignedChecklist` — 같은 타입 의존 — **갱신**

### 3.2 케이스 매트릭스

`migrateTimelineToWeight` (신규):

| 유형 | 케이스 |
|---|---|
| Happy Path | (1) v0 timeline-storage + 빈 weight-storage → v1 weight-storage with customItems 흡수 + logs 그대로 |
| Happy Path | (2) v0 timeline-storage + 기존 weight-storage v0 logs → v1 weight-storage with 양쪽 보존 |
| Boundary | (3) 빈 v0 timeline-storage (신규 사용자) → 기본 v1 schema 생성 |
| Boundary | (4) v0 timeline-storage 의 customItems 일부 필드 누락 (linked_checklist_ids 없음) → 기본값으로 채워서 흡수 |
| Priority | (5) v0 timeline-storage 의 customItem ID 가 weight-storage 의 logs.id 와 동일 → ID 충돌 방지 (각자 namespace) |
| Invariant | (6) today 주입 (Date 2026-05-31) → 시간 의존 함수가 today 받아 결정적 결과 — qa §3.5 |

`getChecklistByWeek` (갱신):

| 유형 | 케이스 |
|---|---|
| Happy Path | 기존 케이스 — `TimelineItem[]` → `WeightContextItem[]` 타입만 교체, assertion 동일 |
| Boundary | 기존 빈 배열 케이스 — 영향 없음 |

### 3.3 시간 의존 함수 점검

- 이 기능에 `new Date()` 호출: **있음** — migration 함수가 흡수 시점 (오늘) 의 주차 정보를 사용해 dueDate 미입력 사용자에게 기본값 채울 가능성
- 함수가 `today` 파라미터 받는지: **Y** — `migrateTimelineToWeight(state, version, today?: Date = new Date())` 시그니처 의무 (review §5 결정 1 B + qa §3.5)
- `week-calculator` 는 이미 today 주입 ✅ — 영향 스캔 §1.1 확인

### 3.4 mock 점검

- migration 함수 unit test 의 mock: **0개** (pure transform — input state + version + today → output state)
- mock ≥ 3 위반 없음 ✅

## 4. E2E 테스트 대상

### 4.1 4가지 describe 블록

**`e2e/timeline-migrate.spec.ts`** (신규 — review §5 결정 1 B 의 §7.1 양보 거부 검증 의무):

- **Happy Path**: (a) 기존 사용자 시드 (`timeline-storage` v0 + customItems 2개) → /weight 진입 → 사용자 상태 무손실 + 컨텍스트 1줄 표시
- **Happy Path**: (b) 기존 사용자 시드 + 기존 weight logs → 양쪽 모두 보존 검증
- **권한/인증 (localStorage 분기)**: (c) 빈 localStorage (신규 사용자) → /weight 진입 → 기본 v1 schema 생성 + dueDate 미입력 CTA 표시
- **Error/Validation**: (d) 손상된 localStorage (`timeline-storage` JSON parse 실패) → migration 함수 fallback → 사용자 알림 X, 기본 v1 schema 자동 적용

**WeekContextRow 클릭 분기** (별도 spec 또는 기존 `e2e/weight.spec.ts` 확장):

- **Happy Path**: (a) dueDate 시드 24주차 → /weight 진입 → "24주차 · 임신성 당뇨 검사 및 유모차 구매" 1줄 표시 → 클릭 → `/checklist?slug=hospital-bag` 이동 검증
- **Happy Path**: (b) dueDate 시드 5주차 → /weight 진입 → "5주차 · 임신 초기 생활 습관 점검" 1줄 (linked 없음) → 클릭 → 같은 화면 expand 검증 (`aria-expanded=true`)
- **Error/Validation**: (c) dueDate 시드 2주차 (week < 4) → "임신 준비 중" 메시지 + 클릭 영역 없음
- **반응형 (Mobile 375px)**: (d) 위 (a) 를 375px viewport 에서 — 1줄 mobile 시각 검증 + clickable area 보존

**GA4 dual-fire 검증**: `e2e/ga4-events.spec.ts` 갱신 (기존 spec)

- timeline_* dual-fire 4주 grace 검증 (gtag spy 패턴 — qa §3.2)
- weight_week_view 신규 발사 검증
- axis_cross_link 발사 검증 (linked 있음 클릭 시)
- week_context_expand 발사 검증 (linked 없음 클릭 시 양방향 토글)

**Redirect 검증**: 새 spec 또는 기존 `e2e/seo-metadata.spec.ts` 확장

- /timeline → /weight redirect (meta-refresh)
- /timeline?week=24 → /weight?week=24 쿼리 보존
- redirect 페이지 `robots: noindex` meta 검증

### 4.2 갱신 대상 기존 spec

§1.1 표의 22개 e2e 파일 갱신. 핵심 패턴:

```ts
// AS-IS
await page.goto("/timeline?week=24");
localStorage.setItem("timeline-storage", JSON.stringify({ state: { customItems: [...] } }));

// TO-BE
await page.goto("/weight?week=24");
localStorage.setItem("weight-storage", JSON.stringify({ state: { logs: [], weekContext: { customItems: [...] } }, version: 1 }));
```

### 4.3 회귀 가드

본 phase 작업이 새로 도입하는 가드:

- `e2e/timeline-migrate.spec.ts` 자체가 §7.1 양보 거부 검증 가드
- `e2e/design-bundle-cleanup-round.spec.ts` 의 fs-level 가드를 약화시키지 않음 (qa §7.4) — 변경 후에도 가드 통과 검증
- `useTimelineStore` import 0건 + `/timeline` ref 0건 (redirect 페이지·deprecated 표기 제외) 가드 → cleanup-round spec 에 추가 검토

### 4.4 시드 데이터·초기 상태

`timeline-migrate.spec.ts` 시드 예:

```ts
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // 기존 사용자: v0 timeline-storage
    localStorage.setItem("timeline-storage", JSON.stringify({
      state: {
        customItems: [
          { id: "custom_1", week: 24, title: "내가 추가한 항목", description: "...", isCustom: true, type: "prep", priority: "medium" }
        ]
      },
      version: 0
    }));
    // 기존 weight-storage (있는 경우)
    localStorage.setItem("weight-storage", JSON.stringify({
      state: { logs: [{ id: "log_1", date: "2026-05-30", weight: 58.5 }] },
      version: 0
    }));
    localStorage.setItem("due-date-storage", JSON.stringify({
      state: { dueDate: "2026-08-13" },
      version: 0
    }));
    localStorage.setItem("cookie-consent", "accepted");
  });
});
```

### 4.5 GA4 이벤트 검증 (ga4.md 와 일치)

- `weight_week_view`: /weight 진입 + dueDate 입력 사용자 → 1회 발사, param `week=24`, `context_item_id="week_24_glucose_test"`, `has_linked_checklist=true`
- `axis_cross_link`: 1줄 클릭 (linked 있음) → 1회 발사, param `from="weight"`, `to="checklist"`, `source="week_context"`, `slug="hospital-bag"`, `week=32`
- `week_context_expand`: 1줄 클릭 (linked 없음) → open/close 양방향 발사 검증
- `timeline_week_view`: dual-fire 4주 grace 기간 동시 발사 검증 (4주 후 cleanup PR 에서 0건 assertion 으로 전환)

## 5. Skip / Defer

| 항목 | 보류 이유 | 제거 조건 | 제거 deadline |
|---|---|---|---|
| `axis-funnel.spec.ts` 의 timeline_* 0건 발사 assertion | 본 phase 는 dual-fire 4주 grace 채택 (review §5 결정 2 B) — 0건 검증은 cleanup PR 이후 | cleanup PR 머지 후 timeline_* 발사 코드 제거 시 | 2026-07-06 (cleanup PR 머지일) |
| `e2e/timeline-migrate.spec.ts` 의 손상 localStorage fallback case (4.1.d) | migration 함수가 손상 state 받았을 때 fallback 정책이 spec.md §4 에 명시 됨 (silent default) — E2E 도입 우선순위 낮음 | fallback 정책 변경 시 (예: 사용자 알림 추가) | (조건부) 정책 변경 PR 시 |

> ⚠️ deadline 없는 skip 추가 0건 (qa §7.1 정합)

## 6. 성공 기준

- **Unit**: migration 함수 6 case + checklist-week-map 갱신 2 case = 8 case 모두 통과. 소요 < 500ms.
- **E2E**: timeline-migrate.spec.ts (4 describe) + WeekContextRow click (4 describe) + ga4-events 갱신 + redirect = 12+ describe 통과. flaky retry 0회.
- **§1.1 갱신 대상 기존 23개 테스트** 모두 통과 — 회귀 0건.
- **spec.md §2 시나리오 6개 전수**가 §2 매트릭스에 매핑됨 (cross-check §9 통과).
- **§1.3 fs-level 가드 7개** 갱신 없이 통과 (변경이 가드 약화로 처리되지 않음).
- **GA4 DebugView 캡처** PR 첨부 (ga4.md §5.3 + marketer §5.1) — weight_week_view·axis_cross_link·week_context_expand·timeline_* dual-fire 4종.
- **cleanup PR (별도, 2026-07-06)**: timeline_* 발사 0건 검증 + axis-funnel.spec.ts skip 해제.

## 7. Addendum: 흡수 후 UX gap 보강 (2026-06-01)

> 추가 작성일: 2026-06-01
> 관련: [spec.md §6](./spec.md), [design.md §7](./design.md), [review.md §7](./review.md), [ga4.md §8](./ga4.md)
> 본 Addendum 은 카드 카피 정정 + `/weight` 내부 "전체 주차 보기" expand 의 테스트 전략 정의

### 7.1 기존 테스트 영향 분석 (Addendum 작업분)

신규/수정 대상 (spec §6.2 + design §7.1):

- 신규: `src/components/weight/WeekContextBrowseAll.tsx` (또는 기존 WeekContextRow 확장)
- 신규: `src/lib/group-by-trimester.ts` 또는 `src/lib/weight-context-trimester.ts` — pure fn `groupItemsByTrimester(items): { trimester1, trimester2, trimester3 }`
- 변경: `src/components/checklist/ChecklistHub.tsx` (TimelineCard 카피·메트릭 정정)
- 변경: `src/components/weight/WeightContainer.tsx` (browse all 토글·렌더 통합)
- 변경: `src/lib/analytics.ts` 또는 GA4 발사 호출부 (`source` 파라미터 확장, `week_context_browse_all_toggle` 신규)

#### 영향받는 기존 unit/E2E 테스트

| 영향받는 테스트 파일 | 어떤 부분이 영향받나 | 깨질 가능성 | 수정 방향 |
|---|---|---|---|
| `e2e/checklist-hub.spec.ts` (또는 `e2e/checklist.spec.ts`) | "주차별 타임라인" 카드 텍스트·메트릭 assertion | 높음 | "주차별 가이드 & 체중" 으로 텍스트 갱신, Progress bar assertion 제거, "체중 기록 N건" 배지 assertion 추가 |
| `e2e/ga4-events.spec.ts` (§1.1 표 에서 갱신됨) | `axis_cross_link source="week_context"` assertion | 높음 | `source="current_week"` 로 enum 갱신. `week_context_browse_all_toggle` 신규 assertion 추가 |
| `e2e/cross-links.spec.ts` | `/weight` ↔ `/checklist` 크로스링크 | 중간 | browse_all source 시나리오 추가 검토 (현 phase 미포함 시 별도 spec) |
| `e2e/design-bundle-cleanup-round.spec.ts` (fs-level grep 가드) | "주차별 타임라인" 텍스트 회귀 가드 | 신규 가드 추가 | `grep -rn "주차별 타임라인" src/` 0건 가드 추가 (markdown 본문 제외 — `src/**/*.tsx?` 한정) |
| `src/lib/__tests__/checklist-week-map.test.ts` | TimelineItem 의존 — 본 Addendum 무관 | 0% | 변경 없음 |

#### 데이터·schema 변경 점검 — **N**

- localStorage 키 변경: 없음
- Zustand store schema 변경: 없음 (browse_all 토글 상태는 useState — persist 안 함)
- `weight_context_items.json` 구조 변경: 없음 (노출만 추가)
- 본 Addendum 은 UI·이벤트 layer 만 — migration 부담 0

#### 회귀 가드 충돌 — **부분 Y, 우회 X**

- 신규 fs-level 가드: `"주차별 타임라인" src/**/*.tsx 0건` — design-bundle-cleanup-round.spec.ts 에 추가. `src/content/**/*.md` 제외 (의미 보존)
- `useTimelineStore`/`/timeline` 가드 (기존): 변경 없음, 통과 유지

#### 영향 요약 (Addendum 작업분)

- **갱신 필요한 기존 테스트**: 3개 (checklist-hub, ga4-events, design-bundle-cleanup-round)
- **신규 테스트 작성 대상**: 3개
  - unit: `src/lib/__tests__/group-by-trimester.test.ts` 3 case (1기·2기·3기 경계)
  - e2e: `e2e/weight-week-context.spec.ts` (browse all 토글·렌더·클릭 분기)
  - e2e: 카드 카피 회귀 — `e2e/checklist-hub.spec.ts` 안 describe 추가
- **합계**: **6개**

### 7.2 테스트 레이어 분류 (Addendum 작업분)

spec §6.3 시나리오 (7·8·9) 매핑:

| 시나리오 (spec §6.3) | 레이어 | 근거 |
|---|---|---|
| 7. `/checklist` 진입 사용자 카드 신뢰 | **e2e** | 카드 텍스트·메트릭 노출 + 진입 흐름 — UI 흐름 |
| 8. 전체 주차 미리 보기 (linked 있음) | **e2e** | 토글 + mini row 렌더 + 클릭 라우팅 + GA4 발사 |
| 9. 전체 주차 보기 안 linked 없는 row 클릭 | **e2e** | 토글 + mini row inline expand + GA4 발사 |

pure fn `groupItemsByTrimester` 만 unit 분류 (시나리오에 직접 매핑되지 않으나 §6.2.1 must 의 트라이메스터 그룹화 로직).

### 7.3 Unit 테스트 대상 (Addendum)

- `src/lib/group-by-trimester.ts::groupItemsByTrimester` — 신규
  - 케이스 (1): 실측 36개 항목 입력 → `{ trimester1: 9, trimester2: 14, trimester3: 13 }` 분포. 1기 9개인 이유: `weight_context_items.json` 에 **6주차 데이터 누락** (실측 weeks: [4,5,7,8,9,10,11,12,13]). 그룹 경계: 4~13 = 1기, 14~27 = 2기, 28~40 = 3기, week 4 시작·40 끝 inclusive
  - 케이스 (2): 빈 배열 → 세 그룹 모두 빈 배열 (boundary)
  - 케이스 (3): 경계 (week=13, 14, 27, 28) → 13→1기, 14→2기, 27→2기, 28→3기 (경계 명세)
  - 케이스 (4): 6주차 같은 데이터 누락 주차는 함수 입력에서 자체적으로 없음 — 그룹 결과에 placeholder 끼우지 않음 (실측 9·14·13 그대로). UI 단에서 누락 주차 표시 결정 (design §7.3.2 의 "자리 비움" 또는 skip 처리는 e2e f case 에서 검증)

### 7.4 E2E 테스트 대상 (Addendum)

**`e2e/weight-week-context.spec.ts`** (신규, 또는 기존 `e2e/weight.spec.ts` 확장):

- **Happy Path (a)**: 24주차 사용자 시드 → /weight 진입 → 토글 노출 (WeightChart 아래 위치 검증) + 닫힘 default + 토글 텍스트 `"전체 40주 미리 보기 (1·2·3기)"` 노출 → 토글 클릭 → 3 그룹 헤더 (`1기 (4~13주, 9개)` · `2기 (14~27주, 14개)` · `3기 (28~40주, 13개)`) + 36 mini row 렌더 + 현재 주차 (24주차) mini row 강조 (`border-l-4 border-l-pastel-pink/60` 좌측 thick + `aria-current="true"`) 시각 검증
- **Happy Path (b)**: 위 (a) 펼친 상태 → 3기 32주차 mini row 클릭 (linked 실측 4개 중 하나) → `/checklist?slug=hospital-bag` 이동 + `axis_cross_link(source="browse_all", slug="hospital-bag", week=32)` 발사
- **Happy Path (c)**: 위 (a) 펼친 상태 → 1기 12주차 mini row 클릭 (linked 없음 — 실측 32개 의 주된 동선) → mini row 아래 inline expand + `week_context_expand(source="browse_all", state="open", week=12)` 발사 → 다시 클릭 → close + 발사
- **권한/인증 (d)**: dueDate 미입력 사용자 → 토글 노출 + 펼침 시 3 그룹 정상 (헤더 카운트 9·14·13 그대로) + 현재 주차 강조 **없음** (`aria-current` 0건, `border-l-pink` 0건)
- **반응형 (e)**: 375px viewport 펼친 상태 — mini row 한 줄 또는 2줄 wrap 시각 검증 + clickable area ≥ 44px + 좌측 `border-l-4` 가 mobile 에서 잘리지 않는지 확인
- **Error/Validation (f)**: `weight_context_items.json` 의 6주차 데이터 누락 실측 — 1기 그룹 안에서 6주차 자리는 skip (placeholder 미렌더). 렌더된 1기 weeks: [4,5,7,8,9,10,11,12,13] 9개. silent fail, 사용자 알림 X. 정책 변경 시 (placeholder 추가) skip 해제

**`e2e/checklist-hub.spec.ts` 갱신** (기존):

- **describe 추가**: "체중과 주차별 가이드" 카드
  - (a) 카드 제목 `"체중과 주차별 가이드"` 노출
  - (b) 카드 설명 `"이번 주 행정 일정과 체중 변화를 함께 확인하세요"` 노출
  - (c) Progress bar 없음 (`role="progressbar"` 0건)
  - (d) 메트릭 배지 2종: `{N}주차` + `체중 기록 N건 · 최근 M/D` (또는 0건 시 `"기록 시작하기"` peach 톤)
  - (e) `href="/weight"` 유지
  - (f) 페이지 본문 `PageDescription` 갱신 검증: `"체중·주차 가이드부터 출산가방·남편준비·…"` 노출 + `"주차별 타임라인부터"` 미노출

**`e2e/ga4-events.spec.ts` 갱신**:

- `axis_cross_link.source` enum 검증 갱신 (`current_week` · `browse_all`)
- `week_context_browse_all_toggle` open/close 양방향 발사 검증
- `week_context_expand.source` 신규 파라미터 검증

#### 회귀 가드 (Addendum 추가분)

- fs-level: `grep -rn "주차별 타임라인" src/**/*.tsx 0건` — design-bundle-cleanup-round.spec.ts 에 추가
- fs-level: `grep -rn 'source: "week_context"' src/ 0건` — `axis_cross_link` 의 옛 source enum 잔재 0건

#### 시드 데이터 (Addendum)

`weight-week-context.spec.ts` 시드:

```ts
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("due-date-storage", JSON.stringify({
      state: { dueDate: "2026-08-13" },  // 24주차 시점 2026-06-01
      version: 0
    }));
    localStorage.setItem("weight-storage", JSON.stringify({
      state: {
        logs: [{ id: "log_1", date: "2026-05-30", weight: 58.5 }],
        weekContext: { customItems: [] }
      },
      version: 1
    }));
    localStorage.setItem("cookie-consent", "accepted");
  });
});
```

### 7.5 GA4 이벤트 검증 (ga4.md §8 와 일치)

- `week_context_browse_all_toggle`: 토글 클릭 → 1회 발사, param `state="open"` 또는 `"close"`, `current_week=24`
- `axis_cross_link(source="current_week")`: WeekContextRow (현재 주차) linked 클릭 시 — 기존 발사 검증
- `axis_cross_link(source="browse_all")`: 전체 보기 안 linked mini row 클릭 시 — 신규
- `week_context_expand(source="current_week"|"browse_all", state="open"|"close")`: 두 source × 두 state = 4 조합 모두 검증

### 7.6 Skip / Defer (Addendum)

| 항목 | 보류 이유 | 제거 조건 | 제거 deadline |
|---|---|---|---|
| 트라이메스터 그룹 헤더 색 힌트 검증 (peach·lavender·yellow) | spec §6.2.2 should — 단일 톤 default 채택 시 검증 대상 아님 | should 항목이 must 로 격상 시 | (조건부) Phase 5 P11 콘텐츠 매트릭스 sketch 후 |
| 자동 스크롤 (`scrollIntoView`) 검증 | spec §6.2.2 should | 위와 동일 | 위와 동일 |
| `weight_context_items.json` 누락 항목 placeholder 시각 검증 (§7.4 e2e f) | 손상 데이터 정책이 silent fail — 우선순위 낮음 | 정책 변경 시 (사용자 알림 추가) | (조건부) 정책 변경 PR 시 |

> ⚠️ deadline 없는 skip 추가 0건 (qa §7.1 정합)

### 7.7 성공 기준 (Addendum)

- **Unit**: `group-by-trimester` 3 case 모두 통과. 소요 < 50ms
- **E2E**: `weight-week-context.spec.ts` (5+ describe) + `checklist-hub.spec.ts` 5 describe + `ga4-events.spec.ts` 갱신 = 11+ describe 통과. flaky retry 0회
- **§7.1 갱신 대상 기존 3개 테스트** 모두 통과 — 회귀 0건
- **fs-level 가드** `"주차별 타임라인"` · `'source: "week_context"'` 0건 통과
- **GA4 DebugView 캡처** PR 첨부 — `week_context_browse_all_toggle`·`axis_cross_link(browse_all)`·`week_context_expand(browse_all)` 3종 추가 (기존 4종 + Addendum 4종 = 총 8종 — ga4.md §8.8)
- spec §6.3 시나리오 7·8·9 전수 가 §7.2 매트릭스에 매핑됨
