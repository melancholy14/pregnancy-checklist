# design-bundle-b-i-row-tokens 리뷰

> 작성일: 2026-05-10
> 상태: decided
> size: M
> 출처: [docs/plan/phase-4.5.md §2.4 M1](../../plan/phase-4.5.md), §2.8.1 H-3, §2.8.2 T-5·T-11, §2.8.5 B-3, §2.9 Cross-4·Cross-5
> 관련 스펙: [spec.md](./spec.md)  관련 디자인: [design.md](./design.md)

## 1. 기능 요약

phase-4.5 §2 디자인 잔여 묶음 중 **구조 리팩터 2건**을 한 라운드에 묶음:

- **묶음 B** — `ChecklistItemRow.tsx`(checklist) + `WeekChecklistSection.tsx`(timeline) 두 row 컴포넌트의 row-as-button + nested interactive 패턴(WCAG 4.1.2 위반)을 `<label htmlFor> + <input type="checkbox" hidden>` 표준 패턴으로 정리. checklist-recommendation-semantics 라운드의 우선순위 점·"이번 주 추천" 마이크로 라벨·`legal` note 시각 분기·aria-label 정합 보존.
- **묶음 I** — home(`DashboardCard`)·timeline(`WeekChecklistSection` `CATEGORY_COLORS`)·baby-fair(`BabyfairCard` `CITY_COLORS` + `SCALE_CONFIG`)에 산재한 인라인 hex `style={{ backgroundColor }}` 4곳을 **데이터 매핑 layer가 정적 토큰 클래스 문자열을 반환하는 헬퍼**(`src/lib/data-token-classes.ts` 1파일)로 옮김. 헬퍼는 union literal 타입(`DataToneClass`)으로 5-pastel role을 컴파일 시점 강제(pink 제외).

phase-4.5.md §2.9 Cross-5 SoT가 "WeekChecklistSection 한 컴포넌트 정정으로 둘 다 해결"이라고 적었지만 실제로는 두 별도 파일이 패턴을 평행 보유 — SoT 정정이 본 라운드 부수 산출물.

## 2. 적용 페어 + 선택 이유

- **페어 1 (B 묶음) — designer × dev**: a11y 헌법(N1 WCAG 2.1 AA + N2 인터랙티브 정직성)이 마크업 패턴을 강제하는데, 그 헌법을 코드로 옮길 때 필요한 visual checkbox 토큰 매트릭스·액션 버튼 배치·sr-only 카피·컴포넌트 추출 여부 5개 결정이 design.md에 박혀야 dev가 진입 가능 (§6.6 임의 결정 거부).
- **페어 2 (I 묶음) — dev × designer**: 헬퍼 시그니처(반환 타입·형태·domain 분리)는 dev 영역, 헬퍼가 강제하는 토큰 디시플린(허용 pastel set·CTA pink 제외·DESIGN.md 헌법 갱신)은 designer 영역. 둘이 한 헬퍼 안에서 충돌.

**제외 페어**: planner/marketer는 본 라운드에서 콘텐츠·측정 변경 없음.

## 3. 페어별 충돌

### 3.1 페어 1 — designer × dev (묶음 B)

**T0 — 페어 시작 선언**

- 이전 페어 [없음] 의 양보·합의는 이 페어에 영향 없음.
- 인용 후보:
  - designer: "interactive 요소가 interactive 요소를 감쌀 수 없음" — [docs/design/persona.md N2](../../design/persona.md); "AP4: row를 `<label>`로 감싸고 안에 native checkbox + 텍스트만. 액션은 별도 슬롯" — §5 AP4
  - dev: "새 색·radius·shadow·면책 문장·CTA 카피를 개발자가 박지 않음" — [docs/tech/persona.md §6.6](../../tech/persona.md); "DESIGN.md / globals.css 토큰만 사용" — §2.3

**T1 — [designer] 단독 입장**

