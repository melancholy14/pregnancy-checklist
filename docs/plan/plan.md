# 개발 계획서 (plan.md)

**서비스**: 출산 준비 체크리스트 웹 서비스
**스택 (PoC)**: Next.js (Static Export) + TypeScript + TailwindCSS + shadcn/ui + GitHub Pages
**스택 (운영)**: Next.js (Fullstack) + TypeScript + TailwindCSS + shadcn/ui + GCP
**목표**: PoC → gh-pages 무료 배포 검증 → 인프라 연결 → 운영 배포

---

## 전체 단계 요약

| Phase | 환경 | 내용 | 예상 기간 | 상태 |
| ----- | ---- | ---- | --------- | ---- |
| 0 | 로컬 | 초기 세팅 + Figma 디자인 이전 | 2주 (완료: ~2026-03-29) | ✅ 완료 |
| 1 | 로컬 → gh-pages | 핵심 기능 + PoC 배포 + GA4/Ads | 3~4주 (완료: ~2026-04-02) | ✅ 완료 |
| 1.5 | 로컬 → 커스텀 도메인 | PoC 고도화 (기능 통합 + AdSense 기초 준비) | 2주 (완료: 2026-04-04) | ✅ 완료 |
| 2 | 로컬 | 콘텐츠 강화 + AdSense 승인 | 3~4주 (목표: ~2026-04-30) | 📋 기획 |
| 3 | 로컬 | 베이비페어 크롤러 & Admin UI | 2주 | |
| 4 | GCP | 인프라 세팅 | 1주 | |
| 5 | GCP | 운영 배포 | 1주 | |

> **PoC 검증 기간**: Phase 1 배포 후 4주간 KPI 측정 → Go/No-Go 판단 (PRD §2 참조).
> Phase 3 착수는 Go 판단 이후. 예상 일정: 2026년 5월 말.
>
> **AdSense 승인 일정**: Phase 2 완료(4월 말) → GSC 색인 확인(5월 초) → AdSense 신청(5월 중순) → 심사(1~4주) → PoC 기간(6월 말) 내 결과 확인.

> **PoC 원칙**: 서버 불필요. `src/data/` JSON을 클라이언트에서 직접 `import`해서 사용.
> API Routes 없음. 사용자 상태(체크, 커스텀 항목, 체중)는 전부 LocalStorage(Zustand persist).
> Next.js `output: 'export'`로 빌드 → 정적 HTML 생성 → gh-pages 무료 배포.
>
> **SEO**: React(Vite/CRA)는 SPA라 SEO를 위해 별도 SSG 설정이 필요하지만,
> Next.js static export는 빌드 시 각 페이지의 HTML을 미리 생성하므로 SEO가 자연스럽게 해결됨.
>
> **운영 전환**: Phase 4에서 `output: 'export'` 제거 + API Routes 추가 + GCS 연결.

---

## Phase 0. 프로젝트 초기 세팅 (로컬)

### 0-1. Next.js 프로젝트 생성

```bash
npx create-next-app@latest pregnancy-checklist \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### 0-2. 패키지 설치

```bash
# UI
npx shadcn@latest init
npx shadcn@latest add button card checkbox badge tabs progress

# 상태 관리
npm install zustand

# 차트 (체중 그래프)
npm install recharts

