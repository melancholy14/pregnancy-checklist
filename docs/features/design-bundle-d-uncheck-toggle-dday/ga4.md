# design-bundle-d-uncheck-toggle-dday 측정 설계

> 작성일: 2026-05-10
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- **항목 2-B**: D-day 측정 = 신규 `upcoming_item_view` + `upcoming_item_check` 페어 이벤트. param: `item_id` (string), `weeks_ahead` (integer = `recommendedWeek - currentWeek`). 기존 `recommended_item_view`/`recommended_item_check` 변경 0.
- **페어 2 합의**: `checklist_filter` = `filter_type = "uncheck_only"` 단일 enum + `value = "on" | "off"` string. 토글 변경 시 1회 발사. 페이지뷰 시 자동 발사 X.
- **페어 2 합의**: PII 0 — `item_id`는 hash 아닌 정적 enum string, `weeks_ahead`는 integer.
- **페어 2 합의**: 토글 영속성 = 세션 한정 (zustand persist X). user_property 변경 0.

## 1. 측정 목표

- **핵심 질문**:
  - (1) "미체크만 보기" 토글이 사용자의 체크 행동을 가속하나? — 토글 사용 세션의 평균 체크 항목 수 vs 미사용 세션 비교.
  - (2) D-day 라벨("N주차에 챙기기")이 사용자의 사전 체크 행동을 유발하나? — `upcoming_item_check` 발생률(view → check 전환율).
  - (3) 사용자가 미체크 항목을 어느 시점에 다시 방문하나? — `checklist_filter` (value="on") 발사 시점의 임신 주차·세션 분포.
- **의사결정 연결**:
  - 토글 사용 빈도가 낮으면 → 발견성 문제 (위치·시각 어텐션 검토). 향후 묶음에서 위치 변경 또는 onboarding hint 추가 고려.
  - `upcoming_item_check` 전환율이 낮으면 → 미래 권장 라벨의 행동 영향 약함 → D-day 라벨 카피·시각 위계 재검토. 전환율이 높으면 → 사전 체크 패턴 발견, 다른 영역(timeline)에도 D-day 라벨 확장 검토.
  - 토글 발사 임신 주차 분포에서 특정 주차(예: 32주차+, 출산 임박)에 집중되면 → 그 시점 사용자 부담 가설 검증, 출산 직전 마이크로 카피·정렬 우선순위 변경 고려.

## 2. 이벤트 명세

| event_name | 트리거 | 파라미터 (이름 / 타입 / 예시) | 비고 |
|---|---|---|---|
| `checklist_filter` | "미체크만 보기" 토글 변경 시 1회 (onChange 핸들러) | `filter_type` / string / `"uncheck_only"` (단일 enum)<br>`value` / string / `"on"` 또는 `"off"` | 페이지뷰 시 자동 발사 X. 향후 다른 필터 추가 시 `filter_type` enum 확장만 허용 — 기존 값 변경·삭제 X (§3.6 측정 락인 정합). |
| `upcoming_item_view` | ChecklistItemRow에서 D-day 라벨이 노출되는 케이스만, 마운트 시 1회 (`useEffect`) | `item_id` / string / `"hospital_bag_001"`<br>`weeks_ahead` / integer / `10` | `weeks_ahead = item.recommendedWeek - currentWeek`. 노출 안 되면 발사 0. PII 0 (item_id는 정적 카탈로그 enum). |
| `upcoming_item_check` | 사용자가 D-day 라벨이 노출된 항목을 체크할 때 (체크 토글 핸들러에서 `showUpcomingLabel`이 true였던 분기) | `item_id` / string / `"hospital_bag_001"`<br>`weeks_ahead` / integer / `10` | view→check 전환율 분석용. 페어 이벤트로 view 발사 후 같은 세션 내 check 발사. |

### 변경 정책 (§3.6 락인 회피)

- **신규 추가만**: 본 라운드는 `checklist_filter`·`upcoming_item_view`·`upcoming_item_check` 3건 신규. 기존 `recommended_item_view`/`recommended_item_check` (P2 이벤트) 변경 0.
- **enum 확장 정책**: `filter_type`은 추후 다른 필터(예: 카테고리·우선순위) 추가 시 enum 확장 가능 — 기존 `"uncheck_only"` 값 변경·삭제 X.
- **삭제 사실상 금지**: 본 3건 이벤트가 1주 이상 데이터 누적 후 삭제 필요시 신/구 병행 발사 4주 grace period 의무 (§3.6 정합).
- **phase-4.5.md §1.5 카탈로그 갱신**: 본 spec 머지 시 phase-4.5.md §1.5 이벤트 카탈로그 표(C. 핵심 기능 — 체크리스트, E. 신호)에 3건 행 추가.

