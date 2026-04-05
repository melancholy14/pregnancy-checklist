# 대시보드 피드백 배너 + 베이비페어 외부 링크 팝업

> 작성일: 2026-04-03 | 작성자: Claude Code

## 개요

Phase 1.5 기획 보완 2차로 추가된 두 기능:
1. **대시보드 피드백 배너** — 구글 폼 링크를 통한 사용자 피드백 수집
2. **베이비페어 외부 링크 팝업** — 카드 클릭 시 공식 홈페이지 새 탭 이동

---

## 구현 내용

### 1. 대시보드 피드백 배너

| 항목 | 내용 |
|------|------|
| 위치 | `src/app/page.tsx` 대시보드 최하단 |
| 조건 | `NEXT_PUBLIC_FEEDBACK_FORM_URL` 환경변수가 설정된 경우에만 노출 |
| 동작 | `target="_blank"` + `rel="noopener noreferrer"` (새 탭) |
| 비활성화 | 환경변수를 비우면 배너 미노출 (재빌드 필요) |

### 2. 베이비페어 외부 링크 팝업

| 항목 | 내용 |
|------|------|
| 위치 | `src/components/babyfair/BabyfairCard.tsx` |
| 트리거 | 카드 전체 영역 클릭 (마우스 + 키보드 Enter/Space) |
| 팝업 | AlertDialog — 타이틀: 행사명, 설명: "공식 홈페이지로 이동합니다" |
| 확인 시 | `window.open(official_url, '_blank', 'noopener,noreferrer')` |
| 팝업 차단 시 | 토스트 메시지로 안내 |
| URL 미존재 시 | 클릭 비활성 + cursor-pointer 제거 |

---

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/app/page.tsx` | 피드백 배너 섹션 추가 |
| `src/components/babyfair/BabyfairCard.tsx` | AlertDialog 팝업 + 접근성(role, tabIndex, onKeyDown) + 팝업 차단 토스트 |
| `src/components/babyfair/BabyfairContainer.tsx` | 도시 필터에 `role="group"` + `aria-label` 추가 |
| `.env.local` | `NEXT_PUBLIC_FEEDBACK_FORM_URL` 환경변수 추가 |
| `playwright.config.ts` | basePath 심볼릭 링크로 hydration 문제 해결 |
| `docs/phase-1.5/plan.md` | In scope, UI Spec 9/10, 완료 조건 #19~#20 추가 |
| `docs/phase-1.5/README.md` | 완료 조건 테이블 #19~#20 추가 |

---

## 코드 리뷰 결과

| 구분 | 건수 | 상태 |
|------|------|------|
| Critical | 0건 | — |
| Warning | 3건 | 모두 리팩토링에서 해결 |

### Warning 해결 내역

1. **접근성** — BabyfairCard에 `role="button"`, `tabIndex`, `onKeyDown`, `aria-label` 추가
2. **환경변수 주의사항** — static export 특성상 재빌드 필요 (PRD 문서에 명시)
3. **팝업 차단 처리** — `window.open` 반환값 체크 + sonner 토스트 안내

---

## E2E 테스트 결과

### 신규 테스트 (5개)

| 테스트 | 파일 | 결과 |
|--------|------|------|
| 피드백 배너 링크 target="_blank" 확인 | `home.spec.ts` | ✅ passed |
| 행사 카드 클릭 → 팝업 표시 | `baby-fair.spec.ts` | ✅ passed |
| 팝업 취소 → 팝업 닫힘 | `baby-fair.spec.ts` | ✅ passed |
| 팝업 이동 → 새 탭 열림 | `baby-fair.spec.ts` | ✅ passed |
| 팝업 타이틀에 행사명 표시 | `baby-fair.spec.ts` | ✅ passed |

### 전체 스위트

| 항목 | 결과 |
|------|------|
| 전체 테스트 | **76 passed / 0 failed** |
| 실행 시간 | 41.4s |

### 기존 테스트 수정

| 파일 | 수정 내용 | 사유 |
|------|----------|------|
| `navigation.spec.ts` | URL 매칭을 정규식으로 변경 | basePath 호환 |
| `privacy-terms.spec.ts` | URL 매칭을 정규식으로 변경 | basePath 호환 |
| `home.spec.ts` | URL 매칭을 정규식으로 변경 | basePath 호환 |
| `baby-fair.spec.ts` | 필터 버튼을 `role="group"` 스코프로 변경 | 카드 `role="button"` 추가로 인한 선택자 충돌 해결 |
