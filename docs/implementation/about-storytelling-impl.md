# About 페이지 → "만든 사람" 스토리텔링 Implementation

## 완료 조건 충족 여부
| 조건 | 상태 | 비고 |
|------|------|------|
| 타이틀 "만든 사람"으로 변경 | ✅ 완료 | metadata 포함 변경 |
| "왜 만들었나" 스토리 섹션 | ✅ 완료 | bg-[#FFF4D4]/10 카드로 강조 |
| 만든이 주차 자동 계산 (CREATOR_DUE_DATE 기반) | ✅ 완료 | CreatorWeekBadge Client Component |
| 데이터 안내 / 의료 면책 섹션 유지 | ✅ 완료 | 기존 내용 그대로 유지 |
| "의견 보내기" → /contact 링크 | ✅ 완료 | Button 스타일 링크 |

## 생성/수정 파일 목록
### 신규 생성
- `src/app/about/CreatorWeekBadge.tsx` — Client Component. BRAND_PHASE에 따라 임신 주차/출산 D+일/육아 개월차 자동 표시

### 수정
- `src/lib/constants.ts` — `CREATOR_DUE_DATE` 상수 추가 ("2026-08-15")
- `src/app/about/page.tsx` — 전면 리뉴얼: 스토리텔링 구조, metadata 업데이트, Server Component 유지

## 주요 결정 사항
- **Server/Client 분리**: metadata export를 유지하기 위해 page.tsx는 Server Component로 유지하고, 주차 계산(Date 사용)만 CreatorWeekBadge Client Component로 분리
- **BRAND_PHASE 분기**: pregnancy/postpartum/parenting 3가지 phase를 CreatorWeekBadge에서 처리하여 phase 전환 시 코드 변경 불필요

## 가정 사항
- `CREATOR_DUE_DATE`를 "2026-08-15"로 설정 (PRD에 "2026-08-XX"로 명시)
- "앞으로의 계획" 섹션의 문구는 PRD의 텍스트 그대로 사용

## 미구현 항목
- 없음
