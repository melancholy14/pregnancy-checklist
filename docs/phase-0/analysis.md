# Phase 0 적용 분석 보고서

**분석일**: 2026-04-02
**기준 문서**: [plan.md](../plan/plan.md) Phase 0 (0-1 ~ 0-7)
**프로젝트 상태**: feat/phase-0 브랜치

---

## 요약

Phase 0의 7개 요구사항이 **모두 충족**되었으며, Figma 디자인 이전 과정에서 추가된 작업(Zustand store 구현, E2E 테스트, shadcn/ui 전환)으로 Phase 1 구현 기반이 탄탄하게 준비됨.

| 항목 | 요구사항 | 상태 | 비고 |
|------|---------|------|------|
| 0-1 | Next.js 프로젝트 생성 | ✅ 완료 | Next.js 16.2.0 (계획 대비 상위 버전) |
| 0-2 | 패키지 설치 | ✅ 완료 | shadcn/ui, zustand, recharts, date-fns |
| 0-3 | Static Export 설정 | ✅ 완료 | `output: 'export'`, `basePath`, `images.unoptimized` |
| 0-4 | 폴더 구조 | ✅ 완료 | 계획 대비 추가 디렉토리 포함 |
| 0-5 | 정적 데이터 로딩 | ✅ 완료 | JSON 4개 파일 + `data-source.ts` 추상화 |
| 0-6 | 환경변수 | ✅ 완료 | `.env.local`, `.env.example` |
| 0-7 | 타입 정의 | ✅ 완료 | plan.md 스펙과 정확히 일치 |

---

## 상세 분석

### 0-1. Next.js 프로젝트 생성

**plan.md 요구사항**: `create-next-app` (TypeScript, Tailwind, ESLint, App Router, src-dir, `@/*` alias)

**현재 상태**: ✅ 완료

| 항목 | 계획 | 실제 | 일치 |
|------|------|------|------|
| Next.js | 미지정 | **16.2.0** | ✅ |
| React | 미지정 | **19.2.4** | ✅ |
| TypeScript | ✓ | 5.8.3 | ✅ |
| Tailwind CSS | ✓ | v4.1.12 | ✅ |
| ESLint | ✓ | v9 | ✅ |
| App Router | ✓ | `src/app/` | ✅ |
| src-dir | ✓ | `src/` | ✅ |
| import alias | `@/*` | `@/*` (tsconfig) | ✅ |

**특이사항**: Figma 이전 과정에서 Next.js 15 → 16으로 업그레이드. Breaking changes 영향 없음 (상세: `figma-design.md`).

---

### 0-2. 패키지 설치

**plan.md 요구사항**: shadcn/ui (button, card, checkbox, badge, tabs, progress), zustand, recharts, date-fns

**현재 상태**: ✅ 완료

| 패키지 | 계획 | 실제 버전 | 상태 |
|--------|------|----------|------|
| shadcn/ui | init + 6개 컴포넌트 | **49개** 컴포넌트 설치 | ✅ (초과 설치) |
| zustand | ✓ | 5.0.12 | ✅ |
| recharts | ✓ | 2.15.2 | ✅ |
| date-fns | ✓ | 4.1.0 | ✅ |

**추가 설치된 패키지** (Figma 이전 과정):
- 사용 중: `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `sonner`, `motion`
- 미사용 (제거 후보): `@emotion/react`, `@mui/material`, `react-dnd`, `react-slick`, `react-responsive-masonry`

> shadcn/ui 컴포넌트 49개 중 실제 사용/예정은 ~10개. 나머지는 Phase 1 이후 정리 권장.

---

### 0-3. Static Export 설정

**plan.md 요구사항**:
```ts
output: 'export',
basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
images: { unoptimized: true },
```

**현재 `next.config.ts`**: ✅ **정확히 일치**

```ts
const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  images: { unoptimized: true },
};
```

---

### 0-4. 폴더 구조

**plan.md 요구사항 vs 현재 상태**:

| 디렉토리 | 계획 | 실제 | 상태 |
|----------|------|------|------|
| `src/app/page.tsx` | 홈 | ✓ | ✅ |
| `src/app/checklist/page.tsx` | 체크리스트 | ✓ | ✅ |
| `src/app/timeline/page.tsx` | 타임라인 | ✓ | ✅ |
| `src/app/baby-fair/page.tsx` | 베이비페어 | ✓ (plan.md에선 `baby-fair`) | ✅ |
| `src/app/weight/page.tsx` | 체중 기록 | ✓ | ✅ |
| `src/app/videos/page.tsx` | 영상 | ✓ | ✅ |
| `src/components/ui/` | shadcn | ✓ (49개) | ✅ |
| `src/components/checklist/` | 체크리스트 | ✓ | ✅ |
| `src/components/timeline/` | 타임라인 | ✓ | ✅ |
| `src/components/babyfair/` | 베이비페어 | ✓ | ✅ |
| `src/components/weight/` | 체중 | ✓ | ✅ |
| `src/components/layout/` | 레이아웃 | ✓ (BottomNav) | ✅ |
| `src/data/` | JSON 4개 | ✓ | ✅ |
| `src/lib/` | 유틸리티 | ✓ | ✅ |
| `src/store/` | Zustand | ✓ (4개 store) | ✅ |
| `src/types/` | 타입 정의 | ✓ (4개) | ✅ |

**계획에 없지만 추가된 항목**:
- `src/app/not-found.tsx` — 404 페이지
- `src/components/figma/ImageWithFallback.tsx` — Figma 유틸
- `src/components/home/DueDateInput.tsx` — 예정일 입력 (Phase 1 선행)
- `src/hooks/use-mobile.ts` — 모바일 감지 hook
- `e2e/` — Playwright E2E 테스트 7개 파일 (32개 테스트)

---

### 0-5. 정적 데이터 로딩

**plan.md 요구사항**: JSON을 `import`로 직접 로드, API Routes 없음

**현재 상태**: ✅ 완료

| 파일 | 내용 | 상태 |
|------|------|------|
| `checklist_items.json` | 출산 준비 항목 | ✅ 123개 항목 |
| `timeline_items.json` | 주차별 타임라인 | ✅ 30+ 항목 |
| `babyfair_events.json` | 베이비페어 | ✅ 3개 이벤트 (데이터 정제 완료) |
| `videos.json` | 영상 큐레이션 | ✅ 빈 배열 `[]` |

추가로 `src/lib/data-source.ts`에 `fetchData<T>()` 추상화 함수가 있어 Phase 4 GCS 전환 준비 완료.

> plan.md에서 checklist 120개로 명시했으나 실제 123개 — 데이터 정제 과정에서 3개 추가된 것으로 보임. 기능에 영향 없음.

---

### 0-6. 환경변수

**plan.md 요구사항**:
- `.env.local`: `NEXT_PUBLIC_BASE_PATH=`
- `.env.example`: `NEXT_PUBLIC_BASE_PATH`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`

