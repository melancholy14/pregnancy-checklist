# 구현 요약

> 지금까지 구현된 기능을 한 곳에. 자세한 phase별 구현 보고서는 [docs/implementation/](../implementation/), [docs/phase-*](../).
> 이 문서는 "어디 가면 그 코드를 읽을 수 있는지" 인덱스 역할.

---

## 1. Phase 1 — 핵심 기능

| 기능 | 핵심 파일 |
|------|-----------|
| 출산 예정일 입력·주차 계산 | [src/lib/week-calculator.ts](../../src/lib/week-calculator.ts), [src/store/useDueDateStore.ts](../../src/store/useDueDateStore.ts) |
| 체크리스트 (타임라인 통합) | [src/store/useChecklistStore.ts](../../src/store/useChecklistStore.ts), [src/data/checklist_items.json](../../src/data/checklist_items.json) |
| 타임라인 주차별 카드 | [src/components/timeline/TimelineContainer.tsx](../../src/components/timeline/TimelineContainer.tsx) |
| 베이비페어 일정 | [src/components/babyfair/BabyfairContainer.tsx](../../src/components/babyfair/BabyfairContainer.tsx), [src/data/babyfair_events.json](../../src/data/babyfair_events.json) |
| 체중 기록 + Recharts | [src/components/weight/WeightContainer.tsx](../../src/components/weight/WeightContainer.tsx) |
| 영상 큐레이션 | [src/components/videos/VideosContainer.tsx](../../src/components/videos/VideosContainer.tsx), [src/data/videos.json](../../src/data/videos.json) |
| GA4 + AdUnit | [src/components/analytics/](../../src/components/analytics/), [src/components/ads/AdUnit.tsx](../../src/components/ads/AdUnit.tsx) |
| 의료 면책 / privacy / terms | [src/app/privacy/](../../src/app/privacy/), [src/app/terms/](../../src/app/terms/) |
| BottomNav | [src/components/layout/BottomNav.tsx](../../src/components/layout/BottomNav.tsx) |

---

## 2. Phase 1.5 — 통합 + AdSense 기초

- 체크리스트 + 타임라인 아코디언 통합. 현재 주차 자동 펼침·스크롤.
- 통합 추가 폼(일정·할 일 토글), 커스텀 항목 수정/삭제.
- 카테고리 필터 칩 + 행정 안내.
- `/checklist` → `/timeline` 리다이렉트.
- 사이트맵·robots, 메타데이터 11개 페이지, 가이드 1,000자+ 글 2개.

---

## 3. Phase 2 — 콘텐츠 + AdSense 승인

- `gray-matter` + `remark/rehype`로 MD → HTML SSG.
- `/articles` 목록 + `/articles/[slug]` 상세, 태그 필터.
- 영상 채널 분리 (`channels.json`), subcategory + 2단 필터.
- 8개 article 작성 (현재는 더 추가됨).

---

## 4. Phase 2.5 — UX + 리텐션

| 기능 | 위치 |
|------|------|
| 온보딩 3단계 | [src/components/onboarding/](../../src/components/onboarding/) |
| 홈 미니 대시보드 | [src/components/home/DashboardCard.tsx](../../src/components/home/DashboardCard.tsx) |
| Sticky 헤더 | [src/components/layout/StickyHeader.tsx](../../src/components/layout/StickyHeader.tsx) |
| 타임라인 ↔ 블로그 크로스링크 | [src/components/timeline/RelatedArticlesLink.tsx](../../src/components/timeline/RelatedArticlesLink.tsx), [src/components/articles/TimelineCTA.tsx](../../src/components/articles/TimelineCTA.tsx) |
| 베이비페어 3분류 + D-day 배지 | [src/components/babyfair/BabyfairContainer.tsx](../../src/components/babyfair/BabyfairContainer.tsx) |
| About "만든 사람" 스토리 | [src/app/about/](../../src/app/about/) (`CREATOR_DUE_DATE` 자동 주차) |
| Article authorNote | [src/components/articles/ArticleDetail.tsx](../../src/components/articles/ArticleDetail.tsx) |

---

## 5. Phase 3 — AdSense 인프라 + 누락 보완

