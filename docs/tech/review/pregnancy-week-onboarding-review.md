# pregnancy-week-onboarding 코드 리뷰

> 리뷰일: 2026-05-06
> 관련 스펙: [docs/features/pregnancy-week-onboarding/spec.md](../../features/pregnancy-week-onboarding/spec.md)
> 관련 구현: [docs/implementation/pregnancy-week-onboarding-impl.md](../implementation/pregnancy-week-onboarding-impl.md)

## 리뷰 대상 파일

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

## Critical 이슈 (즉시 수정 완료)

없음. 4가지 관점(타입 안전성·성능·보안·접근성) 모두 런타임 크래시·실제 사용자 피해를 일으킬 수준의 결함은 발견되지 않음.

---

## Warning (수정 권장)

### 1. HomeContent.tsx — `currentWeek`을 store 캐시 대신 매 렌더 재계산
- **위치**: [src/components/home/HomeContent.tsx:103-106](../../../src/components/home/HomeContent.tsx#L103-L106)
- **문제**: `useDueDateStore`가 이미 `currentPregnancyWeek` 필드를 캐시하고 있는데, HomeContent는 로컬에서 `calcPregnancyWeek(new Date(dueDate))`를 다시 호출. 동일 값이지만 두 곳에서 별도로 계산되어 일관성·진실의 단일 원천(SoT) 룰 위반. 자정 boundary 처리도 store는 `refreshWeekIfNeeded()`를 거치지만 로컬 계산은 매 렌더 생성되어 동작이 다를 수 있음.
- **권장 수정**: `useDueDateStore`의 `currentPregnancyWeek`를 직접 구독해 사용. 로컬 `calcPregnancyWeek` 호출 제거.

### 2. Date 파싱 — UTC 자정 vs 로컬 now 혼용
- **위치**: [src/store/useDueDateStore.ts:18-23](../../../src/store/useDueDateStore.ts#L18-L23), [src/components/home/DueDateInput.tsx:24-28](../../../src/components/home/DueDateInput.tsx#L24-L28), [src/components/home/HomeContent.tsx:137-143](../../../src/components/home/HomeContent.tsx#L137-L143)
- **문제**: `new Date("YYYY-MM-DD")`는 UTC 자정으로 파싱되지만 `new Date()`는 로컬 시각. KST(+9) 환경에서는 9시간 오프셋이 발생. 주차 계산은 7일 단위라 영향 미미하나, daysLeft(D-day)는 자정 직후 ±1일 흔들릴 수 있음.
- **권장 수정**: 비교 대상을 KST 자정으로 정규화하거나, `getTodayKST()`를 활용해 같은 timezone 기준으로 diff 계산. spec.md §should "KST 고정"과 정합 강화.

### 3. OnboardingBannerProvider — `preventDefault`/`stopPropagation` 불필요
- **위치**: [src/components/providers/OnboardingBannerProvider.tsx:113-114](../../../src/components/providers/OnboardingBannerProvider.tsx#L113-L114)
- **문제**: e2e 테스트 디버깅 과정에서 X 버튼을 Link 형제로 분리한 후, 이미 인터랙티브 중첩이 사라졌는데 `e.preventDefault()`와 `e.stopPropagation()`이 그대로 남음. `<button type="button">`의 기본 동작은 없고 형제 Link가 이벤트를 받지도 않음.
- **권장 수정**: 두 줄 제거. 의도는 단순히 GA 이벤트 발사 + 페이드아웃 시작.

---

## Suggestion (개선 아이디어)

### 1. useDueDateStore.ts — `computeRawWeek`와 `calcPregnancyWeek` 중복
- 두 함수 모두 동일한 280일 기반 주차 계산 공식을 사용. 차이는 클램프 유무뿐. `calcPregnancyWeek`에 `clamp` 옵션 매개변수를 추가하거나, 공통 헬퍼로 추출하면 유지보수 일원화 가능.

### 2. PageviewTracker.tsx — `isFirst` ref 흔적
- 두 분기 모두 동일하게 `sendGAEvent("page_view", ...)`를 호출. `isFirst.current = false` 외 분기점이 없어 ref가 사실상 죽은 코드. 제거 가능.

### 3. OnboardingBannerProvider.tsx — `setTimeout(250)` 매직 넘버
- 페이드아웃 duration(250ms)이 CSS 클래스(`duration-200`)와 어긋남. 상수화하거나 트랜지션 타이밍과 동기화하면 유지보수 안전.

### 4. DueDateInput.tsx — 검증 실패 시 입력값 클리어
- 잘못된 날짜 입력 시 `setDraftDate("")`로 input을 비움. 사용자가 입력한 값을 잃어 재입력 부담. 입력값을 유지하고 토스트로만 안내하면 사용자가 1~2자리만 수정해 재제출 가능.

### 5. ChecklistHub TimelineCard — `weekLabel` 가독성
- 삼항 조합으로 길어진 표현. dueHydrated 가드 + null 체크를 헬퍼 함수로 추출하면 가독성 향상.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 |
| Suggestion | 5건 |
| 빌드 | 미실행 (Critical 없음) |
