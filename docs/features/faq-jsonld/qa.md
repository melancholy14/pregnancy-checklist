# faq-jsonld 테스트 전략

> 작성일: 2026-06-08  size: M
> 관련 리뷰: [review.md](./review.md)
> 관련 기획: [spec.md](./spec.md)
> 페르소나 SoT: [docs/qa/persona.md](../../qa/persona.md)

> **이 문서는 `/feature-pipeline` 안의 `write-unit-tests` · `write-e2e-tests` 스킬이 입력으로 읽습니다.**
> 시나리오마다 unit/e2e 분류 명시. 중복 금지.

## review.md 결정사항 참조

- **항목 1 (A)**: frontmatter SSOT + 본문 자동 렌더 제거. 5개 글 본문에서 `## 자주 묻는 질문` 섹션 삭제 → 기존 E2E가 본문 FAQ 텍스트(예: "기형아 검사 시기 놓치면", "국민행복카드로 NIPT") 를 어셔션하면 회귀. §1.1 에서 교차 확인.
- **항목 2 (A)**: 5개 글 일괄 backfill. 5개 글 모두 FAQPage JSON-LD 주입 필수 → fs-level grep 가드의 검증 대상이 5개 글 고정.
- **항목 3 (A)**: strict 정책. parser throw on malformed → unit 테스트로 4종 malformed 케이스 분기 강제. `test.skip` 금지 → §5 Skip 표는 비어 있어야 정상.

## 1. 기존 테스트 영향 분석

### 1.1 스캔 결과

수정 대상 파일 (spec.md §3 must에서 추출):

- `src/types/article.ts` — `ArticleMeta` 에 `faq?` 필드 추가
- `src/lib/articles.ts` — `parseArticleMeta` 에 faq strict validation + 답변 마크다운 → plain text 헬퍼 추가
- `src/components/articles/ArticleDetail.tsx` — `article.faq` 렌더 영역 추가
- `src/app/articles/[slug]/page.tsx` — `<FaqPageJsonLd>` 컴포넌트 주입
- `src/content/articles/{early-pregnancy-tests, early-pregnancy-fatigue-reasons, 2026-parental-leave-guide, babyfair-survival-guide, pregnancy-foods-to-avoid}.md` — 본문 `## 자주 묻는 질문` 섹션 제거 + frontmatter `faq:` 추가
- `docs/content/blog-writer-persona.md` — FAQ 작성 룰 갱신

교차 검색 명령과 결과:

```bash
# unit — articles lib import
grep -rln "from.*['\"].*articles['\"]" src/lib/__tests__ src/store/__tests__
# → src/lib/__tests__/articles.test.ts (countWords만 import, parseArticleMeta·getArticleBySlug 미import → 신규 케이스 추가 대상)

# unit — article type import
grep -rln "from.*types/article" src/lib/__tests__ src/store/__tests__
# → src/lib/__tests__/related-content.test.ts (ArticleMeta 타입 사용. faq? 가 optional이라 구조 호환 — 갱신 불요)

# e2e — 5개 backfill 글 직접 방문
grep -rln "early-pregnancy-tests\|early-pregnancy-fatigue-reasons\|2026-parental-leave-guide\|babyfair-survival-guide\|pregnancy-foods-to-avoid" e2e/
# → 15개 spec 파일. 그중 본문 FAQ 텍스트를 어셔션하는 파일 추가 검증 필요.

# e2e — 본문 FAQ 텍스트 직접 어셔션
grep -n "자주 묻는\|기형아 검사 시기 놓치면\|국민행복카드로.*NIPT" e2e/*.spec.ts
# → 0건. 본문 FAQ 섹션 제거가 기존 E2E 어셔션을 깨뜨리지 않음.

# e2e — JSON-LD 첫 번째 script 의존
grep -n "script.*application/ld\\+json.*first\\|locator.*application/ld\\+json" e2e/
# → e2e/seo-sitemap-article-jsonld.spec.ts:29 — .first() 로 Article JSON-LD 가져옴.
#    FAQPage JSON-LD 를 두 번째 script 태그로 주입 시 .first() 동작 유지되도록 page.tsx 순서 강제 필요.
```