# 유틸
npm install date-fns
```

> `@google-cloud/storage`는 Phase 4에서 추가. PoC에선 불필요.

### 0-3. Static Export 설정 (`next.config.ts`)

```ts
// next.config.ts  — PoC: 정적 HTML 빌드 → gh-pages 배포
const nextConfig = {
  output: 'export',
  // gh-pages 배포 시 repo 이름이 basePath가 됨 (예: /pregnancy-checklist)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  images: { unoptimized: true }, // static export는 Image Optimization 서버 불필요
};
export default nextConfig;
```

> **운영 전환 시**: `output: 'export'` 제거 → standalone 모드로 변경 (Phase 5).

### 0-4. 폴더 구조

```text
src/
├── app/
│   ├── page.tsx                      # 홈 (due date 입력)
│   ├── checklist/page.tsx
│   ├── timeline/page.tsx
│   ├── baby-fair/page.tsx
│   ├── weight/page.tsx
│   └── videos/page.tsx
│   # api/ 없음 — PoC는 서버 없이 JSON 직접 import
├── components/
│   ├── ui/                           # shadcn components
│   ├── checklist/
│   ├── timeline/
│   ├── babyfair/
│   ├── weight/
│   └── layout/
├── data/                             # 정적 JSON (빌드에 포함)
│   ├── checklist_items.json
│   ├── timeline_items.json
│   ├── babyfair_events.json
│   └── videos.json
├── lib/
│   ├── week-calculator.ts
│   └── date-utils.ts
├── store/
│   ├── useDueDateStore.ts
│   ├── useChecklistStore.ts          # 기본 체크 상태 + 커스텀 항목 추가/삭제
│   ├── useTimelineStore.ts           # 커스텀 타임라인 항목 추가/삭제
│   └── useWeightStore.ts
└── types/
    ├── checklist.ts
    ├── timeline.ts
    ├── babyfair.ts
    └── video.ts
```

### 0-5. 정적 데이터 로딩 방식

API Routes 없이 컴포넌트에서 JSON을 직접 `import` 한다.

```ts
// 예시: 체크리스트 페이지
import checklistItems from '@/data/checklist_items.json';
import timelineItems from '@/data/timeline_items.json';
```

JSON을 static import하면 빌드 시 번들에 포함되어 별도 네트워크 요청 없이 동작한다.
`tsconfig.json`에 `"resolveJsonModule": true` 필요 (Next.js 기본 활성화).

### 0-6. 환경변수

```bash
# .env.local (로컬 개발 — 커밋 안 함)
NEXT_PUBLIC_BASE_PATH=

# .env.example (커밋)
NEXT_PUBLIC_BASE_PATH=                # gh-pages 배포 시: /pregnancy-checklist
NEXT_PUBLIC_GA_MEASUREMENT_ID=        # GA4 측정 ID (G-XXXXXXXXXX)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=        # AdSense 클라이언트 ID (ca-pub-XXXXXXXXXX)
NEXT_PUBLIC_FEEDBACK_FORM_URL=        # 피드백 구글 폼 URL (Phase 1.5)
```

> **Phase 4 전환 시 추가할 환경변수**: `DATA_SOURCE`, `GCS_BUCKET_NAME`, `YOUTUBE_API_KEY`
> PoC에서는 불필요하므로 제거. 복잡도 최소화.

### 0-7. 타입 정의 (`src/types/`)

```ts
// checklist.ts
export type ChecklistItem = {
  id: string;
  title: string;
  category: 'hospital' | 'hospital_bag' | 'baby_items' | 'postpartum' | 'admin';
  categoryName: string;
  recommendedWeek: number;
  priority: 'high' | 'medium' | 'low';
  isCustom?: boolean; // 유저가 직접 추가한 항목
};

// timeline.ts
export type TimelineItem = {
  id: string;
  week: number;
  title: string;
  description: string;
  type: 'prep' | 'shopping' | 'admin' | 'education' | 'wellbeing';
  priority: 'high' | 'medium' | 'low';
  linked_checklist_ids?: string[];
  seo_slug?: string;
  isCustom?: boolean; // 유저가 직접 추가한 항목
};

