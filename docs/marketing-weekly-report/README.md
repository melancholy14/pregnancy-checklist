# marketing-weekly-report

> 작성일: 2026-05-13 | 작성자: Claude Code (feature-pipeline)

## 개요

GA4 Data API + Claude API(Sonnet 4.6) Node 스크립트로 매주 마크다운 주간 리포트를 Obsidian vault(`~/Documents/pregnancy-checklist/60-analytics/weekly/`)에 자동 생성한다. SaaS 의존 없는 Pattern C 아키텍처로, 5개 GA4 쿼리(코호트 리텐션·핵심 행동 도달률·0결과 검색·외부 유출·이상치)와 §1.9.6 마크다운 스키마(TL;DR + 6개 섹션)를 1인 운영자가 매주 읽도록 정형화한다.

원본 산출물 빠른 링크:
- 기획: [docs/features/marketing-weekly-report/spec.md](../features/marketing-weekly-report/spec.md), [ga4.md](../features/marketing-weekly-report/ga4.md), [review.md](../features/marketing-weekly-report/review.md)
- 구현: [docs/implementation/marketing-weekly-report-impl.md](../implementation/marketing-weekly-report-impl.md)
- 리뷰: [docs/review/marketing-weekly-report-review.md](../review/marketing-weekly-report-review.md)
- 리팩토링: [docs/refactor/marketing-weekly-report-refactor.md](../refactor/marketing-weekly-report-refactor.md)
- 코드: [scripts/weekly-report/](../../scripts/weekly-report/)
- E2E: [e2e/marketing-weekly-report.spec.ts](../../e2e/marketing-weekly-report.spec.ts)

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `scripts/weekly-report/` 5개 파일 (`index.ts`, `ga4-queries.ts`, `claude-prompt.ts`, `writer.ts`, `types.ts`) | ✅ | |
| GA4 Data API 5건 1:1 매핑 (Q1~Q5) | ✅ | Q1은 cohortSpec 우선 + 수동 fallback 이중 경로 |
| Anthropic SDK `claude-sonnet-4-6` + prompt caching | ✅ | system 프롬프트만 `cache_control: ephemeral` |
| 비용 목표 ~$0.04/회 | ✅ | `response.usage` stderr 로깅, 단가 상수 4종 |
| §1.9.6 마크다운 스키마 출력 + `YYYY-Www.md` | ✅ | `~/Documents/pregnancy-checklist/60-analytics/weekly/` |
| 실패 처리 — `_failed/` 로그 + macOS 알림 | ✅ | `osascript` 호출, GA4/Claude 단계 분리 |
| Claude 응답 스키마 불일치 시 raw JSON 첨부 | ✅ | sentinel 헤더 아래 raw 본문 추가 |
| 보안 — env 경유, SA JSON mode 0o600 검증, raw 쿼리 인라인 금지 | ✅ | 권한 비정상은 stderr 경고만(hard block 아님) |
| 첫 8주 raw JSON 병행 저장 (`_raw/YYYY-Www.json`) | ✅ | 8주 컷오프는 별도 후속 작업 |
| vault `60-analytics/` 구조 + `README.md` | ✅ | weekly/_raw/_failed + 지표 정의 문서화 |
| `package.json` `report:weekly` 스크립트 | ✅ | `report:weekly:dry-run` 별도 추가 |
| Next.js 빌드 통과 | ✅ | 32 페이지 정적 생성 성공 |

### 생성/수정 파일

신규 생성
- `scripts/weekly-report/types.ts` — 5개 GA4 쿼리·Claude 결과 타입
- `scripts/weekly-report/ga4-queries.ts` — `BetaAnalyticsDataClient` 래퍼 + Q1~Q5 + 코호트 fallback + ISO 주차 헬퍼
- `scripts/weekly-report/claude-prompt.ts` — system 프롬프트, `cache_control` 마킹, 스키마 사후검증, usage→USD 환산
- `scripts/weekly-report/writer.ts` — vault 경로 보장, 본문/raw/실패 로그 출력, osascript 알림 헬퍼
- `scripts/weekly-report/index.ts` — env 로드·SA mode 검증·dry-run 분기·실패 분기 오케스트레이션
- `~/Documents/pregnancy-checklist/60-analytics/README.md` — vault 운영 안내

