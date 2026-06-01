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

## 8. Addendum: 흡수 후 UX gap 보강 (2026-06-01)

> 추가 작성일: 2026-06-01
> 관련: [spec.md §6](./spec.md), [design.md §7](./design.md), [review.md §7](./review.md)
> 본 Addendum 은 `/weight` 내부 "전체 주차 보기" expand 도입에 따른 신규·기존 이벤트 갱신을 정의

### 8.1 측정 목표 (추가)

- **핵심 질문 3**: 흡수 후 squash 된 `weight_context_items.json` 36개 콘텐츠가 "전체 주차 보기" expand 동선으로 노출되었을 때 실제 사용되는가? → `week_context_browse_all_toggle(state=open)` 발사율 + 펼침 후 `axis_cross_link(source="browse_all")` 또는 `week_context_expand(source="browse_all")` 발사율
- **핵심 질문 4**: `/checklist` 허브 카드 카피 정정이 도착 페이지 신뢰 회복으로 작동하는가? → `/checklist` → `/weight` (`axis_enter(weight)`) 진입 후 `weight_week_view` 도달률 + 카드 변경 전후 비교
- **의사결정 연결**:
  - 전체 보기 발사율 < 5% 시 닫힌 default → 열린 default 로 전환 검토 (sun­set 후보 아님 — 콘텐츠 보존 의무)
  - 전체 보기 안 클릭률 (browse_all source) 이 current_week source 의 1/10 미만이면 트라이메스터 그룹화 효과 재검토

### 8.2 신규 이벤트 (즉시 발사 시작 — 본 Addendum 머지 시점)

| event_name | 트리거 | 파라미터 (이름 / 타입 / 예시) | 비고 |
|---|---|---|---|
| `week_context_browse_all_toggle` | `/weight` 의 "전체 주차 보기" 토글 버튼 클릭 | `state` / string / `open`\|`close`, `current_week` / int / `24` (dueDate 미입력 시 `0`) | open/close 양방향 발사. 같은 세션 다중 토글 모두 발사 |

### 8.3 기존 이벤트 파라미터 확장

| event_name | 추가 파라미터 | 값 |
|---|---|---|
| `axis_cross_link` | `source` (기존) | `"week_context"` (WeekContextRow 직진) → `"current_week"` 또는 `"browse_all"` 로 분리 |
| `week_context_expand` | `source` (신규) | `"current_week"` (WeekContextRow expand) \| `"browse_all"` (전체 보기 안 mini row expand) |

- **호환성 / marketer §3.6 grace 면제 사유**: 기존 `axis_cross_link source="week_context"` 발사도 본 Addendum 머지 후 즉시 `"current_week"` 로 교체 — 4주 grace 없음. marketer §3.6 "변경은 신/구 병행 발사 4주 grace" 룰의 면제 사유 명시:
  1. **baseline 데이터 양 미미**: 흡수 머지 (2026-06-01) ~ 본 Addendum 머지 (≈ 2026-06-01 ~ 06-03) 간 옛 source 발사 데이터 약 1~3일치. cohort 비교 baseline 으로 의미 있는 양 아님 (marketer §3.6 의 "과거 데이터 단절 = 의사결정 능력의 영구 손실" 의도는 cohort 수개월 baseline 보호 — 본 케이스는 무관)
  2. **분기 식별자 vs namespace cutover 구분**: `source` 는 단일 이벤트 내 분기 라벨 (이벤트 자체 namespace 는 `axis_cross_link` 그대로 유지). namespace cutover (`timeline_*` → `weight_*` §2.2) 와 다른 결정 축. namespace 는 4주 grace, source 라벨은 single primary 단일화가 정합
  3. **double-count 위험 0**: dual-fire 시 같은 클릭에서 `source="week_context"` 와 `"current_week"` 두 발사 → funnel 보고서에서 두 분기로 카운트되어 분모 왜곡. namespace dual-fire (이벤트가 다름) 는 보고서 룰로 회피 가능하지만 같은 이벤트의 source dual-fire 는 룰로 회피 어려움
