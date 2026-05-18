# design-bundle-b-i-row-tokens Implementation

> 작성일: 2026-05-10
> 관련 스펙: [spec.md](../features/design-bundle-b-i-row-tokens/spec.md)
> 관련 디자인: [design.md](../features/design-bundle-b-i-row-tokens/design.md)

## 완료 조건 충족 여부

### 묶음 I

| 조건 | 상태 | 비고 |
|------|------|------|
| `grep -rn 'style={{ backgroundColor' src/` 결과 0 (스펙 대상 4파일) | ✅ 완료 | BabyfairCard·WeekChecklistSection·DashboardCard·HomeContent 모두 helper 사용. TimelineAccordionCard 2건은 본 라운드 범위 외(별도 라운드 검토 필요) |
| 4파일 hex 0건 (`#FFD4DE`·`#FFE0CC`·`#D0EDE2`·`#E4D6F0`·`#FFF4D4`) | ✅ 완료 | grep 0건 |
| 신규 `src/lib/data-token-classes.ts` + 4종 named export + `DataToneClass`·`DashboardSlotClass` union literal | ✅ 완료 | |
| TypeScript 빌드 통과 | ✅ 완료 | `npm run build` 성공 |
| `bg-pastel-pink` in helper = `DashboardSlotClass`·`checklist` slot 1건만 | ✅ 완료 | union 정의 1줄 + checklist 매핑 1줄 |
| DESIGN.md §10 헌법 1단락 머지 | ✅ 완료 | §10 Don't 끝부분에 "데이터 → 토큰 매핑은 헬퍼 경유 의무" 추가 |

### 묶음 B

| 조건 | 상태 | 비고 |
|------|------|------|
| ChecklistItemRow·WeekChecklistSection에서 `role="button"`·`aria-pressed` 0건 | ✅ 완료 | grep 0건 |
| 신규 `ChecklistRow.tsx` 1파일 + 두 wrapper에서 import | ✅ 완료 | |
| E2E 5개 spec 셀렉터 마이그레이션 (`getByRole("checkbox", { name })` 또는 `label` locator) | ✅ 완료 | 추가로 p9-empty-state.spec.ts도 `aria-pressed` 의존이 있어 함께 마이그레이션 |

### 공통

| 조건 | 상태 | 비고 |
|------|------|------|
| phase-4.5.md §2.9 Cross-4·Cross-5 ✅ 완료 마크 + 산출물 링크 | ✅ 완료 | |
| phase-4.5.md §2.10 묶음 B/I ✅ 완료 마크 + 링크 | ✅ 완료 | |

## 생성/수정 파일 목록

### 신규 생성

- `src/lib/data-token-classes.ts` — 도메인 데이터 → 토큰 클래스 매핑 헬퍼 (4종 named export + `DataToneClass`·`DashboardSlotClass` union literal 타입)
- `src/components/checklist/ChecklistRow.tsx` — checklist + timeline 공유 row 컴포넌트 (label 기반 native checkbox 마크업)
- `docs/implementation/design-bundle-b-i-row-tokens-impl.md` — 본 문서

### 수정

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

## 주요 결정 사항

### DashboardSlot enum 확장

