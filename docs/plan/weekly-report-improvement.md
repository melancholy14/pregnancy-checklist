# Weekly Report 개선 계획

> 작성일: 2026-06-03
> 대상: `npm run report:weekly` (`scripts/weekly-report/`)
> 산출 위치: `~/Documents/pregnancy-checklist/60-analytics/weekly/`
> 분석 근거: 코드 + 최근 4주 실 출력물 (2026-W19 ~ W22) + `_raw/*.json`

## 배경

운영자 출산 휴면(~2026-08 중순부터 약 3개월) 동안 launchd가 자동으로 주간 리포트를 계속 돌린다.
**휴면 진입 전에 측정 신뢰성을 잡아두지 않으면 휴면기 3개월치 리포트가 전부 잡음**이 된다.
현재 4주 연속 북극성(Q1 코호트)이 작동하지 않고, 모집단(active users 1~2명)이 너무 작아 모든 이벤트가 incident로 도배되는 상태.

한편 현재 5축은 *site-internal behavior*만 다뤄서 **acquisition·content ROI·search visibility 가시성이 0**.
휴면 후 복귀해서 "어디서 트래픽이 늘었나 / 어느 콘텐츠가 효자인가"를 분석하려면 휴면 진입 전에 마케팅 축 추적 슬롯도 같이 깔아 둬야 한다 (2026-06-03 마케터 페르소나 리뷰).

## 리포트의 5축 (spec §1.7) — 변경 없음

이번 개선은 5축 자체는 유지하고 **측정 정확성·신호 품질·검증 강화**만 다룬다.

1. **북극성** — cohort_join_week × nthWeek 리텐션 (W+1, W+4)
2. **핵심 행동 도달률** — `checklist_item_toggle` / `article_read_complete` / `weight_log`
3. **0결과 검색 TOP 10**
4. **외부 유출 TOP 도메인**
5. **이상치** — WoW ±5/10/20/30 밴드

## 이슈 인벤토리

