# 콘텐츠 SEO/AEO/GEO 보강 계획

> 작성일: 2026-06-03
> 진행 갱신: 2026-06-09
> 대상: pregnancy-checklist.com
> 컨텍스트: GA4 트래픽이 기대치 대비 낮음 → 진단 결과 sitemap absolute URL 버그 발견, 1단계 fix 완료. 2단계로 콘텐츠 SEO/AEO/GEO 마크업 보강 필요.

## 진행 현황 (2026-06-09 기준)

| PR | 항목 | 상태 | 머지 커밋 / 문서 |
|----|------|------|------------------|
| PR-A | Sitemap 누락 라우트 + BUILD_TIME | ✅ 완료 | `5317686` · [seo-sitemap-article-jsonld](../seo-sitemap-article-jsonld/README.md) |
| PR-B | BreadcrumbList JSON-LD | ✅ 완료 | PR pending (2026-06-09 세션) · [jsonld-breadcrumb-identity](../jsonld-breadcrumb-identity/README.md) |
| PR-C | FAQPage JSON-LD | ✅ 완료 | (PR pending) · [faq-jsonld](../faq-jsonld/README.md) |
| PR-D | Article JSON-LD 5필드 보강 | ✅ 완료 | `5317686` · [seo-sitemap-article-jsonld](../seo-sitemap-article-jsonld/README.md) |
| PR-E | WebSite + Person JSON-LD (최소판) | ✅ 완료 | PR pending (2026-06-09 세션, PR-B와 같이) · [jsonld-breadcrumb-identity](../jsonld-breadcrumb-identity/README.md) |
| PR-F | llms.txt + AI 크롤러 정책 | ⬜ 미착수 | — robots.ts 에 명시 allow 없음, `public/llms.txt` 없음 |

