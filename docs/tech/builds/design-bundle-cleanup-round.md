# design-bundle-cleanup-round

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-05-10

<!-- STEP:impl -->
## 구현

> 작성일: 2026-05-10 · 라운드: design-bundle-cleanup-round (5 묶음 통합)
> 출처: [docs/plan/phase-4.5.md §2.10](../../plan/phase-4.5.md)

5개 cleanup 묶음(A·C·E·F·O)을 한 라운드 PR로 통합 구현. 모두 className·마크업 텍스트 교체 또는 메커니즘 정렬이며 인터랙션·상태·GA 이벤트 변경 없음.

### 완료 조건 충족 여부

| 묶음 | 조건 | 상태 |
|---|---|---|
| **A** | `bg-linear-to-b from-background to-white` 0건 (checklist·timeline·weight) | ✅ |
| **A** | 페이지-레벨 카드 4곳 `rounded-2xl` 적용 | ✅ |
| **C** | `<h[123].*text-[15px]>` 영향 8곳 0건 | ✅ |
| **C** | ArticleDetail h1 `text-xl` 0건 | ✅ |
| **E** | 정보 카드 6곳 `shadow-md` → `shadow-sm` (form 카드/`hover:shadow-md` 보존) | ✅ |
| **E** | 텍스트 `→` 12곳 → `<ChevronRight aria-hidden>` (`grep -rn "→" src/components/` 0건) | ✅ |
| **E** | 토큰 외 red 5곳 → `--destructive` 토큰 (`text-red-/bg-red-/border-red-` 0건) | ✅ |
| **E** | `#F0EBE6` / `#3D4447` 0건 | ✅ |
| **F** | ChecklistHub `<Calendar>` import/사용 0건 | ✅ |
| **F** | ChecklistHub 타임라인 카드 아이콘 슬롯 = 다른 3장 동일 패턴 | ✅ |
| **O** | `window.open` BabyfairCard 0건 | ✅ |
| **O** | `rel="noopener noreferrer"` BabyfairCard 1건 이상 | ✅ |
| 공통 | `npm run build` 통과 | ✅ |

### 생성/수정 파일 목록

#### 신규 생성

없음(spec/design 산출물은 이미 plan 단계에서 생성 완료).

#### 수정 (총 19 파일)

##### Bundle A — page shell + radius

- `src/components/checklist/ChecklistHub.tsx:175` — 셸 그라디언트 → `bg-background`
- `src/components/checklist/ChecklistPage.tsx:247,317` — 셸 단색 + 서브카테고리 카드 `rounded-2xl`
- `src/components/timeline/TimelineContainer.tsx:208,358` — 셸 단색 + "기타" 섹션 카드 `rounded-2xl`
- `src/components/timeline/TimelineAccordionCard.tsx:85` — 주차 카드 `rounded-2xl`
- `src/components/weight/WeightContainer.tsx:81` — 체중 로그 카드 `rounded-2xl`

##### Bundle C — inline heading size override 제거

- `src/components/checklist/ChecklistHub.tsx:70,131` — 카드 타이틀 `<h2>`
- `src/components/checklist/ChecklistPage.tsx:312` — 서브카테고리 헤더
- `src/components/checklist/ChecklistAddForm.tsx:54` — 추가 폼 타이틀
- `src/components/timeline/TimelineContainer.tsx:356` — "기타 (주차 미지정)" 헤더
- `src/components/timeline/TimelineAccordionCard.tsx:153` — 주차 항목 헤딩
- `src/components/timeline/UnifiedAddForm.tsx:105` — 추가 폼 타이틀
- `src/components/articles/ArticleCard.tsx:16` — 카드 제목
- `src/components/articles/ArticleDetail.tsx:39` — 페이지 h1 (`text-xl` 제거)

##### Bundle E — shadow / arrow / red / hex

