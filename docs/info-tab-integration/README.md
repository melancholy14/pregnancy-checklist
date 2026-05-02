# Info Tab Integration (Phase 4 Step 2)

> 작성일: 2026-05-01 | 작성자: Claude Code
> 상위 계획: [../phase-4/plan.md](../phase-4/plan.md)
> Plan: [../plan/info-tab-integration-plan.md](../plan/info-tab-integration-plan.md)

## 개요

블로그(`/articles`)와 영상(`/videos`) 두 별도 탭을 `/info` 통합 허브 한 곳으로 합쳐
콘텐츠 깊이 인식과 탐색 시너지를 확보. 통합 태그(블로그 태그 ↔ 영상 카테고리 매핑)
기반 단일층 필터로 두 매체의 관련 콘텐츠를 한 화면에서 노출하고, 기존
`/articles/[slug]` URL은 SEO 보호를 위해 유지. 채널 보기 모드와 영상 sub-category는
의도적으로 제외 (Phase 5 채널 디렉토리로 부활 예정).

> **2026-05-02 갱신**: 영상에 `upload_date`(+`is_short`) 백필이 들어와
> 블로그 `date` ↔ 영상 `upload_date` 단일 시간축 최신순 정렬로 전환.
> Phase 5 이월 예정이었던 "영상 등록일 백필" 항목을 Phase 4에서 조기 해소.

---

## 구현 내용

### 완료 조건 충족 여부

| # | 조건 | 상태 |
|---|------|------|
| 1 | `/info` 진입 시 블로그 + 영상 혼합 카드 리스트 (단일 시간축 최신순) | ✅ |
| 2 | 콘텐츠 타입 탭 (전체/블로그/영상) 전환 | ✅ |
| 3 | 통합 태그 필터 (동의어 흡수 매핑) | ✅ |
| 4 | `?tab=videos` 쿼리로 영상 탭 초기 선택 | ✅ |
| 5 | `/info?tab=videos#<id>` hash-scroll + 하이라이트 | ✅ |
| 6 | 블로그 카드 → `/articles/[slug]` (URL 유지) | ✅ |
| 7 | 영상 카드 → 유튜브 외부 링크 | ✅ |
| 8 | `/articles` → `/info` 리다이렉트 | ✅ |
| 9 | `/videos` → `/info?tab=videos` 리다이렉트 | ✅ |
| 10 | BottomNav "영상" 탭 제거, "정보" → `/info` (4탭 구성) | ✅ |
| 11 | `/info` SEO 메타 (title/description/canonical/OG) | ✅ |
| 12 | `lib/search.ts` 영상 URL → `/info?tab=videos#<id>` | ✅ |
| 13 | 영상 sub-category·채널 보기 모드는 `/info`에 노출되지 않음 | ✅ |
| 14 | `/articles/[slug]` 진입 시 BottomNav "정보" 탭 활성화 | ✅ |

### 생성/수정 파일

**신규 (6)**

- `src/lib/unified-tags.ts` — 통합 태그 13종 + 동의어 흡수 매핑 + 매칭 유틸
- `src/types/info.ts` — `InfoItem` discriminated union + `InfoTab`
- `src/components/info/InfoCard.tsx` — `ArticleCard`/`VideoCardCompact` 분기 래핑
- `src/components/info/InfoContainer.tsx` — 탭 + 통합 태그 필터 + 혼합 리스트 + hash-scroll
- `src/components/videos/VideoCardCompact.tsx` — 채널 카드 패턴 가로형 컴팩트 영상 카드
- `src/app/info/page.tsx` — `/info` 라우트 + 메타데이터 + Suspense

**수정 (9)**

- `src/app/articles/page.tsx` — `redirect("/info")`
- `src/app/videos/page.tsx` — `redirect("/info?tab=videos")`
- `src/components/layout/BottomNav.tsx` — "영상" 탭 제거, `alsoMatchPrefixes` 추가
- `src/lib/search.ts` — 영상 URL → `/info?tab=videos#<id>`
- `src/components/home/HomeContent.tsx` — 대시보드 카드 href 갱신 (리다이렉트 우회)
- `src/components/articles/ArticleDetail.tsx` — "목록으로" → `/info`
- `src/components/timeline/RelatedVideosLink.tsx` — `/info?tab=videos#<id>`
- `src/components/checklist/ChecklistRelatedContent.tsx` — `/info?tab=videos#<id>`
- `src/app/sitemap.ts` — `/articles`·`/videos` 제거하고 `/info` 단일 항목

### 주요 결정 사항

