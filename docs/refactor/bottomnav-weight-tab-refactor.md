# BottomNav 5탭 리팩토링

> 출처 review: [bottomnav-weight-tab-review.md](../review/bottomnav-weight-tab-review.md)
> 작성일: 2026-06-02

## 리팩토링한 파일 목록
- `src/components/layout/BottomNav.tsx`

---

## 작업별 내용

### 1. BottomNav.tsx — `<nav>`에 `aria-label="주요 메뉴"` 추가
- **출처**: Warning #2 (접근성)
- **무엇을**: `<nav>` 엘리먼트에 `aria-label="주요 메뉴"` 속성 추가
- **왜**: 페이지에 nav가 둘 이상 존재할 수 있는 환경(향후 상단 nav·breadcrumb 등)에서 스크린 리더가 본 nav를 "주요 메뉴"로 식별 가능. 보조 기술의 페이지 구조 인지 보강.

### 2. BottomNav.tsx — 활성 탭 `<Link>`에 `aria-current="page"` 추가
- **출처**: Warning #1 (접근성)
- **무엇을**: `isActive` 시 `aria-current="page"`, 비활성 시 `undefined` 부여
- **왜**: 시각 표시(`bg-pastel-pink/40`)만으로는 스크린 리더가 활성 탭을 인식 못 함. WAI-ARIA 1.1 `aria-current="page"`로 명시적 알림. e2e의 `bg-pastel-pink/40` 클래스 단언과 별개 채널로 활성 상태 의미론 보장.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 1개 | 1개 |
| 줄 수 | 82줄 | 86줄 |
| 동작 변경 | 없음 — 시각·라우팅 무변경 | — |
| 접근성 속성 | 0건 | 2건 (`aria-label`, `aria-current`) |

## 빌드 결과
성공 (1회 시도)
