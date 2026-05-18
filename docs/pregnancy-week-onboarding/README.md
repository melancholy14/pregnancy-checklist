# pregnancy-week-onboarding

> 작성일: 2026-05-06 | 작성자: Claude Code

## 개요

Phase 4.5 P3·P4의 unblock 산출물. 사용자의 출산 예정일을 명시적으로 입력받아 `current_pregnancy_week`를 자동 산출하고, 이 값을 GA4 user property + `pregnancy_week_set` conversion 이벤트의 단일 소스로 사용한다. 홈은 풀스크린 OnboardingFlow를 유지하되, /articles·/checklist·/timeline·/weight·/info에는 닫기 가능한 글로벌 슬림 배너로 SEO 직진자에게 도구 존재를 알린다. ChecklistHub의 하드코딩 "37주차" 핀, §1.4 measurement, §2.6 D-day 컨텍스트, P2 isHighlighted까지 함께 unblock 된다.

관련 산출물: [spec](../features/pregnancy-week-onboarding/spec.md) · [review](../features/pregnancy-week-onboarding/review.md) · [design](../features/pregnancy-week-onboarding/design.md) · [ga4](../features/pregnancy-week-onboarding/ga4.md)

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| useDueDateStore에 `currentPregnancyWeek` / `lastCalcDate` / `cohortJoinWeek` 캐시 | ✅ | persist v0→v1 migrate로 무손실 마이그레이션 |
| `setDueDate(date)` 검증 + boolean 반환 + 즉시 calc | ✅ | 호출부에서 토스트/이벤트 분기 |
| `cohortJoinWeek`는 첫 입력 1회 set, 이후 dueDate 수정 시 변경 X | ✅ | `prevCohort ?? week` |
| `refreshWeekIfNeeded()` — `lastCalcDate !== todayKST`일 때만 재계산 | ✅ | KST 고정 |
| PageviewTracker가 매 page_view 직전 refresh + user_properties set | ✅ | 단일 호출 위치 |
| GA4 user properties 3종(`due_date_set` / `current_pregnancy_week` / `cohort_join_week`) | ✅ | null이면 undefined로 set 생략 |
| 홈 풀스크린 onboarding 변경 없음 | ✅ | HomeContent 트리거 그대로 |
| 글로벌 슬림 배너 (홈 외 진입 페이지) | ✅ | layout.tsx에 단일 마운트 |
| 슬림 배너 view/click/dismiss GA 이벤트 3종 | ✅ | source_page enum 매핑 |
| DueDateInput lavender 입력 / peach 정보 모드 분기 | ✅ | editMode state |
| 잘못된 dueDate 입력 시 sonner `toast.error` | ✅ | "오늘 이후 ~ 40주 이내" |
| `pregnancy_week_set` 이벤트 (source: onboarding/manual_update) | ✅ | DueDateInput · DueDateStep |
| DueDateBanner 통합/삭제 + timeline import 정리 | ✅ | 파일 삭제 |
| ChecklistHub.tsx:128 "37주차" 핀 제거 | ✅ | store 값으로 치환 |

### 생성/수정 파일

**신규**
- `src/lib/date-kst.ts` — `getTodayKST()` + `parseDateKST()` (KST 자정 파싱)
- `src/components/providers/OnboardingBannerProvider.tsx` — 글로벌 슬림 배너 (5개 섹션 노출), `useSyncExternalStore` 기반 localStorage 구독
- `docs/implementation/pregnancy-week-onboarding-impl.md` · `docs/review/pregnancy-week-onboarding-review.md` · `docs/refactor/pregnancy-week-onboarding-refactor.md`
- `e2e/pregnancy-week-onboarding.spec.ts`

