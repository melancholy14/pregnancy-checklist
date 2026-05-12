# design-bundle-n-weight-chart-color

> 작성일: 2026-05-12 | 작성자: Claude Code
> spec: [docs/features/design-bundle-n-weight-chart-color/spec.md](../features/design-bundle-n-weight-chart-color/spec.md) · design: [docs/features/design-bundle-n-weight-chart-color/design.md](../features/design-bundle-n-weight-chart-color/design.md) · review(planning): [docs/features/design-bundle-n-weight-chart-color/review.md](../features/design-bundle-n-weight-chart-color/review.md)

## 개요

체중 차트(`/weight`)의 라인이 `#FFD4DE`(pastel-pink = CTA role)로 그려져 있던 AP1 위반을 `#FFE0CC`(pastel-peach = data role)로 교체해 [DESIGN.md](../../DESIGN.md) 5-pastel role discipline 헌법 정합을 회복한다. ReferenceLine 양쪽은 muted(`#9CA0A4`)로 통일하고 dashed 패턴 차등(하한 `5 5` / 상한 `8 4 2 4`) + 라벨 카피("권장 하한"·"권장 상한")로 의미를 위임 — mint=success 의학적 단정 시그널 회피. phase-4.5.md §2.8.4 W-1 + §2.10 묶음 N 미해소 상태 해소. spec size: M.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| M1. Line stroke + dot fill = `#FFE0CC` (peach) | ✅ 완료 | [WeightChart.tsx:84-86](../../src/components/weight/WeightChart.tsx#L84-L86) |
| M2. linearGradient 양쪽 stop = `#FFE0CC`, stop2 opacity 0 | ✅ 완료 | [WeightChart.tsx:39-40](../../src/components/weight/WeightChart.tsx#L39-L40) — lavender stop 제거 |
| M3-하한. ReferenceLine stroke `#9CA0A4` + dash `5 5` | ✅ 완료 | [WeightChart.tsx:64-70](../../src/components/weight/WeightChart.tsx#L64-L70) |
| M3-상한. ReferenceLine stroke `#9CA0A4` + dash `8 4 2 4` | ✅ 완료 | [WeightChart.tsx:73-79](../../src/components/weight/WeightChart.tsx#L73-L79) |
| M4. chrome 토큰(grid·axis·Tooltip·카피) 변경 0 | ✅ 완료 | diff 미발생 |
| `npm run build` 성공 + TS 에러 0 | ✅ 완료 | Next 16.2.0 Turbopack, 32 static pages |
| 시나리오 1~3 시각 검증 (e2e attribute 검증으로 대체) | ✅ 완료 | E2E 8/8 통과 |

### 생성/수정 파일

**수정 (1개)**
- [src/components/weight/WeightChart.tsx](../../src/components/weight/WeightChart.tsx) — 색 토큰 5건 교체:
  - linearGradient stop1 `#FFD4DE` → `#FFE0CC`
  - linearGradient stop2 `#E4D6F0` opacity 0.2 → `#FFE0CC` opacity 0
  - ReferenceLine 하한 stroke `#D0EDE2` → `#9CA0A4` (dash `5 5` 유지)
  - ReferenceLine 상한 stroke `#FFE0CC` → `#9CA0A4`, dash `5 5` → `8 4 2 4`
  - Line stroke `#FFD4DE` → `#FFE0CC`, dot fill `#FFD4DE` → `#FFE0CC`

**신규 (3개)**
- [docs/implementation/design-bundle-n-weight-chart-color-impl.md](../implementation/design-bundle-n-weight-chart-color-impl.md) — 구현 요약
- [docs/review/design-bundle-n-weight-chart-color-review.md](../review/design-bundle-n-weight-chart-color-review.md) — 코드 리뷰 리포트
- [e2e/design-bundle-n-weight-chart-color.spec.ts](../../e2e/design-bundle-n-weight-chart-color.spec.ts) — 회귀 가드 8 테스트

### 주요 결정 사항

- **5-pastel role 정합(peach=data)**: 라인·dot·area fill 모두 peach 단일로 통일. 이전의 pink stroke(CTA 토큰 차트 오용 = AP1)를 회복. 근거: spec.md §1, design.md §4.
- **ReferenceLine 색이 아닌 dashed + 라벨로 의미 위임**: 양쪽 ReferenceLine 을 같은 muted 색으로 두고 dashed 패턴 차등(`5 5` vs `8 4 2 4`) + 라벨 텍스트("권장 하한"·"권장 상한")로 시각 분리. mint=success role 의학적 단정 회피(planner §7.2). 근거: spec.md M3, design.md §6.
- **본문 카피·출처·면책 미변경(N-4=A)**: 보조 카피 추가 0. designer N5 의료 안전 + planner §7.3 정합 유지.
- **plan 파일 부재 처리**: spec.md 가 라인 단위 변경(stroke/fill/dasharray)을 prescriptive 하게 명시해 plan 역할 수행. 별도 plan 작성 단계 생략(파이프라인 `--from=2` 진입).
- **raw hex 유지**: recharts 가 stroke prop 에 CSS variable 을 직접 받지 못해 raw hex 사용. spec.md won't "새 데이터 시각화 전용 토큰 추가 = 미선택" 정합.

### 가정 사항 및 미구현 항목

**가정**
- `pastel-peach`/`muted-foreground` 토큰 hex 는 spec·design 문서가 명시한 raw hex(`#FFE0CC`/`#9CA0A4`)를 그대로 사용 — 차트 영역의 기존 컨벤션.
- `activeDot` 은 fill 미설정(recharts 기본 stroke만, spec.md M1 명시).

**미구현 (모두 spec won't 정합)**
- DESIGN.md 헌법 본문 갱신 — designer §8 거절 1번 정합.
- 새 데이터 시각화 전용 토큰(`--chart-data-*`) — 옵션 D 미선택. 5-pastel 안에서 해결.
- 차트 ARIA 강화 — recharts 기본 외 작업 0.
- 본문 카피 보강 — N-4=A 결정.
- `docs/design/weight/ui.md` 차트 색 정책 사례 추가 — should 항목, 별도 PR.
- phase-4.5.md §2.8.4 W-1 + §2.10 묶음 N 상태 "✅ 완료" 갱신 — 운영자 수동.

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

없음. 변경 자체가 정적 hex 5건 교체로 신규 위험(타입·런타임·보안·접근성) 0. E2E 8/8 통과로 회귀 가드 박힘.

### Warning (수정 권장 — 모두 선존, 본 라운드 scope 밖)

| # | 위치 | 문제 | 권장 수정 |
|---|------|------|-----------|
| 1 | [WeightChart.tsx:69, 78](../../src/components/weight/WeightChart.tsx#L69) | ReferenceLine 라벨 `fill="#9CA0A4"` + `fontSize: 11` 조합은 흰 배경 대비 ~3.0:1 — WCAG 2.2 AA Normal text 4.5:1 미달 | 별도 라운드에서 fill 톤 상향 또는 fontSize 12-13 으로 large-text 3:1 부합. designer 페어 검토 필요. |
| 2 | [WeightChart.tsx:61](../../src/components/weight/WeightChart.tsx#L61) | `Tooltip.formatter` 파라미터를 `(value: number)` 로 좁힘. recharts 실제 시그니처는 `string \| number \| (...)[]` | 별도 라운드에서 `value: number \| string` 으로 방어 또는 zod 입력 검증. 실 런타임 위험은 낮음. |

### Suggestion (개선 아이디어)

- 차트 색 raw hex → CSS variable 토큰 전환 (recharts 가 var() 직접 받지 못해 helper 필요). spec won't 정합으로 별도 라운드 후보.
- `docs/design/weight/ui.md` 차트 색 정책 사례 1건 박기 (spec should).
- `{minTarget && ...}` 가드를 `{typeof minTarget === "number" && ...}` 로 좁히기 — 미세 가드.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 2건 (모두 선존) |
| Suggestion | 3건 |
| 빌드 | 성공 (1회 시도, implement-feature 단계) |

---

## 리팩토링 내용

리팩토링 작업 0건. 5개 hex 리터럴 교체에 abstraction 여지 없음. 리뷰의 Warning 2건은 모두 선존·본 라운드 PR scope 밖으로 명시되어 작업 제외. 4관점 추가 판단(중복·큰 컴포넌트·커스텀 훅·메모이제이션) 모두 해당 없음(파일 106줄, 단일 책임, prop 기반 derivation, 단순 산술). spec won't "새 데이터 시각화 전용 토큰 추가 = 미선택" 정합으로 파일 로컬 상수 추출조차 premature abstraction 판정.

---

## E2E 테스트 결과

테스트 파일: [e2e/design-bundle-n-weight-chart-color.spec.ts](../../e2e/design-bundle-n-weight-chart-color.spec.ts)

| 시나리오 | 결과 |
|----------|------|
| Happy Path (Line peach / gradient peach 단일 / ReferenceLine muted+dashed 차등 / chrome 토큰·카피 유지) | ✅ 4 passed |
| Error/Validation (옛 hex `#FFD4DE`·`#D0EDE2`·`#E4D6F0` SVG 안 0건 회귀 가드) | ✅ 1 passed |
| 권한/인증(state 분기: data 0개 차트 미렌더 / data 1개 ReferenceLine 미렌더) | ✅ 2 passed |
| 반응형 (Mobile 375px) | ✅ 1 passed |
| **전체** | **8 passed / 0 failed** (8.6s) |

검증 방식: recharts SVG attribute(`stroke`/`fill`/`stop-color`/`stroke-dasharray`) 직접 검증. 라벨 카피("권장 하한"·"권장 상한"), 출처·면책 카피 visibility 검증. 차트 SVG `innerHTML` 안에 옛 색 3종이 0건임을 회귀 가드로 박음 — 향후 신규 차트 추가 시에도 동일 룰 검증 기준.

📊 상세 리포트: `playwright-report/index.html`

---

## 누락된 문서

- `docs/refactor/design-bundle-n-weight-chart-color-refactor.md` — 리팩토링 작업 0건으로 미생성(스킬이 nothing-to-do 시점에 종료).
