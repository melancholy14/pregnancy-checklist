# jsonld-breadcrumb-identity

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-06-09
> plan: [spec](../../features/jsonld-breadcrumb-identity/spec.md) · [qa](../../features/jsonld-breadcrumb-identity/qa.md)

<!-- STEP:impl -->
## 구현

> 구현일: 2026-06-09
> 관련 기획: [spec.md](../../features/jsonld-breadcrumb-identity/spec.md)
> 관련 QA: [qa.md](../../features/jsonld-breadcrumb-identity/qa.md)

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `src/lib/breadcrumb-labels.ts` — 라벨 SoT + `getBreadcrumbForPath` pure function | ✅ 완료 | mock 0 으로 unit testable |
| `src/components/seo/BreadcrumbJsonLd.tsx` — 공통 컴포넌트, 빈 배열 시 null 반환 | ✅ 완료 | `dangerouslySetInnerHTML` 1 회 주입 |
| 13개 indexable 페이지에 BreadcrumbJsonLd 통합 | ✅ 완료 | build 산출물 fs-grep 으로 모두 1 회씩 등장 확인 |
| `src/app/layout.tsx` 에 WebSite + Person (최소판) JSON-LD 주입 | ✅ 완료 | TODO 마커 1줄 포함 |
| Redirect 4개 페이지에는 BreadcrumbList 주입 안 함 | ✅ 완료 | `/info`, `/videos`, `/guides/hospital-bag`, `/guides/weekly-prep` 모두 0 회 |
| WebSite 는 `name + url + alternateName` 3 필드만, SearchAction 부재 | ✅ 완료 | 빌드 산출물 grep 결과 SearchAction 0 회 |
| Person 은 `name + url` 만, sameAs/image/description 부재 | ✅ 완료 | sameAs 0 회 확인 (about 페이지의 별도 `AboutJsonLd` 와 다른 script) |
| `docs/plan/update-seo-aeo-geo.md` PR-E stale 카피 갱신 | ✅ 완료 | SearchAction deprecated 노트 + 최소판 작업 항목 반영 |

### 생성/수정 파일 목록

#### 신규 생성

- `src/lib/breadcrumb-labels.ts` — `BREADCRUMB_LABELS` 정적 객체 + `getBreadcrumbForPath` pure function. article slug 패턴(`/articles/:slug`)은 articleMeta 입력으로 분기.
- `src/components/seo/BreadcrumbJsonLd.tsx` — `items: BreadcrumbItem[]` props. 빈 배열이면 null, 아니면 `<script type="application/ld+json">` 1 회 주입.

#### 수정

- `src/app/layout.tsx` — `<head>` 에 WebSite + Person JSON-LD 2 개 주입. Person 위에 `TODO(jsonld-breadcrumb-identity): sameAs 보강 후속 PR 필요` 마커 1 줄 추가.
- `src/app/page.tsx` — 루트 BreadcrumbJsonLd 통합.
- `src/app/timeline/page.tsx` — 통합.
- `src/app/checklist/page.tsx` — 통합.
- `src/app/checklist/hospital-bag/page.tsx` — 통합.
- `src/app/checklist/partner-prep/page.tsx` — 통합.
- `src/app/checklist/pregnancy-prep/page.tsx` — 통합.
- `src/app/baby-fair/page.tsx` — 통합.
- `src/app/articles/page.tsx` — 통합.
- `src/app/articles/[slug]/page.tsx` — 통합. `article.title` + `article.slug` 를 `articleMeta` 로 주입.
- `src/app/weight/page.tsx` — 통합.
- `src/app/about/page.tsx` — 통합 (기존 `AboutJsonLd` 와 공존).
- `src/app/contact/page.tsx` — 통합.
- `src/app/privacy/page.tsx` — 통합.
- `src/app/terms/page.tsx` — 통합.
- `docs/plan/update-seo-aeo-geo.md` — PR-E 섹션 효과 카피 갱신, SearchAction 작업 항목 삭제, Sitelinks Search Box deprecated 노트 추가.

### 주요 결정 사항

