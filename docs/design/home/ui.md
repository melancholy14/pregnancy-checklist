# UI 스펙 — 홈

> 대상 영역: 홈 (`/`)
> 페르소나/원칙: [../persona.md](../persona.md)
> 사용자 흐름·상태 모델: [ux.md](ux.md)
> 디자인 시스템 헌법: [DESIGN.md](../../../DESIGN.md)

---

## 1. 적용 범위

홈 페이지 (`HomeContent` 및 그 하위 컴포넌트)의 시각·토큰 적용을 명시. BottomNav·StickyHeader 같은 글로벌 셸은 별도 문서(미작성 — 영역 추가 시 `docs/design/shell/`)에서 관리.

---

## 2. 페이지 셸

```tsx
<div className="min-h-screen pb-24 px-4 bg-background">
  {/* HomeContent */}
</div>
```

- `bg-background` 단색. 그라디언트는 hero 블록 안에서만.
- StickyHeader는 홈에서 **렌더링되지 않음** ([StickyHeader.tsx:29](../../../src/components/layout/StickyHeader.tsx)에서 pathname 체크).

### 2.1 Hero 블록

```tsx
<div className="pt-14 pb-8 text-center">
  <div className="bg-linear-to-br from-pastel-pink via-pastel-lavender to-pastel-mint shadow-lg" />  {/* 원형 로고 */}
  <h1>출산 준비 체크리스트</h1>
  <div className="bg-linear-to-r from-pastel-pink to-pastel-lavender" />  {/* 라인 */}
</div>
```

- 그라디언트는 **hero 일러스트레이션 한정**. 페이지 배경에 절대 적용 금지.
- shadow-lg는 hero 한 컴포넌트에만 (DESIGN.md 6.1 hero/floating).

---

## 3. 토큰 매핑 (영역별 적용)

| 영역 | 컬러 토큰 | Radius | Shadow | 비고 |
|------|----------|--------|--------|------|
| 페이지 캔버스 | `--background` | — | — | 단색 |
| Hero 원형 로고 | `pink → lavender → mint` 그라디언트 | `rounded-full` | `shadow-lg` | 시그니처 |
| Hero 라인 | `pink → lavender` 그라디언트 | — | — | 1px |
| DueDateInput 카드 | `--card` + `border-black/4` | `rounded-2xl` | `shadow-md` | 인풋 보유 |
| 입력 필드 | `--input-background` | `rounded-xl` | — | focus ring `--ring` |
| 현재 주차 Badge | `bg-pastel-pink/60` | `rounded-md` | — | 데이터 라벨로 pink 사용 — 검토 필요 §10 |
| 재방문 웰컴 배너 | `bg-pastel-lavender/20 + border-pastel-lavender/30` | `rounded-2xl` | — | secondary surface |
| 정보 카드 (주차/Dday) | `--card` + `border-black/4` | `rounded-2xl` | `shadow-sm` | 정보 카드 표준 |
| 체크리스트 진행률 카드 | `--card` + `border-black/4` | `rounded-2xl` | `shadow-sm hover:shadow-md` | Link 래퍼 |
| 이번주 할 일 카드 | `--card` + `border-black/4` | `rounded-2xl` | `shadow-sm` | CTA 버튼은 lavender |
| CTA "타임라인에서 확인하기" | `bg-pastel-lavender` | `rounded-xl` | — | secondary CTA |
| 미입력 안내 팁 | `bg-pastel-yellow/20 + border-pastel-yellow/40` | `rounded-2xl` | — | info role |
| 미니 대시보드 카드 | `--card` + `border-black/4` | `rounded-2xl` | `shadow-sm hover:shadow-md` | hover lift `-translate-y-0.5` |
| 동기 부여 텍스트 | — (텍스트 only) | — | — | `text-muted-foreground` |

---

## 4. 컴포넌트 인벤토리

