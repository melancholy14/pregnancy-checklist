# design-bundle-b-i-row-tokens 디자인 문서

> 작성일: 2026-05-10
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

### 묶음 B
- B-1: 액션 버튼 = label 형제 + flex inline.
- B-2: `ChecklistRow` 공통 컴포넌트 추출 (`src/components/checklist/ChecklistRow.tsx`).
- B-3: sr-only 카피 = `우선순위 {priority.label}`.
- B-4: visual checkbox 토큰 = 공통 컴포넌트 className 직접 (Tailwind peer-checked).
- B-5: phase-4.5.md §2.9 Cross-5 SoT 정정 본 라운드.
- B-6: E2E 셀렉터 = `getByRole("checkbox", { name: ... })` 마이그레이션.

### 묶음 I
- I-1: 헬퍼 반환 = 정적 union literal 타입 (pink 제외 4 pastel × 2 alpha).
- I-2: SCALE_CONFIG.large + CATEGORY_COLORS.hospital + CITY_COLORS pink 도시 정정 본 라운드.
- I-3: 헬퍼 반환 = 단일 클래스 문자열 (배경 + 텍스트).
- I-4: DESIGN.md §10/§12에 1단락 추가.
- I-5: 도시 매핑 = 행정구역 4개 그룹.
- I-6: DashboardCard prop = semantic slot key.

## 1. 화면 목록·플로우

본 라운드는 row 마크업 + 색 매핑 layer 변경. 화면 자체 신규 없음.

- **체크리스트** (`/checklist/<slug>`): ChecklistPage가 `<ChecklistItemRow>` 렌더 → wrapper가 form 분기 + `<ChecklistRow>` 호출.
- **타임라인** (`/timeline`): TimelineContainer/TimelineAccordionCard가 `<WeekChecklistSection>` 렌더 → wrapper가 form 분기 + 진행률 바 + items.map 안 `<ChecklistRow>` 호출. 카테고리 Badge className은 `getCategoryTokenClass` 결과.
- **home** (`/`): DashboardCard 4개 미니카드 — 아이콘 배경 헬퍼 결과(G 묶음 결과 그대로).
- **baby-fair** (`/baby-fair`): 도시 Badge 17개 → 4 그룹별 색. 규모 Badge `large` pink → peach.

### 인터랙션 분기 (B 묶음)

- **분기 A (일반 행)**: row 클릭/탭/Enter/Space → input.checked 토글 → checked 상태 UI 갱신 + GA4(`checklist_check`, 조건부 `recommended_item_check`).
- **분기 B (편집 모드, isCustom + isEditing)**: row 마크업 X — wrapper가 form 마크업 렌더. `ChecklistRow` 영역 외.
- **분기 C (체크된 상태)**: visual span = `bg-pastel-mint`, label = `bg-pastel-mint/20`, title `line-through text-muted-foreground`, note `line-through`.
- **분기 D (이번 주 추천 + 미체크)**: title 아래 CalendarCheck 아이콘 + "이번 주 추천".
- **분기 E (예정 주차 + 미체크 + 본문 컨텍스트)**: title 아래 Clock 아이콘 + "X주차에 챙기기".
- **분기 F (legal note)**: note 영역에 Scale 아이콘 + italic.
- **분기 G (커스텀 항목)**: 행 우측에 편집(Pencil) + 삭제(DeleteConfirmDialog).

### 인터랙션 분기 (I 묶음)

- 색 매핑 layer만 변경 — interactive 분기 변화 0.

## 2. 컴포넌트

### 신규
- [src/lib/data-token-classes.ts](../../../src/lib/data-token-classes.ts) — 헬퍼 1파일.
- [src/components/checklist/ChecklistRow.tsx](../../../src/components/checklist/ChecklistRow.tsx) — 공통 row 컴포넌트.

### 재사용·확장
- [src/components/checklist/ChecklistItemRow.tsx](../../../src/components/checklist/ChecklistItemRow.tsx) — wrapper화 (form 분기 + useEffect + ChecklistRow 호출).
- [src/components/timeline/WeekChecklistSection.tsx](../../../src/components/timeline/WeekChecklistSection.tsx) — wrapper화 (form 분기 + handleToggleItem + 진행률 바 + ChecklistRow 호출 + getCategoryTokenClass 호출).
- [src/components/babyfair/BabyfairCard.tsx](../../../src/components/babyfair/BabyfairCard.tsx) — `SCALE_CONFIG.color`·`CITY_COLORS` 제거 + 헬퍼 호출.
- [src/components/home/DashboardCard.tsx](../../../src/components/home/DashboardCard.tsx) — `color` prop → `slot` prop + 헬퍼 호출.
- [src/components/home/HomeContent.tsx](../../../src/components/home/HomeContent.tsx) — DashboardCard 호출 4건 prop 변경.
- [src/components/ui/checkbox.tsx](../../../src/components/ui/checkbox.tsx) — Radix Checkbox. row에서 미사용 처리, 다른 곳 잔존.
- [DESIGN.md](../../../DESIGN.md) — §10/§12 1단락 추가.
- [phase-4.5.md](../../plan/phase-4.5.md) — §2.9·§2.10 본문 정정.
- lucide-react `CheckIcon`·`CalendarCheck`·`Clock`·`Info`·`Scale`·`Pencil` — 기존 import.

