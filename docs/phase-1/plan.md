# Phase 1: 핵심 기능 개발 — Development Plan

> Generated from: [PRD v2](../plan/pregnancy-prep-service-prd-v2.md), [전체 계획서](../plan/plan.md)
> Phase 0 기록: [init-settings.md](../phase-0/init-settings.md), [figma-design.md](../phase-0/figma-design.md)
> Date: 2026-03-19 (Updated: 2026-03-29)
> Status: 🔄 구현 진행 중

## Overview

Phase 0에서 세팅된 프로젝트 뼈대(타입, 정적 JSON, shadcn/ui, Zustand store, Figma 디자인, E2E 테스트) 위에
**6개 핵심 기능**(체크리스트, 타임라인, 베이비페어, 체중기록, 영상, Due Date 입력)을 구현한다.

모든 데이터는 `src/data/` JSON을 컴포넌트에서 직접 `import`해서 사용 (API Routes 없음).
사용자 데이터(체크 상태, 커스텀 항목, 체중 기록, 예정일)는 LocalStorage에 Zustand persist로 저장한다.
완료 후 `output: 'export'` 빌드 → gh-pages 배포로 PoC 검증.
배포 직후부터 Google Analytics 4로 사용자 행동 수집, Google AdSense로 광고 수익 검증.

### Scope

**In scope:**

- Due Date 입력 + 임신 주차 계산
- 체크리스트 페이지 (카테고리 탭, 체크 상태, 진행률, **커스텀 항목 추가/삭제**)
- 타임라인 페이지 (주차별 카드, 현재 주차 하이라이트, **커스텀 항목 추가/삭제**)
- 베이비페어 페이지 (필터, 카드 목록)
- 체중 기록 페이지 (입력 폼, 차트)
- 영상 큐레이션 페이지 (카테고리별 탭, YouTube embed)
- 공통 레이아웃 (네비게이션, 헤더)
- Google Analytics 4 (GA4) — 사용자 행동 추적
- Google AdSense — 광고 슬롯 배치 + 수익 검증
- 개인정보처리방침 (`/privacy`) + 서비스 약관 (`/terms`) — AdSense/GA4 필수
- 의료 면책 고지 (푸터 + 체중 페이지)
- 온보딩 플로우 (예정일 미입력 시 유도 UX)
- gh-pages 배포 (`out/` → gh-pages 브랜치)

**Out of scope:**

- API Routes (Phase 4에서 추가)
- GCS 연결 (Phase 4)
- 캐시 설정 / revalidate (Phase 4)
- 베이비페어 크롤러 & Admin UI (Phase 2)
- SEO 최적화 / sitemap / robots.txt (Phase 3)
- 광고 위치 A/B 테스트 / 수익 최적화 (Phase 3)
- 회원가입 / 서버 기반 데이터 저장 (Future)

---

## Technical Decisions

| Decision | Choice | Why |
| -------- | ------ | --- |
| 데이터 로딩 | 정적 JSON `import` | static export라 서버 없음. `import data from '@/data/xxx.json'`으로 빌드 시 번들에 포함. API Routes 불필요. |
| 상태관리 | Zustand + persist | persist middleware로 LocalStorage 연동 내장. 가입 없이 사용하는 PRD 요구사항에 정확히 맞음. |
| 커스텀 항목 저장 | Zustand persist (LocalStorage) | 서버 없는 PoC. 커스텀 항목은 `customItems` 배열로 store에 보관. |
| 기술 스택 | Next.js `output: 'export'` | React(Vite)는 SPA라 SEO를 위해 별도 SSG 설정 필요. Next.js static export는 빌드 시 각 페이지 HTML 생성 → SEO 자연스럽게 해결. gh-pages 무료 배포 가능. |
| 차트 | Recharts | 이미 설치됨 (recharts 3.8.0). LineChart 용도에 적합. |
| YouTube embed | iframe 직접 사용 | 외부 의존성 최소화. `youtube_id`로 iframe src 구성이면 충분. |
| 날짜 처리 | date-fns | 이미 설치됨 (date-fns 4.1.0). tree-shakeable, 타입 지원 우수. |
| 애널리틱스 | GA4 (`@next/third-parties`) | Next.js 공식 패키지. static export에서도 클라이언트 사이드로 동작. PoC 배포 직후 피드백 수집. |
| 광고 | Google AdSense | 승인 전에도 슬롯 자리 확보 가능. 환경변수 없으면 렌더링 안 함. |

