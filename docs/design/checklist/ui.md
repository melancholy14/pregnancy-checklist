# UI 스펙 — 출산 준비 체크리스트

> 대상 영역: 체크리스트 허브(`/checklist`) + 출산가방·남편준비·임신준비 3종 + 타임라인 연동
> 페르소나/원칙: [persona.md](../persona.md)
> 사용자 흐름·상태 모델: [ux.md](ux.md)
> 디자인 시스템 헌법: [DESIGN.md](../../../DESIGN.md)
> 알려진 위반/개선 백로그: [../phase-4.5/plan.md §2](../../phase-4.5/plan.md)

---

## 1. 적용 범위

이 문서는 **체크리스트 영역의 시각·토큰 적용을 명시**한다. 헌법인 [DESIGN.md](../../../DESIGN.md)와 충돌하지 않으며, 충돌 시 헌법이 우선. 영역 밖 컴포넌트(아티클·타임라인·체중)는 별도 UI 스펙 문서에서 관리(현재 미작성).

---

## 2. 페이지 셸

### 2.1 페이지 래퍼

```tsx
<div className="min-h-screen pb-24 px-4 bg-background">
  {/* content */}
</div>
```

- `bg-background` (`#FFFAF7`) 단색. **그라디언트 to-white 금지** ([persona §5 AP2](../persona.md)).
- `pb-24`로 BottomNav 안전영역 확보.
- `px-4` 좌우 마진. `max-w-*` 컨테이너 미사용.

### 2.2 페이지 헤더

```tsx
<h1 className="mb-2 text-center">
  <span className="mr-1.5">{icon}</span>{title}
</h1>
<PageDescription>{description}</PageDescription>
```

- h1은 글로벌 hierarchy(`text-2xl/700`)에 맡김. **인라인 size override 금지** ([persona §5 AP3](../persona.md)).
- 이모지는 1개. 시그니처(✅) 또는 카테고리(🧳·👨·🤰).

---

## 3. 토큰 매핑 (영역별 적용)

| 영역 | 컬러 토큰 | Radius | Shadow | 비고 |
|------|----------|--------|--------|------|
| 페이지 캔버스 | `--background` (`bg-background`) | — | — | 단색 |
| 카드 (정보·콘텐츠) | `--card` (`bg-card`) | `rounded-2xl` | `shadow-sm` | 진행률·관련 콘텐츠 모두 동일 |
| 카드 (인풋 보유) | `--card` | `rounded-2xl` | `shadow-md` | 추가/편집 폼 (input 포함) |
| 보더 | `--border` (`border-black/4`) | — | — | whisper hairline |
| 인풋 well | `--input-background` | `rounded-xl` | — | placeholder는 `--muted-foreground` |
| 서브카테고리 칩 | `bg-pastel-lavender/30` + `text-foreground` | `rounded-md` | — | text-[11px] |
| 진행 강조 메시지 | `text-accent-green` | — | — | 25/50/75/100 |
| 체크된 행 배경 | `bg-pastel-mint/20` | `rounded-xl` | — | + `line-through` + `text-muted-foreground` |
| 호버 배경 (미체크 행) | `bg-muted/50` | `rounded-xl` | — | hover only |
| FAB | `bg-pastel-lavender` (현재) | `rounded-2xl` | `shadow-lg` | 컨벤션 결정 대기 — [phase-4.5 §2.4 M2](../../phase-4.5/plan.md) |
| 추가 폼 카드 | `bg-pastel-lavender/10 + border-pastel-lavender/30` | `rounded-2xl` | `shadow-md` | 인풋 보유 |
| 관련 콘텐츠 링크 | `text-accent-purple` + `hover:bg-pastel-lavender/10` | `rounded-lg` | — | DESIGN.md 4.4 prose-accent와 일관 |

---

## 4. 컴포넌트 인벤토리

### 4.1 [ChecklistHub](../../../src/components/checklist/ChecklistHub.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 카드 컨테이너 | `rounded-2xl border border-black/4 bg-card shadow-sm hover:shadow-md` | 정보 카드 표준 |
| 카드 패딩 | `p-5` | DESIGN.md 4.1 12~16px 사이 |
| 아이콘 (3종 카드) | 이모지 단독 `text-3xl` | 패턴 통일 결정 대기 — [phase-4.5 §2.4 M5](../../phase-4.5/plan.md) |
| 아이콘 (타임라인) | `w-12 h-12 rounded-2xl bg-pastel-pink/40` 컨테이너 + Calendar | 동일 케이스. pink 사용은 §2.4 M6 검토 대상 |
| 카드 타이틀 | 시맨틱 `<h3>` 권장 (현재 `<h2 + text-[15px]>` 위반 — [§2.3 C4](../../phase-4.5/plan.md)) | |
| 서브카테고리 칩 | `text-[11px] px-2 py-0.5 rounded-md bg-pastel-lavender/30 text-foreground` | 항상 lavender. mint/yellow 사용 금지(타임라인 카드 예외 검토) |
| 진행 바 | `<Progress h-1.5 bg-muted />` + `text-[11px] tabular-nums text-muted-foreground` | |