## 3. 헬퍼 시그니처 (묶음 I)

### 3.1 핵심 타입

```ts
// pink 제외 4 pastel × 2 alpha = 8종 정적 클래스 문자열 (text-foreground 묶음)
export type DataToneClass =
  | "bg-pastel-lavender/20 text-foreground"
  | "bg-pastel-lavender/40 text-foreground"
  | "bg-pastel-mint/20 text-foreground"
  | "bg-pastel-mint/40 text-foreground"
  | "bg-pastel-peach/20 text-foreground"
  | "bg-pastel-peach/40 text-foreground"
  | "bg-pastel-yellow/20 text-foreground"
  | "bg-pastel-yellow/40 text-foreground";

// home 미니카드(CTA 진입 슬롯) 전용 — pink 허용
export type DashboardSlotClass =
  | DataToneClass
  | "bg-pastel-pink/40 text-foreground";

export type CityGroup = "metropolitan" | "metro_city" | "yeongnam" | "other";
export type DashboardSlot = "checklist" | "timeline" | "weight" | "info";
```

### 3.2 매핑 객체 + named export

```ts
import type { ChecklistItem } from "@/types/checklist";

const CITY_TO_GROUP: Record<string, CityGroup> = {
  서울: "metropolitan",
  "서울(마곡)": "metropolitan",
  인천: "metropolitan",
  경기: "metropolitan",
  수원: "metropolitan",
  "수원(광교)": "metropolitan",
  "고양(일산)": "metropolitan",
  부산: "metro_city",
  대구: "metro_city",
  광주: "metro_city",
  대전: "metro_city",
  창원: "yeongnam",
  김해: "yeongnam",
  경주: "yeongnam",
  청주: "other",
  강릉: "other",
  익산: "other",
  순천: "other",
};

const CITY_GROUP_TO_TONE: Record<CityGroup, DataToneClass> = {
  metropolitan: "bg-pastel-lavender/40 text-foreground",
  metro_city: "bg-pastel-peach/40 text-foreground",
  yeongnam: "bg-pastel-mint/40 text-foreground",
  other: "bg-pastel-yellow/40 text-foreground",
};

const SCALE_TO_TONE: Record<string, DataToneClass> = {
  large: "bg-pastel-peach/40 text-foreground",   // pink → peach 재매핑
  medium: "bg-pastel-yellow/40 text-foreground",
  small: "bg-pastel-lavender/40 text-foreground",
};

const CATEGORY_TO_TONE: Record<ChecklistItem["category"], DataToneClass> = {
  hospital: "bg-pastel-peach/40 text-foreground",  // pink → peach 재매핑
  hospital_bag: "bg-pastel-peach/40 text-foreground",
  baby_items: "bg-pastel-mint/40 text-foreground",
  postpartum: "bg-pastel-lavender/40 text-foreground",
  admin: "bg-pastel-yellow/40 text-foreground",
};

const DASHBOARD_SLOT_TO_TONE: Record<DashboardSlot, DashboardSlotClass> = {
  checklist: "bg-pastel-pink/40 text-foreground",
  timeline: "bg-pastel-mint/40 text-foreground",
  weight: "bg-pastel-peach/40 text-foreground",
  info: "bg-pastel-lavender/40 text-foreground",
};

const DEFAULT_TONE: DataToneClass = "bg-pastel-lavender/40 text-foreground";

// ────────── named export ──────────

export function getCityTokenClass(city: string): DataToneClass {
  const group = CITY_TO_GROUP[city];
  return group ? CITY_GROUP_TO_TONE[group] : DEFAULT_TONE;
}

export function getScaleTokenClass(scale: string): DataToneClass {
  return SCALE_TO_TONE[scale] ?? DEFAULT_TONE;
}

export function getCategoryTokenClass(category: ChecklistItem["category"]): DataToneClass {
  return CATEGORY_TO_TONE[category] ?? DEFAULT_TONE;
}

export function getDashboardIconBgClass(slot: DashboardSlot): DashboardSlotClass {
  return DASHBOARD_SLOT_TO_TONE[slot];
}
```

