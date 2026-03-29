# Phase 0: Figma 디자인 이전 기록

**날짜**: 2026-03-29
**브랜치**: feat/figma-design
**목표**: Figma 프로토타입 디자인을 코드로 이전 + 기존 아키텍처 복원

---

## 변경 이력 요약

### 배경

Figma에서 디자인한 프로토타입을 코드로 이전하는 과정에서 일부 아키텍처 변경이 발생.
이후 기획서 기반으로 원래 설계를 복원하면서 Figma UI는 유지.

### Figma 이전 시 발생한 변경사항

| 항목 | 이전 전 (init) | Figma 이전 시 | 복원 후 |
|------|---------------|--------------|---------|
| Next.js | 16.2.0 | 15.3.2 | **16.2.0** (복원) |
| React | 19.2.4 | 18.3.1 | **19.2.4** (복원) |
| 타입 시스템 | `src/types/` 4개 파일 | 삭제 (인라인) | **복원** |
| 데이터 파일 | `src/data/` JSON 4개 | 삭제 (하드코딩) | **복원** |
| 데이터 추상화 | `data-source.ts` | 삭제 | **복원** |
| 상태 관리 | Zustand (계획) | localStorage 직접 | **Zustand persist** (구현) |
| UI 프리미티브 | `@base-ui/react` | `@radix-ui/*` | `@radix-ui/*` (Figma 유지) |
| 폰트 | Geist / Geist Mono | Poppins | Poppins (Figma 유지) |

### 복원 완료 항목

1. **Next.js 16.2.0 + React 19.2.4** 업그레이드
2. **타입 파일 복원**: `src/types/{checklist,timeline,babyfair,video}.ts`
3. **데이터 파일 복원**: `src/data/{checklist_items,timeline_items,babyfair_events,videos}.json`
4. **데이터 소스 추상화 복원**: `src/lib/data-source.ts` (`DATA_SOURCE=local|gcs`)
5. **Zustand store 구현**: 4개 store (`useDueDateStore`, `useChecklistStore`, `useTimelineStore`, `useWeightStore`)
6. **주차 계산 유틸리티**: `src/lib/week-calculator.ts`
7. **Static export 설정 복원**: `next.config.ts` (`output: 'export'`, `basePath`)

### Figma 디자인에서 유지한 항목

1. **파스텔 색상 시스템**: `#FFD6E0`, `#E8D5F5`, `#D5F0E8`, `#FFE8D0`, `#FFF8D0`
2. **Poppins 폰트**
3. **하단 네비게이션 (BottomNav)**: 6탭 고정 네비게이션
4. **페이지 UI/UX**: 홈, 체크리스트, 타임라인, 베이비페어, 체중, 영상 6페이지
5. **404 페이지**
6. **ImageWithFallback 컴포넌트**: `src/components/figma/`

---

## 버전 업그레이드에 따른 브라우저 호환성

### Next.js 16.2.0 + React 19 최소 브라우저 요구사항

| 브라우저 | 최소 버전 | 비고 |
|---------|----------|------|
| Chrome | 111+ | |
| Edge | 111+ | |
| Firefox | 111+ | |
| Safari | **16.4+** | iOS 16.4 이상 필요 |

### 모바일 OS별 최소 버전

| OS | 최소 버전 | Safari/Chrome 버전 | 비고 |
|----|----------|-------------------|------|
| **iOS** | **16.4+** | Safari 16.4+ | iOS 16.4 = 2023년 3월 출시. iPhone 8 이상 지원 |
| **Android** | **8.0+** (Oreo) | Chrome 111+ | Chrome은 Play Store에서 독립 업데이트. Android 8+ 면 Chrome 111 설치 가능 |

### 호환성 분석

- **iOS**: Safari 16.4+ 요구. iOS 15 이하 기기(약 5% 이하 점유율)는 미지원. iPhone 8(2017) 이상이면 iOS 16 업데이트 가능하므로 실질적 영향 매우 낮음.
- **Android**: Chrome이 OS와 독립적으로 업데이트되므로 Android 8.0 (2017) 이상이면 최신 Chrome 사용 가능. 실질적 호환성 문제 없음.
- **결론**: 타겟 사용자(20~40대 임산부)의 기기는 거의 100% 호환 가능.

