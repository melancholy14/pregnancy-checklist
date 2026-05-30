# P14: AI 생성 이미지 표시 의무 — 리팩토링

> 작성일: 2026-05-08
> 관련 리뷰: [docs/review/p14-ai-image-label-review.md](../review/p14-ai-image-label-review.md)

## 리팩토링한 파일 목록

- [src/lib/articles.ts](../../../src/lib/articles.ts)
- [src/lib/markdown/rehype-article-figure.ts](../../../src/lib/markdown/rehype-article-figure.ts)

---

## 작업별 내용

### 1. articles.ts — 모듈 상수 위치 정리

- **출처**: Warning #1 (review.md)
- **무엇을**: `sanitizeSchema` 정의를 import 블록 사이(라인 11-17)에서 빼내, 모든 import 다음 + `ARTICLES_DIR` 옆으로 이동.
- **왜**: import 블록을 가르는 모듈 상수가 코드 구조 일관성을 떨어뜨리고, 향후 import 정렬 도구 도입 시 자동 정렬에 걸려 불필요한 diff가 생긴다. 모듈 상수는 import 블록 밖에 위치하는 일반 컨벤션 정합.

### 2. rehype-article-figure.ts — 입력 AST mutation 제거

- **출처**: Warning #3 (review.md)
- **무엇을**: 두 곳의 mutation을 immutable shallow-copy로 전환.
  - `delete img.properties.title` → 객체 destructure로 title 제외한 새 properties 생성, 새 `cleanImg` 노드 사용.
  - `node.children = transformChildren(...)` (입력 노드 직접 변형) → `{ ...node, children: transformChildren(...) }` (shallow copy 후 push) + `continue`로 원본 push 방지.
- **왜**: 같은 hast 트리를 재사용하는 다른 plugin이 들어왔을 때 의도치 않은 사이드이펙트를 방지. 출력 HTML은 동일(빌드 검증 + e2e 테스트로 회귀 확인 완료). 함수형 변환 스타일이 plugin의 단위 테스트 작성을 쉽게 만든다.

---

## 스킵한 항목

- **Warning #2 외부 URL 이미지 경고-only → strict throw**: refactor 범위 밖. 빌드 통과/실패가 바뀌는 **동작 변경**이라 별도 변경(혹은 강제 옵션 추가) 작업으로 분리해야 한다. review.md에 기록 그대로 유지.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 2개 | 2개 (변동 없음) |
| 입력 AST mutation | 2곳 (delete + assignment) | 0곳 (immutable shallow copy) |
| 모듈 상수 import 블록 가름 | 1곳 | 0곳 |
| 동작 변경 | — | 없음 (빌드 산출 HTML + figure 구조 동일) |

---

## 빌드 결과

성공 (1회 시도). 31개 정적 페이지 정상 생성. 발행 글 2건 산출 HTML에서 `Imagined with AI` 칩 + figure 구조 유지, img에 title 속성 0건.
