# design-bundle-d-uncheck-toggle-dday 기획서

> 작성일: 2026-05-10  size: L
> 관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- **항목 1-C**: D-day 라벨 매칭 = `recommendedWeek > currentWeek` 미래 한정. 카피 = "**N주차에 챙기기**". `recommendedWeek=0`·`currentWeek=null`·과거 라벨 0.
- **항목 2-B**: D-day 측정 = 신규 `upcoming_item_view` + `upcoming_item_check` 페어 이벤트. param: `item_id` (string), `weeks_ahead` (integer = `recommendedWeek - currentWeek`). 기존 `recommended_item_view`/`recommended_item_check` 변경 0.
- **항목 3-B 검토**: 빈 상태(토글 on + 미체크 0개) 카피 = "**지금 보이는 항목은 모두 체크했어요**".
- **페어 1**: 라벨 시각 톤 = `text-muted-foreground font-normal`. 아이콘 = lucide `Clock`/`CalendarClock` (design.md에서 1개 확정).
- **페어 2**: `checklist_filter` = `filter_type = "uncheck_only"`, `value = "on"|"off"`, 토글 변경 시 1회 발사. 토글 영속성 = 세션 한정(zustand persist X).
- **페어 3**: 토글 위치 = ChecklistPage 진행률 카드 아래, ChecklistHub 첫 항목 위. 컴포넌트 = shadcn `Switch` + `data-[state=checked]:bg-pastel-lavender`. focus-visible = `ring-pastel-lavender ring-offset-2`. 빈 상태 = 신규 인라인 메시지 (`text-sm text-muted-foreground text-center py-6`).

## 1. 배경·목적

- **운영자**: phase-4.5.md §2.6 UX 기회 1·2 마감 + §1.8 묶음 H의 `checklist_filter` 일부 흡수. P3·P4(예정일+자동 주차) + P6(`recommendedWeek=0` 명문화) 선결 완료라 unblock. 콘텐츠 운영 룰 변동 0(라벨·토글은 시각·측정 변경만, 데이터 모델 변경 X).
- **사용자**: (1) 32개 항목 중 8개 남았을 때 매번 스크롤 부담 해소 (2) 미래 권장 항목에 "N주차에 챙기기" 컨텍스트 라벨로 "지금 vs 다음" 시간 인지 회복. P2 "이번 주 추천"과 분기 — 같은 행에 두 라벨이 동시 노출 안 됨.
- **측정**: GA4 신규 이벤트 3건 (`checklist_filter` + `upcoming_item_view` + `upcoming_item_check`). 측정 가설 — (a) 토글 사용 빈도와 미체크 항목 수의 상관 (b) 미래 권장 라벨이 사용자의 사전 체크 행동을 유발하는지(`weeks_ahead > 0`인 항목의 `upcoming_item_check` 발생률).

## 2. 사용자 시나리오

- **시나리오 1 (미체크 토글 — 핵심 흐름)**: 사용자 A가 ChecklistPage `/checklist/<slug>` 진입 → 진행률 75%, 미체크 8개 — 매 진입 시 32개 중 미체크 8개를 스크롤로 찾음 → 진행률 카드 아래 토글 "미체크만 보기" on → ChecklistHub의 항목이 미체크 8개로 필터링 → 사용자가 8개를 차례로 체크 → 토글 off 또는 페이지 이탈 → 재방문 시 토글 off 초기 상태 (세션 한정).
- **시나리오 2 (D-day 라벨 — 미래 권장 인지)**: 사용자 B가 22주차에 hospital-bag 카드 진입 → `recommendedWeek = 32` 항목들에 "N주차에 챙기기" 라벨(`weeks_ahead = 10`) 표시 → 사용자가 미리 체크 행동 → `upcoming_item_check` 발사 → 측정 데이터로 라벨의 행동 유발 확인.
- **시나리오 3 (P2 vs D-day 분기)**: 사용자 C가 `recommendedWeek = 22` (현재 주차) 항목과 `recommendedWeek = 32` 항목을 같은 카드에서 봄 → 22주 항목에는 "이번 주 추천"(P2) 라벨, 32주 항목에는 "N주차에 챙기기"(D-day) 라벨 → 같은 행에 두 라벨이 동시 노출 안 됨(분기). 시각 위계 = "이번 주 추천"(`text-foreground font-medium`) > "N주차에 챙기기"(`text-muted-foreground font-normal`).
- **시나리오 4 (currentWeek null)**: 사용자 D가 예정일 미입력 상태 → P2/D-day 라벨 모두 비표시 → P3 첫 방문 onboarding 프롬프트는 별도 컴포넌트(이미 머지). 토글은 정상 동작.
- **시나리오 5 (recommendedWeek=0)**: hospital_bag·partner_prep·pregnancy_prep 등 다수 항목 — P6 가드로 P2/D-day 라벨 모두 비표시. 토글 정상 동작.
- **시나리오 6 (빈 상태 — 토글 on + 미체크 0개)**: 사용자 E가 토글 on → 미체크 0개 → ChecklistHub 항목 영역에 "지금 보이는 항목은 모두 체크했어요" 인라인 메시지. AllDoneBadge(전체 100% 완료)와 동시 노출 가능 — AllDoneBadge 위, 본 메시지 아래 (의미 분리: 전체 vs 필터 컨텍스트).

