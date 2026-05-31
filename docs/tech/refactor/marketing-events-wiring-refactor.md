# marketing-events-wiring 리팩토링

> 작성일: 2026-05-12  대상 리뷰: [docs/review/marketing-events-wiring-review.md](../review/marketing-events-wiring-review.md)

## 리팩토링한 파일 목록

- `src/lib/hooks/useChecklistToggleEvent.ts` (신규)
- `src/components/checklist/ChecklistPage.tsx`
- `src/components/timeline/WeekChecklistSection.tsx`

---

## 작업별 내용

### 1. `useChecklistToggleEvent` hook 신규 추출 — 디바운스+발사 패턴 단일화
- **출처**: 추가 판단 (리뷰의 Warning 3건은 외부 라운드·data-driven 결정·pre-existing이라 본 라운드 즉시 수정 대상 아님)
- **무엇을**: `Map<itemId, timer>` + `setTimeout(...200ms)` + `sendGAEvent("checklist_item_toggle", ...)` + unmount cleanup useEffect 패턴이 ChecklistPage.tsx와 WeekChecklistSection.tsx에 거의 동일하게 중복(각 ~18줄). 두 곳에서 동일 동작하는 hook으로 추출 — 컴포넌트 호출부는 `fireToggleEvent(item, willCheck)` 한 줄로 단축.
- **왜**: catalog §3.B 200ms 디바운스 정의를 한 곳에서 관리. 4주 cleanup 라운드에서 임계치 변경·이벤트명 제거가 발생하면 hook 한 파일만 손대면 됨. 또한 두 호출처가 동일 의미를 갖는다는 점이 코드에서도 명시됨.

### 2. `ChecklistPage.tsx` — 인라인 디바운스 로직 제거
- **출처**: 위 hook 추출에 따른 호출부 정리
- **무엇을**: `toggleDebounceTimersRef` ref + 별도 cleanup useEffect + setTimeout 블록 제거. `useChecklistToggleEvent()` 호출 + `fireToggleEvent(item, willCheck)` 한 줄로 교체.
- **왜**: 컴포넌트가 토글 상태 관리에만 집중하도록. 분석 디바운스는 hook 책임.

### 3. `WeekChecklistSection.tsx` — 동일 패턴 제거
- **출처**: 위 hook 추출에 따른 호출부 정리
- **무엇을**: ChecklistPage와 동일하게 ref/useEffect/setTimeout 블록 제거 + hook 호출로 교체. 더 이상 사용하지 않는 `useEffect`·`useRef` import 제거.
- **왜**: 동일.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 200ms 디바운스 정의 위치 | 2곳 (ChecklistPage, WeekChecklistSection) | 1곳 (useChecklistToggleEvent) |
| 중복 라인 수 | ~36줄 (18 × 2) | ~37줄 hook + 2줄(호출) = -28줄 회로 |
| 컴포넌트 import (WeekChecklistSection) | useCallback, useEffect, useMemo, useRef, useState | useCallback, useMemo, useState |
| 동작 변경 | — | 없음 (cleanup 시점만 컴포넌트 unmount → hook unmount로 동일) |

---

## 빌드 결과

성공 (1회 시도).

## 미처리 Warning 사유

- **`useScrollSignals` over-suppress**: 어느 범위로 click listener를 좁힐지는 4주 grace 데이터(실제 발사 비율) 보고 분기할 사안. 본 라운드 수정 시 측정 결과 자체가 달라져 비교 기준이 흐려짐.
- **`TODO(bundle-O)` 주석 잔류**: spec.md §6.2가 명시 요청한 마커. 묶음 O 라운드에서 일괄 제거 예정.
- **WeightForm 라벨 미연결**: 본 라운드 변경 영역 밖의 사전 이슈. 별도 접근성 라운드에서 처리.
