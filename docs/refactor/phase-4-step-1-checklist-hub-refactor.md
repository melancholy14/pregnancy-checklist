# Phase 4 Step 1 — 체크리스트 허브 리팩토링

> 리뷰 문서: [docs/review/phase-4-step-1-checklist-hub-review.md](../review/phase-4-step-1-checklist-hub-review.md)
> 리팩토링일: 2026-04-29

## 리팩토링한 파일 목록

수정:
- `src/store/createChecklistStore.ts` — `CHECKLIST_STORE_BY_SLUG` 매핑 + `ChecklistStoreSlug` 타입 export
- `src/components/checklist/ChecklistPage.tsx` — 264 줄 → 159 줄 (40% 축소). 카드 행 추출, `EMPTY_CHECKED_IDS` 상수 + `useMemo`, `useCallback(handleToggle)`, store 매핑은 store 모듈에서 import
- `src/components/checklist/ChecklistHub.tsx` — `TimelineCard.baseTotal` 명명 + `customItems.length` 합산
- `src/components/checklist/ChecklistAddForm.tsx` — 빈 `subcategories` 가드 + dev 경고

신규:
- `src/components/checklist/ChecklistItemRow.tsx` (142 줄) — 카드 한 줄 표시·체크·편집·삭제 로직 캡슐화 + `PRIORITY_STYLES` 타입 좁힘

---

## 작업별 내용

### 1. createChecklistStore.ts — 슬러그→스토어 매핑 일원화 (Warning 5)
- **출처**: 리뷰 Warning 5
- **무엇을**: `STORE_BY_SLUG`/`ChecklistStoreSlug`를 스토어 모듈로 이동하고 export. 신규 체크리스트를 추가할 때 store 인스턴스, 매핑, 타입을 한 파일에서 일괄 관리하게 함
- **왜**: 이전에는 같은 매핑이 ChecklistPage.tsx에 별도로 존재해서 신규 체크리스트 추가 시 두 곳을 동시에 수정해야 했고, 빠뜨리면 `STORE_BY_SLUG[slug]`가 `undefined`가 되어 런타임 크래시 위험이 있었음

### 2. ChecklistItemRow.tsx — 카드 행 추출 (Warning 3, 6)
- **출처**: 리뷰 Warning 3, 6
- **무엇을**: ChecklistPage 안의 80여 줄 인라인 카드 렌더링을 독립 컴포넌트로 추출. 동시에 `PRIORITY_STYLES` 타입을 `Record<ChecklistItem['priority'], ...>`로 좁힘. props는 표준 콜백 시그니처(`onToggle`, `onStartEdit`, `onSaveEdit`, `onCancelEdit`, `onChangeEditTitle`, `onRemove`)로 정리
- **왜**: 부모 컴포넌트 가독성·테스트성·재사용성 향상. 체크/편집/삭제 흐름이 한 파일에 모여 있어 향후 수정이 명확해짐. 우선순위 키는 enum 좁힘으로 컴파일 타임 검증 보장

### 3. ChecklistPage.tsx — 효과적인 메모이제이션 + 콜백 안정화 (Warning 2)
- **출처**: 리뷰 Warning 2
- **무엇을**: 모듈 상수 `EMPTY_CHECKED_IDS: string[] = []` + `useMemo`로 `effectiveCheckedIds`의 참조를 안정화. 토글 핸들러를 `useCallback(handleToggle, [checkedIds, toggle, meta.slug])`로 안정화
- **왜**: 향후 `ChecklistProgress`나 `ChecklistItemRow`에 메모이제이션을 추가할 때 부모 prop 참조 변동으로 발생하는 캐시 미스를 사전에 방지

### 4. ChecklistHub.tsx — TimelineCard 진행률 분모 정확화 (Warning 1)
- **출처**: 리뷰 Warning 1
- **무엇을**: `TimelineCard`의 prop을 `total` → `baseTotal`로 명명 변경. 사용자의 커스텀 항목 수를 store에서 읽어 분모에 포함. "체크 항목 N개" 칩은 정적 설명이므로 `baseTotal` 그대로 표시
- **왜**: 사용자가 커스텀 항목을 체크했을 때 `checked > total`이 되어 분수 표시(`155/150`)가 깨지던 표시 버그 수정. 분모가 정확해지면서 진행률 % 의미가 회복됨

### 5. ChecklistAddForm.tsx — 빈 subcategories 도메인 가드 (Warning 4)
- **출처**: 리뷰 Warning 4
- **무엇을**: `subcategories.length === 0`이면 폼을 렌더링하지 않고 dev 환경에서 `console.error`. 이전의 `?? "hospital"` fallback(타임라인 컨텍스트 카테고리로의 잘못된 매핑) 제거
- **왜**: JSON 데이터 작성 오류로 빈 배열이 들어왔을 때 의미 없는 fallback 카테고리로 데이터가 오염되는 것을 차단. dev 경고로 운영 단계에서 발견 가능. Hooks Rules를 지키기 위해 `useState` 호출 후에 가드를 배치(`subcategories[0]?.key ?? ""` 초기값)

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 체크리스트 컴포넌트 파일 수 | 5개 | 6개 (ChecklistItemRow 추가) |
| ChecklistPage.tsx 줄 수 | 264 줄 | 159 줄 (40% ↓) |
| 슬러그→스토어 매핑 위치 | 2곳 (createChecklistStore + ChecklistPage) | 1곳 (createChecklistStore) |
| TimelineCard 진행률 분모 | 베이스만 | 베이스 + 사용자 커스텀 |
| `effectiveCheckedIds` 참조 | 매 렌더 새 배열 | `useMemo` + 상수 sentinel |
| `PRIORITY_STYLES` 타입 | `Record<string, ...>` | `Record<ChecklistItem['priority'], ...>` |
| `ChecklistAddForm` 빈 subcategories | "hospital"로 fallback | dev 경고 + 폼 미렌더링 |

---

## 빌드 결과

성공 (1회). TypeScript 타입 검사 + 26개 정적 페이지 생성 모두 통과.
