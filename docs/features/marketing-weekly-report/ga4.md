# marketing-weekly-report 측정 설계

> 작성일: 2026-05-12
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조
- 5개 GA4 쿼리 전부 1차 라운드 포함 (스키마 완결)
- cohortSpec 가용성은 dry-run으로 사실 확인 후 구현 경로 결정

## 1. 측정 목표
- 핵심 질문: "이번 주 사용자 행동에서 다음 액션을 결정할 수 있는 신호가 무엇인가?"
- 의사결정 연결: 콘텐츠 우선순위(0결과 검색), 자체화 후보(외부 유출), UX 마찰점(이상치), 기능 가치(코호트 리텐션·핵심 행동)

## 2. GA4 Data API 쿼리 매트릭스

> 본 기능은 기존 이벤트를 **읽기만** 합니다. 신규 이벤트 추가·변경 없음.
> 모든 쿼리는 `@google-analytics/data` 패키지의 `BetaAnalyticsDataClient.runReport()` 사용.
> PII 파라미터(query raw 등)는 쿼리 결과에서도 정규화 후 출력 — [persona.md §3.1](../../marketing/persona.md) 준수.

### Q1. 코호트 리텐션 (북극성)

| 항목 | 값 |
|---|---|
| 출력 섹션 | 1. 북극성 -- 코호트 리텐션 |
| 측정 층 | 북극성 |
| 접근 방식 | **dry-run에서 결정** -- cohortSpec API 가용 시 `cohortSpec` 사용, 불가 시 `session_start` + `cohort_join_week` user_property 기반 수동 집계 |
| dimensions | `cohort_join_week` (user_property), `nthWeek` (cohortSpec) 또는 `week` (수동) |
| metrics | `activeUsers` (cohortSpec) 또는 `eventCount` WHERE event=session_start (수동) |
| dateRange | 직전 8주 (4주 추세 + 현재 4주 코호트) |
| 분석 | join_week별 W+1, W+4 리텐션률. 가로 방향 평탄화 = sticky, 가파름 = 일회성 |
| 빈 데이터 처리 | "코호트 데이터 부족 -- 등록 사용자 N명, 추세 판단은 4주 이후부터 유효" |

### Q2. 핵심 행동 도달률 (보조)

| 항목 | 값 |
|---|---|
| 출력 섹션 | 2. 핵심 행동 도달률 |
| 측정 층 | 보조 |
| 이벤트 | `checklist_item_toggle`, `article_read_complete`, `weight_log` |
| dimensions | `eventName` |
| metrics | `eventCount`, `totalUsers` |
| dateRange | 직전 7일 + 그 전 7일 (WoW 비교) |
| 분석 | 이벤트별 발생 사용자 수 / 전체 active users = 도달률. 직전주 대비 ±% |
| 빈 데이터 처리 | 이벤트 0건 시 "해당 행동 미발생 -- 데이터 누적 대기" |

### Q3. 0결과 검색 TOP 10 (진단)

| 항목 | 값 |
|---|---|
| 출력 섹션 | 3. 다음 콘텐츠 백로그 |
| 측정 층 | 진단 |
| 이벤트 | `search_submit` |
| filter | `results_count = 0` |
| dimensions | `customEvent:query` (정규화된 검색어) |
| metrics | `eventCount` |
| orderBy | eventCount DESC |
| limit | 10 |
| dateRange | 직전 7일 |
| 분석 | 0결과 검색어 = 콘텐츠 작성 우선순위. [ga4.md §5.4](../../marketing/ga4.md) |
| 빈 데이터 처리 | "0결과 검색 0건 -- 검색 사용량 자체가 낮거나 콘텐츠 커버리지 충분" |

### Q4. 외부 유출 TOP 도메인 (진단)

| 항목 | 값 |
|---|---|
| 출력 섹션 | 4. 자체화 후보 |
| 측정 층 | 진단 |
| 이벤트 | `external_link_click` |
| dimensions | `customEvent:domain` |
| metrics | `eventCount` |
| orderBy | eventCount DESC |
| limit | 10 |
| dateRange | 직전 7일 |
| 분석 | 정부 도메인 상위 = 정책 가이드 자체화. 의료 도메인 상위 = 병원 비교 수요. [ga4.md §5.5](../../marketing/ga4.md) |
| 빈 데이터 처리 | "외부 링크 클릭 0건 -- 데이터 누적 대기" |

### Q5. 이상치 탐지 (진단)

| 항목 | 값 |
|---|---|
| 출력 섹션 | 5. 이상치 / 마찰점 |
| 측정 층 | 진단 |
| 접근 방식 | 주요 이벤트 전체(`page_view`, `checklist_item_toggle`, `article_read_complete`, `weight_log`, `search_submit`, `external_link_click`, `empty_state_view`, `scroll_without_action`)의 직전 7일 vs 그 전 7일 eventCount 비교 |
| dimensions | `eventName` |
| metrics | `eventCount` |
| dateRange | 직전 14일을 7일씩 2구간 분리 |
| 분석 | WoW 변동 ±5% 이상 항목 추출. [ga4.md §5.1](../../marketing/ga4.md) 기준: ±5% 노이즈, ±10% 가설, ±20% 액션, ±30% 사고 |
| 빈 데이터 처리 | "비교 데이터 1주 미만 -- 이상치 탐지 불가, 다음 주부터 가능" |

## 3. 유저 프로퍼티 변경
- 없음. 기존 user_property(`cohort_join_week`, `current_pregnancy_week`, `due_date_set`)를 읽기만 함.

## 4. 깔때기·세그먼트
- 깔때기: 본 기능은 깔때기 정의가 아닌 기존 깔때기([ga4.md §5.3](../../marketing/ga4.md))의 **집계 결과를 소비**.
- 세그먼트: `cohort_join_week` 기준 코호트 슬라이싱 (Q1에서 사용).

## 5. 리포트 항목 (Obsidian vault 출력)
- §1.9.6 마크다운 스키마 6개 섹션이 Q1~Q5 + Claude 종합으로 매핑:

| 리포트 섹션 | 데이터 소스 |
|---|---|
| TL;DR | Claude 종합 (Q1~Q5 전체) |
| 1. 북극성 코호트 리텐션 | Q1 |
| 2. 핵심 행동 도달률 | Q2 |
| 3. 다음 콘텐츠 백로그 | Q3 |
| 4. 자체화 후보 | Q4 |
| 5. 이상치 / 마찰점 | Q5 |
| 6. 추천 액션 | Claude 종합 (Q1~Q5 기반 액션 도출) |
