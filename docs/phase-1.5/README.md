# Phase 1.5: 타임라인 + 체크리스트 통합

> 작성일: 2026-04-02 | 작성자: Claude Code

## 개요

Phase 1에서 별도 페이지로 구현된 타임라인(`/timeline`)과 체크리스트(`/checklist`)를 하나의 통합 페이지로 병합한다. 사용자가 "28주에 뭘 준비해야 하지?"에 답을 얻으려면 2개 페이지를 오가야 했던 문제를 해결하고, `TimelineItem.linked_checklist_ids`와 `ChecklistItem.recommendedWeek` 데이터 연결을 UI에서 활용한다.

---

## 구현 내용

### 완료 조건 충족 여부

| # | 조건 | 상태 | 비고 |
|---|------|------|------|
| 1 | `/timeline`에서 주차별 타임라인 + 체크리스트 아코디언 동작 | ✅ 완료 | Collapsible 기반 아코디언 |
| 2 | 현재 주차 카드 자동 펼침 + 스크롤 | ✅ 완료 | defaultOpen + scrollIntoView |
| 3 | 체크리스트 체크/해제가 통합 페이지에서 정상 동작 | ✅ 완료 | useChecklistStore.toggle 재사용 |
| 4 | 전체/주차별 진행률 표시 | ✅ 완료 | 상단 전체 + 카드 내부 주차별 |
| 5 | 카테고리 필터 동작 | ✅ 완료 | CategoryFilter 칩 UI |
| 6 | 통합 추가 폼으로 일정/할 일 추가 | ✅ 완료 | UnifiedAddForm (라디오 유형 선택) |
| 7 | 체크리스트 추가 시 주차 입력 필수 | ✅ 완료 | 1~40 범위 유효성 검사 |
| 8 | 커스텀 항목 수정 동작 | ✅ 완료 | 인라인 편집 (타임라인/체크리스트 각각) |
| 9 | 커스텀 항목 삭제 동작 | ✅ 완료 | 기존 removeCustomItem 재사용 |
| 10 | `/checklist` → `/timeline` 리다이렉트 | ✅ 완료 | Next.js redirect() |
| 11 | 네비게이션 4탭 구성 | ✅ 완료 | 홈/타임라인/체중/더보기 |
| 12 | 기존 localStorage 데이터 호환 | ✅ 완료 | Store 키/스키마 변경 없음 |
| 13 | 빌드 성공 (`next build`) | ✅ 완료 | |
| 14 | 반응형 (모바일/태블릿/데스크톱) | ✅ 완료 | max-w-2xl 컨테이너 유지 |

### 생성/수정 파일

**신규 (6개)**
- `src/lib/checklist-week-map.ts` — 주차별 체크리스트 그룹핑 유틸
- `src/lib/constants.ts` — CATEGORY_OPTIONS 공유 상수 (리팩토링에서 추가)
- `src/components/timeline/TimelineAccordionCard.tsx` — 아코디언 타임라인 카드
- `src/components/timeline/WeekChecklistSection.tsx` — 주차별 체크리스트 섹션
- `src/components/timeline/UnifiedAddForm.tsx` — 일정/할 일 통합 추가 폼
- `src/components/timeline/CategoryFilter.tsx` — 카테고리 필터 칩

**수정 (7개)**
- `src/store/useChecklistStore.ts` — `updateCustomItem` 액션 추가
- `src/store/useTimelineStore.ts` — `updateCustomItem` 액션 추가
- `src/components/timeline/TimelineContainer.tsx` — 전면 리팩토링
- `src/app/timeline/page.tsx` — checklistItems 데이터 추가
- `src/app/checklist/page.tsx` — redirect 처리
- `src/components/layout/BottomNav.tsx` — 6탭 → 4탭
- `src/app/page.tsx` — 체크리스트 feature 제거, 링크 변경

**삭제 (5개)**
- `ChecklistContainer.tsx`, `ChecklistAddForm.tsx`, `ProgressSummary.tsx`, `TimelineAddForm.tsx`, `TimelineCard.tsx`

### 주요 결정 사항

- **Store 분리 유지**: useChecklistStore와 useTimelineStore를 병합하지 않음. localStorage 키 호환성 유지.
- **Collapsible 사용**: shadcn/ui Collapsible 컴포넌트. 접근성(aria-expanded) 내장.
- **recommendedWeek 기반 매핑**: linked_checklist_ids 우선, recommendedWeek로 보충. 120개 전체 매핑 가능.
- **인라인 편집**: 별도 모달 대신 카드 내 인라인 편집 모드. 모바일 UX 컨텍스트 유지.
- **주차 필수 입력**: Phase 1.5부터 체크리스트 추가 시 주차(1~40) 필수.

### 가정 사항 및 미구현 항목

- "더보기" 탭은 기존 /videos 경로 (PRD에 구체적 명시 없음)
- 카테고리 필터 시 해당 카테고리 체크리스트가 없는 주차는 숨김
- ChecklistItem.tsx는 삭제하지 않고 보존 (향후 재사용 가능성)

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

없음.

### Warning (수정 권장 → 리팩토링에서 해결)

1. **WeekChecklistSection.tsx** — `<div onClick>` 접근성 패턴 → role/tabIndex/onKeyDown 추가로 해결
2. **TimelineContainer.tsx** — `getFilteredChecklist` 매 렌더 재생성 → useCallback 안정화로 해결
3. **TimelineContainer.tsx** — `getStatus`/`hasFilteredChecklist` 매 렌더 재생성 → useCallback 안정화로 해결

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 3건 (모두 리팩토링에서 해결) |
| Suggestion | 2건 (CATEGORY_OPTIONS 중복 해결, setTimeout 유지) |

---

## 리팩토링 내용

### 작업 목록

1. **CATEGORY_OPTIONS 공유 상수 추출** — 3개 파일 중복 → `src/lib/constants.ts` 1곳으로 통합
2. **WeekChecklistSection 접근성 개선** — div onClick에 role="button", tabIndex, onKeyDown 추가
3. **TimelineContainer getFilteredChecklist** — useCallback으로 래핑 (activeCategory 의존)
4. **TimelineContainer getStatus/hasFilteredChecklist** — useCallback으로 래핑

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| CATEGORY_OPTIONS 정의 위치 | 3개 파일 각각 | `src/lib/constants.ts` 1곳 |
| 접근성 키보드 지원 | div onClick만 | role + tabIndex + onKeyDown |
| 렌더 함수 재생성 | 3개 함수 매 렌더 재생성 | useCallback으로 안정화 |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 10개 passed |
| Error / Validation | ✅ 4개 passed |
| 리다이렉트 / 네비게이션 | ✅ 3개 passed |
| 반응형 (Mobile 375px) | ✅ 3개 passed |
| **전체** | **22 passed / 0 failed** |

📊 상세 리포트: `playwright-report/index.html`