// babyfair.ts
export type BabyfairEvent = {
  slug: string;
  name: string;
  venue_name: string;
  city: string;
  start_date: string;
  end_date: string;
  official_url: string;
  review_status: 'pending' | 'approved' | 'rejected';
};
```

---

## Phase 1. 핵심 기능 개발 (로컬 → gh-pages PoC 배포)

PoC는 서버 없이 동작. 모든 데이터는 정적 JSON import, 사용자 상태는 LocalStorage.

### 1-1. 데이터 로딩 (API Routes 없음)

```ts
// 각 페이지/컴포넌트에서 직접 import
import checklistItems from '@/data/checklist_items.json';
import timelineItems from '@/data/timeline_items.json';
import babyfairEvents from '@/data/babyfair_events.json';
import videos from '@/data/videos.json';
```

> API Routes는 Phase 4(GCP 운영) 전환 시 추가. PoC에선 불필요.
> 라우트 경로: `/baby-fair` (kebab-case)

### 1-2. Due Date Input & 주차 계산 (`src/lib/week-calculator.ts`)

```ts
export function calcPregnancyWeek(dueDate: Date, today: Date): number {
  const start = new Date(dueDate);
  start.setDate(start.getDate() - 280);
  const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000);
  return Math.max(1, Math.min(40, Math.floor(diffDays / 7)));
}
```

**Zustand Store** (`src/store/useDueDateStore.ts`):
- `dueDate: string | null`
- `setDueDate(date: string): void`
- `persist` middleware로 LocalStorage 자동 동기화

### 1-3. 체크리스트

- 카테고리 탭: 병원 준비 / 출산 가방 / 신생아 준비물 / 산후 준비 / 행정 준비
- 현재 임신 주차 기준 "지금 해야 할 항목" 하이라이트 (`recommendedWeek` 기반)
- 체크 상태 LocalStorage 저장 (Zustand persist)
- 전체 / 카테고리별 진행률 표시
- **커스텀 항목 추가/삭제**: 유저가 원하는 카테고리에 직접 항목 추가 가능.
  커스텀 항목은 `useChecklistStore`에 `customItems` 배열로 저장 (LocalStorage persist).
  기본 항목(`isCustom` 없음)은 삭제 불가, 커스텀 항목만 삭제 가능.

### 1-4. 타임라인

- 임신 주차별 카드 리스트
- 현재 주차 자동 스크롤
- 완료(지난 주차) / 현재 / 예정 시각적 구분
- **커스텀 항목 추가/삭제**: 특정 주차에 메모/할일을 직접 추가 가능.
  커스텀 항목은 `useTimelineStore`에 저장 (LocalStorage persist).
  기본 항목은 삭제 불가, 커스텀 항목만 삭제 가능.

### 1-5. 베이비페어

- 연도 필터, 도시 필터, upcoming/ended 탭
- 행사 카드: 이름 / 장소 / 날짜 / 공식 링크
- 초기엔 `babyfair_events.json` 빈 배열로 시작, Phase 2에서 채움

### 1-6. 체중 기록

- 날짜 + 체중 입력 폼
- Recharts LineChart로 변화 시각화
- LocalStorage 저장 (Zustand persist)

### 1-7. 영상 큐레이션

- 카테고리별 탭 (임산부 운동 / 출산 준비 / 신생아 케어)
- YouTube embed (`videos.json` 기반)
- 영상 수집: YouTube Data API v3 `search.list`로 태그 기반 검색 (상세: [PRD v2 §5 Video Content](pregnancy-prep-service-prd-v2.md))
- PoC에서는 수동 큐레이션 → `videos.json` 직접 편집. Phase 4 이후 API 자동 수집

### 1-8. Google Analytics 4 (GA4)

PoC 배포 직후부터 사용자 행동 데이터를 수집하여 피드백에 활용.

- `@next/third-parties` 패키지의 `<GoogleAnalytics />` 컴포넌트 사용
- `src/app/layout.tsx`에 GA4 스크립트 삽입
- 환경변수: `NEXT_PUBLIC_GA_MEASUREMENT_ID` (G-XXXXXXXXXX)
- static export 환경에서도 클라이언트 사이드로 정상 동작

```bash
npm install @next/third-parties
```

```ts
// src/app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google';

