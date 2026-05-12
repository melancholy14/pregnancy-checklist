# design-bundle-k-delete-pattern

> 작성일: 2026-05-10 | 작성자: Claude Code

## 개요

사용자 입력 데이터 3영역(체크리스트 커스텀 항목·타임라인 노트·체중 로그)의 삭제 패턴을 sonner `toast.action` 기반 **undo-toast**로 통일했다. AlertDialog confirm 호출부 2개와 `DeleteConfirmDialog` 컴포넌트를 제거하고, weight의 즉시 삭제도 7초 회복 창이 있는 undo 패턴으로 흡수. 신설 훅 `useDeleteWithUndo<T>`로 호출부 3개를 일관 처리하고, 향후 새 사용자 입력 데이터 영역 추가 시 자동 적용 룰을 만든다.

관련 문서: [spec](../features/design-bundle-k-delete-pattern/spec.md) · [design](../features/design-bundle-k-delete-pattern/design.md) · [review (페어)](../features/design-bundle-k-delete-pattern/review.md)

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `npm run build` 성공 + 호출부 3영역 `useDeleteWithUndo` 훅 사용 + TS 에러 0 | ✅ | weight·checklist·timeline 모두 훅 사용 |
| `DeleteConfirmDialog.tsx` 파일 삭제 + import 정리 | ✅ | grep 결과 잔존 0 |
| `Toaster visibleToasts={3}` 추가 | ✅ | `src/app/layout.tsx:62` |
| 사용자 시나리오 1·2·3 E2E (X 클릭 → 토스트 → 되돌리기 → 복원) | ✅ | 본 라운드 e2e에서 추가 |
| 시나리오 5 E2E (X 클릭 → 새로고침 → 영구 삭제) | ✅ | UI add 기반으로 시드 회피 |
| GA4 신규 이벤트 0건 | ✅ | analytics 호출 추가 0 |
| phase-4.5.md §2.9 Cross-11·§2.10 묶음 K 상태 갱신 | ⏭ | 운영자 수동 |

### 생성/수정 파일

- **신규**: `src/lib/hooks/useDeleteWithUndo.ts` — `useDeleteWithUndo<T>` 훅 + `restoreAtIndex<T>(store, item, atIndex)` 유틸 export.
- **수정**: `src/app/layout.tsx` (Toaster props), `src/components/checklist/ChecklistRow.tsx` (Trash2 인라인 버튼), `src/components/checklist/ChecklistPage.tsx`, `src/components/timeline/WeekChecklistSection.tsx`, `src/components/timeline/TimelineAccordionCard.tsx`, `src/components/weight/WeightContainer.tsx` — 호출부 wiring.
- **삭제**: `src/components/timeline/DeleteConfirmDialog.tsx` — 컴포넌트 자체 제거.

### 주요 결정 사항

- **atIndex 복원은 호출부 책임 + `restoreAtIndex` 유틸**: spec K-2 결정에 따라 zustand store schema·시그니처 변경 0. 호출부의 restoreFn이 `restoreAtIndex<T>(store, item, atIndex)`로 splice 복원. P5 schema versioning deferred 정합.
- **트리거 onClick 시점에 atIndex 계산**: store 상태 변동 가능성 대응 — 클릭 직전 `customItems.findIndex` 또는 `useStore.getState().customItems.findIndex`로 계산. `restoreAtIndex` 내부에서 `Math.min(Math.max(atIndex, 0), length)`로 clamp.
- **클로저 기반 임시 보관**: spec M1 "React state로 deleted item 임시 보관"의 의도를 클로저로 충족. 트리거 호출마다 새 클로저 생성 → 다중 토스트 동시 발생 시 각 독립.
- **timeline 삭제 버튼은 인라인 Trash2**: TimelineAccordionCard는 한 호출부라 인라인 처리. ChecklistRow는 다중 호출 컨텍스트라 컴포넌트 내부에서 onRemove 직결.

### 가정 사항 및 미구현 항목

