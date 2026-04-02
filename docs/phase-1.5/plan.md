# Phase 1.5: 타임라인 + 체크리스트 통합 — Development Plan

> Generated from: Phase 1 구현 결과 분석 + 기획 검증
> Phase 1 기록: [plan.md](../phase-1/plan.md), [README.md](../plan/README.md)
> Date: 2026-04-02
> Status: 📋 기획 완료

---

## Overview

Phase 1에서 별도 페이지로 구현된 **타임라인**(`/timeline`)과 **체크리스트**(`/checklist`)를 **하나의 통합 페이지**로 병합한다.

### 왜 통합하는가

| 문제 | 근거 |
|------|------|
| **정보 분절** | 사용자가 "28주에 뭘 준비해야 하지?"에 답을 얻으려면 타임라인과 체크리스트 2개 페이지를 오가야 함 |
| **데이터 연결 미활용** | `TimelineItem.linked_checklist_ids`와 `ChecklistItem.recommendedWeek`가 이미 존재하나 UI에서 전혀 사용되지 않음 |
| **중복 UX** | 두 페이지 모두 "현재 주차 하이라이트", "커스텀 항목 추가/삭제", "DueDateBanner" 등 동일 패턴 반복 |
| **네비게이션 비효율** | 하단 네비 5개 탭 중 2개가 유사 기능에 사용됨 → 통합 시 1개 탭 확보 가능 |

### 핵심 원칙

- **Store는 분리 유지** — `useChecklistStore`, `useTimelineStore` 각각 독립. 뷰 레이어에서만 합산.
- **기존 데이터 구조 변경 없음** — JSON, 타입 정의 그대로 사용.
- **Static Export 유지** — API Routes 없음, LocalStorage 기반 (Phase 1과 동일).

---

## AS-IS → TO-BE

| 항목 | AS-IS (Phase 1) | TO-BE (Phase 1.5) |
|------|-----------------|-------------------|
| **페이지** | `/checklist` + `/timeline` 별도 | `/timeline` 단일 페이지 |
| **타임라인 UI** | 주차별 카드 (읽기 전용) | 주차별 카드 + **아코디언으로 체크리스트 펼침** |
| **체크리스트 UI** | 카테고리 탭 기반 목록 | 타임라인 카드 내부에 주차별로 그룹핑 |
| **체크 기능** | 체크리스트 페이지에서만 가능 | 타임라인 카드 내부에서 직접 체크 |
| **커스텀 추가** | 각 페이지에서 별도 폼 | 통합 폼 (유형 선택: 일정/할 일) |
| **수정 기능** | 없음 | 커스텀 항목 수정 가능 (신규) |
| **삭제 기능** | 커스텀 항목만 삭제 | 동일 (커스텀 항목만 삭제) |
| **네비게이션** | 5개 탭 (홈/체크리스트/타임라인/체중/더보기) | 4개 탭 (홈/타임라인/체중/더보기) |
| **카테고리 뷰** | 카테고리별 탭 필터 | 타임라인 상단 필터 (카테고리/전체) |

---

## Scope

**In scope:**

- 타임라인 + 체크리스트 통합 페이지 (`/timeline`)
- 타임라인 카드 아코디언 (클릭 시 체크리스트 펼침/접힘)
- 현재 주차 카드 자동 펼침 + 스크롤
- 체크리스트 주차별 그룹핑 (`recommendedWeek` 기반)
- 통합 추가 폼 (일정/할 일 유형 선택)
- 체크리스트 추가 시 주차 입력 필수
- 커스텀 항목 수정 기능 (제목, 주차, 설명, 카테고리)
- 카테고리 필터 (보조 뷰)
- `/checklist` → `/timeline` 리다이렉트
- 하단 네비게이션 탭 재구성
- 기존 E2E 테스트 재작성

**Out of scope:**

- Store 통합/병합 (기존 Store 그대로 유지)
- 데이터 JSON 구조 변경
- 타입 정의 변경
- 기본(정적) 항목 수정/삭제

---

## Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Store 전략 | 분리 유지 + 뷰 합산 | 마이그레이션 불필요. localStorage 키 호환. 기존 사용자 데이터 보존. |
| 아코디언 구현 | shadcn/ui `Collapsible` | 이미 설치된 UI 라이브러리. 접근성 내장 (aria-expanded). |
| 체크리스트 매핑 | `recommendedWeek` 기준 그룹핑 | `linked_checklist_ids`보다 포괄적 (120개 전체 매핑 가능). |
| 커스텀 항목 수정 | Store에 `updateCustomItem` 액션 추가 | 최소 변경. persist 미들웨어 호환. |
| `/checklist` 처리 | Next.js `redirect()` | 북마크/외부 링크 호환. SEO 301 리다이렉트. |
| 카테고리 필터 | 타임라인 상단 필터 칩 | 별도 페이지 없이 인라인 필터로 카테고리 뷰 유지. |