// layout 내부
<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!} />
```

**추적 이벤트 (기본 + 커스텀):**

| 이벤트 | 설명 | 파라미터 |
| ------ | ---- | -------- |
| `page_view` | GA4 기본 (자동 수집) | — |
| `due_date_set` | 출산 예정일 입력 (핵심 퍼널) | `pregnancy_week` |
| `checklist_check` | 체크리스트 항목 체크/해제 | `category`, `item_id`, `checked` |
| `custom_item_add` | 커스텀 항목 추가 | `target` (checklist/timeline), `category` |
| `custom_item_remove` | 커스텀 항목 삭제 | `target`, `item_id` |
| `weight_log` | 체중 기록 입력 | `pregnancy_week` |
| `category_tab_switch` | 체크리스트 카테고리 탭 전환 | `category` |
| `timeline_scroll_depth` | 타임라인 스크롤 도달 주차 | `max_week_visible` |
| `outbound_click` | 외부 링크 클릭 (베이비페어 공식 URL) | `url`, `event_name` |
| `onboarding_banner_click` | 예정일 유도 배너 클릭 | `source_page` |
| `data_export` | 데이터 내보내기 클릭 (Phase 1 이후) | — |

### 1-9. Google AdSense

PoC에서 조기 광고 수익 검증. 승인 전까지는 빈 슬롯으로 표시.

- `<AdUnit />` 컴포넌트 작성
- `src/app/layout.tsx`에 AdSense 스크립트 삽입
- 환경변수: `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (ca-pub-XXXXXXXXXX)
- 광고 위치: 콘텐츠 상단, 콘텐츠 사이 (페이지별 1~2개 슬롯)
- AdSense 승인 전: 슬롯 영역만 확보 (빈 div)
- AdSense 승인 후: 자동 광고 게재

```ts
// src/components/ads/AdUnit.tsx
'use client';

export function AdUnit({ slot, format = 'auto' }: {
  slot: string;
  format?: string;
}) {
  // NEXT_PUBLIC_ADSENSE_CLIENT_ID 없으면 렌더링 안 함
  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) return null;

  return (
    <ins className="adsbygoogle"
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true" />
  );
}
```

**광고 슬롯 배치 계획:**

| 위치 | 슬롯 | 비고 |
| ---- | ---- | ---- |
| 홈 대시보드 하단 | 1 | 메인 노출 |
| 체크리스트 카테고리 사이 | 1 | 스크롤 중 자연스러운 위치 |
| 타임라인 카드 사이 | 1 | 주차 카드 5~10개마다 삽입 |
| 체중 기록 차트 하단 | 1 | 차트 확인 후 자연스러운 위치 |

### 1-10. 개인정보처리방침 & 서비스 약관

AdSense 승인 및 GA4 사용의 필수 요건. 배포 전 반드시 준비.

- `/privacy` — 개인정보처리방침 (정적 페이지)
- `/terms` — 서비스 이용약관 (정적 페이지)
- 공통 푸터에 링크 배치
- 상세 요구사항: [PRD v2 §11](pregnancy-prep-service-prd-v2.md)

### 1-11. 의료 면책 고지

- 공통 푸터: "본 서비스는 의료적 조언을 제공하지 않습니다" 문구
- 체중 기록 페이지: 권장 범위 참조선 옆 출처 + 면책 문구
- 상세 전략: [PRD v2 §13](pregnancy-prep-service-prd-v2.md)

### 1-12. 홈 대시보드

- 예정일 설정 시: 현재 주차 + 남은 일수, 체크리스트 진행률, 이번 주 타임라인 미리보기
- 예정일 미설정 시: 예정일 입력 유도 화면
- 각 섹션에서 해당 페이지로 이동 링크

### 1-13. 온보딩 플로우

- 예정일 미입력 시: 서비스 소개 + 예정일 입력 폼 중앙 노출
- 체크리스트/타임라인 페이지: 상단 유도 배너 (`DueDateBanner`)
- 예정일 없이도 전체 항목 열람 가능 (차단하지 않음)
- 예정일 입력 완료 시 배너 미표시
- 예정일 첫 입력 시: "데이터는 이 브라우저에만 저장됩니다" 토스트 1회 표시

