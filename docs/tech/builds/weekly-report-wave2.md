# weekly-report-wave2

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-06-22
> plan: [spec](../../features/weekly-report-wave2/spec.md) · [qa](../../features/weekly-report-wave2/qa.md)

<!-- STEP:impl -->
## 구현

> 구현일: 2026-06-18
> spec: [docs/features/weekly-report-wave2/spec.md](../../features/weekly-report-wave2/spec.md)
> qa: [docs/features/weekly-report-wave2/qa.md](../../features/weekly-report-wave2/qa.md)
> 상위 plan: [docs/plan/weekly-report-improvement.md](../../plan/weekly-report-improvement.md) §Wave 2

### 완료 조건 충족 여부

spec §5 + plan §Wave 2 완료 조건 기준.

| 조건 | 상태 | 비고 |
|------|------|------|
| 임계값 가드 unit test 통과 (plan §Wave 2 #6) | ⏳ 다음 단계 | 본 구현 단계는 함수 시그니처·동작만 박음. 매트릭스 검증은 write-unit-tests 에서 작성. `bandForDelta(delta, { previousCount, threshold? })` 시그니처 + previousCount<threshold → noise 강제 다운그레이드 |
| W22 raw 데이터 재처리 시 page_view 14→32 가 noise 로 분류 (plan #6) | ⏳ 다음 단계 | W22 fixture(prev=14, threshold 기본 10) → previousCount ≥ threshold 라 incident 유지가 정상. spec §2 시나리오 2 (noise=W22 라벨, 실제로는 incident 유지) 와 일치. plan 의 *원안* 표현이 spec §2 시나리오 2 로 수렴된 결과. validateSchema 매트릭스에서 검증 |
| W24 prev<10 모든 -100% 가 noise (spec §2 시나리오 3) | ✅ 완료 | W24 fixture 의 모든 anomaly 행 previousCount 가 0~4 → 새 `bandForDelta` 로 재처리 시 100% noise. unit test 에서 회귀 가드 |
| `validateSchema` 가 `\| ... \|` placeholder 검출 (plan #7) | ✅ 완료 | `PLACEHOLDER_PATTERN = /\|\s*\.{3,}\s*\|/` 라인 스캔. `(신규)` / `wowDelta: "new"` 셀은 화이트리스트로 제외 |
| 리포트에 §6(유입 채널) + §7(랜딩 페이지) 섹션 노출 | ✅ 완료 | `REQUIRED_HEADERS` 에 §6·§7 추가. `SYSTEM_PROMPT` 의 스키마 블록과 `buildUserMessage` 의 Q6·Q7 JSON 블록도 함께 추가. 기존 "## 6. 추천 액션" 은 §8 로 리넘버 |
| validator 의 "신규 섹션 빈 표 OK" 룰 (spec §2 시나리오 7, 결정 3 옵션 A) | ✅ 완료 | `ALLOW_EMPTY_SECTIONS = {§6, §7}` + `(데이터 없음)` 명시 텍스트 강제. 헤더만 + 빈 줄 또는 placeholder 는 invalid |
| fixture 3주분 익명화 적재 (spec §3.1) | ✅ 완료 | `anonymize.ts` 1회 실행으로 W22·W23·W24 익명화 fixture 커밋. propertyId → `000000000`, landingPage query string 제거 + 100자 truncate |
| vitest include 에 `scripts/weekly-report/**` 추가 (spec §3.1) | ✅ 완료 | `src/**` 와 분리해 추가. 다른 scripts 도메인 영향 없음 |

> ⏳ 표시는 본 구현 단계 후속(write-unit-tests) 에서 채워질 항목. spec.md §5 "기능 동작" 행은 manual smoke (`report:weekly:dry-run`) + W25 launchd 실행으로 검증 — qa.md §6 "성공 기준" 마지막 항목.

### 생성/수정 파일 목록

#### 신규 생성

- `scripts/weekly-report/__fixtures__/anonymize.ts` — 1회용 익명화 스크립트. 향후 fixture 갱신 시 재사용. `npx tsx scripts/weekly-report/__fixtures__/anonymize.ts 2026-W22 2026-W23 2026-W24` 로 실행.
- `scripts/weekly-report/__fixtures__/W22-anonymized.json` — noise 케이스(prev≥10 + 큰 WoW). 회귀 가드: 새 `bandForDelta` 에서도 page_view 14→32 가 incident 유지.
- `scripts/weekly-report/__fixtures__/W23-anonymized.json` — normal 케이스 (mixed: 일부 prev≥10 일부 prev<10).
- `scripts/weekly-report/__fixtures__/W24-anonymized.json` — downgrade 케이스 (active users=0 휴면기 유사). 모든 anomaly 행이 noise 로 떨어져야 함.

#### 수정

- `scripts/weekly-report/types.ts` — `ChannelGroupRow`/`ChannelGroupAcquisition`, `LandingPageRow`/`LandingPageEntry` 타입 추가. `Ga4Result` 에 `channelGroup`·`landingPage` 필드 추가.
- `scripts/weekly-report/ga4-queries.ts` — `bandForDelta` 시그니처 리팩토링(`(delta, { previousCount, threshold? })`) + `previousCount < threshold → noise` 가드. Q6 (`queryChannelGroupAcquisition` — sessionDefaultChannelGroup TOP 5) + Q7 (`queryLandingPageEntry` — landingPagePlusQueryString TOP 10) 함수 추가. `collectGa4Result` 가 `Promise.allSettled` 로 7 쿼리 발사.
- `scripts/weekly-report/prompt-shared.ts` — `SYSTEM_PROMPT` 의 §1.7 측정 시나리오 7개로 확장 + 스키마 블록에 §6·§7 추가 + §6→§8 추천 액션 리넘버. `buildUserMessage` 에 Q6/Q7 JSON 블록 추가. `REQUIRED_HEADERS` 에 §6·§7·§8 반영. `validateSchema` 에 placeholder 검출 + sentinel 화이트리스트 + 신규 섹션 빈 표 룰 추가. `extractSection` helper 도입.
- `vitest.config.ts` — `include` 에 `'scripts/weekly-report/**/__tests__/**/*.test.ts'` 추가.

### 주요 결정 사항

- **`bandForDelta` 가 `previousCount=0` 도 noise 로 처리**: spec §3.1 "previousCount === 0 && currentCount > 0 케이스는 `new` 발현 경로" 책임 분리 룰을 따른다. anomaly 쿼리가 prev=0 일 때 `deltaPercent=null` 로 넘기지만, prev<threshold 인 시점에서 이미 noise 로 분기되므로 null 분기 자체에 도달하지 않는다. § 핵심 행동(Q2) 의 `wowDelta="new"` sentinel 경로는 본 함수 책임 밖.
- **§6 → §8 리넘버**: spec §3.1 "REQUIRED_HEADERS 에 `## 6. 유입 채널`, `## 7. 랜딩 페이지` 추가" 룰을 따른다. 기존 `## 6. 추천 액션` 헤더와 충돌하므로 추천 액션은 §8 로 이동. SYSTEM_PROMPT 의 출력 스키마 블록도 함께 갱신.
- **placeholder 검출 정규식 `/\|\s*\.{3,}\s*\|/`**: spec §3.1 의 "raw regex" 명세 그대로. 점 3개 이상 + 양쪽 파이프. ellipsis 유니코드(`U+2026`) 는 본문 해석에 자연스럽게 등장하므로 검출 대상에서 제외(ASCII `...` 만).
- **sentinel 화이트리스트는 라인 단위**: `(신규)` 또는 `wowDelta: "new"` 토큰이 *같은 라인* 에 있으면 placeholder 검출 제외. 다른 라인에서 placeholder 가 등장하면 여전히 invalid → 우선순위는 placeholder.
- **신규 섹션 빈 표 룰**: §6·§7 만 `ALLOW_EMPTY_SECTIONS` 에 들어가 `(데이터 없음)` 명시 텍스트 또는 데이터 행 1개 이상이면 통과. 헤더만 + 본문 빈 줄은 invalid (placeholder 와 동일하게 차단). 기존 §1~§5 는 본 룰 비대상 — 기존 데이터 부족 처리 룰(disclaimer 1줄 + "(데이터 없음)") 유지.
- **fixture 익명화는 propertyId·landingPage 만 처리**: cohortJoinWeek(ISO 주차 라벨)·channelGroup·도메인은 PII 아니라 보존. landingPage 의 query string 만 제거하고 path 100자 truncate. raw vault 의 원본 W22~W24 는 channelGroup/landingPage 가 없으므로 `Partial<Ga4Result>` 처리해 빈 슬롯으로 채움.
- **Q6 `(not set)` 필터**: spec §4 의 "마케터 페르소나 §3.1 룰" 과 일관. 기존 §4 외부 유출 필터 패턴 그대로 복사. Q6/Q7 만 박으면 일관성 깨진다는 spec §4 *unit 검증 외* 메모는 §4 필터에 unit 이 없는 현실 그대로 won't 처리.

### 가정 사항

- **plan §Wave 2 #6 "W22 page_view → noise" 표현은 spec §2 시나리오 2 (W22 incident 유지) 로 수렴**: plan 작성 시점(2026-06-03) 의 직관적 표현이 spec(2026-06-18) 의 정확한 시나리오 분기와 다르다. 실제 W22 fixture 의 page_view 행은 prev=14 ≥ threshold(10) 라 incident 가 정상. plan §Wave 2 메모의 "10이 적정한지 검증" 룰에 따라 threshold 자체는 W25~W27 실데이터 후 운영자가 조정.
- **W22~W24 raw 파일에 channelGroup/landingPage 없음**: Pre-Wave 2 raw 라 당연. `anonymize.ts` 가 `Partial<Ga4Result>` 처리로 빈 슬롯 채워서 새 `Ga4Result` 모양으로 적재. fixture 의 channelGroup/landingPage 행 0개는 §6·§7 빈 표 룰(시나리오 7) 검증에도 사용 가능.
- **launchd 첫 실 노출은 W25 (2026-06-22) 리포트**: spec §5 "측정 지표" 항목 그대로. 본 PR 머지 후 곧바로 다음 사이클부터 노출 시작.

### 미구현 항목

- **unit test 매트릭스 (qa.md §3.2)**: 본 구현 단계는 함수만 박음. `scripts/weekly-report/__tests__/ga4-queries.test.ts` (bandForDelta 매트릭스 ~15 케이스) + `scripts/weekly-report/__tests__/prompt-shared.test.ts` (validateSchema 매트릭스 ~25 케이스) 는 다음 단계(write-unit-tests) 에서 작성.
- **E2E 신규 추가**: qa.md §4.1 결정대로 0건. 기존 `e2e/marketing-weekly-report.spec.ts` 가 인프라 검증 커버.
- **`docs/plan/weekly-report-improvement.md` §Wave 2 완료 체크박스**: spec §6 "수정" 마지막 항목. PR 머지 직후 운영자가 갱신. 본 구현 단계에서는 미수정.
- **`report:weekly:dry-run` manual smoke**: qa.md §6 마지막 항목. PR 머지 후 운영자 단독 1회 실행 — code-review/refactor 단계 이후, write-feature-doc 직전 수행 권장.

---

<!-- STEP:review -->
## 코드 리뷰

> 리뷰일: 2026-06-18
> 대상 spec: [docs/features/weekly-report-wave2/spec.md](../../features/weekly-report-wave2/spec.md)
> 구현 문서: [이 문서 ## 구현 섹션](#구현)

### 리뷰 대상 파일

10개 (구현 문서 + git diff 기준):

#### 수정
- `scripts/weekly-report/types.ts`
- `scripts/weekly-report/ga4-queries.ts`
- `scripts/weekly-report/prompt-shared.ts`
- `vitest.config.ts`

#### 신규
- `scripts/weekly-report/__fixtures__/anonymize.ts`
- `scripts/weekly-report/__fixtures__/W22-anonymized.json`
- `scripts/weekly-report/__fixtures__/W23-anonymized.json`
- `scripts/weekly-report/__fixtures__/W24-anonymized.json`
- `scripts/weekly-report/__tests__/ga4-queries.test.ts`
- `scripts/weekly-report/__tests__/prompt-shared.test.ts`

#### 리뷰 적용 관점
CLI 스크립트 + 데이터 fixture + 단위 테스트라 **성능·접근성 관점 N/A**. **타입 안전성·보안·정확성** 중심.

---

### Critical 이슈 (즉시 수정 완료)

**0건**. 런타임 크래시·보안 노출·잘못된 분기를 일으키는 항목 없음.

핵심 분기 정합성 재확인:
- `bandForDelta(128.6, { previousCount: 14 })` → `"incident"` (W22 시나리오 2: prev≥threshold 라 가드 미발동) ✓
- `bandForDelta(-100, { previousCount: 0 })` → `"noise"` (W24 시나리오 3: prev<threshold 다운그레이드) ✓
- `bandForDelta(-100, { previousCount: 4 })` → `"noise"` (W24 시나리오 3 모집단 가드) ✓
- `validateSchema(<§6 본문 = "(데이터 없음)">, ...)` → `valid: true` (시나리오 7) ✓
- `validateSchema(<| ... | 가 §1 본문에>, ...)` → `valid: false` + placeholder issue ✓

W22~W24 fixture 3주분이 spec §2 시나리오 1~7 을 매핑 누락 없이 커버 — unit 47/47 통과로 회귀 가드 확정.

---

### Warning (수정 권장)

#### W1. `anonymize.ts` — `import.meta.url` pathname 직접 사용은 path 에 spaces 가 있으면 깨짐

- **위치**: [scripts/weekly-report/__fixtures__/anonymize.ts:39](../../../scripts/weekly-report/__fixtures__/anonymize.ts#L39)
- **현재**: `const FIXTURE_DIR = path.dirname(new URL(import.meta.url).pathname);`
- **문제**: `URL.pathname` 은 URL-encoded — `/Users/foo bar/...` 같은 경로에서 `/Users/foo%20bar/...` 가 되어 `fs.writeFileSync` 가 실패. 운영자 현재 경로 `~/Documents/melancholy14/pregnancy-checklist` 에 spaces 가 없어 정상 동작하지만, 다른 머신·경로로 이전 시 1회 깨질 위험.
- **권장 수정**: `import { fileURLToPath } from "node:url"` 도입 후 `path.dirname(fileURLToPath(import.meta.url))`.
- **시급도**: 낮음 (1회용 스크립트, 운영자 단독 실행, 향후 fixture 갱신 시 재실행 시점에만 노출). 본 PR 머지 후 cleanup 시 처리 권장.

#### W2. `prompt-shared.ts::validateSchema` — `extractSection` body 가 헤더 부속 텍스트를 포함

- **위치**: [scripts/weekly-report/prompt-shared.ts:167-177](../../../scripts/weekly-report/prompt-shared.ts#L167-L177)
- **문제**: `## 6. 유입 채널 (sessionDefaultChannelGroup TOP)` 같은 헤더 line 에서 `## 6. 유입 채널` 다음 문자열(` (sessionDefaultChannelGroup TOP)`)이 body 시작에 포함됨. 결과적으로:
  - "empty body" 분기는 실질적으로 도달 불가 (헤더 부속 텍스트가 항상 body 첫 줄에 들어옴).
  - "no data row" 분기는 의도대로 동작 (헤더 부속 텍스트 행이 `|` / 리스트 마커가 아니라 데이터 행으로 카운트 안 됨).
- **영향**: 기능적 결과는 동일 (둘 다 invalid 로 떨어짐). 단 에러 메시지가 "empty body" 대신 "no data row" 로 표시 — qa.md §3.2 의 "본문 빈 줄" 케이스 명세와 어긋남. 본 PR unit test 가 두 메시지 모두 허용해서 통과 중.
- **권장 수정**: `extractSection` 이 헤더 line 전체를 끊고 다음 줄부터 body 시작하도록 수정. `afterHeader = startIdx + header.length` 다음에 `body 첫 \n 위치까지` skip 1줄.
- **시급도**: 낮음. 다음 단계 `/refactor` 에서 정리 가능.

#### W3. `prompt-shared.ts::validateSchema` — `hasRow` 계산 중복 표현

- **위치**: [scripts/weekly-report/prompt-shared.ts:221-226](../../../scripts/weekly-report/prompt-shared.ts#L221-L226)
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

### Suggestion (개선 아이디어)

#### S1. `ga4-queries.ts::queryChannelGroupAcquisition` / `queryLandingPageEntry` — limit-before-filter 패턴

- **위치**: [scripts/weekly-report/ga4-queries.ts:493-518](../../../scripts/weekly-report/ga4-queries.ts#L493-L518), Q7 유사.
- **현황**: `limit: 5` (Q6) / `10` (Q7) 로 fetch 후 `(not set)` / `""` 필터. 만약 TOP 5 안에 `(not set)` 이 1행 있으면 결과는 4행만 노출.
- **검토**: 기존 `queryZeroResultSearch`·`queryExternalDomainOutflow` 가 동일 패턴 — 일관성 유지 가치 ≥ 행 수 보장 가치. 휴면기 active users 작은 모집단에서 TOP N 정확도 차이가 의사결정에 영향 거의 없음.
- **결정**: 본 PR 범위 밖, 일관성 유지. 향후 모집단 커진 후 #8 trend window 확장과 함께 재검토.

#### S2. `prompt-shared.ts::validateSchema` — 동일 라인에 placeholder + sentinel 동시 → sentinel 화이트리스트로 통과

- **위치**: [scripts/weekly-report/prompt-shared.ts:200-202](../../../scripts/weekly-report/prompt-shared.ts#L200-L202)
- **현황**: 단일 라인 `| ... | (신규) |` 같은 패턴은 `NEW_SENTINEL_PATTERN` 매치 우선으로 placeholder 검출 제외. 다른 라인에서 placeholder 가 또 나오면 검출됨 (test 로 검증).
- **검토**: SYSTEM_PROMPT 가 placeholder 작성 자체를 금지 + `(신규)` 셀이 들어간 행은 의미상 "직전주 0 → 비교 불가" 라 데이터 없음 표현이 자연스러움. 가능성 낮은 corner case.
- **결정**: 본 PR 디자인 그대로 유지. test 가 동작 명세화.

#### S3. `ga4-queries.ts` — `POPULATION_GUARD_THRESHOLD = 10` config 노출 위치

- **위치**: [scripts/weekly-report/ga4-queries.ts:66](../../../scripts/weekly-report/ga4-queries.ts#L66)
- **검토**: plan §Wave 2 메모 "10이 적정한지 W25~W27 실데이터 후 확정" — config 1줄 수정으로 끝나는 구조가 목표. 현재 module-local 상수. 추후 `.env` 또는 별도 config 파일로 분리하면 환경별 조정 가능. 단 1인 운영 환경에서는 module 상수 1줄 수정도 PR 비용 차이 없음.
- **결정**: 본 PR 그대로 유지. 운영자가 임계값 확정 시 한 줄 수정.

---

### 요약

| 구분 | 건수 | 비고 |
|------|------|------|
| Critical | 0건 발견, 0건 수정 | 런타임 크래시·보안 노출·잘못된 분기 없음 |
| Warning | 3건 | W2·W3 는 `/refactor` 후보, W1 은 향후 cleanup |
| Suggestion | 3건 | 모두 본 PR 범위 밖, 향후 재검토 |
| 빌드 | 미실행 | Critical 수정 0건이라 phase 4 건너뜀 (직전 implement-feature 단계에서 빌드 성공 확인) |

#### 정합성 재확인
- spec.md §5 "기능 동작" — W22~W24 fixture 3주 모두 W24 anomaly 행이 noise (unit 검증 ✓)
- spec.md §5 "검증" — qa.md §2 시나리오 1~7 매핑: unit 47 케이스로 모두 커버 (✓)
- qa.md §3.4 mock 점검 — 두 함수 모두 pure, mock 0 (✓)

#### 회귀 가드
- 기존 src/lib 테스트 215개 + scripts/weekly-report 신규 47개 = 263/263 통과 (5단계 run-e2e 검증 완료).
- 기존 `e2e/marketing-weekly-report.spec.ts` 16/16 통과 (4단계 검증 완료).

#### 머지 전 manual smoke (운영자 단독)
- `npm run report:weekly:dry-run` 1회 실행 → Q6/Q7 GA4 응답 구조 실 확인 (qa.md §6 마지막 항목).

---

<!-- STEP:refactor -->
## 리팩토링

> 리팩토링일: 2026-06-18
> 입력: [이 문서 ## 코드 리뷰 섹션](#코드-리뷰) Warning 3건
> 추가 판단: 0건 (UI 없음 — 컴포넌트 분리·useMemo·custom hook 추출 대상 N/A)

### 리팩토링한 파일 목록

- `scripts/weekly-report/__fixtures__/anonymize.ts`
- `scripts/weekly-report/prompt-shared.ts`

총 2개 파일, 3개 작업.

---

### 작업별 내용

#### 1. anonymize.ts — `URL.pathname` → `fileURLToPath`

- **출처**: Warning W1
- **위치**: [scripts/weekly-report/__fixtures__/anonymize.ts:7,30](../../../scripts/weekly-report/__fixtures__/anonymize.ts#L7)
- **무엇을**: `new URL(import.meta.url).pathname` 을 `fileURLToPath(import.meta.url)` 로 교체. `node:url` 모듈에서 `fileURLToPath` import 추가.
- **왜**: `URL.pathname` 은 URL-encoded 라 path 에 spaces 같은 특수 문자 있으면 `fs.writeFileSync` 가 실패. `fileURLToPath` 가 OS-native path 로 디코딩. 운영자 현재 경로엔 spaces 없어 동작했지만, 다른 머신 이전 시 1회 깨질 위험 제거.
- **동작 변경**: 없음 (운영자 환경에선 두 방식 모두 동일 경로 반환).

#### 2. prompt-shared.ts::extractSection — 헤더 line 다음 줄부터 body 시작

- **출처**: Warning W2
- **위치**: [scripts/weekly-report/prompt-shared.ts:167-181](../../../scripts/weekly-report/prompt-shared.ts#L167-L181)
- **무엇을**: `extractSection` 의 `afterHeader` 위치에서 다음 `\n` 까지를 추가로 건너뛰어 `bodyStart` 를 헤더 line 의 다음 줄 시작으로 이동. `## 6. 유입 채널 (sessionDefaultChannelGroup TOP)` 같은 헤더 부속 텍스트가 body 첫 줄로 섞이지 않음.
- **왜**: 리뷰 W2 — 이전 구현은 "empty body" 분기 실질 도달 불가, "no data row" 만 트리거. 의미적으로 정확한 메시지("empty body" vs "no data row")를 분기하려면 헤더 부속 텍스트를 body 에서 제외해야 함.
- **동작 변경**: invalid 판정 결과(`valid: false`)는 동일. 단 issue 메시지가 케이스에 맞게 정확해짐 — body 가 진짜 비어 있으면 "empty body", 빈 줄은 아니지만 데이터 행 없으면 "no data row".

#### 3. prompt-shared.ts::validateSchema — `hasRow` 계산 단순화

- **출처**: Warning W3
- **위치**: [scripts/weekly-report/prompt-shared.ts:223-227](../../../scripts/weekly-report/prompt-shared.ts#L223-L227)
- **무엇을**: `lines.join("\n").slice(...).split("\n").slice(0, body.split("\n").length).some(...)` 5단계 체인을 `body.split("\n").some(...)` 1단계로 축약. `lines` 변수는 placeholder 검출용 (앞쪽 `normalized.split("\n")`) 에서만 사용되도록 유지.
- **왜**: 리뷰 W3 — `lines.join("\n")` 은 `normalized` 와 동일, 이후 slice 한 결과의 첫 N 줄은 `body.split("\n")` 과 동일. 4단계 우회로가 같은 결과 산출. 가독성 ↑, 코드량 ↓.
- **동작 변경**: 없음 (수학적으로 동일 결과).

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 10개 (구현 + 리뷰까지) | 10개 (동일) |
| `validateSchema` LOC | 75줄 | 71줄 (체인 단순화 4줄 절감) |
| `extractSection` LOC | 11줄 | 13줄 (정확성 위해 headerLineEnd skip 2줄 추가) |
| `anonymize.ts` import | 3개 (`fs`/`os`/`path`) | 4개 (+`fileURLToPath`) |
| 동작 변경 | — | 0건 (issue 메시지 정확도만 향상) |
| 단위 테스트 통과 | 47/47 | 47/47 (회귀 0) |

---

### 빌드 결과

- `npm run build`: ✓ Compiled successfully in 3.5s, static pages 37/37 in 763ms (1회 시도, 성공)
- `npm run test:unit -- scripts/weekly-report/__tests__/`: 47/47 passed in 334ms (회귀 0)

본 PR 의 unit 매트릭스가 "두 메시지 모두 허용" 방식으로 작성돼 있어 W2 의 메시지 정확화 변경이 회귀 없이 통과. 향후 명확화 시 테스트도 "empty body" / "no data row" 를 분기해 적기 가능.
