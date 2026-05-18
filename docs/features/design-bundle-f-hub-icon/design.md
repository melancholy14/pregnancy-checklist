# design-bundle-f-hub-icon — 디자인 변경표

> 작성일: 2026-05-10
> 시각 시안 없음. 마크업 before→after만.
> spec: [./spec.md](./spec.md)

## 1. ChecklistHub 타임라인 카드 아이콘 슬롯

[ChecklistHub.tsx:121-156](../../../src/components/checklist/ChecklistHub.tsx#L121-L156) `TimelineCard` 함수.

### before

```tsx
<Card className="rounded-2xl shadow-sm border border-black/4 hover:shadow-md transition-all duration-200">
  <CardContent className="p-5">
    <div className="flex items-start gap-3">
      <span className="w-12 h-12 rounded-2xl bg-pastel-pink/40 flex items-center justify-center shrink-0">
        <Calendar size={24} className="text-foreground" />
      </span>
      <div className="flex-1 min-w-0">
        ...
      </div>
    </div>
  </CardContent>
</Card>
```

### after

```tsx
<Card className="rounded-2xl shadow-sm border border-black/4 hover:shadow-md transition-all duration-200">
  <CardContent className="p-5">
    <div className="flex items-start gap-3">
      <span className="text-3xl shrink-0" aria-hidden>
        🗓️
      </span>
      <div className="flex-1 min-w-0">
        ...
      </div>
    </div>
  </CardContent>
</Card>
```

### 다른 3장과의 정합 (참조)

[ChecklistHub.tsx:65-67](../../../src/components/checklist/ChecklistHub.tsx#L65-L67) `ChecklistCard` 함수:

```tsx
<span className="text-3xl shrink-0" aria-hidden>
  {icon}
</span>
```

본 라운드 변경 후 4장 모두 동일한 마크업.

---

## 2. import 정리

[ChecklistHub.tsx](../../../src/components/checklist/ChecklistHub.tsx) 상단:

before
```tsx
import { Calendar, ChevronRight } from "lucide-react";
```

after (만약 `Calendar`이 `ChecklistHub.tsx` 안 다른 곳에서 사용되지 않으면)
```tsx
import { ChevronRight } from "lucide-react";
```

`ChevronRight`은 line 71, 132에서 카드 우측 끝 화살표로 사용 — 유지.

---

## 3. 토큰 매핑 요약

| 영역 | 변경 |
|---|---|
| 컨테이너 배경 | `bg-pastel-pink/40` 제거 (pink CTA 토큰 침범 해소) |
| 컨테이너 사이즈 | `w-12 h-12 rounded-2xl flex items-center justify-center` 제거 |
| 아이콘 | lucide `<Calendar size={24}>` → 이모지 `🗓️` |
| 폰트 크기 | `text-3xl` (다른 3장과 동일) |
| 접근성 | `aria-hidden` 보존 |

새로 도입되는 토큰 0개. 기존 패턴(`text-3xl shrink-0` aria-hidden) 재사용.

---

## 4. 5-pastel role 정합 효과

| 위반 | 해소 |
|---|---|
| 페르소나 AP1: "pink는 CTA 전용. 데이터 라벨에 사용 X" | 타임라인 카드 컨테이너의 `bg-pastel-pink/40` 제거 |
| §2.4 M5: "4장 중 1장만 시각 패턴이 다름" | 4장 모두 큰 이모지 단독 패턴으로 정렬 |
| 카드 시각 위계가 타임라인 카드만 강해짐 | 4장 동일 무게 |
