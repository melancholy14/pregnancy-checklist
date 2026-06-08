# faq-jsonld 기획서

> 작성일: 2026-06-08  size: M
> 관련 리뷰: [review.md](./review.md)
> 원 plan: [docs/plan/update-seo-aeo-geo.md](../../plan/update-seo-aeo-geo.md) PR-C

## review.md 결정사항 참조

- **항목 1 (A)**: frontmatter `faq:` 가 단일 진실. 본문 마크다운의 `## 자주 묻는 질문` 섹션은 제거하고 `ArticleDetail` 이 `article.faq` 배열을 받아 본문 영역에 직접 렌더한다. 운영자는 frontmatter에만 입력.
- **항목 2 (A)**: PR-C 한 PR 안에서 5개 글 일괄 backfill. 1차 소스 검수도 같은 PR. 한 글이라도 1차 소스 부족이면 그 글 자체를 발행 전에 보강 (PR-C 머지를 지연시키지 않기 위해 검수 불가 글은 운영자 판단으로 빼고 사유를 PR description에 기재).
- **항목 3 (A)**: strict. parser는 schema 위반 시 throw → CI 빌드 fail-fast. fs-level grep 가드로 5개 글 frontmatter에 `faq:` 키 존재 + 글 페이지 HTML에 `"@type":"FAQPage"` 주입 강제 확인. `test.skip`/`it.skip` 금지.

## 1. 배경·목적

- **운영자 관점**: AEO(AI Overview·"사람들이 묻는 질문"·Featured Snippet) 노출 1순위 신호. 사이트 신뢰가 핵심인 임신·출산 도메인에서 ChatGPT·Perplexity·Google이 답변 소스로 인용할 가능성을 높임.
- **사용자 관점**: SERP·LLM 답변에서 사이트 카드가 풍부도 ↑ → CTR 상승 기대. 직접 글 진입 시에도 FAQ가 본문 영역에 일관된 위치에서 노출되어 빠른 답변 탐색 가능.
- **측정 관점**: GSC "사람들이 묻는 질문" 형태 검색어 노출·클릭 추세 추적. (GA4 신규 이벤트 없음 — 이 기능은 SEO/AEO 영역.)

## 2. 사용자 시나리오

- **시나리오 1 (정상 흐름 — 검색 노출)**: Google·Bing 검색 사용자가 "임신 초기 검사 시기" 질의 → SERP에 사이트 글 카드 + 펼침형 FAQ 표시 → 사용자가 카드 내 질문 클릭 → 글 페이지의 동일 FAQ 영역으로 진입.
- **시나리오 2 (글 직접 진입 — 본문 FAQ 영역)**: 사용자가 글 페이지 진입 → 본문 마지막에 FAQ 섹션 자동 렌더 (frontmatter `faq:` 배열에서) → 질문 클릭 또는 스크롤로 답변 확인. 본문 ↔ JSON-LD 텍스트는 정의상 동일 (SSOT).
- **시나리오 3 (FAQ 없는 글)**: frontmatter `faq:` 가 없거나 빈 배열이면 본문 영역에 FAQ 섹션 미렌더 + 글 페이지에 FAQPage JSON-LD 미주입. SEO 효과 없이도 정상 발행.
- **시나리오 4 (운영자 신규 글 작성)**: 운영자가 글 작성 시 본문에는 `## 자주 묻는 질문` 섹션을 적지 않고 frontmatter `faq:` 만 채움. blog-writer-persona.md의 갱신된 룰을 따른다.
- **시나리오 5 (malformed frontmatter — strict 차단)**: 운영자가 frontmatter `faq:` 에 `q` 또는 `a` 누락, 빈 문자열, non-array 입력 → `npm run build` 실패 (parseArticleMeta throw) → 운영자가 빌드 로그에서 실패 글·필드를 확인하고 수정.

## 3. 기능 요구사항

### must

- **타입 추가**: [src/types/article.ts](../../../src/types/article.ts) `ArticleMeta` 에 `faq?: Array<{ q: string; a: string }>` 필드 추가.
- **parser strict validation** ([src/lib/articles.ts](../../../src/lib/articles.ts) `parseArticleMeta`):
  - `data.faq` 가 `undefined` 또는 빈 배열이면 `faq: undefined` 로 정상 통과.
  - `data.faq` 가 배열이면 각 원소가 `{ q: string non-empty, a: string non-empty }` 인지 검사. 위반 시 `throw new Error("Article <slug>: faq[i] invalid — <필드명> <위반 사유>")`.
  - `data.faq` 가 배열이 아닌 경우(예: object, string)도 throw.
  - 최소 길이는 `q.trim().length > 0 && a.trim().length > 0` 만 강제. 글자수 상한은 강제하지 않음.
