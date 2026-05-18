# Client Search Implementation

> Source: docs/plan/client-search-plan.md
> Date: 2026-04-19

## 완료 조건 충족 여부

| # | 조건 | 상태 | 비고 |
|---|------|------|------|
| 1 | Sticky 헤더에 검색 아이콘이 노출됨 | ✅ 완료 | Search 아이콘 + aria-label |
| 2 | 검색 모달에서 타임라인·정보글·영상 결과가 섹션 분리 노출 | ✅ 완료 | CommandGroup 3개 |
| 3 | 최소 2자 이상 입력 시 검색 동작 (1자는 무시) | ✅ 완료 | fuse.js minMatchCharLength: 2 + query.length < 2 가드 |
| 4 | 결과 클릭 시 해당 페이지로 정상 이동 | ✅ 완료 | router.push() |
| 5 | 모달 외부 클릭 또는 닫기 버튼으로 닫기 동작 | ✅ 완료 | Dialog onOpenChange + DialogContent 닫기 버튼 |
| 6 | 검색어 없을 때 안내 메시지 표시 | ✅ 완료 | "검색어를 입력하세요" |
| 7 | 타임라인 결과 클릭 시 `/timeline#timeline-week-N`으로 이동+스크롤 | ✅ 완료 | 기존 TimelineAccordionCard id 활용 |
| 8 | 영상 결과 클릭 시 `/videos#video_id`로 이동+스크롤 | ✅ 완료 | VideoCard id 추가 + VideosContainer hash scroll |

## 생성/수정 파일 목록

### 신규 생성
- `src/lib/search.ts` — SearchItem 타입, buildSearchIndex(), createSearcher() (fuse.js 래퍼)
- `src/store/useSearchStore.ts` — 검색 모달 open/close Zustand store
- `src/components/search/SearchModal.tsx` — Dialog + Command 조합 검색 모달 (shouldFilter={false} + fuse.js)

### 수정
- `src/components/layout/StickyHeader.tsx` — Search 아이콘 버튼 추가 (ml-auto로 우측 배치)
- `src/app/layout.tsx` — getAllArticles() 호출 + SearchModal 배치
- `src/components/videos/VideoCard.tsx` — 루트 `<a>`에 `id={video.id}` 추가
- `src/components/videos/VideosContainer.tsx` — mount 시 hash 감지 → scrollIntoView + 하이라이트 효과

## 주요 결정 사항

- **CommandDialog 대신 Dialog + Command 직접 조합**: CommandDialog는 내부 Command에 shouldFilter prop을 전달할 수 없음. fuse.js가 검색을 담당하므로 cmdk의 내장 필터를 비활성화해야 하므로 Dialog + Command를 직접 조합
- **타임라인 URL에 기존 id 패턴 활용**: TimelineAccordionCard에 이미 `id={`timeline-week-${item.week}`}` 존재. 별도 hash 스크롤 로직 없이 브라우저 기본 hash 네비게이션으로 동작
- **영상 하이라이트 효과**: ring-2 + ring-pastel-pink로 2초간 하이라이트 후 자동 제거. 프로젝트의 pastel 컬러 시스템과 일관됨
- **fuse.js 설치 시 --legacy-peer-deps**: 기존 react-day-picker의 date-fns peer dependency 충돌로 플래그 필요

## 가정 사항

- 영상 결과 클릭 시 사이트 내 /videos 페이지로 이동 (YouTube 외부 링크가 아님)
- hash 스크롤 시 해당 VideoCard에 하이라이트 효과 추가 (ring)
- 검색 인덱스 ~76개 항목 → web worker 불필요, 메인 스레드 처리
- 타임라인 hash 스크롤은 브라우저 기본 hash 네비게이션에 의존 (별도 JS 불필요)

## 미구현 항목

- 없음 — 모든 AC 충족
