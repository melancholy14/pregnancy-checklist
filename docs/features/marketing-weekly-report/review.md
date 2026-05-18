# marketing-weekly-report 리뷰

> 작성일: 2026-05-12
> 상태: decided
> size: M
> 관련 스펙: [spec.md](./spec.md) (생성 후)

## 1. 기능 요약
GA4 Data API + Claude API(Sonnet 4.6)를 호출하는 Node 스크립트(`scripts/weekly-report/`)로 매주 마크다운 리포트를 Obsidian vault(`60-analytics/weekly/`)에 출력. D-Data 누적 전 코드·스키마·dry-run 마감, 데이터 누적 후 실데이터 검증은 별도 라운드.

## 2. 적용 페어 + 선택 이유
- **dev x marketer**: 본 기능의 유일한 충돌 축. 5개 GA4 쿼리 범위, prompt caching 비용 전략, 빈 데이터 처리, 스키마 락인이 모두 개발-마케팅 접점. 디자이너·기획자는 UI/사용자 플로우 없어 무관.

## 3. 페어별 충돌

### 페어: dev x marketer

#### T0: 페어 시작 선언
- 이전 페어 [없음] 의 양보·합의는 이 페어에 영향 없음.
- dev, marketer 의 persona.md "희생 거부" 섹션 참조:
  - dev: §6.4 보안 기본기, §6.5 안전망 우회 금지
  - marketer: §3.6 측정 락인 깨기 금지, §3.7 운영자 번아웃 무시 금지, §3.1 PII 보호

#### T1: [dev] 단독 입장
- 잃는 것:
  1. 쿼리 완전성 — 코호트 리텐션은 GA4 무료 property의 cohortSpec 지원 범위 불확실. 억지로 맞추면 유지보수↑.
  2. dry-run 신뢰도 — D-Data 부재 상태에서 빈 응답 핸들링만으로는 실데이터 edge case 누락 위험.
- 희생 거부 인용: "E2E 빨강을 무시하고 배포 X. 빨강이면 원인 찾는다." — docs/tech/persona.md §6.5
- 주장:
  1. cohortSpec fallback 전략 필수.
  2. 이상치 쿼리(±5% 변동)는 4주 이동평균 데이터 필요 → D-Data 전 dead code → 2차로 미루자.
  3. prompt caching breakpoint 설계가 비용 $0.04/회를 좌우. 변동 부분 매주 바뀌면 cache hit 예상보다 낮을 수 있음.
- 잔재 자기검증: 이전 페어 없음 — N

#### T2: [marketer] 반박 입장
- A 발언에 대한 명시 반박: "이상치를 2차로 미루자"에 반박 — §1.9.6 스키마 "5. 이상치·마찰점"이 확정 출력 계약. 빼면 스키마 깨짐. 2주차부터 직전주 대비 계산 가능하므로 dead code 아님.
- 잃는 것:
  1. 쿼리 정밀도 — cohortSpec 제약 시 수동 계산 fallback은 consent 거부 사용자 누락으로 모수 축소.
  2. 첫 리포트 인사이트 품질 — 2주 데이터로 노이즈 크고 운영자 신뢰 위험.
- 희생 거부 인용: "이벤트명·파라미터 키·user_property 정의 임의 변경/삭제 금지 — 신규는 추가만" — docs/marketing/persona.md §3.6
- 희생 거부 인용 2: "1인 운영자에게 매일 수동 작업이 필요한 캠페인 강요 금지" — docs/marketing/persona.md §3.7
- 주장:
  1. 5개 쿼리 전부 1차 라운드 필수. 하나 빼면 스키마 구조 깨짐.
  2. cohortSpec fallback 수용하되 같은 포맷으로 출력.
  3. 데이터 부족 첫 리포트엔 disclaimer 자동 삽입.
- 잔재 자기검증: 이전 페어 없음 — N

#### T3: 핵심 충돌 + 숨은 가정
- 핵심 충돌: 이상치 쿼리 범위 — dev "4주 데이터 없으면 dead code, 2차로" vs marketer "스키마 락인 + 운영자 추가 라운드 부담 → 1차에 전부"
- 숨은 가정: GA4 무료 property에서 cohortSpec API가 정상 동작한다는 가정. 제한되면 북극성 지표(코호트 리텐션) 품질이 크게 떨어짐.

## 4. 미해결 트레이드오프

- [x] 항목 1: 이상치 쿼리(직전주 대비 ±5% 변동) 1차 포함 여부
  - 옵션 A — 5개 전부 1차 포함: 즉시 +0.5일 / 나중 비용 없음 (스키마 완결, 2차 불필요)
  - 옵션 B — 4개만 1차, 이상치 2차: 즉시 비용 없음 / 나중 스키마 변형·2차 라운드 부담·리포트 비교 단절
  - **결정:** A — 5개 전부 1차 포함. 스키마 락인 존중 + 2차 라운드 부담 회피.

- [x] 항목 2: GA4 Cohort API fallback 전략
  - 옵션 A — cohortSpec 우선 + session_start fallback 이중 경로: 즉시 +0.5일 / 나중 fallback 유지보수
  - 옵션 B — session_start 수동 계산 단일 경로: 즉시 단순 / 나중 cohortSpec 가용 시 마이그레이션
  - 옵션 C — dry-run에서 cohortSpec 가용성 먼저 확인 후 결정: 즉시 dry-run 1회 / 나중 없음 (사실 기반)
  - **결정:** C — dry-run에서 cohortSpec 가용성 먼저 확인 후 구현 경로 결정. 사실 기반 의사결정.

## 5. 결정
1. **이상치 쿼리**: A — 5개 쿼리 전부 1차 라운드에 포함. §1.9.6 스키마 6개 섹션 완결. 데이터 부족 시 disclaimer 자동 삽입으로 처리.
2. **Cohort API fallback**: C — 구현 시작 전 dry-run으로 cohortSpec 가용성을 사실(fact)로 확인. 결과에 따라 단일 경로 또는 이중 경로 결정. dry-run은 D1 완료 상태이므로 즉시 가능.

## 6. 우선순위 영향
- 항목 1 옵션 B 선택 시: 묶음 L 완료 후 이상치 쿼리 추가를 위한 패치 라운드 필요 (0.5일 추정). phase-4.5 §1.8 상태 갱신이 "부분 완료"로 바뀜.
- 항목 2 옵션 C 선택 시: dry-run 선행이 본 라운드 시작 조건에 추가됨. D1 완료 상태이므로 즉시 가능하나 결과에 따라 구현 방향이 달라짐.
