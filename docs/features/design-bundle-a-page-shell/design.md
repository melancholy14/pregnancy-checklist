# design-bundle-a-page-shell — 디자인 변경표

> 작성일: 2026-05-10
> 시각 시안 없음. 토큰·마크업 before→after 표만.
> spec: [./spec.md](./spec.md)

## 1. 페이지 셸 (Cross-3 / C2·T-1)

영향: 체크리스트 허브, 체크리스트 상세, 타임라인. (체크리스트·타임라인이 한 사용자가 가장 자주 오가는 두 페이지라 이 라운드에서 가장 체감 큼.)

### before
```tsx
<div className="min-h-screen pb-24 px-4 bg-linear-to-b from-background to-white">
  ...
</div>
```

### after
```tsx
<div className="min-h-screen pb-24 px-4 bg-background">
  ...
</div>
```

### 근거 (헌법)
[DESIGN.md §1](../../../DESIGN.md): "Warm canvas, not white. The page floor is `#FFFAF7`."
[DESIGN.md §10 Don't](../../../DESIGN.md): "Don't use pure white as the page background. The cream is the brand differentiator."

그라디언트 끝점이 `white`이면 스크롤 하단이 클리니컬해져 cream brand가 깨진다. 단색 `bg-background`로 정렬.

---

## 2. 페이지-레벨 카드 radius (C3·T-6·T-7·W-3)

영향: 체크리스트 서브카테고리 카드, 타임라인 주차 카드, 타임라인 기타 섹션 카드, 체중 로그 카드.

### before
```tsx
<Card className="rounded-xl border border-black/4">  {/* 또는 ${...} 변형 */}
```

### after
```tsx
<Card className="rounded-2xl border border-black/4">  {/* 또는 ${...} 변형 */}
```

### 근거 (헌법)
[DESIGN.md §5.1](../../../DESIGN.md): "page-level cards prefer `rounded-2xl`."
[DESIGN.md §7.2](../../../DESIGN.md): default content card → `rounded-2xl border border-black/4 bg-card text-card-foreground shadow-sm`.
의도된 비대칭: card=`rounded-2xl`(16px), button=`rounded-xl`(18px). 카드보다 버튼이 더 둥근 게 "버튼이 더 부드럽고 탭하기 좋다"는 시그널.

---

## 3. C1(우선순위 색 재매핑) — 적용 완료, 변경 없음

[ChecklistItemRow.tsx:12-16](../../../src/components/checklist/ChecklistItemRow.tsx#L12-L16):

```tsx
const PRIORITY_DOT: Record<ChecklistItem["priority"], { className: string; label: string }> = {
  high: { className: "bg-accent-red", label: "높음" },
  medium: { className: "bg-accent-olive", label: "보통" },
  low: { className: "bg-accent-green", label: "낮음" },
};
```

이미 `accent-*` 토큰의 색 점(dot)으로 다운그레이드되어 5-pastel role(pink=CTA / yellow=info / mint=success)을 침범하지 않는다. §2.3 C1의 "권장 매핑: 아이콘+텍스트 다운그레이드" 옵션이 적용된 상태. **본 라운드 변경 없음.**

---

## 4. 토큰 매핑 요약

| 변경 영역 | 사용 토큰 |
|---|---|
| 페이지 셸 배경 | `--background` (`#FFFAF7`) |
| 페이지-레벨 카드 radius | `rounded-2xl` (Tailwind 16px) |

새로 도입되는 토큰 0개. 기존 `globals.css` 토큰만 사용.
