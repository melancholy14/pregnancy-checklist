# design-bundle-k-delete-pattern

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-05-10
> plan: [spec](../../features/design-bundle-k-delete-pattern/spec.md) · [design](../../features/design-bundle-k-delete-pattern/design.md)

<!-- STEP:impl -->
## 구현

> 작성일: 2026-05-10
> 관련 스펙: [spec.md](../../features/design-bundle-k-delete-pattern/spec.md)
> 관련 디자인: [design.md](../../features/design-bundle-k-delete-pattern/design.md)
> 관련 리뷰: [review.md](../../features/design-bundle-k-delete-pattern/review.md)

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `npm run build` 성공 + 호출부 3영역 `useDeleteWithUndo` 훅 사용 + TS 에러 0 | ✅ | weight·checklist·timeline 호출부 모두 훅 사용. build 통과. |
| `DeleteConfirmDialog.tsx` 파일 삭제 + import 정리 | ✅ | 파일 삭제. `ChecklistRow.tsx`·`TimelineAccordionCard.tsx`의 import·사용처 제거. grep 결과 0. |
| `Toaster` `visibleToasts={3}` 추가 | ✅ | `src/app/layout.tsx:62`. |
| 사용자 시나리오 1·2·3 E2E (X 클릭 → 토스트 → 되돌리기 → 복원) | ⏭ | 본 단계 범위 외. `/write-e2e-tests` 단계에서 작성. |
| 시나리오 5 E2E (X 클릭 → 새로고침 → 영구 삭제) | ⏭ | 본 단계 범위 외. |
| GA4 신규 이벤트 0건 | ✅ | analytics 호출 추가 0. |
| phase-4.5.md §2.9 Cross-11·§2.10 묶음 K 상태 갱신 | ⏭ | 운영자 수동 (산출 후). |

### 생성/수정 파일 목록

#### 신규

- [src/lib/hooks/useDeleteWithUndo.ts](../../../src/lib/hooks/useDeleteWithUndo.ts) — 제너릭 훅. `removeFn`/`restoreFn`/`label` 받아 `(item) => void` 트리거 반환. 7000ms `toast.action` 발사 + 클로저로 item 임시 보관. `useRef`로 opts 최신화 + `useCallback`으로 트리거 안정 식별자 유지.

#### 수정

- [src/app/layout.tsx](../../../src/app/layout.tsx) — `<Toaster>`에 `visibleToasts={3}` 추가. 기존 props 유지.
- [src/components/checklist/ChecklistRow.tsx](../../../src/components/checklist/ChecklistRow.tsx) — `DeleteConfirmDialog` import 제거 + `Trash2` 직접 사용. 삭제 버튼이 `onRemove` 즉시 호출(confirm 다이얼 없음). 시각 토큰·`iconSize=14`·`aria-label="삭제"` 유지.
- [src/components/checklist/ChecklistPage.tsx](../../../src/components/checklist/ChecklistPage.tsx) — `useDeleteWithUndo<ChecklistItem & { atIndex: number }>` 셋업. `onRemove`에서 `customItems.findIndex`로 atIndex 계산 후 트리거. `restoreFn`은 `useStore.setState`로 splice 복원 (스토어 시그니처 변경 없음, 호출부 책임).
- [src/components/timeline/WeekChecklistSection.tsx](../../../src/components/timeline/WeekChecklistSection.tsx) — 동일 패턴(`useChecklistStore` 대상). `atIndex`는 `useChecklistStore.getState().customItems`에서 계산.
- [src/components/timeline/TimelineAccordionCard.tsx](../../../src/components/timeline/TimelineAccordionCard.tsx) — `DeleteConfirmDialog` 사용처 제거 + `Trash2` 인라인 버튼으로 교체. `useDeleteWithUndo<TimelineItem & { atIndex: number }>` 셋업. `restoreFn`은 `useTimelineStore.setState` splice. 라벨 "타임라인 노트를 삭제했어요".
- [src/components/weight/WeightContainer.tsx](../../../src/components/weight/WeightContainer.tsx) — 직접 `removeLog(entry.id)` 호출을 `handleDeleteLog(entry)`로 교체. `addLog`가 자동 정렬하므로 위치 보존 자연 처리(atIndex 불필요). X 버튼 `aria-label` 명확화("체중 기록 삭제").

#### 삭제

- `src/components/timeline/DeleteConfirmDialog.tsx` — 호출부 0(grep 검증). 파일 제거.

### 주요 결정 사항

