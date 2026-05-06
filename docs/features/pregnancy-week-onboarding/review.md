# pregnancy-week-onboarding 리뷰

> 작성일: 2026-05-05
> 상태: decided
> size: L
> 관련 스펙: [spec.md](./spec.md) (생성 후)
> 출처: [docs/plan/phase-4.5.md §3.1 P3·P4](../../plan/phase-4.5.md)

## 1. 기능 요약

Phase 4.5 P3·P4 — 사용자의 출산 예정일을 명시적으로 입력받아 `current_pregnancy_week`를 자동 산출하고, GA4 user properties(`due_date_set`/`current_pregnancy_week`/`cohort_join_week`) + `pregnancy_week_set` 이벤트의 소스로 사용한다. 핀 하드코딩(`ChecklistHub.tsx:128`)·§1.4 measurement·§2.6 D-day 컨텍스트·P2 isHighlighted의 공통 의존성을 한 번에 해소.

## 2. 적용 페어 + 선택 이유

- **dev × marketer**: GA4 user property set 시점(매 페이지뷰 vs 변경 시만)에 사용자가 직접 의문을 제기. measurement 정합성(마케터)과 호출 비용·정직성(dev)의 트레이드오프가 첨예.
- **dev × planner**: onboarding 트리거 범위(홈에서만 vs 모든 진입 페이지). 사용자가 "정보 탭 첫 유입 시에도 떠야 하나" 질문. static export 제약 + HomeContent 단일 트리거(dev)와 코호트 측정 정합성·도구로의 유입 의무(planner)가 충돌.
- **designer × marketer**: 홈 상단 카드의 노출 강도(due_date_set funnel 전환 vs 인지 부하·시간 도둑질). 미입력자도 둘러보기 허용한 결정 위에서 카드를 어떻게 강조할지가 디자이너 N8(시간 도둑질 금지)와 마케터 §1 등록 funnel과 정면 충돌.

> 페어 선택 기준: 사용자가 결정을 유보·질문한 두 항목(2번·6번)이 자동으로 두 페어를 정의함. 세 번째는 "홈 상단 카드"를 어떤 형태로 둘지가 디자이너·마케터 사이에서 가장 첨예해서 추가.

## 3. 페어별 충돌

### 3.1 페어 dev × marketer — GA4 user property set 시점

**T0 페어 리셋**: 이전 페어 [없음]. dev §3.2/§6.4, marketer §3.1/§3.6/§5.2 인용 후보 재참조.

**T1 [marketer] 단독 입장**
- 잃는 것: 변경 시만 set → 일부 세션에서 user property 슬라이싱 빈자리; "주차×토픽" 인사이트 약화
- 인용: "current_pregnancy_week는 매 방문 갱신, cohort_join_week는 첫 방문 1회만 set" — docs/marketing/persona.md §5.2; "신규는 추가만, 변경은 신/구 병행 4주 grace" — §3.6
- 주장: `current_pregnancy_week`·`due_date_set`는 매 페이지뷰 set, `cohort_join_week`만 1회. GA4 user property는 idempotent · piggyback이라 비용 거의 없음. 측정 경로 단순성 우선.
- 잔재 자기검증: 이전 페어 없음 — N

**T2 [dev] 반박 입장**
- 명시 반박: (1) PageviewTracker.tsx의 manual page_view 구조에서 매 라우트 변경마다 set 호출 누적 + dueDate 없을 때 noop 호출이 정직성에 반함. (2) GA4 user property는 sticky 모델이라 한 번 정확히 set + 변경 시 재set 하면 매 페이지뷰 set과 결과 동일. 매 페이지뷰 set은 측정 정합성이 아니라 코드 신뢰 문제.
- 잃는 것: 홈 단독 set 고수하면 "변경 시만 set" 옵션 일찍 거절 → 향후 측정 항목 늘 때 같은 패턴이 학습 신호로 박힘
- 인용: "임시로 개발자 추정값을 박지 않는다. 한 번 박힌 추정값은 영구가 된다" — docs/tech/persona.md §3.2; "정적 사이트라 표면이 좁다고 해이해지지 않음" — §6.4
- 주장: `current_pregnancy_week`·`due_date_set`는 (a) mount/hydrate 1회 + (b) dueDate 변경 시 + (c) 자정/주차 boundary 통과 시 set. 매 페이지뷰 set 거부.
- 잔재 자기검증: 이전 페어 없음 — N

