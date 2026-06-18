# weekly-report-wave2 코드 리뷰

> 리뷰일: 2026-06-18
> 대상 spec: [docs/features/weekly-report-wave2/spec.md](../features/weekly-report-wave2/spec.md)
> 구현 문서: [docs/implementation/weekly-report-wave2-impl.md](../implementation/weekly-report-wave2-impl.md)

## 리뷰 대상 파일

10개 (구현 문서 + git diff 기준):

### 수정
- `scripts/weekly-report/types.ts`
- `scripts/weekly-report/ga4-queries.ts`
- `scripts/weekly-report/prompt-shared.ts`
- `vitest.config.ts`

### 신규
- `scripts/weekly-report/__fixtures__/anonymize.ts`
- `scripts/weekly-report/__fixtures__/W22-anonymized.json`
- `scripts/weekly-report/__fixtures__/W23-anonymized.json`
- `scripts/weekly-report/__fixtures__/W24-anonymized.json`
- `scripts/weekly-report/__tests__/ga4-queries.test.ts`
- `scripts/weekly-report/__tests__/prompt-shared.test.ts`

### 리뷰 적용 관점
CLI 스크립트 + 데이터 fixture + 단위 테스트라 **성능·접근성 관점 N/A**. **타입 안전성·보안·정확성** 중심.

---

## Critical 이슈 (즉시 수정 완료)

**0건**. 런타임 크래시·보안 노출·잘못된 분기를 일으키는 항목 없음.

핵심 분기 정합성 재확인:
- `bandForDelta(128.6, { previousCount: 14 })` → `"incident"` (W22 시나리오 2: prev≥threshold 라 가드 미발동) ✓
- `bandForDelta(-100, { previousCount: 0 })` → `"noise"` (W24 시나리오 3: prev<threshold 다운그레이드) ✓
- `bandForDelta(-100, { previousCount: 4 })` → `"noise"` (W24 시나리오 3 모집단 가드) ✓
- `validateSchema(<§6 본문 = "(데이터 없음)">, ...)` → `valid: true` (시나리오 7) ✓
- `validateSchema(<| ... | 가 §1 본문에>, ...)` → `valid: false` + placeholder issue ✓

W22~W24 fixture 3주분이 spec §2 시나리오 1~7 을 매핑 누락 없이 커버 — unit 47/47 통과로 회귀 가드 확정.

---

## Warning (수정 권장)

### W1. `anonymize.ts` — `import.meta.url` pathname 직접 사용은 path 에 spaces 가 있으면 깨짐

