# bottomnav-weight-tab

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-06-02

<!-- STEP:impl -->
## 구현

> 출처 plan: [bottomnav-weight-tab-plan.md](../../plan/bottomnav-weight-tab-plan.md)
> 작성일: 2026-06-02

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| BottomNav가 정확히 5개 탭을 `홈 / 체크리스트 / 체중 / 베이비페어 / 정보` 순서로 노출 | ✅ 완료 | navItems 배열 순서 그대로 |
| "체중" 탭은 Scale 아이콘 + `/weight` path + prefix match | ✅ 완료 | lucide-react `Scale` 추가 |
| "정보" 탭은 `/info` `alsoMatchPrefixes` 보존 | ✅ 완료 | 기존 값 유지 |
| 활성 상태는 기존 pink CTA(`bg-pastel-pink/40`) 컨벤션 유지 | ✅ 완료 | isItemActive 로직 그대로 |
| `navigation.spec.ts`가 5탭 노출·이동 검증, "영상" 잔존 가드 삭제 | ✅ 완료 | 라벨 배열 단언 + 5경로 이동 + 활성 시각 |
| `/weight` 진입 시 체중 탭 active 시각 전환 | ✅ 완료 | 신규 3번째 테스트로 검증 |

### 생성/수정 파일 목록

#### 수정
- [src/components/layout/BottomNav.tsx](../../../src/components/layout/BottomNav.tsx)
  - lucide-react import에 `Scale` 추가
  - navItems에 `{ path: "/weight", icon: Scale, label: "체중", match: "prefix" }` 추가
  - 배열 순서를 `홈 → 체크리스트 → 체중 → 베이비페어 → 정보`로 재정렬
- [e2e/navigation.spec.ts](../../../e2e/navigation.spec.ts)
  - "4개 네비게이션 항목" → "5개 네비게이션 항목이 순서대로 보인다"로 재작성, 라벨 배열 단언으로 순서까지 검증
  - "영상" 0건 가드 삭제 (V1=A로 의미 잃음)
  - 이동 테스트에 체중·베이비페어 클릭 단언 추가 (4 → 5경로)
  - `/weight` 진입 시 체중 탭 active(`bg-pastel-pink/40`) 시각 검증 테스트 신규 추가

### 주요 결정 사항

- **3번째 테스트 신규 추가** (`/weight` 활성화 검증): AC 6번 "/weight 진입 시 체중 탭 active 전환"을 명시적으로 가드. plan에는 테스트 2개로 적었지만 AC 충족 가드로 1개 추가가 더 정직 — 활성 시각이 회귀할 경우 design-bundle-h spec과 별개로 navigation 책임 범위에서 잡힘.
- **라벨 순서 검증 방식**: `getByText`로 각각 visible만 확인하면 순서 변경 회귀를 못 잡으므로 `allTextContents()`로 배열 단언. plan §4.1 명시 순서를 강제 가드.

### 가정 사항

- 5탭 모바일 375px 폭 수용은 e2e 단언 X, 운영자 시각 점검 위임 (plan 가정 그대로).
- 활성 시각 컨벤션(pink CTA)은 DESIGN.md L67 그대로 — 5번째 탭이라고 별색 분리하지 않음.

### 미구현 항목

- §5 GA4 `axis_enter`/`axis_cross_link` 5탭 funnel 이벤트 — 후속 작업
- 다른 e2e spec(`ga4-events`, `phase-4-step-1-checklist-hub` 등)의 `/weight` 진입 동선 갱신 — 별도 회귀 라운드
- HomeContent.tsx 카드 구조 정합 — H1=B로 §3 폐기됨

---

<!-- STEP:review -->
## 코드 리뷰

