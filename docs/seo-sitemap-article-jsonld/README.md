# seo-sitemap-article-jsonld

> 작성일: 2026-06-07 | 작성자: Claude Code

## 개요

검색엔진(Google·Bing)·AI 크롤러(GPTBot·ClaudeBot·PerplexityBot)가 sitemap에서 색인 가능한 URL을 누락 없이 수확하고, Article JSON-LD의 신규 5필드로 SERP 리치 카드를 풍부화한다. 원 plan `docs/plan/update-seo-aeo-geo.md`의 PR-A(sitemap 라우트 보강·BUILD_TIME 상수화)와 PR-D(ArticleJsonLd 필드 보강)를 한 PR로 묶어 처리.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| sitemap.xml에 `/info`, `/guides/hospital-bag`, `/guides/weekly-prep` 포함, `/videos` 미포함 | ✅ | `out/sitemap.xml`에 16 정적 + 15 article = 31 `<loc>` 확인. (spec의 27→30 수치는 article 12→15 증가 시점의 잔여 카운트.) |
| 한 빌드 안에서 정적 라우트 `<lastmod>`가 모두 동일 (BUILD_TIME 모듈 상수) | ✅ | E2E 회귀 가드(`한 빌드 안에서 모든 정적 라우트의 lastmod 값이 동일하다`) 통과. |
| Article JSON-LD에 `image`·`mainEntityOfPage`·`keywords`·`articleSection`·`wordCount` 5필드 주입 | ✅ | E2E + 빌드 산출물 grep으로 5필드 모두 검증. |
| Google Rich Results Test "Valid Article" | ⏳ | 배포 후 수동 검증 (코드 단계 N/A). |
| Search Console 색인 27→30 | ⏳ | 배포 후 1~2주 추적 (코드 단계 N/A). |

### 생성/수정 파일

- 수정: `src/types/article.ts` — `Article` 타입에 `wordCount: number` 추가.
- 수정: `src/lib/articles.ts` — `countWords(markdown)` pure 함수 export, `getArticleBySlug`에서 disclaimer 제외 본문으로 `wordCount` 계산. `mainContent` 로컬 const로 중복 join 제거 (refactor).
- 수정: `src/app/sitemap.ts` — `BUILD_TIME` 모듈 상수 도입, 모든 정적 라우트 `lastModified` 일괄 교체, `/info`·`/guides/hospital-bag`·`/guides/weekly-prep` 추가.
- 수정: `src/app/articles/[slug]/page.tsx` — ArticleJsonLd props 확장(slug·tags·wordCount), jsonLd에 5필드 주입, props 타입을 `Pick<Article, …>`로 추출 (refactor).
- 신규: `src/lib/__tests__/articles.test.ts` — `countWords` 15 케이스.
- 신규: `e2e/seo-sitemap-article-jsonld.spec.ts` — 8 active + 1 skipped(N/A).

### 주요 결정 사항

- **`countWords` 위치**: `src/lib/articles.ts` 내부에 export. article 도메인 응집 + 호출처 단일.
- **`wordCount` 계산 시점**: render-time 아닌 `getArticleBySlug` 안 1회. JSON-LD 컴포넌트의 markdown 원본 의존 제거 + 런타임 비용 0.
- **`wordCount` 입력 범위**: disclaimer(`> ⚠️ …` blockquote) 제외한 `contentLines`만. 면책 문구가 끼면 글마다 +30~50 워드 노이즈 일관 적용되어 글 간 비교 왜곡.
- **`countWords` strip 순서**: 코드 펜스 → 인라인 코드 → 이미지. 변수 chain으로 self-documenting, 의도된 동작은 unit test 8 케이스로 잠금.
- **`keywords`/`articleSection` 가드**: `tags.length > 0`일 때만 두 필드 동시 주입. spec 결정 그대로.
- **`/videos` 라우트**: meta-refresh + `robots:noindex` 유지, sitemap 미등재. 정적 export 환경의 redirect 불가 제약 + 외부 인바운드 보존의 최소 변경 해법.

### 가정 사항 및 미구현 항목

