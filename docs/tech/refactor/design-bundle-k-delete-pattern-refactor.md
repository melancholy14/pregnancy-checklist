# design-bundle-k-delete-pattern 리팩토링

> 작성일: 2026-05-10
> 관련 리뷰: [review.md](../review/design-bundle-k-delete-pattern-review.md)

## 리팩토링한 파일 목록

- `src/lib/hooks/useDeleteWithUndo.ts` (helper export 추가)
- `src/components/checklist/ChecklistPage.tsx`
- `src/components/timeline/WeekChecklistSection.tsx`
- `src/components/timeline/TimelineAccordionCard.tsx`

---

## 작업별 내용

### 1. `useDeleteWithUndo.ts` — `restoreAtIndex<T>(store, item, atIndex)` 유틸 export

- **출처**: Warning 2 (`useStore.setState` 호출부 직접 호출 중복)
- **무엇을**: zustand 스토어에 `customItems: T[]`를 가진 모든 스토어에 대해 `atIndex` 위치로 splice 복원하는 제네릭 유틸 함수 추가. `CustomItemsStore<T>` 인터페이스(`setState((s) => Partial<S>)`)로 구조적 타이핑.
- **왜**: 3개 호출부에서 동일한 splice + clamp 로직이 복제되어 있었음. 한 곳에 추출해 향후 새 사용자 입력 데이터 영역 추가 시 자동 일관성 유지.

### 2. `ChecklistPage.tsx` — `restoreCustomChecklistItem` useCallback + `restoreAtIndex` 사용

- **출처**: Warning 1 (인라인 restoreFn), Warning 2 (setState 중복), Warning 3 (`as` 단언)
- **무엇을**:
  - `restoreFn` 인라인을 `useCallback([useStore])`으로 추출 → `useDeleteWithUndo` 트리거 식별자 안정화.
  - splice 본문을 `restoreAtIndex<ChecklistItem>(useStore, rest, atIndex)` 한 줄로 교체.
  - `rest as ChecklistItem` 타입 단언 제거. `restoreAtIndex<ChecklistItem>`의 제네릭 추론으로 구조적 호환 검증.
- **왜**: 매 렌더 새 객체 식별자가 생기는 deps 안정성 문제 + 중복 로직 + escape hatch 제거. TypeScript가 `Omit<A & { atIndex }, "atIndex">`를 `A`로 정확히 추론.

### 3. `WeekChecklistSection.tsx` — 동일 패턴 적용

- **출처**: Warning 1·2·3
- **무엇을**: `restoreCustomChecklistItem` useCallback + `restoreAtIndex<ChecklistItem>(useChecklistStore, ...)`로 교체. `as` 제거.
- **왜**: ChecklistPage와 동일 이유 + 일관성. 두 컴포넌트가 같은 패턴 사용하면 향후 변경 시 한쪽만 빠뜨릴 위험 0.

### 4. `TimelineAccordionCard.tsx` — 동일 패턴 적용

- **출처**: Warning 1·2·3
- **무엇을**: `useCallback` import 추가. `restoreCustomTimelineItem` useCallback + `restoreAtIndex<TimelineItem>(useTimelineStore, ...)`로 교체. `as` 제거.
- **왜**: 동일.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 4개 | 4개 (helper export 추가) |
| splice/clamp 로직 위치 | 3곳 (호출부) | 1곳 (`restoreAtIndex`) |
| 인라인 restoreFn | 3곳 | 0곳 (모두 useCallback) |
| `as` 타입 단언 | 3건 | 0건 |
| `useDeleteWithUndo` 트리거 식별자 | 매 렌더 변경 | 안정 (deps 모두 stable) |

---

## 빌드 결과

성공 (1회 시도). Next 16.2.0 Turbopack, TypeScript 통과.

## 미진행 항목 (Suggestion)

리뷰 §Suggestion 3건은 본 라운드 건드리지 않음:

1. **`aria-label` 컨텍스트 구체화** — 항목명 포함 라벨. 카피 결정 + design.md 갱신 필요라 별도 라운드.
2. **TimelineAccordionCard onClick 인라인 추출** — 추가 핸들러 함수 추출은 컴포넌트 책임 변경 수준이라 보류.
3. **`useDeleteWithUndo<T extends { id: string }>` 시그니처 단순화** — 훅 public interface 변경, 본 스킬 규칙상 별도 결정 라운드 필요.