**T3**
- 핵심 충돌: marketer는 매 페이지뷰 set이 측정 경로 단순성, dev는 상태 변할 때만 set이 코드 정직성. GA4 sticky 모델 신뢰 정도가 결정 갈림.
- 숨은 가정: GA4 단일 백엔드 가정. 멀티 백엔드(PostHog 등) 도입 시 sticky 보장 깨질 수 있음.

### 3.2 페어 dev × planner — onboarding 트리거 범위

**T0 페어 리셋**: 이전 페어 [dev × marketer]의 양보·합의는 이 페어에 영향 없음. dev §2.1/§3.1/§6.3, planner §3.3/§7.5/§7.6 인용 후보 재참조.

**T1 [planner] 단독 입장**
- 잃는 것: 홈 단독 트리거 → SEO 유입자(/articles/* 직진)는 onboarding 사각지대; cohort_join_week 측정 정합성 손실; 운영자 24주차 이후 SEO 트래픽 본격화 시 사각지대 굳음
- 인용: "유입(SEO) → 콘텐츠 → 체크리스트로 흘러야 한다. 체크리스트와 분리된 콘텐츠 페이지 양산 거부" — docs/content/persona.md §7.5; "측정 없는 기능 도입 거부" — §7.6
- 주장: onboarding 풀스크린은 전 진입 페이지에서 첫 방문 시 1회 트리거. 또는 "상단 슬림 배너 + 닫기 가능"으로 다운그레이드 절충 가능 (단 첫 방문 한정).
- 잔재 자기검증: 이전 페어 [dev × marketer] 영향 없음 — N — 이전 페어는 GA4 set 시점 결정으로 결정 축이 다름.

**T2 [dev] 반박 입장**
- 명시 반박: (1) 전 진입 페이지 트리거는 root layout 또는 모든 페이지에 useEffect + localStorage 분기 필요 → 상태 책임이 N개 컴포넌트에 분산, race condition 위험. (2) 슬림 배너 다운그레이드는 글로벌 알림 인프라(글로벌 store + 닫기 동기화)가 박혀 영구가 됨. (3) cohort_join_week 손실은 "0번째 세션 코호트 분류 불가"에 한정, 첫 dueDate 입력이 있는 다음 세션에 박힘 — 영구 손실 아님.
- 잃는 것: 홈 단독 고수 → SEO 유입자 onboarding 사각지대 일부 발생. AdSense 6월 후 본격 트래픽 시점 측정 사각지대 위험.
- 인용: "임시로 개발자 추정값을 박지 않는다. 한 번 박힌 추정값은 영구가 된다" — docs/tech/persona.md §3.2; "static export 모드. API Routes·서버 액션·동적 라우트 사용 금지" — §2.1
- 주장: onboarding 풀스크린은 홈 단독 트리거 유지. SEO 직진자에게는 글 끝 CTA(콘텐츠 ↔ 도구 연결 의무, planner persona §4.4)로 처리. 다운그레이드 배너는 디자이너 페어와 같은 축의 글로벌 버전이라 이 페어에서는 풀스크린 트리거 범위로 결정 축 좁힘.
- 잔재 자기검증: 이전 페어 [dev × marketer] 영향 없음 — N — 두 페어 모두 dev §3.2를 인용했지만 이번은 글로벌 onboarding 인프라 회피 주장으로 다른 결정 축에서 도출.

**T3**
- 핵심 충돌: planner는 SEO 유입자를 onboarding 사각지대에 두면 본질 도구 흐름·측정 정합성이 깨진다고 봄. dev는 글로벌 onboarding 인프라가 한 번 박히면 영구가 되며 측정 손실은 0번째 세션 코호트 분류 불가에 한정된다고 봄.
- 숨은 가정: "정보 탭 첫 유입자가 그 세션에 dueDate 입력 의향이 있는가"에 대해 planner는 일부 입력한다고, dev는 글 읽으러 온 사용자는 입력 안 한다고 봄. 데이터로 검증 가능하지만 현재 측정 자체가 없음.

### 3.3 페어 designer × marketer — 홈 상단 카드 노출 강도

**T0 페어 리셋**: 이전 페어 [dev × planner]의 양보·합의는 이 페어에 영향 없음. designer N4/N8/§3.5, marketer §1.4/§1.5/§3.4 인용 후보 재참조.

**T1 [designer] 단독 입장**
- 잃는 것: 강조(pink/40 + 큰 타이포 + 풀너비 CTA) → 홈의 다른 카드(이번 주 할 일·베이비페어·미니카드 4종) 시각 위계가 가라앉음, 다른 기능 진입 죽임. 강조가 과하면 다크 패턴(N4) 경계.
- 인용: "한 화면에 결정 1개. 인지 부하 최소화" — docs/design/persona.md §3.5; "진입 후 핵심 가치 도달까지 3 탭 / 5초" — N8
- 주장: 상단 카드 = 기존 [DueDateInput.tsx] in-place 강화 (새 컴포넌트 추가 X). 카드 자체는 lavender(secondary) + 입력 액션 버튼만 pink. [DueDateBanner.tsx]는 통합/삭제. 입력 후엔 peach data role 정보 카드로 변신.
- 잔재 자기검증: 이전 페어 [dev × planner] 영향 없음 — N — 이전 페어는 onboarding 트리거 범위 결정.

**T2 [marketer] 반박 입장**
- 명시 반박: (1) "lavender + 입력 액션 버튼만 pink"는 현재 DueDateInput.tsx 시각 강도와 거의 동일. 시각 강도 약해서 운영자조차 입력 카드 존재를 잊은 것이 [phase-4.5.md §3.1 P3](../../plan/phase-4.5.md) "사이트 어디에도 입력할 곳이 없음" 인식의 원인. (2) "한 화면에 결정 1개"의 그 결정이 dueDate 입력이어야 funnel이 산다 — 미니카드 4종 가라앉음은 trade-off가 아니라 올바른 위계. (3) DueDateBanner·DueDateInput 통합은 합의 가능.
- 잃는 것: lavender로 양보 → due_date_set funnel 전환 큰 변화 없음, AdSense 6월 신청 직전 측정 데이터 가치 손실.
- 인용: "due_date_set은 핵심 등록 funnel" — docs/marketing/persona.md / phase-4.5.md §1.4; "기능만 먼저, 측정은 나중에" 거부 — §6 (역방향: baseline funnel 약하면 측정 의미 손실)
- 주장: 상단 카드 = DueDateInput + DueDateBanner 통합 + pink CTA 강도 유지 + 가치 제안 카피 + 풀너비 pink CTA 버튼. "닫기"는 없음 X — 카드 위치 조정으로 페이지를 잠그지 않게. 입력 후 peach data role 변신은 동의.
- 잔재 자기검증: 이전 페어 [dev × planner] 영향 없음 — N — measurement 정합성 인용은 §1.4 funnel 룰에서 직접 도출.

**T3**
- 핵심 충돌: designer는 lavender + 액션 버튼만 pink로 다운그레이드해야 시각 위계와 N8 정합. marketer는 pink 풀너비 CTA 강도 유지해야 due_date_set funnel이 살고 미니카드 가라앉음은 올바른 위계.
- 숨은 가정: 양쪽 다 현재 DueDateInput + DueDateBanner의 노출량 → 입력 전환 데이터를 모름. onboarding 도입 후 1~2주 측정 없이는 검증 불가.

## 4. 미해결 트레이드오프

> 페어 3개의 핵심 충돌(T3)을 사용자 결정 옵션으로 환원. Claude는 이 옵션 셋만 제시하고, "결정" 영역은 비워둠.

### 항목 1: GA4 user property set 시점 (페어 dev × marketer) ✅ 결정: A'

- **옵션 A — 매 페이지뷰 set (marketer 안)**: `current_pregnancy_week`·`due_date_set` 매 page_view 직전 set, `cohort_join_week` 첫 dueDate 입력 시 1회 set
  - 즉시 비용: PageviewTracker에 set 호출 매번 추가, dueDate 없을 때도 호출 분기 필요
  - 나중 비용: 향후 measurement 항목 늘어날 때 같은 패턴(매 페이지뷰 set) 학습 신호로 굳음. 멀티 백엔드 도입 시 안전 여백 큼
- **옵션 B — 변경 시만 set (dev 안)**: mount/hydrate 1회 + dueDate 변경 시 + 자정/주차 boundary 통과 시 set
  - 즉시 비용: 자정/boundary 검출 로직(useEffect + setInterval 또는 계산식) 추가, 코드 한 군데 관리
  - 나중 비용: GA4 sticky 모델 신뢰가 깨질 가정 변화(멀티 백엔드)에서 재설계 필요
- **옵션 C — 절충(세션 시작 + dueDate 변경 시만 set)**: GA4 sticky 모델에 의존하되 boundary 검출 로직은 생략, 세션 시작 + dueDate 변경 두 곳에서만 set
  - 즉시 비용: 옵션 B보다 단순. 세션 중 자정 넘어 주차 바뀌면 그 세션은 옛 주차로 보고됨
  - 나중 비용: "단주 노이즈" 정도라 이동평균에 흡수됨 (marketer §5.5 — "단주 노이즈 vs 추세 구분 필수")
- **옵션 A' — zustand 캐시 + PageviewTracker refresh (사용자 제안, 채택)**: store에 `currentPregnancyWeek` + `lastCalcDate` 캐시. PageviewTracker가 매 page_view 직전 `refreshWeekIfNeeded()` 호출 — `lastCalcDate !== today`면 재계산. user property는 매 page_view에 store read로 set
  - 즉시 비용: store 필드 2개 추가, refresh 액션 1개 추가. PageviewTracker에 read+refresh+set 한 줄 추가
  - 나중 비용: calc 호출은 dueDate 변경 + 자정 통과 시만 (하루 1회 수준). marketer 매 페이지뷰 set 효과 동일. dev §3.2 정직성 룰 충족
- **결정:** **A' 채택**. 이유: 옵션 A의 클라이언트 코드 비용을 제거하면서 marketer §5.2 매 방문 갱신 룰 만족. PageviewTracker가 read+refresh+set 한 곳에서 묶어 처리, calcPregnancyWeek 실제 호출은 dueDate 변경 + 자정 boundary 통과 시 1회.

### 항목 2: onboarding 풀스크린 트리거 범위 (페어 dev × planner) ✅ 결정: C

- **옵션 A — 홈 단독 트리거 (dev 안)**: 현행 [HomeContent.tsx:50-53](../../../src/components/home/HomeContent.tsx#L50-L53) 그대로. 정보 탭·체크리스트 직진자는 onboarding 안 봄
  - 즉시 비용: 코드 변경 0 (현 구조 유지). cohort_join_week 0번째 세션 미설정자 일부 발생
  - 나중 비용: SEO 유입 본격화 시 사각지대 굳음. 도구 인지 보조는 글 끝 CTA로 위임
- **옵션 B — 전 진입 페이지 풀스크린 트리거 (planner 안)**: root layout 또는 모든 페이지에 OnboardingFlow 마운트 분기
  - 즉시 비용: layout/page client wrapper에 useEffect + localStorage 체크 분기 N곳, 상태 책임 분산
  - 나중 비용: 글로벌 onboarding 상태 인프라가 박혀 영구. 향후 onboarding 변형 도입 시마다 N곳 동기화
- **옵션 C — 전 진입 페이지 슬림 배너 + 홈만 풀스크린 (절충)**: 정보 탭·체크리스트엔 닫기 가능 슬림 배너로 도구 존재 알림. 홈에선 풀스크린 onboarding 유지
  - 즉시 비용: 글로벌 슬림 배너 컴포넌트 1개 + 닫기 상태 store. 시각 점유 작아 N8 정합 가능
  - 나중 비용: 슬림 배너 인프라 영구화. 단 풀스크린 인프라보다는 가볍고 다른 알림(예: 베이비페어 알림)에 재활용 가능
- **결정:** **C 채택**. 이유: planner §7.5 SEO 유입자 → 본질 도구 흐름 보존 + designer N8 시간 도둑질 거부 균형. 풀스크린 인프라가 글로벌로 박히는 dev 우려를 슬림 배너로 다운그레이드해 회피.

### 항목 3: 홈 상단 카드 노출 강도 (페어 designer × marketer) ✅ 결정: A

- **옵션 A — Lavender 카드 + 액션 버튼만 pink (designer 안)**: 카드 본체 lavender, 입력 CTA 버튼만 pink
  - 즉시 비용: 시각 위계 부드러움, 다른 카드와 공존 자연. funnel 전환 baseline에서 큰 변화 적을 가능성
  - 나중 비용: due_date_set 전환율 측정에서 강도 변경 효과 못 봄 → "강도 더 올려야 하나" 의사결정 데이터 부재 지속
- **옵션 B — Pink 풀너비 CTA 카드 (marketer 안)**: 카드 자체를 pink/40 + 큰 타이포 + 풀너비 CTA 버튼
  - 즉시 비용: 다른 카드 시각 위계 가라앉음, 인지 부하 트레이드오프
  - 나중 비용: funnel 전환 데이터 1~2주 누적 후 designer 우려 검증 가능. 미입력자 둘러보기 결정 위에서 카드를 닫지 못하면 다크 패턴 경계
- **옵션 C — A/B 단계 도입(처음 A, 1~2주 측정 후 B로 ramp)**: marketer §5.4 "단일 변경 → 1주 데이터 → 다음 변경" 리듬 적용
  - 즉시 비용: 디자인·코드 두 번 작업 (A 버전 → B 버전)
  - 나중 비용: 어느 강도가 옳은지 데이터 기반 결정. 운영자 1인 부담 (§3.7 운영자 번아웃 룰 위반 가능성 — 자동화 안 되면 매번 수동 ramp)
- **결정:** **A 채택**. 이유: designer §3.5 "한 화면에 결정 1개" + N8 시간 도둑질 거부와 정합. 입력 후 peach data role 변신은 marketer·designer 합의 영역. due_date_set funnel 측정은 onboarding 풀스크린(C 결정)이 별도 강한 진입 경로를 제공하므로 홈 카드의 강도가 baseline funnel을 결정짓지 않음.

### 항목 4: GA4 매 페이지뷰 set 시 데이터 과도 우려 (사용자가 직접 던진 질문)

> 사용자 질문: "매 페이지 뷰 마다 보낼 경우 데이터를 과도하게 보내는 것은 아닌가?"

이 질문은 항목 1과 같은 결정 축이지만, 사용자가 "데이터 과도"라는 표현으로 우려를 명시했으므로 별도로 답을 묶어둠:

- **사실 정정**: GA4 user property set 자체는 이벤트 1건이 별도 요청으로 가는 게 아니라 다음 이벤트(보통 page_view)의 페이로드에 합쳐 보내짐. "요청 수가 늘어 비용·노이즈"는 GA4의 경우 제한적.
- **단, 진짜 비용은 두 가지**:
  1. GA4 free tier 이벤트 한도(1천만 events/property/month). 매 page_view에 user property piggyback은 별도 이벤트 카운트 X. 우려 낮음.
  2. user property set 호출 자체는 클라이언트 JS 비용. PageviewTracker가 매 라우트 변경마다 도는 구조라 매번 calcPregnancyWeek + set 호출이 추가 — 이건 코드 정직성 우려(dev §3.2)에 해당.
- **결론**: "데이터 과도"의 GA4 측 비용은 작지만, 클라이언트 코드 호출 빈도·정직성 측면 비용은 실재. 결정은 항목 1에 위임.



## 5. 결정

> 페이즈 4 휴먼 게이트에서 사용자가 2026-05-05 결정 완료.

### 사용자 사전 결정 (P3·P4 plan에서 확정된 항목)

- ✅ **입력 방식**: 예정일 직접 입력
- ✅ **미입력자 사용**: 입력 없이도 둘러보기 가능
- ✅ **입력 단위**: 예정일(자동 계산)
- ✅ **갱신 주기**: 자동 매주

### 휴먼 게이트 결정 (페어 충돌에서 도출)

- [x] **항목 1**: A' — zustand 캐시 + PageviewTracker refresh. store에 `currentPregnancyWeek` + `lastCalcDate` 캐시, 매 page_view 직전 `refreshWeekIfNeeded()` 호출 후 user property set. calcPregnancyWeek 실호출은 dueDate 변경 + 자정 boundary 통과 시 1회.
- [x] **항목 2**: C — 전 진입 페이지 슬림 배너 + 홈 풀스크린. 홈은 [HomeContent.tsx:50-53](../../../src/components/home/HomeContent.tsx#L50-L53) 그대로 풀스크린 onboarding. 정보 탭·체크리스트·기타 진입 페이지는 닫기 가능 슬림 배너(글로벌 컴포넌트)로 도구 존재 알림.
- [x] **항목 3**: A — Lavender 카드 + 액션 버튼만 pink. 기존 [DueDateInput.tsx](../../../src/components/home/DueDateInput.tsx) in-place 강화. [DueDateBanner.tsx](../../../src/components/home/DueDateBanner.tsx)는 통합/삭제. 입력 후 peach data role 정보 카드(현재 주차 + D-day)로 변신.

## 6. 우선순위 영향

이 결정이 unblock 하는 작업:
- §1.8 묶음 G — user properties 3종 + `pregnancy_week_set` 이벤트
- §1.5 `pregnancy_week_set` 이벤트 정의
- §2.6 UX 기회 #2 — D-day 컨텍스트 라벨
- §3.1 P2 — `isHighlighted` 부활 결정 시 매칭 기준
- ChecklistHub.tsx:128 — 하드코딩된 "37주차" 핀 제거
