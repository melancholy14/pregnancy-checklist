# ga4-axis-funnel-5tab 코드 리뷰

> Plan: [docs/plan/ga4-axis-funnel-5tab-plan.md](../plan/ga4-axis-funnel-5tab-plan.md)
> Impl: [docs/implementation/ga4-axis-funnel-5tab-impl.md](../implementation/ga4-axis-funnel-5tab-impl.md)
> 리뷰일: 2026-06-03

## 리뷰 대상 파일

Production 코드 한정 — docs/marketing/ga4.md 와 e2e/* 는 리뷰 범위 외.

- [src/lib/analytics.ts](../../src/lib/analytics.ts) — `TabId` 타입 + `pathToTab` pure fn 추가
- [src/components/analytics/PageviewTracker.tsx](../../src/components/analytics/PageviewTracker.tsx) — useEffect 안 axis_enter 발사 추가
- [src/components/layout/BottomNav.tsx](../../src/components/layout/BottomNav.tsx) — Link onClick에 axis_cross_link 발사 추가
- [scripts/weekly-report/ga4-queries.ts](../../scripts/weekly-report/ga4-queries.ts) — `ANOMALY_EVENTS`에 axis_* 2건 추가

---

## Critical 이슈

**0건.**

---

## Warning

**0건.**

---

## Suggestion (개선 아이디어 — 코드 변경 없음)

### 1. BottomNav.tsx — onClick inline 함수 메모이즈

- **위치**: [src/components/layout/BottomNav.tsx:67-72](../../src/components/layout/BottomNav.tsx#L67-L72)
- **현황**: 5개 Link 각각이 매 렌더마다 새 onClick 화살표 함수 생성. `pathname` 변경 시 BottomNav 자체가 리렌더되므로 함수 재생성이 잦음.
- **개선안**: `useCallback`으로 `handleClick(item: NavItem)` 메모이즈. 다만 BottomNav는 작은 컴포넌트(5 Link, 의존성 단순)라 useCallback overhead 가 절감 효과를 압도할 수도. ROI 낮음 — 본 PR 변경 없음.

### 2. axis_enter 발화 주기 — page_view 단위 vs 탭 전환 단위

- **위치**: [src/components/analytics/PageviewTracker.tsx:24-25](../../src/components/analytics/PageviewTracker.tsx#L24-L25)
- **현황**: `axis_enter`가 page_view마다 발사 — 같은 탭 내 페이지 이동(예: `/checklist` → `/checklist/hospital-bag`)에서도 매번 발사됨. GA4 funnel 분석 시 "탭 진입 횟수"가 실제 탭 전환 횟수보다 부풀어 보임.
- **개선안 A**: BottomNav onClick으로만 발사하도록 옮김 → 외부 링크/딥링크 직접 진입 누락
- **개선안 B**: PageviewTracker 안에서 이전 tab 기억 후 `prevTab !== tab` 일 때만 발사
- **결정**: 현재 구현이 보수적(누락 없음). GA4 분석 단계에서 sessionId × tab 으로 dedupe 가능. 본 PR 변경 없음 — phase-5 GA4 query 보강 시 함께 결정.

### 3. ANOMALY_EVENTS 배열 모듈 분리

- **위치**: [scripts/weekly-report/ga4-queries.ts:46-57](../../scripts/weekly-report/ga4-queries.ts#L46-L57)
- **현황**: ANOMALY_EVENTS 가 10개로 늘어남. 카탈로그(`docs/marketing/ga4.md`) 와 직접 동기되어야 하는데 두 SoT가 분리되어 있어 누락 위험.
- **개선안**: `scripts/weekly-report/event-catalog.ts`로 분리해 카탈로그 사이드 import. 다만 정적 export 환경이라 빌드 시점 검증으로 충분 — 본 PR scope 외.

---

## 도메인 검토 (참고)

### `axis_cross_link` 발화 위치 — BottomNav 한정

본 라운드는 BottomNav `<Link>` 클릭만 cross_link 발사. 콘텐츠 내 도구↔콘텐츠 cross-link(article 본문 → weight/checklist 카드)는 plan Out of Scope.

phase-5 GA4 query 보강 라운드에서 `axis_cross_link.source` 분기 enum 도입(`bottom_nav` / `article_body` / `home_card` 등) 검토 가능.

### 빌드 검증 미실행

Critical 0건이라 Phase 4 빌드 검증 건너뜀. 구현 단계에서 1회 빌드 통과 확인 완료 (impl.md).

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 0건 |
| Suggestion | 3건 (코드 변경 없음) |
| 빌드 | 미실행 (Critical 없음) |

본 라운드 production 코드는 변경 범위가 좁고 (4 파일, 추가 라인 약 60줄) 타입·보안·접근성 회귀 없음. unit 95/95 + e2e 540/553 통과(13건은 §5와 무관한 기존 회귀, [run-e2e 결과](../implementation/ga4-axis-funnel-5tab-impl.md) 참고).
