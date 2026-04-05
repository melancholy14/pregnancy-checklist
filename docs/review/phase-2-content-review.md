# Phase 2: 콘텐츠 강화 — 코드 리뷰

## 리뷰 대상 파일

- `src/types/article.ts`
- `src/types/video.ts`
- `src/lib/articles.ts`
- `src/app/articles/page.tsx`
- `src/app/articles/[slug]/page.tsx`
- `src/components/articles/ArticlesContainer.tsx`
- `src/components/articles/ArticleCard.tsx`
- `src/components/articles/ArticleDetail.tsx`
- `src/components/articles/TagFilter.tsx`
- `src/components/videos/ChannelCard.tsx`
- `src/components/videos/VideosContainer.tsx`
- `src/components/videos/VideoCard.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/components/home/HomeContent.tsx`
- `src/app/sitemap.ts`
- `src/app/guides/hospital-bag/page.tsx`
- `src/app/guides/weekly-prep/page.tsx`

총 17개 파일

---

## Critical 이슈 (즉시 수정 완료)

없음.

---

## Warning (수정 권장)

### 1. articles.ts — frontmatter 타입 단언 미검증

- **위치**: `src/lib/articles.ts:17`, `src/lib/articles.ts:44`
- **문제**: `data as ArticleMeta` 타입 단언으로 gray-matter frontmatter를 변환하지만, 실제 필드 존재 여부를 검증하지 않음. MD 파일에 `tags` 필드가 누락되면 `article.tags.includes()`(ArticlesContainer:18)와 `article.tags.map()`(ArticleCard:20)에서 `TypeError` 발생.
- **권장 수정**: 필수 필드 존재 여부를 확인하는 검증 함수 추가. 또는 `tags`에 기본값(`[]`) 할당.

```ts
function parseArticleMeta(data: Record<string, unknown>): ArticleMeta {
  return {
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    slug: String(data.slug ?? ""),
    tags: Array.isArray(data.tags) ? data.tags : [],
    date: String(data.date ?? ""),
    updated: data.updated ? String(data.updated) : undefined,
  };
}
```

### 2. ArticleDetail.tsx — dangerouslySetInnerHTML 사용

- **위치**: `src/components/articles/ArticleDetail.tsx:59`
- **문제**: `remark-html`이 생성한 HTML을 `dangerouslySetInnerHTML`로 렌더링. MD 파일은 repo에서 관리되므로 XSS 위험은 낮으나, `remark-html`의 `sanitize` 옵션을 사용하면 방어적 프로그래밍 가능.
- **현재 리스크**: 낮음 (MD 파일은 팀이 직접 관리하는 빌드타임 데이터)
- **권장 수정**: `remark().use(html, { sanitize: true })` 적용 시 `<script>` 등 위험 요소 자동 제거. 다만 table 등 합법적 HTML도 제거될 수 있으므로 trade-off 고려 필요.

### 3. articles.ts — getAllTags()가 파일을 중복 읽음

- **위치**: `src/lib/articles.ts:22-31`
- **문제**: `getAllTags()`가 내부에서 `getAllArticles()`를 호출하여 모든 MD 파일을 다시 읽음. `articles/page.tsx`에서 `getAllArticles()`와 `getAllTags()`를 각각 호출하므로 빌드 시 전체 MD 파일을 2번 읽게 됨.
- **영향**: 빌드 시간에만 영향 (5개 MD 파일이므로 현재 무시 가능). 글이 20개+ 되면 체감될 수 있음.
- **권장 수정**: `getAllTags(articles: ArticleMeta[])` 형태로 외부에서 articles를 전달받도록 변경.

```ts
export function getAllTags(articles: ArticleMeta[]): string[] {
  const tagSet = new Set<string>();
  for (const article of articles) {
    for (const tag of article.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}
```

---

## Suggestion (개선 아이디어)

### 1. HomeContent.tsx — Feature Grid 5개 항목 레이아웃

- 2열 그리드(`grid-cols-2`)에 5개 항목이 들어가면 마지막 "정보" 카드가 한 열에 혼자 위치함. `grid-cols-3` 사용 또는 마지막 항목에 `col-span-2` 적용으로 시각적 균형 개선 가능.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 3건 |
| Suggestion | 1건 |
| 빌드 | 미실행 (Critical 없음) |
