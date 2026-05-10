# design-bundle-d-uncheck-toggle-dday 디자인 문서

> 작성일: 2026-05-10
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- **항목 1-C**: D-day 라벨 매칭 = 미래 한정. 카피 = "**N주차에 챙기기**".
- **항목 3-B**: 빈 상태 카피 = "**지금 보이는 항목은 모두 체크했어요**".
- **페어 1**: 라벨 시각 톤 = `text-muted-foreground font-normal` (P2 `text-foreground font-medium`보다 약함).
- **페어 1**: 라벨 아이콘 = lucide `Clock` 또는 `CalendarClock` — design.md에서 1개 확정.
- **페어 3**: 토글 위치 = ChecklistPage 진행률 카드 아래, ChecklistHub 첫 항목 위 슬롯.
- **페어 3**: 토글 컴포넌트 = shadcn `Switch` + `data-[state=checked]:bg-pastel-lavender`.
- **페어 3**: focus-visible ring = `focus-visible:ring-2 focus-visible:ring-pastel-lavender focus-visible:ring-offset-2`.
- **페어 3**: 빈 상태 = AllDoneBadge 재활용 X, 신규 인라인 메시지(`text-sm text-muted-foreground text-center py-6`).

## 1. 화면 목록·플로우

본 묶음은 ChecklistPage(`/checklist/<slug>`) 단일 표면. 신규 화면 없음.

- **ChecklistPage 레이아웃 변화**: 진행률 카드(기존) → **토글 행 (신규)** → ChecklistHub(기존, props에 `showUncheckedOnly` 추가). 토글 행은 ChecklistHub 카드 헤더 안이 아닌 ChecklistPage 슬롯에 위치.
- **ChecklistItemRow 라벨 슬롯 분기**:
  - `recommendedWeek === currentWeek && !isChecked` → P2 "이번 주 추천" 라벨 (CalendarCheck, `text-foreground font-medium`)
  - `recommendedWeek > currentWeek && recommendedWeek !== 0 && !isChecked` → 본 묶음 "N주차에 챙기기" 라벨 (Clock, `text-muted-foreground font-normal`)
  - 그 외(과거·체크됨·=0·currentWeek null) → 라벨 없음
- **빈 상태 분기**: 토글 on + ChecklistHub items 필터 결과 0개 → ChecklistHub 항목 영역에 인라인 메시지.

### 슬롯 명세 (페어 3 토글 위치)

```
ChecklistPage
├── h1 + description
├── 진행률 카드 (기존)
├── 🆕 [토글 행] — 본 라운드 신규 슬롯
│   └── Switch + label "미체크만 보기"
├── ChecklistHub (기존, props 변경)
│   ├── 카드 헤더 (기존)
│   ├── ChecklistItemRow × N (필터링됨)
│   └── 🆕 [빈 상태 인라인 메시지] — items.length === 0 시
└── ShareButton (기존)
```

ChecklistHub 카드 헤더 안에 토글을 박지 않음 — 허브 카드의 시그니처 영역(이미 묶음 F에서 정합 진행 예정) 침범 회피.

## 2. 컴포넌트

### 신규
- **인라인 빈 상태 메시지**: 별도 React 컴포넌트 도입 X. ChecklistHub 또는 ChecklistPage 내 인라인 `<p>` 또는 `<div role="status">`. 카피 = "지금 보이는 항목은 모두 체크했어요".

### 재사용
- [src/components/ui/switch.tsx](src/components/ui/switch.tsx) — shadcn Switch (이미 설치되어 있다고 가정, 미설치 시 `pnpm dlx shadcn@latest add switch`).
- [ChecklistItemRow.tsx](src/components/checklist/ChecklistItemRow.tsx) — D-day 라벨 슬롯 추가. 마크업은 spec §3 M2 코드 블록 참조.
- [ChecklistHub.tsx](src/components/checklist/ChecklistHub.tsx) — props에 `showUncheckedOnly` 추가, items 필터링.
- [ChecklistPage.tsx](src/components/checklist/ChecklistPage.tsx) — 토글 state 보유 + ChecklistHub로 전달.

