# design-bundle-c-heading-size — 디자인 변경표

> 작성일: 2026-05-10
> 시각 시안 없음. 토큰·마크업 before→after 표만.
> spec: [./spec.md](./spec.md)

## 1. 글로벌 hN 사이즈 (참조)

[src/app/globals.css @layer base](../../../src/app/globals.css#L490-L515):

| Selector | font-size | font-weight | line-height | letter-spacing | 픽셀 환산 |
|---|---|---|---|---|---|
| `h1` | `var(--text-2xl)` (1.5rem) | 700 | 1.35 | -0.025em | **24px** |
| `h2` | `var(--text-xl)` (1.25rem) | 600 | 1.4 | -0.02em | **20px** |
| `h3` | `var(--text-lg)` (1.125rem) | 600 | 1.45 | -0.01em | **18px** |
| `h4` | `var(--text-base)` (1rem) | 600 | 1.5 | — | **16px** |

본 라운드는 위 글로벌 사이즈를 **그대로 사용**한다. 인라인으로 덮어 쓰던 `text-[15px] font-medium` (15px / 500) 또는 `text-xl` (h1에 적용된 20px)을 제거.

---

## 2. 영역별 before → after

### 2.1 체크리스트 허브 카드 타이틀

[ChecklistHub.tsx:70](../../../src/components/checklist/ChecklistHub.tsx#L70), [ChecklistHub.tsx:131](../../../src/components/checklist/ChecklistHub.tsx#L131)

before
```tsx
<h2 className="text-[15px] font-medium text-foreground">{title}</h2>
```
after
```tsx
<h2 className="text-foreground">{title}</h2>
```

### 2.2 체크리스트 상세 서브카테고리 헤더

[ChecklistPage.tsx:312](../../../src/components/checklist/ChecklistPage.tsx#L312)

before
```tsx
<h2 className="text-[15px] font-medium">{sub.label}</h2>
```
after
```tsx
<h2>{sub.label}</h2>
```

### 2.3 체크리스트 항목 추가 폼 타이틀

[ChecklistAddForm.tsx:54](../../../src/components/checklist/ChecklistAddForm.tsx#L54)

before
```tsx
<h3 className="text-[15px] font-medium mb-4">새 항목 추가</h3>
```
after
```tsx
<h3 className="mb-4">새 항목 추가</h3>
```

### 2.4 타임라인 "기타" 섹션 헤더

[TimelineContainer.tsx:356](../../../src/components/timeline/TimelineContainer.tsx#L356)

before
```tsx
<h2 className="text-[15px] font-medium text-muted-foreground">기타 (주차 미지정)</h2>
```
after
```tsx
<h2 className="text-muted-foreground">기타 (주차 미지정)</h2>
```

### 2.5 타임라인 주차 카드 항목 헤딩

[TimelineAccordionCard.tsx:153](../../../src/components/timeline/TimelineAccordionCard.tsx#L153)

before
```tsx
<h3 className="text-[15px] font-medium">{item.title}</h3>
```
after
```tsx
<h3>{item.title}</h3>
```

### 2.6 타임라인 항목 추가 폼 타이틀

[UnifiedAddForm.tsx:105](../../../src/components/timeline/UnifiedAddForm.tsx#L105)

before
```tsx
<h3 className="text-[15px] font-medium mb-4">새 항목 추가</h3>
```
after
```tsx
<h3 className="mb-4">새 항목 추가</h3>
```

### 2.7 아티클 카드 제목

[ArticleCard.tsx:16](../../../src/components/articles/ArticleCard.tsx#L16)

before
```tsx
<h3 className="text-[15px] leading-snug mb-2">{article.title}</h3>
```
after
```tsx
<h3 className="leading-snug mb-2">{article.title}</h3>
```

### 2.8 아티클 상세 페이지 h1

[ArticleDetail.tsx:39](../../../src/components/articles/ArticleDetail.tsx#L39)

before
```tsx
<h1 className="text-xl mb-2">{article.title}</h1>
```
after
```tsx
<h1 className="mb-2">{article.title}</h1>
```

---

## 3. 위계 회복 시각 차이 (개념적)

| 영역 | 현재 (인라인) | 변경 후 (글로벌) | 시각 차이 |
|---|---|---|---|
| 카드 타이틀 (h2 인라인) | 15px / 500 | 20px / 600 | +5px, +1단계 굵기 |
| 카드 항목 (h3 인라인) | 15px / 500 | 18px / 600 | +3px, +1단계 굵기 |
| 폼 타이틀 (h3 인라인) | 15px / 500 | 18px / 600 | +3px, +1단계 굵기 |
| 아티클 카드 (h3 인라인) | 15px / 600 | 18px / 600 | +3px |
| 아티클 상세 h1 | 20px / 600 (text-xl) | 24px / 700 (text-2xl) | +4px, +1단계 굵기 |

위계 회복 결과: 페이지 = 24px h1 → 섹션 = 20px h2 → 서브섹션·카드 항목 = 18px h3 → 컴팩트 라벨 = 16px h4. DESIGN.md §3.2 4단 위계가 코드에 그대로 드러남.

---

## 4. 토큰 매핑 요약

| 사용 토큰 | 출처 |
|---|---|
| `--text-2xl` (1.5rem) | h1 글로벌 |
| `--text-xl` (1.25rem) | h2 글로벌 |
| `--text-lg` (1.125rem) | h3 글로벌 |
| `--text-base` (1rem) | h4 글로벌 (본 라운드 미변경) |
| `--foreground`, `--muted-foreground` | 텍스트 색 (인라인 className 그대로 유지) |

새로 도입되는 토큰 0개. 인라인 `text-[15px]` / `text-xl` / `font-medium`만 제거.
