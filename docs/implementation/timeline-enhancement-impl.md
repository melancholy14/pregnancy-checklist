# 타임라인 정보 구체화 Implementation

## 완료 조건 충족 여부
| 조건 | 상태 | 비고 |
|------|------|------|
| 빈 주차 15개 항목 추가 (Week 5~33) | ✅ 완료 | 기존 21개 → 36개 (Week 4~40 커버리지 95%+) |
| 기존 description 정비 (핵심 1문장 + 체크리스트 연동) | ✅ 완료 | 긴 문단을 간결하게 정리, 키워드 유지 |
| 타임라인 카드에 type 배지 표시 | ✅ 완료 | 아이콘 + 라벨 Badge 컴포넌트 |
| TIMELINE_TYPE_CONFIG 상수 추가 | ✅ 완료 | 5개 type별 아이콘/라벨/색상 매핑 |

## 생성/수정 파일 목록
### 수정
- `src/data/timeline_items.json` — 15개 빈 주차 항목 추가, 기존 description 간결화
- `src/components/timeline/TimelineAccordionCard.tsx` — type 배지 UI 추가 (Badge + TIMELINE_TYPE_CONFIG)
- `src/lib/constants.ts` — `TIMELINE_TYPE_CONFIG` 상수 추가

## 주요 결정 사항
- **배지 위치**: 타이틀 왼쪽에 배치하여 카드 헤더에서 type을 즉시 인지 가능
- **배지 색상**: `TIMELINE_TYPE_CONFIG.color + 40` (25% opacity)로 주 circle 색상과 톤 통일
- **description 정비 기준**: 체크리스트에 이미 있는 상세 항목은 중복 나열하지 않고, 핵심 1~2문장으로 정리
- **새 항목 id 패턴**: 기존 `week_NN_slug` 패턴 유지
- **이모지 접근성**: type 배지 아이콘에 `aria-hidden="true"` 적용

## 가정 사항
- 새 항목의 `linked_checklist_ids`는 빈 배열 — 체크리스트 매핑은 별도 작업
- 새 항목의 priority는 PRD 미명시 항목에 대해 "medium"으로 설정

## 미구현 항목
- 없음
