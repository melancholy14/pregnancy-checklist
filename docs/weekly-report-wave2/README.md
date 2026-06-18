# weekly-report-wave2

> 작성일: 2026-06-18 | 작성자: Claude Code
> 원본 문서: [spec.md](../features/weekly-report-wave2/spec.md) · [review.md](../features/weekly-report-wave2/review.md) · [qa.md](../features/weekly-report-wave2/qa.md)
> 상위 plan: [docs/plan/weekly-report-improvement.md](../plan/weekly-report-improvement.md) §Wave 2

## 개요

운영자 출산 휴면(2026-08-13 진입) 전에 launchd 자동 주간 리포트(`npm run report:weekly`)의 신뢰성과 가시성을 확정하는 4 sub-feature 한 PR. 휴면 중 3개월치 누적 리포트가 잡음 도배·placeholder 통과로 무가치해지는 시나리오를 차단하면서 마케팅 축(유입 채널·랜딩 페이지) 시드를 동시에 깔아둔다.

핵심 변경: ① `bandForDelta` 모집단 가드(prev<10 → noise 다운그레이드) ② `validateSchema` placeholder 검출 + 신규 섹션 빈 표 룰 ③ §6 유입 채널·§7 랜딩 페이지 GA4 표준 차원 쿼리 신설 ④ W22~W24 익명화 fixture 3주분 적재로 회귀 가드 확정.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 임계값 가드 unit test 통과 (plan §Wave 2 #6) | ✅ 완료 | bandForDelta 매트릭스 31 케이스 통과. threshold 옵션 매트릭스로 임계값 1줄 변경 단조성 invariant 도 검증. |
| W22 raw 데이터 재처리 시 page_view 14→32 동작 (plan #6 → spec §2 시나리오 2) | ✅ 완료 | prev=14 ≥ threshold(10) 라 incident 유지가 정상. spec §2 시나리오 2 와 일치 — plan 의 직관적 표현이 spec 의 정확한 분기로 수렴. |
| W24 prev<10 모든 -100% 가 noise (spec §2 시나리오 3) | ✅ 완료 | bandForDelta(-100, { previousCount: 0~4 }) → noise. unit invariant 매트릭스로 회귀 가드. |
| `validateSchema` 가 `| ... |` placeholder 검출 (plan #7) | ✅ 완료 | `PLACEHOLDER_PATTERN = /\|\s*\.{3,}\s*\|/` + `(신규)` / `wowDelta: "new"` sentinel 화이트리스트. |
| 리포트에 §6(유입 채널) + §7(랜딩 페이지) 섹션 노출 | ✅ 완료 | REQUIRED_HEADERS 에 §6·§7·§8 추가. SYSTEM_PROMPT 스키마 블록 및 buildUserMessage 의 Q6/Q7 JSON 블록 동시 업데이트. 기존 "## 6. 추천 액션" → §8 리넘버. |
| validator 의 "신규 섹션 빈 표 OK" 룰 (시나리오 7, 결정 3 옵션 A) | ✅ 완료 | ALLOW_EMPTY_SECTIONS = {§6, §7} + `(데이터 없음)` 명시 텍스트 강제. |
| fixture 3주분 익명화 적재 (spec §3.1) | ✅ 완료 | anonymize.ts 1회 실행으로 W22(noise)·W23(normal)·W24(downgrade) 익명화 fixture 커밋. |
| vitest include 에 `scripts/weekly-report/**` 추가 | ✅ 완료 | src/** 와 분리 추가, 다른 scripts 도메인 영향 없음. |
| qa.md §2 시나리오 1~7 매핑 누락 0 | ✅ 완료 | 47 unit 케이스(bandForDelta 31 + validateSchema 16)로 7 시나리오 모두 커버. |

> spec §5 "측정 지표" 행 (W25 launchd 실행 결과로 §6·§7 노출) 은 본 PR 머지 후 2026-06-22 자동 검증.

### 생성/수정 파일 (10개)

**신규 (6)**
- `scripts/weekly-report/__fixtures__/anonymize.ts` — 1회용 익명화 스크립트. propertyId → "000000000", landingPage query string 제거 + 100자 truncate.
- `scripts/weekly-report/__fixtures__/W22-anonymized.json` — noise 케이스(prev≥10 + 큰 WoW)
- `scripts/weekly-report/__fixtures__/W23-anonymized.json` — normal 케이스
- `scripts/weekly-report/__fixtures__/W24-anonymized.json` — downgrade 케이스(active users=0)
- `scripts/weekly-report/__tests__/ga4-queries.test.ts` — bandForDelta 매트릭스 31 케이스
- `scripts/weekly-report/__tests__/prompt-shared.test.ts` — validateSchema 매트릭스 16 케이스

**수정 (4)**
- `scripts/weekly-report/types.ts` — ChannelGroupRow/Acquisition, LandingPageRow/Entry 타입. Ga4Result 에 channelGroup·landingPage 필드.
- `scripts/weekly-report/ga4-queries.ts` — bandForDelta 시그니처 리팩토링 + previousCount 가드. Q6 (queryChannelGroupAcquisition), Q7 (queryLandingPageEntry) 신설. collectGa4Result 가 7 쿼리 동시 발사.
- `scripts/weekly-report/prompt-shared.ts` — SYSTEM_PROMPT 의 §1.7 시나리오 7개로 확장 + 스키마 블록 §6·§7·§8 반영. validateSchema 에 placeholder + sentinel + 신규 섹션 빈 표 룰. extractSection helper 도입.
- `vitest.config.ts` — include 패턴에 `scripts/weekly-report/**/__tests__/**/*.test.ts` 추가.

### 주요 결정 사항

- **bandForDelta 가 previousCount=0 도 noise 처리**: spec §3.1 "prev=0 && cur>0 케이스는 `new` 발현 경로" 책임 분리. anomaly 쿼리는 prev=0 → deltaPercent=null, 모집단 가드가 noise 로 차단. `wowDelta="new"` sentinel 경로는 Q2 핵심 행동 영역.
- **§6 → §8 리넘버**: spec §3.1 의 헤더 추가 룰을 따라 기존 §6 추천 액션을 §8 로 이동. SYSTEM_PROMPT 의 출력 스키마 블록도 동기 갱신.
- **placeholder 정규식**: `/\|\s*\.{3,}\s*\|/` — ASCII `...` 만 검출, ellipsis(U+2026)는 본문 해석 텍스트에서 자연스럽게 등장 가능해 제외.
- **sentinel 화이트리스트 라인 단위**: `(신규)` / `wowDelta: "new"` 토큰이 같은 라인에 있으면 placeholder 검출 제외. 다른 라인의 placeholder 는 여전히 invalid.
- **신규 섹션 빈 표 룰**: §6·§7 만 `ALLOW_EMPTY_SECTIONS` 에 들어가 `(데이터 없음)` 또는 데이터 행 1개 이상 필요. §1~§5 는 기존 룰 유지.
- **fixture 익명화는 propertyId·landingPage 만**: cohortJoinWeek·channelGroup·도메인은 PII 아니라 보존. Pre-Wave 2 raw 는 channelGroup/landingPage 가 없어 `Partial<Ga4Result>` 처리로 빈 슬롯 채움.

### 가정 사항 및 미구현

- plan §Wave 2 #6 의 "W22 page_view → noise" 표현은 spec §2 시나리오 2 (W22 incident 유지) 로 수렴 — plan 작성 시점(2026-06-03)과 spec(2026-06-18) 간 정확화. threshold=10 자체는 W25~W27 실데이터 후 운영자가 조정 (config 1줄).
- W22~W24 raw 에 channelGroup/landingPage 없음 (Pre-Wave 2 raw). fixture 의 §6·§7 행 0개는 시나리오 7 (빈 표 룰) 검증 용도로도 활용.
- launchd 첫 실 노출은 W25 (2026-06-22) 리포트.
- 미구현: `docs/plan/weekly-report-improvement.md` §Wave 2 완료 체크박스 (PR 머지 직후 운영자 단독 갱신), `report:weekly:dry-run` manual smoke (운영자 단독 1회).

---

## 코드 리뷰 결과

### Critical 이슈

**0건**. 런타임 크래시·보안 노출·잘못된 분기 없음. 핵심 분기(bandForDelta 시나리오 1~3, validateSchema 시나리오 4~7) 47 unit 케이스로 회귀 가드 확정.

### Warning (3건 → 7단계 refactor 에서 모두 해소)

- **W1 anonymize.ts** — `URL.pathname` URL-encoded 문제. `fileURLToPath` 로 교체.
- **W2 extractSection** — body 가 헤더 부속 텍스트를 포함해 "empty body" 분기 실질 도달 불가. headerLineEnd skip 추가로 정정.
- **W3 hasRow 계산** — `lines.join("\n").slice(...)` 5단계 체인을 `body.split("\n").some(...)` 1단계로 축약.

### Suggestion (3건, 본 PR 범위 밖)

- limit-before-filter 패턴 (Q6/Q7) — 기존 코드 일관성 유지, 모집단 커진 후 재검토.
- 동일 라인 placeholder + sentinel → sentinel 우선 (corner case) — SYSTEM_PROMPT 가 placeholder 금지하므로 가능성 낮음. test 로 동작 명세화.
- `POPULATION_GUARD_THRESHOLD = 10` config 위치 — 1인 운영 환경에선 module 상수 1줄 수정으로 충분.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 → 7단계에서 3건 모두 해소 |
| Suggestion | 3건 (본 PR 범위 밖, 향후 재검토) |

---

## 리팩토링 내용

### 작업 목록

1. **anonymize.ts** — `URL.pathname` → `fileURLToPath`. Path 에 spaces 있으면 URL-encoded 로 깨질 위험 제거. 운영자 환경에선 동일 경로 반환 (동작 변경 0).
2. **extractSection** — body 시작이 헤더 line 다음 줄부터. `## 6. 유입 채널 (sessionDefaultChannelGroup TOP)` 같은 헤더 부속 텍스트가 body 첫 줄로 섞이지 않음. invalid 판정 결과는 동일, issue 메시지 정확도 향상.
3. **validateSchema::hasRow** — 5단계 체인을 1단계로 축약. 수학적으로 동일 결과, 가독성·LOC 모두 개선.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 10개 | 10개 (동일) |
| `validateSchema` LOC | 75줄 | 71줄 (-4) |
| `extractSection` LOC | 11줄 | 13줄 (+2, headerLineEnd skip) |
| `anonymize.ts` import | 3개 | 4개 (+fileURLToPath) |
| 동작 변경 | — | 0건 (issue 메시지 정확도만 향상) |
| 단위 테스트 | 47/47 | 47/47 (회귀 0) |

---

## 테스트 결과

### Unit (Vitest 4.x)

| 시나리오 | 결과 |
|---|---|
| bandForDelta — Happy Path (±5/10/20/30 매트릭스) | ✅ 15 passed |
| bandForDelta — Boundary (null delta) | ✅ 2 passed |
| bandForDelta — Invariant 모집단 가드 | ✅ 8 passed |
| bandForDelta — threshold 옵션 매트릭스 | ✅ 6 passed |
| bandForDelta — band 단조성 | ✅ 1 passed (각 7 케이스를 it.each 1 블록으로 압축) |
| validateSchema — Happy Path | ✅ 1 passed |
| validateSchema — Boundary frontmatter | ✅ 2 passed |
| validateSchema — Boundary REQUIRED_HEADERS | ✅ 3 passed (§6·§7·§8 각각) |
| validateSchema — Priority placeholder/sentinel | ✅ 4 passed |
| validateSchema — Priority 신규 섹션 빈 표 | ✅ 4 passed |
| validateSchema — Invariant issues 누적 | ✅ 1 passed |
| **target 전체** | **✅ 47 passed / 0 failed (12ms)** |
| **프로젝트 전체 회귀** | **✅ 263 passed / 0 failed (103ms)** |

### E2E (Playwright 1.x)

| spec | 결과 |
|---|---|
| `e2e/marketing-weekly-report.spec.ts` (기존 인프라 검증, 정적 grep 가드 5종) | ✅ 16 passed / 0 failed (9.1s) |
| `e2e/weekly-report-wave2.spec.ts` (신규) | — (qa.md §4 결정대로 0건) |

qa.md §4 "본 PR 은 Next.js 앱 외부의 CLI 스크립트 내부 함수 변경 — 사용자가 보는 UI 흐름 없음" 룰에 따라 E2E 신규 작성 0건. 기존 marketing-weekly-report.spec.ts 의 정적 grep 가드(`@google-analytics/data` / `@anthropic-ai/sdk` / `"gpt-4o"` / `path.resolve(".env.local")` / REQUIRED_FILES 5개)는 본 PR 변경 표면과 0 교집합 — 회귀 검증 통과.

📊 상세 리포트: HTML 리포트는 미생성(`--reporter=line` 사용). 재현은 `npx playwright test e2e/marketing-weekly-report.spec.ts --reporter=html`.

---

## 머지 전 운영자 단독 작업

| 항목 | 시점 | 비고 |
|---|---|---|
| `npm run report:weekly:dry-run` manual smoke | 머지 직후 | Q6/Q7 GA4 응답 구조 1회 실 확인. qa.md §6 마지막 항목. |
| `docs/plan/weekly-report-improvement.md` §Wave 2 완료 체크박스 갱신 | 머지 직후 | spec §6 "수정" 마지막 항목. |
| W25 (2026-06-22 launchd) 리포트 §6·§7 노출 확인 | 2026-06-22 | spec §5 "측정 지표" + plan §Wave 2 완료 조건 4개. |
| threshold=10 정합성 평가 (필요 시 config 1줄 조정) | W25~W27 누적 후 (2026-07-06±) | plan §Wave 2 메모. 본 PR 의 threshold 옵션 매트릭스 테스트가 변경 단조성을 이미 보장. |
