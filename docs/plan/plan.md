# 개발 계획서 (plan.md)

**서비스**: 출산 준비 체크리스트 웹 서비스
**스택 (PoC)**: Next.js (Static Export) + TypeScript + TailwindCSS + shadcn/ui + GitHub Pages
**스택 (운영)**: Next.js (Fullstack) + TypeScript + TailwindCSS + shadcn/ui + GCP
**목표**: PoC → gh-pages 무료 배포 검증 → 인프라 연결 → 운영 배포

---

## 전체 단계 요약

| Phase | 환경 | 내용 | 산출물 | 상태 |
| ----- | ---- | ---- | ------ | ---- |
| 0 | 로컬 | 프로젝트 초기 세팅 + Figma 디자인 이전 | Next.js static export 뼈대, 정적 JSON, Zustand store, shadcn/ui 전환, E2E 테스트 | ✅ 완료 |
| 1 | 로컬 → gh-pages | 핵심 기능 개발 + PoC 배포 + Analytics/Ads | 체크리스트(커스텀), 타임라인(커스텀), 체중기록, 영상, GA4, Google Ads | 🔜 진행 예정 |
| 2 | 로컬 | 베이비페어 크롤러 & Admin UI | 크롤러, 검수 UI | |
| 3 | 로컬 | SEO & 품질 | SEO, 성능 최적화 | |
| 4 | GCP | 인프라 세팅 | GCS, Cloud Run, Secret Manager | |
| 5 | GCP | 운영 배포 | Docker, CI/CD, Cloud Scheduler | |

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
NEXT_PUBLIC_GA_MEASUREMENT_ID=        # GA4 측정 ID (G-XXXXXXXXXX)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=        # AdSense 클라이언트 ID (ca-pub-XXXXXXXXXX)

# .env.example (커밋)
NEXT_PUBLIC_BASE_PATH=                # gh-pages 배포 시: /pregnancy-checklist
NEXT_PUBLIC_GA_MEASUREMENT_ID=        # GA4 측정 ID
NEXT_PUBLIC_ADSENSE_CLIENT_ID=        # AdSense 클라이언트 ID
```

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
  week: number;
  title: string;
  description: string;
  category: string;
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

| 이벤트 | 설명 |
| ------ | ---- |
| `page_view` | GA4 기본 (자동 수집) |
| `due_date_set` | 출산 예정일 입력 |
| `checklist_check` | 체크리스트 항목 체크/해제 |
| `custom_item_add` | 커스텀 항목 추가 |
| `weight_log` | 체중 기록 입력 |

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

---

## Phase 2. 베이비페어 크롤러 & Admin UI (로컬)

> 상세 스펙: [babyfair_crawler_spec.md](../specs/babyfair_crawler_spec.md)

### 2-1. 크롤러 (`scripts/crawl-babyfair.ts`)

- 소스 우선순위: Tier 1 (공식) → Tier 2 (행사장) → Tier 3 (집계)
- 파이프라인: `fetch HTML → extract → normalize → dedupe → save pending`
- 실행 모드: `full | incremental | verify`
- 로컬 실행 시 결과를 `src/data/babyfair_events_pending.json`에 저장

```bash
# 로컬 크롤 실행
npx ts-node scripts/crawl-babyfair.ts --mode=full
```

### 2-2. 정규화 로직

- 행사명: trim + 공식 브랜드명 보존 (베페, 코베, 맘스홀릭)
- 날짜: 한국어 날짜 → ISO 8601 (`2026-04-02`)
- 장소: `코엑스/COEX/서울 코엑스` → `COEX` 통일
- Confidence score 산출 (0.0 ~ 1.0)

### 2-3. Admin 검수 UI (`/admin/babyfair`)

- 인증: `ADMIN_SECRET` 헤더 검증
- 검수 목록: raw 원본 vs normalized 비교 뷰
- 액션: approve / reject / edit
- approve → `babyfair_events.json`에 반영 (로컬) / GCS 업로드 (운영)

### 2-4. 내부 Admin API Routes

| Route | 역할 |
| ----- | ---- |
| `POST /api/admin/crawl/babyfair/full` | 크롤러 full 실행 |
| `POST /api/admin/crawl/babyfair/incremental` | 크롤러 incremental 실행 |
| `POST /api/admin/babyfair-events/[id]/approve` | 이벤트 승인 |
| `POST /api/admin/babyfair-events/[id]/reject` | 이벤트 거부 |

---

## Phase 3. SEO & 품질 (로컬)

### 3-1. SEO 설정

```ts
// app/layout.tsx
export const metadata: Metadata = {
  title: '출산 준비 체크리스트',
  description: '임산부를 위한 출산 준비 체크리스트, 주차별 타임라인, 베이비페어 일정 제공',
  openGraph: { ... },
};
```

- `app/sitemap.ts` → `sitemap.xml` 자동 생성
- `app/robots.ts` → `robots.txt` 설정
- 각 페이지 `generateMetadata` 적용

### 3-2. 성능 최적화

- Next.js Image 컴포넌트 사용
- `next/font` 폰트 최적화
- Bundle analyzer 실행 (`@next/bundle-analyzer`)

### 3-3. 광고 최적화

> 광고 기본 설정(AdSense 스크립트, AdUnit 컴포넌트, 슬롯 배치)은 Phase 1에서 완료.
> Phase 3에서는 데이터 기반 슬롯 위치 최적화 및 광고 성능 분석.

- GA4 데이터 기반 광고 위치 A/B 테스트
- 광고가 UX를 해치지 않는지 Lighthouse 점수로 검증
- 광고 수익 / 이탈률 상관관계 분석

---

## Phase 4. GCP 인프라 세팅

> 이 단계부터 GCP 작업. 로컬 기능 개발은 완료 상태.

### 4-1. GCP 프로젝트 초기 세팅

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

### 4-2. GCS 버킷 생성 및 Seed 데이터 업로드

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

### 4-3. GCS 클라이언트 구현 (`src/lib/data-source.ts` 업데이트)

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

### 4-4. API Routes 캐시 추가

GCS 연결 후 Next.js fetch revalidate 설정.

```ts
// 24h cache (checklist, timeline, videos)
export const revalidate = 86400;

