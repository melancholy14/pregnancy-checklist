# weekly-report-wave-1

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-06-07

<!-- STEP:impl -->
## 구현

> 구현일: 2026-06-07
> Plan: [docs/plan/weekly-report-wave-1-plan.md](../../plan/weekly-report-wave-1-plan.md)
> Wave: [weekly-report-improvement.md](../../plan/weekly-report-improvement.md) §Wave 1

### 완료 조건 충족 여부

| # | 조건 | 상태 | 검증 |
|---|------|------|------|
| 1 | `cohortSpec.cohorts[].dimension = "firstSessionDate"` 추가 → `INVALID_ARGUMENT` 해소 | ✅ | dry-run 결과 `approach: "cohortSpec"`, totalCohorts=4, 실제 5행 출력 |
| 2 | manual fallback `firstSessionDate` 기반 재작성 | ✅ | typecheck 통과. dry-run에서 cohortSpec 성공이라 fallback 직접 실행은 안 됐지만 코드 path는 들어감 |
| 3 | `pregnancy-checklist.com` 변종이 Q4에 등장 X | ✅ | `SELF_DOMAINS` Set + `queryExternalDomainOutflow` filter chain 추가. 이번 주 externalDomain.rows=[] 라 backtest는 W20 raw로 가능 |
| 4 | `CoreBehaviorRow.wowDelta` 타입 `number \| "new" \| null` + `"new"` 직렬화 | ✅ | dry-run: `checklist_item_toggle: wowDelta: "new"` (prev=0, cur=4), `weight_log: wowDelta: null` (prev=0, cur=0) |
| 5 | SYSTEM_PROMPT에 `wowDelta="new"` 의미 한 줄 | ✅ | "데이터 부족 처리" 블록에 추가 |
| 6 | `report:weekly:dry-run` 성공 | ✅ | exit 0, 모든 섹션 JSON 출력 |

### 생성/수정 파일 목록

#### 수정
- [scripts/weekly-report/types.ts](../../../scripts/weekly-report/types.ts) — `CoreBehaviorRow.wowDelta`: `number | null` → `number | "new" | null`, 주석에 3-way 의미 명시.
- [scripts/weekly-report/ga4-queries.ts](../../../scripts/weekly-report/ga4-queries.ts) — 4개 변경:
  - 파일 상단에 `SELF_DOMAINS` Set 상수 추가.
  - `runCohortViaSpec`: 각 cohort 블록에 `dimension: "firstSessionDate"` 추가 (string literal).
  - `runCohortViaManual`: `customUser:cohort_join_week` → 표준 차원 `firstSessionDate` 기반으로 재작성. `parseCohortJoinWeek` → `firstSessionDateToMonday`로 교체. (cohortJoinWeek, nthWeek) 키로 Map 집계.
  - `queryCoreBehaviorReach`: wowDelta 3-way 분기 (`prev>0` 숫자 / `prev=0 && cur>0` `"new"` / else `null`).
  - `queryExternalDomainOutflow`: filter chain에 `!SELF_DOMAINS.has(r.domain)` 추가.
- [scripts/weekly-report/prompt-shared.ts](../../../scripts/weekly-report/prompt-shared.ts) — SYSTEM_PROMPT "데이터 부족 처리" 블록 끝에 `wowDelta="new"는 신규 발현…` 한 줄 추가.

#### 신규 생성
없음.

### 주요 결정 사항

- **cohort `dimension` 필드는 string literal**: plan에서는 `{ dimensionName: "firstSessionDate" }` 객체로 추정했으나 SDK 타입(`ICohort.dimension: string`)이 문자열만 허용. typecheck에서 발견 → `dimension: "firstSessionDate"` 로 수정. GA4 에러 메시지 "must be the string \"firstSessionDate\""와도 일치.
- **manual fallback 집계 키**: `(cohortJoinWeek, nthWeek)` 복합 키로 Map에 합산. 한 주 안에 firstSessionDate 여러 날(월~일)이 같은 cohort_join_week로 묶이므로 합산 필수.
- **wowDelta=null 의미 분리**: 기존엔 "prev=0"이 모두 `null`이었으나 (신규 발현 + 양주 0) 두 경우가 섞임. 이제 신규 발현은 `"new"`, 양주 0은 `null`로 명시 구분. SYSTEM_PROMPT에서 두 경우를 다르게 렌더링하도록 안내.

