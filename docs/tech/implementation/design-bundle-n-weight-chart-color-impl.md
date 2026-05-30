# design-bundle-n-weight-chart-color Implementation

> 작성일: 2026-05-10
> 관련 스펙: [../features/design-bundle-n-weight-chart-color/spec.md](../../features/design-bundle-n-weight-chart-color/spec.md)
> 관련 디자인: [../features/design-bundle-n-weight-chart-color/design.md](../../features/design-bundle-n-weight-chart-color/design.md)

## 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| M1. Line stroke + dot fill = `#FFE0CC` (peach) | ✅ 완료 | [WeightChart.tsx:84-86](../../../src/components/weight/WeightChart.tsx#L84-L86) |
| M2. linearGradient 양쪽 stop = `#FFE0CC`, stop2 opacity 0 | ✅ 완료 | [WeightChart.tsx:39-40](../../../src/components/weight/WeightChart.tsx#L39-L40) |
| M3-하한. ReferenceLine stroke `#9CA0A4` + dash `5 5` 유지 | ✅ 완료 | [WeightChart.tsx:64-70](../../../src/components/weight/WeightChart.tsx#L64-L70) |
| M3-상한. ReferenceLine stroke `#9CA0A4` + dash `8 4 2 4` | ✅ 완료 | [WeightChart.tsx:73-79](../../../src/components/weight/WeightChart.tsx#L73-L79) |
| M4. chrome 토큰(grid·axis·Tooltip·카피) 변경 0 | ✅ 완료 | diff 미발생 |
| `pnpm build` 성공 + TS 에러 0 | ✅ 완료 | Next 16.2.0 Turbopack 빌드 통과, 32 static pages 생성 |

## 생성/수정 파일 목록

### 신규 생성

- `docs/tech/implementation/design-bundle-n-weight-chart-color-impl.md` — 본 구현 요약 문서.

### 수정

- `src/components/weight/WeightChart.tsx` — 색 토큰 5건 교체.
  - linearGradient stop1 `#FFD4DE` → `#FFE0CC`
  - linearGradient stop2 `#E4D6F0` opacity 0.2 → `#FFE0CC` opacity 0
  - ReferenceLine 하한 stroke `#D0EDE2` → `#9CA0A4` (dash `5 5` 유지)
  - ReferenceLine 상한 stroke `#FFE0CC` → `#9CA0A4`, dash `5 5` → `8 4 2 4`
  - Line stroke `#FFD4DE` → `#FFE0CC`, dot fill `#FFD4DE` → `#FFE0CC`

## 주요 결정 사항

- **5-pastel role 정합 (peach=data)**: 라인·dot·area fill 모두 peach 단일로 통일. AP1(pink=CTA 차트 오용) 회복. 근거: spec.md §1, design.md §4.
- **ReferenceLine 색이 아닌 dashed 패턴 + 라벨로 의미 위임**: 양쪽 ReferenceLine을 동일 muted 색으로 두고 dashed 패턴(`5 5` vs `8 4 2 4`)으로 시각 분리. mint=success role을 의학적 단정에 사용 회피(planner §7.2). 근거: spec.md M3, design.md §6.
- **본문 카피·출처·면책 미변경**: N-4=A 결정대로 추가 카피 0. designer N5 의료 안전 + planner §7.3 정합 유지.

## 가정 사항

- `--from=2`로 진입했고 `docs/plan/design-bundle-n-weight-chart-color-plan.md`가 존재하지 않으나, [spec.md](../../features/design-bundle-n-weight-chart-color/spec.md)가 라인 단위 변경을 명시한 prescriptive plan 역할을 수행 — 이를 plan source로 채택.
- `pastel-peach`/`muted-foreground` 토큰의 hex 값은 spec·design 문서가 명시한 raw hex(`#FFE0CC`/`#9CA0A4`)를 그대로 사용. recharts는 CSS variable을 stroke prop으로 직접 받지 못하므로(Tailwind class 미적용 환경) 차트 영역에서는 raw hex 유지가 기존 컨벤션.
- `activeDot`은 fill 미설정 그대로 — recharts 기본 stroke만 사용(spec.md M1 명시).

## 미구현 항목

- **DESIGN.md 헌법 본문 갱신** — won't (designer §8 거절 1번 정합).
- **새 데이터 시각화 전용 토큰(`--chart-data-*`)** — won't (5-pastel 안에서 해결).
- **차트 ARIA 강화** — won't (recharts 기본 외 작업 0).
- **본문 카피 보강** — won't (N-4=A 결정).
- **`docs/design/weight/ui.md` 차트 색 정책 사례 추가** — should 항목, 본 라운드 산출 후 운영자 검토 대상으로 분리.
- **phase-4.5.md §2.8.4 W-1 + §2.10 묶음 N 상태 "✅ 완료" 갱신** — 운영자 수동 갱신 영역(spec.md §5).

## 빌드 검증

- `npm run build` 1회 성공.
- Next.js 16.2.0 (Turbopack), TypeScript 검증 통과.
- 32개 static page 모두 생성, `/weight` 라우트 ○ static 상태 유지.