- **FAQ 본문 렌더링**: [src/components/articles/ArticleDetail.tsx](../../../src/components/articles/ArticleDetail.tsx) 에서 `article.faq` 가 있고 length > 0 이면 본문 `dangerouslySetInnerHTML` 직후, `TimelineCTA` 앞에 FAQ 섹션을 렌더한다.
  - 섹션 헤더 `<h2>자주 묻는 질문</h2>` 와 각 항목은 기존 본문 마크다운 FAQ와 시각적으로 동일 (`.article-prose` 컨벤션 유지).
  - 답변(`a`) 의 인라인 마크다운(링크 `[text](url)`, 강조 `**bold**`)은 `remark` 동일 파이프라인으로 HTML 변환 — `src/lib/articles.ts` 에 답변 마크다운 → HTML 변환 헬퍼 추가하거나 build 시 한 번에 처리.
- **FAQPage JSON-LD 주입**: [src/app/articles/[slug]/page.tsx](../../../src/app/articles/[slug]/page.tsx) 에서 `article.faq` 가 있으면 별도 `<FaqPageJsonLd>` 컴포넌트(또는 인라인 함수)로 두 번째 `<script type="application/ld+json">` 태그를 ArticleJsonLd 다음에 주입.
  - schema:
    ```json
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "<q>", "acceptedAnswer": { "@type": "Answer", "text": "<a stripped of inline markdown>" } }
      ]
    }
    ```
  - `acceptedAnswer.text` 는 마크다운 인라인을 제거한 plain text (Google FAQ 가이드라인). 변환 헬퍼는 unit 테스트로 보호.
- **본문 마크다운 FAQ 섹션 제거 (5개 글)**: 다음 5개 글의 본문에서 `## 자주 묻는 질문` 헤더와 그 아래 Q&A 블록을 모두 제거하고, 같은 내용을 frontmatter `faq:` 배열로 옮긴다.
  - [src/content/articles/early-pregnancy-tests.md](../../../src/content/articles/early-pregnancy-tests.md) (5문항)
  - [src/content/articles/early-pregnancy-fatigue-reasons.md](../../../src/content/articles/early-pregnancy-fatigue-reasons.md) (5문항)
  - [src/content/articles/2026-parental-leave-guide.md](../../../src/content/articles/2026-parental-leave-guide.md) (5문항)
  - [src/content/articles/babyfair-survival-guide.md](../../../src/content/articles/babyfair-survival-guide.md) (6문항)
  - [src/content/articles/pregnancy-foods-to-avoid.md](../../../src/content/articles/pregnancy-foods-to-avoid.md) (5문항)
- **운영 룰 추가** ([docs/content/blog-writer-persona.md](../../content/blog-writer-persona.md) 또는 동등 SoT):
  - "FAQ는 frontmatter `faq:` 에만 작성. 본문에 `## 자주 묻는 질문` 헤더로 직접 적지 않는다."
  - "FAQ 답변은 1차 소스 검수 후 추가. 1차 소스 미확인 글은 frontmatter `faq:` 자체를 비워둔다 (`test.skip` 등 우회 금지)." ← review.md 항목 3 결정 반영.
  - "답변 인라인 마크다운(링크·강조)은 허용. 단 JSON-LD 출력 시 plain text로 stripping 됨을 인지."
  - "**FAQ 답변에 ⚠️ 그림문자 사용 금지**. MEMORY 의 feedback_warning_emoji_rule — 본문/FAQ 박스의 ⚠️ 는 disclaimer 로 오인 추출됨. 강조가 필요하면 💡/📌/🔔 사용 또는 강조 없이 본문 처리."
  - "**FAQ 답변에 ` → ` 외부 링크 화살표 사용 금지**. `design-bundle-o-external-link.spec.ts` 와 동일 정책 — 화살표 표현 대신 마크다운 링크(`[보건복지부](https://...)`) 또는 평문으로 작성."
- **fs-level grep 회귀 가드** (E2E 파일에서 fs 모듈로 직접 검사):
  - 5개 backfill 글 파일에 frontmatter `faq:` 키가 존재한다.
  - `npm run build` 산출물(`out/articles/<slug>/index.html`) 에 `"@type":"FAQPage"` 와 `"@type":"Question"` 가 5개 글 모두 존재.
  - 가드 파일은 `e2e/seo-faq-jsonld.spec.ts` 신규 생성. 기존 `design-bundle-*.spec.ts` 류 fs-level 가드 컨벤션 따름.

### should

- 본문 FAQ 렌더 시 `<details>`/`<summary>` 펼침 UI는 적용하지 않고 평문 노출 유지 (`.article-prose` 컨벤션). 펼침 UI 도입은 별도 디자인 결정 필요.
- 답변에 출처 링크(`[보건복지부](https://...)`)가 들어가는 경우, JSON-LD 변환 시 URL은 텍스트와 함께 풀어내지 않고 anchor 텍스트만 남긴다 (예: `"[보건복지부](https://...)" → "보건복지부"`). 1차 소스 노출은 본문 렌더 영역에서만.
- 운영자가 `npm run check:faq` 같은 사전 점검 스크립트는 **만들지 않는다** — 항목 3 결정으로 strict 빌드 fail-fast가 같은 역할을 하므로 중복.

