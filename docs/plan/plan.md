# 개발 계획서 (plan.md)

**서비스**: 출산 준비 체크리스트 웹 서비스
**스택 (PoC)**: Next.js (Static Export) + TypeScript + TailwindCSS + shadcn/ui + GitHub Pages
**스택 (운영)**: Next.js (Fullstack) + TypeScript + TailwindCSS + shadcn/ui + GCP
**목표**: PoC → gh-pages 무료 배포 검증 → 인프라 연결 → 운영 배포

---

## Product Overview (PRD)

임산부와 가족이 **출산 준비를 체계적으로 관리**할 수 있도록 돕는 서비스.

### 핵심 목적

- 출산 준비 체크리스트 제공
- 출산 예정일 기반 타임라인 자동 생성
- 연도별 베이비페어 정보 제공
- 임신 중 체중 기록 및 시각화
- 출산/육아 관련 영상 큐레이션

### 서비스 특징

- 회원가입 없이 사용 가능
- 출산 예정일 입력만으로 개인화 기능 제공
- 개인 데이터는 브라우저 LocalStorage 저장

### Target Persona

**Primary: 초산 임산부 (25~35세)**

- 임신 사실 확인 후 "뭘 준비해야 하는지" 검색하는 단계
- 맘카페에서 정보를 찾지만, 흩어져 있어 체계적으로 정리하고 싶음
- 앱 설치/회원가입 없이 빠르게 쓸 수 있는 웹 도구 선호
- 모바일 사용 비율 80%+ 예상 (이동 중, 병원 대기 중)

**Secondary: 남편/보호자**

- 준비물 구매 분담, 베이비페어 동행 등 실질적 지원 역할
- "이번 주에 뭐 해야 해?"를 확인하는 패턴
- Phase 1에서는 별도 기능 없음. 같은 기기에서 함께 확인하는 수준

**정보 탐색 경로**: 검색("출산 준비 체크리스트", "임신 주차별 준비") → 서비스 유입 → 예정일 입력 → 체크리스트 사용

### Competitive Landscape

| 대안 | 장점 | 단점 | 본 서비스 차별점 |
| ---- | ---- | ---- | ---------------- |
| 맘카페 (네이버) | 실사용 후기 풍부 | 정보 흩어짐, 구조화 안 됨 | 체크리스트 구조화 + 주차별 개인화 |
| 임신 앱 (숨비, 배냇 등) | 기능 다양 | 앱 설치/가입 필수, 광고 과다 | 설치/가입 없이 웹에서 즉시 사용 |
| 블로그/유튜브 | SEO 강함, 콘텐츠 풍부 | 관리 도구 없음, 진행률 추적 불가 | 읽기만 하는 게 아니라 체크하며 관리 |
| 스프레드시트 | 자유도 높음 | 직접 만들어야 함, 모바일 UX 나쁨 | 전문가 큐레이션 데이터 + 모바일 최적화 |

**핵심 포지셔닝**: "설치/가입 없이 즉시 쓰는 출산 준비 관리 도구"

### Permanent Non-Goals

- 의료 상담/진단/처방/개인 맞춤 의료 조언
- 병원 추천/예약 연동

본 서비스는 **정보 제공 및 준비 관리 도구**이다.

### Success Metrics (KPI)

PoC(Phase 1) 배포 후 4주간 측정하여 Go/No-Go 판단.

**핵심 지표 (Primary)**

| 지표 | 목표 | 측정 방법 |
| ---- | ---- | --------- |
| 예정일 입력 전환율 | 방문자 중 40%+ | GA4 `due_date_set` / `page_view` (홈) |
| 체크리스트 체크 1회 이상 | 예정일 입력자 중 60%+ | GA4 `checklist_check` unique users |
| 7일 재방문율 | 20%+ | GA4 Cohort 분석 |

**보조 지표 (Secondary)**

