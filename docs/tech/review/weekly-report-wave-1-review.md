# weekly-report-wave-1 코드 리뷰

> 리뷰일: 2026-06-07
> 대상 Plan: [docs/plan/weekly-report-wave-1-plan.md](../../plan/weekly-report-wave-1-plan.md)
> 구현 문서: [docs/implementation/weekly-report-wave-1-impl.md](../implementation/weekly-report-wave-1-impl.md)

## 리뷰 대상 파일

- `scripts/weekly-report/types.ts`
- `scripts/weekly-report/ga4-queries.ts`
- `scripts/weekly-report/prompt-shared.ts`

## 적용 관점

- 타입 안전성: ✅
- 성능: N/A (one-shot Node 스크립트, 매주 1회 launchd)
- 보안: N/A (변경 부분은 GA4 응답 매핑 + 프롬프트 문자열 — 외부 입력 없음)
- 접근성: N/A (UI 없음)
- 정합성·도메인 정확성: ✅ (스크립트 도메인 특성상 핵심 관점)

---

## Critical 이슈 (즉시 수정 완료)

없음.

---

## Warning (수정 권장)

### 1. runCohortViaManual — lookback window 밖 cohort가 결과에 포함될 수 있음

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

## Suggestion (개선 아이디어)

### 1. firstSessionDateToMonday — 날짜 값 범위 검증 추가 여지

- **위치**: [scripts/weekly-report/ga4-queries.ts:170-180](../../../scripts/weekly-report/ga4-queries.ts#L170-L180)
- 현재는 `^\d{8}$` 패턴만 검증. `new Date(Date.UTC(2026, 98, 99))` 같은 overflow 입력은 valid date로 강제 변환됨.
- GA4가 정상적인 `YYYYMMDD`를 보내므로 실무 위험은 0에 가깝지만, 방어 코드를 굳이 둔다면 month ∈ [1,12], day ∈ [1,31] 정도 추가 가능. ROI 낮음 → 안 해도 무방.

### 2. CohortBlock 인라인 타입

- **위치**: [scripts/weekly-report/ga4-queries.ts:130-134](../../../scripts/weekly-report/ga4-queries.ts#L130-L134)
- 함수 안에서 `CohortBlock` 타입을 별도로 선언하지 않고 `cohorts.push({ name, dimension: "firstSessionDate" as const, dateRange: {...} })` 같이 인라인으로 처리해도 typecheck 통과. 가독성 vs 명시성 trade-off 수준.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견 |
| Warning | 1건 (runCohortViaManual lookback 필터) |
| Suggestion | 2건 |
| 빌드 | 미실행 (Critical 수정 없음 — Phase 2에서 dry-run으로 이미 검증) |

Warning 1건은 next 단계(/refactor)에서 옵션으로 처리 가능. 안전망 코드라 우선순위 낮음.
