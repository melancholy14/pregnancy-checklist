# design-bundle-k-delete-pattern 코드 리뷰

> 작성일: 2026-05-10
> 관련 스펙: [spec.md](../features/design-bundle-k-delete-pattern/spec.md)
> 관련 구현: [impl.md](../implementation/design-bundle-k-delete-pattern-impl.md)

## 리뷰 대상 파일

- `src/lib/hooks/useDeleteWithUndo.ts` (신규)
- `src/app/layout.tsx` (수정 — Toaster props)
- `src/components/checklist/ChecklistRow.tsx` (수정 — Trash2 인라인 버튼)
- `src/components/checklist/ChecklistPage.tsx` (수정 — undo wiring)
- `src/components/timeline/WeekChecklistSection.tsx` (수정 — undo wiring)
- `src/components/timeline/TimelineAccordionCard.tsx` (수정 — undo wiring + Trash2)
- `src/components/weight/WeightContainer.tsx` (수정 — undo wiring)

총 7개 파일.

---

## Critical 이슈 (즉시 수정 완료)

없음.

타입 안전성·성능·보안·접근성 4축 검토 결과 사용자에게 즉시 피해를 주거나 런타임 크래시를 유발하는 항목 0건. `useDeleteWithUndo` 훅이 generic + useCallback 정합 + sonner toast.action 사용으로 깨끗하게 구현되어 있고, 모든 삭제 버튼에 `aria-label`이 박혀 있으며, 호출부에서 `id` 검증(atIndex < 0 가드) 처리됨.

---

## Warning (수정 권장)

### 1. ChecklistPage.tsx / WeekChecklistSection.tsx / TimelineAccordionCard.tsx — 인라인 `restoreFn`이 매 렌더 새 인스턴스

- **위치**:
  - `src/components/checklist/ChecklistPage.tsx:82-90`
  - `src/components/timeline/WeekChecklistSection.tsx:36-44`
  - `src/components/timeline/TimelineAccordionCard.tsx:53-61`
- **문제**: `useDeleteWithUndo`의 `restoreFn`이 인라인 화살표 함수로 박혀 매 렌더 식별자가 바뀜. `useDeleteWithUndo` 내부 `useCallback`의 deps에 `restoreFn`이 있으므로 반환 트리거도 매 렌더 새 식별자. 현재 트리거를 자식 컴포넌트에 props로 전달하지 않아 실측 리렌더 영향은 0이지만, 패턴이 확산되면 안정성 회귀 가능.
- **권장 수정**: 각 컴포넌트에서 `restoreFn`을 `useCallback`으로 메모이즈하거나, 훅 내부에서 ref 패턴으로 latest를 추적해 트리거 식별자를 안정시키는 방안 검토.

### 2. ChecklistPage.tsx / WeekChecklistSection.tsx / TimelineAccordionCard.tsx — `useStore.setState` 호출부 직접 호출

- **위치**:
  - `src/components/checklist/ChecklistPage.tsx:84-89`
  - `src/components/timeline/WeekChecklistSection.tsx:38-43`
  - `src/components/timeline/TimelineAccordionCard.tsx:55-60`
- **문제**: zustand 정석 API(store action 함수)에서 벗어나 호출부에서 `setState((state) => ...)` 직접 호출. spec K-2의 "호출부 책임" 결정에 따른 의도된 패턴이지만, 같은 splice 로직이 3곳에 복제되어 변경 시 누락 위험이 있음.
- **권장 수정**: 후속 라운드에서 `addCustomItem(item, atIndex?)` 시그니처 확장으로 통일하거나, `src/lib/hooks/`에 `restoreAt(store, item, atIndex)` 유틸 함수로 추출 검토.

### 3. ChecklistPage.tsx / WeekChecklistSection.tsx / TimelineAccordionCard.tsx — `as ChecklistItem` / `as TimelineItem` 타입 단언

- **위치**:
  - `src/components/checklist/ChecklistPage.tsx:87`
  - `src/components/timeline/WeekChecklistSection.tsx:41`
  - `src/components/timeline/TimelineAccordionCard.tsx:58`
- **문제**: `const { atIndex, ...rest } = item` 후 `rest`가 실제로는 `ChecklistItem`(또는 `TimelineItem`)이지만 TS가 그 정밀도까지 추론하지 못해 `as`로 단언. 실제 런타임 위험은 없으나 타입 단언은 검증 없이 통과시키는 escape hatch라 가능하면 회피.
- **권장 수정**: `restoreFn` 시그니처를 `(item: T, meta: { atIndex: number }) => void`로 분리해 atIndex와 item을 명시적으로 분리하거나, 명시적 객체 재구성 사용:
  ```ts
  const original: ChecklistItem = {
    id: item.id, title: item.title, /* ... 명시 ... */
  };
  ```

---

## Suggestion (개선 아이디어)

### 1. ChecklistRow.tsx / TimelineAccordionCard.tsx — `aria-label="삭제"`의 컨텍스트 부족

- 현재: 모든 삭제 버튼이 단순 `"삭제"`. weight만 `"체중 기록 삭제"`로 구체적.
- 스크린리더 사용자가 여러 행을 탐색할 때 어떤 항목을 삭제하는지 컨텍스트 모호. design.md §6에서도 "영역별 명확성 검증 1회"가 권장 사항으로 남아 있음.
- 제안: `aria-label={\`${item.title} 삭제\`}` 형태로 항목명 포함. 또는 영역별로 `"체크리스트 항목 삭제"` / `"타임라인 노트 삭제"`.

### 2. TimelineAccordionCard.tsx — `onClick` 인라인 가독성

- 위치: `src/components/timeline/TimelineAccordionCard.tsx:198-208`
- 한 화살표 함수 안에 store.getState() 조회 + findIndex + 가드 + 트리거 호출이 모두 들어 있어 가독성 낮음.
- 제안: 컴포넌트 상단에 `handleDeleteClick = () => { ... }` 형태로 추출. WeekChecklistSection/ChecklistPage도 동일 패턴이라 함께 정리 가능.

### 3. useDeleteWithUndo.ts — 시그니처 `T & { id: string }` → `T extends { id: string }` 검토

- 현재: `useDeleteWithUndo<T>` + 트리거 인자가 `T & { id: string }`. 호출부는 모두 `ChecklistItem`·`TimelineItem`·`WeightLog`처럼 id 필드를 가진 타입을 넘김.
- 제안: `useDeleteWithUndo<T extends { id: string }>(opts): (item: T) => void`로 단순화. 호출부 변경 없이 시그니처만 깔끔.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 (모두 spec K-2/K-4 결정에 따른 의도된 패턴, 후속 라운드 정리 가능) |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 0건) |