### 1-14. gh-pages 배포

- `npm run build` → `out/` 디렉토리 생성 (static export)
- `gh-pages` 패키지로 `out/` → gh-pages 브랜치 배포
- GitHub Actions로 `main` push 시 자동 배포
- 배포 URL: `https://<username>.github.io/pregnancy-checklist`

---

## Phase 1.5. PoC 고도화 (기능 통합 + AdSense 기초 준비)

> 상세 스펙: [phase-1.5/plan.md](../phase-1.5/plan.md)
> 완료일: 2026-04-04
> 상태: ✅ 완료

Phase 1에서 별도 페이지로 구현된 타임라인/체크리스트를 통합하고,
AdSense 승인을 위한 SEO 기반 작업 + 콘텐츠 보완을 수행한다.

### Part A. 타임라인 + 체크리스트 통합

#### 왜 통합하는가

- **정보 분절**: "28주에 뭘 준비해야 하지?"에 2개 페이지를 오가야 함
- **데이터 연결 미활용**: `linked_checklist_ids`, `recommendedWeek`가
  UI에서 사용되지 않음
- **네비 비효율**: 5개 탭 중 2개가 유사 기능 → 통합 시 1개 탭 확보

#### 1.5-1. 통합 타임라인 페이지

- 타임라인 카드를 **아코디언**으로 변경 →
  클릭 시 해당 주차 체크리스트 펼침/접힘
- 현재 주차 카드 자동 펼침 + 스크롤
- 체크리스트는 `recommendedWeek` 기준으로 주차별 그룹핑
- 주차별/전체 진행률 표시

#### 1.5-2. 통합 추가 폼

- **유형 선택**: 일정(타임라인) / 할 일(체크리스트)
- **주차 입력**: 공통 필수
- **카테고리**: 체크리스트일 때만 노출
- **설명**: 타임라인일 때만 노출

#### 1.5-3. 수정 기능 (신규)

- 커스텀 항목에 한해 제목/주차/설명/카테고리 수정 가능
- Store에 `updateCustomItem` 액션 추가
- 기본(정적) 항목은 수정 불가

#### 1.5-4. 카테고리 필터

- 타임라인 상단 필터 칩으로 카테고리별 체크리스트 필터링
- 체크리스트 전용 페이지 폐기를 보완
- **행정 준비** 카테고리 선택 시 지자체 확인 안내 문구 표시

#### 1.5-5. 네비게이션 & URL 변경

- `/checklist` → `/timeline`으로 301 리다이렉트
- 하단 네비: 5탭 재구성
  (홈/타임라인/베이비페어/체중/영상) — Feature Grid과 일치
- Store는 분리 유지 (기존 localStorage 데이터 호환)

#### 1.5-6. 커스텀 항목 삭제 확인

- 커스텀 항목 삭제 시 확인 다이얼로그 표시
- 삭제는 되돌릴 수 없으므로 실수 방지

#### 1.5-7. 대시보드 보완

- "이번 주 할 일"에 커스텀 타임라인 항목도 포함
- 대시보드 하단 **피드백 배너** 추가
  (환경변수: `NEXT_PUBLIC_FEEDBACK_FORM_URL`)

#### 1.5-8. 베이비페어 외부 링크 팝업

- 베이비페어 카드 클릭 시 외부 이동 확인 팝업 (AlertDialog)
- 확인 시 `official_url`을 새 탭으로 열기

### Part B. AdSense 기초 준비

#### 1.5-9. 커스텀 도메인 연결

- `pregnancy-checklist.com` + HTTPS 활성화
- `public/CNAME`, `basePath` 제거

#### 1.5-10. sitemap.ts + robots.ts

- `src/app/sitemap.ts` — `force-static` 정적 사이트맵
- `src/app/robots.ts` — 크롤링 허용 + sitemap URL

