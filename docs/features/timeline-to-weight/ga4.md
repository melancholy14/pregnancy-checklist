# timeline-to-weight 측정 설계

> 작성일: 2026-05-31
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)
> 운영 ga4 카탈로그: [docs/marketing/ga4.md](../../marketing/ga4.md)
> 상위 plan: [docs/plan/phase-4.6.md §5](../../plan/phase-4.6.md)

## review.md 결정사항 참조

- **결정 2 (B)**: timeline_* → weight_* GA4 namespace 마이그레이션 **4주 grace 신/구 병행 발사**. weight_* 즉시 발사 시작 + timeline_* deprecated 유지, 2026-07-06 cleanup PR 머지로 timeline_* 발사 중단
- **결정 3 (C 변형)**: /weight 상단 클릭 가능한 텍스트 1줄. 클릭 시 linked 있으면 /checklist?slug=… 진입 — `axis_cross_link(from=weight, to=checklist)` 발사
- ga4.md §7 변경 정책 운영: weight_* primary, timeline_* deprecated grace 4주 명시 의무

## 1. 측정 목표

- **핵심 질문 1**: /weight 가 임신 주차 컨텍스트를 흡수한 뒤에도 체중 입력·그래프 행동을 가리지 않고 보강하는가? → `weight_week_view` 발사 후 같은 세션에서 `weight_log_submit` 도달률 비교 (흡수 전 baseline vs 흡수 후)
- **핵심 질문 2**: /weight 상단 컨텍스트 1줄이 /checklist 진입 동선으로 작동하는가? → `axis_cross_link(from=weight, to=checklist, source=week_context)` 발사 + /checklist?slug=… 도달률
- **의사결정 연결**:
  - Phase 5 (산후 휴면 후) 의 T1=A 결정 회고 — weight_week_view 가 timeline_week_view baseline 대비 회귀 방문 hook 으로 작동하는지 cohort retention 비교
  - /weight 상단 컨텍스트 클릭률이 1% 미만이면 옵션 C 오리지널(정적 1줄)로 다운그레이드 후보

## 2. 이벤트 명세

### 2.1 신규 이벤트 (즉시 발사 시작)

| event_name | 트리거 | 파라미터 (이름 / 타입 / 예시) | 비고 |
|---|---|---|---|
| `weight_week_view` | /weight 진입 시 dueDate 입력 사용자에게 1회 (페이지뷰 후 컨텍스트 1줄 hydrated) | `week` / int / `24`, `context_item_id` / string / `week_24_glucose_test`, `has_linked_checklist` / boolean / `true` | week 4~40 범위 밖이면 발사 X. context_item_id 는 weight_context_items.json 의 id 그대로 |
| `axis_cross_link` | /weight 상단 컨텍스트 1줄 클릭 시 linked_checklist_ids 있는 항목 → /checklist 이동 | `from` / string / `weight`, `to` / string / `checklist`, `source` / string / `week_context`, `slug` / string / `hospital-bag`, `week` / int / `32` | phase-4.6 §5.2 신규 이벤트. axis 간 흐름 측정 |
| `week_context_expand` | /weight 상단 컨텍스트 1줄 클릭 시 linked 없는 항목 → 같은 화면 description expand | `week` / int / `5`, `context_item_id` / string / `week_05_early_habits`, `expand_state` / string / `open`\|`close` | 토글 양방향 발사 |

### 2.2 deprecated 4주 grace (2026-07-06 cleanup 까지 발사 유지)

| event_name | 처리 | grace 종료일 |
|---|---|---|
| `timeline_week_view` | 발사 유지, ga4.md §7 에 deprecated 마킹 | 2026-07-06 |
| `timeline_item_open` (있다면) | 발사 유지, deprecated 마킹 | 2026-07-06 |
| `timeline_*` 전체 | scripts/weekly-report/ga4-queries.ts 의 dimension 에서 secondary 로 분리, weight_* primary 단일화 | 2026-07-06 cleanup PR 머지 시점에 spec 삭제 |

> double-count 회피 룰: 4주 grace 기간 funnel·cohort 분석 시 **weight_* 만 카운트**. timeline_* 는 발사율 0 으로 떨어지는지 모니터링용으로만 사용. weekly report (`scripts/weekly-report/`) 의 dimension 갱신 시 weight_* primary 명시.

### 2.3 PII 체크 (marketer §3.1)

