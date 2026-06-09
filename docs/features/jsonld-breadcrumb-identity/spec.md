# jsonld-breadcrumb-identity 기획서

> 작성일: 2026-06-08  size: M
> 관련 리뷰: [review.md](./review.md)
> 출시 목표: 2026-06-15 주 (산후 휴면 전 3주차)

## review.md 결정사항 참조

- **결정 1 (Person 범위)**: 옵션 A — 최소판 `{name: "뿌까뽀까", url: BASE_URL+"/about"}` 만 박는다.
  > ⚠️ 컨텍스트 보존: review.md §4 항목 1 가정 검증 결과로 Claude 는 옵션 A 를 "❌ 권장 안 함" 으로 격하했음(sameAs 없는 Person 은 Google ProfilePage / E-E-A-T 매칭에 거의 활용 안 됨). 운영자가 의도적으로 옵션 A 를 선택했음. 향후 SNS 공개 결정 시 sameAs · image · description 보강 후속 PR 1개 필요. dev 페르소나 §6.6 ("임시 추정값으로 채우면 그게 영구가 된다") 와 충돌 가능성 있으므로 PR description / 코드 코멘트에 "최소판 — sameAs 보강 후속 작업 필요" 마커 1줄 유지할 것.
- **결정 2 (SearchAction)**: WebSite 만 `name` + `url` + `alternateName` 3 필드로 박고 SearchAction 은 박지 않는다. Google 이 2024-11-21 Sitelinks Search Box deprecated.
- **결정 3 (Breadcrumb 라벨 SoT)**: 옵션 B — 본 spec 에 라벨 후보안 propose. 운영자가 §6 라벨 매핑 표를 검토 후 OK/수정. 확정된 매핑은 `src/lib/breadcrumb-labels.ts` 단일 파일에 박는다.
- **결정 4 (E2E 가드)**: 옵션 B — unit (`getBreadcrumbForPath` 시그니처) + 샘플 4 페이지 E2E + fs-level grep 가드 1 개 (next build 결과의 모든 indexable `.html` 에 `@type":"BreadcrumbList"` 1 회 이상 등장 검증).

## 1. 배경·목적

- 운영자: 산후 휴면 전 SEO 마무리. PR-B (BreadcrumbList) + PR-E (WebSite + Person 최소판) 단일 PR.
- 사용자: 화면 변경 0. JSON-LD 메타 주입만으로 Google SERP 의 breadcrumb 노출·사이트 이름 신호 정확도 ↑.
- 측정: GA4 이벤트 변경 0. 추적 지표는 Search Console (색인 페이지 수, breadcrumb rich result 노출 수, CTR) 에서만 검증.

## 2. 사용자 시나리오

- 시나리오 1 (검색 사용자, 글 페이지 진입): Google 검색 결과에서 글 SERP 카드에 "홈 > 정보 & 가이드 > {글 제목}" breadcrumb 가 글 URL 아래에 노출됨. 사용자가 사이트 구조를 SERP 에서 파악 가능.
- 시나리오 2 (검색 사용자, 체크리스트 진입): Google 검색 결과에서 체크리스트 페이지가 "홈 > 체크리스트 > 출산가방 체크리스트" breadcrumb 와 함께 노출. 사이트 안 IA 가 SERP 에 노출됨.
- 시나리오 3 (Google bot, 모든 indexable 페이지 크롤): 페이지마다 `BreadcrumbList` JSON-LD 가 1 개 박혀 있어 Google 이 사이트 구조를 명시적으로 학습. 17 라우트 중 13 개 indexable 페이지가 일관된 IA 그래프를 형성.
- 시나리오 4 (Google bot, 사이트 진입점): 루트 `/` 에서 `WebSite` JSON-LD (name + alternateName) 가 Google 의 site name 표시 시스템에 명시적 후보를 제공. SERP 의 도메인 부근에 "출산 준비 체크리스트" 가 일관되게 표시됨.

## 3. 기능 요구사항

### must

