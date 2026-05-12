# design-bundle-n-weight-chart-color 디자인 문서

> 작성일: 2026-05-10
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- **N-1 옵션 B**: Line stroke + dot fill + linearGradient = peach (`#FFE0CC`). pink 오용 회복.
- **N-2 옵션 B**: ReferenceLine 양쪽 stroke = muted-foreground (`#9CA0A4`). dashed 패턴 차이(하한 `5 5`, 상한 `8 4 2 4`). 색이 의학적 의미 단정 X.
- **N-3 옵션 A**: linearGradient peach 그라디언트로 교체. lavender stop 제거.
- **N-4 옵션 A**: 보조 카피 추가 0. 현재 카피 유지.
- **페어 1**: chrome 토큰 변경 0. 출처·면책 카피 유지. DESIGN.md 헌법 갱신 0.

## 1. 화면 목록·플로우

본 라운드는 [/weight](src/app/weight/) 페이지의 `WeightChart` 컴포넌트 단일 표면. 화면 자체 신규 0.

- **weight 페이지** (`/weight`): 사용자 체중 기록 시 차트 자동 갱신. 색만 교체.

## 2. 컴포넌트

### 신규

- 없음.

### 재사용·확장

- [src/components/weight/WeightChart.tsx](src/components/weight/WeightChart.tsx) — 색 토큰 5건 교체. recharts 컴포넌트 구조·로직 변경 0.

### 마크업 구조 (변경 없음, 색만 교체)

```tsx
<LineChart data={data}>
  <defs>
    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%"  stopColor="#FFE0CC" stopOpacity={0.8} />  {/* peach */}
      <stop offset="95%" stopColor="#FFE0CC" stopOpacity={0} />     {/* peach 투명 */}
    </linearGradient>
  </defs>
  <CartesianGrid strokeDasharray="3 3" stroke="#F8F6F4" />          {/* 변경 0 */}
  <XAxis stroke="#9CA0A4" ... />                                   {/* 변경 0 */}
  <YAxis stroke="#9CA0A4" ... />                                   {/* 변경 0 */}
  <Tooltip ... />                                                  {/* 변경 0 */}
  {minTarget && (
    <ReferenceLine
      y={minTarget}
      stroke="#9CA0A4"           {/* mint → muted */}
      strokeDasharray="5 5"      {/* 그대로 */}
      strokeWidth={1.5}
      label={{ value: "권장 하한", position: "right", fontSize: 11, fill: "#9CA0A4" }}
    />
  )}
  {maxTarget && (
    <ReferenceLine
      y={maxTarget}
      stroke="#9CA0A4"           {/* peach → muted */}
      strokeDasharray="8 4 2 4"  {/* 시각 분리 차등 */}
      strokeWidth={1.5}
      label={{ value: "권장 상한", position: "right", fontSize: 11, fill: "#9CA0A4" }}
    />
  )}
  <Line
    type="monotone"
    dataKey="weight"
    stroke="#FFE0CC"             {/* pink → peach */}
    strokeWidth={2.5}
    dot={{ fill: "#FFE0CC", r: 4, strokeWidth: 2, stroke: "#fff" }}  {/* pink → peach */}
    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
    fill="url(#weightGradient)"
  />
</LineChart>
```

## 3. 상태별 시안

### default (데이터 ≥ 2개 + baseWeight 보유)

- 라인: peach `#FFE0CC` stroke, strokeWidth 2.5, monotone curve.
- area fill: peach 그라디언트(80% → 0%).
- dot: peach `#FFE0CC` fill, white stroke, r=4.
- activeDot (호버): r=6 확대, white stroke. fill 미설정 (recharts 기본).
- ReferenceLine 하한: muted `#9CA0A4` stroke, dashed `5 5`, strokeWidth 1.5, 라벨 "권장 하한" (muted fill).
- ReferenceLine 상한: muted `#9CA0A4` stroke, dashed `8 4 2 4`, strokeWidth 1.5, 라벨 "권장 상한" (muted fill).
- grid: `#F8F6F4` strokeDasharray `3 3` (chrome 토큰 그대로).
- axis: `#9CA0A4` stroke (chrome 토큰 그대로).

### 데이터 1개 (baseWeight 미설정)

- ReferenceLine 미렌더 (현행 분기 유지).
- 라인 + dot 1개 — peach.

### 데이터 0개

- 차트 자체 미렌더 (`if (data.length === 0) return null;`). 현행 그대로.