## 3. 유저 프로퍼티 변경

- **신규/수정 user_property**: 없음.
- 기존 user_property (`due_date_set`, `current_pregnancy_week`, `cohort_join_week`, P3·P4 산출) 그대로 활용. `upcoming_item_view`/`check`의 `weeks_ahead` 분석 시 `current_pregnancy_week` 코호트로 분리 가능 — 코호트별 D-day 라벨 행동 영향 차이 측정.

## 4. 깔때기·세그먼트

### 깔때기 1 — 토글 사용 → 체크 가속

```
1. ChecklistPage 진입 (page_view, page_path = /checklist/<slug>)
2. checklist_filter (filter_type=uncheck_only, value=on) 발사
3. 같은 세션 내 checklist_check 발사 N회
4. 세션 종료 또는 ChecklistPage 이탈
```

비교 세그먼트: 단계 2 발사 세션 vs 미발사 세션의 단계 3 평균 발사 수.

### 깔때기 2 — D-day 라벨 view → check 전환

```
1. upcoming_item_view 발사 (item_id, weeks_ahead)
2. 같은 세션 내 같은 item_id 의 upcoming_item_check 발사
```

전환율 = (item_id 별 check 수) / (item_id 별 view 수). weeks_ahead 분포로 추가 세분화 (1~4주, 5~12주, 13주+).

### 세그먼트

- **임신 주차 코호트**: `current_pregnancy_week` user_property 기준 (예: 1~12, 13~28, 29~40). 코호트별 토글 사용률·D-day 라벨 view→check 전환율 비교.
- **due_date_set = false 사용자**: P3 미입력 사용자 — D-day 라벨 비표시이므로 `upcoming_item_view` 발사 0. 이 코호트는 **측정 사각지대** — 측정 가설에 박지 않음(spec §4 예외와 일치). 토글은 사용 가능.
- **첫 방문 vs 재방문**: 토글 영속성 세션 한정이라 재방문 시 토글 off 초기 — 재방문 사용자가 토글을 다시 켜는 비율로 "토글이 의도된 행동인지" 가설 검증.

## 5. 대시보드 항목

GA4 탐색 보고서(또는 Looker Studio §1.9 자동 주간 리포트와 통합)에 추가:

1. **토글 사용률**: 일별/주별 `checklist_filter` (value=on) 발사 수 / 일별/주별 ChecklistPage `page_view` 수.
2. **토글 사용 세션의 체크 가속**: 깔때기 1 — 토글 발사 세션 vs 미발사 세션의 평균 `checklist_check` 수 비교 (테이블).
3. **D-day 라벨 view→check 전환율**: 깔때기 2 — `weeks_ahead` 분포(1~4주, 5~12주, 13주+)별 전환율 (시계열).
4. **임신 주차 코호트별 D-day 라벨 영향**: 산점도 (x=current_pregnancy_week, y=upcoming_item_check 발사 수, 색=weeks_ahead 구간).
5. **`item_id` 별 D-day check 수 TOP 10**: 어떤 항목이 미래 권장 라벨에 가장 잘 반응하는지 — 콘텐츠 매트릭스(P11) 우선순위 입력.

### Pattern C 자동 주간 리포트 통합 (§1.9.6 스키마)

- §1.9.6 마크다운 리포트 스키마에 다음 항목 추가 가능:
  - "## 2. 핵심 행동 도달률"에 `checklist_filter` (value=on) 사용률 1줄.
  - "## 6. 추천 액션"에 `weeks_ahead` 분포가 비정상으로 한쪽에 쏠릴 때(예: 모두 13주+) 라벨 노출 룰 재검토 권고.
- 본 라운드는 이벤트 정의만 박고, 자동 리포트 통합은 묶음 L·M(§1.9.7) 진행 시 추가.

## 6. PII·Consent 검증

- **PII 0 점검** (§3.1):
  - `checklist_filter`: `filter_type`·`value` 둘 다 enum string. PII 0.
  - `upcoming_item_view`/`upcoming_item_check`: `item_id` = 정적 카탈로그 enum (`weekly-checklist-item-001` 등 — `src/data/checklist_items.json` 키), `weeks_ahead` = integer. PII 0.
  - 출산예정일·체중·BMI 등 민감 데이터 어디에도 미포함.
- **Consent 게이팅** (§3.2): 본 묶음 이벤트 모두 [analytics.ts](src/lib/analytics.ts) `sendGAEvent` 헬퍼 사용 — 기존 consent 게이팅 통과. 별도 처리 불필요.
- **세션 한정 토글**: zustand persist X → localStorage에 토글 상태 저장 0 → consent 거부 사용자도 토글 사용 가능 (메모리만, 페이지 떠나면 초기화).
