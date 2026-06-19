# weekly-report-wave2 기획서

> 작성일: 2026-06-18  size: M
> 관련 리뷰: [review.md](./review.md)
> 관련 QA: [qa.md](./qa.md)
> 상위 plan: [docs/plan/weekly-report-improvement.md](../../plan/weekly-report-improvement.md) §Wave 2

## review.md 결정사항 참조

- **결정 1 (항목 1 → B)**: `bandForDelta` 를 `bandForDelta(delta, opts: { previousCount, threshold? })` 시그니처로 리팩토링. 호출부 갱신. 임계값 변경이 코드 1줄 + 테스트 0줄로 끝나도록.
- **결정 2 (항목 2 → B)**: W22·W23·W24 raw JSON 3주분 모두 익명화 fixture 적재. noise/incident/normal 3 케이스 회귀 가드.
- **결정 3 (항목 3 → A)**: Wave 2 = #6 + #7 + §6(M1) + §7(M2) 4 sub-feature 한 PR. validator 가 "신규 섹션 빈 표 OK 인가" 동시 결정은 본 spec §3 와 qa.md §2 에서 명시 룰로 박는다.

## 1. 배경·목적

- **운영자 관점**: 휴면 진입(2026-08-13) 전 launchd 자동 리포트의 신뢰성을 확정. 휴면 중 3개월치 누적이 잡음 도배·placeholder 통과로 무가치해지는 시나리오 차단.
- **사용자(운영자) 관점**: 복귀 후 W19~W37 데이터로 "어떤 채널에서 트래픽이 왔고 / 어느 글이 첫 진입점인가" 를 즉시 분석 가능하도록 §6·§7 측정 슬롯 박기.
- **측정 관점**: #6 모집단 가드로 incident TL;DR 오염 제거, #7 schema 강화로 placeholder 통과 차단, M1·M2 로 acquisition·content ROI 가시성 0 → 시드 확보.

## 2. 사용자 시나리오 (리포트 사이클 시나리오)

> 본 기능은 백엔드 CLI(`npm run report:weekly`) 라 "사용자 클릭 → 화면 변화" 가 아니라 "주차 데이터 → 리포트 출력" 시나리오로 환원.

- **시나리오 1 (normal)**: 모집단이 충분히 크고(WoW prev ≥ 10) 변동도 노이즈 밴드(<5%)인 주차 → 이상치 §5 에 행이 안 잡히고, §6·§7 에는 실제 채널·랜딩 페이지 행이 박힘. validator 는 통과.
- **시나리오 2 (noise, W22 유사)**: prev=14 → cur=32 (+128.6%) — 기존 로직은 incident, 본 PR 후엔 prev<10 가드 미발동 + 본인 트래픽 필터 후라 실 incident 로 유지.
- **시나리오 3 (downgrade, W24 유사)**: prev=0 또는 매우 작음(<10) → 본 PR 후엔 모든 -100% 가 `noise` 로 다운그레이드. TL;DR 도배 사라짐.
- **시나리오 4 (new event)**: prev=0, cur>0 → `wowDelta = "new"` (Wave 1 도입). validator 는 `"new"` sentinel 을 placeholder 와 분기해서 통과 처리.
- **시나리오 5 (placeholder leak)**: LLM 이 `| ... | ... |` 형태 placeholder 를 본문에 남김 → validator 가 검출 + invalid 반환 → writer 가 raw JSON 만 저장 후 재시도 또는 실패 보고.
- **시나리오 6 (acquisition visibility)**: 매주 리포트 §6 에 sessionDefaultChannelGroup TOP N 행, §7 에 landingPagePlusQueryString TOP N 행이 자동 노출. 휴면 진입 후에도 launchd 가 같은 모양으로 누적.
- **시나리오 7 (empty section in dormancy)**: 휴면기 active users=0 주차 → §6·§7 데이터 행 0개. validator 는 **"행 0개"를 빈 표 placeholder 와 다르게 처리** — 헤더+"(데이터 없음)" 형태로 통과 허용. (결정 3 옵션 A 의 "신규 섹션 빈 표 OK 인가" 룰)

## 3. 기능 요구사항

### 3.1 must

