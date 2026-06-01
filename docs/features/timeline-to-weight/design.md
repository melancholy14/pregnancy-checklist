# timeline-to-weight 디자인 문서

> 작성일: 2026-05-31
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)
> 디자인 시스템 SoT: [DESIGN.md](../../../DESIGN.md), [src/app/globals.css](../../../src/app/globals.css)
> 페르소나: [docs/design/persona.md](../../design/persona.md)
> 도메인 UX SoT: [docs/design/weight/](../../design/weight/), [docs/design/timeline/](../../design/timeline/)

## review.md 결정사항 참조

- **결정 3 (C 변형)**: /weight 상단 클릭 가능한 텍스트 1줄. linked 있으면 /checklist 진입, 없으면 expand. /checklist 허브 별도 블록 추가 없음 (designer §3.5 인지부하 + planner §7.5 정합)
- **결정 1 (B)**: zustand migration 함수 추출 — UI 영향 없음, 데이터 무결성만 (designer §3 N7)
- **결정 2 (B)**: GA4 dual-fire 4주 — UI 영향 없음, 발사 코드만

## 1. 화면 목록·플로우

### 1.1 영향받는 화면

| 화면 | 변경 |
|---|---|
| `/weight` ([src/components/weight/WeightContainer.tsx](../../../src/components/weight/)) | 상단에 **WeekContextRow** 신규 추가. 체중 입력 폼·그래프 영역 그대로 유지 |
| `/timeline` ([src/app/timeline/page.tsx](../../../src/app/timeline/)) | meta-refresh redirect 페이지로 재작성 (phase-4.6 §1 /info·/videos 패턴). 사용자 안내 1줄 + `<meta http-equiv="refresh">` |
| `/` 홈 ([src/components/home/HomeContent.tsx](../../../src/components/home/)) | 5개 컴포넌트 중 timeline 참조 갱신 (`/timeline` → `/weight`) — 시각 디자인 변경 없음 |
| `/checklist` 허브 ([src/components/checklist/ChecklistHub.tsx](../../../src/components/checklist/)) | "이번 주 할 일" 블록 추가 **없음** (review §5 항목 3 결정) — 디자인 변경 없음, 내부 링크만 갱신 |

### 1.2 화면 플로우

```
A. /weight 진입 (dueDate 입력 사용자)
   ↓
   WeekContextRow 렌더 (현재 주차 컨텍스트 1줄)
   ↓ 클릭
   ├─ linked_checklist_ids 있음 → /checklist?slug={slug} 이동
   └─ linked_checklist_ids 없음 → 같은 화면에서 description expand (AccordionCard 흡수)

B. /timeline?week=24 외부 진입
   ↓
   redirect 페이지 (1초 미만) → /weight?week=24
   ↓
   /weight mount, searchParams 읽음 → WeekContextRow 가 week=24 컨텍스트 표시
```

## 2. 컴포넌트

### 2.1 신규

- **`WeekContextRow.tsx`** ([src/components/weight/WeekContextRow.tsx](../../../src/components/weight/) — 신규)
  - 위치: /weight 상단, 체중 입력 폼 위
  - 책임: 현재 주차 컨텍스트 1줄 표시 + 클릭 라우팅
  - props: `{ week: number; dueDate?: Date }` — dueDate 미입력 시 CTA 모드로 분기 (§3.3)
  - 내부: `weight_context_items.json` 에서 week 매칭 항목 1개 lookup → linked 분기

- **`WeekContextExpanded.tsx`** ([src/components/weight/WeekContextExpanded.tsx](../../../src/components/weight/) — 신규)
  - linked 없는 항목 클릭 시 expand 영역. 기존 AccordionCard 흡수
  - description + type · priority 메타 (시각 분류는 §4 단일 톤)
  - `word-break: keep-all` (designer §3 N6 한국어 본문 룰)

### 2.2 재사용

