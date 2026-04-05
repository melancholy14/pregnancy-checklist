# Phase 2: 콘텐츠 강화 + AdSense 승인

> 작성일: 2026-04-04 | 작성자: Claude Code

## 개요

AdSense 승인률을 높이기 위한 콘텐츠 볼륨과 깊이 확보. MD 파일 기반 정보글 시스템(SSG)을 구축하고, YouTube 영상/채널을 세부 카테고리로 세분화했다. 네비게이션과 홈 대시보드에 정보글 진입점을 추가하여 사용자 탐색 경로를 확보했다.

---

## 구현 내용

### 완료 조건 충족 여부

| # | 조건 | 상태 | 비고 |
|---|------|------|------|
| 1 | `/articles` 목록 페이지에 글 5개+ 표시 | ✅ 완료 | 5개 (hospital-bag, weekly-prep, early-pregnancy-tests, postpartum-care, baby-items-cost) |
| 2 | `/articles/[slug]` 상세 페이지 정상 렌더링 | ✅ 완료 | generateStaticParams로 SSG |
| 3 | 태그 필터 동작 | ✅ 완료 | TagFilter 컴포넌트, 클라이언트 필터링 |
| 4 | 각 정보글 1,000자+ 콘텐츠 | ✅ 완료 | 모두 1,000자 이상 |
| 5 | `/guides/*` → `/articles/*` 리다이렉트 | ✅ 완료 | Next.js redirect() |
| 6 | 네비게이션에 "정보" 탭 노출 | ✅ 완료 | 체중→정보 교체 (FileText 아이콘) |
| 7 | 홈 대시보드에 정보글 진입점 | ✅ 완료 | Feature Grid에 "정보" 카드 추가 |
| 8 | `videos.json`에 subcategory 필드 | ✅ 완료 | 15개 영상, subcategory/subcategoryName/channel_id |
| 9 | `channels.json` 생성 + 채널 썸네일 | ✅ 완료 | 7개 채널, yt3.ggpht.com 썸네일 |
| 10 | 영상 페이지 세부 카테고리 필터 | ✅ 완료 | 2단 필터 (카테고리 + 세부 카테고리) |
| 11 | 영상 페이지 채널 뷰 전환 | ✅ 완료 | 영상/채널 토글 버튼 |
| 12 | sitemap에 정보글 URL 포함 | ✅ 완료 | getAllArticles()로 자동 생성 |
| 13 | 빌드 성공 | ✅ 완료 | 21개 정적 페이지 (기존 15 → 21) |
| 14 | E2E 테스트 통과 | ✅ 완료 | 150개 전부 통과 |
| 15 | Lighthouse SEO 90+ | ⏳ 미완료 | 배포 후 확인 |

### 생성/수정 파일

**신규 (16개)**

- `src/types/article.ts` — ArticleMeta, Article 타입 정의
- `src/lib/articles.ts` — gray-matter + remark MD 파싱 유틸리티
- `src/content/articles/hospital-bag.md` — 기존 가이드 MD 변환
- `src/content/articles/weekly-prep.md` — 기존 가이드 MD 변환
- `src/content/articles/early-pregnancy-tests.md` — 신규 정보글
- `src/content/articles/postpartum-care.md` — 신규 정보글
- `src/content/articles/baby-items-cost.md` — 신규 정보글
- `src/app/articles/page.tsx` — 정보글 목록 페이지 (SSG)
- `src/app/articles/[slug]/page.tsx` — 정보글 상세 페이지 (SSG)
- `src/components/articles/ArticlesContainer.tsx` — 목록 클라이언트 컴포넌트
- `src/components/articles/ArticleCard.tsx` — 글 카드 컴포넌트
- `src/components/articles/ArticleDetail.tsx` — 상세 뷰 컴포넌트
- `src/components/articles/TagFilter.tsx` — 태그 필터 칩
- `src/data/channels.json` — YouTube 채널 7개 데이터
- `src/components/videos/ChannelCard.tsx` — 채널 카드 컴포넌트
- `e2e/content-enhancement.spec.ts` — E2E 테스트 37개

**수정 (8개 + 기존 테스트 4개)**

