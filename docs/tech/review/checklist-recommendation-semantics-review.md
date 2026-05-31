# checklist-recommendation-semantics 코드 리뷰

> 작성일: 2026-05-09
> 관련 산출물: [spec](../../features/checklist-recommendation-semantics/spec.md) · [impl](../implementation/checklist-recommendation-semantics-impl.md)

## 리뷰 대상 파일

- `src/lib/note-classifier.ts` (신규)
- `src/types/checklist.ts` (수정 — JSDoc만)
- `src/components/checklist/ChecklistItemRow.tsx` (수정)
- `src/components/checklist/ChecklistPage.tsx` (수정)
- `src/components/checklist/ChecklistItem.tsx` (삭제)
- `src/components/timeline/TimelineContainer.tsx` (수정)
- `src/components/timeline/TimelineAccordionCard.tsx` (수정)
- `src/components/timeline/WeekChecklistSection.tsx` (수정)

총 8개 파일 (impl.md 기준).

---

## Critical 이슈

**0건.** 즉시 수정 필요한 이슈 없음.

---

## Warning (수정 권장)

### 1. ChecklistItemRow — 우선순위 점 aria-label 이 inner span 에 박혀 스크린리더 인지 불완전

- **위치**: [src/components/checklist/ChecklistItemRow.tsx:112-115](../../../src/components/checklist/ChecklistItemRow.tsx#L112-L115)
- **문제**: 우선순위 점은 `<span aria-label="우선순위 높음">` 형태인데, role 이 없는 span 의 aria-label 은 일부 스크린리더에서 announce 되지 않는다. 게다가 부모 행의 `aria-label="${item.title} 체크"` 가 이미 행 전체의 accessible name 을 정의해 두었으므로, inner span 의 aria-label 이 누락된 정보(우선순위)를 채우지 못한다 — 시각으로만 우선순위가 전달되는 상태.
- **권장 수정**: 행 외곽 `aria-label` 에 우선순위를 합치거나, 별도 sr-only 텍스트 추가.
  ```tsx
  aria-label={`${item.title} (우선순위 ${priority.label}) ${isChecked ? "체크 해제" : "체크"}`}
  // 그리고 inner span 은 aria-hidden="true" 로
  ```
- **심각도 사유**: 즉시 크래시·기능 중단은 없지만 designer §3.1 "접근성은 윤리가 아니라 기능 자체" + spec.md §5 "WCAG AA + 마이크로 라벨 텍스트·아이콘 모두 스크린리더 접근 가능" 정합 위반.

### 2. WeekChecklistSection — Checkbox 가 aria-label 없이 노출

- **위치**: [src/components/timeline/WeekChecklistSection.tsx:175-180](../../../src/components/timeline/WeekChecklistSection.tsx#L175-L180)
- **문제**: `<Checkbox checked={isChecked} ...>` 만 있고 aria-label 없음. ChecklistItemRow 는 `aria-label={...item.title... 체크박스}` 를 명시하지만 WeekChecklistSection 은 누락. 행 외곽 aria-label 이 있어 사용자 경험은 부분적으로 보존되지만 checkbox 단독 포커스 시 anonymous 가 됨.
- **권장 수정**: `aria-label={'${item.title} 체크박스'}` 추가. ChecklistItemRow 와 동일 패턴.
- **참고**: 본 PR 도입 변경분(`aria-pressed`, 행 `aria-label`) 와 함께 정리하면 자연스러움. M1 nested interactive 정정과 함께 별도 작업 가능.

### 3. ChecklistItemRow — `classifyNote(item.note)` 매 렌더마다 재계산 (메모화 부재)

- **위치**: [src/components/checklist/ChecklistItemRow.tsx:79](../../../src/components/checklist/ChecklistItemRow.tsx#L79)
- **문제**: `noteType` 을 매 렌더마다 4개 regex 으로 검사. 노트가 짧고 항목 수가 작아 측정 가능한 성능 비용은 0에 가깝지만, props 가 변하지 않아도 재계산.
- **권장 수정**: `useMemo` 로 감싸거나, `item.note` 가 immutable 이므로 그대로 두어도 무방. 정리하려면:
  ```tsx
  const noteType = useMemo(() => classifyNote(item.note), [item.note]);
  ```
- **심각도 사유**: 사용자 체감 영향 없음. 코드 일관성·미래 확장(노트 길이 ↑) 대비.

### 4. WeekChecklistSection — `handleToggle` 매 렌더 / 매 항목마다 새 클로저 생성

- **위치**: [src/components/timeline/WeekChecklistSection.tsx:84-103](../../../src/components/timeline/WeekChecklistSection.tsx#L84-L103)
- **문제**: `items.map` 내부에서 `handleToggle` 클로저를 생성. 항목 N 개 × 매 렌더 = N 함수 객체. row `<div>` 의 onClick 에만 전달되므로 자식 리렌더 비용은 없지만, 함수 할당 비용 자체.
- **권장 수정**: 외부 `useCallback((item) => () => {...}, [...deps])` 팩토리 또는 핸들러를 컴포넌트 최상위로 끌어올림.
- **참고**: 본 변경 이전 코드도 같은 패턴(toggle 호출만 하는 단순 핸들러 인라인)이라 PR 회귀 아님. 본 PR 에서 핸들러에 GA4 호출 2종 + classifyNote 호출이 추가되어 부담 ↑.

---

## Suggestion (개선 아이디어)

### 1. note-classifier.ts — `LEGAL_PATTERNS` 노출

- **위치**: [src/lib/note-classifier.ts:3-8](../../../src/lib/note-classifier.ts#L3-L8)
- 현재 모듈 private. phase-5 에서 `note_type` 필드 도입 시 필드 우선 + 패턴 폴백 구조로 확장될 때, 패턴 자체를 운영자 수동 클렌징 도구(예: `find-legal-notes.ts` 스크립트) 에서 재사용할 가능성 있음. `export const LEGAL_PATTERNS` 로 노출하면 SoT 확보.

### 2. ChecklistPage / TimelineContainer — `recommendedViewSentRef` 가 due-date 변경에 무반응

- **위치**: [ChecklistPage.tsx:103-115](../../../src/components/checklist/ChecklistPage.tsx#L103-L115), [TimelineContainer.tsx:64-76](../../../src/components/timeline/TimelineContainer.tsx#L64-L76)
- 페이지뷰 1회 가드는 spec 의도지만, 사용자가 같은 세션에서 due-date 변경(P3 onboarding 재진입) 시 currentWeek 이 바뀌어도 view 이벤트 미발사. 페이지 새로고침 전까지 새 주차의 추천 데이터가 누락됨.
- 대안: `currentPregnancyWeek` 변경 시 ref 리셋. 단 락인 룰 §3.6 신호 변형이 아니므로 결정 필요. spec 의 "페이지뷰 당 1회" 해석 — "페이지뷰" = mount 만인지, "주차 cohort 단위" 인지 명확화 필요.

### 3. WeekChecklistSection — `note_type: item.note ? noteType : null` 트림 처리 부재

- **위치**: [WeekChecklistSection.tsx:88-94](../../../src/components/timeline/WeekChecklistSection.tsx#L88-L94), [ChecklistPage.tsx:175-181](../../../src/components/checklist/ChecklistPage.tsx#L175-L181)
- `item.note ? ...` 가 truthy/falsy 체크라 공백만 있는 노트(`"   "`)는 truthy → `note_type: "default"` 로 발사. 현 데이터에 그런 케이스 없지만 악성 입력 또는 향후 트림 누락 시 분포 통계에 noise.
- 대안: `item.note?.trim() ? noteType : null`.

### 4. ChecklistItemRow — `recommended_item_check` count 의미 vs 현재 시점 분리

- ga4.md §2 — `recommended_item_view` 의 `count` 는 "노출 시점 미체크 매칭 수". `recommended_item_check / recommended_item_view` 전환율 계산 시 분모는 view 시점, 분자는 그 이후 체크. 사용자가 view 후 일부 체크 → 분모는 안 변하고 분자만 누적. 의도된 동작이지만 분석 시 혼동 가능 — 운영자 가이드에 1줄 명시 권장.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 4건 (수정 권장 — 다음 단계 /refactor 에서 처리) |
| Suggestion | 4건 (보류) |
| 빌드 | 미실행 (Critical 수정 없음) |

전반 평가: 본 PR 묶음의 코드 품질은 spec/design 정합 + 페어 합의 (A) 결과 모두 반영되어 안정적. M3 정리 + isHighlighted 부활 + classifyNote + GA4 wiring 5축이 깨끗하게 분리됨. 접근성 1건(W1)이 가장 의미 있는 수정 권장 — 우선순위 정보가 시각으로만 전달되는 상태가 spec.md §5 "WCAG AA + 스크린리더 접근" 요구를 부분 미충족.
