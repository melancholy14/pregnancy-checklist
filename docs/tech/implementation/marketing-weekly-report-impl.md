# marketing-weekly-report Implementation

> 작성일: 2026-05-13  size: M  근거: [spec.md](../../features/marketing-weekly-report/spec.md), [ga4.md](../../features/marketing-weekly-report/ga4.md), [phase-4.5 §1.9](../../plan/phase-4.5.md)

## 완료 조건 충족 여부

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

## 생성/수정 파일 목록

### 신규 생성
- `scripts/weekly-report/types.ts` — 5개 GA4 쿼리·LLM 결과(`ReportResult`/`LlmUsage`)·provider 추상화 타입
- `scripts/weekly-report/ga4-queries.ts` — `BetaAnalyticsDataClient` 래퍼 + Q1~Q5 + 코호트 fallback + ISO 주차 헬퍼
- `scripts/weekly-report/prompt-shared.ts` — provider 공용 SYSTEM_PROMPT(§1.7+§1.9.6) + buildUserMessage + validateSchema + unwrapFencedMarkdown
- `scripts/weekly-report/claude-prompt.ts` — Anthropic SDK 호출, `cache_control` 마킹, Sonnet 4.6 단가 환산 (1순위 LLM)
- `scripts/weekly-report/openai-prompt.ts` — OpenAI SDK 호출(`gpt-4o`), 자동 prefix caching, 단가 환산 (Claude fallback)
- `scripts/weekly-report/writer.ts` — vault 경로 보장, 본문/raw/실패 로그 출력, osascript 알림 헬퍼
- `scripts/weekly-report/index.ts` — env 로드·SA mode 검증·dry-run 분기·Claude→OpenAI fallback 오케스트레이션
- `~/Documents/pregnancy-checklist/60-analytics/README.md` — vault 운영 안내(절차·스키마·지표 정의·PII 처리·LLM fallback)

