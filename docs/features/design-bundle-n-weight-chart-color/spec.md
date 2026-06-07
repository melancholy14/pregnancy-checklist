# design-bundle-n-weight-chart-color 기획서

> 작성일: 2026-05-10  size: M
> 관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- **항목 N-1 결정 (옵션 B)**: Line stroke + dot fill + linearGradient 색을 peach (`pastel-peach` `#FFE0CC`)로 교체. AP1 회복 + peach=data role 정합.
- **항목 N-2 결정 (옵션 B)** — *P4.6에서 폐기*: ReferenceLine 양쪽 muted + dashed 차등 결정은 phase-4.6에서 차트 안 점선을 제거하고 캡션 텍스트(11.5~16kg)로 의미를 옮기는 방향으로 갱신됨. 본 spec의 M3 항목과 시나리오 1·3의 ReferenceLine 문구는 폐기되며, 캡션 회귀 가드(e2e)로 대체.
- **항목 N-3 결정 (옵션 A)**: linearGradient를 peach 그라디언트로 교체. lavender stop 제거.
- **항목 N-4 결정 (옵션 A)**: 보조 카피 추가 0. 현재 카피 유지.
- **페어 1 합의**: chrome 토큰 변경 0. 출처·면책 카피 유지. DESIGN.md 헌법 갱신 0.

## 1. 배경·목적

- **운영자**: phase-4.5.md §2.8.4 W-1·§2.10 묶음 N 미해소 상태 해소. 체중 차트 라인이 pink(=CTA 토큰)로 그려져 있던 AP1 위반을 peach(=data role)로 교체 — 5-pastel role discipline 헌법 정합 회복. 차트 시각화 색 정책의 첫 사례 박힘 — 향후 신규 차트 추가 시 동일 룰 자동 적용.
- **사용자**: 체중 차트의 시각 의미를 데이터 라인(peach)에 집중. 권장 범위(11.5~16kg)는 차트 아래 캡션 텍스트로 위임해 의학적 단정(점선 경계 / mint=success) 시그널 회피. 사용자가 "권장 범위 안 = 안심" 잘못된 학습 차단. *(P4.6: 차트 안 ReferenceLine 2개 제거 반영)*
- **측정**: GA4 신규 이벤트·파라미터 0건. 측정 모델 변경 없음.

## 2. 사용자 시나리오

- **시나리오 1 (정상 BMI 사용자, 권장 범위 안)**: 사용자 A가 임신 전 체중 60kg 입력 → 24주차 체중 70kg 기록 → 차트 라인이 peach `#FFE0CC` stroke로 그려짐 + peach 그라디언트 fill로 area 표시 → 차트 아래 캡션 "첫 기록(60kg) 대비 추이입니다. 정상 BMI 기준 임신 중 총 11.5~16kg 증가가 권장됩니다." + 출처 + 면책 그대로 노출. *(P4.6: 차트 안 ReferenceLine 2개 제거 반영)*
- **시나리오 2 (다중 데이터 포인트)**: 사용자 B가 5회 이상 체중 기록 → 차트 라인 peach + dot fill peach + activeDot 호버 시 r=6 확대 → 데이터 가독성 유지.
- **시나리오 3 (베이스 체중 미설정)**: 사용자 C가 첫 기록만 보유 → 라인만 peach로 그려짐. *(P4.6 이후: 데이터 개수와 무관하게 차트 안 ReferenceLine은 항상 미렌더)*
- **시나리오 4 (스크린리더 사용자)**: 사용자 D(스크린리더)가 차트 영역 도달 → recharts 기본 ARIA(`role="img"` + 데이터 포인트 라벨) 음성 출력 → 색 의미는 라벨 텍스트로 전달 (mint=success 단정 음성 출력 0).

## 3. 기능 요구사항

### must

#### M1. Line stroke + dot 색 교체

