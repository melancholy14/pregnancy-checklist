# seo-sitemap-article-jsonld

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-06-07
> plan: [spec](../../features/seo-sitemap-article-jsonld/spec.md)

<!-- STEP:impl -->
## 구현

원 spec: [docs/features/seo-sitemap-article-jsonld/spec.md](../../features/seo-sitemap-article-jsonld/spec.md)
원 plan: [docs/plan/update-seo-aeo-geo.md](../../plan/update-seo-aeo-geo.md) PR-A + PR-D
구현일: 2026-06-07

### 완료 조건 충족 여부
| 조건 | 상태 | 비고 |
|------|------|------|
| sitemap.xml에 `/info`, `/guides/hospital-bag`, `/guides/weekly-prep` 포함, `/videos` 미포함 | ✅ | 빌드 산출물 `out/sitemap.xml`에 16개 정적 + 15개 article = 31개 `<loc>` 확인. spec의 27→30 카운트는 article 수가 12→15로 늘어난 시점의 잔여 수치. |
| 한 빌드 안에서 정적 라우트 `<lastmod>`가 모두 동일 (모듈 상수) | ✅ | `BUILD_TIME = new Date()` 모듈 상수 1회 선언, 모든 정적 라우트 공유. Article은 `a.updated ?? a.date` 유지. |
| Article JSON-LD에 `image`·`mainEntityOfPage`·`keywords`·`articleSection`·`wordCount` 5필드 주입 | ✅ | `out/articles/weekly-prenatal-checklist.html`에서 5필드 모두 grep 검증. |
| Google Rich Results Test "Valid Article" | ⏳ | 배포 후 별도 검증 항목. 코드 작업에서는 N/A. |
| Search Console 색인 27→30 | ⏳ | 배포 후 1~2주 추적 항목. |

### 생성/수정 파일 목록
#### 신규 생성
- 없음.

#### 수정
- `src/types/article.ts` — `Article` 타입에 `wordCount: number` 필드 추가.
- `src/lib/articles.ts` — `countWords(markdown)` pure 함수 export, `getArticleBySlug`에서 disclaimer 제외한 본문(markdown 원본)으로 `wordCount` 계산.
- `src/app/sitemap.ts` — 모듈 상수 `BUILD_TIME` 도입, 모든 정적 라우트의 `lastModified`를 일괄 교체, `/info`·`/guides/hospital-bag`·`/guides/weekly-prep` 3개 라우트 추가.
- `src/app/articles/[slug]/page.tsx` — `ArticleJsonLd` props에 `slug`·`tags`·`wordCount` 추가, jsonLd 객체에 `image`·`mainEntityOfPage`·`keywords`·`articleSection`·`wordCount` 5필드 주입. 호출 측 동시 갱신.

### 주요 결정 사항
- **`countWords` 위치**: 별도 파일이 아닌 `src/lib/articles.ts` 내부에 export. — `getArticleBySlug`가 유일한 호출처이고, article 도메인에 응집되는 게 자연스럽기 때문. 단위 테스트는 `articles.ts`에서 import해서 작성 가능.
- **wordCount 계산 시점**: render-time이 아닌 `getArticleBySlug` 안 1회 계산. — JSON-LD 컴포넌트가 markdown 원본 의존성을 갖는 것을 피하고, build 시점에 한 번만 계산되어 런타임 cost 0.
- **wordCount 입력 범위**: disclaimer(`> ⚠️ …` blockquote)를 제외한 `contentLines`만 사용. — 본문 분량 신호인데 면책 문구가 끼면 글마다 +30~50 워드 노이즈가 일관되게 끼어 글 간 비교가 왜곡됨.
- **`countWords` 정규식**: 코드 펜스(```` ``` ```` ) → 인라인 코드(`` ` ``) → 이미지(`![…](…)`) 순으로 제거 후 공백 split. alt 텍스트는 통째로 제거(이미지 마크다운 전체 매칭) — spec의 "이미지 alt 제외"를 단순화한 해석. 한국어 어절 단위 토큰화이므로 영어 단어 수보다 적게 나오는 게 정상.
- **`keywords`/`articleSection` 가드**: `tags.length > 0`일 때만 두 필드 동시 주입. — tags가 빈 글에서 빈 문자열 필드가 들어가는 것 방지. spec의 "tags가 비어있으면 필드 자체 미주입" 그대로.

