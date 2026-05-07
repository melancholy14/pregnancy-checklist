# P9 빈 상태 카피·CTA — 리팩토링

> 작성일: 2026-05-07
> review: [docs/review/p9-empty-state-review.md](../review/p9-empty-state-review.md)

## 리팩토링한 파일 목록

- [src/components/checklist/ChecklistPage.tsx](../../src/components/checklist/ChecklistPage.tsx)

---

## 작업별 내용

### 1. ChecklistPage.tsx — `handleToggle` GA4 willCheck 계산을 `effectiveCheckedIds` 기준으로 통일

- **출처**: review.md Warning 1
- **무엇을**: [src/components/checklist/ChecklistPage.tsx:131](../../src/components/checklist/ChecklistPage.tsx#L131) 의 `const willCheck = !checkedIds.includes(item.id);` 를 `effectiveCheckedIds` 기준으로 변경. `useCallback` deps도 `checkedIds` → `effectiveCheckedIds`로 정렬.
- **왜**: `checkedIds`(raw 스토어 값)는 hydration 가드를 통과하지 않은 값입니다. hydration이 늦거나 실패한 순간 사용자 클릭이 들어오면 GA4 `checklist_check.checked` 파라미터가 실제 사용자 인지(UI 상 unchecked)와 불일치하게 보고될 수 있습니다. `effectiveCheckedIds`는 `hydrated ? checkedIds : EMPTY_CHECKED_IDS` 결과라 UI에 노출되는 상태와 동기화되어 측정 정확도가 보장됩니다. 동작은 동일(`toggle(item.id)`은 그대로 raw 액션 호출).

---

## 보류된 Warning

### Warning 2 (ChecklistItemRow 핸들러 메모이제이션) — 본 PR 범위 외 사이드이펙트로 보류

`onToggle={() => handleToggle(item)}` 등 인라인 화살표를 메모이제이션하려면 `ChecklistItemRow`를 `React.memo`로 감싸고 props를 `id` 단위로 재설계해야 효과가 있습니다. `ChecklistItemRow`는 P9 범위 밖 컴포넌트이며 timeline 등 다른 도메인에서도 동일 패턴을 공유합니다. 본 단계에서는 조심스럽게 보류하고, 별도 리팩토링 PR로 일괄 정리 권장.

### Warning 3 (AllDoneBadge `aria-label` + 텍스트 중복) — 트레이드오프로 보류

ARIA 사양상 `aria-label`이 있으면 accessible name 계산에서 자식 텍스트가 무시될 수 있습니다. 그러나:
- `<div>`에 role이 없는 경우, browse-mode 스크린리더는 자식 텍스트를 그대로 읽습니다.
- `aria-label="모든 항목 완료"`는 e2e 테스트의 안정적인 셀렉터(`getByLabel`)로 활용 중입니다.
- 시각적 카피("모든 항목을 챙기셨어요")는 자식 `<span>`에 그대로 보존되어 부드러운 톤이 유지됩니다.

테스트 안정성·시각 카피 보존 ↔ ARIA 사양 엄격 해석 트레이드오프에서, 본 단계는 현재 구조 유지를 선택합니다. 추후 a11y 감사 시 재검토 권장.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 4개 | 4개 |
| 최대 파일 줄 수 | 256줄 (ChecklistPage.tsx) | 256줄 |
| GA4 측정 정확도 | hydration 미반영 가능 | hydration 동기 보장 |

분리·추출 없는 미니멀 리팩토링. 동작 변경 0건, public interface 변경 0건.

---

## 빌드 결과

성공 (1회 시도).
