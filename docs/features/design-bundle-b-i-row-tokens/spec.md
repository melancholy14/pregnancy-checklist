# design-bundle-b-i-row-tokens 기획서

> 작성일: 2026-05-10  size: M
> 출처: [docs/plan/phase-4.5.md §2.4 M1](../../plan/phase-4.5.md), §2.8.1 H-3, §2.8.2 T-5·T-11, §2.8.5 B-3, §2.9 Cross-4·Cross-5
> 관련 리뷰: [review.md](./review.md)  관련 디자인: [design.md](./design.md)

## 0. review.md 결정사항 참조 (사용자 입력, 2026-05-10)

### 묶음 B (페어 1: designer × dev)

| # | 결정 |
|---|---|
| B-1 | 액션 버튼 = label 형제 + flex inline (현재 위치 유지) |
| B-2 | row 마크업 = `ChecklistRow` 공통 컴포넌트 추출 |
| B-3 | sr-only 카피 = `우선순위 {priority.label}` (priority.label 그대로) |
| B-4 | visual checkbox 토큰 = 공통 컴포넌트 className에 직접 (Tailwind peer-checked) |
| B-5 | phase-4.5.md §2.9 Cross-5 SoT 정정 본 라운드에 포함 |
| B-6 | E2E 셀렉터 = `getByRole("checkbox", { name: ... })` 마이그레이션 |

### 묶음 I (페어 2: dev × designer)

| # | 결정 |
|---|---|
| I-1 | 헬퍼 반환 = 정적 union literal 타입 (`DataToneClass`, pink 제외) |
| I-2 | SCALE_CONFIG.large + CITY pink 도시 + CATEGORY hospital 재매핑 본 라운드 포함 |
| I-3 | 헬퍼 반환 형태 = 단일 클래스 문자열 (배경 + 텍스트 묶음) |
| I-4 | DESIGN.md §10/§12에 1단락 추가 |
| I-5 | 도시 매핑 = 행정구역 4개 그룹 (수도권/광역시/영남/기타) |
| I-6 | DashboardCard prop = semantic slot key |

## 1. 사용자 시나리오

### 시나리오 A — 체크리스트(`/checklist/<slug>`)·타임라인(`/timeline`) 항목 행 토글

체크리스트와 타임라인의 항목 행이 **WCAG 4.1.2 (interactive 요소가 interactive 요소를 감쌀 수 없음)** 정합 표준 마크업으로 정리된다. 사용자 가시 동작은 동일 — 행 어디를 눌러도 토글되고, 편집·삭제 버튼은 우측에 있고, 우선순위 점·"이번 주 추천"·"X주차에 챙기기"·`legal` note 시각 분기·체크 상태 mint/20 배경이 모두 보존된다.

스크린리더 사용자에게는 행 인식이 정확해진다 — 현재 "버튼, 체크박스, 버튼, 버튼"으로 환경마다 갈리던 음성이 `체크박스, [항목 제목], 우선순위 [높음/보통/낮음], [이번 주 추천 / X주차에 챙기기], [note 본문], 체크됨/체크 안 됨`의 일관 구조로 발화된다.

### 시나리오 B — home·timeline·baby-fair 색 매핑

home(미니카드 4개)·timeline(체크리스트 카테고리 Badge)·baby-fair(도시·규모 Badge) 데이터 라벨이 인라인 hex 패턴에서 헬퍼 함수의 결과 클래스 문자열로 옮겨진다. 사용자 가시 변화:

- baby-fair 도시 Badge: 17개 도시별 색 → 4 행정구역 그룹별 색 (시각 분포 변경, 같은 권역 행사가 같은 톤으로 묶여 인지 부담 ↓)
- baby-fair 규모 "대형" Badge: pink → peach (5-pastel role 정합 회복)
- timeline 카테고리 Badge `hospital`: pink → peach (5-pastel role 정합 회복)
- home 미니카드 4개 색 변화 0 (G 묶음 결과 그대로 헬퍼로 재구현)

토큰 디시플린은 (a) 헬퍼 union literal 타입 (b) DESIGN.md 헌법 1단락 두 가드로 영구화.

## 2. 기능 요구사항

### must

#### 2.1 [묶음 I] 신규 파일 — `src/lib/data-token-classes.ts`

