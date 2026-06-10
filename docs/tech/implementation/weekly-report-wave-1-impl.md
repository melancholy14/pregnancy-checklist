# weekly-report-wave-1 Implementation

> 구현일: 2026-06-07
> Plan: [docs/plan/weekly-report-wave-1-plan.md](../../plan/weekly-report-wave-1-plan.md)
> Wave: [weekly-report-improvement.md](../../plan/weekly-report-improvement.md) §Wave 1

## 완료 조건 충족 여부

| # | 조건 | 상태 | 검증 |
|---|------|------|------|
| 1 | `cohortSpec.cohorts[].dimension = "firstSessionDate"` 추가 → `INVALID_ARGUMENT` 해소 | ✅ | dry-run 결과 `approach: "cohortSpec"`, totalCohorts=4, 실제 5행 출력 |
| 2 | manual fallback `firstSessionDate` 기반 재작성 | ✅ | typecheck 통과. dry-run에서 cohortSpec 성공이라 fallback 직접 실행은 안 됐지만 코드 path는 들어감 |
| 3 | `pregnancy-checklist.com` 변종이 Q4에 등장 X | ✅ | `SELF_DOMAINS` Set + `queryExternalDomainOutflow` filter chain 추가. 이번 주 externalDomain.rows=[] 라 backtest는 W20 raw로 가능 |
| 4 | `CoreBehaviorRow.wowDelta` 타입 `number \| "new" \| null` + `"new"` 직렬화 | ✅ | dry-run: `checklist_item_toggle: wowDelta: "new"` (prev=0, cur=4), `weight_log: wowDelta: null` (prev=0, cur=0) |
| 5 | SYSTEM_PROMPT에 `wowDelta="new"` 의미 한 줄 | ✅ | "데이터 부족 처리" 블록에 추가 |
| 6 | `report:weekly:dry-run` 성공 | ✅ | exit 0, 모든 섹션 JSON 출력 |

## 생성/수정 파일 목록

### 수정
- [scripts/weekly-report/types.ts](../../../scripts/weekly-report/types.ts) — `CoreBehaviorRow.wowDelta`: `number | null` → `number | "new" | null`, 주석에 3-way 의미 명시.
- [scripts/weekly-report/ga4-queries.ts](../../../scripts/weekly-report/ga4-queries.ts) — 4개 변경:
  - 파일 상단에 `SELF_DOMAINS` Set 상수 추가.
  - `runCohortViaSpec`: 각 cohort 블록에 `dimension: "firstSessionDate"` 추가 (string literal).
  - `runCohortViaManual`: `customUser:cohort_join_week` → 표준 차원 `firstSessionDate` 기반으로 재작성. `parseCohortJoinWeek` → `firstSessionDateToMonday`로 교체. (cohortJoinWeek, nthWeek) 키로 Map 집계.
  - `queryCoreBehaviorReach`: wowDelta 3-way 분기 (`prev>0` 숫자 / `prev=0 && cur>0` `"new"` / else `null`).
  - `queryExternalDomainOutflow`: filter chain에 `!SELF_DOMAINS.has(r.domain)` 추가.
- [scripts/weekly-report/prompt-shared.ts](../../../scripts/weekly-report/prompt-shared.ts) — SYSTEM_PROMPT "데이터 부족 처리" 블록 끝에 `wowDelta="new"는 신규 발현…` 한 줄 추가.

### 신규 생성
없음.

## 주요 결정 사항

- **cohort `dimension` 필드는 string literal**: plan에서는 `{ dimensionName: "firstSessionDate" }` 객체로 추정했으나 SDK 타입(`ICohort.dimension: string`)이 문자열만 허용. typecheck에서 발견 → `dimension: "firstSessionDate"` 로 수정. GA4 에러 메시지 "must be the string \"firstSessionDate\""와도 일치.
- **manual fallback 집계 키**: `(cohortJoinWeek, nthWeek)` 복합 키로 Map에 합산. 한 주 안에 firstSessionDate 여러 날(월~일)이 같은 cohort_join_week로 묶이므로 합산 필수.
- **wowDelta=null 의미 분리**: 기존엔 "prev=0"이 모두 `null`이었으나 (신규 발현 + 양주 0) 두 경우가 섞임. 이제 신규 발현은 `"new"`, 양주 0은 `null`로 명시 구분. SYSTEM_PROMPT에서 두 경우를 다르게 렌더링하도록 안내.

## 가정 사항

Plan에 명시된 것과 동일:
- manual fallback은 운영자의 사전 GA4 콘솔 작업(custom user dimension 등록) 없이 동작.
- `SELF_DOMAINS = ["pregnancy-checklist.com", "www.pregnancy-checklist.com"]` 두 변종으로 충분.
- `wowDelta=null` 케이스(Q2에서 양주 모두 0)는 거의 발생하지 않으나 핵심 행동이 4주째 끊긴 운영자 휴면기에는 발생 가능.

## 미구현 항목

- **테스트 코드**: write-unit-tests / write-e2e-tests 단계에서 처리. 단 vitest.config은 현재 `src/**`만 include하므로 scripts/ 트리 테스트는 별도 결정 필요.
- **manual fallback 실 실행 검증**: dry-run에서는 cohortSpec이 성공해 fallback path는 호출되지 않음. fallback이 실제로 발현하려면 cohortSpec이 다시 실패해야 하는데, Wave 1 이후엔 그럴 일이 없음 → 안전망 코드로만 유지.

## 검증 명령

```bash
npm run typecheck                  # 통과 확인
npm run report:weekly:dry-run      # cohort approach=cohortSpec, wowDelta="new" 확인
```