---

## Data Flow

### 주차별 체크리스트 매핑 로직

```ts
// 타임라인 카드별로 체크리스트를 그룹핑
function getChecklistByWeek(
  timelineItems: TimelineItem[],
  checklistItems: ChecklistItem[],
  customChecklistItems: ChecklistItem[]
): Map<number, ChecklistItem[]> {
  const allChecklist = [...checklistItems, ...customChecklistItems];
  const weekMap = new Map<number, ChecklistItem[]>();

  // 1) linked_checklist_ids가 있으면 우선 사용
  for (const timeline of timelineItems) {
    if (timeline.linked_checklist_ids?.length) {
      const linked = allChecklist.filter(c =>
        timeline.linked_checklist_ids!.includes(c.id)
      );
      const existing = weekMap.get(timeline.week) ?? [];
      weekMap.set(timeline.week, [...existing, ...linked]);
    }
  }

  // 2) recommendedWeek 기반으로 나머지 매핑
  for (const item of allChecklist) {
    if (item.recommendedWeek === 0) continue; // 주차 미지정 커스텀 항목
    const weekItems = weekMap.get(item.recommendedWeek) ?? [];
    if (!weekItems.find(w => w.id === item.id)) {
      weekMap.set(item.recommendedWeek, [...weekItems, item]);
    }
  }

  return weekMap;
}
```

### 주차 미지정 체크리스트 처리

`recommendedWeek === 0`인 커스텀 항목은 **"기타" 섹션**으로 타임라인 최하단에 별도 표시.
Phase 1.5에서 체크리스트 추가 시 주차 입력이 필수이므로, 이 케이스는 Phase 1에서 생성된 기존 커스텀 항목에만 해당.

---

## UI Specification

### 1. 통합 타임라인 페이지 (`/timeline`)

```
┌─────────────────────────────────┐
│ 📅 타임라인          [+ 추가]   │
├─────────────────────────────────┤
│ [필터: 전체 | 병원 | 출산가방 | │
│  신생아 | 산후 | 행정]          │
├─────────────────────────────────┤
│                                 │
│ ● 4주 — 임신 확인 후 기본 일정  │  ← 지난 주차 (흐림)
│   ▸ 체크리스트 2개              │  ← 접힌 상태
│                                 │
│ ● 8주 — 산전 검사 시작          │
│   ▸ 체크리스트 3개              │
│                                 │
│ ◉ 28주 — 출산가방 준비 시작     │  ← 현재 주차 (하이라이트)
│   ▾ 체크리스트 5개              │  ← 자동 펼침
│   ┌───────────────────────────┐ │
│   │ ☑ 산모용 속옷       [병원]│ │
│   │ ☐ 수유 브라         [병원]│ │
│   │ ☐ 젖병 소독기     [신생아]│ │
│   │ ☑ 기저귀 (신생아용)[신생아]│ │
│   │ ☐ 출생신고서 양식   [행정]│ │
│   │ 진행률: ████░░ 2/5 (40%)  │ │
│   └───────────────────────────┘ │
│                                 │
│ ○ 30주 — 신생아 케어 학습       │  ← 미래 주차
│   ▸ 체크리스트 4개              │
│                                 │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│ 📦 기타 (주차 미지정)           │  ← recommendedWeek === 0
│   ☐ 내가 추가한 항목           │
│                                 │
└─────────────────────────────────┘
```

### 2. 아코디언 동작

| 상태 | 동작 |
|------|------|
| **현재 주차** | 페이지 로드 시 자동 펼침 + 스크롤 |
| **다른 주차** | 접힌 상태. 클릭 시 토글 |
| **체크리스트 없는 주차** | 아코디언 비활성. "준비 항목 없음" 텍스트 |
| **복수 펼침** | 여러 카드 동시 펼침 가능 (독립 토글) |

### 3. 통합 추가 폼

