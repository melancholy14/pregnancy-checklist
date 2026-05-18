# design-bundle-d-uncheck-toggle-dday Implementation

> 구현일: 2026-05-10
> 관련 스펙: [docs/features/design-bundle-d-uncheck-toggle-dday/spec.md](../features/design-bundle-d-uncheck-toggle-dday/spec.md)
> 관련 디자인: [docs/features/design-bundle-d-uncheck-toggle-dday/design.md](../features/design-bundle-d-uncheck-toggle-dday/design.md)
> 관련 측정: [docs/features/design-bundle-d-uncheck-toggle-dday/ga4.md](../features/design-bundle-d-uncheck-toggle-dday/ga4.md)

## 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| M1. "미체크만 보기" 토글 컴포넌트 (ChecklistPage 진행률 카드 아래) | ✅ 완료 | shadcn `Switch` + lavender 톤 + focus-visible ring 적용. 세션 한정(zustand persist X). |
| M2. ChecklistItemRow D-day 라벨 슬롯 (Clock + "N주차에 챙기기") | ✅ 완료 | P2 분기 유지(`!isHighlighted`). `text-muted-foreground font-normal` 위계. |
| M3. ChecklistHub 필터링 로직 | ✅ 완료 | ChecklistPage 내 items 영역에서 카테고리별 필터링. 진행률 텍스트는 전체 기준 유지. |
| M4. 빈 상태 인라인 메시지 ("지금 보이는 항목은 모두 체크했어요") | ✅ 완료 | `role="status" aria-live="polite"` + `wordBreak: keep-all`. |
| M5. GA4 `checklist_filter` 이벤트 | ✅ 완료 | 토글 변경 시 1회. `filter_type=uncheck_only`, `value=on/off`. |
| M6. GA4 `upcoming_item_view` + `upcoming_item_check` 이벤트 | ✅ 완료 | view = ChecklistItemRow useEffect (1회/마운트). check = handleToggle 분기. PII 0. |
| M7. props 시그니처 변경 (currentPregnancyWeek, isHydrated, showUncheckedOnly 흐름) | ✅ 완료 | ChecklistItemRow에 prop 추가 (호출부 = ChecklistPage 단일). |
| 빌드 (`npm run build`) | ✅ 성공 | 1회 시도, TypeScript 통과. |

## 생성/수정 파일 목록

### 신규 생성
- 없음. 신규 컴포넌트 도입 X (design.md §2 결정).

### 수정
- `src/components/checklist/ChecklistItemRow.tsx`
  - `currentPregnancyWeek: number | null`, `isHydrated: boolean` props 추가.
  - `Clock` (lucide) 임포트 추가, `sendGAEvent`·`useEffect`·`useRef` 임포트 추가.
  - `showUpcomingLabel` 분기 (P2와 분리: `!isHighlighted && currentPregnancyWeek !== null && item.recommendedWeek > currentPregnancyWeek && item.recommendedWeek !== 0 && !isChecked`).
  - D-day 라벨 마크업(spec §3 M2 그대로, `text-xs font-normal text-muted-foreground`).
  - `useEffect` + `useRef`로 `upcoming_item_view` 1회 발사 (마운트 시 라벨 노출 케이스 + `isHydrated` 게이트).
  - **부수 수정**: 기존 `useMemo(noteType)`이 `if (isEditing)` early return 뒤에 위치한 hooks rule 위반을 fix — 모든 hooks를 early return 앞으로 hoist.
- `src/components/checklist/ChecklistPage.tsx`
  - `Switch` 임포트 추가.
  - `showUncheckedOnly` state(`useState(false)`) 추가 — 세션 한정.
  - `handleToggleUncheckedOnly` 콜백 — `setShowUncheckedOnly` + `sendGAEvent("checklist_filter", ...)`.
  - `handleToggle` 핸들러에 `upcoming_item_check` 분기 추가 (체크 시점에 `recommendedWeek > currentWeek && recommendedWeek !== 0 && currentWeek !== null` 만족 시 발사).
  - 토글 행 JSX 렌더(진행률 카드 아래, items div 위). `allItems.length > 0`일 때만.
  - 카테고리별 items 렌더 시 `subVisibleItems`로 필터 (토글 on이면 미체크만). `subVisibleItems.length === 0`인 카테고리는 섹션 자체 숨김.
  - `ChecklistItemRow`에 `currentPregnancyWeek`, `isHydrated` prop 전달.
  - 빈 상태 인라인 메시지 — items div 끝부분에 `showFilterEmptyState` 게이트로 렌더(토글 on + 미체크 0 + 원본 items 1+).

