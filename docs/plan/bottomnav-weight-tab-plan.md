# Feature Plan: bottomnav-weight-tab

> 출처: [phase-4.6.md](phase-4.6.md) §4 N1=B 5탭 결정 (2026-06-02 도미노 재결정)
> 작성일: 2026-06-02

## 기능 목표

phase-4.6 §4 N1=B(5탭) 결정에 따라 BottomNav에 "체중" 탭을 신규 추가하고, 탭 순서를 `홈 / 체크리스트 / 체중 / 베이비페어 / 정보`로 재정렬한다. 동시에 4탭을 가정한 `navigation.spec.ts`를 5탭 기준으로 재작성하여 회귀 가드를 갱신한다.

## 완료 조건 (AC)

| # | 조건 | 비고 |
|---|------|------|
| 1 | BottomNav가 정확히 5개 탭을 `홈 / 체크리스트 / 체중 / 베이비페어 / 정보` 순서로 노출 | phase-4.6 §4.1 N1=B |
| 2 | "체중" 탭은 Scale 아이콘 + `/weight` path + prefix match | phase-4.6 §4.2 표 |
| 3 | "정보" 탭은 `/info` `alsoMatchPrefixes` 보존 | §1.2 결정 유지 |
| 4 | 활성 상태는 기존 pink CTA(`bg-pastel-pink/40`) 컨벤션 유지 — DESIGN.md L67 | design-bundle-h spec과 충돌 X |
| 5 | `navigation.spec.ts`가 5탭 노출·이동을 검증, "영상" 잔존 가드 삭제 | 4탭 가정 폐기 |
| 6 | `/weight` 진입 시 체중 탭이 active로 시각 전환 | match=prefix |

## 기술 스택

- 라우터: App Router (`src/app/`)
- TypeScript: Yes
- 아이콘: `lucide-react@0.487.0` (Scale 아이콘 이미 다른 컴포넌트에서 사용 중 — 신규 의존성 X)
- E2E: Playwright (`e2e/`)
- CSS: Tailwind + design tokens (globals.css)

## 레퍼런스 패턴

- [src/components/layout/BottomNav.tsx](../../src/components/layout/BottomNav.tsx) — 기존 navItems 배열 구조·`isItemActive` 로직 그대로 사용. 항목 추가 + 순서 변경만 발생
- [src/components/checklist/ChecklistRow.tsx](../../src/components/checklist/ChecklistRow.tsx) L9 — `Scale` lucide-react import 패턴 그대로 차용
- [e2e/navigation.spec.ts](../../e2e/navigation.spec.ts) — 기존 `page.locator("nav").last().getByText(...)` 패턴 유지하며 5탭 단언으로 재작성

## 구현 순서

1. **BottomNav.tsx**
   - lucide-react import에 `Scale` 추가
   - `navItems` 배열에 `{ path: "/weight", icon: Scale, label: "체중", match: "prefix" }` 추가
   - 배열 순서를 `홈 → 체크리스트 → 체중 → 베이비페어 → 정보`로 재정렬
2. **navigation.spec.ts**
   - 1번 테스트: "5개 네비게이션 항목이 보인다" — 5개 라벨 모두 visible 단언, 의미 잃은 "영상" 0건 가드 삭제, 탭 순서까지 검증
   - 2번 테스트: "네비게이션으로 페이지 이동이 된다" — 체크리스트/체중/베이비페어/정보/홈 5경로 모두 클릭 → URL 단언
   - 헤더 주석은 phase-4.6 §4.1 N1=B 5탭 기준으로 갱신

## 생성/수정 파일 목록

| 구분 | 경로 | 역할 |
|------|------|------|
| 수정 | [src/components/layout/BottomNav.tsx](../../src/components/layout/BottomNav.tsx) | Scale import + navItems에 체중 항목 추가 + 순서 재정렬 |
| 수정 | [e2e/navigation.spec.ts](../../e2e/navigation.spec.ts) | 5탭 단언·5경로 이동 단언으로 재작성 |

## 가정 사항

- "체중" 탭 위치는 phase-4.6 §4.1 명시("홈/체크리스트/체중/베이비페어/정보") 그대로 따른다.
- 체중 탭 active 시각도 기존 pink CTA(`bg-pastel-pink/40`) 동일 — DESIGN.md L67 컨벤션 유지(별도 색 분리 결정 없음).
- 본 작업의 스코프는 §4 한정. §5 GA4(`axis_enter` 5탭 funnel)·홈 카드 정합 등은 후속 작업이며 본 plan에서 다루지 않는다.
- DESIGN.md의 5탭 탭당 폭(~64px) 검증 항목은 시각 회귀이므로 e2e 단언으로 강제하지 않고 운영자 시각 점검에 위임(별도 디자인 토큰 변경 없음).

## Out of Scope

- §5 GA4 `axis_enter`/`axis_cross_link` 5탭 funnel 이벤트 추가
- 홈 카드 구조/HomeContent.tsx 조정 (H1=B로 §3 폐기)
- `/timeline` 라우트 관련 작업 (T1 rollback)
- 다른 e2e spec의 `/weight` 진입 동선 갱신 — 별도 회귀 라운드

## 예상 리스크

- **수정 파일이 다른 기능과 공유되어 사이드이펙트 가능성**: BottomNav.tsx는 layout.tsx에서 전역 사용. 항목 5개로 늘면 탭당 폭이 줄어 `text-[11px]` 라벨이 줄바꿈될 수 있음. 라벨 최장 "베이비페어"(5자)가 기준 — 모바일 375px에서 5개 탭 균등 분포 시 탭당 ~64-72px이라 한 줄 수용 예상이나, 운영자 시각 점검 필요.
- **기존 코드와 충돌 가능성**: design-bundle-h spec이 `/baby-fair`에서 `bg-pastel-pink/40` 개수를 검사함(>0). 5탭 중 1개만 active이므로 카운트 변동 없음 — 충돌 X. 추가로 phase-4-step-1-checklist-hub spec이 "체크리스트" 탭 active를 검사하는데 라벨/path 보존되므로 통과.