---

## Next.js 15 → 16 주요 Breaking Changes

현재 프로젝트에 영향 있는 항목:

| 변경 사항 | 영향 | 조치 |
|----------|------|------|
| Turbopack이 기본 빌더 | `next build` 시 Turbopack 사용 | 별도 조치 불필요 (정상 빌드 확인) |
| Async Request APIs 필수 | `params`, `searchParams` 등이 Promise | 현재 dynamic route 없음, 영향 없음 |
| Node.js 20.9.0+ 필수 | Node 18 지원 중단 | 로컬 Node 버전 확인 필요 |
| `next/image` 캐시 TTL 변경 | 60s → 4h | `images: { unoptimized: true }` 사용 중이라 영향 없음 |
| `middleware` → `proxy` 이름 변경 | middleware 파일명 deprecated | 현재 middleware 없음, 영향 없음 |
| Parallel routes에 `default.js` 필수 | 빌드 실패 가능 | 현재 parallel routes 없음, 영향 없음 |

현재 프로젝트에 영향 없는 항목 (참고):
- AMP 지원 제거
- `next lint` 명령어 제거 (ESLint 직접 사용)
- Runtime configuration 제거
- ESLint Flat Config 필수

---

## 접근성 프리미티브 분석: @base-ui/react vs Radix UI

### 개요

Phase 0 초기 세팅 시 `@base-ui/react` (MUI Base)가 설치되었으나, Figma 이전 과정에서 `@radix-ui/*` 패키지로 변경됨.

### @base-ui/react

**장점:**
- MUI 팀에서 만든 **headless UI 프리미티브** (스타일 없음)
- 완전한 **WAI-ARIA 패턴** 구현 (키보드 네비게이션, 포커스 관리, 스크린 리더)
- `useRender` API로 커스텀 렌더링 가능 — 컴포넌트 내부 DOM 구조까지 제어
- `data-slot` 속성으로 시맨틱 스타일링 hooks 제공
- 단일 패키지 (`@base-ui/react` 하나로 모든 컴포넌트)
- React 19 공식 지원
- 번들 사이즈가 작음 (tree-shakeable)

**단점:**
- 비교적 신규 프로젝트 (2024~), 커뮤니티/생태계가 작음
- shadcn/ui와 직접 통합 안 됨 (shadcn은 Radix 기반)
- 문서가 Radix 대비 적음
- 컴포넌트 종류가 아직 Radix보다 적음

### @radix-ui/react

**장점:**
- **shadcn/ui의 공식 기반** — 가장 큰 장점
- 성숙한 프로젝트, 대규모 커뮤니티 + 풍부한 문서
- 50+ 컴포넌트 제공 (Radix Primitives 전체)
- WAI-ARIA 패턴 구현 충실
- 업계 표준 수준의 안정성
- Next.js/Vercel 팀과 긴밀한 관계

**단점:**
- **패키지가 분리됨** (`@radix-ui/react-dialog`, `@radix-ui/react-tabs` 등 개별 설치)
- `@base-ui/react`의 `useRender`/`data-slot` 같은 저수준 커스터마이징 API 없음
- 번들에 여러 Radix 패키지가 포함 (tree-shaking으로 완화 가능)

### 결론

| 기준 | @base-ui/react | @radix-ui |
|------|---------------|-----------|
| 접근성 수준 | ★★★★★ | ★★★★☆ |
| shadcn 호환성 | ✗ | ✓ |
| 생태계/커뮤니티 | 작음 | 대규모 |
| 커스터마이징 | 더 유연 | 충분 |
| 안정성 | 신규 | 검증됨 |

**현재 프로젝트 결정**: `@radix-ui` 유지.
이유: shadcn/ui와의 호환성이 프로젝트의 UI 개발 속도에 직접적인 영향. `@base-ui/react`의 접근성 이점은 실제 차이가 미미하고, Radix도 충분한 접근성을 제공함.

---

## shadcn/ui 전환 가능성 분석

### 현재 상태

Figma 이전 과정에서 shadcn/ui 컴포넌트 49개가 설치되었으나, **실제 페이지에서는 직접 Tailwind CSS로 스타일링**하고 있음. shadcn 컴포넌트를 import해서 사용하는 곳이 거의 없음.

