# pregnancy-week-onboarding

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-05-06
> plan: [spec](../../features/pregnancy-week-onboarding/spec.md) · [design](../../features/pregnancy-week-onboarding/design.md) · [ga4](../../features/pregnancy-week-onboarding/ga4.md)

<!-- STEP:impl -->
## 구현

> 구현일: 2026-05-05
> 관련 스펙: [docs/features/pregnancy-week-onboarding/spec.md](../../features/pregnancy-week-onboarding/spec.md)
> 결정 근거: [docs/features/pregnancy-week-onboarding/review.md](../../features/pregnancy-week-onboarding/review.md)

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| useDueDateStore에 `currentPregnancyWeek` / `lastCalcDate` / `cohortJoinWeek` 캐시 추가 | ✅ | zustand `persist` v0→v1 migrate 함수로 기존 사용자 무손실 마이그레이션 |
| `setDueDate(date)` 내부에서 calcPregnancyWeek 즉시 실행 + 검증 reject | ✅ | boolean 반환으로 호출부에서 토스트 분기 |
| `cohortJoinWeek`는 첫 입력 1회 set, 이후 dueDate 수정 시 변경 X | ✅ | `prevCohort ?? week` 패턴 |
| `refreshWeekIfNeeded()` — `lastCalcDate !== todayKST`일 때만 재계산 | ✅ | KST 고정 (`getTodayKST` 헬퍼) |
| PageviewTracker가 매 page_view 직전 `refreshWeekIfNeeded()` + user_properties set | ✅ | 단일 호출 위치 (분산 X) |
| GA4 user properties 3종(`due_date_set`, `current_pregnancy_week`, `cohort_join_week`) set | ✅ | null이면 undefined로 set 생략 |
| 홈 풀스크린 onboarding 변경 없음 (회귀 0) | ✅ | HomeContent 트리거 로직 그대로 |
| 글로벌 슬림 배너 (홈 외 진입 페이지) | ✅ | `OnboardingBannerProvider`를 layout.tsx에 단일 마운트 |
| 슬림 배너 view/click/dismiss 이벤트 3종 | ✅ | `onboarding_banner_view`/`_click`/`_dismiss` |
| DueDateInput 재설계: lavender 입력 모드 / peach 정보 모드 | ✅ | 같은 컴포넌트에서 모드 분기, 모드 전환은 `editMode` state |
| 잘못된 dueDate 입력 시 sonner `toast.error` | ✅ | "오늘 이후 ~ 40주 이내 날짜를 입력해주세요" |
| `pregnancy_week_set` 이벤트 (source: onboarding/manual_update) | ✅ | DueDateInput·DueDateStep 두 곳에서 발사 |
| DueDateBanner 통합/삭제 + timeline 페이지 import 제거 | ✅ | 파일 삭제, timeline page wrapper도 정리 |
| ChecklistHub.tsx:128 하드코딩 "37주차" 핀 제거 | ✅ | store 값으로 치환, dueDate 미입력 시 "예정일 입력 시 추천" |

### 생성/수정 파일 목록

#### 신규 생성

- `src/lib/date-kst.ts` — KST 기준 `YYYY-MM-DD` 문자열 생성 헬퍼 (`Intl.DateTimeFormat` 사용)
- `src/components/providers/OnboardingBannerProvider.tsx` — 글로벌 슬림 배너. 홈 외 5개 섹션(`/articles`, `/checklist`, `/timeline`, `/weight`, `/info`)에서 onboarding 미완 + dismissed 미설정 사용자에게 노출. view/click/dismiss GA4 이벤트 3종 연결
- `이 문서` — 본 문서

#### 수정