- 잃는 것: row-as-button 패턴의 단순함 — 행 어디를 눌러도 토글되는 모바일 친화 동작이 label 패턴으로 옮겨가면 액션 버튼(편집·삭제)이 클릭 영역 OUTSIDE로 빠져 시각·구조 변함. focus-visible ring도 input + visual span 분리해서 잡아야 함.
- 희생 거부 인용: "interactive 요소가 interactive 요소를 감쌀 수 없음. `role="button"` div가 내부에 진짜 button을 감싸는 패턴 거부 (WCAG 4.1.2)" — designer N2; AP4
- 주장: row 마크업을 `<div container><label flex-1>(input.sr-only.peer + visual.span + content)</label>{isCustom && <div actions>}</div>` 구조로. native input + sr-only가 N2 정합. 액션 버튼은 label OUTSIDE 형제. focus-visible은 visual span에 lavender ring.
- 잔재 자기검증: 이전 페어 없음 — N

**T2 — [dev] 반박 입장**

- A 발언 반박:
  1. designer가 "WeekChecklistSection 한 파일"로 불렀지만 실제는 `ChecklistItemRow.tsx` + `WeekChecklistSection.tsx` 두 별도 파일. phase-4.5.md §2.9 Cross-5 SoT가 사실과 어긋남 → 정정 또는 공통 row 컴포넌트 추출 결정이 design.md에 선행해야 dev가 길을 정함.
  2. visual span의 4상태 className 매트릭스(rest/checked/focus-visible/disabled) + CheckIcon 위치를 design.md가 박지 않으면 dev 임의 결정 — §6.6 위반.
  3. checklist-recommendation-semantics 라운드의 aria-label 카피("...체크 해제/체크" 접미사) + 마이크로 라벨 + `legal` note 분기 보존이 새 마크업에서 보장되어야 함. **E2E 셀렉터 변경이 회귀 가능성** — 5개 spec(`checklist-recommendation-semantics`, `design-bundle-d-uncheck-toggle-dday`, `checklist`, `timeline`, `ga4-events`).
  4. DOM 깊이 + 모바일 320px 위화감 검증 필요 — 액션이 label OUTSIDE 형제라 hover bg 효과가 분리됨.
- 잃는 것: 두 파일 동시 정리 + 공통 추출 결정 시 신규 파일 1개. globals.css 또는 className peer-checked CSS 작성. 5개 E2E 셀렉터 마이그레이션.
- 희생 거부 인용: "산출물 없으면 운영자에게 결정 요청. 임시 추정값으로 채우면 그게 영구가 된다" — tech §6.6; "DESIGN.md / globals.css 토큰만 사용" — §2.3; "E2E 빨강 무시 X" — §6.5
- 주장: design.md에 5개 명시 후 코드 진입 — (a) row container 마크업 트리 (b) visual checkbox 4상태 토큰 매트릭스 (c) 액션 영역 시각 처리 (d) sr-only 보조 텍스트 카피 (e) 평행 수정 vs 공통 row 추출. 추가로 spec.md에 (f) E2E 셀렉터 마이그레이션 정책.
- 잔재 자기검증: 이전 페어 없음 — N

**T3 — 핵심 충돌 + 숨은 가정**

- 핵심 충돌: 디자이너 헌법(N2 정직성)을 코드로 옮길 때 필요한 5개 디자인 결정이 design.md에 박혀야 dev 진입 가능. **충돌이라기보다 책임 분리**.
- 숨은 가정: 양쪽 다 "Radix Checkbox 자체가 a11y 정합"이라 묵시 가정 — 실제 Radix Checkbox는 내부 `<button>` 렌더 → label에 감싸도 button-in-label은 허용되나 그 button click이 row container와 충돌 가능. **native input + sr-only가 더 명료**.

### 3.2 페어 2 — dev × designer (묶음 I)

**T0 — 페어 시작 선언**

- 이전 페어 [페어 1: designer × dev] 의 양보·합의는 이 페어에 영향 없음.
- 인용 후보:
  - dev: "DESIGN.md / globals.css 토큰만 사용" — [docs/tech/persona.md §2.3](../../tech/persona.md); "라이브러리 새로 설치하기 전에 기존 의존성 활용 가능한지 본다" — §1; "새 추상화를 만들기 전에 세 번째 중복까지 기다린다" — §1
  - designer: "5-pastel role(pink=primary CTA, lavender=secondary, mint=success, peach=data, yellow=info) 절대 교차 금지" — [docs/design/persona.md §3.2](../../design/persona.md); "AP1: pastel-pink/60을 데이터 라벨에 사용 — pink는 CTA 전용" — §5 AP1; "AP-Cross-4: 데이터 layer가 hex를 들고 있으면 토큰 디시플린이 깨짐. 헬퍼 함수 한 단계가 필요" — §6 2026-05-03

