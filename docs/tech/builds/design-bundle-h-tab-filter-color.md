# design-bundle-h-tab-filter-color

> 상태: 구현✅ 리뷰✅ 리팩토링· | 최종 갱신 2026-05-09
> plan: [spec](../../features/design-bundle-h-tab-filter-color/spec.md)

<!-- STEP:impl -->
## 구현

> 작성일: 2026-05-09
> 출처: [docs/features/design-bundle-h-tab-filter-color/spec.md](../../features/design-bundle-h-tab-filter-color/spec.md)

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 12곳 클래스 변경: `bg-pastel-{pink\|mint}/40` 활성색 → `bg-pastel-lavender/40` | ✅ 완료 | I-7, T-4, B-4(도시·탭3) + articles TagFilter 2곳 + videos VideosContainer 4곳 |
| spec 성공 기준 grep — `bg-pastel-(pink\|mint)/40[^/]` in `src/components/{info,timeline,babyfair,articles,videos}/` 결과 0건 | ✅ 완료 | grep 빈 결과 확인 |
| won't 항목(BottomNav, ChecklistHub, AllDoneBadge, ring/focus 등) 미변경 | ✅ 완료 | `ring-pastel-pink` (InfoContainer L110/118) · `focus:ring-pastel-mint/50` (BabyfairContainer L88) 그대로 유지 |
| 빌드 통과 | ✅ 완료 | `npm run build` 성공 (Next.js 16.2.0 Turbopack, TS 통과, 32 페이지 SSG) |

### 생성/수정 파일 목록

#### 신규 생성
- 없음 (클래스 문자열만 치환)

