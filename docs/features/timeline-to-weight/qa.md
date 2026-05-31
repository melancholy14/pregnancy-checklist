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