## 3. 기능 요구사항

### must

#### M1. "미체크만 보기" 토글 컴포넌트

- 위치: [ChecklistPage.tsx](src/components/checklist/ChecklistPage.tsx)의 진행률 카드 아래, [ChecklistHub.tsx](src/components/checklist/ChecklistHub.tsx) 첫 항목 위 슬롯. 정확한 슬롯 명세는 [design.md §1](./design.md)에 박힘.
- 컴포넌트: shadcn `Switch` ([src/components/ui/switch.tsx](src/components/ui/switch.tsx) 재사용 또는 신규 import).
- 상태: ChecklistPage 또는 ChecklistHub의 React state로 관리. **zustand persist X** (세션 한정).
- 활성 시 처리: ChecklistHub가 받는 `items` 배열을 `items.filter(item => !checkedIds.includes(item.id))`로 필터링.
- ARIA: `role="switch"` + `aria-checked` (shadcn Switch가 native 제공). `aria-label="미체크만 보기"` 의무.
- 모바일 320px: 토글 + 라벨 한 줄 (분리 행 결정 — design.md).

#### M2. ChecklistItemRow D-day 라벨 슬롯

- [ChecklistItemRow.tsx](src/components/checklist/ChecklistItemRow.tsx) L119-124의 `showHighlightLabel`(P2) 라벨 슬롯과 같은 위치에 D-day 라벨 추가.
- 분기 조건:
  ```
  showRecommendedLabel = isHighlighted (P2 매칭)
  showUpcomingLabel = !isHighlighted && currentWeek !== null && item.recommendedWeek > currentWeek && item.recommendedWeek !== 0 && !isChecked
  ```
- D-day 라벨 마크업:
  ```tsx
  {showUpcomingLabel && (
    <span className="mt-1 flex items-center gap-1 text-xs font-normal text-muted-foreground">
      <Clock size={11} className="shrink-0" aria-hidden="true" />
      <span>{item.recommendedWeek}주차에 챙기기</span>
    </span>
  )}
  ```
- 두 라벨은 **분기**라 한 행에 동시 노출 안 됨. P2 라벨 시각(`text-foreground font-medium`)과 D-day 라벨(`text-muted-foreground font-normal`) 위계 차이 유지.
- 아이콘 = lucide `Clock` (`CalendarClock`은 design.md에서 검토 후 1개 확정).
- 카피 정확 형식: `${item.recommendedWeek}주차에 챙기기` (예: "32주차에 챙기기"). 임신 주차 도메인 컨텍스트 자명.
- ChecklistItemRow는 `currentPregnancyWeek` prop을 추가로 받아야 함 (호출부 = WeekChecklistSection·ChecklistHub에서 `useDueDateStore`로부터 주입).

#### M3. ChecklistHub 필터링 로직

- ChecklistHub가 받는 props에 `showUncheckedOnly: boolean` 추가.
- 항목 렌더 직전 `items.filter`로 미체크만 노출. 진행률 텍스트(`8/32 완료` 등)는 **전체 기준 유지** — 토글로 표시 항목이 줄어도 "현재 진행 상태"는 전체 기준.
- 빈 상태 (토글 on + 미체크 0개) 분기: ChecklistHub에서 인라인 메시지 컴포넌트 또는 `<p>` 직접 렌더.

