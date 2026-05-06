# pregnancy-week-onboarding 디자인 문서

> 작성일: 2026-05-05
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)
> 시스템 헌법: [DESIGN.md](../../../DESIGN.md), [src/app/globals.css](../../../src/app/globals.css)

## review.md 결정사항 참조

- **항목 2 (C)**: 홈 풀스크린 onboarding 유지 + 정보 탭·체크리스트·기타 진입 페이지에 닫기 가능 슬림 배너
- **항목 3 (A)**: 홈 상단 카드 = lavender(secondary) 카드 + 액션 버튼만 pink. DueDateInput in-place 강화, DueDateBanner 통합/삭제, 입력 후 peach data role 정보 카드 변신

## 1. 화면 목록·플로우

| 화면 | 역할 | 트리거 |
|---|---|---|
| **홈 OnboardingFlow** (기존 유지) | 풀스크린 3단계 onboarding | `localStorage('onboarding-completed') === null` + `/` 진입 |
| **글로벌 슬림 배너** (신규) | 홈 외 진입 시 도구 존재 알림 | `localStorage('onboarding-completed') === null` + `localStorage('onboarding-banner-dismissed') === null` + 홈 외 페이지 |
| **홈 상단 카드 — 입력 모드** (DueDateInput 재설계) | 미입력자 입력 유도 | `useDueDateStore.dueDate === null` |
| **홈 상단 카드 — 정보 모드** (신규 변신) | 입력자에게 현재 주차 + D-day 표시 | `useDueDateStore.dueDate !== null` |
| **에러 토스트** (재사용) | 잘못된 dueDate 입력 거부 안내 | `setDueDate()` 검증 실패 (과거 날짜 또는 40주 이상 미래) |

### 플로우 다이어그램

```
사용자 첫 방문
   │
   ├─ 홈(/) 진입 ─────► OnboardingFlow 풀스크린 (기존 phase-2.5 Step 1~3)
   │                        │
   │                        ├─ 예정일 입력 ──► dueDate 저장 + 홈 정보 모드
   │                        └─ "나중에" ─────► 홈 입력 모드
   │
   └─ /articles/* 등 직진 ─► 슬림 배너 + 페이지 본문
                                │
                                ├─ 클릭 ──► / 이동 → OnboardingFlow
                                └─ X ────► localStorage 저장 → 다음 진입 시 미노출
```

## 2. 컴포넌트

### 2.1 신규

- **`OnboardingBanner`** (글로벌)
  - 위치: `src/components/onboarding/OnboardingBanner.tsx`
  - 마운트 위치: `src/app/layout.tsx` 또는 각 페이지 client wrapper의 공통 자리. 단 dev 페어 우려(상태 책임 분산)에 따라 **단일 client provider 컴포넌트**로 묶음 — 예: `src/components/providers/OnboardingBannerProvider.tsx`에서 `usePathname()` + localStorage 체크 후 조건부 렌더
  - 의존 store: 없음 (localStorage 직접 read, store 분리). 이유: `onboarding-banner-dismissed`는 `useDueDateStore`와 다른 라이프사이클 — 별도 zustand store(`useOnboardingBannerStore`) 또는 직접 localStorage useState 패턴 중 후자 채택(영구 인프라 회피)

### 2.2 재사용