- `src/store/useDueDateStore.ts` — `currentPregnancyWeek` / `lastCalcDate` / `cohortJoinWeek` 필드 추가, `setDueDate` 검증 + boolean 반환, `refreshWeekIfNeeded` 액션 신규, persist v1 migrate 추가, `isValidDueDate` export
- `src/lib/analytics.ts` — `setUserProperties` 헬퍼 추가, `sendGAEvent` 시그니처에 `null` 허용
- `src/components/analytics/PageviewTracker.tsx` — 매 page_view 직전 store refresh + GA4 user_properties set 호출
- `src/components/home/DueDateInput.tsx` — 입력 모드(lavender) / 정보 모드(peach) 분기. 정보 모드는 "현재 N주차 · D-N" + 수정 버튼. 잘못된 dueDate는 sonner `toast.error`로 거부. `pregnancy_week_set` 이벤트 발사 (source: onboarding/manual_update)
- `src/components/onboarding/DueDateStep.tsx` — 새 store API(`setDueDate` boolean 반환) 적용, 검증 실패 토스트, `pregnancy_week_set` 이벤트 발사 (source: onboarding)
- `src/app/layout.tsx` — `OnboardingBannerProvider` import + 본문 컨테이너 최상단에 마운트
- `src/app/timeline/page.tsx` — 더 이상 페이지 단위 배너 필요 없으므로 `DueDateBanner` import + 사용 제거 + Fragment 정리
- `src/components/checklist/ChecklistHub.tsx` — `useDueDateStore` 연결, 하드코딩 "37주차" 핀을 store의 `currentPregnancyWeek`로 치환 (미입력 시 "예정일 입력 시 추천" 안내)
- `src/components/home/HomeContent.tsx` — 빈 상태 노란 카드 제거 (DueDateInput 입력 모드가 같은 가치 제안 카피를 흡수해 중복)

#### 삭제

- `src/components/home/DueDateBanner.tsx` — 글로벌 슬림 배너로 통합

### 주요 결정 사항

- **calcPregnancyWeek 변경 없이 `isValidDueDate` 별도 export**: 기존 calcPregnancyWeek는 [1, 40] 클램프를 유지하고, 검증은 별도 함수로 분리. 클램프된 값을 보고 검증할 수 없기 때문에 store 내부에서 raw week를 다시 계산. 이유: calcPregnancyWeek 사용처(HomeContent 등)가 클램프된 값에 의존하는 상태라 시그니처 변경 시 부작용 위험.
- **`setDueDate` boolean 반환**: 호출부에서 토스트·이벤트 발사를 분기하기 위해 시그니처를 `(date: string) => boolean`으로 변경. 기존 호출부(DueDateStep, DueDateInput) 둘 다 새 시그니처에 맞춰 수정.
- **OnboardingBannerProvider는 직접 localStorage useState 패턴**: design.md §2.1 "별도 zustand store 생성 회피" 결정 반영. `useDueDateStore`와 라이프사이클이 다른 dismissed 플래그를 store에 박지 않음.
- **TimelineCard의 "예정일 입력 시 추천" 안내**: dueDate 미입력 사용자에게 핀 라벨이 비거나 깨지지 않도록, 시나리오 3 카피에 맞춰 안내 문구로 대체. spec.md §should 항목과 정합.
- **OnboardingBannerProvider는 layout.tsx의 메인 컨테이너 최상단에 마운트**: 모든 페이지에서 노출 + StickyHeader/BottomNav와 별개 위치. 홈(`/`)에서는 `sourcePage` 매칭 X로 자동 미노출.
- **localStorage 재확인을 `[pathname]` deps에 묶음**: layout이 한 번 마운트된 채 라우팅만 바뀌므로 `[]` deps였던 초기 구현은 온보딩 완료 후 `/timeline`에 진입해도 stale state로 배너가 노출됐다. pathname 변경 시 재확인하도록 의존성 추가. OnboardingFlow가 setItem 직후 router.push 하는 흐름과 정합.
- **사라지는 애니메이션 250ms 후 unmount**: dismiss 클릭 시 `leaving` flag로 페이드아웃 후 setTimeout으로 unmount. `motion-reduce:transition-none` 적용으로 prefers-reduced-motion 사용자 즉시 unmount.
- **HomeContent의 노란 빈 상태 카드 제거**: DueDateInput 입력 모드가 동일 가치 제안을 lavender 카드로 흡수했기 때문에 중복. 카드 2개가 같은 메시지를 던지는 것은 한 화면 결정 1개 룰 위반.

### 가정 사항