```
┌─────────────────────────────────┐
│ 새 항목 추가                    │
├─────────────────────────────────┤
│ 유형:  ○ 일정(타임라인)         │
│        ● 할 일(체크리스트)      │
│                                 │
│ 주차:  [▼ 28주              ]   │  ← 공통 (필수)
│                                 │
│ 카테고리: [▼ 출산 가방      ]   │  ← 체크리스트일 때만 노출
│                                 │
│ 제목:  [____________________]   │  ← 공통 (필수)
│                                 │
│ 설명:  [____________________]   │  ← 타임라인일 때만 노출
│                                 │
│        [취소]  [추가하기]       │
└─────────────────────────────────┘
```

### 4. 수정 폼

커스텀 항목의 카드/체크리스트 옆 **편집 아이콘** 클릭 시 인라인 편집 모드 진입.

- 타임라인 커스텀: 주차, 제목, 설명 수정 가능
- 체크리스트 커스텀: 주차, 카테고리, 제목 수정 가능
- 기본 항목: 편집 아이콘 미표시 (read-only)

### 5. 카테고리 필터

타임라인 상단 필터 칩으로 카테고리별 체크리스트 필터링:

- **전체**: 모든 체크리스트 표시 (기본값)
- **병원 준비 / 출산 가방 / 신생아 준비물 / 산후 준비 / 행정 준비**: 해당 카테고리만 표시
- 필터 적용 시 해당 카테고리 체크리스트가 없는 주차는 숨김 처리
- 타임라인 카드 자체는 항상 표시 (체크리스트만 필터)

### 6. 진행률 표시

| 위치 | 표시 내용 |
|------|----------|
| 페이지 상단 | 전체 진행률 바 (체크된 수 / 전체 수) |
| 각 주차 카드 접힌 상태 | "체크리스트 N개" + 완료 수 (예: "3/5 완료") |
| 각 주차 카드 펼친 상태 | 하단에 주차별 진행률 바 |

### 7. 네비게이션 변경

| AS-IS | TO-BE |
|-------|-------|
| 홈 / 체크리스트 / 타임라인 / 체중 / 더보기 | 홈 / 타임라인 / 체중 / 더보기 |

- 4개 탭으로 축소
- "타임라인" 탭 아이콘/라벨은 기존 타임라인과 동일

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/components/timeline/TimelineAccordionCard.tsx` | 아코디언 기능이 있는 타임라인 카드 (체크리스트 포함) |
| `src/components/timeline/WeekChecklistSection.tsx` | 주차별 체크리스트 섹션 (체크 토글, 진행률) |
| `src/components/timeline/UnifiedAddForm.tsx` | 통합 추가 폼 (일정/할 일 유형 선택) |
| `src/components/timeline/CategoryFilter.tsx` | 카테고리 필터 칩 |
| `src/lib/checklist-week-map.ts` | 주차별 체크리스트 매핑 유틸리티 |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/timeline/page.tsx` | 체크리스트 데이터 import 추가, 통합 컨테이너 props 전달 |
| `src/app/checklist/page.tsx` | `/timeline`으로 redirect 처리 |
| `src/components/timeline/TimelineContainer.tsx` | 아코디언 카드 사용, 카테고리 필터, 통합 폼 연동 |
| `src/store/useChecklistStore.ts` | `updateCustomItem` 액션 추가 |
| `src/store/useTimelineStore.ts` | `updateCustomItem` 액션 추가 |
| `src/components/layout/Navigation.tsx` | 체크리스트 탭 제거, 4탭 구성 |
| `src/app/page.tsx` | 홈 대시보드 체크리스트 링크 → `/timeline`로 변경 |

### Deleted Files

| File | Reason |
|------|--------|
| `src/components/checklist/ChecklistContainer.tsx` | 통합 페이지로 대체 |
| `src/components/checklist/ChecklistAddForm.tsx` | 통합 폼으로 대체 |
| `src/components/checklist/ProgressSummary.tsx` | WeekChecklistSection에 인라인화 |
| `src/components/timeline/TimelineAddForm.tsx` | 통합 폼으로 대체 |
| `src/components/timeline/TimelineCard.tsx` | TimelineAccordionCard로 대체 |

### Preserved Files (변경 없음)

| File | Reason |
|------|--------|
| `src/components/checklist/ChecklistItem.tsx` | 그대로 재사용 (WeekChecklistSection 내부) |
| `src/store/useChecklistStore.ts` | 기존 상태 유지 (액션만 추가) |
| `src/store/useTimelineStore.ts` | 기존 상태 유지 (액션만 추가) |
| `src/data/checklist_items.json` | 변경 없음 |
| `src/data/timeline_items.json` | 변경 없음 |
| `src/types/checklist.ts` | 변경 없음 |
| `src/types/timeline.ts` | 변경 없음 |