- **`OnboardingFlow`** ([src/components/onboarding/OnboardingFlow.tsx](../../../src/components/onboarding/OnboardingFlow.tsx)) — 풀스크린 3단계, 변경 없음
- **`HomeContent`** ([src/components/home/HomeContent.tsx:50-53](../../../src/components/home/HomeContent.tsx#L50-L53)) — onboarding 트리거 로직 변경 없음
- **`DueDateInput`** ([src/components/home/DueDateInput.tsx](../../../src/components/home/DueDateInput.tsx)) — **재설계**: 입력 모드 + 정보 모드 두 상태 분기, lavender/peach role 정합
- **sonner Toaster** (이미 셋업되어 있음, designer 학습 기록 §154 참조) — 에러 토스트는 sonner의 `toast.error()` 사용

### 2.3 삭제/통합

- **`DueDateBanner`** ([src/components/home/DueDateBanner.tsx](../../../src/components/home/DueDateBanner.tsx)) — 삭제. 시나리오 2 슬림 배너로 대체. 현재 timeline 페이지에서 import하는 곳이 있다면 함께 정리

## 3. 상태별 시안

### 3.1 글로벌 슬림 배너

```
┌─────────────────────────────────────────────────┐
│ 📅  예정일 입력하면 주차별로 정렬된 체크리스트   ✕  │
│     를 볼 수 있어요                              │
└─────────────────────────────────────────────────┘
```

| 상태 | UI |
|---|---|
| **default** | `bg-pastel-yellow/20 border border-pastel-yellow/40 rounded-xl`. 좌측 lucide `Calendar` 아이콘(yellow=info 정합), 본문 텍스트(`text-sm text-accent-olive`), 우측 X 버튼(`text-muted-foreground hover:text-foreground`) |
| **dismissed** | localStorage 기록 후 unmount. 페이지 새로고침 시에도 미노출 |
| **mobile 320px** | 텍스트 2줄 wrap. X 버튼 우상단 고정. 닫기 hit area 최소 44×44 |

- yellow=info role 적용 — 현재 [DueDateBanner.tsx](../../../src/components/home/DueDateBanner.tsx)와 동일한 컬러 컨벤션 유지(컬러 컨벤션 충돌 없음)
- `word-break: keep-all` 적용 (한국어 본문)
- 클릭 영역: 배너 본체 = `<Link>`, X 버튼 = 별도 `<button>` (이벤트 stopPropagation)

### 3.2 홈 상단 카드 — 입력 모드 (dueDate=null)

```
┌──────────────────────────────────────┐
│ 📅 예정일을 알려주세요                 │
│                                       │
│ 예정일을 입력하면 주차별 체크리스트와  │
│ D-day로 정렬된 정보를 볼 수 있어요    │
│                                       │
│ ┌──────────────────────────────────┐ │
│ │ [날짜 선택]                       │ │
│ └──────────────────────────────────┘ │
│                                       │
│ ┌──────────────────────────────────┐ │
│ │       예정일 저장 →               │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

| 요소 | 토큰 |
|---|---|
| 카드 배경 | `bg-pastel-lavender/40` (secondary) |
| 카드 radius | `rounded-2xl` (page-level 카드 컨벤션) |
| shadow | `shadow-md` (input-bearing 카드, designer §AP6 정합) |
| 헤더 텍스트 | 시맨틱 `<h2>` (홈 페이지 위계) — 글로벌 h2 스타일 그대로 |
| 본문 텍스트 | `text-sm text-foreground word-break: keep-all` |
| date input | `bg-input-background rounded-xl border border-black/6` (현재 [DueDateInput.tsx:40](../../../src/components/home/DueDateInput.tsx#L40) 와 동일) |
| CTA 버튼 | `bg-pastel-pink/60 text-foreground` 풀너비 + lucide `ArrowRight` (designer §AP8 — `→` 텍스트 화살표 거부) |

### 3.3 홈 상단 카드 — 정보 모드 (dueDate 존재)

```
┌──────────────────────────────────────┐
│ 🗓️ 현재 24주차 · D-114                │
│                                       │
│ 출산 예정일: 2026-08-27               │
│                                       │
│ [수정]                                 │
└──────────────────────────────────────┘
```

| 요소 | 토큰 |
|---|---|
| 카드 배경 | `bg-pastel-peach/40` (data role) |
| 헤더 | `<h2>` "현재 N주차 · D-N" — 큰 숫자 강조 가능 (`<strong>`) |
| 본문 | `text-sm text-muted-foreground` "출산 예정일: YYYY-MM-DD" |
| 수정 버튼 | `outline` variant, `text-sm` — pink CTA 아님(데이터 카드 위계) |

### 3.4 OnboardingFlow (변경 없음)

- 기존 [phase-2.5 Step 1~3 와이어프레임](../../plan/phase-2.5.md) 그대로 유지
- 카피·디자인 변경은 spec.md won't 영역

### 3.5 에러 토스트 (잘못된 dueDate 입력)

```
┌───────────────────────────────────────┐
│ ⚠ 출산 예정일을 다시 확인해주세요      │
│                                        │
│ 오늘 이후 ~ 40주 이내 날짜를 입력해주  │
│ 세요                                   │
└───────────────────────────────────────┘
```

| 요소 | 토큰 / 동작 |
|---|---|
| 라이브러리 | sonner `toast.error()` (재사용, 신규 인프라 도입 X) |
| 위치 | sonner 기본 (모바일 하단 중앙). BottomNav 위로 띄움 |
| duration | 4000ms 자동 dismiss + 사용자 X 클릭 시 즉시 dismiss |
| 카피 | 헤더 "출산 예정일을 다시 확인해주세요" + 본문 "오늘 이후 ~ 40주 이내 날짜를 입력해주세요" |
| 톤 | designer N5(의료 안전 경계) 정합 — 단정형·공포형 카피 회피, "다시 확인" 정보 톤 |
| 색 | sonner 기본 error 톤 사용. 별도 토큰 오버라이드 X |
| 시맨틱 | sonner 자체가 `role="status" aria-live="polite"` 자동 적용 |
| 트리거 | `DueDateInput`의 `handleDateChange` 내부에서 `calcPregnancyWeek` 결과 검증 실패 시 호출. store에 잘못된 값 저장 X (현재 input 빈 값으로 reset) |

- 입력 input 자체 시각 변화는 없음(focus ring 그대로). 토스트만 노출 — 두 군데 동시 강조는 인지 부하 룰 위반
- `prefers-reduced-motion: reduce` 사용자에게는 sonner 기본 페이드 동작 유지 (sonner 자체 reduced-motion 지원)

### 3.6 상태 매트릭스

| 사용자 상태 | 홈(/)에서 보이는 것 | /articles/* 등에서 보이는 것 |
|---|---|---|
| 첫 방문 (onboarding 미완) | 풀스크린 OnboardingFlow | 슬림 배너 + 페이지 본문 |
| onboarding 완료 + dueDate=null | 홈 입력 모드 카드 + 페이지 본문 | 페이지 본문만 (배너 미노출 — onboarding 완료자) |
| dueDate 존재 | 홈 정보 모드 카드 + 페이지 본문 | 페이지 본문만 |
| onboarding 미완 + 배너 dismissed | 풀스크린 OnboardingFlow | 페이지 본문만 |
| 시크릿 모드(localStorage 손실) | 풀스크린 OnboardingFlow (첫 방문 동일) | 슬림 배너 + 페이지 본문 |

## 4. 인터랙션·애니메이션

| 인터랙션 | 트리거 | 피드백 | duration |
|---|---|---|---|
| 슬림 배너 등장 | mount 시 (조건 true) | fade-in opacity 0→1 | 200ms |
| 슬림 배너 dismiss | X 클릭 | fade-out + slide-up + localStorage 저장 | 250ms |
| 입력 모드 → 정보 모드 전환 | dueDate 저장 직후 | 카드 배경 lavender → peach 크로스페이드 + 컨텐츠 swap | 300ms |
| date input focus | 포커스 진입 | `ring-2 ring-pastel-pink/50` (현재 [DueDateInput.tsx:40](../../../src/components/home/DueDateInput.tsx#L40) 컨벤션 유지) | 150ms |
| 정보 모드 "수정" → 입력 모드 | 클릭 | 정보 모드 → 입력 모드 역전환 | 300ms |
| 에러 토스트 등장 | 잘못된 dueDate 입력 | sonner 기본 페이드+슬라이드, 4000ms 자동 dismiss | sonner 기본 |

- 컨페티/축하 애니메이션 X (designer §3.6 — "이 인터랙션이 정말 축하받을 만한가?" 통과 안 됨, 매 입력마다 컨페티는 과함)
- `prefers-reduced-motion: reduce` 사용자에게는 fade/slide 없이 즉시 전환

## 5. 토큰·접근성

### 5.1 사용 토큰

```css
/* globals.css 기존 토큰 활용 */
--background: cream canvas
--pastel-lavender: secondary CTA·info card 본체
--pastel-pink: primary CTA 버튼 only
--pastel-peach: 입력 후 data card 본체
--pastel-yellow: 슬림 배너 info 톤 (기존 DueDateBanner 컨벤션)
--accent-olive: 슬림 배너 텍스트
--input-background: date input
--border: --border 토큰 (whisper border = black/4)
--muted-foreground: 보조 텍스트
```

- 신규 토큰 도입 X — DESIGN.md 5-pastel role 디시플린 정합
- raw hex 인라인 X

### 5.2 접근성 (WCAG 2.1 AA)

- **색 대비**:
  - lavender/40 + foreground (검정) → 4.5:1 이상 검증
  - pink/60 + foreground → 4.5:1 이상 검증 (designer N1)
  - peach/40 + foreground → 4.5:1 이상 검증
- **시맨틱**:
  - 카드 헤더는 `<h2>` (시맨틱·시각 일치, designer §AP3)
  - date input은 `<label htmlFor>` + `<input type="date" id>` (designer N2)
  - CTA는 `<button>` 또는 `<a>` (현재 코드 컨벤션). div + role="button" 패턴 X
  - 슬림 배너 본체는 `<a>` (Link), X는 별도 `<button>` — 인터랙티브 중첩 회피 (designer §AP4)
- **키보드 흐름**:
  - 슬림 배너: Tab으로 본체 → X 순서 도달
  - 홈 카드 입력 모드: Tab으로 date input → CTA 버튼
  - 홈 카드 정보 모드: Tab으로 수정 버튼
  - focus-visible 토큰 적용
- **스크린리더 라벨**:
  - 슬림 배너 X 버튼: `aria-label="배너 닫기"`
  - 정보 모드 수정 버튼: `aria-label="예정일 수정"`
- **한국어 본문**: `word-break: keep-all` 적용 (designer N6)

### 5.3 모바일 320px 검증

- 슬림 배너: 텍스트 2줄 wrap, X 버튼 우상단 (44×44 hit area)
- 홈 입력 모드: date input 풀너비, CTA 버튼 풀너비
- 홈 정보 모드: 헤더 1줄에 "현재 24주차 · D-114" 들어감 (320px 폭에서 검증 필요)
