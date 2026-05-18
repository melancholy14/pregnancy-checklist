# P9 빈 상태 카피·CTA — Implementation

> 구현일: 2026-05-07
> spec: [docs/features/p9-empty-state/spec.md](../features/p9-empty-state/spec.md)
> design: [docs/features/p9-empty-state/design.md](../features/p9-empty-state/design.md)
> review: [docs/features/p9-empty-state/review.md](../features/p9-empty-state/review.md)

## 완료 조건 충족 여부

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

## 생성/수정 파일 목록

### 신규 생성

- [src/components/checklist/ChecklistEmptyState.tsx](../../src/components/checklist/ChecklistEmptyState.tsx) — `case` prop으로 3종 분기. first_visit는 카드 + 둘러보기 CTA, migration_lost는 peach inline alert + 확인 CTA, custom_only는 prose-muted 색 1줄 안내.
- [src/components/checklist/AllDoneBadge.tsx](../../src/components/checklist/AllDoneBadge.tsx) — 모두 완료 헤더 격려 텍스트. mint/40 배경 + accent-green 텍스트 + Check 아이콘.

### 수정

- [src/store/createChecklistStore.ts](../../src/store/createChecklistStore.ts) — `migrationLostFlag` 상태 + `clearMigrationLost` 액션 추가. `onRehydrateStorage` 콜백에서 hydration 에러 캐치 → `queueMicrotask`로 default state 복구 + 플래그 켬. `partialize`로 플래그는 persist 제외(in-session only).
- [src/components/checklist/ChecklistPage.tsx](../../src/components/checklist/ChecklistPage.tsx) — `emptyStateCase` 판정 로직, `allDone` 판정, 1회 토스트 effect, 둘러보기 anchor scroll, 첫 체크 시 migrationLost 플래그 클리어 통합.

### 미수정 (의도)

- `src/components/checklist/ChecklistHub.tsx` — review.md §5 결정상 hub는 빈 상태·all_done 대상 아님. hub는 항상 3개 카드 노출.

## 주요 결정 사항

- **InlineToast 컴포넌트 미생성**: design.md는 "외부 라이브러리 추가 회피, 기존 패턴 부재 시" 신규 도입을 명시. 코드베이스에 `sonner` Toaster가 [src/app/layout.tsx](../../src/app/layout.tsx#L62)에 이미 마운트되어 있어 sonner를 활용. spec.md §3 must "기존 사용 중인 것 활용" 조건 정합.
- **first_visit 카드는 items 위에 렌더, items는 그대로 노출**: design.md §1 플로우의 "[둘러보기] 탭 → 페이지 내 항목 리스트로 스크롤·전환 (라우팅 변경 X)" 정합. 빈 상태 카드가 items를 대체하지 않고, anchor `#checklist-items`로 스크롤. 사용자가 첫 체크하면 `checkedIds.length > 0`이 되어 자동으로 빈 상태 사라짐.
- **케이스 우선순위**: `migration_lost > first_visit > custom_only`. 데이터 손실은 가장 강한 인지 필요(role="alert"), first_visit는 체크·custom 모두 0개, custom_only는 base=0 && custom≥1. spec.md §4 edge case "기본 0 + custom 0 = first_visit"도 자연스럽게 충족.
- **all_done 토스트는 마운트 직후 평가 1회**: spec.md §4 edge case "체크 toggle 직후 모두 완료 → 토스트는 다음 마운트까지 미발사"를 위해 `allDoneToastEvaluatedRef`를 hydration 완료 직후 1회만 평가하도록 설계. 세션 중 all_done 전환은 헤더 텍스트만 갱신, 토스트 미발사. 페이지 재진입(언마운트→마운트) 시 ref 초기화로 다시 평가.
- **prefers-reduced-motion 대응**: 토스트 100ms 지연·스크롤 smooth 동작을 reduce 시 모두 제거(즉시 표시·즉시 점프). design.md §4 정합.
- **store ref 캡처 방식**: `onRehydrateStorage` 콜백 실행 시점이 `create()` 반환 후이므로 `queueMicrotask`로 setState를 미뤄 안전 처리. `let` 캐시 변수 없이 `const store` 클로저 캡처로 깔끔하게 해결.
- **migrationLostFlag persist 제외**: `partialize`로 `checkedIds`·`customItems`만 storage에 기록. 플래그는 세션 내 1회 알림용. 다음 방문 시 hydration 성공이면 플래그 미설정 → 정상 렌더, 또 실패하면 다시 켜짐.
- **migrationLost 클리어 트리거 2개**: [확인] CTA 탭 + 첫 체크 시 자동(`handleToggle`에서 플래그 검사). spec.md §4 "CTA 탭 또는 첫 체크 시 alert 사라짐" 정합.
- **AllDoneBadge mint 색**: `text-pastel-mint` 토큰은 텍스트 색으로 채도가 낮아 가독성 떨어짐 → DESIGN.md §2.3 표대로 `bg-pastel-mint` + `var(--accent-green)` 텍스트 페어 적용. WCAG AA 충족.

## 가정 사항

- **P3 글로벌 슬림 배너 미존재**: 코드베이스 grep 결과 P3 슬림 배너 컴포넌트는 아직 미구현. P9는 spec.md대로 입력 CTA를 빈 상태에 박지 않으므로 P3 의존 없이 단독 진행 가능. P3 도입 후 추가 변경 불필요(P3가 자체 페이지 헤더에 마운트).
- **체크리스트 hub(`/checklist`) 라우트 존재**: all_done 토스트 액션 `[둘러보기]`가 `router.push("/checklist")`로 이동. `app/checklist/page.tsx`가 이미 존재하므로 동작 보장.
- **localStorage 차단 환경**: zustand `persist`는 localStorage 차단 시 hydration 자체를 시도하지 않거나 에러 없이 빈 상태로 종료 → migration_lost 미트리거. spec.md §4 edge case 정합("first_visit으로 분기").
- **§1.8 묶음 J 미도입**: GA4 `empty_state_view` 이벤트는 본 PR 범위 밖. 빈 상태 컴포넌트 마운트 hook 위치는 spec.md §3 must대로 component 마운트 시점에 그대로 유지 — §1.8 J 작업 시 `useEffect` 안에 `sendGAEvent("empty_state_view", { case, page })` 1줄 추가만으로 합류 가능.

## 미구현 항목

- **GA4 `empty_state_view` 이벤트 발사**: spec.md §3 won't / 4.5=B 결정대로 §1.8 묶음 J 작업 범위. 본 PR 범위 외.
- **모두 완료 별도 빈 상태 시안**: review.md §5 4.2 결정대로 미도입(헤더 텍스트 + 토스트로 한정).
- **다른 도메인 빈 상태 (정보 탭·체중·타임라인)**: spec.md §3 won't — 별도 결정 항목.
- **P10 운영자 가이드 (deprecated 플래그 룰)**: 의존성만 명시, 본 PR 범위 외.