### 가정 사항
- `/info`, `/guides/hospital-bag`, `/guides/weekly-prep`는 이미 페이지가 존재한다 — 빌드 산출물에서 정적 페이지로 생성됨 확인.
- `articleSection`은 frontmatter `tags[0]`을 그대로 사용 (spec 결정). 향후 `category` 필드 도입 시 재방문.
- `image`는 `${BASE_URL}/articles/${slug}.webp` 규칙으로 글마다 동일 — 실제 파일 존재 여부는 검증하지 않음. P4.5/4.6/4.7 webp 전환 작업에서 이미 모든 article 슬러그에 대해 webp가 생성됨을 전제.

### 미구현 항목
- 단위 테스트: `countWords`의 코드 펜스/인라인 코드/이미지 제거 케이스. — 파이프라인 3단계(`write-unit-tests`)에서 작성 예정.
- Rich Results Test 검증: 배포 후 수동 확인 필요.
- spec의 won't 목록(MedicalWebPage, reviewedBy, BreadcrumbList/FAQPage 등)은 명시적으로 손대지 않음.

---

<!-- STEP:review -->
## 코드 리뷰

리뷰일: 2026-06-07
대상 spec: [docs/features/seo-sitemap-article-jsonld/spec.md](../../features/seo-sitemap-article-jsonld/spec.md)
대상 impl: [docs/implementation/seo-sitemap-article-jsonld-impl.md](#구현)

### 리뷰 대상 파일
- `src/types/article.ts`
- `src/lib/articles.ts`
- `src/app/sitemap.ts`
- `src/app/articles/[slug]/page.tsx`

---

### Critical 이슈 (즉시 수정 완료)

없음.

---

### Warning (수정 권장)

#### 1. articles.ts — `contentLines.join("\n")` 중복 호출
- **위치**: [src/lib/articles.ts:109, src/lib/articles.ts:115](../../../src/lib/articles.ts#L109-L115)
- **문제**: `getArticleBySlug` 안에서 disclaimer를 분리한 `contentLines.join("\n")` 결과를 `remark().process(...)` 와 `countWords(...)` 두 곳에서 호출한다. 빌드 1회 N개 글 처리이므로 실제 비용은 무시할 수준이지만, 가독성 측면에서 동일 표현을 두 번 쓰는 건 의도 노출이 약하다.
- **권장 수정**: `const mainContent = contentLines.join("\n")` 로 1회 추출 후 두 곳에서 참조. refactor 단계 candidate.

#### 2. articles.ts — `countWords` 정규식 순서 가정이 주석 없이 박혀 있음
- **위치**: [src/lib/articles.ts:15-21](../../../src/lib/articles.ts#L15-L21)
- **문제**: code fence → inline code → image 순서로 strip하는 이유가 코드만 보면 안 드러난다. 인라인 코드(`` `x` ``) 안의 image 마크다운이 inline code 단계에서 통째로 제거되는 의도된 동작이 있는데, 미래 자기 자신이 순서를 바꾸면 동작이 미세하게 바뀐다.
- **권장 수정**: 운영 메모리 정책상 "WHY가 비명시적"일 때만 한 줄 주석. 1줄 추가 또는 함수명 옆 `(strip order matters)` 정도. refactor 단계 candidate — 또는 의도된 동작을 unit test가 이미 잠그고 있으므로 보류 가능.

#### 3. page.tsx — ArticleJsonLd props 타입 인라인 정의
- **위치**: [src/app/articles/[slug]/page.tsx:49-67](../../../src/app/articles/%5Bslug%5D/page.tsx#L49-L67)
- **문제**: props 8필드를 인라인 객체 타입으로 박아뒀다. `Article` 타입과 거의 1:1 대응이므로 `Pick<Article, "title" | "description" | ...>` 로 줄일 수 있다. 현 인라인 정의는 `Article` 변경 시 두 곳을 동시에 손대야 하는 약한 결합.
- **권장 수정**: `type ArticleJsonLdProps = Pick<Article, "title" | "description" | "canonical" | "date" | "updated" | "slug" | "tags" | "wordCount">`. refactor 단계 candidate.

---

### Suggestion (개선 아이디어)

#### 1. articles.ts — `countWords` 위치
- 모듈명은 도메인 일반 명사인데 함수는 명확히 metadata 계산 보조다. 향후 readingTime 같은 비슷한 함수가 늘면 `src/lib/articles/metadata.ts` 같은 서브 모듈 분리 검토.

#### 2. sitemap.ts — `BUILD_TIME` 재현성
- `output: "export"` 환경에서 빌드 1회당 1번 평가됨. 동일 커밋 2회 빌드 시 lastmod 값은 분 단위로 다르다 (정확히 같으려면 git commit time 기반으로 잡아야 함). spec의 회귀 가드는 "한 빌드 안에서 동일"만 보장하면 충분하다고 결정했으므로 이 차이는 의도된 한계. PR 설명에 명시 검토.

#### 3. page.tsx — `image` URL 가드
- `image: ${BASE_URL}/articles/${slug}.webp`가 실제 파일 존재를 가정한다. P4.5/4.6/4.7에서 모든 article에 webp가 생성됨을 전제로 하지만, 신규 글 추가 시 webp 누락이 발생하면 SERP에서 broken image. 빌드 단계에서 `out/articles/<slug>.webp` 존재 검증을 추가하면 회귀 방지에 유효 — 별도 PR 후보.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 3건 (`contentLines.join` 중복, strip 순서 가정 비명시, ArticleJsonLd props 인라인 타입) |
| Suggestion | 3건 (countWords 위치, BUILD_TIME 재현성, image URL 가드) |
| 빌드 | 미실행 (Critical 0건) |

---

<!-- STEP:refactor -->
## 리팩토링

리팩토링일: 2026-06-07
원 리뷰: [docs/review/seo-sitemap-article-jsonld-review.md](#코드-리뷰)

### 리팩토링한 파일 목록
- `src/lib/articles.ts`
- `src/app/articles/[slug]/page.tsx`

---

### 작업별 내용

#### 1. articles.ts — `contentLines.join("\n")` 중복 제거
- **출처**: review Warning 1
- **무엇을**: `getArticleBySlug` 안에서 `contentLines.join("\n")`를 두 번(remark 처리, countWords) 호출하던 것을 `const mainContent = contentLines.join("\n")`로 1회 추출 후 두 곳에서 참조.
- **왜**: 동일 표현을 두 번 쓰는 게 의도 노출이 약하고, 미래에 분리 로직이 바뀌면 한쪽만 갱신될 위험. 비용 자체는 무시할 수준이지만 가독성·안전성 모두 +.

#### 2. page.tsx — ArticleJsonLd props 타입을 `Pick<Article, …>`로 교체
- **출처**: review Warning 3
- **무엇을**: 8필드 인라인 객체 타입을 `type ArticleJsonLdProps = Pick<Article, "title" | "description" | "canonical" | "date" | "updated" | "slug" | "tags" | "wordCount">`로 추출. `import type { Article }` 추가.
- **왜**: 인라인 정의는 `Article` 타입과 두 곳을 동시 수정해야 하는 약한 결합. `Pick`으로 SoT를 `Article` 한 곳으로 일원화.

#### 스킵한 항목

##### review Warning 2 — `countWords` strip 순서 주석
- **사유**: 변수 chain (`withoutCodeFences` → `withoutInlineCode` → `withoutImages`)이 이미 self-documenting이고, 순서 의존성은 unit test (`articles.test.ts`의 8개 strip 케이스)가 잠궈둠. 사용자 코드 컨벤션상 "WHAT 설명 주석 금지·WHY 비명시일 때만 한 줄"인데 WHY는 테스트로 박혀 있음 — 주석 추가 시 noise만 늘어남.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 리팩토링 대상 파일 | 2개 | 2개 (수정만, 분리 없음) |
| `contentLines.join("\n")` 호출 | 2회 | 1회 (const 추출) |
| ArticleJsonLd props 타입 SoT | 인라인 (Article과 분리됨) | `Pick<Article, …>` (Article에 종속) |
| public interface 변경 | - | 없음 (props 형식 동일, 동작 동일) |

---

### 빌드 결과
성공 (1회 시도).

남은 Warning/Suggestion (review 문서 참조):
- Warning 2 (strip 순서 주석) — 의도적 스킵, 사유 위 기록.
- Suggestion 3건 (countWords 위치, BUILD_TIME 재현성, image URL 가드) — 별도 PR/이슈 후보.
