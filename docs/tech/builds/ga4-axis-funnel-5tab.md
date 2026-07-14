# ga4-axis-funnel-5tab

> 상태: 구현✅ 리뷰✅ 리팩토링· | 최종 갱신 2026-06-03

<!-- STEP:impl -->
## 구현

> Plan: [docs/plan/ga4-axis-funnel-5tab-plan.md](../../plan/ga4-axis-funnel-5tab-plan.md)
> phase-4.6 §5 라운드 — 2026-06-03

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| AC1: `axis_enter` 5탭 진입 시 1회 발사 | ✅ | PageviewTracker useEffect 안, `pathToTab(pathname)` 매핑 후 발사 |
| AC2: `axis_cross_link(from, to)` BottomNav 클릭 시 발사, 같은 탭은 X | ✅ | Link onClick에서 from/to 비교 후 조건 발사 |
| AC3: 매핑 외 path 발사 X | ✅ | `pathToTab` null 반환 시 발사 안 함 |
| AC4: `docs/marketing/ga4.md` §3.E 등재 + §5.3 5탭 funnel | ✅ | 2 이벤트 정의 + funnel 5단계 + §9 changelog |
| AC5: `ANOMALY_EVENTS` 확장 | ✅ | axis_enter, axis_cross_link 추가 |
| AC6: `e2e/axis-funnel.spec.ts` 신규 (5탭 + cross_link + deprecated 0건) | ✅ | 4개 테스트 신규 |
| AC7: `e2e/ga4-events.spec.ts` 주석 정합 | ✅ | line 43 주석 갱신 |
| AC8: unit + e2e 풀 회귀 통과 | ⏳ | 다음 단계 (run-e2e) |

### 생성/수정 파일 목록

#### 신규 생성

- `e2e/axis-funnel.spec.ts` — 5탭 axis_enter 5종 + axis_cross_link(from/to) + 같은 탭 발사 X + deprecated content_click(type=video) 0건 assertion (4 테스트)

#### 수정

- `src/lib/analytics.ts` — `TabId` 타입 + `pathToTab(pathname): TabId | null` pure 함수 export 추가
- `src/components/analytics/PageviewTracker.tsx` — `pathToTab` import + useEffect 안 page_view 직후 `if (tab) sendGAEvent("axis_enter", { tab })` 추가
- `src/components/layout/BottomNav.tsx` — `pathToTab`/`sendGAEvent` import + Link onClick 추가, from=현재 pathname 매핑, to=클릭 항목 매핑, `from && to && from !== to` 일 때만 발사
- `docs/marketing/ga4.md` — §3.E에 `axis_enter`·`axis_cross_link` 이벤트 정의 등재, §5.3에 "5탭 funnel" 5단계 추가, §9 changelog 1행
- `scripts/weekly-report/ga4-queries.ts` — `ANOMALY_EVENTS` 배열에 `axis_enter`, `axis_cross_link` 2개 추가 (Q5 이상치 추적 윈도우)
- `e2e/ga4-events.spec.ts` — line 43 주석을 "BottomNav 5탭 중 정보 탭으로" 정합 갱신

### 주요 결정 사항

- **`pathToTab` 위치**: plan에 명시된 대로 `src/lib/analytics.ts`에 pure 함수로 추가. unit test 대상으로 분리. BottomNav의 `isItemActive` 와 매칭 룰이 약간 다름 — `pathToTab`는 `/articles`·`/info` 둘 다 `info` 로 매핑(BottomNav `alsoMatchPrefixes` 정합), 매핑 외 path는 명시적 `null` (BottomNav는 active=false).
- **`from = null` 처리**: 매핑 외 path(예: `/timeline`, `/articles/[slug]`)에서 BottomNav 탭 클릭 시 `from === null` → axis_cross_link 발사 안 함. 데이터 깨끗하게 유지하는 보수적 선택. 추후 "기타→탭" 추적 수요 발생 시 `from: "other"` 라벨 신설로 확장 가능.
- **ANOMALY_EVENTS 확장만, Q6 신설 X**: plan의 Out of Scope 그대로 — 신규 query 추가하지 않고 기존 Q5 윈도우에 포함. axis_* 발화량은 page_view 수준이라 anomaly band 검증으로 충분.
- **e2e "같은 탭 클릭" 테스트의 active 시각 검증 생략**: navigation.spec.ts 가 이미 active 시각을 검증. 본 spec은 GA4 발화만 검증해 책임 분리.

### 가정 사항

- (plan 그대로) `axis_enter`·`axis_cross_link`는 신규 이벤트 — wiring까지 포함.
- (plan 그대로) `axis_cross_link` 스코프는 BottomNav 한정. 콘텐츠 내 cross-link는 후속.
- (plan 그대로) `timeline_*` 카탈로그는 deprecated 마킹된 적 없어 변경 없음 — 본 라운드 ga4.md diff 에서 timeline 관련 변경 0건 확인.
- (구현 중 추가) `content_click(type=video)` deprecated 메모는 §3.C 에 이미 박혀 있고 (line 129), 본 라운드에서 추가 변경 없음. axis-funnel.spec.ts 가 5탭 동선에서 0건 발화 가드로 보호.
- (구현 중 추가) BottomNav Link onClick은 `preventDefault` 호출 X — Next.js client-side nav 유지. sendGAEvent는 동기 호출이고 라우팅 전 발사가 보장됨.

