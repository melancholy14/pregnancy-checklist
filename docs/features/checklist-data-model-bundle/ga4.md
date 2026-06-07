# checklist-data-model-bundle 측정 설계

> 작성일: 2026-06-05
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- **4.2 = A (편집 둘 다 허용)** — `custom_item_priority_set`·`custom_item_note_set` 신설 의무 (planner §7.6 측정 동반).
- **4.4 = A (묶음 도입)** — P5 인프라 동반 → `schema_migration_run` 신설 의무 (planner §7.6 — 인프라도 측정 동반).
- **4.5 = B (toast 알림)** — `schema_migration_failed` 신설 의무.
- **PII 보호 (marketer §3.1·N3)** — note 원문, 사용자 식별자, 자유 텍스트 raw는 파라미터 금지. priority enum 값과 boolean·count만 허용.

## 1. 측정 목표

- **핵심 질문**:
  1. 사용자가 custom 항목의 priority/note 편집을 실제로 사용하는가? (페어 ① 숨은 가정 검증 — "사용자가 priority/note 편집을 실제로 원한다")
  2. P5 schema migrate가 의도대로 작동하는가? failure rate가 0에 수렴하는가?
- **의사결정 연결**:
  - `custom_item_priority_set`·`custom_item_note_set` 발사율이 4주 기준 의미 있는 수치면 본 묶음 결정 가설 입증, 0에 가까우면 [docs/plan/phase-4.5.md §3.1 P1](../../plan/phase-4.5.md) 재오픈 후보 (designer 페어 ① "편집 가치 낮음" 주장 검증).
  - `schema_migration_failed` > 0이면 즉시 알람 — silent corruption 방지의 마지막 신호.

## 2. 이벤트 명세

### 신설 이벤트

| event_name | 트리거 | 파라미터 (이름 / 타입 / 예시) | 비고 |
|---|---|---|---|
| `custom_item_priority_set` | ChecklistItemRow 편집 모드에서 priority 변경 후 저장 (변경 있을 때만) | `item_id` (string, "user_1717543200_a3f"), `from_priority` (enum: 'high'\|'medium'\|'low', "medium"), `to_priority` (enum: 'high'\|'medium'\|'low', "high"), `slug` (string, "pregnancy-prep") | item_id는 사용자 추가 항목의 내부 ID. PII 아님. note 텍스트는 절대 동봉 X |
| `custom_item_note_set` | ChecklistItemRow 편집 모드에서 note 변경 후 저장 (변경 있을 때만) | `item_id` (string), `note_changed` (boolean, true), `note_length` (number, 42), `slug` (string) | **note 원문 절대 금지 (marketer N3)**. 변경 여부와 길이만. note_length는 사용 패턴 분석 (단문 vs 장문) 용 |
| `schema_migration_run` | zustand persist의 migrate 함수가 v_old→v_new 성공 실행 시 | `store_name` (enum: 'due_date'\|'checklist'\|'timeline'\|'weight', "checklist"), `from_version` (number, 0), `to_version` (number, 1) | 첫 방문 v0 사용자에게만 1회 발사. localStorage 빈 상태(신규 사용자)는 발사 X |
| `schema_migration_failed` | migrate가 모르는 버전 만나서 default fallback 실행 시 | `store_name` (enum), `persisted_version` (number, 999), `current_version` (number, 1) | 본 묶음 도입 후 0에 수렴해야 함. 4주 누적 > 0 이면 즉시 원인 조사 |

### 기존 이벤트 변경

| event_name | 변경 내용 | 비고 |
|---|---|---|
| `custom_item_add` | 파라미터에 `priority` (enum: 'high'\|'medium'\|'low', "medium") 추가 | ChecklistAddForm priority 셀렉터 도입과 동기. 기존 호출부는 default 'medium'으로 발사 — marketer §3.6 측정 락인 정책 정렬 (신규 파라미터는 추가만, 변경·삭제 X) |

### PII·민감도 점검 (marketer §3.1 / N3)

