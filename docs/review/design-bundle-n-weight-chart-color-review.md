# design-bundle-n-weight-chart-color 코드 리뷰

> 작성일: 2026-05-12
> 관련 스펙: [../features/design-bundle-n-weight-chart-color/spec.md](../features/design-bundle-n-weight-chart-color/spec.md)
> 관련 구현: [../implementation/design-bundle-n-weight-chart-color-impl.md](../implementation/design-bundle-n-weight-chart-color-impl.md)

## 리뷰 대상 파일
- [src/components/weight/WeightChart.tsx](../../src/components/weight/WeightChart.tsx)
총 1개 파일 (impl.md 기준 — 본 라운드는 5개 hex 값 교체만 포함).

리뷰 범위는 본 라운드에서 실제로 변경된 라인에 한정합니다. 이전 라운드부터 존재하는 패턴은 "선존(pre-existing)"으로 표기하고, 본 라운드 PR scope 밖이므로 코드는 손대지 않습니다.

---

## Critical 이슈 (즉시 수정 완료)

없음.

본 라운드 변경(라인 84·86 `stroke`/`dot fill`, 라인 39-40 `linearGradient stop`, 라인 66·75-76 `ReferenceLine stroke`/`strokeDasharray`)은 모두 정적 hex 리터럴 교체이며 다음을 도입하지 않습니다:
- 새 타입·새 prop·새 상태 변수.
- 사용자 입력 경로·외부 API 응답.
- `dangerouslySetInnerHTML`·`eval`·동적 코드 실행.
- 새 의존성·라이브러리.

E2E([e2e/design-bundle-n-weight-chart-color.spec.ts](../../e2e/design-bundle-n-weight-chart-color.spec.ts)) 8/8 통과로 색 정책 + 옛 hex 회귀 가드 + state 분기(data 0개·1개·2개+) 동작 검증 완료.

---

## Warning (수정 권장)

### 1. ReferenceLine 라벨 텍스트 색 대비(선존, 본 라운드 scope 밖)
- **위치**: [src/components/weight/WeightChart.tsx:69, 78](../../src/components/weight/WeightChart.tsx#L69)
- **문제**: `label.fill = "#9CA0A4"` + `fontSize: 11` 조합은 흰 배경 대비 ~3.0:1 — WCAG 2.2 AA "Normal text 4.5:1" 기준 미달.
- **본 라운드 영향**: 0. 라벨 fill 은 이전 라운드부터 동일했고, 본 라운드는 ReferenceLine `stroke` 만 교체했음(design.md §4 표 마지막 행 "ReferenceLine 라벨 fill: 변경 0" 명시).
- **권장 수정**: 별도 라운드에서 (a) 라벨 fill 을 더 짙은 muted 톤(예: `--muted-foreground` 토큰 raw hex)으로 상향하거나, (b) `fontSize` 를 12-13 으로 키워 large-text 3:1 기준에 부합시킴. 단, design.md §6 은 차트 색 대비를 "차트 stroke 두께 + 본문 카피 보강으로 의미 위임"으로 결론냈으므로 라벨 contrast 강화는 designer 페어 검토 필요.

### 2. recharts `Tooltip.formatter` 파라미터 타입(선존, 본 라운드 scope 밖)
- **위치**: [src/components/weight/WeightChart.tsx:61](../../src/components/weight/WeightChart.tsx#L61)
- **문제**: `(value: number) => ...` 로 좁혀 선언했지만 recharts 의 실제 시그니처는 `ValueType = string | number | (string | number)[]`. 입력이 배열이거나 string 으로 들어올 경우 `${value} kg` 가 의도와 다르게 직렬화될 수 있음.
- **본 라운드 영향**: 0. 이전 라운드부터 동일 패턴이고 `dataKey="weight"` 가 number 만 공급하므로 실 런타임 위험은 낮음.
- **권장 수정**: 별도 라운드에서 `(value: number | string) => [\`${Number(value)} kg\`, "체중"]` 로 방어 또는 zod 으로 entry 입력 단계에서 number 보장.

---

## Suggestion (개선 아이디어)

### 1. 차트 색 raw hex → CSS variable 전환 검토
- recharts 가 stroke/fill prop 에 CSS variable 을 직접 받지 못해 raw hex 를 쓰는 현 패턴은 합리적이지만, 향후 신규 차트가 늘어나면 `--chart-data`·`--chart-reference` 같은 dedicated token 을 만들고 `var(--token)` → 컴포넌트 마운트 시 `getComputedStyle` 로 resolve 하는 helper 를 두는 방안이 있음.
- spec.md won't 에 "새 데이터 시각화 전용 토큰 추가 = 미선택"이라 박혀 있으므로 본 라운드에서는 X. 별도 라운드 후보.

### 2. `docs/design/weight/ui.md` 차트 색 정책 사례 1건 박기 (should)
- spec.md should 항목. 향후 신규 차트 추가 시 본 라운드 결정(peach=data + muted ReferenceLine + dashed 패턴 + 라벨 카피 의미 위임)을 룰로 참조할 수 있도록 문서에 박는 작업. 운영자 검토 후 별도 PR.

### 3. `minTarget`/`maxTarget` 의 `&&` 가드(미사용 시 false)
- [WeightChart.tsx:63, 72](../../src/components/weight/WeightChart.tsx#L63) — `{minTarget && <ReferenceLine .../>}` 패턴. `minTarget` 이 `0` 일 가능성은 임신 체중 컨텍스트에서 사실상 없으나, 명시적 의도를 위해 `{typeof minTarget === "number" && <ReferenceLine .../>}` 로 좁히는 것이 좀 더 안전. 선존·실 위험 0.

---

## 요약

| 구분 | 건수 | 비고 |
|------|------|------|
| Critical | 0건 발견, 0건 수정 | 본 라운드 변경(5건 hex 교체) 자체에 신규 위험 0. E2E 8/8 통과. |
| Warning | 2건 | 모두 **선존**(이전 라운드부터 존재) — 본 라운드 PR scope 밖. |
| Suggestion | 3건 | won't / should / 미세 가드 개선. |
| 빌드 | 미실행(Critical 없음, 직전 implement-feature 단계에서 1회 성공 확인) | |