- GA4 user property는 sticky 모델(다음 이벤트의 컨텍스트로 자동 첨부) — review.md 항목 1 결정 A'의 전제. 멀티 백엔드(PostHog 등) 도입 시 이 가정 재검토 필요.
- `lastCalcDate`는 KST 기준 문자열 비교로 충분. `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })`이 `YYYY-MM-DD` 포맷을 안정적으로 반환.
- 기존 `due-date-storage` 사용자는 dueDate 1개 필드만 저장된 상태. v1 migrate 실행 시 dueDate 있으면 즉시 calc해 채우고, 없으면 모두 null.
- `cohortJoinWeek`는 dueDate가 한 번이라도 set된 적이 있는 사용자에게만 의미가 있음. clearDueDate 시에는 보존(cohort 정체성 유지) — 단 spec에는 명시 X. 안전한 default로 유지 결정.
- `prefers-reduced-motion`은 sonner와 OnboardingBannerProvider가 자체 처리. DueDateInput의 모드 전환 크로스페이드는 별도 transition 없이 React 리렌더로 처리(과한 애니메이션 회피).

### 미구현 항목 (won't 영역)

- P2 isHighlighted 부활 — spec.md won't (별도 결정 항목)
- §2.6 #2 D-day 컨텍스트 라벨 디자인 디테일 — 별도 디자인 작업
- 멀티 백엔드 측정 통합 — review.md 숨은 가정 영역
- 풀스크린 onboarding 카피·디자인 변경 — phase-2.5에 명세된 영역
- 입력 모드 ↔ 정보 모드 카드 배경 크로스페이드(300ms) — design.md §4 인터랙션 디테일. 현재는 즉시 전환. E2E 안정성과 prefers-reduced-motion 일관성 우선.
- 슬림 배너 등장 fade-in opacity 0→1(200ms) — 현재는 dismiss 페이드아웃만 구현. 등장은 즉시.

---

<!-- STEP:review -->
## 코드 리뷰

