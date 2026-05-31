# design-bundle-h-tab-filter-color 코드 리뷰

> 작성일: 2026-05-09
> 출처: [docs/features/design-bundle-h-tab-filter-color/spec.md](../../features/design-bundle-h-tab-filter-color/spec.md)
> 구현 요약: [docs/implementation/design-bundle-h-tab-filter-color-impl.md](../implementation/design-bundle-h-tab-filter-color-impl.md)

## 리뷰 대상 파일

- [src/components/info/InfoContainer.tsx](../../../src/components/info/InfoContainer.tsx) — L145 (1곳)
- [src/components/timeline/CategoryFilter.tsx](../../../src/components/timeline/CategoryFilter.tsx) — L25 (1곳)
- [src/components/babyfair/BabyfairContainer.tsx](../../../src/components/babyfair/BabyfairContainer.tsx) — L108, L137, L143, L149 (4곳)
- [src/components/articles/TagFilter.tsx](../../../src/components/articles/TagFilter.tsx) — L35, L48 (2곳)
- [src/components/videos/VideosContainer.tsx](../../../src/components/videos/VideosContainer.tsx) — L139, L150, L165, L178 (4곳)

총 **5개 파일 / 12 라인**. 모두 Tailwind 클래스 문자열 치환(`bg-pastel-{pink|mint}/40` → `bg-pastel-lavender/40`, `border-…/30` 동일 치환)이며, JSX 구조·핸들러·타입·이벤트는 변경되지 않았다.

---

## Critical 이슈 (즉시 수정 완료)

**0건.**

본 변경은 Tailwind atomic class 두 토큰의 단순 치환이므로 4가지 리뷰 관점(타입 안전성·성능·보안·접근성) 어디에도 새로운 위험 표면을 도입하지 않는다.

- **타입 안전성**: 타입 시그니처·제네릭·`any`·`as` 사용 변동 없음. TypeScript 컴파일 통과(impl Phase 4에서 빌드 성공으로 검증).
- **성능**: 동일 위치에 같은 길이의 atomic class 문자열로 치환. JSX 식별자·`useState`·`useMemo` 어떤 메모이제이션 경로도 영향받지 않음. CSS 빌드 산출물 크기 변화 미미(같은 prefix 재사용).
- **보안**: `dangerouslySetInnerHTML`·외부 입력·환경 변수·동적 코드 실행 영역 전혀 무관.
- **접근성**: `role`·`aria-*`·키보드 핸들러 변동 없음. 변경 라인 모두 텍스트 라벨이 있는 `<button>` 또는 Radix `TabsTrigger` 라 스크린 리더 발화에 영향 없음. 다만 색상(lavender ≠ pink/mint)은 contrast ratio 가 달라지는데, lavender(#E4D6F0)는 white 위에 alpha 0.4 합성 시 대략 `#F1E9F8` 수준이며 `text-foreground`(#3D4447) 와의 contrast 는 12:1 이상으로 WCAG AAA 충족(아래 Suggestion 참조).

---

## Warning (수정 권장)

**0건.**

12 라인 변경 모두 기존 컨벤션을 그대로 보존하며 새 패턴을 도입하지 않는다.

---

## Suggestion (개선 아이디어)

### 1. lavender/40 의 white 위 합성 contrast 를 한 번은 측정해두기 — 디자인 시스템 안정화

- 변경 후 활성 배경은 `lavender/40` (= alpha 0.4 over white) 로, 실제 합성색은 대략 `#F1E9F8` 수준이다. 본 라운드 텍스트 색은 spec 지시대로 `text-foreground`(#3D4447) 유지 → contrast 약 12.4:1 (AAA). 다만 향후 다른 페이지가 동일 배경에 다른 텍스트 토큰(`text-accent-purple` #6B5A80, contrast 약 5.8:1)을 사용할 때 재검증이 필요할 수 있다.
- 권장: DESIGN.md "Lavender — Secondary surface" 섹션에 "lavender/40 위 사용 가능한 텍스트 토큰 표"를 한 번 박아두면 다음 묶음에서 의사결정이 빨라진다. 본 라운드 범위는 아니다.

### 2. dead code(`ArticlesContainer`·`VideosContainer`)는 별도 라운드에서 정리

- spec L9 명시대로 본 라운드는 컨벤션 정합 회복이 목적이라 dead code 도 일괄 정정. 다만 `ArticlesContainer`(/articles redirect→/info)·`VideosContainer`(/videos redirect→/info?tab=videos)는 실제 import 되지 않는다.
- e2e test 에서 source-grep 으로 cover 했지만, 향후 phase-5 또는 별도 cleanup 묶음에서 두 컨테이너를 삭제하거나 `/articles`·`/videos` 라우트 자체를 polishing 할 때 함께 처리하는 게 맞다.

### 3. (impl.md 미구현 항목 재확인) 시각 회귀 자동화는 본 라운드에서 의도적으로 미수행

- impl.md 가 명시한 대로 클래스 문자열 치환은 단위/E2E 로 색상을 직접 검증하기 어렵다. e2e 는 className·data-attribute 검증으로 대체했고, 실제 hue 변화는 수동 QA 책임. 차후 visual regression 도구(예: Playwright 의 `toHaveScreenshot`) 도입 시 5개 영역 활성 상태 베이스라인을 한 번에 박아두면 됨.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 0건 |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 수정 없음 — impl Phase 4 에서 이미 통과 검증) |

본 변경은 spec 의 "12곳 동일 패턴 일괄 치환" 원칙을 그대로 따른 atomic 변경이라 리뷰 관점에서 추가 작업 불필요. Suggestion 3건은 모두 본 라운드 범위 밖이며, 향후 디자인 시스템 안정화·dead code cleanup·visual regression 도입 시 참고용 메모.