- **AccordionCard** ([src/components/timeline/AccordionCard.tsx](../../../src/components/timeline/) → [src/components/weight/AccordionCard.tsx](../../../src/components/weight/) 이동)
  - timeline 폴더 통째 폐기 전 expand 패턴만 weight 폴더로 이동
  - 사용 위치 1군데 (WeekContextExpanded.tsx) 로 축소 — 다른 timeline 참조 모두 폐기됨

### 2.3 폐기

- `src/components/timeline/TimelineContainer.tsx` 및 폴더 전체
- 단 `AccordionCard` 만 §2.2 처럼 weight 폴더로 이동

## 3. 상태별 시안

### 3.1 default — dueDate 입력 + 주차 4~40 + 컨텍스트 항목 있음

```
┌─────────────────────────────────────────────┐
│ 24주차 · D-100                              │  ← muted text (text-muted-foreground)
│ 임신성 당뇨 검사 및 유모차 구매        →    │  ← lavender row (bg-pastel-lavender/30)
└─────────────────────────────────────────────┘
[권장 체중 카드]
[체중 입력 폼]
[체중 그래프]
```

- 클릭 영역: 1줄 전체 (mobile 320px 한 줄 안 끊김 검증 — designer §4 체크리스트)
- 화살표: `lucide-react` `ChevronRight` (aria-hidden) — `→` 텍스트 금지 (designer §5 AP8)

### 3.2 default — linked 있음 vs 없음 시각 차이

- linked 있음: `ChevronRight` 아이콘 + 클릭 시 page transition (cursor: pointer 명시)
- linked 없음: `ChevronDown` 아이콘 + 클릭 시 same-page expand (`aria-expanded` 토글)

### 3.3 dueDate 미입력 (신규 사용자)

```
┌─────────────────────────────────────────────┐
│ 출산예정일을 입력하면 이번 주 정보를 보여드려요 │  ← yellow/30 (info)
│                                          →  │
└─────────────────────────────────────────────┘
```

- 클릭 시 onboarding 진입 (`OnboardingBannerProvider` 트리거)
- weight_week_view 이벤트 발사 X (`week=undefined` 면 noise)

### 3.4 주차 범위 밖 (week < 4 또는 week > 40)

```
[week < 4]
임신 준비 중 · 출산예정일 D-{n}        (회색, 클릭 영역 없음)

[week > 40]
출산 후 · D+{n}                          (회색, 클릭 영역 없음)
```

- text-muted-foreground, hover 효과 없음
- weight_week_view 발사 X

### 3.5 loading / 미하이드레이션

- 첫 hydration 전: 1줄 자리에 skeleton (`h-12 bg-muted animate-pulse rounded-xl`)
- hydration 직후 SSG 데이터 → store hydration 완료 시 실제 콘텐츠 swap

### 3.6 error (weight_context_items.json 로드 실패)

- 1줄 자리 자체 미렌더 (silent fail) — /weight 다른 영역은 정상 작동
- console.warn 만 (사용자 노출 X). 정적 import 라 발생 가능성 매우 낮음

### 3.7 redirect 페이지 (`/timeline`·`/timeline?week=N`)

```
페이지 중앙:
"/timeline 이 /weight 로 통합되었습니다"
"잠시 후 자동 이동합니다…"

<meta http-equiv="refresh" content="0;url=/weight">
<meta name="robots" content="noindex">
```

- 정적 텍스트만 (next/link 금지 — phase-4.6 §1 후속 정리 a9e6110 참조)
- 일반 `<a href="/weight">바로 이동</a>` 폴백 1줄

## 4. 인터랙션·애니메이션

### 4.1 컨텍스트 1줄 클릭 (linked 있음)

- 트리거: 1줄 영역 tap/click
- 피드백: `active:bg-pastel-lavender/50` (0.1s)
- 라우팅: `next/navigation` `useRouter().push('/checklist?slug=...')` (client-side)
- GA4: `axis_cross_link` 발사 (ga4.md §2.1)

