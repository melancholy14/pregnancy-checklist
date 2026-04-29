# Client Search 코드 리뷰

> Date: 2026-04-19

## 리뷰 대상 파일
- `src/lib/search.ts`
- `src/store/useSearchStore.ts`
- `src/components/search/SearchModal.tsx`
- `src/components/layout/StickyHeader.tsx`
- `src/app/layout.tsx`
- `src/components/videos/VideoCard.tsx`
- `src/components/videos/VideosContainer.tsx`
- `src/components/timeline/TimelineContainer.tsx`

---

## Critical 이슈 (즉시 수정 완료)

없음

---

## Warning (수정 권장)

### 1. VideosContainer.tsx — 내부 setTimeout cleanup 미작동
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

## Suggestion (개선 아이디어)

### 1. SearchModal.tsx — flatIndex 렌더 바디 변수
- **위치**: `src/components/search/SearchModal.tsx:111`
- **내용**: `let flatIndex = 0`이 렌더 함수 본문에서 `.map()` 내부에서 증가하는 패턴. 동작에 문제는 없으나 (렌더는 동기적), grouped 데이터에서 미리 flat 배열을 계산하는 방식이 의도가 더 명확할 수 있음. 현재 코드가 간결하므로 변경 필요성 낮음.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 1건 |
| Suggestion | 1건 |
| 빌드 | 미실행 (Critical 없음) |
