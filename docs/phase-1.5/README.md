# Phase 1.5: 타임라인 + 체크리스트 통합

> 작성일: 2026-04-02 | 업데이트: 2026-04-03 | 작성자: Claude Code

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
| 9 | 커스텀 항목 삭제 동작 | ✅ 완료 | DeleteConfirmDialog 사용 |
| 10 | `/checklist` → `/timeline` 리다이렉트 | ✅ 완료 | Next.js redirect() |
| 11 | 네비게이션 5탭 구성 (홈/타임라인/베이비페어/체중/영상) | ✅ 완료 | 홈 Feature Grid과 일치 |
| 12 | 네비게이션 라벨이 홈 Feature Grid과 일치 | ✅ 완료 | 아이콘 active 색상 포함 |
| 13 | 행정 준비 카테고리 선택 시 지자체 확인 안내 문구 표시 | ✅ 완료 | 카테고리 필터 하단 안내 |
| 14 | 커스텀 항목 삭제 시 확인 다이얼로그 표시 | ✅ 완료 | shadcn AlertDialog |
| 15 | 대시보드 "이번 주 할 일"에 커스텀 타임라인 항목 포함 | ✅ 완료 | customTimelineItems 합산 |
| 16 | 기존 localStorage 데이터 호환 | ✅ 완료 | Store 키/스키마 변경 없음 |
| 17 | 빌드 성공 (`next build`) | ✅ 완료 | |
| 18 | 반응형 (모바일/태블릿/데스크톱) | ✅ 완료 | max-w-2xl 컨테이너 유지 |

### 생성/수정 파일

**신규 (7개)**
- `src/lib/checklist-week-map.ts` — 주차별 체크리스트 그룹핑 유틸
- `src/lib/constants.ts` — CATEGORY_OPTIONS 공유 상수
- `src/components/timeline/TimelineAccordionCard.tsx` — 아코디언 타임라인 카드
- `src/components/timeline/WeekChecklistSection.tsx` — 주차별 체크리스트 섹션
- `src/components/timeline/UnifiedAddForm.tsx` — 일정/할 일 통합 추가 폼
- `src/components/timeline/CategoryFilter.tsx` — 카테고리 필터 칩
- `src/components/timeline/DeleteConfirmDialog.tsx` — 삭제 확인 다이얼로그 (공용)

**수정 (7개)**
- `src/store/useChecklistStore.ts` — `updateCustomItem` 액션 추가
- `src/store/useTimelineStore.ts` — `updateCustomItem` 액션 추가
- `src/components/timeline/TimelineContainer.tsx` — 전면 리팩토링 + 행정 준비 안내 문구
- `src/app/timeline/page.tsx` — checklistItems 데이터 추가
- `src/app/checklist/page.tsx` — redirect 처리
- `src/components/layout/BottomNav.tsx` — 5탭 재구성 (홈/타임라인/베이비페어/체중/영상)
- `src/app/page.tsx` — 커스텀 타임라인 대시보드 반영

**삭제 (5개)**
- `ChecklistContainer.tsx`, `ChecklistAddForm.tsx`, `ProgressSummary.tsx`, `TimelineAddForm.tsx`, `TimelineCard.tsx`

### 주요 결정 사항

- **Store 분리 유지**: useChecklistStore와 useTimelineStore를 병합하지 않음. localStorage 키 호환성 유지.
- **Collapsible 사용**: shadcn/ui Collapsible 컴포넌트. 접근성(aria-expanded) 내장.
- **recommendedWeek 기반 매핑**: linked_checklist_ids 우선(17/22개), recommendedWeek로 보충.
- **인라인 편집**: 별도 모달 대신 카드 내 인라인 편집 모드. 모바일 UX 컨텍스트 유지.
- **주차 필수 입력**: Phase 1.5부터 체크리스트 추가 시 주차(1~40) 필수.
- **카테고리 필터 숨김**: 필터 적용 시 해당 카테고리 체크리스트가 없는 주차는 타임라인 카드째 숨김 (노이즈 감소).

