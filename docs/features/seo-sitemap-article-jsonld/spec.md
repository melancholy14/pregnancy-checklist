# seo-sitemap-article-jsonld 기획서 (간단판)

> 작성일: 2026-06-07  size: S
> 원 plan: [docs/plan/update-seo-aeo-geo.md](../../plan/update-seo-aeo-geo.md) PR-A + PR-D
> 1단계 sitemap absolute URL fix는 이미 머지 완료. 이 PR은 색인 가능 URL 확대와 Article 메타 풍부화가 목적.

## 1. 사용자 시나리오

검색엔진(Google·Bing)과 AI 크롤러(GPTBot·ClaudeBot·PerplexityBot)가 사이트맵을 fetch하면 누락 없이 27개 → 30개 URL을 받고, 각 URL의 `<lastmod>` 값이 매 빌드마다 흔들리지 않아 신선도 신호를 신뢰한다. 글 페이지를 크롤링하면 Article JSON-LD에서 대표 이미지·키워드·섹션·단어수까지 한 번에 수확해 검색결과 카드를 풍부하게 구성한다.

## 2. 기능 요구사항

### 2.1 결정 사항 (확정)

- **/videos 라우트**: `src/app/videos/page.tsx`의 meta-refresh 리다이렉트는 그대로 두고, **`sitemap.ts`에는 포함하지 않는다**. (정적 export 환경에서 `next.config.ts` redirect 불가, 현 meta-refresh + `robots: noindex` 조합이 외부 인바운드 보존 + 색인 차단의 최소 변경 해법.)
- **`lastModified` 전략**: `src/app/sitemap.ts` 상단에 `const BUILD_TIME = new Date()` 모듈 상수 1회 선언, 모든 정적 라우트가 이 값을 공유한다. (Article은 기존 `a.updated ?? a.date` 유지 — 문서가 안 바뀐 글의 lastModified가 빌드마다 바뀌는 노이즈 제거.)
- **`articleSection` 출처**: frontmatter `tags[0]`을 그대로 사용한다. 신규 `category` 필드는 도입하지 않는다. (12개 글 backfill 비용 없음, PR-C에서 frontmatter 재정비 시점에 함께 재고.)

### 2.2 must

**PR-A: Sitemap 라우트 보강**
- [src/app/sitemap.ts](../../../src/app/sitemap.ts)에 다음 4개 누락 라우트 추가:
  - `/info` (priority 0.7, monthly)
  - `/guides/hospital-bag` (priority 0.7, monthly)
  - `/guides/weekly-prep` (priority 0.7, monthly)
- `/videos`는 추가하지 않는다 (위 결정).
- 모든 정적 라우트의 `lastModified: new Date()`를 모듈 상수 `BUILD_TIME`으로 일괄 교체. Article 매핑은 변경 금지.

**PR-D: ArticleJsonLd 필드 보강** ([src/app/articles/[slug]/page.tsx:49-89](../../../src/app/articles/[slug]/page.tsx#L49-L89))
- 다음 5개 필드를 `ArticleJsonLd` 컴포넌트 jsonLd 객체에 추가:
  - `image`: `${BASE_URL}/articles/${slug}.webp` (글마다 동일 경로 규칙)
  - `mainEntityOfPage`: `{ "@type": "WebPage", "@id": canonical }`
  - `keywords`: `tags.join(", ")` (frontmatter `tags`가 있을 때만)
  - `articleSection`: `tags[0]` (tags가 비어있으면 필드 자체 미주입)
  - `wordCount`: 본문 markdown에서 코드 블록·이미지 alt 제외 후 공백 split 단어 수
- `ArticleJsonLd` props에 `slug`·`tags`·`content`(또는 `wordCount` 계산값) 추가 — 호출 측 [page.tsx:109-115](../../../src/app/articles/[slug]/page.tsx#L109-L115) 갱신.
- wordCount 계산 로직은 [src/lib/articles.ts](../../../src/lib/articles.ts) 또는 별도 pure 함수로 분리 (한 줄 정규식 + split, 단위 테스트 가능 형태).

### 2.3 won't

- **MedicalWebPage/HealthTopic 마크업**: 임상 출처 필드 부실 시 역효과 (원 plan §Skip 항목).
- **`reviewedBy` 자기 자신 마크업**: E-E-A-T 부적절.
- **frontmatter `category` 신규 필드**: 위 결정. 12개 글 backfill 비용 회피.
- **`BreadcrumbList` / `FAQPage` / `WebSite` / `Person` JSON-LD**: PR-B·C·E 범위, 이번 PR에서 손대지 않음.
- **`/videos` 라우트 삭제 또는 next.config redirect**: 정적 export 제약 + 인바운드 보존 위해 현 상태 유지.
- **git mtime 기반 lastModified**: gh-pages 빌드 환경에서 git 메타 안정성 검증 비용 > 이득.

## 3. 성공 기준

- 배포 후 `https://pregnancy-checklist.com/sitemap.xml` fetch 시 `<url>` 30개 정확히 출력 (기존 27 + /info + /guides/hospital-bag + /guides/weekly-prep), `/videos`는 포함되지 않음.
- 동일 커밋을 2회 연속 빌드해 sitemap을 diff했을 때 정적 라우트 `<lastmod>` 값이 한 빌드 안에서는 모두 동일하다 (모듈 상수 검증). Article `<lastmod>`는 frontmatter `updated`/`date` 기준으로 변화 없음.
- 임의 글 1개의 페이지 소스를 열어 Article JSON-LD에 `image`·`mainEntityOfPage`·`keywords`·`articleSection`·`wordCount` 5개 필드가 모두 들어 있다. Google Rich Results Test에서 "Valid Article" 통과 + 신규 5개 필드 인식.
- Search Console 1~2주 후 색인 카운트 27 → 30 도달 (원 plan §추적 지표).
