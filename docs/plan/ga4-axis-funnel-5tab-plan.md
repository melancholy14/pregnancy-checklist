# Feature Plan: ga4-axis-funnel-5tab

> 출처: [phase-4.6.md](phase-4.6.md) §5 GA4 5탭 funnel 재정의
> (V1=A 확정 + T1 rollback + N1=B 5탭 도미노)
> 작성일: 2026-06-03

## 기능 목표

phase-4.6 §5 GA4 5탭 funnel 재정의 라운드. V1=A(영상 제거) 확정 + T1 rollback(timeline_* 살림) 도미노를 반영해 신규 `axis_enter`·`axis_cross_link` 이벤트를 PageviewTracker·BottomNav에 발화하고, GA4 카탈로그·weekly-report query·E2E 가드를 5탭(홈/체크/체중/페어/정보) funnel 기준으로 갱신한다.

## 완료 조건 (AC)

| # | 조건 | 비고 |
|---|------|------|
| 1 | `axis_enter` 이벤트 — 5탭 path 진입 시 1회 발사 (PageviewTracker) | param: `tab` ∈ {home, checklist, weight, baby-fair, info} |
| 2 | `axis_cross_link` 이벤트 — BottomNav 탭 클릭 시 from(현재 active) → to(클릭) 발사. 같은 탭 클릭은 발사 X | param: `from`, `to` |
| 3 | path → tab 매핑 안 되는 페이지(/timeline, /articles/[slug] 등)에서는 axis_enter 발사 X | pure fn `pathToTab(pathname)` 추출 (unit test 대상) |
| 4 | `docs/marketing/ga4.md` §3.E에 두 신규 이벤트 정의 등재 + §5.3 funnel에 "5탭 funnel" 항목 추가 | §3.C content_click(video) deprecated 메모 유지, §3.D timeline 이벤트 deprecated 마킹 없음 확인 |
| 5 | `scripts/weekly-report/ga4-queries.ts` `ANOMALY_EVENTS`에 `axis_enter`·`axis_cross_link` 추가 | Q5 이상치 추적 윈도우에 포함. Q2 CORE_BEHAVIOR_EVENTS는 변경 없음 |
| 6 | `e2e/axis-funnel.spec.ts` 신규 — 5탭 axis_enter 5종 + axis_cross_link from/to + content_click(type=video) 0건 발화 assertion | setupGtagSpy/__gtagCalls 패턴 재사용 |
| 7 | `e2e/ga4-events.spec.ts` 갱신 — line 43 "타임라인 탭이 없으므로" 주석 5탭 정합으로 갱신, timeline_week_view 테스트 본문은 그대로 유지 (T1 rollback) | T1 rollback 자연 충족 |
| 8 | unit + e2e 풀 회귀 통과 | `npm run test:unit && npm run test:e2e` |

## 기술 스택

- 라우터: App Router (`src/app/`)
- TypeScript: Yes
- GA4 헬퍼: [src/lib/analytics.ts](../../src/lib/analytics.ts) `sendGAEvent`
- E2E: Playwright (`e2e/`)
- 상태관리: zustand (관여 X)

## 레퍼런스 패턴

- [src/components/analytics/PageviewTracker.tsx](../../src/components/analytics/PageviewTracker.tsx) — useEffect + sendGAEvent("page_view") 패턴 그대로 사용, 같은 effect 안에 axis_enter 추가
- [src/components/layout/BottomNav.tsx](../../src/components/layout/BottomNav.tsx) L62-L71 — Link `onClick` 핸들러 신규 추가 (preventDefault 호출 X, client-side nav 보존)
- [e2e/ga4-events.spec.ts](../../e2e/ga4-events.spec.ts) L3-L29 — `setupGtagSpy` + `__gtagCalls` + `getGtagCalls` 패턴
- [docs/marketing/ga4.md](../marketing/ga4.md) §3.E — 기존 신호 이벤트 등재 형식 (목적/트리거/파라미터/층/발사 위치/분석/주의)

## 구현 순서

1. **`src/lib/analytics.ts`** — `pathToTab(pathname: string): TabId | null` pure 함수 추가 (unit test 대상)
   - 매핑: `/` → `home`, `/checklist*` → `checklist`, `/weight*` → `weight`, `/baby-fair` → `baby-fair`, `/articles*`·`/info*` → `info`, 그 외 → `null`
   - `TabId` 타입 export