### 미구현 항목

- 콘텐츠 내 cross-link 발화(article 본문 → weight/checklist 카드) — plan Out of Scope, 후속 라운드.
- weekly-report Q6 axis_* 전용 query — plan Out of Scope, Q5 윈도우 포함으로 minimal viable.
- 타임라인 spec 3종 정리 — T1 rollback 으로 라우트 살아있어 그대로 유지.
- `axis_*` user_property cohort 분석 — phase-5 GA4 query 보강 시.

---

<!-- STEP:review -->
## 코드 리뷰

> Plan: [docs/plan/ga4-axis-funnel-5tab-plan.md](../../plan/ga4-axis-funnel-5tab-plan.md)
> Impl: [docs/implementation/ga4-axis-funnel-5tab-impl.md](#구현)
> 리뷰일: 2026-06-03

### 리뷰 대상 파일

Production 코드 한정 — docs/marketing/ga4.md 와 e2e/* 는 리뷰 범위 외.

- [src/lib/analytics.ts](../../../src/lib/analytics.ts) — `TabId` 타입 + `pathToTab` pure fn 추가
- [src/components/analytics/PageviewTracker.tsx](../../../src/components/analytics/PageviewTracker.tsx) — useEffect 안 axis_enter 발사 추가
- [src/components/layout/BottomNav.tsx](../../../src/components/layout/BottomNav.tsx) — Link onClick에 axis_cross_link 발사 추가
- [scripts/weekly-report/ga4-queries.ts](../../../scripts/weekly-report/ga4-queries.ts) — `ANOMALY_EVENTS`에 axis_* 2건 추가

---

### Critical 이슈

**0건.**

---

### Warning

**0건.**

---

### Suggestion (개선 아이디어 — 코드 변경 없음)

#### 1. BottomNav.tsx — onClick inline 함수 메모이즈

- **위치**: [src/components/layout/BottomNav.tsx:67-72](../../../src/components/layout/BottomNav.tsx#L67-L72)
- **현황**: 5개 Link 각각이 매 렌더마다 새 onClick 화살표 함수 생성. `pathname` 변경 시 BottomNav 자체가 리렌더되므로 함수 재생성이 잦음.
- **개선안**: `useCallback`으로 `handleClick(item: NavItem)` 메모이즈. 다만 BottomNav는 작은 컴포넌트(5 Link, 의존성 단순)라 useCallback overhead 가 절감 효과를 압도할 수도. ROI 낮음 — 본 PR 변경 없음.

#### 2. axis_enter 발화 주기 — page_view 단위 vs 탭 전환 단위

- **위치**: [src/components/analytics/PageviewTracker.tsx:24-25](../../../src/components/analytics/PageviewTracker.tsx#L24-L25)
- **현황**: `axis_enter`가 page_view마다 발사 — 같은 탭 내 페이지 이동(예: `/checklist` → `/checklist/hospital-bag`)에서도 매번 발사됨. GA4 funnel 분석 시 "탭 진입 횟수"가 실제 탭 전환 횟수보다 부풀어 보임.
- **개선안 A**: BottomNav onClick으로만 발사하도록 옮김 → 외부 링크/딥링크 직접 진입 누락
- **개선안 B**: PageviewTracker 안에서 이전 tab 기억 후 `prevTab !== tab` 일 때만 발사
- **결정**: 현재 구현이 보수적(누락 없음). GA4 분석 단계에서 sessionId × tab 으로 dedupe 가능. 본 PR 변경 없음 — phase-5 GA4 query 보강 시 함께 결정.

#### 3. ANOMALY_EVENTS 배열 모듈 분리

- **위치**: [scripts/weekly-report/ga4-queries.ts:46-57](../../../scripts/weekly-report/ga4-queries.ts#L46-L57)
- **현황**: ANOMALY_EVENTS 가 10개로 늘어남. 카탈로그(`docs/marketing/ga4.md`) 와 직접 동기되어야 하는데 두 SoT가 분리되어 있어 누락 위험.
- **개선안**: `scripts/weekly-report/event-catalog.ts`로 분리해 카탈로그 사이드 import. 다만 정적 export 환경이라 빌드 시점 검증으로 충분 — 본 PR scope 외.

---

### 도메인 검토 (참고)

#### `axis_cross_link` 발화 위치 — BottomNav 한정

본 라운드는 BottomNav `<Link>` 클릭만 cross_link 발사. 콘텐츠 내 도구↔콘텐츠 cross-link(article 본문 → weight/checklist 카드)는 plan Out of Scope.

phase-5 GA4 query 보강 라운드에서 `axis_cross_link.source` 분기 enum 도입(`bottom_nav` / `article_body` / `home_card` 등) 검토 가능.

#### 빌드 검증 미실행

Critical 0건이라 Phase 4 빌드 검증 건너뜀. 구현 단계에서 1회 빌드 통과 확인 완료 (impl.md).

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 0건 |
| Suggestion | 3건 (코드 변경 없음) |
| 빌드 | 미실행 (Critical 없음) |

본 라운드 production 코드는 변경 범위가 좁고 (4 파일, 추가 라인 약 60줄) 타입·보안·접근성 회귀 없음. unit 95/95 + e2e 540/553 통과(13건은 §5와 무관한 기존 회귀, [run-e2e 결과](#구현) 참고).
