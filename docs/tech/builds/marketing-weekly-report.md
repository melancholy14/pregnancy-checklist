# marketing-weekly-report

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-05-13
> plan: [spec](../../features/marketing-weekly-report/spec.md) · [ga4](../../features/marketing-weekly-report/ga4.md)

<!-- STEP:impl -->
## 구현

> 작성일: 2026-05-13  size: M  근거: [spec.md](../../features/marketing-weekly-report/spec.md), [ga4.md](../../features/marketing-weekly-report/ga4.md), [phase-4.5 §1.9](../../plan/phase-4.5.md)

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `scripts/weekly-report/` 5개 파일 (`index.ts`, `ga4-queries.ts`, `claude-prompt.ts`, `writer.ts`, `types.ts`) | ✅ 완료 | |
| GA4 Data API 5건 1:1 매핑 (Q1~Q5) | ✅ 완료 | Q1은 cohortSpec 우선 + session_start 수동 fallback 이중 경로 |
| Anthropic SDK `claude-sonnet-4-6` + prompt caching | ✅ 완료 | system 프롬프트만 `cache_control: ephemeral` 마킹 |
| 비용 ~$0.04/회 (캐시 적중 $0.02) | ✅ 가정 충족 | `response.usage` stderr 로깅 + Sonnet 4.6 단가 기반 산출 |
| §1.9.6 마크다운 스키마 출력 + `YYYY-Www.md` 경로 | ✅ 완료 | `~/Documents/pregnancy-checklist/60-analytics/weekly/<isoWeek>.md` |
| 실패 처리 — `_failed/` 로그 + macOS 알림 | ✅ 완료 | `osascript` 호출, GA4/Claude 두 단계 분리 |
| Claude 응답 스키마 불일치 시 raw JSON 첨부 | ✅ 완료 | sentinel 헤더 아래 raw 본문 추가 |
| 보안 — env 경유, SA JSON mode 0o600 검증, raw 쿼리 인라인 금지 | ✅ 완료 | 권한 비정상은 stderr 경고만(hard block 아님) |
| 첫 8주 raw JSON 병행 저장 (`_raw/YYYY-Www.json`) | ✅ 완료 | 8주 컷오프는 별도 후속 작업 (현재는 무제한 저장) |
| vault `60-analytics/` 구조 + `README.md` | ✅ 완료 | weekly/_raw/_failed 폴더 생성, 지표 정의 문서화 |
| `package.json` `report:weekly` 스크립트 | ✅ 완료 | `report:weekly:dry-run` 별도 추가 (review.md 항목 2 옵션 C) |
| Next.js 빌드 통과 | ✅ 완료 | `npm run build` 32 페이지 정적 생성 성공 |

### 생성/수정 파일 목록

#### 신규 생성
- `scripts/weekly-report/types.ts` — 5개 GA4 쿼리·LLM 결과(`ReportResult`/`LlmUsage`)·provider 추상화 타입
- `scripts/weekly-report/ga4-queries.ts` — `BetaAnalyticsDataClient` 래퍼 + Q1~Q5 + 코호트 fallback + ISO 주차 헬퍼
- `scripts/weekly-report/prompt-shared.ts` — provider 공용 SYSTEM_PROMPT(§1.7+§1.9.6) + buildUserMessage + validateSchema + unwrapFencedMarkdown
- `scripts/weekly-report/claude-prompt.ts` — Anthropic SDK 호출, `cache_control` 마킹, Sonnet 4.6 단가 환산 (1순위 LLM)
- `scripts/weekly-report/openai-prompt.ts` — OpenAI SDK 호출(`gpt-4o`), 자동 prefix caching, 단가 환산 (Claude fallback)
- `scripts/weekly-report/writer.ts` — vault 경로 보장, 본문/raw/실패 로그 출력, osascript 알림 헬퍼
- `scripts/weekly-report/index.ts` — env 로드·SA mode 검증·dry-run 분기·Claude→OpenAI fallback 오케스트레이션
- `~/Documents/pregnancy-checklist/60-analytics/README.md` — vault 운영 안내(절차·스키마·지표 정의·PII 처리·LLM fallback)

