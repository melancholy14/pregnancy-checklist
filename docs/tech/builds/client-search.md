# client-search

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-04-19

<!-- STEP:impl -->
## 구현

> Source: docs/plan/client-search-plan.md
> Date: 2026-04-19

### 완료 조건 충족 여부

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

### 생성/수정 파일 목록

#### 신규 생성
- `src/lib/search.ts` — SearchItem 타입, buildSearchIndex(), createSearcher() (fuse.js 래퍼)
- `src/store/useSearchStore.ts` — 검색 모달 open/close Zustand store
- `src/components/search/SearchModal.tsx` — Dialog + Command 조합 검색 모달 (shouldFilter={false} + fuse.js)

#### 수정
- `src/components/layout/StickyHeader.tsx` — Search 아이콘 버튼 추가 (ml-auto로 우측 배치)
- `src/app/layout.tsx` — getAllArticles() 호출 + SearchModal 배치
- `src/components/videos/VideoCard.tsx` — 루트 `<a>`에 `id={video.id}` 추가
- `src/components/videos/VideosContainer.tsx` — mount 시 hash 감지 → scrollIntoView + 하이라이트 효과

### 주요 결정 사항

- **CommandDialog 대신 Dialog + Command 직접 조합**: CommandDialog는 내부 Command에 shouldFilter prop을 전달할 수 없음. fuse.js가 검색을 담당하므로 cmdk의 내장 필터를 비활성화해야 하므로 Dialog + Command를 직접 조합
- **타임라인 URL에 기존 id 패턴 활용**: TimelineAccordionCard에 이미 `id={`timeline-week-${item.week}`}` 존재. 별도 hash 스크롤 로직 없이 브라우저 기본 hash 네비게이션으로 동작
- **영상 하이라이트 효과**: ring-2 + ring-pastel-pink로 2초간 하이라이트 후 자동 제거. 프로젝트의 pastel 컬러 시스템과 일관됨
- **fuse.js 설치 시 --legacy-peer-deps**: 기존 react-day-picker의 date-fns peer dependency 충돌로 플래그 필요

### 가정 사항

- 영상 결과 클릭 시 사이트 내 /videos 페이지로 이동 (YouTube 외부 링크가 아님)
- hash 스크롤 시 해당 VideoCard에 하이라이트 효과 추가 (ring)
- 검색 인덱스 ~76개 항목 → web worker 불필요, 메인 스레드 처리
- 타임라인 hash 스크롤은 브라우저 기본 hash 네비게이션에 의존 (별도 JS 불필요)

### 미구현 항목

- 없음 — 모든 AC 충족

---

<!-- STEP:review -->
## 코드 리뷰

> Date: 2026-04-19

### 리뷰 대상 파일
- `src/lib/search.ts`
- `src/store/useSearchStore.ts`
- `src/components/search/SearchModal.tsx`
- `src/components/layout/StickyHeader.tsx`
- `src/app/layout.tsx`
- `src/components/videos/VideoCard.tsx`
- `src/components/videos/VideosContainer.tsx`
- `src/components/timeline/TimelineContainer.tsx`

---

### Critical 이슈 (즉시 수정 완료)

없음

---

### Warning (수정 권장)

#### 1. VideosContainer.tsx — 내부 setTimeout cleanup 미작동
- **위치**: `src/components/videos/VideosContainer.tsx:72`
- **문제**: hash 스크롤 effect 내부의 하이라이트 제거 타이머(`cleanup`)가 setTimeout 콜백 안에서 `return () => clearTimeout(cleanup)`으로 반환되지만, 이 return은 useEffect의 cleanup이 아니라 setTimeout 콜백의 return이므로 실제로 호출되지 않음. 컴포넌트가 300ms~2300ms 사이에 unmount되면 내부 타이머가 정리되지 않음.
- **권장 수정**: 외부 변수로 내부 타이머 ID를 추적하고 useEffect cleanup에서 함께 정리
```tsx
useEffect(() => {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  let cleanupTimer: ReturnType<typeof setTimeout>;
  const timer = setTimeout(() => {
    const el = document.getElementById(hash);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-pastel-pink", "rounded-2xl");
    cleanupTimer = setTimeout(() => {
      el.classList.remove("ring-2", "ring-pastel-pink", "rounded-2xl");
    }, 2000);
  }, 300);
  return () => { clearTimeout(timer); clearTimeout(cleanupTimer); };
}, []);
```

---

### Suggestion (개선 아이디어)

#### 1. SearchModal.tsx — flatIndex 렌더 바디 변수
- **위치**: `src/components/search/SearchModal.tsx:111`
- **내용**: `let flatIndex = 0`이 렌더 함수 본문에서 `.map()` 내부에서 증가하는 패턴. 동작에 문제는 없으나 (렌더는 동기적), grouped 데이터에서 미리 flat 배열을 계산하는 방식이 의도가 더 명확할 수 있음. 현재 코드가 간결하므로 변경 필요성 낮음.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 1건 |
| Suggestion | 1건 |
| 빌드 | 미실행 (Critical 없음) |

---

<!-- STEP:refactor -->
## 리팩토링

> Date: 2026-04-19

### 리팩토링한 파일 목록
- `src/components/videos/VideosContainer.tsx`

---

### 작업별 내용

#### 1. VideosContainer.tsx — setTimeout cleanup 정리
- **출처**: Warning 항목 (code-review)
- **무엇을**: hash 스크롤 useEffect 내부의 하이라이트 제거 타이머를 외부 변수(`highlightTimer`)로 추적하고, useEffect cleanup에서 `scrollTimer`와 함께 정리하도록 수정
- **왜**: 기존 코드는 내부 setTimeout 콜백에서 `return () => clearTimeout(cleanup)`을 반환했으나, 이 return은 setTimeout 콜백의 반환값일 뿐 useEffect cleanup이 아니므로 실제로 호출되지 않음. 컴포넌트가 300ms~2300ms 사이에 unmount되면 내부 타이머가 정리되지 않는 문제

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 1개 | 1개 |
| cleanup 대상 타이머 | 1개 (scrollTimer만) | 2개 (scrollTimer + highlightTimer) |
| 동작 변경 | — | 없음 |

---

### 빌드 결과
성공 (1회)