### hover (Tooltip 활성)

- recharts Tooltip — 현행 톤 유지(white 배경, `rgba(0,0,0,0.06)` 보더, `rounded-2xl`-equivalent radius, `shadow-md`-equivalent). 텍스트 "체중: N kg".
- activeDot r=6 확대.

### focus-visible (키보드)

- recharts 기본 — 본 라운드 변경 0. weight 페이지 자체 차트 외 요소(X 버튼, WeightForm 입력)의 focus는 묶음 H 정합 별도 검증 (본 묶음 범위 외).

## 4. 색·토큰 매핑

| 슬롯 | 변경 전 | 변경 후 | DESIGN.md role |
|---|---|---|---|
| Line stroke | `#FFD4DE` (pastel-pink) | `#FFE0CC` (pastel-peach) | data |
| Line dot fill | `#FFD4DE` | `#FFE0CC` | data |
| linearGradient stop1 | `#FFD4DE` | `#FFE0CC` | data |
| linearGradient stop2 | `#E4D6F0` (pastel-lavender) | `#FFE0CC` (`stopOpacity=0`) | data (투명) |
| ReferenceLine 하한 stroke | `#D0EDE2` (pastel-mint) | `#9CA0A4` (muted-foreground) | chrome |
| ReferenceLine 상한 stroke | `#FFE0CC` (pastel-peach) | `#9CA0A4` | chrome |
| ReferenceLine 라벨 fill | `#9CA0A4` | `#9CA0A4` | chrome (변경 0) |
| CartesianGrid stroke | `#F8F6F4` | `#F8F6F4` | chrome (변경 0) |
| XAxis/YAxis stroke | `#9CA0A4` | `#9CA0A4` | chrome (변경 0) |

5-pastel role 정합:
- **peach=data role**: 라인·dot·area fill 모두 peach 단일. AP1 회복.
- **lavender=secondary**: 차트에서 사용 X (현재 그라디언트 stop2 lavender 제거).
- **pink=CTA**: 차트에서 사용 X. AP1 정합.
- **mint=success**: 차트에서 사용 X. planner §7.2 의학적 단정 회피.
- **yellow=info**: 차트에서 사용 X.

## 5. 인터랙션·동작

- 차트 호버 → Tooltip 등장 + activeDot 확대 (현행 동작 그대로).
- 본 라운드 신규 인터랙션 0.

## 6. 접근성

- recharts 기본 ARIA — 본 라운드 추가 작업 0. 색 의미는 라벨 텍스트("권장 하한"·"권장 상한")로 전달 — 색맹 사용자에게도 정보 손실 0(planner §7.2 정합 + WCAG 1.4.1 색만으로 의미 전달 X).
- 색 대비:
  - 라인 peach `#FFE0CC` vs 흰 카드 배경 — 대비 약함이지만 차트 라인은 stroke 두께(2.5) + area fill로 보강. 데이터 시각화 표준상 충분.
  - ReferenceLine muted `#9CA0A4` vs 흰 카드 배경 — 대비 OK. 라벨 텍스트도 동일 톤.
- 본문 카피("권장 범위: ... +11.5~16kg" + 출처 + 면책) 그대로 — designer N5 의료 안전 + planner §7.2·§7.3 정합 유지.

## 7. 모바일 정합

- recharts ResponsiveContainer width 100% height 240 — 현행 유지. 320px 폭에서 라벨 위치(`position: "right"`) 검증 1회 — 좁은 폭에서 라벨 잘림 시 페이즈 8 cross-check에서 fix 검토.
- dot r=4 + activeDot r=6 — 모바일 터치 타겟 약함이지만 차트 인터랙션은 호버 기반(터치는 터치 시 Tooltip 등장 — recharts default).

## 8. 다른 영역 영향

- DESIGN.md 헌법 갱신 0 (designer §8 거절 1번 정합).
- 향후 신규 차트 추가 시 본 라운드 결과를 룰로 참조 — peach=data 라인 + muted ReferenceLine + dashed 패턴 차등 + 라벨 카피 의미 위임.
- 묶음 J(ShareButton 위치)·묶음 K(삭제 패턴)와 독립.

## 9. won't (이번 범위 밖)

- DESIGN.md 헌법 본문 갱신.
- 새 데이터 시각화 전용 토큰(`--chart-data-*`).
- 차트 ARIA 강화 (recharts 기본 외).
- 본문 카피 보강 (N-4=A 결정).
