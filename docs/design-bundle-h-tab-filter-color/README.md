# design-bundle-h-tab-filter-color

> 작성일: 2026-05-10 | 작성자: Claude Code
> 출처 spec: [docs/features/design-bundle-h-tab-filter-color/spec.md](../features/design-bundle-h-tab-filter-color/spec.md)
> phase-4.5 묶음 H — Cross-2 (탭/필터 활성색 컨벤션) + I-7 + T-4 + B-4 일괄 정정

## 개요

홈을 제외한 5개 영역(timeline·info·articles·videos·baby-fair)의 탭·필터·도시 선택 활성 표시를 모두 `bg-pastel-lavender/40 ... border-pastel-lavender/30` 단일 컨벤션으로 통일했다. 사용자 관점에서 활성 상태가 더 이상 pink(=CTA) · mint(=success) 와 시각적으로 섞이지 않고, "내가 선택한 항목" secondary surface 의미가 일관된다. 기능·동작·이벤트는 변경 없다.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 12곳 클래스 변경: `bg-pastel-{pink\|mint}/40` 활성색 → `bg-pastel-lavender/40` | ✅ 완료 | I-7, T-4, B-4(도시·탭3) + articles TagFilter 2곳 + videos VideosContainer 4곳 |
| spec 성공 기준 grep — `bg-pastel-(pink\|mint)/40[^/]` in `src/components/{info,timeline,babyfair,articles,videos}/` 결과 0건 | ✅ 완료 | grep 빈 결과 + e2e source-grep 자동화 |
| won't 항목(BottomNav, ChecklistHub, AllDoneBadge, ring/focus 등) 미변경 | ✅ 완료 | `ring-pastel-pink` · `focus:ring-pastel-mint/50` 그대로 유지 |
| 빌드 통과 | ✅ 완료 | `npm run build` 성공 (Next.js 16.2.0 Turbopack, TS 통과, 32 페이지 SSG) |

### 생성/수정 파일

신규 생성: 없음 (atomic class 문자열 치환만).

