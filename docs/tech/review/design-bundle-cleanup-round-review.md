# design-bundle-cleanup-round 코드 리뷰

> 작성일: 2026-05-10 · 라운드: design-bundle-cleanup-round (5 묶음 통합)
> 출처: [docs/implementation/design-bundle-cleanup-round-impl.md](../implementation/design-bundle-cleanup-round-impl.md)

라운드 통합 1번. 묶음별 리뷰가 아니라 라운드 단위로 토큰 일관성 / 접근성 / anchor 표준 / 회귀 위험만 점검.

## 리뷰 대상 파일 (23개)

- `src/components/checklist/{ChecklistHub, ChecklistPage, ChecklistAddForm, ChecklistProgress, ChecklistRelatedContent}.tsx`
- `src/components/timeline/{TimelineContainer, TimelineAccordionCard, UnifiedAddForm, DeleteConfirmDialog, WeekChecklistSection, RelatedArticlesLink, RelatedChecklistsLink, RelatedVideosLink}.tsx`
- `src/components/articles/{ArticleCard, ArticleDetail, TimelineCTA, RelatedContent}.tsx`
- `src/components/home/HomeContent.tsx`
- `src/components/weight/{WeightContainer, WeightChart}.tsx`
- `src/components/babyfair/{BabyfairContainer, BabyfairCard}.tsx`
- `src/components/onboarding/ReadyStep.tsx`

추가로 e2e 라운드 가드 스펙 1개 (`e2e/design-bundle-cleanup-round.spec.ts`)와 e2e 회귀 1건 갱신 (`e2e/baby-fair.spec.ts:84` button → link).

---

## Critical 이슈 (즉시 수정 완료)

**0건**. 라운드의 변경 성격이 className·텍스트 정렬 cleanup이라 런타임 위험 표면 없음. BabyfairCard의 `window.open` → anchor 메커니즘 변경도 표준 패턴 정렬이라 새로운 보안/타입 위험 없음.

---

## Warning (수정 권장)

### 1. ChecklistHub 카드 우측 데코 ChevronRight 에 `aria-hidden` 누락