### 전환 가능한 패턴 분석

| 현재 코드 패턴 | shadcn/ui 컴포넌트 | 전환 난이도 | 권장 |
|---------------|-------------------|-----------|------|
| 수동 체크박스 (div + Check 아이콘) | `<Checkbox />` | 낮음 | ✓ 권장 — 접근성 향상 |
| 수동 탭 (button + state) | `<Tabs />` | 낮음 | ✓ 권장 — 키보드 네비게이션 자동 |
| 수동 진행률 바 (div width%) | `<Progress />` | 낮음 | ✓ 권장 — ARIA progressbar |
| 카드 레이아웃 (div + shadow) | `<Card />` | 낮음 | 선택적 — 현재도 충분 |
| 배지 (div + bg color) | `<Badge />` | 낮음 | 선택적 |
| 날짜 입력 (input type=date) | `<Calendar />` + `<Popover />` | 중간 | 보류 — native input이 모바일에서 더 나은 UX |
| FAB 버튼 (button + fixed) | `<Button />` | 낮음 | 선택적 |
| 하단 네비게이션 | 해당 없음 | - | 커스텀 유지 |

### 권장 전환 우선순위

**Phase 1에서 전환 추천 (접근성 직접 영향):**

1. **체크리스트 체크박스** → `shadcn/ui Checkbox`
   - 현재: `<div onClick>` — 스크린 리더에서 체크박스로 인식 안 됨
   - 전환 후: ARIA `role="checkbox"`, 키보드(Space)로 토글 가능

2. **카테고리 탭** → `shadcn/ui Tabs`
   - 현재: `<button onClick>` — 탭 패널 연관관계 없음
   - 전환 후: ARIA `role="tablist"/"tab"/"tabpanel"`, 화살표 키 네비게이션

3. **진행률 바** → `shadcn/ui Progress`
   - 현재: `<div style={width}>` — 시맨틱 없음
   - 전환 후: ARIA `role="progressbar"` + `aria-valuenow`

**보류 (현재 충분):**
- Card, Badge, Button — 시각적 변경 없이 div/button으로도 접근성 충분
- Calendar — native date input이 모바일 UX에 더 적합

### 미사용 shadcn 컴포넌트 정리

현재 49개 중 실제 사용 가능한 것은 ~10개. 나머지는 Phase 1 이후 불필요 시 제거 검토:

```
사용 중/예정: badge, button, card, checkbox, progress, tabs
보류: calendar, dialog, form, input, label, select, sheet
제거 후보: accordion, alert-dialog, aspect-ratio, avatar, breadcrumb,
  carousel, chart, collapsible, command, context-menu, drawer,
  dropdown-menu, hover-card, input-otp, menubar, navigation-menu,
  pagination, popover, radio-group, resizable, scroll-area,
  separator, sidebar, skeleton, slider, sonner, switch, table,
  textarea, toggle, toggle-group, tooltip
```

---

## 추가된 패키지 (Figma 이전 시)

| 패키지 | 용도 | 현재 사용 여부 |
|--------|------|--------------|
| `@emotion/react`, `@emotion/styled` | MUI 스타일링 | ✗ 미사용 — 제거 후보 |
| `@mui/material`, `@mui/icons-material` | MUI 컴포넌트 | ✗ 미사용 — 제거 후보 |
| `@popperjs/core`, `react-popper` | 포지셔닝 | ✗ 미사용 — 제거 후보 |
| `react-dnd`, `react-dnd-html5-backend` | 드래그앤드롭 | ✗ 미사용 — 제거 후보 |
| `react-responsive-masonry` | 메이슨리 레이아웃 | ✗ 미사용 — 제거 후보 |
| `react-slick` | 슬라이더 | ✗ 미사용 — 제거 후보 |
| `motion` | 애니메이션 | 향후 사용 가능 — 보류 |
| `canvas-confetti` | 축하 효과 | 향후 사용 가능 — 보류 |
| `next-themes` | 테마 전환 | 향후 사용 가능 — 보류 |
| `react-hook-form` | 폼 관리 | 향후 사용 가능 — 보류 |

---

## 현재 폴더 구조 (복원 후)