| 영향받는 테스트 파일 | 어떤 부분이 영향받나 | 깨질 가능성 | 수정 방향 |
|---|---|---|---|
| `src/lib/__tests__/articles.test.ts` | `countWords` 단위 테스트는 동일. 단 `parseArticleMeta` faq 분기가 **신규** 미커버 (현재 파일에 import 자체가 없음) | 낮음 (회귀) / **높음 (커버리지)** | 신규: `parseArticleMeta` faq 4종 분기 + 답변 plain-text 변환 헬퍼 unit 케이스 추가 |
| `src/lib/__tests__/related-content.test.ts` | `ArticleMeta` 타입 import. `faq?` 가 optional → 기존 fixture 호환 | 낮음 | 갱신 불요. 단 fixture 에 `faq` 추가 케이스 1건 선택 |
| `e2e/seo-sitemap-article-jsonld.spec.ts` | `script[type="application/ld+json"]`.first() 로 Article JSON-LD 추출. FAQPage 가 두 번째 script 로 주입되어야 .first() 가 Article 유지 | 중간 | 검증 강화: 두 번째 script 로 FAQPage 존재하는지 보강 가드 1건 추가. 단 본 PR 가드 파일은 `e2e/seo-faq-jsonld.spec.ts` 신규 → 이 spec은 갱신 X |
| `e2e/content-enhancement.spec.ts` | `early-pregnancy-tests` 본문에서 `toContainText("NIPT")` (line 177). NIPT 단어는 본문 외부 17회 등장 (FAQ 외) → FAQ 제거해도 통과 | 낮음 | 갱신 불요. fs-level 카운트 검증으로 안전 확인 완료 |
| `e2e/medical-disclaimer.spec.ts` | `early-pregnancy-tests` 본문에서 disclaimer 텍스트 어셔션. FAQ 섹션과 무관한 영역 | 낮음 | 갱신 불요 |
| `e2e/cross-links.spec.ts` | `babyfair-survival-guide`, `early-pregnancy-tests`, `early-pregnancy-fatigue-reasons` 방문 후 cross-link CTA 어셔션. FAQ 섹션과 무관 | 낮음 | 갱신 불요 |
| `e2e/article-author-note.spec.ts` | `babyfair-survival-guide`, `early-pregnancy-tests` authorNote 어셔션. authorNote 위치는 FAQ 이전 → 무관 | 낮음 | 갱신 불요 |
| `e2e/canonical-url.spec.ts` | 5개 글 canonical URL 어셔션. metadata만 — 본문 변경과 무관 | 낮음 | 갱신 불요 |
| `e2e/lighthouse-seo.spec.ts` | 5개 글 SEO 점수. JSON-LD 추가로 점수 ↑ 예상 | 낮음 (긍정 영향) | 갱신 불요. 점수 invariant 회귀만 모니터 |
| `e2e/{p14-ai-image-label, design-bundle-l-image-system, design-bundle-j-share-button-position, phase-4-step-*, marketing-events-wiring, seo-metadata, pregnancy-week-onboarding}.spec.ts` | 5개 글 방문하지만 본문 FAQ 텍스트 비의존 | 낮음 | 갱신 불요 |

**총 갱신 대상**: 1건 (`src/lib/__tests__/articles.test.ts` — 신규 케이스 추가). 본문 FAQ 제거가 기존 E2E 어셔션을 깨뜨리지 않음 확인.

### 1.2 데이터·schema 변경 점검

- localStorage schema 변경 있나? **N** — 사용자 상태 store 미변경.
- Zustand store `partialize` 모양 변경 있나? **N**.
- `src/data/*.json` 구조 변경 있나? **N** — `src/content/articles/*.md` frontmatter schema는 변경되나, 이는 빌드 시점 정적 데이터로 사용자 localStorage와 무관. 기존 E2E의 `page.addInitScript` 시드 코드 영향 없음.
- 단, **frontmatter schema는 변경됨** — `faq?: { q, a }[]` 추가. 항목 3 (A) strict 정책에 따라 parser throw on malformed → unit 테스트 §3 에 malformed 분기 4종 강제.

### 1.3 회귀 가드와 충돌 점검

fs-level grep 가드 점검:

```bash
# 기존 fs-level grep 가드 파일들
ls e2e/design-bundle-*.spec.ts e2e/seo-sitemap-article-jsonld.spec.ts
```

