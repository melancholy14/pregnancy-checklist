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
│   └── videos/
│   # api/ 없음 — PoC는 서버 없이 JSON 직접 import
├── components/
│   ├── ui/          # shadcn 컴포넌트
│   ├── checklist/
│   ├── timeline/
│   ├── babyfair/
│   ├── weight/
│   └── layout/
├── data/            # 정적 JSON (빌드에 포함)
├── lib/
├── store/
└── types/
```

---

### 0-4. Static Export 설정 (`next.config.ts`)

```ts
// PoC: 정적 HTML 빌드 → gh-pages 배포
const nextConfig = {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  images: { unoptimized: true },
};
export default nextConfig;
```

gh-pages 배포 시 `NEXT_PUBLIC_BASE_PATH=/pregnancy-checklist` 설정.

---

### 0-5. 정적 데이터 (`src/data/`)

docs/data/ 내 데이터셋 문서에서 JSON 추출 → 파일 저장

| 파일 | 내용 | 초기값 |
| ---- | ---- | ------ |
| `checklist_items.json` | 출산 준비 항목 120개 | checklist_dataset.md 추출 |
| `timeline_items.json` | 주차별 타임라인 27개 | pregnancy_timeline_dataset.md 추출 |
| `babyfair_events.json` | 베이비페어 행사 | `[]` (Phase 2에서 채움) |
| `videos.json` | 영상 큐레이션 | `[]` (수동 큐레이션 예정) |

컴포넌트에서 직접 `import`해서 사용. API Routes 불필요.

```ts
import checklistItems from '@/data/checklist_items.json';
```

---

### 0-6. 환경변수

- `.env.local` — 로컬 개발용 (gitignore)
- `.env.example` — 템플릿 (커밋)

```env
NEXT_PUBLIC_BASE_PATH=
# gh-pages 배포 시: NEXT_PUBLIC_BASE_PATH=/pregnancy-checklist
```

---

### 0-7. 타입 정의 (`src/types/`)

| 파일 | 타입 | 비고 |
| ---- | ---- | ---- |
| `checklist.ts` | `ChecklistItem` | `isCustom?: boolean` 포함 |
| `timeline.ts` | `TimelineItem` | `isCustom?: boolean` 포함 |
| `babyfair.ts` | `BabyfairEvent` | - |
| `video.ts` | `VideoItem` | - |

---

## 검증

```bash
npm run build  # ✅ 정상 통과 (output: 'export' 모드)
```

빌드 출력 (`out/` 디렉토리):

- `/` → Static HTML
- `/_not-found` → Static HTML

gh-pages 배포: `out/` 디렉토리를 `gh-pages` 브랜치에 푸시.

---

## 특이사항

- `create-next-app`이 기존 디렉토리(README.md 존재)에 설치 불가 → 임시 디렉토리 생성 후 파일 이동
- 파일 이동 후 `node_modules/.bin/next`가 일반 파일로 복사되어 모듈 경로 오류 발생 → symlink로 교체하여 해결

```bash
rm node_modules/.bin/next
ln -s ../next/dist/bin/next node_modules/.bin/next
```

---

## 후속 변경 사항

> Figma 디자인 이전 과정에서 발생한 변경사항은 [figma-design.md](figma-design.md) 참조.

주요 변경:

- UI 프리미티브: `@base-ui/react` → `@radix-ui/*` + shadcn/ui (Figma 이전 시 변경, 유지 결정)
- 폰트: Geist → Poppins (Figma 디자인 반영)
- Zustand store 4개 구현 완료 (`src/store/`)
- 주차 계산 유틸리티 추가 (`src/lib/week-calculator.ts`)
- Static export 설정 복원 (`output: 'export'`, `basePath`)