| 지표 | 목표 | 측정 방법 |
| ---- | ---- | --------- |
| 평균 세션 시간 | 3분+ | GA4 |
| 페이지별 이탈률 | 홈 60% 이하, 체크리스트 40% 이하 | GA4 |
| 커스텀 항목 추가율 | 예정일 입력자 중 10%+ | GA4 `custom_item_add` |
| 체중 기록 1회 이상 | 예정일 입력자 중 15%+ | GA4 `weight_log` |

**Go/No-Go 기준**

- **Go**: 핵심 지표 3개 중 2개 이상 달성 → Phase 2 진행
- **Pivot**: 예정일 입력 전환율만 미달 → 온보딩 개선 후 2주 재측정
- **No-Go**: 핵심 지표 3개 모두 미달 → 서비스 컨셉 재검토

### MVP Scope

**Included**: 출산 예정일 입력, 체크리스트, 타임라인, 베이비페어, 체중 기록, 영상 큐레이션
**Excluded**: 회원가입, 남편 공유 기능, 서버 기반 개인 데이터 저장, 커뮤니티, 메시징

### Future Features

- 회원가입 도입
- 남편과 체크리스트 공유
- 여러 기기 동기화
- JSON 내보내기/가져오기

---

## 전체 단계 요약

| Phase | 환경 | 내용 | 기간 | 상태 |
| ----- | ---- | ---- | ---- | ---- |
| 0 | 로컬 | 초기 세팅 + Figma 디자인 이전 | 2주 (완료: ~2026-03-29) | ✅ 완료 |
| 1 | 로컬 → gh-pages | 핵심 기능 + PoC 배포 + GA4/Ads | 3~4주 (완료: ~2026-04-02) | ✅ 완료 |
| 1.5 | 로컬 → 커스텀 도메인 | PoC 고도화 (기능 통합 + AdSense 기초 준비) | 2주 (완료: 2026-04-04) | ✅ 완료 |
| 2 | 로컬 | 콘텐츠 강화 + AdSense 승인 | 3~4주 (완료: 2026-04-04) | ✅ 완료 |
| 2.5 | 로컬 | UX 개선 + 리텐션 강화 | 5주 (목표: ~2026-05-15) | 📋 기획 |
| 3 | 로컬 | 베이비페어 크롤러 & Admin UI | 2주 | |
| 4 | GCP | 인프라 세팅 | 1주 | |
| 5 | GCP | 운영 배포 | 1주 | |

> **PoC 검증 기간**: Phase 1 배포 후 4주간 KPI 측정 → Go/No-Go 판단.
> Phase 3 착수는 Go 판단 이후. 예상 일정: 2026년 5월 말.
>
> **AdSense 승인 일정**: Phase 2 완료(4월 말) → GSC 색인 확인(5월 초) → AdSense 신청(5월 중순) → 심사(1~4주) → PoC 기간(6월 말) 내 결과 확인.

> **PoC 원칙**: 서버 불필요. `src/data/` JSON을 클라이언트에서 직접 `import`해서 사용.
> API Routes 없음. 사용자 상태(체크, 커스텀 항목, 체중)는 전부 LocalStorage(Zustand persist).
> Next.js `output: 'export'`로 빌드 → 정적 HTML 생성 → gh-pages 무료 배포.
>
> **SEO**: Next.js static export는 빌드 시 각 페이지의 HTML을 미리 생성하므로 SEO 자연스럽게 해결.
>
> **운영 전환**: Phase 4에서 `output: 'export'` 제거 + API Routes 추가 + GCS 연결.

---

## Phase 0. 프로젝트 초기 세팅 (로컬) — ✅ 완료

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
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  images: { unoptimized: true },
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
│   ├── useChecklistStore.ts
│   ├── useTimelineStore.ts
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
import checklistItems from '@/data/checklist_items.json';
import timelineItems from '@/data/timeline_items.json';
```

JSON을 static import하면 빌드 시 번들에 포함되어 별도 네트워크 요청 없이 동작한다.

### 0-6. 환경변수

```bash
# .env.local (로컬 개발 — 커밋 안 함)
NEXT_PUBLIC_BASE_PATH=