- [src/components/weight/WeightChart.tsx:84-87](src/components/weight/WeightChart.tsx#L84-L87) `<Line>` props 수정:
  - `stroke="#FFD4DE"` → `stroke="#FFE0CC"` (pastel-peach).
  - `dot={{ fill: "#FFD4DE", ... }}` → `dot={{ fill: "#FFE0CC", ... }}`.
  - `activeDot`은 fill 미설정(현행 유지) — recharts 기본 stroke만.
- `strokeWidth: 2.5`, `type: "monotone"` 등 나머지 props 변경 없음.

#### M2. linearGradient peach 그라디언트로 교체

- [src/components/weight/WeightChart.tsx:37-42](src/components/weight/WeightChart.tsx#L37-L42) `<linearGradient id="weightGradient">` 수정:
  - `<stop offset="5%" stopColor="#FFD4DE" stopOpacity={0.8} />` → `<stop offset="5%" stopColor="#FFE0CC" stopOpacity={0.8} />`.
  - `<stop offset="95%" stopColor="#E4D6F0" stopOpacity={0.2} />` → `<stop offset="95%" stopColor="#FFE0CC" stopOpacity={0} />` (peach만, lavender 제거 + 끝 stop 투명).
- `fill="url(#weightGradient)"` 그대로.

#### M3. ReferenceLine 양쪽 muted + dashed 차등 — *P4.6에서 폐기*

- 본 항목은 phase-4.6에서 의도적으로 제거됨. `<ReferenceLine>` 2개를 WeightChart에서 들어내고, 권장 범위(정상 BMI 기준 11.5~16kg)는 차트 아래 캡션 텍스트로 위임.
- 이유: 차트 안 점선이 "경계선=의학적 단정" 시그널로 읽힐 위험 + 시각 노이즈. 캡션 카피로 동일 정보를 전달하면서 의학적 단정 톤은 약화.
- 회귀 가드: [e2e/design-bundle-n-weight-chart-color.spec.ts](../../../e2e/design-bundle-n-weight-chart-color.spec.ts) — `.recharts-reference-line-line` count 0 + 캡션 `11.5~16kg` 노출 검증으로 대체.

#### M4. chrome 토큰 변경 0

- CartesianGrid stroke `#F8F6F4`, XAxis/YAxis stroke `#9CA0A4`, Tooltip 톤 모두 그대로. 본문 카피·출처·면책 모두 그대로.

#### M5. DESIGN.md §6 누적 학습 메모 추가 (선택, won't로 다운그레이드)

- 본 라운드 won't로 분리 — design.md §11 또는 누적 학습 노트는 별도 PR. 헌법 본문 변경 X.

### should

- **차트 색 정책 docs/design/weight/ui.md 갱신 검토**: weight 영역 디자인 문서에 차트 색 결정 사례 1건 박기. 본 라운드 should — 산출 후 운영자 검토.

### won't (이번 범위 밖)

- **DESIGN.md 헌법 본문 갱신** — designer §8 거절 1번 정합. 헌법 갱신 회피.
- **새 데이터 시각화 전용 토큰 추가** — 옵션 D 미선택. 5-pastel 안에서 해결.
- **N-2 옵션 A·C** — 페어 합의 없던 항목. 운영자가 옵션 B 선택.
- **mint=success role의 의학적 의미 검토** — N-2=B 채택으로 회피. mint은 차트에 미사용.
- **체중 차트 외 차트 색 정책** — 향후 신규 차트 추가 시 동일 룰 자동 적용 (별도 라운드 0).

## 4. 예외·엣지 케이스

- **데이터 0개**: 현행 `if (data.length === 0) return null;` 그대로. 차트 자체 미렌더.
- **데이터 1개**: 라인 dot 1개만 peach. *(P4.6 이후: ReferenceLine은 데이터 개수와 무관하게 미렌더 — 별도 분기 없음)*
- **데이터 점프 (큰 변동)**: 라인 monotone curve 그대로. peach 시각 강조도 변동 인지에 충분.
- **다크 모드**: DESIGN.md 라이트 전용. 본 라운드 영향 없음.
- **localStorage·예정일 영향**: 무관 — 본 라운드는 차트 색만 교체.

## 5. 성공 기준

- **기능 동작**:
  - `pnpm build` 성공 + 차트 색 5건 모두 교체 + TypeScript 타입 에러 0.
  - 시나리오 1~3 시각 검증 1회 (개발자 수동 또는 e2e 스크린샷 1건).
  - 라인·dot 색 = `#FFE0CC` 확인. *(P4.6 이후: ReferenceLine 검증 항목은 폐기, `.recharts-reference-line-line` 0건 + 캡션 11.5~16kg 노출 검증으로 대체)*
- **측정 지표**: GA4 변경 0건.
- **사용자 경험**: design.md 와 일치 — peach 라인 + 캡션 카피로 권장 범위 의미 위임. *(P4.6: 차트 안 ReferenceLine 제거 반영)*
- **SoT 정합**: phase-4.5.md §2.8.4 W-1 + §2.10 묶음 N 상태 "✅ 완료"로 갱신 (운영자 수동, 본 라운드 산출 후).
