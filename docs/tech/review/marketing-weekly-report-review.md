# marketing-weekly-report 코드 리뷰

> 작성일: 2026-05-13  근거: [spec.md](../../features/marketing-weekly-report/spec.md), [impl.md](../implementation/marketing-weekly-report-impl.md)

## 리뷰 대상 파일
- `scripts/weekly-report/types.ts`
- `scripts/weekly-report/ga4-queries.ts`
- `scripts/weekly-report/claude-prompt.ts`
- `scripts/weekly-report/writer.ts`
- `scripts/weekly-report/index.ts`

---

## Critical 이슈 (즉시 수정 완료)

### 1. index.ts / writer.ts — Claude 실패 시 raw GA4 JSON이 저장되지 않음
- **위치**: [scripts/weekly-report/index.ts:118-124](../../../scripts/weekly-report/index.ts#L118-L124)
- **문제**: Claude 호출이 던지면 `handleFailure`로 빠져 `_failed/` 로그만 쓰고 `process.exit(1)`. 정상 경로의 `writeWeeklyReport`만 `_raw/YYYY-Www.json`을 쓰기 때문에, Claude API 장애가 발생하면 운영자가 GA4 집계 결과를 수동으로 분석할 백업이 사라진다. spec §4 "Claude API 타임아웃/에러 → raw GA4 데이터는 `_raw/`에 저장해 수동 분석 가능"을 위반.
- **수정 내용**: `writer.ts`에 `_raw/` 저장만 담당하는 `writeRawGa4` 함수 추출. `writeWeeklyReport`는 내부적으로 이 함수를 호출해 중복 없음. `index.ts`의 Claude catch 블록에서 `writeRawGa4(isoWeek, ga4Result)`를 호출해 실패 후에도 raw가 vault에 남도록 변경. stderr에 raw 경로를 함께 안내.

### 2. ga4-queries.ts — 이상치 필터가 0/0 이벤트를 거짓 양성으로 노출
- **위치**: [scripts/weekly-report/ga4-queries.ts:397-411](../../../scripts/weekly-report/ga4-queries.ts#L397-L411)
- **문제**: `prev=0`이면 `deltaPercent=null`. 필터는 `deltaPercent === null || abs >= 5`라서 `prev=0 AND cur=0`인 이벤트(트래픽 적은 초기엔 `empty_state_view`, `scroll_without_action` 등 대부분)가 그대로 통과 → `bandForDelta(null)`이 "hypothesis"를 반환해 거짓 양성 이상치로 매주 리포트 상단을 채움. 신호 대 잡음비가 망가져 §1.7 이상치 시나리오의 의사결정 가치가 사라진다.
- **수정 내용**: 필터에 `currentCount === 0 && previousCount === 0` 조건을 추가해 양주 모두 0인 행을 제거. 신규 발현(prev=0, cur>0)은 신호가 있으므로 유지(`hypothesis` 밴드).

---

## Warning (수정 권장)

### 1. types.ts — `WeeklyDateRange` 주석이 실제 주차 윈도우와 어긋남
- **위치**: [scripts/weekly-report/types.ts:14-17](../../../scripts/weekly-report/types.ts#L14-L17)
- **문제**: 주석에 "Sunday → Saturday window"라 적혀 있지만 `lastCompletedIsoWeek`는 `startOfISOWeek`(월요일)로 시작해 `+6일`(일요일)로 끝나는 Monday → Sunday 윈도우.
- **권장 수정**: 주석을 `Monday → Sunday window (ISO week)`로 정정.

### 2. ga4-queries.ts — 수동 코호트 fallback이 ISO 연도 경계에서 행 누락
- **위치**: [scripts/weekly-report/ga4-queries.ts:160-172](../../../scripts/weekly-report/ga4-queries.ts#L160-L172)
- **문제**: `cohortIndex`/`activeIndex`를 ISO 주차 번호만으로 단순 빼기 → 코호트 `2025-W52`와 active week `2026-W04`의 nthWeek가 `-48`로 계산되어 `nthWeek >= 0` 필터에서 제거됨. 매년 12월/1월 경계에서 fallback 경로가 데이터를 잃는다.
- **권장 수정**: ISO 주차 → 절대 주차 카운터로 환산(예: 연도×52 + 주차) 후 빼기. 또는 코호트 join 주의 시작 날짜를 함께 보관하고 날짜 기준 차이 계산.

### 3. claude-prompt.ts — ephemeral 캐시 TTL이 주간 실행 주기와 맞지 않음
- **위치**: [scripts/weekly-report/claude-prompt.ts:1-15](../../../scripts/weekly-report/claude-prompt.ts#L1-L15)
- **문제**: 주석은 "5-min TTL is irrelevant"라 단언하지만, 실제 ephemeral prompt cache는 마지막 사용 후 ~5분 만에 만료. 주 1회 실행 사이에 캐시 적중은 거의 0이고 매번 cache-write 비용이 발생. spec §1.9.4 D4 "캐시 적중 시 $0.02" 가정이 무너질 가능성이 높다.
- **권장 수정**: 1) Anthropic 1시간 캐시(`cache_control: { type: "ephemeral", ttl: "1h" }`)가 가능해진 시점이면 그것으로 전환. 2) 그래도 주간 주기 적중은 불가능하므로 비용 가정을 "캐시 미스 기준 $0.04"로 보수적으로 갱신. 3) usage 로그에 cache_read=0 비율이 100%면 운영자에게 경고.

### 4. claude-prompt.ts — frontmatter 검증 정규식이 CRLF 줄바꿈을 허용하지 않음
- **위치**: [scripts/weekly-report/claude-prompt.ts:152](../../../scripts/weekly-report/claude-prompt.ts#L152)
- **문제**: `/^---\n[\s\S]+?\n---/`은 `\r\n`을 인식 못 함. Claude 출력이 CRLF면 정상 frontmatter여도 누락으로 오판.
- **권장 수정**: `/^---\r?\n[\s\S]+?\r?\n---/` 또는 검증 전 `markdown.replace(/\r\n/g, "\n")`으로 정규화.

---

## Suggestion (개선 아이디어)

### 1. ga4-queries.ts — `cohorts` 배열에 명시 타입 부여
- [scripts/weekly-report/ga4-queries.ts:109](../../../scripts/weekly-report/ga4-queries.ts#L109) `const cohorts = []` 후 push. TypeScript가 추론해 동작하나 명시 타입(`const cohorts: { name: string; dateRange: { startDate: string; endDate: string } }[] = []`)이 의도가 더 분명.

### 2. index.ts — `main().catch`의 stage가 항상 `"ga4"`로 기록됨
- [scripts/weekly-report/index.ts:166-170](../../../scripts/weekly-report/index.ts#L166-L170) — env 검증·SA mode 검증 실패도 stage가 `"ga4"`로 남아 디버그 시 오해 소지. `stage: "config"` 분기 추가 또는 검증 단계에서 명시적으로 exit하기.

### 3. writer.ts — `notifyMacOS` 가 macOS 외에서 silent fail
- [scripts/weekly-report/writer.ts:90-94](../../../scripts/weekly-report/writer.ts#L90-L94) — `spawnSync("osascript", ...)`는 Linux에서 ENOENT를 던지지만 `stdio: "ignore"`로 가려짐. 1인 운영 환경이 macOS 단일이라 현재 무해하나, 운영자 PC가 바뀌면 알림이 조용히 사라진다. 환경 가드(`process.platform === "darwin"`) 또는 fallback 로그 한 줄 권장.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 2건 발견, 2건 수정 완료 |
| Warning | 4건 |
| Suggestion | 3건 |
| 빌드 | 성공 (1회 시도) |
| E2E 재검증 | 15/15 통과 |
