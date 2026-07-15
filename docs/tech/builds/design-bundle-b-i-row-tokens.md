# design-bundle-b-i-row-tokens

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-05-10
> plan: [spec](../../features/design-bundle-b-i-row-tokens/spec.md) · [design](../../features/design-bundle-b-i-row-tokens/design.md)

<!-- STEP:impl -->
## 구현

> 작성일: 2026-05-10
> 관련 스펙: [spec.md](../../features/design-bundle-b-i-row-tokens/spec.md)
> 관련 디자인: [design.md](../../features/design-bundle-b-i-row-tokens/design.md)

### 완료 조건 충족 여부

#### 묶음 I

| 조건 | 상태 | 비고 |
|------|------|------|
| `grep -rn 'style={{ backgroundColor' src/` 결과 0 (스펙 대상 4파일) | ✅ 완료 | BabyfairCard·WeekChecklistSection·DashboardCard·HomeContent 모두 helper 사용. TimelineAccordionCard 2건은 본 라운드 범위 외(별도 라운드 검토 필요) |
| 4파일 hex 0건 (`#FFD4DE`·`#FFE0CC`·`#D0EDE2`·`#E4D6F0`·`#FFF4D4`) | ✅ 완료 | grep 0건 |
| 신규 `src/lib/data-token-classes.ts` + 4종 named export + `DataToneClass`·`DashboardSlotClass` union literal | ✅ 완료 | |
| TypeScript 빌드 통과 | ✅ 완료 | `npm run build` 성공 |
| `bg-pastel-pink` in helper = `DashboardSlotClass`·`checklist` slot 1건만 | ✅ 완료 | union 정의 1줄 + checklist 매핑 1줄 |
| DESIGN.md §10 헌법 1단락 머지 | ✅ 완료 | §10 Don't 끝부분에 "데이터 → 토큰 매핑은 헬퍼 경유 의무" 추가 |

#### 묶음 B

| 조건 | 상태 | 비고 |
|------|------|------|
| ChecklistItemRow·WeekChecklistSection에서 `role="button"`·`aria-pressed` 0건 | ✅ 완료 | grep 0건 |
| 신규 `ChecklistRow.tsx` 1파일 + 두 wrapper에서 import | ✅ 완료 | |
| E2E 5개 spec 셀렉터 마이그레이션 (`getByRole("checkbox", { name })` 또는 `label` locator) | ✅ 완료 | 추가로 p9-empty-state.spec.ts도 `aria-pressed` 의존이 있어 함께 마이그레이션 |

#### 공통

| 조건 | 상태 | 비고 |
|------|------|------|
| phase-4.5.md §2.9 Cross-4·Cross-5 ✅ 완료 마크 + 산출물 링크 | ✅ 완료 | |
| phase-4.5.md §2.10 묶음 B/I ✅ 완료 마크 + 링크 | ✅ 완료 | |

### 생성/수정 파일 목록

#### 신규 생성

- `src/lib/data-token-classes.ts` — 도메인 데이터 → 토큰 클래스 매핑 헬퍼 (4종 named export + `DataToneClass`·`DashboardSlotClass` union literal 타입)
- `src/components/checklist/ChecklistRow.tsx` — checklist + timeline 공유 row 컴포넌트 (label 기반 native checkbox 마크업)
- `이 문서` — 본 문서

#### 수정

