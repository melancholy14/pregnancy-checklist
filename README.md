# pregnancy-checklist

출산/육아 체크리스트 모음

임산부와 가족이 출산 준비를 체계적으로 관리할 수 있도록 돕는 웹 서비스.

## 서비스 개요

- 출산 준비 체크리스트 제공
- 출산 예정일 기반 주차별 타임라인 자동 생성
- 연도별 베이비페어 일정 제공
- 임신 중 체중 기록 및 시각화
- 출산/육아 관련 영상 큐레이션
- 회원가입 없이 사용 가능 (LocalStorage 기반)

## 기술 스택

- **Frontend/Backend**: Next.js (Fullstack), TypeScript, React, TailwindCSS, shadcn/ui
- **상태관리**: Zustand + LocalStorage
- **인프라**: GCP Cloud Run, Google Cloud Storage, Artifact Registry, Secret Manager
- **데이터**: GCS JSON 파일 (checklist, timeline, babyfair, videos)

## 아키텍처

```text
User → Cloud Run (Next.js App) → Google Cloud Storage (JSON Data)
```

- 클라이언트: Next.js React UI + LocalStorage 개인 상태
- 서버: Next.js API Routes (JSON 데이터 fetch, 베이비페어/콘텐츠 데이터 제공)
- 캐시: Checklist/Timeline 24h, Babyfair 6h (Next.js fetch revalidate)

## 핵심 데이터

| 데이터     | 설명                                               | GCS 경로                            |
| ---------- | -------------------------------------------------- | ----------------------------------- |
| 체크리스트 | 출산 준비 항목 ~120개 (병원/가방/신생아/산후/행정) | `checklist/v1/checklist_items.json` |
| 타임라인   | 임신 4~40주 주차별 준비 행동 가이드                | `timeline/v1/timeline_items.json`   |
| 베이비페어 | 연도별 베이비페어 일정 (크롤링 + 검수)             | `babyfair/2026/events.json`         |
| 영상       | 유튜브 영상 큐레이션                               | `videos/v1/videos.json`             |

## 현재 상태

**Phase 0 완료** — Phase 1 (핵심 기능 개발) 진행 예정

| 구분 | 상태 |
|------|------|
| 프로젝트 스캐폴딩 | ✅ Next.js + TypeScript + Tailwind + shadcn/ui |
| 타입 정의 | ✅ ChecklistItem, TimelineItem, BabyfairEvent, VideoItem |
| Mock 데이터 | ✅ 체크리스트 120개, 타임라인 24개 (베이비페어/영상은 Phase 2) |
| 데이터 소스 추상화 | ✅ `data-source.ts` (local/gcs 분기) |
| UI 컴포넌트 | ✅ button, card, checkbox, tabs, badge, progress |
| 기능 페이지 | ❌ 미구현 (기본 Next.js 템플릿) |
| Zustand 스토어 | ❌ 미구현 |
| API Routes | ❌ 미구현 |

## 문서 목록 (`docs/`)

| 파일 | 설명 |
|------|------|
| [PRD v2](docs/plan/pregnancy-prep-service-prd-v2.md) | 제품 요구사항 정의서 |
| [전체 계획서](docs/plan/plan.md) | Phase 0~5 전체 개발 로드맵 |
| [Phase 1 계획](docs/phase-1/plan.md) | 핵심 기능 개발 상세 계획 |
| [Architecture](docs/infra/architecture.md) | 시스템 아키텍처 |
| [GCP 배포](docs/infra/gcp-deployment.md) | GCP Cloud Run 배포 가이드 |
| [체크리스트 데이터셋](docs/data/checklist_dataset.md) | seed 데이터 ~120개 |
| [타임라인 데이터셋](docs/data/pregnancy_timeline_dataset.md) | 주차별 타임라인 seed 데이터 |
| [주차 이벤트 데이터셋](docs/data/pregnancy_week_timeline_dataset.md) | 임신 1~40주 이벤트 |
| [베이비페어 크롤러 스펙](docs/specs/babyfair_crawler_spec.md) | 크롤러 상세 스펙 |
| [베이비페어 파이프라인](docs/specs/babyfair_data_pipeline.md) | 데이터 수집 파이프라인 |

## 개발 로드맵

| Phase | 내용 | 상태 |
|-------|------|------|
| 0 | 프로젝트 초기 세팅 | ✅ 완료 |
| 1 | 핵심 기능 개발 (체크리스트, 타임라인, 체중, 영상) | 🔜 다음 |
| 2 | 베이비페어 크롤러 & Admin UI | ⬜ |
| 3 | SEO & 품질 | ⬜ |
| 4 | GCP 인프라 세팅 | ⬜ |
| 5 | 운영 배포 & CI/CD | ⬜ |

## 디자인
The original project is available at https://www.figma.com/design/35OqjFauyykAf3Hr2LKhf7/Pregnancy-Preparation-Web-App.