### 4.2 [ChecklistPage](../../../src/components/checklist/ChecklistPage.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 섹션 헤더 | 시맨틱 `<h3>` 권장 | 현재 `<h2 + text-[15px]>` 위반 |
| 섹션 그룹 카드 | `rounded-2xl` 권장 | 현재 `rounded-xl` 위반 — [§2.3 C3](../../phase-4.5/plan.md) |
| 그룹 카드 패딩 | `p-2 space-y-1` | 행이 스스로 패딩을 가짐 |
| FAB 위치 | `fixed fab-bottom-safe right-6 w-14 h-14` | DESIGN.md 4.4 BottomNav 회피 |

### 4.3 [ChecklistProgress](../../../src/components/checklist/ChecklistProgress.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 카드 | `rounded-2xl border border-black/4` + **`shadow-sm` 권장** | 현재 `shadow-md` 위반 — [persona §5 AP6](../persona.md) |
| 전체 진행 바 | `<Progress h-2 bg-muted />` | |
| 서브카테고리 진행 바 | `<Progress h-1 bg-muted />` | 시각적 무게 차로 위계 표현 |
| 마이크로카피 | `text-xs text-accent-green font-medium` | 25%↑ 부터 노출 |

### 4.4 [ChecklistItemRow](../../../src/components/checklist/ChecklistItemRow.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 미체크 행 | `flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50` | 행 자체는 카드 아닌 inset row → `rounded-xl` OK |
| 체크된 행 | `bg-pastel-mint/20` + 텍스트 `line-through text-muted-foreground` | mint=success role |
| 편집 모드 행 | `border border-pastel-lavender/30 bg-pastel-lavender/10 rounded-xl` | lavender=secondary surface |
| Checkbox | `size-5 mt-0.5 rounded-md border-2 data-[state=checked]:bg-pastel-mint data-[state=checked]:border-pastel-mint border-gray-200` | **`border-gray-200`은 토큰 외** — `border-black/4` 또는 `border-input`으로 정정 권장 ([persona §5 AP7](../persona.md)) |
| 노트 라인 | `text-xs text-muted-foreground` + `<Info size={11}>` | 현재 미체크 시만 노출 — 체크 후 유지 결정 대기 |
| 우선순위 배지 (current 위반) | high=`bg-pastel-pink/60 text-accent-red` / med=`bg-pastel-yellow/60 text-accent-olive` / low=`bg-pastel-mint/60 text-accent-green` | **5-pastel role 위반** — [§2.3 C1](../../phase-4.5/plan.md). 재매핑 또는 시각 다운그레이드 결정 대기 |
| 편집 아이콘 버튼 | `p-1.5 rounded-lg text-muted-foreground hover:text-accent-purple hover:bg-pastel-lavender/20` | OK |

### 4.5 [ChecklistAddForm](../../../src/components/checklist/ChecklistAddForm.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 폼 카드 | `rounded-2xl border border-pastel-lavender/30 bg-pastel-lavender/10 shadow-md` | 인풋 보유 → shadow-md OK |
| 라벨 | `text-sm text-muted-foreground` | |
| 필수 표시 | `text-destructive` 권장 | 현재 `text-red-400` 토큰 외 — [§2.5](../../phase-4.5/plan.md) |
| 인풋 / 셀렉트 | `rounded-xl border border-black/6 bg-white text-sm focus:ring-2 focus:ring-pastel-lavender/50` | |
| 추가 버튼 | `rounded-xl bg-pastel-lavender text-foreground hover:bg-pastel-lavender/80` | secondary CTA |
| 취소 버튼 | shadcn `variant="ghost"` + `rounded-xl` | |

### 4.6 [ChecklistRelatedContent](../../../src/components/checklist/ChecklistRelatedContent.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 카드 | `rounded-2xl border border-black/4` + **`shadow-sm` 권장** | 현재 `shadow-md` 위반 |
| 섹션 헤더 | `text-sm font-medium` + 이모지 💡 | 동급으로 글/타임라인/영상 |
| 카테고리 라벨 | `text-xs text-muted-foreground font-medium` + lucide 아이콘 13px | |
| 링크 | `text-sm text-accent-purple hover:bg-pastel-lavender/10 rounded-lg px-2 py-1.5 -mx-2` | hover 영역 inset |
| 화살표 | `<ChevronRight aria-hidden>` 권장 | 현재 텍스트 "→" — [§2.5](../../phase-4.5/plan.md) |

---

## 5. 위계 (Typography)

> DESIGN.md §3.2의 **글로벌 hN을 그대로 사용**. 인라인 size 덮어쓰기 금지.

체크리스트 영역에서 사용하는 위계:

| 위계 | 시맨틱 | 시각 (글로벌) | 어디 |
|------|--------|---------------|------|
| Display | `<h1>` | `text-2xl/700` | 페이지 제목 |
| Sub-section | `<h3>` | `text-lg/600` | 카드 타이틀, 섹션 헤더 (현재 `<h2 + text-[15px]>` 위반) |
| Card title | `<h4>` | `text-base/600` | 추가 폼 헤더 (현재 `<h3 + text-[15px]>` — 검토) |
| Body | `<p>` 또는 `<span>` | `text-base/400 leading-relaxed` | 항목 타이틀 (실제는 `text-sm` 사용 — 행 컴팩션) |
| Caption | `text-xs` | 0.75rem/400 | 메타·노트·카운트 |
| Micro | `text-[11px]` | 11px/500 | 서브카테고리 칩 |

**예외 허용**: 체크리스트 항목 텍스트(`text-sm`)는 행 밀도를 위해 body보다 작게 유지. 단, 노트(`text-xs`)와의 위계 차이는 보존.

---

## 6. 라디우스 / 섀도우 / 보더

| 요소 | 라디우스 | 보더 | 섀도우 |
|------|----------|------|--------|
| 페이지 카드 | `rounded-2xl` | `border-black/4` | `shadow-sm` |
| 인풋 보유 카드 (폼) | `rounded-2xl` | pastel/30 톤 | `shadow-md` |
| 인풋·셀렉트 | `rounded-xl` | `border-black/5~6` | — |
| 버튼 (form) | `rounded-xl` | — | — |
| 칩·배지 | `rounded-md` (micro) / `rounded-lg` (small) | `border-0` (pastel 위) | — |
| 행 | `rounded-xl` | — | — |
| FAB | `rounded-2xl` | — | `shadow-lg` |

**비대칭 의도**: 카드(`rounded-2xl` = 16px) > 버튼(`rounded-xl` = 18px). 버튼이 카드보다 살짝 더 둥글어 더 "탭하고 싶게" 보임.

---

## 7. 아이콘

- **라이브러리**: `lucide-react` 단일.
- **사이즈**: 본문 동반 `w-4 h-4`(16) / 메타 `13`(`size={13}`) / 행 액션 `14` / 카드 헤더 `18` / FAB `24`.
- **색**: 보조는 `text-muted-foreground`, 액티브/링크 호버는 `text-accent-purple`.
- **이모지**: 페이지 시그니처(h1) 1개 + 100% 도달 셀러브레이션 1개. 본문·배지·칩에 사용 금지.

---

## 8. 모션

- **카드 호버**: `hover:shadow-md transition-all duration-200` 또는 `transition-shadow`.
- **체크 토글**: 배경·라인스루 `transition-all duration-200`.
- **진행 바**: shadcn `Progress` 기본 애니메이션. 추가 트랜지션 미적용 — 성취감 강화 위해 width transition 검토 대상.
- **FAB**: hover 시 `hover:bg-pastel-lavender/80 hover:shadow-xl`.

**금지**: backdrop-blur (BottomNav 전용), 컨페티(검토 대상이지만 100% 도달 시에만 한정).

---

## 9. 반응형

- **320px**: 모든 행이 깨짐 없이 표시. 항목 타이틀 2줄까지 허용. 우선순위 배지·액션 아이콘은 행 우측에서 wrap 안 되어야 함.
- **375px / 414px**: 동일 단일 컬럼.
- **>1024px**: 가운데 자연 정렬. 컨테이너 `max-w` 미적용. 카드 폭은 `px-4` 마진만으로 결정.

---

## 10. 알려진 UI 위반 (요약)

> 상세: [../phase-4.5/plan.md §2](../../phase-4.5/plan.md)

| ID | 위반 | 대응 묶음 |
|----|------|-----------|
| C1 | 우선순위 배지가 5-pastel role 교차 | A |
| C2 | 페이지 배경 그라디언트 to-white | A |
| C3 | 항목 그룹 카드 `rounded-xl` (2xl이어야) | A |
| C4 | h2 인라인 사이즈 오버라이드 | C |
| M1 | row `role="button"` + 내부 인터랙티브 | B |
| M2 | FAB 색 컨벤션 미합의 | (결정) |
| M3 | 행 우측 액션 + 배지 충돌 | E |
| M4 | 노트 체크 시 사라짐 | E |
| M5 | 허브 카드 아이콘 패턴 비일관 | F |
| M6 | "37주차" 핀 pink 과강조 | F |
| Minor1 | 정보 카드 `shadow-md` | E |
| Minor2 | `text-red-400` 하드코딩 | E |
| Minor3 | "→" 텍스트 화살표 | E |
| Minor4 | Checkbox `border-gray-200` 토큰 외 | E |

---

## 11. 변경 가이드

이 문서를 갱신하는 시점:

1. 토큰 적용 변경 (§3, §4)
2. 위계 재배정 (§5)
3. 모션 정책 변경 (§8)
4. 알려진 위반 해소 시 → §10 행 제거 + 본문 정정
5. 새 컴포넌트 추가 시 → §4에 행 추가

UX 흐름·상태·접근성은 [ux.md](ux.md)에서 관리.