- **atIndex 복원은 호출부 책임 + setState splice**: spec K-2/위치 보존 단락의 "본 라운드는 후자 (호출부 책임)" 결정을 따름. `addCustomItem` 시그니처 확장(옵션 A)을 피하고, 호출부의 `restoreFn`에서 zustand `useStore.setState((s) => ({ customItems: [...slice, item, ...slice] }))` splice로 처리. 스토어 schema·시그니처 변경 0 → P5 schema versioning deferred 정책 정합.
- **트리거 onClick 시점에 atIndex 계산**: 컴포넌트 렌더 사이클에서 store 상태 변동(다른 항목 추가/삭제)이 일어날 수 있으므로 atIndex는 `useStore.getState()` 또는 `customItems` 클로저로 클릭 직전 계산. 인덱스 범위 초과 시 `Math.min(Math.max(atIndex, 0), customItems.length)`로 clamp — spec §4 엣지 케이스 "restore 시점에 store 변경 충돌" 대응.
- **hook은 클로저 기반, 별도 React state 사용 X**: spec M1 "React state로 deleted item을 임시 보관"의 의도(메모리 임시 보관, store schema 외부)를 클로저로 충족. 트리거 호출마다 새 클로저 생성 → 다중 토스트 동시 발생 시 각 토스트 독립. spec §4 "여러 토스트 동시 발생" 정합. 새로고침 시 클로저 소멸 → undo 불가, 사용자 멘탈 모델 일치.
- **`removeCustomItem` 임포트 유지**: 인라인 호출 0이지만 훅의 `removeFn: removeCustomItem`에서 사용. unused 경고 없음.
- **timeline `DeleteConfirmDialog` 교체 시 Trash2 인라인**: ChecklistRow는 별도 컴포넌트로 트래시 버튼 노출하나 TimelineAccordionCard는 한 호출부만이라 인라인 처리. spec/design §6 호버 노출 정책은 본 묶음 변경 0(weight만 호버 노출 유지, checklist/timeline은 변경 0 — 기존과 동일).

### 가정 사항

- (spec) 토스트 사라지면 영구 삭제 = 사용자 멘탈 모델. 새로고침 시 undo 불가는 의도된 동작.
- (spec) 사용자 입력 데이터 3영역만 대상. 정적 데이터(아티클·베이비페어·시스템 체크리스트)는 본 묶음 범위 외.
- (구현) `useChecklistStore.setState`/`useTimelineStore.setState`로 호출부에서 직접 splice — zustand 권장 패턴 외 사용. 후속 라운드에서 `addCustomItem(item, atIndex)` 시그니처 확장으로 정리 가능.
- (구현) sonner default `toast()` 호출이 success/info 색을 자동 결정 — richColors=true에서도 default 토스트는 chrome 톤. design §4 "토스트 컨테이너·텍스트 톤: sonner default + richColors 패턴" 정합 가정. 시각 검증은 dev 서버 확인 권장.

### 미구현 항목

- **E2E 시나리오 1·2·3·5**: spec §5 명시 — 본 implement 단계 범위 외, `/write-e2e-tests` 단계에서 작성.
- **`item_delete_undo` GA4 이벤트**: spec should 영역 — won't로 분리, 별도 라운드.
- **시각 마감 검증 (모바일 토스트 폭, "되돌리기" 터치 타겟 ≥40px)**: design §7 명시 — dev 서버 확인 후 sonner config 갱신 검토. 본 구현에서는 sonner default 사용.

### 빌드 검증

- `npm run build` → 1회 시도 성공. TypeScript 통과. 정적 페이지 32개 생성.

---

<!-- STEP:review -->
## 코드 리뷰