**T1 — [dev] 단독 입장**

- 잃는 것: 헬퍼 1파일 = 새 추상화. 4곳 중복(home·timeline·babyfair city·babyfair scale)이라 dev §1 "세 번째 중복까지 기다린다" 룰 정합. 단일 파일에 4종 도메인 → named export로 분리. **Tailwind v4 source scan**(globals.css L4 `@source '../**/*.{js,ts,jsx,tsx}';`)이 .ts 파일 정적 문자열 인식 → 헬퍼 안 매핑 객체 value는 모두 정적 클래스 문자열 리터럴 의무. 동적 템플릿 리터럴 금지.
- 희생 거부 인용: "산출물 없으면 운영자에게 결정 요청" — tech §6.6; "DESIGN.md / globals.css 토큰만 사용" — §2.3
- 주장: 단일 신규 파일 `src/lib/data-token-classes.ts` — 도메인별 named export 4종(`getCityTokenClass`/`getScaleTokenClass`/`getCategoryTokenClass`/`getDashboardIconBgClass`). 반환은 빌드 타임 정적 클래스 문자열. 컴포넌트 inline hex map 제거.
- 잔재 자기검증: 이전 페어 [페어 1: designer × dev] 영향 없음 — N — 페어 1의 row 마크업 결정과 헬퍼 시그니처는 독립 축. 페어 1의 "공통 컴포넌트 추출" 결정을 빌려와 "헬퍼도 추출 비용 줄이자"가 아니라 4회 중복 자체로 정당화.

**T2 — [designer] 반박 입장**

- A 발언 반박:
  1. dev가 "named export"는 짚었으나 **헬퍼가 5-pastel role을 강제하는 위치**를 명시 안 함. 반환 `string`이면 매핑 객체에 `bg-pastel-pink/40`이 박혀도 컴파일러는 안 막음. **role별 화이트리스트를 union literal 타입으로 강제** — `DataToneClass = bg-pastel-{lavender|mint|peach|yellow}/{20|40} text-foreground` (pink 제외).
  2. 현재 SCALE_CONFIG.large = `#FFD4DE` (pink) + CITY_COLORS pink 매핑 도시 5개(서울·서울(마곡)·광주·순천 등) + WeekChecklistSection CATEGORY_COLORS.hospital = pink — designer §3.2/AP1 위반 잔존. 화이트리스트 적용 시 본 라운드에서 같이 정정 강제.
  3. T-11 `color: "#3D4447"` (Badge text 색)은 배경과 별도 — `text-foreground` 토큰으로 즉시 교체. 헬퍼 반환에 text 색 묶을지(단일 문자열 `"bg-... text-foreground"`) 분리할지(객체 또는 배경-only) 결정 필요.
  4. **DESIGN.md 헌법 갱신** 동반 의무 — 헬퍼만 박고 헌법은 그대로 두면 다음 데이터 매핑이 인라인 hex로 회귀 가능. §10 Don't 또는 §12 Iteration Guide에 "데이터→토큰 매핑은 헬퍼 경유 의무" 1단락. 누적 학습(designer §6 2026-05-03)을 헌법으로 승격.
  5. CITY_COLORS 17개 도시 매핑 — 화이트리스트 적용 시 pink 도시 5개 재매핑 필요. 또는 매핑 자체를 그룹화로 단순화(UX 변경 의도).
- 잃는 것: SCALE_CONFIG.large + CITY_COLORS pink 도시 + CATEGORY_COLORS.hospital 재매핑 결정 추가. union 타입 보일러플레이트(약 30줄). DESIGN.md 갱신 1단락.
- 희생 거부 인용: designer §3.2 "5-pastel role 절대 교차 금지"; AP1 "pastel-pink/60 데이터 라벨 사용 — pink는 CTA 전용"; AP-Cross-4 "데이터 layer가 hex 들고 있으면 토큰 디시플린 깨짐. 헬퍼 함수 한 단계 필요"; §8 거절 기준 "DESIGN.md 6번째 pastel 도입 요청 → 헌법 갱신 제안서 먼저 요구"
- 주장: 헬퍼 시그니처에 도메인별 union literal 타입 박음. 반환은 단일 문자열(배경+텍스트 묶음). pink 잔존 위반 본 라운드에서 같이 정정. DESIGN.md 헌법 갱신 1단락.
- 잔재 자기검증: 이전 페어 [페어 1: designer × dev] 영향 없음 — N — 페어 1의 "ChecklistRow 공통 추출" 합의를 빌려와 "헬퍼도 시그니처 양보하자"가 아님. designer §3.2·AP1 자체로 화이트리스트 강제 주장. 마크업 결정과 토큰 디시플린은 독립 축.