### 4.2 컨텍스트 1줄 클릭 (linked 없음)

- 트리거: 1줄 영역 tap/click
- 피드백: 1줄 자체는 `aria-expanded` 토글, 하위 expand 영역 fade-in (`transition-all duration-200 ease-out`)
- 위치: 1줄 바로 아래에 inline expand (page reflow OK — mobile 짧은 영역이라 노출 안정)
- GA4: `week_context_expand` 발사 (open/close 양방향)

### 4.3 mobile long-press (선택, spec §3.2 should)

- 클릭 안 하고 long-press 시 description tooltip 미리보기 (linked·non-linked 공통)
- 구현 우선순위 낮음 — 미구현 시 무영향

## 5. 토큰·접근성

### 5.1 사용 토큰 (DESIGN.md / globals.css)

| 용도 | 토큰 | 비고 |
|---|---|---|
| 컨텍스트 1줄 배경 (linked 있음) | `bg-pastel-lavender/30` | secondary "현재 보고 있는 컨텍스트" — designer §6 AP-Cross-2 결정 정합 |
| 컨텍스트 1줄 배경 (linked 없음) | `bg-pastel-lavender/30` | 동일 — 두 상태 시각 차이는 chevron 아이콘으로만 (인지부하 ↓) |
| dueDate 미입력 CTA | `bg-pastel-yellow/30` | info — 행동 유도 X (pink 금지) |
| 주차 범위 밖 메시지 | `text-muted-foreground` | 회색 muted |
| 본문 텍스트 | `text-foreground` | cream canvas 위 기본 |
| chevron 아이콘 | `text-muted-foreground` | aria-hidden |
| skeleton | `bg-muted animate-pulse` | hydration 전 |
| 카드 radius | `rounded-xl` | row 라 page-level 카드 `rounded-2xl` 가 아님 (designer §5 AP9) |
| shadow | `shadow-sm` | 정보 row — `shadow-md` 금지 (designer §5 AP6) |
| 패딩 | `px-4 py-3` | 모바일 wrapper `pb-24 px-4` 안 — designer §3 |

### 5.2 type 별 시각 분류 (spec.md §3.2 should — 단일 톤으로 시작)

- 본 phase 출시 시점: 5종 type (admin·prep·wellbeing·shopping·education) 모두 동일 `bg-pastel-lavender/30` (designer §6 AP-Cross-2 lavender=현재 컨텍스트 룰 단일)
- 시각 분류 정교화는 Phase 5 P11 콘텐츠 매트릭스 sketch 이후로 미룸
- 단 priority 표시는 본 phase 에 안 들임 (인지부하 — designer §3.5 한 화면 결정 1개)

### 5.3 접근성 (designer §3 N1 WCAG 2.1 AA)

- **시맨틱**: 1줄이 `<button>` (linked·non-linked 양쪽 모두 — linked 도 `<a>` 가 아닌 `<button>` 으로 통일하고 `useRouter().push` 사용. 이유: linked 분기 결정 시점이 데이터 lookup 후이고, 단일 시맨틱이 스크린리더 일관성 ↑)
- **focus-visible**: `focus-visible:ring-2 focus-visible:ring-pastel-pink/60 focus-visible:outline-none` — pink 는 focus indicator 용 (CTA 색이지만 focus 는 OK)
- **aria-expanded**: linked 없음 분기에서 expand 토글 시 토글. linked 있음 분기에서는 X
- **aria-label**: "{week}주차 · {title}, {linked ? '체크리스트로 이동' : '자세히 보기'}"
- **color contrast**: pastel-lavender/30 + text-foreground = AA 통과 검증 (axe-core PR 체크 의무 — designer §3.1)
- **한국어 본문**: `word-break: keep-all`, line-height 1.85 (designer §3 N6 + .article-prose 컨벤션)
- **mobile 320px**: 1줄 안에 "24주차 · 임신성 당뇨 검사 및 유모차 구매" 안 끊김 검증 — 7글자+15글자 = 약 22글자 한국어. 320px 본문 폰트 14px 기준 한 줄 ~18글자 한계 → **2줄 wrap 허용** (강제 1줄 아님)

