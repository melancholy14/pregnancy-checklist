# design-bundle-g-pastel-remap

> 작성일: 2026-05-09 | 작성자: Claude Code
> spec: [docs/features/design-bundle-g-pastel-remap/spec.md](../features/design-bundle-g-pastel-remap/spec.md)

## 개요

홈·타임라인·베이비페어 3개 영역에 비공식 6번째 pastel(`#E0F0FF`)이 박혀 있어 [DESIGN.md §Five-pastel governance](../../DESIGN.md)의 "각 pastel은 한 가지 역할만 진다" 헌법을 침해하던 상태를, 5-pastel 토큰 안의 정합한 role(lavender/peach)로 재매핑한다. 사용자 관점에서는 라벨/카드/배지의 색이 한 hue만 바뀌고 기능 변화는 없다. spec size: S, Cross-1 묶음 처리.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 변경 3곳에서 `#E0F0FF` 0건 (`grep -rn "#E0F0FF" src/`) | ✅ 완료 | grep 결과 0 라인 |
| 각 위치가 `globals.css` 5-pastel 토큰 hex와 일치 (`#E4D6F0` 또는 `#FFE0CC`) | ✅ 완료 | globals.css 17행 `--pastel-lavender: #E4D6F0`, 19행 `--pastel-peach: #FFE0CC` 검증 |
| `npm run build` 통과 | ✅ 완료 | TypeScript / 정적 생성 32페이지 모두 성공 |

### 생성/수정 파일

**수정 (3개)**
- [src/components/home/HomeContent.tsx:355](../../src/components/home/HomeContent.tsx#L355) — 정보 & 가이드 미니카드 `color` prop `#E0F0FF` → `#E4D6F0` (`--pastel-lavender`)
- [src/lib/constants.ts:42](../../src/lib/constants.ts#L42) — `TIMELINE_TYPE_CONFIG.admin.color` `#E0F0FF` → `#FFE0CC` (`--pastel-peach`)
- [src/components/babyfair/BabyfairCard.tsx:26](../../src/components/babyfair/BabyfairCard.tsx#L26) — `SCALE_CONFIG.small.color` `#E0F0FF` → `#E4D6F0` (`--pastel-lavender`)

**신규 (1개, 테스트)**
- [e2e/design-bundle-g-pastel-remap.spec.ts](../../e2e/design-bundle-g-pastel-remap.spec.ts) — 회귀 가드 6 테스트

### 주요 결정 사항

- **토큰명 인라인 주석을 추가하지 않음**: spec §2 must는 토큰 주석을 "권장"으로 표기했으나, 동일 객체 내 다른 색 항목들에 토큰 주석이 없어 한 항목만 다는 것은 일관성 위반이라 판단. 토큰 매칭 정보는 본 문서·spec·impl에서 추적 가능.
- **plan 파일 부재 처리**: spec.md가 size: S로 파일·라인·hex·토큰까지 핀포인트되어 있어 spec을 plan 대용으로 사용. 별도 plan 작성 단계 생략.

### 가정 사항 및 미구현 항목

- 변경된 hex가 `globals.css`의 토큰 hex와 정확히 일치한다는 spec 요구는 "값의 일치"이지 "변수 참조로의 치환"이 아니다 (Cross-4는 won't 항목으로 명시).
- spec won't 4개 항목은 모두 의도적으로 본 라운드 범위 밖:
  - Cross-4 (인라인 hex → 토큰 클래스 헬퍼)
  - timeline `prep=#FFD4DE` / baby-fair `large=#FFD4DE` (pink role 충돌, 별개 라운드)
  - baby-fair `CITY_COLORS` 17개 도시 매핑
  - GA4 이벤트 변경

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)
없음.

### Warning (수정 권장)
없음. 변경 3개 모두 string literal 교체 — 타입(`as const` 유지) / 성능(렌더 외 모듈 스코프) / 보안(정적 토큰값) / 접근성(기존 a11y 패턴 유지) 4관점 어디에도 새 위험 도입 없음.

### Suggestion (개선 아이디어)
1. 토큰명 인라인 주석 — impl 결정사항으로 일관성 손해 우려가 있어 채택하지 않음.
2. Cross-4 (인라인 hex → 토큰 변수/클래스 전환) — spec won't 1번에 명시된 별도 라운드 작업. 본 종류의 회귀를 구조적으로 차단하는 follow-up.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 0건 |
| Suggestion | 2건 |

상세: [docs/review/design-bundle-g-pastel-remap-review.md](../review/design-bundle-g-pastel-remap-review.md)

---

## 리팩토링 내용

### 작업 목록
없음 (no-op).

### 사유
- review.md Warning 0건.
- 추가 판단 4관점(중복/큰 컴포넌트/훅 추출/메모이제이션) 모두 본 라운드 변경 범위에서 신규 부담을 도입하지 않음.
- 3개 hex 라인이 같은 패턴이라 통합 여지가 있으나, 이는 spec §2 won't 1번 "Cross-4 인라인 hex → 토큰 클래스 헬퍼"로 다음 라운드에 위임된 상태.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 3 (수정 대상) | 3 (동일) |
| 코드 라인 변경 | — | 각 파일 1줄(hex 리터럴) |
| 새 import | — | 0 |
| 새 객체/함수 | — | 0 |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 3개 passed (홈 정보 카드 / 타임라인 행정 배지 / 베이비페어 소형 배지) |
| Error/Validation | ✅ 1개 passed (3개 페이지 회귀 0건 — 옛 `#E0F0FF` 미노출) |
| 권한/인증 (색 격리) | ✅ 1개 passed (쇼핑 배지가 admin/peach 색을 받지 않음) |
| 반응형 (375px) | ✅ 1개 passed (모바일에서 lavender 유지) |
| **전체** | **6 passed / 0 failed** (5.6s) |

📊 상세 리포트: `playwright-report/index.html` (참고: 이전 세션 보고서가 남아 있을 수 있음 — 최신 결과는 `npx playwright test e2e/design-bundle-g-pastel-remap.spec.ts --reporter=html` 재실행으로 확인)

---

## 누락된 문서

- `docs/refactor/design-bundle-g-pastel-remap-refactor.md` — refactor 단계가 no-op이라 생성하지 않음.
