# Phase 2.5 Step 4: Sticky 헤더

> Date: 2026-04-06
> Status: Complete
> PRD: [docs/phase-2.5/plan.md](../phase-2.5/plan.md) — Step 4

---

## 개요

현재 헤더 컴포넌트가 없어 유저가 어떤 서비스인지 인지할 장치가 부족했다. 최소한의 Sticky 헤더(44px)를 추가하여 브랜드 인지를 강화한다.

### 설계 결정

| 항목 | 결정 |
|------|------|
| 높이 | 44px (`h-11`) |
| 배경 | `bg-white/90 backdrop-blur-xl` (BottomNav와 동일) |
| 폭 | PC에서 full-width, 내부 콘텐츠 `max-w-2xl` 중앙 정렬 |
| 홈 페이지 | 숨김 (히어로 영역 존재) |
| 스크롤 동작 | 다운 시 숨김, 업 시 표시 |
| 구분선 | 스크롤 시 `border-b border-black/6` 추가 |

---

## 구현

### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/layout/StickyHeader.tsx` | **신규** — Sticky 헤더 컴포넌트 (로고+타이틀, 스크롤 인식, 홈 제외) |
| `src/app/layout.tsx` | StickyHeader 삽입 (컨테이너 외부, full-width) |
| `e2e/sticky-header.spec.ts` | **신규** — 5개 E2E 테스트 |

### 스크롤 동작

- 스크롤 다운 → `translate-y: -100%` (숨김)
- 스크롤 업 또는 최상단(< 44px) → `translate-y: 0` (표시)
- 홈 페이지에서는 scroll 리스너 등록하지 않음 (성능 최적화)

---

## 코드 리뷰

| 등급 | 이슈 | 해결 |
|------|------|------|
| Critical | 없음 | — |
| Warning | 홈에서 불필요한 scroll 리스너 등록 | effect 내부 early return + pathname deps 추가 |

---

## E2E 테스트

**5/5 통과**

| 테스트 | 내용 |
|--------|------|
| 홈이 아닌 페이지에서 헤더 표시 | 타임라인에서 헤더 visible |
| 로고 이미지 포함 | header 내 img 렌더링 |
| 홈 페이지 숨김 | `/`에서 header count 0 |
| 여러 서브 페이지 표시 | baby-fair, videos, articles |
| 44px 높이 | boundingBox height 검증 |

---

## 파이프라인 실행 이력

| 단계 | 결과 |
|------|------|
| 1. implement-feature | StickyHeader 신규 + layout.tsx 수정 |
| 2. write-e2e-tests | 5개 테스트 작성 |
| 3. run-e2e | 5/5 통과 |
| 4. code-review | Critical 0건, Warning 1건 |
| 5. refactor | scroll 리스너 최적화 |
| 6. run-e2e | 5/5 통과 |
| 7. write-feature-doc | 이 문서 |
