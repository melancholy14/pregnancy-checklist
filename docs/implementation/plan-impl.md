# Phase 1.5: 타임라인 + 체크리스트 통합 Implementation

## 완료 조건 충족 여부

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
| 13 | 빌드 성공 (`next build`) | ✅ 완료 | 1회 성공 |
| 14 | 반응형 (모바일/태블릿/데스크톱) | ✅ 완료 | max-w-2xl 컨테이너 유지 |

## 생성/수정 파일 목록

### 신규 생성

- `src/lib/checklist-week-map.ts` — 주차별 체크리스트 그룹핑 유틸 (linked_checklist_ids 우선 + recommendedWeek 보충)
- `src/components/timeline/TimelineAccordionCard.tsx` — Collapsible 아코디언 타임라인 카드 (체크리스트 내장, 커스텀 수정/삭제)
- `src/components/timeline/WeekChecklistSection.tsx` — 주차별 체크리스트 목록 (체크 토글, 인라인 편집, 진행률 바)
- `src/components/timeline/UnifiedAddForm.tsx` — 일정/할 일 통합 추가 폼 (라디오 유형 선택, 주차 필수)
- `src/components/timeline/CategoryFilter.tsx` — 카테고리 필터 칩 (전체/5개 카테고리)
- `docs/implementation/plan-impl.md` — 본 구현 문서

### 수정

- `src/store/useChecklistStore.ts` — `updateCustomItem` 액션 추가
- `src/store/useTimelineStore.ts` — `updateCustomItem` 액션 추가
- `src/components/timeline/TimelineContainer.tsx` — 전면 리팩토링 (체크리스트 통합, 카테고리 필터, 진행률, 기타 섹션)
- `src/app/timeline/page.tsx` — checklistItems 데이터 추가, props 변경
- `src/app/checklist/page.tsx` — `redirect("/timeline")` 처리
- `src/components/layout/BottomNav.tsx` — 6탭 → 4탭 (홈/타임라인/체중/더보기)
- `src/app/page.tsx` — 체크리스트 feature 제거, 링크 /checklist → /timeline 변경

### 삭제

- `src/components/checklist/ChecklistContainer.tsx` — 통합 페이지로 대체
- `src/components/checklist/ChecklistAddForm.tsx` — UnifiedAddForm으로 대체
- `src/components/checklist/ProgressSummary.tsx` — WeekChecklistSection에 인라인화
- `src/components/timeline/TimelineAddForm.tsx` — UnifiedAddForm으로 대체
- `src/components/timeline/TimelineCard.tsx` — TimelineAccordionCard로 대체

## 주요 결정 사항

- **Store 분리 유지**: useChecklistStore와 useTimelineStore를 병합하지 않음. 뷰 레이어에서만 합산. localStorage 키 호환성 유지.
- **Collapsible 사용**: shadcn/ui의 Collapsible 컴포넌트 사용. 접근성(aria-expanded) 내장.
- **recommendedWeek 기반 매핑**: linked_checklist_ids보다 포괄적 (120개 전체 매핑 가능). linked_checklist_ids 우선 적용 후 나머지를 recommendedWeek로 보충.
- **인라인 편집**: 커스텀 항목 수정 시 별도 모달 대신 카드 내 인라인 편집 모드 사용. 모바일 UX에서 컨텍스트 유지.
- **주차 필수 입력**: Phase 1.5부터 체크리스트 추가 시 주차(1~40) 필수. recommendedWeek=0은 Phase 1 레거시 커스텀 항목에만 해당.

## 가정 사항

- "더보기" 탭은 기존 /videos 경로를 가리킴 (PRD에 구체적 명시 없음)
- 카테고리 필터 적용 시 타임라인 카드 자체는 해당 카테고리 체크리스트가 있는 주차만 표시 (PRD: "해당 카테고리 체크리스트가 없는 주차는 숨김 처리")
- ChecklistItem.tsx는 삭제하지 않고 보존 (향후 재사용 가능성)

## 미구현 항목

- E2E 테스트 재작성 (별도 단계에서 진행)