| 항목 | 상태 | 위치 |
|------|------|------|
| 쿠키 동의 배너 | ✅ | [src/components/consent/CookieConsentBanner.tsx](../../src/components/consent/CookieConsentBanner.tsx), [src/lib/consent.ts](../../src/lib/consent.ts) |
| canonical URL 치환 | ✅ | front matter 일괄 치환 (`{{SITE_URL}}` grep 0건) |
| 도구 페이지 설명 | ✅ | [src/components/common/PageDescription.tsx](../../src/components/common/PageDescription.tsx) |
| 의료 디스클레이머 | ✅ | [src/components/common/MedicalDisclaimer.tsx](../../src/components/common/MedicalDisclaimer.tsx) |
| GA4 커스텀 이벤트 3종 | ✅ | [src/lib/analytics.ts](../../src/lib/analytics.ts) (`category_tab_switch`·`timeline_scroll_depth`·`onboarding_banner_click`) |
| 영상 ↔ 타임라인 크로스링크 | ✅ | `linked_video_ids` 필드 추가 |
| 체중 페이지 ↔ 블로그 크로스링크 | ✅ | [src/components/weight/WeightContainer.tsx](../../src/components/weight/WeightContainer.tsx) |
| 클라이언트 검색 (Fuse.js) | ✅ | **§7 참조** |
| AdSense 스크립트·ads.txt | ⚠️ 부분 | `<meta>`만 있음, `adsbygoogle.js` + `public/ads.txt` 미생성 |
| reviewed_by 빈 필드 정리 | ❌ | 4개 article 잔존 ([review.md](review.md) 참조) |

---

## 6. Phase 4 — UX 심화 + 콘텐츠 네트워크

| Step | 항목 | 위치 |
|------|------|------|
| 1 | 체크리스트 허브 + 3종 분리 | [src/app/checklist/](../../src/app/checklist/), [src/store/createChecklistStore.ts](../../src/store/createChecklistStore.ts) |
| 2 | `/info` 통합 탭 (블로그+영상) | [src/app/info/](../../src/app/info/), [src/components/info/InfoContainer.tsx](../../src/components/info/InfoContainer.tsx), [src/lib/unified-tags.ts](../../src/lib/unified-tags.ts) |
| 3 | 아티클 하단 관련 콘텐츠 | [src/lib/related-content.ts](../../src/lib/related-content.ts), [src/components/articles/RelatedContent.tsx](../../src/components/articles/RelatedContent.tsx) |
| 4 | 공유 (Web Share + Clipboard) | **§8 참조** |
| 5 | 크로스링크 자동 생성 | **§7.2 참조** |
| (보류) | 체중 BMI/IOM 권장 영역 차트 | 미구현 — Phase 4-1 잔존 |

---

## 7. 검색 (Phase 3 step 2) — 상세

### 7.1 인덱스 구조 — [src/lib/search.ts](../../src/lib/search.ts)

```ts
type SearchItem = {
  type: "timeline" | "article" | "video";
  title: string;
  description: string;
  url: string;        // 결과 클릭 시 이동할 URL
  tags?: string[];    // article만
  week?: number;      // timeline만
  categoryName?: string; // video만
};
```

`buildSearchIndex(timeline, articles, videos)` 호출 시 세 도메인을 단일 배열로 합쳐 반환:
- 타임라인 → `/timeline#timeline-week-{week}` (해시 스크롤)
- 아티클 → `/articles/{slug}`
- 영상 → `/info?tab=videos#{id}` (정보 탭으로 통합 후 해시)

### 7.2 Fuse 설정

```ts
new Fuse(items, {
  keys: [
    { name: "title", weight: 2 },
    { name: "description", weight: 1 },
    { name: "tags", weight: 1.5 },
    { name: "categoryName", weight: 1.2 },
  ],
  threshold: 0.4,        // 0=정확, 1=any. 0.4가 한국어 fuzzy에 적당
  minMatchCharLength: 2, // 1글자 검색은 무시
});
```

### 7.3 UI 진입점
- Sticky 헤더 검색 아이콘 → 풀스크린 모달 ([src/components/search/](../../src/components/search/))
- `useSearchStore`로 모달 열림 상태 전역 관리(persist 없음)
- 입력 디바운스 300ms, 결과를 type별 섹션으로 분리 렌더 (타임라인 / 블로그 / 영상)

### 7.4 결과 회유 분석
- 클릭 이벤트: `sendGAEvent("search_result_click", {type, position})` (분석 추가 후보)

---

## 8. 자동 크로스링크 스크립트 — 상세

