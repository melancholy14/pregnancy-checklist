# design-bundle-k-delete-pattern 기획서

> 작성일: 2026-05-10  size: M
> 관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- **항목 K-1 결정 (옵션 C)**: 액션 비용 차등 + 전 영역 undo-toast (사용자 입력 데이터 3영역). AlertDialog confirm 호출부 2개 제거 + [DeleteConfirmDialog.tsx](../../../src/components/timeline/DeleteConfirmDialog.tsx) 컴포넌트 자체 삭제. weight 즉시 삭제도 undo-toast로 통일.
- **항목 K-2 결정 (옵션 A)**: undo 데이터 모델 = 메모리 임시 보관 (React state). zustand schema 변경 0.
- **항목 K-3 결정 (옵션 B)**: undo 회복 창 = 7초 (sonner toast.action duration 7000ms).
- **항목 K-4 결정 (옵션 A)**: `src/lib/hooks/useDeleteWithUndo.ts` 신설. 호출부 3개 통일.
- **페어 1 합의**: sonner 라이브러리 추가 0(이미 마운트). 토스트 동시 발생 = `Toaster` `visibleToasts={3}` + FIFO + 별개 발사·독립 undo. 정적 데이터(아티클·베이비페어·시스템 체크리스트)는 본 묶음 범위 외.

## 1. 배경·목적

- **운영자**: phase-4.5.md §2.9 Cross-11·§2.10 묶음 K 미해소 상태 해소. 영역마다 다른 삭제 패턴(checklist/timeline=confirm, weight=즉시) → 사용자 멘탈 모델 부담 + weight 즉시 삭제는 designer N7 "위험 액션 undo 또는 confirm 필수" 위반. 운영자는 신규 사용자 입력 데이터 영역 추가 시 "사용자 입력 데이터 = undo-toast" 룰 자동 적용 가능.
- **사용자**: 짧은 액션(체중 입력 오타 정정)에 confirm 다이얼 마찰 0 — 즉시 삭제와 동등한 시간 비용 + 7초 회복 창. 잘못 삭제 시 토스트 "되돌리기" 클릭으로 복구 가능. 임산부 신체·인지 부담 컨텍스트 고려한 7초 창 (5초보다 김).
- **측정**: GA4 신규 이벤트 0건(spec 단계 결정). undo 행동 측정은 후속 라운드에서 검토 권장 — `item_delete_undo` 가설 별도.

## 2. 사용자 시나리오

- **시나리오 1 (weight log 잘못 입력 정정)**: 사용자 A가 [/weight](src/app/weight/) 일자별 로그 카드의 X 버튼 클릭 → 토스트 노출 "체중 기록을 삭제했어요. 되돌리기" + 7초 카운트다운 → 사용자가 "되돌리기" 클릭 → 로그 복원 + 토스트 dismiss. 시간 비용 = 즉시 삭제와 동등 (X 클릭 1번).
- **시나리오 2 (체크리스트 커스텀 항목 삭제)**: 사용자 B가 [/checklist/<slug>](src/app/checklist/) 본인이 추가한 항목의 삭제 버튼 클릭 → AlertDialog confirm 미노출 → 즉시 토스트 + 7초 창 → 토스트 만료 시 hard delete. 시나리오 1과 동일 패턴.
- **시나리오 3 (timeline 사용자 노트 삭제)**: 사용자 C가 [/timeline](src/app/timeline/) 주차별 본인이 추가한 노트의 삭제 버튼 클릭 → 즉시 토스트 + 7초 창. [DeleteConfirmDialog.tsx](../../../src/components/timeline/DeleteConfirmDialog.tsx) 호출부 제거됨.
- **시나리오 4 (연속 삭제 + 다중 토스트)**: 사용자 D가 weight 로그 3개 연속 X 클릭 → 토스트 3개 동시 표시(`visibleToasts={3}` + FIFO 큐) → 각 토스트 독립 undo 가능 (각자 7초 카운트다운).
- **시나리오 5 (새로고침 시 undo 불가)**: 사용자 E가 X 클릭 → 토스트 노출 → 새로고침 → 토스트 사라짐 + 항목 영구 삭제. 사용자 멘탈 모델 = "토스트 사라지면 끝".

## 3. 기능 요구사항

### must

#### M1. `useDeleteWithUndo<T>` 훅 신설

- [src/lib/hooks/useDeleteWithUndo.ts](src/lib/hooks/useDeleteWithUndo.ts) 신규 파일.
- 시그니처:
  ```ts
  function useDeleteWithUndo<T>(opts: {
    removeFn: (id: string) => void;
    restoreFn: (item: T) => void;
    label: string; // 토스트 메시지 (예: "체중 기록을 삭제했어요")
  }): (item: T & { id: string }) => void;
  ```
- 동작:
  1. 호출 시 `removeFn(item.id)` 즉시 실행 (UI에서 사라짐).
  2. React state로 deleted item을 임시 보관.
  3. `toast(label, { duration: 7000, action: { label: "되돌리기", onClick: () => restoreFn(item) } })` 발사.
  4. 토스트 dismiss 또는 7초 만료 시 hard delete 확정 — restore 함수 호출 안 함, 보관된 item state cleanup.
- 새로고침/탭 이동 시 React state 소멸 → undo 불가. 사용자 멘탈 모델 일치.

#### M2. checklist 호출부 적용