> 작성일: 2026-05-10
> 관련 스펙: [spec.md](../../features/design-bundle-k-delete-pattern/spec.md)
> 관련 구현: [impl.md](#구현)

### 리뷰 대상 파일

- `src/lib/hooks/useDeleteWithUndo.ts` (신규)
- `src/app/layout.tsx` (수정 — Toaster props)
- `src/components/checklist/ChecklistRow.tsx` (수정 — Trash2 인라인 버튼)
- `src/components/checklist/ChecklistPage.tsx` (수정 — undo wiring)
- `src/components/timeline/WeekChecklistSection.tsx` (수정 — undo wiring)
- `src/components/timeline/TimelineAccordionCard.tsx` (수정 — undo wiring + Trash2)
- `src/components/weight/WeightContainer.tsx` (수정 — undo wiring)

총 7개 파일.

---

### Critical 이슈 (즉시 수정 완료)

없음.

타입 안전성·성능·보안·접근성 4축 검토 결과 사용자에게 즉시 피해를 주거나 런타임 크래시를 유발하는 항목 0건. `useDeleteWithUndo` 훅이 generic + useCallback 정합 + sonner toast.action 사용으로 깨끗하게 구현되어 있고, 모든 삭제 버튼에 `aria-label`이 박혀 있으며, 호출부에서 `id` 검증(atIndex < 0 가드) 처리됨.

---

### Warning (수정 권장)

#### 1. ChecklistPage.tsx / WeekChecklistSection.tsx / TimelineAccordionCard.tsx — 인라인 `restoreFn`이 매 렌더 새 인스턴스

- **위치**:
  - `src/components/checklist/ChecklistPage.tsx:82-90`
  - `src/components/timeline/WeekChecklistSection.tsx:36-44`
  - `src/components/timeline/TimelineAccordionCard.tsx:53-61`
- **문제**: `useDeleteWithUndo`의 `restoreFn`이 인라인 화살표 함수로 박혀 매 렌더 식별자가 바뀜. `useDeleteWithUndo` 내부 `useCallback`의 deps에 `restoreFn`이 있으므로 반환 트리거도 매 렌더 새 식별자. 현재 트리거를 자식 컴포넌트에 props로 전달하지 않아 실측 리렌더 영향은 0이지만, 패턴이 확산되면 안정성 회귀 가능.
- **권장 수정**: 각 컴포넌트에서 `restoreFn`을 `useCallback`으로 메모이즈하거나, 훅 내부에서 ref 패턴으로 latest를 추적해 트리거 식별자를 안정시키는 방안 검토.

#### 2. ChecklistPage.tsx / WeekChecklistSection.tsx / TimelineAccordionCard.tsx — `useStore.setState` 호출부 직접 호출

- **위치**:
  - `src/components/checklist/ChecklistPage.tsx:84-89`
  - `src/components/timeline/WeekChecklistSection.tsx:38-43`
  - `src/components/timeline/TimelineAccordionCard.tsx:55-60`
- **문제**: zustand 정석 API(store action 함수)에서 벗어나 호출부에서 `setState((state) => ...)` 직접 호출. spec K-2의 "호출부 책임" 결정에 따른 의도된 패턴이지만, 같은 splice 로직이 3곳에 복제되어 변경 시 누락 위험이 있음.
- **권장 수정**: 후속 라운드에서 `addCustomItem(item, atIndex?)` 시그니처 확장으로 통일하거나, `src/lib/hooks/`에 `restoreAt(store, item, atIndex)` 유틸 함수로 추출 검토.

#### 3. ChecklistPage.tsx / WeekChecklistSection.tsx / TimelineAccordionCard.tsx — `as ChecklistItem` / `as TimelineItem` 타입 단언

- **위치**:
  - `src/components/checklist/ChecklistPage.tsx:87`
  - `src/components/timeline/WeekChecklistSection.tsx:41`
  - `src/components/timeline/TimelineAccordionCard.tsx:58`
- **문제**: `const { atIndex, ...rest } = item` 후 `rest`가 실제로는 `ChecklistItem`(또는 `TimelineItem`)이지만 TS가 그 정밀도까지 추론하지 못해 `as`로 단언. 실제 런타임 위험은 없으나 타입 단언은 검증 없이 통과시키는 escape hatch라 가능하면 회피.
- **권장 수정**: `restoreFn` 시그니처를 `(item: T, meta: { atIndex: number }) => void`로 분리해 atIndex와 item을 명시적으로 분리하거나, 명시적 객체 재구성 사용:
  ```ts
  const original: ChecklistItem = {
    id: item.id, title: item.title, /* ... 명시 ... */
  };
  ```

---

### Suggestion (개선 아이디어)

#### 1. ChecklistRow.tsx / TimelineAccordionCard.tsx — `aria-label="삭제"`의 컨텍스트 부족

- 현재: 모든 삭제 버튼이 단순 `"삭제"`. weight만 `"체중 기록 삭제"`로 구체적.
- 스크린리더 사용자가 여러 행을 탐색할 때 어떤 항목을 삭제하는지 컨텍스트 모호. design.md §6에서도 "영역별 명확성 검증 1회"가 권장 사항으로 남아 있음.
- 제안: `aria-label={\`${item.title} 삭제\`}` 형태로 항목명 포함. 또는 영역별로 `"체크리스트 항목 삭제"` / `"타임라인 노트 삭제"`.

#### 2. TimelineAccordionCard.tsx — `onClick` 인라인 가독성

- 위치: `src/components/timeline/TimelineAccordionCard.tsx:198-208`
- 한 화살표 함수 안에 store.getState() 조회 + findIndex + 가드 + 트리거 호출이 모두 들어 있어 가독성 낮음.
- 제안: 컴포넌트 상단에 `handleDeleteClick = () => { ... }` 형태로 추출. WeekChecklistSection/ChecklistPage도 동일 패턴이라 함께 정리 가능.

#### 3. useDeleteWithUndo.ts — 시그니처 `T & { id: string }` → `T extends { id: string }` 검토

- 현재: `useDeleteWithUndo<T>` + 트리거 인자가 `T & { id: string }`. 호출부는 모두 `ChecklistItem`·`TimelineItem`·`WeightLog`처럼 id 필드를 가진 타입을 넘김.
- 제안: `useDeleteWithUndo<T extends { id: string }>(opts): (item: T) => void`로 단순화. 호출부 변경 없이 시그니처만 깔끔.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 (모두 spec K-2/K-4 결정에 따른 의도된 패턴, 후속 라운드 정리 가능) |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 0건) |