- `design-bundle-c-heading-size.spec.ts` 류: h1·h2 inline `text-2xl font-bold` 류 금지 가드. 본 PR은 FAQ 본문 렌더 시 `.article-prose` 컨벤션 따르므로 (h3 + p) 위반 가능성 **N**.
- `design-bundle-o-external-link.spec.ts`: 외부 링크 `→` 화살표 금지 가드. FAQ 답변에 외부 링크(1차 소스) 들어가면 → 형태로 작성될 위험 → **운영자 가이드 (blog-writer-persona.md) 에서 명시 차단 필요**.
- ⚠️ 박스 가드 (`feedback_warning_emoji_rule.md`): FAQ 답변 안에 ⚠️ 사용은 disclaimer 오인 추출 위험. blog-writer-persona.md 갱신 시 명시.
- `seo-sitemap-article-jsonld.spec.ts`: `.first()` 로 Article JSON-LD 추출. FAQPage 가 두 번째 script 로 주입되면 통과 유지. 만약 page.tsx 에서 순서가 뒤집히면 회귀 — 신규 가드(`seo-faq-jsonld.spec.ts`) 에서 "ld+json scripts 중 첫 번째가 `@type:Article`" 추가 어셔션으로 보강.

**가드 트리거 여부**: N (구현 시 컨벤션 준수로 회피). 가드 약화 변경 없음.

### 1.4 영향 요약

- **갱신 필요한 기존 테스트**: 1개 (`src/lib/__tests__/articles.test.ts` — `parseArticleMeta` 케이스 추가)
- **신규 테스트 작성 대상**:
  - unit: 1 파일 (위 articles.test.ts 안에 신규 describe 블록)
  - e2e: 1 파일 (`e2e/seo-faq-jsonld.spec.ts`)
- **합계** (`/feature-pipeline` write 단계 작업량): **3건** (articles.test.ts 갱신 1 + seo-faq-jsonld.spec.ts 신규 1 + page.tsx FaqPageJsonLd 컴포넌트 검증 인라인 — 신규 spec 안에 포함)

## 2. 테스트 레이어 분류 (피라미드 결정)

| 시나리오 (spec.md §2) | 레이어 | 근거 |
|---|---|---|
| 시나리오 1 — 검색 노출 (SERP 카드 FAQ) | **e2e** | SERP 렌더는 검증 불가. 대용 — 빌드 산출물 HTML에 `"@type":"FAQPage"` 가 5개 글 모두 존재함을 fs-level grep + 페이지 방문 후 script 태그 검증으로 갈음. |
| 시나리오 2 — 글 직접 진입 본문 FAQ 영역 | **e2e** | UI 흐름·렌더 영역 검증. 본문 렌더 위치 + JSON-LD 텍스트 정합성(SSOT). |
| 시나리오 3 — FAQ 없는 글 (미주입) | **e2e** | 글 페이지 진입 후 script 태그 부재 확인. unit으로는 page.tsx 렌더 분기 검증 불가 (static export). |
| 시나리오 4 — 운영자 신규 글 작성 (운영 룰) | **N/A** | 코드 검증 대상 아님. blog-writer-persona.md 문서 갱신은 lint·검수 대상이 아닌 운영 룰. |
| 시나리오 5 — malformed frontmatter (strict throw) | **unit** | pure function (`parseArticleMeta`) 입력→throw. 외부 IO 없음. |

## 3. Unit 테스트 대상

### 3.1 대상 함수·store

- `src/lib/articles.ts::parseArticleMeta` — frontmatter `faq:` 분기 4종 + ArticleMeta 정합성 — (**갱신** — 기존 articles.test.ts에 신규 describe 추가)
- `src/lib/articles.ts::faqAnswerToPlainText` (신규 헬퍼, spec.md §3 must) — 답변 마크다운(인라인 링크·강조) → JSON-LD 용 plain text 변환 — (**신규**)

### 3.2 케이스 매트릭스

`parseArticleMeta` faq 분기:

| 유형 | 케이스 |
|---|---|
| Happy Path | `faq: [{ q: "Q1", a: "A1" }]` → `result.faq` 길이 1, q/a 그대로. `faq: [{ q, a }, { q, a }, ...]` n=5 → 길이 5 유지. |
| Boundary | `faq` 키 자체 누락 → `result.faq === undefined`. `faq: []` → `result.faq === undefined` (빈 배열은 정상 분기로 미주입 처리, spec.md §4). `q: "  "` (공백만) → throw. `a: ""` (빈 문자열) → throw. |
| Invariant | parser 가 throw 시 오류 메시지에 `<slug>` 와 `faq[i].<필드명>` 포함 (운영자가 빌드 로그에서 즉시 식별). throw 후에는 `result.faq` 가 partial state로 반환되지 않는다 (전체 throw). |