#### 1.5-11. 페이지별 메타데이터 + OG + canonical

- 11개 페이지 고유 `title` + `description` + OG 태그
- canonical URL로 중복 콘텐츠 방지
- `BASE_URL`, `OG_IMAGE` 공유 상수 추출

#### 1.5-12. 영상 데이터 확보

- 9개 영상 수동 큐레이션 (카테고리별 3개)
- YouTube 썸네일 핫링크 (`img.youtube.com` 패턴)

#### 1.5-13. 가이드 콘텐츠 2개

- `/guides/hospital-bag` — 출산 가방 필수 준비물 가이드
- `/guides/weekly-prep` — 임신 주차별 검사 & 준비 가이드
- 각 1,000자+ 설명형 글, SEO 랜딩 효과

#### 완료 실적

- 20/20 기능 통합 검증 + 9/9 AdSense 준비 검증 통과
- 111 Playwright E2E 테스트 통과
- 빌드 성공, 15개 정적 HTML 페이지 생성

---

## Phase 2. 콘텐츠 강화 + AdSense 승인 (로컬)

> 상세 스펙: [phase-2/plan.md](../phase-2/plan.md)
> 목표: 2026-04-30
> 상태: 📋 기획

AdSense 승인률을 높이기 위한 **콘텐츠 볼륨 + 깊이 확보**.
YouTube 영상/채널 세분화, 정보성 글(블로그) 시스템 구축.

### 2-1. YouTube 콘텐츠 세분화

- 기존 `videos.json`에서 채널 데이터를 `channels.json`으로 분리
- 카테고리별 **세부 카테고리(subcategory)** 추가
- 채널 썸네일은 YouTube Data API v3로 가져와
  빌드 시 URL 저장 (재호스팅 금지)
- 영상/채널 각각 목록 UI 제공

### 2-2. 정보성 글 (블로그) 시스템

- MD 파일 기반 글 저장 → 빌드 시 HTML 생성 (SSG)
- `/articles` 목록 페이지 + `/articles/[slug]` 상세 페이지
- 태그 기반 필터링
- 네비게이션 + 홈 대시보드에 메뉴 추가
- 기존 가이드 2개(`hospital-bag`, `weekly-prep`)를 MD로 변환

### 2-3. AdSense 승인 신청

- GSC 색인 확인 (≥ 10페이지)
- Lighthouse SEO 90+ 달성
- 5월 중순 승인 신청 → 심사 대기

---

## Phase 3. 베이비페어 크롤러 & Admin UI (로컬)

> 상세 스펙: [babyfair_crawler_spec.md](../specs/babyfair_crawler_spec.md)

> **기술 제약**: `output: 'export'`(정적 빌드) 모드이므로
> API Routes 사용 불가.
> 크롤러와 Admin 검수는 **CLI + 로컬 스크립트** 방식으로 운영.
> Admin API Routes는 Phase 4(GCP 전환) 이후 추가.

### 3-1. 크롤러 (`scripts/crawl-babyfair.ts`)

- 소스 우선순위: Tier 1 (공식) → Tier 2 (행사장) → Tier 3 (집계)
- 파이프라인: `fetch HTML → extract → normalize → dedupe → save pending`
- 실행 모드: `full | incremental | verify`
- 로컬 실행 시 결과를 `src/data/babyfair_events_pending.json`에 저장

```bash
# 로컬 크롤 실행
npx ts-node scripts/crawl-babyfair.ts --mode=full
```

### 3-2. 정규화 로직

- 행사명: trim + 공식 브랜드명 보존 (베페, 코베, 맘스홀릭)
- 날짜: 한국어 날짜 → ISO 8601 (`2026-04-02`)
- 장소: `코엑스/COEX/서울 코엑스` → `COEX` 통일
- Confidence score 산출 (0.0 ~ 1.0)

### 3-3. Admin 검수 (CLI 기반)

> Phase 2에서는 서버 없이 CLI 스크립트로 검수. Admin Web UI는 Phase 4 이후.