### 3.3 호출부 매트릭스 (변환 전·후)

#### A. BabyfairCard (city + scale)

```tsx
// before
const SCALE_CONFIG = {
  large: { label: "대형", color: "#FFD4DE" },     // ⚠️ pink
  medium: { label: "중형", color: "#FFF4D4" },
  small: { label: "소형", color: "#E4D6F0" },
};
const CITY_COLORS = { 서울: "#FFD4DE", ... };       // ⚠️ pink + 17줄 hex
<Badge style={{ backgroundColor: SCALE_CONFIG[event.scale].color }}>{label}</Badge>
<Badge style={{ backgroundColor: color }}>{event.city}</Badge>

// after
import { getCityTokenClass, getScaleTokenClass } from "@/lib/data-token-classes";

const SCALE_LABELS: Record<string, string> = { large: "대형", medium: "중형", small: "소형" };

<Badge className={`rounded-md text-xs border-0 px-2 py-1 font-medium ${getScaleTokenClass(event.scale)}`}>
  {SCALE_LABELS[event.scale]}
</Badge>
<Badge className={`rounded-md text-sm border border-black/4 px-3 py-1 font-medium ${getCityTokenClass(event.city)}`}>
  {event.city}
</Badge>
```

#### B. WeekChecklistSection (category, ChecklistRow 호출 결합)

```tsx
// before — 인라인 hex map + row-as-button 마크업
const CATEGORY_COLORS = { hospital: "#FFD4DE", ... };  // ⚠️ pink
const catColor = CATEGORY_COLORS[item.category] ?? "#E4D6F0";
<div role="button" tabIndex={0} aria-pressed onClick onKeyDown aria-label="...">
  <Checkbox ... onClick={(e) => e.stopPropagation()} />
  <div>{title}</div>
  <Badge style={{ backgroundColor: `${catColor}40`, color: "#3D4447" }}>{categoryName}</Badge>
  {isCustom && <button onClick={(e) => { e.stopPropagation(); ... }}>edit</button>}
</div>

// after — 헬퍼 결과 prop 전달 + ChecklistRow 호출
import { getCategoryTokenClass } from "@/lib/data-token-classes";
import { ChecklistRow } from "@/components/checklist/ChecklistRow";

<ChecklistRow
  id={`timeline-row-${item.id}`}
  title={item.title}
  isChecked={isChecked}
  priority={item.priority}
  priorityLabel={PRIORITY_LABEL[item.priority]}
  categoryLabel={item.categoryName}
  categoryToneClassName={getCategoryTokenClass(item.category)}
  isHighlighted={isHighlighted}
  showUpcomingLabel={false}                 /* timeline은 upcoming 라벨 X */
  note={item.note}
  noteType={classifyNote(item.note)}
  isCustom={item.isCustom}
  onToggle={() => handleToggleItem(item)}
  onStartEdit={() => startEdit(item)}
  onRemove={() => removeCustomItem(item.id)}
/>
```

#### C. ChecklistItemRow (priority dot + upcoming + ChecklistRow 호출)

```tsx
// after — wrapper가 useEffect + ChecklistRow 호출
import { ChecklistRow } from "@/components/checklist/ChecklistRow";

const noteType = useMemo(() => classifyNote(item.note), [item.note]);
const showUpcomingLabel = !isHighlighted && currentPregnancyWeek !== null && ...;

useEffect(() => {  /* upcoming_item_view 발사 (현행 그대로) */ }, [...]);

if (isEditing) return <FormBlock />;       /* 편집 form은 wrapper 영역 */

return (
  <ChecklistRow
    id={`checklist-row-${slug}-${item.id}`}
    title={item.title}
    isChecked={isChecked}
    priority={item.priority}
    priorityLabel={PRIORITY_LABEL[item.priority]}
    /* checklist는 카테고리 Badge X — categoryLabel 미전달 */
    isHighlighted={isHighlighted}
    showUpcomingLabel={showUpcomingLabel}
    upcomingWeek={item.recommendedWeek}
    note={item.note}
    noteType={noteType}
    isCustom={item.isCustom}
    onToggle={onToggle}
    onStartEdit={onStartEdit}
    onRemove={onRemove}
  />
);
```

#### D. DashboardCard + HomeContent

```tsx
// before — DashboardCard.tsx
interface DashboardCardProps { color: string; ... }     // ⚠️ hex
<div style={{ backgroundColor: color }}>{icon}</div>

// before — HomeContent.tsx (4개 호출)
<DashboardCard color="#FFD4DE" ... />   // 체크리스트
<DashboardCard color="#D0EDE2" ... />   // 타임라인
<DashboardCard color="#FFE0CC" ... />   // 체중
<DashboardCard color="#E4D6F0" ... />   // 정보 (G 결과)

// after — DashboardCard.tsx
import { getDashboardIconBgClass, type DashboardSlot } from "@/lib/data-token-classes";
interface DashboardCardProps { slot: DashboardSlot; ... }
<div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${getDashboardIconBgClass(slot)}`}>
  {icon}