| 항목 | 명세 |
|---|---|
| 위치 | [src/lib/data-token-classes.ts](../../../src/lib/data-token-classes.ts) (신규 1파일) |
| 핵심 타입 | `type DataToneClass = bg-pastel-{lavender\|mint\|peach\|yellow}/{20\|40} text-foreground` (pink 제외, 텍스트 묶음 — I-1·I-3 정합. 8종 union literal) |
| 보조 타입 | `type DashboardSlotClass = DataToneClass \| "bg-pastel-pink/40 text-foreground"`, `type CityGroup = "metropolitan" \| "metro_city" \| "yeongnam" \| "other"`, `type DashboardSlot = "checklist" \| "timeline" \| "weight" \| "info"` |
| named export 4종 | `getCityTokenClass(city: string): DataToneClass`, `getScaleTokenClass(scale: string): DataToneClass`, `getCategoryTokenClass(category: ChecklistItem["category"]): DataToneClass`, `getDashboardIconBgClass(slot: DashboardSlot): DashboardSlotClass` |
| 동적 조립 금지 | 모든 매핑 객체 value는 정적 클래스 문자열 리터럴. 동적 템플릿 리터럴 금지 (Tailwind v4 source scan 호환). |
| fallback 정책 | lookup 실패 시 `"bg-pastel-lavender/40 text-foreground"` (lavender = secondary editorial 안전 기본값). |

매핑 명세는 [design.md §3](./design.md) 헬퍼 시그니처 참조.

#### 2.2 [묶음 I] 도메인별 매핑 (재매핑 명시)

##### A. `getCityTokenClass(city)` — 17개 도시 → 4개 그룹 → 4 pastel (I-5=B)

| 그룹 | 도시 | pastel 매핑 |
|---|---|---|
| 수도권 | 서울, 서울(마곡), 인천, 경기, 수원, 수원(광교), 고양(일산) | `bg-pastel-lavender/40 text-foreground` |
| 광역시 | 부산, 대구, 광주, 대전 | `bg-pastel-peach/40 text-foreground` |
| 영남 | 창원, 김해, 경주 | `bg-pastel-mint/40 text-foreground` |
| 기타 | 청주, 강릉, 익산, 순천 | `bg-pastel-yellow/40 text-foreground` |

##### B. `getScaleTokenClass(scale)` — 3개 규모 (I-2=A pink 정정)

| scale | pastel 매핑 (변경 표시) |
|---|---|
| `large` | `bg-pastel-peach/40 text-foreground` (현 `#FFD4DE` pink → peach **재매핑**) |
| `medium` | `bg-pastel-yellow/40 text-foreground` (현 `#FFF4D4` 유지) |
| `small` | `bg-pastel-lavender/40 text-foreground` (현 `#E4D6F0` 유지 — G 결과) |

##### C. `getCategoryTokenClass(category)` — checklist 카테고리

| category | pastel 매핑 (변경 표시) |
|---|---|
| `hospital` | `bg-pastel-peach/40 text-foreground` (현 `#FFD4DE` pink → peach **재매핑**) |
| `hospital_bag` | `bg-pastel-peach/40 text-foreground` (유지, hospital과 동톤 — 도메인 인접 의도) |
| `baby_items` | `bg-pastel-mint/40 text-foreground` (유지) |
| `postpartum` | `bg-pastel-lavender/40 text-foreground` (유지) |
| `admin` | `bg-pastel-yellow/40 text-foreground` (유지) |

##### D. `getDashboardIconBgClass(slot)` — home 미니카드 4개 (I-6=A)

| slot | pastel 매핑 |
|---|---|
| `checklist` | `bg-pastel-pink/40 text-foreground` (CTA 진입 슬롯, `DashboardSlotClass` 허용) |
| `timeline` | `bg-pastel-mint/40 text-foreground` |
| `weight` | `bg-pastel-peach/40 text-foreground` |
| `info` | `bg-pastel-lavender/40 text-foreground` (G 결과) |

#### 2.3 [묶음 B] 신규 공통 컴포넌트 — `ChecklistRow`

