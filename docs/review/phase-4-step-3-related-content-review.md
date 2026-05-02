# Phase 4 Step 3 — 아티클 하단 관련 콘텐츠 추천 코드 리뷰

## 리뷰 대상 파일
- `src/lib/related-content.ts`
- `src/components/articles/RelatedArticles.tsx`
- `src/components/articles/RelatedContent.tsx`
- `src/components/articles/ArticleDetail.tsx`
- `src/app/articles/[slug]/page.tsx`

---

## Critical 이슈 (즉시 수정 완료)

없음.

---

## Warning (수정 권장)

없음.

---

## Suggestion (개선 아이디어)

### 1. `src/app/articles/[slug]/page.tsx` — `getAllArticles()` 빌드 시 중복 호출
- **위치**: `src/app/articles/[slug]/page.tsx:25, 106`
- **내용**: `generateStaticParams`와 `ArticlePage` 양쪽에서 `getAllArticles()`를 호출한다. 8개 아티클 정적 빌드 시 9회 호출 → 매 호출마다 디렉토리 전체 읽기·gray-matter 파싱이 일어난다.
- **현 시점 영향**: 콘텐츠가 8개라 빌드 시간 영향이 미미해 Critical/Warning 수준은 아님. 콘텐츠가 수십~수백 개로 늘어나면 모듈 레벨 캐시 또는 React `cache()` 도입을 고려할 만함.
- **제안**: 향후 콘텐츠 증가 시 `lib/articles.ts`에 한 번 읽고 캐싱하는 헬퍼 추가.

### 2. `src/lib/related-content.ts` — Jaccard 계산 시 중복 순회
- **위치**: `src/lib/related-content.ts:13-25`
- **내용**: 각 아티클마다 `intersect = filter(...).length` 후 `union = new Set([...]).size`로 두 번 순회. 8개 글 기준 무시할 수준이지만 한 번의 순회로 둘 다 계산 가능.
- **제안**: 확장 시 `for (const tag of a.tags)` 단일 패스로 intersect/union 카운트 → tag 집합 크기 변화에 강한 구현.

### 3. `src/components/articles/RelatedContent.tsx` — 클릭 시 GA 이벤트 미전송
- **위치**: `src/components/articles/RelatedContent.tsx` 전체
- **내용**: 체크리스트 / 영상 링크 클릭이 `content_click` GA 이벤트를 송출하지 않음. `ArticleCard.tsx`·`VideoCardCompact.tsx`는 `onClick`에 `sendGAEvent`를 붙여 둠.
- **현 시점 판단**: Plan에서 명시적으로 Out of Scope. RelatedArticles는 `ArticleCard` 재사용으로 자연스럽게 GA가 붙음.
- **제안**: 추후 회유 효과 측정이 필요할 때 RelatedContent 내부 링크에도 동일 패턴 적용. 추적 강도를 높이려면 `placement: "article-related"` 같은 메타도 함께 보내면 회유 위치별 분석 가능.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견 |
| Warning | 0건 |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 수정 없음) |

### 리뷰 코멘트

- `dangerouslySetInnerHTML`은 `ArticleDetail.tsx`와 `page.tsx`의 JSON-LD 두 곳에서 사용되지만, 본문은 `rehype-sanitize`를 통과한 결과이고 JSON-LD는 직접 구성한 정적 객체의 직렬화이므로 XSS 위험은 없다.
- `videos as VideoItem[]`, `(hospitalBag as ChecklistData)` 형태의 타입 단언은 JSON 모듈 import에 한정해 기존 페이지(`src/app/checklist/hospital-bag/page.tsx` 등)와 동일한 관용을 따른다. 신규 도입이 아니다.
- `RelatedContent`는 `ChecklistRelatedContent`의 패턴(타임라인/영상 hash 링크는 `<a>`)을 그대로 이어받아 Next.js 16 App Router의 hash 누적 버그를 회피한다.
- `getRelatedArticles`는 score 동률 시 최신 글 우선이라 fallback 단계가 자연스럽게 최신 글 보충 역할을 한다. 정렬 비교에서 `Date(...).getTime()`을 매 비교마다 호출하지만 8개 글 기준 무시 수준.