</div>

// after — HomeContent.tsx
<DashboardCard slot="checklist" ... />
<DashboardCard slot="timeline" ... />
<DashboardCard slot="weight" ... />
<DashboardCard slot="info" ... />
```

## 4. row 마크업 트리 (묶음 B)

### 4.1 변환 전 (현 ChecklistItemRow.tsx:108-190 / WeekChecklistSection.tsx:162-227)

```
<div role="button" tabIndex={0} aria-pressed onClick onKeyDown aria-label="...체크 해제">  ← interactive ①
├── <Checkbox onCheckedChange onClick={stopPropagation} aria-label="...체크박스">           ← interactive ② (Radix button)
├── <div flex-1>                                            ← title + 마이크로 라벨 + note
└── <Badge style={{ backgroundColor: hex, color: hex }}>     ← (timeline only)
└── (isCustom) <div>
    ├── <button onClick={stopPropagation} aria-label="수정">  ← interactive ③
    └── <DeleteConfirmDialog>                                  ← interactive ④
```

위반: **interactive ① container가 ②③④ 감쌈** (WCAG 4.1.2). aria-pressed + native checkbox state 음성 중복.

### 4.2 변환 후 (ChecklistRow 본체)

```
<div className="flex items-start gap-3">                    ← non-interactive container
├── <label htmlFor=id flex-1 cursor-pointer>                 ← native form-association (label, not interactive itself)
│   ├── <input id type=checkbox checked onChange className="sr-only peer">   ← interactive ① (유일 form control 안)
│   ├── <span aria-hidden visual-check>                                       ← visual ↔ peer 변형
│   │   └── <CheckIcon aria-hidden opacity-0 peer-checked:opacity-100>
│   ├── <span sr-only>우선순위 {priorityLabel}, </span>                       ← 보조 음성
│   ├── <div flex-1>                                                          ← priority dot + title + 마이크로 라벨 + note
│   │   ├── <span aria-hidden inline-block size-1.5 rounded-full {dot}>      ← 시각 only
│   │   ├── <span title>{title}</span>
│   │   ├── (showHighlightLabel) <span><CalendarCheck aria-hidden/>이번 주 추천</span>
│   │   ├── (showUpcomingLabel) <span><Clock aria-hidden/>{upcomingWeek}주차에 챙기기</span>
│   │   └── (note) <span>{noteType==="legal" ? <Scale> : <Info>}{note}</span>
│   └── (categoryLabel) <Badge className={categoryToneClassName}>{categoryLabel}</Badge>
└── (isCustom) <div pt-2 flex items-center gap-1 shrink-0>                    ← 액션 영역 (label OUTSIDE 형제)
    ├── <button aria-label="수정" onClick=onStartEdit>                          ← interactive ②
    └── <DeleteConfirmDialog onConfirm=onRemove>                                ← interactive ③