**수정**
- `src/store/useDueDateStore.ts` — 3개 필드 + 액션 + `isValidDueDate` + persist v1 migrate
- `src/lib/analytics.ts` — `setUserProperties` 헬퍼, `sendGAEvent` null 허용
- `src/lib/week-calculator.ts` — `clamp` 옵션 추가
- `src/components/analytics/PageviewTracker.tsx` — refresh + user_properties set
- `src/components/home/DueDateInput.tsx` — lavender / peach 모드 분기 + 토스트
- `src/components/onboarding/DueDateStep.tsx` — `pregnancy_week_set` 발사 + 검증
- `src/app/layout.tsx` — `OnboardingBannerProvider` 마운트
- `src/app/timeline/page.tsx` — `DueDateBanner` 제거
- `src/components/checklist/ChecklistHub.tsx` — 하드코딩 핀 제거 → store 구독
- `src/components/home/HomeContent.tsx` — 빈 상태 노란 카드 제거, store 캐시 직접 구독

**삭제**
- `src/components/home/DueDateBanner.tsx` → 글로벌 슬림 배너로 통합

### 주요 결정 사항

- **`calcPregnancyWeek` clamp 옵션**: 기존 [1, 40] 클램프 동작은 기본값으로 유지하고 `{ clamp: false }`로 raw 값 노출. store가 별도 헬퍼를 두지 않고 동일 함수 재사용 → SoT 확보.
- **`setDueDate` boolean 반환**: 검증 실패 시 false 반환, 호출부가 토스트·이벤트 분기. 두 호출부(DueDateStep, DueDateInput) 모두 새 시그니처 적용.
- **OnboardingBannerProvider는 직접 localStorage useState 패턴 → `useSyncExternalStore`로 진화**: 초기 구현은 useState로 작성했으나 React 19 `set-state-in-effect` 경고로 외부 스토어 패턴으로 전환. 모듈 스코프 `cachedSnapshot` + `listeners` Set으로 같은 탭 storage 변경도 전파.
- **localStorage 재확인을 `[pathname]` deps에 묶음**: layout이 한 번 마운트된 채 라우팅만 바뀌므로, OnboardingFlow 완료 후 `/timeline` 진입 시점에 `notifyListeners()`를 호출해 stale state 해소.
- **OnboardingBannerProvider 구조**: design.md §5.2 정합. X 버튼은 Link의 형제 요소(absolute 포지션)로 분리 — 인터랙티브 중첩 회피.

### 가정 사항 및 미구현 항목

**가정**
- GA4 user property는 sticky 모델(다음 이벤트 컨텍스트 자동 첨부) — review.md 항목 1 결정 A'의 전제. 멀티 백엔드 도입 시 재검토 필요.
- KST 자정 boundary 비교는 `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })` + `parseDateKST`로 통일.
- v1 migrate: 기존 dueDate 1개 필드만 저장된 사용자에 대해 calc해 currentPregnancyWeek/cohortJoinWeek 즉시 채움.

**won't 영역 (이번 범위 밖)**
- P2 isHighlighted 부활 — spec.md won't (별도 결정 항목)
- §2.6 #2 D-day 컨텍스트 라벨 디자인 디테일 — 별도 디자인 작업
- 멀티 백엔드(PostHog/Mixpanel) 측정 통합
- 풀스크린 onboarding 카피·디자인 변경 — phase-2.5 영역
- 입력 ↔ 정보 모드 카드 배경 크로스페이드(300ms) — design.md §4 인터랙션 디테일. 현재 즉시 전환

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

없음. 4가지 관점(타입 안전성·성능·보안·접근성) 모두 런타임 크래시·실제 사용자 피해를 일으킬 수준의 결함은 발견되지 않음.

### Warning (수정 권장 → 리팩토링에서 해소)

| # | 위치 | 문제 |
|---|------|------|
| 1 | `HomeContent.tsx:103` | `currentWeek`을 store 캐시 대신 매 렌더 재계산 (SoT 위반) |
| 2 | 다파일(`useDueDateStore` / `DueDateInput` / `HomeContent`) | UTC 자정 vs 로컬 now 혼용 → KST boundary에서 D-day ±1일 흔들림 |
| 3 | `OnboardingBannerProvider.tsx:113-114` | X 버튼 분리 후 잔존 `preventDefault`/`stopPropagation` |

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 (모두 리팩토링에서 해소) |
| Suggestion | 5건 (2건은 리팩토링에서 해소, 3건은 미해소) |

