# design-bundle-k-delete-pattern Implementation

> 작성일: 2026-05-10
> 관련 스펙: [spec.md](../features/design-bundle-k-delete-pattern/spec.md)
> 관련 디자인: [design.md](../features/design-bundle-k-delete-pattern/design.md)
> 관련 리뷰: [review.md](../features/design-bundle-k-delete-pattern/review.md)

## 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `npm run build` 성공 + 호출부 3영역 `useDeleteWithUndo` 훅 사용 + TS 에러 0 | ✅ | weight·checklist·timeline 호출부 모두 훅 사용. build 통과. |
| `DeleteConfirmDialog.tsx` 파일 삭제 + import 정리 | ✅ | 파일 삭제. `ChecklistRow.tsx`·`TimelineAccordionCard.tsx`의 import·사용처 제거. grep 결과 0. |
| `Toaster` `visibleToasts={3}` 추가 | ✅ | `src/app/layout.tsx:62`. |
| 사용자 시나리오 1·2·3 E2E (X 클릭 → 토스트 → 되돌리기 → 복원) | ⏭ | 본 단계 범위 외. `/write-e2e-tests` 단계에서 작성. |
| 시나리오 5 E2E (X 클릭 → 새로고침 → 영구 삭제) | ⏭ | 본 단계 범위 외. |
| GA4 신규 이벤트 0건 | ✅ | analytics 호출 추가 0. |
| phase-4.5.md §2.9 Cross-11·§2.10 묶음 K 상태 갱신 | ⏭ | 운영자 수동 (산출 후). |

## 생성/수정 파일 목록

### 신규

- [src/lib/hooks/useDeleteWithUndo.ts](../../src/lib/hooks/useDeleteWithUndo.ts) — 제너릭 훅. `removeFn`/`restoreFn`/`label` 받아 `(item) => void` 트리거 반환. 7000ms `toast.action` 발사 + 클로저로 item 임시 보관. `useRef`로 opts 최신화 + `useCallback`으로 트리거 안정 식별자 유지.

### 수정

- [src/app/layout.tsx](../../src/app/layout.tsx) — `<Toaster>`에 `visibleToasts={3}` 추가. 기존 props 유지.
- [src/components/checklist/ChecklistRow.tsx](../../src/components/checklist/ChecklistRow.tsx) — `DeleteConfirmDialog` import 제거 + `Trash2` 직접 사용. 삭제 버튼이 `onRemove` 즉시 호출(confirm 다이얼 없음). 시각 토큰·`iconSize=14`·`aria-label="삭제"` 유지.
- [src/components/checklist/ChecklistPage.tsx](../../src/components/checklist/ChecklistPage.tsx) — `useDeleteWithUndo<ChecklistItem & { atIndex: number }>` 셋업. `onRemove`에서 `customItems.findIndex`로 atIndex 계산 후 트리거. `restoreFn`은 `useStore.setState`로 splice 복원 (스토어 시그니처 변경 없음, 호출부 책임).
- [src/components/timeline/WeekChecklistSection.tsx](../../src/components/timeline/WeekChecklistSection.tsx) — 동일 패턴(`useChecklistStore` 대상). `atIndex`는 `useChecklistStore.getState().customItems`에서 계산.
- [src/components/timeline/TimelineAccordionCard.tsx](../../src/components/timeline/TimelineAccordionCard.tsx) — `DeleteConfirmDialog` 사용처 제거 + `Trash2` 인라인 버튼으로 교체. `useDeleteWithUndo<TimelineItem & { atIndex: number }>` 셋업. `restoreFn`은 `useTimelineStore.setState` splice. 라벨 "타임라인 노트를 삭제했어요".
- [src/components/weight/WeightContainer.tsx](../../src/components/weight/WeightContainer.tsx) — 직접 `removeLog(entry.id)` 호출을 `handleDeleteLog(entry)`로 교체. `addLog`가 자동 정렬하므로 위치 보존 자연 처리(atIndex 불필요). X 버튼 `aria-label` 명확화("체중 기록 삭제").