| 항목 | 명세 |
|---|---|
| 위치 | [src/components/checklist/ChecklistRow.tsx](../../../src/components/checklist/ChecklistRow.tsx) (checklist 폴더가 SoT, timeline에서 import) |
| 마크업 | `<div container flex><label htmlFor flex-1>…</label>{isCustom && <div actions shrink-0>…</div>}</div>` (B-1=A 정합) |
| 내부 요소 | `<input type="checkbox" sr-only peer>` + `<span aria-hidden visual-check>` + `<span sr-only>우선순위 {priorityLabel}</span>` + `<span title>` + 마이크로 라벨(CalendarCheck/Clock/Info/Scale) |
| props | `id`, `title`, `isChecked`, `priority`, `priorityLabel`, `categoryLabel?` (timeline용), `categoryToneClassName?` (timeline용 — 헬퍼 결과), `isHighlighted`, `showUpcomingLabel`, `upcomingWeek?`, `note?`, `noteType?`, `isCustom`, `onToggle`, `onStartEdit?`, `onRemove?` |
| visual span (B-4=A) | `size-5 mt-0.5 rounded-md border-2 border-black/10 bg-input-background shrink-0 peer-checked:bg-pastel-mint peer-checked:border-pastel-mint peer-focus-visible:ring-2 peer-focus-visible:ring-pastel-lavender peer-focus-visible:ring-offset-2 transition-colors flex items-center justify-center` 안에 `<CheckIcon size-3.5 text-foreground opacity-0 peer-checked:opacity-100>` |
| 카테고리 Badge | `categoryLabel` prop 있을 때만 렌더 (timeline). className은 `categoryToneClassName` prop으로 전달받음(헬퍼 결과 — 호출부 wrapper가 계산). |
| 우선순위 점 | `<span aria-hidden inline-block size-1.5 rounded-full {priority.dotClassName}>` (현 ChecklistItemRow `bg-accent-red`/`bg-accent-olive`/`bg-accent-green` 그대로) |
| 마이크로 라벨 | 현행 `showHighlightLabel`(CalendarCheck "이번 주 추천")·`showUpcomingLabel`(Clock "X주차에 챙기기") 그대로 |
| note 시각 분기 | `noteType==="legal"` → Scale 아이콘 + italic, 그 외 Info 아이콘. 체크 시 line-through. |

#### 2.4 [묶음 I + B] 호출부 매트릭스

| 파일 | 변경 |
|---|---|
| [src/components/babyfair/BabyfairCard.tsx](../../../src/components/babyfair/BabyfairCard.tsx) | `SCALE_CONFIG.color` 필드 + `CITY_COLORS` map **제거**. `SCALE_CONFIG`는 `{ label }` 만. Badge `style` → `className={getCityTokenClass(...) / getScaleTokenClass(...)}`. import 추가. |
| [src/components/timeline/WeekChecklistSection.tsx](../../../src/components/timeline/WeekChecklistSection.tsx) | (1) 묶음 I — `CATEGORY_COLORS` map **제거**, `getCategoryTokenClass(item.category)` 결과 계산. (2) 묶음 B — row 마크업 부분을 `<ChecklistRow categoryLabel={...} categoryToneClassName={getCategoryTokenClass(item.category)} {...} />` 호출로 교체. 편집 form, useCallback `handleToggleItem`, 진행률 바, GA4 이벤트 발사 보존. |
| [src/components/checklist/ChecklistItemRow.tsx](../../../src/components/checklist/ChecklistItemRow.tsx) | 묶음 B — 본체 마크업 제거 → `<ChecklistRow {...mapped} />` 호출. 편집 모드(isEditing) 분기 + useEffect(`upcoming_item_view` 발사) 보존. categoryLabel·categoryToneClassName props는 미전달(checklist는 카테고리 Badge X). |
| [src/components/home/DashboardCard.tsx](../../../src/components/home/DashboardCard.tsx) | 묶음 I — `color: string` prop 제거. 신규 prop `slot: DashboardSlot`. `style={{ backgroundColor: color }}` → `className={getDashboardIconBgClass(slot)}`. |
| [src/components/home/HomeContent.tsx](../../../src/components/home/HomeContent.tsx) | 묶음 I — DashboardCard 4개 호출 사이트의 `color="#..."` → `slot="checklist"\|"timeline"\|"weight"\|"info"`. |

#### 2.5 [묶음 B] aria 정합

