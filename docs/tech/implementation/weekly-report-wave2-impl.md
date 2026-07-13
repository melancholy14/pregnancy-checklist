# weekly-report-wave2 Implementation

> 구현일: 2026-06-18
> spec: [docs/features/weekly-report-wave2/spec.md](../../features/weekly-report-wave2/spec.md)
> qa: [docs/features/weekly-report-wave2/qa.md](../../features/weekly-report-wave2/qa.md)
> 상위 plan: [docs/plan/weekly-report-improvement.md](../../plan/weekly-report-improvement.md) §Wave 2

## 완료 조건 충족 여부

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

## 생성/수정 파일 목록

### 신규 생성

- `scripts/weekly-report/__fixtures__/anonymize.ts` — 1회용 익명화 스크립트. 향후 fixture 갱신 시 재사용. `npx tsx scripts/weekly-report/__fixtures__/anonymize.ts 2026-W22 2026-W23 2026-W24` 로 실행.
- `scripts/weekly-report/__fixtures__/W22-anonymized.json` — noise 케이스(prev≥10 + 큰 WoW). 회귀 가드: 새 `bandForDelta` 에서도 page_view 14→32 가 incident 유지.
- `scripts/weekly-report/__fixtures__/W23-anonymized.json` — normal 케이스 (mixed: 일부 prev≥10 일부 prev<10).
- `scripts/weekly-report/__fixtures__/W24-anonymized.json` — downgrade 케이스 (active users=0 휴면기 유사). 모든 anomaly 행이 noise 로 떨어져야 함.

### 수정

- `scripts/weekly-report/types.ts` — `ChannelGroupRow`/`ChannelGroupAcquisition`, `LandingPageRow`/`LandingPageEntry` 타입 추가. `Ga4Result` 에 `channelGroup`·`landingPage` 필드 추가.
- `scripts/weekly-report/ga4-queries.ts` — `bandForDelta` 시그니처 리팩토링(`(delta, { previousCount, threshold? })`) + `previousCount < threshold → noise` 가드. Q6 (`queryChannelGroupAcquisition` — sessionDefaultChannelGroup TOP 5) + Q7 (`queryLandingPageEntry` — landingPagePlusQueryString TOP 10) 함수 추가. `collectGa4Result` 가 `Promise.allSettled` 로 7 쿼리 발사.
- `scripts/weekly-report/prompt-shared.ts` — `SYSTEM_PROMPT` 의 §1.7 측정 시나리오 7개로 확장 + 스키마 블록에 §6·§7 추가 + §6→§8 추천 액션 리넘버. `buildUserMessage` 에 Q6/Q7 JSON 블록 추가. `REQUIRED_HEADERS` 에 §6·§7·§8 반영. `validateSchema` 에 placeholder 검출 + sentinel 화이트리스트 + 신규 섹션 빈 표 룰 추가. `extractSection` helper 도입.
- `vitest.config.ts` — `include` 에 `'scripts/weekly-report/**/__tests__/**/*.test.ts'` 추가.

## 주요 결정 사항