**T3 — 핵심 충돌 + 숨은 가정**

- 핵심 충돌:
  1. 헬퍼 시그니처의 role 강제 깊이 — dev "named export + 정적 문자열" vs designer "union literal 타입 화이트리스트". 강제 깊이가 SCALE/CITY/CATEGORY pink 정정 필요성 결정.
  2. 헬퍼 반환값 형태 — 단일 문자열 vs 객체 vs 배경-only.
  3. SCALE_CONFIG.large + CITY_COLORS pink 도시 + CATEGORY_COLORS.hospital pink 정정을 본 라운드에 포함할지.
  4. DESIGN.md 헌법 갱신을 본 라운드에 포함할지.
- 숨은 가정: 양쪽 다 "Tailwind v4 source scan은 .ts 파일 정적 문자열 인식"한다고 가정 — 사실. 다만 "헬퍼 외 inline className 동적 템플릿 리터럴은 미스캔" 위험 의식 약함 → design.md에 "헬퍼 외 className 동적 조립 금지" 명시. DashboardCard의 4개 카드는 G 묶음 결과 후 의미 명확 — slot 별 헬퍼 매핑 가능.

## 4. 미해결 트레이드오프

> 본 §4는 사용자 결정(2026-05-10) 이전 옵션·결정 흐름 기록. 최종 결정은 §5.

### 묶음 B (페어 1)

- [x] **B-1** 액션 버튼 마크업 위치 — A: label 형제 + flex inline / B: label 외부 absolute
- [x] **B-2** 두 컴포넌트 공통 row 추출 — A: 평행 수정 / B: `ChecklistRow` 공통 / C: 별도 라운드
- [x] **B-3** sr-only 우선순위 카피 — A: dev 자동 / B: content persona 검토 1회
- [x] **B-4** visual checkbox 토큰 매트릭스 위치 — A: 컴포넌트 className / B: globals.css BEM
- [x] **B-5** phase-4.5.md §2.9 Cross-5 SoT 정정 — A: 본 라운드 포함 / B: 별도 PR
- [x] **B-6** E2E 셀렉터 마이그레이션 — A: `getByRole("checkbox")` 기반 / B: aria-label 호환 보존

### 묶음 I (페어 2)

- [x] **I-1** 헬퍼 반환 타입 화이트리스트 강제 — A: union literal / B: 약한 string
- [x] **I-2** SCALE_CONFIG.large + CITY pink 도시 + CATEGORY hospital 정정 — A: 본 라운드 포함 / B: 별도 라운드
- [x] **I-3** 헬퍼 반환 형태 — A: 단일 문자열 / B: 객체 / C: 배경-only
- [x] **I-4** DESIGN.md 헌법 갱신 — A: §10/§12 1단락 / B: 갱신 X
- [x] **I-5** CITY_COLORS 17개 매핑 형태 — A: 도시명 1:1 / B: 4개 그룹화
- [x] **I-6** DashboardCard prop — A: semantic slot key / B: iconBgClass / C: color 유지 타입만 변경

### I-5 부수 — 도시 그룹화 정책

본 라운드 결정: 행정구역 기반 4개 그룹 (수도권/광역시/영남/기타).

## 5. 결정

> 2026-05-10 사용자 결정 완료.

### 묶음 B 결정

