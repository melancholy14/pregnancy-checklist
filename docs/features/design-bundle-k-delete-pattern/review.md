# design-bundle-k-delete-pattern 리뷰

> 작성일: 2026-05-10
> 상태: draft (페이즈 4 휴먼 게이트 대기)
> size: M
> phase_mode: review (운영자 결정 후 별도 라운드에서 spec/design 작성)
> 관련 스펙: [spec.md](./spec.md) (페이즈 5 진입 전 ⚠️ 운영자 답변 필요)

## 1. 기능 요약

phase-4.5.md §2.9 Cross-11·§2.10 묶음 K 마감. 영역별 삭제 패턴 미합의 — checklist=AlertDialog confirm, timeline=AlertDialog confirm, weight=즉시 삭제(X 버튼 → `removeLog` 직접 호출). **시스템 차원 통일 정책 결정 + sonner 기반 undo-toast 도입 검토**. 라이브러리 추가 없음 (sonner 이미 [layout.tsx:62](../../../src/app/layout.tsx#L62)에 `Toaster` 마운트 + 6개 호출부 가동 중).

⚠️ **사전 인지된 사실**:
- 현재 코드 상태(2026-05-10):
  - **checklist**: [ChecklistItemRow.tsx](../../../src/components/checklist/ChecklistItemRow.tsx) — AlertDialog confirm (사용자 추가 항목 삭제 시).
  - **timeline**: [DeleteConfirmDialog.tsx](../../../src/components/timeline/DeleteConfirmDialog.tsx) + [WeekChecklistSection.tsx](../../../src/components/timeline/WeekChecklistSection.tsx) — AlertDialog confirm (사용자 추가 노트 삭제 시).
  - **weight**: [WeightContainer.tsx:93-100](../../../src/components/weight/WeightContainer.tsx#L93-L100) — 즉시 삭제. `<Button onClick={() => removeLog(entry.id)}>` X 아이콘 직접 호출, 호버에만 노출(`opacity-0 group-hover:opacity-100`).
- sonner: [layout.tsx:62](../../../src/app/layout.tsx#L62) `<Toaster position="top-center" richColors theme="light" />` 마운트. 호출부 6개([WeightForm](../../../src/components/weight/WeightForm.tsx), [BabyfairCard](../../../src/components/babyfair/BabyfairCard.tsx), [DueDateInput](../../../src/components/home/DueDateInput.tsx), [HomeContent](../../../src/components/home/HomeContent.tsx), [DueDateStep](../../../src/components/onboarding/DueDateStep.tsx), [ChecklistEmptyState](../../../src/components/checklist/ChecklistEmptyState.tsx)) — `toast()`, `toast.error()` 사용 중. **`toast.action` 패턴(undo 버튼)은 아직 미사용** — 본 묶음에서 첫 도입.
- 디자이너 §6 (2026-05-03) 누적 학습: "**삭제 액션의 비용에 따라 차등**(커스텀 항목은 undo, 행사 같은 정적 데이터는 N/A)" 권장 메모.
- 사용자가 명시: **sonner 기반 undo-toast** 검토. 라이브러리 추가 금지.

## 2. 적용 페어 + 선택 이유

- **designer × developer**: UX 회복성·시간 도둑질 회피·다크 패턴 거부 (designer N4·N7·N8) vs 구현 복잡도·localStorage 무결성·임시 추정값 회피 (developer §6.3·§6.6·§3.2). marketer는 본 묶음에 측정 의무는 있으나(`item_delete_undo` 같은 이벤트) 핵심 충돌 축은 UX 회복성 vs 구현 복잡도 — 운영자 명시.

## 3. 페어별 충돌

### 페어 1: designer × developer

**T0 — 페어 시작 선언**: 이전 페어 [없음] 영향 없음. designer N4·N7·N8·§6 (2026-05-03) / developer §6.3·§6.6·§3.2·§1 인용.

**[designer] 단독 입장**:

- **잃는 것**: 전 영역 confirm 일괄 채택 시(옵션 i) 짧은 액션에 5초+ 추가(N8 사용자 시간 도둑질) — weight 일자별 로그 삭제는 잘못 입력했을 때 빠른 정정이 핵심 UX. 또 confirm 다이얼은 "정말 삭제하시겠습니까?" 마찰 카피가 임산부 사용자에게 "내가 뭔가 잘못한 건가" 인지 부담 추가(N4 다크 패턴은 아니지만 인지 부하 §3.5 위반).
- **희생 거부 인용**: "**한 번 클릭으로 모든 체크 해제 같은 위험 액션은 undo 또는 confirm 필수**" — docs/design/persona.md N7. + "진입 후 핵심 가치 도달까지 3 탭 / 5초 이내. 자동 재생 비디오·자동 팝업 거부." — N8. + "**삭제 액션의 비용에 따라 차등** — 커스텀 항목은 undo, 행사 같은 정적 데이터는 N/A" — §6 (2026-05-03). + "사용자 동의 없이 자동 옵트인된 구독·알림" — N4 (관련: 즉시 삭제는 옵트아웃 0이라 "되돌릴 수 없는 동의 없는 변경"에 가까움).
- **주장**: **(iii) 액션 비용 기반 차등** 채택. 분류:
  - **사용자 입력 데이터** (커스텀 체크리스트 항목, weight log, 사용자 추가 timeline 노트) = **undo-toast 5초 (sonner `toast.action`)** + 토스트 dismiss 시 실제 삭제. **confirm 제거**(시간 도둑질 회피). 단, undo 누락 시 데이터 영구 손실이라 **toast가 시각적으로 명확**해야 함(richColors 활용).
  - **정적 데이터** (베이비페어 행사, 아티클, 시스템 체크리스트 항목) = N/A — 사용자가 삭제 못 함.
  - 즉 본 묶음 범위 = 위 3개 영역(checklist 커스텀 항목 / timeline 사용자 노트 / weight log) **모두 undo-toast로 통일**, AlertDialog confirm 전부 제거. weight 즉시 삭제도 undo-toast로 변경(즉시 삭제→toast로 5초 회복 창 부여, 사용자 시간 비용 0초 = 즉시 삭제와 동등).
- **잔재 자기검증**: 이전 페어 없음 — N

**[developer] 반박 입장**:

- **A 발언 반박**: designer의 "(iii) 차등 + 전 영역 undo-toast" 권장은 UX 측면 정합 OK이나, **localStorage 무결성 측면에서 3가지 결정 누락**:
  1. **undo 동작의 데이터 모델** — 5초 회복 창 동안 데이터를 store에 유지(soft delete `_deletedAt` 플래그) vs 메모리 outside store에 임시 보관 후 복원. 전자는 zustand `persist` schema 변경 → migrate 함수 의무(§6.3). 후자는 사용자가 **다른 탭/새로고침** 시 5초 창 유지 X — undo 못 함.
  2. **여러 토스트 동시 발생 시** — 사용자가 5초 안에 항목 3개 연속 삭제 시 토스트 큐 정책 미정. sonner는 default queue + `Toaster` `visibleToasts={N}` 설정 가능하지만 동시 dismiss/undo 시맨틱 미명세.
  3. **3영역 중복 패턴** — `useDeleteWithUndo<T>(removeFn, restoreFn, label)` 같은 훅으로 추출 검토 필요(§1 "세 번째 등장이 보이면 그때 추출" 룰). designer 권장은 호출부 3개 모두 정합인 패턴이라 훅 추출이 자연스러우나, 산출물(spec/design)에 명세 없으면 호출부마다 inline 구현이 박혀 영구 중복(§3.2 임시 추정값 영구화).
- **잃는 것**: 훅 추출 + soft delete schema 도입 시 zustand store 3개([useChecklistStore](../../../src/store/), [useTimelineStore](../../../src/store/), [useWeightStore](../../../src/store/useWeightStore.ts)) 모두 schema 변경 — migrate 함수 의무 + P5 schema versioning deferred 정책과 충돌. 전 영역 undo 단정 양보 가능하지만, 데이터 모델 결정은 spec 진입 전 박아야.
- **희생 거부 인용**: "**localStorage 사용자 데이터 무결성 — 기존 사용자의 체크리스트·체중 로그·예정일을 silent corruption 시키는 변경 거부. schema 변경 시 항상 migrate 핸들러 또는 명시적 fallback. 키 그냥 바꾸자 답변 안 함.**" — docs/tech/persona.md §6.3. + "**산출물 없으면 운영자에게 결정 요청. 임시 추정값으로 채우면 그게 영구가 된다.**" — §6.6. + "두 번까지는 인라인 두 번. 세 번째 등장이 보이면 그때 추출." — §1.
- **주장**: 전 영역 undo-toast 수렴 OK(designer 권장 (iii) 합의). 다만 spec 진입 전 결정해야 할 항목 **3건 명시**:
  - (a) **undo 데이터 모델** = 메모리 임시 보관(react state) vs soft delete(store). 전자는 5초 후 자동 hard delete + 새로고침 시 undo 못 함. 후자는 schema 변경 + migrate. **권장 = (a-1) 메모리 임시 보관** — 새로고침 시 undo 불가는 사용자 멘탈 모델과 일치(토스트가 사라지면 끝). schema 변경 회피.
  - (b) **토스트 동시 발생 정책** = sonner `Toaster`에 `visibleToasts={3}` 설정 + 큐는 dismiss FIFO. 동일 액션 연속 삭제 시 토스트 별개 발사(병합 X) — undo는 각 토스트 독립.
  - (c) **추출 패턴** = `useDeleteWithUndo<T>` 커스텀 훅 1개로 3영역 호출부 통일 — 호출부 inline 구현 금지. 훅 위치 = `src/lib/hooks/useDeleteWithUndo.ts`.
- **잔재 자기검증**: 이전 페어 없음 — N

**T3 — 핵심 충돌 + 숨은 가정**:

- **핵심 충돌**: designer는 "(iii) 차등 + 전 영역 undo-toast" 단정으로 시작 — developer는 (iii) 수렴 OK이나 **spec 진입 전 데이터 모델·토스트 큐·훅 추출 결정 의무**를 박음. 양쪽이 (iii)에 합의하지만 **spec 진입 시점에서 박을 항목의 정확성**에서 첨예 — designer가 "디자이너 영역 외(데이터 모델)"라며 카피·시각만 정의하고 dev에 떠넘기면 §6.6 "산출물 없으면 임시 추정값 영구화" 위반.
- **숨은 가정**: 양쪽 모두 **5초 회복 창이 임산부 사용자에게 충분**하다고 가정 — sonner default duration이 4초이고 toast.action 표준이 5초지만, 임산부의 호르몬·인지 부담 컨텍스트(§4.4 marketer §4.4 + §3 designer 신체 변화 민감 시기)에서 5초가 짧을 수 있음. 7~10초 검토 가능. 또 양쪽이 "weight 즉시 삭제→undo-toast 변경 시 사용자 학습 비용 0"이라고 가정 — 실제로는 X 버튼 호버 노출 패턴이 변경되므로 호버 미노출(즉시 가시성) 또는 노출 정책 변경 결정 종속.

## 4. 미해결 트레이드오프

### 항목 K-1 — 삭제 패턴 통일 정책

페어 1에서 (iii) 액션 비용 기반 차등 + 전 영역 undo-toast로 수렴. 운영자 재확인 필요 + 옵션 (i)·(ii) 중 한쪽으로 뒤집기 가능.

- [ ] **옵션 A — (i) 전 영역 confirm 일괄** (weight도 confirm 추가):
  - 즉시 비용: weight 즉시 삭제 → confirm 변경. 사용자 시간 비용 ↑(N8 위반 가능). 일관성 회복.
  - 나중 비용: 짧은 액션(체중 입력 오타 정정)에 confirm 다이얼이 마찰. 임산부 인지 부담 ↑.
- [ ] **옵션 B — (ii) 전 영역 undo-toast 일괄** (checklist·timeline confirm 제거 + weight 즉시→undo):
  - 즉시 비용: AlertDialog 호출부 2개 제거 + sonner `toast.action` 패턴 도입. 호출부 3개 통일.
  - 나중 비용: 회복 창 5초가 끝나면 영구 삭제. 새로고침·다른 탭 시 undo 불가 — 사용자가 "확실한" 액션을 원할 때(예: "이 항목 다시는 안 챙길래") 토스트 dismiss 후 5초 대기 필요. designer N7 "위험 액션 undo 또는 confirm 필수"는 정합(undo 충족).
- [x] **옵션 C — (iii) 액션 비용 기반 차등 + 전 영역 undo-toast** (designer + developer 합의 = 결과적으로 옵션 B와 동일):
  - 본 묶음 범위 = 사용자 입력 데이터 3영역(checklist 커스텀 / timeline 노트 / weight log) → undo-toast 통일. 정적 데이터(아티클·베이비페어·시스템 체크리스트)는 사용자 삭제 불가.
  - 즉시 비용 = 옵션 B와 동일.
  - 나중 비용 = 옵션 B와 동일. 단, 향후 새 사용자 입력 데이터 영역 추가 시 자동 적용 룰 = "사용자가 입력한 데이터 = undo-toast" — 룰이 명확해 신규 영역에서 임시 추정값 박힐 위험 ↓.
- [ ] **옵션 D — 현상 유지** (checklist·timeline confirm + weight 즉시 삭제):
  - 즉시 비용: 0(변경 없음).
  - 나중 비용: §2.9 Cross-11 미해소. 영역마다 다른 삭제 패턴이 사용자 멘탈 모델 부담. weight 즉시 삭제는 N7 "undo 또는 confirm 필수" 위반.
- **결정**: ⚠️ **운영자 답변 필요** — 옵션 A/B/C/D 중 1개. (페어 합의 = C, B와 결과 동일).

### 항목 K-2 — undo 데이터 모델 (옵션 B·C 종속)

페어 1에서 developer가 spec 진입 전 명시 의무. designer는 디자이너 영역 외라 거부 — 운영자 결정으로 재확인.

- [ ] **옵션 A — 메모리 임시 보관 (React state)** (developer 권장):
  - 즉시 비용: zustand store schema 변경 0. 훅 내부 state로 5초 동안 deleted item 보관 → undo 시 store에 재추가, 5초 경과 시 hard delete.
  - 나중 비용: 새로고침/다른 탭 전환 시 5초 창 유지 X — undo 불가. 단, 사용자 멘탈 모델("토스트 사라지면 끝")과 일치.
- [ ] **옵션 B — soft delete (store schema `_deletedAt` 플래그)**:
  - 즉시 비용: zustand store 3개 schema 변경 + persist `migrate` 함수 추가. P5 schema versioning deferred 정책 깨야.
  - 나중 비용: 새로고침해도 5초 창 유지 → 더 강한 undo. 단, "삭제했는데 사실 5초 안에 새로고침하면 살아 있다"는 멘탈 모델 학습 비용 + soft delete 데이터 누적 시 store 크기 ↑(주기적 cleanup 룰 필요).
- **결정**: ⚠️ **운영자 답변 필요** — K-1 결정에 종속. K-1=A·D면 본 항목 N/A. K-1=B·C면 옵션 A 또는 B 중 1개.

### 항목 K-3 — undo 회복 창 길이 (옵션 B·C 종속)

페어 1 T3 숨은 가정 — "5초가 충분하다"는 양쪽 묵시 합의. 임산부 사용자 컨텍스트에서 재검증.

- [ ] **옵션 A**: 5초 — sonner default 4초보다 약간 김. toast.action 표준.
- [ ] **옵션 B**: 7초 — 임산부 인지 부담 고려 (호르몬·신체 피로 컨텍스트).
- [ ] **옵션 C**: 10초 — 충분히 김. 단, 5초~10초 사이 사용자가 다른 행동 시작 시 토스트가 시야에서 잊힘 → undo 시그널 무력화 가능.
- **결정**: ⚠️ **운영자 답변 필요** — K-1 결정에 종속(B·C일 때만). 권장 = 옵션 B(7초) — 임산부 컨텍스트 + 잊힘 위험의 균형. 다만 측정 후 조정 가능.

### 항목 K-4 — `useDeleteWithUndo<T>` 훅 추출 위치 (옵션 B·C 종속)

페어 1에서 developer가 §1 "세 번째 등장 시 추출" 룰 + §3.2 산출물 우선 원칙으로 박음. designer는 디자이너 영역 외 — 운영자 결정.

- [ ] **옵션 A**: `src/lib/hooks/useDeleteWithUndo.ts` 신설 — 호출부 3개(checklist/timeline/weight) 통일. 향후 새 영역 자동 적용.
- [ ] **옵션 B**: 호출부 inline 구현 — 첫 라운드만 inline, 후속 라운드에서 추출.
- **결정**: ⚠️ **운영자 답변 필요** — K-1 결정에 종속(B·C일 때만). 권장 = 옵션 A — phase-4.5.md §2.10 Cross-11이 명확히 시스템 컨벤션 결정이고, 첫 라운드부터 추출하지 않으면 inline 3개가 영구화(§6.6 위반).

### (참고) 페어 합의 사항 — 결정 영역에서 재확인 가능

다음은 페어에서 양쪽이 합의한 사항. 사용자가 뒤집고 싶으면 §5에 명시.

- **페어 1**: 본 묶음 범위 = **사용자 입력 데이터 3영역**(checklist 커스텀 항목 / timeline 사용자 노트 / weight log)에 한정. 정적 데이터(아티클·베이비페어·시스템 체크리스트)는 사용자 삭제 불가, 본 묶음 범위 외.
- **페어 1**: sonner 라이브러리 추가 0 — 이미 [layout.tsx:62](../../../src/app/layout.tsx#L62)에 마운트, `toast.action` 패턴이 첫 도입이므로 사용 패턴만 결정.
- **페어 1**: **AlertDialog 호출부 제거 후 [DeleteConfirmDialog.tsx](../../../src/components/timeline/DeleteConfirmDialog.tsx) 컴포넌트 자체 삭제** — 옵션 B·C 채택 시. 옵션 A 채택 시 weight도 이 컴포넌트 재사용.
- **페어 1**: 토스트 동시 발생 정책 = `Toaster` `visibleToasts={3}` + FIFO 큐 + 토스트 별개 발사(병합 X). 옵션 B·C 시 의무.

## 5. 결정

**페이즈 4 휴먼 게이트 결정 (운영자 입력, 2026-05-10)**:

- **항목 K-1 (삭제 패턴 통일 정책)**: **옵션 C — 액션 비용 차등 + 전 영역 undo-toast** (결과적으로 옵션 B와 동일). 본 묶음 범위 = 사용자 입력 데이터 3영역(checklist 커스텀 항목 / timeline 사용자 노트 / weight log). AlertDialog confirm 호출부 2개 제거 + [DeleteConfirmDialog.tsx](../../../src/components/timeline/DeleteConfirmDialog.tsx) 컴포넌트 자체 삭제. weight 즉시 삭제도 undo-toast로 통일. 정적 데이터(아티클·베이비페어·시스템 체크리스트)는 사용자 삭제 불가 — 본 묶음 범위 외.
- **항목 K-2 (undo 데이터 모델)**: **옵션 A — 메모리 임시 보관 (React state)**. 훅 내부 state로 5초~7초 동안 deleted item 보관 → undo 시 store에 재추가, 타이머 만료 시 hard delete. zustand store schema 변경 0(P5 schema versioning deferred 정책 정합 + dev §6.3 무결성 정합). 새로고침/다른 탭 시 undo 불가 — 사용자 멘탈 모델("토스트 사라지면 끝")과 일치.
- **항목 K-3 (undo 회복 창 길이)**: **옵션 B — 7초**. 임산부 인지 부담(호르몬·신체 피로) 컨텍스트 + 잊힘 위험의 균형. sonner toast.action duration = 7000ms.
- **항목 K-4 (`useDeleteWithUndo<T>` 훅 추출 위치)**: **옵션 A — `src/lib/hooks/useDeleteWithUndo.ts` 신설**. 호출부 3개(checklist/timeline/weight) 통일. 향후 새 사용자 입력 데이터 영역 추가 시 자동 적용 룰. dev §1 "세 번째 등장 시 추출" + §6.6 임시 추정값 영구화 회피 정합.

**페어 합의 사항 (사용자 뒤집기 없음, 그대로 채택)**:

- 페어 1: 본 묶음 범위 = 사용자 입력 데이터 3영역에 한정. 정적 데이터는 본 묶음 범위 외.
- 페어 1: sonner 라이브러리 추가 0 — 이미 [layout.tsx:62](../../../src/app/layout.tsx#L62)에 마운트, `toast.action` 패턴이 첫 도입.
- 페어 1: AlertDialog 호출부 제거 후 [DeleteConfirmDialog.tsx](../../../src/components/timeline/DeleteConfirmDialog.tsx) 컴포넌트 자체 삭제.
- 페어 1: 토스트 동시 발생 정책 = `Toaster` `visibleToasts={3}` + FIFO 큐 + 토스트 별개 발사(병합 X). 동일 액션 연속 삭제 시 토스트 독립 발사·독립 undo.

## 6. 우선순위 영향

- phase-4.5.md §2.10 묶음 K 결정·실행 unblock. §2.9 Cross-11 해소.
- 옵션 B·C 채택 시 [DeleteConfirmDialog.tsx](../../../src/components/timeline/DeleteConfirmDialog.tsx) 컴포넌트 삭제 + 호출부 3영역 변경:
  - [ChecklistItemRow.tsx](../../../src/components/checklist/ChecklistItemRow.tsx)
  - [WeekChecklistSection.tsx](../../../src/components/timeline/WeekChecklistSection.tsx)
  - [WeightContainer.tsx:93-100](../../../src/components/weight/WeightContainer.tsx#L93-L100)
- K-2=B(soft delete) 채택 시 zustand store 3개 schema 변경 + persist `migrate` 함수 의무 — P5 schema versioning deferred 정책과 충돌, 별도 결정 필요.
- K-4=A 채택 시 `src/lib/hooks/useDeleteWithUndo.ts` 신설 — 향후 새 사용자 입력 데이터 영역 추가 시 자동 적용 룰.
- 측정: GA4 카탈로그 갱신 검토 — `item_delete`(기존 발사 여부 검증) + `item_delete_undo`(신규) 페어 이벤트 도입 가능. spec 단계에서 marketer 검토 1회 권장 (본 라운드 범위 외).
- 묶음 J(ShareButton 위치)와 독립. 같은 라운드에서 상호 영향 없음.
