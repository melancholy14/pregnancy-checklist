# seo-sitemap-article-jsonld Implementation

원 spec: [docs/features/seo-sitemap-article-jsonld/spec.md](../../features/seo-sitemap-article-jsonld/spec.md)
원 plan: [docs/plan/update-seo-aeo-geo.md](../../plan/update-seo-aeo-geo.md) PR-A + PR-D
구현일: 2026-06-07

## 완료 조건 충족 여부
| 조건 | 상태 | 비고 |
|------|------|------|
| sitemap.xml에 `/info`, `/guides/hospital-bag`, `/guides/weekly-prep` 포함, `/videos` 미포함 | ✅ | 빌드 산출물 `out/sitemap.xml`에 16개 정적 + 15개 article = 31개 `<loc>` 확인. spec의 27→30 카운트는 article 수가 12→15로 늘어난 시점의 잔여 수치. |
| 한 빌드 안에서 정적 라우트 `<lastmod>`가 모두 동일 (모듈 상수) | ✅ | `BUILD_TIME = new Date()` 모듈 상수 1회 선언, 모든 정적 라우트 공유. Article은 `a.updated ?? a.date` 유지. |
| Article JSON-LD에 `image`·`mainEntityOfPage`·`keywords`·`articleSection`·`wordCount` 5필드 주입 | ✅ | `out/articles/weekly-prenatal-checklist.html`에서 5필드 모두 grep 검증. |
| Google Rich Results Test "Valid Article" | ⏳ | 배포 후 별도 검증 항목. 코드 작업에서는 N/A. |
| Search Console 색인 27→30 | ⏳ | 배포 후 1~2주 추적 항목. |

## 생성/수정 파일 목록
### 신규 생성
- 없음.

### 수정
- `src/types/article.ts` — `Article` 타입에 `wordCount: number` 필드 추가.
- `src/lib/articles.ts` — `countWords(markdown)` pure 함수 export, `getArticleBySlug`에서 disclaimer 제외한 본문(markdown 원본)으로 `wordCount` 계산.
- `src/app/sitemap.ts` — 모듈 상수 `BUILD_TIME` 도입, 모든 정적 라우트의 `lastModified`를 일괄 교체, `/info`·`/guides/hospital-bag`·`/guides/weekly-prep` 3개 라우트 추가.
- `src/app/articles/[slug]/page.tsx` — `ArticleJsonLd` props에 `slug`·`tags`·`wordCount` 추가, jsonLd 객체에 `image`·`mainEntityOfPage`·`keywords`·`articleSection`·`wordCount` 5필드 주입. 호출 측 동시 갱신.

## 주요 결정 사항
- **`countWords` 위치**: 별도 파일이 아닌 `src/lib/articles.ts` 내부에 export. — `getArticleBySlug`가 유일한 호출처이고, article 도메인에 응집되는 게 자연스럽기 때문. 단위 테스트는 `articles.ts`에서 import해서 작성 가능.
- **wordCount 계산 시점**: render-time이 아닌 `getArticleBySlug` 안 1회 계산. — JSON-LD 컴포넌트가 markdown 원본 의존성을 갖는 것을 피하고, build 시점에 한 번만 계산되어 런타임 cost 0.
- **wordCount 입력 범위**: disclaimer(`> ⚠️ …` blockquote)를 제외한 `contentLines`만 사용. — 본문 분량 신호인데 면책 문구가 끼면 글마다 +30~50 워드 노이즈가 일관되게 끼어 글 간 비교가 왜곡됨.
- **`countWords` 정규식**: 코드 펜스(```` ``` ```` ) → 인라인 코드(`` ` ``) → 이미지(`![…](…)`) 순으로 제거 후 공백 split. alt 텍스트는 통째로 제거(이미지 마크다운 전체 매칭) — spec의 "이미지 alt 제외"를 단순화한 해석. 한국어 어절 단위 토큰화이므로 영어 단어 수보다 적게 나오는 게 정상.
- **`keywords`/`articleSection` 가드**: `tags.length > 0`일 때만 두 필드 동시 주입. — tags가 빈 글에서 빈 문자열 필드가 들어가는 것 방지. spec의 "tags가 비어있으면 필드 자체 미주입" 그대로.

## 가정 사항
- `/info`, `/guides/hospital-bag`, `/guides/weekly-prep`는 이미 페이지가 존재한다 — 빌드 산출물에서 정적 페이지로 생성됨 확인.
- `articleSection`은 frontmatter `tags[0]`을 그대로 사용 (spec 결정). 향후 `category` 필드 도입 시 재방문.
- `image`는 `${BASE_URL}/articles/${slug}.webp` 규칙으로 글마다 동일 — 실제 파일 존재 여부는 검증하지 않음. P4.5/4.6/4.7 webp 전환 작업에서 이미 모든 article 슬러그에 대해 webp가 생성됨을 전제.

## 미구현 항목
- 단위 테스트: `countWords`의 코드 펜스/인라인 코드/이미지 제거 케이스. — 파이프라인 3단계(`write-unit-tests`)에서 작성 예정.
- Rich Results Test 검증: 배포 후 수동 확인 필요.
- spec의 won't 목록(MedicalWebPage, reviewedBy, BreadcrumbList/FAQPage 등)은 명시적으로 손대지 않음.