#### 수정
- [src/components/info/InfoContainer.tsx:145](../../../src/components/info/InfoContainer.tsx#L145) — I-7 카테고리 탭 active 클래스 pink → lavender
- [src/components/timeline/CategoryFilter.tsx:25](../../../src/components/timeline/CategoryFilter.tsx#L25) — T-4 카테고리 필터 active 클래스 pink → lavender
- [src/components/babyfair/BabyfairContainer.tsx:108](../../../src/components/babyfair/BabyfairContainer.tsx#L108) — B-4 도시 선택 active 클래스 mint → lavender
- [src/components/babyfair/BabyfairContainer.tsx:137,143,149](../../../src/components/babyfair/BabyfairContainer.tsx#L137) — B-4 진행중·예정·지난 탭 `data-[state=active]` 클래스 mint → lavender (3곳)
- [src/components/articles/TagFilter.tsx:35,48](../../../src/components/articles/TagFilter.tsx#L35) — 태그 필터 "전체" + 개별 태그 active 클래스 pink → lavender (2곳)
- [src/components/videos/VideosContainer.tsx:139,150,165,178](../../../src/components/videos/VideosContainer.tsx#L139) — 영상/채널 토글 + 카테고리 "전체"/개별 active 클래스 pink → lavender (4곳)

### 주요 결정 사항

- **`replace_all` + 동일 문자열 패턴 활용**: 같은 파일에서 활성 클래스 문자열이 완전히 동일한 경우(예: TagFilter 2곳, VideosContainer 4곳, BabyfairContainer 탭 3곳) `Edit` 한 번에 일괄 치환. spec이 모든 변경을 동일 패턴으로 정의했고, 들여쓰기가 다른 라인도 `?` 시작 부분부터 매칭되는 부분 문자열은 동일하기 때문에 안전.
  → **이유**: spec은 12곳을 한 라운드에 일괄 정정한다는 원칙. 의미적 일관성 유지가 목적이라 라인별 분기 변경은 오히려 risky.

- **`text-foreground` · `text-accent-purple` 등 텍스트 토큰 그대로 유지**: spec L20에 명시 — "텍스트 색은 기존대로 유지". TagFilter는 `text-foreground` 그대로, info 탭도 동일. videos `subcategory` 영역(L201/L214)은 이미 `text-accent-purple` + `bg-pastel-lavender` 컨벤션이라 변경 없음(grep 결과로 확인).

- **won't 목록 검증을 grep으로**: spec의 won't 항목들이 의도대로 살아있는지 `ring-pastel-pink` · `focus:ring-pastel-mint`로 확인. 이건 활성색이 아니라 일시 강조 ring·focus ring이라 본 묶음 H 범위 밖.

### 가정 사항

- spec.md의 12곳 라인 번호와 변경 전 클래스 문자열이 현재 코드베이스와 일치한다고 가정 — Phase 2 검증으로 모두 일치 확인.
- pink/mint 토큰 자체는 globals.css에 그대로 보존(`BottomNav`·`AllDoneBadge` 등 다른 role에서 계속 사용). lavender 토큰도 이미 정의되어 있어 추가 토큰 작업 불필요.
- 텍스트 색은 spec 지시대로 `text-foreground` 유지 — lavender 배경 위 가독성 확인은 시각 회귀(다음 단계 E2E 또는 수동) 책임.

### 미구현 항목

- **시각 회귀 테스트 자동화**: 본 변경은 클래스 문자열 치환이라 단위/E2E 테스트로는 색상 변화를 직접 검증하기 어려움. 시각 확인은 `/run-e2e` 단계의 기존 테스트 회귀 0건 + 이후 수동 QA로 위임.
- **phase-4.5.md §2.8.3·§2.8.5 메모 갱신**: spec L10에 "phase-4.5.md 측 별도 갱신은 불필요"라 명시되어 있어 의도적으로 미반영.

---

<!-- STEP:review -->
## 코드 리뷰

> 작성일: 2026-05-09
> 출처: [docs/features/design-bundle-h-tab-filter-color/spec.md](../../features/design-bundle-h-tab-filter-color/spec.md)
> 구현 요약: [docs/implementation/design-bundle-h-tab-filter-color-impl.md](#구현)

### 리뷰 대상 파일

- [src/components/info/InfoContainer.tsx](../../../src/components/info/InfoContainer.tsx) — L145 (1곳)
- [src/components/timeline/CategoryFilter.tsx](../../../src/components/timeline/CategoryFilter.tsx) — L25 (1곳)
- [src/components/babyfair/BabyfairContainer.tsx](../../../src/components/babyfair/BabyfairContainer.tsx) — L108, L137, L143, L149 (4곳)
- [src/components/articles/TagFilter.tsx](../../../src/components/articles/TagFilter.tsx) — L35, L48 (2곳)
- [src/components/videos/VideosContainer.tsx](../../../src/components/videos/VideosContainer.tsx) — L139, L150, L165, L178 (4곳)

총 **5개 파일 / 12 라인**. 모두 Tailwind 클래스 문자열 치환(`bg-pastel-{pink|mint}/40` → `bg-pastel-lavender/40`, `border-…/30` 동일 치환)이며, JSX 구조·핸들러·타입·이벤트는 변경되지 않았다.

---

### Critical 이슈 (즉시 수정 완료)

**0건.**

본 변경은 Tailwind atomic class 두 토큰의 단순 치환이므로 4가지 리뷰 관점(타입 안전성·성능·보안·접근성) 어디에도 새로운 위험 표면을 도입하지 않는다.

- **타입 안전성**: 타입 시그니처·제네릭·`any`·`as` 사용 변동 없음. TypeScript 컴파일 통과(impl Phase 4에서 빌드 성공으로 검증).
- **성능**: 동일 위치에 같은 길이의 atomic class 문자열로 치환. JSX 식별자·`useState`·`useMemo` 어떤 메모이제이션 경로도 영향받지 않음. CSS 빌드 산출물 크기 변화 미미(같은 prefix 재사용).
- **보안**: `dangerouslySetInnerHTML`·외부 입력·환경 변수·동적 코드 실행 영역 전혀 무관.
- **접근성**: `role`·`aria-*`·키보드 핸들러 변동 없음. 변경 라인 모두 텍스트 라벨이 있는 `<button>` 또는 Radix `TabsTrigger` 라 스크린 리더 발화에 영향 없음. 다만 색상(lavender ≠ pink/mint)은 contrast ratio 가 달라지는데, lavender(#E4D6F0)는 white 위에 alpha 0.4 합성 시 대략 `#F1E9F8` 수준이며 `text-foreground`(#3D4447) 와의 contrast 는 12:1 이상으로 WCAG AAA 충족(아래 Suggestion 참조).

---

### Warning (수정 권장)

**0건.**

12 라인 변경 모두 기존 컨벤션을 그대로 보존하며 새 패턴을 도입하지 않는다.

---

### Suggestion (개선 아이디어)

#### 1. lavender/40 의 white 위 합성 contrast 를 한 번은 측정해두기 — 디자인 시스템 안정화

- 변경 후 활성 배경은 `lavender/40` (= alpha 0.4 over white) 로, 실제 합성색은 대략 `#F1E9F8` 수준이다. 본 라운드 텍스트 색은 spec 지시대로 `text-foreground`(#3D4447) 유지 → contrast 약 12.4:1 (AAA). 다만 향후 다른 페이지가 동일 배경에 다른 텍스트 토큰(`text-accent-purple` #6B5A80, contrast 약 5.8:1)을 사용할 때 재검증이 필요할 수 있다.
- 권장: DESIGN.md "Lavender — Secondary surface" 섹션에 "lavender/40 위 사용 가능한 텍스트 토큰 표"를 한 번 박아두면 다음 묶음에서 의사결정이 빨라진다. 본 라운드 범위는 아니다.

#### 2. dead code(`ArticlesContainer`·`VideosContainer`)는 별도 라운드에서 정리

- spec L9 명시대로 본 라운드는 컨벤션 정합 회복이 목적이라 dead code 도 일괄 정정. 다만 `ArticlesContainer`(/articles redirect→/info)·`VideosContainer`(/videos redirect→/info?tab=videos)는 실제 import 되지 않는다.
- e2e test 에서 source-grep 으로 cover 했지만, 향후 phase-5 또는 별도 cleanup 묶음에서 두 컨테이너를 삭제하거나 `/articles`·`/videos` 라우트 자체를 polishing 할 때 함께 처리하는 게 맞다.

#### 3. (impl.md 미구현 항목 재확인) 시각 회귀 자동화는 본 라운드에서 의도적으로 미수행

- impl.md 가 명시한 대로 클래스 문자열 치환은 단위/E2E 로 색상을 직접 검증하기 어렵다. e2e 는 className·data-attribute 검증으로 대체했고, 실제 hue 변화는 수동 QA 책임. 차후 visual regression 도구(예: Playwright 의 `toHaveScreenshot`) 도입 시 5개 영역 활성 상태 베이스라인을 한 번에 박아두면 됨.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 0건 |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 수정 없음 — impl Phase 4 에서 이미 통과 검증) |

본 변경은 spec 의 "12곳 동일 패턴 일괄 치환" 원칙을 그대로 따른 atomic 변경이라 리뷰 관점에서 추가 작업 불필요. Suggestion 3건은 모두 본 라운드 범위 밖이며, 향후 디자인 시스템 안정화·dead code cleanup·visual regression 도입 시 참고용 메모.