#### M4. 빈 상태 인라인 메시지

- 카피: "**지금 보이는 항목은 모두 체크했어요**".
- 마크업: 신규 컴포넌트 도입 X. ChecklistHub 또는 ChecklistPage 내 인라인 `<p>`. 시각: `text-sm text-muted-foreground text-center py-6`.
- ARIA: `role="status"` + `aria-live="polite"` (필터 결과 변화를 스크린리더에 알림).
- AllDoneBadge와 동시 노출 가능 — AllDoneBadge가 위 (`mb-4`), 본 메시지가 ChecklistHub 항목 영역 안에서 표시.

#### M5. GA4 이벤트 신규 — `checklist_filter`

- `sendGAEvent("checklist_filter", { filter_type: "uncheck_only", value: "on" | "off" })`.
- 발사 시점: 토글 변경 시 1회. 페이지뷰 시 자동 발사 X.
- 호출 위치: 토글 onChange 핸들러 내부.
- 측정 락인 정책 메모: ga4.md §변경 정책에 박음 — 향후 다른 필터 추가 시 `filter_type` enum 확장만 허용, 기존 값 변경·삭제 X.

#### M6. GA4 이벤트 신규 — `upcoming_item_view` + `upcoming_item_check`

- `upcoming_item_view`: ChecklistItemRow 마운트 시(D-day 라벨이 실제로 노출되는 케이스만), `useEffect` 내에서 1회 발사. param: `item_id` (string = `item.id`), `weeks_ahead` (integer = `item.recommendedWeek - currentWeek`).
- `upcoming_item_check`: 사용자가 D-day 라벨이 노출된 항목을 체크할 때 발사. 발사 위치 = 체크 토글 핸들러에서 `showUpcomingLabel`이 true였던 항목 분기. param 동일.
- PII 0 — `item_id`는 hash 아닌 enum string(`weekly-checklist-item-001` 등 정적 카탈로그), `weeks_ahead`는 integer.
- 기존 `recommended_item_view`/`recommended_item_check` (P2) 변경 0.

#### M7. ChecklistPage·ChecklistHub·ChecklistItemRow props 시그니처 변경

- ChecklistPage → ChecklistHub: `showUncheckedOnly` 전달.
- ChecklistHub → ChecklistItemRow: `currentPregnancyWeek` 전달 (useDueDateStore에서 가져와 prop drilling, 또는 ChecklistItemRow에서 직접 store 접근 — 후자가 prop drilling 회피로 권장).
- ChecklistItemRow → WeekChecklistSection: `currentPregnancyWeek`는 이미 WeekChecklistSection이 P2에서 사용 중이라 변경 불필요(WeekChecklistSection은 본 묶음 영향 작음 — 토글은 ChecklistHub만, D-day 라벨은 ChecklistItemRow만).

### should

- **e2e 추가 시나리오**: 토글 on/off + 빈 상태 + D-day 라벨 분기 + 모바일 320px 레이아웃. 본 라운드 should — 페이즈 5 spec 머지 후 e2e PR 별도 가능.
- **토글 영속성 재검토 메모**: P5 schema versioning이 phase-5에서 풀리면 본 묶음 영속성을 zustand persist + migrate로 격상 가능. 본 라운드는 세션 한정 — 향후 별도 라운드.
- **`upcoming_item_check` view→check 전환율 정의**: ga4.md에 분석 시나리오 1건 추가 (Looker Studio 또는 GA4 탐색 보고서 명세).

### won't (이번 범위 밖)