---

## 기획 검증 후 보완 (2026-04-03)

Phase 1.5 기본 구현 완료 후 기획 검증에서 발견된 5가지 보완 사항을 반영했다.

### 보완 항목

| # | 항목 | 변경 내용 |
|---|------|----------|
| 1 | **네비게이션 "더보기" → "영상"** | 라벨: "더보기" → "영상", 아이콘: Ellipsis → Video. 대시보드 Feature Grid과 맥락 통일 |
| 2 | **베이비페어 탭 추가** | 네비게이션 4탭 → 5탭 (홈/타임라인/베이비페어/체중/영상). 홈에만 있던 베이비페어 진입점 확보 |
| 3 | **행정 준비 지자체 안내** | "행정 준비" 카테고리 필터 선택 시 "거주 지자체에 따라 다를 수 있습니다" 안내 문구 표시 |
| 4 | **삭제 확인 다이얼로그** | 커스텀 항목 삭제 시 즉시 삭제 → AlertDialog로 확인 후 삭제. 실수 방지 |
| 5 | **대시보드 커스텀 타임라인 반영** | 홈 "이번 주 할 일"에 `useTimelineStore.customItems`도 합산 |

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

없음.

### Warning (리팩토링에서 해결)

1. **window.confirm → AlertDialog** — 접근성 개선. `DeleteConfirmDialog` 공용 컴포넌트 추출
2. **BottomNav 아이콘 active 색상** — `color` prop으로 active/inactive 색상 명시
3. **hasFilteredChecklist 최적화** — useCallback → useMemo `Set<number>`로 O(1) 조회

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 3건 (모두 리팩토링에서 해결) |

---

## 리팩토링 내용

### 작업 목록

1. **DeleteConfirmDialog 공용 컴포넌트** — `window.confirm` → shadcn AlertDialog. 2개 파일에서 재사용.
2. **BottomNav 아이콘 색상** — active: `#3D4447`, inactive: `#9CA0A4` 명시
3. **filteredWeekSet useMemo** — `hasFilteredChecklist` useCallback → `filteredWeekSet` useMemo Set으로 변경. 매 렌더 O(n×m) → 1회 계산 후 O(1) 조회.
4. **CATEGORY_OPTIONS 공유 상수** — 3개 파일 중복 → `src/lib/constants.ts` 1곳으로 통합 (이전 리팩토링)
5. **WeekChecklistSection 접근성** — div onClick에 role="button", tabIndex, onKeyDown 추가 (이전 리팩토링)

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 삭제 확인 | `window.confirm()` | `DeleteConfirmDialog` (AlertDialog) |
| 네비게이션 아이콘 | strokeWidth만 변경 | strokeWidth + color 변경 |
| 카테고리 필터 조회 | useCallback O(n) per card | useMemo Set O(1) per card |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path (plan.spec.ts) | ✅ 14개 passed |
| Error / Validation (plan.spec.ts) | ✅ 4개 passed |
| 리다이렉트 / 네비게이션 (plan.spec.ts) | ✅ 3개 passed |
| 반응형 Mobile 375px (plan.spec.ts) | ✅ 3개 passed |
| 홈 페이지 (home.spec.ts) | ✅ 9개 passed |
| 네비게이션 (navigation.spec.ts) | ✅ 2개 passed |
| 타임라인 (timeline.spec.ts) | ✅ 7개 passed |
| 베이비페어 (baby-fair.spec.ts) | ✅ 9개 passed |
| 체중 기록 (weight.spec.ts) | ✅ 7개 passed |
| 영상 (videos.spec.ts) | ✅ 4개 passed |
| 개인정보/약관 (privacy-terms.spec.ts) | ✅ 5개 passed |
| 체크리스트 리다이렉트 (checklist.spec.ts) | ✅ 1개 passed |
| 기존 실패 테스트 수정 (baby-fair, privacy-terms) | ✅ 수정 완료 |
| **전체** | **71 passed / 0 failed** |

📊 상세 리포트: `playwright-report/index.html`
