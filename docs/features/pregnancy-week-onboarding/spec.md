# pregnancy-week-onboarding 기획서

> 작성일: 2026-05-05  size: L
> 관련 리뷰: [review.md](./review.md)
> 출처: [docs/plan/phase-4.5.md §3.1 P3·P4](../../plan/phase-4.5.md)

## review.md 결정사항 참조

- **사전 결정**: 입력 방식=예정일 직접 입력 / 미입력자=둘러보기 가능 / 입력 단위=예정일 자동 계산 / 갱신 주기=자동 매주
- **항목 1 (A')**: zustand store에 `currentPregnancyWeek` + `lastCalcDate` 캐시. PageviewTracker가 매 page_view 직전 `refreshWeekIfNeeded()` 호출 후 user property set. calcPregnancyWeek 실호출은 dueDate 변경 + 자정 boundary 통과 시 1회.
- **항목 2 (C)**: 홈은 풀스크린 onboarding 유지. 정보 탭·체크리스트·기타 진입 페이지는 닫기 가능 슬림 배너.
- **항목 3 (A)**: 홈 상단 카드는 lavender(secondary) + 액션 버튼만 pink. DueDateInput in-place 강화, DueDateBanner 통합/삭제. 입력 후 peach data role 정보 카드 변신.

## 1. 배경·목적

- **운영자 관점**: §1.4 user properties·§2.6 D-day 컨텍스트·§3 P2 isHighlighted 세 작업이 "사용자 현재 주차 입력값"에 묶여 있어 진행 불가. P3·P4 결정으로 세 곳 동시 unblock.
- **사용자 관점**: 본인 주차에 맞춰 체크리스트·아티클·D-day 컨텍스트가 정렬되어 "지금 챙길 것"이 즉시 보임. 미입력자도 둘러보기 가능.
- **측정 관점**: 코호트 리텐션(`cohort_join_week`)과 핵심 등록 funnel(`due_date_set`/`pregnancy_week_set`)의 baseline 데이터 누적 시작.

## 2. 사용자 시나리오

- **시나리오 1 — 첫 방문자 홈 진입**: localStorage(`onboarding-completed`) 없음 + `/` 진입 → OnboardingFlow 풀스크린 노출 → Step 2에서 예정일 입력 또는 "나중에 입력할게요" → Step 3 → 홈 진입 → 입력 시 `cohort_join_week` 1회 set, `due_date_set=true`, `current_pregnancy_week=N` 매 page_view에 set
- **시나리오 2 — 첫 방문자 SEO 직진(/articles/[slug])**: localStorage(`onboarding-completed`) 없음 + 정보 탭 직진 → 글 본문 상단에 닫기 가능 슬림 배너 노출 ("예정일 입력하면 N주차에 맞는 체크리스트로 안내해드려요") → 클릭 시 `/`로 이동해 OnboardingFlow 진입 → 닫기 시 localStorage(`onboarding-banner-dismissed`) 기록, 다음 진입 시 미노출
- **시나리오 3 — 미입력 상태 둘러보기**: dueDate=null, onboarding-completed=true → 홈 상단 lavender 카드 ("예정일을 입력하면 주차별 체크리스트로 정렬됩니다" + 입력 필드 + pink CTA "예정일 입력") 노출 + 다른 카드들 정상 노출. 체크리스트·아티클은 모두 접근 가능, 단 ChecklistHub 핀(`ChecklistHub.tsx:128`)은 "예정일 입력 시 추천" 안내로 대체
- **시나리오 4 — 입력 후 재방문**: dueDate 존재 → 홈 상단 카드는 peach data role 정보 카드(현재 N주차 + D-day) → PageviewTracker가 매 page_view 직전 `refreshWeekIfNeeded()` 호출 → 자정 통과 시 자동 재계산, GA4 user property 자동 갱신
- **시나리오 5 — 예정일 수정**: 홈 카드의 정보 카드 → "수정" 버튼 → 입력 카드로 다시 전환 → 새 dueDate 저장 시 `current_pregnancy_week` 즉시 재계산, **`cohort_join_week`는 변경 안 함**(marketer §5.2 — 의도적 고정)

## 3. 기능 요구사항

### must

- **데이터 모델**: `useDueDateStore`에 `currentPregnancyWeek: number | null`, `lastCalcDate: string | null`(YYYY-MM-DD), `cohortJoinWeek: number | null` 필드 추가. zustand `persist`의 `migrate` 함수로 기존 `due-date-storage` 사용자 무손실 마이그레이션
- **액션 신규**: `setDueDate(date)` 호출 시 내부에서 `calcPregnancyWeek` 실행해 `currentPregnancyWeek` + `lastCalcDate` 즉시 갱신. `cohortJoinWeek`는 기존 값 null일 때만 set(첫 입력 1회). `refreshWeekIfNeeded()` 추가 — `lastCalcDate !== todayKST`이면 재계산
- **PageviewTracker 확장**: 매 page_view 직전 `useDueDateStore.getState().refreshWeekIfNeeded()` 호출 → store에서 `currentPregnancyWeek`, `cohortJoinWeek`, `dueDate !== null` 읽어 GA4 user property로 set → 그다음 `gtag("event", "page_view", ...)` 발사
- **온보딩 풀스크린**: 홈([HomeContent.tsx:50-53](../../../src/components/home/HomeContent.tsx#L50-L53))의 기존 트리거 유지. 변경 없음 (이미 동작)
- **글로벌 슬림 배너**: 홈 외 진입 페이지(/articles/*, /info, /timeline, /weight, /checklist/*)에 `localStorage('onboarding-completed') === null && localStorage('onboarding-banner-dismissed') === null` 조건에서 노출. 클릭 시 `/`로 이동. 닫기 X 클릭 시 `onboarding-banner-dismissed=true` 저장
- **홈 상단 카드 (DueDateInput 재설계)**:
  - dueDate=null: lavender(`bg-pastel-lavender/40`) 카드. 가치 제안 카피 + date input + pink CTA 버튼("예정일 저장")
  - dueDate 존재: peach(`bg-pastel-peach/40`) 정보 카드. "현재 N주차 / 출산 예정일까지 D-N일" + "수정" 버튼
  - DueDateBanner 컴포넌트는 통합/삭제 (시나리오 2 슬림 배너로 대체)
- **GA4 이벤트**: `due_date_set` 기존 유지(파라미터 정리), `pregnancy_week_set` 신규 (파라미터 `week`, `source: 'onboarding' | 'manual_update'`) — conversion 마킹
- **GA4 user properties**: `due_date_set`(boolean), `current_pregnancy_week`(number), `cohort_join_week`(number) 3종

### should

- 자정 boundary 검출은 `lastCalcDate` 문자열 비교 — `format(new Date(), 'yyyy-MM-dd', { timeZone: 'Asia/Seoul' })`. KST 고정
- ChecklistHub 하드코딩된 핀("37주차" — `ChecklistHub.tsx:128`)을 store의 `currentPregnancyWeek`로 치환
- 슬림 배너 닫기 시 `onboarding_banner_dismiss` 이벤트 발사 (어느 페이지에서 닫았는지 분석)

### won't (이번 범위 밖)

- P2 isHighlighted 부활 — 별도 결정 항목 (P3·P4 unblock 후 진행)
- §2.6 #2 D-day 컨텍스트 라벨 디자인 디테일 — 별도 디자인 작업
- 멀티 백엔드(PostHog/Mixpanel) 측정 통합 — review.md 숨은 가정 영역
- 풀스크린 onboarding의 카피·디자인 변경 — 이미 [phase-2.5.md Step 1](../../plan/phase-2.5.md)에 명세됨

## 4. 예외·엣지 케이스

- **localStorage 손실**: 시크릿 모드/캐시 삭제 시 dueDate=null로 되돌아감. PageviewTracker는 `currentPregnancyWeek=null` user property를 set하지 않음(undefined 전송 X — GA4 보고서에서 "값 없음" 세그먼트로 자연 분류)
- **잘못된 dueDate 입력**: 과거 날짜 또는 40주 이상 미래 날짜 → `calcPregnancyWeek` 결과 `< 0` 또는 `> 42` → setDueDate에서 reject + 에러 토스트("출산 예정일을 다시 확인해주세요"). 잘못된 값 store에 저장 X
- **자정 직후 page_view**: `lastCalcDate=어제`, todayKST=오늘 → `refreshWeekIfNeeded()` 실행 → `currentPregnancyWeek` 갱신 후 user property set. 그 page_view부터 새 주차로 보고
- **마이그레이션 실패**: 기존 `due-date-storage`에 dueDate만 있는 사용자 → migrate 함수에서 `currentPregnancyWeek`/`cohortJoinWeek` 즉시 계산해 채움. dueDate 없는 사용자는 모든 신규 필드 null로 초기화
- **빈 상태(empty state)**: dueDate=null + onboarding-completed=true 사용자가 홈 외 페이지 진입 시 슬림 배너 노출 + 페이지 정상 동작. 빈 상태 자체에 대한 별도 처리는 P9에서 다룸
- **dueDate 입력 도중 onboarding 닫기**: OnboardingFlow Step 2에서 "나중에 입력할게요" → onboarding-completed=true, dueDate=null. 이 사용자는 홈 카드는 보지만 슬림 배너는 안 봄 (이미 onboarding 완료자)

## 5. 성공 기준

- **기능 동작**:
  - 첫 방문자 홈 진입 시 OnboardingFlow 풀스크린 노출 (변화 없음, 회귀 0)
  - 정보 탭/체크리스트 첫 직진자에게 슬림 배너 노출 (신규)
  - dueDate 입력 시 store의 `currentPregnancyWeek` + `cohortJoinWeek` + `lastCalcDate` 동시 set
  - 매 page_view 시 GA4 DebugView에 `current_pregnancy_week`, `due_date_set`, `cohort_join_week` user property가 정확히 set됨
  - 자정 KST 통과 후 첫 page_view에서 주차가 자동 +1
- **측정 지표**: [ga4.md](./ga4.md) §2 이벤트·§3 user properties와 일치
- **사용자 경험**: [design.md](./design.md) §3 상태별 시안과 일치