- `src/components/babyfair/BabyfairCard.tsx` — `SCALE_CONFIG.color` 필드 + `CITY_COLORS` map 제거. Badge `style` → `getCityTokenClass`/`getScaleTokenClass`. `SCALE_LABELS` 별도 추출.
- `src/components/timeline/WeekChecklistSection.tsx` — `CATEGORY_COLORS` map 제거, row 마크업을 `<ChecklistRow>` 호출로 교체. 편집 form, `handleToggleItem` GA4 이벤트 발사, 진행률 바는 보존.
- `src/components/checklist/ChecklistItemRow.tsx` — 본체 마크업을 `<ChecklistRow>` 호출로 교체. 편집 모드 분기 + `upcoming_item_view` useEffect 보존. `slug` prop 추가(input id unique 생성용).
- `src/components/checklist/ChecklistPage.tsx` — `<ChecklistItemRow>` 호출에 `slug={meta.slug}` prop 추가.
- `src/components/home/DashboardCard.tsx` — `color: string` prop → `slot: DashboardSlot`. `style={{ backgroundColor }}` → `getDashboardIconBgClass(slot)`.
- `src/components/home/HomeContent.tsx` — DashboardCard 4개 호출의 `color="#..."` → `slot="babyfair|weight|video|info"`.
- `DESIGN.md` — §10 Don't 끝부분에 "데이터 → 토큰 매핑은 헬퍼 경유 의무" 1단락 추가.
- `docs/plan/phase-4.5.md` — §2.9 Cross-4·Cross-5 ✅ 완료 마크 + 본문 정정. §2.10 묶음 B·I ✅ 완료 마크 + 링크.
- `e2e/checklist-recommendation-semantics.spec.ts` — `[aria-pressed]` 셀렉터 → `label` locator + `getByRole("checkbox")` 상태 검증.
- `e2e/design-bundle-d-uncheck-toggle-dday.spec.ts` — 동일 마이그레이션.
- `e2e/p9-empty-state.spec.ts` — `[role="button"][aria-pressed]` 셀렉터 → `label:has(input...)` 패턴 마이그레이션 (스펙 5개 외 추가).

### 주요 결정 사항

#### DashboardSlot enum 확장

