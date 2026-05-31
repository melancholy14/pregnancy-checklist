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