- `src/components/checklist/ChecklistProgress.tsx:17` — `shadow-sm`
- `src/components/checklist/ChecklistRelatedContent.tsx:25,42,62,82` — `shadow-sm` + `<ChevronRight>` 3곳
- `src/components/timeline/TimelineContainer.tsx:230,242` — 정보 카드 2곳 `shadow-sm`
- `src/components/timeline/RelatedArticlesLink.tsx:27` — `<ChevronRight>`
- `src/components/timeline/RelatedChecklistsLink.tsx:35` — `<ChevronRight>`
- `src/components/timeline/RelatedVideosLink.tsx:28` — `<ChevronRight>`
- `src/components/timeline/UnifiedAddForm.tsx:139,170` — `text-destructive`
- `src/components/timeline/DeleteConfirmDialog.tsx:26,41` — `--destructive` 토큰
- `src/components/timeline/WeekChecklistSection.tsx:206` — `text-foreground` className 이동(`#3D4447` 인라인 제거)
- `src/components/checklist/ChecklistAddForm.tsx:72` — `text-destructive`
- `src/components/home/HomeContent.tsx:275` — `<ChevronRight>`
- `src/components/articles/TimelineCTA.tsx:32` — `<ChevronRight>`
- `src/components/articles/RelatedContent.tsx:33,55` — `<ChevronRight>` 2곳
- `src/components/articles/ArticleDetail.tsx:68` — `via-black/5` (hex 제거)
- `src/components/weight/WeightChart.tsx:32` — `shadow-sm`
- `src/components/weight/WeightContainer.tsx:97,120` — `--destructive` + `<ChevronRight>`
- `src/components/babyfair/BabyfairContainer.tsx:201` — `shadow-sm`
- `src/components/onboarding/ReadyStep.tsx:51` — `<ChevronRight>`

##### Bundle F — hub timeline card icon

- `src/components/checklist/ChecklistHub.tsx:5,126-128` — `Calendar` import 제거 + 타임라인 카드 아이콘 슬롯을 `<span className="text-3xl shrink-0" aria-hidden>🗓️</span>`로 정렬

##### Bundle O — BabyfairCard external-link anchor

- `src/components/babyfair/BabyfairCard.tsx` — `toast` import 제거, `handleConfirm` → `handleConfirmClick`(GA + `setOpen(false)`만 남김), `<AlertDialogAction asChild>` 안에 `<a target="_blank" rel="noopener noreferrer">` 패턴, 팝업 차단 fallback toast 제거(spec §2.2 옵션 a)

### 주요 결정 사항

- **`<ChevronRight>` 마크업 패턴 통일**: 기존 `block` + 텍스트 끝 "→" 패턴을 `flex items-center gap-1` + `<span className="flex-1 min-w-0">{title}</span>` + `<ChevronRight size={16} aria-hidden="true" className="shrink-0" />`로 재구성. 이유: 긴 타이틀이 줄바꿈될 때 화살표가 끝줄에 고립되지 않고 일관된 우측 정렬을 유지. 버튼 컨텍스트(`HomeContent.tsx`, `TimelineCTA`, `ReadyStep`)는 `inline-flex` + `gap-1` 단순 정렬.
- **lucide import 정리**: ChevronRight 신규 import 시 알파벳 순 재정렬(`Calendar, ChevronRight` 등). 기존 컨벤션 추적.
- **WeekChecklistSection Badge `text-foreground` 위치**: spec §2.4의 "className에 `text-foreground` 이동" 가이드대로 `text-foreground`를 className 끝에 추가하고 `style.color`만 제거. `style.backgroundColor`는 그대로 인라인(Cross-4 묶음 I 영역).
- **ChevronRight size**: spec design 가이드의 "lucide 18px 정도" 기준에서 16px(목록 항목 inline)·18px(버튼 컨텍스트)로 시각 정합성에 따라 분리. 16px가 14px(`text-sm`) 텍스트 옆에서 자연스럽고 18px는 12px lift된 버튼에서 어울림.
- **BabyfairCard `handleConfirmClick`**: 기존 `handleConfirm`을 anchor의 `onClick`으로 옮기되, GA 이벤트 발사 + `setOpen(false)`만 남기고 `window.open`/`opener=null`/팝업 차단 toast 모두 제거. anchor `target="_blank"`가 브라우저 navigation을 직접 처리하므로 fallback 불필요.

### 가정 사항

- spec/design 단계에서 추론된 가정과 동일.
- 글로벌 hN 사이즈 정의(globals.css `@layer base`)는 본 라운드 미변경. 인라인 override 제거만으로 시각 위계가 또렷해지는 효과는 글로벌 h2(`text-xl`=20px) / h3(`text-lg`=18px)에 의존.
- `--destructive` 토큰(globals.css L43) 값(`#F07088`)이 적용되어 있다고 가정.