| # | 결정 | 핵심 근거 |
|---|---|---|
| B-1 | **A — label 형제 + flex inline** (현재 위치 유지) | 시각 회귀 0. dev §1 "세 번째 중복까지 기다린다" 정합. 320px 위화감 risk 회피. |
| B-2 | **B — `ChecklistRow` 공통 컴포넌트 추출** (`src/components/checklist/ChecklistRow.tsx`) | designer §6 2026-05-02 "다음 디자이너가 신호를 잘못 읽음" 차단 + 향후 변경 1회로 두 영역 동시 반영. B-4=A와 결합 시 className 중복 0. |
| B-3 | **B — content persona(기획자) 검토 1회 → 카피 = `우선순위 {priority.label}`** (priority.label "높음"·"보통"·"낮음" 그대로, 1차 소스 §4.3 정합) | sr-only 카피 일관성 — design-bundle-l "원본 이미지 새 창에서 보기" 검토와 동일 패턴. |
| B-4 | **A — 컴포넌트 className에 직접** (Tailwind peer-checked) | B-2=B 결합 시 공통 컴포넌트 한 곳에 className → 중복 0. globals.css 미터치. Tailwind v4 source scan 호환. |
| B-5 | **A — 본 라운드 spec must에 phase-4.5.md §2.9 Cross-5 본문 정정 박음** | SoT 무결성 우선. design-bundle-g/l 라운드와 동일 패턴. |
| B-6 | **A — spec.md must에 영향 5개 spec 파일 셀렉터를 `getByRole("checkbox", { name: ... })` 마이그레이션** | a11y 셀렉터 사용 정합. dev §6.5 "E2E 빨강 무시 X" 정합. |

### 묶음 I 결정

| # | 결정 | 핵심 근거 |
|---|---|---|
| I-1 | **A — 정적 union literal 타입** (`type DataToneClass = bg-pastel-{lavender\|mint\|peach\|yellow}/{20\|40} text-foreground`, pink 제외) | 컴파일 시점 5-pastel role 강제. designer §3.2·AP1 정합. |
| I-2 | **A — 본 라운드 spec must에 SCALE_CONFIG.large + CITY_COLORS pink 도시 + CATEGORY_COLORS.hospital 재매핑 포함** | I-1=A 시 사실상 강제. 헬퍼 화이트리스트와 정렬. |
| I-3 | **A — 단일 클래스 문자열** (배경 + 텍스트 묶음) | 호출부 한 줄. 가독성 ↑. |
| I-4 | **A — DESIGN.md §10 또는 §12에 1단락 추가** | I-1과 결합 시 컴파일·헌법 둘 다 박힘 → 디시플린 영구 회복. |
| I-5 | **B — 도시 4개 그룹화 (행정구역: 수도권/광역시/영남/기타)** | UX 변경 의도 명시. 그룹별 pastel 매핑은 spec.md must로. |
| I-6 | **A — DashboardCard prop을 semantic slot key로 변경** (`slot: "checklist" \| "timeline" \| "weight" \| "info"`) | semantic 의미 명확. 색 변경 시 헬퍼 매핑만 수정. |

### I-5 부수 — 도시 그룹화 (사용자 결정, 2026-05-10)

행정구역 기반 4개 그룹. 정확한 도시 분류는 spec.md `must` 표에 박힘.

- **수도권**: 서울, 서울(마곡), 인천, 경기, 수원, 수원(광교), 고양(일산)
- **광역시**: 부산, 대구, 광주, 대전
- **영남**: 창원, 김해, 경주
- **기타**: 청주, 강릉, 익산, 순천

그룹 → pastel 매핑은 spec.md에서 4종 후보(lavender/mint/peach/yellow) 중 1:1 명시 (pink 제외 — I-1 화이트리스트 정합).

## 6. 우선순위 영향

- **phase-4.5.md §2.9 Cross-5 + Cross-4 + §2.10 묶음 B/I** 본문 정정 — 본 라운드 결과 반영.
- **묶음 G(design-bundle-g-pastel-remap)** — G 라운드 hex 정정 결과(`#E4D6F0` lavender·`#FFE0CC` peach)를 헬퍼 매핑 객체에 그대로 옮김.
- **묶음 H(design-bundle-h-tab-filter-color)** — 본 라운드와 독립.
- **DESIGN.md** — I-4=A → 헌법 갱신. 향후 모든 데이터 매핑이 헬퍼 경유 의무.
- **dev §1 "세 번째 중복까지 기다린다" 룰** — B 묶음 2회 중복(B-2=B 추출 정당), I 묶음 4회 중복(헬퍼 추출 정당) 둘 다 룰 정합.
- **묶음 B + I 의존성**: 한 PR 안 작업 순서 = 묶음 I → 묶음 B (spec.md §4 정합).
