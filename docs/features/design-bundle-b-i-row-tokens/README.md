# design-bundle-b-i-row-tokens

> 작성일: 2026-05-10 | 작성자: Claude Code
> 관련 산출물: [spec.md](./spec.md) · [design.md](./design.md) · [review.md](./review.md) · [meta.md](./meta.md)

## 개요

phase-4.5 묶음 B + 묶음 I 통합 라운드. **묶음 B** 는 `/checklist/<slug>` · `/timeline` 항목 행을 row-as-button → label + native checkbox 마크업으로 정정해 WCAG 4.1.2(interactive 중첩 금지) 정합을 회복한다 (`ChecklistRow` 공통 컴포넌트 추출). **묶음 I** 는 home·timeline·baby-fair 의 인라인 hex backgroundColor 를 헬퍼 함수(`src/lib/data-token-classes.ts`) 결과 클래스로 옮겨 5-pastel role 정합을 컴파일 시점에 강제한다 — `large` scale + `hospital` category 의 pink → peach 재매핑 + 17 도시 → 4 행정구역 그룹 재매핑 포함.

---

## 구현 내용

### 완료 조건 충족 여부

#### 묶음 I

| 조건 | 상태 |
|------|------|
| `style={{ backgroundColor }}` 헬퍼 대상 4파일에서 0건 | ✅ |
| 4파일 hex 0건 (`#FFD4DE`·`#FFE0CC`·`#D0EDE2`·`#E4D6F0`·`#FFF4D4`) | ✅ |
| 신규 `data-token-classes.ts` + 4종 named export + union literal 타입 | ✅ |
| TypeScript 빌드 통과 | ✅ |
| `bg-pastel-pink` in helper = `checklist` slot 1건만 | ✅ |
| DESIGN.md §10 헌법 1단락 머지 | ✅ |

#### 묶음 B

| 조건 | 상태 |
|------|------|
| ChecklistItemRow + WeekChecklistSection 에서 `role="button"`/`aria-pressed` 0건 | ✅ |
| 신규 `ChecklistRow.tsx` + 두 wrapper 에서 import | ✅ |
| 5개 E2E spec 셀렉터 마이그레이션 (+ p9-empty-state 추가) | ✅ |

#### 공통

| 조건 | 상태 |
|------|------|
| phase-4.5.md §2.9 Cross-4·Cross-5 ✅ 마크 + §2.10 묶음 B/I 마크 | ✅ |

### 생성/수정 파일

**신규**:
- [src/lib/data-token-classes.ts](../../../src/lib/data-token-classes.ts) — 도메인 → 토큰 클래스 매핑 헬퍼 (`getCityTokenClass`·`getScaleTokenClass`·`getCategoryTokenClass`·`getDashboardIconBgClass`)
- [src/components/checklist/ChecklistRow.tsx](../../../src/components/checklist/ChecklistRow.tsx) — checklist + timeline 공유 row 컴포넌트 (label + native checkbox)

**수정**:
- [src/components/babyfair/BabyfairCard.tsx](../../../src/components/babyfair/BabyfairCard.tsx) — `SCALE_CONFIG.color` + `CITY_COLORS` 제거, 헬퍼 호출
- [src/components/timeline/WeekChecklistSection.tsx](../../../src/components/timeline/WeekChecklistSection.tsx) — `CATEGORY_COLORS` 제거, row 마크업을 `<ChecklistRow>` 호출로 교체
- [src/components/checklist/ChecklistItemRow.tsx](../../../src/components/checklist/ChecklistItemRow.tsx) — wrapper화 (편집 form + `upcoming_item_view` 발사 보존, 본체는 `<ChecklistRow>`)
- [src/components/checklist/ChecklistPage.tsx](../../../src/components/checklist/ChecklistPage.tsx) — `<ChecklistItemRow>` 호출에 `slug={meta.slug}` prop 추가
- [src/components/home/DashboardCard.tsx](../../../src/components/home/DashboardCard.tsx) — `color: string` prop → `slot: DashboardSlot`
- [src/components/home/HomeContent.tsx](../../../src/components/home/HomeContent.tsx) — DashboardCard 4개 호출의 `color="#..."` → `slot="babyfair|weight|video|info"`
- [DESIGN.md](../../../DESIGN.md) — §10 Don't 끝부분에 "데이터 → 토큰 매핑은 헬퍼 경유 의무" 1단락 추가
- [docs/plan/phase-4.5.md](../../plan/phase-4.5.md) — §2.9 Cross-4·Cross-5 + §2.10 묶음 B/I ✅ 마크
- E2E spec 6개 마이그레이션 (5개 spec + p9-empty-state)
- [src/lib/constants.ts](../../../src/lib/constants.ts) — `PRIORITY_LABEL` 공통 상수 추가 (refactor 단계)

### 주요 결정 사항

