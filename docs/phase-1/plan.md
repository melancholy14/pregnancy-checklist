# Phase 1: 핵심 기능 개발 — Development Plan

> Generated from: [PRD v2](../plan/pregnancy-prep-service-prd-v2.md), [전체 계획서](../plan/plan.md)
> Date: 2026-03-19
> Status: Draft

## Overview

Phase 0에서 세팅된 프로젝트 뼈대(타입, mock 데이터, data-source 추상화, shadcn/ui) 위에
**6개 핵심 기능**(체크리스트, 타임라인, 베이비페어, 체중기록, 영상, Due Date 입력)을 구현한다.

모든 기능은 `DATA_SOURCE=local` 상태에서 `src/data/` JSON 파일 기반으로 동작한다.
사용자 데이터(체크 상태, 체중 기록, 예정일)는 LocalStorage에 Zustand persist로 저장한다.

### Scope

**In scope:**
- API Routes 4개 (checklist, timeline, babyfair-events, videos)
- Due Date 입력 + 임신 주차 계산
- 체크리스트 페이지 (카테고리 탭, 체크 상태, 진행률)
- 타임라인 페이지 (주차별 카드, 현재 주차 하이라이트)
- 베이비페어 페이지 (필터, 카드 목록)
- 체중 기록 페이지 (입력 폼, 차트)
- 영상 큐레이션 페이지 (카테고리별 탭, YouTube embed)
- 공통 레이아웃 (네비게이션, 헤더)

**Out of scope:**
- GCS 연결 (Phase 4)
- 캐시 설정 / revalidate (Phase 4)
- 베이비페어 크롤러 & Admin UI (Phase 2)
- SEO 최적화 / sitemap / robots.txt (Phase 3)
- 광고 슬롯 (Phase 3)
- 회원가입 / 서버 기반 데이터 저장 (Future)

---

## Technical Decisions

| Decision | Choice | Alternatives Considered | Why |
|----------|--------|------------------------|-----|
| 상태관리 | Zustand + persist middleware | Redux, Context API, Jotai | 이미 `package.json`에 zustand 5.0.12 설치됨. persist middleware로 LocalStorage 연동이 내장. PRD 요구사항(가입 없이 LocalStorage 저장)에 정확히 맞음 |
| 데이터 fetching | Server Component에서 직접 `fetchData()` 호출 | API Route → Client fetch, React Query | Phase 1은 로컬 JSON 읽기. Server Component에서 직접 호출하면 API Route 없이도 동작하고, 클라이언트 번들에 데이터가 포함되지 않음. API Route는 외부 접근용으로 별도 유지 |
| 차트 라이브러리 | Recharts | Chart.js, Nivo, Visx | 이미 `package.json`에 recharts 3.8.0 설치됨. 체중 기록의 LineChart 용도에 적합 |
| 라우팅 구조 | `/checklist`, `/timeline`, `/babyfair`, `/weight`, `/videos` | 탭 기반 SPA (단일 페이지) | 각 기능이 독립적이고, 추후 Phase 3에서 페이지별 SEO 적용이 필요. App Router의 페이지별 코드 스플리팅도 자동 적용 |
| 컴포넌트 구조 | 기능별 폴더 (`components/checklist/`, `components/timeline/` 등) | 단일 components 폴더, Atomic Design | 기능 간 결합도가 낮고, 각 기능 페이지가 독립적으로 동작. plan.md의 폴더 구조(0-3)와 일관성 유지 |
| UI 컴포넌트 | 기존 shadcn/ui + @base-ui/react 활용 | 새로 작성, Material UI | 이미 button, card, checkbox, tabs, badge, progress 6개 설치 완료. 추가 설치 최소화 |
| YouTube embed | iframe 직접 사용 | react-youtube, lite-youtube-embed | MVP 단계에서 외부 의존성 최소화. `videos.json`의 `youtube_id`로 iframe src 구성이면 충분 |
| 날짜 처리 | date-fns | dayjs, moment, native Date | 이미 `package.json`에 date-fns 4.1.0 설치됨. tree-shakeable하고 타입 지원 우수 |

### Decision Details

#### Server Component vs Client Component 경계