```

정합: **interactive 요소 ①·②·③ 모두 형제** (WCAG 4.1.2 통과). label이 ①의 native form-association이라 ①의 click은 ②·③과 분리. aria-pressed 제거.

### 4.3 ChecklistRow.tsx 본체 (Tailwind className 매트릭스)

```tsx
// 분기 A (rest, 미체크)
<div className="flex items-start gap-3">
  <label
    htmlFor={inputId}
    className="flex-1 flex items-start gap-3 p-3 rounded-xl cursor-pointer
               transition-colors duration-200
               hover:bg-muted/50
               has-[input:checked]:bg-pastel-mint/20"
  >
    <input
      id={inputId}
      type="checkbox"
      checked={isChecked}
      onChange={onToggle}
      className="sr-only peer"
    />
    <span
      aria-hidden="true"
      className="size-5 mt-0.5 shrink-0 rounded-md border-2 border-black/10
                 bg-input-background flex items-center justify-center
                 peer-checked:bg-pastel-mint peer-checked:border-pastel-mint
                 peer-focus-visible:ring-2 peer-focus-visible:ring-pastel-lavender
                 peer-focus-visible:ring-offset-2
                 transition-colors"
    >
      <CheckIcon
        className="size-3.5 text-foreground opacity-0 peer-checked:opacity-100
                   transition-opacity"
        aria-hidden="true"
      />
    </span>
    <span className="sr-only">우선순위 {priorityLabel}, </span>
    <div className="flex-1 min-w-0">
      <span
        className={`flex items-center gap-2 text-sm leading-relaxed
                    ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}
      >
        <span
          aria-hidden="true"
          className={`inline-block size-1.5 rounded-full shrink-0 ${priorityDotClassName}`}
        />
        <span className="min-w-0 break-words">{title}</span>
      </span>
      {showHighlightLabel && (
        <span className="mt-1 flex items-center gap-1 text-xs font-medium text-foreground">
          <CalendarCheck size={11} className="shrink-0" aria-hidden="true" />
          <span>이번 주 추천</span>
        </span>
      )}
      {showUpcomingLabel && (
        <span className="mt-1 flex items-center gap-1 text-xs font-normal text-muted-foreground">
          <Clock size={11} className="shrink-0" aria-hidden="true" />
          <span>{upcomingWeek}주차에 챙기기</span>
        </span>
      )}
      {note && (
        <span
          className={`mt-1 flex items-start gap-1 text-xs text-muted-foreground
                      ${noteType === "legal" ? "italic" : ""}
                      ${isChecked ? "line-through" : ""}`}
        >
          {noteType === "legal" ? (
            <Scale size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <Info size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <span>{note}</span>
        </span>
      )}
    </div>
    {categoryLabel && (
      <Badge
        className={`text-xs px-2 py-0.5 rounded-md border-0 shrink-0 mt-0.5
                    ${categoryToneClassName ?? ""}`}
      >
        {categoryLabel}
      </Badge>
    )}
  </label>
  {isCustom && (
    <div className="flex items-center gap-1 shrink-0 pt-2">
      <button
        type="button"
        onClick={onStartEdit}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-accent-purple
                   hover:bg-pastel-lavender/20 transition-colors"
        aria-label="수정"
      >
        <Pencil size={14} />
      </button>
      <DeleteConfirmDialog onConfirm={onRemove!} iconSize={14} />
    </div>
  )}
</div>
```

> **note 1**: `has-[input:checked]:bg-pastel-mint/20` 는 Tailwind v4의 `has-*` 변형. label이 자식 input의 checked 상태를 받아 배경 토글. globals.css `@source` 가 이 정적 클래스 문자열을 스캔.
> **note 2**: visual span의 size·radius·border 토큰은 현 row의 `size-5 mt-0.5 rounded-md border-2`와 정합 — 시각 회귀 0.
> **note 3**: 액션 버튼의 `pt-2` 는 visual checkbox 첫 줄과 시각 정렬.

## 5. 상태별 시안 (묶음 B)

### default (rest, 미체크)
- container: `flex items-start gap-3`.
- label: `flex-1 flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors duration-200`.
- visual span: `size-5 rounded-md border-2 border-black/10 bg-input-background`.
- CheckIcon: `size-3.5 text-foreground opacity-0`.
- 우선순위 점: `inline-block size-1.5 rounded-full {bg-accent-red\|bg-accent-olive\|bg-accent-green}`.
- title: `text-sm leading-relaxed text-foreground`.
- 액션 영역(isCustom): `flex items-center gap-1 shrink-0 pt-2`.

### hover
- label hover: `bg-muted/50`.
- 액션 버튼 hover: `text-accent-purple bg-pastel-lavender/20` (현 ChecklistItemRow + WeekChecklistSection 통일).

### focus-visible (키보드)
- input(sr-only) focus → `peer-focus-visible:ring-2 peer-focus-visible:ring-pastel-lavender peer-focus-visible:ring-offset-2` 가 visual span에 적용 → lavender ring.
- ring 색 = lavender (secondary editorial role) — design-bundle-l 정합.

### checked
- input.checked = true → peer 변형 발동.
- visual span: `bg-pastel-mint border-pastel-mint`. CheckIcon `opacity-100`.
- label: `has-[input:checked]:bg-pastel-mint/20`.
- title: `line-through text-muted-foreground`.
- note: `line-through` 추가.

### loading / empty / error
- row 자체 분기 없음 — wrapper(ChecklistPage·TimelineContainer)가 store hydration 처리. 본 라운드 영향 X.

## 6. 인터랙션·애니메이션 (묶음 B)

| 트리거 | 동작 | 피드백 | duration |
|---|---|---|---|
| label 클릭/탭 | input.checked 토글 | visual span mint + label bg-pastel-mint/20 + line-through | 200ms |
| 키보드 Tab | input focus → visual span ring | lavender ring 2px + offset 2px | 즉시 |
| Enter/Space (input focus) | 브라우저 기본 토글 | 위와 동일 | 200ms |
| 편집 버튼 클릭 | wrapper의 setEditingId(item.id) | row → form 분기 (wrapper) | instant |
| DeleteConfirmDialog 트리거 | 다이얼로그 열기 | dialog 등장 | 컴포넌트 기본 |

- CheckIcon `transition-opacity` 200ms.
- visual span / label `transition-colors` 200ms.
- 체크 시 컨페티 등 추가 애니메이션 X — phase-4.5 §2.6 UX #3 별도 라운드.

## 7. Tailwind v4 source scan 호환성 메모

### 7.1 스캔 메커니즘

[src/app/globals.css L4](../../../src/app/globals.css):

```css
@source '../**/*.{js,ts,jsx,tsx}';
```

→ `src/` 하위 모든 `.ts`·`.tsx`(`.js`·`.jsx`) 파일 스캔. 정적 클래스 문자열 리터럴이 등장하면 빌드 포함.

### 7.2 본 라운드 호환 보증

| 코드 패턴 | 스캔 여부 | 본 라운드 정합 |
|---|---|---|
| 정적 문자열 — `"bg-pastel-lavender/40 text-foreground"` | ✅ | 헬퍼 모든 매핑 객체 value |
| 동적 템플릿 — `\`bg-pastel-${tone}\`` | ❌ | 본 라운드 금지 (won't 명시) |
| `Record<X, "bg-..."> = { x: "bg-..." }` | ✅ | 4종 lookup table |
| union literal — `type T = "bg-..." \| ...` | ✅ | `DataToneClass` |
| 호출부 보간 — `\`text-xs ${getCityTokenClass(city)}\`` | ✅ (헬퍼 반환은 정적) | 모든 호출부 |
| `peer-checked:bg-pastel-mint` 등 변형 | ✅ | ChecklistRow className |
| `has-[input:checked]:bg-pastel-mint/20` | ✅ Tailwind v4 has-* 변형 | ChecklistRow label |

### 7.3 위험 지점

- 새 도메인 추가 시 동적 템플릿 유혹 — 헌법 갱신(I-4=A) 1단락에 "동적 템플릿 리터럴 금지" 명시.
- Record value type 안전 — 본 헬퍼는 `Record<X, DataToneClass>`로 union literal 강제 → 동적 조립 컴파일 차단.
- 외부 패키지 className 합성(`clsx`·`cn`) 통과해도 정적 문자열 자체는 코드 잔존 → 스캔 OK.

### 7.4 빌드 검증

```bash
pnpm build  # next build — Tailwind 클래스 누락 시 시각 회귀로 확인
grep -rn 'bg-pastel-' src/lib/data-token-classes.ts | wc -l   # 약 9 unique 클래스
```

## 8. 토큰·접근성

### 사용 토큰

- `--pastel-mint` — visual span 체크 배경, label `bg-pastel-mint/20`, baby_items category, timeline DashboardSlot, yeongnam city group.
- `--pastel-lavender` — focus-visible ring, 액션 hover bg, postpartum category, info DashboardSlot, metropolitan city group, fallback.
- `--pastel-peach` — large scale, hospital/hospital_bag category, weight DashboardSlot, metro_city city group.
- `--pastel-yellow` — medium scale, admin category, other city group.
- `--pastel-pink` — DashboardSlotClass `checklist` slot 한정 (CTA 진입).
- `--accent-purple` — 액션 버튼 hover text.
- `--accent-red` / `--accent-olive` / `--accent-green` — 우선순위 점.
- `--input-background` — visual span rest 배경.
- `--muted` / `--muted-foreground` / `--foreground` — 일반 텍스트, hover bg, line-through 색.
- `--border` (`border-black/10` 사용 — 현 row 정합) — visual span border.

### 신규 토큰
- 없음. globals.css 변경 0 (헌법 텍스트만 갱신).

### 접근성 (WCAG 2.1 AA) — role/aria 매트릭스

| 요소 | role | aria-* | 비고 |
|---|---|---|---|
| `<div>` container | (생략) | (생략) | 비-interactive |
| `<label htmlFor>` | (label native) | (없음) | form-association |
| `<input type="checkbox">` | checkbox (native) | aria-label은 label 본문 자동 제공 | 음성 = label 본문 + sr-only |
| `<span>` visual-check | (없음) | `aria-hidden="true"` | 시각 only |
| `<CheckIcon>` | img (lucide 기본) | `aria-hidden="true"` | 시각 only |
| `<span>` sr-only 우선순위 | (없음) | (없음) | label 자식 → input accessible name |
| `<span>` priority dot | (없음) | `aria-hidden="true"` | 시각 only |
| `<CalendarCheck>` `<Clock>` `<Info>` `<Scale>` | (lucide 기본) | `aria-hidden="true"` | 시각 only — 텍스트 라벨 동반 |
| `<Badge>` (categoryLabel) | (없음) | (없음) | label 자식 → input accessible name |
| 편집 `<button>` | button (native) | `aria-label="수정"` | label OUTSIDE 형제 |
| `<DeleteConfirmDialog>` | (Radix) | (Radix 기본) | label OUTSIDE 형제 |

### WCAG 2.1 AA 검증

| 항목 | 검증 |
|---|---|
| 키보드 도달 | input native Tab. label htmlFor 연결. Enter/Space 토글. ✅ |
| focus-visible | visual span lavender ring 2px + offset 2px. lavender vs cream(#FFFAF7) 대비 충분. ✅ |
| 스크린리더 음성 | "체크박스, [title], 우선순위 [높음/보통/낮음], [이번 주 추천 / X주차에 챙기기], [note], 체크됨/체크 안 됨" 일관 발화. ✅ |
| role/시맨틱 정합 | input=checkbox, label=form, button=button. designer N2 ✅ |
| interactive 중첩 | label은 form-association이라 interactive 아님. ① + ② + ③ 형제. ✅ |
| 색에 의존하지 않는 정보 | 우선순위 = 점(색) + sr-only 텍스트 둘 다. 체크 = mint(색) + line-through(시각) + native state(음성). ✅ |
| 모바일 320px | label flex-1 + 액션 shrink-0. title break-words 자연 줄바꿈. 320 - 16(px-4)*2 = 288px 가용. ⚠️ 수동 검증 의무. |
| `word-break: keep-all` | row title은 `break-words` (현 row 정합 — `.article-prose` 외 영역). 짧은 항목명이라 영향 미미. 의도 명시. |
| 터치 영역 | label `p-3` + size-5 = ~52px height (모바일 친화). 액션 버튼 `p-1.5` × 14px icon = ~28px. 양보 가능. |
| 색 대비 (Badge) | 모든 `bg-pastel-*/40` + `text-foreground (#3D4447)` on cream — 4.5:1 충족. ✅ |

### 다크 패턴 검증 (designer N4)

- 가짜 close 버튼·가짜 토글·lock-in·가짜 카운트·시각 위계 왜곡·자동 옵트인 — 본 라운드 모두 X. ✅

## 9. cross-check (산출물 간 불일치 검증)

```
🔍 cross-check 결과

1. 화면 ↔ GA4 이벤트 매핑
   - (해당 없음) — GA4 변경 0. 묶음 B는 기존 wiring 보존, 묶음 I는 측정 영역 외.

2. 사용자 시나리오 ↔ 디자인 시안 매핑
   - 시나리오 A (row 토글):       §4 마크업 트리 + §5 default·hover·focus-visible·checked 시안   ✅
   - 시나리오 A (편집 모드):       §1 분기 B + spec.md §2 won't (form은 wrapper 영역)             ✅
   - 시나리오 A (legal note):     §1 분기 F (Scale 아이콘 + italic)                                ✅
   - 시나리오 A (이번 주 추천):    §1 분기 D (CalendarCheck)                                        ✅
   - 시나리오 A (예정 주차):       §1 분기 E (Clock)                                                ✅
   - 시나리오 A (커스텀 항목):     §1 분기 G + §4.3 액션 영역                                       ✅
   - 시나리오 B (city Badge):     §3.2 매핑 + §3.3 A 호출부                                        ✅
   - 시나리오 B (scale Badge):    §3.2 매핑 + §3.3 A                                              ✅
   - 시나리오 B (category Badge): §3.2 매핑 + §3.3 B + ChecklistRow categoryToneClassName prop    ✅
   - 시나리오 B (home 미니카드):  §3.2 매핑 + §3.3 D + DashboardSlotClass(pink 허용)               ✅

3. 예외 케이스 ↔ 에러 상태 시안 매핑
   - 모바일 320px title 길이 초과:  §8 break-words 자연 줄바꿈, 수동 검증 의무                  ⚠️ (impl 후 검증)
   - 도시 lookup 실패 (신규 도시): §3.2 fallback DEFAULT_TONE = lavender/40                       ✅
   - scale lookup 실패:             §3.2 fallback                                                  ✅
   - 동적 템플릿 미스캔:            §7.3 위험 지점 + spec.md §2.8 헌법 갱신 명시                   ✅
   - row 편집 모드:                 §1 분기 B (wrapper 영역, ChecklistRow 외)                       ✅
   - row checked 상태:              §5 checked 시안 + has-[input:checked]                         ✅

불일치 항목: 0건 (확정 시각 정합 — ⚠️ 모바일 320px만 impl 후 수동 검증 강제)
```

## 10. 묶음 간 의존성 분석

- **B → I 의존**: B의 ChecklistRow 공통 컴포넌트가 timeline에서 categoryLabel + categoryToneClassName props를 받음. categoryToneClassName 값은 I의 `getCategoryTokenClass()` 결과. **I 머지가 B 머지 선행** (작업 순서 spec.md §4 정합).
- **I 영향**: I 단독 컴파일 OK 가능 (호출부 4파일 모두 B 마크업 독립). I-1 헬퍼 + I-2 호출부 정리 + I-4 헌법 갱신을 먼저 끝낸 뒤 B의 ChecklistRow가 wrapper에서 미리 계산된 className을 prop으로 받는 형태로 진행.
- **충돌 지점 0**: B는 row 마크업 정리, I는 className 매핑. 같은 파일(WeekChecklistSection.tsx) 안에서 두 변경이 만나지만 코드 영역 분리(CATEGORY_COLORS map 제거 vs 행 컨테이너 마크업 변경). 한 PR 안 두 commit으로 분리 머지 가능.
- **DESIGN.md 갱신은 I 단독** (B는 §10/§12 변경 X).
- **phase-4.5.md SoT 갱신은 양쪽**: B-5=A → §2.9 Cross-5, I → §2.9 Cross-4 ✅. 한 PR 안 두 곳 갱신.

## 11. E2E 영향 분석

| spec 파일 | 영향 묶음 | 회귀 가능성 | 마이그레이션 의무 |
|---|---|---|---|
| `e2e/checklist-recommendation-semantics.spec.ts` | B (row 셀렉터) | 높음 | spec.md §2.10 — `getByRole("checkbox")` |
| `e2e/design-bundle-d-uncheck-toggle-dday.spec.ts` | B | 높음 | 동일 |
| `e2e/checklist.spec.ts` | B | 중간 | 동일 |
| `e2e/timeline.spec.ts` | B | 중간 | 동일 |
| `e2e/ga4-events.spec.ts` | B (`recommended_item_check` 트리거) | 중간 | 동일 |
| `e2e/babyfair-enhancement.spec.ts`, `babyfair-improvements.spec.ts`, `baby-fair.spec.ts` | I | 저~중 (Badge hex 검증 시 회귀) | impl grep 후 |
| `e2e/home.spec.ts` | I | 저~중 (DashboardCard 색 검증 시 회귀) | impl grep 후 |
| `e2e/design-bundle-g-pastel-remap.spec.ts` | I | 중 (G의 hex 검증 그대로면 OK — 헬퍼 결과도 같은 hex) | grep 후 검증 |
| 그 외 ~30개 spec | 영향 0 | — | — |

**impl 의무**:
1. B 진입 전 `grep -rn 'role="button"\|aria-pressed\|aria-label.*체크' e2e/` → 영향 셀렉터 정확 위치.
2. 5개 spec 셀렉터 마이그레이션 (B-6=A 정합).
3. I 진입 전 `grep -rn '"#FFD4DE"\|"#FFE0CC"\|"#D0EDE2"\|"#E4D6F0"\|"#FFF4D4"' e2e/` → hex 검증 발견 시 클래스/aria 기반 마이그레이션.
4. 전체 e2e 통과 확인 (dev §6.5).

## 12. 운영자 검증 가이드 (impl 후)

### 묶음 I
- [ ] `/`: 미니카드 4개 색 — 체크리스트(pink/40)·타임라인(mint/40)·체중(peach/40)·정보(lavender/40). 색 회귀 0.
- [ ] `/timeline` 주차 펼침 → 카테고리 Badge — `hospital` 이 peach(이전 pink). 나머지 4종 동일.
- [ ] `/baby-fair`: 도시 Badge — 서울 행사들 lavender, 부산 행사들 peach, 창원 mint, 청주 yellow. 같은 그룹 = 같은 색.
- [ ] `/baby-fair`: 규모 Badge — `대형` peach(이전 pink).
- [ ] DevTools: Badge에 `style="background-color"` 0건. className에 `bg-pastel-{lavender|mint|peach|yellow}/40`.
- [ ] grep `style={{ backgroundColor` 0건.
- [ ] `pnpm typecheck` 통과.
- [ ] DESIGN.md §10/§12 헌법 1단락 머지.

### 묶음 B
- [ ] `/checklist/main`: 행 클릭 → mint 채움 + mint/20 배경 + 취소선.
- [ ] 같은 행 재클릭 → 토글 해제.
- [ ] Tab 5회 → 첫 항목 ring(lavender) 표시.
- [ ] Space → 토글.
- [ ] 커스텀 항목 편집 버튼 → form 분기.
- [ ] 삭제 버튼 → DeleteConfirmDialog.
- [ ] `/timeline` 주차 펼침 → 동일 동작.
- [ ] DevTools accessibility tab — input accessible name 확인 ("체크박스, 항목명, 우선순위 X").
- [ ] 5개 e2e spec 통과.
