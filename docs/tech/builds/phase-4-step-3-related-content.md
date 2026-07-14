# phase-4-step-3-related-content

> 상태: 구현✅ 리뷰✅ 리팩토링· | 최종 갱신 —

<!-- STEP:impl -->
## 구현

### 완료 조건 충족 여부
| 조건 | 상태 | 비고 |
|------|------|------|
| 아티클 상세 하단에 관련 글 카드 최대 3개 표시 | ✅ 완료 | `RelatedArticles` 섹션 |
| 태그 Jaccard score > 0 우선, 부족 시 최신 글 fallback으로 3개 채움 | ✅ 완료 | `getRelatedArticles` 정렬: score desc → date desc |
| 현재 글은 추천 목록에서 제외 | ✅ 완료 | `slug !== current.slug` 필터 |
| 체크리스트 `linked_article_slugs` 역매칭으로 관련 체크리스트 표시 | ✅ 완료 | `getRelatedChecklists` |
| 관련 타임라인 링크 표시 | ✅ 완료 | 기존 `TimelineCTA`가 담당 (구조 유지) |
| unified-tag 매칭으로 관련 영상 최대 3개 표시 | ✅ 완료 | `getRelatedVideos`, upload_date 내림차순 |
| 빈 상태(전체 아티클 1개) 에러 없이 처리 | ✅ 완료 | `articles.length === 0` early return |
| 카드/링크 클릭 시 정상 이동 | ✅ 완료 | 빌드 시 generateStaticParams로 8개 아티클 페이지 정적 생성 확인 |

### 생성/수정 파일 목록

#### 신규 생성
- `src/lib/related-content.ts` — 추천 로직 (관련 글 Jaccard, 체크리스트 역매칭, unified-tag 영상 매칭)
- `src/components/articles/RelatedArticles.tsx` — 관련 글 카드 3개 섹션 (ArticleCard 재사용)
- `src/components/articles/RelatedContent.tsx` — 관련 체크리스트 + 관련 영상 링크 리스트 카드

#### 수정
- `src/components/articles/ArticleDetail.tsx` — `relatedArticles`/`relatedChecklists`/`relatedVideos` optional props 추가, 본문·TimelineCTA 다음에 두 섹션 렌더
- `src/app/articles/[slug]/page.tsx` — 3종 체크리스트 메타와 videos.json import, 추천 데이터 계산 후 ArticleDetail에 전달

### 주요 결정 사항

- **관련 글 카드는 ArticleCard 재사용** — 별도 컴팩트 카드를 만들지 않고 기존 ArticleCard를 그대로 세로 스택. 모바일 우선 단일 컬럼 레이아웃과 일관되며 GA4 `content_click` 이벤트도 자동으로 송출됨.
- **TimelineCTA는 유지, RelatedContent에서 타임라인 섹션 제외** — Plan UI 모형에는 "관련 타임라인"이 있지만 같은 의도의 TimelineCTA가 본문 하단에 이미 존재. 둘을 모두 두면 중복이 되어 RelatedContent에서는 체크리스트 + 영상만 다룬다.
- **체크리스트 메타는 page.tsx에서 직접 import** — `getAllChecklistMetas()` 헬퍼는 만들지 않음. `src/app/checklist/hospital-bag/page.tsx` 등 기존 페이지가 동일 방식이라 일관성 유지.
- **렌더 순서: TimelineCTA → RelatedContent → RelatedArticles** — 타임라인 안내(주차 액션 유도)를 먼저, 그다음 같은 주제의 체크리스트/영상, 마지막으로 더 읽을거리(글 카드). 사용자 행동 강도가 높은 것부터 위에 배치.
- **영상 정렬은 upload_date 내림차순** — Plan에는 정렬 기준이 명시되지 않았으나 최신 영상이 신뢰도가 높다는 판단으로 결정.

### 가정 사항

- Plan에서 명시한 가정을 그대로 유지: ArticleCard 재사용, TimelineCTA가 타임라인 담당, 체크리스트 메타 직접 import, unified-tag 매칭 후 카테고리에 속한 영상 최대 3개, 추천 결과가 빈 배열이면 섹션 자체 미렌더.
- 영상 링크는 `/info?tab=videos#<id>` 형태로 통합 정보 탭(Step 2 결과)으로 이동 — `ChecklistRelatedContent`와 동일 규칙 따름.

### 미구현 항목