// 6h cache (babyfair)
export const revalidate = 21600;
```

### 4-5. Secret Manager 등록

```bash
echo -n "your_youtube_api_key" | \
  gcloud secrets create YOUTUBE_API_KEY --data-file=-

echo -n "your_admin_secret" | \
  gcloud secrets create ADMIN_SECRET --data-file=-
```

### 4-6. Artifact Registry 생성

```bash
gcloud artifacts repositories create pregnancy-checklist \
  --repository-format=docker \
  --location=asia-northeast3
```

---

## Phase 5. 운영 배포

### 5-1. Dockerfile

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

### 5-2. 배포 스크립트 (`scripts/deploy.sh`)

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
  --set-secrets "YOUTUBE_API_KEY=YOUTUBE_API_KEY:latest,ADMIN_SECRET=ADMIN_SECRET:latest" \
  --set-env-vars "GCS_BUCKET_NAME=pregnancy-prep-data,DATA_SOURCE=gcs" \
  --project "$PROJECT_ID"

echo "Deploy complete."
```

### 5-3. 서비스 계정 권한

```bash
SA="pregnancy-checklist-prod@appspot.gserviceaccount.com"

gcloud projects add-iam-policy-binding pregnancy-checklist-prod \
  --member="serviceAccount:$SA" \
  --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding pregnancy-checklist-prod \
  --member="serviceAccount:$SA" \
  --role="roles/secretmanager.secretAccessor"
```

### 5-4. CI/CD (GitHub Actions)

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

### 5-5. 베이비페어 크롤 스케줄 (Cloud Scheduler)

```bash
gcloud scheduler jobs create http crawl-babyfair-daily \
  --schedule="0 6 * * *" \
  --uri="https://your-cloudrun-url/api/admin/crawl/babyfair/incremental" \
  --http-method=POST \
  --headers="Authorization=Bearer $ADMIN_SECRET" \
  --time-zone="Asia/Seoul"
```

### 5-6. 배포 후 확인 체크리스트

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
| M1: 핵심 기능 | 체크리스트 / 타임라인 / 체중기록 동작 + GA4 이벤트 수신 + AdSense 슬롯 배치 + gh-pages 배포 확인 |
| M2: 베이비페어 | 크롤러 실행 → Admin 검수 → `babyfair_events.json` 반영 확인 |
| M3: SEO | Lighthouse SEO 90+, sitemap 생성 확인 |
| M4: 인프라 | GCS 업로드, `DATA_SOURCE=gcs` 로컬 연결 확인 |
| M5: 운영 배포 | Cloud Run 배포, GitHub Actions CI/CD 동작 확인 |
