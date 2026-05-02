# Phase 4 Step 3 — 아티클 하단 관련 콘텐츠 추천

> 작성일: 2026-05-02 | 작성자: Claude Code

## 개요
아티클 상세 페이지(`/articles/[slug]`) 하단에 **관련 글 카드(최대 3개) · 관련 체크리스트 · 관련 영상**을 자동 노출하는 회유 장치다. 글을 다 읽은 사용자가 이탈하지 않고 다른 콘텐츠로 이동하도록 유도해 페이지뷰와 AdSense 수익을 끌어올린다. 추천은 태그 기반 정적 매칭(Jaccard 유사도)을 쓰고, 관련 타임라인은 기존 `TimelineCTA`가 이미 담당하므로 그대로 유지한다.

---

## 구현 내용

### 완료 조건 충족 여부
| 조건 | 상태 | 비고 |
|------|------|------|
| 아티클 상세 하단에 관련 글 카드 최대 3개 표시 | ✅ 완료 | `RelatedArticles` 섹션 |
| 태그 Jaccard score > 0 우선, 부족 시 최신 글 fallback으로 3개 채움 | ✅ 완료 | `getRelatedArticles` 정렬: score desc → date desc |
| 현재 글은 추천 목록에서 제외 | ✅ 완료 | `slug !== current.slug` 필터 |
| 체크리스트 `linked_article_slugs` 역매칭으로 관련 체크리스트 표시 | ✅ 완료 | `getRelatedChecklists` |
| 관련 타임라인 링크 표시 | ✅ 완료 | 기존 `TimelineCTA`가 담당 (구조 유지) |
| unified-tag 매칭으로 관련 영상 최대 3개 표시 | ✅ 완료 | `getRelatedVideos`, upload_date 내림차순 |
| 빈 상태(전체 아티클 1개) 에러 없이 처리 | ✅ 완료 | 빈 배열이면 섹션 자체 미렌더 |
| 카드/링크 클릭 시 정상 이동 | ✅ 완료 | 8개 아티클 페이지 정적 생성 + E2E 검증 |

### 생성/수정 파일
**신규 생성**
- `src/lib/related-content.ts` — 추천 로직 (Jaccard, 체크리스트 역매칭, unified-tag 영상 매칭)
- `src/components/articles/RelatedArticles.tsx` — 관련 글 카드 3개 섹션 (ArticleCard 재사용)
- `src/components/articles/RelatedContent.tsx` — 관련 체크리스트 + 관련 영상 링크 카드

**수정**
- `src/components/articles/ArticleDetail.tsx` — optional props 3개 추가, 본문 / TimelineCTA 다음에 두 섹션 렌더
- `src/app/articles/[slug]/page.tsx` — 3종 체크리스트 메타와 videos.json import, 추천 데이터 계산 후 ArticleDetail에 전달

### 주요 결정 사항
- **관련 글 카드는 ArticleCard 재사용** — 별도 컴팩트 카드 미작성. 모바일 단일 컬럼 레이아웃과 일관, GA4 `content_click` 이벤트 자동 송출.
- **TimelineCTA 유지, RelatedContent에서 타임라인 섹션 제외** — Plan UI 모형의 "관련 타임라인" 의도는 기존 TimelineCTA가 충족. 둘을 모두 두면 중복.
- **체크리스트 메타는 page.tsx에서 직접 import** — `getAllChecklistMetas()` 헬퍼 미생성. 기존 `src/app/checklist/hospital-bag/page.tsx` 패턴과 일관.
- **렌더 순서: TimelineCTA → RelatedContent → RelatedArticles** — 행동 강도가 높은 것(타임라인 액션)부터 위에 배치.
- **영상 정렬은 upload_date 내림차순** — 최신 영상이 신뢰도가 높다는 판단.

### 가정 사항 및 미구현 항목
**가정 사항**
- 영상 링크는 `/info?tab=videos#<id>` 형태로 통합 정보 탭(Step 2 결과)으로 이동
- 추천 결과가 빈 배열이면 섹션 자체 미렌더

**미구현 (Out of Scope)**
- 추천 알고리즘 고도화 (사용자 행동/협업 필터링)
- 추천 결과 캐싱 (정적 빌드라 불필요)
- 관련 글 더보기 / 페이지네이션
- RelatedContent 내부 링크의 GA 이벤트

---

## 코드 리뷰 결과

### Critical 이슈
없음.

### Warning
없음.

### Suggestion (3건)
1. `getAllArticles()` 빌드 시 중복 호출 — 콘텐츠가 수십 개로 늘어나면 모듈 캐시 또는 React `cache()` 도입 고려.
2. `related-content.ts`의 Jaccard 계산 시 intersect/union 두 번 순회 → 단일 패스로 최적화 가능 (현 데이터량에선 무시 수준).
3. `RelatedContent` 내부 체크리스트/영상 링크에 `content_click` GA 이벤트 미송출 — 회유 효과 측정이 필요해지면 추가.

### 전체 요약
| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 0건 |
| Suggestion | 3건 |

추가 확인 사항: `dangerouslySetInnerHTML`은 `rehype-sanitize` 통과 후 사용되어 XSS 안전. JSON 모듈 `as` 단언은 기존 페이지와 동일 관용. hash 링크 `<a>` 사용은 Next.js 16 App Router의 hash 누적 버그 회피.

---

## 리팩토링 내용

### 작업 목록
없음 — Warning 0건, 추가 판단 결과 모든 파일이 150줄 이하·중복 로직 없음·상태 로직 없음·메모이제이션 남용 없음. `RelatedContent.tsx`와 기존 `ChecklistRelatedContent.tsx`의 구조 유사성은 추출 시 범위 밖 파일 동시 수정이 필요해 본 단계에서 제외.

### 변경 전/후 구조
변경 없음.

---

## E2E 테스트 결과

테스트 파일: `e2e/phase-4-step-3-related-content.spec.ts`

| 시나리오 | 결과 |
|----------|------|
| Happy Path (5개) | ✅ 5 passed |
| Error/Validation (3개) | ✅ 3 passed |
| 권한/인증 (1개) | ⏭️ 1 skipped (정적 공개 사이트라 인증 분기 없음) |
| 반응형 Mobile 375px (2개) | ✅ 2 passed |
| **전체** | **10 passed / 1 skipped / 0 failed (6.4s)** |

📊 상세 리포트: `playwright-report/index.html`

---

## 누락된 문서
- `docs/refactor/phase-4-step-3-related-content-refactor.md` — 리팩토링 작업 자체가 0건이라 작성하지 않음.
