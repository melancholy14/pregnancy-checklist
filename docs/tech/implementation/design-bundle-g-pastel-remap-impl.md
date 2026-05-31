# design-bundle-g-pastel-remap Implementation

> 구현일: 2026-05-09
> spec: [docs/features/design-bundle-g-pastel-remap/spec.md](../../features/design-bundle-g-pastel-remap/spec.md)

## 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 변경 3곳에서 `#E0F0FF` 0건 (`grep -rn "#E0F0FF" src/`) | ✅ 완료 | grep 결과 0 라인 |
| 각 위치가 `globals.css` 5-pastel 토큰 hex와 일치 (`#E4D6F0` 또는 `#FFE0CC`) | ✅ 완료 | globals.css 17행 `--pastel-lavender: #E4D6F0`, 19행 `--pastel-peach: #FFE0CC` 검증 |
| `npm run build` 통과 | ✅ 완료 | TypeScript / 정적 생성 32페이지 모두 성공 |

## 생성/수정 파일 목록

### 신규 생성
- 없음

### 수정
- [src/components/home/HomeContent.tsx:355](../../../src/components/home/HomeContent.tsx#L355) — 정보 & 가이드 미니카드 `color` prop `#E0F0FF` → `#E4D6F0` (`--pastel-lavender`)
- [src/lib/constants.ts:42](../../../src/lib/constants.ts#L42) — `TIMELINE_TYPE_CONFIG.admin.color` `#E0F0FF` → `#FFE0CC` (`--pastel-peach`)
- [src/components/babyfair/BabyfairCard.tsx:26](../../../src/components/babyfair/BabyfairCard.tsx#L26) — `SCALE_CONFIG.small.color` `#E0F0FF` → `#E4D6F0` (`--pastel-lavender`)

## 주요 결정 사항

- **토큰명 주석을 추가하지 않음**: spec §2 must는 토큰 주석을 "권장"으로 표기했으나, 동일 객체 내 다른 색 항목들(`prep`, `shopping`, `education`, `wellbeing` / `large`, `medium` 등)에 토큰 주석이 없어 일관성 위반이 된다. 한 항목만 주석을 다는 것은 가독성 손해라 판단해 모두 주석 없이 hex만 정정. 토큰 매칭 정보는 본 impl 문서와 spec에서 추적 가능.
- **plan 파일 부재 처리**: `docs/plan/design-bundle-g-pastel-remap-plan.md`가 없음. spec.md가 size: S로 파일·라인·hex·토큰까지 명시되어 있어 spec을 plan 대용으로 사용. 별도 plan 작성 단계 생략.

## 가정 사항

- 변경된 hex가 `globals.css`의 토큰 hex와 정확히 일치한다는 spec의 요구는 "값의 일치"이지 "변수 참조로의 치환"이 아니다 (Cross-4는 won't 항목으로 명시).
- 베이비페어 `CITY_COLORS`, timeline `prep=#FFD4DE`, baby-fair `large=#FFD4DE`는 본 라운드 범위 외 (spec won't).

## 미구현 항목

- spec won't 4개 항목 (Cross-4 인라인→토큰 클래스, pink role 충돌, CITY_COLORS, GA4) — 모두 의도적으로 본 라운드 범위 밖.
