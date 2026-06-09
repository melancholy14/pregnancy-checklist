# jsonld-breadcrumb-identity

> 작성일: 2026-06-09 | 작성자: Claude Code
> 관련 spec: [docs/features/jsonld-breadcrumb-identity/spec.md](../features/jsonld-breadcrumb-identity/spec.md)
> 관련 review: [docs/features/jsonld-breadcrumb-identity/review.md](../features/jsonld-breadcrumb-identity/review.md)
> 관련 qa: [docs/features/jsonld-breadcrumb-identity/qa.md](../features/jsonld-breadcrumb-identity/qa.md)

## 개요

13개 indexable 페이지 각각에 `BreadcrumbList` JSON-LD 를 주입해 Google SERP 의 breadcrumb 리치 카드 노출 + 사이트 IA 명시 신호를 전달하고, 루트 layout 에 `WebSite` (name+url+alternateName) + `Person` 최소판(name+url) JSON-LD 를 1회 주입해 site name 표시·E-E-A-T identity 신호를 보강한다. 화면 변경 0, GA4 이벤트 변경 0 — 메타 데이터만 추가하는 SEO PR. Sitelinks Search Box 가 2024-11-21 Google 글로벌 deprecated 되어 SearchAction 은 영구 배제, sameAs 보강은 운영자 SNS 공개 결정 후 후속 PR.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `src/lib/breadcrumb-labels.ts` — 라벨 SoT + `getBreadcrumbForPath` pure function | ✅ 완료 | mock 0 으로 unit testable |
| `src/components/seo/BreadcrumbJsonLd.tsx` — 공통 컴포넌트, 빈 배열 시 null 반환 | ✅ 완료 | `dangerouslySetInnerHTML` 1회 주입 |
| 13개 indexable 페이지에 BreadcrumbJsonLd 통합 | ✅ 완료 | build 산출물 fs-grep 으로 모두 1회씩 등장 확인 |
| `src/app/layout.tsx` 에 WebSite + Person (최소판) JSON-LD 주입 | ✅ 완료 | TODO 마커 1줄 포함 |
| Redirect 4개 페이지에 BreadcrumbList 주입 안 함 | ✅ 완료 | `/info`, `/videos`, `/guides/hospital-bag`, `/guides/weekly-prep` 모두 0회 |
| WebSite 는 `name + url + alternateName` 3필드, SearchAction 부재 | ✅ 완료 | 빌드 산출물 grep 결과 SearchAction 0회 |
| Person 은 `name + url` 만, sameAs/image/description 부재 | ✅ 완료 | sameAs 0회 확인 |
| `docs/plan/update-seo-aeo-geo.md` PR-E stale 카피 갱신 | ✅ 완료 | SearchAction deprecated 노트 + 최소판 작업 항목 반영 |

### 생성/수정 파일

**신규 (2)**:
- `src/lib/breadcrumb-labels.ts` — `BREADCRUMB_LABELS` 정적 객체 + `getBreadcrumbForPath` pure function. article slug 패턴(`/articles/:slug`)은 articleMeta 입력으로 분기.
- `src/components/seo/BreadcrumbJsonLd.tsx` — `items: BreadcrumbItem[]` props. 빈 배열이면 null, 아니면 `<script type="application/ld+json">` 1회 주입.

**수정 (15 코드 + 1 문서)**:
- `src/app/layout.tsx` — `<head>` 에 WebSite + Person JSON-LD 2개 주입. Person 위에 `TODO(jsonld-breadcrumb-identity): sameAs 보강 후속 PR 필요` 마커 1줄.
- `src/app/page.tsx`, `timeline/page.tsx`, `checklist/page.tsx`, `checklist/hospital-bag/page.tsx`, `checklist/partner-prep/page.tsx`, `checklist/pregnancy-prep/page.tsx`, `baby-fair/page.tsx`, `articles/page.tsx`, `articles/[slug]/page.tsx`, `weight/page.tsx`, `about/page.tsx`, `contact/page.tsx`, `privacy/page.tsx`, `terms/page.tsx` — BreadcrumbJsonLd 통합.
- `docs/plan/update-seo-aeo-geo.md` — PR-E 섹션 효과 카피 갱신, SearchAction 작업 항목 삭제, Sitelinks Search Box deprecated 노트 추가.

