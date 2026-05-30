# marketing-weekly-report 리팩토링

> 작성일: 2026-05-13  근거: [review.md](../review/marketing-weekly-report-review.md)

## 리팩토링한 파일 목록
- `scripts/weekly-report/types.ts`
- `scripts/weekly-report/ga4-queries.ts`
- `scripts/weekly-report/claude-prompt.ts`

---

## 작업별 내용

### 1. types.ts — `WeeklyDateRange` 주석 정정
- **출처**: Warning #1
- **무엇을**: `endDate` 주석 "Sunday → Saturday window" → "Monday → Sunday window (ISO week)". `startDate`에도 "ISO week starts Monday" 한 줄 추가.
- **왜**: 실제 구현(`startOfISOWeek` 월요일 기준)과 주석 사이의 불일치가 향후 윈도우 계산을 잘못 따라가게 만들 수 있음.

### 2. ga4-queries.ts — 수동 코호트 fallback의 ISO 연도 경계 처리
- **출처**: Warning #2
- **무엇을**:
  - 차원에 `customUser:cohort_join_week` + `isoWeek` + `isoYear` 3개를 함께 요청해 각 행의 active 주의 절대 위치를 복원.
  - `parseCohortJoinWeek("YYYY-Www")` 헬퍼 추가 — ISO 8601 규칙(1월 4일은 항상 W1)에 따라 라벨을 월요일 Date로 변환.
  - `nthWeek = differenceInCalendarISOWeeks(activeMonday, joinMonday)`로 교체. ISO 주 번호 단순 빼기가 사라져 12월/1월 경계에서도 정확한 값을 반환.
- **왜**: 이전 구현은 `Number("W52") - Number("04") = 48` 형태의 오프셋을 만들어 모든 연말·연초 코호트 행을 음수 nthWeek로 만들고 필터에서 잘림. fallback이 가장 신뢰 받아야 할 시점(cohortSpec 미사용 시)에 정작 1년에 한 번씩 누락이 발생.

### 3. ga4-queries.ts — `cohorts` 배열 명시 타입
- **출처**: Suggestion #1 (사용자 확인 후 포함)
- **무엇을**: `const cohorts = []` → `const cohorts: CohortBlock[] = []`. 같은 블록에서 `parseISO(range.endDate)`로 문자열 직접 `new Date()` 대신 timezone-safe 파서 사용.
- **왜**: TS 추론이 동작하긴 하지만 push 인자 일치 강제는 명시 타입이 더 분명. `parseISO`는 `"YYYY-MM-DD"`를 UTC로 안정 해석.

### 4. claude-prompt.ts — ephemeral 캐시 TTL 가정 주석 정확화
- **출처**: Warning #3
- **무엇을**: 파일 헤더 주석에서 "5-min TTL is irrelevant"라는 잘못된 단언을 제거. 주 1회 실행에서는 캐시가 만료되어 매번 캐시-미스 경로를 탄다는 사실과, $0.04 비용 가정이 캐시-미스 기준임을 명시. dry-run 직후 본실행 같은 동일 세션 내 재실행 시에만 캐시 적중함을 안내.
- **왜**: 코드 동작은 그대로 유지하되 비용 가정·운영 기대치를 사실에 맞춤. 코드를 읽는 운영자가 "왜 cache_read=0이 매주 찍히지?"를 의심하지 않도록.

### 5. claude-prompt.ts — frontmatter 검증의 CRLF 허용
- **출처**: Warning #4
- **무엇을**: `validateSchema`가 검증 전 `\r\n → \n`으로 정규화. 정규식과 `includes` 검사 모두 정규화된 텍스트에서 수행.
- **왜**: Claude 출력이 CRLF로 떨어질 확률은 낮으나 발생 시 정상 frontmatter도 누락으로 오판해 sentinel + raw 첨부가 매주 붙는 회귀 위험. 한 줄 정규화로 회복 탄력성 추가.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 5 (types/ga4-queries/claude-prompt/writer/index) | 5 (동일) |
| 최대 파일 줄 수 | `ga4-queries.ts` 447줄 | `ga4-queries.ts` 459줄 (cohort fallback 정확도 향상) |
| 코호트 fallback nthWeek 계산 정확도 | ISO 주 번호 빼기 — 연도 경계 음수 누락 | 날짜 기반 `differenceInCalendarISOWeeks` |
| frontmatter 검증 CRLF | 미허용 — 거짓 음성 발생 가능 | 정규화 후 검사 |
| `cohorts` 배열 타입 | 추론(any/never[] 의존) | `CohortBlock[]` 명시 |
| 캐시 TTL 가정 주석 | "5-min TTL is irrelevant" (오해 소지) | 캐시-미스 기준임을 명시 |

---

## 빌드 결과
성공 (1회 시도, `npm run build` 32 페이지 정적 생성)