### 마크업 구조

```tsx
// ChecklistPage.tsx — 토글 행 슬롯
<div className="flex items-center justify-between mb-4 px-1">
  <label htmlFor="uncheck-only-toggle" className="text-sm text-foreground select-none cursor-pointer">
    미체크만 보기
  </label>
  <Switch
    id="uncheck-only-toggle"
    checked={showUncheckedOnly}
    onCheckedChange={(checked) => {
      setShowUncheckedOnly(checked);
      sendGAEvent("checklist_filter", {
        filter_type: "uncheck_only",
        value: checked ? "on" : "off",
      });
    }}
    className="data-[state=checked]:bg-pastel-lavender data-[state=unchecked]:bg-muted focus-visible:ring-2 focus-visible:ring-pastel-lavender focus-visible:ring-offset-2"
    aria-label="미체크만 보기"
  />
</div>

// ChecklistItemRow.tsx — 라벨 슬롯 (P2 + D-day 분기)
const showRecommendedLabel = isHighlighted && !isChecked;  // 기존 P2
const showUpcomingLabel =
  !isHighlighted &&
  currentPregnancyWeek !== null &&
  item.recommendedWeek > currentPregnancyWeek &&
  item.recommendedWeek !== 0 &&
  !isChecked;

{showRecommendedLabel && (
  <span className="mt-1 flex items-center gap-1 text-xs font-medium text-foreground">
    <CalendarCheck size={11} className="shrink-0" aria-hidden="true" />
    <span>이번 주 추천</span>
  </span>
)}
{showUpcomingLabel && (
  <span className="mt-1 flex items-center gap-1 text-xs font-normal text-muted-foreground">
    <Clock size={11} className="shrink-0" aria-hidden="true" />
    <span>{item.recommendedWeek}주차에 챙기기</span>
  </span>
)}

// ChecklistHub.tsx — 빈 상태 인라인 메시지
{visibleItems.length === 0 && showUncheckedOnly && (
  <p
    role="status"
    aria-live="polite"
    className="text-sm text-muted-foreground text-center py-6"
    style={{ wordBreak: "keep-all" }}
  >
    지금 보이는 항목은 모두 체크했어요
  </p>
)}
```

### 아이콘 선택 — `Clock` 확정

페어 1에서 후보로 둔 `Clock` vs `CalendarClock` 중 **`Clock`** 으로 확정.

- **근거**: P2 라벨이 `CalendarCheck` (calendar 시리즈)이라 `CalendarClock`도 calendar 시리즈로 시맨틱 분리가 약함(둘 다 calendar 모티브). `Clock`은 순수 시간 도형이라 "지금부터 N주 후" 시간 거리 의미와 정합. designer N2 시맨틱 분리 정합.
- DESIGN.md 별도 규정 없음. lucide-react 표준 아이콘.

## 3. 상태별 시안

### default — 토글 off

- 토글: `bg-muted`, thumb 위치 left.
- ChecklistHub: 모든 항목 표시.
- ChecklistItemRow: P2 라벨(해당 시) 또는 D-day 라벨(해당 시) 또는 라벨 없음.

### default — 토글 on, 미체크 있음

- 토글: `bg-pastel-lavender`, thumb 위치 right.
- ChecklistHub: 미체크 항목만 표시.
- 진행률 텍스트(예: "8/32 완료"): **전체 기준 유지** — 토글로 표시 항목이 줄어도 카드의 진행률은 변동 X.
- **카테고리 필터와의 관계**: 카테고리 필터(기존 기능, 본 묶음 외)와 본 토글은 **AND** 적용. 즉 "카테고리=hospital_bag + 토글 on" → hospital_bag 카테고리의 미체크 항목만 표시. 빈 상태 카피("지금 보이는 항목은 모두 체크했어요")는 두 필터 조합에서도 정합 — "지금 보이는"이 현재 적용된 모든 필터의 결과 컨텍스트를 의미.