**잔여 작업**: PR-F (1개). 산후 휴면(2026-08 ~) 진입 전 마무리. 추가로 [후속 작업 (휴면 전후)](#후속-작업-휴면-전후) 3건 — sameAs 보강 · JSON-LD XSS hardening · about 페이지 JSON-LD 통합.

---

## 1단계 완료 (참고)

- **문제**: GitHub Actions `SITE_URL` secret 미설정 → `??`가 빈 문자열을 fallback 트리거 못함 → sitemap.xml의 27개 `<loc>` 전부 상대 경로 → Google이 sitemap 무시
- **수정**: [src/app/sitemap.ts:6](../../src/app/sitemap.ts#L6), [src/app/robots.ts:5](../../src/app/robots.ts#L5)에서 `??` → `||` 변경
- **사용자 후속 작업**:
  - GitHub repo Secrets에 `SITE_URL=https://pregnancy-checklist.com` 등록 (선택, 코드 fallback이 막아주지만 명시성↑)
  - 배포 후 Search Console에 sitemap 재제출
  - 1~2주 후 색인 카운트 추적

---

## 2단계: 콘텐츠 SEO/AEO/GEO 작업 묶음

### PR-A. Sitemap 누락 라우트 + lastModified 정합성 ✅ 완료

**효과**: 색인 가능한 URL 자체를 늘림. lastModified 신뢰도 ↑ (현재는 매 빌드 `new Date()` → Google이 신선도 신호를 신뢰 안 함)

**작업**
- [x] [src/app/sitemap.ts](../../src/app/sitemap.ts)에 누락 라우트 추가
  - [x] `/info`, `/guides/hospital-bag`, `/guides/weekly-prep`
  - [x] `/videos` — sitemap 미등재 + robots meta noindex 결합으로 결정 (`e2e/seo-sitemap-article-jsonld.spec.ts` 가드)
- [x] 정적 페이지 `BUILD_TIME` 상수 도입 — 한 빌드 안 모든 정적 라우트의 lastmod 동일 (관련 회귀 가드 e2e)
- [x] Article은 이미 `a.updated ?? a.date` 쓰고 있음

**머지 커밋**: `5317686` (2026-06-07)
**산출물**: [docs/seo-sitemap-article-jsonld/README.md](../seo-sitemap-article-jsonld/README.md)

---

### PR-B. BreadcrumbList JSON-LD ✅ 완료

**효과**: Google 검색결과에 빵부스러기 노출. 사이트 구조 이해도 ↑. 13개 indexable 페이지에 일관 마크업.

**구현 완료** ([src/lib/breadcrumb-labels.ts](../../src/lib/breadcrumb-labels.ts) · [src/components/seo/BreadcrumbJsonLd.tsx](../../src/components/seo/BreadcrumbJsonLd.tsx))
- [x] 공통 `<BreadcrumbJsonLd items={...} />` 컴포넌트 — `items` 빈 배열이면 null
- [x] 라벨 SoT 모듈 `breadcrumb-labels.ts` — `BREADCRUMB_LABELS` 정적 객체 + `getBreadcrumbForPath(pathname, articleMeta?)` pure function
- [x] 글 페이지: `홈 > 정보 & 가이드 > {article.title}` (3-level, articleMeta 동적 주입)
- [x] 체크리스트 sub 페이지: `홈 > 체크리스트 > {sub}` (3-level)
- [x] 정적 페이지: `홈 > {label}` (2-level — `/timeline`, `/baby-fair`, `/articles`, `/weight`, `/about`, `/contact`, `/privacy`, `/terms`)
- [x] 루트 `/`: position 1 단일
- [x] Redirect 4개 페이지(`/info`, `/videos`, `/guides/hospital-bag`, `/guides/weekly-prep`)에는 BreadcrumbList 박지 않음 (`robots: noindex` 와 일관)

**테스트**: unit 20/20 (pure function 시그니처 + 4 케이스 유형) · e2e 신규 11/11 + 갱신 spec 2개 회귀 0 · fs-level grep 가드 (13 indexable html 1회 / redirect 4 html 0회).

**머지 커밋**: PR pending (2026-06-09 세션에서 PR-E 와 함께 완료)
**산출물**: [docs/jsonld-breadcrumb-identity/README.md](../jsonld-breadcrumb-identity/README.md)

---

### PR-C. FAQPage JSON-LD ✅ 완료 (AEO 핵심)

**효과**: AI Overview·Featured Snippet·"사람들이 묻는 질문" 노출. **AEO에서 가장 큰 한 방.**

**backfill 완료 글** (frontmatter `faq:` 박혀 있고 빌드 산출물에 `"@type":"FAQPage"` 1회 주입 확인)
- [x] [early-pregnancy-tests](../../src/content/articles/early-pregnancy-tests.md) (5문항)
- [x] [early-pregnancy-fatigue-reasons](../../src/content/articles/early-pregnancy-fatigue-reasons.md) (5문항)
- [x] [2026-parental-leave-guide](../../src/content/articles/2026-parental-leave-guide.md) (5문항)
- [x] [babyfair-survival-guide](../../src/content/articles/babyfair-survival-guide.md) (6문항)
- [x] [pregnancy-foods-to-avoid](../../src/content/articles/pregnancy-foods-to-avoid.md) (5문항)

**작업**
- [x] 글 frontmatter에 `faq: [{q, a}]` 필드 신설 + `parseArticleMeta` strict validation (malformed → throw)
- [x] 글 페이지에서 `faq` 있으면 FAQPage JSON-LD 주입 + `ArticleDetail` 가 본문 영역에 자동 렌더 (SSOT)
- [x] 작성 페르소나 [docs/content/blog-writer-persona.md](../content/blog-writer-persona.md) 에 FAQ 룰 5건 추가 (입력 위치·1차 소스 게이트·인라인 마크다운·⚠️ 금지·`→` 금지)
- [x] 기존 5개 글 backfill (본문 `## 자주 묻는 질문` 제거)

**머지 커밋**: PR pending (이 세션에서 완료)
**산출물**: [docs/faq-jsonld/README.md](../faq-jsonld/README.md)

---

### PR-D. Article JSON-LD 필드 보강 ✅ 완료

**효과**: Google에 글 메타 정보 풍부하게 전달. 미세하지만 누적 효과.

**구현 완료 필드** ([src/app/articles/[slug]/page.tsx](../../src/app/articles/[slug]/page.tsx) `ArticleJsonLd`)
- [x] `image` — `${BASE_URL}/articles/${slug}.webp`
- [x] `mainEntityOfPage` — WebPage `@id` = canonical
- [x] `keywords` — `tags.join(", ")`
- [x] `articleSection` — `tags[0]` (별도 카테고리 필드 신설 X)
- [x] `wordCount` — `countWords(mainContent)` 자동 계산

**Skip 결정 유지**: `MedicalWebPage`/`HealthTopic` — 임상 출처 마크업·전문가 검수 필드까지 채워야 신뢰도 ↑, 부실하면 역효과.

**머지 커밋**: `5317686` (2026-06-07)
**산출물**: [docs/seo-sitemap-article-jsonld/README.md](../seo-sitemap-article-jsonld/README.md)

---

### PR-E. WebSite + Person JSON-LD (루트 레이아웃) ✅ 완료 (최소판)

**효과**: site name 표시 (WebSite name+url+alternateName). E-E-A-T의 "Identity" 신호는 sameAs 없는 Person 으로는 거의 활용 안 됨 — 후속 보강 필요.

> Sitelinks Search Box 는 2026 기준 Google 글로벌 retire (deprecated 2024-11-21). `SearchAction` 필드는 더 이상 효과 없으므로 영구 배제. — jsonld-breadcrumb-identity PR 에서 결정.

**구현 완료** ([src/app/layout.tsx](../../src/app/layout.tsx))
- [x] `WebSite` JSON-LD — `name: "출산 준비 체크리스트"` + `url: BASE_URL` + `alternateName: "뿌까뽀까 출산 준비"` 3 필드만. SearchAction 부재.
- [x] `Person` JSON-LD 최소판 — `name: "뿌까뽀까"` + `url: ${BASE_URL}/about` 2 필드만. sameAs/image/description/jobTitle 부재.
- [x] Person 위에 `// TODO(jsonld-breadcrumb-identity): sameAs 보강 후속 PR 필요` 마커 1줄 — 회수 지점 명시.

**테스트**: e2e 가드 — 루트 `/` 의 WebSite/Person 각 1개, SearchAction 0회, sameAs 0회. fs-level grep 으로 `out/index.html` 도 동일 확인.

**잔여 작업** (후속 PR, [후속 작업 (휴면 전후)](#후속-작업-휴면-전후) §1 참조):
- [ ] `Person.sameAs` / `image` / `description` 보강 — 운영자 SNS 공개 결정 시.

**머지 커밋**: PR pending (2026-06-09 세션에서 PR-B 와 함께 완료)
**산출물**: [docs/jsonld-breadcrumb-identity/README.md](../jsonld-breadcrumb-identity/README.md)

---

### PR-F. llms.txt + AI 크롤러 정책 ⬜ 미착수 (GEO)

**효과**: ChatGPT Search·Perplexity·Claude가 사이트를 학습/인용할 때 어떤 페이지를 우선할지 가이드. 신생 컨벤션이라 보장은 없지만 비용 0.

**현재 상태 점검** (2026-06-08):
- `public/llms.txt` 없음 (`public/` 에 CNAME, ads.txt, og-image.png, articles/ 만 존재)
- [src/app/robots.ts](../../src/app/robots.ts) 는 `userAgent: "*", allow: "/"` 만. AI 크롤러 명시 allow 없음 — 와일드카드로 허용되긴 하지만 의도 표명 강도 낮음
- 5317686 커밋 메시지에 "AI 크롤러" 언급은 sitemap 색인 측면이고 robots.ts 직접 명시는 미완

**작업**
- [ ] `public/llms.txt` 생성: 사이트 소개 + 핵심 아티클·체크리스트 URL 목록 + 라이선스 안내
- [ ] `public/llms-full.txt` (선택): 핵심 콘텐츠 마크다운 통째로
- [ ] [src/app/robots.ts](../../src/app/robots.ts)에 AI 크롤러 정책 명시:
  - [ ] `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `CCBot` — **allow** (인용 받으려면 막으면 안 됨)
  - [ ] 명시적 allow가 의도 표명에 가까움

**공수**: 1~2시간
**의존**: 없음

---

## 권장 실행 순서

| 주차 | PR 묶음 | 상태 | 비고 |
|------|---------|------|------|
| 1주차 (6월 1주) | **PR-A + PR-D** | ✅ 완료 (5317686, 2026-06-07) | 단순·낮은 리스크, 한 PR로 묶기 추천 (공수 1시간) |
| 2주차 (6월 2주) | **PR-C** | ✅ 완료 (이전 세션) | AEO 큰 한 방. frontmatter 스키마 변경이 핵심 |
| 3주차 (6월 3주) | **PR-B + PR-E** | ✅ 완료 (2026-06-09 세션) | 사이트 전체 일관 마크업 마무리. WebSite/Person 은 최소판 (sameAs 후속) |
| 4주차 (6월 4주) | **PR-F** | ⬜ 미착수 | 산후 휴면 들어가기 전 마무리 |

---

## 일정 메모

- 출산 예정일 2026-08-13 → 약 10주 남음
- 산후 3개월 휴면 예정 → 휴면 기간 중에는 추적·대응 불가
- Google 색인 효과 발현에 1~2주 소요
- **→ 6월 안에 PR-A·C·D는 끝내는 것이 안전**. 후반에 몰면 휴면 기간에 효과 측정 불가.

---

## 추적 지표

배포 후 1~2주 단위로 Search Console에서:

- **색인된 페이지 수**: 현재 (1단계 fix 직후) → 목표 27개 → 신규 라우트 추가 후 30개
- **노출 수 (Impressions)**: PR 단계별로 추세 비교
- **클릭률 (CTR)**: BreadcrumbList·FAQ 도입 후 검색결과 풍부도 ↑ → CTR 상승 기대
- **검색어**: AEO 효과 측정은 "사람들이 묻는 질문" 형태 검색어가 늘어나는지로 판단

GA4와 Search Console을 연동했다면 GSC 데이터를 GA4 Explorations에서도 같이 볼 수 있음.

---

## 후속 작업 (휴면 전후)

본 계획 PR 외에 [jsonld-breadcrumb-identity](../jsonld-breadcrumb-identity/README.md) PR 에서 발견된 후속 정리 대상. 모두 본 PR scope 밖이라 별도 PR 로 분리. 산후 휴면 진입 전(7월 중) 또는 휴면 후(2026-11~) 우선순위 결정.

### 1. `Person.sameAs` 보강 — 운영자 SNS 공개 결정 후

- **트리거**: 운영자 SNS / 외부 프로필(인스타·블로그 등) 공개 결정.
- **작업**:
  - [src/app/layout.tsx](../../src/app/layout.tsx) 의 `personJsonLd` 에 `sameAs: [URL, ...]` + `image` + `description` + `jobTitle` 보강.
  - layout 의 `// TODO(jsonld-breadcrumb-identity): sameAs 보강 후속 PR 필요` 마커 제거.
  - e2e 가드 갱신: `e2e/seo-breadcrumb-jsonld.spec.ts` 의 "Person 최소판" 단언을 sameAs 존재로 전환 (또는 두 모드 분기).
- **효과**: sameAs 없는 Person 은 Google ProfilePage / E-E-A-T 매칭에 거의 활용 안 됨 → identity 신호 본격화.
- **공수**: 1시간 (SNS URL 확정 후).
- **의존**: 운영자 결정. SNS 공개 안 하기로 결정하면 영구 보류 가능.

### 2. JSON-LD XSS hardening (codebase-wide)

- **트리거**: 보안 강화 차원에서 선제적 도입. 현재 위험도 낮음(외부 사용자 입력 0).
- **현재 패턴**: `BreadcrumbJsonLd` · `ArticleJsonLd` · `FaqPageJsonLd` · `AboutJsonLd` · GA 인라인 스크립트 모두 `JSON.stringify` 결과를 그대로 `dangerouslySetInnerHTML` 주입. `</script>` 부분 문자열이 frontmatter 에 들어오면 script 태그 조기 종료 가능.
- **작업**:
  - 공통 helper 도입: `src/lib/json-ld.ts` 에 `safeJsonLdSerialize(jsonLd: object): string`.
    ```ts
    return JSON.stringify(jsonLd)
      .replace(/</g, "\\u003c")
      .replace(/--/g, "\\u002d\\u002d");
    ```
  - 5개 사용처 일괄 교체: `BreadcrumbJsonLd.tsx`, `articles/[slug]/page.tsx`(`ArticleJsonLd`+`FaqPageJsonLd`), `about/page.tsx`(`AboutJsonLd`), `layout.tsx`(WebSite+Person, GA 스크립트는 별도 판단).
  - e2e 가드 갱신 불필요 — JSON 의미는 동일, 문자열만 escape.
- **공수**: 30분.
- **의존**: 없음.

### 3. about 페이지 JSON-LD 통합

- **트리거**: PR-E 의 최소판 layout 주입과 기존 `AboutJsonLd` @graph 가 중복. `@id` fragment 분리로 schema.org 충돌은 없으나 wasteful.
- **현재 상태**: `out/about.html` 빌드 산출물에 WebSite JSON-LD 2개, Person JSON-LD 2개 박힘 (layout 최소판 + about @graph 풀버전).
- **작업** (두 옵션 중 운영자 결정):
  - 옵션 A — about 페이지 `AboutJsonLd` 제거, layout 의 최소판을 sameAs 보강 PR(§1)에서 풀버전으로 키움. 단일 SoT.
  - 옵션 B — about 페이지 `AboutJsonLd` 유지(@graph 형식이 보강된 형태), layout 의 about 경로에만 Person 주입 안 하도록 분기 추가.
- **공수**: 30분~1시간.
- **의존**: §1 sameAs 보강과 같이 처리 권장 (운영자 SNS 결정과 묶음).

---

## Skip한 항목 (의도적)

- **MedicalWebPage/HealthTopic 마크업**: 임상 출처·전문가 검수 필드 부실 시 역효과
- **AMP**: Google이 사실상 디스카운트, 도입 효과 없음
- **JSON-LD `reviewedBy` 자기 자신**: E-E-A-T 부적절
- **자동 FAQ 마크다운 파싱**: 추출 실패·중복 위험, frontmatter 구조화가 안전

---

## 참고

- 1단계 진단·수정 컨텍스트는 이 PR과 같은 세션에서 진행됨 (sitemap absolute URL bug)
- 작성 페르소나 룰: [docs/content/blog-writer-persona.md](../content/blog-writer-persona.md)
- 디자인 시스템: [DESIGN.md](../../DESIGN.md)