수정
- `package.json` — `report:weekly`, `report:weekly:dry-run` 스크립트 + `@anthropic-ai/sdk`, `@google-analytics/data` devDeps
- `package-lock.json` — npm install 결과 (legacy peer deps; date-fns@^4 vs react-day-picker@8 기존 충돌 회피)
- `.env.example` — `GA4_PROPERTY_ID`, `GA4_SA_KEY_PATH`, `ANTHROPIC_API_KEY` 3종 추가

### 주요 결정 사항

- **코호트 fallback 이중 경로**: review.md 항목 2 옵션 C(dry-run에서 결정)를 코드로 흡수 — `queryCohortRetention`이 `cohortSpec`을 먼저 시도하고 에러 발생 시 자동으로 `customUser:cohort_join_week` + `isoWeek/isoYear` 차원 수동 집계로 fallback. 운영자가 dry-run 결과의 `approach` 필드로 사실 확인.
- **`--dry-run` 플래그를 별도 npm 스크립트로 노출**: `report:weekly:dry-run`. cohortSpec 가용성 사실 확인 비용을 낮춤.
- **prompt caching breakpoint를 system 블록 끝에만 배치**: §1.7 시나리오 정의 + §1.9.6 스키마는 매주 동일. user 메시지는 변동분만. 단, ephemeral 캐시 5분 TTL 때문에 주간 주기에서는 실제 캐시 적중 0회 — 비용 가정은 캐시-미스 기준으로 정정함 (리팩토링 단계).
- **SA JSON 권한 검증은 stderr 경고만**: spec §4 "hard block 아님" 조항 그대로. 매주 자동 실행이 권한 문제로 멈추지 않게.
- **schema 사후검증은 frontmatter + 7개 섹션 헤더 존재만 확인**: 무거운 마크다운 파서를 들이지 않음. 누락 시 sentinel + raw 첨부 + macOS 알림. (리팩토링에서 CRLF 정규화 추가)
- **`legacy-peer-deps`로 npm install**: 기존 충돌(react-day-picker@8 의 date-fns@^2||^3 요구 vs 루트 date-fns@^4) 해소 범위 밖. 신규 패키지 추가만 적용.

### 가정 사항 및 미구현 항목

가정
- GA4 Data API에서 `customEvent:results_count`, `customEvent:query`, `customEvent:domain`이 문자열 dimension으로 노출(이벤트 파라미터 자동 등록 또는 사전 등록 완료). 미등록 시 dry-run에서 즉시 발견 가능.
- Sonnet 4.6 단가는 spec D4 가정과 일치 (input $3/M, output $15/M, cache write $3.75/M, cache read $0.30/M). 단가 변경 시 `claude-prompt.ts` 상단 상수 4개만 갱신.
- macOS launchd 등록은 본 라운드 범위 밖.

미구현 (의도)
- **launchd `.plist` 등록 (묶음 M)** — 별도 라운드.
- **vitest 스키마 단위 테스트 (should)** — e2e에서 인프라/실패 분기까지 커버. 스키마 검증 함수는 격리되어 있어 추후 단위 테스트 hook 용이.
- **데이터 부족 disclaimer 자동 삽입 (should)** — Claude 시스템 프롬프트 규칙으로 위임. 첫 8주 raw 검증에서 잘못 동작 시 결정론적 코드로 강제 가능하도록 `Ga4Result.cohort.totalCohorts·anomaly.comparable`을 노출해 둠.
- **raw JSON 8주 컷오프 (§1.9.8 4주 롤링)** — 운영 ~6주차에 별도 추가.

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

1. **index.ts / writer.ts — Claude 실패 시 raw GA4 JSON이 저장되지 않음**
   - 문제: Claude 단계 throw 시 `handleFailure`로만 빠져 `_raw/` 미저장 → spec §4 "raw GA4 데이터는 _raw/에 저장해 수동 분석 가능" 위반.
   - 수정: writer.ts에 `writeRawGa4` 추출. index.ts의 Claude catch에서 raw를 먼저 저장 후 실패 처리.

2. **ga4-queries.ts — 이상치 필터가 0/0 이벤트를 거짓 양성으로 노출**
   - 문제: `prev=0`이면 `deltaPercent=null`이 모두 통과해 사용 0/0 이벤트가 매주 "hypothesis" 밴드로 도배.
   - 수정: 필터에 `currentCount===0 && previousCount===0` 제외 조건 추가. 신규 발현(prev=0 cur>0)은 유지.

### Warning (수정 권장 → 모두 리팩토링에서 처리)

