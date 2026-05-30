# P9 빈 상태 카피·CTA — 코드 리뷰

> 작성일: 2026-05-07
> spec: [docs/features/p9-empty-state/spec.md](../../features/p9-empty-state/spec.md)
> impl: [docs/implementation/p9-empty-state-impl.md](../implementation/p9-empty-state-impl.md)

## 리뷰 대상 파일

- [src/store/createChecklistStore.ts](../../../src/store/createChecklistStore.ts)
- [src/components/checklist/ChecklistEmptyState.tsx](../../../src/components/checklist/ChecklistEmptyState.tsx)
- [src/components/checklist/AllDoneBadge.tsx](../../../src/components/checklist/AllDoneBadge.tsx)
- [src/components/checklist/ChecklistPage.tsx](../../../src/components/checklist/ChecklistPage.tsx)

총 4개 파일.

---

## Critical 이슈 (즉시 수정 완료)

없음. 4개 파일 모두 타입 안전성·보안·런타임 안정성 측면에서 즉시 수정이 필요한 결함이 없습니다.

> 참고: write-e2e-tests 단계에서 발견된 zustand `persist` hydration 실패 후 `hasHydrated()`가 `false`로 영구 고정되는 결함은 이미 같은 단계에서 [src/store/createChecklistStore.ts:56-69](../../../src/store/createChecklistStore.ts#L56-L69)에 `setState` + `persist.rehydrate()` 패턴으로 수정되었고 14/14 e2e 통과로 검증됨.

---

## Warning (수정 권장)

### 1. ChecklistPage.tsx — `handleToggle` 디펜던시의 raw `checkedIds` 사용으로 GA4 보고 정확도 저하 가능
- **위치**: [src/components/checklist/ChecklistPage.tsx:131](../../../src/components/checklist/ChecklistPage.tsx#L131)
- **문제**: `const willCheck = !checkedIds.includes(item.id);`는 raw store 값(`checkedIds`)을 읽습니다. `effectiveCheckedIds`(hydration 가드 적용)를 쓰지 않아, hydration이 완료되지 않은 순간에 사용자가 빠르게 클릭하면 GA4 `checklist_check.checked` 파라미터가 실제 사용자 인지와 다르게 보고될 수 있습니다. 빈도는 낮지만 측정 데이터 오염 가능성 존재.
- **권장 수정**: `const willCheck = !effectiveCheckedIds.includes(item.id);`로 변경하고 deps도 `effectiveCheckedIds` 기준으로 갱신. 단, `effectiveCheckedIds`는 `useMemo` 결과라 deps가 더 잦게 변하지 않음.

### 2. ChecklistPage.tsx — 인라인 화살표 함수가 `ChecklistItemRow` props로 매 렌더 새로 생성
- **위치**: [src/components/checklist/ChecklistPage.tsx:215-220](../../../src/components/checklist/ChecklistPage.tsx#L215-L220)
- **문제**: `onToggle={() => handleToggle(item)}`, `onStartEdit={() => startEdit(item)}` 등 5개 핸들러가 모두 인라인 화살표. `ChecklistItemRow`는 `React.memo`가 아니라 어차피 재렌더되지만, 향후 메모이제이션 도입 시 props 동일성이 깨져 효과가 사라집니다. 본 PR 범위 외(기존 패턴 그대로 유지) — refactor 단계에서 검토.
- **권장 수정**: 옵션 1) `ChecklistItemRow`를 `React.memo`로 감싸고 핸들러를 `useCallback`으로 정리. 옵션 2) `ChecklistItemRow`가 직접 `id`를 받아 부모 콜백을 호출.

### 3. AllDoneBadge.tsx — `<div aria-label>` + 텍스트 중복 — 스크린리더가 라벨만 읽고 텍스트 무시할 가능성
- **위치**: [src/components/checklist/AllDoneBadge.tsx:5-12](../../../src/components/checklist/AllDoneBadge.tsx#L5-L12)
- **문제**: `<div aria-label="모든 항목 완료">` 안에 `<span>모든 항목을 챙기셨어요</span>` 텍스트가 있습니다. ARIA 사양상 `aria-label`이 있는 컨테이너는 자식 텍스트를 무시하므로 스크린리더가 "모든 항목 완료"만 읽고 의도된 부드러운 카피("챙기셨어요")를 못 듣습니다. designer 페르소나 톤(따뜻한 어조)이 약화될 수 있음.
- **권장 수정**: `aria-label`을 제거하거나, 컨테이너 div에서 빼고 시각 라벨 용도(테스트 셀렉터)는 다른 방법(예: `data-testid`)으로 분리.

---

## Suggestion (개선 아이디어)

### 1. createChecklistStore.ts — `initFromLocalStorage` 데드 코드
- **위치**: [src/store/createChecklistStore.ts:46-48](../../../src/store/createChecklistStore.ts#L46-L48)
- 함수 본문이 주석뿐인 no-op. 외부에서 호출하는 곳 없음. 본 PR 범위 외(기존 코드)지만 다음 store 정리 시 제거 가능.

### 2. ChecklistEmptyState.tsx / AllDoneBadge.tsx — `style={{ wordBreak: "keep-all" }}` 인라인 스타일
- Tailwind 3.4+에는 `break-keep` 유틸리티가 있어 inline style 없이 `className="break-keep"`로 대체 가능. 타 컴포넌트도 같은 패턴이라 일괄 정리 가치는 낮지만, 신규 컴포넌트는 적용 가치 있음.

### 3. AllDoneBadge.tsx — `style={{ color: "var(--accent-green)" }}` 인라인 → `text-accent-green` 토큰
- globals.css `@theme inline`에 `--color-accent-green` 매핑이 있어 `text-accent-green` Tailwind 유틸리티로 가능. DESIGN.md §2.3의 토큰 일관성 정합.

### 4. ChecklistPage.tsx — 토스트 액션 `onClick` 클로저가 `router.push` 직접 호출
- 토스트가 dismiss된 후에도 클릭 가능한 짧은 시간 윈도우가 있어, 사용자 인터랙션 추적(GA4)이 약간 늦거나 누락될 수 있음. `sendGAEvent("empty_state_action_click", {case: "all_done"})` 한 줄을 §1.8 J 합류 시 함께 박는 것을 검토.

### 5. ChecklistPage.tsx — Anchor scroll target에 `tabIndex={-1}` + `focus()` 미적용
- `[둘러보기]` CTA 탭 시 `scrollIntoView`만 호출. 키보드 사용자에게는 포커스 이동이 더 명확. `target.focus({ preventScroll: false })`를 추가하면 a11y 경험이 개선됨. 단, 첫 항목으로 직접 포커스 이동하는 게 더 자연스러우므로 refactor 시 재고려.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 (수정 권장 — refactor 단계 후보) |
| Suggestion | 5건 |
| 빌드 | 미실행(Critical 없음) |

전반적으로 spec.md / design.md / review.md 결정사항을 정합하게 구현했고, 카피·CTA 위배 없음. WCAG 색대비, role 시맨틱, prefers-reduced-motion 모두 충족. 다크 패턴 회피(가짜 진행률·외부 광고 위장 없음, 부드러운 톤) 기준 통과.

다음 단계로 `/refactor` 시 Warning 1·2·3을 우선 검토 권장.