---

## Store Changes

### useChecklistStore — 액션 추가

```ts
// 추가할 액션
updateCustomItem: (id: string, updates: Partial<Omit<ChecklistItem, 'id' | 'isCustom'>>) => void
```

```ts
updateCustomItem: (id, updates) =>
  set((state) => ({
    customItems: state.customItems.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  })),
```

### useTimelineStore — 액션 추가

```ts
// 추가할 액션
updateCustomItem: (id: string, updates: Partial<Omit<TimelineItem, 'id' | 'isCustom'>>) => void
```

```ts
updateCustomItem: (id, updates) =>
  set((state) => ({
    customItems: state.customItems.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  })),
```

---

## Implementation Steps

| Step | 내용 | 의존성 |
|------|------|--------|
| 1 | `checklist-week-map.ts` 유틸리티 작성 | 없음 |
| 2 | Store에 `updateCustomItem` 액션 추가 | 없음 |
| 3 | `CategoryFilter.tsx` 컴포넌트 작성 | 없음 |
| 4 | `WeekChecklistSection.tsx` 작성 (체크 토글 + 진행률) | Step 1 |
| 5 | `TimelineAccordionCard.tsx` 작성 (아코디언 + 체크리스트) | Step 4 |
| 6 | `UnifiedAddForm.tsx` 작성 (일정/할 일 통합 폼) | Step 2 |
| 7 | `TimelineContainer.tsx` 리팩토링 (아코디언 카드, 필터, 통합 폼) | Step 3, 5, 6 |
| 8 | `timeline/page.tsx` 수정 (체크리스트 데이터 합류) | Step 7 |
| 9 | `checklist/page.tsx` → redirect 처리 | Step 8 |
| 10 | `Navigation.tsx` 4탭 재구성 | Step 9 |
| 11 | `page.tsx` (홈) 링크 수정 | Step 10 |
| 12 | 삭제 대상 파일 정리 | Step 11 |
| 13 | E2E 테스트 재작성 | Step 12 |

---

## Migration & 호환성

### 기존 사용자 데이터

- **checklist-storage** (localStorage): 그대로 유지. `checkedIds`, `customItems` 그대로 읽힘.
- **timeline-storage** (localStorage): 그대로 유지. `customItems` 그대로 읽힘.
- **Phase 1에서 만든 커스텀 체크리스트** (`recommendedWeek: 0`): "기타" 섹션에 표시.
- **Store 버전**: persist `version` 추가 불필요 (스키마 호환).

### URL 호환

- `/timeline` → 그대로 동작 (통합 페이지)
- `/checklist` → `/timeline`로 301 리다이렉트
- 홈 대시보드의 체크리스트 바로가기 → `/timeline`로 변경

---

## 완료 조건

| # | 조건 | 검증 방법 |
|---|------|----------|
| 1 | `/timeline`에서 주차별 타임라인 + 체크리스트 아코디언 동작 | E2E |
| 2 | 현재 주차 카드 자동 펼침 + 스크롤 | E2E |
| 3 | 체크리스트 체크/해제가 통합 페이지에서 정상 동작 | E2E |
| 4 | 전체/주차별 진행률 표시 | E2E |
| 5 | 카테고리 필터 동작 | E2E |
| 6 | 통합 추가 폼으로 일정/할 일 추가 | E2E |
| 7 | 체크리스트 추가 시 주차 입력 필수 | E2E |
| 8 | 커스텀 항목 수정 동작 | E2E |
| 9 | 커스텀 항목 삭제 동작 | E2E |
| 10 | `/checklist` → `/timeline` 리다이렉트 | E2E |
| 11 | 네비게이션 4탭 구성 | E2E |
| 12 | 기존 localStorage 데이터 호환 | 수동 검증 |
| 13 | 빌드 성공 (`next build`) | CI |
| 14 | 반응형 (모바일/태블릿/데스크톱) | E2E |

---

## 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 120개 체크리스트가 한 페이지에 몰림 | 초기 로드 느림, 스크롤 과다 | 아코디언 접기 + 현재 주차만 자동 펼침 |
| 카테고리 뷰 상실 | "출산가방만 보기" 불가 | 카테고리 필터 칩 제공 |
| E2E 테스트 22개 깨짐 | 테스트 커버리지 일시 저하 | Step 13에서 전면 재작성 |
| Phase 1 사용자 북마크 깨짐 | `/checklist` 404 | redirect 처리 |