# .env.example (커밋)
NEXT_PUBLIC_BASE_PATH=                # gh-pages 배포 시: /pregnancy-checklist
NEXT_PUBLIC_GA_MEASUREMENT_ID=        # GA4 측정 ID (G-XXXXXXXXXX)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=        # AdSense 클라이언트 ID (ca-pub-XXXXXXXXXX)
NEXT_PUBLIC_FEEDBACK_FORM_URL=        # 피드백 구글 폼 URL
```

> **Phase 4 전환 시 추가할 환경변수**: `DATA_SOURCE`, `GCS_BUCKET_NAME`, `YOUTUBE_API_KEY`

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
  isCustom?: boolean;
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
  isCustom?: boolean;
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

### Phase 0 완료 실적

- 7/7 요구사항 모두 충족
- Next.js 16.2.0, React 19.2.4 (계획 대비 상위 버전)
- Figma 디자인 이전 + shadcn/ui 전환 완료
- Zustand store 4개, week-calculator, BottomNav, DueDateInput 구현
- E2E 테스트 기반 준비 완료

---

## Phase 1. 핵심 기능 개발 (로컬 → gh-pages PoC 배포) — ✅ 완료

PoC는 서버 없이 동작. 모든 데이터는 정적 JSON import, 사용자 상태는 LocalStorage.

### 1-1. 데이터 로딩 (API Routes 없음)

```ts
import checklistItems from '@/data/checklist_items.json';
import timelineItems from '@/data/timeline_items.json';
import babyfairEvents from '@/data/babyfair_events.json';
import videos from '@/data/videos.json';
```

> API Routes는 Phase 4(GCP 운영) 전환 시 추가.

### 1-2. Due Date Input & 주차 계산

```ts
export function calcPregnancyWeek(dueDate: Date, today: Date): number {
  const start = new Date(dueDate);
  start.setDate(start.getDate() - 280);
  const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000);
  return Math.max(1, Math.min(40, Math.floor(diffDays / 7)));
}
```

**Zustand Store** (`useDueDateStore`): `dueDate: string | null`, `setDueDate`, persist middleware

### 1-3. 체크리스트

- 카테고리 탭: 병원 준비 / 출산 가방 / 신생아 준비물 / 산후 준비 / 행정 준비
- 현재 임신 주차 기준 "지금 해야 할 항목" 하이라이트 (`recommendedWeek` 기반)
- 체크 상태 LocalStorage 저장 (Zustand persist)
- 전체 / 카테고리별 진행률 표시
- **커스텀 항목 추가/삭제**: `customItems` 배열로 저장. 기본 항목은 삭제 불가.

### 1-4. 타임라인

- 임신 주차별 카드 리스트, 현재 주차 자동 스크롤
- 완료(지난 주차) / 현재 / 예정 시각적 구분
- 커스텀 항목 추가/삭제 (LocalStorage persist)

### 1-5. 베이비페어

- 연도 필터, 도시 필터, upcoming/ended 탭
- 행사 카드: 이름 / 장소 / 날짜 / 공식 링크

### 1-6. 체중 기록

- 날짜 + 체중 입력 폼, Recharts LineChart 시각화, LocalStorage 저장

### 1-7. 영상 큐레이션

- 카테고리별 탭 (임산부 운동 / 출산 준비 / 신생아 케어)
- YouTube embed (`videos.json` 기반)
- PoC에서는 수동 큐레이션, Phase 4 이후 API 자동 수집

**영상 수집 전략 (YouTube Data API v3)**

| 카테고리 | 검색 태그 | 필터 |
| -------- | --------- | ---- |
| 임산부 운동 | `임산부 운동`, `임산부 요가`, `임산부 스트레칭` | `videoDuration=medium`, `relevanceLanguage=ko` |
| 출산 준비 | `출산 준비`, `출산 과정`, `출산 호흡법` | `videoDuration=medium`, `relevanceLanguage=ko` |
| 신생아 케어 | `신생아 케어`, `신생아 목욕`, `모유 수유` | `videoDuration=medium`, `relevanceLanguage=ko` |

### 1-8. Google Analytics 4 (GA4)

- `@next/third-parties` 패키지의 `<GoogleAnalytics />` 사용
- 환경변수: `NEXT_PUBLIC_GA_MEASUREMENT_ID`

**추적 이벤트:**

| 이벤트 | 설명 |
| ------ | ---- |
| `page_view` | GA4 기본 (자동 수집) |
| `due_date_set` | 출산 예정일 입력 (핵심 퍼널) |
| `checklist_check` | 체크리스트 항목 체크/해제 |
| `custom_item_add` | 커스텀 항목 추가 |
| `weight_log` | 체중 기록 입력 |
| `outbound_click` | 외부 링크 클릭 (베이비페어 공식 URL) |

### 1-9. Google AdSense

- `<AdUnit />` 컴포넌트, 환경변수 없으면 미렌더링
- 광고 위치: 홈 하단, 체크리스트 사이, 타임라인 카드 사이, 체중 차트 하단

### 1-10. 개인정보처리방침 & 서비스 약관

- `/privacy` — 개인정보처리방침
- `/terms` — 서비스 이용약관
- 공통 푸터에 링크 배치

**개인정보 필수 고지**: 수집 항목(쿠키, 방문 기록), 수집 목적(서비스 개선, 광고), 보관 기간(LocalStorage), 제3자 제공(Google Analytics, AdSense), 사용자 권리(브라우저 데이터 삭제)

### 1-11. 의료 면책 고지

- 공통 푸터: "본 서비스는 의료적 조언을 제공하지 않습니다"
- 체중 기록 페이지: 권장 범위 참조선 옆 출처 + 면책 문구
- 타임라인/체크리스트: 의료 관련 항목에 "담당 의료진과 상의하세요"
- 콘텐츠 작성 원칙: 단정형 표현 금지, 권장 시점 표현("보통 이 시기에"), 출처 명시

### 1-12. 홈 대시보드

- 예정일 설정 시: 현재 주차 + 남은 일수, 체크리스트 진행률, 이번 주 타임라인
- 예정일 미설정 시: 예정일 입력 유도 화면

### 1-13. 온보딩 플로우

**시나리오 A (첫 방문):**
- 홈 진입 → 서비스 소개 + 예정일 입력 폼 중앙 노출
- "예정일을 입력하면 나에게 맞는 체크리스트를 볼 수 있어요" 안내

**시나리오 B (예정일 없이 탐색):**
- 체크리스트/타임라인 상단에 유도 배너 표시
- 예정일 없이도 전체 항목 열람 가능 (차단하지 않음)

**시나리오 C (재방문, 예정일 입력 완료):**
- 대시보드 바로 표시 (이번 주 할 일, 진행률)

### 1-14. gh-pages 배포

- `npm run build` → `out/` → `gh-pages` 패키지로 배포
- GitHub Actions `main` push 시 자동 배포

### Phase 1 완료 실적

- 14개 Step 중 Step 1~9, 11~14 구현 완료. Step 10(배포) 워크플로우 준비 완료
- 10개 신규 파일, 23개 수정 파일
- 빌드 성공 (10개 정적 페이지)
- 코드 리뷰: Critical 0건, Warning 5건 → 리팩토링 완료
  - ChecklistItem hover 클래스 정적화
  - ChecklistContainer 카테고리 상수 추출
  - TimelineContainer 스크롤 로직 개선
  - BabyfairContainer 빈 배열 처리
  - ChecklistAddForm 유효성 검증 강화

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

---

## Phase 1.5. PoC 고도화 (기능 통합 + AdSense 기초 준비) — ✅ 완료

> 완료일: 2026-04-04

Phase 1에서 별도 페이지로 구현된 타임라인/체크리스트를 통합하고,
AdSense 승인을 위한 SEO 기반 작업 + 콘텐츠 보완을 수행.

### Part A. 타임라인 + 체크리스트 통합

#### 왜 통합하는가

- **정보 분절**: "28주에 뭘 준비해야 하지?"에 2개 페이지를 오가야 함
- **데이터 연결 미활용**: `linked_checklist_ids`, `recommendedWeek`가 UI에서 사용되지 않음
- **네비 비효율**: 5개 탭 중 2개가 유사 기능

#### 1.5-1. 통합 타임라인 페이지

- 타임라인 카드를 **아코디언**으로 변경 → 클릭 시 해당 주차 체크리스트 펼침/접힘
- 현재 주차 카드 자동 펼침 + 스크롤
- 체크리스트는 `recommendedWeek` 기준으로 주차별 그룹핑
- 주차별/전체 진행률 표시

#### 1.5-2. 통합 추가 폼

- **유형 선택**: 일정(타임라인) / 할 일(체크리스트)
- **주차 입력**: 공통 필수 (1~40)
- **카테고리**: 체크리스트일 때만 노출
- **설명**: 타임라인일 때만 노출

#### 1.5-3. 수정/삭제 기능

- 커스텀 항목에 한해 제목/주차/설명/카테고리 수정 가능
- Store에 `updateCustomItem` 액션 추가
- 커스텀 항목 삭제 시 확인 다이얼로그 표시

#### 1.5-4. 카테고리 필터

- 타임라인 상단 필터 칩으로 카테고리별 체크리스트 필터링
- **행정 준비** 카테고리 선택 시 지자체 확인 안내 문구 표시

#### 1.5-5. 네비게이션 & URL 변경

- `/checklist` → `/timeline`으로 리다이렉트
- 하단 네비: 5탭 재구성 (홈/타임라인/베이비페어/체중/영상)
- Store는 분리 유지 (기존 localStorage 데이터 호환)

#### 1.5-6. 대시보드 보완

- "이번 주 할 일"에 커스텀 타임라인 항목도 포함
- **피드백 배너**를 홈 대시보드에서 `/contact` 페이지로 이동 (환경변수: `NEXT_PUBLIC_FEEDBACK_FORM_URL`)

#### 1.5-7. 베이비페어 외부 링크 팝업

- 카드 클릭 시 외부 이동 확인 팝업 (AlertDialog)
- 확인 시 `official_url`을 새 탭으로 열기
- 팝업 차단 시 토스트 안내

### Part B. AdSense 기초 준비

- **커스텀 도메인**: `pregnancy-checklist.com` + HTTPS
- **sitemap.ts + robots.ts**: 정적 사이트맵, 크롤링 허용
- **메타데이터**: 11개 페이지 고유 title + description + OG + canonical
- **영상 데이터**: 9개 영상 수동 큐레이션 (카테고리별 3개)
- **가이드 콘텐츠**: `/guides/hospital-bag`, `/guides/weekly-prep` (각 1,000자+)

### Phase 1.5 완료 실적

- 20/20 기능 통합 검증 + 9/9 AdSense 준비 검증 통과
- 7개 신규 파일, 7개 수정 파일, 5개 삭제 파일
- 111 Playwright E2E 테스트 통과
- 빌드 성공, 15개 정적 HTML 페이지
- 주요 결정: Store 분리 유지, Collapsible UI, recommendedWeek 매핑, 인라인 편집
- 코드 리뷰: Critical 0건, Warning 3건 → 리팩토링 완료
  - DeleteConfirmDialog 컴포넌트 분리
  - BottomNav 아이콘 색상 통일
  - filteredWeekSet 최적화
  - CATEGORY_OPTIONS 상수 추출
  - 접근성 개선 (role, tabIndex, onKeyDown)

---

## Phase 2. 콘텐츠 강화 + AdSense 승인 (로컬) — ✅ 완료

> 완료일: 2026-04-04

AdSense 승인률을 높이기 위한 **콘텐츠 볼륨 + 깊이 확보**.

### 2-1. YouTube 콘텐츠 세분화

- `channels.json` 분리 (채널 데이터 독립)
- 카테고리별 **세부 카테고리(subcategory)** 추가
- 채널 썸네일 YouTube Data API v3로 확보
- 영상/채널 각각 목록 UI + 2단 필터 (카테고리 → 세부 카테고리)

### 2-2. 정보성 글 (블로그) 시스템

- MD 파일 기반 글 저장 → 빌드 시 HTML 생성 (SSG)
- `gray-matter` + `remark/rehype` 파싱
- `/articles` 목록 + `/articles/[slug]` 상세 페이지
- 태그 기반 필터링
- 기존 가이드 2개 MD 변환 + 신규 6개 작성 (총 8개)

**블로그 목록:**

| slug | 제목 |
|------|------|
| `hospital-bag` | 출산 가방 필수 준비물 총정리 |
| `weekly-prep` | 임신 주차별 검사 & 준비 가이드 |
| `early-pregnancy-tests` | 임신 초기 필수 검사 총정리 |
| `postpartum-care` | 산후조리원 선택 가이드 |
| `baby-items-cost` | 출산 준비물 예상 비용 총정리 |
| `newborn-bath-tips` | 신생아 목욕 방법과 주의사항 |
| `infant-vaccination-schedule` | 영유아 예방접종 스케줄 완벽 정리 |
| `postpartum-diet` | 산후조리 기간 산모 식단 관리 가이드 |

### 2-3. 네비게이션 변경

- 5탭: 홈/타임라인/베이비페어/영상/정보 (체중 → 홈에서 접근)
- 홈 대시보드에 정보글 카드 추가

### Phase 2 완료 실적

- 15/15 완료 조건 충족
- 16개 신규 파일, 12개 수정 파일
- 150 Playwright E2E 테스트 통과
- 코드 리뷰: Critical 0건, Warning 3건 (2건 수정, 1건 의도적 스킵)
- 리팩토링: parseArticleMeta 유효성 검증, getAllTags 최적화

---

## Phase 2.5. UX 개선 + 리텐션 강화 — 📋 기획

> 상세 스펙: [../phase-2.5/plan.md](../phase-2.5/plan.md)
> 목표: 2026-05-15

유입된 유저가 타임라인을 중심으로 반복 방문하고 각 기능을 깊게 활용하는 구조 구축.

### 2.5-1. 온보딩 플로우 (3단계)

- 웰컴 → 예정일 입력 → 데이터 안내 + CTA
- 첫 방문 시만 표시 (localStorage 플래그)
- "나중에 입력할게요" 스킵 옵션

### 2.5-2. 타임라인 유도 + 데이터 보존 가이드

- 홈 CTA 강화: 현재 주차 + 미완료 수 명시
- 첫 체크 시 인라인 배너 (1회성): "체크한 내용은 자동 저장돼요!"
- 재방문 유저 웰컴 메시지: "돌아오셨군요! N개 체크하셨어요"

### 2.5-3. 홈 대시보드 개편

- Feature Grid(메뉴판) → 각 기능의 미니 대시보드 카드로 변경
- 타임라인: 주차 + 완료율, 베이비페어: 다가오는 행사 수, 체중: 최근 기록, 영상: 총 수, 정보: 최신 글

### 2.5-4. Sticky 헤더

- 44px, 로고 + 서비스명, 홈 제외 모든 페이지
- 스크롤 다운 시 숨김 / 스크롤 업 시 표시

### 2.5-5. 타임라인 ↔ 블로그 크로스 링크

- 타임라인 주차 카드에 "관련 글 읽기" 링크
- 블로그 하단에 "타임라인에서 확인하기" CTA
- `linked_article_slugs` / `linked_timeline_weeks` 필드 추가

### 2.5-6. 베이비페어 개선

- 2탭 → 3탭 (진행중/예정/지난)
- 진행 중 행사에 "D-N일 남음" 배지
- 서브타이틀에 연도 라벨 상시 표시

### 2.5-7. 체중관리 접근성 개선

- 홈 미니 대시보드 카드에서 접근 (Step 2.5-3과 연동)

### 2.5-8. 버그 수정: 존재하지 않는 주차에 할일 추가

- 주차에 타임라인 항목이 없으면 AlertDialog 표시
- "주차 추가하고 할일 넣기" → 빈 타임라인 항목 자동 생성 후 체크리스트 추가

### 2.5-9. 달성감 / 게이미피케이션

- 주차 전체 완료 시 ✅ 아이콘 + 축하 메시지
- 마일스톤 배지 (25%/50%/75%/100%)

---

## Phase 3. 베이비페어 크롤러 & Admin UI (로컬)

> 상세 스펙: [../specs/babyfair_crawler_spec.md](../specs/babyfair_crawler_spec.md)

> **기술 제약**: `output: 'export'` 모드이므로 API Routes 불가.
> 크롤러와 Admin 검수는 **CLI + 로컬 스크립트** 방식으로 운영.

### 3-1. 크롤러 (`scripts/crawl-babyfair.ts`)

- 소스 우선순위: Tier 1 (공식) → Tier 2 (행사장) → Tier 3 (집계)
- 파이프라인: `fetch HTML → extract → normalize → dedupe → save pending`
- 실행 모드: `full | incremental | verify`

```bash
npx ts-node scripts/crawl-babyfair.ts --mode=full
```

### 3-2. 정규화 로직

- 행사명: trim + 공식 브랜드명 보존
- 날짜: 한국어 → ISO 8601
- 장소: 통일 (코엑스/COEX → `COEX`)
- Confidence score 산출 (0.0~1.0)

### 3-3. Admin 검수 (CLI 기반)

```bash
npx ts-node scripts/review-babyfair.ts
npm run build && npm run deploy  # 승인 후 재배포
```

### 3-4. Admin API Routes (Phase 4 이후)

| Route | 역할 | 시점 |
| ----- | ---- | ---- |
| `POST /api/admin/crawl/babyfair/full` | 크롤러 full 실행 | Phase 4+ |
| `POST /api/admin/crawl/babyfair/incremental` | 크롤러 incremental | Phase 4+ |
| `POST /api/admin/babyfair-events/[id]/approve` | 이벤트 승인 | Phase 4+ |
| `POST /api/admin/babyfair-events/[id]/reject` | 이벤트 거부 | Phase 4+ |

---

## Phase 4. GCP 인프라 세팅

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
gsutil iam ch allUsers:objectViewer gs://pregnancy-prep-data
gsutil cp src/data/checklist_items.json gs://pregnancy-prep-data/checklist/v1/checklist_items.json
gsutil cp src/data/timeline_items.json gs://pregnancy-prep-data/timeline/v1/timeline_items.json
gsutil cp src/data/babyfair_events.json gs://pregnancy-prep-data/babyfair/2026/events.json
gsutil cp src/data/videos.json gs://pregnancy-prep-data/videos/v1/videos.json
```