- `scripts/review-babyfair.ts` — 터미널 기반 검수 도구
  - pending 목록 출력 (raw 원본 vs normalized 비교)
  - approve / reject / edit 입력
  - approve → `src/data/babyfair_events.json`에 자동 반영
  - 변경 후 `npm run build && npm run deploy`로 gh-pages 재배포

```bash
# 검수 실행
npx ts-node scripts/review-babyfair.ts

# 승인 후 재배포
npm run build && npm run deploy
```

### 3-4. Admin API Routes (Phase 4 이후)

> `output: 'export'` 제거 후 서버 모드에서 추가. Phase 2에서는 미구현.

| Route | 역할 | 시점 |
| ----- | ---- | ---- |
| `POST /api/admin/crawl/babyfair/full` | 크롤러 full 실행 | Phase 4+ |
| `POST /api/admin/crawl/babyfair/incremental` | 크롤러 incremental 실행 | Phase 4+ |
| `POST /api/admin/babyfair-events/[id]/approve` | 이벤트 승인 | Phase 4+ |
| `POST /api/admin/babyfair-events/[id]/reject` | 이벤트 거부 | Phase 4+ |

---

## Phase 4. GCP 인프라 세팅

> 이 단계부터 GCP 작업. 로컬 기능 개발은 완료 상태.

### GCP 프로젝트 초기 세팅

```bash
gcloud projects create pregnancy-checklist-prod
gcloud config set project pregnancy-checklist-prod

gcloud services enable \
  run.googleapis.com \
  storage.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  logging.googleapis.com \
  cloudscheduler.googleapis.com
```

### GCS 버킷 생성 및 Seed 데이터 업로드

```bash
gsutil mb -l asia-northeast3 gs://pregnancy-prep-data

# 공개 읽기 권한
gsutil iam ch allUsers:objectViewer gs://pregnancy-prep-data

# 로컬 mock 데이터를 그대로 업로드
gsutil cp src/data/checklist_items.json \
  gs://pregnancy-prep-data/checklist/v1/checklist_items.json

gsutil cp src/data/timeline_items.json \
  gs://pregnancy-prep-data/timeline/v1/timeline_items.json

gsutil cp src/data/babyfair_events.json \
  gs://pregnancy-prep-data/babyfair/2026/events.json

gsutil cp src/data/videos.json \
  gs://pregnancy-prep-data/videos/v1/videos.json
```

### GCS 클라이언트 구현 (`src/lib/data-source.ts` 업데이트)

```bash
npm install @google-cloud/storage
```

```ts
// data-source.ts에 GCS 구현 추가
async function fetchFromGCS<T>(path: string): Promise<T> {
  const { Storage } = await import('@google-cloud/storage');
  const storage = new Storage();
  const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);
  const [content] = await bucket.file(path).download();
  return JSON.parse(content.toString()) as T;
}
```

`DATA_SOURCE=gcs`로 환경변수만 바꾸면 전환 완료. API Route 코드 변경 없음.

### API Routes 캐시 추가

GCS 연결 후 Next.js fetch revalidate 설정.

```ts
// 24h cache (checklist, timeline, videos)
export const revalidate = 86400;

// 6h cache (babyfair)
export const revalidate = 21600;
```

### Secret Manager 등록

```bash
echo -n "your_youtube_api_key" | \
  gcloud secrets create YOUTUBE_API_KEY --data-file=-

# ADMIN_SECRET은 Phase 4 Admin UI 구현 시 추가
```

### Artifact Registry 생성

```bash
gcloud artifacts repositories create pregnancy-checklist \
  --repository-format=docker \
  --location=asia-northeast3
```

---

## Phase 5. 운영 배포

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

```ts
// next.config.ts
const nextConfig = {
  output: 'standalone',
};
```

### 배포 스크립트 (`scripts/deploy.sh`)

