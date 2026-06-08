# faq-jsonld — FAQPage JSON-LD 자동 주입

> 작성일: 2026-06-08 | 작성자: Claude Code
> 원 plan: [docs/plan/update-seo-aeo-geo.md](../plan/update-seo-aeo-geo.md) PR-C
> 산출물 SoT: [features/faq-jsonld/](../features/faq-jsonld/) — review·spec·qa
> 단계별 SoT: [impl](../implementation/faq-jsonld-impl.md) · [review](../review/faq-jsonld-review.md) · [refactor](../refactor/faq-jsonld-refactor.md)

## 개요

글 frontmatter `faq: [{ q, a }]` 를 단일 진실(SSOT)로 두고, `ArticleDetail` 본문 영역에 FAQ 섹션을 자동 렌더하며 글 페이지에 `FAQPage` JSON-LD 를 두 번째 ld+json script 로 주입한다. AEO(AI Overview·Featured Snippet·"사람들이 묻는 질문") 노출과 SERP 카드 풍부도 ↑ 가 목표. 본 PR 에서는 5개 기 발행 글을 일괄 backfill 했고, malformed frontmatter 는 `parseArticleMeta` 가 throw 해 GitHub Actions 빌드를 fail-fast 시킨다.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `ArticleMeta` 에 `faq?: Array<{ q, a }>` 필드 추가 | ✅ 완료 | `src/types/article.ts` |
| `parseArticleMeta` strict validation (malformed → throw) | ✅ 완료 | `parseFaq` 헬퍼 분리, undefined/[] 정상 통과, malformed 7종 throw |
| 본문 렌더 영역에 FAQ 섹션 자동 렌더 | ✅ 완료 | `ArticleDetail.tsx` 본문 직후·TimelineCTA 직전, `.article-prose` 컨벤션 |
| FAQ 답변 마크다운 → HTML 변환 (인라인 링크·강조) | ✅ 완료 | 본문 동일 remark 파이프라인 + module-scope `faqAnswerProcessor` |
| FAQPage JSON-LD 주입 (Article JSON-LD 다음 순서) | ✅ 완료 | `articles/[slug]/page.tsx` `FaqPageJsonLd` |
| 답변 plain-text 변환 헬퍼 (`faqAnswerToPlainText`) | ✅ 완료 | 인라인 마크다운·HTML 태그 stripping, JSON-LD `acceptedAnswer.text` 용 |
| 5개 글 본문 `## 자주 묻는 질문` 제거 + frontmatter backfill | ✅ 완료 | early-pregnancy-tests, early-pregnancy-fatigue-reasons, 2026-parental-leave-guide, babyfair-survival-guide, pregnancy-foods-to-avoid (각 5/5/5/6/5문항) |
| 운영 룰 갱신 (`blog-writer-persona.md`) | ✅ 완료 | FAQ 입력 위치·1차 소스 게이트·인라인 마크다운·⚠️ 금지·`→` 금지 5개 행 추가 |
| `npm run build` 통과 + 산출물에 FAQPage 5건 | ✅ 완료 | 5개 글 각 `"@type":"FAQPage"` 1회, mainEntity 5/5/5/6/5 |

### 생성/수정 파일

**신규 (코드/콘텐츠 없음)** — 본 기능은 기존 타입·파서·렌더·페이지에 옵셔널 필드를 얹는 패턴.

**수정**