> 출처 plan: [bottomnav-weight-tab-plan.md](../../plan/bottomnav-weight-tab-plan.md)
> impl: [bottomnav-weight-tab-impl.md](#구현)
> 작성일: 2026-06-02

### 리뷰 대상 파일
- `src/components/layout/BottomNav.tsx`
- `e2e/navigation.spec.ts`

---

### Critical 이슈 (즉시 수정 완료)

없음.

---

### Warning (수정 권장)

#### 1. BottomNav.tsx — 활성 탭에 `aria-current` 미설정
- **위치**: `src/components/layout/BottomNav.tsx:58-67`
- **문제**: 활성 탭은 시각적으로만(`bg-pastel-pink/40` + strokeWidth) 구분되고, 스크린 리더는 "현재 페이지"임을 인식할 수 없음. WAI-ARIA 1.1 `aria-current="page"` 미적용.
- **권장 수정**: `<Link>`에 `aria-current={isActive ? "page" : undefined}` 추가. 보조 기술이 활성 탭을 명시적으로 알림.

#### 2. BottomNav.tsx — `<nav>`에 라벨 없음
- **위치**: `src/components/layout/BottomNav.tsx:52`
- **문제**: 페이지에 nav가 둘 이상일 가능성(상단·하단·breadcrumb 등) 시 스크린 리더가 "navigation, navigation"으로만 읽혀 구분 불가. 본 nav가 BottomNav 임을 명시할 수단 없음.
- **권장 수정**: `<nav aria-label="주요 메뉴">` 또는 `aria-label="하단 메뉴"` 추가.

---

### Suggestion (개선 아이디어)

#### 1. BottomNav.tsx — `navItems` 상수 모듈 스코프 격리
- 현재 `navItems`는 컴포넌트 내부에서 매 렌더마다 새 배열로 생성됨. 자식 컴포넌트에 props로 전달되지 않아 리렌더 비용 자체는 없지만, 의미상 정적 데이터이므로 모듈 스코프 상수로 빼는 게 더 명확.
- 단, ROI는 낮음. 5개 항목 정적 데이터라 메모리·CPU 영향 무시 수준. "정리" 이상의 가치는 없음.

#### 2. navigation.spec.ts — 375px 라벨 줄바꿈 가드의 임계값
- `expect(box?.height ?? 0).toBeLessThan(22)` — `text-[11px]` line-height 기본값 약 16-18px이라 22px이 안전한 임계. 다만 globals.css에서 line-height 토큰 변경 시 임계 재산정 필요. 회귀 가드로는 충분하나 변경에 부서지기 쉬움.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 2건 (접근성) |
| Suggestion | 2건 |
| 빌드 | 미실행 (Critical 없음) |

---

<!-- STEP:refactor -->
## 리팩토링

> 출처 review: [bottomnav-weight-tab-review.md](#코드-리뷰)
> 작성일: 2026-06-02

### 리팩토링한 파일 목록
- `src/components/layout/BottomNav.tsx`

---

### 작업별 내용

#### 1. BottomNav.tsx — `<nav>`에 `aria-label="주요 메뉴"` 추가
- **출처**: Warning #2 (접근성)
- **무엇을**: `<nav>` 엘리먼트에 `aria-label="주요 메뉴"` 속성 추가
- **왜**: 페이지에 nav가 둘 이상 존재할 수 있는 환경(향후 상단 nav·breadcrumb 등)에서 스크린 리더가 본 nav를 "주요 메뉴"로 식별 가능. 보조 기술의 페이지 구조 인지 보강.

#### 2. BottomNav.tsx — 활성 탭 `<Link>`에 `aria-current="page"` 추가
- **출처**: Warning #1 (접근성)
- **무엇을**: `isActive` 시 `aria-current="page"`, 비활성 시 `undefined` 부여
- **왜**: 시각 표시(`bg-pastel-pink/40`)만으로는 스크린 리더가 활성 탭을 인식 못 함. WAI-ARIA 1.1 `aria-current="page"`로 명시적 알림. e2e의 `bg-pastel-pink/40` 클래스 단언과 별개 채널로 활성 상태 의미론 보장.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 1개 | 1개 |
| 줄 수 | 82줄 | 86줄 |
| 동작 변경 | 없음 — 시각·라우팅 무변경 | — |
| 접근성 속성 | 0건 | 2건 (`aria-label`, `aria-current`) |

### 빌드 결과
성공 (1회 시도)
