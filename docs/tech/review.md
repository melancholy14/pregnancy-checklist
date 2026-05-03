# 리뷰 — 리팩토링 미완료 항목

> 코드 리뷰에서 식별되었지만 의도적/시간상의 이유로 리팩토링되지 않은 항목.
> **2026-05-03**: 모든 잔불 항목을 [phase-4.5/plan.md §4](../phase-4.5/plan.md) 개발 개선 섹션으로 이전. 이 문서는 인덱스 역할만.

---

## 현재 살아있는 잔불 위치

| 출처 (review·refactor 문서) | 이전된 위치 |
|------|------------|
| `info-tab-integration` Warning #3 (searchParams 중복) | [phase-4.5/plan.md §4 D-Mn3](../phase-4.5/plan.md) |
| `info-tab-integration` Warning #4 (`as VideoItem[]` 단언) | [phase-4.5/plan.md §4 D-Mn2](../phase-4.5/plan.md) |
| `phase-4-step-3-related-content` Suggestion #1~3 | [phase-4.5/plan.md §4 D-Mn4, D-Mn18, D-Mn19](../phase-4.5/plan.md) |
| `phase-4-step-4-share` Suggestion #1~3 | [phase-4.5/plan.md §4 D-Mn5~D-Mn7](../phase-4.5/plan.md) |
| `phase-4-step-5-crosslinks` Suggestion #1~5 | [phase-4.5/plan.md §4 D-Mn8~D-Mn11, D-Mn20](../phase-4.5/plan.md) |
| `phase-4-step-1-checklist-hub` Suggestion #1~6 | [phase-4.5/plan.md §4 D-Mn12~D-Mn17](../phase-4.5/plan.md) |
| 미사용 shadcn ui 30종 | [phase-4.5/plan.md §4 D-Mn1](../phase-4.5/plan.md) |

원본 리뷰 문서는 [docs/review/](../review/), 리팩토링 결과는 [docs/refactor/](../refactor/).

---

## 새 리뷰 잔불이 생기면

1. 코드 리뷰 결과는 `docs/review/<feature>-review.md`에 기록.
2. 즉시 리팩토링하지 않은 항목은 진행 중인 phase plan(예: phase-4.5 또는 phase-5)의 개발 섹션에 작업 묶음으로 등록.
3. 이 문서엔 "어디로 옮겼는지" 한 줄만 추가.
4. 처리되면 행 삭제.

이렇게 운영하는 이유:
- review.md가 작업 백로그 역할을 겸하면 phase plan과 중복되어 정합성 깨짐.
- phase plan은 일정·우선순위·작업 묶음을 함께 관리하므로 단일 진실로 두기 좋음.
- review 결과 자체(어떤 위반을 발견했는지)는 review 폴더에 그대로 남아 회귀 분석 가능.
