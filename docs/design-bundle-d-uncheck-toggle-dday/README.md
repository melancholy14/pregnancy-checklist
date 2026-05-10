# design-bundle-d-uncheck-toggle-dday

> 작성일: 2026-05-10 | 작성자: Claude Code
> 관련 산출물: [spec.md](../features/design-bundle-d-uncheck-toggle-dday/spec.md) / [design.md](../features/design-bundle-d-uncheck-toggle-dday/design.md) / [ga4.md](../features/design-bundle-d-uncheck-toggle-dday/ga4.md)

## 개요

ChecklistPage(`/checklist/<slug>`)에 (1) "미체크만 보기" 토글과 (2) 미래 권장 항목용 "N주차에 챙기기" D-day 라벨 두 가지 UX 기회를 한 묶음으로 제공한다. 32개 항목 사이에서 미체크 8개를 매번 스크롤로 찾던 부담을 토글 한 번으로 줄이고, `recommendedWeek > currentWeek` 항목에 시간 컨텍스트 라벨을 박아 P2 "이번 주 추천"과 시각 위계로 분기한다. 측정용 GA4 이벤트 3종(`checklist_filter`·`upcoming_item_view`·`upcoming_item_check`)도 함께 박아 행동 영향을 추적한다.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| M1. "미체크만 보기" 토글 컴포넌트 (ChecklistPage 진행률 카드 아래) | ✅ 완료 | shadcn `Switch` + lavender 톤 + focus-visible ring. 세션 한정(zustand persist X). |
| M2. ChecklistItemRow D-day 라벨 슬롯 (Clock + "N주차에 챙기기") | ✅ 완료 | P2 분기 유지(`!isHighlighted`). `text-muted-foreground font-normal` 위계. |
| M3. ChecklistHub 필터링 로직 | ✅ 완료 | ChecklistPage 내 items 영역에서 카테고리별 필터. 진행률 텍스트는 전체 기준 유지. |
| M4. 빈 상태 인라인 메시지 ("지금 보이는 항목은 모두 체크했어요") | ✅ 완료 | `role="status" aria-live="polite"` + `wordBreak: keep-all`. |
| M5. GA4 `checklist_filter` 이벤트 | ✅ 완료 | 토글 변경 시 1회. `filter_type=uncheck_only`, `value=on/off`. |
| M6. GA4 `upcoming_item_view` + `upcoming_item_check` 이벤트 | ✅ 완료 | view = ChecklistItemRow useEffect (1회/마운트). check = handleToggle 분기. PII 0. |
| M7. props 시그니처 변경 (currentPregnancyWeek, isHydrated, showUncheckedOnly 흐름) | ✅ 완료 | ChecklistItemRow에 prop 추가 (호출부 = ChecklistPage 단일). |
| 빌드 (`npm run build`) | ✅ 성공 | 1회 시도, TypeScript 통과. |

### 생성/수정 파일

**신규 생성**
- 없음. 신규 컴포넌트 도입 X (design.md §2 결정).

**수정**
- `src/components/checklist/ChecklistItemRow.tsx`
  - `currentPregnancyWeek: number | null`, `isHydrated: boolean` props 추가.
  - `Clock` (lucide) + `sendGAEvent`/`useEffect`/`useRef` 임포트 추가.
  - `showUpcomingLabel` 분기(`!isHighlighted && currentPregnancyWeek !== null && item.recommendedWeek > currentPregnancyWeek && item.recommendedWeek !== 0 && !isChecked`).
  - D-day 라벨 마크업 + `useEffect` 1회 발사(`upcoming_item_view`).
  - **부수 수정**: 기존 `useMemo(noteType)` 가 early return 뒤에 위치한 hooks rule 위반을 모든 hooks를 early return 앞으로 hoist 해 정합화.
- `src/components/checklist/ChecklistPage.tsx`
  - `Switch` 임포트 추가.
  - `showUncheckedOnly` state(`useState(false)`), `handleToggleUncheckedOnly` 콜백, `visibleItemCount` useMemo, `showFilterEmptyState` 분기 추가.
  - `handleToggle` 핸들러에 `upcoming_item_check` 분기(체크 시점 + 미래 권장 가드) 추가.
  - 토글 행 JSX 렌더(진행률 카드 아래, items div 위, `allItems.length > 0` 조건).
  - 카테고리별 items 렌더 시 `subVisibleItems` 필터 적용. `subVisibleItems.length === 0`이면 섹션 자체 숨김.
  - 빈 상태 인라인 메시지 — items div 끝부분에 `showFilterEmptyState` 게이트로 렌더.
- `e2e/design-bundle-d-uncheck-toggle-dday.spec.ts` (신규 — 테스트)

### 주요 결정 사항

- **하이드레이션 레이스 가드 (`isHydrated` prop 추가)**
  `effectiveCheckedIds` 가 zustand persist 하이드레이션 전 빈 배열이라 dueDate 스토어가 먼저 하이드레이션되면 D-day 라벨이 잘못 노출돼 `upcoming_item_view` 거짓 발사 가능. ChecklistPage의 `hydrated` boolean을 `isHydrated` prop으로 ChecklistItemRow까지 전달해 useEffect 게이트로 사용. 기존 P2 `recommended_item_view` 게이트(`if (!hydrated) return`)와 동일 패턴.