### GCS 클라이언트 (`src/lib/data-source.ts` 업데이트)

```ts
async function fetchFromGCS<T>(path: string): Promise<T> {
  const { Storage } = await import('@google-cloud/storage');
  const storage = new Storage();
  const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);
  const [content] = await bucket.file(path).download();
  return JSON.parse(content.toString()) as T;
}
```

`DATA_SOURCE=gcs`로 환경변수만 바꾸면 전환 완료.

### API Routes 캐시

```ts
// 24h cache (checklist, timeline, videos)
export const revalidate = 86400;
// 6h cache (babyfair)
export const revalidate = 21600;
```

### Secret Manager / Artifact Registry

```bash
echo -n "your_youtube_api_key" | gcloud secrets create YOUTUBE_API_KEY --data-file=-

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
```

### CI/CD (GitHub Actions)

```yaml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - uses: google-github-actions/setup-gcloud@v2
      - run: gcloud auth configure-docker asia-northeast3-docker.pkg.dev
      - run: bash scripts/deploy.sh
```

### 베이비페어 크롤 스케줄 (Cloud Scheduler)

```bash
gcloud scheduler jobs create http crawl-babyfair-daily \
  --schedule="0 6 * * *" \
  --uri="https://your-cloudrun-url/api/admin/crawl/babyfair/incremental" \
  --http-method=POST \
  --time-zone="Asia/Seoul"
```

