# design-bundle-j-share-button-position 디자인 문서

> 작성일: 2026-05-10
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- **J-1 옵션 C**: 우상단+중앙하단 유지 + 4주 measurement window. articles는 둘 다, checklist·timeline은 우상단 단독. 위치 자체 변경 0.
- **J-2 옵션 B**: `share_click.position` 의무 prop — `top_right` | `bottom_center`.
- **페어 1**: ShareButton 시각 토큰은 묶음 H lavender/40 정합 1회 검증.

## 1. 화면 목록·플로우

본 라운드는 위치 변경 0, 측정 파라미터 추가만. 시각 산출은 ShareButton 컴포넌트 자체 토큰 검증 + 호출부 4개 position prop 부착.

- **articles 페이지** (`/articles/<slug>`): 우상단(메타 영역 아래, 본문 시작 전) + 중앙하단(본문 끝 RelatedContent 위). 둘 다 유지.
- **checklist 페이지** (`/checklist/<slug>`): 우상단 단독(PageDescription 아래). 페이지 끝 ShareButton 0.
- **timeline 페이지** (`/timeline`): 우상단 단독(PageDescription 아래, 현재 주차 카드 위). 페이지 끝 ShareButton 0.

## 2. 컴포넌트

### 신규

- 없음.

### 재사용·확장

- [src/components/share/ShareButton.tsx](src/components/share/ShareButton.tsx) — props 확장. `position: "top_right" | "bottom_center"` 의무 prop 추가. 시각 토큰·핸들러 로직 변경 없음.

### 마크업 구조 (변경 없음, prop만 추가)

```tsx
// articles 우상단
<div className="flex justify-end mb-6">
  <ShareButton
    title={article.title}
    description={article.description}
    url={article.canonical}
    contentType="article"
    itemId={article.slug}
    position="top_right"  // ← 추가
  />
</div>

// articles 중앙하단
<div className="flex justify-center mt-10">
  <ShareButton
    title={article.title}
    description={article.description}
    url={article.canonical}
    contentType="article"
    itemId={article.slug}
    label="이 글 공유하기"
    position="bottom_center"  // ← 추가
  />
</div>

// checklist·timeline 우상단
<div className="flex justify-end mb-4">
  <ShareButton
    {...}
    position="top_right"  // ← 추가
  />
</div>
```

## 3. 상태별 시안

### default

- ShareButton 시각 토큰 — 현재 [src/components/share/ShareButton.tsx](src/components/share/ShareButton.tsx) 정합 검증:
  - 컨테이너: `rounded-xl` (button radius 정합) + 활성 색은 묶음 H 결과인 `lavender/40` 또는 ghost 패턴 — 검증 후 spec.md M5 결과 박힘.
  - 아이콘: lucide `Share2` 또는 동등. `w-4 h-4` 또는 `w-5 h-5` (현행 토큰 유지).
  - 라벨 모드(`label` prop 보유 시): 텍스트 + 아이콘 — 중앙하단 articles 케이스만.
- 우상단 슬롯: `flex justify-end mb-4` (checklist·timeline) 또는 `mb-6` (articles).
- 중앙하단 슬롯: `flex justify-center mt-10` (articles).

### hover

- 현행 ShareButton hover 토큰 그대로(검증 1회). lavender 활성색 패턴 시 `hover:bg-pastel-lavender/60` 또는 ghost `hover:bg-muted/80`.

### focus-visible (키보드)

- ShareButton의 focus-visible ring은 묶음 H 정합 — `focus-visible:ring-2 focus-visible:ring-pastel-lavender focus-visible:ring-offset-2` 또는 동등. 검증 1회.

### loading (네트워크 공유 중)

- navigator.share Promise 진행 중 시각 표시 0(현행 유지) — share API는 즉시 시스템 시트 호출.

### disabled

- 본 라운드 disabled 상태 정의 0 (현행 유지).

## 4. 색·토큰 매핑

본 라운드 토큰 변경 0 — 검증만.

- ShareButton 활성색: 묶음 H `lavender/40` 정합 검증 (DESIGN.md §2.2 secondary role).
- 아이콘 stroke: 현행 (`text-foreground` 또는 `text-muted-foreground` 추정 — 코드 검증 1회).
- 페이지 슬롯 배경: 부모 페이지 셸 토큰 그대로 (`bg-background` cream canvas).

## 5. 인터랙션·동작

- 우상단 ShareButton: 클릭 → navigator.share 또는 클립보드 복사 → `share_click` 발사 (`position=top_right` 동봉).
- 중앙하단 ShareButton: 동일 + `position=bottom_center`.
- 사용자 동일 페이지에서 우상단·중앙하단 둘 다 클릭(articles): 각 클릭 별개 발사. 분석 단계에서 양쪽 카운트 합산.

## 6. 접근성

- ShareButton 컴포넌트의 ARIA 라벨·키보드 인터랙션은 현행 그대로 (검증 1회).
- focus-visible ring 의무 — 묶음 H 패턴 정합.
- 우상단·중앙하단 둘 다 등장하는 articles 케이스는 designer N1 ARIA 정합성 측면 단점 — measurement window 4주 한정 양보 결정. 4주 후 다운스코프 검토.
- 단일 페이지 내 두 ShareButton의 라벨 차등 — 우상단은 아이콘만, 중앙하단은 "이 글 공유하기" 텍스트 — 스크린리더가 두 요소를 다른 액션으로 인식하지 않도록 둘 다 동일 의미. ARIA `aria-label` 동일하게 박는 것 검증 1회.

## 7. 모바일 정합

- 320px 폭 검증: 우상단·중앙하단 슬롯 모두 페이지 wrapper `px-4` 안에서 정렬 — 줄바꿈·overflow 0 (현행 유지).

## 8. 다른 영역 영향

- 측정 파라미터 추가만 — phase-4.5.md §1.5 + ga4.md `share_click` 정의 갱신 의무. spec.md M4 참조.

## 9. won't (이번 범위 밖)

- ShareButton 위치 변경.
- ShareButton 시각 디자인 변경(토큰 교체 등).
- `share_click` 외 신규 이벤트 — share_method 분기 등 (페어 1 합의 = 없음).
