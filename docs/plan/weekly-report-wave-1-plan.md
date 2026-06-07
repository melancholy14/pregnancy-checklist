# Feature Plan: weekly-report-wave-1

> 작성일: 2026-06-07
> 모체 플랜: [weekly-report-improvement.md](weekly-report-improvement.md) Wave 1
> 다음 단계: `/implement-feature docs/plan/weekly-report-wave-1-plan.md`

## 기능 목표

주간 GA4 리포트의 **측정 신뢰성**을 휴면 진입 전에 회복한다. ① cohortSpec 호출 인자 누락을 고쳐 북극성(Q1)을 부활시키고, ② Q4에서 자체 도메인이 자체화 후보로 잡히는 거짓 양성을 제거하고, ③ Q2 wowDelta가 null일 때 본문에 빈 `±%`가 출력되던 문제를 "new" sentinel로 명시화한다.

## 완료 조건 (AC)

| # | 조건 | 비고 |
|---|------|------|
| 1 | `cohortSpec.cohorts[].dimension = { dimensionName: "firstSessionDate" }` 를 박아 GA4가 `INVALID_ARGUMENT`를 던지지 않는다 | W22 raw에 기록된 정확한 에러 메시지 |
| 2 | manual fallback도 `firstSessionDate` 기반으로 재작성되어 `customUser:cohort_join_week` 미등록 환경에서도 동작 | #4 자동 해소 — Wave 1에서 같이 처리 |
| 3 | `queryExternalDomainOutflow` 응답에서 `pregnancy-checklist.com` 및 `www.pregnancy-checklist.com`이 자체화 후보 행에 등장하지 않는다 | self-domain blacklist 상수 |
| 4 | `CoreBehaviorRow.wowDelta` 타입이 `number \| "new" \| null` 이고, `prev=0 && cur>0` 일 때 `"new"`로 직렬화 | null은 양주 모두 0 (드물지만 가능) |
| 5 | SYSTEM_PROMPT에 `wowDelta="new"` 의미 한 줄 ("new = 신규 발현, 비교 불가") | 명세 |
| 6 | `npm run report:weekly:dry-run` 으로 새 구조로 호출 성공 (실제 LLM은 호출하지 않음) | 실 호출 검증 |

추론: AC #2 — 플랜 메모 "manual fallback을 `firstSessionDate` 기반으로 다시 짜면 #4는 자동 해소"를 따라, GA4 표준 차원 `firstSessionDate`(YYYYMMDD)에서 cohort_join_week를 유도하도록 재작성.

## 기술 스택

- 런타임: Node.js (tsx) — `scripts/weekly-report/` 트리 (Next.js 앱과 분리)
- GA4 SDK: `@google-analytics/data` `BetaAnalyticsDataClient`
- 테스트: Vitest (`src/**/__tests__/**/*.test.ts`만 include — scripts/는 미포함)
- TypeScript: Yes

## 레퍼런스 패턴

- [scripts/weekly-report/ga4-queries.ts:113-152](../../scripts/weekly-report/ga4-queries.ts#L113-L152) — `runCohortViaSpec` 패턴
- [scripts/weekly-report/ga4-queries.ts:367-372](../../scripts/weekly-report/ga4-queries.ts#L367-L372) — filter chain 패턴 (self-domain 필터에 적용)
- [scripts/weekly-report/ga4-queries.ts:288-303](../../scripts/weekly-report/ga4-queries.ts#L288-L303) — wowDelta 계산 위치
- [src/lib/__tests__/week-calculator.test.ts](../../src/lib/__tests__/week-calculator.test.ts) — Vitest 단위 테스트 패턴

## 구현 순서

1. **Types** — [types.ts](../../scripts/weekly-report/types.ts): `CoreBehaviorRow.wowDelta`를 `number | "new" | null`로 확장.
2. **GA4 cohortSpec (#1)** — `cohorts.push(...)` 블록에 `dimension: { dimensionName: "firstSessionDate" }` 추가.
3. **manual fallback 재작성** — `firstSessionDate` (YYYYMMDD)에서 cohort_join_week 유도.
4. **self-domain 필터 (#2)** — `SELF_DOMAINS` 상수 + `queryExternalDomainOutflow` filter chain 추가.
5. **wowDelta sentinel (#5)** — 분기 3개로 (`prev>0` 숫자, `prev=0 && cur>0` `"new"`, else `null`).
6. **프롬프트 (#5)** — SYSTEM_PROMPT에 "wowDelta='new' = 신규 발현" 한 줄 추가.
7. **검증** — `npm run typecheck` + `npm run report:weekly:dry-run`.

## 생성/수정 파일 목록

| 구분 | 경로 | 역할 |
|------|------|------|
| 수정 | scripts/weekly-report/types.ts | `CoreBehaviorRow.wowDelta` 타입 확장 |
| 수정 | scripts/weekly-report/ga4-queries.ts | cohort dimension + manual fallback 재작성 + self-domain 필터 + wowDelta sentinel |
| 수정 | scripts/weekly-report/prompt-shared.ts | SYSTEM_PROMPT에 "new" 의미 한 줄 |

## 가정 사항

- manual fallback은 GA4 표준 차원 `firstSessionDate`(YYYYMMDD)에서 cohort_join_week 라벨 유도. 운영자의 사전 콘솔 작업(`cohort_join_week` custom user dimension 등록) 불필요.
- `wowDelta=null`은 양주 모두 0 (Q2에서 거의 발생하지 않음), `"new"`는 직전주=0 & 이번주>0.
- `SELF_DOMAINS = ["pregnancy-checklist.com", "www.pregnancy-checklist.com"]`. CNAME 단일이므로 변종 없음.

## Out of Scope

- Wave 2 (#6 모집단 가드, #7 스키마 검증 강화)
- Wave 2.5 (M4 콘텐츠별 성과, M5-b 임신 주차 분포)
- Wave 0 GA4 콘솔 작업 — 2026-06-07 완료
- 새 Vitest 트리(scripts/weekly-report/__tests__/) 도입 — write-unit-tests 단계에서 결정

## 예상 리스크

1. **기존 코드와 충돌**: `queryCohortRetention`의 `approach` 분기 유지. manual fallback shape이 바뀌어도 `CohortRow` 타입을 만족하면 호출자 무영향.
2. **PRD 모호성**: `wowDelta` 타입 확장이 `openai-prompt.ts` / `claude-prompt.ts` JSON.stringify 출력에 반영됨. 문자열 sentinel은 그대로 JSON에 들어가므로 동작 OK, schema lock(§1.9.6) 영향은 SYSTEM_PROMPT 갱신으로 흡수.
3. **공유 파일**: `ga4-queries.ts`는 weekly-report 전용 — Next.js 앱 빌드와 무관.
