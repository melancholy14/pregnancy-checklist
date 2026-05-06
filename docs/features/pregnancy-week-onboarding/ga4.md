# pregnancy-week-onboarding 측정 설계

> 작성일: 2026-05-05
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)
> 카탈로그 정합: [docs/plan/phase-4.5.md §1.4 ~ §1.8](../../plan/phase-4.5.md), [docs/marketing/ga4.md](../../marketing/ga4.md)

## review.md 결정사항 참조

- **항목 1 (A')**: zustand store에 `currentPregnancyWeek` + `lastCalcDate` 캐시. PageviewTracker가 매 page_view 직전 `refreshWeekIfNeeded()` → user property set 호출. set 자체는 매 page_view 발생, 단 calcPregnancyWeek 실호출은 dueDate 변경 + 자정 boundary 통과 시 1회.
- **항목 2 (C)**: 정보 탭·체크리스트 직진자에게 슬림 배너 노출 → 이 노출/클릭/닫기를 `onboarding_banner_view`/`onboarding_banner_click`/`onboarding_banner_dismiss`로 측정.

## 1. 측정 목표

- **핵심 질문**:
  1. 첫 방문자 중 dueDate 입력 전환율은? (등록 funnel)
  2. 코호트별(`cohort_join_week`) 4주 후 리텐션은? (북극성)
  3. SEO 직진자(슬림 배너 진입 경로)와 홈 진입자(풀스크린 onboarding 경로) 중 어느 쪽 입력률이 높은가?
- **의사결정 연결**:
  - Q1·Q3 결과로 onboarding UX 강도 조정 (review.md 항목 3 옵션 C "A→B ramp" 재검토 가능)
  - Q2 결과로 콘텐츠·체크리스트 정렬 우선순위 조정 (어느 주차에서 이탈이 큰가)

## 2. 이벤트 명세

### 2.1 신규 이벤트

| event_name | 트리거 | 파라미터 (이름 / 타입 / 예시) | 비고 |
|---|---|---|---|
| `pregnancy_week_set` | `setDueDate()` 성공 시 (값 검증 통과 후) | `week: number`(예: 24), `source: string`("onboarding" \| "manual_update") | **conversion 마킹**. phase-4.5.md §1.5 카탈로그 등재 |
| `onboarding_banner_view` | 슬림 배너가 처음 화면에 그려질 때 (IntersectionObserver 또는 mount 1회) | `page_path: string`(예: "/articles/folic-acid-guide"), `current_pregnancy_week: number \| null` (사용자가 dueDate 미입력 상태이므로 보통 null) | 페이지별 노출량 분석용. mount당 1회만 발사 (scroll 재발사 X) |
| `onboarding_banner_click` | 슬림 배너 클릭 → `/` 이동 직전 | `page_path: string`, `source_page: string`("articles" \| "checklist" \| "timeline" \| "weight" \| "info") | 기존 [DueDateBanner.tsx:21](../../../src/components/home/DueDateBanner.tsx#L21)의 `onboarding_banner_click` 이벤트 키 재사용 — 호환 유지, source_page enum 확장 |
| `onboarding_banner_dismiss` | 배너 X 버튼 클릭 → localStorage 저장 직전 | `page_path: string`, `source_page: string`(상동) | 어느 페이지·어떤 카피가 거부 신호 강한지 |

### 2.2 기존 이벤트 (정리/유지)

| event_name | 변경 사항 | 비고 |
|---|---|---|
| `due_date_set` | 파라미터 표준화: `pregnancy_week: number` 유지. **추가 X**, **변경 X**(marketer §3.6 락인 룰) | [DueDateInput.tsx:28](../../../src/components/home/DueDateInput.tsx#L28) 기존 발사 위치 그대로. 단 `pregnancy_week_set`이 conversion 이벤트가 되면서 이 이벤트는 "행동 트리거"·`pregnancy_week_set`은 "성공 결과"로 의미 분리 |
| `page_view` | user property 3종 piggyback (set 시점은 §3 참조) | 페이로드 자체 변경 X. 단 user property는 다음 이벤트의 컨텍스트로 GA4가 자동 첨부 |

### 2.3 PII 점검

- ✅ `week` (24·32 등 정수) — 코호트 그라뉼래러티, PII 아님 (designer N3, marketer §3.1 정합)
- ✅ `source`, `source_page`, `page_path` — 행동 메타 정보, PII 아님
- ❌ **금지**: dueDate 자체(YYYY-MM-DD 문자열)는 어떤 이벤트·user property에도 보내지 않음. `current_pregnancy_week`만 전송

## 3. 유저 프로퍼티 변경

### 3.1 신규 user properties (3종)

| 이름 | 타입 | set 시점 | 갱신 정책 | 의미 |
|---|---|---|---|---|
| `due_date_set` | boolean | (a) 매 page_view 직전 (PageviewTracker), (b) `setDueDate()` 성공 직후, (c) `clearDueDate()` 직후 | dueDate 변경에 따라 즉시 반영. 매 page_view에 piggyback set으로 안전 마진 | 미입력자/입력자 슬라이싱의 baseline |
| `current_pregnancy_week` | number(integer) | 상동 | `lastCalcDate !== todayKST`이면 `refreshWeekIfNeeded()`가 store 갱신 → 그 다음 page_view부터 새 값 set | 코호트 그라뉼래러티, "주차 × 토픽" 슬라이싱 |
| `cohort_join_week` | number(integer) | 첫 `setDueDate()` 성공 시 1회만 store에 set. 이후 영구 보존 (dueDate 수정해도 변경 X) | **고정값** — marketer §5.2 룰 의도적 적용 | "초기 등록자 vs 후기 등록자" 행동 차이 분석 |

### 3.2 set 호출 위치 (단 하나)

```
PageviewTracker.useEffect(pathname):
  useDueDateStore.getState().refreshWeekIfNeeded()  // store 자체 갱신
  const { dueDate, currentPregnancyWeek, cohortJoinWeek } = useDueDateStore.getState()
  gtag('set', 'user_properties', {
    due_date_set: dueDate !== null,
    current_pregnancy_week: currentPregnancyWeek ?? undefined,  // null이면 set 생략
    cohort_join_week: cohortJoinWeek ?? undefined,
  })
  sendGAEvent('page_view', { page_path: pathname })
```

- store 자체 갱신은 `setDueDate()`/`clearDueDate()`/`refreshWeekIfNeeded()` 세 액션에서만 발생 — 호출 위치 분산 X
- GA4 set 호출은 `PageviewTracker.tsx` 단 한 곳

### 3.3 GA4 admin 등록

- 코드 배포 후 [GA4 admin > Custom definitions](https://analytics.google.com/) 에서 user property 3종 등록 (운영자 수동 1회)
- 등록 누락 시 보고서·세그먼트에서 노출 안 됨 — marketer §5.2 룰 체크리스트 항목

## 4. 깔때기·세그먼트

### 4.1 핵심 등록 funnel (due_date_set funnel)

| 단계 | 측정 이벤트 | 전환 의미 |
|---|---|---|
| 1. 진입 | `page_view` (전 페이지) | 사이트 도달 |
| 2. onboarding 노출 | `onboarding_banner_view`(SEO 경로) 또는 OnboardingFlow Step 1 mount(홈 경로) | 도구 인지 |
| 3. 입력 의향 | `onboarding_banner_click` 또는 OnboardingFlow Step 2 도달 | 입력 의향 표명 |
| 4. **입력 성공** | `pregnancy_week_set` (conversion) | 핵심 등록 완료 |
| 5. 첫 핵심 행동 | `checklist_item_check` 또는 `article_view` (입력 후 동일 세션) | 도구 가치 첫 경험 |

### 4.2 코호트 리텐션 (북극성)

- 세그먼트: `cohort_join_week` (정수, 4·8·12·16·20·24·28·32·36·40 buckets)
- 지표: 등록 후 W+1, W+2, W+4 주의 `page_view` 또는 `checklist_item_check` 1회 이상 발사 비율

### 4.3 진입 경로 비교

- 세그먼트 A: `onboarding_banner_click → pregnancy_week_set` (SEO 경로)
- 세그먼트 B: `pregnancy_week_set` 발사 직전 30분 내 `/` page_view 있음 (홈 경로)
- 비교 지표: 입력률, 입력 후 1주 retention

## 5. 대시보드 항목

> [phase-4.5.md §1.9 자동 주간 리포트 Pattern C](../../plan/phase-4.5.md) 의 weekly markdown 리포트와 정합

### 5.1 GA4 explorations

- **Cohort exploration**: `cohort_join_week` 기준 weekly retention (북극성)
- **Funnel exploration**: §4.1 5단계 funnel
- **Free-form**: `current_pregnancy_week` × 핵심 이벤트 매트릭스 (예: "20주차에 영양 글이 많이 읽힘")

### 5.2 자체 주간 리포트 항목 (§1.9 schema)

```yaml
weekly_report:
  funnel:
    - step: due_date_set
      conversion_rate: <측정값>
    - step: pregnancy_week_set (conversion)
      conversion_rate: <측정값>
  cohort_retention:
    cohort_join_week_buckets: [4-8, 8-16, 16-24, 24-32, 32-40]
    week_plus_1: <%>
    week_plus_4: <%>
  banner_paths:
    - source_page: articles
      view_to_click_rate: <%>
    - source_page: checklist
      view_to_click_rate: <%>
```

## 6. 데이터 보존·정합성

- **데이터 연속성** (marketer §3.6): `due_date_set`/`pregnancy_week_set` 이벤트명·파라미터 키는 락인. 변경 시 신/구 병행 4주 grace period
- **DebugView 검증** (marketer §5.1): PR 머지 전 `pregnancy_week_set`·`onboarding_banner_*` 4종 이벤트 GA4 DebugView 캡처 첨부 의무
- **첫 8주 raw JSON 보존** (marketer §5.5): 자동 주간 리포트 LLM 요약 외 raw export 별도 저장
