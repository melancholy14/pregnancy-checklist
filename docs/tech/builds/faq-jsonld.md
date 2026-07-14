# faq-jsonld

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-06-08
> plan: [spec](../../features/faq-jsonld/spec.md) · [qa](../../features/faq-jsonld/qa.md)

<!-- STEP:impl -->
## 구현

### 완료 조건 충족 여부

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

### 생성/수정 파일 목록

#### 신규 생성

- `이 문서` — 이 문서

#### 수정

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

### 주요 결정 사항

- **답변 → HTML 변환을 동일 remark 파이프라인으로 처리**: spec §3 "remark 동일 파이프라인으로 HTML 변환"을 그대로 따랐다. `getArticleBySlug` 안에서 `faq.a` 각각에 대해 본문과 같은 `remarkGfm → remarkRehype → rehypeSanitize → rehypeStringify` 체인을 돌려 `faqHtmlAnswers: string[]`을 만든다. `rehypeArticleFigure`만 빼서 본문 이미지 처리 부수효과가 FAQ 영역에 새지 않도록 했다. — 이유: spec §4 "답변에 raw HTML 포함: rehype-sanitize 와 동일 정책으로 처리" 요구를 동일 파이프라인으로 1:1 매칭하는 게 가장 안전. 별도 인라인 마크다운 파서를 작성하면 sanitize 정책이 본문과 어긋날 위험.
- **`Article.faqHtmlAnswers`를 parallel array로 분리**: `ArticleMeta.faq` 의 `{q, a}` 구조는 raw 유지(sitemap 등 메타 경로에서 HTML 처리 부담 없도록), Article 확장 시점에만 별도 필드로 렌더 결과 부착. ArticleDetail은 `article.faq[i].q` + `article.faqHtmlAnswers?.[i]` 를 인덱스 매칭으로 소비. — 이유: ArticleMeta는 `getAllArticles` 등 동기 경로에서도 호출되므로 async 처리를 강제하지 않는다. Article 타입을 `Omit<ArticleMeta, 'faq'> & {faq: Rendered[]}` 로 override하면 intersection이 깨져서 더 침습적임.
- **strict validator를 `parseFaq` 헬퍼로 분리**: `parseArticleMeta` 안에 인라인 검증을 깔지 않고 별도 함수로 분리. — 이유: malformed 케이스 7종을 unit test에서 `parseFaq` 단위로 호출하기 쉬워지고, 향후 다른 frontmatter 필드에도 동일 패턴 적용 가능.
- **`parseArticleMeta` export 변경**: 기존 `function parseArticleMeta(...)` (private)를 `export function parseArticleMeta(...)` 로 공개. — 이유: qa.md §3.1 unit 테스트가 `parseArticleMeta` 자체를 호출해 malformed 케이스를 검증해야 함. `getAllArticles`/`getArticleBySlug` 경유 검증은 fs IO 의존이 생겨 unit 영역을 벗어남.
- **에러 메시지 포맷**: `Article <slug>: faq[<i>].<field> invalid — <reason>`. — 이유: spec §3 "운영자가 빌드 로그에서 실패 글·필드를 확인하고 수정" 시나리오 직접 대응. 인덱스 + 필드명을 함께 노출.
- **babyfair 6번째 답변의 `→` 화살표 제거**: 원 본문에 있던 `점심 전 도착 → 핵심 부스 마무리 → 점심 후 잔여 부스 정리` 패턴을 평문 흐름 문장으로 재작성. — 이유: spec.md §3 must "FAQ 답변에 ` → ` 외부 링크 화살표 사용 금지" 룰을 1차 backfill에서 함께 강제. qa.md §4.3에서 같은 패턴에 대한 fs-level 가드를 추가 예정이므로 미리 합치.
- **FAQ 렌더 영역에 `.article-prose mt-8`**: 기존 본문 `.article-prose` 와 동일 컨벤션 + 본문 마감 직후라 상단 margin 추가. — 이유: spec §5 "본문 FAQ 영역의 시각 표현은 기존 본문 마크다운 FAQ 와 동일 (`.article-prose` h3·strong·p 스타일)" 충족.
- **`section aria-label="자주 묻는 질문"`**: 시맨틱 마크업 + 보조기기 진입점. — 이유: 접근성 기본. AGENTS.md "이미지/인터랙티브 요소에 alt·aria-label 기본 적용".