### 5.4 다크 패턴·민감 데이터 (designer §3 N3·N4)

- URL 쿼리에 출산예정일·BMI·체중 노출 0건 (`/weight?week=24` 만 허용)
- 가짜 카운트·뱃지 0건 (예: "이번 주 7명이 이 항목을 완료했어요" 류 금지)
- 사용자 동의 없이 자동 옵트인 X — week_context_expand 는 사용자 클릭이 트리거

### 5.5 안티패턴 회피 체크 (designer §5)

- AP1 (pink 를 데이터에 사용): X — 컨텍스트 row 는 lavender
- AP2 (linear-to-white 페이지 배경): X — 그대로 cream canvas
- AP3 (시맨틱·시각 불일치): X — h 태그 사용 안 함, 본문 row 만
- AP4 (interactive 중첩): X — `<button>` 안에 다른 button 없음
- AP5 (raw hex): X — 모든 색 토큰
- AP6 (shadow-md on 정보 카드): X — `shadow-sm` 적용
- AP7 (`border-gray-200`): X — `border-black/4` (DESIGN.md whisper border)
- AP8 (`→` 텍스트 화살표): X — lucide `ChevronRight/Down` 아이콘
- AP9 (`rounded-xl`/`rounded-2xl` 혼용): row 는 `rounded-xl` 의도적 비대칭
- AP10 (`backdrop-blur-xl`): X — BottomNav 시그니처만

## 6. 화면별 영향 SoT 갱신

- [docs/design/weight/](../../design/weight/) 의 ux.md / ui.md 에 WeekContextRow 컴포넌트 정의 추가
- [docs/design/timeline/](../../design/timeline/) 폴더 통째 폐기 후보 — 흡수 머지 후 docs-cleanup 스킬로 정리
- [DESIGN.md](../../../DESIGN.md) 본 phase 신규 토큰 도입 없음 (기존 lavender·yellow·muted 활용)

## 7. Addendum: 흡수 후 UX gap 보강 (2026-06-01)

> 추가 작성일: 2026-06-01
> 관련: [spec.md §6](./spec.md), [review.md §7](./review.md)
> 본 Addendum 은 흡수 머지 후 발견된 "카드 약속 ↔ 도착 화면 불일치" 와 "콘텐츠 squash" 두 gap 의 시각 디자인을 정의

### 7.1 영향받는 화면 (추가)

| 화면 | 변경 |
|---|---|
| `/checklist` 허브 ([src/components/checklist/ChecklistHub.tsx](../../../src/components/checklist/ChecklistHub.tsx)) | "주차별 타임라인" 카드 → "체중과 주차별 가이드" 로 카피·메트릭 정정 + 페이지 본문 `PageDescription` 도 카드 카피와 정합 갱신. 카드 시각 자체는 동일 패턴 유지 |
| `/weight` ([src/components/weight/WeightContainer.tsx](../../../src/components/weight/)) | **WeightChart 아래**에 **"전체 40주 미리 보기 (1·2·3기)" 토글** 신규 추가. 펼친 상태에서 트라이메스터 3그룹 + 36개 mini row 렌더 (1기 9·2기 14·3기 13) |

### 7.2 ChecklistHub 카드 시안

**AS-IS** (현재 출시):
```
🗓️ 주차별 타임라인                                 →
   임신 4주부터 40주까지 주차별로 해야 할 검사·준비
   [24주차] [체크 항목 12개]
   ▓▓▓▓▓▓▓▓░░░░░░░░░░  3/12
```

**TO-BE** (Addendum 정정):
```
🗓️ 체중과 주차별 가이드                            →
   이번 주 행정 일정과 체중 변화를 함께 확인하세요
   [24주차] [체중 기록 8건 · 최근 5/30]
```