- `week` 은 int 4~40 — cohort 단위로 PII 아님 (marketer §3.1 "주차 단위 코호트(`current_pregnancy_week: 24`) 는 OK" 인용)
- `context_item_id` 는 `week_NN_xxx` 형태로 슬러그·주차 정보만 — PII 아님
- `slug` (linked_checklist) 는 `hospital-bag` 같은 정적 enum — PII 아님
- 출산예정일 자체는 어떤 파라미터에도 박지 않음 (designer §3 N3 + marketer §3.1)
- raw 입력값(메모·검색어 등) 발사 0건

## 3. 유저 프로퍼티 변경

- 신규 user_property: **없음**
- 수정 user_property: **없음**
- 기존 `current_pregnancy_week` 가 이미 매 방문 갱신 + `cohort_join_week` 첫 방문 고정 (marketer §5.2). weight_week_view 의 `week` 파라미터는 이벤트별 발사 시점 주차 — `current_pregnancy_week` 는 user_property 라 별도 갱신 안 함

## 4. 깔때기·세그먼트

### 4.1 깔때기

```
session_start
  → page_view (/weight)
    → weight_week_view (dueDate 입력 사용자)
      → 분기 A: axis_cross_link(to=checklist)   ← 컨텍스트 1줄 클릭 (linked)
      → 분기 B: week_context_expand              ← 컨텍스트 1줄 클릭 (linked 없음)
      → 분기 C: weight_log_submit                ← 체중 입력 (행동 도구)
```

- **핵심 측정 1**: 분기 C 도달률 — /weight 흡수 후에도 핵심 행동(체중 입력) 가리지 않는지 (marketer §3.4 수익화·컨텍스트 핵심 행동 침범 금지 룰의 변형)
- **핵심 측정 2**: 분기 A 발사율 — 컨텍스트 1줄의 동선 가치 (옵션 C 변형 결정의 사후 검증)

### 4.2 세그먼트

- 임신 주차 cohort (`current_pregnancy_week` 기반): 1~12 / 13~27 / 28~40 / 출산 후 4분할
- /weight 진입 방식: redirect (구 /timeline 진입) vs BottomNav vs 홈 4축 카드
- linked_checklist 보유 여부: weight_context_items 36개 중 17개만 linked 보유 — 분기 A vs B 분포가 17:19 baseline

## 5. 대시보드 항목

### 5.1 GA4 표준 보고서

- Funnel exploration: 위 §4.1 깔때기 그대로
- Cohort exploration: `cohort_join_week` 4분할 × `weight_week_view` 발사율 (Phase 5 회고용)

### 5.2 Weekly report ([scripts/weekly-report/](../../../scripts/weekly-report/) 갱신)

- `ga4-queries.ts`: timeline_* 이벤트 dimension 을 secondary 로 분리, weight_* primary 단일화. cohort 쿼리 `INVALID_ARGUMENT` 3주 연속 실패 이슈(phase-4.6 §D-Data) 는 별도 fix (Phase 5)
- `prompt-shared.ts`: 4주 grace 기간 LLM 해석 시 "timeline_* 는 deprecated, weight_* 로 해석" 안내문 추가
- `types.ts`: weight_week_view·axis_cross_link·week_context_expand 신규 타입 추가
- 첫 8주 raw JSON 같이 저장 (marketer §5.5 회귀 안전장치)

### 5.3 DebugView 검증 (PR 의무, marketer §5.1)

- weight_week_view 4종 캡처 (주차 4·12·24·40)
- axis_cross_link 1종 캡처 (linked 있는 항목 클릭)
- week_context_expand 2종 캡처 (open · close 토글)
- timeline_week_view dual-fire 1종 캡처 (4주 grace 기간 동시 발사 확인)

## 6. 운영 가이드 갱신 (cleanup PR 전까지)

- [docs/marketing/ga4.md](../../marketing/ga4.md) §3.D 트래커 섹션에서 `timeline_*` → "deprecated 4주 grace (~2026-07-06)" 마킹. weight_* 신규 등재
- ga4.md §7 변경 정책에 본 마이그레이션 사례 추가: "namespace cutover 는 dual-fire 4주 후 cleanup PR. primary 이벤트만 funnel 카운트"
- [docs/plan/phase-4.5.md §1.5](../../plan/phase-4.5.md) GA4 카탈로그도 동기 갱신

## 7. cleanup PR (별도, 2026-07-06)

본 phase 의 spec 범위 밖이지만 명세는 여기에 박음:

- timeline_* 발사 코드 제거 (src/components/weight/ 안 dual-fire 부분)
- ga4.md timeline_* spec 행 삭제
- weekly-report dimension 의 timeline_* secondary 제거
- 머지 후 DebugView 에서 timeline_* 0건 발사 확인 (E2E `axis-funnel.spec.ts` (phase-4.6 §8.3 순서 4 신규) 의 deprecated 이벤트 0건 발사 assertion 동기)