`parseArticleMeta` faq malformed 변종 (Boundary 세부):

| input | expected |
|---|---|
| `faq: "not-array"` (string) | throw |
| `faq: { q: "x", a: "y" }` (object, not array) | throw |
| `faq: [null]` | throw |
| `faq: [{ q: "x" }]` (a 누락) | throw |
| `faq: [{ q: "x", a: null }]` | throw |
| `faq: [{ q: 1, a: "y" }]` (q non-string) | throw |
| `faq: [{ q: "x", a: "y" }, { q: "", a: "z" }]` (두 번째 q 빈 문자열) | throw (인덱스 1 명시) |

→ `it.each` 매트릭스로 7개 케이스 1개 블록.

`faqAnswerToPlainText` 변환 헬퍼:

| 유형 | 케이스 |
|---|---|
| Happy Path | `"단순 문장"` → `"단순 문장"`. `"답은 **NIPT** 입니다."` → `"답은 NIPT 입니다."`. `"[보건복지부](https://...)"` → `"보건복지부"`. |
| Boundary | `""` → `""`. `"\n\n"` (줄바꿈만) → `""` 또는 단일 공백 (spec 결정: 공백 1개로 압축). `"여러\n\n단락"` → `"여러 단락"`. |
| Invariant | 변환 결과는 HTML 태그를 포함하지 않는다 (regex `/<[^>]+>/` 매칭 0). idempotent — `f(f(x)) === f(x)`. |

### 3.3 시간 의존 함수 점검

- 이 기능에 `new Date()` 호출 있나? **N** — frontmatter는 정적 데이터, parser는 입력→출력 pure.

### 3.4 mock 점검

- `parseArticleMeta` unit: 0 mock (입력 dict → 출력 ArticleMeta).
- `faqAnswerToPlainText` unit: 0 mock (string → string).
- **mock 개수 0** → unit 적합 확정.

## 4. E2E 테스트 대상

### 4.1 4가지 describe 블록

신규 spec: `e2e/seo-faq-jsonld.spec.ts`.

- **Happy Path** (5개 backfill 글 검증):
  - 5개 글 각각 방문 → `script[type="application/ld+json"]` 중 `"@type":"FAQPage"` 가 정확히 1개 존재.
  - 그 JSON-LD 의 `mainEntity` 배열 길이가 해당 글 frontmatter `faq.length` 와 일치. (frontmatter 길이는 fs.readFileSync + gray-matter 직접 파싱으로 검증.)
  - `mainEntity[0].name` 이 frontmatter `faq[0].q` 와 정확히 일치 (SSOT 보장).
  - `mainEntity[0].acceptedAnswer.text` 가 마크다운 인라인이 제거된 plain text (HTML 태그 0, `[text](url)` 패턴 0).
  - 본문 렌더 영역(`.article-prose` 이후 FAQ 섹션) 에 동일 질문·답변이 표시됨 (page.getByText 로 1개 샘플 검증).

- **Error / Validation (회귀 가드)**:
  - FAQ 없는 글(예: `weekly-prenatal-checklist`) 진입 시 `"@type":"FAQPage"` script 가 **부재** (locator count = 0).
  - 5개 글 모두 첫 번째 `script[type="application/ld+json"]` 은 `"@type":"Article"` 유지 (page.tsx 주입 순서 회귀 가드 — `seo-sitemap-article-jsonld.spec.ts` 와 같이 통과해야 함).
  - **fs-level grep 가드** (별도 test 블록):
    - 5개 backfill 글 파일에 frontmatter `faq:` 키가 존재 (`fs.readFileSync` + `gray-matter`).
    - `out/articles/<slug>/index.html` (또는 dev 빌드 산출) 에 `"@type":"FAQPage"` 문자열 존재 — 5개 모두.

- **권한 / 인증 (localStorage 분기)**: N/A — 정적 사이트, 권한 분기 없음. test.skip + 사유 코멘트만.

- **반응형 (Mobile 375px)**:
  - 모바일 viewport 에서도 FAQPage JSON-LD 가 서버 렌더 HTML 에 존재 (디바이스 의존하면 안 됨). 1개 글 sample 검증.

