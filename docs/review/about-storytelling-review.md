# About 페이지 → "만든 사람" 스토리텔링 코드 리뷰

## 리뷰 대상 파일
- `src/lib/constants.ts`
- `src/app/about/page.tsx`
- `src/app/about/CreatorWeekBadge.tsx`

---

## Critical 이슈 (즉시 수정 완료)

없음

---

## Warning (수정 권장)

없음

---

## Suggestion (개선 아이디어)

### 1. ~~CreatorWeekBadge.tsx — 이모지 접근성~~ ✅ 수정 완료
- **위치**: `src/app/about/CreatorWeekBadge.tsx:13, 26, 38`
- 🤰, 👶 이모지에 `<span aria-hidden="true">` 적용 완료.

### 2. CreatorWeekBadge.tsx — postpartum phase에서 출산일 상수 분리 (보류)
- **위치**: `src/app/about/CreatorWeekBadge.tsx:18-28`
- 현재 `BRAND_PHASE === "pregnancy"`이므로 지금 적용 불필요. phase 전환 시 `CREATOR_BIRTH_DATE` 상수 별도 추가 예정.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 0건 |
| Suggestion | 2건 |
| 빌드 | 미실행 (Critical 없음) |
