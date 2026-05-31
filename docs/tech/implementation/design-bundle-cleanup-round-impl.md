# design-bundle-cleanup-round Implementation

> 작성일: 2026-05-10 · 라운드: design-bundle-cleanup-round (5 묶음 통합)
> 출처: [docs/plan/phase-4.5.md §2.10](../../plan/phase-4.5.md)

5개 cleanup 묶음(A·C·E·F·O)을 한 라운드 PR로 통합 구현. 모두 className·마크업 텍스트 교체 또는 메커니즘 정렬이며 인터랙션·상태·GA 이벤트 변경 없음.

## 완료 조건 충족 여부

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

## 생성/수정 파일 목록

### 신규 생성

없음(spec/design 산출물은 이미 plan 단계에서 생성 완료).

### 수정 (총 19 파일)

#### Bundle A — page shell + radius

- `src/components/checklist/ChecklistHub.tsx:175` — 셸 그라디언트 → `bg-background`
- `src/components/checklist/ChecklistPage.tsx:247,317` — 셸 단색 + 서브카테고리 카드 `rounded-2xl`
- `src/components/timeline/TimelineContainer.tsx:208,358` — 셸 단색 + "기타" 섹션 카드 `rounded-2xl`
- `src/components/timeline/TimelineAccordionCard.tsx:85` — 주차 카드 `rounded-2xl`
- `src/components/weight/WeightContainer.tsx:81` — 체중 로그 카드 `rounded-2xl`

#### Bundle C — inline heading size override 제거

- `src/components/checklist/ChecklistHub.tsx:70,131` — 카드 타이틀 `<h2>`
- `src/components/checklist/ChecklistPage.tsx:312` — 서브카테고리 헤더
- `src/components/checklist/ChecklistAddForm.tsx:54` — 추가 폼 타이틀
- `src/components/timeline/TimelineContainer.tsx:356` — "기타 (주차 미지정)" 헤더
- `src/components/timeline/TimelineAccordionCard.tsx:153` — 주차 항목 헤딩
- `src/components/timeline/UnifiedAddForm.tsx:105` — 추가 폼 타이틀
- `src/components/articles/ArticleCard.tsx:16` — 카드 제목
- `src/components/articles/ArticleDetail.tsx:39` — 페이지 h1 (`text-xl` 제거)

#### Bundle E — shadow / arrow / red / hex

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

#### Bundle F — hub timeline card icon

- `src/components/checklist/ChecklistHub.tsx:5,126-128` — `Calendar` import 제거 + 타임라인 카드 아이콘 슬롯을 `<span className="text-3xl shrink-0" aria-hidden>🗓️</span>`로 정렬

#### Bundle O — BabyfairCard external-link anchor

- `src/components/babyfair/BabyfairCard.tsx` — `toast` import 제거, `handleConfirm` → `handleConfirmClick`(GA + `setOpen(false)`만 남김), `<AlertDialogAction asChild>` 안에 `<a target="_blank" rel="noopener noreferrer">` 패턴, 팝업 차단 fallback toast 제거(spec §2.2 옵션 a)

## 주요 결정 사항

- **`<ChevronRight>` 마크업 패턴 통일**: 기존 `block` + 텍스트 끝 "→" 패턴을 `flex items-center gap-1` + `<span className="flex-1 min-w-0">{title}</span>` + `<ChevronRight size={16} aria-hidden="true" className="shrink-0" />`로 재구성. 이유: 긴 타이틀이 줄바꿈될 때 화살표가 끝줄에 고립되지 않고 일관된 우측 정렬을 유지. 버튼 컨텍스트(`HomeContent.tsx`, `TimelineCTA`, `ReadyStep`)는 `inline-flex` + `gap-1` 단순 정렬.
- **lucide import 정리**: ChevronRight 신규 import 시 알파벳 순 재정렬(`Calendar, ChevronRight` 등). 기존 컨벤션 추적.
- **WeekChecklistSection Badge `text-foreground` 위치**: spec §2.4의 "className에 `text-foreground` 이동" 가이드대로 `text-foreground`를 className 끝에 추가하고 `style.color`만 제거. `style.backgroundColor`는 그대로 인라인(Cross-4 묶음 I 영역).
- **ChevronRight size**: spec design 가이드의 "lucide 18px 정도" 기준에서 16px(목록 항목 inline)·18px(버튼 컨텍스트)로 시각 정합성에 따라 분리. 16px가 14px(`text-sm`) 텍스트 옆에서 자연스럽고 18px는 12px lift된 버튼에서 어울림.
- **BabyfairCard `handleConfirmClick`**: 기존 `handleConfirm`을 anchor의 `onClick`으로 옮기되, GA 이벤트 발사 + `setOpen(false)`만 남기고 `window.open`/`opener=null`/팝업 차단 toast 모두 제거. anchor `target="_blank"`가 브라우저 navigation을 직접 처리하므로 fallback 불필요.

## 가정 사항

- spec/design 단계에서 추론된 가정과 동일.
- 글로벌 hN 사이즈 정의(globals.css `@layer base`)는 본 라운드 미변경. 인라인 override 제거만으로 시각 위계가 또렷해지는 효과는 글로벌 h2(`text-xl`=20px) / h3(`text-lg`=18px)에 의존.
- `--destructive` 토큰(globals.css L43) 값(`#F07088`)이 적용되어 있다고 가정.

## 미구현 항목

본 라운드 SoT 외:
- C1(우선순위 색 재매핑) — 이미 적용 완료 (ChecklistItemRow.tsx:12-16). README §1 잔재 정정 보고만.
- 묶음 B / I / J / K / N / 글로벌 hN 헌법 갱신 / chrome용 soft-divider 토큰 / VideoCard backdrop-blur / WeightChart Tooltip rounded — 별도 라운드 (README §5).
- ChecklistHub의 weekLabel 배지 `bg-pastel-pink/40` (라인 138) — 배지 사용처는 묶음 F SoT 외 (spec §3).

## 라운드 가드 grep 결과 (구현 후)

```
$ grep -rEn "to-white" src/components/checklist src/components/timeline src/components/weight
# 0건
$ grep -rn "→" src/components/
# 0건
$ grep -rEn "text-red-|bg-red-|border-red-" src/components/
# 0건
$ grep -rEn "<h[123][^>]*text-\[15px\]" src/components/
# 0건
$ grep -n "Calendar" src/components/checklist/ChecklistHub.tsx
# 0건
$ grep -n "window.open" src/components/babyfair/BabyfairCard.tsx
# 0건
$ grep -n 'rel="noopener noreferrer"' src/components/babyfair/BabyfairCard.tsx
# 1건 (라인 203)
```

`npm run build` 통과 (Next.js 16.2.0 Turbopack, 32 페이지 정적 생성).
