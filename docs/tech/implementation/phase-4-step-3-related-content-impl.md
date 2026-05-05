# Phase 4 Step 3 — 아티클 하단 관련 콘텐츠 추천 Implementation

## 완료 조건 충족 여부
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

## 생성/수정 파일 목록

### 신규 생성
- `src/lib/related-content.ts` — 추천 로직 (관련 글 Jaccard, 체크리스트 역매칭, unified-tag 영상 매칭)
- `src/components/articles/RelatedArticles.tsx` — 관련 글 카드 3개 섹션 (ArticleCard 재사용)
- `src/components/articles/RelatedContent.tsx` — 관련 체크리스트 + 관련 영상 링크 리스트 카드

### 수정
- `src/components/articles/ArticleDetail.tsx` — `relatedArticles`/`relatedChecklists`/`relatedVideos` optional props 추가, 본문·TimelineCTA 다음에 두 섹션 렌더
- `src/app/articles/[slug]/page.tsx` — 3종 체크리스트 메타와 videos.json import, 추천 데이터 계산 후 ArticleDetail에 전달

## 주요 결정 사항

- **관련 글 카드는 ArticleCard 재사용** — 별도 컴팩트 카드를 만들지 않고 기존 ArticleCard를 그대로 세로 스택. 모바일 우선 단일 컬럼 레이아웃과 일관되며 GA4 `content_click` 이벤트도 자동으로 송출됨.
- **TimelineCTA는 유지, RelatedContent에서 타임라인 섹션 제외** — Plan UI 모형에는 "관련 타임라인"이 있지만 같은 의도의 TimelineCTA가 본문 하단에 이미 존재. 둘을 모두 두면 중복이 되어 RelatedContent에서는 체크리스트 + 영상만 다룬다.
- **체크리스트 메타는 page.tsx에서 직접 import** — `getAllChecklistMetas()` 헬퍼는 만들지 않음. `src/app/checklist/hospital-bag/page.tsx` 등 기존 페이지가 동일 방식이라 일관성 유지.
- **렌더 순서: TimelineCTA → RelatedContent → RelatedArticles** — 타임라인 안내(주차 액션 유도)를 먼저, 그다음 같은 주제의 체크리스트/영상, 마지막으로 더 읽을거리(글 카드). 사용자 행동 강도가 높은 것부터 위에 배치.
- **영상 정렬은 upload_date 내림차순** — Plan에는 정렬 기준이 명시되지 않았으나 최신 영상이 신뢰도가 높다는 판단으로 결정.

## 가정 사항

- Plan에서 명시한 가정을 그대로 유지: ArticleCard 재사용, TimelineCTA가 타임라인 담당, 체크리스트 메타 직접 import, unified-tag 매칭 후 카테고리에 속한 영상 최대 3개, 추천 결과가 빈 배열이면 섹션 자체 미렌더.
- 영상 링크는 `/info?tab=videos#<id>` 형태로 통합 정보 탭(Step 2 결과)으로 이동 — `ChecklistRelatedContent`와 동일 규칙 따름.

## 미구현 항목

- 추천 알고리즘 고도화 (사용자 행동/협업 필터링) — Out of Scope
- 추천 결과 캐싱 — 정적 빌드라 불필요, Out of Scope
- 관련 글 더보기 / 페이지네이션 — Out of Scope
- 관련 콘텐츠 클릭 GA 이벤트 — ArticleCard·VideoCardCompact 등 기존 컴포넌트에 이미 송출 로직이 있으나, 본 스킬에서 새로 만든 RelatedContent의 체크리스트/영상 링크에는 별도 GA 이벤트를 추가하지 않음 (Plan Out of Scope)
