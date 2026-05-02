# info-tab-integration Implementation

> Phase 4 Step 2 — 정보 탭 통합 (블로그 + 영상)
> Plan: [../plan/info-tab-integration-plan.md](../plan/info-tab-integration-plan.md)
> Date: 2026-05-01

---

## 완료 조건 충족 여부

| # | 조건 | 상태 | 비고 |
|---|------|------|------|
| 1 | `/info` 진입 시 블로그 + 영상 혼합 카드 리스트 표시 (블로그 그룹 → 영상 그룹) | ✅ 완료 | `InfoContainer` `visibleItems` 결합 순서로 처리 |
| 2 | 콘텐츠 타입 탭 (전체/블로그/영상) 전환 | ✅ 완료 | `activeTab` 상태로 분기 |
| 3 | 통합 태그 필터 동작 (동의어 흡수 매핑) | ✅ 완료 | `unified-tags.ts` 13종 정의 + 매칭 유틸 |
| 4 | `?tab=videos` 쿼리로 영상 탭 초기 선택 | ✅ 완료 | `useSearchParams` + `resolveInitialTab` |
| 5 | `/info?tab=videos#<id>` hash-scroll + 하이라이트 | ✅ 완료 | `useEffect` hash-scroll, `articles` 탭에선 비활성 |
| 6 | 블로그 카드 → `/articles/[slug]` (URL 유지) | ✅ 완료 | `ArticleCard` 그대로 재사용 |
| 7 | 영상 카드 → 유튜브 외부 링크 | ✅ 완료 | `VideoCard` 그대로 재사용 |
| 8 | `/articles` → `/info` 리다이렉트 | ✅ 완료 | `redirect("/info")` 정적 export |
| 9 | `/videos` → `/info?tab=videos` 리다이렉트 | ✅ 완료 | `redirect("/info?tab=videos")` |
| 10 | BottomNav 5탭 구성, "영상" 탭 제거 | ✅ 완료 (4탭으로 축소) | "영상" 제거, "정보" → `/info`. 체중/더보기 확장은 Phase 5 |
| 11 | `/info` SEO 메타(title, description, canonical, OG) 설정 | ✅ 완료 | `info/page.tsx` `metadata` |
| 12 | `lib/search.ts` 영상 URL → `/info?tab=videos#<id>` | ✅ 완료 | |
| 13 | 영상 sub-category·채널 보기 모드 노출되지 않음 | ✅ 완료 | `InfoContainer`에 미포함 (의도적) |
| 14 | `/articles/[slug]` 진입 시 "정보" 탭 활성화 | ✅ 완료 | `BottomNav` `alsoMatchPrefixes` |

---

## 생성/수정 파일 목록

### 신규 생성

- `src/lib/unified-tags.ts` — 통합 태그 13종 정의 + 동의어 흡수 매핑 + 매칭 유틸 (`articleMatchesUnifiedTag`, `videoMatchesUnifiedTag`, `getUsedUnifiedTags`)
- `src/types/info.ts` — `InfoItem` discriminated union + `InfoTab` 타입
- `src/components/info/InfoCard.tsx` — `ArticleCard`/`VideoCard` 분기 래핑 (재사용)
- `src/components/info/InfoContainer.tsx` — 탭 + 통합 태그 필터 + 혼합 리스트 + hash-scroll. `useSearchParams`로 초기 탭 결정
- `src/app/info/page.tsx` — `/info` 라우트 + 메타데이터 + `Suspense` 경계

### 수정

- `src/app/articles/page.tsx` — 목록 페이지를 `redirect("/info")`로 전환 (`/articles/[slug]`는 변경 없음)
- `src/app/videos/page.tsx` — `redirect("/info?tab=videos")`로 전환
- `src/components/layout/BottomNav.tsx` — "영상" 탭 제거, "정보" → `/info`, `alsoMatchPrefixes: ["/articles", "/videos"]`로 prefix 매칭 확장. 5→4탭 구조
- `src/lib/search.ts` — 영상 검색 결과 URL을 `/info?tab=videos#<id>`로 변경
- `src/components/home/HomeContent.tsx` — 대시보드 영상 카드 `href="/info?tab=videos"`, 정보 카드 `href="/info"`로 갱신 (리다이렉트 우회)
- `src/components/articles/ArticleDetail.tsx` — "목록으로" 링크 `/articles` → `/info`
- `src/components/timeline/RelatedVideosLink.tsx` — `/videos#<id>` → `/info?tab=videos#<id>`
- `src/components/checklist/ChecklistRelatedContent.tsx` — `/videos#<id>` → `/info?tab=videos#<id>`
- `src/app/sitemap.ts` — `/articles`, `/videos` 항목 제거하고 `/info` 단일 항목으로 통합