### 가정 사항

Plan에 명시된 것과 동일:
- manual fallback은 운영자의 사전 GA4 콘솔 작업(custom user dimension 등록) 없이 동작.
- `SELF_DOMAINS = ["pregnancy-checklist.com", "www.pregnancy-checklist.com"]` 두 변종으로 충분.
- `wowDelta=null` 케이스(Q2에서 양주 모두 0)는 거의 발생하지 않으나 핵심 행동이 4주째 끊긴 운영자 휴면기에는 발생 가능.

### 미구현 항목

- **테스트 코드**: write-unit-tests / write-e2e-tests 단계에서 처리. 단 vitest.config은 현재 `src/**`만 include하므로 scripts/ 트리 테스트는 별도 결정 필요.
- **manual fallback 실 실행 검증**: dry-run에서는 cohortSpec이 성공해 fallback path는 호출되지 않음. fallback이 실제로 발현하려면 cohortSpec이 다시 실패해야 하는데, Wave 1 이후엔 그럴 일이 없음 → 안전망 코드로만 유지.

### 검증 명령

```bash
npm run typecheck                  # 통과 확인
npm run report:weekly:dry-run      # cohort approach=cohortSpec, wowDelta="new" 확인
```

---

<!-- STEP:review -->
## 코드 리뷰

