# weekly-report-wave-1

> 작성일: 2026-06-07 | 작성자: Claude Code
> 모체 플랜: [docs/plan/weekly-report-improvement.md](../plan/weekly-report-improvement.md) §Wave 1

## 개요

주간 GA4 리포트의 **측정 신뢰성**을 운영자 휴면(2026-08~) 진입 전에 회복하기 위한 Wave 1 작업. ① cohortSpec 호출 인자 누락으로 4주 연속 비어 있던 북극성(Q1)을 부활시키고, ② Q4에서 자체 도메인이 자체화 후보로 잡히는 거짓 양성을 제거하고, ③ Q2 wowDelta가 null일 때 본문에 빈 `±%`가 찍히던 문제를 `"new"` sentinel로 명시화한다.

---

## 구현 내용

### 완료 조건 충족 여부

| # | 조건 | 상태 | 검증 |
|---|------|------|------|
| 1 | `cohortSpec.cohorts[].dimension = "firstSessionDate"` → `INVALID_ARGUMENT` 해소 | ✅ | dry-run `approach: "cohortSpec"`, totalCohorts=4 |
| 2 | manual fallback `firstSessionDate` 재작성 | ✅ | typecheck 통과 (fallback은 안전망 path) |
| 3 | `pregnancy-checklist.com` 변종이 Q4에 등장 X | ✅ | `SELF_DOMAINS` Set + filter chain |
| 4 | `CoreBehaviorRow.wowDelta` 타입 `number \| "new" \| null` | ✅ | dry-run: `checklist_item_toggle.wowDelta = "new"` (prev=0, cur=4) |
| 5 | SYSTEM_PROMPT에 `wowDelta="new"` 의미 한 줄 | ✅ | "데이터 부족 처리" 블록에 추가 |
| 6 | `report:weekly:dry-run` 성공 | ✅ | exit 0, 전 섹션 정상 |

### 생성/수정 파일

수정 3개:
- [scripts/weekly-report/types.ts](../../scripts/weekly-report/types.ts) — `CoreBehaviorRow.wowDelta` 타입 `number | null` → `number | "new" | null`
- [scripts/weekly-report/ga4-queries.ts](../../scripts/weekly-report/ga4-queries.ts) — `SELF_DOMAINS` 상수, cohortSpec dimension, manual fallback firstSessionDate 재작성, wowDelta 3-way 분기, self-domain 필터
- [scripts/weekly-report/prompt-shared.ts](../../scripts/weekly-report/prompt-shared.ts) — SYSTEM_PROMPT "wowDelta='new' = 신규 발현" 한 줄

신규 0개.

### 주요 결정 사항

- **cohort `dimension`은 string literal**: GA4 SDK 타입(`ICohort.dimension: string`)이 객체가 아니라 문자열만 허용. typecheck에서 발견 → `dimension: "firstSessionDate"` 로 수정.
- **manual fallback 집계 키**: `(cohortJoinWeek, nthWeek)` 복합 키로 Map 합산. 한 주 안에 firstSessionDate 여러 날이 같은 cohort_join_week로 묶이므로.
- **wowDelta=null 의미 분리**: 기존 `null`은 (신규 발현 + 양주 0) 두 경우가 섞였음. 이제 신규 발현은 `"new"`, 양주 0은 `null`로 명시 구분.

### 가정 사항 및 미구현 항목

가정:
- `SELF_DOMAINS = ["pregnancy-checklist.com", "www.pregnancy-checklist.com"]` 두 변종 — CNAME 단일이므로 충분.
- `wowDelta=null` (양주 모두 0)은 Q2에서 거의 발생하지 않음.

미구현:
- **테스트 코드**: scripts/ 트리는 현 vitest.config 밖. 새 vitest 트리 도입은 Wave 2 #6에서.
- **manual fallback 실 실행 검증**: dry-run에서 cohortSpec 성공이라 fallback path는 호출되지 않음 → 안전망 코드.

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

없음.

### Warning (수정 완료 — refactor 단계에서 처리)

- **runCohortViaManual — lookback window 밖 cohort 포함 가능**
  - 위치: [scripts/weekly-report/ga4-queries.ts:182-226](../../scripts/weekly-report/ga4-queries.ts#L182-L226)
  - 문제: `dateRanges`는 active 세션만 제한하므로 firstSessionDate가 6개월 전인 사용자도 응답에 포함. cohortSpec와 결과 형태 불일치.
  - 수정: `cohortStartMonday` 컷오프 추가로 lookback 8주 cohort 집합으로 좁힘.

### Suggestion (미수정)

- `firstSessionDateToMonday` — 날짜 overflow 입력에 대한 추가 검증 가능 (ROI 낮음, 미수정).
- `CohortBlock` 인라인 타입 정리 (스타일 trade-off, 미수정).

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견 |
| Warning | 1건 발견, 1건 수정 완료 |
| Suggestion | 2건 (모두 미수정) |

---

## 리팩토링 내용

### 작업 목록

1. **runCohortViaManual lookback 컷오프 추가**
   - 무엇을: `cohortStartMonday` 변수 추출 + 집계 루프 안에 `if (joinMonday < cohortStartMonday) continue;`
   - 왜: cohortSpec 경로와 cohort 집합을 일치시켜 두 경로 출력 형태의 일관성 확보.
   - 동작 변경: 없음 (lookback 안 cohort 결과 동일, lookback 밖만 추가로 제외).

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 3개 수정 | 3개 수정 (동일) |
| runCohortViaManual 줄 수 | 45줄 | 50줄 |
| cohortSpec/manual 출력 일관성 | manual에 추가 cohort 포함 가능 | 두 경로 동일 8주 cohort 집합 |

---

## E2E 테스트 결과

Wave 1 변경은 모두 launchd 스크립트(`scripts/weekly-report/`) — UI/네비게이션 흐름 없음. feature-specific E2E spec 없음. 회귀 가드용으로 전체 스위트만 실행.

| 시나리오 | 결과 |
|----------|------|
| Unit (전체 회귀) | ✅ 156 passed / 0 failed (377ms) |
| E2E (전체 회귀) | ✅ 562 passed / 5 skipped / 0 failed (8.8min) |

📊 상세 리포트: `playwright-report/index.html`

---

## 검증 명령

```bash
npm run typecheck                  # tsc --noEmit
npm run report:weekly:dry-run      # cohort approach=cohortSpec + wowDelta="new" 출력 확인
npm run test:unit                  # 회귀 가드 (156/156)
npm run test:e2e                   # 회귀 가드 (562/562 + 5 skipped)
```

---

## 후속 작업 (Wave 2 / 2.5)

- **Wave 2** (6월 셋째~넷째 주): #6 모집단 가드(`previousCount < 10` noise 다운그레이드 + W22 raw unit test), #7 schema validation 강화, M1 유입 채널 Q6, M2 랜딩 페이지 Q7.
- **Wave 2.5** (7월 초): M4 콘텐츠별 성과, M5-b 임신 주차별 분포.

자세한 내용: [docs/plan/weekly-report-improvement.md](../plan/weekly-report-improvement.md)
