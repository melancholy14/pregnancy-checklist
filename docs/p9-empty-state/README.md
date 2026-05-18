# P9 빈 상태 카피·CTA

> 작성일: 2026-05-07 | 작성자: Claude Code
> spec / design / review: [docs/features/p9-empty-state/](../features/p9-empty-state/)

## 개요

체크리스트 페이지의 4종 빈 상태(첫 방문 / 모두 완료 / 마이그레이션 손실 / custom만) 카피·CTA·시안을 명세대로 구현. 도메인 톤(임산부 민감 시기, 부드러운 어조)과 다크 패턴 회피(가짜 진행률·외부 광고 위장 금지)를 동시에 충족하면서, §1.5 `empty_state_view` 측정 항목 도입을 위한 컴포넌트 마운트 hook 위치를 박았다. GA4 이벤트 코드는 §1.8 묶음 J에서 별도 도입 예정.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 빈 상태 컴포넌트 신규 (case prop 분기: first_visit / migration_lost / custom_only) | ✅ | `ChecklistEmptyState.tsx` |
| 모두 완료 헤더 격려 텍스트 — mint 토큰 | ✅ | `AllDoneBadge.tsx` (mint/40 + accent-green) |
| 모두 완료 토스트 — 같은 슬러그 마운트당 1회 | ✅ | sonner + `allDoneToastEvaluatedRef` 가드 |
| 자동 복구 콜백 (`onRehydrateStorage`) — 실패 시 default state + flag 1회 | ✅ | `setState` + `persist.rehydrate()` 패턴 |
| 카피 정합성 (review.md §5 결정 그대로) | ✅ | 4종 케이스 카피·CTA 변형 0 |
| §1.8 J 합류 unblock 조건 명시 | ✅ | spec.md §3 must 그대로, GA4 코드 미포함 |
| a11y — `role="status"` / `role="alert"` / `aria-live="polite"` | ✅ | 케이스별 시맨틱 구분 |
| 모바일 320px — keep-all 줄바꿈 | ✅ | 각 컴포넌트 적용 |
| 다크 패턴 회피 — destructive·red 토큰 미사용 | ✅ | lavender / peach / mint만 사용 |

### 생성/수정 파일

**신규**
- [src/components/checklist/ChecklistEmptyState.tsx](../../src/components/checklist/ChecklistEmptyState.tsx) — `case` prop 3종 분기. first_visit는 카드 + 둘러보기 CTA, migration_lost는 peach inline alert + 확인 CTA, custom_only는 prose-muted 1줄 안내.
- [src/components/checklist/AllDoneBadge.tsx](../../src/components/checklist/AllDoneBadge.tsx) — 정적 배지, mint/40 배경 + accent-green 텍스트 + Check 아이콘.

**수정**
- [src/store/createChecklistStore.ts](../../src/store/createChecklistStore.ts) — `migrationLostFlag` 상태 + `clearMigrationLost` 액션. `onRehydrateStorage` 에러 분기에서 `queueMicrotask`로 default state 복구 + `persist.rehydrate()`로 hasHydrated 보장. `partialize`로 플래그는 persist 제외(in-session only).
- [src/components/checklist/ChecklistPage.tsx](../../src/components/checklist/ChecklistPage.tsx) — `emptyStateCase` 판정, `allDone` 판정, 1회 토스트 effect, anchor scroll, 첫 체크 시 migrationLost 클리어 wiring.

### 주요 결정 사항

- **InlineToast 컴포넌트 미생성**: 코드베이스에 `sonner` Toaster가 이미 마운트되어 있어 신규 라이브러리 도입 회피. spec.md §3 must "기존 사용 중인 것 활용" 정합.
- **first_visit 카드는 items 위에 렌더, items는 그대로 노출**: design.md §1 "anchor scroll, 라우트 동일 유지" 정합. 사용자 첫 체크 시 `checkedIds.length > 0`이 되어 자동 dismiss.
- **케이스 우선순위**: `migration_lost > first_visit > custom_only`. 데이터 손실은 가장 강한 인지 필요(role="alert").
- **all_done 토스트는 마운트 직후 평가 1회**: spec.md §4 edge "체크 toggle 직후 모두 완료 → 토스트는 다음 마운트까지 미발사" 정합. 세션 중 transition은 헤더 텍스트만 갱신.
- **prefers-reduced-motion 대응**: 토스트 100ms 지연·smooth scroll 모두 reduce 시 즉시 표시·즉시 점프.
- **store ref 캡처**: `onRehydrateStorage` 콜백 실행 시점이 `create()` 반환 후이므로 `queueMicrotask`로 setState를 미뤄 안전 처리.
- **migrationLostFlag persist 제외**: `partialize`로 `checkedIds`·`customItems`만 storage에 기록. 플래그는 세션 내 1회 알림용.
- **migrationLost 클리어 트리거 2개**: [확인] CTA 탭 + 첫 체크 시 자동 (`handleToggle`에서 플래그 검사).
- **AllDoneBadge mint 색**: `text-pastel-mint`는 채도가 낮아 가독성 부족 → `bg-pastel-mint/40` + `var(--accent-green)` 페어 적용. WCAG AA 충족.