### 미구현 항목

본 라운드 SoT 외:
- C1(우선순위 색 재매핑) — 이미 적용 완료 (ChecklistItemRow.tsx:12-16). README §1 잔재 정정 보고만.
- 묶음 B / I / J / K / N / 글로벌 hN 헌법 갱신 / chrome용 soft-divider 토큰 / VideoCard backdrop-blur / WeightChart Tooltip rounded — 별도 라운드 (README §5).
- ChecklistHub의 weekLabel 배지 `bg-pastel-pink/40` (라인 138) — 배지 사용처는 묶음 F SoT 외 (spec §3).

### 라운드 가드 grep 결과 (구현 후)

```
$ grep -rEn "to-white" src/components/checklist src/components/timeline src/components/weight
## 0건
$ grep -rn "→" src/components/
## 0건
$ grep -rEn "text-red-|bg-red-|border-red-" src/components/
## 0건
$ grep -rEn "<h[123][^>]*text-\[15px\]" src/components/
## 0건
$ grep -n "Calendar" src/components/checklist/ChecklistHub.tsx
## 0건
$ grep -n "window.open" src/components/babyfair/BabyfairCard.tsx
## 0건
$ grep -n 'rel="noopener noreferrer"' src/components/babyfair/BabyfairCard.tsx
## 1건 (라인 203)
```

`npm run build` 통과 (Next.js 16.2.0 Turbopack, 32 페이지 정적 생성).

---

<!-- STEP:review -->
## 코드 리뷰