- ❌ note 원문 → 보내지 않음. `note_changed`·`note_length`만.
- ❌ 사용자 식별자(IP·이메일·이름) → 본 기능에 해당 사항 없음 (정적 사이트, 회원가입 없음).
- ❌ raw 검색어·자유 텍스트 → 없음.
- ✅ `item_id` — 사용자 localStorage 내부 ID. 다른 세션과 결합 시 식별 불가. PII 아님.
- ✅ priority enum (`high`·`medium`·`low`) — 분류값. PII 아님.

## 3. 유저 프로퍼티 변경

- **신규/수정 user_property**: **없음**.
- 본 묶음은 도구 기능 + 인프라 영역으로 사용자 코호트 분류·세그먼트 축에 새 차원을 더하지 않음. `current_pregnancy_week`·`cohort_join_week` 등 기존 user_properties는 그대로 활용.

## 4. 깔때기·세그먼트

### 깔때기

```
custom_item_add (기존)
  ↓ (사용자가 custom 항목 추가 후)
custom_item_check (기존)
  ↓ (사용자가 항목 체크)
custom_item_priority_set (신설) 또는 custom_item_note_set (신설)
  ↓ (편집 모드 진입 + 변경 + 저장)
custom_item_check (재발사) 또는 페이지 이탈
```

- **목적**: "추가만 하고 안 고치는 사용자" vs "추가 후 priority/note 편집까지 가는 사용자" 비율 측정. 후자의 비율이 의미 있으면 본 묶음의 가치 입증.
- **AdSense 영향 없음** — 본 기능은 도구 영역 내부 인터랙션. marketer §3.4 (수익화가 핵심 행동 침범 금지)와 무관.

### 세그먼트

- **임신 주차 코호트** — `current_pregnancy_week` user_property로 분류. priority/note 편집이 후기 주차(≥30주)에 집중되는지 (출산 가방·산후조리 등 본인 액션이 많아지는 시점) 또는 초기 주차에 분포하는지 관찰.
- **체크리스트 슬러그별** — `slug` 파라미터로 분류. `pregnancy-prep`·`hospital-bag`·`partner-prep` 등 어느 체크리스트에서 편집이 자주 발생하는지.
- **store_name별 migrate 추이** — `schema_migration_run` 의 `store_name` 분포. 4개 store 모두 골고루 발사돼야 정상 (사용자가 4개 store 모두 진입했다는 신호).

## 5. 대시보드 항목

GA4 또는 Looker Studio에 추가:

1. **편집 사용률 위젯** (북극성·보조 지표)
   - 메트릭: `custom_item_priority_set` 발사 수 / `custom_item_add` 발사 수 (4주 이동평균)
   - 임계값: ≥10% 이면 본 묶음 가치 입증, < 5% 이면 [phase-4.5.md §3.1 P1](../../plan/phase-4.5.md) 재오픈 후보.
2. **note 편집 패턴** (보조 지표)
   - 메트릭: `custom_item_note_set` 의 `note_length` p50/p90 분포
   - 의사결정: 장문(>200자) 비율이 높으면 P7 note_type 분류 재검토 트리거 (planner §7.5 본질 도구 가치 vs 향후 분리 룰).
3. **schema_migration_run 추이** (진단 지표)
   - 메트릭: 일별 `schema_migration_run` 발사 수. 본 묶음 배포 후 1주는 폭증 후 감소 (기존 사용자 1회 마이그레이션), 이후 신규 사용자만 발사.
4. **schema_migration_failed 알람** (진단 지표 — 임계 알람)
   - 메트릭: 일별 `schema_migration_failed` 발사 수
   - 임계값: > 0이면 즉시 슬랙 알람 또는 [주간 리포트 (docs/plan/phase-4.5.md §1.9)](../../plan/phase-4.5.md)에서 강조.
5. **임신 주차 × 편집 사용률 히트맵** (탐색 분석)
   - 차트: 주차(1~40) × `custom_item_priority_set` 발사율
   - 가설 검증: 후기 주차 집중 vs 균등 분포.

### DebugView 검증

- 본 묶음 PR 머지 직전 — 4개 신설 이벤트 모두 GA4 DebugView에서 발사 확인 (marketer §5.1 DebugView 캡처 의무).
- 캡처 첨부 위치: PR description 또는 [docs/marketing/ga4.md](../../marketing/ga4.md) 운영 레퍼런스 갱신.
