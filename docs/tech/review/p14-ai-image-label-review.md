# P14: AI 생성 이미지 표시 의무 — 코드 리뷰

> 작성일: 2026-05-08
> 관련 구현: [docs/implementation/p14-ai-image-label-impl.md](../implementation/p14-ai-image-label-impl.md)
> 관련 스펙: [docs/features/p14-ai-image-label/spec.md](../../features/p14-ai-image-label/spec.md)

## 리뷰 대상 파일

- [src/lib/markdown/rehype-article-figure.ts](../../../src/lib/markdown/rehype-article-figure.ts)
- [src/lib/articles.ts](../../../src/lib/articles.ts)
- [src/app/globals.css](../../../src/app/globals.css)

총 3개 파일 (impl.md "생성/수정 파일 목록" 기준). MD 콘텐츠/문서 파일은 코드 리뷰 범위 밖.

---

## Critical 이슈

**0건.** 즉시 수정 필요한 이슈 없음.

종합 검증 결과:
- **타입 안전성**: `any` 미사용, 모든 함수 반환 타입 명시, 타입 단언(`as ElementContent[]`)은 `remark-rehype` 출력 트리 구조상(루트에 Doctype 미발생) 안전.
- **성능**: SSG 빌드 타임에만 실행되는 O(n) 트리 워커. 런타임 비용 0.
- **보안**: `dangerouslySetInnerHTML`은 본 변경 이전부터 존재했으며, 본 plugin은 `rehypeSanitize` **뒤**에 실행되어 이미 정화된 hast에 figure 구조만 추가. 칩 텍스트는 하드코딩 상수, figcaption 텍스트는 markdown `title`(운영자 작성)에서 추출하지만 `rehype-stringify`가 text 노드를 escape하므로 XSS 표면 없음.
- **접근성**: alt 마커 보존 (테스트 통과), 칩에 `aria-hidden="true"` (테스트 통과), 인터랙티브 요소 신규 추가 없음.

---

## Warning (수정 권장)

### 1. articles.ts — 모듈 상수 정의 위치가 import 그룹을 가른다

- **위치**: [src/lib/articles.ts:9-18](../../../src/lib/articles.ts#L9-L18)
- **문제**: `rehypeArticleFigure` import (라인 9) 직후에 `sanitizeSchema` 모듈 상수가 정의되고(라인 11-17), 그 뒤에 다시 `ArticleMeta`/`Article`/`BASE_URL` 타입·상수 import가 이어진다. ESLint는 통과하지만 import 블록을 끊어 코드 구조 일관성을 약하게 만든다. 다른 모듈 import 정렬 규칙(`import-order` 등) 도입 시 자동 정렬에 걸려 불필요한 diff 생성.
- **권장 수정**: `sanitizeSchema` 정의를 모든 import 다음, `ARTICLES_DIR` 상수 부근으로 이동.

### 2. rehype-article-figure.ts — 외부 절대 URL 이미지가 경고만 발생, 빌드는 통과

- **위치**: [src/lib/markdown/rehype-article-figure.ts:40-44](../../../src/lib/markdown/rehype-article-figure.ts#L40-L44)
- **문제**: spec.md §3 should "외부 이미지 사용 금지" 룰을 `console.warn`으로만 알림. CI/배포 로그에서 경고가 묻히면 운영자가 SOP 위반 이미지를 그대로 발행할 수 있다. 발행 글에 외부 이미지 0건이라 현재는 영향 없으나, IPTC 메타 통제 불가 + CDN 정합성 리스크가 누적될 수 있다.
- **권장 수정**: `strict` 옵션을 활용하거나 외부 URL에 한해서만 throw 하는 별도 옵션을 추가. articles.ts 호출 측에서 production 빌드 시 활성화 검토.

### 3. rehype-article-figure.ts — 입력 AST를 직접 mutate

- **위치**: [src/lib/markdown/rehype-article-figure.ts:48-50](../../../src/lib/markdown/rehype-article-figure.ts#L48-L50), [src/lib/markdown/rehype-article-figure.ts:111](../../../src/lib/markdown/rehype-article-figure.ts#L111)
- **문제**: `delete img.properties.title`와 `node.children = transformChildren(...)`로 입력 hast 트리를 직접 변형. rehype 컨벤션상 허용 패턴이며 현재 파이프라인에서 동일 트리 재사용 케이스가 없어 영향 없으나, 향후 다른 plugin이 같은 트리를 참조하면 의도치 않은 사이드이펙트 가능.
- **권장 수정**: 변경이 필요한 노드만 얕은 복사 후 새 트리를 반환하는 방식으로 전환. 우선순위는 낮음.

---

## Suggestion (개선 아이디어)

### 1. plugin 단위 테스트 부재

- E2E로 figure 출력만 검증 중. plugin 자체의 트리 변형 로직(image-only paragraph 판별, title 추출, 4분기 figcaption 분기, mutation 사이드이펙트)은 단위 테스트 가성비가 매우 높지만 프로젝트에 vitest 등 단위 테스트 셋업이 없다.
- 향후 `src/lib/markdown/__tests__/rehype-article-figure.test.ts` 추가 시 변형 케이스(4분기 + 비-이미지 노드 + 외부 URL + alt 누락)를 빠르게 회귀 검증 가능.

### 2. 마커 상수가 코드와 SOP 문서에 듀얼 source

- `(AI 생성 이미지)` 문자열이 plugin (`AI_MARKER`)과 [docs/content/image-sop.md](../../content/image-sop.md), 발행 글 2건 alt에 각각 박혀 있다. 변경 시 한쪽만 수정하면 정합성 깨짐.
- MD 문서에서 코드 상수를 동적으로 참조하기는 어려우므로, SOP 문서와 plugin 모두 "변경 금지 토큰"으로 명시(주석)하는 정도가 현실적.

### 3. 광고 슬롯 충돌 자동 검사 미구현

- spec.md §3 should의 "워터마크 칩과 광고 슬롯 시각 충돌 검사". impl.md "미구현 항목"에 의도적 미구현으로 기록됨. P11/P12에서 광고 슬롯 위치가 동적으로 결정되는 시점 이후에 재논의 가능.

### 4. dev 안전망 cross-check 잉여

- spec.md §3 should "alt에 마커 있는데 칩 누락 / 반대" cross-check가 명세되어 있으나, 현재 구조는 칩이 alt 마커에서만 derive되므로 이론적으로 누락 불가. cross-check를 별도 검증 단계로 두지 않고 단일 source of truth(alt)로 단순화한 것은 합리적 선택. 명세 자체가 redundant라는 점만 spec.md 후속 갱신 검토.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 (수정 권장, 코드 미수정) |
| Suggestion | 4건 |
| 빌드 | 미실행 (Critical 없음) |