- 추천 알고리즘 고도화 (사용자 행동/협업 필터링) — Out of Scope
- 추천 결과 캐싱 — 정적 빌드라 불필요, Out of Scope
- 관련 글 더보기 / 페이지네이션 — Out of Scope
- 관련 콘텐츠 클릭 GA 이벤트 — ArticleCard·VideoCardCompact 등 기존 컴포넌트에 이미 송출 로직이 있으나, 본 스킬에서 새로 만든 RelatedContent의 체크리스트/영상 링크에는 별도 GA 이벤트를 추가하지 않음 (Plan Out of Scope)

---

<!-- STEP:review -->
## 코드 리뷰

### 리뷰 대상 파일
- `src/lib/related-content.ts`
- `src/components/articles/RelatedArticles.tsx`
- `src/components/articles/RelatedContent.tsx`
- `src/components/articles/ArticleDetail.tsx`
- `src/app/articles/[slug]/page.tsx`

---

### Critical 이슈 (즉시 수정 완료)

없음.

---

### Warning (수정 권장)

없음.

---

### Suggestion (개선 아이디어)

#### 1. `src/app/articles/[slug]/page.tsx` — `getAllArticles()` 빌드 시 중복 호출
- **위치**: `src/app/articles/[slug]/page.tsx:25, 106`
- **내용**: `generateStaticParams`와 `ArticlePage` 양쪽에서 `getAllArticles()`를 호출한다. 8개 아티클 정적 빌드 시 9회 호출 → 매 호출마다 디렉토리 전체 읽기·gray-matter 파싱이 일어난다.
- **현 시점 영향**: 콘텐츠가 8개라 빌드 시간 영향이 미미해 Critical/Warning 수준은 아님. 콘텐츠가 수십~수백 개로 늘어나면 모듈 레벨 캐시 또는 React `cache()` 도입을 고려할 만함.
- **제안**: 향후 콘텐츠 증가 시 `lib/articles.ts`에 한 번 읽고 캐싱하는 헬퍼 추가.

#### 2. `src/lib/related-content.ts` — Jaccard 계산 시 중복 순회
- **위치**: `src/lib/related-content.ts:13-25`
- **내용**: 각 아티클마다 `intersect = filter(...).length` 후 `union = new Set([...]).size`로 두 번 순회. 8개 글 기준 무시할 수준이지만 한 번의 순회로 둘 다 계산 가능.
- **제안**: 확장 시 `for (const tag of a.tags)` 단일 패스로 intersect/union 카운트 → tag 집합 크기 변화에 강한 구현.

#### 3. `src/components/articles/RelatedContent.tsx` — 클릭 시 GA 이벤트 미전송
- **위치**: `src/components/articles/RelatedContent.tsx` 전체
- **내용**: 체크리스트 / 영상 링크 클릭이 `content_click` GA 이벤트를 송출하지 않음. `ArticleCard.tsx`·`VideoCardCompact.tsx`는 `onClick`에 `sendGAEvent`를 붙여 둠.
- **현 시점 판단**: Plan에서 명시적으로 Out of Scope. RelatedArticles는 `ArticleCard` 재사용으로 자연스럽게 GA가 붙음.
- **제안**: 추후 회유 효과 측정이 필요할 때 RelatedContent 내부 링크에도 동일 패턴 적용. 추적 강도를 높이려면 `placement: "article-related"` 같은 메타도 함께 보내면 회유 위치별 분석 가능.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견 |
| Warning | 0건 |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 수정 없음) |

#### 리뷰 코멘트

- `dangerouslySetInnerHTML`은 `ArticleDetail.tsx`와 `page.tsx`의 JSON-LD 두 곳에서 사용되지만, 본문은 `rehype-sanitize`를 통과한 결과이고 JSON-LD는 직접 구성한 정적 객체의 직렬화이므로 XSS 위험은 없다.
- `videos as VideoItem[]`, `(hospitalBag as ChecklistData)` 형태의 타입 단언은 JSON 모듈 import에 한정해 기존 페이지(`src/app/checklist/hospital-bag/page.tsx` 등)와 동일한 관용을 따른다. 신규 도입이 아니다.
- `RelatedContent`는 `ChecklistRelatedContent`의 패턴(타임라인/영상 hash 링크는 `<a>`)을 그대로 이어받아 Next.js 16 App Router의 hash 누적 버그를 회피한다.
- `getRelatedArticles`는 score 동률 시 최신 글 우선이라 fallback 단계가 자연스럽게 최신 글 보충 역할을 한다. 정렬 비교에서 `Date(...).getTime()`을 매 비교마다 호출하지만 8개 글 기준 무시 수준.
