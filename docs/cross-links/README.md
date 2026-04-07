# Phase 2.5 Step 5: 타임라인 ↔ 블로그 크로스 링크

## 개요

타임라인 주차별 카드와 블로그 아티클 간 양방향 크로스 링크를 구현하여 콘텐츠 간 탐색성을 높인다.

- **타임라인 → 블로그**: 각 주차 카드 하단에 "관련 글" 링크 표시
- **블로그 → 타임라인**: 각 아티클 하단에 "타임라인에서 체크하기" CTA 표시

---

## 구현 내역

### 1. 데이터 구조 변경

| 파일 | 변경 |
|------|------|
| `src/types/timeline.ts` | `linked_article_slugs?: string[]` 추가 |
| `src/types/article.ts` | `linked_timeline_weeks?: number[]` 추가 |
| `src/data/timeline_items.json` | 11개 주차에 `linked_article_slugs` 필드 추가 |
| `src/content/articles/*.md` | 8개 아티클 frontmatter에 `linked_timeline_weeks` 추가 |
| `src/lib/articles.ts` | `parseArticleMeta`에서 `linked_timeline_weeks` 파싱 |

### 2. 매핑 테이블

| 타임라인 주차 | 연결 블로그 slug | 연결 이유 |
|-------------|-----------------|----------|
| Week 4, 8, 10 | `early-pregnancy-tests` | 초기 검사 관련 |
| Week 12 | `postpartum-care` | 산후조리원 예약 시점 |
| Week 18 | `baby-items-cost` | 베이비페어/쇼핑 시점 |
| Week 28 | `infant-vaccination-schedule` | 백일해 접종 + 출산 후 예방접종 안내 |
| Week 30 | `newborn-bath-tips` | 신생아 준비 시점 |
| Week 32, 36 | `hospital-bag` | 입원 가방 준비 |
| Week 37 | `postpartum-diet` | 출산 직전 산후 식단 미리 파악 |
| Week 6, 24 | `pregnancy-weight-management` | 체중 관리 관련 |

### 3. 신규 컴포넌트

| 컴포넌트 | 경로 | 역할 |
|----------|------|------|
| `RelatedArticlesLink` | `src/components/timeline/RelatedArticlesLink.tsx` | 타임라인 카드 하단 관련 글 링크 |
| `TimelineCTA` | `src/components/articles/TimelineCTA.tsx` | 아티클 하단 타임라인 연결 CTA |

### 4. 기존 컴포넌트 수정

| 컴포넌트 | 변경 |
|----------|------|
| `TimelineAccordionCard` | `relatedArticles` prop 추가, `RelatedArticlesLink` 렌더링 |
| `TimelineContainer` | `articles` prop 추가, `articleMap` 생성 후 카드별 관련 아티클 전달 |
| `ArticleDetail` | `TimelineCTA` 조건부 렌더링 추가 |
| Timeline page (`src/app/timeline/page.tsx`) | `getAllArticles()` 호출 후 `articles` prop 전달 |

---

## 코드 리뷰 결과

| 등급 | 건수 | 내용 |
|------|------|------|
| Critical | 0 | - |
| Warning | 1 | `getArticlesBySlugs` 미사용 export → 리팩토링에서 제거 완료 |

---

## 리팩토링

- `src/lib/articles.ts`에서 미사용 `getArticlesBySlugs` 함수 제거

---

## E2E 테스트

**파일**: `e2e/cross-links.spec.ts` (10개 테스트)

### 타임라인 → 블로그 (4건)
- linked_article_slugs가 있는 카드에 관련 글 링크 표시
- 관련 글 링크 클릭 시 아티클 페이지 이동
- 매핑 없는 카드에는 관련 글 영역 비노출
- 4주차 카드에 임신 초기 필수 검사 관련 글 표시

### 블로그 → 타임라인 (4건)
- 아티클 하단에 타임라인 CTA 표시
- CTA 링크 클릭 시 타임라인 페이지 이동
- 매핑 없는 아티클에는 CTA 비노출
- 복수 주차 매핑 정상 표시 (4, 8, 10주차)

### 반응형 Mobile 375px (2건)
- 모바일 타임라인 관련 글 링크 렌더링
- 모바일 아티클 타임라인 CTA 렌더링

### 테스트 실행 결과
```
10 passed (5.4s)
```

---

## 수정된 파일 목록

```
src/types/timeline.ts
src/types/article.ts
src/data/timeline_items.json
src/lib/articles.ts
src/content/articles/early-pregnancy-tests.md
src/content/articles/hospital-bag.md
src/content/articles/postpartum-care.md
src/content/articles/baby-items-cost.md
src/content/articles/infant-vaccination-schedule.md
src/content/articles/newborn-bath-tips.md
src/content/articles/postpartum-diet.md
src/content/articles/pregnancy-weight-management.md
src/components/timeline/RelatedArticlesLink.tsx      (신규)
src/components/articles/TimelineCTA.tsx               (신규)
src/components/timeline/TimelineAccordionCard.tsx
src/components/timeline/TimelineContainer.tsx
src/components/articles/ArticleDetail.tsx
src/app/timeline/page.tsx
e2e/cross-links.spec.ts                              (신규)
```