- **dimension 갱신**: `scripts/weekly-report/ga4-queries.ts` 에서 `axis_cross_link.source` 값 enum 갱신 (`week_context` → `current_week`·`browse_all` 2종). 옛 `week_context` source 발사분은 GA4 raw export 에서 `current_week` 로 사후 매핑 (운영자 해석 룰: weekly-report `prompt-shared.ts` 에 명시)

### 8.4 PII 체크 (추가)

- `current_week` 은 int 4~40 또는 0 (dueDate 미입력) — PII 아님
- `state` 은 enum `open`\|`close` — PII 아님
- `source` enum 도 정적 — PII 아님

### 8.5 깔때기 갱신

```
session_start
  → page_view (/weight)
    → weight_week_view (dueDate 입력 사용자)
      → 분기 A1: axis_cross_link(source="current_week", to=checklist)   ← WeekContextRow (현재 주차) linked 클릭
      → 분기 A2: week_context_expand(source="current_week")              ← WeekContextRow (현재 주차) linked 없음 클릭
      → 분기 D: week_context_browse_all_toggle(state="open")             ← 전체 주차 보기 토글
        → 분기 D-A1: axis_cross_link(source="browse_all", to=checklist) ← 전체 보기 안 linked mini row 클릭
        → 분기 D-A2: week_context_expand(source="browse_all")            ← 전체 보기 안 linked 없음 mini row 클릭
      → 분기 C: weight_log_submit                                        ← 체중 입력 (행동 도구)
```

- 새 분기 D 가 추가되어 깔때기가 한 단계 깊어짐
- 분기 C (체중 입력) 도달률은 분기 A·D 발사 여부와 무관하게 측정 — 흡수 의도 (행동 도구 단일 정체성) 유지 검증
- 분기 D 발사율 cohort 비교: `/checklist` 진입 (카드 클릭) 사용자 vs BottomNav 직접 진입 vs 홈 4축 카드 진입

### 8.6 세그먼트 갱신

- `/weight` 진입 방식 세그먼트 (기존):
  - redirect (구 `/timeline` 진입)
  - BottomNav
  - 홈 4축 카드
  - **신규** — `/checklist` 카드 ("주차별 가이드 & 체중" 카드 카피 정정 후 전용 세그먼트로 추적). `axis_enter(from=checklist, to=weight)` 발사 (기존 이벤트 활용)

### 8.7 대시보드 항목 갱신

- Funnel exploration §8.5 그대로 GA4 에 박음
- `week_context_browse_all_toggle` open/close 비율: 펼침 후 닫음 비율 (사용자가 펼치고 바로 닫으면 콘텐츠 부적합 signal)
- `axis_cross_link.source` breakdown: `current_week` vs `browse_all` 비율 (전체 보기 동선 가치 측정)

### 8.8 DebugView 검증 (PR 의무, 추가)

- `week_context_browse_all_toggle` 2종 캡처 (open, close)
- `axis_cross_link(source="browse_all")` 1종 캡처 (전체 보기 안 linked row 클릭)
- `week_context_expand(source="browse_all")` 1종 캡처 (전체 보기 안 linked 없음 row 클릭)
- 합계 4종 추가 캡처 (기존 §5.3 의 4종 + 본 Addendum 4종 = 총 8종)

### 8.9 운영 가이드 갱신

- [docs/marketing/ga4.md](../../marketing/ga4.md) §3 트래커 섹션:
  - `week_context_browse_all_toggle` 신규 등재
  - `axis_cross_link.source` 값 enum 갱신
  - `week_context_expand.source` 신규 파라미터 등재
- [docs/plan/phase-4.5.md §1.5](../../plan/phase-4.5.md) GA4 카탈로그 동기 갱신
- weekly-report `prompt-shared.ts` 에 `browse_all` source 해석 안내 ("전체 주차 보기 안 클릭 — 콘텐츠 미리보기 의도")