- **위치**: [scripts/weekly-report/__fixtures__/anonymize.ts:39](../../scripts/weekly-report/__fixtures__/anonymize.ts#L39)
- **현재**: `const FIXTURE_DIR = path.dirname(new URL(import.meta.url).pathname);`
- **문제**: `URL.pathname` 은 URL-encoded — `/Users/foo bar/...` 같은 경로에서 `/Users/foo%20bar/...` 가 되어 `fs.writeFileSync` 가 실패. 운영자 현재 경로 `~/Documents/melancholy14/pregnancy-checklist` 에 spaces 가 없어 정상 동작하지만, 다른 머신·경로로 이전 시 1회 깨질 위험.
- **권장 수정**: `import { fileURLToPath } from "node:url"` 도입 후 `path.dirname(fileURLToPath(import.meta.url))`.
- **시급도**: 낮음 (1회용 스크립트, 운영자 단독 실행, 향후 fixture 갱신 시 재실행 시점에만 노출). 본 PR 머지 후 cleanup 시 처리 권장.

### W2. `prompt-shared.ts::validateSchema` — `extractSection` body 가 헤더 부속 텍스트를 포함

- **위치**: [scripts/weekly-report/prompt-shared.ts:167-177](../../scripts/weekly-report/prompt-shared.ts#L167-L177)
- **문제**: `## 6. 유입 채널 (sessionDefaultChannelGroup TOP)` 같은 헤더 line 에서 `## 6. 유입 채널` 다음 문자열(` (sessionDefaultChannelGroup TOP)`)이 body 시작에 포함됨. 결과적으로:
  - "empty body" 분기는 실질적으로 도달 불가 (헤더 부속 텍스트가 항상 body 첫 줄에 들어옴).
  - "no data row" 분기는 의도대로 동작 (헤더 부속 텍스트 행이 `|` / 리스트 마커가 아니라 데이터 행으로 카운트 안 됨).
- **영향**: 기능적 결과는 동일 (둘 다 invalid 로 떨어짐). 단 에러 메시지가 "empty body" 대신 "no data row" 로 표시 — qa.md §3.2 의 "본문 빈 줄" 케이스 명세와 어긋남. 본 PR unit test 가 두 메시지 모두 허용해서 통과 중.
- **권장 수정**: `extractSection` 이 헤더 line 전체를 끊고 다음 줄부터 body 시작하도록 수정. `afterHeader = startIdx + header.length` 다음에 `body 첫 \n 위치까지` skip 1줄.
- **시급도**: 낮음. 다음 단계 `/refactor` 에서 정리 가능.

### W3. `prompt-shared.ts::validateSchema` — `hasRow` 계산 중복 표현

- **위치**: [scripts/weekly-report/prompt-shared.ts:221-226](../../scripts/weekly-report/prompt-shared.ts#L221-L226)
- **현재**:
  ```ts
  const hasRow = lines
    .join("\n")
    .slice(normalized.indexOf(header) + header.length)
    .split("\n")
    .slice(0, body.split("\n").length)
    .some(...);
  ```
- **문제**: `lines.join("\n")` 은 `normalized` 와 동일, 이후 slice 한 결과의 첫 N 줄은 `body.split("\n")` 과 동일. 단순화 가능: `body.split("\n").some(...)`.
- **시급도**: 낮음. 다음 단계 `/refactor` 단순화 후보.

---

## Suggestion (개선 아이디어)

### S1. `ga4-queries.ts::queryChannelGroupAcquisition` / `queryLandingPageEntry` — limit-before-filter 패턴

- **위치**: [scripts/weekly-report/ga4-queries.ts:493-518](../../scripts/weekly-report/ga4-queries.ts#L493-L518), Q7 유사.
- **현황**: `limit: 5` (Q6) / `10` (Q7) 로 fetch 후 `(not set)` / `""` 필터. 만약 TOP 5 안에 `(not set)` 이 1행 있으면 결과는 4행만 노출.
- **검토**: 기존 `queryZeroResultSearch`·`queryExternalDomainOutflow` 가 동일 패턴 — 일관성 유지 가치 ≥ 행 수 보장 가치. 휴면기 active users 작은 모집단에서 TOP N 정확도 차이가 의사결정에 영향 거의 없음.
- **결정**: 본 PR 범위 밖, 일관성 유지. 향후 모집단 커진 후 #8 trend window 확장과 함께 재검토.

### S2. `prompt-shared.ts::validateSchema` — 동일 라인에 placeholder + sentinel 동시 → sentinel 화이트리스트로 통과

- **위치**: [scripts/weekly-report/prompt-shared.ts:200-202](../../scripts/weekly-report/prompt-shared.ts#L200-L202)
- **현황**: 단일 라인 `| ... | (신규) |` 같은 패턴은 `NEW_SENTINEL_PATTERN` 매치 우선으로 placeholder 검출 제외. 다른 라인에서 placeholder 가 또 나오면 검출됨 (test 로 검증).
- **검토**: SYSTEM_PROMPT 가 placeholder 작성 자체를 금지 + `(신규)` 셀이 들어간 행은 의미상 "직전주 0 → 비교 불가" 라 데이터 없음 표현이 자연스러움. 가능성 낮은 corner case.
- **결정**: 본 PR 디자인 그대로 유지. test 가 동작 명세화.

### S3. `ga4-queries.ts` — `POPULATION_GUARD_THRESHOLD = 10` config 노출 위치

- **위치**: [scripts/weekly-report/ga4-queries.ts:66](../../scripts/weekly-report/ga4-queries.ts#L66)
- **검토**: plan §Wave 2 메모 "10이 적정한지 W25~W27 실데이터 후 확정" — config 1줄 수정으로 끝나는 구조가 목표. 현재 module-local 상수. 추후 `.env` 또는 별도 config 파일로 분리하면 환경별 조정 가능. 단 1인 운영 환경에서는 module 상수 1줄 수정도 PR 비용 차이 없음.
- **결정**: 본 PR 그대로 유지. 운영자가 임계값 확정 시 한 줄 수정.

---

## 요약

| 구분 | 건수 | 비고 |
|------|------|------|
| Critical | 0건 발견, 0건 수정 | 런타임 크래시·보안 노출·잘못된 분기 없음 |
| Warning | 3건 | W2·W3 는 `/refactor` 후보, W1 은 향후 cleanup |
| Suggestion | 3건 | 모두 본 PR 범위 밖, 향후 재검토 |
| 빌드 | 미실행 | Critical 수정 0건이라 phase 4 건너뜀 (직전 implement-feature 단계에서 빌드 성공 확인) |

### 정합성 재확인
- spec.md §5 "기능 동작" — W22~W24 fixture 3주 모두 W24 anomaly 행이 noise (unit 검증 ✓)
- spec.md §5 "검증" — qa.md §2 시나리오 1~7 매핑: unit 47 케이스로 모두 커버 (✓)
- qa.md §3.4 mock 점검 — 두 함수 모두 pure, mock 0 (✓)

### 회귀 가드
- 기존 src/lib 테스트 215개 + scripts/weekly-report 신규 47개 = 263/263 통과 (5단계 run-e2e 검증 완료).
- 기존 `e2e/marketing-weekly-report.spec.ts` 16/16 통과 (4단계 검증 완료).

### 머지 전 manual smoke (운영자 단독)
- `npm run report:weekly:dry-run` 1회 실행 → Q6/Q7 GA4 응답 구조 실 확인 (qa.md §6 마지막 항목).
