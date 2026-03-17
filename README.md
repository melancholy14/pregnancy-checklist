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

```
User → Cloud Run (Next.js App) → Google Cloud Storage (JSON Data)
```

- 클라이언트: Next.js React UI + LocalStorage 개인 상태
- 서버: Next.js API Routes (JSON 데이터 fetch, 베이비페어/콘텐츠 데이터 제공)
- 캐시: Checklist/Timeline 24h, Babyfair 6h (Next.js fetch revalidate)

## 핵심 데이터

| 데이터 | 설명 | GCS 경로 |
|--------|------|----------|
| 체크리스트 | 출산 준비 항목 ~120개 (병원/가방/신생아/산후/행정) | `checklist/v1/checklist_items.json` |
| 타임라인 | 임신 4~40주 주차별 준비 행동 가이드 | `timeline/v1/timeline_items.json` |
| 베이비페어 | 연도별 베이비페어 일정 (크롤링 + 검수) | `babyfair/2026/events.json` |
| 영상 | 유튜브 영상 큐레이션 | `videos/v1/videos.json` |

## 문서 목록 (`docs/`)

| 파일 | 설명 |
|------|------|
| [pregnancy-prep-service-prd-v2.md](docs/pregnancy-prep-service-prd-v2.md) | 제품 요구사항 정의서 (PRD) |
| [architecture.md](docs/architecture.md) | 시스템 아키텍처 |
| [gcp-deployment.md](docs/gcp-deployment.md) | GCP 배포 가이드 |
| [checklist_dataset.md](docs/checklist_dataset.md) | 출산 준비 체크리스트 seed 데이터셋 (~120개) |
| [pregnancy_timeline_dataset.md](docs/pregnancy_timeline_dataset.md) | 주차별 타임라인 seed 데이터셋 (타입 정의 + 25개 항목) |
| [pregnancy_week_timeline_dataset.md](docs/pregnancy_week_timeline_dataset.md) | 임신 1~40주 이벤트 데이터셋 |
| [babyfair_crawler_spec.md](docs/babyfair_crawler_spec.md) | 베이비페어 크롤러 상세 스펙 |
| [babyfair_data_pipeline.md](docs/babyfair_data_pipeline.md) | 베이비페어 데이터 수집 파이프라인 |
| [README_pregnancy_prep_docs.md](docs/README_pregnancy_prep_docs.md) | 문서 인덱스 및 권장 구현 순서 |

## 구현 순서 (권장)

1. PRD 파악 → 프로젝트 초기 설정
2. 체크리스트 데이터셋 기반 seed 생성
3. 타임라인 데이터셋 연결
4. 베이비페어 크롤러 + 관리자 검수 구축
5. SEO 페이지 생성