수정 (5개 파일 / 12 라인):
- [src/components/info/InfoContainer.tsx:145](../../src/components/info/InfoContainer.tsx#L145) — I-7 카테고리 탭 active pink → lavender (1곳)
- [src/components/timeline/CategoryFilter.tsx:25](../../src/components/timeline/CategoryFilter.tsx#L25) — T-4 카테고리 필터 active pink → lavender (1곳)
- [src/components/babyfair/BabyfairContainer.tsx:108,137,143,149](../../src/components/babyfair/BabyfairContainer.tsx) — B-4 도시 + 진행중·예정·지난 탭 mint → lavender (4곳)
- [src/components/articles/TagFilter.tsx:35,48](../../src/components/articles/TagFilter.tsx) — 태그 필터 "전체" + 개별 태그 active pink → lavender (2곳)
- [src/components/videos/VideosContainer.tsx:139,150,165,178](../../src/components/videos/VideosContainer.tsx) — 영상/채널 토글 + 카테고리 active pink → lavender (4곳)

테스트 신규:
- [e2e/design-bundle-h-tab-filter-color.spec.ts](../../e2e/design-bundle-h-tab-filter-color.spec.ts) — 13 케이스 (Happy 4 / 회귀 5 / won't 보존 2 / 반응형 2)

문서 신규:
- [docs/implementation/design-bundle-h-tab-filter-color-impl.md](../implementation/design-bundle-h-tab-filter-color-impl.md)
- [docs/review/design-bundle-h-tab-filter-color-review.md](../review/design-bundle-h-tab-filter-color-review.md)

### 주요 결정 사항

- **`replace_all` + 동일 문자열 패턴 활용**: TagFilter 2곳·VideosContainer 4곳·BabyfairContainer 탭 3곳을 `Edit` 한 번에 일괄 치환. spec L9 "12곳을 한 라운드에 일괄 정정" 원칙과 정합.
- **텍스트 색은 spec 지시대로 유지**: `text-foreground` (info 탭·timeline·babyfair·videos·articles) 그대로. videos `subcategory` (L201/L214)는 이미 `text-accent-purple` + `bg-pastel-lavender` 컨벤션이라 변경 없음.
- **won't 목록은 grep 으로 보존 검증**: `ring-pastel-pink`(InfoContainer L110/118), `focus:ring-pastel-mint/50`(BabyfairContainer L88), BottomNav active pink 모두 그대로. 이건 활성색이 아니라 일시 강조·focus·CTA role 이라 묶음 H 범위 밖.

### 가정 사항 및 미구현 항목

- pink/mint 토큰은 `globals.css` 에 그대로 보존 — BottomNav active(CTA), AllDoneBadge(success) 등 다른 role 에서 계속 사용.
- lavender 배경 위 `text-foreground` 가독성: contrast 약 12.4:1 (AAA). 단 향후 다른 텍스트 토큰 조합은 별도 검증 필요.
- `phase-4.5.md §2.8.3·§2.8.5` 메모 갱신: spec L10 명시대로 의도적으로 미반영 ("phase-4.5.md 측 별도 갱신은 불필요").
- 시각 회귀 자동화: 클래스 치환은 단위/E2E 로 색상을 직접 검증하기 어려움 → e2e 는 className·data-attribute 검증 + source grep 으로 cover, 실제 hue 변화는 수동 QA 책임.

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

**0건.** atomic class 치환은 4가지 리뷰 관점(타입 안전성·성능·보안·접근성) 어디에도 새 위험 표면을 도입하지 않음.

### Warning (수정 권장)

**0건.** 12 라인 변경 모두 기존 컨벤션을 그대로 보존.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 완료 |
| Warning | 0건 |
| Suggestion | 3건 (DESIGN.md lavender contrast 표 박기 / dead code cleanup / visual regression 도구 도입 — 모두 본 라운드 범위 밖) |

상세: [docs/review/design-bundle-h-tab-filter-color-review.md](../review/design-bundle-h-tab-filter-color-review.md)

---

## 리팩토링 내용

### 작업 목록

**No-op.** Warning 0건 + 자체 판단 4관점(중복 코드·큰 컴포넌트·커스텀 훅·불필요 메모이제이션) 어디에도 추가 작업 없음.

12 라인 atomic class 문자열을 공통 상수(예: `ACTIVE_TAB_CLASS`)로 추출하는 안은 검토했지만, 5개 컴포넌트가 서로 다른 도메인이고 spec L9 의 "12곳 일괄 정정" 원칙과 어긋나 **premature abstraction** 으로 판단해 추출하지 않음.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 변경 라인 수 | — | 12 라인 (5 파일) |
| 신규 파일 | — | 0 (테스트·문서 제외) |
| 컴포넌트 라인 수 변화 | — | 0 |
| 활성색 토큰 종류 (5개 영역) | pink + mint 혼재 | lavender 단일 |

> 📄 별도 refactor 문서 없음 (no-op)

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path — 활성색 lavender (런타임 렌더 영역) | ✅ 4 passed |
| Error / Validation — 회귀 0건 (소스 grep + 렌더 grep) | ✅ 5 passed |
| 권한 / 인증 (color isolation) — won't 항목 보존 | ✅ 2 passed |
| 반응형 (Mobile 375px) | ✅ 2 passed |
| **전체** | **13 passed / 0 failed (7.2s)** |

📊 상세 리포트: [playwright-report/index.html](../../playwright-report/index.html)

특기 사항:
- `/articles`·`/videos` 가 redirect 처리되어 ArticlesContainer/VideosContainer 가 dead code → 런타임 검증 불가능. spec 성공 기준 1번 grep 을 `execSync` 로 직접 돌리는 source-level 테스트 2개로 cover.
- React rerender 타이밍을 잡기 위해 helper 를 `toHaveClass` 자동 재시도 기반으로 작성. /info 의 Suspense+useSearchParams 하이드레이션 대기 추가.

---

## 파이프라인 단계 메모

| 단계 | 결과 |
|------|------|
| 1. plan-feature | spec.md 자체가 12곳 파일·라인·변경 내용 명시 → 별도 plan 파일 없이 spec 으로 대체 |
| 2. implement-feature | 5 파일 12 라인 치환, 빌드 1회 통과 |
| 3. write-e2e-tests | 13 케이스 작성, 1차에서 3 fail → 타이밍·dead code·BottomNav 경로 수정 후 13/13 통과 |
| 4. run-e2e (구현 검증) | 13/13 통과, 7.2s |
| 5. code-review | Critical 0 / Warning 0 / Suggestion 3 |
| 6. refactor | no-op (premature abstraction 회피) |
| 7. run-e2e (리팩토링 검증) | skip (리팩토링 작업 0이라 4단계 결과로 갈음) |
| 8. write-feature-doc | 본 문서 |
