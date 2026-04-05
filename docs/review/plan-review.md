# Phase 1 코드 리뷰

## 리뷰 대상 파일

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/checklist/page.tsx`
- `src/app/timeline/page.tsx`
- `src/app/videos/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/components/checklist/ChecklistContainer.tsx`
- `src/components/checklist/ChecklistItem.tsx`
- `src/components/checklist/ChecklistAddForm.tsx`
- `src/components/timeline/TimelineContainer.tsx`
- `src/components/timeline/TimelineCard.tsx`
- `src/components/timeline/TimelineAddForm.tsx`
- `src/components/babyfair/BabyfairContainer.tsx`
- `src/components/weight/WeightChart.tsx`
- `src/components/weight/WeightContainer.tsx`
- `src/components/videos/VideosContainer.tsx`
- `src/components/videos/VideoCard.tsx`
- `src/components/home/DueDateBanner.tsx`
- `src/components/ads/AdUnit.tsx`
- `src/components/layout/Footer.tsx`
- `src/lib/analytics.ts`

총 22개 파일 (docs/phase-1/implementation.md 기준, 문서/config 제외)

---

## Critical 이슈 (즉시 수정 완료)

### 1. page.tsx — 토스트가 매 페이지 로드마다 반복 표시

- **위치**: `src/app/page.tsx:38-47`
- **문제**: `prevDueDateRef`가 `null`로 초기화되므로, Zustand persist가 localStorage에서 저장된 dueDate를 복원할 때도 `prevDueDateRef.current === null && dueDate`가 true가 됨. 이미 예정일을 저장한 사용자가 페이지를 새로고침할 때마다 "데이터는 이 브라우저에만 저장됩니다" 토스트가 반복 표시됨. 스펙은 "첫 입력 시 1회"를 요구함.
- **수정 내용**: `prevDueDateRef` 기반 로직을 제거하고, `localStorage.getItem("due-date-toast-shown")` 플래그로 1회만 표시되도록 변경. try-catch로 localStorage 접근 불가(시크릿 모드) 대응.

---

## Warning (수정 권장)

### 1. ChecklistItem.tsx — Tailwind 동적 클래스 미동작

- **위치**: `src/components/checklist/ChecklistItem.tsx:51`
- **문제**: `hover:${priority.bg}`는 `hover:bg-[#FFD4DE]/60` 같은 문자열을 생성하지만, Tailwind은 빌드 시 정적 분석으로 클래스를 추출하므로 동적으로 조합된 클래스는 CSS에 포함되지 않음. 결과적으로 priority 배지의 hover 효과가 동작하지 않음.
- **권장 수정**: 각 priority별 hover 클래스를 정적으로 정의:
  ```ts
  const PRIORITY_STYLES = {
    high: { className: "bg-[#FFD4DE]/60 text-[#B04060] hover:bg-[#FFD4DE]/60", label: "높음" },
    // ...
  };
  ```

### 2. ChecklistContainer.tsx — 필터/진행률 함수 매 렌더마다 재계산

- **위치**: `src/components/checklist/ChecklistContainer.tsx:48-61`
- **문제**: `getItemsByCategory`, `getTotalProgress`, `getCategoryProgress`가 일반 함수로 매 렌더마다 호출됨. 123+ 항목에 대한 filter 연산이 5개 카테고리 × 렌더마다 반복. 현재 규모에서 성능 문제는 아니지만, 커스텀 항목이 많아지면 체감될 수 있음.
- **권장 수정**: `useMemo`로 카테고리별 항목과 진행률을 한 번만 계산.

### 3. TimelineContainer.tsx — 다수 "current" 항목에 ref 중복

- **위치**: `src/components/timeline/TimelineContainer.tsx:84`
- **문제**: `getStatus`가 `currentWeek ± 1` 범위를 "current"로 판정하므로 여러 항목이 current가 될 수 있음. `ref={isCurrent ? currentRef : undefined}`는 마지막 current 항목에만 ref가 붙어 스크롤 대상이 됨.
- **권장 수정**: 첫 번째 current 항목에만 ref 부여 (flag 변수 사용).

### 4. BabyfairContainer.tsx — `today` 매 렌더마다 재계산

- **위치**: `src/components/babyfair/BabyfairContainer.tsx:14`
- **문제**: `new Date().toISOString().split("T")[0]`이 렌더마다 실행됨. 필터 `useMemo` 의존성에 포함되어 있어 불필요한 필터 재계산 유발 가능.
- **권장 수정**: `useMemo`나 `useState`로 한 번만 계산.

### 5. ChecklistAddForm.tsx — `as` 타입 단언

- **위치**: `src/components/checklist/ChecklistAddForm.tsx:26`
- **문제**: `activeCategory as ChecklistItem["category"]`가 런타임 검증 없이 사용됨. `activeCategory`가 `CATEGORY_MAP` 키에서 오므로 실제로 안전하지만, 타입 단언보다 검증이 안전함.
- **권장 수정**: `CATEGORY_OPTIONS.some(c => c.value === activeCategory)` 검증 후 fallback.

---

## Suggestion (개선 아이디어)

### 1. form 요소 접근성

- ChecklistAddForm, TimelineAddForm, WeightForm에서 `<label>`과 `<input>`이 `htmlFor`/`id`로 연결되어 있지 않음. 스크린 리더가 label과 input의 관계를 인식하지 못할 수 있음. `useId()` 사용 권장.

### 2. VideoCard 썸네일 img → next/image

- `<img>` 태그를 사용 중. `images: { unoptimized: true }` 설정이므로 실질적 이점은 없지만, Phase 4(운영 전환) 시 `next/image`로 전환하면 이미지 최적화 가능.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 1건 발견, 1건 수정 완료 |
| Warning | 5건 |
| Suggestion | 2건 |
| 빌드 | 성공 (수정 후 1회) |

---
---

# Phase 1.5: 타임라인 + 체크리스트 통합 코드 리뷰

## 리뷰 대상 파일

- `src/lib/checklist-week-map.ts`
- `src/components/timeline/TimelineAccordionCard.tsx`
- `src/components/timeline/WeekChecklistSection.tsx`
- `src/components/timeline/UnifiedAddForm.tsx`
- `src/components/timeline/CategoryFilter.tsx`
- `src/store/useChecklistStore.ts`
- `src/store/useTimelineStore.ts`
- `src/components/timeline/TimelineContainer.tsx`
- `src/app/timeline/page.tsx`
- `src/app/checklist/page.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/app/page.tsx`

총 12개 파일 (docs/implementation/plan-impl.md 기준)

---

## Critical 이슈 (즉시 수정 완료)

없음.

---

## Warning (수정 권장)

### 1. WeekChecklistSection.tsx — `<div onClick>` 접근성 패턴
- **위치**: `src/components/timeline/WeekChecklistSection.tsx:127-134`
- **문제**: 체크리스트 항목을 감싸는 `<div>` 요소에 `onClick` 핸들러와 `cursor-pointer`가 있으나, `role="button"`, `tabIndex={0}`, `onKeyDown` 속성이 없어 키보드 사용자가 접근·실행 불가. 내부에 Checkbox가 있어 체크 자체는 키보드로 가능하지만, div 클릭 영역이 별도 인터랙션으로 동작함.
- **권장 수정**: div에 `role="button"`, `tabIndex={0}`, Enter/Space 키 핸들러 추가, 또는 전체를 `<button>` 요소로 변경.

### 2. TimelineContainer.tsx — `getFilteredChecklist` 매 렌더 재생성
- **위치**: `src/components/timeline/TimelineContainer.tsx:55-58`
- **문제**: `getFilteredChecklist` 함수가 렌더 함수 본문에 정의되어 매 렌더마다 새로 생성됨. 이 함수가 `.map()` 내부에서 호출되면서 매번 새 배열 참조를 생성 → `TimelineAccordionCard`에 전달되는 `checklistItems` prop이 매 렌더마다 변경되어 불필요한 리렌더링 유발 가능.
- **권장 수정**: `useCallback`으로 감싸거나, `activeCategory` 의존성을 포함한 `useMemo`로 필터링된 Map 전체를 미리 계산.

### 3. TimelineContainer.tsx — `getStatus` / `hasFilteredChecklist` 매 렌더 재생성
- **위치**: `src/components/timeline/TimelineContainer.tsx:72-76, 87-92`
- **문제**: 두 함수 모두 렌더 본문에서 재생성됨. `getStatus`는 `currentWeek`에만 의존하고, `hasFilteredChecklist`는 `activeCategory`와 `weekChecklistMap`에만 의존하므로 `useCallback`으로 안정화 가능.
- **권장 수정**: `useCallback`으로 래핑하여 의존성이 변경되지 않으면 동일 참조 유지.

---

## Suggestion (개선 아이디어)

### 1. CATEGORY_OPTIONS 상수 중복
- `CategoryFilter.tsx`, `WeekChecklistSection.tsx`, `UnifiedAddForm.tsx` 3개 파일에서 동일한 `CATEGORY_OPTIONS` 배열이 각각 정의됨. 공유 상수 파일(`src/lib/constants.ts` 등)로 추출하면 유지보수 시 한 곳만 수정하면 됨.

### 2. TimelineContainer.tsx — 자동 스크롤 setTimeout
- **위치**: `src/components/timeline/TimelineContainer.tsx:81-83`
- 300ms 고정 딜레이 대신 `requestAnimationFrame` 또는 `IntersectionObserver` 사용을 고려할 수 있음. 현재 구현도 동작하지만 렌더 타이밍에 따라 스크롤이 실패할 가능성이 있음.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 3건 |
| Suggestion | 2건 |
| 빌드 | 미실행 (Critical 없음) |