**TO-BE — 체중 기록 0건 분기**:
```
🗓️ 체중과 주차별 가이드                            →
   이번 주 행정 일정과 체중 변화를 함께 확인하세요
   [24주차] [기록 시작하기]   ← peach 톤 CTA
```

- 제목 "체중과 주차별 가이드": 한국어 자연어 + 형제 카드 명사구 톤 정합 + 도착 `/weight` H1 "체중 기록" 첫 단어 일치. "&" ampersand 대신 "과" 조사로 한국어 정합
- 설명 "이번 주 행정 일정과 체중 변화를 함께 확인하세요": "행정 일정" 으로 timeline 콘텐츠 (검사·준비) 의 진짜 가치 묘사, "함께" 가 흡수의 본질
- 진행률 Progress bar 제거: weight 축은 "달성률" 의미가 약함 (체중 증가는 누적·시간 축이지 목표 비율 X). 체크리스트 진행률은 본 카드 위 형제 카드 3개 (출산 가방·남편·임신 준비)와 의미 중복
- 메트릭 배지 2개: `{N}주차` (기존 유지) + `체중 기록 N건 · 최근 M/D`
- 기록 0건 시 두 번째 배지: `"기록 시작하기"` (peach 톤) — yellow 톤은 dueDate 미입력 자리에 양보

### 7.2-bis ChecklistHub 페이지 본문 `PageDescription` 시안