1. **`src/lib/breadcrumb-labels.ts`** — 라우트 패턴 → 라벨 매핑 단일 SoT 모듈.
   - `BREADCRUMB_LABELS: Record<string, string>` 정적 객체. 라우트 정확 매치용.
   - `getBreadcrumbForPath(pathname: string, articleMeta?: { title: string; slug: string }): BreadcrumbItem[]` — pure function, mock 0 에 unit testable.
   - `BreadcrumbItem = { position: number; name: string; item: string }` (item 은 절대 URL).
   - Unknown route 는 빈 배열 반환 (BreadcrumbList JSON-LD 자체 생성 안 함).
2. **`src/components/seo/BreadcrumbJsonLd.tsx`** — 공통 컴포넌트.
   - props: `items: BreadcrumbItem[]` — 배열이 비면 `null` 반환.
   - `dangerouslySetInnerHTML` 로 `<script type="application/ld+json">` 1 회 주입. 외부 입력 0 (라벨 SoT 가 모두 정적 상수 + article frontmatter).
3. **13 개 indexable 페이지 통합** — 각 페이지의 `page.tsx` 에 `BreadcrumbJsonLd` 추가. article 동적 라우트는 `getArticleBySlug` 결과 `title` 을 articleMeta 로 주입.
4. **`src/app/layout.tsx`에 WebSite JSON-LD + Person JSON-LD (최소판) 1 회 주입.**
   - WebSite: `{name: "출산 준비 체크리스트", url: BASE_URL, alternateName: "뿌까뽀까 출산 준비"}`.
   - Person (최소판): `{name: "뿌까뽀까", url: \`${BASE_URL}/about\`}`. SearchAction · sameAs · image · description · jobTitle 박지 않음.
   - 코드 위에 `// TODO(jsonld-breadcrumb-identity): sameAs 보강 후속 PR 필요 — review.md §4 항목 1 옵션 A 컨텍스트` 한 줄 마커.
5. **redirect 페이지 (4 개) 는 BreadcrumbJsonLd 박지 않음.** `/info`, `/videos`, `/guides/hospital-bag`, `/guides/weekly-prep` 는 server-side redirect + `robots: { index: false }` 이므로 JSON-LD 의미 없음.

### should

- BreadcrumbList 의 `item` 필드는 절대 URL 사용 (`BASE_URL + path`) — Google 권고.
- 라벨 매핑 객체에서 routing 패턴은 정확 매치 + article 동적 패턴 1 종 (`/articles/:slug`).
- `BREADCRUMB_LABELS` 객체의 키 순서는 sitemap.ts 의 라우트 순서와 일치하게 정렬 (라우트 추가 시 두 파일이 같은 위치에 변경되도록).

### won't (이번 범위 밖)

- Person 의 sameAs / image / description / jobTitle — 결정 1 옵션 A 에 따라 보류. 별도 PR 에서 운영자 SNS 공개 결정 후 추가.
- WebSite.SearchAction — 결정 2 자동 결정에 따라 영구 배제.
- BreadcrumbList 시각 UI (헤더 아래 빵부스러기 표시) — 디자인 결정 없음, 이 PR 은 JSON-LD 메타만.
- BreadcrumbList click event GA4 추적 — JSON-LD 자체는 클릭 가능한 UI 가 아니므로 무의미.
- sitemap 의 redirect 라우트 4 개 제거 — PR-A 영역 (이미 머지된 PR 또는 별도 cleanup PR).
- Schema.org 외부 validator 호출 테스트 — review.md 페어 2 합의에 따라 도입 안 함.

## 4. 예외·엣지 케이스

- **Unknown article slug**: `getArticleBySlug` 가 `notFound()` 트리거 → 페이지 자체가 404 로 렌더. BreadcrumbList JSON-LD 도 같이 렌더 안 됨. 분기 추가 불필요.
- **Article frontmatter title 누락**: getAllArticles 단계에서 이미 schema 검증 통과한 article 만 들어옴. articleMeta.title 항상 truthy. 별도 fallback 불필요.
- **layout 의 ConsentGatedScripts / CookieConsentBanner 동의 게이트와의 상호작용**: WebSite/Person JSON-LD 는 동의 여부와 무관 (PII 아님, GA · AdSense 와 별개). 항상 렌더.
- **localStorage 키 변경 영향**: 없음. JSON-LD 는 client-side state 와 무관.
- **next/script vs `<script dangerouslySetInnerHTML>`**: 기존 `ArticleJsonLd` · `FaqPageJsonLd` 패턴(인라인 `<script>`) 과 일치시킴. next/script 사용 시 strategy 결정·hydration 비용 추가 — 동일 패턴 유지가 ROI 우선.

