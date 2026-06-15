# seo-sitemap-article-jsonld 코드 리뷰

리뷰일: 2026-06-07
대상 spec: [docs/features/seo-sitemap-article-jsonld/spec.md](../../features/seo-sitemap-article-jsonld/spec.md)
대상 impl: [docs/implementation/seo-sitemap-article-jsonld-impl.md](../implementation/seo-sitemap-article-jsonld-impl.md)

## 리뷰 대상 파일
- `src/types/article.ts`
- `src/lib/articles.ts`
- `src/app/sitemap.ts`
- `src/app/articles/[slug]/page.tsx`

---

## Critical 이슈 (즉시 수정 완료)

없음.

---

## Warning (수정 권장)

### 1. articles.ts — `contentLines.join("\n")` 중복 호출
- **위치**: [src/lib/articles.ts:109, src/lib/articles.ts:115](../../../src/lib/articles.ts#L109-L115)
- **문제**: `getArticleBySlug` 안에서 disclaimer를 분리한 `contentLines.join("\n")` 결과를 `remark().process(...)` 와 `countWords(...)` 두 곳에서 호출한다. 빌드 1회 N개 글 처리이므로 실제 비용은 무시할 수준이지만, 가독성 측면에서 동일 표현을 두 번 쓰는 건 의도 노출이 약하다.
- **권장 수정**: `const mainContent = contentLines.join("\n")` 로 1회 추출 후 두 곳에서 참조. refactor 단계 candidate.

### 2. articles.ts — `countWords` 정규식 순서 가정이 주석 없이 박혀 있음
- **위치**: [src/lib/articles.ts:15-21](../../../src/lib/articles.ts#L15-L21)
- **문제**: code fence → inline code → image 순서로 strip하는 이유가 코드만 보면 안 드러난다. 인라인 코드(`` `x` ``) 안의 image 마크다운이 inline code 단계에서 통째로 제거되는 의도된 동작이 있는데, 미래 자기 자신이 순서를 바꾸면 동작이 미세하게 바뀐다.
- **권장 수정**: 운영 메모리 정책상 "WHY가 비명시적"일 때만 한 줄 주석. 1줄 추가 또는 함수명 옆 `(strip order matters)` 정도. refactor 단계 candidate — 또는 의도된 동작을 unit test가 이미 잠그고 있으므로 보류 가능.

### 3. page.tsx — ArticleJsonLd props 타입 인라인 정의
- **위치**: [src/app/articles/[slug]/page.tsx:49-67](../../../src/app/articles/%5Bslug%5D/page.tsx#L49-L67)
- **문제**: props 8필드를 인라인 객체 타입으로 박아뒀다. `Article` 타입과 거의 1:1 대응이므로 `Pick<Article, "title" | "description" | ...>` 로 줄일 수 있다. 현 인라인 정의는 `Article` 변경 시 두 곳을 동시에 손대야 하는 약한 결합.
- **권장 수정**: `type ArticleJsonLdProps = Pick<Article, "title" | "description" | "canonical" | "date" | "updated" | "slug" | "tags" | "wordCount">`. refactor 단계 candidate.

---

## Suggestion (개선 아이디어)

### 1. articles.ts — `countWords` 위치
- 모듈명은 도메인 일반 명사인데 함수는 명확히 metadata 계산 보조다. 향후 readingTime 같은 비슷한 함수가 늘면 `src/lib/articles/metadata.ts` 같은 서브 모듈 분리 검토.

### 2. sitemap.ts — `BUILD_TIME` 재현성
- `output: "export"` 환경에서 빌드 1회당 1번 평가됨. 동일 커밋 2회 빌드 시 lastmod 값은 분 단위로 다르다 (정확히 같으려면 git commit time 기반으로 잡아야 함). spec의 회귀 가드는 "한 빌드 안에서 동일"만 보장하면 충분하다고 결정했으므로 이 차이는 의도된 한계. PR 설명에 명시 검토.

### 3. page.tsx — `image` URL 가드
- `image: ${BASE_URL}/articles/${slug}.webp`가 실제 파일 존재를 가정한다. P4.5/4.6/4.7에서 모든 article에 webp가 생성됨을 전제로 하지만, 신규 글 추가 시 webp 누락이 발생하면 SERP에서 broken image. 빌드 단계에서 `out/articles/<slug>.webp` 존재 검증을 추가하면 회귀 방지에 유효 — 별도 PR 후보.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 3건 (`contentLines.join` 중복, strip 순서 가정 비명시, ArticleJsonLd props 인라인 타입) |
| Suggestion | 3건 (countWords 위치, BUILD_TIME 재현성, image URL 가드) |
| 빌드 | 미실행 (Critical 0건) |