- [src/components/checklist/ChecklistItemRow.tsx](src/components/checklist/ChecklistItemRow.tsx) 사용자 추가 항목 삭제 액션을 `useDeleteWithUndo`로 교체. 기존 confirm 다이얼 트리거 제거.
- store: [useChecklistStore](src/store/useChecklistStore.ts) 또는 슬러그별 factory의 `removeCustomItem`·`addCustomItem`을 `removeFn`·`restoreFn`로 wiring.
- restore 시 항목 위치(원래 인덱스) 복원 — store의 `addCustomItem`이 항목을 끝에 추가하면 위치 손실. **위치 보존 옵션**: `addCustomItem(item, atIndex)` 시그니처 확장 또는 restore 시 `atIndex` 복원. 본 라운드는 후자 (호출부 책임).

#### M3. timeline 호출부 적용

- [src/components/timeline/WeekChecklistSection.tsx](src/components/timeline/WeekChecklistSection.tsx) 사용자 노트 삭제 액션을 `useDeleteWithUndo`로 교체.
- store: [useTimelineStore](src/store/useTimelineStore.ts)의 사용자 노트 add/remove를 wiring.
- [src/components/timeline/DeleteConfirmDialog.tsx](src/components/timeline/DeleteConfirmDialog.tsx) **컴포넌트 자체 삭제**. import 정리.

#### M4. weight 호출부 적용

- [src/components/weight/WeightContainer.tsx:93-100](src/components/weight/WeightContainer.tsx#L93-L100) X 버튼 onClick을 `useDeleteWithUndo`로 교체.
- store: [src/store/useWeightStore.ts](src/store/useWeightStore.ts)의 `removeLog`·`addLog`를 wiring. addLog는 정렬을 자동 유지하므로 위치 보존 자연 처리.
- 호버 노출(`opacity-0 group-hover:opacity-100`) 정책은 design.md 결정에 따름.

#### M5. Toaster 설정 갱신

- [src/app/layout.tsx:62](src/app/layout.tsx#L62) `<Toaster>` props에 `visibleToasts={3}` 추가. 기존 props(`position="top-center" richColors theme="light"`) 유지.
- 토스트 큐 정책 = sonner default FIFO. 동일 액션 연속 발사 시 토스트 별개 인스턴스, 병합 X.

### should

- **`item_delete_undo` GA4 이벤트 검토**: undo 클릭 시 발사 가설. 본 라운드 won't — marketer 측정 모델 검토 필요. spec 단계 결정 후 별도 라운드.
- **토스트 카피 톤 검토**: "되돌리기" 라벨 외 카피("체중 기록을 삭제했어요" 등) content persona 검토 1회. 본 라운드 카피는 design.md에 박힘 — 후속 라운드에서 갱신 가능.

### won't (이번 범위 밖)

- **AlertDialog confirm 패턴 자체 폐기** — 정적 데이터(시스템 체크리스트 항목 삭제 등) 영역에서 향후 confirm 필요할 수 있음. 본 묶음은 사용자 입력 데이터 3영역만.
- **soft delete (zustand store schema `_deletedAt`)** — review.md K-2=A 결정. 새로고침 후 undo는 미지원.
- **백엔드 백업·계정 동기화** — 정적 사이트, 본 라운드 범위 외.
- **GA4 `item_delete_undo` 이벤트 신설** — should로 분리.

## 4. 예외·엣지 케이스

- **연속 삭제 시 토스트 큐 초과 (4개 이상)**: `visibleToasts={3}` 초과 시 가장 오래된 토스트 dismiss → hard delete 확정. 사용자 의도 = "빠른 다중 삭제" 가설, undo 포기 자연스러움.
- **restore 시점에 store 변경 충돌**: 사용자가 X 누르고 토스트 활성 상태에서 다른 항목 추가 → restore 시 인덱스 복원 시도 → 인덱스 범위 초과 가능. fallback = 끝에 추가. 호출부에서 안전 처리 의무.
- **토스트 dismiss 후 새로고침**: hard delete 이미 확정. 새로고침 영향 없음.
- **localStorage 영향**: zustand persist는 store 변경 직후 자동 동기화. 즉시 삭제 = persist에 즉시 반영. restore 시 다시 persist 동기화.
- **새로고침 중 undo 시도**: 토스트 사라지면 React state 소멸 → undo 불가. UX = "토스트 끝 = 영구". 시나리오 5 정합.

## 5. 성공 기준

- **기능 동작**:
  - `pnpm build` 성공 + 호출부 3개 모두 `useDeleteWithUndo` 훅 사용 + TypeScript 타입 에러 0.
  - [DeleteConfirmDialog.tsx](src/components/timeline/DeleteConfirmDialog.tsx) 파일 삭제 + 모든 import 정리.
  - 사용자 시나리오 1·2·3 각각 e2e 케이스 1건씩 추가 — X 클릭 → 토스트 → "되돌리기" 클릭 → 항목 복원 검증.
  - 시나리오 5 e2e — X 클릭 → 새로고침 → 항목 영구 삭제 검증.
- **측정 지표**: GA4 신규 이벤트 0건. 측정 변경 없음.
- **사용자 경험**: design.md 와 일치 — 토스트 시각 토큰(richColors 정합 검증), 7초 카운트다운 시각 표시, 호버 노출 정책 일관성.
- **SoT 정합**: phase-4.5.md §2.9 Cross-11 + §2.10 묶음 K 상태 "✅ 완료"로 갱신 (운영자 수동, 본 라운드 산출 후).