## 5. 성공 기준

- 기능 동작:
  - 13 개 indexable 페이지 빌드 출력 `.html` 각각에 `@type":"BreadcrumbList"` JSON-LD script 1 개 포함.
  - 루트 `index.html` 에 `@type":"WebSite"` + `@type":"Person"` JSON-LD 2 개 포함. SearchAction · sameAs 필드는 박혀있지 않음.
  - redirect 4 개 페이지에는 BreadcrumbList JSON-LD 박혀있지 않음 (`robots: { noindex }` 이므로 일관).
- 측정 지표: GA4 변경 0 — ga4.md 산출물 없음. Search Console 추적 지표(색인 페이지 수, breadcrumb rich result 노출, CTR) 는 [docs/plan/update-seo-aeo-geo.md:145-154](../../plan/update-seo-aeo-geo.md#L145-L154) 의 추적 항목과 동일.
- 사용자 경험: 화면 변경 0 → design.md 산출물 없음.
- 검증: qa.md §2 시나리오 매트릭스(unit/E2E/fs-level grep 가드) 전부 green. qa.md §1 영향 분석에서 갱신 대상 기존 테스트 확인 + 신규 테스트 작성.
- 회귀: 기존 ld+json 가드 (`e2e/seo-sitemap-article-jsonld.spec.ts`, `e2e/seo-faq-jsonld.spec.ts`) 갱신 후 회귀 0. layout JSON-LD 추가로 인한 기존 `.first()` / 주입 순서 가정이 명시 `@type` filter 로 강화됨.

## 6. Breadcrumb 라벨 매핑 (결정 3 옵션 B — 운영자 OK 2026-06-08)

✅ **운영자 확정**: 아래 13 라우트 라벨 매핑을 그대로 `src/lib/breadcrumb-labels.ts` 에 박는다. 라벨 근거: ①BottomNav label, ②각 페이지 `metadata.title` 또는 `meta.title`, ③짧고 검색 노출에 적합한 표현.

| route | 라벨 propose | 근거 | breadcrumb 전체 (절대 URL 생략) |
|---|---|---|---|
| `/` | 홈 | BottomNav `홈` | 홈 |
| `/timeline` | 임신 주차별 타임라인 | metadata.title (full) | 홈 > 임신 주차별 타임라인 |
| `/checklist` | 체크리스트 | BottomNav `체크리스트` | 홈 > 체크리스트 |
| `/checklist/hospital-bag` | 출산가방 체크리스트 | `hospital_bag_checklist.json` meta.title | 홈 > 체크리스트 > 출산가방 체크리스트 |
| `/checklist/partner-prep` | 남편/파트너 준비 체크리스트 | `partner_prep_checklist.json` meta.title | 홈 > 체크리스트 > 남편/파트너 준비 체크리스트 |
| `/checklist/pregnancy-prep` | 임신 준비 체크리스트 | `pregnancy_prep_checklist.json` meta.title | 홈 > 체크리스트 > 임신 준비 체크리스트 |
| `/baby-fair` | 베이비페어 | BottomNav `베이비페어` | 홈 > 베이비페어 |
| `/articles` | 정보 & 가이드 | metadata.title | 홈 > 정보 & 가이드 |
| `/articles/[slug]` | (article.title) | article frontmatter | 홈 > 정보 & 가이드 > {article.title} |
| `/weight` | 체중 | BottomNav `체중` | 홈 > 체중 |
| `/about` | 만든 사람 뿌까뽀까 | metadata.title | 홈 > 만든 사람 뿌까뽀까 |
| `/contact` | 의견 보내기 | metadata.title | 홈 > 의견 보내기 |
| `/privacy` | 개인정보처리방침 | metadata.title | 홈 > 개인정보처리방침 |
| `/terms` | 서비스 이용약관 | metadata.title | 홈 > 서비스 이용약관 |

대안 후보 (운영자 수정 시 참고):
- `/timeline` → "타임라인" (짧게)
- `/checklist/partner-prep` → "배우자 준비 체크리스트" (남편/파트너 모호성 회피)
- `/about` → "소개" / "뿌까뽀까 소개"

운영자 결정 사항이 확정되면 본 spec 표를 그대로 갱신 + `src/lib/breadcrumb-labels.ts` 에 박는다.

## 7. 영향 받는 파일

### 신규 생성
- `src/lib/breadcrumb-labels.ts` — 라벨 매핑 + `getBreadcrumbForPath`.
- `src/components/seo/BreadcrumbJsonLd.tsx` — JSON-LD 주입 컴포넌트.
- `src/lib/__tests__/breadcrumb-labels.test.ts` — unit (qa.md §2 참조).
- `e2e/seo-breadcrumb-jsonld.spec.ts` — 샘플 4 페이지 E2E + fs-level grep 가드 1 개 (qa.md §2 참조).

### 수정
- `src/app/layout.tsx` — WebSite + Person 최소판 JSON-LD 2 개 주입.
- `src/app/page.tsx` — BreadcrumbJsonLd 통합 (`/`).
- `src/app/timeline/page.tsx` — BreadcrumbJsonLd 통합.
- `src/app/checklist/page.tsx` — 통합.
- `src/app/checklist/hospital-bag/page.tsx` — 통합.
- `src/app/checklist/partner-prep/page.tsx` — 통합.
- `src/app/checklist/pregnancy-prep/page.tsx` — 통합.
- `src/app/baby-fair/page.tsx` — 통합.
- `src/app/articles/page.tsx` — 통합.
- `src/app/articles/[slug]/page.tsx` — 통합 (article.title 주입).
- `src/app/weight/page.tsx` — 통합.
- `src/app/about/page.tsx` — 통합.
- `src/app/contact/page.tsx` — 통합.
- `src/app/privacy/page.tsx` — 통합.
- `src/app/terms/page.tsx` — 통합.

### 기존 e2e 갱신 (qa.md §1.1 영향 분석 결과)
- `e2e/seo-sitemap-article-jsonld.spec.ts` — `.first()` 대신 `@type === "Article"` filter 로 갱신. layout 의 신규 WebSite/Person JSON-LD 가 첫 번째로 잡혀 단언 실패하는 회귀 방지.
- `e2e/seo-faq-jsonld.spec.ts` — "주입 순서 가드" (line 142-151) 의 의도를 "Article 타입 ld+json 정확히 1 개 존재" 로 갱신. 주입 순서 가정 제거. QA §7.4 가드 약화 X — strict 강화 방향.

### plan 문서 stale 갱신 (review.md §6.1 후속 작업 — 이 PR 에 포함)
- `docs/plan/update-seo-aeo-geo.md` PR-E 섹션 (line 94-105):
  - **효과** 카피 갱신: "사이트링크 검색박스 노출. E-E-A-T의 'Identity' 신호." → "site name 표시 (WebSite name+url+alternateName). E-E-A-T의 'Identity' 신호는 sameAs 없는 Person 으로는 거의 활용 안 됨 — 후속 보강 필요."
  - **작업** 항목에서 `WebSite + SearchAction (사이트 내 검색 → 모달 트리거 URL)` 줄 삭제. WebSite 는 `name + url + alternateName` 3 필드만 남김.
  - Sitelinks Search Box 가 2024-11-21 Google 글로벌 retire 되었다는 근거 1 줄 노트 추가 (jsonld-breadcrumb-identity PR 에서 발견).

### 수정 안 하는 라우트 (redirect 4 개)
- `src/app/info/page.tsx`, `src/app/videos/page.tsx`, `src/app/guides/hospital-bag/page.tsx`, `src/app/guides/weekly-prep/page.tsx` — `robots: { noindex }` 또는 server-side redirect. BreadcrumbList 박지 않음.