### 4.2 갱신 대상 기존 spec

- **없음**. §1.1 표 결과로 본문 FAQ 텍스트 직접 어셔션 0건 확인. `seo-sitemap-article-jsonld.spec.ts` 의 `.first()` 동작은 page.tsx 주입 순서로 보존 (회귀 시 §4.1 Error/Validation 블록에서 잡힘).

### 4.3 회귀 가드 (있다면 명시)

- 본문 ↔ JSON-LD SSOT 가드: §4.1 Happy Path에서 `mainEntity[i].name === 본문 h3 textContent`, `mainEntity[i].acceptedAnswer.text === 본문 답변 단락 plain text` 1쌍 sample 검증. 5개 글 전수가 아니라 무작위 1글 1쌍만 (검증 비용 vs ROI).
- page.tsx 주입 순서 가드 (위 §4.1 Error/Validation 두 번째 항목).
- ⚠️ 박스 오인 추출 방지: FAQ 답변 안에 `⚠️` 문자가 없는지 fs-level 가드 1건. blog-writer-persona.md 룰의 자동 강제.
- `→` 외부 링크 화살표 금지: FAQ 답변 안에 ` → ` 패턴이 없는지 fs-level 가드 1건. `design-bundle-o-external-link.spec.ts` 와 동일 정책 확장.

### 4.4 시드 데이터·초기 상태

```ts
// 5개 backfill 글 페이지는 공개 진입, 별도 시드 불요.
// FAQ-less 글 검증도 동일.
// 단, lighthouse·analytics 가드 회피를 위해 cookie-consent 시드는 정책 따름:
await page.addInitScript(() => {
  localStorage.setItem("cookie-consent", "accepted");
});
```

### 4.5 GA4 이벤트 검증

해당 없음 — 본 PR 에서 GA4 이벤트 신규/변경 없음 (spec.md §3 won't).

## 5. Skip / Defer

해당 없음.

review.md 항목 3 (A) strict 정책에 따라 `test.skip` / `it.skip` 금지. backfill 지연이 발생해도 frontmatter `faq:` 자체를 비워두는 방식(=시나리오 3 FAQ-less 분기)으로 우회. 테스트는 5개 글 backfill 완료 전제.

| 항목 | 보류 이유 | 제거 조건 | 제거 deadline |
|---|---|---|---|
| (없음) | — | — | — |

권한/인증 describe 블록의 `test.skip("정적 사이트 — 인증 분기 없음", () => {})` 는 기존 spec 들과 동일 컨벤션(`seo-sitemap-article-jsonld.spec.ts:124`)을 따른 placeholder 로 허용. 이는 "보류" 가 아니라 "해당 없음 표시" — 제거 deadline 불요.

## 6. 성공 기준

- **Unit**: `parseArticleMeta` faq 분기 8개 케이스(happy 2 + boundary 2 + malformed 7 + invariant 2) + `faqAnswerToPlainText` 8개 케이스(happy 3 + boundary 3 + invariant 2) **총 ~18개 it 통과**. 소요 < 500ms.
- **E2E** (`e2e/seo-faq-jsonld.spec.ts`):
  - Happy Path 5개 글 매트릭스 (`test.describe.parallel` 또는 `it.each`) 통과.
  - Error/Validation 가드 4건 (FAQ-less 글 미주입 + 주입 순서 + fs-level frontmatter `faq:` + fs-level `"@type":"FAQPage"` 5건) 통과.
  - 반응형 1건 통과.
  - **flaky retry 0회**. workers: 1 환경에서 안정 통과.
- **회귀 0**: §1.1 표의 14개 기존 e2e spec 모두 통과 유지 (특히 `seo-sitemap-article-jsonld.spec.ts`, `content-enhancement.spec.ts`, `medical-disclaimer.spec.ts`).
- **빌드 fail-fast 검증**: PR review 단계에서 1회 의도적 malformed frontmatter 주입 후 `npm run build` 실패 + 오류 메시지에 글 slug·필드명 노출 확인. 자동 테스트가 아니라 PR 머지 전 수동 검증 1회.
- **cross-check** (qa.md ↔ spec.md): spec.md §2 시나리오 5건 중 4건이 unit/e2e 매트릭스에 매핑되고, 시나리오 4(운영 룰)는 N/A 로 명시.