---

<!-- STEP:refactor -->
## 리팩토링

> 작성일: 2026-05-10
> 관련 리뷰: [review.md](#코드-리뷰)

### 리팩토링한 파일 목록

- `src/lib/hooks/useDeleteWithUndo.ts` (helper export 추가)
- `src/components/checklist/ChecklistPage.tsx`
- `src/components/timeline/WeekChecklistSection.tsx`
- `src/components/timeline/TimelineAccordionCard.tsx`

---

### 작업별 내용

#### 1. `useDeleteWithUndo.ts` — `restoreAtIndex<T>(store, item, atIndex)` 유틸 export

- **출처**: Warning 2 (`useStore.setState` 호출부 직접 호출 중복)
- **무엇을**: zustand 스토어에 `customItems: T[]`를 가진 모든 스토어에 대해 `atIndex` 위치로 splice 복원하는 제네릭 유틸 함수 추가. `CustomItemsStore<T>` 인터페이스(`setState((s) => Partial<S>)`)로 구조적 타이핑.
- **왜**: 3개 호출부에서 동일한 splice + clamp 로직이 복제되어 있었음. 한 곳에 추출해 향후 새 사용자 입력 데이터 영역 추가 시 자동 일관성 유지.

#### 2. `ChecklistPage.tsx` — `restoreCustomChecklistItem` useCallback + `restoreAtIndex` 사용

- **출처**: Warning 1 (인라인 restoreFn), Warning 2 (setState 중복), Warning 3 (`as` 단언)
- **무엇을**:
  - `restoreFn` 인라인을 `useCallback([useStore])`으로 추출 → `useDeleteWithUndo` 트리거 식별자 안정화.
  - splice 본문을 `restoreAtIndex<ChecklistItem>(useStore, rest, atIndex)` 한 줄로 교체.
  - `rest as ChecklistItem` 타입 단언 제거. `restoreAtIndex<ChecklistItem>`의 제네릭 추론으로 구조적 호환 검증.
- **왜**: 매 렌더 새 객체 식별자가 생기는 deps 안정성 문제 + 중복 로직 + escape hatch 제거. TypeScript가 `Omit<A & { atIndex }, "atIndex">`를 `A`로 정확히 추론.

#### 3. `WeekChecklistSection.tsx` — 동일 패턴 적용

- **출처**: Warning 1·2·3
- **무엇을**: `restoreCustomChecklistItem` useCallback + `restoreAtIndex<ChecklistItem>(useChecklistStore, ...)`로 교체. `as` 제거.
- **왜**: ChecklistPage와 동일 이유 + 일관성. 두 컴포넌트가 같은 패턴 사용하면 향후 변경 시 한쪽만 빠뜨릴 위험 0.

#### 4. `TimelineAccordionCard.tsx` — 동일 패턴 적용

- **출처**: Warning 1·2·3
- **무엇을**: `useCallback` import 추가. `restoreCustomTimelineItem` useCallback + `restoreAtIndex<TimelineItem>(useTimelineStore, ...)`로 교체. `as` 제거.
- **왜**: 동일.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 4개 | 4개 (helper export 추가) |
| splice/clamp 로직 위치 | 3곳 (호출부) | 1곳 (`restoreAtIndex`) |
| 인라인 restoreFn | 3곳 | 0곳 (모두 useCallback) |
| `as` 타입 단언 | 3건 | 0건 |
| `useDeleteWithUndo` 트리거 식별자 | 매 렌더 변경 | 안정 (deps 모두 stable) |

---

### 빌드 결과

성공 (1회 시도). Next 16.2.0 Turbopack, TypeScript 통과.

### 미진행 항목 (Suggestion)

리뷰 §Suggestion 3건은 본 라운드 건드리지 않음:

1. **`aria-label` 컨텍스트 구체화** — 항목명 포함 라벨. 카피 결정 + design.md 갱신 필요라 별도 라운드.
2. **TimelineAccordionCard onClick 인라인 추출** — 추가 핸들러 함수 추출은 컴포넌트 책임 변경 수준이라 보류.
3. **`useDeleteWithUndo<T extends { id: string }>` 시그니처 단순화** — 훅 public interface 변경, 본 스킬 규칙상 별도 결정 라운드 필요.