- **결정**: `DashboardSlot` 을 spec의 4종(`checklist|timeline|weight|info`)에 추가로 `babyfair|video` 2종 더 정의 (총 6종).
- **이유**: 스펙은 home 미니카드를 "checklist/timeline/weight/info" 4개로 가정하지만 실제 [HomeContent.tsx](../../../src/components/home/HomeContent.tsx) 의 미니카드 4개는 baby-fair·weight·video·articles 다. 스펙의 "won't 색 변화 0" 제약을 지키려면 yellow(video) + mint(baby-fair) 매핑이 필요. spec 4종은 정의 그대로 보존하여 success criterion `bg-pastel-pink` 1건(=checklist 슬롯) 통과는 만족.
- **매핑**: `babyfair → bg-pastel-mint/40` (현 #D0EDE2 보존), `video → bg-pastel-yellow/40` (현 #FFF4D4 보존). 나머지는 spec 그대로.

#### `Partial<Record<...>>` 사용

- **결정**: `CITY_TO_GROUP`·`SCALE_TO_TONE`·`CATEGORY_TO_TONE` 모두 `Partial<Record<...>>`로 선언, lookup 결과에 `?? DEFAULT_TONE` fallback.
- **이유**: design.md §3.2는 `Record<ChecklistItem["category"], DataToneClass>` 를 보였지만 `ChecklistItem["category"]` 타입은 15개 키를 가지는데 spec 매핑은 5개만 명시. 또 실제 데이터에 `health` 카테고리가 있어 타입 정의 자체와 어긋나는 항목까지 안전하게 fallback 처리해야 함. helper 자체에 `?? DEFAULT_TONE` 가드가 있으므로 Partial 가 의도와 더 일치.

#### ChecklistItemRow `slug` prop 추가

- **결정**: `<ChecklistItemRow>` 에 `slug` prop 신규 추가 → `<ChecklistRow id={\`checklist-row-${slug}-${item.id}\`} ... />` 로 unique input id 생성.
- **이유**: 같은 페이지에 여러 슬러그(예: 미래 시나리오)나 같은 item id 가 중복될 가능성을 차단. label `htmlFor` ↔ input `id` 매칭 신뢰성 확보. WeekChecklistSection 도 `timeline-row-${slug}-${item.id}` 패턴으로 정합.

#### ChecklistRow `noteType` prop 도입

- **결정**: ChecklistRow 외부에서 `noteType={classifyNote(...)}` 을 미리 계산해 전달. ChecklistRow 내부에서 다시 분류하지 않음.
- **이유**: ChecklistItemRow 가 이미 `useMemo(() => classifyNote(item.note))` 로 캐싱 중. timeline 호출부도 같은 패턴 따라가도록 정합.

#### p9-empty-state.spec.ts 추가 마이그레이션 (spec 5개 spec 외)

- **결정**: spec.md §2.10 의 5개 spec 외에 [p9-empty-state.spec.ts](../../e2e/p9-empty-state.spec.ts)도 `[role="button"][aria-pressed]` 셀렉터를 사용해 row를 잡고 있어 마이그레이션 대상에 포함.
- **이유**: spec 의 셀렉터 마이그레이션 5개 spec 리스트는 명시적 회귀 검증 5개 — 그 외 같은 패턴을 쓰는 spec 도 자동으로 깨지므로 함께 마이그레이션. 스펙 의도("전체 e2e 통과")와 정합.

### 가정 사항

- spec 의 `home 미니카드 4개 = 체크리스트·타임라인·체중·정보` 가정은 실제 코드와 다르나(baby-fair·weight·video·articles), spec 의 "won't 색 변화 0" 제약을 우선시해 enum 을 확장하는 방향으로 해석.
- `health` 카테고리는 `ChecklistCategory` 타입에 정의되지 않은 채 데이터에만 존재하나 본 라운드 영향 X — `getCategoryTokenClass` fallback (`DEFAULT_TONE = lavender/40`) 로 처리.
- `partial Record<string, ...>` 의 string 키 lookup 은 명시적 union 보다 약한 타입 안전성을 가지나 spec 의도(외부 데이터 lookup) 와 정합.
- TimelineAccordionCard.tsx 의 `style={{ backgroundColor }}` 2건은 본 라운드 spec 의 4파일 호출부 매트릭스에 포함되지 않아 그대로 두었음(타임라인 주차 원형 + 타입 Badge — 다른 매핑 도메인).

### 미구현 항목

- TimelineAccordionCard.tsx 의 `style={{ backgroundColor }}` 2건 — 본 라운드 범위 외, 별도 cross 헬퍼(week color, type config) 도입 검토 필요.
- 헬퍼 unit 테스트 — spec.md `won't` 명시 (정적 lookup, 빌드/타입체크가 검증 충분).
- 모바일 320px row 시각 회귀 수동 검증 — design.md §12 의 운영자 검증 가이드 항목.

---

<!-- STEP:review -->
## 코드 리뷰

> 리뷰일: 2026-05-10
> 관련 스펙: [spec.md](../../features/design-bundle-b-i-row-tokens/spec.md)
> 관련 구현 문서: [impl.md](#구현)

### 리뷰 대상 파일

- [src/lib/data-token-classes.ts](../../../src/lib/data-token-classes.ts) (신규)
- [src/components/checklist/ChecklistRow.tsx](../../../src/components/checklist/ChecklistRow.tsx) (신규)
- [src/components/babyfair/BabyfairCard.tsx](../../../src/components/babyfair/BabyfairCard.tsx) (수정)
- [src/components/timeline/WeekChecklistSection.tsx](../../../src/components/timeline/WeekChecklistSection.tsx) (수정)
- [src/components/checklist/ChecklistItemRow.tsx](../../../src/components/checklist/ChecklistItemRow.tsx) (수정)
- [src/components/checklist/ChecklistPage.tsx](../../../src/components/checklist/ChecklistPage.tsx) (수정)
- [src/components/home/DashboardCard.tsx](../../../src/components/home/DashboardCard.tsx) (수정)
- [src/components/home/HomeContent.tsx](../../../src/components/home/HomeContent.tsx) (수정)

총 8개 프로덕션 소스 파일 (E2E spec + markdown 변경은 리뷰 대상 외).

---

### Critical 이슈 (즉시 수정 완료)

없음. 본 라운드는 row 마크업 정합 + 색 토큰 매핑 분리 위주 리팩터로, 런타임 크래시·보안·잘못된 조건문에 해당하는 이슈가 발견되지 않음.

---

### Warning (수정 권장)

#### 1. ChecklistRow.tsx — 편집 버튼이 `onStartEdit` 미정의 상태에서 silent fail
- **위치**: [src/components/checklist/ChecklistRow.tsx:136-143](../../../src/components/checklist/ChecklistRow.tsx#L136-L143)
- **문제**: `<button onClick={onStartEdit}>` 가 `isCustom===true` 분기에서 무조건 렌더되지만 `onStartEdit` prop 은 optional. 호출부가 `isCustom={true}` 만 넘기고 `onStartEdit` 을 누락하면 클릭해도 아무 일도 안 일어나는 silent fail. 같은 영역의 `DeleteConfirmDialog` 는 `{onRemove && <DeleteConfirmDialog ... />}` 가드가 있어 비대칭.
- **권장 수정**: `onStartEdit && <button>...</button>` 패턴으로 가드 추가하거나, 타입을 `isCustom === true → onStartEdit·onRemove 필수` 로 좁히는 discriminated union 으로 변환. 현 호출부 2곳(ChecklistItemRow + WeekChecklistSection) 모두 정상 전달이라 즉시 위험 X.

#### 2. WeekChecklistSection.tsx — `noteType`·`categoryToneClassName` 매 렌더 inline 계산
- **위치**: [src/components/timeline/WeekChecklistSection.tsx:165-169](../../../src/components/timeline/WeekChecklistSection.tsx#L165-L169)
- **문제**: `items.map` 안에서 매 렌더마다 `getCategoryTokenClass(item.category)` + `classifyNote(item.note)` 가 실행됨. items 배열이 안정되어 있어 영향은 미미하지만 타임라인 한 카드에 ~20개 항목이 있어 누적 비용 발생 가능.
- **권장 수정**: `useMemo` 로 `items` 별 `(toneClass, noteType)` 튜플을 미리 계산. 단, 두 함수 모두 정적 lookup·정규식으로 cheap 하므로 우선순위 낮음.

#### 3. ChecklistRow.tsx — `categoryToneClassName ?? ""` 사실상 도달 불가능 fallback
- **위치**: [src/components/checklist/ChecklistRow.tsx:127](../../../src/components/checklist/ChecklistRow.tsx#L127)
- **문제**: Badge 자체가 `categoryLabel` 있을 때만 렌더되는데, `categoryToneClassName ?? ""` 빈 문자열 fallback 은 호출부 컨벤션상 `categoryLabel` 와 항상 페어로 전달되는 값이라 실제로는 도달 안 됨.
- **권장 수정**: 타입에서 둘을 페어 처리 (`categoryLabel?: string` → `category?: { label: string; toneClassName: string }`) 하면 누락 시 컴파일 에러로 잡힘. 현 구조는 호출부 컨벤션에 의존.

#### 4. ChecklistRow.tsx + ChecklistItemRow.tsx — `PRIORITY_LABEL` 중복 정의
- **위치**: [src/components/checklist/ChecklistItemRow.tsx:10-14](../../../src/components/checklist/ChecklistItemRow.tsx#L10-L14), [src/components/timeline/WeekChecklistSection.tsx:14-18](../../../src/components/timeline/WeekChecklistSection.tsx#L14-L18)
- **문제**: 같은 우선순위 레이블 매핑이 두 wrapper 에 중복. `ChecklistRow` 가 priority + priorityLabel 을 둘 다 받는 구조라 우선순위 시각/음성 정합성을 wrapper 가 책임지지만, 매핑 자체는 도메인 상수.
- **권장 수정**: `src/types/checklist.ts` 또는 `src/lib/constants.ts` 에 `PRIORITY_LABEL` named export 로 단일화.

---

### Suggestion (개선 아이디어)

#### 1. data-token-classes.ts — 새 도메인 추가 시 lookup table + named export 페어 패턴 강제
DESIGN.md 헌법에 "헬퍼에 named export + lookup table 확장" 규칙이 명시되어 있지만 코드 차원 강제는 없음. 추가 도메인 도입 시 type-level 검증을 위해 `defineTokenLookup<T>(...)` 같은 공통 헬퍼로 감싸는 패턴을 검토할 수 있음.

#### 2. ChecklistRow.tsx — `priorityLabel` 자동 도출
현재 wrapper 에서 `priority` + `priorityLabel` 을 둘 다 전달. `priority` 만 받고 내부에서 라벨 자동 도출하면 호출부 단순화 + 라벨 일관성 보장. 단, 다국어 지원 시 호출부 주입이 더 유연하다는 트레이드오프.

#### 3. DashboardSlot enum — checklist/timeline 슬롯 사용처 부재
spec 정합성을 위해 `checklist`(pink) + `timeline`(mint) 슬롯을 정의하지만 현재 home 페이지 어디서도 사용하지 않음. 다음 라운드(예: home dashboard CTA 카드 추가)에서 사용 예정이 아니라면 dead code 가능. 사용처 추가 또는 주석으로 의도 명시 검토.

#### 4. WeekChecklistSection.tsx — 편집 form 분기 복잡도
ChecklistRow 추출로 row 영역은 깔끔해졌지만 편집 form 분기(20+ 라인 inline JSX)가 wrapper 본체에 그대로 남아있음. 다음 라운드에서 `<EditableChecklistRow>` 또는 `<ChecklistEditForm>` 로 분리하면 wrapper 가 toggle/edit/save 흐름만 다루게 됨.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 4건 |
| Suggestion | 4건 |
| 빌드 | 미실행 (Critical 없음) |

본 라운드는 spec 의 의도(row WCAG 정합 + 데이터→토큰 헬퍼 도입) 가 명확하고 변경 면적도 잘 격리되어 있어 즉시 차단 이슈가 없음. Warning 항목들은 후속 리팩터 라운드(`/refactor`) 에서 일괄 정리 가능.

---

<!-- STEP:refactor -->
## 리팩토링

> 작성일: 2026-05-10
> 관련 리뷰: [review.md](#코드-리뷰)

### 리팩토링한 파일 목록

- [src/lib/constants.ts](../../../src/lib/constants.ts) — `PRIORITY_LABEL` named export 추가
- [src/components/checklist/ChecklistItemRow.tsx](../../../src/components/checklist/ChecklistItemRow.tsx) — local `PRIORITY_LABEL` 제거, import 로 교체
- [src/components/timeline/WeekChecklistSection.tsx](../../../src/components/timeline/WeekChecklistSection.tsx) — 동일
- [src/components/checklist/ChecklistRow.tsx](../../../src/components/checklist/ChecklistRow.tsx) — 편집 버튼에 `onStartEdit &&` 가드 추가

총 4파일 수정.

---

### 작업별 내용

#### 1. ChecklistRow.tsx — 편집 버튼 `onStartEdit` 가드 추가
- **출처**: Warning #1 (review.md)
- **무엇을**: `isCustom` 분기 안 `<button onClick={onStartEdit}>` 을 `{onStartEdit && <button>...</button>}` 로 감쌌다.
- **왜**: `onStartEdit` 은 prop 타입상 optional 인데 가드 없이 렌더되면 callback 미전달 시 클릭이 silent fail. 같은 영역의 `DeleteConfirmDialog` 는 이미 `{onRemove && ...}` 가드가 있어 비대칭이었음. 이제 두 인터랙티브 모두 동일 패턴.

#### 2. PRIORITY_LABEL 단일화
- **출처**: Warning #4 (review.md)
- **무엇을**: 동일한 `Record<ChecklistItem["priority"], string>` 매핑이 `ChecklistItemRow.tsx` 와 `WeekChecklistSection.tsx` 에 중복 정의되어 있던 것을 [src/lib/constants.ts](../../../src/lib/constants.ts) 로 옮기고 두 wrapper 가 import.
- **왜**: 우선순위 라벨은 도메인 상수. 한쪽만 수정하면 다른 쪽이 어긋날 위험 → 단일 source of truth 로 통합.

---

### 의도적으로 SKIP 한 Warning 항목

#### Warning #2 — WeekChecklistSection inline 계산
- **사유**: `getCategoryTokenClass(item.category)` 와 `classifyNote(item.note)` 는 둘 다 정적 lookup·정규식으로 비용이 매우 작음 (한 카드 ~20 항목). useMemo 도입은 코드 복잡도만 늘리고 실측 이득이 거의 없음. 또한 spec.md `won't` 섹션이 "헬퍼 unit 테스트 X — 정적 lookup 함수, 빌드/타입체크가 검증 충분" 라고 디시플린을 명시했는데, 같은 정신에서 정적 lookup 결과를 매 렌더 호출하는 비용도 무시 가능하다고 판단.

#### Warning #3 — `categoryToneClassName ?? ""` fallback
- **사유**: 깨끗한 해결책은 `categoryLabel` + `categoryToneClassName` 을 단일 객체 prop 으로 묶는 것이지만 이는 `ChecklistRow` 의 public interface(props) 변경. 이 스킬은 "public interface를 바꾸지 않습니다" 원칙이라 SKIP. 현재 `?? ""` 는 방어적 fallback 으로 안전하게 동작 중. 다음 라운드에서 prop 모델을 묶어서 정정 가능.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `PRIORITY_LABEL` 정의 위치 | 2곳(중복) | 1곳(`src/lib/constants.ts`) |
| ChecklistRow 편집 버튼 가드 | 없음 (silent fail 위험) | `onStartEdit &&` 가드 |
| Warning 항목 처리 | 4건 미처리 | 2건 처리, 2건 의도적 SKIP (사유 기록) |
| 호출부 인터페이스 | 변동 없음 | 변동 없음 (public 안정) |

---

### 빌드 결과

성공 (1회 시도, `npm run build` Compiled in 2.9s).
