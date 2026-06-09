# jsonld-breadcrumb-identity Implementation

> 구현일: 2026-06-09
> 관련 기획: [spec.md](../features/jsonld-breadcrumb-identity/spec.md)
> 관련 QA: [qa.md](../features/jsonld-breadcrumb-identity/qa.md)

## 완료 조건 충족 여부

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

## 생성/수정 파일 목록

### 신규 생성

- `src/lib/breadcrumb-labels.ts` — `BREADCRUMB_LABELS` 정적 객체 + `getBreadcrumbForPath` pure function. article slug 패턴(`/articles/:slug`)은 articleMeta 입력으로 분기.
- `src/components/seo/BreadcrumbJsonLd.tsx` — `items: BreadcrumbItem[]` props. 빈 배열이면 null, 아니면 `<script type="application/ld+json">` 1 회 주입.

### 수정

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

## 주요 결정 사항

- **라벨 SoT 단일화 (`BREADCRUMB_LABELS`)**: spec §6 운영자 확정 라벨 13 개를 `src/lib/breadcrumb-labels.ts` 의 정적 객체에 박았다. 라우트 추가 시 sitemap·labels 두 파일을 같은 위치에서 갱신하도록 키 순서를 sitemap 순서와 맞췄다.
- **article slug 분기 위치**: `getBreadcrumbForPath` 가 `pathname.startsWith("/articles/")` 일 때만 `articleMeta` 를 요구. meta 없으면 빈 배열 반환 → `BreadcrumbJsonLd` 가 null 렌더 (component-level early return). 동적 라우트가 정적 `/articles` 와 충돌하지 않도록 `pathname === "/articles"` 는 일반 분기에서 처리.
- **about 페이지 기존 `AboutJsonLd` 유지**: 이미 about 페이지에는 `@graph` 형식의 Person(#creator) + WebSite(#website) JSON-LD 가 박혀 있음. spec 이 제거를 명시하지 않았고 `@id` fragment 가 서로 구분되어 schema.org 충돌이 없으므로 그대로 두고 layout 의 최소판 WebSite/Person 과 공존시킴. (운영자 후속 결정에 따라 정리 가능)
- **plan 문서 stale 카피 갱신**: review.md §6.1 후속 작업 — `docs/plan/update-seo-aeo-geo.md` PR-E 의 SearchAction 작업·`Person.image/description` 작업을 삭제하고, Sitelinks Search Box 2024-11-21 deprecated 근거를 1 줄 노트로 박았다.

## 가정 사항

- (spec 명시) `getArticleBySlug` 가 `notFound()` 를 트리거하면 페이지·BreadcrumbList 모두 렌더되지 않으므로 unknown slug 분기 추가 불필요.
- (spec 명시) `parseArticleMeta` 가 schema 검증 통과한 article 만 반환하므로 `article.title` 항상 truthy. fallback 불필요.
- (spec 명시) `next/script` 사용 시 strategy 결정·hydration 비용 추가 — 기존 `ArticleJsonLd`/`FaqPageJsonLd` 의 인라인 `<script>` 패턴 유지가 ROI 우선.
- (구현 추가) about 페이지에는 기존 `AboutJsonLd` (@graph 기반 Person + WebSite) 와 layout 의 최소판 WebSite + Person 이 공존. 서로 다른 `@type` script 로 박히지만 의미상 중복 — 향후 about 페이지 통합 정리 PR 에서 결정.

## 미구현 항목

- (spec §3.won't) `Person.sameAs` / `image` / `description` / `jobTitle` — 운영자 SNS 공개 결정 후 별도 PR. `// TODO(jsonld-breadcrumb-identity): sameAs 보강 후속 PR 필요` 마커가 layout 에 박혀 있어 회수 가능.
- (spec §3.won't) WebSite `SearchAction` — 결정 2 (Sitelinks Search Box deprecated) 에 따라 영구 배제.
- (spec §3.won't) BreadcrumbList 시각 UI / GA4 클릭 추적 — 디자인 결정 없음, JSON-LD 메타만.
- 기존 E2E 갱신 (`seo-sitemap-article-jsonld.spec.ts`, `seo-faq-jsonld.spec.ts`) — Phase 4 (write-e2e-tests) / Phase 5 (run-e2e) 단계에서 처리.
- 신규 unit/E2E 테스트 (`breadcrumb-labels.test.ts`, `seo-breadcrumb-jsonld.spec.ts`) — Phase 3·4 에서 처리.
