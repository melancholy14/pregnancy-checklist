# jsonld-breadcrumb-identity 코드 리뷰

> 리뷰일: 2026-06-09
> 관련 spec: [docs/features/jsonld-breadcrumb-identity/spec.md](../../features/jsonld-breadcrumb-identity/spec.md)
> 관련 impl: [docs/implementation/jsonld-breadcrumb-identity-impl.md](../implementation/jsonld-breadcrumb-identity-impl.md)

## 리뷰 대상 파일

신규 (2):
- `src/lib/breadcrumb-labels.ts`
- `src/components/seo/BreadcrumbJsonLd.tsx`

수정 (15 코드 + 1 문서):
- `src/app/layout.tsx`
- `src/app/page.tsx`, `timeline/page.tsx`, `checklist/page.tsx`, `checklist/hospital-bag/page.tsx`, `checklist/partner-prep/page.tsx`, `checklist/pregnancy-prep/page.tsx`, `baby-fair/page.tsx`, `articles/page.tsx`, `articles/[slug]/page.tsx`, `weight/page.tsx`, `about/page.tsx`, `contact/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`
- `docs/plan/update-seo-aeo-geo.md`

총 18개 파일.

---

## Critical 이슈 (즉시 수정 완료)

없음.

근거:
- `dangerouslySetInnerHTML` 사용처 (`BreadcrumbJsonLd`, layout 의 WebSite/Person) 의 입력값이 모두 (a) 코드 내 정적 리터럴 또는 (b) `parseArticleMeta` schema 검증을 통과한 frontmatter 값. 외부 사용자 입력 0.
- `any` 사용 0, 단언 0.
- 정적 export 빌드 산출물이 fs-grep 가드 통과 (13 indexable BreadcrumbList 1회, redirect 4 페이지 0회, SearchAction/sameAs 0).
- Unit 20/20 + E2E 32/32 통과 — 명세 일치.

---

## Warning (수정 권장 — 코드 미수정, 문서 기록)

### 1. JSON.stringify 결과를 `dangerouslySetInnerHTML` 에 그대로 주입 (codebase-wide 기존 패턴)
- **위치**: `src/components/seo/BreadcrumbJsonLd.tsx:24`, `src/app/layout.tsx:69, 73`, 기존 `src/app/articles/[slug]/page.tsx` `ArticleJsonLd`·`FaqPageJsonLd`
- **문제**: `JSON.stringify` 가 `<` 문자를 escape 하지 않음. 만약 article frontmatter `title` 이나 BreadcrumbList 항목 라벨에 `</script>` 부분 문자열이 들어가면 script 태그가 조기 종료되어 HTML injection 가능.
- **현재 위험도**: 낮음 — 운영자만 frontmatter 작성, `parseArticleMeta` schema 검증 통과, 외부 사용자 입력 경로 없음.
- **권장 수정**: 공통 헬퍼 `safeJsonLdSerialize(jsonLd: object): string` 만들어 `JSON.stringify(...).replace(/</g, "\\u003c").replace(/--/g, "\\u002d\\u002d")` 적용. 본 PR 범위 밖이며 기존 3개 컴포넌트 + 신규 1개를 한 번에 갱신하는 별도 PR 권장.
- **본 PR 도입 분 책임**: 0 — 기존 codebase 패턴을 그대로 따랐음. 이 PR 에서 신규로 발생한 위험은 아님.

### 2. about 페이지의 WebSite/Person JSON-LD 중복 주입
- **위치**: `src/app/about/page.tsx` (기존 `AboutJsonLd` @graph 의 Person + WebSite) + `src/app/layout.tsx` (신규 WebSite + Person 최소판)
- **문제**: `/about` 페이지의 빌드 산출물에 WebSite JSON-LD 가 2 개, Person JSON-LD 가 2 개 박힘. Schema.org 는 `@id` fragment 가 다르면 충돌로 보지 않지만, Google 의 동일 도메인 내 동일 @type 다중 declarations 처리는 우선순위 규칙이 명세화되어 있지 않아 SERP 표현 예측이 어려워질 수 있음.
- **현재 위험도**: 낮음 — 빌드 산출물 fs-grep 결과 의도된 값만 박혀 있고 e2e 회귀 0. `@id` 분리(`#creator`, `#website`)로 충돌 표면 회피.
- **권장 수정**: `AboutJsonLd` 통합 정리 PR — about 페이지의 @graph 와 layout 의 minimal Person/WebSite 중 한쪽으로 일원화. 운영자 SNS 공개 결정과 함께 처리 (sameAs 보강 후속 PR 과 같이).
- **본 PR 책임**: spec.md §7 가 about 페이지의 기존 AboutJsonLd 제거를 명시하지 않았고 BreadcrumbJsonLd 추가만 지시했으므로 spec 충실. 후속 정리 대상.

### 3. `BREADCRUMB_LABELS["/articles"]` 비-null 직접 접근
- **위치**: `src/lib/breadcrumb-labels.ts:54`
- **문제**: article slug 분기에서 `BREADCRUMB_LABELS["/articles"]` 을 옵셔널 체이닝 없이 접근. 정적 객체 리터럴이라 키가 보장되지만, 만약 라벨 키가 리네임/삭제되어도 TypeScript 가 잡지 못함 (값 타입이 `Record<string, string>` 이라 모든 키 접근이 `string` 타입).
- **권장 수정**: 라벨 SoT 를 `as const` + literal key union 으로 강화하거나 article 라벨을 별도 상수로 분리. 본 PR 범위 밖 cleanup.

---

## Suggestion (개선 아이디어)

### 1. `HOME_LABEL` 상수와 `BREADCRUMB_LABELS["/"]` 의 `"홈"` 리터럴 중복
- **위치**: `src/lib/breadcrumb-labels.ts:14, 17`
- 둘 다 값이 `"홈"` 이지만 별개 선언. `homeItem()` 헬퍼는 `HOME_LABEL` 을 쓰고, 표준 분기는 `BREADCRUMB_LABELS[pathname]` 을 씀. 향후 라벨 변경 시 두 군데를 동시에 고쳐야 함. 한쪽을 SoT 로 일원화 권장.

### 2. layout 의 WebSite/Person JSON-LD 도 공통 컴포넌트로 추출 가능
- **위치**: `src/app/layout.tsx:67-74`
- BreadcrumbJsonLd 와 같은 형태의 `WebSiteJsonLd`, `PersonJsonLd` 컴포넌트로 추출하면 `dangerouslySetInnerHTML` boilerplate 통일. 본 PR 의 scope 가 layout 단일 주입이라 inline 으로 둔 게 더 적절하지만, sameAs 보강 후속 PR 에서 컴포넌트화 검토 가치 있음.

### 3. fs-level e2e 가드의 `out/<route>.html` 경로 매핑 함수가 spec 들 사이에 중복
- **위치**: `e2e/seo-breadcrumb-jsonld.spec.ts:71` (`routeToHtmlPath`), `e2e/seo-faq-jsonld.spec.ts:23` (`OUT_DIR`)
- 향후 SEO 관련 e2e 가 늘어나면 `e2e/helpers/seo-paths.ts` 같은 헬퍼로 추출 검토.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견 |
| Warning | 3건 (모두 codebase-wide / 후속 PR 대상, 본 PR 신규 risk 0) |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 없음) |
| 단위 테스트 | 20/20 (Phase 3 run-e2e 단계 기준) |
| E2E | 32/32 + 3 skip (Phase 5 run-e2e 단계 기준) |