### 가정 사항

- 5개 backfill 글 모두 1차 소스 검수가 완료된 상태 (review.md 항목 2 결정).
- spec §4 "답변에 줄바꿈" 정책 — 본문 렌더는 `\n\n` 으로 단락 분리, JSON-LD plain text 는 단락 분리를 공백 1개로 압축 — 은 백필된 답변 모두 단일 단락으로 작성되어 있어 현재 시점에는 트리거되지 않는다. 향후 다단락 답변이 들어오면 `faqAnswerToPlainText`의 `\s+` collapse가 자연스럽게 처리.
- `rehypeArticleFigure`를 FAQ 답변 처리 파이프라인에서 제외해도 본문 영향 없음 (figure는 본문 이미지 전용 변환이며 FAQ 답변은 이미지 비허용 — spec §3 won't).
- `ArticleJsonLd` 다음 위치에 `FaqPageJsonLd`를 두면 `seo-sitemap-article-jsonld.spec.ts:29` 의 `.first()` 동작이 유지됨 (Article이 첫 번째 ld+json script). qa.md §1.1 의 회귀 가드 가정과 일치.

### 미구현 항목

- **신규 e2e 가드 (`e2e/seo-faq-jsonld.spec.ts`)** — 본 implement 단계 범위 밖. /feature-pipeline 4단계 `write-e2e-tests`에서 작성.
- **`parseArticleMeta` / `faqAnswerToPlainText` unit 테스트** — qa.md §3 에 명시된 ~18 케이스는 3단계 `write-unit-tests`에서 작성.
- **PR-B BreadcrumbList JSON-LD** — spec §3 won't 명시. 별도 PR.
- **신규 GA4 이벤트 (`faq_question_click`)** — spec §3 won't 명시.
- **5개 외 글 backfill** — spec §3 won't 명시.

---

<!-- STEP:review -->
## 코드 리뷰

> 리뷰 일자: 2026-06-08
> 리뷰 범위: 코드 4파일 (콘텐츠/문서는 리뷰 대상 제외)
> 관련 기획: [docs/features/faq-jsonld/spec.md](../../features/faq-jsonld/spec.md)
> 구현 기록: [docs/implementation/faq-jsonld-impl.md](#구현)

### 리뷰 대상 파일

- `src/types/article.ts`
- `src/lib/articles.ts`
- `src/components/articles/ArticleDetail.tsx`
- `src/app/articles/[slug]/page.tsx`

---

### Critical 이슈 (즉시 수정 완료)

없음.

---

### Warning (수정 권장)

#### 1. `src/app/articles/[slug]/page.tsx` — JSON-LD에 `</script>` 종료 시퀀스 미이스케이프

- **위치**: `src/app/articles/[slug]/page.tsx:130-133` (`FaqPageJsonLd`), `:107-111` (`ArticleJsonLd` — 기존 패턴)
- **문제**: `dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}` 패턴이 `</script>` 문자열을 이스케이프하지 않는다. 만약 frontmatter `faq[*].q` 에 `</script>` 같은 문자열이 들어오면 inline `<script>` 태그가 의도치 않게 종료되어 이후 콘텐츠가 HTML 본문으로 새어 나가는 XSS 벡터가 된다.
  - `acceptedAnswer.text` 는 `faqAnswerToPlainText` 가 `/<[^>]+>/g` 로 stripping 하므로 우연히 보호됨.
  - 그러나 `mainEntity[i].name` 은 raw `q` 를 그대로 사용해 보호되지 않음.
  - 본 PR 의 5개 글 frontmatter 는 한글 평문이라 실제 발현 가능성 0. **운영자 1인 컨트롤** + AdSense 게이트 미통과 영역 진입 불가라 위험도는 낮음.
- **권장 수정**: 같은 `ArticleJsonLd` 에 이미 존재하는 패턴이므로 일관성 차원에서 별도 헬퍼를 만들어 한 번에 처리.
  ```ts
  function safeJsonLd(obj: unknown): string {
    return JSON.stringify(obj).replace(/</g, "\\u003c");
  }
  ```
  본 PR 에서는 `ArticleJsonLd` 와 패턴 일치(=새 위험 도입 X)에 우선순위를 둬 코드는 그대로 유지. SoT 컴포넌트(둘 다 같은 page.tsx) 리팩토링 시 일괄 적용 권장.

#### 2. `src/lib/articles.ts` — `Promise.all(faq.map)` 안에서 remark 인스턴스를 매번 재생성

- **위치**: `src/lib/articles.ts:179-189`
- **문제**: FAQ 답변 N개에 대해 `await Promise.all(meta.faq.map(async (item) => { const processed = await remark()...process(item.a); ... }))`. 각 답변마다 `remark()` 체인을 새로 빌드. SSG 빌드 시 5~6 items × 5 articles = 25~30 회 호출 — 빌드 시간 영향은 미미하지만 동일 파이프라인 객체 재생성은 낭비.
- **권장 수정**: 함수 외부(또는 `getArticleBySlug` 진입부)에 1회 생성된 processor 를 재사용. unified processor 는 `process()` 호출이 idempotent 한 frozen 인스턴스로 만들도록 `.freeze()` 를 호출하면 재사용 가능. 또는 답변 처리 전용 헬퍼를 lib 모듈 스코프에 두기.
  ```ts
  const answerProcessor = remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .freeze();
  ```
- **유보 이유**: 본 PR 의 빌드 시간 회귀 미관찰(빌드 ~4초 유지). refactor 단계에서 본문 processor 와 함께 통일.

#### 3. `src/components/articles/ArticleDetail.tsx` — `faq.length` 와 `faqHtmlAnswers.length` 불일치 시 silent empty

- **위치**: `src/components/articles/ArticleDetail.tsx:101-110`
- **문제**: `article.faqHtmlAnswers?.[i] ?? ""` 로 fallback. 두 배열 길이가 어긋나면 (=실수로 한쪽만 수정) 질문은 보이는데 답변이 빈 div 로 렌더됨. 사용자에게 "답변 없음" 으로 보일 위험.
- **권장 수정**: `getArticleBySlug` 가 `faq` 가 존재하는 경우 반드시 동일 길이의 `faqHtmlAnswers` 를 함께 반환하도록 invariant 강제. 현재 구현은 이 invariant 를 만족하지만(`Promise.all(meta.faq.map(...))`), 타입 시스템 차원의 보증은 없음. 단일 객체 배열 `{ q, aHtml }[]` 으로 합치는 게 깔끔.
- **유보 이유**: ArticleMeta 의 raw `faq: { q, a }[]` 는 sitemap/listing 등 비동기 안 거치는 경로에서도 호출되므로 두 표현을 분리 보존하는 게 합리적. 단일 배열 합치기는 Article 타입 override 패턴 필요 — refactor 단계 또는 별도 PR.

---

### Suggestion (개선 아이디어)

#### 1. `src/lib/articles.ts` — `parseFaq` 의 오류 메시지에 `expected` 형식 예시 추가

운영자가 빌드 로그에서 즉시 수정 가능하도록 에러에 "기대 형식" 한 줄을 더하면 도움 됨. 예:
```
Article foo: faq[2].a invalid — empty string after trim
                     (expected: non-empty string with q&a in each item)
```
현재도 슬러그+인덱스+필드+이유 4종 정보를 제공하므로 충분. nice-to-have.

#### 2. `src/types/article.ts` — `FaqItem` 의 `q`/`a` 에 brand type 또는 길이 제약 명시

YMYL 도메인에서 frontmatter 가 외부 입력은 아니지만, 운영자 실수 차단 강도를 높이려면 `Q extends string` 같은 nominal type 또는 zod schema 도입. 현재 strict validator 가 같은 역할을 수행하므로 우선순위 낮음.

#### 3. `src/components/articles/ArticleDetail.tsx` — FAQ 영역에 `id="faq"` anchor 추가

SERP 의 "사람들이 묻는 질문" 카드가 직접 FAQ 영역으로 깊은 링크할 수 있도록 `#faq` 앵커 노출. spec §5 "사용자가 카드 내 질문 클릭 → 글 페이지의 동일 FAQ 영역으로 진입" 시나리오의 진입점을 명시적으로 만들면 좋음.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 (JSON-LD `</script>` 이스케이프 / remark processor 재생성 / faqHtmlAnswers length invariant) |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 0건이라 빌드 재검증 생략) |

**결론**: 본 구현은 spec.md / qa.md 의 결정 사항을 충실히 따랐고, 신규 위험 도입 없음. JSON-LD `</script>` 이슈는 기존 `ArticleJsonLd` 와 동일 패턴(=PR 범위 밖 일괄 정리 대상), 나머지 Warning 2건은 refactor 단계 후보.

---

<!-- STEP:refactor -->
## 리팩토링

> 작성일: 2026-06-08
> 관련 리뷰: [docs/review/faq-jsonld-review.md](#코드-리뷰)
> 관련 기획: [docs/features/faq-jsonld/spec.md](../../features/faq-jsonld/spec.md)

### 리팩토링한 파일 목록

- `src/lib/articles.ts` — FAQ 답변 처리용 remark processor 를 module scope 로 lift + `.freeze()` 재사용

---

### 작업별 내용

#### 1. `src/lib/articles.ts` — `faqAnswerProcessor` module-scope 캐싱

- **출처**: 리뷰 Warning #2
- **무엇을**: `getArticleBySlug` 안에서 `Promise.all(meta.faq.map(async (item) => remark()...))` 패턴을 호출마다 새 processor 를 만들지 않도록 module 최상단의 `faqAnswerProcessor`(remark 체인 `.freeze()` 결과)로 lift. 콜사이트는 `await faqAnswerProcessor.process(item.a)` 로 단순화.
- **왜**: 빌드 시점 글 1편에 답변 5~6 items × 18 articles = 약 25~30 회 processor 생성을 1회로 축소. 빌드 시간 회귀는 미관찰이지만 동일 패턴이 반복되는 코드의 중복을 제거하고 향후 본문 processor 와 통일할 때 같은 SoT 를 따르게 함.

---

### 유보된 리뷰 Warning (의도적 미실행)

#### Warning #1 — JSON-LD `</script>` 이스케이프

- **이유**: 같은 page.tsx 의 기존 `ArticleJsonLd` 도 동일 패턴(`dangerouslySetInnerHTML={{__html: JSON.stringify(...)}}`)을 사용. FAQ 만 hardening 하면 두 컴포넌트의 패턴이 어긋남. 운영자 1인 컨트롤 + AdSense 게이트 영역이라 실제 위험도 0 에 가까움. 리뷰 문서에 PR-外 일괄 정리 권장으로 기록.

#### Warning #3 — `faqHtmlAnswers` length invariant

- **이유**: `Article` 타입을 `Omit<ArticleMeta, 'faq'> & { faq: Rendered[] }` 로 override 하는 패턴 도입 필요. ArticleMeta 가 sitemap / listing 등 비동기 안 거치는 경로에서도 호출되므로 raw 와 rendered 표현 분리는 합리적이지만, 타입 시스템 강제는 별도 PR 범위.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| FAQ 답변 processor 인스턴스화 | 답변 1개당 1회 (~25~30회/빌드) | module load 1회 + `.freeze()` 재사용 |
| `src/lib/articles.ts` 줄 수 | 200줄 | 196줄 (-4) |
| `getArticleBySlug` 답변 처리 블록 | 12줄 | 7줄 |
| 빌드 시간 (`npm run build`) | ~3.6s | ~3.2s (체감 변화 미미, 측정 변동 범위) |

### 빌드 결과

✓ 성공 (1회 시도). 5개 backfill 글 모두 `"@type":"FAQPage"` 1회 유지 (정적 출력 grep 재검증 완료).
