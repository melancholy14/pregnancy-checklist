# seo-sitemap-article-jsonld 리팩토링

리팩토링일: 2026-06-07
원 리뷰: [docs/review/seo-sitemap-article-jsonld-review.md](../review/seo-sitemap-article-jsonld-review.md)

## 리팩토링한 파일 목록
- `src/lib/articles.ts`
- `src/app/articles/[slug]/page.tsx`

---

## 작업별 내용

### 1. articles.ts — `contentLines.join("\n")` 중복 제거
- **출처**: review Warning 1
- **무엇을**: `getArticleBySlug` 안에서 `contentLines.join("\n")`를 두 번(remark 처리, countWords) 호출하던 것을 `const mainContent = contentLines.join("\n")`로 1회 추출 후 두 곳에서 참조.
- **왜**: 동일 표현을 두 번 쓰는 게 의도 노출이 약하고, 미래에 분리 로직이 바뀌면 한쪽만 갱신될 위험. 비용 자체는 무시할 수준이지만 가독성·안전성 모두 +.

### 2. page.tsx — ArticleJsonLd props 타입을 `Pick<Article, …>`로 교체
- **출처**: review Warning 3
- **무엇을**: 8필드 인라인 객체 타입을 `type ArticleJsonLdProps = Pick<Article, "title" | "description" | "canonical" | "date" | "updated" | "slug" | "tags" | "wordCount">`로 추출. `import type { Article }` 추가.
- **왜**: 인라인 정의는 `Article` 타입과 두 곳을 동시 수정해야 하는 약한 결합. `Pick`으로 SoT를 `Article` 한 곳으로 일원화.

### 스킵한 항목

#### review Warning 2 — `countWords` strip 순서 주석
- **사유**: 변수 chain (`withoutCodeFences` → `withoutInlineCode` → `withoutImages`)이 이미 self-documenting이고, 순서 의존성은 unit test (`articles.test.ts`의 8개 strip 케이스)가 잠궈둠. 사용자 코드 컨벤션상 "WHAT 설명 주석 금지·WHY 비명시일 때만 한 줄"인데 WHY는 테스트로 박혀 있음 — 주석 추가 시 noise만 늘어남.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 리팩토링 대상 파일 | 2개 | 2개 (수정만, 분리 없음) |
| `contentLines.join("\n")` 호출 | 2회 | 1회 (const 추출) |
| ArticleJsonLd props 타입 SoT | 인라인 (Article과 분리됨) | `Pick<Article, …>` (Article에 종속) |
| public interface 변경 | - | 없음 (props 형식 동일, 동작 동일) |

---

## 빌드 결과
성공 (1회 시도).

남은 Warning/Suggestion (review 문서 참조):
- Warning 2 (strip 순서 주석) — 의도적 스킵, 사유 위 기록.
- Suggestion 3건 (countWords 위치, BUILD_TIME 재현성, image URL 가드) — 별도 PR/이슈 후보.