**현재 상태**: ✅ 완료

- `.env.local` 존재 (gitignore)
- `.env.example` 존재

> GA4/AdSense 환경변수는 Phase 1에서 사용 시작 예정.

---

### 0-7. 타입 정의

**plan.md 요구사항 vs 실제 코드 비교**:

| 타입 | 필드 일치 | 상태 |
|------|----------|------|
| `ChecklistItem` | id, title, category(5종), categoryName, recommendedWeek, priority(3종), isCustom? | ✅ 정확히 일치 |
| `TimelineItem` | id, week, title, description, type(5종), priority, linked_checklist_ids?, seo_slug?, isCustom? | ✅ 정확히 일치 |
| `BabyfairEvent` | slug, name, venue_name, city, start_date, end_date, official_url, review_status(3종) | ✅ 정확히 일치 |

**plan.md에 없지만 추가된 타입**:
- `VideoItem` (id, title, youtube_id, category, categoryName, description?) — plan.md에 video 타입 미정의, phase-1/plan.md에서 정의

---

## Phase 0 이상(Beyond) 구현 항목

Phase 0 계획 범위를 넘어 미리 구현된 항목:

| 항목 | 설명 | Phase 1 영향 |
|------|------|-------------|
| **Zustand stores 4개** | useDueDateStore, useChecklistStore, useTimelineStore, useWeightStore | Phase 1 Step 2~7 기반 완료 |
| **주차 계산 유틸** | `calcPregnancyWeek()` — plan.md 공식과 정확히 일치 | Phase 1 Step 2 완료 |
| **BottomNav** | 6탭 하단 네비게이션 | Phase 1 Step 1 완료 |
| **DueDateInput** | 예정일 입력 컴포넌트 | Phase 1 Step 3 부분 완료 |
| **Figma 디자인 이전** | 파스텔 색상, Poppins 폰트, 전체 페이지 UI | 디자인 기반 완성 |
| **shadcn/ui 전환** | Checkbox, Tabs, Progress 등 접근성 향상 | ARIA 지원 완료 |
| **E2E 테스트** | 7개 파일, 32개 테스트 (Playwright) | 회귀 테스트 기반 확보 |
| **404 페이지** | 커스텀 not-found | UX 완성도 향상 |

---

## 개선 권장사항

| 우선순위 | 항목 | 시기 |
|---------|------|------|
| 낮음 | 미사용 패키지 정리 (@emotion, @mui, react-dnd 등) | Phase 1 완료 후 |
| 낮음 | 미사용 shadcn/ui 컴포넌트 정리 (49개 중 ~39개 미사용) | Phase 1 완료 후 |
| 참고 | `data-source.ts`가 `fs/promises` 사용 — static export에서는 미사용 (각 페이지에서 JSON 직접 import) | Phase 4 전환 시 활용 |

---

## 결론

**Phase 0 완료도: 100%** (7/7 요구사항 충족)

plan.md에 명시된 모든 초기 세팅이 정확히 구현되었으며, Figma 디자인 이전 과정에서 Phase 1의 기반 작업(store, 유틸리티, 테스트)까지 선행 완료됨. Phase 1 기능 구현을 즉시 시작할 수 있는 상태.
