# marketing-weekly-report 기획서

> 작성일: 2026-05-12  size: M
> 관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조
- 항목 1: 5개 GA4 쿼리 전부 1차 라운드 포함 (스키마 §1.9.6 완결)
- 항목 2: dry-run으로 cohortSpec 가용성 확인 후 코호트 쿼리 구현 경로 결정

## 1. 배경·목적
- **운영자**: G~J wiring 완료(2026-05-12)로 이벤트 데이터 수집 시작. 수집된 데이터를 매주 정형 리포트로 자동 소화해야 1인 운영 지속 가능.
- **측정**: 북극성(코호트 리텐션) + 보조(핵심 행동 도달률) + 진단(0결과 검색·외부 유출·이상치)을 하나의 마크다운에 종합.
- **아키텍처**: Pattern C — GA4 Data API + Claude API(Sonnet 4.6) Node 스크립트. SaaS 의존 없이 Obsidian vault 로컬 파일 출력.

## 2. 사용자 시나리오
- 시나리오 1 (정상): 운영자가 `npm run weekly-report` 실행 → GA4에서 직전 7일 데이터 수집 → Claude가 정형 마크다운 생성 → `60-analytics/weekly/YYYY-Www.md` 저장 → 운영자가 Obsidian에서 읽고 액션 결정
- 시나리오 2 (데이터 부족): D-Data 누적 전 또는 트래픽 미미 → 각 섹션에 "데이터 누적 N주차 — 추세 판단은 4주 이후부터 유효" disclaimer 자동 삽입 → 빈 리포트가 아닌 구조화된 부족 안내
- 시나리오 3 (API 실패): GA4 또는 Claude API 에러 → `_failed/YYYY-Www.log` 기록 + macOS 알림 → 조용한 실패 방지
- 시나리오 4 (스키마 불일치): Claude 응답이 §1.9.6 스키마 어긋남 → raw JSON 첨부 + 경고 로그 → 디버깅 가능

## 3. 기능 요구사항

### must
- `scripts/weekly-report/` 디렉토리 5개 파일 (`index.ts`, `ga4-queries.ts`, `claude-prompt.ts`, `writer.ts`, `types.ts`)
- GA4 Data API `runReport` 호출 — §1.7 분석 시나리오 5건 1:1 매핑:
  1. 코호트 리텐션 (cohort_join_week x 주차별 active) — cohortSpec 또는 session_start 기반 (dry-run 결과에 따라)
  2. 핵심 행동 도달률 (`checklist_item_toggle` / `article_read_complete` / `weight_log`)
  3. `search_submit` results_count=0 TOP 10
  4. `external_link_click` TOP 도메인
  5. 직전주 대비 ±5% 변동 항목 (이상치)
- Anthropic SDK 호출 — `claude-sonnet-4-6` + prompt caching
  - system 프롬프트: §1.7 시나리오 정의(stable, `cache_control: { type: "ephemeral" }`) + 직전 4주 추세(변동, user 메시지)
  - 비용 목표: 회당 ~$0.04 (캐시 적중 $0.02). 월 ~$0.2
  - `response.usage` stderr 로깅
- 마크다운 출력 — §1.9.6 스키마 준수
  - frontmatter: `week`, `generated`, `ga4_property`
  - 섹션: TL;DR / 1.북극성 코호트 리텐션 / 2.핵심 행동 도달률 / 3.다음 콘텐츠 백로그 / 4.자체화 후보 / 5.이상치·마찰점 / 6.추천 액션
  - 출력 경로: `~/Documents/pregnancy-checklist/60-analytics/weekly/YYYY-Www.md` (ISO 주차)
- 실패 처리 (D5)
  - API 실패 → `60-analytics/weekly/_failed/YYYY-Www.log` 에러 기록
  - macOS 알림 (`osascript -e 'display notification ...'`)
  - Claude 응답 스키마 불일치 시 raw JSON 첨부
- 보안 (§1.9.5)
  - `process.env.GA4_SA_KEY_PATH` — 절대경로 하드코딩 금지
  - `process.env.ANTHROPIC_API_KEY` — 환경변수 경유
  - 스크립트 시작 시 SA JSON 파일 `fs.stat` mode 0o600 검증 (아니면 경고)
  - 출력 마크다운에 raw 쿼리 인라인 금지 (집계·요약만)
- 첫 8주 raw JSON 병행 저장 (`weekly/_raw/YYYY-Www.json`) — §1.9.8 회귀 안전장치
- vault `60-analytics/` 디렉토리 구조 생성 + `README.md` (Pattern C 운영 안내 + 지표 정의)
- `package.json` 스크립트: `"report:weekly": "tsx scripts/weekly-report/index.ts"`

### should
- 마크다운 스키마 검증 함수 + vitest 단위 테스트
- 데이터 부족 시 각 섹션 상단 disclaimer 자동 삽입 ("데이터 누적 N주차")
- prompt caching 최적화: 시나리오 정의 블록에만 cache breakpoint, 추세 데이터는 user 메시지로 분리
- dry-run 모드 (`--dry-run` 플래그): Claude API 호출 건너뛰고 GA4 응답만 확인

### won't (이번 범위 밖)
- launchd `.plist` 작성·등록 — 묶음 M 영역
- 4주차 monthly 롤업 — Phase 5 영역 (§1.9.2 선택)
- Looker Studio·Drive·Notion 연동 — Pattern C 결정
- `analytics.ts`(브라우저 런타임)와 모듈 공유 — §1.9.3 명시, 의존성 충돌 회피
- 기존 GA4 이벤트 카탈로그 변경 — wiring 완료 상태, 읽기만
- `feature_request_signal` 쿼리 — spec deferral (ga4.md §8 참조)

## 4. 예외·엣지 케이스
- **빈 데이터**: GA4 응답 rows=0 또는 코호트 데이터 부족 → 해당 섹션에 "데이터 부족" 명시. 리포트 자체는 생성 (빈 리포트 아님).
- **GA4 API 할당량 초과**: 무료 GA4는 일일 200K 토큰 한도. 5개 쿼리로는 문제 없으나, 비정상 반복 실행 시 rate limit → `_failed/` 로그 + 알림.
- **Claude API 타임아웃/에러**: retry 1회 후 실패 → `_failed/` 로그. raw GA4 데이터는 `_raw/`에 저장해 수동 분석 가능.
- **SA JSON 권한 비정상**: mode != 0o600 → stderr 경고 출력 후 계속 실행 (hard block 아님, 경고만).
- **vault 디렉토리 부재**: `60-analytics/weekly/` 없으면 mkdir -p로 자동 생성.

## 5. 성공 기준
- 기능 동작: `npm run weekly-report` 1회 실행 → `60-analytics/weekly/YYYY-Www.md` 파일 생성. §1.9.6 스키마 6개 섹션 모두 존재.
- 측정 지표: ga4.md 쿼리 매트릭스 5건 모두 GA4 Data API 호출 성공 (빈 데이터 허용).
- 비용: Claude API 호출 1회 `response.usage` 로그에서 총 비용 $0.05 이하.
- 보안: SA JSON 경로 하드코딩 0건. `ANTHROPIC_API_KEY` 하드코딩 0건. 출력 MD에 raw 쿼리 0건.
