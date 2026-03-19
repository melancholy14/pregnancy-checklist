# Phase 0: 프로젝트 초기 세팅 기록

**날짜**: 2026-03-19
**브랜치**: feat/init
**목표**: Next.js 뼈대 구성 + 로컬 mock 데이터 기반 동작 확인

---

## 완료 항목

### 0-1. Next.js 프로젝트 생성

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

- Next.js **16.2.0**
- React 19, TypeScript, Tailwind CSS v4, ESLint
- App Router 구조 (`src/app/`)

---

### 0-2. 패키지 설치

```bash
npx shadcn@latest init
npx shadcn@latest add button card checkbox badge tabs progress
npm install zustand recharts date-fns
```

| 패키지 | 버전 | 용도 |
|--------|------|------|
| shadcn/ui | 4.x | UI 컴포넌트 |
| zustand | latest | 전역 상태 관리 |
| recharts | latest | 체중 그래프 |
| date-fns | latest | 날짜 유틸 |

---

### 0-3. 폴더 구조

```
src/
├── app/
│   ├── checklist/
│   ├── timeline/
│   ├── babyfair/
│   ├── weight/
│   ├── videos/
│   ├── admin/babyfair/
│   └── api/
│       ├── checklist/
│       ├── timeline/
│       ├── babyfair-events/
│       ├── videos/
│       └── admin/
│           ├── crawl/babyfair/
│           └── babyfair-events/[id]/
├── components/
│   ├── ui/          # shadcn 컴포넌트
│   ├── checklist/
│   ├── timeline/
│   ├── babyfair/
│   ├── weight/
│   └── layout/
├── data/            # 로컬 mock JSON
├── lib/
├── store/
└── types/
```

---

### 0-4. Mock 데이터 (`src/data/`)

docs/data/ 내 데이터셋 문서에서 JSON 추출 → 파일 저장

| 파일 | 내용 | 초기값 |
|------|------|--------|
| `checklist_items.json` | 출산 준비 항목 120개 | checklist_dataset.md 추출 |
| `timeline_items.json` | 주차별 타임라인 27개 | pregnancy_timeline_dataset.md 추출 |
| `babyfair_events.json` | 베이비페어 행사 | `[]` (Phase 2에서 채움) |
| `videos.json` | 영상 큐레이션 | `[]` (수동 큐레이션 예정) |

---

### 0-5. 데이터 소스 추상화 (`src/lib/data-source.ts`)

```ts
// DATA_SOURCE=local  → src/data/ 에서 읽음  (기본값)
// DATA_SOURCE=gcs    → GCS 버킷에서 읽음    (Phase 4)
export async function fetchData<T>(path: string): Promise<T>
```

환경변수 하나(`DATA_SOURCE`)로 local ↔ GCS 전환. API Route 코드 변경 없음.

---

### 0-6. 환경변수

- `.env.local` — 로컬 개발용 (gitignore)
- `.env.example` — 템플릿 (커밋)

```env
DATA_SOURCE=local
ADMIN_SECRET=local-dev-secret
```

---

### 0-7. 타입 정의 (`src/types/`)

| 파일 | 타입 |
|------|------|
| `checklist.ts` | `ChecklistItem` |
| `timeline.ts` | `TimelineItem` |
| `babyfair.ts` | `BabyfairEvent` |
| `video.ts` | `VideoItem` |

---

## 검증

```bash
npm run build  # ✅ 정상 통과
```

빌드 출력:
- `/` → Static prerendered
- `/_not-found` → Static prerendered

---

## 특이사항

- `create-next-app`이 기존 디렉토리(README.md 존재)에 설치 불가 → 임시 디렉토리 생성 후 파일 이동
- 파일 이동 후 `node_modules/.bin/next`가 일반 파일로 복사되어 모듈 경로 오류 발생 → symlink로 교체하여 해결

```bash
rm node_modules/.bin/next
ln -s ../next/dist/bin/next node_modules/.bin/next
```