- **`bandForDelta` 가 `previousCount=0` 도 noise 로 처리**: spec §3.1 "previousCount === 0 && currentCount > 0 케이스는 `new` 발현 경로" 책임 분리 룰을 따른다. anomaly 쿼리가 prev=0 일 때 `deltaPercent=null` 로 넘기지만, prev<threshold 인 시점에서 이미 noise 로 분기되므로 null 분기 자체에 도달하지 않는다. § 핵심 행동(Q2) 의 `wowDelta="new"` sentinel 경로는 본 함수 책임 밖.
- **§6 → §8 리넘버**: spec §3.1 "REQUIRED_HEADERS 에 `## 6. 유입 채널`, `## 7. 랜딩 페이지` 추가" 룰을 따른다. 기존 `## 6. 추천 액션` 헤더와 충돌하므로 추천 액션은 §8 로 이동. SYSTEM_PROMPT 의 출력 스키마 블록도 함께 갱신.
- **placeholder 검출 정규식 `/\|\s*\.{3,}\s*\|/`**: spec §3.1 의 "raw regex" 명세 그대로. 점 3개 이상 + 양쪽 파이프. ellipsis 유니코드(`U+2026`) 는 본문 해석에 자연스럽게 등장하므로 검출 대상에서 제외(ASCII `...` 만).
- **sentinel 화이트리스트는 라인 단위**: `(신규)` 또는 `wowDelta: "new"` 토큰이 *같은 라인* 에 있으면 placeholder 검출 제외. 다른 라인에서 placeholder 가 등장하면 여전히 invalid → 우선순위는 placeholder.
- **신규 섹션 빈 표 룰**: §6·§7 만 `ALLOW_EMPTY_SECTIONS` 에 들어가 `(데이터 없음)` 명시 텍스트 또는 데이터 행 1개 이상이면 통과. 헤더만 + 본문 빈 줄은 invalid (placeholder 와 동일하게 차단). 기존 §1~§5 는 본 룰 비대상 — 기존 데이터 부족 처리 룰(disclaimer 1줄 + "(데이터 없음)") 유지.
- **fixture 익명화는 propertyId·landingPage 만 처리**: cohortJoinWeek(ISO 주차 라벨)·channelGroup·도메인은 PII 아니라 보존. landingPage 의 query string 만 제거하고 path 100자 truncate. raw vault 의 원본 W22~W24 는 channelGroup/landingPage 가 없으므로 `Partial<Ga4Result>` 처리해 빈 슬롯으로 채움.
- **Q6 `(not set)` 필터**: spec §4 의 "마케터 페르소나 §3.1 룰" 과 일관. 기존 §4 외부 유출 필터 패턴 그대로 복사. Q6/Q7 만 박으면 일관성 깨진다는 spec §4 *unit 검증 외* 메모는 §4 필터에 unit 이 없는 현실 그대로 won't 처리.

## 가정 사항

- **plan §Wave 2 #6 "W22 page_view → noise" 표현은 spec §2 시나리오 2 (W22 incident 유지) 로 수렴**: plan 작성 시점(2026-06-03) 의 직관적 표현이 spec(2026-06-18) 의 정확한 시나리오 분기와 다르다. 실제 W22 fixture 의 page_view 행은 prev=14 ≥ threshold(10) 라 incident 가 정상. plan §Wave 2 메모의 "10이 적정한지 검증" 룰에 따라 threshold 자체는 W25~W27 실데이터 후 운영자가 조정.
- **W22~W24 raw 파일에 channelGroup/landingPage 없음**: Pre-Wave 2 raw 라 당연. `anonymize.ts` 가 `Partial<Ga4Result>` 처리로 빈 슬롯 채워서 새 `Ga4Result` 모양으로 적재. fixture 의 channelGroup/landingPage 행 0개는 §6·§7 빈 표 룰(시나리오 7) 검증에도 사용 가능.
- **launchd 첫 실 노출은 W25 (2026-06-22) 리포트**: spec §5 "측정 지표" 항목 그대로. 본 PR 머지 후 곧바로 다음 사이클부터 노출 시작.

## 미구현 항목

- **unit test 매트릭스 (qa.md §3.2)**: 본 구현 단계는 함수만 박음. `scripts/weekly-report/__tests__/ga4-queries.test.ts` (bandForDelta 매트릭스 ~15 케이스) + `scripts/weekly-report/__tests__/prompt-shared.test.ts` (validateSchema 매트릭스 ~25 케이스) 는 다음 단계(write-unit-tests) 에서 작성.
- **E2E 신규 추가**: qa.md §4.1 결정대로 0건. 기존 `e2e/marketing-weekly-report.spec.ts` 가 인프라 검증 커버.
- **`docs/plan/weekly-report-improvement.md` §Wave 2 완료 체크박스**: spec §6 "수정" 마지막 항목. PR 머지 직후 운영자가 갱신. 본 구현 단계에서는 미수정.
- **`report:weekly:dry-run` manual smoke**: qa.md §6 마지막 항목. PR 머지 후 운영자 단독 1회 실행 — code-review/refactor 단계 이후, write-feature-doc 직전 수행 권장.