### default — 토글 on, 미체크 0개 (빈 상태)

- 토글: 켜진 상태 유지(`bg-pastel-lavender`).
- ChecklistHub 항목 영역: 인라인 메시지 "지금 보이는 항목은 모두 체크했어요".
- AllDoneBadge 동시 노출 시 (전체 100% 완료): AllDoneBadge가 ChecklistPage 위쪽 (`mb-4`), 본 메시지는 ChecklistHub 안 → 사용자가 두 메시지를 시각으로 분리 인지 (AllDoneBadge는 mint=축하 톤, 본 메시지는 muted=중립 안내).

### hover — 토글

- 토글 자체에는 hover 색 변화 없음(shadcn 기본). cursor: pointer (브라우저 기본).
- 라벨 텍스트 영역도 cursor: pointer (htmlFor로 토글 활성화).

### focus-visible — 토글 (키보드)

- `focus-visible:ring-2 focus-visible:ring-pastel-lavender focus-visible:ring-offset-2`. 묶음 H 컨벤션 정합.
- 키보드 Tab으로 토글 도달 → ring 표시 → Space로 활성화 → state 토글.

### focus-visible — ChecklistItemRow

- 기존 ChecklistItemRow에 박힌 focus 스타일 그대로 사용. D-day 라벨 자체에는 focus 없음 (시각 표시만, 인터랙티브 X).

### loading

- 본 라운드 비동기 로딩 없음. ChecklistHub items는 SSR 시점에 정해짐(static export). 토글은 client state, 즉시 변환.

### error

- 본 라운드 에러 상태 없음. 토글 state 변경 실패 시나리오 없음(메모리만).
- D-day 라벨 매칭 실패(예: `recommendedWeek` 데이터 누락): P6 가드(`recommendedWeek !== 0`)로 비표시 — 정상 동작.

### empty (빈 상태 인라인 메시지)

- 위 "default — 토글 on, 미체크 0개" 시안과 동일.
- AllDoneBadge와 동시 노출 가능 — 의미 분리 시각: AllDoneBadge `bg-pastel-mint/40 text-accent-green` 축하 톤 vs 본 메시지 `text-muted-foreground` 중립 안내 톤.

### 모바일 320px 레이아웃

- 토글 행: `<label> 미체크만 보기 (약 100px)` + `<Switch> (약 40px)` + 좌우 padding(약 16px) = 156px → 한 줄 OK.
- `flex items-center justify-between`로 라벨 좌, 토글 우. 진행률 카드와 분리 행 (위에 진행률 카드, 아래 토글 행).
- D-day 라벨 "32주차에 챙기기" (8자) → 320px 항목 행에서 한 줄 OK.

## 4. 인터랙션·애니메이션

- **토글 클릭/탭/Space → 즉시 필터링** (트리거: 사용자 액션, 피드백: ChecklistHub items 즉시 갱신, duration: shadcn Switch 기본 transition ~150ms).
- **D-day 라벨 노출** (트리거: ChecklistItemRow 마운트 + 분기 조건 만족, 피드백: 라벨 표시, duration: 0ms 즉시).
- **빈 상태 메시지 노출** (트리거: visibleItems.length === 0 && showUncheckedOnly, 피드백: 메시지 표시, duration: 0ms 즉시. `aria-live="polite"`로 스크린리더가 변화 안내).
- **focus-visible ring 표시** (트리거: 키보드 Tab, duration: 0ms).
- **추가 애니메이션 없음**: 항목 필터링 시 페이드·슬라이드 등 도입 X — 즉시 갱신이 사용자 시간 도둑질 회피(designer N8).

## 5. 토큰·접근성

### 사용 토큰

- `--pastel-lavender` (`#E4D6F0`) — 토글 ON 배경 + focus-visible ring 색
- `--muted` — 토글 OFF 배경
- `--muted-foreground` — D-day 라벨 텍스트 + 빈 상태 메시지 텍스트
- `--foreground` — P2 라벨 텍스트 (기존 그대로)
- `--background` — focus ring offset