## 주요 결정 사항

- **하이드레이션 레이스 가드 (`isHydrated` prop 추가)**
  - `effectiveCheckedIds`는 zustand persist 하이드레이션 전에는 빈 배열이라 모든 항목이 unchecked로 보임. dueDate 스토어가 먼저 하이드레이션되면 `currentPregnancyWeek`만 채워진 상태에서 D-day 라벨이 잘못 노출되어 `upcoming_item_view`가 거짓 발사될 수 있음.
  - 해결: `ChecklistPage`의 `hydrated` boolean을 `isHydrated` prop으로 ChecklistItemRow까지 전달하고, useEffect 게이트에 `if (!isHydrated) return;`를 추가.
  - 기존 P2의 `recommended_item_view` 게이트(`if (!hydrated) return`)와 동일 패턴.
- **store 직접 접근 vs prop drilling**
  - design.md는 후자(직접 접근)를 권장하지만, `ChecklistPage`가 이미 `useDueDateStore`로 `currentPregnancyWeek`을 가져오고 prop drilling 단계가 1단계뿐이라 prop으로 전달.
  - SSR/hydration mismatch 회피용 패턴을 ChecklistItemRow에 추가로 박을 필요 없음.
- **카테고리 섹션 자체 숨김 (토글 on + 해당 카테고리 미체크 0)**
  - 헤더만 남고 항목이 비는 상황을 회피. `subVisibleItems.length === 0 → return null`.
  - 모든 카테고리가 비면 items div 끝의 빈 상태 메시지 1건만 노출 → spec §4 시나리오 6 일치.
- **toggle 영속성 = 세션 한정**
  - spec §3 must M1 + ga4.md §3 합의에 따라 `useState`만 사용. zustand persist X. 페이지 이탈 시 초기화.
- **카테고리 필터 진행률 표시 = 전체 기준 유지**
  - `{subChecked}/{subItems.length}` 그대로 — 토글 on이어도 분모는 전체. design.md §3 일치.
- **hooks rule 위반 fix**
  - 기존 `ChecklistItemRow`는 `if (isEditing) return ...` 뒤에 `useMemo(noteType)`이 위치해 React rules of hooks 위반 상태였음. 본 작업에서 `useMemo`·신규 `useRef`·`useEffect`를 모두 early return 앞으로 hoist해 정합화. 동작 변경 없음.

## 가정 사항

- **shadcn Switch 설치 완료**: `src/components/ui/switch.tsx`가 이미 존재(Radix UI 기반). spec §3 M1 단서("미설치 시 add") 불필요.
- **`bg-pastel-lavender` 등 토큰 정의됨**: globals.css 토큰 세트에 lavender·muted·muted-foreground·foreground 모두 존재(기존 P2·묶음 H 사용 중). 신규 토큰 도입 X.
- **`useDueDateStore`의 `currentPregnancyWeek`**: 하이드레이션 전 `null` 반환 (P3·P4 구현 패턴 그대로). 본 묶음에서 추가 보호 불필요.
- **lucide-react `Clock` 아이콘**: lucide-react 표준 패키지에 포함, 별도 설치 X.
- **GA4 `sendGAEvent` 헬퍼**: `src/lib/analytics.ts`에 존재. consent 게이팅은 `gtag` 로딩 여부로만 검증(window.gtag 미존재 시 noop) — 추가 처리 불필요.

## 미구현 항목

- **e2e 테스트**: spec §3 should — 본 라운드는 구현만, e2e PR 별도. 다음 단계(`/write-e2e-tests`)에서 처리.
- **phase-4.5.md §1.5 GA4 카탈로그 갱신**: 운영 문서 업데이트는 본 PR 머지 후 SoT 정리 라운드에서 박음(별도 chore).
- **토글 영속성 격상(zustand persist + migrate)**: spec §3 won't. P5 schema versioning이 phase-5에서 풀린 후 별도 라운드.
- **`upcoming_item_check` view→check 전환율 대시보드**: ga4.md §5 — 이벤트 정의만 박고 대시보드 통합은 묶음 L·M에서.
