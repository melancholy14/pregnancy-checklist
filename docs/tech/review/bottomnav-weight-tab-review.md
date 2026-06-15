# BottomNav 5탭 코드 리뷰

> 출처 plan: [bottomnav-weight-tab-plan.md](../../plan/bottomnav-weight-tab-plan.md)
> impl: [bottomnav-weight-tab-impl.md](../implementation/bottomnav-weight-tab-impl.md)
> 작성일: 2026-06-02

## 리뷰 대상 파일
- `src/components/layout/BottomNav.tsx`
- `e2e/navigation.spec.ts`

---

## Critical 이슈 (즉시 수정 완료)

없음.

---

## Warning (수정 권장)

### 1. BottomNav.tsx — 활성 탭에 `aria-current` 미설정
- **위치**: `src/components/layout/BottomNav.tsx:58-67`
- **문제**: 활성 탭은 시각적으로만(`bg-pastel-pink/40` + strokeWidth) 구분되고, 스크린 리더는 "현재 페이지"임을 인식할 수 없음. WAI-ARIA 1.1 `aria-current="page"` 미적용.
- **권장 수정**: `<Link>`에 `aria-current={isActive ? "page" : undefined}` 추가. 보조 기술이 활성 탭을 명시적으로 알림.

### 2. BottomNav.tsx — `<nav>`에 라벨 없음
- **위치**: `src/components/layout/BottomNav.tsx:52`
- **문제**: 페이지에 nav가 둘 이상일 가능성(상단·하단·breadcrumb 등) 시 스크린 리더가 "navigation, navigation"으로만 읽혀 구분 불가. 본 nav가 BottomNav 임을 명시할 수단 없음.
- **권장 수정**: `<nav aria-label="주요 메뉴">` 또는 `aria-label="하단 메뉴"` 추가.

---

## Suggestion (개선 아이디어)

### 1. BottomNav.tsx — `navItems` 상수 모듈 스코프 격리
- 현재 `navItems`는 컴포넌트 내부에서 매 렌더마다 새 배열로 생성됨. 자식 컴포넌트에 props로 전달되지 않아 리렌더 비용 자체는 없지만, 의미상 정적 데이터이므로 모듈 스코프 상수로 빼는 게 더 명확.
- 단, ROI는 낮음. 5개 항목 정적 데이터라 메모리·CPU 영향 무시 수준. "정리" 이상의 가치는 없음.

### 2. navigation.spec.ts — 375px 라벨 줄바꿈 가드의 임계값
- `expect(box?.height ?? 0).toBeLessThan(22)` — `text-[11px]` line-height 기본값 약 16-18px이라 22px이 안전한 임계. 다만 globals.css에서 line-height 토큰 변경 시 임계 재산정 필요. 회귀 가드로는 충분하나 변경에 부서지기 쉬움.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 2건 (접근성) |
| Suggestion | 2건 |
| 빌드 | 미실행 (Critical 없음) |