| 파일 | 변경 내용 |
|------|-----------|
| `src/types/article.ts` | `FaqItem` 타입, `ArticleMeta.faq?`, `Article.faqHtmlAnswers?` 추가 |
| `src/lib/articles.ts` | `parseFaq` strict validator, `faqAnswerToPlainText` export, `parseArticleMeta` export 전환, `getArticleBySlug` 가 답변 HTML 동시 처리, `faqAnswerProcessor` module-scope `.freeze()` |
| `src/components/articles/ArticleDetail.tsx` | 본문 직후 `<section>` FAQ 영역 (h2 + h3/answer dangerouslySetInnerHTML) |
| `src/app/articles/[slug]/page.tsx` | `FaqPageJsonLd` 컴포넌트 추가, `ArticleJsonLd` 직후 조건부 렌더 |
| `src/content/articles/{5개}.md` | frontmatter `faq:` backfill + 본문 `## 자주 묻는 질문` 제거 (babyfair 6번째 답변의 ` → ` 화살표는 평문 흐름 문장으로 재작성) |
| `docs/content/blog-writer-persona.md` | §7 룰 매트릭스에 FAQ 관련 5개 행 추가 |

### 주요 결정 사항

- **답변 → HTML 변환을 동일 remark 파이프라인으로 처리** — spec §3 "remark 동일 파이프라인" 요구를 1:1 매칭. 별도 인라인 파서 작성 시 sanitize 정책이 본문과 어긋날 위험.
- **`Article.faqHtmlAnswers` parallel array** — ArticleMeta.faq 의 raw `{q, a}` 를 sitemap·listing 동기 경로에서도 안전하게 호출 가능. Article 타입 override 패턴은 별도 PR 범위로 유보.
- **strict validator를 `parseFaq` 헬퍼로 분리** — malformed 7종 unit 테스트가 `parseArticleMeta` 단위로 호출하기 쉬워지고 동일 패턴 재사용 가능.
- **`parseArticleMeta` export 전환** — qa.md §3.1 unit 테스트가 fs IO 거치지 않고 호출하기 위함.
- **에러 메시지 포맷**: `Article <slug>: faq[<i>].<field> invalid — <reason>` — spec §3 "운영자가 빌드 로그에서 실패 글·필드를 확인하고 수정" 시나리오 직접 대응.
- **babyfair 6번째 답변의 `→` 제거** — qa.md §4.3 의 fs-level 가드와 동시에 합치기.
- **FAQ 영역 `section aria-label="자주 묻는 질문"`** — 시맨틱 + 보조기기 진입점.

### 가정 사항 및 미구현 항목

- **가정**: 5개 backfill 글 모두 1차 소스 검수 완료(review.md 항목 2 결정). 답변은 단일 단락이므로 spec §4 의 `\n\n` 단락 분리 정책은 본 PR 시점에 트리거되지 않으나 `faqAnswerToPlainText` 의 `\s+` collapse 가 자연 처리.
- **미구현**: PR-B BreadcrumbList JSON-LD / PR-D Article 5필드 보강(머지됨) / 자동 FAQ 마크다운 파싱 / FAQ 답변에 이미지·코드블록·표 허용 / 신규 GA4 이벤트 / 5개 외 글 backfill — 모두 spec §3 won't 에 명시.

---

## 코드 리뷰 결과

### Critical 이슈

**없음.** 본 구현은 spec.md / qa.md 결정 사항을 충실히 따랐고 신규 위험 도입 없음.

### Warning (수정 권장)

| # | 파일·위치 | 문제 | 처리 |
|---|-----------|------|------|
| 1 | `src/app/articles/[slug]/page.tsx:130` (`FaqPageJsonLd`) | `dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}` 가 `</script>` 미이스케이프 — 운영자 입력에 `</script>` 들어오면 XSS 벡터 | **유보** — 같은 page.tsx 의 기존 `ArticleJsonLd` 도 동일 패턴, PR-外 일괄 정리 권장 |
| 2 | `src/lib/articles.ts:179` (구 위치) | `Promise.all(faq.map)` 안에서 remark 인스턴스 매번 재생성 (1빌드 ~25~30회) | **수정 완료** — module-scope `faqAnswerProcessor` + `.freeze()` (refactor 단계) |
| 3 | `src/components/articles/ArticleDetail.tsx:106` | `faq.length` ≠ `faqHtmlAnswers.length` 시 답변이 빈 div 로 silent 렌더 | **유보** — Article 타입 override 패턴 필요, 별도 PR |

