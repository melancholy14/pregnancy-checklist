# Feature Plan: client-search

> Source: docs/phase-3/plan.md Step 2
> Date: 2026-04-19

## 기능 목표

타임라인·블로그 아티클·영상을 한곳에서 퍼지 검색할 수 있는 클라이언트 사이드 검색 기능을 구현한다. StickyHeader의 검색 아이콘으로 모달을 열고, fuse.js 기반 가중치 검색으로 결과를 3개 섹션(타임라인/정보글/영상)으로 분리하여 보여준다. 영상 결과 클릭 시 `/videos#video_id`로 이동하여 해당 카드로 스크롤한다.

## 완료 조건 (AC)

| # | 조건 | 비고 |
|---|------|------|
| 1 | Sticky 헤더에 검색 아이콘이 노출됨 | PRD 명시 |
| 2 | 검색 모달에서 타임라인·정보글·영상 결과가 섹션 분리 노출 | PRD + 추가 |
| 3 | 최소 2자 이상 입력 시 검색 동작 (1자는 무시) | PRD 명시 |
| 4 | 결과 클릭 시 해당 페이지로 정상 이동 | PRD 명시 |
| 5 | 모달 외부 클릭 또는 ✕ 버튼으로 닫기 동작 | PRD 명시 |
| 6 | 검색어 없을 때 안내 메시지 표시 | PRD 명시 |
| 7 | 타임라인 결과 클릭 시 `/timeline#week-N`으로 이동+스크롤 | 추론 |
| 8 | 영상 결과 클릭 시 `/videos#video_id`로 이동+스크롤 | 추가 |

## 기술 스택

- 라우터: App Router (Next.js 16)
- 상태관리: Zustand
- CSS: Tailwind CSS
- UI: shadcn/ui (cmdk CommandDialog)
- TypeScript: Yes
- 배포: Static export → GitHub Pages

## 레퍼런스 패턴

- `src/components/ui/command.tsx` — CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem API
- `src/components/layout/StickyHeader.tsx` — 헤더 구조, 검색 아이콘 배치 위치
- `src/store/useDueDateStore.ts` — Zustand store 작성 패턴
- `src/components/videos/VideoCard.tsx` — 영상 카드 구조 (id 속성 추가 대상)
- `src/components/videos/VideosContainer.tsx` — hash 스크롤 로직 추가 대상

## 설계 결정: cmdk + fuse.js 조합

PRD는 fuse.js 기반 커스텀 모달을 제안했으나, cmdk가 이미 설치되어 있고 shadcn Command UI가 존재.

| | cmdk (UI) | fuse.js (검색 엔진) |
|---|---|---|
| 역할 | 모달, 키보드 네비게이션, ARIA 접근성 | 가중치 퍼지 검색, 한글 매칭 |
| 설정 | `shouldFilter={false}` | `threshold: 0.4`, `minMatchCharLength: 2` |

## 구현 순서

1. **Dependencies** — `fuse.js` 설치
2. **Types** — `SearchItem` 타입 정의 (`type: 'timeline' | 'article' | 'video'`)
3. **Search Logic** — fuse.js 인스턴스, 타임라인+아티클+영상 인덱스 구축
4. **State** — `useSearchStore` (Zustand) — 모달 open/close
5. **UI** — `SearchModal` 컴포넌트 — 3개 그룹(타임라인/정보글/영상) 렌더링
6. **Hash 스크롤** — VideoCard에 `id` 추가 + VideosContainer에 hash 감지→스크롤 로직
7. **Integration** — StickyHeader에 검색 아이콘, layout.tsx에 SearchModal 배치

## 생성/수정 파일 목록

| 구분 | 경로 | 역할 |
|------|------|------|
| 신규 | `src/lib/search.ts` | `SearchItem` 타입 + `buildSearchIndex()` + `createSearcher()` |
| 신규 | `src/store/useSearchStore.ts` | 모달 open/close Zustand store |
| 신규 | `src/components/search/SearchModal.tsx` | CommandDialog 기반 검색 모달 (3개 그룹) |
| 수정 | `src/components/layout/StickyHeader.tsx` | `Search` 아이콘 버튼 추가 |
| 수정 | `src/app/layout.tsx` | `getAllArticles()` → `<SearchModal articles={...} />` 배치 |
| 수정 | `src/components/videos/VideoCard.tsx` | 루트 `<a>`에 `id={video.id}` 추가 |
| 수정 | `src/components/videos/VideosContainer.tsx` | mount 시 `location.hash` 감지 → `scrollIntoView` 로직 |

## 데이터 흐름

```
layout.tsx (서버)
├── getAllArticles() → ArticleMeta[]
└── <SearchModal articles={articles} />  (클라이언트)
     ├── import timelineItems from "@/data/timeline_items.json"
     ├── import videos from "@/data/videos.json"
     ├── buildSearchIndex(timelineItems, articles, videos) → SearchItem[]
     └── createSearcher(searchItems) → Fuse instance

SearchModal 결과 클릭:
├── timeline → router.push("/timeline#week-N")
├── article  → router.push("/articles/{slug}")
└── video    → router.push("/videos#{video.id}")

VideosContainer mount:
└── hash 존재 시 → 해당 id element.scrollIntoView({ behavior: "smooth" })
```

## 가정 사항

- 영상 결과 클릭 시 사이트 내 `/videos` 페이지로 이동 (YouTube 외부 링크가 아님)
- hash 스크롤 시 해당 VideoCard에 하이라이트 효과 추가 (ring 등)
- 검색 인덱스 ~76개 항목 → web worker 불필요

## Out of Scope

- 서버 사이드 검색 (Algolia, Elasticsearch 등)
- 검색 기록 저장
- 자동완성 / 인기 검색어

## 예상 리스크

1. **package.json에 없는 기능**: `fuse.js` 신규 설치 필요 (~15KB gzipped)
2. **수정 파일 공유**: `VideoCard.tsx`는 영상 페이지에서 사용 중 — `id` 추가는 기존 동작에 영향 없음. `layout.tsx`에 `getAllArticles()` 호출이 추가되나 빌드 타임 전용이므로 런타임 영향 없음
