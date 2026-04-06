# Timeline Retention 코드 리뷰

## 리뷰 대상 파일
- `src/components/home/HomeContent.tsx`
- `src/components/timeline/TimelineContainer.tsx`

---

## Critical 이슈 (즉시 수정 완료)

없음

---

## Warning (수정 권장)

없음

---

## Suggestion (개선 아이디어)

### 1. HomeContent.tsx
- `thisWeekChecklist` useMemo에서 매번 `getChecklistByWeek()`를 호출하지만, 같은 결과를 `TimelineContainer`에서도 계산함. 향후 공통 훅으로 추출하면 중복 제거 가능.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 0건 |
| Suggestion | 1건 |
| 빌드 | 미실행 (Critical 없음) |