- **내부 링크 일괄 갱신**: 리다이렉트는 외부 진입(SEO·북마크) 전용. 내부 클릭은 5개 컴포넌트 + sitemap에서 직접 `/info` 경로로 갱신해 깜빡임 제거
- **`Suspense` 경계**: `useSearchParams`가 정적 export 환경에서 클라이언트에서만 평가되도록 `info/page.tsx`(서버)에서 `<Suspense>`로 `InfoContainer`(클라) 감쌈
- **BottomNav 5탭 → 4탭 축소**: plan.md의 5탭 구상은 체중·더보기 추가가 전제. Step 2 범위에서는 "영상 제거"만 적용해 4탭(`홈/체크리스트/베이비페어/정보`). 5탭 확장은 Phase 5 이월
- **`alsoMatchPrefixes` 도입**: `/articles/[slug]` 진입 시 "정보" 탭 활성화를 위해 `/info`·`/articles/`·`/videos` prefix를 OR 매칭
- **컴팩트 영상 카드**: 기존 `VideoCard`(aspect-video 풀폭)는 단일 컬럼 리스트에서 너무 큼. 채널 카드 디자인을 응용해 가로형 카드(`w-28` 썸네일)로 신규 컴포넌트 추가
- **모든 탭 단일 컬럼**: 블로그-영상 비주얼 차이가 커서 그리드 분기 대신 `space-y-3` 단일 컬럼 통일

### 가정 사항 및 미구현 항목

**가정 사항**

- 정렬: 블로그 `date`(YYYY-MM-DD) ↔ 영상 `upload_date`(YYYY-MM-DD) 단일 시간축 최신순 (사전식 비교)
- 채널 보기·sub-category는 `/info`에서 의도적으로 제외 (Phase 5 부활)
- 블로그 front matter `tags`는 변경하지 않음 — 런타임 동의어 매핑으로 처리
- `redirect()`는 정적 export에서 `NEXT_REDIRECT` 디지스트로 빌드되어 JS 하이드레이션 후 클라이언트 라우터가 이동 처리

**Phase 4에서 조기 해소된 이월 예정 항목**

- 영상 데이터 `upload_date` 백필(57건) + `VideoItem` 타입 확장 + 단일 시간축 최신순 정렬 — 운영자 백필로 2026-05-02 즉시 적용

**미구현 항목 (Phase 5 이월)**

- 채널 디렉토리 (`/info/channels` 또는 `/channels`)
- 통합 태그 2단계 계층 필터 (옵션 B)
- 큐레이션 컬렉션 카드 (옵션 D)
- 블로그 front matter 태그 일괄 마이그레이션
- BottomNav 5탭 확장 (체중·더보기)
- 영상 sub-category 진입점 부활

---

## 코드 리뷰 결과

### Critical 이슈

없음. 런타임 위험·보안 결함·크래시 유발 코드 미발견.

### Warning (수정 권장)

| # | 위치 | 문제 | 처리 |
|---|------|------|------|
| 1 | `InfoContainer.tsx:94-112` (hash-scroll useEffect) | 의존성 `[activeTab, visibleItems]`로 인해 필터 변경 시마다 재실행 — ring 하이라이트 깜빡임 가능 | ✅ 리팩토링 완료 |
| 2 | `InfoContainer.tsx:125-198` (탭 ARIA) | `role="tab"`만 있고 `aria-controls`/`tabpanel` 누락 — 반쪽 ARIA 패턴 | ✅ 리팩토링 완료 |
| 3 | `InfoContainer.tsx:42-49` (searchParams useEffect) | useState 초기화와 표면상 중복 | ⏸ 보류 — 브라우저 뒤로가기 동기화에 필요해 제거 시 회귀 발생 |
| 4 | `info/page.tsx:28-29` (JSON `as` 단언) | `VideoCategory` union이 실데이터 7종과 어긋남 | ⏸ 보류 — 범위 밖 (`types/video.ts` 수정 필요, Phase 5) |

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 4건 (2건 수정 / 2건 보류) |
| Suggestion | 3건 |

상세: [review/info-tab-integration-review.md](../review/info-tab-integration-review.md)

---

## 리팩토링 내용

### 작업 목록

1. **hash-scroll useEffect 의존성 축소 + 처리 후 hash 제거** — 의존성을 `[activeTab]`로 줄이고, 스크롤 적용 직후 `window.history.replaceState`로 hash 제거. 같은 탭 내 필터링에서 재진입 차단
2. **ARIA 탭 패턴 완성** — 각 탭 버튼에 `id`/`aria-controls="info-panel"`, 콘텐츠 영역에 `role="tabpanel"`/`aria-labelledby` 부여

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 15개 | 15개 (`InfoContainer.tsx` 1건 수정) |
| InfoContainer 줄 수 | 204줄 | 213줄 |
| hash-scroll 트리거 | 탭/필터 변경 시마다 | 탭 변경 시 1회 + hash 자동 제거 |
| ARIA 탭 패턴 완성도 | 절반 (`role="tab"`만) | 완전 (`controls`·`tabpanel`·`labelledby`) |

상세: [refactor/info-tab-integration-refactor.md](../refactor/info-tab-integration-refactor.md)

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 6개 passed |
| 리다이렉트 | ✅ 2개 passed |
| Error/Validation | ✅ 3개 passed |
| 내부 링크 갱신 | ✅ 2개 passed |
| 반응형 (Mobile 375px) | ✅ 2개 passed |
| **전체** | **15 passed / 0 failed** (16.7s) |

테스트 파일: [e2e/info-tab-integration.spec.ts](../../e2e/info-tab-integration.spec.ts)
📊 상세 리포트: `playwright-report/index.html`

---

## 누락된 문서

없음.