- `src/types/video.ts` — VideoCategory, subcategory/channel_id, ChannelItem 추가
- `src/data/videos.json` — 9개 → 15개 영상, subcategory/channel_id 추가
- `src/components/videos/VideosContainer.tsx` — 영상/채널 뷰 토글, 2단 카테고리 필터
- `src/components/videos/VideoCard.tsx` — channelName prop 추가
- `src/components/layout/BottomNav.tsx` — 체중→정보 탭 교체
- `src/components/home/HomeContent.tsx` — Feature Grid에 정보 카드 추가
- `src/app/sitemap.ts` — 정보글 URL 자동 추가
- `src/app/guides/hospital-bag/page.tsx` + `weekly-prep/page.tsx` — redirect
- `e2e/navigation.spec.ts` — 체중→정보 탭 반영
- `e2e/plan.spec.ts` — 네비 탭 라벨 변경 반영
- `e2e/videos.spec.ts` — Tabs→버튼 필터 방식 반영
- `e2e/guides.spec.ts` — /articles/* URL 기반으로 전환
- `e2e/seo-metadata.spec.ts` — canonical URL 업데이트

### 주요 결정 사항

- **gray-matter + remark 선택**: contentlayer는 유지보수 중단, next-mdx-remote는 과도. 경량 + static export 호환 최적.
- **fs 모듈 사용**: Server Component에서만 호출 → 클라이언트 번들 미포함. static export 빌드 정상 동작.
- **채널 썸네일 yt3.ggpht.com**: YouTube API 응답 URL 패턴 직접 참조. 재호스팅 금지 (정책 준수).
- **네비 체중→정보 교체**: 체중 기록(주 1회)보다 정보글(AdSense/SEO)이 우선. 체중은 홈 Feature Grid에서 접근 유지.
- **가이드 리다이렉트 유지**: 기존 TSX 파일을 삭제하지 않고 redirect() 처리. 북마크/외부 링크 호환.

### 가정 사항 및 미구현 항목

- 채널 썸네일 URL은 PoC용 수동 입력. YouTube Data API 스크립트는 Phase 4 이후.
- `scripts/fetch-channel-thumbs.ts` — 미구현 (API 키 필요)
- Lighthouse SEO 검증 — 배포 후 확인

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

없음.

### Warning (수정 권장)

1. **articles.ts — frontmatter 타입 단언 미검증** — `data as ArticleMeta` 단언으로 `tags` 누락 시 TypeError 가능 → 리팩토링에서 `parseArticleMeta` 검증 함수로 해결
2. **ArticleDetail.tsx — dangerouslySetInnerHTML** — remark-html sanitize 미사용. 리스크 낮음(repo 관리 MD) → 리팩토링에서 건너뜀 (table HTML 깨짐 trade-off)
3. **articles.ts — getAllTags() 중복 파일 읽기** — MD 파일 2번 읽음 → 리팩토링에서 파라미터 방식으로 해결

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 3건 (2건 수정, 1건 건너뜀) |
| Suggestion | 1건 (Feature Grid 레이아웃) |

---

## 리팩토링 내용

### 작업 목록

1. **articles.ts — `parseArticleMeta` 검증 함수** — `as ArticleMeta` 타입 단언 2곳을 안전한 파싱 함수로 교체. 각 필드에 기본값 부여하여 frontmatter 누락 시 TypeError 방지.
2. **articles.ts + articles/page.tsx — `getAllTags` 파라미터 변경** — 내부 `getAllArticles()` 호출 제거. 외부에서 이미 읽은 articles를 전달받는 방식으로 변경. 빌드 시 MD 파일 중복 읽기 해소.
3. **Warning 2 건너뜀** — `sanitize: true` 적용 시 테이블 렌더링 깨짐. repo 관리 파일로 리스크 낮아 기능 손상 불필요.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 타입 단언 (`as`) | 2곳 | 0곳 (`parseArticleMeta` 사용) |
| MD 파일 읽기 횟수 | 2회 (getAllArticles + getAllTags) | 1회 |
| frontmatter 필드 누락 대응 | TypeError 발생 | 기본값 할당 |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| 정보글 목록 Happy Path | ✅ 5개 passed |
| 정보글 태그 필터 | ✅ 2개 passed |
| 정보글 상세 페이지 | ✅ 4개 passed |
| 리다이렉트 (guides→articles) | ✅ 2개 passed |
| 영상 뷰 (세부 카테고리 + 채널) | ✅ 9개 passed |
| 네비게이션 & 대시보드 | ✅ 4개 passed |
| SEO 메타데이터 | ✅ 4개 passed |
| 반응형 (Mobile 375px) | ✅ 7개 passed |
| 기존 테스트 (수정 포함) | ✅ 113개 passed |
| **전체** | **150 passed / 0 failed** |

📊 상세 리포트: `playwright-report/index.html`