**기존 E2E 갱신 (qa.md §1.1 영향 분석 결과)**:
- `e2e/seo-sitemap-article-jsonld.spec.ts` — `.first()` 제거 → `@type === "Article"` filter 후 `toHaveLength(1)`.
- `e2e/seo-faq-jsonld.spec.ts:142-153` — "주입 순서 가드" → "Article 정확 1개 존재" 가드 (strict 강화 방향).

**신규 테스트 (2)**:
- `src/lib/__tests__/breadcrumb-labels.test.ts` — 20 case.
- `e2e/seo-breadcrumb-jsonld.spec.ts` — 12 case (Happy 4 + Layout 검증 3 + 회귀 가드 3 + 반응형 1 + skip 1).

### 주요 결정 사항

- **라벨 SoT 단일화**: spec §6 운영자 확정 13개 라벨을 `src/lib/breadcrumb-labels.ts` 정적 객체에 박음. 라우트 추가 시 sitemap·labels 두 파일을 같은 위치에서 갱신하도록 키 순서를 sitemap 순서와 맞춤.
- **article slug 분기**: `pathname.startsWith("/articles/")` 일 때만 `articleMeta` 요구. meta 없으면 빈 배열 → component-level null 렌더. 정적 `/articles` 와 충돌하지 않도록 정확 매치 우선.
- **about 페이지 기존 `AboutJsonLd` 유지**: 이미 `@graph` 형식의 Person + WebSite JSON-LD 가 있음. spec 이 제거 명시 X, `@id` fragment 가 분리되어 schema.org 충돌 없으므로 layout 의 최소판과 공존 (후속 정리 대상).
- **plan stale 카피 갱신**: `docs/plan/update-seo-aeo-geo.md` PR-E 의 SearchAction · Person.image/description 작업 항목 삭제 + Sitelinks Search Box 2024-11-21 deprecated 노트 1줄 박음.

### 가정 사항 및 미구현 항목

**가정**:
- `getArticleBySlug` 의 `notFound()` 트리거 시 BreadcrumbList 도 같이 렌더 안 됨 → unknown slug 분기 추가 불필요.
- `parseArticleMeta` schema 검증 통과한 article 만 진입 → `article.title` 항상 truthy.
- `next/script` 대신 인라인 `<script>` 유지 → 기존 `ArticleJsonLd`/`FaqPageJsonLd` 패턴 일치 (ROI 우선).

