# Pregnancy Timeline Dataset

Version: 0.1  
Target reader: Codex / AI coding agent / content engineer

이 문서는 출산 예정일 기반 개인화 타임라인의 초기 seed dataset을 정의한다.
의료 진단보다 **준비 행동 유도**에 초점을 둔다.

---

## 1. Data Shape

```ts
export type TimelineItem = {
  id: string;
  week: number;
  title: string;
  description: string;
  type: 'prep' | 'shopping' | 'admin' | 'education' | 'wellbeing';
  priority: 'high' | 'medium' | 'low';
  linked_checklist_ids?: string[];
  seo_slug?: string;
};
```

---

## 2. Seed Dataset JSON

```json
[
  {
    "id": "week_04_confirm_pregnancy",
    "week": 4,
    "title": "임신 확인 후 기본 일정 잡기",
    "description": "진료 일정과 초기 체크 포인트를 정리한다.",
    "type": "admin",
    "priority": "high",
    "linked_checklist_ids": [],
    "seo_slug": "week-4"
  },
  {
    "id": "week_05_rest_routine",
    "week": 5,
    "title": "휴식과 생활 패턴 점검",
    "description": "업무, 이동, 수면 루틴을 무리 없는 형태로 조정한다.",
    "type": "wellbeing",
    "priority": "medium",
    "linked_checklist_ids": [],
    "seo_slug": "week-5"
  },
  {
    "id": "week_06_track_basic_info",
    "week": 6,
    "title": "예정일과 진료 정보를 한곳에 정리",
    "description": "출산 예정일, 병원, 주요 문의처를 저장해 둔다.",
    "type": "admin",
    "priority": "high",
    "linked_checklist_ids": [],
    "seo_slug": "week-6"
  },
  {
    "id": "week_08_hospital_selection",
    "week": 8,
    "title": "분만 병원 후보 검토 시작",
    "description": "거리, 비용, 응급 대응, 야간 이동 편의성을 비교한다.",
    "type": "prep",
    "priority": "high",
    "linked_checklist_ids": ["confirm_hospital_schedule", "choose_delivery_hospital"],
    "seo_slug": "week-8"
  },
  {
    "id": "week_10_begin_checklist",
    "week": 10,
    "title": "출산 준비 체크리스트 시작",
    "description": "아직 이르다고 미루기 쉽다. 지금부터 큰 항목을 보며 구조를 잡는다.",
    "type": "prep",
    "priority": "medium",
    "linked_checklist_ids": [],
    "seo_slug": "week-10"
  },
  {
    "id": "week_12_postpartum_research",
    "week": 12,
    "title": "산후조리원/산후 지원 조사 시작",
    "description": "후보를 너무 늦게 보기 시작하면 선택지가 줄어든다.",
    "type": "admin",
    "priority": "high",
    "linked_checklist_ids": ["research_postpartum_center"],
    "seo_slug": "week-12"
  },
  {
    "id": "week_14_insurance_review",
    "week": 14,
    "title": "보험 구조와 필요성 검토",
    "description": "필수라고 단정하지 말고 보장 구조와 가계 부담을 먼저 본다.",
    "type": "admin",
    "priority": "medium",
    "linked_checklist_ids": ["review_insurance_options"],
    "seo_slug": "week-14"
  },
  {
    "id": "week_16_babyfair_window",
    "week": 16,
    "title": "베이비페어 방문 시기 검토",
    "description": "대형 품목을 비교하기 좋은 시기다. 다만 충동구매는 피한다.",
    "type": "shopping",
    "priority": "medium",
    "linked_checklist_ids": ["plan_babyfair_visit"],
    "seo_slug": "week-16"
  },
  {
    "id": "week_18_benefits_scan",
    "week": 18,
    "title": "지자체 지원 제도 훑기",
    "description": "거주지 기준으로 받을 수 있는 출산·육아 지원을 한번 훑어본다.",
    "type": "admin",
    "priority": "medium",
    "linked_checklist_ids": ["check_maternity_benefits"],
    "seo_slug": "week-18"
  },
  {
    "id": "week_20_stroller_compare",
    "week": 20,
    "title": "유모차/이동 장비 비교 시작",
    "description": "차량 적재, 엘리베이터, 도로 환경을 기준으로 비교한다.",
    "type": "shopping",
    "priority": "medium",
    "linked_checklist_ids": ["compare_stroller_options"],
    "seo_slug": "week-20"
  },
  {
    "id": "week_22_partner_alignment",
    "week": 22,
    "title": "남편/보호자 역할 분담 초안 만들기",
    "description": "출산 직전에는 급해진다. 준비 담당을 미리 나누는 편이 낫다.",
    "type": "prep",
    "priority": "medium",
    "linked_checklist_ids": [],
    "seo_slug": "week-22"
  },
  {
    "id": "week_24_newborn_basics",
    "week": 24,
    "title": "신생아 기본 돌봄 콘텐츠 보기 시작",
    "description": "수유, 트림, 기저귀 교체, 재우기 등 기초를 미리 훑는다.",
    "type": "education",
    "priority": "medium",
    "linked_checklist_ids": ["learn_newborn_basics"],
    "seo_slug": "week-24"
  },
  {
    "id": "week_26_choose_carseat",
    "week": 26,
    "title": "카시트 후보를 실제로 좁히기",
    "description": "장착 난이도와 차량 호환성을 확인한다.",
    "type": "shopping",
    "priority": "high",
    "linked_checklist_ids": ["choose_carseat"],
    "seo_slug": "week-26"
  },
  {
    "id": "week_28_buy_basics",
    "week": 28,
    "title": "기본 신생아 용품 준비 시작",
    "description": "젖병, 손수건, 배냇옷, 속싸개 등 기본 품목부터 채운다.",
    "type": "shopping",
    "priority": "high",
    "linked_checklist_ids": ["buy_basic_bottles", "buy_swaddles", "prepare_newborn_clothes"],
    "seo_slug": "week-28"
  },
  {
    "id": "week_30_prepare_home",
    "week": 30,
    "title": "집안 동선과 수면 공간 정리",
    "description": "아기를 안고 이동하는 상황을 기준으로 집 구조를 다시 본다.",
    "type": "prep",
    "priority": "high",
    "linked_checklist_ids": ["prepare_safe_sleep_space", "clean_home_paths", "set_up_laundry_routine"],
    "seo_slug": "week-30"
  },
  {
    "id": "week_31_weight_chart_check",
    "week": 31,
    "title": "체중 기록 흐름 점검",
    "description": "숫자 자체보다 변화 추세를 확인하는 용도로 기록을 이어간다.",
    "type": "wellbeing",
    "priority": "low",
    "linked_checklist_ids": [],
    "seo_slug": "week-31"
  },
  {
    "id": "week_32_hospital_bag_start",
    "week": 32,
    "title": "입원 가방 준비 시작",
    "description": "산모용, 아기용, 보호자용 물품을 나눠 정리한다.",
    "type": "prep",
    "priority": "high",
    "linked_checklist_ids": ["pack_hospital_bag_mother", "pack_hospital_bag_baby"],
    "seo_slug": "week-32"
  },
  {
    "id": "week_33_document_check",
    "week": 33,
    "title": "입원 및 신분 관련 서류 재확인",
    "description": "막판에 찾느라 꼬이지 않도록 필요한 서류와 병원 안내를 다시 확인한다.",
    "type": "admin",
    "priority": "high",
    "linked_checklist_ids": ["collect_required_documents"],
    "seo_slug": "week-33"
  },
  {
    "id": "week_34_labor_signs",
    "week": 34,
    "title": "입원 신호와 병원 이동 기준 확인",
    "description": "언제 병원에 연락하고 언제 이동할지 기준을 정리한다.",
    "type": "education",
    "priority": "high",
    "linked_checklist_ids": ["learn_labor_signs", "plan_hospital_route", "backup_bag_for_partner"],
    "seo_slug": "week-34"
  },
  {
    "id": "week_35_install_carseat",
    "week": 35,
    "title": "카시트 설치 완료",
    "description": "출산 직전에는 체력과 일정이 흔들릴 수 있으니 미리 끝낸다.",
    "type": "prep",
    "priority": "high",
    "linked_checklist_ids": ["install_carseat"],
    "seo_slug": "week-35"
  },
  {
    "id": "week_36_finalize_bag",
    "week": 36,
    "title": "출산 가방 최종 점검",
    "description": "충전기, 신분증, 퇴원복, 카시트까지 한번에 점검한다.",
    "type": "prep",
    "priority": "high",
    "linked_checklist_ids": ["save_emergency_contacts"],
    "seo_slug": "week-36"
  },
  {
    "id": "week_37_postpartum_support",
    "week": 37,
    "title": "퇴원 후 1주 계획 확정",
    "description": "식사, 장보기, 방문 일정, 휴식 지원 계획을 확정한다.",
    "type": "prep",
    "priority": "high",
    "linked_checklist_ids": ["prepare_postpartum_meals", "prepare_postpartum_supplies", "set_rest_support_plan"],
    "seo_slug": "week-37"
  },
  {
    "id": "week_38_ready_now",
    "week": 38,
    "title": "언제 출발해도 되는 상태 만들기",
    "description": "짐 위치, 이동 경로, 보호자 연락체계를 확정한다.",
    "type": "prep",
    "priority": "high",
    "linked_checklist_ids": [],
    "seo_slug": "week-38"
  },
  {
    "id": "week_39_keep_schedule_light",
    "week": 39,
    "title": "일정을 가볍게 유지",
    "description": "먼 이동과 과한 약속을 줄이고 바로 대응 가능한 상태를 유지한다.",
    "type": "wellbeing",
    "priority": "medium",
    "linked_checklist_ids": [],
    "seo_slug": "week-39"
  },
  {
    "id": "week_40_delivery_ready",
    "week": 40,
    "title": "출산 대응 준비 완료",
    "description": "필수 준비는 이미 끝났어야 한다. 남은 것은 침착하게 실행하는 것이다.",
    "type": "prep",
    "priority": "high",
    "linked_checklist_ids": [],
    "seo_slug": "week-40"
  }
]
```

---

## 3. Timeline Rendering Rules

### Highlight logic
- `week === currentWeek`: `이번 주`
- `week === currentWeek + 1`: `다음 주`
- `week < currentWeek`: `지난 일정`
- `week > currentWeek + 1`: `예정`

### Merge logic
타임라인은 다음 소스를 병합할 수 있다.
1. canonical timeline items
2. canonical checklist items converted to reminders
3. babyfair_events matched by date window
4. user custom events

---

## 4. Personalization Logic

### Example pseudo code
```ts
function getVisibleTimelineItems(currentWeek: number, items: TimelineItem[]) {
  return items.filter(item => item.week >= Math.max(4, currentWeek - 2) && item.week <= Math.min(40, currentWeek + 6));
}
```

### Suggested sections
- 지금 할 일
- 곧 준비할 일
- 지나간 일정

---

## 5. Notes

- 모든 주차 항목을 채울 필요는 없다. 오히려 비어 있는 주차가 있어야 피로도가 낮다.
- 타임라인 설명 문구는 단정형 의료 조언보다 준비 행동 중심 문구로 유지한다.
- later phase에서는 `duedate`, `parity`, `delivery_type_preference`, `region`에 따라 가중치 조정 가능.
