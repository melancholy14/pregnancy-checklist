# p9-empty-state

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-05-07
> plan: [spec](../../features/p9-empty-state/spec.md) · [design](../../features/p9-empty-state/design.md)

<!-- STEP:impl -->
## 구현

> 구현일: 2026-05-07
> spec: [docs/features/p9-empty-state/spec.md](../../features/p9-empty-state/spec.md)
> design: [docs/features/p9-empty-state/design.md](../../features/p9-empty-state/design.md)
> review: [docs/features/p9-empty-state/review.md](../../features/p9-empty-state/review.md)

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 빈 상태 컴포넌트 신규 (case prop 분기: first_visit / migration_lost / custom_only) | ✅ | `ChecklistEmptyState.tsx` |
| 모두 완료 헤더 격려 텍스트 — mint 토큰 | ✅ | `AllDoneBadge.tsx` (mint/40 배경 + accent-green 텍스트) |
| 모두 완료 토스트 — 같은 슬러그 마운트당 1회 | ✅ | sonner 활용, `allDoneToastEvaluatedRef`로 1회 가드 |
| 자동 복구 콜백 (`onRehydrateStorage`) — 실패 시 default state + `migrationLostFlag` 1회 | ✅ | `createChecklistStore.ts` 갱신 |
| 카피 정합성 (review.md §5 결정 그대로) | ✅ | 4종 케이스 카피·CTA 변형 없이 박음 |
| §1.8 J 합류 unblock 조건 명시 | ✅ | spec.md §3 must 그대로 유지, GA4 코드 미포함 |
| a11y — `role="status"` / `role="alert"`, `aria-live="polite"` | ✅ | 케이스별 시맨틱 구분 |
| 모바일 320px — `word-break: keep-all` 카피 줄바꿈 | ✅ | 각 컴포넌트 `wordBreak: "keep-all"` 적용 |
| 다크 패턴 회피 — destructive·red 토큰 미사용 | ✅ | lavender / peach / mint만 사용 |
| 빌드 통과 | ✅ | `npm run build` 1회 시도 후 타입 에러 1건 수정 → 통과 |

### 생성/수정 파일 목록

#### 신규 생성

- [src/components/checklist/ChecklistEmptyState.tsx](../../../src/components/checklist/ChecklistEmptyState.tsx) — `case` prop으로 3종 분기. first_visit는 카드 + 둘러보기 CTA, migration_lost는 peach inline alert + 확인 CTA, custom_only는 prose-muted 색 1줄 안내.
- [src/components/checklist/AllDoneBadge.tsx](../../../src/components/checklist/AllDoneBadge.tsx) — 모두 완료 헤더 격려 텍스트. mint/40 배경 + accent-green 텍스트 + Check 아이콘.

#### 수정

- [src/store/createChecklistStore.ts](../../../src/store/createChecklistStore.ts) — `migrationLostFlag` 상태 + `clearMigrationLost` 액션 추가. `onRehydrateStorage` 콜백에서 hydration 에러 캐치 → `queueMicrotask`로 default state 복구 + 플래그 켬. `partialize`로 플래그는 persist 제외(in-session only).
- [src/components/checklist/ChecklistPage.tsx](../../../src/components/checklist/ChecklistPage.tsx) — `emptyStateCase` 판정 로직, `allDone` 판정, 1회 토스트 effect, 둘러보기 anchor scroll, 첫 체크 시 migrationLost 플래그 클리어 통합.

#### 미수정 (의도)

- `src/components/checklist/ChecklistHub.tsx` — review.md §5 결정상 hub는 빈 상태·all_done 대상 아님. hub는 항상 3개 카드 노출.

### 주요 결정 사항