### 8.1 목표
콘텐츠 추가/수정 후 운영자가 `npm run crosslinks:apply`만 치면 다음 4개 매트릭스를 자동 갱신:

| 출처 | 대상 필드 | 매핑 |
|------|----------|------|
| `timeline_items.json[]` | `linked_article_slugs`, `linked_video_ids` | 주차 → 관련 글/영상 |
| `*_checklist.json` `meta` | `linked_article_slugs`, `linked_video_ids` | 체크리스트 → 관련 글/영상 |
| `src/content/articles/*.md` front matter | `linked_timeline_weeks`, `linked_video_ids` | 글 → 관련 주차/영상 |

### 8.2 알고리즘 — [src/lib/crosslink-utils.ts](../../src/lib/crosslink-utils.ts) + [scripts/generate-crosslinks.ts](../../scripts/generate-crosslinks.ts)

1. **로드**: timeline·videos·articles·checklists 4개 도메인 데이터 in-memory.
2. **특징 추출**: 각 항목에서 `unifiedTags` (수동 매핑 매트릭스) + `keywords` (text → tokenize) 두 신호 추출.
3. **점수**: `relevanceScore = jaccard(unifiedTags) * 0.6 + jaccard(keywords) * 0.4`.
4. **Bipartite match**: `bipartiteMatch<L, R>` 헬퍼가 4쌍(timeline×videos, article×videos, checklist×articles, checklist×videos)에 대해 top-N(5) + threshold(0.2) 적용.
5. **양방향 대칭 보강**: article의 `linked_timeline_weeks`가 있으면 해당 timeline 항목의 `linked_article_slugs`에도 반대 매핑 추가.
6. **Manual 보호**: 필드 sibling으로 `*_manual: true`가 있으면 자동 매핑이 덮어쓰지 않음.
7. **차이 계산**: 기존 매핑과 비교해서 변경/추가/제거 차이 산출 → `dry-run`은 출력만, `apply`는 파일 갱신.

### 8.3 토큰화 (한·영 혼합)

```ts
// 한국어: 2글자 이상, 영문: 3글자 이상
const matched = text.toLowerCase().match(/[가-힯]+|[a-z][a-z0-9]*/g);
// stopword: 한국어 33개("임신", "출산"...), 영문 10개("and", "the"...)
```

### 8.4 모드

| 명령 | 동작 |
|------|------|
| `npm run crosslinks` | dry-run. 변경 예정만 출력 |
| `npm run crosslinks:apply` | 실제 파일 갱신 (front matter, JSON 인플레이스 수정) |
| `npm run crosslinks:report` | 현재 매핑 통계 + manual 보호 필드 N개 표시 |

### 8.5 안전장치
- front matter 미니 파서: 필드 단위 정규식 치환 (`new RegExp(\`^${key}:.*$\`, "m")`). 6개 하드코딩 필드만 허용 → 정규식 인젝션 표면 없음.
- in-place YAML 인라인 배열 직렬화(`formatYamlInlineArray`)로 따옴표 이스케이프.
- 변경 적용 전 모든 변경을 메모리에서 검증 → 한 번에 디스크 쓰기.

---

## 9. 공유 기능 (Phase 4 step 4) — 상세

### 9.1 환경 분기 전략 — [src/lib/share.ts](../../src/lib/share.ts)

```ts
function isMobileTouchEnvironment(): boolean {
  return matchMedia("(pointer: coarse) and (hover: none)").matches;
}
```

데스크톱 Chrome/Edge/Safari도 `navigator.share`를 지원하므로 단순 `if (navigator.share)`로는 모달 fallback 의도가 어긋남. **포인터 정밀도(coarse) + hover 부재**로 모바일/터치 환경을 명시 판정 → 그때만 Web Share API 호출.

### 9.2 분기

| 환경 | 동작 |
|------|------|
| 모바일 + `navigator.share` 지원 | 네이티브 공유 시트 → 성공 시 `share` GA 이벤트 (`method: web_share_api`) |
| 데스크톱 또는 미지원 | `onFallback()` → ShareModal 열림 → "링크 복사" 버튼 → `navigator.clipboard.writeText` |

### 9.3 GA4 이벤트
- 성공 시 `share` 이벤트 + `method` (`web_share_api` / `clipboard`) + `content_type` + `item_id` 파라미터.
- AbortError(시트 닫음)는 silently 무시 (사용자 의도 존중).