### 삭제

- `src/components/timeline/DeleteConfirmDialog.tsx` — 호출부 0(grep 검증). 파일 제거.

## 주요 결정 사항

- **atIndex 복원은 호출부 책임 + setState splice**: spec K-2/위치 보존 단락의 "본 라운드는 후자 (호출부 책임)" 결정을 따름. `addCustomItem` 시그니처 확장(옵션 A)을 피하고, 호출부의 `restoreFn`에서 zustand `useStore.setState((s) => ({ customItems: [...slice, item, ...slice] }))` splice로 처리. 스토어 schema·시그니처 변경 0 → P5 schema versioning deferred 정책 정합.
- **트리거 onClick 시점에 atIndex 계산**: 컴포넌트 렌더 사이클에서 store 상태 변동(다른 항목 추가/삭제)이 일어날 수 있으므로 atIndex는 `useStore.getState()` 또는 `customItems` 클로저로 클릭 직전 계산. 인덱스 범위 초과 시 `Math.min(Math.max(atIndex, 0), customItems.length)`로 clamp — spec §4 엣지 케이스 "restore 시점에 store 변경 충돌" 대응.
- **hook은 클로저 기반, 별도 React state 사용 X**: spec M1 "React state로 deleted item을 임시 보관"의 의도(메모리 임시 보관, store schema 외부)를 클로저로 충족. 트리거 호출마다 새 클로저 생성 → 다중 토스트 동시 발생 시 각 토스트 독립. spec §4 "여러 토스트 동시 발생" 정합. 새로고침 시 클로저 소멸 → undo 불가, 사용자 멘탈 모델 일치.
- **`removeCustomItem` 임포트 유지**: 인라인 호출 0이지만 훅의 `removeFn: removeCustomItem`에서 사용. unused 경고 없음.
- **timeline `DeleteConfirmDialog` 교체 시 Trash2 인라인**: ChecklistRow는 별도 컴포넌트로 트래시 버튼 노출하나 TimelineAccordionCard는 한 호출부만이라 인라인 처리. spec/design §6 호버 노출 정책은 본 묶음 변경 0(weight만 호버 노출 유지, checklist/timeline은 변경 0 — 기존과 동일).

## 가정 사항

- (spec) 토스트 사라지면 영구 삭제 = 사용자 멘탈 모델. 새로고침 시 undo 불가는 의도된 동작.
- (spec) 사용자 입력 데이터 3영역만 대상. 정적 데이터(아티클·베이비페어·시스템 체크리스트)는 본 묶음 범위 외.
- (구현) `useChecklistStore.setState`/`useTimelineStore.setState`로 호출부에서 직접 splice — zustand 권장 패턴 외 사용. 후속 라운드에서 `addCustomItem(item, atIndex)` 시그니처 확장으로 정리 가능.
- (구현) sonner default `toast()` 호출이 success/info 색을 자동 결정 — richColors=true에서도 default 토스트는 chrome 톤. design §4 "토스트 컨테이너·텍스트 톤: sonner default + richColors 패턴" 정합 가정. 시각 검증은 dev 서버 확인 권장.

## 미구현 항목

- **E2E 시나리오 1·2·3·5**: spec §5 명시 — 본 implement 단계 범위 외, `/write-e2e-tests` 단계에서 작성.
- **`item_delete_undo` GA4 이벤트**: spec should 영역 — won't로 분리, 별도 라운드.
- **시각 마감 검증 (모바일 토스트 폭, "되돌리기" 터치 타겟 ≥40px)**: design §7 명시 — dev 서버 확인 후 sonner config 갱신 검토. 본 구현에서는 sonner default 사용.

## 빌드 검증

- `npm run build` → 1회 시도 성공. TypeScript 통과. 정적 페이지 32개 생성.