**AS-IS** ([src/components/checklist/ChecklistHub.tsx:179-182](../../../src/components/checklist/ChecklistHub.tsx#L179-L182)):
```
임신부터 출산까지, 빠뜨리지 않고 준비하세요.
주차별 타임라인부터 출산가방·남편준비·임신준비까지
목적에 맞는 체크리스트를 골라 사용할 수 있어요.
체크 상태는 기기에 자동 저장되어 다시 방문해도 그대로 남아 있어요.
```

**TO-BE**:
```
임신부터 출산까지, 빠뜨리지 않고 준비하세요.
체중·주차 가이드부터 출산가방·남편준비·임신준비까지
목적에 맞는 체크리스트를 골라 사용할 수 있어요.
체크 상태는 기기에 자동 저장되어 다시 방문해도 그대로 남아 있어요.
```

- 사유: 카드만 정정하면 본문이 카드 제목과 어긋남. fs-level 가드 (`grep -rn "주차별 타임라인" src/` 0건) 도 본문 문구 잡음. middle-dot 으로 "체중·주차" 짧게 압축

### 7.3 /weight "전체 주차 보기" 토글 시안

#### 7.3.1 닫힌 상태 (default)

```
[24주차 · 임신성 당뇨 검사 및 유모차 구매      →]   ← WeekContextRow 그대로
[체중 그래프]                                       ← WeightChart 즉시 노출
[       전체 40주 미리 보기 (1·2·3기)      ▾   ]   ← 신규 토글, ghost 톤
[체중 입력 리스트]
```

- **토글 위치 (변경)**: WeightChart **아래**, 체중 리스트 위. 사유: 사용자 진입 의도 1순위 = 체중 (도구 행동) — chart 즉시 노출 우선. 전체 주차 미리보기는 3순위 (다른 주차 탐색)
- 토글 텍스트: `"전체 40주 미리 보기 (1·2·3기)"` — 콘텐츠 양 (40주) + 구조 (1·2·3기) 명시로 발견율 ↑
- 토글 버튼: `bg-transparent border border-black/4 text-muted-foreground text-sm px-4 py-2.5 rounded-xl`
- chevron 아이콘: `ChevronDown` (`text-muted-foreground`)
- hover/focus: `hover:bg-pastel-lavender/15 focus-visible:ring-2 focus-visible:ring-pastel-pink/60`

#### 7.3.2 펼친 상태

```
[24주차 · 임신성 당뇨 검사 및 유모차 구매      →]   ← WeekContextRow
[체중 그래프]
[       전체 40주 미리 보기 (1·2·3기)      ▴   ]   ← 토글 (열림)

  ── 1기 (4~13주, 9개)
   [ 4주차 · 임신 확인                       →]   ← mini row (linked, chevron→)
   [ 5주차 · 임신 초기 생활 습관 점검         ▾]
   ...
   [13주차 · 1차 기형아 검사                  ▾]
   * 6주차 데이터 누락 (자리 비움)

  ── 2기 (14~27주, 14개)
   [14주차 · ...                              ▾]
   ...
   │[24주차 · 임신성 당뇨 검사 및 유모차 구매 ▾] ← 현재 주차 (좌측 thick pink)
   ...
   [27주차 · ...                              ▾]

  ── 3기 (28~40주, 13개)
   [28주차 · ...                              ▾]
   ...
   [32주차 · 입원 가방 점검                   →]   ← linked
   ...
   [40주차 · ...                              ▾]

[체중 입력 리스트]
```

- 그룹 헤더: `text-xs font-medium text-muted-foreground px-2 py-2` + 위아래 `mt-4 mb-1`. 우측에 `({N}개)` 카운트 (1기 9·2기 14·3기 13 실측)
- mini row 톤: `bg-pastel-lavender/20` (현재 WeekContextRow 의 `/30` 보다 한 단계 약함 — 위계상 보조 정보)
- mini row 사이즈: `px-3 py-2.5 text-xs rounded-xl` — **radius 는 WeekContextRow 와 동일 `rounded-xl` 일관** (2px 차이 인지 미미, 위계는 size·tone·left-border 로 충분)
- **현재 주차 mini row 강조 (변경)**: `border-l-4 border-l-pastel-pink/60` — 좌측 thick border 만. list-selection 익숙 패턴 (Notion·Linear·VSCode 사이드바). 전체 둘러싸는 `border` 대신 좌측만 — pink 가 CTA 색이라 "여기 클릭하면 뭔가 일어남" 오해 방지. AP1 의도 (5종 type 을 pink shade 로 줄세우기 금지) 침범 안 함 — 좌측 indicator 는 self-marker, data 분류 X
- linked 분기 chevron: linked 있음 `ChevronRight` (실측 4개: 4·32·35·36주차), 없음 `ChevronDown` (실측 32개 — 주된 동선) — WeekContextRow 와 동일 규칙

#### 7.3.3 linked 없는 mini row inline expand

```
[ 5주차 · 임신 초기 생활 습관 점검         ▾]
  ┌─────────────────────────────────────────┐
  │ 임신 5~6주는 입덧이 시작될 수 있는 시기   │  ← description, keep-all
  │ 입니다. 충분한 휴식과 균형 잡힌 영양 …    │
  └─────────────────────────────────────────┘
[ 6주차 · 첫 산전 검진                      →]
```

- expand 영역: `WeekContextExpanded` 컴포넌트 재사용. 단 mini 사이즈에 맞게 `px-3 py-2.5 text-xs` 오버라이드 (or props 화)
- 토글 행위: row 의 `aria-expanded` 토글. 동시에 여러 개 열기 허용 (accordion 단일 선택 강제 X — 사용자가 비교 보고 싶을 수 있음)

### 7.4 인터랙션·애니메이션 (추가)

#### 7.4.1 "전체 주차 보기" 토글

- 트리거: 버튼 tap/click
- 피드백: `transition-all duration-200 ease-out` — 트라이메스터 그룹 영역 fade-in + height auto (max-h-0 → max-h-screen)
- 첫 펼침 시 현재 주차 mini row 로 자동 스크롤: `scrollIntoView({ block: "center", behavior: "smooth" })` — should 항목 (spec §6.2.2)
- GA4: `week_context_browse_all_toggle(state: open|close)` 발사

#### 7.4.2 mini row 클릭 (전체 보기 안)

- linked 있음: `useRouter().push('/checklist?slug=...')` + `axis_cross_link(source="browse_all")` 발사
- linked 없음: 같은 mini row 아래 inline expand 토글 + `week_context_expand(source="browse_all", state)` 발사
- WeekContextRow (현재 주차) swap **하지 않음** — 사용자가 자기 주차 상실 위험 (spec §6.2.3 won't)

### 7.5 토큰·접근성 (추가)

#### 7.5.1 사용 토큰

| 용도 | 토큰 | 비고 |
|---|---|---|
| 전체 보기 토글 버튼 | `bg-transparent border-black/4` | ghost — primary 자리 아님 |
| mini row 배경 | `bg-pastel-lavender/20` | WeekContextRow `/30` 보다 한 단계 약함 |
| 현재 주차 mini row 강조 | `border-l-4 border-l-pastel-pink/60` | list-selection 좌측 thick (Notion·Linear·VSCode 사이드바 익숙 패턴). 전체 둘러싸기 X — pink 가 CTA 색이라 "클릭하면 뭔가 일어남" 오해 방지 |
| 그룹 헤더 | `text-muted-foreground text-xs` | secondary 정보 위계 + 우측 `({N}개)` 카운트 |
| mini row radius | `rounded-xl` | **WeekContextRow 와 동일 일관** (radius 사다리 제거 — 위계는 size·tone·left-border 로 충분) |
| mini row chevron | `text-muted-foreground` | 동일 (aria-hidden) |

#### 7.5.2 접근성

- 토글 버튼: `<button aria-expanded={open}>` + `aria-controls="week-context-browse-all"`
- 펼친 영역: `<section id="week-context-browse-all" role="region" aria-label="전체 주차 가이드">`
- 트라이메스터 그룹: `<h3 className="sr-only-style 적용 X — 시각 헤더 그대로">1기 (4~13주)</h3>`. 스크린리더 헤더로 인식되도록 시맨틱 보존
- mini row aria-label: WeekContextRow 와 동일 패턴 `"{week}주차 · {title}, {linked ? '체크리스트로 이동' : '자세히 보기'}"`
- 펼친 상태에서 키보드 탭 순서: 토글 → 1기 첫 row → 1기 두번째 row → ... → 40주차 row → 다음 페이지 영역. 트라이메스터 헤더는 탭 stop 아님
- 현재 주차 강조: pink border 외에 `aria-current="true"` 박음 — 스크린리더가 "현재 주차" 안내

#### 7.5.3 안티패턴 회피 (추가)

- AP1 (pink 를 데이터에 사용): **예외 적용** — 현재 주차 self-marker 는 데이터 분류 (type 별 색) 아님, 사용자 본인 위치 표시. designer §5 AP1 의 의도 (5종 type 을 5개 pink shade 로 줄세우기 금지) 와 충돌 안 함. 또한 `border-l-4` 좌측 thick 패턴은 list-selection 의 보편 indicator 라 사용자가 "여기 클릭" 보다 "내 위치" 로 인지. focus indicator 의 `focus-visible:ring-pastel-pink/60` 과도 시각 분리 (focus 는 ring, self-marker 는 border-l)
- AP9 (`rounded-xl`/`rounded-2xl` 혼용): mini row 는 WeekContextRow 와 동일 `rounded-xl` — radius 사다리 제거. 위계는 size (`text-sm` vs `text-xs`)·tone (`/30` vs `/20`)·left-border 로 충분. 페이지 카드 `rounded-2xl` / 모든 row `rounded-xl` 2단계 유지

### 7.6 화면별 영향 SoT 갱신 (추가)

- [docs/design/weight/](../../design/weight/) ux.md / ui.md 에 "전체 주차 보기" 토글 + 트라이메스터 그룹 시안 추가
- [docs/design/checklist/](../../design/checklist/) ui.md 에 "주차별 가이드 & 체중" 카드 카피·메트릭 갱신
- [DESIGN.md](../../../DESIGN.md) 신규 토큰 도입 없음 (기존 lavender·pink·muted 의 위계 조합)