- **위치**: [src/components/checklist/ChecklistHub.tsx:71](../../src/components/checklist/ChecklistHub.tsx#L71), [src/components/checklist/ChecklistHub.tsx:132](../../src/components/checklist/ChecklistHub.tsx#L132)
- **문제**: 두 곳의 `<ChevronRight size={18} className="text-muted-foreground shrink-0" />` 데코 인디케이터가 `<Link>` 안에 있어 스크린리더가 "오른쪽 화살표"로 읽을 수 있음. Link의 accessible name은 카드 타이틀이라 의미 중복은 아니지만 잡음.
- **권장 수정**: `aria-hidden="true"` 추가. 라운드에서 신규 추가한 ChevronRight 11곳은 모두 `aria-hidden="true"` 포함되어 있어 본 두 위치만 컨벤션에서 어긋남.
- **본 라운드 SoT 외**: pre-existing. 본 라운드는 hub 카드 타이틀 인라인 size override(`text-[15px] font-medium`)와 타임라인 카드 아이콘 슬롯(F)만 다룸.

### 2. HomeContent 첫 체크 배너 ChevronRight 에 `aria-hidden` 누락

- **위치**: [src/components/home/HomeContent.tsx:237](../../src/components/home/HomeContent.tsx#L237)
- **문제**: 같은 결의 데코 ChevronRight (`<ChevronRight size={16} className="text-muted-foreground" />`).
- **권장 수정**: `aria-hidden="true"` 추가.
- **본 라운드 SoT 외**: pre-existing. 라운드는 [HomeContent.tsx:276](../../src/components/home/HomeContent.tsx#L276) 한 곳만 변경 (텍스트 화살표 → ChevronRight).

→ Warning 1·2는 후속 refactor 단계에서 일괄 정정 후보.

---

## Suggestion (개선 아이디어)

### 1. WeekChecklistSection 인라인 hex 잔재 — Cross-4 묶음 I 후속과 통합

- **위치**: [src/components/timeline/WeekChecklistSection.tsx:206](../../src/components/timeline/WeekChecklistSection.tsx#L206)
- **현재**: `style={{ backgroundColor: \`${catColor}40\` }}` — 카테고리 색을 인라인 hex shorthand로 표현.
- **본 라운드 처리**: `color: "#3D4447"` 인라인을 className `text-foreground`로 이동 (E §2.4).
- **후속**: `${catColor}40` 인라인 매핑은 [phase-4.5.md §2.10 묶음 I](../plan/phase-4.5.md) (데이터→토큰 매핑 헬퍼)에서 일괄 처리. BabyfairCard의 `CITY_COLORS` / `SCALE_CONFIG`, TimelineAccordionCard의 `TIMELINE_TYPE_CONFIG` 인라인 hex 매핑과 같은 결.

### 2. ChecklistHub 타임라인 카드 weekLabel 배지 `bg-pastel-pink/40` 잔재

- **위치**: [src/components/checklist/ChecklistHub.tsx:138](../../src/components/checklist/ChecklistHub.tsx#L138)
- **현재**: 주차 라벨 배지(`{weekLabel}`)가 여전히 `bg-pastel-pink/40` 사용.
- **본 라운드 처리**: F §2.1은 **컨테이너** `bg-pastel-pink/40`만 제거 (이모지 정렬). 배지 사용처는 spec §3 won't에 명시.
- **후속**: 페이지 전반의 pink 토큰(CTA 전용) 침범 audit는 별도 라운드 트리거.

### 3. BabyfairCard `role="button"` Card wrapper 마크업

- **위치**: [src/components/babyfair/BabyfairCard.tsx:78-91](../../src/components/babyfair/BabyfairCard.tsx#L78-L91)
- **현재**: Card 래퍼가 `role="button"` + 내부에 anchor primitive (이동 다이얼로그). 페르소나 §3 N2(인터랙티브 의미의 정직성) 위반 후보.
- **본 라운드 처리**: O §won't에 명시 — Cross-5와 같은 결 (label 기반 마크업 리팩터, 묶음 B 영역).
- **후속**: Card → `<button>` 또는 `<a>` polymorphic 변환을 묶음 B (WeekChecklistSection label 기반)와 합치는 후속 라운드 후보.

---

## 회귀 검증 결과

| 검증 | 결과 |
|---|---|
| `npm run build` (impl Phase 4) | ✅ 성공 — Next 16.2 Turbopack, 32 페이지 정적 생성 |
| 라운드 가드 5 (`e2e/design-bundle-cleanup-round.spec.ts`) | ✅ 5/5 통과 |
| 전체 e2e 회귀 (552 tests) | 464 pass · 86 fail · 2 skip |
| 86 fail 트리아지 | **라운드 직접 영향 1건만** ([baby-fair.spec.ts:93](../../e2e/baby-fair.spec.ts#L93) `getByRole("button")` → `getByRole("link")` 정정 완료). 나머지 85건은 **모두 pre-existing stale**(article 파일 삭제·페이지 카피 변경·cookie consent timing flake) — 라운드 책임 외. 샘플 검증: `weight.spec.ts:13` 텍스트는 commit `45ea7b7` (2026-04-19) 이후 stale, `article-author-note.spec.ts`는 `/articles/hospital-bag` 파일이 더 이상 존재하지 않음. |
| Borderline 후보 (ChevronRight aria-hidden 적용으로 accessible name 유지될지) | ✅ `phase-4-step-1-checklist-hub.spec.ts:152`, `cross-links.spec.ts:55` 둘 다 `getByRole("link", { name: /타임라인 보기/ })` 통과 — accessible name 보존됨 |

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 2건 (ChevronRight aria-hidden 누락 — 모두 pre-existing 잔재) |
| Suggestion | 3건 (모두 본 라운드 won't 명시 후속 영역 — 묶음 B/I 또는 별도 라운드) |
| 빌드 | 미실행 (Critical 없음, impl 단계에서 통과 확인) |
| e2e 라운드 가드 | 5/5 통과 |
| e2e 회귀 직접 영향 | 1건 수정 완료 (baby-fair.spec.ts) |

라운드 size S 5묶음 통합 PR로 진행 가능 상태.