- native `<input type="checkbox">` 사용. Radix Checkbox(`@/components/ui/checkbox`) 본 row에서 미사용. (편집 form 안 다른 input 영향 없음)
- input id = `${slug}-checklist-row-${item.id}` 형태 unique. label `htmlFor=id`.
- input은 `sr-only peer`. visual span은 `aria-hidden="true"`.
- input accessible name = label 안 visible + sr-only 텍스트 합. 현행 row div의 `aria-label="...체크 해제/체크"` 접미사 **제거** (native checkbox state 자동 음성).
- sr-only 우선순위 span = `<span className="sr-only">우선순위 {priorityLabel}, </span>` (B-3 결정).
- 액션 버튼은 label OUTSIDE 형제 div 안. `aria-label="수정"` / DeleteConfirmDialog의 기존 aria-label 보존.

#### 2.6 [묶음 B] 이벤트 발사 보존

| 이벤트 | 현행 위치 | 변경 후 |
|---|---|---|
| `checklist_check` | WeekChecklistSection.tsx:78 / ChecklistPage 위치 다름 | `onToggle` callback 안 동일 발사. parameter 동일. |
| `recommended_item_check` | WeekChecklistSection.tsx:90 | 동일 위치 — `handleToggleItem` 안 `willCheck && isHighlighted` 가드 보존. |
| `upcoming_item_view` | ChecklistItemRow.tsx:65 | wrapper(`ChecklistItemRow`)의 useEffect 그대로 보존. ChecklistRow 공통 컴포넌트는 발사 X. |
| `recommended_item_view` | ChecklistPage·TimelineContainer·WeekChecklistSection 외부 | 본 라운드 영향 X. |

#### 2.7 [묶음 B] hover / cursor / 체크 상태 시각

- container `<div>` 자체 비-interactive — hover bg X, cursor 기본.
- label = `cursor-pointer hover:bg-muted/50 rounded-xl transition-colors duration-200`.
- 체크 상태(input.checked) → label에 `has-[input:checked]:bg-pastel-mint/20` (Tailwind v4 has-* 변형). visual span은 `peer-checked:bg-pastel-mint`.
- 액션 버튼 영역은 hover bg X (label과 분리된 시각 영역).

#### 2.8 [묶음 I] DESIGN.md 헌법 갱신 (I-4=A)

[DESIGN.md](../../../DESIGN.md) §10 Don't 또는 §12 Iteration Guide에 다음 1단락 추가:

```markdown
### 데이터 → 토큰 매핑은 헬퍼 경유 의무

도메인 데이터(예: 도시명, 카테고리, 규모)를 색으로 표시할 때 컴포넌트 내 인라인
`style={{ backgroundColor: hex }}` 패턴 금지. [src/lib/data-token-classes.ts](src/lib/data-token-classes.ts)
의 도메인별 named export(`getCityTokenClass`·`getScaleTokenClass`·`getCategoryTokenClass`
·`getDashboardIconBgClass`)를 사용한다. 헬퍼 반환 타입 `DataToneClass`(pink 제외 4 pastel × 2 alpha)
가 컴파일 시점에 5-pastel role을 강제. 새 도메인 추가 시 헬퍼에 named export + lookup table 확장 —
인라인 hex map 또는 동적 템플릿 리터럴(`bg-pastel-${tone}`) 금지 (Tailwind v4 source scan 미스캔).

CTA 성격 슬롯(예: home 미니카드 진입)에는 `DashboardSlotClass`(pink 포함)를 사용한다.
```

§ 헤더 위치는 §10 Don't 항목 또는 §12 Iteration Guide 1번 옆. impl 라운드에서 정확 위치 결정.

#### 2.9 [묶음 B + I] phase-4.5.md SoT 정정 (B-5=A · I 본 라운드 산출물 마크)

[phase-4.5.md](../../plan/phase-4.5.md):

- **§2.9 Cross-4 행** (L566) — 본문에 ✅ 완료(2026-05-10) 마크 + 산출물 링크 추가.
- **§2.9 Cross-5 행** (L567) — "WeekChecklistSection 한 컴포넌트 정정으로 둘 다 해결" → "`ChecklistRow` 공통 컴포넌트 추출로 두 파일(ChecklistItemRow + WeekChecklistSection) 동시 해결" 정정. ✅ 완료 마크.
- **§2.10 묶음 B 행** (L584) — "WeekChecklistSection을 label 기반 마크업으로" → "`ChecklistRow` 공통 컴포넌트 추출 + label 기반 마크업으로". ✅ 완료 마크 + [design-bundle-b-i-row-tokens](./spec.md) 링크.
- **§2.10 묶음 I 행** (L591) — ✅ 완료 마크 + 동일 링크.