- **DashboardSlot enum 확장**: spec 의 4종(`checklist|timeline|weight|info`) 외에 `babyfair`·`video` 2종 더 정의. 실제 home 미니카드(baby-fair·weight·video·articles)와 spec 가정(체크리스트·타임라인·체중·정보) 사이의 불일치를 "won't 색 변화 0" 제약을 지키면서 해소.
- **`Partial<Record<...>>` 사용**: design.md §3.2의 `Record<...>` 정의와 달리 실제 데이터에 spec 매핑 외 카테고리(예: `health`)가 존재하므로 fallback 안전하게 `Partial` + `?? DEFAULT_TONE` 패턴.
- **ChecklistItemRow `slug` prop 추가**: 같은 페이지에서 같은 item id 충돌 가능성을 차단해 label `htmlFor` ↔ input `id` 매칭 신뢰성 확보.
- **p9-empty-state.spec.ts 추가 마이그레이션**: spec.md §2.10 의 5 spec 외에 같은 row-as-button 패턴을 사용하는 spec 도 자동으로 깨지므로 함께 마이그레이션.

### 가정 사항 및 미구현 항목

- TimelineAccordionCard.tsx 의 `style={{ backgroundColor }}` 2건은 본 라운드 spec 4파일 호출부 매트릭스 외 — 별도 cross 헬퍼(week color, type config) 도입 검토 필요.
- 헬퍼 unit 테스트 미작성 — spec.md `won't` 명시 (정적 lookup, 빌드/타입체크가 검증 충분).
- 모바일 320px row 시각 회귀 수동 검증은 운영자 검증 가이드 항목.

---

## 코드 리뷰 결과

### Critical 이슈

없음 — 본 라운드는 row 마크업 정합 + 색 토큰 매핑 분리 위주 리팩터로 런타임 크래시·보안·잘못된 조건문 이슈 미발견.

### Warning (수정 권장)

1. **ChecklistRow 편집 버튼 `onStartEdit` 가드 부재** — silent fail 위험, DeleteConfirmDialog 와 비대칭. → refactor 단계에서 처리.
2. **WeekChecklistSection inline 계산** — `getCategoryTokenClass`·`classifyNote` 매 렌더 호출. perf 영향 미미, refactor SKIP.
3. **`categoryToneClassName ?? ""` 도달 불가능 fallback** — public interface 변경 필요로 refactor SKIP.
4. **`PRIORITY_LABEL` 2곳 중복 정의** — 단일 SoT 통합 필요. → refactor 단계에서 처리.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 4건 (2건 처리, 2건 의도적 SKIP) |
| Suggestion | 4건 |

상세: [docs/review/design-bundle-b-i-row-tokens-review.md](../../review/design-bundle-b-i-row-tokens-review.md)

---

## 리팩토링 내용

### 작업 목록

1. **ChecklistRow.tsx** — 편집 버튼에 `onStartEdit &&` 가드 추가. DeleteConfirmDialog 와 동일 패턴으로 silent fail 방지.
2. **`PRIORITY_LABEL` 단일화** — `src/lib/constants.ts` 에 named export 로 추가, ChecklistItemRow + WeekChecklistSection 두 wrapper 가 import. 도메인 상수의 single source of truth 확립.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `PRIORITY_LABEL` 정의 위치 | 2곳 중복 | 1곳 (`src/lib/constants.ts`) |
| ChecklistRow 편집 버튼 가드 | 없음 (silent fail 위험) | `onStartEdit &&` 가드 |
| Warning 처리 | 4건 미처리 | 2건 처리, 2건 의도적 SKIP (사유 기록) |
| 호출부 인터페이스 | 변동 없음 | 변동 없음 (public 안정) |

상세: [docs/refactor/design-bundle-b-i-row-tokens-refactor.md](../../refactor/design-bundle-b-i-row-tokens-refactor.md)

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path — 묶음 I 데이터→토큰 매핑 | ✅ 4개 passed |
| Happy Path — 묶음 B row 마크업 | ✅ 5개 passed |
| Error / Validation (회귀 0건) | ✅ 2개 passed |
| 권한 / 인증 (state 분기) | ✅ 1개 passed |
| 반응형 (Mobile 375px) | ✅ 2개 passed |
| **전체** | **14 passed / 0 failed** |

영향받은 4개 spec 추가 회귀 검증: 48 passed / 0 failed (design-bundle-d, design-bundle-g, checklist-recommendation-semantics, p9-empty-state).

📊 상세 리포트: `playwright-report/index.html`

---

## 파이프라인 산출물

| 단계 | 산출물 |
|---|---|
| 기획 | [spec.md](./spec.md) · [design.md](./design.md) · [meta.md](./meta.md) · [review.md](./review.md) |
| 구현 | [docs/implementation/design-bundle-b-i-row-tokens-impl.md](../../implementation/design-bundle-b-i-row-tokens-impl.md) |
| 코드 리뷰 | [docs/review/design-bundle-b-i-row-tokens-review.md](../../review/design-bundle-b-i-row-tokens-review.md) |
| 리팩토링 | [docs/refactor/design-bundle-b-i-row-tokens-refactor.md](../../refactor/design-bundle-b-i-row-tokens-refactor.md) |
| E2E | [e2e/design-bundle-b-i-row-tokens.spec.ts](../../../e2e/design-bundle-b-i-row-tokens.spec.ts) |
