# checklist-recommendation-semantics 리팩토링

> 작성일: 2026-05-09
> 관련 산출물: [review](../review/checklist-recommendation-semantics-review.md) · [impl](../implementation/checklist-recommendation-semantics-impl.md)

## 리팩토링한 파일 목록

- `src/components/checklist/ChecklistItemRow.tsx`
- `src/components/timeline/WeekChecklistSection.tsx`

---

## 작업별 내용

### 1. ChecklistItemRow.tsx — 우선순위 정보 a11y 정정 + classifyNote 메모화

- **출처**: review.md Warning #1, #3
- **무엇을**:
  - 우선순위 점 inner span 의 `aria-label` 제거 → `aria-hidden="true"` 로 교체.
  - 행 외곽 `aria-label` 에 우선순위 합침: `${item.title} (우선순위 ${priority.label}) ${...}`.
  - `classifyNote(item.note)` 호출을 `useMemo` 로 감쌈 (`[item.note]` 의존). `useMemo` import 추가.
- **왜**: role 없는 span 의 aria-label 은 일부 스크린리더에서 announce 안 됨. 외곽 라벨 한 줄로 합치면 스크린리더 사용자가 우선순위까지 한 번에 인지. designer §3.1 + spec.md §5 WCAG AA 정합. classifyNote 메모화는 향후 노트 길이 ↑ 대비 안전망 (현재 비용은 무시 가능 수준).

### 2. WeekChecklistSection.tsx — Checkbox aria-label + handleToggleItem 팩토리 추출

- **출처**: review.md Warning #2, #4
- **무엇을**:
  - `<Checkbox>` 에 `aria-label={'${item.title} 체크박스'}` 추가 (ChecklistItemRow 와 동일 패턴).
  - `items.map` 내부에 인라인되어 있던 `handleToggle` 클로저를 컴포넌트 최상위 `useCallback` 팩토리(`handleToggleItem(item)`) 로 추출. `useCallback` import 추가.
  - 행의 `onClick`/`onKeyDown` 을 `() => handleToggleItem(item)` 형태로 호출.
- **왜**: Checkbox 단독 포커스 시 anonymous 회피. 핸들러 팩토리화로 row 당 인라인 클로저 생성을 컴포넌트 단위 1개 useCallback 으로 축소 (메모리 + GA 호출 함수 인라인 비용 감소). 동작은 그대로.

### 스킵

- 추가 판단 항목(중복·큰 컴포넌트·불필요한 메모) — 없음. 본 PR 변경분 8개 파일은 책임 분리 + 메모화가 이미 적절. WeekChecklistSection 235줄 / ChecklistItemRow 160줄 은 edit-mode 폼이 차지하는 부분이라 분리 가치 낮음 (별도 작업으로도 가능).
- review.md Suggestion 4건 — 모두 보류 (LEGAL_PATTERNS 노출, view ref 정책, 트림 처리, count 의미) — refactor 범위 밖 의사결정 필요.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 8개 (변경분) | 8개 (동일) |
| ChecklistItemRow 줄 수 | 160 | 161 (useMemo 1줄 +) |
| WeekChecklistSection 줄 수 | 235 | 240 (useCallback 팩토리 +) |
| `aria-label` 미보유 인터랙티브 | 1곳 (timeline checkbox) | 0곳 |
| 행별 클로저 생성 | items.length 개 / 렌더 | 0개 (팩토리 1개로 통합) |
| 동작 변경 | — | 없음 (e2e 13/13 그대로 통과) |

---

## 빌드 결과

성공 (1회 시도). e2e 회귀 검증 13/13 통과.