### 신규 토큰
- 없음. 기존 토큰 조합만.

### 접근성 (WCAG 2.1 AA)

- **시맨틱 HTML**:
  - 토글 = shadcn Switch — 내부적으로 `role="switch"` + `aria-checked` (Radix UI 기반). N2 정합.
  - 라벨 = `<label htmlFor="uncheck-only-toggle">` — native form 연결. label 클릭으로 토글 활성화 가능.
  - 빈 상태 = `<p role="status" aria-live="polite">` — 필터 결과 변화를 스크린리더가 polite 알림.
  - D-day 라벨 = `<span>` 텍스트 (인터랙티브 아님) — `aria-hidden` 미설정(텍스트가 스크린리더에 정상 음성 출력).
- **키보드 도달**:
  - 토글: Tab으로 도달, Space/Enter로 활성화. focus-visible ring 표시.
  - ChecklistItemRow: 기존 키보드 흐름 유지. D-day 라벨은 인터랙티브 아니라 Tab 도달 X.
- **색 대비**:
  - 토글 ON `bg-pastel-lavender (#E4D6F0)` vs thumb 흰색 — shadcn 기본 대비 OK.
  - D-day 라벨 `text-muted-foreground` vs `bg-card`(흰색) 대비비 — globals.css 토큰 대비 검증 필요(이미 article-prose figcaption 등에서 사용 중인 토큰이라 통과 가정).
  - focus-visible ring `ring-pastel-lavender` + offset 2px — 시각 인식 보장.
- **ARIA 정합성**:
  - 토글 `aria-label="미체크만 보기"` (label htmlFor와 중복이지만 안전).
  - 빈 상태 `aria-live="polite"` — 필터 변화 시 스크린리더 알림.
- **스크린리더 흐름**:
  - 페이지 진입 → "진행률 8/32 완료" → "미체크만 보기 스위치 켜짐/꺼짐" → "ChecklistHub 항목 N개" → 항목별 P2/D-day 라벨 음성 출력.
  - 토글 변경 시: "미체크만 보기 켜짐" 또는 "꺼짐" 즉시 음성.
  - 빈 상태 변화 시: "지금 보이는 항목은 모두 체크했어요" polite 알림.
- **`word-break: keep-all`**: 빈 상태 메시지에 `style={{ wordBreak: "keep-all" }}` 적용 (한국어 본문 가독성). D-day 라벨은 짧아서 줄바꿈 무관.
- **모바일 320px**: 토글 행·항목 행 모두 한 줄 OK (위 §3 모바일 시안 참조).
- **사용자 시간 도둑질 회피 (N8)**: 토글 변경 → 즉시 필터링 (3 탭 / 5초 룰 정합). 모달·인터스티셜 도입 X.

### 다크 패턴 검증 (designer N4)

- 토글 = native switch 시맨틱, 사용자 의도 클릭에만 발동. 자동 옵트인 X. 통과.
- 토글 영속성 = 세션 한정 → 사용자가 한 번 켰다고 영구 lock-in 안 됨. 통과.
- D-day 라벨 = 정보 표시(미래 권장). 클릭 인터랙션 없음 → 가짜 버튼 X. 통과.
- 빈 상태 메시지 = 친근한 사실 안내("모두 체크했어요"). 공포·축하 과장 X. 통과.

### planner §7.7 공포 마케팅 거부 검증

- D-day 라벨 카피 "N주차에 챙기기" — 행동 권유 톤, 공포 0.
- 지난 주차(`recommendedWeek < currentWeek`) 라벨 도입 X — 페어 1 결정. "이미 놓친 항목" 강조 회피.
- 빈 상태 카피 "지금 보이는 항목은 모두 체크했어요" — 긍정 톤만, 부정형 회피.
- 토글 라벨 "미체크만 보기" — 중립 사무 카피, 공포 0.