#### 2.10 [묶음 B] E2E 셀렉터 마이그레이션 (B-6=A)

영향 받는 spec 5개 row 셀렉터 a11y 기반 갱신. impl 라운드 의무:

| spec 파일 | 마이그레이션 |
|---|---|
| [e2e/checklist-recommendation-semantics.spec.ts](../../../e2e/checklist-recommendation-semantics.spec.ts) | `[role="button"]`/`aria-pressed`/`aria-label*=체크` → `getByRole("checkbox", { name: /항목명/ })` |
| [e2e/design-bundle-d-uncheck-toggle-dday.spec.ts](../../../e2e/design-bundle-d-uncheck-toggle-dday.spec.ts) | 동일 |
| [e2e/checklist.spec.ts](../../../e2e/checklist.spec.ts) | 동일 |
| [e2e/timeline.spec.ts](../../../e2e/timeline.spec.ts) | 동일 |
| [e2e/ga4-events.spec.ts](../../../e2e/ga4-events.spec.ts) | 동일 (`recommended_item_check` 트리거) |

impl 의무: grep으로 정확 셀렉터 확인 후 변경 → 전체 e2e 통과 (dev §6.5).

### should

- 헬퍼 매핑 객체에 JSDoc 주석 — 각 도메인 의미. 다음 운영자가 의도 빠르게 파악.
- 헬퍼 union 타입 + named export를 외부에서 import 가능하게 export — 다른 컴포넌트 prop 타입 재사용.
- ChecklistRow props 인터페이스 named export (`export interface ChecklistRowProps`) — 향후 다른 호출부 도입 시 타입 재사용.
- 액션 버튼 hover effect 통일(`hover:text-accent-purple hover:bg-pastel-lavender/20`) — 현 ChecklistItemRow + WeekChecklistSection 미세 차이 통일.

### won't

- **Radix Checkbox(`@/components/ui/checkbox`) 자체 변경 X** — 본 row만 미사용. 다른 곳 잔존.
- **편집 form 마크업 변경 X** — `isEditing===true` 분기는 wrapper 영역.
- **ChecklistHub 카드 / 진행률 / 카테고리 카드 마크업 변경 X**.
- **GA4 이벤트 신규 X** — 기존 wiring 보존.
- **DueDateInput H-4 (현재 주차 Badge pink/60) 처리 X** — 별도 결정.
- **차트 색 W-1 처리 X** — 별도 묶음 N.
- **BabyfairCard `daysLeft` Badge 변경 X** — `bg-pastel-mint` 가 success role 정합.
- **`getCategoryTokenClass`의 hospital + hospital_bag 동톤(peach) 정정 X** — 도메인 인접 의도. 본 라운드는 pink 위반 정정 한정.
- **DESIGN.md §2.2 5-pastel 표 변경 X** — 헌법 갱신은 §10/§12 1단락만.
- **헬퍼 unit 테스트 X** — 정적 lookup 함수, 빌드/타입체크가 검증 충분.
- **체크박스 시각 개편(rounded-full 등) X** — 시각 회귀 0이 본 라운드 의도.
- **우선순위 색·아이콘 재매핑 X** — phase-4.5 §2.7 묶음 A 영역.

## 3. 성공 기준

### 묶음 I