```
src/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                    # 홈 (Zustand store 연동)
│   ├── not-found.tsx
│   ├── checklist/page.tsx          # JSON import + Zustand
│   ├── timeline/page.tsx           # JSON import + Zustand
│   ├── baby-fair/page.tsx          # 정적 데이터 (Figma 하드코딩 유지)
│   ├── weight/page.tsx             # Zustand store
│   └── videos/page.tsx             # 정적 데이터 (Figma 하드코딩 유지)
├── components/
│   ├── BottomNav.tsx
│   ├── figma/
│   │   └── ImageWithFallback.tsx
│   └── ui/                         # shadcn/ui (49개)
├── data/                           # 정적 JSON (복원)
│   ├── checklist_items.json        # 120개 항목
│   ├── timeline_items.json         # 27개 항목
│   ├── babyfair_events.json        # [] (Phase 2에서 채움)
│   └── videos.json                 # [] (수동 큐레이션 예정)
├── hooks/
│   └── use-mobile.ts
├── lib/
│   ├── utils.ts                    # cn()
│   ├── data-source.ts              # fetchData<T>() — local/gcs 전환 (복원)
│   └── week-calculator.ts          # calcPregnancyWeek() (신규)
├── store/                          # Zustand stores (신규)
│   ├── useDueDateStore.ts
│   ├── useChecklistStore.ts
│   ├── useTimelineStore.ts
│   └── useWeightStore.ts
└── types/                          # 타입 정의 (복원)
    ├── checklist.ts
    ├── timeline.ts
    ├── babyfair.ts
    └── video.ts
```

---

## 검증

```bash
npx tsc --noEmit   # ✅ TypeScript 에러 없음
npm run build       # ✅ 정상 빌드 (Turbopack, static export)
```

빌드 출력 (8 페이지 정적 생성):
- `/`, `/_not-found`, `/baby-fair`, `/checklist`, `/timeline`, `/videos`, `/weight`

---

## shadcn/ui 컴포넌트 전환 기록

**날짜**: 2026-03-29
**방법**: Playwright E2E 테스트로 기존 동작 캡처 → shadcn 전환 → 테스트 통과 검증

### 전환 내용

| 페이지 | 전환 전 | 전환 후 (shadcn) | 접근성 향상 |
|--------|---------|-----------------|-----------|
| 체크리스트 | `div onClick` 체크박스 | `Checkbox` (Radix) | `role="checkbox"`, Space 키 토글 |
| 체크리스트 | `button` 탭 | `Tabs/TabsTrigger` (Radix) | `role="tablist/tab/tabpanel"`, 화살표 키 |
| 체크리스트 | `div width%` 진행률 | `Progress` (Radix) | `role="progressbar"`, `aria-valuenow` |
| 체크리스트 | `div shadow` 카드 | `Card/CardContent` | 시맨틱 `data-slot` |
| 홈 | `div` 카드/배지 | `Card`, `Badge` | 시맨틱 구조 |
| 타임라인 | `div` 카드/배지 | `Card`, `Badge` | 시맨틱 구조 |
| 체중 | `div` 카드, `button` | `Card`, `Button` | 시맨틱 `button` role |
| 베이비페어 | `div` 카드/배지 | `Card`, `Badge` | 시맨틱 구조 |
| 영상 | `button` 탭, `div` 카드 | `Tabs/TabsTrigger`, `Card` | `role="tablist/tab"`, 키보드 네비게이션 |

### 전환 원칙

- **UI/UX 차이 없음**: 파스텔 색상, 둥근 모서리, 그림자 등 Figma 디자인 유지
- shadcn 기본 스타일을 `className`으로 override하여 기존 외관 보존
- Playwright 32개 테스트로 기능 동일성 검증

### Playwright E2E 테스트

```
e2e/
├── home.spec.ts          # 5 tests
├── checklist.spec.ts     # 6 tests
├── timeline.spec.ts      # 5 tests
├── weight.spec.ts        # 5 tests
├── baby-fair.spec.ts     # 4 tests
├── videos.spec.ts        # 5 tests
└── navigation.spec.ts    # 2 tests
```

```bash
npx playwright test   # ✅ 32 passed (14.6s)
```