### won't (이번 범위 밖)

- **PR-B BreadcrumbList JSON-LD** — 별도 PR. 같은 글 페이지에 JSON-LD 두 종이 공존하지만 이 기획서 범위는 FAQPage 만.
- **PR-D Article JSON-LD 필드 보강** — `seo-sitemap-article-jsonld` 에서 이미 머지됨. 본 기획서에서는 기존 `ArticleJsonLd` 컴포넌트의 출력을 건드리지 않음.
- **자동 FAQ 마크다운 파싱** — review.md 항목 1 옵션 C 명시적으로 거부됨.
- **FAQ 답변에 이미지·코드블록·표** 허용 — 인라인 마크다운(링크·강조)만 지원. 블록 마크다운은 비목표.
- **신규 GA4 이벤트** — `faq_question_click` 등 추가 이벤트는 본 PR 범위 밖. 효과는 GSC로 추적.
- **5개 외 글 backfill** — 향후 글 작성/갱신 시 운영자가 frontmatter `faq:` 채움.

## 4. 예외·엣지 케이스

- **frontmatter `faq:` 누락**: `article.faq === undefined` → 본문 FAQ 섹션 미렌더 + JSON-LD 미주입. 정상 분기.
- **frontmatter `faq: []`** (빈 배열): undefined 와 동일하게 처리. JSON-LD 와 본문 섹션 모두 미주입.
- **malformed frontmatter** (q 또는 a 누락·빈 문자열·non-string): `parseArticleMeta` throw → `getAllArticles()` 호출하는 모든 빌드 경로(sitemap, articles index, 글 페이지) 실패 → `npm run build` 실패. 정상 동작.
- **답변에 raw HTML 포함**: rehype-sanitize 와 동일 정책으로 처리 (현재 sanitizeSchema). JSON-LD 출력 시 HTML 태그도 함께 stripping (텍스트 노드만 추출).
- **답변에 줄바꿈**: 본문 렌더는 `\n\n` 으로 단락 분리, JSON-LD plain text 는 단락 분리를 공백 1개로 압축.
- **운영자가 본문에 실수로 `## 자주 묻는 질문` 섹션을 남김**: 본 PR 범위는 5개 글 제거. 향후 글 작성에서 실수로 남기면 본문에 중복 렌더(본문 H2 + frontmatter 렌더 영역)될 위험. 이는 운영 룰(blog-writer-persona.md)로 차단하고 자동 가드는 추가하지 않음 (가드 추가 비용 ≫ 발생 확률).
- **glossary·관련 글 등 본문 끝 다른 섹션과의 순서**: FAQ 영역은 본문 → FAQ → TimelineCTA → ShareButton → RelatedContent → RelatedArticles 순서. 5개 글 모두에서 기존 본문 `## FAQ` 위치와 동일.

## 5. 성공 기준

- **기능 동작**:
  - 5개 backfill 글 페이지의 `view-source:` 에 `"@type":"FAQPage"` JSON-LD 가 정확히 1회 등장하며, `mainEntity.length === frontmatter.faq.length`.
  - 본문 렌더 영역에 FAQ 섹션이 동일 글에서 노출되며, JSON-LD 의 `name`/`text` 와 본문 렌더 텍스트가 1:1 일치 (SSOT 보장).
  - frontmatter `faq:` 없는 글은 JSON-LD 미주입 + 본문 섹션 미렌더.
  - 의도적 malformed frontmatter 주입 시 `npm run build` 가 명확한 오류 메시지(글 slug + 필드명)로 실패.
- **측정 지표**: ga4.md 해당 없음 (이번 PR에서 GA4 이벤트 변경 없음). GSC 노출 지표는 `update-seo-aeo-geo.md` "추적 지표" 섹션의 색인·노출·CTR 으로 추적.
- **사용자 경험**: design.md 해당 없음 (디자인 변경 없음). 본문 FAQ 영역의 시각 표현은 기존 본문 마크다운 FAQ 와 동일 (`.article-prose` h3·strong·p 스타일).
- **검증**: qa.md 의 unit/e2e 매트릭스가 다음을 커버:
  - unit: `parseArticleMeta` 의 faq 분기 4종 (정상·undefined·빈 배열·malformed 3변종), 답변 마크다운 → JSON-LD plain text 변환 헬퍼.
  - e2e: 5개 backfill 글에서 FAQPage JSON-LD 존재·shape·길이 일치, FAQ-less 글 1개에서 JSON-LD 미주입, fs-level grep 가드 (frontmatter `faq:` 존재 + 빌드 산출물 `"@type":"FAQPage"` 5건).