### 4.1 [HomeContent](../../../src/components/home/HomeContent.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 페이지 wrapper | `min-h-screen pb-24 px-4` | 페이지 셸 |
| Hero 원형 로고 | `bg-linear-to-br from-pastel-pink via-pastel-lavender to-pastel-mint shadow-lg` | 그라디언트는 여기만 허용 |
| h1 | 글로벌 `text-2xl/700` | 인라인 size override 없음 ✓ |
| 재방문 배너 | `bg-pastel-lavender/20 border border-pastel-lavender/30 rounded-2xl` | secondary |
| 2×1 정보 그리드 | `grid grid-cols-2 gap-3` 안 카드 각 `rounded-2xl border-black/4 shadow-sm` | |
| 체크리스트 진행률 카드 | `<Link>` + 카드 표준 | `hover:shadow-md transition-all` |
| 이번주 할 일 체크박스 | `pointer-events-none` + 비활성 시각만 | 토글 안 됨 |
| **체크박스 보더 위반** | `border-gray-200` (현재) | 토큰 외 — `border-black/4` 또는 `border-input`로 정정 |
| **CTA 텍스트 화살표 위반** | "타임라인에서 확인하기 →" (텍스트) | `<ChevronRight>` 아이콘으로 교체 |
| 미입력 안내 팁 | `bg-pastel-yellow/20 border-pastel-yellow/40 rounded-2xl p-4` | yellow=info role ✓ |
| 미니 대시보드 그리드 | `grid grid-cols-2 gap-3` | 4개 카드 동급 |
| 동기 부여 카피 | `mt-10 text-sm text-muted-foreground text-center` | |

### 4.2 [DueDateInput](../../../src/components/home/DueDateInput.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 카드 | `rounded-2xl shadow-md border-black/4` | 인풋 보유 → shadow-md OK |
| 라벨 | `text-sm` | |
| 인풋 | `bg-input-background border-black/6 rounded-xl text-center focus:ring-2 focus:ring-pastel-pink/50` | focus ring = brand pink |
| 현재 주차 Badge | `bg-pastel-pink/60` | pink가 데이터 라벨에 사용 — 결정 필요 |

### 4.3 [DashboardCard](../../../src/components/home/DashboardCard.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| Link 래퍼 | `block no-underline` | |
| 카드 | `rounded-2xl border border-black/4 hover:shadow-md hover:-translate-y-0.5` | hover lift 시그니처 |
| 아이콘 박스 | `w-8 h-8 rounded-lg style={{ backgroundColor }}` | 인라인 hex — **위반**(§10) |
| 타이틀 | `text-sm font-medium` | |
| 본문 슬롯 | `space-y-1 min-h-[40px]` | 카드 높이 일관성 위해 min-h |
| CTA | `text-xs text-muted-foreground` + `<ChevronRight size={12}>` | OK ✓ |

### 4.4 [BottomNav](../../../src/components/layout/BottomNav.tsx)

> 글로벌 셸이지만 홈에서 가장 노출되므로 참고용으로 포함.

| 요소 | 토큰 | 비고 |
|------|------|------|
| 컨테이너 | `fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-black/4 px-2 py-2 z-50 bottom-nav-safe` | DESIGN.md 7.4 표준 |
| 활성 항목 | `bg-pastel-pink/40 text-foreground rounded-2xl px-3 py-2` | DESIGN.md 표준 |
| 비활성 항목 | `text-muted-foreground hover:text-foreground` | |
| 아이콘 | `w-5 h-5` (DESIGN.md는 `w-6 h-6`) | 미세 불일치 — 검토 |
| 라벨 | `text-[11px] font-medium` | |

---

## 5. 위계 (Typography)

| 위계 | 시맨틱 | 시각 (글로벌) | 어디 |
|------|--------|---------------|------|
| Display | `<h1>` | `text-2xl/700` | "출산 준비 체크리스트" Hero |
| Sub-section | `<h3>` | `text-lg/600` | 미니 카드 타이틀 (현재는 `text-sm font-medium` — 검토) |
| Body | `<p>` | `text-base/400` | DueDateInput 라벨 등 |
| Caption | `text-xs` | 0.75rem | 메타·CTA 보조 |
| Micro | `text-[11px]` | 11px/500 | BottomNav 라벨 |

