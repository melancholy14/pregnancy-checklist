# checklist-recommendation-semantics 측정 설계

> 작성일: 2026-05-08
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- 결정 6 — `recommended_item_view` + `recommended_item_check` 신규 이벤트 + 기존 `checklist_check` 에 `note_type` 파라미터 추가만 (시그니처 보존). user_property `current_pregnancy_week` 없으면 추천 이벤트 미발사.
- 결정 1 — `recommendedWeek: 0` = 미정/주차 무관. 매칭 대상 아님 — 추천 이벤트 미발사 대상.
- 결정 3 — phase-4.5 동시 도입.

## 1. 측정 목표

- **핵심 질문 1**: P3 로 흐르기 시작한 주차 데이터가 본질 도구(체크리스트) 행동을 실제로 강화하는가? — 지표: `recommended_item_check / recommended_item_view` 전환율.
- **핵심 질문 2**: 노트의 `legal` 분기가 사용자 행동에 영향을 주는가 (예: legal 항목 체크 비율)? — 지표: `checklist_check.note_type` 분포에서 `legal` 비중 추이.
- **의사결정 연결**:
  - 추천 전환율이 baseline(주차 미입력자 일반 체크율) 대비 유의미한지 판단 → P2 부활 가치 검증, 향후 §2.6 UX #2(D-day 컨텍스트 라벨) 진행 우선순위 결정.
  - `legal` 분포가 0에 가까우면 P7 분류 자체의 가치 재평가 → phase-5 `note_type` 필드 도입 여부 재고.

## 2. 이벤트 명세

| event_name | 트리거 | 파라미터 (이름 / 타입 / 예시) | 비고 |
|---|---|---|---|
| `recommended_item_view` | 메인 체크리스트 진입 후 매칭된 추천 항목이 1개 이상 노출. 페이지 뷰 당 1회 (item별 아님). | `count` / number / `3`<br>`week` / number / `24`<br>`slug` / string / `"main"` | `current_pregnancy_week` user_property 없으면 미발사. 신규 3종 슬러그(hospital_bag/partner_prep/pregnancy_prep)에서는 매칭 0이라 자연 미발사. |
| `recommended_item_check` | 추천 항목(`isHighlighted === true` 시점)을 체크 토글로 ON 전환. | `item_id` / string / `"item_001"`<br>`category` / string / `"hospital"`<br>`week` / number / `24`<br>`slug` / string / `"main"` | 기존 `checklist_check` 와 **함께** 발사 (대체 아님). 추천 컨텍스트 추적용. 체크 OFF(체크 해제)에서는 미발사. |
| `checklist_check` (변경) | 기존 트리거 그대로 ([ChecklistPage.tsx:136](../../../src/components/checklist/ChecklistPage.tsx#L136)). | 기존: `category`, `item_id`, `checked`, `slug`<br>**추가**: `note_type` / string / `"legal"` \| `"action"` \| `"context"` \| `(not set)` | 시그니처 보존(락인 §3.6). phase-4.5 에서는 `legal` 만 패턴 매칭으로 식별, 다른 분류는 `(not set)` — phase-5 도입 시 자동 채워짐. |

### 명명 규칙 정합성 (marketer §5.1)

- snake_case + object_action: `recommended_item_view`, `recommended_item_check` ✓
- 같은 의미 파라미터는 같은 키: `week` / `slug` / `item_id` / `category` 모두 기존 카탈로그와 일치 ([docs/marketing/ga4.md](../../marketing/ga4.md), [docs/plan/phase-4.5.md §1.6](../../plan/phase-4.5.md))
- PII 0건: `note` 본문, `title` 등 자유 텍스트 파라미터 미발사 ✓

## 3. 유저 프로퍼티 변경

- **신규/수정 user_property: 없음.**
- 의존(읽기): `current_pregnancy_week` ([PageviewTracker.tsx:18](../../../src/components/analytics/PageviewTracker.tsx#L18) 에서 set 됨, P3 산출물). 본 기능은 이 값을 **소비만** 함.

## 4. 깔때기·세그먼트

### 깔때기 — 추천 가치 검증

1. `page_view` (메인 체크리스트 진입) — 분모
2. `recommended_item_view` (추천 매칭 1개 이상 노출) — 매칭 발생률
3. `recommended_item_check` (추천 항목 체크 ON) — 추천 → 행동 전환율 (핵심 지표)

### 세그먼트

- **임신 주차 코호트** (`current_pregnancy_week` 버킷): 초기(~13)·중기(14~27)·후기(28~) — 추천 매칭 빈도가 주차에 따라 다를 수 있음. 후기일수록 매칭 항목 수 ↑.
- **주차 입력 여부** (`due_date_set` user_property): 입력자만 분모로 정의. 미입력자는 별도 baseline.
- **체크리스트 슬러그** (`slug`): 메인 vs 신규 3종. 신규 3종은 매칭 0 가설 검증.
- **`note_type` 분포** (`checklist_check.note_type`): `legal` vs `(not set)` 비율 추이.

## 5. 대시보드 항목

- **GA4 탐색 보고서**:
  - 깔때기: page_view → recommended_item_view → recommended_item_check, 세그먼트 = 주차 코호트
  - 세그먼트 비교: 주차 입력자 일반 체크율 vs 추천 항목 체크율 — 차이가 baseline 대비 유의미한지
  - `note_type` 분포 카드: `legal` / `(not set)` 비율 추이 (4주 이동평균, marketer §5.6 정합)
- **자동 주간 리포트** ([phase-4.5.md §1.9.6](../../plan/phase-4.5.md)):
  - "추천 전환율" 지표 추가 (W+1, W+2, W+4 추이)
  - "법령 노트 노출 항목 분포" — `legal` 패턴 매칭 적중률 운영자 검수용
- **DebugView 검증 항목** (PR 머지 전 필수, marketer §5.1):
  - `recommended_item_view` — 메인 체크리스트 진입 시 1회 발사, `count > 0`
  - `recommended_item_check` — 추천 항목 체크 시 발사, OFF 토글에서 미발사
  - `checklist_check.note_type` — `legal` 패턴 항목에서 `"legal"`, 그 외 `(not set)`

## 6. 락인·grace period 정책 (§3.6 정합)

- 신규 이벤트 2개: 추가 후 **삭제 사실상 금지**. 의미 변경 시 신/구 병행 4주.
- `checklist_check.note_type` 파라미터: 추가만 — 기존 보고서 영향 0. phase-5 에서 `note_type` 필드 도입 시 텍스트 패턴 식별 → 필드 직접 사용으로 전환되지만 **이벤트명·파라미터 키는 동일**, 값 출처만 바뀜 (락인 위반 아님).