---

## SEO Strategy

### Target Keywords

**Head (검색량 높음, 경쟁 높음)**

| 키워드 | 타겟 페이지 |
| ------ | ----------- |
| 출산 준비 체크리스트 | 홈 / 체크리스트 |
| 임신 준비물 리스트 | 체크리스트 |
| 출산 가방 준비물 | 체크리스트 (출산 가방 탭) |

**Mid-tail (검색량 중간, 전환 높음)**

| 키워드 | 타겟 페이지 |
| ------ | ----------- |
| 임신 주차별 준비 | 타임라인 |
| 베이비페어 일정 2026 | 베이비페어 |
| 임산부 체중 관리 | 체중 기록 |

**Long-tail (Phase 3+)**

| 키워드 | 타겟 페이지 |
| ------ | ----------- |
| 임신 32주 출산 가방 | 타임라인 주차별 페이지 |
| 코베 베이비페어 2026 일정 | 베이비페어 상세 |

### Page-level SEO 매핑

| 페이지 | `<title>` |
| ------ | --------- |
| 홈 | 출산 준비 체크리스트 - 임신 주차별 준비 가이드 |
| 타임라인 | 임신 주차별 준비 타임라인 |
| 베이비페어 | 2026 베이비페어 일정 - 전국 행사 모음 |
| 체중 기록 | 임산부 체중 기록 & 그래프 |

