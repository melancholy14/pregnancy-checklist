# Docs Index

## 폴더 구조

```text
docs/
├── tech/                       기술 단일 진실 (현재 상태)
│   ├── persona.md              개발 협업 페르소나·주의사항
│   ├── folder.md               폴더 구조 가이드
│   ├── spec.md                 개발 스펙 (스택/환경변수/라우트)
│   ├── design.md               설계·디자인 패턴·방법론
│   ├── infra.md                인프라 (현재 + 진행 예정)
│   ├── impl.md                 구현 인덱스 (검색·스크립트 상세)
│   ├── review.md               리팩토링 미완료 항목 인덱스
│   ├── technical-debt.md       살아있는 기술 부채만
│   ├── implementation/         feature별 구현 보고서
│   ├── review/                 feature별 코드 리뷰 결과
│   └── refactor/               feature별 리팩토링 결과
├── marketing/                  마케팅 단일 진실
│   ├── persona.md              마케터 페르소나·룰
│   └── ga4.md                  GA4 이벤트 카탈로그
├── design/                     디자인 단일 진실
│   ├── persona.md              디자이너 페르소나
│   └── {home,timeline,checklist,info,baby-fair,weight}/  영역별 ux.md/ui.md
├── content/                    기획·콘텐츠 단일 진실
│   ├── persona.md              기획자 페르소나·룰
│   ├── done.md                 구현 완료 정리 (기획 시각)
│   ├── plan.md                 미구현 영역 (기획 시각)
│   ├── backlog.md              이월·보류 항목
│   ├── blog-writer-persona.md  블로그 작성 페르소나 SoT
│   └── image-sop.md            AI 이미지 운영 SOP
├── qa/                         QA 단일 진실
│   └── persona.md              QA 페르소나 (write-unit/e2e/run-e2e 스킬이 로드)
├── plan/                       5축 횡단 plan + PRD
│   ├── plan.md                 마스터 PRD + Phase 0~7 전체 계획
│   ├── phase-2.5.md ~ phase-5.md  phase별 plan
│   ├── adsense-audit.md        AdSense 신청 직전 체크리스트
│   └── specs/babyfair_crawler_spec.md  Phase 5 크롤러 스펙
├── features/                   feature-plan 산출물 (spec·meta·design·ga4·qa·review)
├── ops/                        운영 문서 (operating-model·github-secrets·adsense-application-checklist)
└── README.md                   이 인덱스
```

## 핵심 문서 (작업 시작 전 항상 먼저)

| 영역 | 위치 | 용도 |
| ---- | ---- | ---- |
| 코드 현재 진실 | [tech/](tech/) | 새 기능 작업 전 |
| 마스터 PRD + 전체 계획 | [plan/plan.md](plan/plan.md) | 의사결정 |
| 진행 중 phase | [plan/phase-4.5.md](plan/phase-4.5.md) | 현재 작업 묶음 |
| 페르소나별 시각 | [marketing/persona.md](marketing/persona.md) · [design/persona.md](design/persona.md) · [content/persona.md](content/persona.md) · [qa/persona.md](qa/persona.md) | 도메인 결정 |

## 단일 진실(SoT) 컨벤션

| 폴더 | SoT 성격 |
| ---- | -------- |
| `tech/` | 코드·아키텍처 (개발자 시각) |
| `marketing/` | 측정·운영 (마케터 시각) |
| `design/` | 디자인 시스템 (디자이너 시각) |
| `content/` | 기획·콘텐츠 (기획자 시각) |
| `qa/` | 테스트·품질 (QA 시각) |
| `plan/` | 5축 횡단 — PRD, phase plan, 외부 스펙 |

새 문서는 위 6개 위치 중 하나로 들어가야 함. 페르소나 축이 있으면 해당 폴더, 없으면 `plan/`.