- **#6 모집단 가드 (`bandForDelta` 리팩토링)**
  - `bandForDelta(deltaPercent: number | null, opts: { previousCount: number; threshold?: number })` 시그니처. threshold 기본값 10.
  - 결정: `previousCount < threshold` → `"noise"` 강제 다운그레이드. 단 `previousCount === 0 && currentCount > 0` 케이스는 `"new"` 발현으로 §5 anomaly 가 아닌 §2 핵심 행동의 wowDelta 경로에서 처리되므로 이 함수의 책임 밖.
  - 호출부(`queryWeekOverWeekAnomaly` 내 1군데) 에 `previousCount: prev` 전달.

- **#7 schema validator 강화 (`validateSchema`)**
  - placeholder 감지 룰 추가: `| ... |`, `\| ... \|`, 그리고 ` ... ` 단독 셀 패턴 검출 (raw regex: `/\|\s*\.{3,}\s*\|/`). 행 단위 검출.
  - `REQUIRED_HEADERS` 에 `## 6. 유입 채널`, `## 7. 랜딩 페이지` 추가.
  - 각 섹션 본문에 "표 row ≥ 1" 검사. 단 신규 섹션(§6·§7) 한정으로 "(데이터 없음)" 또는 "행 0개" 명시 텍스트면 통과 허용 (시나리오 7).
  - `"new"` sentinel 화이트리스트 분기: `wowDelta: "new"` 또는 본문 `(신규)` 표기는 placeholder 검출에서 제외.
  - validator 가 invalid 반환 시 `writer.ts` 가 _raw 만 저장 + 실패 사유 로그(기존 동작 유지 — 본 PR 변경 X).

- **M1 §6 유입 채널 (Q6 신설)**
  - GA4 표준 차원 `sessionDefaultChannelGroup` 기반. 차원 등록 불필요.
  - 출력: TOP N(N=5) 채널 + 세션 수. 본문 표 형태.
  - aggregator(`index.ts`) 에 Q6 호출 추가. 프롬프트(`prompt-shared.ts`) 에 `## Q6 유입 채널` 블록 추가.

- **M2 §7 랜딩 페이지 (Q7 신설)**
  - GA4 표준 차원 `landingPagePlusQueryString` 기반.
  - 출력: TOP N(N=10) 랜딩 페이지 + 세션 수. **본문 표 노출 시 query string 의 raw 검색어/내부 입력값은 PII 마스킹** (마케터 §3.1 룰). raw 가 fixture·로그에 새지 않게 익명화 헬퍼 경유.
  - aggregator + 프롬프트 블록 추가.

- **vitest config 확장**
  - `vitest.config.ts` 의 `include` 에 `'scripts/weekly-report/**/__tests__/**/*.test.ts'` 추가. 다른 스크립트 도메인은 안 건드림.

- **fixture 3주분 익명화 적재**
  - `scripts/weekly-report/__fixtures__/` 디렉토리 신설.
  - W22·W23·W24 raw JSON 을 익명화한 fixture 3개 저장 (각각 `W{NN}-anonymized.json`).
  - 익명화 헬퍼는 fixture 생성 1회용 스크립트(`scripts/weekly-report/__fixtures__/anonymize.ts`) 로 도입 — 본 PR 1회 실행 후 산출물 커밋. 향후 fixture 갱신 시 재사용.
  - 익명화 대상: 도메인·랜딩 path 의 query string·검색어·user id 류. 필드 자체 삭제가 아닌 해시·치환으로 구조 유지.

### 3.2 should

- `report:weekly:dry-run` 으로 Q6·Q7 응답 구조를 실 호출 1회 검증 후 fixture 와 schema 정합 확인.
- W24 incident=-100% 케이스를 재처리(fixture 적재 후 `validateSchema` + 새 `bandForDelta` 로 돌렸을 때 모든 행이 `noise` 로 다운그레이드되는지) 확인.

### 3.3 won't (이번 범위 밖)

