# 콘텐츠 SEO/AEO/GEO 보강 계획

> 작성일: 2026-06-03
> 진행 갱신: 2026-06-08
> 대상: pregnancy-checklist.com
> 컨텍스트: GA4 트래픽이 기대치 대비 낮음 → 진단 결과 sitemap absolute URL 버그 발견, 1단계 fix 완료. 2단계로 콘텐츠 SEO/AEO/GEO 마크업 보강 필요.

## 진행 현황 (2026-06-08 기준)

| PR | 항목 | 상태 | 머지 커밋 / 문서 |
|----|------|------|------------------|
| PR-A | Sitemap 누락 라우트 + BUILD_TIME | ✅ 완료 | `5317686` · [seo-sitemap-article-jsonld](../seo-sitemap-article-jsonld/README.md) |
| PR-B | BreadcrumbList JSON-LD | ⬜ 미착수 | — |
| PR-C | FAQPage JSON-LD | ✅ 완료 | (PR pending) · [faq-jsonld](../faq-jsonld/README.md) |
| PR-D | Article JSON-LD 5필드 보강 | ✅ 완료 | `5317686` · [seo-sitemap-article-jsonld](../seo-sitemap-article-jsonld/README.md) |
| PR-E | WebSite + Person JSON-LD | ⬜ 미착수 | — |
| PR-F | llms.txt + AI 크롤러 정책 | ⬜ 미착수 | — robots.ts 에 명시 allow 없음, `public/llms.txt` 없음 |

**잔여 작업**: PR-B · PR-E · PR-F (3개). 산후 휴면(2026-08 ~) 진입 전 PR-B 우선 권장 (사이트 전체 일관 마크업의 마지막 한 조각).

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

### PR-B. BreadcrumbList JSON-LD ⬜ 미착수

**효과**: Google 검색결과에 빵부스러기 노출. 사이트 구조 이해도 ↑. 모든 페이지에 한 번 박으면 끝.

**작업**
- [ ] 공통 `<BreadcrumbJsonLd items={...} />` 컴포넌트 작성
- [ ] 글 페이지: `홈 > 아티클 > {title}`
- [ ] 체크리스트/가이드 페이지: `홈 > 체크리스트 > {sub}`, `홈 > 가이드 > {sub}`
- [ ] 정적 페이지: `홈 > {label}`

**공수**: 1~2시간
**의존**: 없음

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

### PR-E. WebSite + Person JSON-LD (루트 레이아웃) ⬜ 미착수

**효과**: site name 표시 (WebSite name+url+alternateName). E-E-A-T의 "Identity" 신호는 sameAs 없는 Person 으로는 거의 활용 안 됨 — 후속 보강 필요.

> Sitelinks Search Box 는 2026 기준 Google 글로벌 retire (deprecated 2024-11-21). `SearchAction` 필드는 더 이상 효과 없으므로 영구 배제. — jsonld-breadcrumb-identity PR 에서 결정.

**작업**
- [ ] [src/app/layout.tsx](../../src/app/layout.tsx)에 한 번만 주입:
  - [ ] `WebSite` — `name + url + alternateName` 3 필드만
  - [ ] `Person` (뿌까뽀까) 최소판 — `name + url` 만. `sameAs` 는 SNS 공개 결정 후 후속 PR 에서 보강
- [ ] (후속 PR) `Person.sameAs` / `image` / `description` 보강 — 운영자 SNS 공개 결정 시

**공수**: 1시간
**의존**: 없음. SNS 링크 있을 때 더 강력 — 없으면 일단 `Person` 최소판만.

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
| 2주차 (6월 2주) | **PR-C** | ✅ 완료 (이번 세션) | AEO 큰 한 방. frontmatter 스키마 변경이 핵심 |
| 3주차 (6월 3주) | **PR-B + PR-E** | ⬜ 미착수 | 사이트 전체 일관 마크업 마무리 |
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