### seo_slug 활용 (Phase 3+)

- `/timeline/week-32` → "임신 32주 준비 - 입원 가방 준비 시작"
- 각 주차가 독립 URL → long-tail 키워드 랜딩 페이지
- `generateStaticParams`로 빌드 시 정적 생성

---

## 데이터 전략

### 서버 저장 데이터

- 체크리스트 원본, 타임라인 원본, 베이비페어 목록, 영상 목록

### 사용자 데이터 (LocalStorage)

- dueDate, checklistState, weightLogs

### 데이터 소실 리스크 & 고지

LocalStorage 특성상 브라우저 캐시 삭제, 시크릿 모드, 기기/브라우저 변경 시 데이터 소실.

**고지 방법:**
- 첫 예정일 입력 직후: "데이터는 이 브라우저에만 저장됩니다" 토스트
- 서비스 약관: 데이터 소실 면책 명시

---

## 수익화

**Primary**: Display Ads (Google AdSense)
**Secondary**: 베이비페어 광고, 육아 제품 제휴 링크

---

## 리스크

| 리스크 | 대응 |
|--------|------|
| 임신 기간 이후 사용자 이탈 | SEO 중심 신규 유입 |
| 맘카페 중심 정보 구조 | 데이터 큐레이션 품질 확보 |
| 콘텐츠 데이터 관리 필요 | Phase 3 크롤러 자동화 |