- `grep -rn 'style={{ backgroundColor' src/` 결과 0건 (3건 → 0).
- `grep -rn '"#FFD4DE"\|"#FFE0CC"\|"#D0EDE2"\|"#E4D6F0"\|"#FFF4D4"' src/components/babyfair/ src/components/timeline/WeekChecklistSection.tsx src/components/home/DashboardCard.tsx src/components/home/HomeContent.tsx` 결과 0건.
- 신규 [src/lib/data-token-classes.ts](../../../src/lib/data-token-classes.ts) 1파일 + 4종 named export + `DataToneClass` + `DashboardSlotClass` union literal 타입.
- TypeScript 빌드 통과 — `pnpm typecheck` 또는 `next build`.
- `grep -n 'bg-pastel-pink' src/lib/data-token-classes.ts` 결과는 `DashboardSlotClass` 내 `checklist` 슬롯 1건만.
- DESIGN.md §10/§12 헌법 1단락 머지.
- 수동 검증:
  - `/`: 미니카드 4개 — 체크리스트(pink/40)·타임라인(mint/40)·체중(peach/40)·정보(lavender/40).
  - `/timeline` 주차 펼침 → 카테고리 Badge 색 — hospital(peach), hospital_bag(peach), baby_items(mint), postpartum(lavender), admin(yellow). text 색 = `text-foreground`.
  - `/baby-fair`: 도시 Badge — 수도권 7개=lavender, 광역시 4개=peach, 영남 3개=mint, 기타 4개=yellow. 규모 — 대형=peach, 중형=yellow, 소형=lavender.

### 묶음 B

- [ChecklistItemRow.tsx](../../../src/components/checklist/ChecklistItemRow.tsx)·[WeekChecklistSection.tsx](../../../src/components/timeline/WeekChecklistSection.tsx) 둘 다 `role="button"` 행 마크업 0건.
- 신규 [ChecklistRow.tsx](../../../src/components/checklist/ChecklistRow.tsx) 1파일 + 두 파일에서 import.
- E2E 5개 spec(checklist-recommendation-semantics·design-bundle-d-uncheck-toggle-dday·checklist·timeline·ga4-events) 통과 — 셀렉터 마이그레이션 후.
- 수동 검증:
  - `/checklist/main` 행 클릭 → 토글 동작.
  - `/timeline` 주차 펼침 → 항목 토글.
  - 키보드 Tab → focus-visible ring(lavender).
  - Space/Enter → 토글.
  - 편집·삭제 버튼이 행 우측에서 작동(label 클릭 영역 분리).
  - 스크린리더: "체크박스, [항목명], 우선순위 [높음/보통/낮음], [이번 주 추천], [note], 체크됨/체크 안 됨" 발화.
  - 모바일 320px 화면에서 줄꺾임 없거나 자연스러운 2행.

### 공통

- phase-4.5.md §2.9 Cross-4·Cross-5 + §2.10 묶음 B/I 본문 정정 ✅ 마크 머지.
- 전체 e2e 통과 (dev §6.5).

## 4. 작업 순서 (impl 라운드)

본 묶음은 한 PR로 진행. **묶음 I → 묶음 B 순서** (한 PR 안 중간 상태 모두 컴파일 OK + e2e green 보장):

1. **I-1**: 헬퍼 1파일 생성 + 매핑 객체 + 4종 named export + `DataToneClass`·`DashboardSlotClass` union literal 타입.
2. **I-2**: BabyfairCard·HomeContent·DashboardCard·WeekChecklistSection 호출부 매트릭스 적용 (Badge `style` 제거, DashboardCard prop 시그니처 변경, CATEGORY_COLORS map 제거).
3. **I-3**: DESIGN.md 헌법 1단락 머지.
4. **B-1**: `ChecklistRow` 공통 컴포넌트 추출 (이때 WeekChecklistSection이 이미 헬퍼 사용 중 — categoryToneClassName props 그대로 전달).
5. **B-2**: ChecklistItemRow + WeekChecklistSection이 ChecklistRow import.
6. **B-3**: E2E 5개 spec 셀렉터 마이그레이션 + 통과 확인.
7. **B-4**: phase-4.5.md §2.9 Cross-4·Cross-5 + §2.10 묶음 B/I ✅ 마크.

## 5. 비-목표 / 의도적 제외

- 모든 row 패턴(예: 체중 로그 행) 일괄 정리 — 본 라운드는 체크리스트 + 타임라인 row 한정.
- 헬퍼 외 다른 토큰 헬퍼(예: button 색·shadow 등) 도입 — 본 라운드는 데이터→토큰 클래스 한정.
- 디자인 토큰 자동 추출(globals.css → TS) — Tailwind v4가 이미 처리.
- 우선순위 색·아이콘 재매핑 — phase-4.5 §2.7 묶음 A 영역.
- 진행률 바 디자인 변경.
- 체크 시 컨페티 등 추가 애니메이션 — phase-4.5 §2.6 UX #3.