- (가정) 토스트 사라지면 영구 삭제 = 사용자 멘탈 모델. 새로고침 시 undo 불가는 의도된 동작.
- (가정) 본 묶음 범위 = 사용자 입력 데이터 3영역. 정적 데이터(아티클·베이비페어·시스템 체크리스트)는 범위 외.
- (미구현) **`item_delete_undo` GA4 이벤트** — spec should, won't로 분리 (별도 라운드).
- (미구현) **시각 마감 검증 (모바일 토스트 폭, "되돌리기" 터치 타겟 ≥40px)** — design §7 사항, dev 서버 시각 확인 후 sonner config 갱신 검토 권장.

---

## 코드 리뷰 결과

### Critical 이슈

없음. 타입 안전성·성능·보안·접근성 4축 검토 결과 사용자에게 즉시 피해를 주거나 런타임 크래시 유발 항목 0건.

### Warning (수정 권장 → 리팩토링에서 모두 해결)

1. **인라인 restoreFn이 매 렌더 새 인스턴스** (ChecklistPage·WeekChecklistSection·TimelineAccordionCard) — `useDeleteWithUndo` 트리거 식별자가 매 렌더 변경. 패턴 확산 시 회귀 가능 → **리팩토링에서 `useCallback`으로 메모이제이션 완료**.
2. **`useStore.setState` 호출부 직접 호출 중복** — 같은 splice 로직이 3곳 복제 → **리팩토링에서 `restoreAtIndex<T>` 유틸로 추출 완료**.
3. **`as ChecklistItem` / `as TimelineItem` 타입 단언** — TS escape hatch → **리팩토링에서 유틸 제네릭 추론으로 단언 제거 완료**.

### Suggestion (미진행)

1. `aria-label="삭제"`의 컨텍스트 부족 — 항목명 포함 라벨 검토. design.md 권장사항.
2. TimelineAccordionCard onClick 인라인 가독성 — 핸들러 추출 검토.
3. `useDeleteWithUndo<T extends { id: string }>`로 시그니처 단순화 — 훅 public interface 변경, 별도 결정 필요.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 (모두 리팩토링에서 해결) |
| Suggestion | 3건 (미진행, 별도 라운드) |

---

## 리팩토링 내용

### 작업 목록

1. **`useDeleteWithUndo.ts` — `restoreAtIndex<T>` 유틸 export 추가**. `CustomItemsStore<T>` 구조적 인터페이스로 zustand 스토어 의존성 회피. splice + clamp 로직 1곳 집중.
2. **ChecklistPage·WeekChecklistSection·TimelineAccordionCard — restoreFn 메모이제이션 + 유틸 사용 + `as` 제거**. 각 컴포넌트에서 restoreFn을 `useCallback`으로 추출, `restoreAtIndex<T>(store, rest, atIndex)` 한 줄 호출로 단순화. TS가 `Omit<A & { atIndex }, "atIndex">`를 `A`로 정확히 추론하므로 단언 불필요.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 4개 | 4개 (helper export 추가) |
| splice/clamp 로직 위치 | 3곳 (호출부) | 1곳 (`restoreAtIndex`) |
| 인라인 restoreFn | 3곳 | 0곳 (모두 useCallback) |
| `as` 타입 단언 | 3건 | 0건 |
| `useDeleteWithUndo` 트리거 식별자 | 매 렌더 변경 | 안정 (deps 모두 stable) |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path — undo 토스트로 복원 (weight·checklist·timeline 3건) | ✅ 3개 passed |
| Error / Edge — 다중 토스트 + 영구 삭제 (시나리오 4·5) | ✅ 2개 passed |
| 권한 / 인증 | — (정적 사이트, 인증 흐름 없음) |
| 반응형 (Mobile 375px) | ✅ 1개 passed |
| **전체** | **6 passed / 0 failed (8.5s)** |

부수 작업: `e2e/timeline.spec.ts:48`의 기존 "커스텀 항목은 삭제할 수 있다" 테스트가 AlertDialog 클릭을 가정하고 있어 새 undo 패턴으로 패치.

📊 상세 리포트: `playwright-report/index.html`

---

## 관련 문서

- [구현 (impl)](../implementation/design-bundle-k-delete-pattern-impl.md)
- [코드 리뷰 (review)](../review/design-bundle-k-delete-pattern-review.md)
- [리팩토링 (refactor)](../refactor/design-bundle-k-delete-pattern-refactor.md)
- [기능 스펙 (spec)](../features/design-bundle-k-delete-pattern/spec.md)
- [디자인 (design)](../features/design-bundle-k-delete-pattern/design.md)
