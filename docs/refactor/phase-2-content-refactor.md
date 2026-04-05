# Phase 2: 콘텐츠 강화 — 리팩토링

## 리팩토링한 파일 목록

- `src/lib/articles.ts`
- `src/app/articles/page.tsx`

---

## 작업별 내용

### 1. articles.ts — frontmatter 타입 단언 → 검증 함수

- **출처**: Warning 1
- **무엇을**: `data as ArticleMeta` 타입 단언 2곳을 `parseArticleMeta(data)` 검증 함수로 교체. 각 필드에 기본값을 부여하여 frontmatter 필드 누락 시에도 안전하게 동작.
- **왜**: `tags` 필드가 누락된 MD 파일이 추가되면 `article.tags.includes()`에서 `TypeError` 발생 가능. 안전한 파싱으로 런타임 에러 방지.

### 2. articles.ts + articles/page.tsx — getAllTags 중복 파일 읽기 제거

- **출처**: Warning 3
- **무엇을**: `getAllTags()`가 내부에서 `getAllArticles()`를 호출하던 구조를 `getAllTags(articles: ArticleMeta[])` 파라미터 방식으로 변경. 호출부(`articles/page.tsx`)에서 이미 읽은 articles를 전달.
- **왜**: 빌드 시 MD 파일을 2번 읽는 비효율 제거. 글이 20개+ 될 때 빌드 시간 절약.

### 3. Warning 2 (dangerouslySetInnerHTML sanitize) — 건너뜀

- **출처**: Warning 2
- **이유**: MD 파일에 테이블 HTML이 포함되어 있어 `sanitize: true` 적용 시 테이블 렌더링 깨짐. 리스크가 낮은 상황(repo 관리 파일)에서 기능 손상을 감수할 이유 없음.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 타입 단언 (`as`) | 2곳 | 0곳 (`parseArticleMeta` 사용) |
| MD 파일 읽기 횟수 | 2회 (getAllArticles + getAllTags) | 1회 |
| frontmatter 필드 누락 대응 | TypeError 발생 | 기본값 할당 |

---

## 빌드 결과

성공 (1회, 21개 정적 페이지)