### 가정 사항 및 미구현 항목

- P3 글로벌 슬림 배너 미존재 — P9는 빈 상태 카드에 입력 CTA를 박지 않으므로 P3 의존 없이 단독 진행 가능.
- localStorage 차단 환경 — zustand `persist` hydration 자체 미실행 → first_visit으로 분기.
- §1.8 묶음 J 미도입 — GA4 `empty_state_view` 이벤트는 본 PR 범위 밖. 컴포넌트 마운트 hook 위치만 spec.md §3 must대로 박음.
- **미구현**: GA4 `empty_state_view` 이벤트 발사, 모두 완료 별도 빈 상태 시안, 다른 도메인 빈 상태 (정보·체중·타임라인), P10 운영자 가이드.

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

없음. 4개 파일 모두 즉시 수정이 필요한 결함 없음.

> 참고: write-e2e-tests 단계에서 발견된 zustand `persist` hydration 실패 후 `hasHydrated()`가 영구 `false`로 고정되는 결함은 같은 단계에서 [createChecklistStore.ts:56-69](../../src/store/createChecklistStore.ts#L56-L69)에 `setState` + `persist.rehydrate()` 패턴으로 수정됨.

### Warning (수정 권장)

1. **[ChecklistPage.tsx:131](../../src/components/checklist/ChecklistPage.tsx#L131)** — `handleToggle`이 raw `checkedIds` 사용 → GA4 정확도 저하 가능 → 리팩토링에서 수정 완료.
2. **[ChecklistPage.tsx:215-220](../../src/components/checklist/ChecklistPage.tsx#L215-L220)** — `ChecklistItemRow` props로 인라인 화살표 5개 → 본 PR 범위 외(`ChecklistItemRow.memo`화 동반 필요)로 보류.
3. **[AllDoneBadge.tsx:5-12](../../src/components/checklist/AllDoneBadge.tsx#L5-L12)** — `<div aria-label>` + 자식 텍스트 중복 → 트레이드오프(테스트 안정성·시각 카피 보존)로 보류.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 (1건 리팩토링 적용, 2건 보류) |
| Suggestion | 5건 |

상세: [docs/review/p9-empty-state-review.md](../review/p9-empty-state-review.md)

---

## 리팩토링 내용

### 작업 목록

1. **[ChecklistPage.tsx](../../src/components/checklist/ChecklistPage.tsx) — `handleToggle` GA4 willCheck 계산을 `effectiveCheckedIds` 기준으로 통일**
   - **무엇을**: `const willCheck = !checkedIds.includes(item.id);` → `effectiveCheckedIds` 기준으로 변경. `useCallback` deps 동기화.
   - **왜**: hydration이 늦거나 실패한 순간 사용자 클릭이 들어오면 GA4 `checklist_check.checked` 파라미터가 UI 노출 상태와 불일치할 수 있음. `effectiveCheckedIds`는 hydrated 가드를 통과한 값이라 측정 정확도 보장.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 4개 | 4개 |
| 최대 파일 줄 수 | 256줄 (ChecklistPage.tsx) | 256줄 |
| GA4 측정 정확도 | hydration 미반영 가능 | hydration 동기 보장 |

분리·추출 없는 미니멀 리팩토링. 동작 변경 0건, public interface 변경 0건. 빌드 성공 1회 시도.

상세: [docs/refactor/p9-empty-state-refactor.md](../refactor/p9-empty-state-refactor.md)

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 6개 passed (first_visit · scroll · all_done badge·toast · all_done 라우팅 · migration_lost · 확인 dismiss) |
| Error/Validation | ✅ 4개 passed (first_visit dismiss · migration_lost first-check · all_done transition no-toast · custom만 fallback) |
| 권한/인증 | ✅ 1개 passed (인증 게이트 없음 명시) |
| 반응형 (Mobile 375px) | ✅ 3개 passed (first_visit · all_done · migration_lost 가시) |
| **전체** | **14 passed / 0 failed (9.6s)** |

📊 상세 리포트: [playwright-report/index.html](../../playwright-report/index.html)
📄 테스트 파일: [e2e/p9-empty-state.spec.ts](../../e2e/p9-empty-state.spec.ts)

리팩토링 후 동일 14/14 통과 — 동작 변경 없음 확인.