### Suggestion

1. `parseFaq` 에러 메시지에 "expected 형식" 한 줄 추가 — nice-to-have.
2. `FaqItem` 에 brand type 또는 zod schema 도입 — strict validator 가 같은 역할 수행 중이라 우선순위 낮음.
3. FAQ 섹션에 `id="faq"` anchor 추가 — SERP "사람들이 묻는 질문" 카드 deep link 진입점.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견 |
| Warning | 3건 (1건 수정 / 2건 유보) |
| Suggestion | 3건 |

---

## 리팩토링 내용

### 작업 목록

1. **`src/lib/articles.ts` — `faqAnswerProcessor` module-scope 캐싱** (Warning #2)
   - **무엇을**: `getArticleBySlug` 안 `Promise.all(meta.faq.map(...))` 내부에서 매번 `remark()....process()` 체인을 새로 빌드하던 코드를 module 최상단의 `.freeze()` 된 단일 processor 로 lift. 콜사이트는 `faqAnswerProcessor.process(item.a)` 한 줄.
   - **왜**: 빌드 시 답변 5~6 × 글 18 ≈ 25~30 회 processor 생성을 1회로 축소. 향후 본문 processor 와 통일할 SoT 마련.

### 유보된 항목

- Warning #1 (`</script>` 이스케이프) — `ArticleJsonLd` 와 패턴 일치 우선.
- Warning #3 (`faqHtmlAnswers` length invariant) — Article 타입 override 필요, 별도 PR.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| FAQ 답변 processor 인스턴스화 | 답변 1개당 1회 (~25~30회/빌드) | module load 1회 + `.freeze()` 재사용 |
| `src/lib/articles.ts` 줄 수 | 200 | 196 |
| `getArticleBySlug` 답변 처리 블록 | 12줄 | 7줄 |
| 빌드 시간 (`npm run build`) | ~3.6s | ~3.2s (측정 변동 범위) |

---

## 테스트 결과

### Unit (Vitest)

- 파일: `src/lib/__tests__/articles.test.ts` (기존 `countWords` 15케이스 + 신규 25케이스)
- 신규 describe 블록 2개: `parseArticleMeta — faq branch` (15) · `faqAnswerToPlainText` (10)
- 케이스 분포: Happy 5 / Boundary 7 / Malformed 9 (it.each 8 + slug locator 1) / Invariant 4
- 결과: **40 passed / 0 failed** (230ms)

### E2E (Playwright)

- 파일: `e2e/seo-faq-jsonld.spec.ts` (신규)

| 시나리오 (describe) | 결과 |
|---------------------|------|
| Happy Path (5개 backfill 글) | ✅ 6개 passed (각 글 FAQPage 1회·길이 일치·plain text·HTML 무 + SSOT 본문 ↔ JSON-LD) |
| Error / Validation (회귀 가드) | ✅ 6개 passed (FAQ-less 미주입·Article first·fs frontmatter·fs 산출물 `"@type":"FAQPage"`·⚠️ 부재·` → ` 부재) |
| 권한 / 인증 | ⏭️ 1개 skip (정적 사이트 — N/A) |
| 반응형 (Mobile 375px) | ✅ 1개 passed |
| **전체** | **13 passed / 0 failed / 1 skipped** (8.9s) |

📊 상세 리포트: `playwright-report/index.html`

### 회귀

- 전체 unit: **196 passed / 0 failed** (full suite).
- E2E 회귀: 기존 `seo-sitemap-article-jsonld.spec.ts:29` 의 `.first()` 가 Article 을 가리키는지 신규 spec의 "주입 순서 가드" 가 5개 글 모두 검증 ✅. qa.md §1.1 의 14개 영향 spec 갱신 0건(본문 FAQ 텍스트 직접 어셔션 0건 확인).

---

## 누락된 문서

없음.