### Decision Details

#### 데이터 흐름 (PoC)

static export이므로 Server Component의 `async` 데이터 fetching은 동작하지 않음.
대신 JSON을 `import`로 가져와 Client Component에 직접 전달하거나 props로 넘긴다.

```ts
// page.tsx — static export에서 data fetching 방식
import checklistItems from '@/data/checklist_items.json';

export default function ChecklistPage() {
  return <ChecklistContainer items={checklistItems} />;
}
```

> Phase 4에서 API Routes + GCS 전환 시 이 import를 `fetch('/api/checklist')`로 교체.

#### Zustand Store 설계 원칙

PRD에서 "가입 없이 사용, LocalStorage 저장"을 명시하고 있으므로:

- 모든 사용자 상태는 Zustand store + `persist` middleware
- store별 독립적인 LocalStorage key (충돌 방지)
- hydration mismatch 방지를 위해 Client Component에서만 store 접근

---

## File Changes

### Existing Files (Phase 0에서 생성됨)

**Stores** — Phase 0 Figma 이전 시 구현 완료

| File | Purpose |
| ---- | ------- |
| `src/store/useDueDateStore.ts` | 출산 예정일 + 현재 주차 계산 |
| `src/store/useChecklistStore.ts` | 체크 상태 + 커스텀 항목 추가/삭제 |
| `src/store/useTimelineStore.ts` | 커스텀 타임라인 항목 추가/삭제 |
| `src/store/useWeightStore.ts` | 체중 기록 관리 |

**Lib** — Phase 0에서 생성됨

| File | Purpose |
| ---- | ------- |
| `src/lib/week-calculator.ts` | 임신 주차 계산 유틸리티 |

### New Files

**Pages**

| File | Purpose |
| ---- | ------- |
| `src/app/checklist/page.tsx` | 체크리스트 페이지 |
| `src/app/timeline/page.tsx` | 타임라인 페이지 |
| `src/app/baby-fair/page.tsx` | 베이비페어 페이지 |
| `src/app/weight/page.tsx` | 체중 기록 페이지 |
| `src/app/videos/page.tsx` | 영상 큐레이션 페이지 |
| `src/app/privacy/page.tsx` | 개인정보처리방침 (정적) |
| `src/app/terms/page.tsx` | 서비스 이용약관 (정적) |

**Components**

| File | Purpose |
| ---- | ------- |
| `src/components/layout/Navigation.tsx` | 공통 네비게이션 |
| `src/components/layout/Header.tsx` | 공통 헤더 (현재 주차 표시) |
| `src/components/checklist/ChecklistContainer.tsx` | 체크리스트 래퍼 (탭, 체크, 커스텀 추가/삭제) |
| `src/components/checklist/ChecklistItem.tsx` | 개별 체크리스트 항목 |
| `src/components/checklist/ChecklistAddForm.tsx` | 커스텀 항목 추가 폼 |
| `src/components/checklist/ProgressSummary.tsx` | 전체/카테고리별 진행률 |
| `src/components/timeline/TimelineContainer.tsx` | 타임라인 래퍼 (현재 주차 스크롤, 커스텀 추가/삭제) |
| `src/components/timeline/TimelineCard.tsx` | 주차별 타임라인 카드 |
| `src/components/timeline/TimelineAddForm.tsx` | 커스텀 항목 추가 폼 (주차 선택) |
| `src/components/babyfair/BabyfairContainer.tsx` | 베이비페어 래퍼 (필터) |
| `src/components/babyfair/BabyfairCard.tsx` | 개별 베이비페어 행사 카드 |
| `src/components/weight/WeightContainer.tsx` | 체중 기록 래퍼 |
| `src/components/weight/WeightForm.tsx` | 체중 입력 폼 |
| `src/components/weight/WeightChart.tsx` | 체중 변화 Recharts 차트 |
| `src/components/videos/VideosContainer.tsx` | 영상 래퍼 (탭) |
| `src/components/videos/VideoCard.tsx` | YouTube embed 카드 |
| `src/components/home/DueDateInput.tsx` | 출산 예정일 입력 컴포넌트 |
| `src/components/ads/AdUnit.tsx` | Google AdSense 광고 슬롯 컴포넌트 |
| `src/components/layout/Footer.tsx` | 공통 푸터 (면책 고지 + 약관/개인정보 링크) |
| `src/components/home/DueDateBanner.tsx` | 예정일 미입력 시 유도 배너 |
| `src/lib/analytics.ts` | GA4 커스텀 이벤트 헬퍼 |