---

## 주요 결정 사항

- **내부 링크 일괄 갱신**: plan의 "수정 파일 목록"에는 내부 링크 컴포넌트가 빠져 있었으나, 리다이렉트만 두면 모든 내부 클릭이 `__next_error__` 페이지를 한 번 거쳐 깜빡거림 발생. 리다이렉트는 외부 진입(SEO·북마크)용으로만 두고, 내부 5개 컴포넌트(`HomeContent`, `ArticleDetail`, `RelatedVideosLink`, `ChecklistRelatedContent`, sitemap)에서 직접 `/info` 경로로 갱신
- **sitemap에서 `/articles`, `/videos` 제거**: `/info`로 통합되었고 두 URL은 리다이렉트 페이지이므로 사이트맵에서 빠짐. `/articles/[slug]`는 그대로 유지 (SEO 보호)
- **`Suspense` 경계 위치**: `useSearchParams`가 정적 export 환경에서 클라이언트에서만 평가되도록 `info/page.tsx`(서버 컴포넌트)에서 `<Suspense>`로 `InfoContainer`(`'use client'`)를 감쌈
- **BottomNav 5탭 → 4탭 축소**: plan.md Step 1-7은 5탭(`체중`, `더보기` 추가)을 그렸지만 현 시점에서 그 두 탭이 미구현. Step 2 범위에서는 "영상 제거"만 적용해 4탭(`홈/체크리스트/베이비페어/정보`)으로 축소. 5탭 확장은 Phase 5 이월
- **`alsoMatchPrefixes` 도입**: `/articles/[slug]` 페이지 진입 시 "정보" 탭이 활성화되어야 하는데, `/info` prefix 단독 매칭으로는 불가능. `NavItem` 타입에 보조 prefix 배열 추가
- **활성 탭에서만 hash-scroll**: 블로그 탭에서는 영상 hash가 의미 없으므로 `articles` 탭 활성 시 hash-scroll 효과를 발동하지 않음
- **태그 칩 정렬**: `getUsedUnifiedTags`는 `UNIFIED_TAGS` 배열 순서를 보존하여 노출되므로 운영자가 `unified-tags.ts`에서 표시 순서를 제어할 수 있음 (사전순 정렬 X)
- **영상 그리드 vs 단일 컬럼**: "영상" 탭에서만 grid 레이아웃, "전체"/"블로그"는 single column. 블로그-영상 카드 비주얼 차이가 커서 single column이 안정적. 영상 전용 탭에서는 기존 `/videos` 그리드와 동등한 UX 유지

---

## 가정 사항

- 정렬: 블로그=`date` 최신순 / 영상=`videos.json` 등장 순. 혼합은 "블로그 그룹 → 영상 그룹"
- 채널 보기 모드와 영상 sub-category 필터는 `/info`에서 의도적으로 제외 (Phase 5 채널 디렉토리로 부활 예정)
- 블로그 front matter `tags`는 변경하지 않음 — `unified-tags.ts`의 동의어 흡수 매핑으로 런타임 처리. 일괄 마이그레이션은 Phase 5
- 정적 export에서 `redirect()`는 `NEXT_REDIRECT` 디지스트를 포함한 `__next_error__` HTML로 빌드되어, JS 하이드레이션 후 클라이언트 라우터가 실제 이동을 수행 (기존 `/guides/*` 패턴과 동일)
- `?tab=videos` 쿼리는 클라이언트 라우터가 이동 시 그대로 보존됨 (검증: 빌드 산출물의 `NEXT_REDIRECT;replace;/info?tab=videos;307`)
- `/videos#<id>` 외부 북마크의 hash 보존은 클라이언트 리다이렉트 시 브라우저 동작에 위임 — 내부 검색·내부 링크는 `/info?tab=videos#<id>`로 직접 이동하도록 갱신했으므로 영향 미미

---

## 미구현 항목

- 영상 데이터 `registered_date` 백필 + 엄격한 시간축 통합 정렬 (Phase 5)
- 채널 디렉토리 (`/info/channels` 또는 `/channels`) (Phase 5)
- 통합 태그 2단계 계층 필터 (옵션 B, Phase 5)
- 큐레이션 컬렉션 카드 (옵션 D, Phase 5)
- 블로그 front matter 태그 일괄 마이그레이션 (Phase 5)
- BottomNav 5탭 확장 (체중·더보기 추가, Phase 5)
- 영상 sub-category 진입점 부활 (Phase 5)