```bash
#!/bin/bash
set -e

PROJECT_ID="pregnancy-checklist-prod"
REGION="asia-northeast3"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/pregnancy-checklist/app"
TAG=$(git rev-parse --short HEAD)

docker build -t "$IMAGE:$TAG" -t "$IMAGE:latest" .
docker push "$IMAGE:$TAG"
docker push "$IMAGE:latest"

gcloud run deploy pregnancy-checklist \
  --image "$IMAGE:$TAG" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-secrets "YOUTUBE_API_KEY=YOUTUBE_API_KEY:latest" \
  --set-env-vars "GCS_BUCKET_NAME=pregnancy-prep-data,DATA_SOURCE=gcs" \
  --project "$PROJECT_ID"

echo "Deploy complete."
```

### 서비스 계정 권한

```bash
SA="pregnancy-checklist-prod@appspot.gserviceaccount.com"

gcloud projects add-iam-policy-binding pregnancy-checklist-prod \
  --member="serviceAccount:$SA" \
  --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding pregnancy-checklist-prod \
  --member="serviceAccount:$SA" \
  --role="roles/secretmanager.secretAccessor"
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker asia-northeast3-docker.pkg.dev

      - name: Build and Deploy
        run: bash scripts/deploy.sh
```

### 베이비페어 크롤 스케줄 (Cloud Scheduler)

```bash
gcloud scheduler jobs create http crawl-babyfair-daily \
  --schedule="0 6 * * *" \
  --uri="https://your-cloudrun-url/api/admin/crawl/babyfair/incremental" \
  --http-method=POST \
  --headers="Authorization=Bearer $ADMIN_TOKEN" \  # Phase 4 Admin UI 구현 시 인증 방식 확정
  --time-zone="Asia/Seoul"
```

### 배포 후 확인 체크리스트

- [ ] Cloud Run URL 접속 확인
- [ ] `/api/checklist` GCS 데이터 반환 확인
- [ ] `/api/timeline` GCS 데이터 반환 확인
- [ ] `/api/babyfair-events` GCS 데이터 반환 확인
- [ ] LocalStorage 기반 체크리스트 동작 확인
- [ ] 체중 기록 저장/시각화 확인
- [ ] Cloud Logging 에러 없음 확인
- [ ] Lighthouse 점수 확인 (Performance / SEO)

---

## 운영 체계

### 데이터 업데이트

```bash
# 체크리스트/타임라인 수동 업데이트
gsutil cp updated_checklist.json \
  gs://pregnancy-prep-data/checklist/v1/checklist_items.json

# 캐시 무효화: revalidate tag 또는 Cloud Run 재배포
```

### 모니터링

- Cloud Logging: 에러 / 비정상 트래픽 확인
- Cloud Run 메트릭: 요청 수 / 레이턴시 / 인스턴스 수
- 베이비페어 크롤러: 매일 06:00 실행 결과 확인

### 비용 관리

- Cloud Run: `min-instances 0` → 트래픽 없을 때 비용 없음
- GCS: 소량 JSON 파일, 비용 무시 수준
- Artifact Registry: 이미지 태그 주기적 정리

---

## 마일스톤 요약

| 마일스톤 | 완료 기준 |
| -------- | --------- |
| M0: 초기 세팅 | Next.js 로컬 실행, mock 데이터 로드 확인 ✅ |
| M1: 핵심 기능 | 체크리스트/타임라인/체중기록 + GA4 + gh-pages 배포 ✅ |
| M1.5: PoC 고도화 | 기능 통합 + AdSense 기초 준비 (SEO/가이드/영상) ✅ |
| M2: 콘텐츠 강화 | YouTube 세분화 + 정보글 시스템 + AdSense 승인 신청 |
| M3: 베이비페어 | 크롤러 → Admin 검수 → 데이터 반영 |
| M4: 인프라 | GCS 업로드, `DATA_SOURCE=gcs` 로컬 연결 |
| M5: 운영 배포 | Cloud Run 배포, CI/CD 동작 확인 |
