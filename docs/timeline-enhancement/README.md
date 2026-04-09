# 타임라인 정보 구체화

> 작성일: 2026-04-09 | 작성자: Claude Code

## 개요

타임라인의 빈 주차(15개)를 채우고, 기존 description을 간결하게 정비하며,
카드 헤더에 type 배지(📦준비/🛒쇼핑/📋행정/📚교육/💚건강)를 추가하여
주차별 정보 밀도와 시각적 구분을 개선합니다.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 빈 주차 15개 항목 추가 (Week 5~33) | ✅ 완료 | 21개 → 36개 |
| 기존 description 정비 | ✅ 완료 | 핵심 1~2문장, 키워드 유지 |
| 타임라인 카드에 type 배지 표시 | ✅ 완료 | 아이콘 + 라벨 Badge |
| TIMELINE_TYPE_CONFIG 상수 추가 | ✅ 완료 | 5개 type 매핑 |

### 생성/수정 파일

- `src/data/timeline_items.json` — 15개 빈 주차 항목 추가, 기존 description 간결화
- `src/components/timeline/TimelineAccordionCard.tsx` — type 배지 UI 추가, TYPE_COLORS 로컬 상수 제거
- `src/lib/constants.ts` — `TIMELINE_TYPE_CONFIG` 상수 추가

### 주요 결정 사항

- **배지 위치**: 타이틀 왼쪽에 배치하여 type 즉시 인지
- **색상 단일 소스**: `TIMELINE_TYPE_CONFIG`로 통일 (week circle + 배지 모두 사용)
- **description 정비**: 체크리스트에 있는 상세 항목은 중복 나열하지 않음
- **이모지 접근성**: 배지 아이콘에 `aria-hidden="true"` 적용

### 가정 사항 및 미구현 항목

- 새 항목의 `linked_checklist_ids`는 빈 배열 (매핑은 별도 작업)
- 미구현 항목 없음

---

## 코드 리뷰 결과

### Warning (수정 완료)

1. **TYPE_COLORS와 TIMELINE_TYPE_CONFIG 색상 중복/불일치** — 로컬 `TYPE_COLORS` 제거, `TIMELINE_TYPE_CONFIG.color`로 통일

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 1건 발견, 1건 수정 완료 |
| Suggestion | 0건 |

---

## 리팩토링 내용

### 작업 목록

- `TYPE_COLORS` 로컬 상수 제거 → `TIMELINE_TYPE_CONFIG.color`로 week circle 색상 참조 통일

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 색상 소스 | TYPE_COLORS(로컬) + TIMELINE_TYPE_CONFIG(전역) 2곳 | TIMELINE_TYPE_CONFIG 1곳 |
| admin 색상 | circle #FFF4D4, 배지 #E0F0FF (불일치) | 모두 #E0F0FF |
| shopping 색상 | circle #FFE0CC, 배지 #FFF4D4 (불일치) | 모두 #FFF4D4 |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 8개 passed |
| Error/Validation | ✅ 1개 passed |
| 반응형 (Mobile 375px) | ✅ 2개 passed |
| **전체** | **11 passed / 0 failed** |

📊 상세 리포트: `playwright-report/index.html`