홈은 글로벌 hN을 거의 그대로 사용하는 **모범 영역**(체크리스트가 인라인 override로 깨졌던 문제 없음).

---

## 6. 라디우스 / 섀도우 / 보더

| 요소 | 라디우스 | 보더 | 섀도우 |
|------|----------|------|--------|
| 모든 카드 | `rounded-2xl` | `border-black/4` | `shadow-sm hover:shadow-md` |
| Hero 로고 | `rounded-full` | — | `shadow-lg` |
| DueDateInput 카드 | `rounded-2xl` | `border-black/4` | `shadow-md` (인풋 보유) |
| Pastel 안내 팁 | `rounded-2xl` | `border-pastel-yellow/40` | — |
| BottomNav | — | `border-t border-black/4` | — |
| 미니 카드 hover | — | — | `hover:shadow-md hover:-translate-y-0.5` |

---

## 7. 아이콘

- **Hero**: 이모지 없음. 그라디언트 로고가 시그니처.
- **미니 카드**: 영역 시그니처 이모지 또는 lucide 아이콘 1개. 사이즈 통일 필요(현재 16~20 혼재 — 점검).
- **CTA 화살표**: `<ChevronRight size={12~16}>` 일관. 텍스트 "→" 사용 금지.
- **BottomNav**: lucide `w-5 h-5` (DESIGN.md 권장 `w-6 h-6`와 미세 차이 — 검토).

---

## 8. 모션

- **카드 호버**: `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200~300` (DashboardCard 시그니처).
- **DueDateInput 입력 → 대시보드 펼침**: 페이지 리로드 없이 React 조건부 렌더. 현재 별도 트랜지션 없음 — 부드럽게 expand 검토 가능.
- **토스트**: sonner 라이브러리 기본 모션.
- **금지**: backdrop-blur(BottomNav 전용), 회전/바운스(과한 모션).

---

## 9. 반응형

- **320px**: Hero 그라디언트 로고가 너무 크지 않은지 점검. h1 한 줄 유지.
- **375px / 414px**: 단일 컬럼 + 미니 그리드 2×2 유지.
- **>1024px**: 가운데 자연 정렬. 미니 그리드는 그대로 2×2 (4×1로 펼치지 않음).

---

## 10. 알려진 UI 위반

| ID | 위반 | 위치 | 대응 |
|----|------|------|------|
| H-1 | 체크박스 `border-gray-200` (토큰 외) | [HomeContent.tsx:261](../../../src/components/home/HomeContent.tsx) | `border-black/4` 또는 `border-input` |
| H-2 | "타임라인에서 확인하기 →" 텍스트 화살표 | [HomeContent.tsx:277](../../../src/components/home/HomeContent.tsx) | `<ChevronRight>` 교체 |
| H-3 | 미니 카드 4번째 아이콘 배경 `#E0F0FF` (토큰 외) | [HomeContent.tsx:370](../../../src/components/home/HomeContent.tsx), [DashboardCard.tsx:34](../../../src/components/home/DashboardCard.tsx) | 토큰 내 색으로 교체 (예: `pastel-lavender`) 또는 새 토큰 정의 |
| H-4 | 현재 주차 Badge가 `bg-pastel-pink/60` (pink=CTA 역할인데 데이터 라벨) | [DueDateInput.tsx](../../../src/components/home/DueDateInput.tsx) | 결정 — pink 유지(첫 등록 직후 축하 의미) vs lavender/mint로 교체 |
| H-5 | BottomNav 아이콘 `w-5 h-5` (DESIGN.md 권장 `w-6 h-6`) | [BottomNav.tsx](../../../src/components/layout/BottomNav.tsx) | 글로벌 셸 결정 — 사이트 전체 일괄 |

---

## 11. 변경 가이드

이 문서를 갱신하는 시점:

1. 토큰 적용 변경 (§3, §4)
2. 위계 재배정 (§5)
3. 모션 정책 변경 (§8)
4. 알려진 위반 해소 시 → §10 행 제거 + 본문 정정
5. 새 컴포넌트 추가 시 → §4에 행 추가

UX 흐름·상태·접근성은 [ux.md](ux.md)에서 관리.