---

## 리팩토링 내용

### 작업 목록

| # | 출처 | 무엇을 | 왜 |
|---|------|--------|-----|
| 1 | 추가 | `calcPregnancyWeek`에 `clamp` 옵션 추가 | store의 `computeRawWeek`와 중복 제거 위한 사전 작업 |
| 2 | Warning #2 | `parseDateKST` 헬퍼 신규 + 다파일 KST 통일 | UTC vs 로컬 9시간 오프셋 제거, KST boundary 일관성 |
| 3 | 추가 | store의 `computeRawWeek` 제거, calcPregnancyWeek 재사용 | SoT 확보, 280일 공식 1곳에서 관리 |
| 4 | Warning #1 | `HomeContent.currentWeek`을 store 캐시 직접 구독 | PageviewTracker의 `refreshWeekIfNeeded` 결과가 즉시 반영, 매 렌더 재계산 제거 |
| 5 | Warning #3 | `OnboardingBannerProvider.handleDismiss`에서 `preventDefault`/`stopPropagation` 제거 | 인터랙티브 중첩 사라진 후 무의미한 호출 |
| 6 | 추가 | `PageviewTracker.isFirst` ref 제거 | 양분기 동일 호출 → 사실상 dead code |

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 주차 계산 함수 | `calcPregnancyWeek` + `computeRawWeek` (2곳, 중복) | `calcPregnancyWeek({ clamp })` 1곳 |
| 날짜 파싱 timezone | UTC 자정 vs 로컬 now 혼용 | KST 자정 기준 통일 (`parseDateKST` + `getTodayKST`) |
| 홈의 currentWeek | HomeContent 로컬 재계산 | store `currentPregnancyWeek` 직접 구독 |
| OnboardingBanner dismiss | `preventDefault` + `stopPropagation` 잔재 | 의도와 일치 (인자 없는 핸들러) |
| PageviewTracker | `isFirst` ref + 양분기 동일 호출 | 단일 useEffect 한 줄 |

빌드 결과: 성공 (1회 시도)

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 4개 passed |
| Error/Validation | ✅ 3개 passed |
| 권한/인증 (localStorage 기반) | ✅ 4개 passed |
| 반응형 (Mobile 375px) | ✅ 2개 passed |
| **전체** | **13 passed / 0 failed** |

📊 상세 리포트: [playwright-report/index.html](../../playwright-report/index.html)

테스트 파일: [e2e/pregnancy-week-onboarding.spec.ts](../../e2e/pregnancy-week-onboarding.spec.ts)

부수 발견 (테스트 작성 중 해결):
- 구현 버그: `DueDateInput`의 `value = editMode ? draftDate : ""` 로직이 입력 모드에서 controlled input을 빈 값으로 강제 → fill 후 handleSubmit 조기 반환. `draftDate` 직접 바인딩으로 수정.
- 디자인 일관성: `OnboardingBannerProvider`의 X 버튼이 Link 안에 중첩됨(design.md §5.2 위반). Link 형제 요소로 분리.
- E2E spy 패턴 발견: `ConsentGatedScripts`의 afterInteractive 인라인 스크립트가 `function gtag(){...}`로 globalThis 정의 → setter 우회. 테스트는 dataLayer push를 가로채는 방식으로 spy를 영구화.

---

## 파이프라인 산출물

| 단계 | 산출물 |
|------|--------|
| spec / design / ga4 / review | [docs/features/pregnancy-week-onboarding/](../features/pregnancy-week-onboarding/) |
| implement | [docs/implementation/pregnancy-week-onboarding-impl.md](../implementation/pregnancy-week-onboarding-impl.md) |
| code-review | [docs/review/pregnancy-week-onboarding-review.md](../review/pregnancy-week-onboarding-review.md) |
| refactor | [docs/refactor/pregnancy-week-onboarding-refactor.md](../refactor/pregnancy-week-onboarding-refactor.md) |
| e2e | [e2e/pregnancy-week-onboarding.spec.ts](../../e2e/pregnancy-week-onboarding.spec.ts) |
