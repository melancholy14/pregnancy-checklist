# weekly-report-wave2 테스트 전략

> 작성일: 2026-06-18  size: M
> 관련 리뷰: [review.md](./review.md)
> 관련 기획: [spec.md](./spec.md)
> 페르소나 SoT: [docs/qa/persona.md](../../qa/persona.md)

> **이 문서는 `/feature-pipeline` 안의 `write-unit-tests` · `write-e2e-tests` 스킬이 입력으로 읽습니다.** 시나리오마다 unit/e2e 분류를 명시했고, 모호한 결정 0건 목표.

## review.md 결정사항 참조

- **결정 1 (B)**: `bandForDelta(delta, opts: { previousCount, threshold? })` 시그니처 리팩토링. unit test 매트릭스가 임계값 9·10·11 invariant 를 직접 검증할 수 있어야 함.
- **결정 2 (B)**: W22·W23·W24 익명화 fixture 3주분. noise/incident/normal 3 케이스 회귀 가드 완비.
- **결정 3 (A)**: 4 sub-feature 한 PR. validator 의 "신규 섹션 빈 표 OK" 룰을 §2 시나리오 7 에 명시.

## 1. 기존 테스트 영향 분석

### 1.1 스캔 결과

본 PR 이 수정/추가하는 파일 (spec §6 참조):
- 수정: `scripts/weekly-report/{ga4-queries,prompt-shared,types,index}.ts`, `vitest.config.ts`
- 신규: `scripts/weekly-report/__fixtures__/W{22,23,24}-anonymized.json`, `scripts/weekly-report/__fixtures__/anonymize.ts`, `scripts/weekly-report/__tests__/{ga4-queries,prompt-shared}.test.ts`

| 영향받는 테스트 파일 | 어떤 부분이 영향받나 | 깨질 가능성 | 수정 방향 |
|---|---|---|---|
| `src/lib/__tests__/*.test.ts` (10개) | 없음 — vitest include 가 `src/**` 한정이고 weekly-report 코드를 import 하는 src 테스트 0건 (grep 결과 0) | 없음 | 수정 X |
| `e2e/marketing-weekly-report.spec.ts` | REQUIRED_FILES 5개·SDK import grep·env 검증·SA mode·실패 로그 검증 — 본 PR 은 모두 기존 파일 *내부 함수 추가/수정* 만 하므로 영향 표면 밖 | 매우 낮음 | 수정 X (검증: 본 PR 의 변경 표면이 e2e 의 정적 grep 룰과 충돌하지 않는지 PR 시점 1회 확인) |
| 기타 e2e specs (50+) | 없음 — 본 PR 은 Next.js 앱 코드 0줄 변경. UI 라우트·셀렉터 영향 없음 | 없음 | 수정 X |

스캔 명령 결과:
- `grep -rln "from.*scripts/weekly-report" src/` → 0건
- `grep -rln "ga4-queries\|prompt-shared\|weekly-report" e2e/` → 1건 (`marketing-weekly-report.spec.ts` 만)
- `grep -rln "bandForDelta\|validateSchema" e2e/` → 0건 (e2e 가 함수 내부 로직 검증 안 함)

### 1.2 데이터·schema 변경 점검

localStorage schema / Zustand store / `src/data/*.json` 구조 변경: **N**

다만 다음 *생성 산출물 schema* 변경 있음:
- `60-analytics/weekly/*.md` 의 §1.9.6 schema 에 `## 6. 유입 채널`, `## 7. 랜딩 페이지` 추가.
- `validateSchema` 의 `REQUIRED_HEADERS` 락이 두 칸 늘어남.

**호환성 점검**: 기존 vault 에 적재된 W19~W24 산출물(이미 검증된 .md) 은 *재검증* 대상이 아님. validator 는 LLM 생성 직후 1회만 호출되므로 과거 산출물에 영향 X. 사용자 데이터 손실 위험 없음.

### 1.3 회귀 가드와 충돌 점검

`e2e/design-bundle-cleanup-round.spec.ts` 등 fs-level grep 가드: **N**
- weekly-report 코드는 Next.js 앱 외부라 디자인 가드 패턴(`shadow-md`·`text-red-N`·`→`·raw hex)과 무관.
- `marketing-weekly-report.spec.ts` 의 정적 grep 가드(`'@google-analytics/data'`·`'@anthropic-ai/sdk'`·`"gpt-4o"`·`path.resolve(".env.local")`)는 본 PR 변경 표면과 0 교집합.

### 1.4 영향 요약

