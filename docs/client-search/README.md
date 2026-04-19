# Client Search

> 작성일: 2026-04-19 | 작성자: Claude Code

## 개요

타임라인(37개)·정보글(9개)·영상(30개)을 한곳에서 퍼지 검색할 수 있는 클라이언트 사이드 검색 기능. StickyHeader의 검색 아이콘으로 모달을 열고, fuse.js 기반 가중치 검색으로 결과를 3개 섹션으로 분리하여 보여준다. 결과 클릭 시 해당 페이지로 이동하며, 타임라인·영상은 hash 기반 스크롤로 정확한 위치에 도달한다.

---

## 구현 내용

### 완료 조건 충족 여부

| # | 조건 | 상태 | 비고 |
|---|------|------|------|
| 1 | Sticky 헤더에 검색 아이콘 노출 | ✅ | Search 아이콘 + aria-label |
| 2 | 타임라인·정보글·영상 섹션 분리 | ✅ | 3개 그룹 렌더링 |
| 3 | 2자 이상 입력 시 검색 동작 | ✅ | fuse.js minMatchCharLength: 2 |
| 4 | 결과 클릭 시 페이지 이동 | ✅ | router.push() |
| 5 | 모달 닫기 동작 | ✅ | Dialog onOpenChange + X 버튼 |
| 6 | 검색어 없을 때 안내 메시지 | ✅ | "검색어를 입력하세요" |
| 7 | 타임라인 hash 스크롤 | ✅ | `/timeline#timeline-week-N` |
| 8 | 영상 hash 스크롤+하이라이트 | ✅ | `/videos#video_id` + ring 2초 |

### 생성/수정 파일

**신규 생성**
- `src/lib/search.ts` — SearchItem 타입, buildSearchIndex(), createSearcher()
- `src/store/useSearchStore.ts` — 모달 open/close Zustand store
- `src/components/search/SearchModal.tsx` — Dialog + 순수 리스트 검색 모달

**수정**
- `src/components/layout/StickyHeader.tsx` — Search 아이콘 버튼 추가
- `src/app/layout.tsx` — getAllArticles() + SearchModal 배치
- `src/components/videos/VideoCard.tsx` — `id={video.id}` 추가
- `src/components/videos/VideosContainer.tsx` — hash 스크롤 + 하이라이트
- `src/components/timeline/TimelineContainer.tsx` — hash 가드 + 타이머 cleanup

### 주요 결정 사항

| 결정 | 이유 |
|------|------|
| cmdk 완전 제거 → 순수 DOM | cmdk `shouldFilter={false}` + 내부 store가 render 중 setState 유발 |
| Radix Dialog + role="listbox" | 접근성 유지하면서 cmdk 의존성 제거 |
| 화살표 키 네비게이션 직접 구현 | cmdk 없이도 키보드 UX 유지 |
| 영상 카테고리 추가 (plan 대비) | 30개 항목 추가해도 성능 영향 없음 (~76개 총) |
| hash 존재 시 자동 스크롤 생략 | 검색→타임라인 이동 시 현재 주차 스크롤이 hash를 덮어쓰는 버그 방지 |

### 가정 사항 및 미구현 항목

**가정:** 검색 인덱스 ~76개 → web worker 불필요. 영상 클릭은 사이트 내 이동.

**미구현:** 없음 (모든 AC 충족)

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

없음

### Warning (수정 권장)

1. **VideosContainer.tsx:72** — 내부 setTimeout cleanup이 useEffect cleanup이 아닌 setTimeout 콜백의 return으로 반환되어 실제 호출되지 않음 → 리팩토링에서 수정 완료

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 1건 → 리팩토링에서 수정 |
| Suggestion | 1건 (flatIndex 패턴) |

---

## 리팩토링 내용

### 작업 목록

1. **VideosContainer.tsx** — 하이라이트 제거 타이머를 외부 변수(`highlightTimer`)로 추적, useEffect cleanup에서 `scrollTimer`와 함께 정리
2. **TimelineContainer.tsx** — 자동 스크롤 setTimeout에 cleanup 추가

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| VideosContainer cleanup 대상 | 1개 (scrollTimer) | 2개 (scrollTimer + highlightTimer) |
| TimelineContainer cleanup | 없음 | clearTimeout(timer) |
| 동작 변경 | — | 없음 |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 7개 passed |
| Error/Validation | ✅ 3개 passed |
| 권한/인증 | ✅ 1개 passed |
| 반응형 (Mobile 375px) | ✅ 2개 passed |
| **전체** | **13 passed / 0 failed** |

테스트 파일: `e2e/client-search.spec.ts`