### 수정
- `package.json` — `report:weekly`, `report:weekly:dry-run` 스크립트 추가 + devDependencies `@anthropic-ai/sdk`, `@google-analytics/data`, `openai` 추가
- `package-lock.json` — npm install 결과 (legacy peer deps; date-fns@^4 vs react-day-picker@8 기존 충돌 회피)
- `.env.example` — `GA4_PROPERTY_ID`, `GA4_SA_KEY_PATH`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` 4종 추가

### 생성 안 함 (의도)
- `~/Documents/pregnancy-checklist/60-analytics/weekly/_raw/`, `_failed/` — 디렉토리만 mkdir, 빈 폴더이므로 `.gitkeep`은 두지 않음(vault는 git 추적 대상 아님)

## LLM Fallback 라운드 (2026-05-13 추가)

운영자 요청으로 Claude 부재 시 OpenAI(gpt-4o) 자동 fallback을 추가.

- **트리거**: `ANTHROPIC_API_KEY` 미설정이거나 Claude 호출이 throw하면 자동으로 OpenAI로 전환.
- **모델**: `gpt-4o` (input $2.50/M, output $10/M, cached input $1.25/M — Claude Sonnet 4.6과 동급 가격대).
- **공용화**: SYSTEM_PROMPT / buildUserMessage / validateSchema를 `prompt-shared.ts`로 추출. 두 provider가 동일 §1.9.6 스키마를 출력하도록 잠금.
- **타입**: 기존 `ClaudeReportResult`/`ClaudeUsage`를 `ReportResult`/`LlmUsage`로 일반화하고 `provider: "claude" | "openai"` 필드 추가. 기존 별칭은 back-compat용으로 export 유지.
- **env 정책**: 실 모드에서 두 키 중 적어도 하나는 필수. 둘 다 비면 즉시 차단. dry-run은 둘 다 없어도 통과.
- **실패 경로**: Claude 실패 → OpenAI 시도 → 둘 다 실패하면 raw GA4 JSON 보존 + `_failed/` 로그에 통합 에러("All LLM providers failed: claude=..., openai=...") 기록.

## 주요 결정 사항

- **코호트 fallback 이중 경로**: review.md 항목 2 옵션 C(dry-run에서 결정)를 코드로 흡수 — `queryCohortRetention`이 cohortSpec을 먼저 시도하고 에러 발생 시 자동으로 `customUser:cohort_join_week` + `week` 수동 집계로 fallback. 운영자가 dry-run 결과에서 `approach` 필드를 보고 사실 확인 가능.
- **`--dry-run` 플래그를 별도 npm 스크립트로 노출**: spec.md should 항목. cohortSpec 가용성 확인이 plan 시작 조건이므로 운영 진입 비용을 줄이기 위해 `report:weekly:dry-run`을 정식 채널로 추가.
- **prompt caching breakpoint를 system 블록 끝에만 배치**: §1.7 시나리오 정의 + §1.9.6 스키마는 매주 동일 → cache hit 극대화. trendWeeks 라벨과 GA4 raw 데이터는 user 메시지로 분리해 변동분만 비용 발생.
- **SA JSON 권한 검증은 stderr 경고**: spec §4 "hard block 아님, 경고만" 조항 그대로. 권한이 600이 아니어도 실행은 계속되며 운영자가 즉시 `chmod 600`을 알 수 있게 stderr에 명시.
- **schema 사후검증은 frontmatter + 7개 섹션 헤더 존재 여부만 확인**: 무거운 마크다운 파서를 들이지 않음. 누락 시 본문에 sentinel + raw 첨부 + macOS 알림 트리거. 운영자가 첫 8주 raw JSON과 함께 진단 가능.
- **`legacy-peer-deps`로 npm install**: 기존 충돌(react-day-picker@8 이 date-fns@^2||^3 요구 vs 루트가 date-fns@^4)을 이 라운드에서 해소하지 않음. 묶음 L 범위 밖이며 신규 패키지 설치는 충돌 없이 추가됨.

## 가정 사항

- GA4 Data API에서 `customEvent:results_count`가 문자열 dimension으로 노출된다(이벤트 파라미터 자동 등록 또는 운영자가 사전 등록 완료). 미등록 시 dry-run에서 Q3가 빈 결과로 떨어지므로 즉시 발견 가능.
- `customEvent:query`, `customEvent:domain`도 동일하게 dimension 등록 완료된 상태. PageviewTracker / SearchModal 단계에서 정규화 후 전송하므로 raw PII 위험은 송신 측에서 차단됨.
- Sonnet 4.6 단가(input $3/M, output $15/M, cache write $3.75/M, cache read $0.30/M)는 spec.md D4 비용 가정과 일치한다는 운영자 사전 확인. 단가 변경 시 `claude-prompt.ts` 상단 상수 4개만 갱신.
- macOS launchd 등록(묶음 M)은 본 라운드 범위 밖. `npm run report:weekly`로 수동 1회 실행 검증이 완료 조건의 마지막 단계이며, 실제 실행과 데이터 검증은 D-Data 누적 후 별도 라운드.

## 미구현 항목

- **launchd `.plist` 등록 (묶음 M)**: spec.md "won't" 명시. 본 라운드는 스크립트 + vault 구조까지.
- **vitest 스키마 단위 테스트 (should)**: 본 파이프라인 다음 단계 `/write-e2e-tests`가 별도로 다룸. 스키마 검증 함수는 `claude-prompt.ts` 내부에 격리해 두어 테스트 hook이 쉬움.
- **데이터 부족 disclaimer 자동 삽입 (should)**: Claude 시스템 프롬프트에 규칙으로 위임. 결정론적 코드 삽입이 아니라 LLM 출력에 맡김 — 첫 8주 raw 검증에서 잘못 동작 시 코드 측 enforcement로 옮길 수 있도록 `Ga4Result`에 cohort.totalCohorts·anomaly.comparable을 노출해 둠.
- **raw JSON 8주 컷오프**: §1.9.8 "8주 이후 4주 롤링 윈도우" 정책은 현재 미구현(무제한 저장). 운영 시작 ~6주차에 별도 추가.