1. **types.ts** — `WeeklyDateRange` 주석 "Sunday → Saturday"가 실제 Monday → Sunday 윈도우와 불일치.
2. **ga4-queries.ts** — 수동 코호트 fallback이 ISO 주차 단순 빼기로 연도 경계(12→1월) 행을 누락.
3. **claude-prompt.ts** — ephemeral 캐시 TTL 5분 vs 주간 실행 주기 — "캐시 적중 $0.02" 가정 실현 불가.
4. **claude-prompt.ts** — frontmatter 검증 정규식이 CRLF 줄바꿈 미처리.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 2건 발견, 2건 수정 완료 |
| Warning | 4건 (모두 리팩토링에서 해소) |
| Suggestion | 3건 (1건 리팩토링 포함, 2건 보류) |

---

## 리팩토링 내용

### 작업 목록

1. **types.ts — `WeeklyDateRange` 주석 정정** — Monday → Sunday window (ISO week) 명시.
2. **ga4-queries.ts — 수동 코호트 fallback의 ISO 연도 경계 처리** — `isoWeek + isoYear` 차원을 함께 요청 → `parseCohortJoinWeek` 헬퍼로 라벨을 월요일 Date로 환산 → `differenceInCalendarISOWeeks`로 nthWeek 계산. 단순 주 번호 빼기가 사라져 12월/1월 경계에서도 정확.
3. **ga4-queries.ts — `cohorts` 배열 명시 타입** (추가 판단) — `CohortBlock[]`로 push 인자 타입 강제, `parseISO` 사용.
4. **claude-prompt.ts — 캐시 TTL 가정 주석 정확화** — "5-min TTL is irrelevant" 단언 제거. 주간 주기는 cache-miss임을 명시하고 $0.04는 cache-miss 기준임을 박아둠.
5. **claude-prompt.ts — frontmatter 검증의 CRLF 허용** — `validateSchema`가 검사 전 `\r\n → \n` 정규화.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 5 (types/ga4-queries/claude-prompt/writer/index) | 5 (동일) |
| 최대 파일 줄 수 | `ga4-queries.ts` 447줄 | `ga4-queries.ts` 459줄 (cohort fallback 정확도 향상) |
| 코호트 fallback nthWeek 정확도 | ISO 주 번호 빼기 — 연도 경계 음수 누락 | 날짜 기반 `differenceInCalendarISOWeeks` |
| frontmatter 검증 CRLF | 미허용 — 거짓 음성 가능 | 정규화 후 검사 |
| `cohorts` 배열 타입 | 추론(any/never[] 의존) | `CohortBlock[]` 명시 |
| 캐시 TTL 가정 주석 | "5-min TTL is irrelevant" (오해 소지) | 캐시-미스 기준임을 명시 |

---

## E2E 테스트 결과

테스트 파일: [e2e/marketing-weekly-report.spec.ts](../../e2e/marketing-weekly-report.spec.ts)

| 시나리오 | 결과 |
|----------|------|
| Happy Path — 인프라 / 배포 산출물 | ✅ 6개 passed |
| Error / Validation — env 검증 | ✅ 4개 passed |
| 권한 / SA JSON 모드 검증 | ✅ 3개 passed |
| 환경 변동 (UI 반응형 N/A 대체) | ✅ 2개 passed |
| **전체** | **15 passed / 0 failed (7.1s)** |

참고: 본 기능은 CLI 스크립트라 UI 모바일 반응형 카테고리는 적용 불가. 환경 변동(ISO 주차 명명, cwd 기준 `.env.local`) 테스트로 대체했고 spec 파일 상단에 명시. 모든 실패 분기 테스트는 `HOME`을 tmp 디렉토리로 격리해 실제 vault를 오염시키지 않음.

📊 상세 리포트: [playwright-report/index.html](../../playwright-report/index.html)

---

## 운영 메모

- 수동 실행: `npm run report:weekly` (프로젝트 루트에서)
- 사실 확인용 dry-run: `npm run report:weekly:dry-run` — Claude 호출 없이 GA4 응답만 stdout. cohort approach 필드로 cohortSpec 가용성 확인.
- 환경변수: `.env.local` — `GA4_PROPERTY_ID`, `GA4_SA_KEY_PATH` (절대경로, mode 0600), `ANTHROPIC_API_KEY`.
- 출력 위치: `~/Documents/pregnancy-checklist/60-analytics/weekly/YYYY-Www.md`. 실패 로그는 `_failed/YYYY-Www.log`, raw 백업은 `_raw/YYYY-Www.json`.
- 후속 작업: 묶음 M (launchd `.plist` 등록), 8주차 raw 컷오프, 데이터 누적 후 첫 실데이터 검증.
