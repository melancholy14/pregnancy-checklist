# design-bundle-b-i-row-tokens 리팩토링

> 작성일: 2026-05-10
> 관련 리뷰: [review.md](../review/design-bundle-b-i-row-tokens-review.md)

## 리팩토링한 파일 목록

- [src/lib/constants.ts](../../src/lib/constants.ts) — `PRIORITY_LABEL` named export 추가
- [src/components/checklist/ChecklistItemRow.tsx](../../src/components/checklist/ChecklistItemRow.tsx) — local `PRIORITY_LABEL` 제거, import 로 교체
- [src/components/timeline/WeekChecklistSection.tsx](../../src/components/timeline/WeekChecklistSection.tsx) — 동일
- [src/components/checklist/ChecklistRow.tsx](../../src/components/checklist/ChecklistRow.tsx) — 편집 버튼에 `onStartEdit &&` 가드 추가

총 4파일 수정.

---

## 작업별 내용

### 1. ChecklistRow.tsx — 편집 버튼 `onStartEdit` 가드 추가
- **출처**: Warning #1 (review.md)
- **무엇을**: `isCustom` 분기 안 `<button onClick={onStartEdit}>` 을 `{onStartEdit && <button>...</button>}` 로 감쌌다.
- **왜**: `onStartEdit` 은 prop 타입상 optional 인데 가드 없이 렌더되면 callback 미전달 시 클릭이 silent fail. 같은 영역의 `DeleteConfirmDialog` 는 이미 `{onRemove && ...}` 가드가 있어 비대칭이었음. 이제 두 인터랙티브 모두 동일 패턴.

### 2. PRIORITY_LABEL 단일화
- **출처**: Warning #4 (review.md)
- **무엇을**: 동일한 `Record<ChecklistItem["priority"], string>` 매핑이 `ChecklistItemRow.tsx` 와 `WeekChecklistSection.tsx` 에 중복 정의되어 있던 것을 [src/lib/constants.ts](../../src/lib/constants.ts) 로 옮기고 두 wrapper 가 import.
- **왜**: 우선순위 라벨은 도메인 상수. 한쪽만 수정하면 다른 쪽이 어긋날 위험 → 단일 source of truth 로 통합.

---

## 의도적으로 SKIP 한 Warning 항목

### Warning #2 — WeekChecklistSection inline 계산
- **사유**: `getCategoryTokenClass(item.category)` 와 `classifyNote(item.note)` 는 둘 다 정적 lookup·정규식으로 비용이 매우 작음 (한 카드 ~20 항목). useMemo 도입은 코드 복잡도만 늘리고 실측 이득이 거의 없음. 또한 spec.md `won't` 섹션이 "헬퍼 unit 테스트 X — 정적 lookup 함수, 빌드/타입체크가 검증 충분" 라고 디시플린을 명시했는데, 같은 정신에서 정적 lookup 결과를 매 렌더 호출하는 비용도 무시 가능하다고 판단.

### Warning #3 — `categoryToneClassName ?? ""` fallback
- **사유**: 깨끗한 해결책은 `categoryLabel` + `categoryToneClassName` 을 단일 객체 prop 으로 묶는 것이지만 이는 `ChecklistRow` 의 public interface(props) 변경. 이 스킬은 "public interface를 바꾸지 않습니다" 원칙이라 SKIP. 현재 `?? ""` 는 방어적 fallback 으로 안전하게 동작 중. 다음 라운드에서 prop 모델을 묶어서 정정 가능.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `PRIORITY_LABEL` 정의 위치 | 2곳(중복) | 1곳(`src/lib/constants.ts`) |
| ChecklistRow 편집 버튼 가드 | 없음 (silent fail 위험) | `onStartEdit &&` 가드 |
| Warning 항목 처리 | 4건 미처리 | 2건 처리, 2건 의도적 SKIP (사유 기록) |
| 호출부 인터페이스 | 변동 없음 | 변동 없음 (public 안정) |

---

## 빌드 결과

성공 (1회 시도, `npm run build` Compiled in 2.9s).
