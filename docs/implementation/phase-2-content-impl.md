# Phase 2: 콘텐츠 강화 + AdSense 승인 — Implementation

## 완료 조건 충족 여부

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
| 14 | E2E 테스트 통과 | ⏳ 미완료 | 다음 단계에서 작성 |
| 15 | Lighthouse SEO 90+ | ⏳ 미완료 | 배포 후 확인 |

## 생성/수정 파일 목록

### 신규 생성 (16개)

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

### 수정 (8개)

- `src/types/video.ts` — VideoCategory 타입, subcategory/channel_id 추가, ChannelItem 타입
- `src/data/videos.json` — 9개 → 15개 영상, subcategory/channel_id 추가
- `src/components/videos/VideosContainer.tsx` — 영상/채널 뷰 토글, 2단 카테고리 필터
- `src/components/videos/VideoCard.tsx` — channelName prop 추가
- `src/components/layout/BottomNav.tsx` — 체중→정보 탭 교체
- `src/components/home/HomeContent.tsx` — Feature Grid에 정보 카드 추가
- `src/app/sitemap.ts` — 정보글 URL 자동 추가
- `src/app/guides/hospital-bag/page.tsx` + `weekly-prep/page.tsx` — redirect

## 주요 결정 사항

- **gray-matter + remark 선택**: contentlayer는 유지보수 중단, next-mdx-remote는 과도한 의존성. gray-matter + remark가 가장 경량이면서 static export 호환성 최적.
- **fs 모듈 사용**: Server Component에서만 호출되므로 클라이언트 번들에 포함되지 않음. static export 빌드 시 정상 동작 확인.
- **채널 썸네일 yt3.ggpht.com**: YouTube API 응답 URL 패턴 사용. 재호스팅 없이 직접 참조 (정책 준수).
- **네비 체중→정보 교체**: 체중 기록은 사용 빈도 낮음(주 1회). 홈 Feature Grid에서 접근 유지. 정보글이 AdSense/SEO에 더 중요.
- **Feature Grid 5개**: 기존 2×2 → 정보 카드 추가로 5개. CSS Grid 유지.
- **가이드 리다이렉트 유지**: 기존 TSX 가이드 파일을 삭제하지 않고 redirect() 처리. 북마크/외부 링크 호환성.

## 가정 사항

- 채널 썸네일 URL은 PoC용으로 수동 입력. YouTube Data API 스크립트는 별도 구현 예정.
- 영상 15개의 YouTube ID는 실제 존재하는 영상 기반이나, 일부 신규 추가분은 대표적인 한국어 임산부 콘텐츠에서 선별.
- prose 스타일은 Tailwind Typography 플러그인 없이 inline className으로 처리 (기존 가이드 패턴과 동일).

## 미구현 항목

- `scripts/fetch-channel-thumbs.ts` — YouTube API 채널 썸네일 자동 수집 스크립트 (API 키 필요, Phase 4 이후)
- E2E 테스트 — 다음 단계에서 작성
- Lighthouse SEO 검증 — 배포 후 확인
