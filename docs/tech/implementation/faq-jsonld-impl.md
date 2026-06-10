# faq-jsonld Implementation

## 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `ArticleMeta` 에 `faq?: Array<{ q, a }>` 필드 추가 | ✅ 완료 | `src/types/article.ts` |
| `parseArticleMeta` strict validation (malformed → throw) | ✅ 완료 | `parseFaq` 헬퍼로 분리, undefined/[] 정상 통과, 그 외 malformed 7종 throw |
| 본문 렌더 영역에 FAQ 섹션 자동 렌더 | ✅ 완료 | `ArticleDetail.tsx` 본문 직후·TimelineCTA 직전, `.article-prose` 컨벤션 |
| FAQ 답변 마크다운 → HTML 변환 (인라인 링크·강조) | ✅ 완료 | `getArticleBySlug`에서 동일 remark 파이프라인으로 `faqHtmlAnswers` 생성 |
| FAQPage JSON-LD 주입 (Article JSON-LD 다음 순서) | ✅ 완료 | `articles/[slug]/page.tsx` `FaqPageJsonLd` 컴포넌트 |
| 답변 plain-text 변환 헬퍼 (`faqAnswerToPlainText`) | ✅ 완료 | export, `__tests__` 진입 가능 |
| 5개 글 본문 `## 자주 묻는 질문` 제거 + frontmatter `faq:` backfill | ✅ 완료 | early-pregnancy-tests, early-pregnancy-fatigue-reasons, 2026-parental-leave-guide, babyfair-survival-guide, pregnancy-foods-to-avoid |
| 운영 룰 (`blog-writer-persona.md`) 갱신 | ✅ 완료 | FAQ 입력 위치·1차 소스 게이트·인라인 마크다운·⚠️ 금지·→ 화살표 금지 5개 행 추가 |
| `npm run build` 통과 + 빌드 산출물에 FAQPage 5건 | ✅ 완료 | 5개 글 각 `"@type":"FAQPage"` 1회, mainEntity 5/5/5/6/5 |

## 생성/수정 파일 목록

### 신규 생성

- `docs/tech/implementation/faq-jsonld-impl.md` — 이 문서

### 수정

- `src/types/article.ts` — `FaqItem` 타입, `ArticleMeta.faq?`, `Article.faqHtmlAnswers?` 추가
- `src/lib/articles.ts` — `parseFaq` strict validator, `faqAnswerToPlainText` export 헬퍼, `parseArticleMeta` export 변경, `getArticleBySlug`에서 답변 HTML 처리
- `src/components/articles/ArticleDetail.tsx` — 본문 렌더 직후 `<section>` FAQ 영역 (h2 + h3/answer dangerouslySetInnerHTML)
- `src/app/articles/[slug]/page.tsx` — `FaqPageJsonLd` 컴포넌트 추가, `ArticleJsonLd` 다음에 조건부 렌더 (FAQ 있는 글만)
- `src/content/articles/early-pregnancy-tests.md` — frontmatter `faq:` 5개 추가, 본문 `## 자주 묻는 질문` 섹션 제거
- `src/content/articles/early-pregnancy-fatigue-reasons.md` — frontmatter `faq:` 5개 추가, 본문 섹션 제거
- `src/content/articles/2026-parental-leave-guide.md` — frontmatter `faq:` 5개 추가, 본문 `## FAQ` 제거
- `src/content/articles/babyfair-survival-guide.md` — frontmatter `faq:` 6개 추가, 본문 섹션 제거, 6번째 답변의 ` → ` 패턴은 평문 흐름 문장으로 재작성
- `src/content/articles/pregnancy-foods-to-avoid.md` — frontmatter `faq:` 5개 추가, 본문 섹션 제거
- `docs/content/blog-writer-persona.md` — §7 룰 매트릭스에 FAQ 관련 5개 행 추가

## 주요 결정 사항

