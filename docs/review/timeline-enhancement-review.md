# 타임라인 정보 구체화 코드 리뷰

## 리뷰 대상 파일
- `src/lib/constants.ts`
- `src/data/timeline_items.json`
- `src/components/timeline/TimelineAccordionCard.tsx`

---

## Critical 이슈 (즉시 수정 완료)

없음

---

## Warning (수정 권장)

### 1. TimelineAccordionCard.tsx — TYPE_COLORS와 TIMELINE_TYPE_CONFIG 색상 중복/불일치

- **위치**: `src/components/timeline/TimelineAccordionCard.tsx:18-24` vs `src/lib/constants.ts` TIMELINE_TYPE_CONFIG
- **문제**: Week circle은 로컬 `TYPE_COLORS`를, 배지는 `TIMELINE_TYPE_CONFIG`를 사용. `admin` type에서 circle(`#FFF4D4` 노란색)과 배지(`#E0F0FF` 파란색)가 불일치. `shopping`도 circle(`#FFE0CC`)과 배지(`#FFF4D4`)가 다름.
- **권장 수정**: 로컬 `TYPE_COLORS`를 제거하고 `TIMELINE_TYPE_CONFIG`의 color를 week circle에도 사용하여 단일 소스로 통일.

---

## Suggestion (개선 아이디어)

없음

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 1건 |
| Suggestion | 0건 |
| 빌드 | 미실행 (Critical 없음) |