### Modified Files

| File | Changes |
| ---- | ------- |
| `src/app/page.tsx` | 홈 페이지 (Due Date 입력, 대시보드) |
| `src/app/layout.tsx` | metadata + BottomNav + GA4 스크립트 + AdSense 스크립트 |
| `src/app/globals.css` | 필요 시 커스텀 스타일 추가 |
| `next.config.ts` | `output: 'export'`, `basePath` 설정 |

### No Changes (but important context)

| File | Reason |
| ---- | ------ |
| `src/types/*.ts` | Phase 0에서 정의됨. `isCustom?: boolean` 포함 |
| `src/data/*.json` | 준비 완료. checklist 120개, timeline 24개 |
| `src/lib/utils.ts` | cn() 유틸리티 이미 존재 |
| `src/lib/data-source.ts` | local/gcs 전환 추상화 이미 존재 |
| `src/components/ui/*` | shadcn/ui 컴포넌트 그대로 사용 |
| `src/components/BottomNav.tsx` | 하단 6탭 네비게이션 (Phase 0 Figma) |
| `src/components/figma/*` | ImageWithFallback 등 Figma 유틸 컴포넌트 |
| `src/store/*.ts` | 4개 Zustand store (Phase 0에서 구현됨) |
| `src/lib/week-calculator.ts` | 주차 계산 유틸리티 (Phase 0에서 구현됨) |
| `e2e/*.spec.ts` | Playwright E2E 테스트 7개 파일, 32개 테스트 |

### Dependencies

기존 패키지:

- zustand 5.0.12, recharts 2.15.2, date-fns 4.1.0
- @radix-ui/*, lucide-react, class-variance-authority

추가 설치 필요:

```bash
npm install @next/third-parties
```

| 패키지 | 용도 |
| ------ | ---- |
| `@next/third-parties` | GA4 `<GoogleAnalytics />` 컴포넌트 |

---

## Implementation Steps

### Step 1: 공통 레이아웃 + 네비게이션 (Phase 0에서 구현됨)

- **Files:** `src/components/BottomNav.tsx`, `src/app/layout.tsx`
- **Depends on:** None
- **Status:** ✅ Phase 0 Figma 이전 시 완료
- **What:**
  - `BottomNav.tsx`: 하단 고정 네비게이션 6탭 (홈, 체크리스트, 타임라인, 베이비페어, 체중, 영상)
  - `layout.tsx`: metadata + BottomNav 포함
- **Verify:** 모든 페이지에서 하단 네비게이션이 보이고, 각 링크가 올바른 경로로 이동

### Step 2: Due Date Store + 주차 계산 (Phase 0에서 구현됨)

- **Files:** `src/lib/week-calculator.ts`, `src/store/useDueDateStore.ts`
- **Depends on:** None
- **Status:** ✅ Phase 0 Figma 이전 시 완료
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
  - 예정일 입력 직후: "데이터는 이 브라우저에만 저장됩니다" 토스트 1회 표시
  - 예정일 미입력 시: 예정일 입력 유도 화면
- **Verify:** 예정일 입력 → 주차 표시 → 토스트 표시 → 새로고침 → 값 유지 → 대시보드 표시

### Step 4: 체크리스트 Store + 페이지

- **Files:** `useChecklistStore.ts`, `checklist/page.tsx`, `ChecklistContainer.tsx`,
  `ChecklistItem.tsx`, `ChecklistAddForm.tsx`, `ProgressSummary.tsx`
- **Depends on:** Step 2 (주차 계산)
- **What:**
  - `useChecklistStore.ts`: `{ checkedIds, customItems, toggle, addCustomItem, removeCustomItem }`
    + persist (key: `"checklist-storage"`)
  - `page.tsx`: `import checklistItems from '@/data/checklist_items.json'` → props로 전달
  - `ChecklistContainer.tsx` ("use client"): 기본 항목 + 커스텀 항목 합산해 카테고리 탭 5개로 표시.
    현재 주차 기준 "지금 해야 할 항목" 하이라이트
  - `ChecklistItem.tsx`: 체크박스 + 제목 + priority badge. `isCustom`인 항목만 삭제 버튼 표시
  - `ChecklistAddForm.tsx`: 카테고리 선택 + 항목명 입력 → `addCustomItem` 호출
  - `ProgressSummary.tsx`: 전체 진행률 + 카테고리별 진행률
- **Verify:** 탭 전환, 체크 토글 → 새로고침 후 유지. 커스텀 항목 추가 → 해당 카테고리에 표시.
  커스텀 항목 삭제 → 목록에서 제거. 기본 항목에는 삭제 버튼 없음.

### Step 5: 타임라인 Store + 페이지

- **Files:** `useTimelineStore.ts`, `timeline/page.tsx`, `TimelineContainer.tsx`,
  `TimelineCard.tsx`, `TimelineAddForm.tsx`
- **Depends on:** Step 2 (주차 계산)
- **What:**
  - `useTimelineStore.ts`: `{ customItems, addCustomItem, removeCustomItem }`
    + persist (key: `"timeline-storage"`)
  - `page.tsx`: `import timelineItems from '@/data/timeline_items.json'` → props로 전달
  - `TimelineContainer.tsx` ("use client"): 기본 + 커스텀 항목 합산 → 주차순 정렬.
    현재 주차 자동 스크롤 (`scrollIntoView`)
  - `TimelineCard.tsx`: 주차 번호 + 제목 + 설명. 상태 시각 구분:
    지난 주차(opacity 낮춤) / 현재 주차(강조) / 예정 주차(기본).
    `isCustom`인 항목만 삭제 버튼 표시
  - `TimelineAddForm.tsx`: 주차 선택(1~40) + 제목 + 설명 입력 → `addCustomItem` 호출
- **Verify:** 24개 기본 카드 렌더링, 현재 주차 자동 스크롤. 커스텀 항목 추가 → 해당 주차에 삽입.
  커스텀 항목 삭제 → 제거. 기본 항목에는 삭제 버튼 없음.

### Step 6: 베이비페어 페이지

- **Files:** `baby-fair/page.tsx`, `BabyfairContainer.tsx`, `BabyfairCard.tsx`
- **Depends on:** None
- **What:**
  - `page.tsx`: `import babyfairEvents from '@/data/babyfair_events.json'` → props로 전달
  - `BabyfairContainer.tsx` ("use client"): 연도 필터, 도시 필터, upcoming/ended 탭
  - `BabyfairCard.tsx`: 행사명 + 장소 + 날짜 + 공식 링크 버튼. 빈 배열 시 empty state
- **Verify:** empty state 표시, 필터 UI 렌더링 (데이터는 Phase 2에서 채움)

### Step 7: 체중 기록 페이지

- **Files:** `useWeightStore.ts`, `weight/page.tsx`, `WeightContainer.tsx`,
  `WeightForm.tsx`, `WeightChart.tsx`
- **Depends on:** None
- **What:**
  - `useWeightStore.ts`: `{ logs: {date, weight}[], addLog, removeLog }` + persist
  - `WeightForm.tsx`: 날짜 + 체중 입력 (kg, 소수점 1자리)
  - `WeightChart.tsx`: Recharts `LineChart`. 권장 체중 증가 범위 참조선 표시 (출처 명시 필수)
  - `WeightContainer.tsx`: Form + Chart + 기록 목록 (삭제 가능)
- **Verify:** 체중 입력 → 차트 반영 → 새로고침 후 유지 → 삭제 동작

### Step 8: 영상 큐레이션 페이지

- **Files:** `videos/page.tsx`, `VideosContainer.tsx`, `VideoCard.tsx`
- **Depends on:** None
- **What:**
  - `page.tsx`: `import videos from '@/data/videos.json'` → props로 전달
  - `VideosContainer.tsx`: 카테고리별 탭 3개 (임산부 운동 / 출산 준비 / 신생아 케어)
  - `VideoCard.tsx`: YouTube iframe embed + 제목 + 설명. 빈 배열 시 empty state
  - 영상 데이터 수집: YouTube Data API v3 `search.list` 엔드포인트로 태그 기반 검색
    - 검색 태그: `임산부 운동`, `출산 준비`, `신생아 케어` 등 카테고리별 키워드
    - PoC에서는 수동 큐레이션 → `videos.json` 직접 편집
    - Phase 4 이후: API 자동 수집 + Admin 검수 파이프라인
- **Verify:** empty state 표시, 탭 UI 렌더링

### Step 9: 홈 대시보드 완성

- **Files:** `src/app/page.tsx`
- **Depends on:** Step 3, Step 4, Step 5
- **What:**
  - 예정일 설정 시: 현재 주차 + 남은 일수, 체크리스트 진행률, 이번 주 타임라인 미리보기
  - 예정일 미설정 시: 예정일 입력 유도 화면
- **Verify:** 예정일 입력 후 대시보드 데이터 정확히 표시, 각 링크 정상 이동

### Step 10: gh-pages 배포

- **Files:** `.github/workflows/deploy.yml` (또는 `package.json` scripts)
- **Depends on:** Step 1~9 완료, `npm run build` 성공
- **What:**
  - `npm run build` → `out/` 디렉토리 생성 (static export)
  - `gh-pages` 패키지로 `out/` → gh-pages 브랜치 배포
    ```bash
    npm install --save-dev gh-pages
    # package.json scripts: "deploy": "gh-pages -d out"
    ```
  - GitHub Actions로 `main` push 시 자동 배포
- **Verify:** `https://<username>.github.io/pregnancy-checklist` 접속 → 전체 기능 동작 확인

### Step 11: Google Analytics 4 (GA4)

- **Files:** `src/app/layout.tsx`, `src/lib/analytics.ts`
- **Depends on:** Step 10 (배포 환경 필요)
- **What:**
  - `@next/third-parties` 설치
  - `layout.tsx`에 `<GoogleAnalytics gaId={...} />` 추가
  - `analytics.ts`: 커스텀 이벤트 헬퍼 (`sendGAEvent` 래퍼)
  - 환경변수: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - 주요 이벤트 전송 코드 삽입:
    - `due_date_set` — 예정일 입력 (핵심 퍼널, param: `pregnancy_week`)
    - `checklist_check` — 항목 체크/해제 (param: `category`, `item_id`, `checked`)
    - `custom_item_add` — 커스텀 항목 추가 (param: `target`, `category`)
    - `custom_item_remove` — 커스텀 항목 삭제
    - `weight_log` — 체중 기록 (param: `pregnancy_week`)
    - `category_tab_switch` — 카테고리 탭 전환 (param: `category`)
    - `timeline_scroll_depth` — 타임라인 스크롤 도달 주차
    - `outbound_click` — 베이비페어 외부 링크 클릭 (param: `url`)
    - `onboarding_banner_click` — 예정일 유도 배너 클릭 (param: `source_page`)
- **Verify:** GA4 Realtime 리포트에서 이벤트 수신 확인.
  환경변수 미설정 시 스크립트 미로드 확인.

### Step 12: Google AdSense

- **Files:** `src/components/ads/AdUnit.tsx`, `src/app/layout.tsx`
- **Depends on:** Step 3~9 (페이지 완성 후 슬롯 배치)
- **What:**
  - `AdUnit.tsx`: AdSense `<ins>` 태그 래퍼 컴포넌트.
    `NEXT_PUBLIC_ADSENSE_CLIENT_ID` 없으면 렌더링 안 함.
  - `layout.tsx`에 AdSense 스크립트 (`adsbygoogle.js`) 삽입
  - 환경변수: `NEXT_PUBLIC_ADSENSE_CLIENT_ID`
  - 광고 슬롯 배치:
    - 홈 대시보드 하단 (1)
    - 체크리스트 카테고리 사이 (1)
    - 타임라인 카드 사이 (1)
    - 체중 기록 차트 하단 (1)
  - AdSense 승인 전: 환경변수 비워두면 광고 컴포넌트 미렌더링
- **Verify:** 환경변수 설정 시 AdSense 스크립트 로드 확인.
  환경변수 미설정 시 빈 영역 없이 깔끔한 레이아웃 확인.
  광고가 BottomNav/콘텐츠와 겹치지 않는지 확인.

### Step 13: 개인정보처리방침 & 서비스 약관

- **Files:** `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`,
  `src/components/layout/Footer.tsx`
- **Depends on:** Step 1 (레이아웃)
- **What:**
  - `/privacy` 정적 페이지: GA4/AdSense 데이터 수집 고지, LocalStorage 안내
  - `/terms` 정적 페이지: 정보 제공 도구 면책, 데이터 소실 고지
  - `Footer.tsx`: 면책 문구 + `/privacy`, `/terms` 링크
  - `layout.tsx`에 Footer 포함
  - AdSense 승인 신청 전 반드시 게시 완료
- **Verify:** `/privacy`, `/terms` 접속 확인.
  모든 페이지 하단에 Footer 표시 확인.
  static export 빌드에 두 페이지 포함 확인.

### Step 14: 온보딩 플로우

- **Files:** `src/app/page.tsx`, `src/components/home/DueDateBanner.tsx`
- **Depends on:** Step 3 (홈 페이지)
- **What:**
  - 예정일 미입력 시: 서비스 소개 + 예정일 입력 폼 중앙 노출
    "예정일을 입력하면 나에게 맞는 체크리스트를 볼 수 있어요" 안내
  - `DueDateBanner.tsx`: 체크리스트/타임라인 페이지 상단 유도 배너
    예정일 없이도 전체 항목 열람 가능 (차단하지 않음)
  - 예정일 입력 완료 시 배너 미표시
- **Verify:** 예정일 미입력 → 홈에 입력 유도 화면 표시.
  체크리스트/타임라인 → 상단 배너 표시.
  예정일 입력 후 → 배너 사라지고 대시보드 전환.

---

## Verification Criteria

### Functional

- [ ] 출산 예정일 입력 → 임신 주차 정확히 계산 (`due_date - 280일`)
- [ ] 예정일/체크상태/커스텀항목/체중기록이 LocalStorage에 저장, 새로고침 후 유지
- [ ] 체크리스트 120개 항목이 5개 카테고리 탭으로 표시
- [ ] 체크리스트에 커스텀 항목 추가 → 해당 카테고리에 표시
- [ ] 커스텀 항목 삭제 → 목록에서 제거. 기본 항목 삭제 버튼 없음
- [ ] 체크 토글 → 진행률(%) 즉시 반영
- [ ] 현재 주차 기준 "지금 해야 할 항목" 하이라이트
- [ ] 타임라인 24개 항목이 주차순으로 표시, 현재 주차로 자동 스크롤
- [ ] 지난/현재/예정 주차 시각적 구분
- [ ] 타임라인에 커스텀 항목 추가(주차 지정) → 해당 주차에 삽입
- [ ] 커스텀 타임라인 항목 삭제. 기본 항목 삭제 버튼 없음
- [ ] 베이비페어/영상 페이지 empty state 정상 표시
- [ ] 체중 입력 → 차트에 즉시 반영
- [ ] GA4 Realtime에서 page_view, 커스텀 이벤트 수신 확인
- [ ] AdSense 슬롯이 지정된 위치에 렌더링 (환경변수 설정 시)
- [ ] 환경변수 미설정 시 GA/AdSense 스크립트 미로드, 빈 영역 없음
- [ ] `/privacy`, `/terms` 페이지 접속 가능
- [ ] 모든 페이지 하단 Footer에 면책 문구 + 약관/개인정보 링크 표시
- [ ] 예정일 첫 입력 시 "데이터는 이 브라우저에만 저장됩니다" 토스트 표시
- [ ] 예정일 미입력 시 홈에 입력 유도 화면 표시
- [ ] 체크리스트/타임라인 진입 시 예정일 미입력이면 배너 표시
- [ ] 예정일 입력 후 배너 사라짐, 대시보드 전환

### Technical

- [ ] `npx tsc --noEmit` — TypeScript 에러 없음
- [ ] `npm run lint` — ESLint 에러 없음
- [ ] `npm run build` — `out/` 디렉토리 생성 (static export)
- [ ] Zustand store hydration mismatch 경고 없음 (브라우저 콘솔)
- [ ] `out/` 빌드 결과물을 로컬 서버(`npx serve out`)로 검증
- [ ] `out/` 빌드에 `/privacy`, `/terms` HTML 포함 확인
- [ ] GA4/AdSense 스크립트가 빌드 번들 사이즈에 미치는 영향 확인

### UX

- [ ] 모바일 레이아웃 정상 (375px width)
- [ ] 네비게이션이 모든 페이지에서 접근 가능
- [ ] empty state에서 안내 메시지 표시
- [ ] gh-pages 배포 후 `basePath` 포함 URL에서 전체 기능 동작 확인

---

## Resolved Questions

- [x] 홈 대시보드 → 이번 주 해야 할 일만 표시
- [x] 모바일 네비게이션 → 하단 고정 6탭 BottomNav (Phase 0 Figma)
- [x] `videos.json` 초기 데이터 → Phase 2까지 비워둠. empty state 처리
- [x] 체중 기록 권장 범위 → 출처 명확히 기재 필수 (대한산부인과학회 등)
- [x] PoC 기술 스택 → Next.js `output: 'export'` + gh-pages.
  React(Vite)는 SPA라 SEO를 위해 별도 SSG 설정 필요하지만,
  Next.js static export는 각 페이지 HTML을 미리 생성하므로 SEO 해결됨.
- [x] 데이터 로딩 → 정적 JSON `import`. API Routes는 Phase 4(GCP)에서 추가.
- [x] 커스텀 항목 저장 → LocalStorage (Zustand persist). 서버 불필요.
- [x] GA4 → Phase 1에서 추가. PoC 배포 직후 사용자 피드백 수집 필요.
- [x] 광고 → Phase 1에서 AdSense 슬롯 배치. 승인 전에도 코드 준비.
  Phase 3에서 위치 최적화.

---

## References

- [PRD v2](../plan/pregnancy-prep-service-prd-v2.md) — 제품 요구사항 정의서
- [전체 계획서](../plan/plan.md) — Phase 0~5 전체 로드맵
- [Phase 0: 초기 세팅](../phase-0/init-settings.md) — 프로젝트 초기 구성 기록
- [Phase 0: Figma 이전](../phase-0/figma-design.md) — Figma 디자인 이전 + shadcn 전환 기록
- [Architecture](../infra/architecture.md) — 시스템 아키텍처
- [Checklist Dataset](../data/checklist_dataset.md) — 체크리스트 seed 데이터 (~120개)
- [Timeline Dataset](../data/pregnancy_timeline_dataset.md) — 타임라인 seed 데이터
