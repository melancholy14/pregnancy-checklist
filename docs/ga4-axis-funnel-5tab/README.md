# ga4-axis-funnel-5tab

> 작성일: 2026-06-03 | 작성자: Claude Code
> Phase: [phase-4.6 §5](../plan/phase-4.6.md) — V1=A 확정 + T1 rollback + N1=B 5탭 도미노 후속

## 개요

phase-4.6 §5 GA4 funnel 재정의 라운드. 영상 자산 제거(V1=A)·BottomNav 5탭 적용(N1=B) 도미노를 반영해 신규 `axis_enter`·`axis_cross_link` 이벤트를 PageviewTracker·BottomNav에 발화한다. GA4 카탈로그·weekly-report query·E2E 가드를 5탭(홈/체크/체중/페어/정보) funnel 기준으로 갱신해 phase-4.6 마감 → AdSense 신청(목표 6/15) 준비를 마무리.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| AC1: `axis_enter` 5탭 진입 시 1회 발사 | ✅ | PageviewTracker useEffect 안 |
| AC2: `axis_cross_link(from, to)` BottomNav 클릭, 같은 탭은 X | ✅ | Link onClick from/to 조건 발사 |
| AC3: 매핑 외 path 발사 X | ✅ | `pathToTab` null 반환 시 발사 안 함 |
| AC4: `docs/marketing/ga4.md` §3.E 등재 + §5.3 5탭 funnel | ✅ | 2 이벤트 정의 + funnel 5단계 + §9 changelog |
| AC5: `ANOMALY_EVENTS` 확장 | ✅ | axis_enter, axis_cross_link 추가 |
| AC6: `e2e/axis-funnel.spec.ts` 신규 (5탭 + cross_link + deprecated 0건) | ✅ | 5 테스트 신규 |
| AC7: `e2e/ga4-events.spec.ts` 주석 정합 | ✅ | line 43 주석 갱신 |
| AC8: unit + e2e 풀 회귀 통과 | 🟡 | 본 라운드 직접 영향 100% 통과. 13건 기존 회귀(§5 무관)는 별도 cleanup |

### 생성/수정 파일

**신규**
- `e2e/axis-funnel.spec.ts` — 5탭 axis_enter 5종 + cross_link from/to + 같은 탭 발사 X + deprecated content_click(type=video) 0건 + 모바일 375px (5 테스트)
- `src/lib/__tests__/analytics.test.ts` — pathToTab pure fn 단위 테스트 (37 테스트)

**수정**
- `src/lib/analytics.ts` — `TabId` 타입 + `pathToTab(pathname): TabId | null` pure 함수 export
- `src/components/analytics/PageviewTracker.tsx` — useEffect 안 axis_enter 발사 추가
- `src/components/layout/BottomNav.tsx` — Link onClick에 axis_cross_link 발사 (from/to 조건)
- `docs/marketing/ga4.md` — §3.E 이벤트 등재 + §5.3 5탭 funnel + §9 changelog
- `scripts/weekly-report/ga4-queries.ts` — `ANOMALY_EVENTS`에 axis_* 2개 추가
- `e2e/ga4-events.spec.ts` — line 43 주석 정합 (5탭 기준)
- `e2e/content-enhancement.spec.ts` — §4 영향 갱신 (5탭 후 "체중 제거" 단언 폐기)

### 주요 결정 사항

- **`pathToTab` 위치 — `src/lib/analytics.ts`**: pure 함수로 분리해 unit test 대상. BottomNav `isItemActive`와 매칭 룰이 다름 — `pathToTab`는 `/articles`·`/info` 둘 다 `info` 매핑, 매핑 외 path는 명시적 `null`.
- **`from === null` 처리 — 발사 안 함**: 매핑 외 path(예: `/timeline`, `/articles/[slug]`)에서 BottomNav 탭 클릭 시 cross_link 발사 X. 데이터 깨끗하게 유지. 추후 "기타→탭" 추적 수요 시 `from: "other"` 라벨로 확장 가능.
- **ANOMALY_EVENTS 확장만, Q6 신설 X**: Q5 윈도우에 axis_* 포함하는 minimal viable. 발화량이 page_view 수준이라 anomaly band 검증으로 충분.
- **e2e 4 describe 구조**: 페르소나 §4.3 — Happy/Edge/회귀가드/반응형. 권한/인증은 §3.2 정적 사이트라 N/A.