2. **`src/components/analytics/PageviewTracker.tsx`** — 기존 useEffect 안에 `const tab = pathToTab(pathname); if (tab) sendGAEvent("axis_enter", { tab });` 추가
3. **`src/components/layout/BottomNav.tsx`** — Link `onClick`에서 현재 active tab → 클릭 tab cross-link 발사. `isItemActive` 결과를 활용해 from 결정
4. **`docs/marketing/ga4.md`** §3.E에 `axis_enter`·`axis_cross_link` 등재, §5.3에 5탭 funnel 추가, §9 변경 이력 1행
5. **`scripts/weekly-report/ga4-queries.ts`** `ANOMALY_EVENTS` 배열에 `axis_enter`, `axis_cross_link` 추가
6. **`e2e/axis-funnel.spec.ts`** 신규 — 5탭 네비게이션 → axis_enter 5종 검증 + cross_link from/to 검증 + deprecated content_click(type=video) 0건 assertion
7. **`e2e/ga4-events.spec.ts`** line 43 주석 갱신 ("타임라인 탭이 없으므로" → "BottomNav 5탭에서 정보 탭으로 검증")

## 생성/수정 파일 목록

| 구분 | 경로 | 역할 |
|------|------|------|
| 수정 | [src/lib/analytics.ts](../../src/lib/analytics.ts) | `TabId` 타입 + `pathToTab` pure fn 추가 |
| 수정 | [src/components/analytics/PageviewTracker.tsx](../../src/components/analytics/PageviewTracker.tsx) | axis_enter 발사 추가 |
| 수정 | [src/components/layout/BottomNav.tsx](../../src/components/layout/BottomNav.tsx) | axis_cross_link 발사 추가 |
| 수정 | [docs/marketing/ga4.md](../marketing/ga4.md) | §3.E 이벤트 등재 + §5.3 5탭 funnel + §9 변경 이력 |
| 수정 | [scripts/weekly-report/ga4-queries.ts](../../scripts/weekly-report/ga4-queries.ts) | ANOMALY_EVENTS에 axis_* 추가 |
| 신규 | `e2e/axis-funnel.spec.ts` | 5탭 axis_enter·cross_link + deprecated 0건 assertion |
| 수정 | [e2e/ga4-events.spec.ts](../../e2e/ga4-events.spec.ts) | 주석 정합 (1줄) |

## 가정 사항

- `axis_enter`·`axis_cross_link`는 **신규 이벤트** — phase-4.6.md §5.2 표에 기재되어 있으나 src/ 코드에 발화 위치가 없어 본 라운드에서 wiring까지 포함.
- `axis_cross_link` 스코프는 **BottomNav 탭 클릭 한정** — 콘텐츠 내 도구↔콘텐츠 cross-link(article → weight 카드 등)는 후속 라운드.
- `timeline_*` 카탈로그는 deprecated 마킹된 적 없으므로 "마킹 취소" 작업은 사실상 변경 없음 — phase-4.6.md §5.2 표 진술을 그대로 반영.
- `weight_week_view` 흡수 이벤트는 추가된 적 없으므로 폐기 작업도 변경 없음.
- BottomNav `onClick`에서 `preventDefault` 호출 X — Next.js `<Link>` client-side nav 보존하면서 sendGAEvent만 추가.
- `TabId` enum 값은 BottomNav `path` slug와 1:1 — kebab-case (`baby-fair`).

## Out of Scope

- 콘텐츠 내 cross-link 발화 (article 본문 → weight/checklist 카드)
- GA4 dashboard·funnel chart 자동 생성 (phase-5)
- 타임라인 spec 3종 정리 (T1 rollback으로 그대로 유지)
- weekly-report Q6 신설 (axis_* 전용 쿼리) — 현재 Q5 ANOMALY_EVENTS에 포함하는 minimal viable로 충분

## 예상 리스크

- **수정 파일이 다른 기능과 공유되어 사이드이펙트 가능성**: `PageviewTracker`는 [src/app/layout.tsx](../../src/app/layout.tsx) 전역 사용. 같은 useEffect 안에서 page_view 다음에 axis_enter를 추가 호출하므로 page_view 발사 자체에는 영향 없음. `BottomNav` Link onClick은 client-side nav를 막지 않도록 `preventDefault` 호출 X.
- **PRD 완료 조건이 기술적으로 모호한 경우**: phase-4.6.md §5.2 표는 "5탭 진입 / 탭 간 이동"만 명시. 발화 위치·param 스펙(`tab`, `from`, `to`) 본 plan에서 확정 — AC 1·2.
- **기존 코드와 충돌 가능성**: `e2e/ga4-events.spec.ts:62`의 `category_tab_switch` 테스트가 `/timeline` 페이지에서 실행됨. T1 rollback으로 `/timeline` 라우트 살아있으니 통과 — 변경 X. `ANOMALY_EVENTS` 확장은 readonly array라 타입 영향 없음.