- **InlineToast 컴포넌트 미생성**: design.md는 "외부 라이브러리 추가 회피, 기존 패턴 부재 시" 신규 도입을 명시. 코드베이스에 `sonner` Toaster가 [src/app/layout.tsx](../../../src/app/layout.tsx#L62)에 이미 마운트되어 있어 sonner를 활용. spec.md §3 must "기존 사용 중인 것 활용" 조건 정합.
- **first_visit 카드는 items 위에 렌더, items는 그대로 노출**: design.md §1 플로우의 "[둘러보기] 탭 → 페이지 내 항목 리스트로 스크롤·전환 (라우팅 변경 X)" 정합. 빈 상태 카드가 items를 대체하지 않고, anchor `#checklist-items`로 스크롤. 사용자가 첫 체크하면 `checkedIds.length > 0`이 되어 자동으로 빈 상태 사라짐.
- **케이스 우선순위**: `migration_lost > first_visit > custom_only`. 데이터 손실은 가장 강한 인지 필요(role="alert"), first_visit는 체크·custom 모두 0개, custom_only는 base=0 && custom≥1. spec.md §4 edge case "기본 0 + custom 0 = first_visit"도 자연스럽게 충족.
- **all_done 토스트는 마운트 직후 평가 1회**: spec.md §4 edge case "체크 toggle 직후 모두 완료 → 토스트는 다음 마운트까지 미발사"를 위해 `allDoneToastEvaluatedRef`를 hydration 완료 직후 1회만 평가하도록 설계. 세션 중 all_done 전환은 헤더 텍스트만 갱신, 토스트 미발사. 페이지 재진입(언마운트→마운트) 시 ref 초기화로 다시 평가.
- **prefers-reduced-motion 대응**: 토스트 100ms 지연·스크롤 smooth 동작을 reduce 시 모두 제거(즉시 표시·즉시 점프). design.md §4 정합.
- **store ref 캡처 방식**: `onRehydrateStorage` 콜백 실행 시점이 `create()` 반환 후이므로 `queueMicrotask`로 setState를 미뤄 안전 처리. `let` 캐시 변수 없이 `const store` 클로저 캡처로 깔끔하게 해결.
- **migrationLostFlag persist 제외**: `partialize`로 `checkedIds`·`customItems`만 storage에 기록. 플래그는 세션 내 1회 알림용. 다음 방문 시 hydration 성공이면 플래그 미설정 → 정상 렌더, 또 실패하면 다시 켜짐.
- **migrationLost 클리어 트리거 2개**: [확인] CTA 탭 + 첫 체크 시 자동(`handleToggle`에서 플래그 검사). spec.md §4 "CTA 탭 또는 첫 체크 시 alert 사라짐" 정합.
- **AllDoneBadge mint 색**: `text-pastel-mint` 토큰은 텍스트 색으로 채도가 낮아 가독성 떨어짐 → DESIGN.md §2.3 표대로 `bg-pastel-mint` + `var(--accent-green)` 텍스트 페어 적용. WCAG AA 충족.

### 가정 사항

- **P3 글로벌 슬림 배너 미존재**: 코드베이스 grep 결과 P3 슬림 배너 컴포넌트는 아직 미구현. P9는 spec.md대로 입력 CTA를 빈 상태에 박지 않으므로 P3 의존 없이 단독 진행 가능. P3 도입 후 추가 변경 불필요(P3가 자체 페이지 헤더에 마운트).
- **체크리스트 hub(`/checklist`) 라우트 존재**: all_done 토스트 액션 `[둘러보기]`가 `router.push("/checklist")`로 이동. `app/checklist/page.tsx`가 이미 존재하므로 동작 보장.
- **localStorage 차단 환경**: zustand `persist`는 localStorage 차단 시 hydration 자체를 시도하지 않거나 에러 없이 빈 상태로 종료 → migration_lost 미트리거. spec.md §4 edge case 정합("first_visit으로 분기").
- **§1.8 묶음 J 미도입**: GA4 `empty_state_view` 이벤트는 본 PR 범위 밖. 빈 상태 컴포넌트 마운트 hook 위치는 spec.md §3 must대로 component 마운트 시점에 그대로 유지 — §1.8 J 작업 시 `useEffect` 안에 `sendGAEvent("empty_state_view", { case, page })` 1줄 추가만으로 합류 가능.

### 미구현 항목

- **GA4 `empty_state_view` 이벤트 발사**: spec.md §3 won't / 4.5=B 결정대로 §1.8 묶음 J 작업 범위. 본 PR 범위 외.
- **모두 완료 별도 빈 상태 시안**: review.md §5 4.2 결정대로 미도입(헤더 텍스트 + 토스트로 한정).
- **다른 도메인 빈 상태 (정보 탭·체중·타임라인)**: spec.md §3 won't — 별도 결정 항목.
- **P10 운영자 가이드 (deprecated 플래그 룰)**: 의존성만 명시, 본 PR 범위 외.

---

<!-- STEP:review -->
## 코드 리뷰

> 작성일: 2026-05-07
> spec: [docs/features/p9-empty-state/spec.md](../../features/p9-empty-state/spec.md)
> impl: [docs/implementation/p9-empty-state-impl.md](#구현)

### 리뷰 대상 파일

- [src/store/createChecklistStore.ts](../../../src/store/createChecklistStore.ts)
- [src/components/checklist/ChecklistEmptyState.tsx](../../../src/components/checklist/ChecklistEmptyState.tsx)
- [src/components/checklist/AllDoneBadge.tsx](../../../src/components/checklist/AllDoneBadge.tsx)
- [src/components/checklist/ChecklistPage.tsx](../../../src/components/checklist/ChecklistPage.tsx)

총 4개 파일.

---

### Critical 이슈 (즉시 수정 완료)

없음. 4개 파일 모두 타입 안전성·보안·런타임 안정성 측면에서 즉시 수정이 필요한 결함이 없습니다.

> 참고: write-e2e-tests 단계에서 발견된 zustand `persist` hydration 실패 후 `hasHydrated()`가 `false`로 영구 고정되는 결함은 이미 같은 단계에서 [src/store/createChecklistStore.ts:56-69](../../../src/store/createChecklistStore.ts#L56-L69)에 `setState` + `persist.rehydrate()` 패턴으로 수정되었고 14/14 e2e 통과로 검증됨.

---

### Warning (수정 권장)

#### 1. ChecklistPage.tsx — `handleToggle` 디펜던시의 raw `checkedIds` 사용으로 GA4 보고 정확도 저하 가능
- **위치**: [src/components/checklist/ChecklistPage.tsx:131](../../../src/components/checklist/ChecklistPage.tsx#L131)
- **문제**: `const willCheck = !checkedIds.includes(item.id);`는 raw store 값(`checkedIds`)을 읽습니다. `effectiveCheckedIds`(hydration 가드 적용)를 쓰지 않아, hydration이 완료되지 않은 순간에 사용자가 빠르게 클릭하면 GA4 `checklist_check.checked` 파라미터가 실제 사용자 인지와 다르게 보고될 수 있습니다. 빈도는 낮지만 측정 데이터 오염 가능성 존재.
- **권장 수정**: `const willCheck = !effectiveCheckedIds.includes(item.id);`로 변경하고 deps도 `effectiveCheckedIds` 기준으로 갱신. 단, `effectiveCheckedIds`는 `useMemo` 결과라 deps가 더 잦게 변하지 않음.

#### 2. ChecklistPage.tsx — 인라인 화살표 함수가 `ChecklistItemRow` props로 매 렌더 새로 생성
- **위치**: [src/components/checklist/ChecklistPage.tsx:215-220](../../../src/components/checklist/ChecklistPage.tsx#L215-L220)
- **문제**: `onToggle={() => handleToggle(item)}`, `onStartEdit={() => startEdit(item)}` 등 5개 핸들러가 모두 인라인 화살표. `ChecklistItemRow`는 `React.memo`가 아니라 어차피 재렌더되지만, 향후 메모이제이션 도입 시 props 동일성이 깨져 효과가 사라집니다. 본 PR 범위 외(기존 패턴 그대로 유지) — refactor 단계에서 검토.
- **권장 수정**: 옵션 1) `ChecklistItemRow`를 `React.memo`로 감싸고 핸들러를 `useCallback`으로 정리. 옵션 2) `ChecklistItemRow`가 직접 `id`를 받아 부모 콜백을 호출.

#### 3. AllDoneBadge.tsx — `<div aria-label>` + 텍스트 중복 — 스크린리더가 라벨만 읽고 텍스트 무시할 가능성
- **위치**: [src/components/checklist/AllDoneBadge.tsx:5-12](../../../src/components/checklist/AllDoneBadge.tsx#L5-L12)
- **문제**: `<div aria-label="모든 항목 완료">` 안에 `<span>모든 항목을 챙기셨어요</span>` 텍스트가 있습니다. ARIA 사양상 `aria-label`이 있는 컨테이너는 자식 텍스트를 무시하므로 스크린리더가 "모든 항목 완료"만 읽고 의도된 부드러운 카피("챙기셨어요")를 못 듣습니다. designer 페르소나 톤(따뜻한 어조)이 약화될 수 있음.
- **권장 수정**: `aria-label`을 제거하거나, 컨테이너 div에서 빼고 시각 라벨 용도(테스트 셀렉터)는 다른 방법(예: `data-testid`)으로 분리.

---

### Suggestion (개선 아이디어)

#### 1. createChecklistStore.ts — `initFromLocalStorage` 데드 코드
- **위치**: [src/store/createChecklistStore.ts:46-48](../../../src/store/createChecklistStore.ts#L46-L48)
- 함수 본문이 주석뿐인 no-op. 외부에서 호출하는 곳 없음. 본 PR 범위 외(기존 코드)지만 다음 store 정리 시 제거 가능.

#### 2. ChecklistEmptyState.tsx / AllDoneBadge.tsx — `style={{ wordBreak: "keep-all" }}` 인라인 스타일
- Tailwind 3.4+에는 `break-keep` 유틸리티가 있어 inline style 없이 `className="break-keep"`로 대체 가능. 타 컴포넌트도 같은 패턴이라 일괄 정리 가치는 낮지만, 신규 컴포넌트는 적용 가치 있음.

#### 3. AllDoneBadge.tsx — `style={{ color: "var(--accent-green)" }}` 인라인 → `text-accent-green` 토큰
- globals.css `@theme inline`에 `--color-accent-green` 매핑이 있어 `text-accent-green` Tailwind 유틸리티로 가능. DESIGN.md §2.3의 토큰 일관성 정합.

#### 4. ChecklistPage.tsx — 토스트 액션 `onClick` 클로저가 `router.push` 직접 호출
- 토스트가 dismiss된 후에도 클릭 가능한 짧은 시간 윈도우가 있어, 사용자 인터랙션 추적(GA4)이 약간 늦거나 누락될 수 있음. `sendGAEvent("empty_state_action_click", {case: "all_done"})` 한 줄을 §1.8 J 합류 시 함께 박는 것을 검토.

#### 5. ChecklistPage.tsx — Anchor scroll target에 `tabIndex={-1}` + `focus()` 미적용
- `[둘러보기]` CTA 탭 시 `scrollIntoView`만 호출. 키보드 사용자에게는 포커스 이동이 더 명확. `target.focus({ preventScroll: false })`를 추가하면 a11y 경험이 개선됨. 단, 첫 항목으로 직접 포커스 이동하는 게 더 자연스러우므로 refactor 시 재고려.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 (수정 권장 — refactor 단계 후보) |
| Suggestion | 5건 |
| 빌드 | 미실행(Critical 없음) |

전반적으로 spec.md / design.md / review.md 결정사항을 정합하게 구현했고, 카피·CTA 위배 없음. WCAG 색대비, role 시맨틱, prefers-reduced-motion 모두 충족. 다크 패턴 회피(가짜 진행률·외부 광고 위장 없음, 부드러운 톤) 기준 통과.

다음 단계로 `/refactor` 시 Warning 1·2·3을 우선 검토 권장.

---

<!-- STEP:refactor -->
## 리팩토링

> 작성일: 2026-05-07
> review: [docs/review/p9-empty-state-review.md](#코드-리뷰)

### 리팩토링한 파일 목록

- [src/components/checklist/ChecklistPage.tsx](../../../src/components/checklist/ChecklistPage.tsx)

---

### 작업별 내용

#### 1. ChecklistPage.tsx — `handleToggle` GA4 willCheck 계산을 `effectiveCheckedIds` 기준으로 통일

- **출처**: review.md Warning 1
- **무엇을**: [src/components/checklist/ChecklistPage.tsx:131](../../../src/components/checklist/ChecklistPage.tsx#L131) 의 `const willCheck = !checkedIds.includes(item.id);` 를 `effectiveCheckedIds` 기준으로 변경. `useCallback` deps도 `checkedIds` → `effectiveCheckedIds`로 정렬.
- **왜**: `checkedIds`(raw 스토어 값)는 hydration 가드를 통과하지 않은 값입니다. hydration이 늦거나 실패한 순간 사용자 클릭이 들어오면 GA4 `checklist_check.checked` 파라미터가 실제 사용자 인지(UI 상 unchecked)와 불일치하게 보고될 수 있습니다. `effectiveCheckedIds`는 `hydrated ? checkedIds : EMPTY_CHECKED_IDS` 결과라 UI에 노출되는 상태와 동기화되어 측정 정확도가 보장됩니다. 동작은 동일(`toggle(item.id)`은 그대로 raw 액션 호출).

---

### 보류된 Warning

#### Warning 2 (ChecklistItemRow 핸들러 메모이제이션) — 본 PR 범위 외 사이드이펙트로 보류

`onToggle={() => handleToggle(item)}` 등 인라인 화살표를 메모이제이션하려면 `ChecklistItemRow`를 `React.memo`로 감싸고 props를 `id` 단위로 재설계해야 효과가 있습니다. `ChecklistItemRow`는 P9 범위 밖 컴포넌트이며 timeline 등 다른 도메인에서도 동일 패턴을 공유합니다. 본 단계에서는 조심스럽게 보류하고, 별도 리팩토링 PR로 일괄 정리 권장.

#### Warning 3 (AllDoneBadge `aria-label` + 텍스트 중복) — 트레이드오프로 보류

ARIA 사양상 `aria-label`이 있으면 accessible name 계산에서 자식 텍스트가 무시될 수 있습니다. 그러나:
- `<div>`에 role이 없는 경우, browse-mode 스크린리더는 자식 텍스트를 그대로 읽습니다.
- `aria-label="모든 항목 완료"`는 e2e 테스트의 안정적인 셀렉터(`getByLabel`)로 활용 중입니다.
- 시각적 카피("모든 항목을 챙기셨어요")는 자식 `<span>`에 그대로 보존되어 부드러운 톤이 유지됩니다.

테스트 안정성·시각 카피 보존 ↔ ARIA 사양 엄격 해석 트레이드오프에서, 본 단계는 현재 구조 유지를 선택합니다. 추후 a11y 감사 시 재검토 권장.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 4개 | 4개 |
| 최대 파일 줄 수 | 256줄 (ChecklistPage.tsx) | 256줄 |
| GA4 측정 정확도 | hydration 미반영 가능 | hydration 동기 보장 |

분리·추출 없는 미니멀 리팩토링. 동작 변경 0건, public interface 변경 0건.

---

### 빌드 결과

성공 (1회 시도).