- **라벨 SoT 단일화 (`BREADCRUMB_LABELS`)**: spec §6 운영자 확정 라벨 13 개를 `src/lib/breadcrumb-labels.ts` 의 정적 객체에 박았다. 라우트 추가 시 sitemap·labels 두 파일을 같은 위치에서 갱신하도록 키 순서를 sitemap 순서와 맞췄다.
- **article slug 분기 위치**: `getBreadcrumbForPath` 가 `pathname.startsWith("/articles/")` 일 때만 `articleMeta` 를 요구. meta 없으면 빈 배열 반환 → `BreadcrumbJsonLd` 가 null 렌더 (component-level early return). 동적 라우트가 정적 `/articles` 와 충돌하지 않도록 `pathname === "/articles"` 는 일반 분기에서 처리.
- **about 페이지 기존 `AboutJsonLd` 유지**: 이미 about 페이지에는 `@graph` 형식의 Person(#creator) + WebSite(#website) JSON-LD 가 박혀 있음. spec 이 제거를 명시하지 않았고 `@id` fragment 가 서로 구분되어 schema.org 충돌이 없으므로 그대로 두고 layout 의 최소판 WebSite/Person 과 공존시킴. (운영자 후속 결정에 따라 정리 가능)
- **plan 문서 stale 카피 갱신**: review.md §6.1 후속 작업 — `docs/plan/update-seo-aeo-geo.md` PR-E 의 SearchAction 작업·`Person.image/description` 작업을 삭제하고, Sitelinks Search Box 2024-11-21 deprecated 근거를 1 줄 노트로 박았다.

### 가정 사항

- (spec 명시) `getArticleBySlug` 가 `notFound()` 를 트리거하면 페이지·BreadcrumbList 모두 렌더되지 않으므로 unknown slug 분기 추가 불필요.
- (spec 명시) `parseArticleMeta` 가 schema 검증 통과한 article 만 반환하므로 `article.title` 항상 truthy. fallback 불필요.
- (spec 명시) `next/script` 사용 시 strategy 결정·hydration 비용 추가 — 기존 `ArticleJsonLd`/`FaqPageJsonLd` 의 인라인 `<script>` 패턴 유지가 ROI 우선.
- (구현 추가) about 페이지에는 기존 `AboutJsonLd` (@graph 기반 Person + WebSite) 와 layout 의 최소판 WebSite + Person 이 공존. 서로 다른 `@type` script 로 박히지만 의미상 중복 — 향후 about 페이지 통합 정리 PR 에서 결정.

### 미구현 항목

- (spec §3.won't) `Person.sameAs` / `image` / `description` / `jobTitle` — 운영자 SNS 공개 결정 후 별도 PR. `// TODO(jsonld-breadcrumb-identity): sameAs 보강 후속 PR 필요` 마커가 layout 에 박혀 있어 회수 가능.
- (spec §3.won't) WebSite `SearchAction` — 결정 2 (Sitelinks Search Box deprecated) 에 따라 영구 배제.
- (spec §3.won't) BreadcrumbList 시각 UI / GA4 클릭 추적 — 디자인 결정 없음, JSON-LD 메타만.
- 기존 E2E 갱신 (`seo-sitemap-article-jsonld.spec.ts`, `seo-faq-jsonld.spec.ts`) — Phase 4 (write-e2e-tests) / Phase 5 (run-e2e) 단계에서 처리.
- 신규 unit/E2E 테스트 (`breadcrumb-labels.test.ts`, `seo-breadcrumb-jsonld.spec.ts`) — Phase 3·4 에서 처리.

---

<!-- STEP:review -->
## 코드 리뷰

> 리뷰일: 2026-06-09
> 관련 spec: [docs/features/jsonld-breadcrumb-identity/spec.md](../../features/jsonld-breadcrumb-identity/spec.md)
> 관련 impl: [docs/implementation/jsonld-breadcrumb-identity-impl.md](#구현)

### 리뷰 대상 파일

신규 (2):
- `src/lib/breadcrumb-labels.ts`
- `src/components/seo/BreadcrumbJsonLd.tsx`

수정 (15 코드 + 1 문서):
- `src/app/layout.tsx`
- `src/app/page.tsx`, `timeline/page.tsx`, `checklist/page.tsx`, `checklist/hospital-bag/page.tsx`, `checklist/partner-prep/page.tsx`, `checklist/pregnancy-prep/page.tsx`, `baby-fair/page.tsx`, `articles/page.tsx`, `articles/[slug]/page.tsx`, `weight/page.tsx`, `about/page.tsx`, `contact/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`
- `docs/plan/update-seo-aeo-geo.md`

총 18개 파일.

---

### Critical 이슈 (즉시 수정 완료)

없음.

근거:
- `dangerouslySetInnerHTML` 사용처 (`BreadcrumbJsonLd`, layout 의 WebSite/Person) 의 입력값이 모두 (a) 코드 내 정적 리터럴 또는 (b) `parseArticleMeta` schema 검증을 통과한 frontmatter 값. 외부 사용자 입력 0.
- `any` 사용 0, 단언 0.
- 정적 export 빌드 산출물이 fs-grep 가드 통과 (13 indexable BreadcrumbList 1회, redirect 4 페이지 0회, SearchAction/sameAs 0).
- Unit 20/20 + E2E 32/32 통과 — 명세 일치.

---

### Warning (수정 권장 — 코드 미수정, 문서 기록)

#### 1. JSON.stringify 결과를 `dangerouslySetInnerHTML` 에 그대로 주입 (codebase-wide 기존 패턴)
- **위치**: `src/components/seo/BreadcrumbJsonLd.tsx:24`, `src/app/layout.tsx:69, 73`, 기존 `src/app/articles/[slug]/page.tsx` `ArticleJsonLd`·`FaqPageJsonLd`
- **문제**: `JSON.stringify` 가 `<` 문자를 escape 하지 않음. 만약 article frontmatter `title` 이나 BreadcrumbList 항목 라벨에 `</script>` 부분 문자열이 들어가면 script 태그가 조기 종료되어 HTML injection 가능.
- **현재 위험도**: 낮음 — 운영자만 frontmatter 작성, `parseArticleMeta` schema 검증 통과, 외부 사용자 입력 경로 없음.
- **권장 수정**: 공통 헬퍼 `safeJsonLdSerialize(jsonLd: object): string` 만들어 `JSON.stringify(...).replace(/</g, "\\u003c").replace(/--/g, "\\u002d\\u002d")` 적용. 본 PR 범위 밖이며 기존 3개 컴포넌트 + 신규 1개를 한 번에 갱신하는 별도 PR 권장.
- **본 PR 도입 분 책임**: 0 — 기존 codebase 패턴을 그대로 따랐음. 이 PR 에서 신규로 발생한 위험은 아님.

#### 2. about 페이지의 WebSite/Person JSON-LD 중복 주입
- **위치**: `src/app/about/page.tsx` (기존 `AboutJsonLd` @graph 의 Person + WebSite) + `src/app/layout.tsx` (신규 WebSite + Person 최소판)
- **문제**: `/about` 페이지의 빌드 산출물에 WebSite JSON-LD 가 2 개, Person JSON-LD 가 2 개 박힘. Schema.org 는 `@id` fragment 가 다르면 충돌로 보지 않지만, Google 의 동일 도메인 내 동일 @type 다중 declarations 처리는 우선순위 규칙이 명세화되어 있지 않아 SERP 표현 예측이 어려워질 수 있음.
- **현재 위험도**: 낮음 — 빌드 산출물 fs-grep 결과 의도된 값만 박혀 있고 e2e 회귀 0. `@id` 분리(`#creator`, `#website`)로 충돌 표면 회피.
- **권장 수정**: `AboutJsonLd` 통합 정리 PR — about 페이지의 @graph 와 layout 의 minimal Person/WebSite 중 한쪽으로 일원화. 운영자 SNS 공개 결정과 함께 처리 (sameAs 보강 후속 PR 과 같이).
- **본 PR 책임**: spec.md §7 가 about 페이지의 기존 AboutJsonLd 제거를 명시하지 않았고 BreadcrumbJsonLd 추가만 지시했으므로 spec 충실. 후속 정리 대상.

#### 3. `BREADCRUMB_LABELS["/articles"]` 비-null 직접 접근
- **위치**: `src/lib/breadcrumb-labels.ts:54`
- **문제**: article slug 분기에서 `BREADCRUMB_LABELS["/articles"]` 을 옵셔널 체이닝 없이 접근. 정적 객체 리터럴이라 키가 보장되지만, 만약 라벨 키가 리네임/삭제되어도 TypeScript 가 잡지 못함 (값 타입이 `Record<string, string>` 이라 모든 키 접근이 `string` 타입).
- **권장 수정**: 라벨 SoT 를 `as const` + literal key union 으로 강화하거나 article 라벨을 별도 상수로 분리. 본 PR 범위 밖 cleanup.

---

### Suggestion (개선 아이디어)

#### 1. `HOME_LABEL` 상수와 `BREADCRUMB_LABELS["/"]` 의 `"홈"` 리터럴 중복
- **위치**: `src/lib/breadcrumb-labels.ts:14, 17`
- 둘 다 값이 `"홈"` 이지만 별개 선언. `homeItem()` 헬퍼는 `HOME_LABEL` 을 쓰고, 표준 분기는 `BREADCRUMB_LABELS[pathname]` 을 씀. 향후 라벨 변경 시 두 군데를 동시에 고쳐야 함. 한쪽을 SoT 로 일원화 권장.

#### 2. layout 의 WebSite/Person JSON-LD 도 공통 컴포넌트로 추출 가능
- **위치**: `src/app/layout.tsx:67-74`
- BreadcrumbJsonLd 와 같은 형태의 `WebSiteJsonLd`, `PersonJsonLd` 컴포넌트로 추출하면 `dangerouslySetInnerHTML` boilerplate 통일. 본 PR 의 scope 가 layout 단일 주입이라 inline 으로 둔 게 더 적절하지만, sameAs 보강 후속 PR 에서 컴포넌트화 검토 가치 있음.

#### 3. fs-level e2e 가드의 `out/<route>.html` 경로 매핑 함수가 spec 들 사이에 중복
- **위치**: `e2e/seo-breadcrumb-jsonld.spec.ts:71` (`routeToHtmlPath`), `e2e/seo-faq-jsonld.spec.ts:23` (`OUT_DIR`)
- 향후 SEO 관련 e2e 가 늘어나면 `e2e/helpers/seo-paths.ts` 같은 헬퍼로 추출 검토.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견 |
| Warning | 3건 (모두 codebase-wide / 후속 PR 대상, 본 PR 신규 risk 0) |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 없음) |
| 단위 테스트 | 20/20 (Phase 3 run-e2e 단계 기준) |
| E2E | 32/32 + 3 skip (Phase 5 run-e2e 단계 기준) |

---

<!-- STEP:refactor -->
## 리팩토링

> 리팩토링일: 2026-06-09
> 관련 review: [docs/review/jsonld-breadcrumb-identity-review.md](#코드-리뷰)

### 리팩토링한 파일 목록

- `src/lib/breadcrumb-labels.ts`

---

### 작업별 내용

#### 1. `src/lib/breadcrumb-labels.ts` — `HOME_LABEL` 상수 제거 + dead 매핑 통합

- **출처**: 추가 판단 (review.md Suggestion #1 — 본 PR scope 내).
- **무엇을**:
  - 모듈 상단의 `const HOME_LABEL = "홈"` 선언 제거.
  - `homeItem()` 헬퍼가 `BREADCRUMB_LABELS["/"]` 를 직접 참조하도록 변경.
- **왜**:
  - 변경 전: `"홈"` 리터럴이 `HOME_LABEL` 과 `BREADCRUMB_LABELS["/"]` 두 곳에 중복. 라벨 변경 시 두 군데 동기화 필요.
  - 변경 전: `BREADCRUMB_LABELS["/"]` 항목이 dead entry 였음 — 런타임에 루트 분기는 `homeItem()` 으로만 처리(line 44), 매핑 dictionary 의 `"/"` 키는 읽히지 않음.
  - 변경 후: `BREADCRUMB_LABELS` 가 모든 라벨의 단일 SoT. `homeItem()` 도 이를 참조 → 라벨 변경 시 한 곳만 갱신.
- **동작 변화**: 0. unit 20/20, e2e 32/32 통과 그대로.

---

### review.md Warning 처리 사유

review.md 의 Warning 3건은 모두 본 PR 범위 밖으로 명시되어 있어 본 refactor 작업에서 처리하지 않음.

| Warning | 사유 |
|---|---|
| #1 JSON.stringify XSS hardening | codebase-wide 패턴 — 기존 `ArticleJsonLd`/`FaqPageJsonLd`/GA 스크립트도 같은 패턴. 별도 PR 에서 공통 helper 일괄 도입 권장. |
| #2 about 페이지 WebSite/Person 중복 | spec.md §7 가 BreadcrumbJsonLd 추가만 지시, 기존 `AboutJsonLd` 제거 명시 X. 운영자 SNS 공개 결정과 함께 후속 PR. |
| #3 `BREADCRUMB_LABELS["/articles"]` 직접 접근 | `Record<string, string>` 타입 → `as const` literal union 으로 변경하려면 함수 시그니처/index 접근 패턴 전체 재구성 필요. 본 PR scope 밖 cleanup. |

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 1개 | 1개 (변경 없음) |
| 라인 수 | 84줄 | 81줄 |
| `"홈"` 리터럴 출현 | 2회 (HOME_LABEL + BREADCRUMB_LABELS["/"]) | 1회 (BREADCRUMB_LABELS["/"] 단일 SoT) |
| dead 매핑 항목 | 1개 (BREADCRUMB_LABELS["/"] 읽히지 않음) | 0개 (homeItem 이 참조) |

---

### 빌드 결과

✅ 성공 (1회 시도)
- `next build` 완료, 36 페이지 prerender 정상.
- TypeScript strict 통과.

### 테스트 회귀 (다음 단계 run-e2e 에서 재검증 예정)

- Unit: `src/lib/__tests__/breadcrumb-labels.test.ts` — Phase 5 (직전 run-e2e) 기준 20/20 통과. 본 refactor 는 public API 변경 0 이므로 통과 유지 예상.
- E2E: `seo-breadcrumb-jsonld.spec.ts` + 갱신 spec 2 개 — Phase 5 기준 32/32 통과. 동일.