| # | 이슈 | 근거 | 작업 형태 | 크기 |
|---|------|------|---------|------|
| 1 | **Q1 cohort 영구 실패** | `_raw/2026-W22.json` L13 `cohortSpec.cohorts.dimension` 필수 인자 누락 | `cohortSpec` 호출에 `dimension: { dimensionName: "firstSessionDate" }` 추가 + manual fallback도 `firstSessionDate` 표준 차원으로 재작성 ([ga4-queries.ts:124-198](../../scripts/weekly-report/ga4-queries.ts#L124-L198)) | S~M |
| 2 | **자체 도메인이 자체화 후보로 등장** | W20 리포트 "pregnancy-checklist.com — 1건 (자체화 후보)" | [ga4-queries.ts:367-372](../../scripts/weekly-report/ga4-queries.ts#L367-L372) 필터에 self-domain blacklist | XS |
| 3 | **운영자 본인 트래픽 미필터** | 모집단 1~2명 — 운영자 트래픽이 섞여 있을 가능성 매우 높음 | **코드 X.** GA4 admin → Data Settings → Data filters에 internal traffic 필터 + 본인 IP 등록 | XS (콘솔) |
| 4 | **`customUser:cohort_join_week` 미등록 가능성** | manual fallback이 `INVALID_ARGUMENT: ` 빈 메시지로 실패 | #1을 `firstSessionDate`로 재작성하면 불필요. 코드 변경 후 manual fallback이 GA4 표준 차원만 쓰므로 이 작업은 **deprecate** | — |
| 5 | **`wowDelta=null` → 본문에 `±%` 빈 자리** | W22 "체크 토글: 도달률 100% (직전주 대비 ±%)" | [ga4-queries.ts:291-294](../../scripts/weekly-report/ga4-queries.ts#L291-L294)에서 null 대신 `"new"` sentinel + 프롬프트에 "new = 신규 발현, 비교 불가" 한 줄 | XS |
| 6 | **incident 도배 — 모집단 가드 없음** | W22 page_view 14→32(+128.6%)이 incident로 잡혀 TL;DR 점령 | [ga4-queries.ts:378-385](../../scripts/weekly-report/ga4-queries.ts#L378-L385) `bandForDelta`에 `previousCount < 10` → `noise` 가드 + W22 raw로 unit test | S |
| 7 | **스키마 검증이 placeholder 통과** | W20 표에 `\| ... \| ... \| ... \|` template literal 그대로 남았는데 통과 | [prompt-shared.ts:115-143](../../scripts/weekly-report/prompt-shared.ts#L115-L143) `validateSchema`에 `"\| ..."` literal 검출 + 표 row ≥ 1 검사 | S |
| 8 | **`trendWeeks` 라벨만 있고 데이터 없음** | [prompt-shared.ts:83](../../scripts/weekly-report/prompt-shared.ts#L83) 라벨 4개만 전달 | anomaly 쿼리를 4주 window로 확장 → 프롬프트에 추세 배열 전달 (토큰 증가 트레이드오프) | M |
| 9 | **비용 누적 추적이 stderr만** | [index.ts:147-149](../../scripts/weekly-report/index.ts#L147-L149) 한 줄 로그로 끝 | `_raw/`에 cost row 적재 + 월별 합산 스크립트 | S |

## 마케터 축 누락 (성장 가시성)

> 2026-06-03 마케터 페르소나 리뷰에서 추가. 기존 5축은 *site-internal behavior*만 다루며 acquisition·content ROI·search visibility 가시성이 0.
> 휴면 후 복귀해서 "어디서 트래픽이 왔나 / 어느 콘텐츠가 효자인가"를 분석하려면 휴면 진입 전에 추적 슬롯이 깔려 있어야 한다.

| # | 누락 항목 | 왜 마케터가 봐야 하나 | 작업 형태 | 크기 |
|---|------|------|---------|------|
| M1 | **유입 채널** (sessionDefaultChannelGroup / sessionSource / sessionMedium) | organic vs direct vs referral 분리 안 되면 SEO·AdSense·SNS 중 뭐가 효과인지 모름 | GA4 표준 차원, custom dimension 불필요. Q6 신설 | S |
| M2 | **랜딩 페이지 TOP** (landingPagePlusQueryString) | 어느 콘텐츠가 첫 진입점인지 = SEO 최적화 우선순위. W19~W22 리포트 어디에도 없음 | GA4 표준 차원. Q7 신설 | S |
| M3 | **Google Search Console 연동** | "노출됐는데 클릭 안 됨"은 GA4가 못 잡음. 0결과 검색만 봐서는 SEO 절반만 본 것 | (a) 콘솔에서 GA4 property와 GSC 속성 연결 (1클릭) → (b) Search Console API fetch 통합 | XS (a) / M~L (b) |
| M4 | **콘텐츠별 성과** (article_read_complete를 page_path로 group by) | "어떤 글이 효자인가" — 콘텐츠 ROI 분석 핵심. 현재는 전체 합산만 봄 | 기존 이벤트를 page_path로 group by. Q2 확장 | S |
| M5 | **`current_pregnancy_week` user property 활용** | [PageviewTracker.tsx:18](../../src/components/analytics/PageviewTracker.tsx#L18)에서 이미 박고 있는데 리포트가 무시. "지금 트래픽이 1트라이메스터 vs 막달" 분포는 콘텐츠 전략 결정 핵심 | (a) GA4 admin User-scoped custom dimension 등록 → (b) 리포트에서 dimension 활용 | XS (a) / S (b) |
| M6 | **신규 vs 재방문 분리** | 5축이 전부 합산 (newUsers + returningUsers). WoW 변화의 절반은 "신규가 늘었나/재방문이 줄었나"인데 분리 안 됨 | 모든 쿼리에 newVsReturning dimension 추가 | M |

## 실행 순서

### 🔵 Wave 0 — 즉시 (오늘, GA4 콘솔 단독 작업)

**코드 변경 0. 데이터 반영에 시간이 걸리므로 PR 사이클을 기다리지 않고 가장 먼저 끝낸다.**

- **#3 운영자 트래픽 필터** — Data Settings → Data filters에 internal traffic 필터 등록 + 본인 IP 등록.
- **M5-a `current_pregnancy_week` custom dimension 등록** — Custom definitions → User-scoped → `current_pregnancy_week`. [PageviewTracker.tsx:18](../../src/components/analytics/PageviewTracker.tsx#L18)에서 이미 박는 user property를 GA4가 차원으로 인식하게 함.
- **M3-a GSC 연결** — Admin → Product Links → Search Console에서 GA4 property와 GSC 속성 연결 (1클릭).

> 셋 다 운영자 단독 작업. 작업 완료 후 GA4가 데이터를 채우려면 24~48시간 소요됨. **빨리 등록할수록 W23부터 깨끗한 데이터가 누적.**

**Wave 0 완료 조건** (2026-06-07 완료)

- [x] GA4 admin에서 internal traffic 필터 active
- [x] `current_pregnancy_week`이 GA4 보고서 차원 선택 UI에 노출
- [x] GA4 보고서에서 Search Console 카드 노출

### 🔴 Wave 1 — 휴면 전 필수 (6월 첫째~둘째 주, 1 PR) — ✅ 머지 완료 (2026-06-15)

**"측정 신뢰성 회복" 한 묶음.** 작업이 다 작고 카테고리가 같아 한 PR로 묶는 게 효율적.

PR: be99cc3 (2026-06-15) — "SEO/AEO/GEO 강화: sitemap·JSON-LD 5종 + llms.txt + GA4 weekly-report Wave 1 (#19)".

1. **#1 cohortSpec 복구** — `firstSessionDate` 한 줄로 북극성 부활.
   - manual fallback도 같은 표준 차원으로 다시 작성 → #4 자동 해소.
2. **#2 self-domain 필터** — 한 줄. PR에 끼워 넣기.
3. **#5 신규 발현 sentinel** — `wowDelta: null → "new"` + 프롬프트 한 줄.

> **왜 묶나**: 모두 "GA4에서 잘못 들어오거나 잘못 표시되던 것" 카테고리. 따로 PR 내면 리뷰·머지 오버헤드만 늘어남.

**Wave 1 완료 조건 (W25 ~ 2026-06-22 리포트로 최종 검증 예정)**

- [ ] 다음 주(W25) 리포트의 §1 북극성에 실제 cohort 행이 1개 이상 채워짐
- [ ] §4 자체화 후보에 `pregnancy-checklist.com` 등장 X
- [ ] 핵심 행동 도달률에 `±%` 빈 자리 없음 (`(신규)` 또는 실제 %로 채워짐)

> ⚠️ **W24(2026-06-08~14) 관찰 결과 (2026-06-15)**: Wave 1 머지가 W24 리포트 생성(00:02 UTC) 이후라 본 사이클은 pre-Wave1 로직으로 처리됨 — 완료 조건 검증은 W25로 이관. 또한 W24 자체가 incident 레벨(모든 이벤트 -100%, raw count 0건)로 노출되어 **Wave 2의 #6·#7 필요성을 실데이터로 입증**. Wave 2 즉시 진입 권장.

### 🟡 Wave 2 — 휴면 전 권장 (6월 셋째~넷째 주, 1 PR) — ⏳ 진입 권장 (2026-06-15~)

**"잡음 솎기 + 마케터 축 시드"** Wave 1 머지 후 한 사이클(W24) 돌려본 다음 진행.

**🚨 진입 신호 (2026-06-15)**: W24 리포트가 모든 이벤트 -100% incident로 노출 — 같은 코드 배포 상태에서 현재 gtag 발화 정상. 즉 **실제로는 모집단이 작아서 발생한 측정 노이즈가 incident로 잘못 보고된 케이스**. Wave 2의 #6·#7이 정확히 이 시나리오를 회귀 가드로 막는다. 실데이터 기준 임계값 결정에 필요한 W22~W24 raw JSON 3주분 누적 완료 → unit test 작성 환경 준비됨.

1. **#6 모집단 임계값 가드** — `previousCount < 10` → noise 다운그레이드.
   - W22 raw JSON으로 unit test 작성 (`src/lib/` 단위 테스트 인프라 활용 — `checklist-data-model-bundle` 묶음에서 vitest 156개 통과로 인프라 검증 완료).
   - 임계값 자체는 W22~W24 실데이터 본 다음 결정 (10이 적정한지 검증).
   - **W24 케이스**: previousCount=0 또는 매우 작음 → 모든 -100% 가 noise로 다운그레이드돼야 함.
2. **#7 스키마 검증 강화** — placeholder 통과 막기.
   - Wave 1에서 도입한 `"new"` sentinel도 검증 대상에 포함.
   - **W24 케이스**: §1 북극성 테이블이 `| cohort_join_week | W+1 | W+4 |\n| ... | ... | ... |` 형태로 placeholder만 노출됨 → validateSchema가 잡아내야 함.
3. **M1 유입 채널 Q6 신설** — `sessionDefaultChannelGroup` TOP. GA4 표준 차원이라 추가 등록 불필요.
4. **M2 랜딩 페이지 Q7 신설** — `landingPagePlusQueryString` TOP. SEO 최적화 우선순위 신호.

> **왜 Wave 1과 분리**: #6은 실데이터로 임계값을 검증해야 의미 있어서 Wave 1 머지 후 1주 관찰이 필요. M1·M2는 신규 축 추가라 스키마(§1.9.6) 락을 §6·§7 추가로 함께 깬다 — 별도 PR로 가는 게 리뷰가 깔끔.

**Wave 2 완료 조건**

- [ ] 임계값 가드 unit test 통과
- [ ] W22 raw 데이터를 재처리하면 page_view 14→32가 noise로 분류됨
- [ ] `validateSchema`가 `"| ..."` placeholder 검출
- [ ] 리포트에 §6(유입 채널) + §7(랜딩 페이지) 섹션 노출

### 🟣 Wave 2.5 — 휴면 직전 (7월 초, 1 PR) ★ 신설

**"휴면 누적 데이터를 의미 있게 만드는 마지막 기회"** 휴가 진입 전 마지막 PR.

1. **M4 콘텐츠별 성과** — `article_read_complete`를 `page_path`로 group by. Q2 확장. 콘텐츠 ROI 가시화.
2. **M5-b 임신 주차별 분포** — Wave 0에서 등록한 `current_pregnancy_week` 차원으로 active users 분포 표시. Q8 신설.

> **왜 휴면 직전**: 휴면 중 누적될 데이터가 "그 동안 뭐가 일어났는지" 답을 주려면 콘텐츠·주차 차원이 박혀 있어야 함. 복귀 후 박으면 휴면 3개월치 데이터가 그냥 합산 숫자로만 남음.

**Wave 2.5 완료 조건**

- [ ] 리포트에 §2가 글별 분해로 확장
- [ ] 리포트에 §8(임신 주차별 분포) 노출
- [ ] 7월 둘째 주 안에 머지 + 최소 W27~W28(2주) 실 누적 확인

### 🟢 Wave 3 — 휴면 중 또는 복귀 후 (옵션)

**"있으면 좋은" 영역.** 휴면 들어가도 큰 손실 없음.

1. **#8 trend window 확장** — 4주 → **8주 또는 13주(분기)**.
   - 마케터 페르소나 의견: SEO 효과는 4주 안에 안 나옴. 콘텐츠 누적 → 인덱싱 → 트래픽 반영까지 6~12주. 분기 단위가 의미 있음.
   - **모집단이 충분히 커진 시점에 켜는 게 의미 있음.** 현재 active users 1~2명에서는 의미 없음.
   - 토큰 증가 트레이드오프 있어서 #9(cost monitoring) 깔린 뒤가 안전.
2. **#9 비용 누적 로그** — 운영 회고용. 휴면 중 비용 모니터링 원하면 Wave 2와 함께 가도 됨.
3. **M3-b GSC API 통합** — Search Console API fetch → 리포트에 impression/CTR/평균 노출 위치 카드. 큰 작업이라 복귀 후.
4. **M6 신규 vs 재방문 분리** — 전체 쿼리에 `newVsReturning` dimension 추가. 모집단 커진 후가 의미 있음.

## 타임라인 (휴면 진입 ~2026-08-13 기준)

```text
2026-06-03  ─── 6월 W23~W24 ─── 6월 W25~W26 ─── 7월 초 ──── 7월 중순 휴가 ── 8월 휴면 진입
   │              │                  │              │                              │
   ▼              ▼                  ▼              ▼                              ▼
 Wave 0        Wave 1             Wave 2         Wave 2.5                  (자동 launchd만)
(콘솔 즉시)   (북극성 부활)      (잡음+채널)    (콘텐츠/주차)         ← 신뢰성 + 가시성 둘 다
운영자 필터   self-domain        모집단 가드     글별 분해          누적되어야 의미 있음
주차 차원     신규 sentinel       채널/랜딩
GSC 연결
```

- **휴가 전까지 Wave 0~2.5 머지 + 최소 2주(W27~W28) 신뢰 가능한 리포트 누적**을 목표.
- 산후 복귀 시 "휴면 동안 어디서 트래픽이 왔고 / 어떤 글이 효자였고 / 어느 임신 주차가 늘었나"를 깨끗한 데이터로 분석 가능.
- Wave 3는 휴면 중 launchd가 알아서 돌아가는 동안 또는 복귀 후 처리.

## 메모

- **#3 + M5-a + M3-a (Wave 0)** 는 데이터 반영에 24~48시간 걸리므로 가장 먼저 등록. PR 사이클 의존 없음. W23부터 깨끗한 데이터가 누적되려면 오늘 안에 콘솔 작업 끝내는 게 이상적.
- #1에서 manual fallback을 `firstSessionDate` 기반으로 다시 짜면 #4(custom dimension 등록)는 자동 해소. 즉 운영자가 GA4 콘솔에서 `cohort_join_week`를 user-scoped dimension으로 등록할 필요 없음.
- 반면 **M5(`current_pregnancy_week`)는 user-scoped custom dimension 등록이 필요**. [PageviewTracker.tsx](../../src/components/analytics/PageviewTracker.tsx)는 이미 user property로 박고 있으나 GA4 보고서에서 차원으로 쓰려면 등록이 필수.
- Wave 3 #8은 모집단이 커진 후 켜는 게 맞음. window는 4주가 아니라 **8주 또는 13주(분기)** 가 SEO 효과 측정에 적합 (마케터 페르소나 의견).
- M3 GSC 연동은 (a) 콘솔 연결 1클릭만 Wave 0에서 처리, (b) Search Console API fetch 통합은 Wave 3로 유보. (a)만 해도 GA4 보고서에서 GSC 카드는 봄 — 리포트 자동 통합은 (b) 필요.
- `report:weekly:dry-run`이 있어서 Wave 1/2/2.5 변경 후 실 호출 없이 GA4 응답 구조 먼저 검증 가능 ([index.ts:125-128](../../scripts/weekly-report/index.ts#L125-L128)).
