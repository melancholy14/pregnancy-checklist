# Phase 2.5 Step 8: 버그 수정 — 존재하지 않는 주차에 할일 추가 시 무반응

## 요약

체크리스트 항목을 타임라인에 기본 항목이 없는 주차(예: 1, 2, 3주)에 추가할 때 데이터는 저장되지만 UI에 표시되지 않는 버그를 수정했습니다. AlertDialog를 통해 사용자에게 피드백을 제공하고, 주차 자동 생성 옵션을 추가했습니다.

## 문제

1. 유저가 주차(1-40) + 제목 입력 → "추가하기" 클릭
2. 항목은 `useChecklistStore`에 `recommendedWeek: N`으로 저장됨
3. 타임라인에 기본 항목이 없는 주차에는 아코디언 카드가 없어 UI에 표시되지 않음
4. 유저에게 아무 피드백 없음 → **데이터 유실처럼 보임**

## 해결 방안

**알럿 표시 + 주차 자동 생성 유도** 방식 채택:

1. 체크리스트 추가 시 해당 주차에 타임라인 항목이 있는지 확인
2. 없으면 AlertDialog 표시: "N주차에 타임라인 항목이 없습니다. 주차를 추가하시겠어요?"
3. "주차 추가하고 할일 넣기" → 빈 타임라인 항목 자동 생성 + 체크리스트 추가
4. "취소" → 폼으로 복귀 (주차 변경 유도)

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/timeline/UnifiedAddForm.tsx` | `timelineItems` prop 추가, 주차 존재 여부 확인 로직, AlertDialog UI, `submitChecklist()` 통합 함수 |
| `src/components/timeline/TimelineContainer.tsx` | UnifiedAddForm에 `allTimelineItems` props 전달 |
| `e2e/checklist-week-bug.spec.ts` | E2E 테스트 6개 케이스 작성 |
| `src/content/articles/weekly-prep.md` | frontmatter 앞 HTML 코멘트 제거 (빌드 오류 수정) |

## 구현 상세

### 주차 존재 판별 로직

```tsx
const allTimelineWeeks = useMemo(
  () => new Set(timelineItems.map((item) => item.week)),
  [timelineItems]
);

if (itemType === "checklist" && !allTimelineWeeks.has(week)) {
  setShowWeekAlert(true);
  return;
}
```

### 자동 주차 생성

`submitChecklist(autoWeek: boolean)` 함수로 통합:
- `autoWeek=true`: 타임라인 항목 생성 후 체크리스트 추가
- `autoWeek=false`: 체크리스트만 추가

## 코드 리뷰 & 리팩토링

| 항목 | 분류 | 조치 |
|------|------|------|
| 체크리스트 생성 로직 중복 | Warning | `submitChecklist()` 단일 함수로 통합 |
| `allTimelineWeeks` 매 렌더 재생성 | Warning | `useMemo`로 최적화 |
| Fragment 들여쓰기 | Info | 정렬 수정 |

## E2E 테스트

파일: `e2e/checklist-week-bug.spec.ts`

| 테스트 | 설명 |
|--------|------|
| 정상 추가 | 존재하는 주차(4주)에 추가 시 AlertDialog 없이 바로 추가 |
| AlertDialog 표시 | 미존재 주차(1주)에 추가 시 AlertDialog 정상 표시 |
| 자동 주차 생성 | "주차 추가하고 할일 넣기" 클릭 시 주차+할일 동시 추가 |
| 취소 복귀 | "취소" 클릭 시 폼 상태 유지 |
| 타임라인 유형 무관 | 타임라인(일정) 추가 시 주차 확인 없이 바로 추가 |
| 모바일 반응형 | 375px에서 AlertDialog 정상 표시 및 접근 가능 |

결과: **6/6 통과** (7.6s)
