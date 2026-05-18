# UI 스펙 — 체중 트래커

> 대상 영역: 체중 (`/weight`)
> 페르소나/원칙: [../persona.md](../persona.md)
> 사용자 흐름·상태 모델: [ux.md](ux.md)
> 디자인 시스템 헌법: [DESIGN.md](../../../DESIGN.md)

---

## 1. 적용 범위

WeightContainer / WeightForm / WeightChart 3개 + 관련 글 카드.

---

## 2. 페이지 셸

```tsx
<div className="min-h-screen pb-24 px-4 bg-background">
  <h1 className="mb-2 text-center">체중 기록</h1>
  <PageDescription>...의료 면책...</PageDescription>
  <WeightChart logs={...} />
  {showAddForm && <WeightForm ... />}
  {/* 로그 리스트 또는 빈 상태 */}
  {/* 관련 글 카드 */}
  <button className="fixed fab-bottom-safe ...">FAB</button>
</div>
```

OK — `bg-background` 단색 사용, 그라디언트 위반 없음.

---

## 3. 토큰 매핑 (영역별 적용)

| 영역 | 컬러 토큰 | Radius | Shadow | 비고 |
|------|----------|--------|--------|------|
| 페이지 캔버스 | `--background` | — | — | OK |
| 차트 카드 | `--card + border-black/4` | `rounded-2xl` | `shadow-md` | 인풋 보유 (입력 폼)는 아님 — 검토. 정보 카드면 `shadow-sm` |
| 차트 라인 | `#FFD4DE` (pastel-pink) | — | — | **pink가 데이터 시각화 — peach 권장** §10 |
| 차트 그라디언트 | pink → lavender | — | — | 검토 필요 |
| ReferenceLine min | `#D0EDE2` (mint, 대시) | — | — | mint=success ✓ |
| ReferenceLine max | `#FFE0CC` (peach, 대시) | — | — | peach=data ✓ |
| 차트 grid | `#F8F6F4` | — | — | muted 톤 OK |
| 차트 axis | `#9CA0A4` (text-muted-foreground) | — | — | OK |
| WeightForm 카드 | `--card + border-black/4` | `rounded-2xl` | `shadow-md` | 인풋 보유 ✓ |
| 인풋 (date/number) | `--input-background + border-black/6` | `rounded-xl` | — | focus ring `ring-pastel-pink/50` |
| 제출 버튼 | `bg-pastel-pink hover:bg-pastel-pink-hover` | `rounded-xl` | — | primary CTA ✓ |
| 클로즈 버튼 (X) | `bg-muted hover:bg-muted/80` | `rounded-xl` | — | ghost OK |
| 로그 카드 | `--card + border-black/4` | `rounded-xl` (현재) → `rounded-2xl` 권장 | — | **radius 위반** §10 |
| 삭제 버튼 (호버) | `bg-red-50 text-red-500` (현재) | `rounded-xl` | — | **토큰 외 위반** — `bg-destructive/10 text-destructive` §10 |
| 빈 상태 | 텍스트 only | — | — | 📊 + 안내 |
| 관련 글 카드 | `bg-pastel-peach/10 + border-pastel-peach/40` | `rounded-2xl` | `shadow-sm hover:shadow-md` | peach=data ✓ |
| 관련 글 화살표 | "→" 텍스트 (현재) | — | — | **위반** — `<ChevronRight aria-hidden>` |
| FAB | `bg-pastel-pink` | `rounded-2xl w-14 h-14` | `shadow-lg` | primary CTA ✓ |

---

## 4. 컴포넌트 인벤토리

### 4.1 [WeightContainer](../../../src/components/weight/WeightContainer.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 페이지 wrapper | `min-h-screen pb-24 px-4` | OK |
| h1 | 글로벌 위계 | OK |
| 로그 카드 | `rounded-xl border-black/4 p-4 group` | radius 위반 — `rounded-2xl` |
| 로그 카드 행 | `flex items-center justify-between` | |
| 삭제 버튼 | `rounded-xl bg-red-50 text-red-500 opacity-0 group-hover:opacity-100` | 위반 |
| 관련 글 카드 | `rounded-2xl border-pastel-peach/40 bg-pastel-peach/10 hover:shadow-md` | OK |
| 관련 글 "→" | 텍스트 | 위반 |
| 빈 상태 | `text-center py-12 text-muted-foreground` + 📊 | OK |
| FAB | `fixed fab-bottom-safe right-6 w-14 h-14 rounded-2xl bg-pastel-pink shadow-lg` | OK |

### 4.2 [WeightForm](../../../src/components/weight/WeightForm.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 카드 | `rounded-2xl shadow-md border-black/4 mb-6` | OK |
| 헤더 | `<h3>` 제목 + X 버튼 | OK |
| 인풋 | `bg-input-background rounded-xl border-black/6 focus:ring-2 focus:ring-pastel-pink/50` | OK |
| 제출 | `bg-pastel-pink rounded-xl hover:bg-pastel-pink-hover w-full` | OK |
| 검증 toast | sonner 라이브러리 | OK |

