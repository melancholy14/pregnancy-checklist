# 인스타 카드뉴스 제작·발행 스케줄

발행 글(`src/content/articles/`) → 인스타 캐러셀 카드뉴스 변환 큐.
정렬 기준: **저장·공유 밀도순** (표·체크리스트·수치 밀도 높은 글 우선).
목적: AdSense 재신청 SEO 시그널용 최소 존재감 유지 (본격 마케팅 드라이브는 산후 복귀 후).

- 발행 주기: **주 1회 (매주 목요일)**, 수동 발행
- Day 1 앵커: **2026-07-16(목) = 1번 제작·발행일**. 이후 +7일씩 자동 cascade — 앵커일만 바꾸면 전체 날짜 이동.
- 제작 도구: `/cardnews` 스킬 → `tools/cardnews/decks/<slug>.json` → `export.mjs` → `tools/cardnews/out/<slug>/*.png`

## ✅ 이미 제작 완료 (5종)

| deck | 대응 글 | 장수 |
|---|---|---|
| `intro` | (계정 소개용) | 4 |
| `weight-management` | 임신 중 체중관리 | 7 |
| `gov-benefits-2026` | 2026 정부 혜택 | 7 |
| `foods-to-avoid` | 금지·주의 음식 | 7 |
| `babyfair` | 베이비페어 활용법 | 7 |

## 📅 제작 큐 (남은 15편)

| # | 발행일 | slug | 주제 | 카드 포맷 근거 | 상태 |
|---|---|---|---|---|---|
| 1 | 2026-07-24 (금) 제작완료 | `2026-parental-leave-guide` | 출산휴가·육아휴직 정책 | 급여·기간 표 + 정부혜택 세트 시너지 | ✅ (deck: `parental-leave-2026`, 9장) |
| 2 | 2026-07-23 (목) | `pregnancy-supplements-by-week` | 임산부 영양제 주차별 | 주차별 복용 타임라인 표 | ⬜ |
| 3 | 2026-07-30 (목) | `weekly-prenatal-checklist` | 주차별 검사 총정리 | 체크리스트 정석 | ⬜ |
| 4 | 2026-08-06 (목) | `pregnancy-childcare-reduced-work-hours` | 임신기 단축근무 | 제도 조건 표, 워킹맘 저장각 | ⬜ |
| — | **2026-08-13** | 🍼 **출산 예정일 · 산후 3개월 휴면 시작** | | 아래부터는 수동 발행 불가 → 예약 발행 필요 | |
| 5 | 2026-08-13 (목) | `preeclampsia-symptoms-prevention` | 임신중독증 | 증상·위험군 안전 정보 | ⬜ |
| 6 | 2026-08-20 (목) | `late-pregnancy-common-symptoms` | 후기 흔한 증상 TOP5 | 정상 vs 병원 신호 대조 카드 | ⬜ |
| 7 | 2026-08-27 (목) | `early-pregnancy-tests` | 초기 필수검사 | 검사 항목 리스트 | ⬜ |
| 8 | 2026-09-03 (목) | `prenatal-insurance-preparation-guide` | 태아보험 5가지 | "22주 데드라인" 후킹 | ⬜ |
| 9 | 2026-09-10 (목) | `postpartum-care-center-guide` | 산후조리원 고르기 | 비교기준 7 + 예약 캘린더 | ⬜ |
| 10 | 2026-09-17 (목) | `birth-methods-32-weeks` | 분만 방법 비교 | 자연·제왕·자연주의 비교표 | ⬜ |
| 11 | 2026-09-24 (목) | `pregnancy-exercise-starter-guide` | 임산부 운동 4주 플랜 | 4주 단계 플랜 | ⬜ |
| 12 | 2026-10-01 (목) | `pregnancy-sleep-positions-guide` | 임산부 수면 자세 | 자세 비교 시각화 | ⬜ |
| 13 | 2026-10-08 (목) | `mid-pregnancy-lifestyle-guide` | 중기 생활 가이드 | 운동·영양·검사 종합 | ⬜ |
| 14 | 2026-10-15 (목) | `early-pregnancy-fatigue-reasons` | 초기 피곤 이유 5 | 원인 5가지 리스트 | ⬜ |
| 15 | 2026-10-22 (목) | `prenatal-education-guide` | 태교 가이드 | 시기별 방법 | ⬜ |

## ⚠️ 수동 발행 vs 산후 휴면 충돌

- **수동으로 실제 발행 가능한 건 #1~#4 (7/16~8/6, 출산 전)** 까지가 현실적.
- **#5(8/13)부터는 산후 휴면기에 걸림** → 수동으로는 못 올림. 두 갈래 중 택1:
  1. **지금 #5~#15를 미리 배치 제작해두고 Meta Business Suite에 주 1회 예약 발행** → 휴면기 내내 자동 발행, 손 안 댐 (권장)
  2. #4까지만 올리고 나머지는 산후 복귀 후 재개 → 8월 중순~11월 계정 정지 (AdSense 시그널·알고리즘 관점 불리)
- 제작 자체는 집중 개발 4주 안에 미리 몰아서 끝내두는 게 안전.