> 리뷰일: 2026-06-07
> 대상 Plan: [docs/plan/weekly-report-wave-1-plan.md](../../plan/weekly-report-wave-1-plan.md)
> 구현 문서: [docs/implementation/weekly-report-wave-1-impl.md](#구현)

### 리뷰 대상 파일

- `scripts/weekly-report/types.ts`
- `scripts/weekly-report/ga4-queries.ts`
- `scripts/weekly-report/prompt-shared.ts`

### 적용 관점

- 타입 안전성: ✅
- 성능: N/A (one-shot Node 스크립트, 매주 1회 launchd)
- 보안: N/A (변경 부분은 GA4 응답 매핑 + 프롬프트 문자열 — 외부 입력 없음)
- 접근성: N/A (UI 없음)
- 정합성·도메인 정확성: ✅ (스크립트 도메인 특성상 핵심 관점)

---

### Critical 이슈 (즉시 수정 완료)

없음.

---

### Warning (수정 권장)

#### 1. runCohortViaManual — lookback window 밖 cohort가 결과에 포함될 수 있음

- **위치**: [scripts/weekly-report/ga4-queries.ts:182-226](../../../scripts/weekly-report/ga4-queries.ts#L182-L226)
- **문제**:
  manual fallback 쿼리는 `dateRanges: [{ startDate: lookbackStart, endDate: range.endDate }]`로 *active 세션의 날짜 범위*만 제한한다. firstSessionDate 자체는 lookback 밖일 수 있어 (예: 6개월 전 첫 세션 사용자가 이번 주에 다시 활성), 그 사용자의 `cohort_join_week`이 응답에 포함된다.
  반면 `runCohortViaSpec`은 cohort 블록 8개를 명시적으로 정의해 lookback 8주 안에서 첫 세션을 가진 사용자만 집계한다.

  → 두 경로의 출력 형태(cohort_join_week 분포·`totalCohorts`)가 일치하지 않을 가능성. 안전망 코드라 실제 실행은 cohortSpec이 실패할 때만 발생.

- **권장 수정**: 집계 루프 안에 `joinMonday >= cohortStartMonday` 필터를 추가하거나, 쿼리 단에서 `firstSessionDate` 기반 `dimensionFilter`로 lookback 범위 제한.

  ```ts
  const cohortStartMonday = startOfISOWeek(addDays(parseISO(range.endDate), -7 * COHORT_LOOKBACK_WEEKS + 1));
  // ... 루프 안에서
  if (joinMonday < cohortStartMonday) continue;
  ```

- **왜 Critical이 아닌가**: fallback path는 cohortSpec 성공 시 실행되지 않음 (Wave 1 #1 수정 후 cohortSpec은 안정). "여분 cohort"가 포함되더라도 데이터 자체는 정확. AI 프롬프트에 행이 더 들어가는 정도의 영향.

---

### Suggestion (개선 아이디어)

#### 1. firstSessionDateToMonday — 날짜 값 범위 검증 추가 여지

- **위치**: [scripts/weekly-report/ga4-queries.ts:170-180](../../../scripts/weekly-report/ga4-queries.ts#L170-L180)
- 현재는 `^\d{8}$` 패턴만 검증. `new Date(Date.UTC(2026, 98, 99))` 같은 overflow 입력은 valid date로 강제 변환됨.
- GA4가 정상적인 `YYYYMMDD`를 보내므로 실무 위험은 0에 가깝지만, 방어 코드를 굳이 둔다면 month ∈ [1,12], day ∈ [1,31] 정도 추가 가능. ROI 낮음 → 안 해도 무방.

#### 2. CohortBlock 인라인 타입

- **위치**: [scripts/weekly-report/ga4-queries.ts:130-134](../../../scripts/weekly-report/ga4-queries.ts#L130-L134)
- 함수 안에서 `CohortBlock` 타입을 별도로 선언하지 않고 `cohorts.push({ name, dimension: "firstSessionDate" as const, dateRange: {...} })` 같이 인라인으로 처리해도 typecheck 통과. 가독성 vs 명시성 trade-off 수준.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견 |
| Warning | 1건 (runCohortViaManual lookback 필터) |
| Suggestion | 2건 |
| 빌드 | 미실행 (Critical 수정 없음 — Phase 2에서 dry-run으로 이미 검증) |

Warning 1건은 next 단계(/refactor)에서 옵션으로 처리 가능. 안전망 코드라 우선순위 낮음.

---

<!-- STEP:refactor -->
## 리팩토링

> 작업일: 2026-06-07
> Plan: [docs/plan/weekly-report-wave-1-plan.md](../../plan/weekly-report-wave-1-plan.md)
> 리뷰: [docs/review/weekly-report-wave-1-review.md](#코드-리뷰)

### 리팩토링한 파일 목록

- `scripts/weekly-report/ga4-queries.ts` (runCohortViaManual)

---

### 작업별 내용

#### 1. ga4-queries.ts — runCohortViaManual lookback window 필터 추가

- **출처**: Warning (리뷰 §Warning 1)
- **무엇을**:
  - `cohortStartMonday`를 함수 상단에서 1회 계산 (`startOfISOWeek` 적용).
  - `lookbackStart`는 동일 값을 `yyyy-MM-dd`로 포맷 (이중 계산 제거).
  - 집계 루프 안에 `if (joinMonday < cohortStartMonday) continue;` 추가.
- **왜**:
  GA4 `dateRanges`는 *active 세션 날짜*만 제한한다. firstSessionDate가 lookback 윈도 밖(예: 6개월 전 첫 세션)인 사용자가 이번 주에 활성이면 응답 행에 포함된다. cohortSpec 경로는 명시적 cohort 블록 8개로 "지난 8주 첫 세션 사용자"만 집계하므로, manual fallback이 cohortSpec와 같은 cohort 집합을 갖도록 맞추는 게 두 경로의 출력 일관성에 옳다.
- **동작 변경 여부**: 없음 (lookback 안의 cohort는 동일 결과). 추가로 lookback 밖 cohort만 제외.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 3개 (수정) | 3개 (수정 — 동일) |
| runCohortViaManual 줄 수 | 45줄 | 50줄 (cohortStartMonday 추출 + 컷오프) |
| cohortSpec/manual 출력 일관성 | manual이 추가 cohort 포함 가능 | 두 경로 동일 8주 cohort 집합 |

---

### 검증

- `npm run typecheck` — 통과
- `npm run report:weekly:dry-run` — 통과 (`cohort approach=cohortSpec`, 결과 형태 동일)
- 동작 변경 0 (fallback 경로는 dry-run에서 호출되지 않으므로 실 실행 시 추가 검증 가치는 낮음 — 안전망 코드)
