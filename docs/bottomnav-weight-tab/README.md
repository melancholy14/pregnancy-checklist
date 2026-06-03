# BottomNav 5탭 (체중 추가 + 순서 정렬)

> 작성일: 2026-06-02 | 작성자: Claude Code
> 출처 plan: [bottomnav-weight-tab-plan.md](../plan/bottomnav-weight-tab-plan.md)
> phase: [phase-4.6.md §4](../plan/phase-4.6.md)

## 개요

phase-4.6 §4 N1=B(5탭) 결정에 따라 BottomNav에 "체중" 탭을 신규 추가하고, 탭 순서를 `홈 / 체크리스트 / 체중 / 베이비페어 / 정보`로 재정렬했다. 동시에 4탭을 가정하던 `navigation.spec.ts`를 5탭 기준으로 재작성하고 모바일 375px 반응형 회귀 가드를 추가했다.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| BottomNav가 정확히 5개 탭을 `홈 / 체크리스트 / 체중 / 베이비페어 / 정보` 순서로 노출 | ✅ | navItems 배열 순서 |
| "체중" 탭은 Scale 아이콘 + `/weight` path + prefix match | ✅ | lucide-react `Scale` |
| "정보" 탭은 `/info` `alsoMatchPrefixes` 보존 | ✅ | 기존 값 유지 |
| 활성 상태는 pink CTA(`bg-pastel-pink/40`) 컨벤션 유지 | ✅ | DESIGN.md L67 |
| `navigation.spec.ts`가 5탭 노출·이동 검증, "영상" 잔존 가드 삭제 | ✅ | V1=A 도미노 |
| `/weight` 진입 시 체중 탭 active 시각 전환 | ✅ | match=prefix |

### 생성/수정 파일

**수정**
- [src/components/layout/BottomNav.tsx](../../src/components/layout/BottomNav.tsx) — `Scale` import + 체중 navItem 추가 + 순서 재정렬. 리팩토링 단계에서 `aria-label="주요 메뉴"`·`aria-current="page"` 추가.
- [e2e/navigation.spec.ts](../../e2e/navigation.spec.ts) — 5탭 라벨 배열 단언, 5경로 이동 단언, `/weight` active 시각 검증, 375px 반응형 회귀 가드 추가.

### 주요 결정 사항

- **별도 `bottomnav-weight-tab.spec.ts`를 만들지 않고 기존 `navigation.spec.ts`에 통합**: QA 페르소나 §3.3 "같은 명세 중복 금지" + "신규만 짜고 갱신 미루기 금지" 원칙. BottomNav 회귀의 단일 SoT 유지.
- **활성화 단언을 navigation.spec.ts에 추가**: AC 6번(`/weight` active 전환)을 명시적으로 가드. design-bundle-h spec과 별개로 navigation 책임 범위에서 잡힘.
- **라벨 배열로 순서 강제 단언**: `getByText` visible만 확인하면 순서 회귀를 못 잡으므로 `allTextContents()`로 배열 단언.

### 가정 사항 및 미구현 항목

**가정**: 5탭 모바일 375px 폭 수용은 e2e로 한 줄·라벨 무줄바꿈을 가드. 픽셀 단위 시각 회귀는 운영자 시각 점검 위임.

**미구현 (다른 phase로 이연)**:
- §5 GA4 `axis_enter`/`axis_cross_link` 5탭 funnel 이벤트
- 다른 e2e spec(`ga4-events`, `phase-4-step-1-checklist-hub` 등)의 `/weight` 진입 동선 갱신 — 별도 회귀 라운드
- HomeContent.tsx 카드 구조 정합 (H1=B 도미노로 §3 폐기)

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

없음.

### Warning (리팩토링 단계에서 모두 처리)

- **BottomNav.tsx — 활성 탭 `aria-current` 미설정**: 시각 표시만 있고 스크린 리더가 활성 탭 인식 불가 → `aria-current={isActive ? "page" : undefined}` 추가
- **BottomNav.tsx — `<nav>`에 라벨 없음**: 향후 nav가 둘 이상일 때 SR 구분 불가 → `aria-label="주요 메뉴"` 추가

### Suggestion (미적용 — ROI 낮음)

- `navItems`를 모듈 스코프 상수로 격리 (자식 props 전달 없어 리렌더 영향 X)
- 375px 라벨 줄바꿈 가드 임계값(22px) line-height 토큰 변경에 부서지기 쉬움

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 2건 (리팩토링에서 모두 처리) |
| Suggestion | 2건 (미적용) |

---

## 리팩토링 내용

### 작업 목록

1. **BottomNav.tsx — `<nav aria-label="주요 메뉴">` 추가**: 향후 nav가 둘 이상 존재할 수 있는 환경에서 스크린 리더가 본 nav를 식별 가능하도록.
2. **BottomNav.tsx — 활성 `<Link>`에 `aria-current="page"` 추가**: WAI-ARIA 1.1 표준으로 활성 탭 의미론 명시. 시각(`bg-pastel-pink/40`) 채널 외 보조 기술 채널 확보.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 1개 | 1개 |
| 줄 수 | 82줄 | 86줄 |
| 동작 변경 | — | 없음 (시각·라우팅 무변경) |
| 접근성 속성 | 0건 | 2건 (`aria-label`, `aria-current`) |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path (5탭 라벨 순서 + 5경로 이동) | ✅ 2개 passed |
| 활성화 가드 (`/weight` active 시각) | ✅ 1개 passed |
| Error/Validation | — (해당 없음 — 정적 사이트·BottomNav 입력 없음) |
| 권한/인증 | — (해당 없음 — 백엔드 없음) |
| 반응형 (Mobile 375px) | ✅ 1개 passed |
| **전체** | **4 passed / 0 failed (3.7s)** |

📊 상세 리포트: `playwright-report/index.html`

---

## 관련 문서

- [구현 상세](../implementation/bottomnav-weight-tab-impl.md)
- [코드 리뷰](../review/bottomnav-weight-tab-review.md)
- [리팩토링](../refactor/bottomnav-weight-tab-refactor.md)
- [계획](../plan/bottomnav-weight-tab-plan.md)
- [상위 phase](../plan/phase-4.6.md)
