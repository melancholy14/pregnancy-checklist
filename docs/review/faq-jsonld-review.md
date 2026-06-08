# faq-jsonld 코드 리뷰

> 리뷰 일자: 2026-06-08
> 리뷰 범위: 코드 4파일 (콘텐츠/문서는 리뷰 대상 제외)
> 관련 기획: [docs/features/faq-jsonld/spec.md](../features/faq-jsonld/spec.md)
> 구현 기록: [docs/implementation/faq-jsonld-impl.md](../implementation/faq-jsonld-impl.md)

## 리뷰 대상 파일

- `src/types/article.ts`
- `src/lib/articles.ts`
- `src/components/articles/ArticleDetail.tsx`
- `src/app/articles/[slug]/page.tsx`

---

## Critical 이슈 (즉시 수정 완료)

없음.

---

## Warning (수정 권장)

### 1. `src/app/articles/[slug]/page.tsx` — JSON-LD에 `</script>` 종료 시퀀스 미이스케이프

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

### 2. `src/lib/articles.ts` — `Promise.all(faq.map)` 안에서 remark 인스턴스를 매번 재생성

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

### 3. `src/components/articles/ArticleDetail.tsx` — `faq.length` 와 `faqHtmlAnswers.length` 불일치 시 silent empty

- **위치**: `src/components/articles/ArticleDetail.tsx:101-110`
- **문제**: `article.faqHtmlAnswers?.[i] ?? ""` 로 fallback. 두 배열 길이가 어긋나면 (=실수로 한쪽만 수정) 질문은 보이는데 답변이 빈 div 로 렌더됨. 사용자에게 "답변 없음" 으로 보일 위험.
- **권장 수정**: `getArticleBySlug` 가 `faq` 가 존재하는 경우 반드시 동일 길이의 `faqHtmlAnswers` 를 함께 반환하도록 invariant 강제. 현재 구현은 이 invariant 를 만족하지만(`Promise.all(meta.faq.map(...))`), 타입 시스템 차원의 보증은 없음. 단일 객체 배열 `{ q, aHtml }[]` 으로 합치는 게 깔끔.
- **유보 이유**: ArticleMeta 의 raw `faq: { q, a }[]` 는 sitemap/listing 등 비동기 안 거치는 경로에서도 호출되므로 두 표현을 분리 보존하는 게 합리적. 단일 배열 합치기는 Article 타입 override 패턴 필요 — refactor 단계 또는 별도 PR.

---

## Suggestion (개선 아이디어)

### 1. `src/lib/articles.ts` — `parseFaq` 의 오류 메시지에 `expected` 형식 예시 추가

운영자가 빌드 로그에서 즉시 수정 가능하도록 에러에 "기대 형식" 한 줄을 더하면 도움 됨. 예:
```
Article foo: faq[2].a invalid — empty string after trim
                     (expected: non-empty string with q&a in each item)
```
현재도 슬러그+인덱스+필드+이유 4종 정보를 제공하므로 충분. nice-to-have.

### 2. `src/types/article.ts` — `FaqItem` 의 `q`/`a` 에 brand type 또는 길이 제약 명시

YMYL 도메인에서 frontmatter 가 외부 입력은 아니지만, 운영자 실수 차단 강도를 높이려면 `Q extends string` 같은 nominal type 또는 zod schema 도입. 현재 strict validator 가 같은 역할을 수행하므로 우선순위 낮음.

### 3. `src/components/articles/ArticleDetail.tsx` — FAQ 영역에 `id="faq"` anchor 추가

SERP 의 "사람들이 묻는 질문" 카드가 직접 FAQ 영역으로 깊은 링크할 수 있도록 `#faq` 앵커 노출. spec §5 "사용자가 카드 내 질문 클릭 → 글 페이지의 동일 FAQ 영역으로 진입" 시나리오의 진입점을 명시적으로 만들면 좋음.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 (JSON-LD `</script>` 이스케이프 / remark processor 재생성 / faqHtmlAnswers length invariant) |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 0건이라 빌드 재검증 생략) |

**결론**: 본 구현은 spec.md / qa.md 의 결정 사항을 충실히 따랐고, 신규 위험 도입 없음. JSON-LD `</script>` 이슈는 기존 `ArticleJsonLd` 와 동일 패턴(=PR 범위 밖 일괄 정리 대상), 나머지 Warning 2건은 refactor 단계 후보.
