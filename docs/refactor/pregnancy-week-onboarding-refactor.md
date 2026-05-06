# pregnancy-week-onboarding 리팩토링

> 리팩토링일: 2026-05-06
> 관련 리뷰: [docs/review/pregnancy-week-onboarding-review.md](../review/pregnancy-week-onboarding-review.md)

## 리팩토링한 파일 목록

- `src/lib/week-calculator.ts` — `calcPregnancyWeek`에 `clamp` 옵션 추가
- `src/lib/date-kst.ts` — `parseDateKST` 헬퍼 신규 추가
- `src/store/useDueDateStore.ts` — `computeRawWeek` 제거, KST 통일, calcPregnancyWeek 재사용
- `src/components/home/HomeContent.tsx` — `currentPregnancyWeek`를 store 캐시에서 직접 구독, `daysLeft`를 KST 기준으로 통일
- `src/components/home/DueDateInput.tsx` — `daysLeft`를 KST 기준으로 통일
- `src/components/providers/OnboardingBannerProvider.tsx` — 잔존 `preventDefault`/`stopPropagation` 제거
- `src/components/analytics/PageviewTracker.tsx` — `isFirst` ref dead code 제거

총 7개 파일

---

## 작업별 내용

### 1. `calcPregnancyWeek`에 `clamp` 옵션 추가 (추가 판단)
- **출처**: 추가 판단 (review.md Suggestion #1)
- **무엇을**: `calcPregnancyWeek(dueDate, today, { clamp?: boolean })` 시그니처로 옵션 추가. 기본 `clamp=true`로 기존 동작(주차를 [1, 40]으로 클램프) 유지. `clamp: false`면 raw 값 반환.
- **왜**: store의 `computeRawWeek` 헬퍼와 `calcPregnancyWeek`가 동일한 280일 공식을 두 곳에서 중복 구현. 클램프 유무만 다름. 옵션 매개변수로 통합해 SoT 확보.

### 2. `parseDateKST` 헬퍼 추가 + KST 통일 (Warning #2)
- **출처**: Warning #2
- **무엇을**: `parseDateKST(yyyymmdd)`가 KST 자정 기반 Date 객체를 반환. store의 `setDueDate`/`refreshWeekIfNeeded`/`migrate`/`isValidDueDate`, `DueDateInput.daysLeft`, `HomeContent.daysLeft` 모두 `parseDateKST` + `getTodayKST`로 통일.
- **왜**: 기존 `new Date("YYYY-MM-DD")`는 UTC 자정으로 파싱되고 `new Date()`는 로컬 시각이라 KST(+9) 환경에서 9시간 오프셋 발생. 자정 boundary(spec.md §should "KST 고정")에서 D-day가 ±1일 흔들릴 위험 제거.

### 3. `useDueDateStore.computeRawWeek` 제거 (추가 판단 + Warning #2)
- **출처**: 추가 판단 (Suggestion #1과 결합)
- **무엇을**: store 내부의 `computeRawWeek` 함수 삭제. `isValidDueDate`/`setDueDate`/`refreshWeekIfNeeded`/`migrate`가 모두 `calcPregnancyWeek(parseDateKST(date), nowKST(), { clamp: false | true })` 패턴으로 통일.
- **왜**: 작업 1의 옵션 추가 후 중복 함수가 의미를 잃음. 한 곳에서 관리.

### 4. `HomeContent.currentWeek`을 store 캐시에서 구독 (Warning #1)
- **출처**: Warning #1
- **무엇을**: `useMemo + calcPregnancyWeek(new Date(dueDate))` 패턴 제거. `useDueDateStore`에서 `currentPregnancyWeek`를 직접 구독. `currentWeek = hydrated ? currentPregnancyWeek : null`.
- **왜**: store가 이미 `currentPregnancyWeek`를 캐시(자정 boundary 자동 갱신 포함)하고 있는데 컴포넌트가 매 렌더 별도로 재계산. 진실의 단일 원천(SoT) 위반. PageviewTracker의 `refreshWeekIfNeeded()` 호출 결과가 곧바로 홈 화면에 반영됨.

### 5. `OnboardingBannerProvider.handleDismiss` 정리 (Warning #3)
- **출처**: Warning #3
- **무엇을**: `e.preventDefault()` + `e.stopPropagation()` + `e: React.MouseEvent` 매개변수 제거. handler를 인자 없는 `() => {}`로 단순화.
- **왜**: e2e 디버깅 과정에서 X 버튼이 Link 형제로 분리된 후, 인터랙티브 중첩이 사라져 두 호출이 의미를 잃었음. design.md §5.2 "인터랙티브 중첩 회피" 결정과 정합.

### 6. `PageviewTracker.isFirst` ref 제거 (추가 판단)
- **출처**: 추가 판단 (review.md Suggestion #2)
- **무엇을**: `isFirst.current`를 검사한 후 두 분기 모두 동일하게 `sendGAEvent("page_view", ...)`를 호출하던 코드 제거. ref 자체 삭제.
- **왜**: 분기 동작에 영향이 없는 사실상 dead code. 코드 가독성 저해.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 주차 계산 함수 | `calcPregnancyWeek` + `computeRawWeek` (2곳, 중복) | `calcPregnancyWeek({ clamp })` 1곳 |
| 날짜 파싱 timezone | UTC 자정 vs 로컬 now 혼용 | KST 자정 기준 통일 (`parseDateKST` + `getTodayKST`) |
| 홈의 currentWeek | HomeContent 로컬 재계산 | store `currentPregnancyWeek` 직접 구독 |
| OnboardingBanner dismiss | `preventDefault` + `stopPropagation` 잔재 | 의도와 일치 (인자 없는 핸들러) |
| PageviewTracker | `isFirst` ref + 양분기 동일 호출 | 단일 useEffect 한 줄 |

---

## 빌드 결과
성공 (1회 시도)