### 9.4 적용 위치
- 아티클 본문 상·하단 ([ArticleDetail](../../src/components/articles/ArticleDetail.tsx))
- 체크리스트 페이지 헤더 ([ChecklistPage](../../src/components/checklist/ChecklistPage.tsx))
- 타임라인 페이지 헤더 ([TimelineContainer](../../src/components/timeline/TimelineContainer.tsx))

---

## 10. 운영 스크립트 — 상세

### 10.1 [scripts/fetch-channel-thumbs.ts](../../scripts/fetch-channel-thumbs.ts)
- YouTube Data API v3 `/channels?part=snippet` 호출 → `thumbnails.high.url` 우선 → `medium` → `default` fallback.
- `.env.local`을 직접 파싱해 `YOUTUBE_API_KEY` 로드 (tsx는 Next 환경 미주입).
- 모드:
  - 기본: 빈 `thumbnail_url`만 갱신.
  - `--force`: 전체 강제 갱신.
- 결과: `src/data/channels.json` 인플레이스 수정.

### 10.2 [scripts/fetch-video-metadata.ts](../../scripts/fetch-video-metadata.ts)
- YouTube Data API `/videos?part=snippet,contentDetails` 호출.
- 검증: `videos.json`의 title·channelId가 API 응답과 일치하는지.
- Shorts 판별: `contentDetails.duration` ≤ 60초.
- 모드:
  - 기본: 검증 리포트만(불일치 경고).
  - `--update`: `videos.json`에 `upload_date`·`is_short` 필드 추가/갱신.

### 10.3 [scripts/verify-videos.ts](../../scripts/verify-videos.ts)
- `videos.json` 자체 무결성: `category` ∈ allowed values, `youtube_id` 형식, `channel_id`가 `channels.json`에 존재 등.

### 10.4 [scripts/lighthouse-check.sh](../../scripts/lighthouse-check.sh)
- Lighthouse CLI로 5개 페이지(홈·타임라인·베이비페어·블로그 목록·블로그 상세) SEO 카테고리 90+ pass/fail.
- `--quiet` + `--chrome-flags="--headless"` 로컬 실행 가정.
- CI 워크플로우에 optional step으로 통합 가능 (현재 미통합).

### 10.5 [scripts/generate-crosslinks.ts](../../scripts/generate-crosslinks.ts)
- 위 §8 참조.

### 10.6 [scripts/sync-obsidian-vault.sh](../../scripts/sync-obsidian-vault.sh)
- `~/Documents/pregnancy-checklist/` Obsidian vault ↔ 코드베이스 미러.
- vault `_mirror/`는 read-only (편집 금지 — memory에 기록됨).

### 10.7 [scripts/seed-vault-media-notes.py](../../scripts/seed-vault-media-notes.py)
- vault 내 미디어 노트 seed (Python 단건 작업).

---

## 11. 미구현·진행 중

| 항목 | 일정 | 위치 / 비고 |
|------|------|------------|
| 체중 BMI/IOM 권장 영역 차트 | **Phase 5** §5-0a | `WeightContainer` 미적용. 의료 면책 + 개인정보처리방침 건강 정보 조항 선행. [plan.md](../plan/plan.md#L902) |
| 베이비페어 크롤러 (`scripts/crawl-babyfair.ts`) | **Phase 5** §5-1 | 스펙 [docs/specs/babyfair_crawler_spec.md](../specs/babyfair_crawler_spec.md) |
| Unit Test (vitest) | **Phase 5** §5-0b | 핵심 lib 5종 첫 라운드 |
| zod 런타임 검증 | **Phase 5** §5-0c | JSON 임포트 단언 → 스키마 검증 |
| AdSense `adsbygoogle.js` + `public/ads.txt` | **Phase 4.5** D-C1 | [phase-4.5/plan.md §4](../phase-4.5/plan.md) |
| `reviewed_by` 빈 필드 4건 정리 | **Phase 4.5** D-C2 | [phase-4.5/plan.md §4](../phase-4.5/plan.md) |
| GitHub Actions CI/CD | **Phase 4.5** D-M1 | [phase-4.5/plan.md §4](../phase-4.5/plan.md) |
| 에러 모니터링 SaaS (Sentry) | **Phase 6** §6-1 | [plan.md](../plan/plan.md) |