- 갱신 필요한 기존 테스트: **0개**
- 신규 테스트 작성 대상: **2 파일 (unit)** — bandForDelta 매트릭스 + validateSchema 매트릭스
- 합계 (`/feature-pipeline` write 단계 작업량): **2개 + fixture 익명화 1회**

## 2. 테스트 레이어 분류 (피라미드 결정)

spec.md §2 의 7 시나리오를 unit / e2e 둘 중 하나로 분류. 같은 명세 양쪽 박기 0건.

| 시나리오 (spec §2) | 레이어 | 근거 |
|---|---|---|
| 1. normal 주차 (prev≥10, |WoW|<5%) → §5 anomaly 행 0개 + §6·§7 행 채움 + validator pass | unit | `bandForDelta` + `validateSchema` 모두 pure 함수. fixture(W22) 입력으로 양 함수의 출력 검증 가능 |
| 2. noise — prev≥10 + 큰 WoW (W22 case: 14→32 +128.6%) → band="incident" 유지 | unit | `bandForDelta` 의 invariant 매트릭스. prev=14, delta=128.6 → incident |
| 3. downgrade — prev<10 → band="noise" 강제 (W24 case: 모든 이벤트 prev<10) | unit | 본 PR 의 핵심 분기. `bandForDelta` 임계값 9·10·11 단조성 invariant 포함 |
| 4. new event sentinel — wowDelta="new" 가 placeholder 검출에서 제외 | unit | `validateSchema` 의 화이트리스트 분기. 입력 markdown 에 `(신규)` 셀 또는 `wowDelta: "new"` |
| 5. placeholder leak — `\| ... \| ... \|` 검출 → invalid | unit | `validateSchema` 의 regex 매트릭스 |
| 6. acquisition visibility — §6·§7 데이터 행 노출 | unit (구조 검증) + manual smoke (실 데이터) | 본 PR 후 첫 `report:weekly:dry-run` 실행으로 GA4 응답 구조 1회 manual 확인. unit 은 fixture 입력 → §6·§7 행 ≥ 1 검증까지만 |
| 7. dormant section — §6·§7 행 0개 + "(데이터 없음)" 텍스트 → validator pass | unit | `validateSchema` 의 "신규 섹션 빈 표 허용" 룰. 결정 3 옵션 A 가 박은 룰의 단위 검증 |

**E2E 신규 추가 0건**. `e2e/marketing-weekly-report.spec.ts` 가 인프라 검증을 이미 커버 + 본 PR 의 변경은 모두 pure 함수 영역이라 사용자 흐름이 없음. QA 페르소나 §3.3 "1인 운영 — 테스트 유지 비용이 ROI 압도 X" 룰에 부합.

## 3. Unit 테스트 대상

### 3.1 대상 함수·store

- `scripts/weekly-report/ga4-queries.ts::bandForDelta` — 시그니처 리팩토링 후 매트릭스 (신규)
- `scripts/weekly-report/prompt-shared.ts::validateSchema` — placeholder 검출 + REQUIRED_HEADERS 확장 + new sentinel 분기 + 빈 표 허용 (신규)

> `unwrapFencedMarkdown`(prompt-shared.ts:146) 은 본 PR 변경 표면 밖. 테스트 X.

### 3.2 케이스 매트릭스

#### `bandForDelta(delta, { previousCount, threshold? })`

| 유형 | 케이스 |
|---|---|
| Happy Path | delta=0, prev=100 → noise / delta=15, prev=100 → hypothesis / delta=25, prev=100 → action / delta=40, prev=100 → incident |
| Boundary | delta=null, prev=0 → hypothesis (기존 동작) / delta=4.9, prev=100 → noise / delta=5, prev=100 → noise / delta=9.9 → noise / delta=10 → hypothesis / delta=20 → action / delta=30 → incident |
| Invariant — 모집단 가드 | prev=9, delta=200 → noise (다운그레이드) / prev=10, delta=200 → incident / prev=0, delta=null → noise (zero population) / **threshold 옵션 매트릭스**: threshold=5, prev=4 → noise / threshold=5, prev=5 → incident — 임계값이 한 줄 config 으로 바뀌어도 동작 단조 |
| Invariant — band 순서 | for any (delta, prev≥threshold): abs(delta) 가 커질수록 band 가 noise→hypothesis→action→incident 단조 증가 (`it.each` 매트릭스 5~7행) |

#### `validateSchema(markdown, isoWeek)`