### 가정 사항 및 미구현 항목

가정:
- `axis_enter`·`axis_cross_link`는 신규 이벤트 (plan에 등재만, 코드 wiring 부재) → 본 라운드에서 wiring 포함.
- `axis_cross_link` 스코프는 BottomNav 한정. 콘텐츠 내 cross-link는 후속.
- `timeline_*` 카탈로그는 deprecated 마킹된 적 없음 → "마킹 취소" 작업 사실상 변경 없음.
- BottomNav `onClick`에서 `preventDefault` X → client-side nav 보존.

미구현 (Out of Scope):
- 콘텐츠 내 cross-link (article 본문 → weight/checklist 카드)
- weekly-report Q6 axis_* 전용 query
- 타임라인 spec 3종 정리 (T1 rollback으로 라우트 살아있어 유지)
- `axis_*` user_property cohort 분석 — phase-5

---

## 코드 리뷰 결과

### Critical 이슈

**0건.**

### Warning

**0건.**

### Suggestion (코드 변경 없음, 후속 검토)

1. **BottomNav.tsx onClick 메모이즈** — 5 Link 매 렌더 새 함수. useCallback ROI 낮아 본 PR 변경 없음.
2. **axis_enter 발화 주기** — page_view 단위라 같은 탭 내 페이지 이동에서도 발사. GA4 분석 단계 dedupe로 충분.
3. **ANOMALY_EVENTS 모듈 분리** — 10개로 늘어남. 카탈로그와 SoT 분리되어 있어 누락 위험 — phase-5 검토.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 0건 |
| Suggestion | 3건 (코드 변경 없음) |
| 빌드 | 미실행 (Critical 없음) |

---

## 리팩토링 내용

> Warning 0건 + 추가 판단 0건 → no-op. 본 라운드는 변경 범위가 좁고(production 4 파일, 추가 ~60줄) 코드가 이미 정리된 상태로 머지.

---

## E2E 테스트 결과

### 본 라운드 신규 spec (axis-funnel.spec.ts 단독)

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 2 passed (axis_enter 5종 / cross_link from→to) |
| Edge — 같은 탭 클릭 | ✅ 1 passed |
| 회귀 가드 — V1=A deprecated 0건 | ✅ 1 passed |
| 반응형 (Mobile 375px) | ✅ 1 passed |
| 권한/인증 | N/A (정적 사이트, 페르소나 §3.2) |
| **전체** | **5 passed / 0 failed (4.6s)** |

### Unit 테스트 (analytics.test.ts)

| 케이스 유형 | 결과 |
|---|---|
| Happy Path (5탭 정확 매칭) | ✅ 5 passed |
| Boundary (prefix·슬래시) | ✅ 4 passed |
| alsoMatchPrefixes (/info → info) | ✅ 3 passed |
| Null 경로 (5탭 외) | ✅ 11 passed |
| Invariant (반환 enum 검증) | ✅ 14 passed |
| **전체** | **37 passed / 0 failed (5ms)** |

### 풀 회귀 (plan AC8)

- Unit: 95 passed / 0 failed (218ms)
- E2E: 539 passed / 13 failed (9.5m)
  - 13건 모두 stash 검증으로 **본 §5 변경과 무관한 기존 회귀** 확정
  - 패턴: `checkbox.dispatchEvent("click")` 30s 타임아웃 (timeline/체크리스트 페이지)
  - 처리: phase-4.6 §7 회귀 안전장치 또는 별도 cleanup 라운드로 분리

📊 상세 리포트: `playwright-report/index.html`

---

## 관련 문서

- 계획: [docs/plan/ga4-axis-funnel-5tab-plan.md](../plan/ga4-axis-funnel-5tab-plan.md)
- 구현 요약: [docs/implementation/ga4-axis-funnel-5tab-impl.md](../implementation/ga4-axis-funnel-5tab-impl.md)
- 리뷰: [docs/review/ga4-axis-funnel-5tab-review.md](../review/ga4-axis-funnel-5tab-review.md)
- 상위 phase: [docs/plan/phase-4.6.md](../plan/phase-4.6.md) §5
- GA4 카탈로그: [docs/marketing/ga4.md](../marketing/ga4.md)

---

## 누락된 문서

- `docs/refactor/ga4-axis-funnel-5tab-refactor.md` — 본 라운드 refactor 단계 no-op (Warning 0건 + 추가 판단 0건)
