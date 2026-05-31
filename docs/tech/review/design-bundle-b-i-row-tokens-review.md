# design-bundle-b-i-row-tokens 코드 리뷰

> 리뷰일: 2026-05-10
> 관련 스펙: [spec.md](../../features/design-bundle-b-i-row-tokens/spec.md)
> 관련 구현 문서: [impl.md](../implementation/design-bundle-b-i-row-tokens-impl.md)

## 리뷰 대상 파일

- [src/lib/data-token-classes.ts](../../../src/lib/data-token-classes.ts) (신규)
- [src/components/checklist/ChecklistRow.tsx](../../../src/components/checklist/ChecklistRow.tsx) (신규)
- [src/components/babyfair/BabyfairCard.tsx](../../../src/components/babyfair/BabyfairCard.tsx) (수정)
- [src/components/timeline/WeekChecklistSection.tsx](../../../src/components/timeline/WeekChecklistSection.tsx) (수정)
- [src/components/checklist/ChecklistItemRow.tsx](../../../src/components/checklist/ChecklistItemRow.tsx) (수정)
- [src/components/checklist/ChecklistPage.tsx](../../../src/components/checklist/ChecklistPage.tsx) (수정)
- [src/components/home/DashboardCard.tsx](../../../src/components/home/DashboardCard.tsx) (수정)
- [src/components/home/HomeContent.tsx](../../../src/components/home/HomeContent.tsx) (수정)

총 8개 프로덕션 소스 파일 (E2E spec + markdown 변경은 리뷰 대상 외).

---

## Critical 이슈 (즉시 수정 완료)

없음. 본 라운드는 row 마크업 정합 + 색 토큰 매핑 분리 위주 리팩터로, 런타임 크래시·보안·잘못된 조건문에 해당하는 이슈가 발견되지 않음.

---

## Warning (수정 권장)

### 1. ChecklistRow.tsx — 편집 버튼이 `onStartEdit` 미정의 상태에서 silent fail
- **위치**: [src/components/checklist/ChecklistRow.tsx:136-143](../../../src/components/checklist/ChecklistRow.tsx#L136-L143)
- **문제**: `<button onClick={onStartEdit}>` 가 `isCustom===true` 분기에서 무조건 렌더되지만 `onStartEdit` prop 은 optional. 호출부가 `isCustom={true}` 만 넘기고 `onStartEdit` 을 누락하면 클릭해도 아무 일도 안 일어나는 silent fail. 같은 영역의 `DeleteConfirmDialog` 는 `{onRemove && <DeleteConfirmDialog ... />}` 가드가 있어 비대칭.
- **권장 수정**: `onStartEdit && <button>...</button>` 패턴으로 가드 추가하거나, 타입을 `isCustom === true → onStartEdit·onRemove 필수` 로 좁히는 discriminated union 으로 변환. 현 호출부 2곳(ChecklistItemRow + WeekChecklistSection) 모두 정상 전달이라 즉시 위험 X.

### 2. WeekChecklistSection.tsx — `noteType`·`categoryToneClassName` 매 렌더 inline 계산
- **위치**: [src/components/timeline/WeekChecklistSection.tsx:165-169](../../../src/components/timeline/WeekChecklistSection.tsx#L165-L169)
- **문제**: `items.map` 안에서 매 렌더마다 `getCategoryTokenClass(item.category)` + `classifyNote(item.note)` 가 실행됨. items 배열이 안정되어 있어 영향은 미미하지만 타임라인 한 카드에 ~20개 항목이 있어 누적 비용 발생 가능.
- **권장 수정**: `useMemo` 로 `items` 별 `(toneClass, noteType)` 튜플을 미리 계산. 단, 두 함수 모두 정적 lookup·정규식으로 cheap 하므로 우선순위 낮음.

### 3. ChecklistRow.tsx — `categoryToneClassName ?? ""` 사실상 도달 불가능 fallback
- **위치**: [src/components/checklist/ChecklistRow.tsx:127](../../../src/components/checklist/ChecklistRow.tsx#L127)
- **문제**: Badge 자체가 `categoryLabel` 있을 때만 렌더되는데, `categoryToneClassName ?? ""` 빈 문자열 fallback 은 호출부 컨벤션상 `categoryLabel` 와 항상 페어로 전달되는 값이라 실제로는 도달 안 됨.
- **권장 수정**: 타입에서 둘을 페어 처리 (`categoryLabel?: string` → `category?: { label: string; toneClassName: string }`) 하면 누락 시 컴파일 에러로 잡힘. 현 구조는 호출부 컨벤션에 의존.

### 4. ChecklistRow.tsx + ChecklistItemRow.tsx — `PRIORITY_LABEL` 중복 정의
- **위치**: [src/components/checklist/ChecklistItemRow.tsx:10-14](../../../src/components/checklist/ChecklistItemRow.tsx#L10-L14), [src/components/timeline/WeekChecklistSection.tsx:14-18](../../../src/components/timeline/WeekChecklistSection.tsx#L14-L18)
- **문제**: 같은 우선순위 레이블 매핑이 두 wrapper 에 중복. `ChecklistRow` 가 priority + priorityLabel 을 둘 다 받는 구조라 우선순위 시각/음성 정합성을 wrapper 가 책임지지만, 매핑 자체는 도메인 상수.
- **권장 수정**: `src/types/checklist.ts` 또는 `src/lib/constants.ts` 에 `PRIORITY_LABEL` named export 로 단일화.

---

## Suggestion (개선 아이디어)

### 1. data-token-classes.ts — 새 도메인 추가 시 lookup table + named export 페어 패턴 강제
DESIGN.md 헌법에 "헬퍼에 named export + lookup table 확장" 규칙이 명시되어 있지만 코드 차원 강제는 없음. 추가 도메인 도입 시 type-level 검증을 위해 `defineTokenLookup<T>(...)` 같은 공통 헬퍼로 감싸는 패턴을 검토할 수 있음.

### 2. ChecklistRow.tsx — `priorityLabel` 자동 도출
현재 wrapper 에서 `priority` + `priorityLabel` 을 둘 다 전달. `priority` 만 받고 내부에서 라벨 자동 도출하면 호출부 단순화 + 라벨 일관성 보장. 단, 다국어 지원 시 호출부 주입이 더 유연하다는 트레이드오프.

### 3. DashboardSlot enum — checklist/timeline 슬롯 사용처 부재
spec 정합성을 위해 `checklist`(pink) + `timeline`(mint) 슬롯을 정의하지만 현재 home 페이지 어디서도 사용하지 않음. 다음 라운드(예: home dashboard CTA 카드 추가)에서 사용 예정이 아니라면 dead code 가능. 사용처 추가 또는 주석으로 의도 명시 검토.

### 4. WeekChecklistSection.tsx — 편집 form 분기 복잡도
ChecklistRow 추출로 row 영역은 깔끔해졌지만 편집 form 분기(20+ 라인 inline JSX)가 wrapper 본체에 그대로 남아있음. 다음 라운드에서 `<EditableChecklistRow>` 또는 `<ChecklistEditForm>` 로 분리하면 wrapper 가 toggle/edit/save 흐름만 다루게 됨.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 4건 |
| Suggestion | 4건 |
| 빌드 | 미실행 (Critical 없음) |

본 라운드는 spec 의 의도(row WCAG 정합 + 데이터→토큰 헬퍼 도입) 가 명확하고 변경 면적도 잘 격리되어 있어 즉시 차단 이슈가 없음. Warning 항목들은 후속 리팩터 라운드(`/refactor`) 에서 일괄 정리 가능.
