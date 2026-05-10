# design-bundle-e-finishing — 디자인 변경표

> 작성일: 2026-05-10
> 시각 시안 없음. 토큰·마크업 before→after 표만.
> spec: [./spec.md](./spec.md)

본 묶음은 4개 cleanup 패턴 × 25곳. 영역 구분으로 정렬.

---

## 1. shadow-md 정보 카드 → shadow-sm (Cross-8)

### 패턴 before/after

before
```tsx
<Card className="rounded-2xl shadow-md ... border border-black/4">
```
after
```tsx
<Card className="rounded-2xl shadow-sm ... border border-black/4">
```

### 적용 위치 6곳

| 영역 | 파일 | 카드 컨텍스트 |
|---|---|---|
| 체크리스트 | [ChecklistProgress.tsx:17](../../../src/components/checklist/ChecklistProgress.tsx#L17) | 진행률 정보 카드 |
| 체크리스트 | [ChecklistRelatedContent.tsx:25](../../../src/components/checklist/ChecklistRelatedContent.tsx#L25) | 관련 콘텐츠 정보 카드 |
| 체중 | [WeightChart.tsx:32](../../../src/components/weight/WeightChart.tsx#L32) | 차트 컨테이너 |
| 베이비페어 | [BabyfairContainer.tsx:201](../../../src/components/babyfair/BabyfairContainer.tsx#L201) | 참관 팁 정보 카드 |
| 타임라인 | [TimelineContainer.tsx:230](../../../src/components/timeline/TimelineContainer.tsx#L230) | 현재 주차 정보 카드 |
| 타임라인 | [TimelineContainer.tsx:242](../../../src/components/timeline/TimelineContainer.tsx#L242) | 전체 진행률 정보 카드 |

### 근거 (헌법)

[DESIGN.md §6.1](../../../DESIGN.md): "shadow-sm: Card at rest. The dominant elevation."
[DESIGN.md §6.2](../../../DESIGN.md): "shadow-md: Card hover, form cards (input-bearing surfaces). The slightly heavier shadow signals input-bearing."

페르소나 §5 AP6: "정보 카드에 shadow-md 이상 → shadow-sm".

---

## 2. "→" 텍스트 화살표 → `<ChevronRight>` (Cross-7)

### 패턴 before/after

before
```tsx
<Link href="...">
  타임라인에서 확인하기 →
</Link>
```
after
```tsx
<Link href="..." className="inline-flex items-center gap-1">
  타임라인에서 확인하기
  <ChevronRight size={16} aria-hidden="true" className="shrink-0" />
</Link>
```

또는 텍스트 안에 인라인 아이콘이 자연스러운 경우(목록 행):

before
```tsx
<span>{article.title} →</span>
```
after
```tsx
<span className="inline-flex items-center gap-1">
  <span>{article.title}</span>
  <ChevronRight size={16} aria-hidden="true" className="shrink-0" />
</span>
```

### 적용 위치 12곳

| 영역 | 파일·라인 | 현재 끝부분 |
|---|---|---|
| 홈 | [HomeContent.tsx:275](../../../src/components/home/HomeContent.tsx#L275) | `타임라인에서 확인하기 →` |
| 아티클 | [TimelineCTA.tsx:32](../../../src/components/articles/TimelineCTA.tsx#L32) | `타임라인 보기 →` |
| 아티클 | [RelatedContent.tsx:33](../../../src/components/articles/RelatedContent.tsx#L33) | `{c.icon} {c.title} →` |
| 아티클 | [RelatedContent.tsx:55](../../../src/components/articles/RelatedContent.tsx#L55) | `{v.title} →` |
| 타임라인 | [RelatedArticlesLink.tsx:27](../../../src/components/timeline/RelatedArticlesLink.tsx#L27) | `{article.title} →` |
| 타임라인 | [RelatedChecklistsLink.tsx:35](../../../src/components/timeline/RelatedChecklistsLink.tsx#L35) | `... {meta.title} →` |
| 타임라인 | [RelatedVideosLink.tsx:28](../../../src/components/timeline/RelatedVideosLink.tsx#L28) | `{video.title} →` |
| 체크리스트 | [ChecklistRelatedContent.tsx:42](../../../src/components/checklist/ChecklistRelatedContent.tsx#L42) | `{article.title} →` |
| 체크리스트 | [ChecklistRelatedContent.tsx:62](../../../src/components/checklist/ChecklistRelatedContent.tsx#L62) | `{week}주차 보기 →` |
| 체크리스트 | [ChecklistRelatedContent.tsx:82](../../../src/components/checklist/ChecklistRelatedContent.tsx#L82) | `{video.title} →` |
| 체중 | [WeightContainer.tsx:120](../../../src/components/weight/WeightContainer.tsx#L120) | `<span>→</span>` |
| 온보딩 | [ReadyStep.tsx:51](../../../src/components/onboarding/ReadyStep.tsx#L51) | `체크리스트 보러가기 →` |

### 근거

페르소나 §5 AP8: "→ 텍스트 화살표 → aria-hidden된 lucide 아이콘으로 교체."
스크린리더가 "오른쪽 화살표"라고 읽는 잡음 제거 + 시각 일관성.

---

## 3. 토큰 외 red → `--destructive` (Cross-9)

### 패턴 매핑

| 현재 | → 변경 |
|---|---|
| `text-red-400` (필수 표시 *) | `text-destructive` |
| `text-red-500` (삭제 텍스트) | `text-destructive` |
| `bg-red-500` (삭제 버튼 fill) | `bg-destructive` |
| `bg-red-600` (hover) | `bg-destructive/90` |
| `bg-red-50` (hover/rest soft) | `bg-destructive/10` |
| `bg-red-100` (hover) | `bg-destructive/20` |
| `text-white` (destructive 버튼 위) | `text-destructive-foreground` |

### 적용 위치 5곳 (라인 6개)

| # | 파일·라인 | 현재 | → 변경 |
|---|---|---|---|
| 1 | [UnifiedAddForm.tsx:139](../../../src/components/timeline/UnifiedAddForm.tsx#L139) | `<span className="text-red-400">*</span>` | `<span className="text-destructive">*</span>` |
| 2 | [UnifiedAddForm.tsx:170](../../../src/components/timeline/UnifiedAddForm.tsx#L170) | `<span className="text-red-400">*</span>` | `<span className="text-destructive">*</span>` |
| 3 | [ChecklistAddForm.tsx:72](../../../src/components/checklist/ChecklistAddForm.tsx#L72) | `<span className="text-red-400">*</span>` | `<span className="text-destructive">*</span>` |
| 4 | [DeleteConfirmDialog.tsx:26](../../../src/components/timeline/DeleteConfirmDialog.tsx#L26) | `p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-50 transition-colors` | `p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors` |
| 5 | [DeleteConfirmDialog.tsx:41](../../../src/components/timeline/DeleteConfirmDialog.tsx#L41) | `rounded-xl text-sm bg-red-500 hover:bg-red-600 text-white` | `rounded-xl text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground` |
| 6 | [WeightContainer.tsx:97](../../../src/components/weight/WeightContainer.tsx#L97) | `rounded-xl bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100` | `rounded-xl bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20` |

### 근거 (헌법)

[DESIGN.md §2.3](../../../DESIGN.md): "`--destructive` (#F07088): for actual destructive actions; reserve `--accent-red` for editorial emphasis only."
[globals.css L43-L44](../../../src/app/globals.css#L43-L44): `--destructive: #F07088; --destructive-foreground: #ffffff;`

페르소나 §5 AP5: "토큰 외 hex / Tailwind 기본 컬러 인라인 → 토큰으로 교체."

---

## 4. 토큰 외 hex → 토큰 / className (2곳)

### 4.1 ArticleDetail divider

[ArticleDetail.tsx:68](../../../src/components/articles/ArticleDetail.tsx#L68)

before
```tsx
<div className="h-px bg-gradient-to-r from-transparent via-[#F0EBE6] to-transparent mb-4" />
```
after
```tsx
<div className="h-px bg-gradient-to-r from-transparent via-black/5 to-transparent mb-4" />
```

근거: `#F0EBE6`는 `.article-prose --prose-divider` 스코프 토큰. chrome에서 직접 호출 불가. 가장 가까운 chrome 토큰은 `--border = rgba(0,0,0,0.05)` — Tailwind shorthand `via-black/5` = `rgba(0,0,0,0.05)`. 동일값.

⚠️ 시각 차이: 현재 베이지(`#F0EBE6`) → 변경 후 회색 5% (`rgba(0,0,0,0.05)`). cream canvas 위에서 살짝 더 차게 보일 수 있음. spec should §3 시각 검증.

### 4.2 WeekChecklistSection 카테고리 배지 텍스트 색

[WeekChecklistSection.tsx:206](../../../src/components/timeline/WeekChecklistSection.tsx#L206)

before
```tsx
<Badge
  className="text-xs px-2 py-0.5 rounded-md border-0 shrink-0 mt-0.5"
  style={{ backgroundColor: `${catColor}40`, color: "#3D4447" }}
>
```
after
```tsx
<Badge
  className="text-xs px-2 py-0.5 rounded-md border-0 shrink-0 mt-0.5 text-foreground"
  style={{ backgroundColor: `${catColor}40` }}
>
```

근거: `#3D4447` = `--foreground` 토큰값. 인라인 style을 className `text-foreground`로 이동. `backgroundColor: \`${catColor}40\``는 데이터 매핑 hex라 Cross-4 묶음 I 영역(본 라운드 won't).

---

## 5. 토큰 매핑 요약

| 변경 영역 | 사용 토큰 | 출처 |
|---|---|---|
| 정보 카드 elevation | `--shadow-sm` | globals.css L156 |
| 화살표 아이콘 | (Tailwind 기본 색 — text inherit) | lucide-react ChevronRight |
| 삭제·필수 표시 | `--destructive`, `--destructive-foreground` | globals.css L43-L44 |
| divider | `rgba(0,0,0,0.05)` (= `--border`) | DESIGN.md §2.1 |
| 카테고리 배지 텍스트 | `--foreground` | globals.css L13 |

새로 도입되는 토큰 0개. 기존 토큰만 사용.
