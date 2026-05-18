# design-bundle-g-pastel-remap 기획서 (간단판)

> 작성일: 2026-05-09  size: S
> 출처: [docs/plan/phase-4.5.md §2.9 Cross-1](../../plan/phase-4.5.md), §2.8.1 H-3, §2.8.2 T-2, §2.8.5 B-1

## 0. 사전 확정 결정 (사용자 입력, 2026-05-09)

- **Cross-1 (`#E0F0FF` 처리)**: **5-pastel 안으로 정정**. 6번째 pastel 헌법화 거부.
- **5-pastel 매핑**: 아래 §2 must 표 그대로.

## 1. 사용자 시나리오

홈·타임라인·베이비페어 3개 영역에 박혀 있던 비공식 6번째 pastel(`#E0F0FF`)이 5-pastel 토큰(blossom·sunshine·lavender·mint·peach·yellow) 안의 정합한 role로 재매핑되어, [DESIGN.md §Five-pastel governance](../../../DESIGN.md)의 "각 pastel은 한 가지 역할만 진다" 헌법이 회복된다. 사용자 관점에서는 데이터 라벨·미니카드·규모 배지의 색이 한 hue만 바뀌고 기능 변화는 없다.

## 2. 기능 요구사항

### must

| 위치 | 파일 | 현재 hex | → 변경 hex | 토큰 |
|---|---|---|---|---|
| 홈 미니카드 4번째 (정보 & 가이드) `color` prop | [src/components/home/HomeContent.tsx:355](../../../src/components/home/HomeContent.tsx#L355) | `#E0F0FF` | `#E4D6F0` | `--pastel-lavender` |
| `TIMELINE_TYPE_CONFIG.admin.color` | [src/lib/constants.ts:42](../../../src/lib/constants.ts#L42) | `#E0F0FF` | `#FFE0CC` | `--pastel-peach` |
| `SCALE_CONFIG.small.color` | [src/components/babyfair/BabyfairCard.tsx:26](../../../src/components/babyfair/BabyfairCard.tsx#L26) | `#E0F0FF` | `#E4D6F0` | `--pastel-lavender` |

- 변경된 3개 위치에서 `#E0F0FF` 문자열이 0건이어야 한다 (`grep -rn "#E0F0FF" src/` 결과 0).
- 각 위치는 `globals.css`의 5-pastel 토큰 hex 값을 그대로 인용한다(`#E4D6F0` = `--pastel-lavender`, `#FFE0CC` = `--pastel-peach`). 토큰명 주석 1줄 권장(예: `// pastel-lavender`).

### won't

- **Cross-4(인라인 hex → 토큰 클래스 헬퍼) 처리하지 않음.** 묶음 I의 영역. 본 라운드는 hex 값을 5-pastel 안의 hex로 정정만 한다.
- **timeline `prep=#FFD4DE` / baby-fair `large=#FFD4DE` 처리하지 않음.** "pink=CTA 전용" 별개 위반(role 충돌)이라 같은 hex 라이브러리에 박혀 있어도 본 라운드 범위 외. 별도 묶음·라운드에서 처리.
- **baby-fair `CITY_COLORS` 17개 도시 매핑 변경하지 않음.** Cross-4 인라인 hex 패턴이지만 5-pastel 안에서 분산 매핑되어 있어 Cross-1 대상 아님.
- **GA4 이벤트 변경 없음.** 색만 바뀌고 행동·측정 모델은 그대로.

## 3. 성공 기준

- `grep -rn "#E0F0FF" src/` 결과 0건.
- 변경 3곳의 hex 값이 `globals.css`의 5-pastel 토큰 hex(`#E4D6F0` 또는 `#FFE0CC`)와 정확히 일치.
- 홈·타임라인·베이비페어 3개 화면 수동 확인에서 색 적용·role 정합 시각 확인 OK + 기존 E2E 통과(회귀 0건).