#### 수정
- `package.json` — `report:weekly`, `report:weekly:dry-run` 스크립트 추가 + devDependencies `@anthropic-ai/sdk`, `@google-analytics/data`, `openai` 추가
- `package-lock.json` — npm install 결과 (legacy peer deps; date-fns@^4 vs react-day-picker@8 기존 충돌 회피)
- `.env.example` — `GA4_PROPERTY_ID`, `GA4_SA_KEY_PATH`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` 4종 추가

#### 생성 안 함 (의도)
- `~/Documents/pregnancy-checklist/60-analytics/weekly/_raw/`, `_failed/` — 디렉토리만 mkdir, 빈 폴더이므로 `.gitkeep`은 두지 않음(vault는 git 추적 대상 아님)

### LLM Fallback 라운드 (2026-05-13 추가)

운영자 요청으로 Claude 부재 시 OpenAI(gpt-4o) 자동 fallback을 추가.

- **트리거**: `ANTHROPIC_API_KEY` 미설정이거나 Claude 호출이 throw하면 자동으로 OpenAI로 전환.
- **모델**: `gpt-4o` (input $2.50/M, output $10/M, cached input $1.25/M — Claude Sonnet 4.6과 동급 가격대).
- **공용화**: SYSTEM_PROMPT / buildUserMessage / validateSchema를 `prompt-shared.ts`로 추출. 두 provider가 동일 §1.9.6 스키마를 출력하도록 잠금.
- **타입**: 기존 `ClaudeReportResult`/`ClaudeUsage`를 `ReportResult`/`LlmUsage`로 일반화하고 `provider: "claude" | "openai"` 필드 추가. 기존 별칭은 back-compat용으로 export 유지.
- **env 정책**: 실 모드에서 두 키 중 적어도 하나는 필수. 둘 다 비면 즉시 차단. dry-run은 둘 다 없어도 통과.
- **실패 경로**: Claude 실패 → OpenAI 시도 → 둘 다 실패하면 raw GA4 JSON 보존 + `_failed/` 로그에 통합 에러("All LLM providers failed: claude=..., openai=...") 기록.

### 주요 결정 사항

- **코호트 fallback 이중 경로**: review.md 항목 2 옵션 C(dry-run에서 결정)를 코드로 흡수 — `queryCohortRetention`이 cohortSpec을 먼저 시도하고 에러 발생 시 자동으로 `customUser:cohort_join_week` + `week` 수동 집계로 fallback. 운영자가 dry-run 결과에서 `approach` 필드를 보고 사실 확인 가능.
- **`--dry-run` 플래그를 별도 npm 스크립트로 노출**: spec.md should 항목. cohortSpec 가용성 확인이 plan 시작 조건이므로 운영 진입 비용을 줄이기 위해 `report:weekly:dry-run`을 정식 채널로 추가.
- **prompt caching breakpoint를 system 블록 끝에만 배치**: §1.7 시나리오 정의 + §1.9.6 스키마는 매주 동일 → cache hit 극대화. trendWeeks 라벨과 GA4 raw 데이터는 user 메시지로 분리해 변동분만 비용 발생.
- **SA JSON 권한 검증은 stderr 경고**: spec §4 "hard block 아님, 경고만" 조항 그대로. 권한이 600이 아니어도 실행은 계속되며 운영자가 즉시 `chmod 600`을 알 수 있게 stderr에 명시.
- **schema 사후검증은 frontmatter + 7개 섹션 헤더 존재 여부만 확인**: 무거운 마크다운 파서를 들이지 않음. 누락 시 본문에 sentinel + raw 첨부 + macOS 알림 트리거. 운영자가 첫 8주 raw JSON과 함께 진단 가능.
- **`legacy-peer-deps`로 npm install**: 기존 충돌(react-day-picker@8 이 date-fns@^2||^3 요구 vs 루트가 date-fns@^4)을 이 라운드에서 해소하지 않음. 묶음 L 범위 밖이며 신규 패키지 설치는 충돌 없이 추가됨.

### 가정 사항

- GA4 Data API에서 `customEvent:results_count`가 문자열 dimension으로 노출된다(이벤트 파라미터 자동 등록 또는 운영자가 사전 등록 완료). 미등록 시 dry-run에서 Q3가 빈 결과로 떨어지므로 즉시 발견 가능.
- `customEvent:query`, `customEvent:domain`도 동일하게 dimension 등록 완료된 상태. PageviewTracker / SearchModal 단계에서 정규화 후 전송하므로 raw PII 위험은 송신 측에서 차단됨.
- Sonnet 4.6 단가(input $3/M, output $15/M, cache write $3.75/M, cache read $0.30/M)는 spec.md D4 비용 가정과 일치한다는 운영자 사전 확인. 단가 변경 시 `claude-prompt.ts` 상단 상수 4개만 갱신.
- macOS launchd 등록(묶음 M)은 본 라운드 범위 밖. `npm run report:weekly`로 수동 1회 실행 검증이 완료 조건의 마지막 단계이며, 실제 실행과 데이터 검증은 D-Data 누적 후 별도 라운드.

### 미구현 항목

- **launchd `.plist` 등록 (묶음 M)**: spec.md "won't" 명시. 본 라운드는 스크립트 + vault 구조까지.
- **vitest 스키마 단위 테스트 (should)**: 본 파이프라인 다음 단계 `/write-e2e-tests`가 별도로 다룸. 스키마 검증 함수는 `claude-prompt.ts` 내부에 격리해 두어 테스트 hook이 쉬움.
- **데이터 부족 disclaimer 자동 삽입 (should)**: Claude 시스템 프롬프트에 규칙으로 위임. 결정론적 코드 삽입이 아니라 LLM 출력에 맡김 — 첫 8주 raw 검증에서 잘못 동작 시 코드 측 enforcement로 옮길 수 있도록 `Ga4Result`에 cohort.totalCohorts·anomaly.comparable을 노출해 둠.
- **raw JSON 8주 컷오프**: §1.9.8 "8주 이후 4주 롤링 윈도우" 정책은 현재 미구현(무제한 저장). 운영 시작 ~6주차에 별도 추가.

---

<!-- STEP:review -->
## 코드 리뷰

> 작성일: 2026-05-13  근거: [spec.md](../../features/marketing-weekly-report/spec.md), [impl.md](#구현)

### 리뷰 대상 파일
- `scripts/weekly-report/types.ts`
- `scripts/weekly-report/ga4-queries.ts`
- `scripts/weekly-report/claude-prompt.ts`
- `scripts/weekly-report/writer.ts`
- `scripts/weekly-report/index.ts`

---

### Critical 이슈 (즉시 수정 완료)

#### 1. index.ts / writer.ts — Claude 실패 시 raw GA4 JSON이 저장되지 않음
- **위치**: [scripts/weekly-report/index.ts:118-124](../../../scripts/weekly-report/index.ts#L118-L124)
- **문제**: Claude 호출이 던지면 `handleFailure`로 빠져 `_failed/` 로그만 쓰고 `process.exit(1)`. 정상 경로의 `writeWeeklyReport`만 `_raw/YYYY-Www.json`을 쓰기 때문에, Claude API 장애가 발생하면 운영자가 GA4 집계 결과를 수동으로 분석할 백업이 사라진다. spec §4 "Claude API 타임아웃/에러 → raw GA4 데이터는 `_raw/`에 저장해 수동 분석 가능"을 위반.
- **수정 내용**: `writer.ts`에 `_raw/` 저장만 담당하는 `writeRawGa4` 함수 추출. `writeWeeklyReport`는 내부적으로 이 함수를 호출해 중복 없음. `index.ts`의 Claude catch 블록에서 `writeRawGa4(isoWeek, ga4Result)`를 호출해 실패 후에도 raw가 vault에 남도록 변경. stderr에 raw 경로를 함께 안내.

#### 2. ga4-queries.ts — 이상치 필터가 0/0 이벤트를 거짓 양성으로 노출
- **위치**: [scripts/weekly-report/ga4-queries.ts:397-411](../../../scripts/weekly-report/ga4-queries.ts#L397-L411)
- **문제**: `prev=0`이면 `deltaPercent=null`. 필터는 `deltaPercent === null || abs >= 5`라서 `prev=0 AND cur=0`인 이벤트(트래픽 적은 초기엔 `empty_state_view`, `scroll_without_action` 등 대부분)가 그대로 통과 → `bandForDelta(null)`이 "hypothesis"를 반환해 거짓 양성 이상치로 매주 리포트 상단을 채움. 신호 대 잡음비가 망가져 §1.7 이상치 시나리오의 의사결정 가치가 사라진다.
- **수정 내용**: 필터에 `currentCount === 0 && previousCount === 0` 조건을 추가해 양주 모두 0인 행을 제거. 신규 발현(prev=0, cur>0)은 신호가 있으므로 유지(`hypothesis` 밴드).

---

### Warning (수정 권장)

#### 1. types.ts — `WeeklyDateRange` 주석이 실제 주차 윈도우와 어긋남
- **위치**: [scripts/weekly-report/types.ts:14-17](../../../scripts/weekly-report/types.ts#L14-L17)
- **문제**: 주석에 "Sunday → Saturday window"라 적혀 있지만 `lastCompletedIsoWeek`는 `startOfISOWeek`(월요일)로 시작해 `+6일`(일요일)로 끝나는 Monday → Sunday 윈도우.
- **권장 수정**: 주석을 `Monday → Sunday window (ISO week)`로 정정.

#### 2. ga4-queries.ts — 수동 코호트 fallback이 ISO 연도 경계에서 행 누락
- **위치**: [scripts/weekly-report/ga4-queries.ts:160-172](../../../scripts/weekly-report/ga4-queries.ts#L160-L172)
- **문제**: `cohortIndex`/`activeIndex`를 ISO 주차 번호만으로 단순 빼기 → 코호트 `2025-W52`와 active week `2026-W04`의 nthWeek가 `-48`로 계산되어 `nthWeek >= 0` 필터에서 제거됨. 매년 12월/1월 경계에서 fallback 경로가 데이터를 잃는다.
- **권장 수정**: ISO 주차 → 절대 주차 카운터로 환산(예: 연도×52 + 주차) 후 빼기. 또는 코호트 join 주의 시작 날짜를 함께 보관하고 날짜 기준 차이 계산.

#### 3. claude-prompt.ts — ephemeral 캐시 TTL이 주간 실행 주기와 맞지 않음
- **위치**: [scripts/weekly-report/claude-prompt.ts:1-15](../../../scripts/weekly-report/claude-prompt.ts#L1-L15)
- **문제**: 주석은 "5-min TTL is irrelevant"라 단언하지만, 실제 ephemeral prompt cache는 마지막 사용 후 ~5분 만에 만료. 주 1회 실행 사이에 캐시 적중은 거의 0이고 매번 cache-write 비용이 발생. spec §1.9.4 D4 "캐시 적중 시 $0.02" 가정이 무너질 가능성이 높다.
- **권장 수정**: 1) Anthropic 1시간 캐시(`cache_control: { type: "ephemeral", ttl: "1h" }`)가 가능해진 시점이면 그것으로 전환. 2) 그래도 주간 주기 적중은 불가능하므로 비용 가정을 "캐시 미스 기준 $0.04"로 보수적으로 갱신. 3) usage 로그에 cache_read=0 비율이 100%면 운영자에게 경고.

#### 4. claude-prompt.ts — frontmatter 검증 정규식이 CRLF 줄바꿈을 허용하지 않음
- **위치**: [scripts/weekly-report/claude-prompt.ts:152](../../../scripts/weekly-report/claude-prompt.ts#L152)
- **문제**: `/^---\n[\s\S]+?\n---/`은 `\r\n`을 인식 못 함. Claude 출력이 CRLF면 정상 frontmatter여도 누락으로 오판.
- **권장 수정**: `/^---\r?\n[\s\S]+?\r?\n---/` 또는 검증 전 `markdown.replace(/\r\n/g, "\n")`으로 정규화.

---

### Suggestion (개선 아이디어)

#### 1. ga4-queries.ts — `cohorts` 배열에 명시 타입 부여
- [scripts/weekly-report/ga4-queries.ts:109](../../../scripts/weekly-report/ga4-queries.ts#L109) `const cohorts = []` 후 push. TypeScript가 추론해 동작하나 명시 타입(`const cohorts: { name: string; dateRange: { startDate: string; endDate: string } }[] = []`)이 의도가 더 분명.

#### 2. index.ts — `main().catch`의 stage가 항상 `"ga4"`로 기록됨
- [scripts/weekly-report/index.ts:166-170](../../../scripts/weekly-report/index.ts#L166-L170) — env 검증·SA mode 검증 실패도 stage가 `"ga4"`로 남아 디버그 시 오해 소지. `stage: "config"` 분기 추가 또는 검증 단계에서 명시적으로 exit하기.

#### 3. writer.ts — `notifyMacOS` 가 macOS 외에서 silent fail
- [scripts/weekly-report/writer.ts:90-94](../../../scripts/weekly-report/writer.ts#L90-L94) — `spawnSync("osascript", ...)`는 Linux에서 ENOENT를 던지지만 `stdio: "ignore"`로 가려짐. 1인 운영 환경이 macOS 단일이라 현재 무해하나, 운영자 PC가 바뀌면 알림이 조용히 사라진다. 환경 가드(`process.platform === "darwin"`) 또는 fallback 로그 한 줄 권장.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 2건 발견, 2건 수정 완료 |
| Warning | 4건 |
| Suggestion | 3건 |
| 빌드 | 성공 (1회 시도) |
| E2E 재검증 | 15/15 통과 |

---

<!-- STEP:refactor -->
## 리팩토링

> 작성일: 2026-05-13  근거: [review.md](#코드-리뷰)

### 리팩토링한 파일 목록
- `scripts/weekly-report/types.ts`
- `scripts/weekly-report/ga4-queries.ts`
- `scripts/weekly-report/claude-prompt.ts`

---

### 작업별 내용

#### 1. types.ts — `WeeklyDateRange` 주석 정정
- **출처**: Warning #1
- **무엇을**: `endDate` 주석 "Sunday → Saturday window" → "Monday → Sunday window (ISO week)". `startDate`에도 "ISO week starts Monday" 한 줄 추가.
- **왜**: 실제 구현(`startOfISOWeek` 월요일 기준)과 주석 사이의 불일치가 향후 윈도우 계산을 잘못 따라가게 만들 수 있음.

#### 2. ga4-queries.ts — 수동 코호트 fallback의 ISO 연도 경계 처리
- **출처**: Warning #2
- **무엇을**:
  - 차원에 `customUser:cohort_join_week` + `isoWeek` + `isoYear` 3개를 함께 요청해 각 행의 active 주의 절대 위치를 복원.
  - `parseCohortJoinWeek("YYYY-Www")` 헬퍼 추가 — ISO 8601 규칙(1월 4일은 항상 W1)에 따라 라벨을 월요일 Date로 변환.
  - `nthWeek = differenceInCalendarISOWeeks(activeMonday, joinMonday)`로 교체. ISO 주 번호 단순 빼기가 사라져 12월/1월 경계에서도 정확한 값을 반환.
- **왜**: 이전 구현은 `Number("W52") - Number("04") = 48` 형태의 오프셋을 만들어 모든 연말·연초 코호트 행을 음수 nthWeek로 만들고 필터에서 잘림. fallback이 가장 신뢰 받아야 할 시점(cohortSpec 미사용 시)에 정작 1년에 한 번씩 누락이 발생.

#### 3. ga4-queries.ts — `cohorts` 배열 명시 타입
- **출처**: Suggestion #1 (사용자 확인 후 포함)
- **무엇을**: `const cohorts = []` → `const cohorts: CohortBlock[] = []`. 같은 블록에서 `parseISO(range.endDate)`로 문자열 직접 `new Date()` 대신 timezone-safe 파서 사용.
- **왜**: TS 추론이 동작하긴 하지만 push 인자 일치 강제는 명시 타입이 더 분명. `parseISO`는 `"YYYY-MM-DD"`를 UTC로 안정 해석.

#### 4. claude-prompt.ts — ephemeral 캐시 TTL 가정 주석 정확화
- **출처**: Warning #3
- **무엇을**: 파일 헤더 주석에서 "5-min TTL is irrelevant"라는 잘못된 단언을 제거. 주 1회 실행에서는 캐시가 만료되어 매번 캐시-미스 경로를 탄다는 사실과, $0.04 비용 가정이 캐시-미스 기준임을 명시. dry-run 직후 본실행 같은 동일 세션 내 재실행 시에만 캐시 적중함을 안내.
- **왜**: 코드 동작은 그대로 유지하되 비용 가정·운영 기대치를 사실에 맞춤. 코드를 읽는 운영자가 "왜 cache_read=0이 매주 찍히지?"를 의심하지 않도록.

#### 5. claude-prompt.ts — frontmatter 검증의 CRLF 허용
- **출처**: Warning #4
- **무엇을**: `validateSchema`가 검증 전 `\r\n → \n`으로 정규화. 정규식과 `includes` 검사 모두 정규화된 텍스트에서 수행.
- **왜**: Claude 출력이 CRLF로 떨어질 확률은 낮으나 발생 시 정상 frontmatter도 누락으로 오판해 sentinel + raw 첨부가 매주 붙는 회귀 위험. 한 줄 정규화로 회복 탄력성 추가.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 5 (types/ga4-queries/claude-prompt/writer/index) | 5 (동일) |
| 최대 파일 줄 수 | `ga4-queries.ts` 447줄 | `ga4-queries.ts` 459줄 (cohort fallback 정확도 향상) |
| 코호트 fallback nthWeek 계산 정확도 | ISO 주 번호 빼기 — 연도 경계 음수 누락 | 날짜 기반 `differenceInCalendarISOWeeks` |
| frontmatter 검증 CRLF | 미허용 — 거짓 음성 발생 가능 | 정규화 후 검사 |
| `cohorts` 배열 타입 | 추론(any/never[] 의존) | `CohortBlock[]` 명시 |
| 캐시 TTL 가정 주석 | "5-min TTL is irrelevant" (오해 소지) | 캐시-미스 기준임을 명시 |

---

### 빌드 결과
성공 (1회 시도, `npm run build` 32 페이지 정적 생성)