- **지난 주차(`recommendedWeek < currentWeek`) 라벨 도입**: planner §7.7 공포 회피 + designer 양보로 미래만. 본 라운드 페어 1 결정.
- **토글 zustand persist 영속성**: P5 schema versioning deferred 정책 존중 — 세션 한정.
- **카테고리·우선순위 필터 추가 토글**: MVP는 "미체크만 보기" 단일. `filter_type` enum 확장은 향후.
- **AllDoneBadge 카피 변경**: 기존 "모든 항목을 챙기셨어요" 유지. 본 묶음은 빈 상태 메시지 신규 추가만.
- **D-day 라벨에 클릭 인터랙션**: 현재는 시각 라벨만. 향후 라벨 클릭 시 "임신 N주차 가이드"로 이동은 별도 묶음.
- **묶음 F (M5·M6 허브 카드 패턴 통일·"37주차" 핀)**: 본 묶음 토글 위치가 묶음 F 후속 라운드와 충돌할 수 있음 — 페이즈 8 cross-check에서 검증.

## 4. 예외·엣지 케이스

- **currentWeek null** (사용자 예정일 미입력): D-day 라벨 비표시. 토글은 정상 동작 (체크 상태만으로 필터). P2 라벨도 비표시 (기존 동작).
- **recommendedWeek=0** (P6 "주차 무관"): D-day 라벨 비표시. P2 라벨도 비표시 (기존 가드). 토글에서 미체크 시 정상 노출.
- **isChecked=true**: P2 라벨처럼 D-day 라벨도 비표시 (`!isChecked` 조건). 사용자가 체크 해제하면 다시 표시.
- **recommendedWeek === currentWeek**: P2 분기로 falls through — D-day 라벨 비표시, P2 "이번 주 추천" 노출.
- **recommendedWeek < currentWeek** (지난 주차): D-day 라벨 비표시 (won't). P2 라벨도 비표시. 미체크 시 토글로만 식별.
- **토글 on + 카테고리 필터 동시**: 둘 다 적용 (AND). 빈 상태 메시지가 "현재 필터 조합에서 미체크 0개" 의미 — 카피 "지금 보이는 항목은 모두 체크했어요"로 충분.
- **localStorage·예정일 영향**: 본 묶음 데이터 모델 변경 0. zustand persist 추가 X. 회귀 위험 0.
- **모바일 320px**: 토글 + 라벨 한 줄. 진행률 텍스트와 분리 행 (design.md). D-day 라벨 길이 = "32주차에 챙기기" 약 8자 → 한 줄 OK.
- **ChecklistItemRow에서 store 직접 접근 시 SSR/hydration**: Next.js App Router의 client component에서 zustand store 읽기 시 hydration mismatch 가능 — `useEffect` 또는 `useHydrated` 패턴 적용 (이미 P3·P4 구현에서 박혀 있음, 동일 패턴 재사용).

## 5. 성공 기준

- **기능 동작**:
  - `pnpm build` 성공 + e2e 기존 통과 + 신규 e2e 4~5건 통과 (토글 on/off, 빈 상태, D-day 라벨 분기, 모바일 320px).
  - 키보드 Tab으로 토글 도달 → focus-visible ring(`ring-pastel-lavender`) 표시 → Space로 활성화 → 항목 필터링.
  - 스크린리더로 "미체크만 보기 스위치 켜짐/꺼짐" 음성 출력.
  - currentWeek=22, recommendedWeek=32 항목에서 "32주차에 챙기기" 라벨 시각 확인 + `upcoming_item_view` GA4 이벤트 발사 확인.
- **측정 지표** (ga4.md와 일치):
  - `checklist_filter` 발사: 토글 변경 시 1회만, value="on"/"off" 정확.
  - `upcoming_item_view`/`upcoming_item_check` 발사: 라벨 노출 항목에서만, weeks_ahead integer 정확.
  - PII 0 검증: 모든 param이 `item_id` enum string + integer만.
- **사용자 경험** (design.md와 일치):
  - 토글 시각 = lavender role 정합 (`bg-pastel-lavender`).
  - D-day 라벨 시각 위계 = `text-muted-foreground font-normal` (P2 `text-foreground font-medium`보다 약함).
  - 빈 상태 인라인 메시지 = AllDoneBadge와 의미 분리 시각 확인.
  - 모바일 320px 레이아웃 OK.
- **SoT 정합**:
  - phase-4.5.md §2.6 UX 기회 1·2 상태 갱신 + §1.8 묶음 H의 `checklist_filter` 항목 상태 갱신.
  - GA4 카탈로그(phase-4.5.md §1.5) `checklist_filter`/`upcoming_item_view`/`upcoming_item_check` 행 추가.