- **store 직접 접근 vs prop drilling**
  design.md는 후자(직접 접근)를 권장하지만 ChecklistPage가 이미 `useDueDateStore`로 `currentPregnancyWeek`을 가져오고 prop drilling 단계가 1단계뿐이라 prop으로 전달.
- **카테고리 섹션 자체 숨김 (토글 on + 해당 카테고리 미체크 0)**
  헤더만 남고 항목이 비는 상황 회피. `subVisibleItems.length === 0 → return null`. 모든 카테고리가 비면 items div 끝의 빈 상태 메시지 1건만 노출 (spec §4 시나리오 6 일치).
- **toggle 영속성 = 세션 한정**
  spec §3 must M1 + ga4.md §3 합의에 따라 `useState`만 사용. zustand persist X. 페이지 이탈 시 초기화.
- **카테고리 진행률 표시 = 전체 기준 유지**
  `{subChecked}/{subItems.length}` 그대로 — 토글 on 이어도 분모는 전체.
- **hooks rule 위반 fix**
  기존 `ChecklistItemRow`는 `if (isEditing) return ...` 뒤에 `useMemo(noteType)`이 위치해 React rules of hooks 위반 상태였음. 본 작업에서 `useMemo`·신규 `useRef`·`useEffect`를 모두 early return 앞으로 hoist. 동작 변경 없음.

### 가정 사항 및 미구현 항목

**가정**
- shadcn Switch 기설치(Radix UI). globals.css 에 `bg-pastel-lavender` 등 토큰 모두 존재. `useDueDateStore`는 하이드레이션 전 `null` 반환(P3·P4 패턴). lucide-react `Clock` 표준 패키지 포함. `sendGAEvent` 헬퍼는 `gtag` 미존재 시 noop.

**미구현**
- e2e PR 분리 옵션은 본 라운드 내 통합(아래 "E2E 테스트 결과" 참조).
- phase-4.5.md §1.5 GA4 카탈로그 갱신은 본 PR 머지 후 SoT 정리 라운드에서 박음(별도 chore).
- 토글 영속성 격상(zustand persist + migrate) — P5 schema versioning 풀린 후 별도 라운드.
- `upcoming_item_check` view→check 전환율 대시보드 — 이벤트 정의만 박고 묶음 L·M에서 통합.

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)
없음.

### Warning (수정 권장)
없음.

### 전체 요약
| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 완료 |
| Warning | 0건 |
| Suggestion | 4건 |

**4가지 관점 평가** (요약)

| 관점 | 평가 | 비고 |
|------|------|------|
| 타입 안전성 | ✅ 통과 | `any` 사용 0. `currentPregnancyWeek: number \| null` null 가드 적절. |
| 성능 | ✅ 통과 | `useMemo`/`useCallback` 적절. 항목 규모 작아 매 렌더 필터링 영향 미미. |
| 보안 | ✅ 통과 | `dangerouslySetInnerHTML` 0. PII 0(`item_id` enum + integer만). |
| 접근성 | ✅ 통과 | 토글 `<label htmlFor>` + Switch `id` 연결, 빈 상태 `role="status" aria-live="polite"`, D-day 라벨 텍스트 노출 + 아이콘 `aria-hidden`. 키보드 Tab/Space 정상. |

전체 리뷰: [docs/review/design-bundle-d-uncheck-toggle-dday-review.md](../review/design-bundle-d-uncheck-toggle-dday-review.md)

---

## 리팩토링 내용

> 📄 리팩토링 산출물 없음 — Warning 0건 + 추가 판단 0건으로 본 라운드 리팩토링 작업 없음(no-op). 본 feature 가 추가한 코드는 의도된 구조이며 기존 컴포넌트 분리 등은 본 feature 범위를 벗어남.

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path — '미체크만 보기' 토글 | ✅ 3개 passed |
| Happy Path — D-day 라벨 (커스텀 아이템) | ✅ 3개 passed |
| GA4 이벤트 (`checklist_filter`/`upcoming_item_view`/`upcoming_item_check`) | ✅ 3개 passed |
| Error / Negative (currentWeek null, recommendedWeek=0, 지난 주차, 페이지뷰 자동 발사 X) | ✅ 4개 passed |
| 반응형 (Mobile 375px) | ✅ 2개 passed |
| **전체** | **15 passed / 0 failed (9.7s)** |

테스트 파일: [e2e/design-bundle-d-uncheck-toggle-dday.spec.ts](../../e2e/design-bundle-d-uncheck-toggle-dday.spec.ts)

📊 상세 리포트: `playwright-report/index.html`

**테스트 설계 메모** — hospital-bag base 항목이 모두 `recommendedWeek=0` 이라 D-day 라벨 검증은 `customItems` 시드(`recommendedWeek > 0`)로 진행. 본 라운드는 권한/인증 시나리오 N/A (사이트 public 정적 export).

---

## 누락된 문서

- `docs/refactor/design-bundle-d-uncheck-toggle-dday-refactor.md` — 리팩토링 작업 0건이라 미생성(파이프라인 정상 진행).
