# Phase 2.5 Step 9: 유저 체류시간 및 기능 활용도 증대 (달성감/게이미피케이션)

## 요약

체크리스트 완료 시 달성감을 주기 위해 두 가지 게이미피케이션 요소를 추가했습니다:
1. **주차 완료 축하**: 해당 주차의 모든 체크리스트 완료 시 ✅ 아이콘 + 완료 메시지
2. **마일스톤 배지**: 전체 진행률 25%/50%/75%/100% 달성 시 축하 메시지

## 구현 범위

| 항목 | 구현 여부 | 비고 |
|------|-----------|------|
| 9-1A. 주차 완료 축하 | ✅ 구현 | |
| 9-1B. 마일스톤 배지 | ✅ 구현 | |
| 9-2. 검색 기능 | ❌ 미구현 | PRD에서 선택사항으로 분류 |
| 9-3. 영상 콘텐츠 연결 | ❌ 미구현 | PRD에서 Phase 3으로 이관 |

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/timeline/TimelineAccordionCard.tsx` | `isWeekComplete` 계산, ✅ 아이콘, 완료 메시지 |
| `src/components/timeline/TimelineContainer.tsx` | 진행률 카드에 마일스톤 메시지 (25%/50%/75%/100%) |
| `e2e/gamification.spec.ts` | E2E 테스트 5개 케이스 |

## 구현 상세

### 9-1A. 주차 완료 축하

```tsx
// TimelineAccordionCard.tsx
const isWeekComplete = hasChecklist && checkedCount === totalCount;

// 헤더에 ✅ 아이콘
{isWeekComplete && <span aria-label="완료">✅</span>}

// 체크리스트 요약을 완료 메시지로 교체
{isWeekComplete
  ? <span>{item.week}주차 할일을 모두 완료했어요!</span>
  : <span>체크리스트 {totalCount}개 ...</span>}
```

### 9-1B. 마일스톤 배지

```tsx
// TimelineContainer.tsx — 진행률 카드
{progress.percent >= 25 && (
  <p>
    {progress.percent >= 100 ? "완벽한 준비 완료! 🎊"
     : progress.percent >= 75 ? "거의 다 왔어요!"
     : progress.percent >= 50 ? "절반 완료!"
     : "순조로운 출발!"}
  </p>
)}
```

| 진행률 | 메시지 |
|--------|--------|
| 25%+ | 순조로운 출발! |
| 50%+ | 절반 완료! |
| 75%+ | 거의 다 왔어요! |
| 100% | 완벽한 준비 완료! 🎊 |

## 코드 리뷰

Critical/Warning 이슈 없음. 리팩토링 불필요.

## E2E 테스트

파일: `e2e/gamification.spec.ts`

| 테스트 | 설명 |
|--------|------|
| ✅ 아이콘 표시 | Week 6 체크리스트 전부 완료 시 ✅ + 메시지 |
| ✅ 해제 복원 | 체크 해제 시 ✅과 메시지 사라짐 |
| 마일스톤 초기 | 0% 상태에서 메시지 미표시 |
| 마일스톤 표시 | 25%+ 달성 시 메시지 표시 |
| 모바일 반응형 | 375px에서 ✅과 메시지 정상 표시 |

결과: **5/5 통과** (5.7s)