**미구현 (spec §3.won't — 의도된 보류)**:
- `Person.sameAs` / `image` / `description` / `jobTitle` — 운영자 SNS 공개 결정 후 별도 PR. layout 에 `// TODO(jsonld-breadcrumb-identity)` 마커 박힘.
- WebSite `SearchAction` — 결정 2 (Sitelinks Search Box deprecated) 에 따라 영구 배제.
- BreadcrumbList 시각 UI / GA4 클릭 추적 — 디자인 결정 없음, JSON-LD 메타만.

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

없음 — 외부 사용자 입력 0, schema-validated frontmatter 만 사용, 정적 export 환경.

### Warning (모두 본 PR scope 밖, 후속 PR 대상)

1. **JSON.stringify XSS hardening** (codebase-wide): `BreadcrumbJsonLd`/`ArticleJsonLd`/`FaqPageJsonLd`/GA 스크립트가 모두 `JSON.stringify` 결과를 그대로 `dangerouslySetInnerHTML` 주입. `</script>` escape 안 됨. 본 PR 신규 위험 0 (기존 패턴 답습) — 별도 PR 에서 공통 helper `safeJsonLdSerialize()` 일괄 도입 권장.
2. **about 페이지 WebSite/Person 중복**: 기존 `AboutJsonLd` @graph (Person + WebSite) + layout 최소판이 빌드 산출물에 공존. `@id` fragment 분리로 schema.org 충돌은 없으나, 운영자 SNS 공개 결정과 함께 후속 정리 PR.
3. **`BREADCRUMB_LABELS["/articles"]` 직접 접근**: `Record<string, string>` 타입이라 키 삭제 시 TS 가 잡지 못함. e2e 가 회귀를 잡으므로 런타임 가드 존재. 본 PR scope 밖 cleanup.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견 |
| Warning | 3건 (모두 codebase-wide / 후속 PR 대상) |
| Suggestion | 3건 |

---

## 리팩토링 내용

### 작업 목록

**1. `src/lib/breadcrumb-labels.ts` — `HOME_LABEL` 상수 제거 + dead 매핑 통합**

- **무엇을**: 모듈 상단 `const HOME_LABEL = "홈"` 제거, `homeItem()` 이 `BREADCRUMB_LABELS["/"]` 를 직접 참조.
- **왜**: 변경 전 `"홈"` 리터럴이 두 곳에 중복 + `BREADCRUMB_LABELS["/"]` 는 런타임에 읽히지 않는 dead entry 였음 (루트 분기는 `homeItem()` 으로만 처리). 변경 후 `BREADCRUMB_LABELS` 가 모든 라벨의 단일 SoT.

review.md 의 Warning 3건은 모두 본 PR scope 밖으로 명시되어 refactor 단계에서 처리하지 않음 (후속 PR 대상).

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 1개 | 1개 (변경 없음) |
| 라인 수 | 84줄 | 81줄 |
| `"홈"` 리터럴 출현 | 2회 (HOME_LABEL + BREADCRUMB_LABELS["/"]) | 1회 (단일 SoT) |
| dead 매핑 항목 | 1개 (BREADCRUMB_LABELS["/"] 미사용) | 0개 |

---

## 테스트 결과

### Unit (Vitest)

| 파일 | passed | failed | 소요 |
|------|--------|--------|------|
| `src/lib/__tests__/breadcrumb-labels.test.ts` | 20 | 0 | 6ms |

케이스 분포: Happy 3 + Boundary 3 + Priority 1 + Invariant 13.

### E2E (Playwright)

| 시나리오 (신규 spec) | 결과 |
|----------|------|
| Happy Path — 샘플 4 페이지 | ✅ 4 passed |
| Layout 주입 검증 (WebSite/Person 최소판) | ✅ 2 passed |
| Layout 상속 검증 (article 페이지 5종 공존) | ✅ 1 passed |
| Error/Validation — fs-level 회귀 가드 (13/4/루트) | ✅ 3 passed |
| 권한/인증 | ⏭ 1 skipped (정적 사이트 N/A) |
| 반응형 (Mobile 375px) | ✅ 1 passed |
| **신규 spec 전체** | **11 passed / 0 failed / 1 skipped** |

| 갱신 spec (qa.md §1.1) | 결과 |
|---|---|
| `e2e/seo-sitemap-article-jsonld.spec.ts` | ✅ 7 passed / 0 failed / 1 skipped |
| `e2e/seo-faq-jsonld.spec.ts` | ✅ 14 passed / 0 failed / 1 skipped |

**합계: 32 passed / 0 failed / 3 skipped (14.1s)**

리팩토링 후 재실행에서도 회귀 0.

📊 상세 리포트: `playwright-report/index.html`

---

## 빌드

- `npm run build` 성공 (구현·리팩토링 각 1회 시도, TypeScript strict 통과, 36 페이지 prerender 정상).
- 빌드 산출물 fs-grep 가드 통과:
  - 13 indexable `.html` 각각 `@type":"BreadcrumbList"` 1회.
  - redirect 4 `.html` 모두 0회.
  - 루트 `out/index.html`: WebSite 1 + Person 1, `SearchAction`/`sameAs`/`jobTitle` 0회.

---

## 후속 작업

- **sameAs 보강 PR**: 운영자 SNS 공개 결정 후 `Person.sameAs` / `image` / `description` 추가. layout 의 `TODO(jsonld-breadcrumb-identity)` 마커 제거.
- **JSON-LD XSS hardening PR** (codebase-wide): `BreadcrumbJsonLd`/`ArticleJsonLd`/`FaqPageJsonLd`/GA 스크립트에 공통 `safeJsonLdSerialize()` helper 일괄 도입 (`<`, `--` escape).
- **about 페이지 JSON-LD 통합 PR**: 기존 `AboutJsonLd` @graph 와 layout 최소판 중 한쪽으로 일원화 (sameAs 보강 PR 과 같이 처리 권장).
