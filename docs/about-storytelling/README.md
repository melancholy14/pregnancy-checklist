# About 페이지 → "만든 사람" 스토리텔링

> 작성일: 2026-04-09 | 작성자: Claude Code

## 개요

About 페이지를 기존 "서비스 소개"(기능 나열 + 면책 공지) 구조에서
"만든 사람" 스토리텔링 구조로 전면 리뉴얼합니다.
왜 만들었는지, 현재 만든이의 임신 주차, 앞으로의 계획을 전달하여
서비스에 개인적 맥락과 신뢰감을 부여합니다.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 타이틀 "만든 사람"으로 변경 | ✅ 완료 | metadata 포함 변경 |
| "왜 만들었나" 스토리 섹션 | ✅ 완료 | bg-[#FFF4D4]/10 카드로 강조 |
| 만든이 주차 자동 계산 (CREATOR_DUE_DATE 기반) | ✅ 완료 | CreatorWeekBadge Client Component |
| 데이터 안내 / 의료 면책 섹션 유지 | ✅ 완료 | 기존 내용 그대로 유지 |
| "의견 보내기" → /contact 링크 | ✅ 완료 | Button 스타일 링크 |

### 생성/수정 파일

#### 신규 생성

- `src/app/about/CreatorWeekBadge.tsx` — Client Component. BRAND_PHASE에 따라 임신 주차/출산 D+일/육아 개월차 자동 표시

#### 수정

- `src/lib/constants.ts` — `CREATOR_DUE_DATE` 상수 추가 ("2026-08-15")
- `src/app/about/page.tsx` — 전면 리뉴얼: 스토리텔링 구조, metadata 업데이트, Server Component 유지

### 주요 결정 사항

- **Server/Client 분리**: metadata export를 유지하기 위해 page.tsx는 Server Component로 유지하고, 주차 계산(Date 사용)만 CreatorWeekBadge Client Component로 분리
- **BRAND_PHASE 분기**: pregnancy/postpartum/parenting 3가지 phase를 CreatorWeekBadge에서 처리하여 phase 전환 시 코드 변경 불필요

### 가정 사항 및 미구현 항목

- `CREATOR_DUE_DATE`를 "2026-08-15"로 설정 (PRD에 "2026-08-XX"로 명시)
- "앞으로의 계획" 섹션의 문구는 PRD의 텍스트 그대로 사용
- 미구현 항목 없음

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

없음

### Warning (수정 권장)

없음

### Suggestion (개선 완료/보류)

1. **이모지 접근성** — ✅ 수정 완료. 🤰, 👶 이모지에 `aria-hidden="true"` 적용
2. **postpartum 출산일 상수 분리** — 보류. 현재 pregnancy phase이므로 phase 전환 시 `CREATOR_BIRTH_DATE` 추가 예정

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 0건 |
| Suggestion | 2건 (1건 수정, 1건 보류) |

---

## 리팩토링 내용

Warning 항목 0건, 추가 판단 항목 0건으로 리팩토링 없이 통과.
코드가 이미 충분히 정리된 상태 (전체 파일 150줄 미만, 단일 책임 원칙 준수).

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 8개 passed |
| Error/Validation | ✅ 2개 passed |
| 반응형 (Mobile 375px) | ✅ 2개 passed |
| **전체** | **12 passed / 0 failed** |

📊 상세 리포트: `playwright-report/index.html`

---

## 누락된 문서

- `docs/refactor/about-storytelling-refactor.md` — 리팩토링 항목이 없어 문서 미생성
