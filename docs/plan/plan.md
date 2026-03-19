# 개발 계획서 (plan.md)

**서비스**: 출산 준비 체크리스트 웹 서비스
**스택**: Next.js (Fullstack) + TypeScript + TailwindCSS + shadcn/ui + GCP
**목표**: 로컬에서 mock 데이터로 완성 → 인프라 연결 → 운영 배포

---

## 전체 단계 요약

| Phase | 환경 | 내용 | 산출물 |
| ----- | ---- | ---- | ------ |
| 0 | 로컬 | 프로젝트 초기 세팅 | Next.js 앱 뼈대, mock 데이터 |
| 1 | 로컬 | 핵심 기능 개발 | 체크리스트, 타임라인, 체중기록, 영상 |
| 2 | 로컬 | 베이비페어 크롤러 & Admin UI | 크롤러, 검수 UI |
| 3 | 로컬 | SEO & 품질 | SEO, 성능, 광고 슬롯 |
| 4 | GCP | 인프라 세팅 | GCS, Cloud Run, Secret Manager |
| 5 | GCP | 운영 배포 | Docker, CI/CD, Cloud Scheduler |

> **로컬 개발 원칙**: GCS 없이 `src/data/` 로컬 JSON 파일로 동작.
> API Routes는 데이터 소스를 추상화해 mock ↔ GCS 전환이 환경변수 하나로 된다.

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

> `@google-cloud/storage`는 Phase 4에서 추가. 로컬에선 불필요.

### 0-3. 폴더 구조

```text
src/
├── app/
│   ├── page.tsx                      # 홈 (due date 입력)
│   ├── checklist/page.tsx
│   ├── timeline/page.tsx
│   ├── babyfair/page.tsx
│   ├── weight/page.tsx
│   ├── videos/page.tsx
│   ├── admin/
│   │   └── babyfair/page.tsx         # 관리자 검수 UI
│   └── api/
│       ├── checklist/route.ts
│       ├── timeline/route.ts
│       ├── babyfair-events/route.ts
│       ├── videos/route.ts
│       └── admin/
│           ├── crawl/babyfair/route.ts
│           └── babyfair-events/[id]/route.ts
├── components/
│   ├── ui/                           # shadcn components
│   ├── checklist/
│   ├── timeline/
│   ├── babyfair/
│   ├── weight/
│   └── layout/
├── data/                             # ← 로컬 mock JSON (Phase 0에서 생성)
│   ├── checklist_items.json
│   ├── timeline_items.json
│   ├── babyfair_events.json
│   └── videos.json
├── lib/
│   ├── data-source.ts                # ← mock/GCS 분기 핵심 모듈
│   ├── week-calculator.ts
│   └── date-utils.ts
├── store/
│   ├── useDueDateStore.ts
│   ├── useChecklistStore.ts
│   └── useWeightStore.ts
└── types/
    ├── checklist.ts
    ├── timeline.ts
    ├── babyfair.ts
    └── video.ts
```

### 0-4. Mock 데이터 준비 (`src/data/`)

`docs/checklist_dataset.md`, `docs/pregnancy_timeline_dataset.md` 안의 JSON 블록을
그대로 추출해서 파일로 저장.

```bash
src/data/checklist_items.json     # checklist_dataset.md 의 JSON 배열
src/data/timeline_items.json      # pregnancy_timeline_dataset.md 의 JSON 배열
src/data/babyfair_events.json     # 빈 배열 [] 로 시작, 크롤러 완성 후 채움
src/data/videos.json              # 수동 큐레이션 또는 빈 배열로 시작
```

### 0-5. 데이터 소스 추상화 (`src/lib/data-source.ts`)

로컬(mock)과 GCS를 환경변수 하나로 분기. API Routes는 이 함수만 호출하면 된다.

```ts
// DATA_SOURCE=local  → src/data/ 에서 읽음  (기본값, 로컬 개발)
// DATA_SOURCE=gcs    → GCS 버킷에서 읽음    (운영)

export async function fetchData<T>(path: string): Promise<T> {
  if (process.env.DATA_SOURCE === 'gcs') {
    return fetchFromGCS<T>(path);       // Phase 4에서 구현
  }
  return fetchFromLocal<T>(path);       // 로컬 JSON 파일 읽기
}

async function fetchFromLocal<T>(path: string): Promise<T> {
  const fs = await import('fs/promises');
  const filePath = `${process.cwd()}/src/data/${path}`;
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}
```

### 0-6. 환경변수

```bash
# .env.local (로컬 개발 — 커밋 안 함)
DATA_SOURCE=local
ADMIN_SECRET=local-dev-secret

# .env.example (커밋)
DATA_SOURCE=local
GCS_BUCKET_NAME=
YOUTUBE_API_KEY=
ADMIN_SECRET=
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
};

// timeline.ts
export type TimelineItem = {
  week: number;
  title: string;
  description: string;
  category: string;
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

## Phase 1. 핵심 기능 개발 (로컬)

모든 기능은 `DATA_SOURCE=local` 상태에서 동작 확인.

### 1-1. API Routes

| Route | 역할 | 캐시 (운영 시) |
| ----- | ---- | -------------- |
| `GET /api/checklist` | checklist_items.json 반환 | 24h |
| `GET /api/timeline` | timeline_items.json 반환 | 24h |
| `GET /api/babyfair-events` | year, city, status 필터 지원 | 6h |
| `GET /api/videos` | videos.json 반환 | 24h |

```ts
// app/api/checklist/route.ts
import { fetchData } from '@/lib/data-source';
import { ChecklistItem } from '@/types/checklist';

export async function GET() {
  const items = await fetchData<ChecklistItem[]>('checklist_items.json');
  return Response.json(items);
}
```

> 캐시 설정은 Phase 4(GCS 연결) 이후에 `next: { revalidate }` 추가.

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

### 1-4. 타임라인

- 임신 주차별 카드 리스트
- 현재 주차 자동 스크롤
- 완료(지난 주차) / 현재 / 예정 시각적 구분

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

---

## Phase 2. 베이비페어 크롤러 & Admin UI (로컬)

> 상세 스펙: [babyfair_crawler_spec.md](babyfair_crawler_spec.md)

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

### 3-3. 광고 슬롯 준비

- `<AdUnit />` 컴포넌트 작성 (Google AdSense 자리 확보)
- 레이아웃 내 광고 위치 지정 (헤더 하단, 콘텐츠 사이)

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
| M0: 초기 세팅 | Next.js 로컬 실행, mock 데이터 로드 확인 |
| M1: 핵심 기능 | 체크리스트 / 타임라인 / 체중기록 로컬 동작 확인 |
| M2: 베이비페어 | 크롤러 실행 → Admin 검수 → `babyfair_events.json` 반영 확인 |
| M3: SEO | Lighthouse SEO 90+, sitemap 생성 확인 |
| M4: 인프라 | GCS 업로드, `DATA_SOURCE=gcs` 로컬 연결 확인 |
| M5: 운영 배포 | Cloud Run 배포, GitHub Actions CI/CD 동작 확인 |