- **답변 → HTML 변환을 동일 remark 파이프라인으로 처리**: spec §3 "remark 동일 파이프라인으로 HTML 변환"을 그대로 따랐다. `getArticleBySlug` 안에서 `faq.a` 각각에 대해 본문과 같은 `remarkGfm → remarkRehype → rehypeSanitize → rehypeStringify` 체인을 돌려 `faqHtmlAnswers: string[]`을 만든다. `rehypeArticleFigure`만 빼서 본문 이미지 처리 부수효과가 FAQ 영역에 새지 않도록 했다. — 이유: spec §4 "답변에 raw HTML 포함: rehype-sanitize 와 동일 정책으로 처리" 요구를 동일 파이프라인으로 1:1 매칭하는 게 가장 안전. 별도 인라인 마크다운 파서를 작성하면 sanitize 정책이 본문과 어긋날 위험.
- **`Article.faqHtmlAnswers`를 parallel array로 분리**: `ArticleMeta.faq` 의 `{q, a}` 구조는 raw 유지(sitemap 등 메타 경로에서 HTML 처리 부담 없도록), Article 확장 시점에만 별도 필드로 렌더 결과 부착. ArticleDetail은 `article.faq[i].q` + `article.faqHtmlAnswers?.[i]` 를 인덱스 매칭으로 소비. — 이유: ArticleMeta는 `getAllArticles` 등 동기 경로에서도 호출되므로 async 처리를 강제하지 않는다. Article 타입을 `Omit<ArticleMeta, 'faq'> & {faq: Rendered[]}` 로 override하면 intersection이 깨져서 더 침습적임.
- **strict validator를 `parseFaq` 헬퍼로 분리**: `parseArticleMeta` 안에 인라인 검증을 깔지 않고 별도 함수로 분리. — 이유: malformed 케이스 7종을 unit test에서 `parseFaq` 단위로 호출하기 쉬워지고, 향후 다른 frontmatter 필드에도 동일 패턴 적용 가능.
- **`parseArticleMeta` export 변경**: 기존 `function parseArticleMeta(...)` (private)를 `export function parseArticleMeta(...)` 로 공개. — 이유: qa.md §3.1 unit 테스트가 `parseArticleMeta` 자체를 호출해 malformed 케이스를 검증해야 함. `getAllArticles`/`getArticleBySlug` 경유 검증은 fs IO 의존이 생겨 unit 영역을 벗어남.
- **에러 메시지 포맷**: `Article <slug>: faq[<i>].<field> invalid — <reason>`. — 이유: spec §3 "운영자가 빌드 로그에서 실패 글·필드를 확인하고 수정" 시나리오 직접 대응. 인덱스 + 필드명을 함께 노출.
- **babyfair 6번째 답변의 `→` 화살표 제거**: 원 본문에 있던 `점심 전 도착 → 핵심 부스 마무리 → 점심 후 잔여 부스 정리` 패턴을 평문 흐름 문장으로 재작성. — 이유: spec.md §3 must "FAQ 답변에 ` → ` 외부 링크 화살표 사용 금지" 룰을 1차 backfill에서 함께 강제. qa.md §4.3에서 같은 패턴에 대한 fs-level 가드를 추가 예정이므로 미리 합치.
- **FAQ 렌더 영역에 `.article-prose mt-8`**: 기존 본문 `.article-prose` 와 동일 컨벤션 + 본문 마감 직후라 상단 margin 추가. — 이유: spec §5 "본문 FAQ 영역의 시각 표현은 기존 본문 마크다운 FAQ 와 동일 (`.article-prose` h3·strong·p 스타일)" 충족.
- **`section aria-label="자주 묻는 질문"`**: 시맨틱 마크업 + 보조기기 진입점. — 이유: 접근성 기본. AGENTS.md "이미지/인터랙티브 요소에 alt·aria-label 기본 적용".

## 가정 사항

- 5개 backfill 글 모두 1차 소스 검수가 완료된 상태 (review.md 항목 2 결정).
- spec §4 "답변에 줄바꿈" 정책 — 본문 렌더는 `\n\n` 으로 단락 분리, JSON-LD plain text 는 단락 분리를 공백 1개로 압축 — 은 백필된 답변 모두 단일 단락으로 작성되어 있어 현재 시점에는 트리거되지 않는다. 향후 다단락 답변이 들어오면 `faqAnswerToPlainText`의 `\s+` collapse가 자연스럽게 처리.
- `rehypeArticleFigure`를 FAQ 답변 처리 파이프라인에서 제외해도 본문 영향 없음 (figure는 본문 이미지 전용 변환이며 FAQ 답변은 이미지 비허용 — spec §3 won't).
- `ArticleJsonLd` 다음 위치에 `FaqPageJsonLd`를 두면 `seo-sitemap-article-jsonld.spec.ts:29` 의 `.first()` 동작이 유지됨 (Article이 첫 번째 ld+json script). qa.md §1.1 의 회귀 가드 가정과 일치.

## 미구현 항목

- **신규 e2e 가드 (`e2e/seo-faq-jsonld.spec.ts`)** — 본 implement 단계 범위 밖. /feature-pipeline 4단계 `write-e2e-tests`에서 작성.
- **`parseArticleMeta` / `faqAnswerToPlainText` unit 테스트** — qa.md §3 에 명시된 ~18 케이스는 3단계 `write-unit-tests`에서 작성.
- **PR-B BreadcrumbList JSON-LD** — spec §3 won't 명시. 별도 PR.
- **신규 GA4 이벤트 (`faq_question_click`)** — spec §3 won't 명시.
- **5개 외 글 backfill** — spec §3 won't 명시.
