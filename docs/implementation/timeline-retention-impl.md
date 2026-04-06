# Timeline Retention (타임라인 유도 강화 + 데이터 보존 가이드) Implementation

## 완료 조건 충족 여부
| 조건 | 상태 | 비고 |
|------|------|------|
| 홈 "이번 주 할 일" 카드에 현재 주차 + 미완료 수 + 체크 상태 미리보기 + 풀너비 CTA | ✅ 완료 | thisWeekChecklist 기반으로 체크리스트 렌더 |
| 타임라인 첫 체크 시 인라인 배너 1회 표시 | ✅ 완료 | checkedIds 0→1 전환 감지 + localStorage 플래그 |
| 재방문 유저 "돌아오셨군요! N개 체크하셨어요" 메시지 | ✅ 완료 | last-visit-date 비교, 당일 아닐 때만 표시 |

## 생성/수정 파일 목록
### 수정
- `src/components/home/HomeContent.tsx` — CTA 강화 (thisWeekChecklist + Checkbox 미리보기 + Button CTA), 재방문 유저 웰컴 메시지 (last-visit-date localStorage 기반)
- `src/components/timeline/TimelineContainer.tsx` — 첫 체크 인라인 배너 (checkedIds 0→1 감지, first-check-guide-shown 플래그)

## 주요 결정 사항
- **체크리스트 기반 CTA**: PRD 와이어프레임에서 체크 상태 미리보기를 요구하므로, 기존 TimelineItem 기반 → ChecklistItem 기반으로 변경. getChecklistByWeek 유틸 재사용.
- **Checkbox는 읽기 전용**: 홈에서 직접 체크하지 않고 타임라인으로 유도. `pointer-events-none` + `aria-hidden` 적용.
- **첫 체크 감지**: useRef로 이전 checkedIds.length 추적, 0→1 전환 시에만 배너 표시. useEffect 의존성으로 정확한 타이밍 보장.
- **재방문 판단**: `last-visit-date`를 ISO 날짜 문자열로 저장, 당일이 아닐 때만 메시지 표시. checklist-storage에서 직접 count 파싱.

## 가정 사항
- 재방문 메시지는 예정일이 입력된 유저에게만 표시 (hasDueDate 조건 안에 위치)
- 첫 체크 배너의 "확인" 버튼 클릭 시 배너 즉시 사라짐 (애니메이션 없음)
- 이번 주 할 일 카드는 최대 3개 항목만 미리보기 표시

## 미구현 항목
- 없음