---

## 운영 체계

### 데이터 업데이트

```bash
gsutil cp updated_checklist.json gs://pregnancy-prep-data/checklist/v1/checklist_items.json
```

### 모니터링

- Cloud Logging: 에러 / 비정상 트래픽
- Cloud Run 메트릭: 요청 수 / 레이턴시 / 인스턴스 수
- 베이비페어 크롤러: 매일 06:00 실행 결과 확인

### 비용 관리

- Cloud Run: `min-instances 0` → 트래픽 없을 때 비용 없음
- GCS: 소량 JSON, 비용 무시 수준

---

## 마일스톤 요약

| 마일스톤 | 완료 기준 | 상태 |
| -------- | --------- | ---- |
| M0: 초기 세팅 | Next.js 로컬 실행, mock 데이터 로드 확인 | ✅ |
| M1: 핵심 기능 | 체크리스트/타임라인/체중기록 + GA4 + gh-pages 배포 | ✅ |
| M1.5: PoC 고도화 | 기능 통합 + AdSense 기초 준비 (SEO/가이드/영상) | ✅ |
| M2: 콘텐츠 강화 | YouTube 세분화 + 정보글 시스템 + AdSense 승인 신청 | ✅ |
| M2.5: UX 개선 | 온보딩 + 대시보드 개편 + 리텐션 강화 | 📋 |
| M3: 베이비페어 | 크롤러 → Admin 검수 → 데이터 반영 | |
| M4: 인프라 | GCS 업로드, `DATA_SOURCE=gcs` 연결 | |
| M5: 운영 배포 | Cloud Run 배포, CI/CD 동작 확인 | |