### 4.3 [WeightChart](../../../src/components/weight/WeightChart.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 카드 | `rounded-2xl shadow-md border-black/4 mb-6` | 정보 카드 — `shadow-sm` 권장 |
| ResponsiveContainer | `height={240}` | OK |
| 차트 라이브러리 | Recharts | dynamic import (ssr: false) |
| LineChart | grid + 축 + tooltip + 참조선 + 라인 | |
| 라인 stroke | `#FFD4DE` (pink) | **위반** — peach 권장 §10 |
| 라인 그라디언트 | `weightGradient` linearGradient (pink → lavender) | 검토 |
| 활성 dot | `r=4 → r=6` | OK |
| Tooltip 커스텀 | white bg + `rounded-[12px]` | radius 토큰 외 — `rounded-xl`로 |
| 참조선 라벨 | text-[11px] muted | OK |
| 차트 하단 설명 | text-[11px] text-muted-foreground 3단락 | OK (의료 면책 포함) |

---

## 5. 위계 (Typography)

| 위계 | 시맨틱 | 시각 (글로벌) | 어디 |
|------|--------|---------------|------|
| Display | `<h1>` | `text-2xl/700` | "체중 기록" |
| Sub-section | `<h3>` | `text-lg/600` | WeightChart 제목 "체중 추이", WeightForm 제목 |
| Body | `<p>` | `text-base` | PageDescription |
| Caption | `text-xs` | 0.75rem | 로그 메타 (날짜) |
| Micro | `text-[11px]` | 11px/500 | 차트 axis·하단 설명 |

체중 영역은 글로벌 hN을 그대로 사용. **인라인 size override 위반 없음** ✓

---

## 6. 라디우스 / 섀도우 / 보더

| 요소 | 라디우스 | 보더 | 섀도우 |
|------|----------|------|--------|
| 차트 카드 | `rounded-2xl` | `border-black/4` | `shadow-md` (검토 — `shadow-sm`) |
| 폼 카드 | `rounded-2xl` | `border-black/4` | `shadow-md` ✓ |
| 로그 카드 | `rounded-xl` (현재) | `border-black/4` | — |
| 관련 글 카드 | `rounded-2xl` | `border-pastel-peach/40` | `shadow-sm hover:shadow-md` |
| FAB | `rounded-2xl` | — | `shadow-lg` |
| 인풋 | `rounded-xl` | `border-black/6` | — |
| Tooltip(Recharts) | `rounded-[12px]` | `1px solid rgba(0,0,0,0.06)` | `0 4px 12px rgba(0,0,0,0.06)` |

---

## 7. 아이콘

- **lucide-react**: Plus(FAB), Trash2(로그 행 삭제), X(폼 닫기), ChevronRight(관련 글 — 권장).
- **이모지**: 📊(빈 상태) — 페이지 헤더에는 사용 안 함(의료 도구 톤).

---

## 8. 모션

- **차트 모션**: Recharts 기본 (dot active, tooltip).
- **삭제 버튼**: `opacity-0 group-hover:opacity-100 transition-opacity`.
- **관련 글 카드**: `hover:shadow-md transition-shadow`.
- **FAB hover**: `hover:bg-pastel-pink-hover hover:shadow-xl`.
- **폼 펼침/닫힘**: 즉시 마운트/언마운트 (애니메이션 없음 — 검토 가능).

---

## 9. 반응형

- **320px**: 차트 가로폭이 좁을 때 ReferenceLine 라벨이 우측 잘림 — UX §10 검증.
- **375px / 414px**: 단일 컬럼.
- **차트 높이 240px 고정**: 모바일/데스크톱 동일. 데스크톱 더 크게 키울지 검토.

---

## 10. 알려진 UI 위반

| ID | 위반 | 위치 | 대응 |
|----|------|------|------|
| W-1 | 차트 라인 색 `#FFD4DE` (pink, CTA 토큰을 데이터 시각화에 사용) | [WeightChart.tsx:39,84-86](../../../src/components/weight/WeightChart.tsx) | peach(`#FFE0CC`)로 변경. ReferenceLine max와 충돌하면 라인은 peach, max는 다른 톤(예: peach 진한 버전)으로 |
| W-2 | 차트 카드 `shadow-md` (정보 카드) | [WeightChart.tsx:32](../../../src/components/weight/WeightChart.tsx) | `shadow-sm` |
| W-3 | 로그 카드 `rounded-xl` | [WeightContainer.tsx:81](../../../src/components/weight/WeightContainer.tsx) | `rounded-2xl` |
| W-4 | 삭제 버튼 `bg-red-50 text-red-500` (토큰 외) | [WeightContainer.tsx:97](../../../src/components/weight/WeightContainer.tsx) | `bg-destructive/10 text-destructive` |
| W-5 | 관련 글 "→" 텍스트 화살표 | [WeightContainer.tsx:120](../../../src/components/weight/WeightContainer.tsx) | `<ChevronRight aria-hidden>` |
| W-6 | Tooltip `rounded-[12px]` (토큰 외 radius) | [WeightChart.tsx](../../../src/components/weight/WeightChart.tsx) | `rounded-xl` (14px = `--radius`) |

> 위반 빈도 중간. 차트 색 결정(W-1)이 가장 임팩트 큼.

---

## 11. 변경 가이드

이 문서를 갱신하는 시점:

1. 차트 라이브러리 변경 (§4.3)
2. ReferenceLine 정책 변경 (§3) — Phase 5 BMI 강화 시 반드시
3. 토큰 매핑 변경 (§3)
4. 알려진 위반 해소 시 → §10 행 제거

UX 흐름·상태·접근성은 [ux.md](ux.md)에서 관리.