- `/info`, `/guides/hospital-bag`, `/guides/weekly-prep` 페이지가 이미 존재 — 빌드 산출물에서 정적 페이지 생성 확인.
- `image: ${BASE_URL}/articles/${slug}.webp` 규칙은 P4.5/4.6/4.7 webp 전환 작업에서 모든 article 슬러그 webp 생성됨을 전제. 신규 글 추가 시 webp 누락 회귀 가드는 별도 PR 후보.
- Rich Results Test 검증과 Search Console 색인 추적은 배포 후 수동.

---

## 코드 리뷰 결과

### Critical 이슈

없음.

### Warning (수정 권장)

1. **articles.ts — `contentLines.join("\n")` 중복 호출**: 동일 표현이 remark·countWords 두 곳에서 호출. → refactor 단계에서 `mainContent` 로컬 const로 추출 완료.
2. **articles.ts — `countWords` strip 순서 가정 비명시**: 변수 chain으로 의도가 self-documenting이고 unit test가 이미 순서를 잠그고 있어 주석 추가 시 noise — 스킵.
3. **page.tsx — ArticleJsonLd props 인라인 타입**: `Article` 변경 시 두 곳을 동시 손대야 하는 약한 결합. → refactor 단계에서 `Pick<Article, …>`로 추출 완료.

### Suggestion (별도 PR 후보)

- `countWords` 위치 — 비슷한 metadata 보조 함수가 늘면 `src/lib/articles/metadata.ts` 서브 모듈 분리 검토.
- `BUILD_TIME` 재현성 — 동일 커밋 2회 빌드 시 분 단위로 다름. 정확한 재현성은 git commit time 기반 필요. spec의 "한 빌드 안에서 동일" 가드는 충족.
- `image` URL 가드 — 빌드 단계에서 `out/articles/<slug>.webp` 존재 검증 추가 검토.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 3건 발견, 2건 수정 완료 (1건 사유 명시 후 스킵) |
| Suggestion | 3건 |

---

## 리팩토링 내용

### 작업 목록

1. **articles.ts — `contentLines.join("\n")` 중복 제거**: `const mainContent = contentLines.join("\n")`로 1회 추출 후 remark·countWords 두 곳에서 참조. 의도 노출 ↑.
2. **page.tsx — ArticleJsonLd props 타입을 `Pick<Article, …>`로 교체**: SoT를 `Article` 한 곳으로 일원화. `Article` 변경이 자동 전파.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 리팩토링 대상 파일 | 2개 | 2개 (수정만, 분리 없음) |
| `contentLines.join("\n")` 호출 | 2회 | 1회 (const 추출) |
| ArticleJsonLd props 타입 SoT | 인라인 (Article과 분리됨) | `Pick<Article, …>` (Article에 종속) |
| public interface 변경 | - | 없음 (props 형식·동작 동일) |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 3 passed (sitemap 3 routes · JSON-LD 5필드 · articleSection=tags[0]) |
| Error/Validation (회귀 가드) | ✅ 4 passed (/videos 제외 · BUILD_TIME 일관성 · article lastmod 분리 · wordCount 양수) |
| 권한/인증 | ⏭️ 1 skipped (정적 사이트, N/A 명시) |
| 반응형 (Mobile 375px) | ✅ 1 passed (JSON-LD viewport 일관성) |
| **전체** | **8 passed / 1 skipped / 0 failed** (3.6s) |

추가 검증: Unit 171/171 passed (전체 회귀 0건, 478ms).

📊 상세 리포트: `playwright-report/index.html`

---

## 관련 문서

- 원 plan: [docs/plan/update-seo-aeo-geo.md](../plan/update-seo-aeo-geo.md) (PR-A + PR-D)
- spec: [docs/features/seo-sitemap-article-jsonld/spec.md](../features/seo-sitemap-article-jsonld/spec.md)
- 구현 상세: [docs/implementation/seo-sitemap-article-jsonld-impl.md](../implementation/seo-sitemap-article-jsonld-impl.md)
- 리뷰 상세: [docs/review/seo-sitemap-article-jsonld-review.md](../review/seo-sitemap-article-jsonld-review.md)
- 리팩토링 상세: [docs/refactor/seo-sitemap-article-jsonld-refactor.md](../refactor/seo-sitemap-article-jsonld-refactor.md)