| 유형 | 케이스 |
|---|---|
| Happy Path | 7 섹션(TL;DR + §1~§5 + §6 + §7) 모두 있고 frontmatter `week: 2026-W22` 박힌 정상 markdown → valid:true, issues:[] |
| Boundary — frontmatter | frontmatter 없음 → issues 에 "delimiters missing" + "week: ... missing" / week 라벨 불일치(W22 입력에 W21 markdown) → "week: 2026-W22 missing" |
| Boundary — REQUIRED_HEADERS | 본 PR 추가분 §6 또는 §7 누락 → 각 헤더 "section ... missing" issue |
| Priority — placeholder vs sentinel | `\| ... \| ... \|` 행 포함 → invalid + "placeholder leak detected" (or 유사 issue 메시지) / `wowDelta: "new"` 또는 셀에 `(신규)` 만 있는 행 → valid (화이트리스트) / 한 markdown 안에 둘 다 → invalid (placeholder 우선) |
| Priority — 빈 섹션 허용 (시나리오 7) | §6 본문 = `(데이터 없음)` 단일 줄 → valid / §6 본문 = `| ... |` placeholder → invalid / §6 본문 = 헤더만 + 빈 줄 → invalid (명시적 "(데이터 없음)" 텍스트 강제) |
| Invariant — issues 누적 | 여러 문제 동시 발생 시 모두 누적 (issues.length === 문제 개수). 한 issue 만 잡고 종료 X |

`it.each` 우선 활용 — 위 매트릭스는 30~40 케이스 정도. 12행 정도 `it.each` 테이블 5~6개로 압축.

### 3.3 시간 의존 함수 점검

- `bandForDelta`: `new Date()` 호출 없음. 시간 의존성 0.
- `validateSchema`: `new Date()` 호출 없음. `isoWeek` 파라미터로 외부에서 주입받음.
- **둘 다 testable 시그니처 만족.** 리팩토링 선행 작업 없음.

### 3.4 mock 점검

- 두 함수 모두 pure (외부 IO·SDK 호출·process.env 참조 0). mock 0개 필요.
- QA 페르소나 §1 "mock 3개 이상은 unit 아님" 룰 통과.

## 4. E2E 테스트 대상

본 PR 은 E2E 신규 추가 0건.

### 4.1 4가지 describe 블록 — (해당 없음)

- 본 PR 은 Next.js 앱 외부의 CLI 스크립트 *내부 함수* 변경. 사용자가 보는 UI 흐름 없음.
- 인프라/진입 검증은 `marketing-weekly-report.spec.ts` 가 이미 커버.

### 4.2 갱신 대상 기존 spec

없음. §1.1 영향 분석 결과 0건.

### 4.3 회귀 가드

- 본 PR 머지 후 첫 `report:weekly:dry-run` 1회 실행 (수동) 으로 §6·§7 GA4 응답 구조 실제 검증.
- W25(2026-06-22) launchd 실행 결과로 plan §Wave 2 완료 조건 4개 항목 자동 검증 — 운영자가 vault `60-analytics/weekly/2026-W25.md` 를 열어 확인.

### 4.4 시드 데이터·초기 상태

E2E 신규 없음 — 시드 불필요. unit fixture 는 `scripts/weekly-report/__fixtures__/W{22,23,24}-anonymized.json` 직접 `JSON.parse(fs.readFileSync(...))` 로 로드.

### 4.5 GA4 이벤트 검증

본 PR 은 *클라이언트 GA4 이벤트 신규 없음* (M1·M2 는 서버측 GA4 API 쿼리지 새 trackEvent 아님). E2E 이벤트 검증 N/A.

## 5. Skip / Defer

| 항목 | 보류 이유 | 제거 조건 | 제거 deadline |
|---|---|---|---|
| `bandForDelta` 임계값 자체의 정합성(10이 적정한가) unit | 정합성은 실데이터로만 결정 가능 — plan §Wave 2 메모 명시. 본 PR 의 unit 은 *임계값 변경 시 동작 단조* invariant 만 검증 | W25~W27 실데이터 관찰 후 운영자가 임계값 확정 | 2026-07-13 (휴가 진입 전 마지막 sprint) |

> deadline 없는 skip 0건. QA 페르소나 §7.1 통과.

## 6. 성공 기준

- Unit: 2 파일, 약 35~40 케이스(`it.each` 압축 후 ~15 `it` 블록) 모두 통과. 소요 < 500ms.
- E2E: 신규 0건. 기존 `marketing-weekly-report.spec.ts` 회귀 0건.
- §1.1 갱신 대상 0개 → 회귀 알람 0건이 기본값.
- spec.md §2 시나리오 7개가 §2 매트릭스에 매핑됨 (cross-check phase 9 에서 확인).
- 본 PR 머지 후 manual smoke: `report:weekly:dry-run` 1회 통과 + W25 자동 리포트의 §6·§7 노출.