- M3-b GSC API 통합 — Wave 3.
- M4 콘텐츠별 성과(article_read_complete 의 page_path group by) — Wave 2.5.
- M5-b 임신 주차별 분포(§8 신설) — Wave 2.5.
- M6 신규 vs 재방문 분리 — Wave 3.
- #8 trend window 4→8/13주 확장 — Wave 3.
- #9 비용 누적 로그 — Wave 3.
- `bandForDelta` 임계값 자체의 운영자 결정값(10이 적정한지) — 본 PR 후 W25~W27 실데이터 관찰 후 결정 — config 상수만 갈아끼우면 끝나는 구조로 두기.

## 4. 예외·엣지 케이스

- **active users = 0 주차 (휴면기)**: §1~§5 모든 anomaly 행이 `noise` 로 다운그레이드, §6·§7 행 0개. validator 가 시나리오 7 룰로 통과.
- **GA4 API 일시 실패 (HTTP 5xx, INVALID_ARGUMENT)**: 기존 fallback 동작 유지 — index.ts 의 manual fallback 경로. Wave 1 에서 cohortSpec 표준 차원 정리 끝났으므로 본 PR 추가 핸들링 없음.
- **`landingPagePlusQueryString` 응답에 매우 긴 URL**: 본문 표에서 100자 truncate + ellipsis. 익명화 헬퍼 통과.
  - *unit 검증 외*: truncate 와 PII 마스킹은 `anonymize.ts`(fixture 생성 1회 스크립트) 책임. 정합성은 PR 리뷰 시점에 fixture diff 의 manual review 로 검증 — unit 매트릭스 대상 아님.
- **`sessionDefaultChannelGroup` 값이 `(other)` 또는 `(not set)`**: 마케터 페르소나의 도메인 필터 패턴 동일하게 §4 (외부 유출) 와 일관되게 `(not set)` 필터.
  - *unit 검증 외*: 단일 술어(`row.value !== "(not set)"`) 필터로 기존 §4 외부유출 도메인 필터와 동일 패턴 복사. 기존 §4 필터에도 unit 없음 → Q6/Q7 만 박으면 일관성 깨짐. won't (§3.3).

## 5. 성공 기준

- **기능 동작**: W22~W24 fixture 3주 모두에 대해 `aggregate → validateSchema → writer` 파이프라인이 invalid 없이 완주. W24 의 모든 anomaly 행이 `band: "noise"`.
- **측정 지표**: W25 (2026-06-22 launchd 실행) 리포트의 §6·§7 섹션이 실 GA4 데이터 채워서 노출. plan §Wave 2 완료 조건 표 4개 항목 충족.
- **사용자 경험 (운영자)**: 휴면 진입 시점에 매주 리포트가 placeholder 0건 + noise/incident 분류 신뢰 가능 + 채널·랜딩 가시성 100%.
- **검증 (qa.md)**: §2 의 시나리오 1~7 이 unit/e2e 매트릭스에서 매핑 누락 없이 통과.

## 6. 변경 파일 목록 (Phase 8 §1 스캔 입력)

- 수정:
  - `scripts/weekly-report/ga4-queries.ts` (bandForDelta 리팩토링 + Q6·Q7 fetch 추가)
  - `scripts/weekly-report/prompt-shared.ts` (validateSchema 강화 + REQUIRED_HEADERS 추가 + 프롬프트 블록 추가)
  - `scripts/weekly-report/types.ts` (ChannelGroupRow, LandingPageRow 타입 추가)
  - `scripts/weekly-report/index.ts` (aggregator 에 Q6·Q7 호출)
  - `vitest.config.ts` (include 패턴 1줄 확장)
  - `docs/plan/weekly-report-improvement.md` (§Wave 2 완료 표시 — 머지 후)
- 신규:
  - `scripts/weekly-report/__fixtures__/W22-anonymized.json`
  - `scripts/weekly-report/__fixtures__/W23-anonymized.json`
  - `scripts/weekly-report/__fixtures__/W24-anonymized.json`
  - `scripts/weekly-report/__fixtures__/anonymize.ts` (1회용 익명화 스크립트, 커밋해서 향후 재사용)
  - `scripts/weekly-report/__tests__/ga4-queries.test.ts` (bandForDelta 매트릭스)
  - `scripts/weekly-report/__tests__/prompt-shared.test.ts` (validateSchema 매트릭스)