- **Server Component**: 데이터를 읽어서 렌더링하는 페이지 (`page.tsx`). `fetchData()`로 JSON을 서버에서 읽고, 결과를 props로 Client Component에 전달.
- **Client Component (`"use client"`)**: 사용자 인터랙션이 필요한 컴포넌트. 체크박스 토글, 체중 입력, 탭 전환, Zustand store 접근.

이렇게 나누는 이유: 데이터를 Server에서 읽으면 클라이언트 번들 크기가 줄고, 추후 GCS 전환 시에도 클라이언트 코드 변경이 없다.

#### Zustand Store 설계 원칙

PRD에서 "가입 없이 사용, LocalStorage 저장"을 명시하고 있으므로:
- 모든 사용자 상태는 Zustand store + `persist` middleware
- store별 독립적인 LocalStorage key (충돌 방지)
- hydration mismatch 방지를 위해 Client Component에서만 store 접근

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| **API Routes** | |
| `src/app/api/checklist/route.ts` | 체크리스트 데이터 반환 |
| `src/app/api/timeline/route.ts` | 타임라인 데이터 반환 |
| `src/app/api/babyfair-events/route.ts` | 베이비페어 이벤트 반환 (year, city, status 필터) |
| `src/app/api/videos/route.ts` | 영상 목록 반환 |
| **Stores** | |
| `src/store/useDueDateStore.ts` | 출산 예정일 + 현재 주차 계산 |
| `src/store/useChecklistStore.ts` | 체크리스트 체크 상태 관리 |
| `src/store/useWeightStore.ts` | 체중 기록 관리 |
| **Lib** | |
| `src/lib/week-calculator.ts` | 임신 주차 계산 유틸리티 |
| **Pages** | |
| `src/app/checklist/page.tsx` | 체크리스트 페이지 |
| `src/app/timeline/page.tsx` | 타임라인 페이지 |
| `src/app/babyfair/page.tsx` | 베이비페어 페이지 |
| `src/app/weight/page.tsx` | 체중 기록 페이지 |
| `src/app/videos/page.tsx` | 영상 큐레이션 페이지 |
| **Components** | |
| `src/components/layout/Navigation.tsx` | 공통 네비게이션 (사이드바 or 탑바) |
| `src/components/layout/Header.tsx` | 공통 헤더 (현재 주차 표시) |
| `src/components/checklist/ChecklistContainer.tsx` | 체크리스트 클라이언트 래퍼 (탭, 필터, 상태) |
| `src/components/checklist/ChecklistItem.tsx` | 개별 체크리스트 항목 |
| `src/components/checklist/ProgressSummary.tsx` | 전체/카테고리별 진행률 |
| `src/components/timeline/TimelineContainer.tsx` | 타임라인 클라이언트 래퍼 |
| `src/components/timeline/TimelineCard.tsx` | 주차별 타임라인 카드 |
| `src/components/babyfair/BabyfairContainer.tsx` | 베이비페어 클라이언트 래퍼 (필터) |
| `src/components/babyfair/BabyfairCard.tsx` | 개별 베이비페어 행사 카드 |
| `src/components/weight/WeightContainer.tsx` | 체중 기록 클라이언트 래퍼 |
| `src/components/weight/WeightForm.tsx` | 체중 입력 폼 |
| `src/components/weight/WeightChart.tsx` | 체중 변화 Recharts 차트 |
| `src/components/videos/VideosContainer.tsx` | 영상 클라이언트 래퍼 (탭) |
| `src/components/videos/VideoCard.tsx` | YouTube embed 카드 |
| `src/components/home/DueDateInput.tsx` | 출산 예정일 입력 컴포넌트 |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/page.tsx` | 기본 Next.js 템플릿 → 홈 페이지 (Due Date 입력, 기능 요약 대시보드) |
| `src/app/layout.tsx` | metadata 업데이트 ("출산 준비 체크리스트"), Navigation 컴포넌트 추가 |
| `src/app/globals.css` | 필요 시 커스텀 스타일 추가 (기존 Tailwind 테마 유지) |

### No Changes (but important context)

| File | Reason |
|------|--------|
| `src/types/*.ts` | 이미 필요한 타입 모두 정의됨 (ChecklistItem, TimelineItem, BabyfairEvent, VideoItem) |
| `src/data/*.json` | mock 데이터 준비 완료 (checklist 120개, timeline 24개). babyfair/videos는 빈 배열 |
| `src/lib/data-source.ts` | 이미 fetchData<T>() 구현됨. local/gcs 분기 동작 |
| `src/lib/utils.ts` | cn() 유틸리티 이미 존재 |
| `src/components/ui/*` | shadcn/ui 컴포넌트 6개 그대로 사용 |

### Dependencies

추가 패키지 설치 불필요. 이미 모든 필요 패키지가 `package.json`에 포함:
- zustand 5.0.12, recharts 3.8.0, date-fns 4.1.0
- @base-ui/react, lucide-react, class-variance-authority

---

## Implementation Steps

### Step 1: 공통 레이아웃 + 네비게이션

- **Files:** `src/components/layout/Navigation.tsx`, `src/components/layout/Header.tsx`, `src/app/layout.tsx`
- **Depends on:** None
- **What:**
  - `Navigation.tsx`: 6개 페이지 링크 (홈, 체크리스트, 타임라인, 베이비페어, 체중, 영상). 모바일은 햄버거 메뉴, 데스크톱은 상단 네비게이션.
  - `Header.tsx`: 서비스 이름 + 현재 임신 주차 표시 (due date 설정 시)
  - `layout.tsx`: metadata를 "출산 준비 체크리스트"로 변경, Navigation 포함
- **Verify:** 모든 페이지에서 네비게이션이 보이고, 각 링크가 올바른 경로로 이동

### Step 2: Due Date Store + 주차 계산

- **Files:** `src/lib/week-calculator.ts`, `src/store/useDueDateStore.ts`
- **Depends on:** None
- **What:**
  - `week-calculator.ts`: `calcPregnancyWeek(dueDate, today)` — 예정일에서 280일 빼서 임신 시작일 계산, 현재 주차 반환 (1~40 범위 clamp)
  - `useDueDateStore.ts`: `{ dueDate, setDueDate, clearDueDate }` + persist middleware (key: `"due-date-storage"`)
- **Verify:** store에 날짜 저장 → 페이지 새로고침 → 값 유지. 주차 계산이 PRD 공식(`pregnancy_start = due_date - 280 days`)과 일치

### Step 3: 홈 페이지 + Due Date 입력

- **Files:** `src/app/page.tsx`, `src/components/home/DueDateInput.tsx`
- **Depends on:** Step 1, Step 2
- **What:**
  - 기본 Next.js 템플릿을 교체
  - `DueDateInput.tsx` ("use client"): 날짜 선택 → useDueDateStore에 저장 → 현재 주차 표시
  - 예정일 입력 후: 간단한 대시보드 (체크리스트 진행률 요약, 이번 주 해야 할 일 미리보기)
  - 예정일 미입력 시: 예정일 입력 유도 화면
- **Verify:** 예정일 입력 → 주차 표시 → 새로고침 → 값 유지 → 대시보드 표시

### Step 4: API Routes

- **Files:** `src/app/api/checklist/route.ts`, `src/app/api/timeline/route.ts`, `src/app/api/babyfair-events/route.ts`, `src/app/api/videos/route.ts`
- **Depends on:** None (data-source.ts 이미 존재)
- **What:**
  - 각 route에서 `fetchData<T>()` 호출하여 JSON 반환
  - `babyfair-events`: query param으로 `year`, `city`, `status` 필터 지원
  - 에러 시 500 + JSON error response
- **Verify:** `curl localhost:3000/api/checklist` → 120개 항목 반환. `curl localhost:3000/api/babyfair-events?status=approved` → 필터 동작

### Step 5: 체크리스트 Store + 페이지

- **Files:** `src/store/useChecklistStore.ts`, `src/app/checklist/page.tsx`, `src/components/checklist/ChecklistContainer.tsx`, `src/components/checklist/ChecklistItem.tsx`, `src/components/checklist/ProgressSummary.tsx`
- **Depends on:** Step 2 (주차 계산), Step 4 (API Route)
- **What:**
  - `useChecklistStore.ts`: `{ checkedIds: Set<string>, toggle(id), isChecked(id) }` + persist (key: `"checklist-storage"`)
  - `page.tsx` (Server Component): `fetchData<ChecklistItem[]>('checklist_items.json')` 호출, 데이터를 `ChecklistContainer`에 전달
  - `ChecklistContainer.tsx` ("use client"): 카테고리 탭 5개 (병원/가방/신생아/산후/행정), 현재 주차 기준 "지금 해야 할 항목" 하이라이트
  - `ChecklistItem.tsx`: 체크박스 + 제목 + priority badge + recommendedWeek 표시
  - `ProgressSummary.tsx`: 전체 진행률 + 카테고리별 진행률 (Progress 컴포넌트 활용)
- **Verify:** 5개 탭 전환, 체크 토글 → 새로고침 후 유지, 진행률 % 정확, 현재 주차 항목 하이라이트

### Step 6: 타임라인 페이지

- **Files:** `src/app/timeline/page.tsx`, `src/components/timeline/TimelineContainer.tsx`, `src/components/timeline/TimelineCard.tsx`
- **Depends on:** Step 2 (주차 계산)
- **What:**
  - `page.tsx` (Server Component): `fetchData<TimelineItem[]>('timeline_items.json')` 호출
  - `TimelineContainer.tsx` ("use client"): 주차별 카드 리스트, 현재 주차 자동 스크롤 (`scrollIntoView`)
  - `TimelineCard.tsx`: 주차 번호 + 제목 + 설명 + type badge. 상태 시각 구분:
    - 지난 주차: 흐리게 (opacity 낮춤)
    - 현재 주차: 강조 (border, 배경색)
    - 예정 주차: 기본 스타일
- **Verify:** 24개 카드 렌더링, 현재 주차로 자동 스크롤, 시각적 구분 확인

### Step 7: 베이비페어 페이지

- **Files:** `src/app/babyfair/page.tsx`, `src/components/babyfair/BabyfairContainer.tsx`, `src/components/babyfair/BabyfairCard.tsx`
- **Depends on:** None
- **What:**
  - `page.tsx` (Server Component): `fetchData<BabyfairEvent[]>('babyfair_events.json')` 호출
  - `BabyfairContainer.tsx` ("use client"): 연도 필터, 도시 필터, upcoming/ended 탭 (날짜 비교)
  - `BabyfairCard.tsx`: 행사명 + 장소 + 날짜 범위 + 공식 링크 버튼
  - 데이터 없을 때: "등록된 베이비페어 일정이 없습니다" empty state
- **Verify:** 빈 배열에서 empty state 표시, 필터 UI 렌더링 확인 (데이터는 Phase 2에서 채움)

### Step 8: 체중 기록 페이지

- **Files:** `src/store/useWeightStore.ts`, `src/app/weight/page.tsx`, `src/components/weight/WeightContainer.tsx`, `src/components/weight/WeightForm.tsx`, `src/components/weight/WeightChart.tsx`
- **Depends on:** None
- **What:**
  - `useWeightStore.ts`: `{ logs: Array<{date: string, weight: number}>, addLog, removeLog }` + persist (key: `"weight-storage"`)
  - `WeightForm.tsx` ("use client"): 날짜 input + 체중 input (kg, 소수점 1자리) + 추가 버튼
  - `WeightChart.tsx` ("use client"): Recharts `LineChart` — X축: 날짜, Y축: 체중(kg). 임신 주차별 권장 체중 증가 범위를 참조선(ReferenceLine/ReferenceArea)으로 표시. 출처(예: 대한산부인과학회, WHO 등)를 차트 하단에 명시. 데이터 없을 때 안내 메시지
  - `WeightContainer.tsx`: Form + Chart + 기록 목록 (삭제 가능)
- **Verify:** 체중 입력 → 차트에 반영 → 새로고침 후 데이터 유지 → 삭제 동작

### Step 9: 영상 큐레이션 페이지

- **Files:** `src/app/videos/page.tsx`, `src/components/videos/VideosContainer.tsx`, `src/components/videos/VideoCard.tsx`
- **Depends on:** None
- **What:**
  - `page.tsx` (Server Component): `fetchData<VideoItem[]>('videos.json')` 호출
  - `VideosContainer.tsx` ("use client"): 카테고리별 탭 3개 (임산부 운동 / 출산 준비 / 신생아 케어)
  - `VideoCard.tsx`: YouTube iframe embed (`youtube_id` 기반) + 제목 + 설명
  - 데이터 없을 때: "등록된 영상이 없습니다" empty state
- **Verify:** 빈 배열에서 empty state 표시, 탭 UI 렌더링 확인

### Step 10: 홈 대시보드 완성

- **Files:** `src/app/page.tsx`
- **Depends on:** Step 3, Step 5, Step 6
- **What:**
  - 예정일 설정된 상태에서 대시보드 표시:
    - 현재 임신 주차 + 남은 일수
    - 체크리스트 전체 진행률 (ProgressSummary 재사용)
    - 이번 주차 타임라인 항목 미리보기
    - 각 기능 페이지로의 빠른 링크
- **Verify:** 예정일 입력 후 대시보드 데이터가 정확히 표시, 각 링크가 올바른 페이지로 이동

---

## Verification Criteria

### Functional

- [ ] 출산 예정일 입력 → 임신 주차 정확히 계산 (PRD 공식: `due_date - 280일`)
- [ ] 예정일/체크상태/체중기록이 LocalStorage에 저장되고 새로고침 후 유지
- [ ] 체크리스트 120개 항목이 5개 카테고리로 분류되어 표시
- [ ] 카테고리 탭 전환 시 해당 항목만 필터링
- [ ] 체크 토글 → 진행률(%) 즉시 반영
- [ ] 현재 주차 기준 "지금 해야 할 항목" 시각적 하이라이트
- [ ] 타임라인 24개 항목이 주차순으로 표시
- [ ] 현재 주차 카드로 자동 스크롤
- [ ] 지난/현재/예정 주차 시각적 구분
- [ ] 베이비페어 페이지에서 empty state 정상 표시
- [ ] 체중 입력 → Recharts 차트에 즉시 반영
- [ ] 영상 페이지에서 empty state 정상 표시
- [ ] 4개 API Route가 올바른 JSON 반환 (`/api/checklist`, `/api/timeline`, `/api/babyfair-events`, `/api/videos`)

### Technical

- [ ] `npx tsc --noEmit` — TypeScript 에러 없음
- [ ] `npm run lint` — ESLint 에러 없음
- [ ] `npm run build` — 빌드 성공
- [ ] Server Component / Client Component 경계 명확 ("use client" 누락 없음)
- [ ] Zustand store hydration mismatch 경고 없음 (브라우저 콘솔)
- [ ] 불필요한 클라이언트 번들 없음 (데이터 fetching은 서버에서)

### UX

- [ ] 모바일 레이아웃 정상 (375px width)
- [ ] 네비게이션이 모든 페이지에서 접근 가능
- [ ] 데이터 없는 상태(empty state)에서 안내 메시지 표시
- [ ] 페이지 전환 시 깜빡임 없음

---

## Resolved Questions

- [x] 홈 대시보드 → **이번 주 해야 할 일만 표시**. 추가 정보 불필요
- [x] 모바일 네비게이션 → **햄버거 메뉴** 채택
- [x] `videos.json` 초기 데이터 → **Phase 2까지 비워둠**. Phase 1에서는 empty state로 처리
- [x] 체중 기록 권장 범위 → **표시하되 출처를 명확히 기재** (예: 대한산부인과학회 가이드라인 등 공신력 있는 출처 필수. 출처 없는 수치는 표시하지 않음)

---

## References

- [PRD v2](../plan/pregnancy-prep-service-prd-v2.md) — 제품 요구사항 정의서
- [전체 계획서](../plan/plan.md) — Phase 0~5 전체 로드맵
- [Architecture](../infra/architecture.md) — 시스템 아키텍처
- [Checklist Dataset](../data/checklist_dataset.md) — 체크리스트 seed 데이터 (~120개)
- [Timeline Dataset](../data/pregnancy_timeline_dataset.md) — 타임라인 seed 데이터
