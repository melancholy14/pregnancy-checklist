# BottomNav 5탭 (체중 추가 + 순서 정렬) Implementation

> 출처 plan: [bottomnav-weight-tab-plan.md](../../plan/bottomnav-weight-tab-plan.md)
> 작성일: 2026-06-02

## 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| BottomNav가 정확히 5개 탭을 `홈 / 체크리스트 / 체중 / 베이비페어 / 정보` 순서로 노출 | ✅ 완료 | navItems 배열 순서 그대로 |
| "체중" 탭은 Scale 아이콘 + `/weight` path + prefix match | ✅ 완료 | lucide-react `Scale` 추가 |
| "정보" 탭은 `/info` `alsoMatchPrefixes` 보존 | ✅ 완료 | 기존 값 유지 |
| 활성 상태는 기존 pink CTA(`bg-pastel-pink/40`) 컨벤션 유지 | ✅ 완료 | isItemActive 로직 그대로 |
| `navigation.spec.ts`가 5탭 노출·이동 검증, "영상" 잔존 가드 삭제 | ✅ 완료 | 라벨 배열 단언 + 5경로 이동 + 활성 시각 |
| `/weight` 진입 시 체중 탭 active 시각 전환 | ✅ 완료 | 신규 3번째 테스트로 검증 |

## 생성/수정 파일 목록

### 수정
- [src/components/layout/BottomNav.tsx](../../../src/components/layout/BottomNav.tsx)
  - lucide-react import에 `Scale` 추가
  - navItems에 `{ path: "/weight", icon: Scale, label: "체중", match: "prefix" }` 추가
  - 배열 순서를 `홈 → 체크리스트 → 체중 → 베이비페어 → 정보`로 재정렬
- [e2e/navigation.spec.ts](../../../e2e/navigation.spec.ts)
  - "4개 네비게이션 항목" → "5개 네비게이션 항목이 순서대로 보인다"로 재작성, 라벨 배열 단언으로 순서까지 검증
  - "영상" 0건 가드 삭제 (V1=A로 의미 잃음)
  - 이동 테스트에 체중·베이비페어 클릭 단언 추가 (4 → 5경로)
  - `/weight` 진입 시 체중 탭 active(`bg-pastel-pink/40`) 시각 검증 테스트 신규 추가

## 주요 결정 사항

- **3번째 테스트 신규 추가** (`/weight` 활성화 검증): AC 6번 "/weight 진입 시 체중 탭 active 전환"을 명시적으로 가드. plan에는 테스트 2개로 적었지만 AC 충족 가드로 1개 추가가 더 정직 — 활성 시각이 회귀할 경우 design-bundle-h spec과 별개로 navigation 책임 범위에서 잡힘.
- **라벨 순서 검증 방식**: `getByText`로 각각 visible만 확인하면 순서 변경 회귀를 못 잡으므로 `allTextContents()`로 배열 단언. plan §4.1 명시 순서를 강제 가드.

## 가정 사항

- 5탭 모바일 375px 폭 수용은 e2e 단언 X, 운영자 시각 점검 위임 (plan 가정 그대로).
- 활성 시각 컨벤션(pink CTA)은 DESIGN.md L67 그대로 — 5번째 탭이라고 별색 분리하지 않음.

## 미구현 항목

- §5 GA4 `axis_enter`/`axis_cross_link` 5탭 funnel 이벤트 — 후속 작업
- 다른 e2e spec(`ga4-events`, `phase-4-step-1-checklist-hub` 등)의 `/weight` 진입 동선 갱신 — 별도 회귀 라운드
- HomeContent.tsx 카드 구조 정합 — H1=B로 §3 폐기됨