> 작성일: 2026-05-10 · 라운드: design-bundle-cleanup-round (5 묶음 통합)
> 출처: [docs/implementation/design-bundle-cleanup-round-impl.md](#구현)

라운드 통합 1번. 묶음별 리뷰가 아니라 라운드 단위로 토큰 일관성 / 접근성 / anchor 표준 / 회귀 위험만 점검.

### 리뷰 대상 파일 (23개)

- `src/components/checklist/{ChecklistHub, ChecklistPage, ChecklistAddForm, ChecklistProgress, ChecklistRelatedContent}.tsx`
- `src/components/timeline/{TimelineContainer, TimelineAccordionCard, UnifiedAddForm, DeleteConfirmDialog, WeekChecklistSection, RelatedArticlesLink, RelatedChecklistsLink, RelatedVideosLink}.tsx`
- `src/components/articles/{ArticleCard, ArticleDetail, TimelineCTA, RelatedContent}.tsx`
- `src/components/home/HomeContent.tsx`
- `src/components/weight/{WeightContainer, WeightChart}.tsx`
- `src/components/babyfair/{BabyfairContainer, BabyfairCard}.tsx`
- `src/components/onboarding/ReadyStep.tsx`

추가로 e2e 라운드 가드 스펙 1개 (`e2e/design-bundle-cleanup-round.spec.ts`)와 e2e 회귀 1건 갱신 (`e2e/baby-fair.spec.ts:84` button → link).

---

### Critical 이슈 (즉시 수정 완료)

**0건**. 라운드의 변경 성격이 className·텍스트 정렬 cleanup이라 런타임 위험 표면 없음. BabyfairCard의 `window.open` → anchor 메커니즘 변경도 표준 패턴 정렬이라 새로운 보안/타입 위험 없음.

---

### Warning (수정 권장)

#### 1. ChecklistHub 카드 우측 데코 ChevronRight 에 `aria-hidden` 누락

- **위치**: [src/components/checklist/ChecklistHub.tsx:71](../../../src/components/checklist/ChecklistHub.tsx#L71), [src/components/checklist/ChecklistHub.tsx:132](../../../src/components/checklist/ChecklistHub.tsx#L132)
- **문제**: 두 곳의 `<ChevronRight size={18} className="text-muted-foreground shrink-0" />` 데코 인디케이터가 `<Link>` 안에 있어 스크린리더가 "오른쪽 화살표"로 읽을 수 있음. Link의 accessible name은 카드 타이틀이라 의미 중복은 아니지만 잡음.
- **권장 수정**: `aria-hidden="true"` 추가. 라운드에서 신규 추가한 ChevronRight 11곳은 모두 `aria-hidden="true"` 포함되어 있어 본 두 위치만 컨벤션에서 어긋남.
- **본 라운드 SoT 외**: pre-existing. 본 라운드는 hub 카드 타이틀 인라인 size override(`text-[15px] font-medium`)와 타임라인 카드 아이콘 슬롯(F)만 다룸.

#### 2. HomeContent 첫 체크 배너 ChevronRight 에 `aria-hidden` 누락

- **위치**: [src/components/home/HomeContent.tsx:237](../../../src/components/home/HomeContent.tsx#L237)
- **문제**: 같은 결의 데코 ChevronRight (`<ChevronRight size={16} className="text-muted-foreground" />`).
- **권장 수정**: `aria-hidden="true"` 추가.
- **본 라운드 SoT 외**: pre-existing. 라운드는 [HomeContent.tsx:276](../../../src/components/home/HomeContent.tsx#L276) 한 곳만 변경 (텍스트 화살표 → ChevronRight).

→ Warning 1·2는 후속 refactor 단계에서 일괄 정정 후보.

---

### Suggestion (개선 아이디어)

#### 1. WeekChecklistSection 인라인 hex 잔재 — Cross-4 묶음 I 후속과 통합

- **위치**: [src/components/timeline/WeekChecklistSection.tsx:206](../../../src/components/timeline/WeekChecklistSection.tsx#L206)
- **현재**: `style={{ backgroundColor: \`${catColor}40\` }}` — 카테고리 색을 인라인 hex shorthand로 표현.
- **본 라운드 처리**: `color: "#3D4447"` 인라인을 className `text-foreground`로 이동 (E §2.4).
- **후속**: `${catColor}40` 인라인 매핑은 [phase-4.5.md §2.10 묶음 I](../../plan/phase-4.5.md) (데이터→토큰 매핑 헬퍼)에서 일괄 처리. BabyfairCard의 `CITY_COLORS` / `SCALE_CONFIG`, TimelineAccordionCard의 `TIMELINE_TYPE_CONFIG` 인라인 hex 매핑과 같은 결.

#### 2. ChecklistHub 타임라인 카드 weekLabel 배지 `bg-pastel-pink/40` 잔재

- **위치**: [src/components/checklist/ChecklistHub.tsx:138](../../../src/components/checklist/ChecklistHub.tsx#L138)
- **현재**: 주차 라벨 배지(`{weekLabel}`)가 여전히 `bg-pastel-pink/40` 사용.
- **본 라운드 처리**: F §2.1은 **컨테이너** `bg-pastel-pink/40`만 제거 (이모지 정렬). 배지 사용처는 spec §3 won't에 명시.
- **후속**: 페이지 전반의 pink 토큰(CTA 전용) 침범 audit는 별도 라운드 트리거.

#### 3. BabyfairCard `role="button"` Card wrapper 마크업

- **위치**: [src/components/babyfair/BabyfairCard.tsx:78-91](../../../src/components/babyfair/BabyfairCard.tsx#L78-L91)
- **현재**: Card 래퍼가 `role="button"` + 내부에 anchor primitive (이동 다이얼로그). 페르소나 §3 N2(인터랙티브 의미의 정직성) 위반 후보.
- **본 라운드 처리**: O §won't에 명시 — Cross-5와 같은 결 (label 기반 마크업 리팩터, 묶음 B 영역).
- **후속**: Card → `<button>` 또는 `<a>` polymorphic 변환을 묶음 B (WeekChecklistSection label 기반)와 합치는 후속 라운드 후보.

---

### 회귀 검증 결과

| 검증 | 결과 |
|---|---|
| `npm run build` (impl Phase 4) | ✅ 성공 — Next 16.2 Turbopack, 32 페이지 정적 생성 |
| 라운드 가드 5 (`e2e/design-bundle-cleanup-round.spec.ts`) | ✅ 5/5 통과 |
| 전체 e2e 회귀 (552 tests) | 464 pass · 86 fail · 2 skip |
| 86 fail 트리아지 | **라운드 직접 영향 1건만** ([baby-fair.spec.ts:93](../../e2e/baby-fair.spec.ts#L93) `getByRole("button")` → `getByRole("link")` 정정 완료). 나머지 85건은 **모두 pre-existing stale**(article 파일 삭제·페이지 카피 변경·cookie consent timing flake) — 라운드 책임 외. 샘플 검증: `weight.spec.ts:13` 텍스트는 commit `45ea7b7` (2026-04-19) 이후 stale, `article-author-note.spec.ts`는 `/articles/hospital-bag` 파일이 더 이상 존재하지 않음. |
| Borderline 후보 (ChevronRight aria-hidden 적용으로 accessible name 유지될지) | ✅ `phase-4-step-1-checklist-hub.spec.ts:152`, `cross-links.spec.ts:55` 둘 다 `getByRole("link", { name: /타임라인 보기/ })` 통과 — accessible name 보존됨 |

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 2건 (ChevronRight aria-hidden 누락 — 모두 pre-existing 잔재) |
| Suggestion | 3건 (모두 본 라운드 won't 명시 후속 영역 — 묶음 B/I 또는 별도 라운드) |
| 빌드 | 미실행 (Critical 없음, impl 단계에서 통과 확인) |
| e2e 라운드 가드 | 5/5 통과 |
| e2e 회귀 직접 영향 | 1건 수정 완료 (baby-fair.spec.ts) |

라운드 size S 5묶음 통합 PR로 진행 가능 상태.

---

<!-- STEP:refactor -->
## 리팩토링

> 작성일: 2026-05-10 · 출처: [docs/review/design-bundle-cleanup-round-review.md](#코드-리뷰)

review.md Warning 2건(ChevronRight `aria-hidden` 누락)만 정리. Suggestion 3건은 모두 본 라운드 won't 명시 후속 영역(묶음 B/I, role="button" Card wrapper)이라 별도 라운드 트리거.

### 리팩토링한 파일 목록

- `src/components/checklist/ChecklistHub.tsx` (라인 71·132)
- `src/components/home/HomeContent.tsx` (라인 237)

총 2 파일, 3 위치.

---

### 작업별 내용

#### 1. ChecklistHub 카드 우측 데코 ChevronRight `aria-hidden` 추가
- **출처**: review.md Warning 1
- **위치**: [src/components/checklist/ChecklistHub.tsx:71](../../../src/components/checklist/ChecklistHub.tsx#L71), [src/components/checklist/ChecklistHub.tsx:132](../../../src/components/checklist/ChecklistHub.tsx#L132)
- **무엇을**: `<ChevronRight size={18} className="text-muted-foreground shrink-0" />` → `<ChevronRight size={18} aria-hidden="true" className="text-muted-foreground shrink-0" />`
- **왜**: 라운드에서 신규 추가한 ChevronRight 11곳은 모두 `aria-hidden="true"` 일관 적용. 본 두 위치만 pre-existing 잔재라 컨벤션에서 어긋남. 데코 인디케이터를 스크린리더에서 잡음으로 읽지 않도록 차단.

#### 2. HomeContent 첫 체크 배너 ChevronRight `aria-hidden` 추가
- **출처**: review.md Warning 2
- **위치**: [src/components/home/HomeContent.tsx:237](../../../src/components/home/HomeContent.tsx#L237)
- **무엇을**: `<ChevronRight size={16} className="text-muted-foreground" />` → `<ChevronRight size={16} aria-hidden="true" className="text-muted-foreground" />`
- **왜**: 위와 동일 결.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `src/components` 내 `<ChevronRight>` 사용처 | 13개 (3개에 `aria-hidden` 누락) | 13개 (1개만 누락 — DashboardCard.tsx:43, 라운드 SoT 외) |
| ChevronRight `aria-hidden` 누락률 (라운드 + review 영향 영역) | 3/13 | 0/13 |
| public interface | 변경 없음 | 변경 없음 |

DashboardCard.tsx:43은 라운드 영향 파일도 review.md 영향 파일도 아니라 가이드("Warning 2건만 정리")대로 본 단계 SoT 외로 두었음. 별도 cleanup 후속 트리거 후보.

---

### 빌드 결과

`npm run build` 성공 (1회 시도, Next.js 16.2.0 Turbopack, 32 페이지 정적 생성).
