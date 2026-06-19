# weekly-report-wave2 리뷰

> 작성일: 2026-06-16
> 상태: reviewed (휴먼 게이트 대기)
> size: M
> 관련 스펙: [spec.md](./spec.md) (생성 후)
> 상위 plan: [docs/plan/weekly-report-improvement.md](../../plan/weekly-report-improvement.md)

## 1. 기능 요약

`scripts/weekly-report/` (Node CLI) 의 Wave 2 작업. 모집단 1~2명 환경에서 발생하는 측정 잡음을 솎고(#6 임계값 가드 + #7 schema validator 강화) 마케터 축 시드를 위해 유입 채널(M1, Q6 신설)·랜딩 페이지(M2, Q7 신설) 측정 슬롯을 휴면 진입(2026-08-13) 전 박는다. 휴면 중 launchd 가 자동으로 돌 동안 누적될 3개월치 데이터의 신뢰성을 결정짓는 마지막 PR 사이클.

## 2. 적용 페어 + 선택 이유

- **dev × qa**: #6 임계값 가드와 #7 schema validator 강화가 모두 testability 영역. 함수 시그니처(testable 한가) + fixture 적재 범위 + skip deadline 룰 — 충돌 축이 동시에 3개.
- **planner × marketer**: M1·M2 가 schema lock 을 한 PR 안에서 두 칸 깬다. 마케터는 휴면 누적 가시성 최대화, 기획자는 validator 룰 정합성 + 1인 운영 회복력 우선.

의도적 제외: qa×planner(위 두 페어에 흡수), dev×marketer(토큰 비용 결정은 plan 단계에서 종결), dev×planner(Wave 1·2 분리 결정 종결).

## 3. 페어별 충돌

### 페어 1: dev × qa

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 페어 시작: dev × qa
- 이전 페어 [없음] 의 양보·합의는 이 페어에 영향 없음.
- dev 인용 후보: §6.5 "안전망 우회", §3.2 "산출물 우선 — 임시 추정값 안 박음"
- qa 인용 후보: §7.1 "skip 사용 시 제거 조건+deadline", §7.2 "단언 약화로 통과 X", §7.4 "fs-level grep 가드 절대 삭제 X"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**T1: dev 단독 입장**
- 잃는 것: #6 임계값 10 을 hard-coded 로 박고 끝내고 싶다(단순). qa 가 fixture+config 화 요구하면 한 함수가 두 파일로 쪼개진다. W22 raw JSON 을 src/lib/__tests__ 픽스처로 영구 보관하면 fixture 누적·민감 데이터 노출 우려(active users 1~2명이라 식별 위험).
- 희생 거부 인용: "임시로 개발자 추정값을 박지 않는다. 한 번 박힌 추정값은 산출물 결정 후에도 그대로 남는 경우가 많다." — docs/tech/persona.md §3.2
- 주장: 임계값 10 은 **plan 의 잠정값**이라 추정값 박기 금지 원칙에 정면 위배. config 화하되 운영자가 W22~W24 실데이터로 결정하기 전에는 inline 박지 말고 한 자리 변경으로 끝나게 두자. fixture 는 PII-free 슬림 익명화.
- 잔재 자기검증: 이전 페어 없음 — N

**T2: qa 반박 입장**
- dev 발언에 대한 명시 반박:
  - "운영자 결정 전엔 inline 박지 말자"는 옳지만 **config 화 자체로는 테스트가 임계값 변화에 흔들리지 않는다는 보장이 없다**. 함수가 `bandForDelta(delta, opts)` 형태로 외부 주입 받아야 unit test 가 "임계값을 9·10·11 로 바꿔도 동작이 단조롭게 변하는가" invariant 검증 가능.
  - "fixture 익명화 슬림" 동의하지만 **W22 raw 한 주만으로는 회귀 가드 단방향**. plan 에 W22~W24 3주분 누적 명시 — W22(active>0)·W23(중간)·W24(active=0 incident) 세 케이스 fixture 다 필요. 한 주만 박으면 "이 한 주 시나리오만 정상화"하는 함정.
- 잃는 것: #7 validator 강화로 `"\| ..."` placeholder 검출 + `"new"` sentinel 통과가 같은 regex 안에서 충돌. validator 가 더 엄격해질수록 false positive 우려. skip 후보 0건 목표 양보 불가 — Wave 1 sentinel 검증을 #7 validator 가 즉시 커버해야 하고 "Wave 3 보강" 미루기 X.
- 희생 거부 인용: "skip 사용 시 제거 조건과 deadline 같이 명시한 TODO 코멘트 필수." — docs/qa/persona.md §7.1
- 주장: bandForDelta 를 testable 시그니처로 리팩토링 + W22·W23·W24 fixture 박기 + #7 validator 는 `"new"` sentinel 명시 화이트리스트로 분기. 안 되면 #6 unit test 가 "통과해도 회귀 못 잡는" 통과극.
- 잔재 자기검증: 이전 페어 없음 — N

**T3: 핵심 충돌 + 숨은 가정**
- 핵심 충돌: dev는 "임계값은 운영자가 실데이터로 정할 일이니 한 자리 갈아끼우기"·"PR 작게" 우선. qa는 "임계값 변해도 동작 단조성 invariant 박기"·"3주분 fixture" 우선. 즉 "코드 변경 표면 최소화" vs "테스트가 다음 변경에도 살아남기".
- 숨은 가정: 양쪽 다 "W22~W24 raw JSON 이 PII-free 익명화 가능"으로 가정. M1·M2 가 같은 PR 에 들어가면 raw JSON 에 sessionDefaultChannelGroup·landingPagePlusQueryString 의 URL·검색어가 새로 박혀 익명화 비용이 plan §Wave 2 범위 밖에서 등장.

### 페어 2: planner × marketer

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 페어 시작: planner × marketer
- 이전 페어 [dev × qa] 의 양보·합의는 이 페어에 영향 없음.
- planner 인용 후보: §7.1 "schema 변경은 migrate 없이 배포 금지", §7.6 "측정 없는 기능 도입 거부"
- marketer 인용 후보: §3.6 "측정 락인 깨기 금지", §3.7 "운영자 번아웃 무시 금지"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**T1: marketer 단독 입장**
- 잃는 것: M1·M2 를 Wave 2 에 동시 안 넣으면 **휴면 진입 전 마지막 schema lock 변경 기회를 1회로 합쳐 쓸 기회 상실**. 휴면 중 launchd 만 도는 동안 schema 변경 못 함. M5-b(주차별 분포)는 Wave 2.5 이관 동의하지만 §6·§7 두 섹션은 반드시 Wave 2 에.
- 희생 거부 인용: "신규는 추가만, 변경은 신/구 병행 발사 4주 grace period, 삭제는 사실상 금지" — docs/marketing/persona.md §3.6
- 주장: M1·M2 둘 다 Wave 2 신설. 휴면 진입 전 schema lock 깨는 PR 횟수 최소화. plan §Wave 2 에 "schema 락을 §6·§7 추가로 함께 깬다" 이미 명시 — 한 번에 가는 게 락인 비용 측면에서도 정합.
- 잔재 자기검증: 이전 페어 [dev × qa] 영향 없음 — N — dev × qa 는 구현·테스트 축, 이 페어는 신규 차원 도입 축. 결정 영역 비교차.

**T2: planner 반박 입장**
- marketer 발언에 대한 명시 반박:
  - "한 PR 에 §6·§7 둘 다" — schema 락을 한 번에 두 칸 깨는 비용 과소평가. plan §1.9.6 schema 는 LLM 프롬프트와 validateSchema 양쪽 동시 갱신 필요. **#7 validator 강화와 §6·§7 신규 섹션이 같은 PR 에 들어가면 "신규 섹션이 비어도 통과해야 하는가"를 동시에 결정 필요. 모집단 1~2명 + 휴면기에는 §6·§7 자체가 빈 표 가능성 높음.** validator 가 "비어도 OK"로 풀면 #7 placeholder 거부 룰과 충돌, "비면 안 됨"으로 닫으면 휴면기 launchd 매주 실패.
  - "휴면 후 schema 변경 또 필요" — 가정 약함. M1·M2 신설은 §6·§7 신규 섹션 추가라 기존 호환 깨지지 않음. 휴면기에 §6·§7 비어 있든 차 있든 휴면 후 §8 추가가 호환을 깨지 않음.
- 잃는 것: M1 만 Wave 2 / M2 Wave 2.5 분리면 §7 랜딩 페이지 데이터 휴면기 3개월치 누락. 1인 운영 지속성 위반 위험 — Wave 2 PR 4 sub-feature 부풀면 휴면 직전 가장 바쁜 시점에 리뷰 1회 실패 시 회복 시간 없음.
- 희생 거부 인용: "측정 없는 기능 도입 거부" — docs/content/persona.md §7.6. 그리고 "1인 운영자에게 매일 수동 작업·정형화 안 된 반복 노동 강요 거부" — docs/marketing/persona.md §3.7 (운영 부피 통제 논거로 인용).
- 주장: Wave 2 에 §6(채널) 만 신설 + §7(랜딩) Wave 2.5 이관. Wave 2.5 가 M4 + M5-b 묶음이라 M2 추가 자연스러움. §7 신규 섹션과 #7 validator 변경이 같은 PR 안 섞임.
- 잔재 자기검증: 이전 페어 [dev × qa] 영향 없음 — N — dev × qa 의 fixture·시그니처 논의가 이 페어의 schema 락·휴면 가시성 판단에 묻어나지 않음.

**T3: 핵심 충돌 + 숨은 가정**
- 핵심 충돌: marketer 는 "휴면 진입 전 schema lock 한 번에 §6·§7 둘 다, 휴면 누적 데이터에 차원 박기" 우선. planner 는 "validator 강화와 신규 섹션 추가가 같은 PR 에 들어가면 모집단 1~2명에서 신규 섹션 빈 표 문제가 validator 룰을 흔든다 + Wave 2 PR 부피가 1인 운영 회복력을 깎는다"며 §6 만 Wave 2 / §7 Wave 2.5 분리 주장. 즉 "휴면 누적 가시성 최대화" vs "validator 룰 정합성 + PR 회복력".
- 숨은 가정: 양쪽 다 "휴면 진입 = 2026-08-13" 고정 가정. 운영자 휴가 7월 중순(미정) + launchd 만 도는 시점이 1개월 가량 있어, Wave 2.5 머지가 7월 초까지 안 끝나면 plan 의 "휴가 전까지 머지" 약속 무너짐. M2 Wave 2.5 이관 결정이 안전하려면 7월 초 머지 가능성 추가 확인 필요.

## 4. 미해결 트레이드오프

- [ ] **항목 1: 임계값 구현 방식 (#6 모집단 가드)**
  - 옵션 A: `bandForDelta` 시그니처 유지 + 모듈 상수 `PREVCOUNT_NOISE_THRESHOLD = 10` 노출
    - 즉시 비용: 한 줄. PR 작음.
    - 나중 비용: unit test 가 "임계값 변경 시 동작 단조성" invariant 검증 불가 → 임계값 변경 회귀 가드 없음.
  - 옵션 B: `bandForDelta(delta, opts: { previousCount, threshold? })` 리팩토링 + 호출부 갱신
    - 즉시 비용: 함수 시그니처 1군데 + ga4-queries.ts 호출부 3~4군데. unit test 매트릭스 추가.
    - 나중 비용: 임계값 변경이 코드 1줄 + 테스트 0줄. 회귀 가드 살아남음.
  - **결정:** _(사용자 작성 영역)_

- [ ] **항목 2: W22~W24 raw JSON fixture 적재 범위**
  - 옵션 A: W22 한 주만 익명화 fixture (plan §Wave 2 명시값)
    - 즉시 비용: 1주 익명화.
    - 나중 비용: 단방향 회귀 가드. W24 incident=-100% 케이스 회귀 미보호.
  - 옵션 B: W22·W23·W24 3주분 모두 익명화 + fixture
    - 즉시 비용: 3주 익명화 (1주 대비 3배). W22~W24 raw 는 모두 Wave 2 머지 전 데이터라 신규 차원(채널·랜딩)이 아직 raw 에 없음 — M1·M2 와의 직접 충돌 없음.
    - 나중 비용: noise/incident/normal 3 케이스 회귀 가드 완비. fixture 를 W25 이후 raw 로 진화시킬 때 신규 차원 익명화 스크립트 갱신 필요(옵션 A/C 도 동일 시점에 발생하는 별개 트랙).
  - 옵션 C: W22·W24 양극단 두 주 (active>0 / active=0)
    - 즉시 비용: 2주 익명화.
    - 나중 비용: W23 중간 케이스 미커버. 단계적 회귀 가드.
  - **결정:** _(사용자 작성 영역)_

- [ ] **항목 3: Wave 2 PR 범위 — §7 랜딩(M2) 동시 도입 여부**
  - 옵션 A: Wave 2 = #6 + #7 + §6(M1) + §7(M2) 4 sub-feature 한 PR (plan 현재 안)
    - 즉시 비용: validator 강화와 신규 섹션 2개가 같은 PR — "신규 섹션 빈 표 OK 인가" 동시 결정 필요. PR 부피.
    - 나중 비용: 휴면 누적에 채널·랜딩 둘 다 박힘.
  - 옵션 B: Wave 2 = #6 + #7 + §6(M1) 3 sub-feature, M2 → Wave 2.5
    - 즉시 비용: PR 부피 ↓. validator 가 신규 섹션 1개만 다룸.
    - 나중 비용: Wave 2.5 머지가 7월 초 안 끝나면 §7 랜딩 데이터 휴면 3개월치 누락.
  - 옵션 C: Wave 2 = #6 + §6(M1) + §7(M2), #7 validator 는 별도 PR
    - 즉시 비용: validator 강화 빠지면서 신규 섹션 빈 표·placeholder 충돌 회피.
    - 나중 비용: validator 없이 Wave 2 휴면 진입 → 신규 섹션 placeholder 통과 위험. plan §Wave 1 ⚠️ 메모와 정반대 방향.
  - **결정:** _(사용자 작성 영역)_

## 5. 결정

> 2026-06-18 휴먼 게이트에서 운영자 결정.

- **항목 1 → 옵션 B**: `bandForDelta(delta, opts: { previousCount, threshold? })` 시그니처 리팩토링 + 호출부 갱신. 임계값 변경 invariant 가 unit test 매트릭스에서 직접 검증되도록.
- **항목 2 → 옵션 B**: W22·W23·W24 3주분 모두 익명화 + fixture. noise/incident/normal 3 케이스 회귀 가드 완비. M1·M2 와의 직접 충돌 없음(3주 raw 가 모두 Wave 2 머지 전이라 신규 차원이 아직 없음). fixture 진화 시 익명화 스크립트 갱신은 옵션 A/B/C 무관하게 발생하는 별개 트랙.
- **항목 3 → 옵션 A**: Wave 2 = #6 + #7 + §6(M1) + §7(M2) 4 sub-feature 한 PR. plan 현재 안 유지. 휴면 누적 데이터에 채널·랜딩 둘 다 박는 효과 우선. validator 가 "신규 섹션 빈 표 OK 인가" 동시 결정은 spec.md / qa.md 에서 명시 룰로 박을 것.

## 6. 우선순위 영향

- 항목 3 결정에 따라 Wave 2.5 PR 범위가 함께 변동. M2 이관 시 [docs/plan/weekly-report-improvement.md](../../plan/weekly-report-improvement.md) §Wave 2 / §Wave 2.5 갱신 필요.
- 항목 1 옵션 B 선택 시 `scripts/weekly-report/ga4-queries.ts` 의 `bandForDelta` 호출부 3~4 군데가 변경 표면에 들어옴 (마이너 시그니처 깨짐 — 외부 import 없는 내부 함수라 영향 좁음).
- 항목 2 옵션 B/C 선택 시 `src/lib/__tests__/` 가 아닌 `scripts/weekly-report/__fixtures__/` 위치 검토 필요 (보고서 스크립트 도메인이라 src/lib 와 격리).
