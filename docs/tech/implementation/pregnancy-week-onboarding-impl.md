# pregnancy-week-onboarding Implementation

> 구현일: 2026-05-05
> 관련 스펙: [docs/features/pregnancy-week-onboarding/spec.md](../../features/pregnancy-week-onboarding/spec.md)
> 결정 근거: [docs/features/pregnancy-week-onboarding/review.md](../../features/pregnancy-week-onboarding/review.md)

## 완료 조건 충족 여부

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

## 생성/수정 파일 목록

### 신규 생성

- `src/lib/date-kst.ts` — KST 기준 `YYYY-MM-DD` 문자열 생성 헬퍼 (`Intl.DateTimeFormat` 사용)
- `src/components/providers/OnboardingBannerProvider.tsx` — 글로벌 슬림 배너. 홈 외 5개 섹션(`/articles`, `/checklist`, `/timeline`, `/weight`, `/info`)에서 onboarding 미완 + dismissed 미설정 사용자에게 노출. view/click/dismiss GA4 이벤트 3종 연결
- `docs/tech/implementation/pregnancy-week-onboarding-impl.md` — 본 문서

### 수정

- `src/store/useDueDateStore.ts` — `currentPregnancyWeek` / `lastCalcDate` / `cohortJoinWeek` 필드 추가, `setDueDate` 검증 + boolean 반환, `refreshWeekIfNeeded` 액션 신규, persist v1 migrate 추가, `isValidDueDate` export
- `src/lib/analytics.ts` — `setUserProperties` 헬퍼 추가, `sendGAEvent` 시그니처에 `null` 허용
- `src/components/analytics/PageviewTracker.tsx` — 매 page_view 직전 store refresh + GA4 user_properties set 호출
- `src/components/home/DueDateInput.tsx` — 입력 모드(lavender) / 정보 모드(peach) 분기. 정보 모드는 "현재 N주차 · D-N" + 수정 버튼. 잘못된 dueDate는 sonner `toast.error`로 거부. `pregnancy_week_set` 이벤트 발사 (source: onboarding/manual_update)
- `src/components/onboarding/DueDateStep.tsx` — 새 store API(`setDueDate` boolean 반환) 적용, 검증 실패 토스트, `pregnancy_week_set` 이벤트 발사 (source: onboarding)
- `src/app/layout.tsx` — `OnboardingBannerProvider` import + 본문 컨테이너 최상단에 마운트
- `src/app/timeline/page.tsx` — 더 이상 페이지 단위 배너 필요 없으므로 `DueDateBanner` import + 사용 제거 + Fragment 정리
- `src/components/checklist/ChecklistHub.tsx` — `useDueDateStore` 연결, 하드코딩 "37주차" 핀을 store의 `currentPregnancyWeek`로 치환 (미입력 시 "예정일 입력 시 추천" 안내)
- `src/components/home/HomeContent.tsx` — 빈 상태 노란 카드 제거 (DueDateInput 입력 모드가 같은 가치 제안 카피를 흡수해 중복)

### 삭제

- `src/components/home/DueDateBanner.tsx` — 글로벌 슬림 배너로 통합

## 주요 결정 사항

- **calcPregnancyWeek 변경 없이 `isValidDueDate` 별도 export**: 기존 calcPregnancyWeek는 [1, 40] 클램프를 유지하고, 검증은 별도 함수로 분리. 클램프된 값을 보고 검증할 수 없기 때문에 store 내부에서 raw week를 다시 계산. 이유: calcPregnancyWeek 사용처(HomeContent 등)가 클램프된 값에 의존하는 상태라 시그니처 변경 시 부작용 위험.
- **`setDueDate` boolean 반환**: 호출부에서 토스트·이벤트 발사를 분기하기 위해 시그니처를 `(date: string) => boolean`으로 변경. 기존 호출부(DueDateStep, DueDateInput) 둘 다 새 시그니처에 맞춰 수정.
- **OnboardingBannerProvider는 직접 localStorage useState 패턴**: design.md §2.1 "별도 zustand store 생성 회피" 결정 반영. `useDueDateStore`와 라이프사이클이 다른 dismissed 플래그를 store에 박지 않음.
- **TimelineCard의 "예정일 입력 시 추천" 안내**: dueDate 미입력 사용자에게 핀 라벨이 비거나 깨지지 않도록, 시나리오 3 카피에 맞춰 안내 문구로 대체. spec.md §should 항목과 정합.
- **OnboardingBannerProvider는 layout.tsx의 메인 컨테이너 최상단에 마운트**: 모든 페이지에서 노출 + StickyHeader/BottomNav와 별개 위치. 홈(`/`)에서는 `sourcePage` 매칭 X로 자동 미노출.
- **localStorage 재확인을 `[pathname]` deps에 묶음**: layout이 한 번 마운트된 채 라우팅만 바뀌므로 `[]` deps였던 초기 구현은 온보딩 완료 후 `/timeline`에 진입해도 stale state로 배너가 노출됐다. pathname 변경 시 재확인하도록 의존성 추가. OnboardingFlow가 setItem 직후 router.push 하는 흐름과 정합.
- **사라지는 애니메이션 250ms 후 unmount**: dismiss 클릭 시 `leaving` flag로 페이드아웃 후 setTimeout으로 unmount. `motion-reduce:transition-none` 적용으로 prefers-reduced-motion 사용자 즉시 unmount.
- **HomeContent의 노란 빈 상태 카드 제거**: DueDateInput 입력 모드가 동일 가치 제안을 lavender 카드로 흡수했기 때문에 중복. 카드 2개가 같은 메시지를 던지는 것은 한 화면 결정 1개 룰 위반.

## 가정 사항

- GA4 user property는 sticky 모델(다음 이벤트의 컨텍스트로 자동 첨부) — review.md 항목 1 결정 A'의 전제. 멀티 백엔드(PostHog 등) 도입 시 이 가정 재검토 필요.
- `lastCalcDate`는 KST 기준 문자열 비교로 충분. `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })`이 `YYYY-MM-DD` 포맷을 안정적으로 반환.
- 기존 `due-date-storage` 사용자는 dueDate 1개 필드만 저장된 상태. v1 migrate 실행 시 dueDate 있으면 즉시 calc해 채우고, 없으면 모두 null.
- `cohortJoinWeek`는 dueDate가 한 번이라도 set된 적이 있는 사용자에게만 의미가 있음. clearDueDate 시에는 보존(cohort 정체성 유지) — 단 spec에는 명시 X. 안전한 default로 유지 결정.
- `prefers-reduced-motion`은 sonner와 OnboardingBannerProvider가 자체 처리. DueDateInput의 모드 전환 크로스페이드는 별도 transition 없이 React 리렌더로 처리(과한 애니메이션 회피).

## 미구현 항목 (won't 영역)

- P2 isHighlighted 부활 — spec.md won't (별도 결정 항목)
- §2.6 #2 D-day 컨텍스트 라벨 디자인 디테일 — 별도 디자인 작업
- 멀티 백엔드 측정 통합 — review.md 숨은 가정 영역
- 풀스크린 onboarding 카피·디자인 변경 — phase-2.5에 명세된 영역
- 입력 모드 ↔ 정보 모드 카드 배경 크로스페이드(300ms) — design.md §4 인터랙션 디테일. 현재는 즉시 전환. E2E 안정성과 prefers-reduced-motion 일관성 우선.
- 슬림 배너 등장 fade-in opacity 0→1(200ms) — 현재는 dismiss 페이드아웃만 구현. 등장은 즉시.