- **결정**: `DashboardSlot` 을 spec의 4종(`checklist|timeline|weight|info`)에 추가로 `babyfair|video` 2종 더 정의 (총 6종).
- **이유**: 스펙은 home 미니카드를 "checklist/timeline/weight/info" 4개로 가정하지만 실제 [HomeContent.tsx](../../src/components/home/HomeContent.tsx) 의 미니카드 4개는 baby-fair·weight·video·articles 다. 스펙의 "won't 색 변화 0" 제약을 지키려면 yellow(video) + mint(baby-fair) 매핑이 필요. spec 4종은 정의 그대로 보존하여 success criterion `bg-pastel-pink` 1건(=checklist 슬롯) 통과는 만족.
- **매핑**: `babyfair → bg-pastel-mint/40` (현 #D0EDE2 보존), `video → bg-pastel-yellow/40` (현 #FFF4D4 보존). 나머지는 spec 그대로.

### `Partial<Record<...>>` 사용

- **결정**: `CITY_TO_GROUP`·`SCALE_TO_TONE`·`CATEGORY_TO_TONE` 모두 `Partial<Record<...>>`로 선언, lookup 결과에 `?? DEFAULT_TONE` fallback.
- **이유**: design.md §3.2는 `Record<ChecklistItem["category"], DataToneClass>` 를 보였지만 `ChecklistItem["category"]` 타입은 15개 키를 가지는데 spec 매핑은 5개만 명시. 또 실제 데이터에 `health` 카테고리가 있어 타입 정의 자체와 어긋나는 항목까지 안전하게 fallback 처리해야 함. helper 자체에 `?? DEFAULT_TONE` 가드가 있으므로 Partial 가 의도와 더 일치.

### ChecklistItemRow `slug` prop 추가

- **결정**: `<ChecklistItemRow>` 에 `slug` prop 신규 추가 → `<ChecklistRow id={\`checklist-row-${slug}-${item.id}\`} ... />` 로 unique input id 생성.
- **이유**: 같은 페이지에 여러 슬러그(예: 미래 시나리오)나 같은 item id 가 중복될 가능성을 차단. label `htmlFor` ↔ input `id` 매칭 신뢰성 확보. WeekChecklistSection 도 `timeline-row-${slug}-${item.id}` 패턴으로 정합.

### ChecklistRow `noteType` prop 도입

- **결정**: ChecklistRow 외부에서 `noteType={classifyNote(...)}` 을 미리 계산해 전달. ChecklistRow 내부에서 다시 분류하지 않음.
- **이유**: ChecklistItemRow 가 이미 `useMemo(() => classifyNote(item.note))` 로 캐싱 중. timeline 호출부도 같은 패턴 따라가도록 정합.

### p9-empty-state.spec.ts 추가 마이그레이션 (spec 5개 spec 외)

- **결정**: spec.md §2.10 의 5개 spec 외에 [p9-empty-state.spec.ts](../../e2e/p9-empty-state.spec.ts)도 `[role="button"][aria-pressed]` 셀렉터를 사용해 row를 잡고 있어 마이그레이션 대상에 포함.
- **이유**: spec 의 셀렉터 마이그레이션 5개 spec 리스트는 명시적 회귀 검증 5개 — 그 외 같은 패턴을 쓰는 spec 도 자동으로 깨지므로 함께 마이그레이션. 스펙 의도("전체 e2e 통과")와 정합.

## 가정 사항

- spec 의 `home 미니카드 4개 = 체크리스트·타임라인·체중·정보` 가정은 실제 코드와 다르나(baby-fair·weight·video·articles), spec 의 "won't 색 변화 0" 제약을 우선시해 enum 을 확장하는 방향으로 해석.
- `health` 카테고리는 `ChecklistCategory` 타입에 정의되지 않은 채 데이터에만 존재하나 본 라운드 영향 X — `getCategoryTokenClass` fallback (`DEFAULT_TONE = lavender/40`) 로 처리.
- `partial Record<string, ...>` 의 string 키 lookup 은 명시적 union 보다 약한 타입 안전성을 가지나 spec 의도(외부 데이터 lookup) 와 정합.
- TimelineAccordionCard.tsx 의 `style={{ backgroundColor }}` 2건은 본 라운드 spec 의 4파일 호출부 매트릭스에 포함되지 않아 그대로 두었음(타임라인 주차 원형 + 타입 Badge — 다른 매핑 도메인).

## 미구현 항목

- TimelineAccordionCard.tsx 의 `style={{ backgroundColor }}` 2건 — 본 라운드 범위 외, 별도 cross 헬퍼(week color, type config) 도입 검토 필요.
- 헬퍼 unit 테스트 — spec.md `won't` 명시 (정적 lookup, 빌드/타입체크가 검증 충분).
- 모바일 320px row 시각 회귀 수동 검증 — design.md §12 의 운영자 검증 가이드 항목.