> 리뷰일: 2026-05-06
> 관련 스펙: [docs/features/pregnancy-week-onboarding/spec.md](../../features/pregnancy-week-onboarding/spec.md)
> 관련 구현: [docs/implementation/pregnancy-week-onboarding-impl.md](#구현)

### 리뷰 대상 파일

- `src/lib/date-kst.ts` (신규)
- `src/components/providers/OnboardingBannerProvider.tsx` (신규)
- `src/store/useDueDateStore.ts` (수정)
- `src/lib/analytics.ts` (수정)
- `src/components/analytics/PageviewTracker.tsx` (수정)
- `src/components/home/DueDateInput.tsx` (수정)
- `src/components/onboarding/DueDateStep.tsx` (수정)
- `src/app/layout.tsx` (수정)
- `src/app/timeline/page.tsx` (수정)
- `src/components/checklist/ChecklistHub.tsx` (수정)
- `src/components/home/HomeContent.tsx` (수정)

총 11개 파일

---

### Critical 이슈 (즉시 수정 완료)

없음. 4가지 관점(타입 안전성·성능·보안·접근성) 모두 런타임 크래시·실제 사용자 피해를 일으킬 수준의 결함은 발견되지 않음.

---

### Warning (수정 권장)

#### 1. HomeContent.tsx — `currentWeek`을 store 캐시 대신 매 렌더 재계산
- **위치**: [src/components/home/HomeContent.tsx:103-106](../../../src/components/home/HomeContent.tsx#L103-L106)
- **문제**: `useDueDateStore`가 이미 `currentPregnancyWeek` 필드를 캐시하고 있는데, HomeContent는 로컬에서 `calcPregnancyWeek(new Date(dueDate))`를 다시 호출. 동일 값이지만 두 곳에서 별도로 계산되어 일관성·진실의 단일 원천(SoT) 룰 위반. 자정 boundary 처리도 store는 `refreshWeekIfNeeded()`를 거치지만 로컬 계산은 매 렌더 생성되어 동작이 다를 수 있음.
- **권장 수정**: `useDueDateStore`의 `currentPregnancyWeek`를 직접 구독해 사용. 로컬 `calcPregnancyWeek` 호출 제거.

#### 2. Date 파싱 — UTC 자정 vs 로컬 now 혼용
- **위치**: [src/store/useDueDateStore.ts:18-23](../../../src/store/useDueDateStore.ts#L18-L23), [src/components/home/DueDateInput.tsx:24-28](../../../src/components/home/DueDateInput.tsx#L24-L28), [src/components/home/HomeContent.tsx:137-143](../../../src/components/home/HomeContent.tsx#L137-L143)
- **문제**: `new Date("YYYY-MM-DD")`는 UTC 자정으로 파싱되지만 `new Date()`는 로컬 시각. KST(+9) 환경에서는 9시간 오프셋이 발생. 주차 계산은 7일 단위라 영향 미미하나, daysLeft(D-day)는 자정 직후 ±1일 흔들릴 수 있음.
- **권장 수정**: 비교 대상을 KST 자정으로 정규화하거나, `getTodayKST()`를 활용해 같은 timezone 기준으로 diff 계산. spec.md §should "KST 고정"과 정합 강화.

#### 3. OnboardingBannerProvider — `preventDefault`/`stopPropagation` 불필요
- **위치**: [src/components/providers/OnboardingBannerProvider.tsx:113-114](../../../src/components/providers/OnboardingBannerProvider.tsx#L113-L114)
- **문제**: e2e 테스트 디버깅 과정에서 X 버튼을 Link 형제로 분리한 후, 이미 인터랙티브 중첩이 사라졌는데 `e.preventDefault()`와 `e.stopPropagation()`이 그대로 남음. `<button type="button">`의 기본 동작은 없고 형제 Link가 이벤트를 받지도 않음.
- **권장 수정**: 두 줄 제거. 의도는 단순히 GA 이벤트 발사 + 페이드아웃 시작.

---

### Suggestion (개선 아이디어)

#### 1. useDueDateStore.ts — `computeRawWeek`와 `calcPregnancyWeek` 중복
- 두 함수 모두 동일한 280일 기반 주차 계산 공식을 사용. 차이는 클램프 유무뿐. `calcPregnancyWeek`에 `clamp` 옵션 매개변수를 추가하거나, 공통 헬퍼로 추출하면 유지보수 일원화 가능.

#### 2. PageviewTracker.tsx — `isFirst` ref 흔적
- 두 분기 모두 동일하게 `sendGAEvent("page_view", ...)`를 호출. `isFirst.current = false` 외 분기점이 없어 ref가 사실상 죽은 코드. 제거 가능.

#### 3. OnboardingBannerProvider.tsx — `setTimeout(250)` 매직 넘버
- 페이드아웃 duration(250ms)이 CSS 클래스(`duration-200`)와 어긋남. 상수화하거나 트랜지션 타이밍과 동기화하면 유지보수 안전.

#### 4. DueDateInput.tsx — 검증 실패 시 입력값 클리어
- 잘못된 날짜 입력 시 `setDraftDate("")`로 input을 비움. 사용자가 입력한 값을 잃어 재입력 부담. 입력값을 유지하고 토스트로만 안내하면 사용자가 1~2자리만 수정해 재제출 가능.

#### 5. ChecklistHub TimelineCard — `weekLabel` 가독성
- 삼항 조합으로 길어진 표현. dueHydrated 가드 + null 체크를 헬퍼 함수로 추출하면 가독성 향상.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 |
| Suggestion | 5건 |
| 빌드 | 미실행 (Critical 없음) |

---

<!-- STEP:refactor -->
## 리팩토링

> 리팩토링일: 2026-05-06
> 관련 리뷰: [docs/review/pregnancy-week-onboarding-review.md](#코드-리뷰)

### 리팩토링한 파일 목록

- `src/lib/week-calculator.ts` — `calcPregnancyWeek`에 `clamp` 옵션 추가
- `src/lib/date-kst.ts` — `parseDateKST` 헬퍼 신규 추가
- `src/store/useDueDateStore.ts` — `computeRawWeek` 제거, KST 통일, calcPregnancyWeek 재사용
- `src/components/home/HomeContent.tsx` — `currentPregnancyWeek`를 store 캐시에서 직접 구독, `daysLeft`를 KST 기준으로 통일
- `src/components/home/DueDateInput.tsx` — `daysLeft`를 KST 기준으로 통일
- `src/components/providers/OnboardingBannerProvider.tsx` — 잔존 `preventDefault`/`stopPropagation` 제거
- `src/components/analytics/PageviewTracker.tsx` — `isFirst` ref dead code 제거

총 7개 파일

---

### 작업별 내용

#### 1. `calcPregnancyWeek`에 `clamp` 옵션 추가 (추가 판단)
- **출처**: 추가 판단 (review.md Suggestion #1)
- **무엇을**: `calcPregnancyWeek(dueDate, today, { clamp?: boolean })` 시그니처로 옵션 추가. 기본 `clamp=true`로 기존 동작(주차를 [1, 40]으로 클램프) 유지. `clamp: false`면 raw 값 반환.
- **왜**: store의 `computeRawWeek` 헬퍼와 `calcPregnancyWeek`가 동일한 280일 공식을 두 곳에서 중복 구현. 클램프 유무만 다름. 옵션 매개변수로 통합해 SoT 확보.

#### 2. `parseDateKST` 헬퍼 추가 + KST 통일 (Warning #2)
- **출처**: Warning #2
- **무엇을**: `parseDateKST(yyyymmdd)`가 KST 자정 기반 Date 객체를 반환. store의 `setDueDate`/`refreshWeekIfNeeded`/`migrate`/`isValidDueDate`, `DueDateInput.daysLeft`, `HomeContent.daysLeft` 모두 `parseDateKST` + `getTodayKST`로 통일.
- **왜**: 기존 `new Date("YYYY-MM-DD")`는 UTC 자정으로 파싱되고 `new Date()`는 로컬 시각이라 KST(+9) 환경에서 9시간 오프셋 발생. 자정 boundary(spec.md §should "KST 고정")에서 D-day가 ±1일 흔들릴 위험 제거.

#### 3. `useDueDateStore.computeRawWeek` 제거 (추가 판단 + Warning #2)
- **출처**: 추가 판단 (Suggestion #1과 결합)
- **무엇을**: store 내부의 `computeRawWeek` 함수 삭제. `isValidDueDate`/`setDueDate`/`refreshWeekIfNeeded`/`migrate`가 모두 `calcPregnancyWeek(parseDateKST(date), nowKST(), { clamp: false | true })` 패턴으로 통일.
- **왜**: 작업 1의 옵션 추가 후 중복 함수가 의미를 잃음. 한 곳에서 관리.

#### 4. `HomeContent.currentWeek`을 store 캐시에서 구독 (Warning #1)
- **출처**: Warning #1
- **무엇을**: `useMemo + calcPregnancyWeek(new Date(dueDate))` 패턴 제거. `useDueDateStore`에서 `currentPregnancyWeek`를 직접 구독. `currentWeek = hydrated ? currentPregnancyWeek : null`.
- **왜**: store가 이미 `currentPregnancyWeek`를 캐시(자정 boundary 자동 갱신 포함)하고 있는데 컴포넌트가 매 렌더 별도로 재계산. 진실의 단일 원천(SoT) 위반. PageviewTracker의 `refreshWeekIfNeeded()` 호출 결과가 곧바로 홈 화면에 반영됨.

#### 5. `OnboardingBannerProvider.handleDismiss` 정리 (Warning #3)
- **출처**: Warning #3
- **무엇을**: `e.preventDefault()` + `e.stopPropagation()` + `e: React.MouseEvent` 매개변수 제거. handler를 인자 없는 `() => {}`로 단순화.
- **왜**: e2e 디버깅 과정에서 X 버튼이 Link 형제로 분리된 후, 인터랙티브 중첩이 사라져 두 호출이 의미를 잃었음. design.md §5.2 "인터랙티브 중첩 회피" 결정과 정합.

#### 6. `PageviewTracker.isFirst` ref 제거 (추가 판단)
- **출처**: 추가 판단 (review.md Suggestion #2)
- **무엇을**: `isFirst.current`를 검사한 후 두 분기 모두 동일하게 `sendGAEvent("page_view", ...)`를 호출하던 코드 제거. ref 자체 삭제.
- **왜**: 분기 동작에 영향이 없는 사실상 dead code. 코드 가독성 저해.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 주차 계산 함수 | `calcPregnancyWeek` + `computeRawWeek` (2곳, 중복) | `calcPregnancyWeek({ clamp })` 1곳 |
| 날짜 파싱 timezone | UTC 자정 vs 로컬 now 혼용 | KST 자정 기준 통일 (`parseDateKST` + `getTodayKST`) |
| 홈의 currentWeek | HomeContent 로컬 재계산 | store `currentPregnancyWeek` 직접 구독 |
| OnboardingBanner dismiss | `preventDefault` + `stopPropagation` 잔재 | 의도와 일치 (인자 없는 핸들러) |
| PageviewTracker | `isFirst` ref + 양분기 동일 호출 | 단일 useEffect 한 줄 |

---

### 빌드 결과
성공 (1회 시도)
