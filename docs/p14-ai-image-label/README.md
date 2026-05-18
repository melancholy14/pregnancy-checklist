# P14: AI 생성 이미지 표시 의무

> 작성일: 2026-05-08 | 작성자: Claude Code
> 관련 산출물: [spec](../features/p14-ai-image-label/spec.md) · [design](../features/p14-ai-image-label/design.md) · [review](../features/p14-ai-image-label/review.md) · [impl](../implementation/p14-ai-image-label-impl.md) · [code-review](../review/p14-ai-image-label-review.md) · [refactor](../refactor/p14-ai-image-label-refactor.md) · [SOP](../content/image-sop.md)

## 개요

블로그 본문에 사용된 AI 생성 이미지(미드저니/DALL·E 인포그래픽)에 표시 형태·문구·메타·적용 범위를 정의하고, 발행된 글 2건([weekly-prenatal-checklist](../../src/content/articles/weekly-prenatal-checklist.md), [prenatal-insurance-preparation-guide](../../src/content/articles/prenatal-insurance-preparation-guide.md))을 마이그레이션. 빌드 타임 rehype 플러그인이 alt 마커 `(AI 생성 이미지)`를 감지해 figure 구조 + 우하단 워터마크 칩 `Imagined with AI` + (markdown title 슬롯에 캡션이 있을 때만) figcaption을 자동 부착한다. AdSense·E-E-A-T 정합성 확보 + 운영자 신규 글 작성 시 후처리 0이 목표.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 발행된 글 2건 인포그래픽이 figure + 워터마크 칩(우하단) + alt(`(AI 생성 이미지)`)로 렌더 | ✅ 완료 | 빌드 출력 HTML + e2e로 확인 |
| 신규 글 작성 시 alt 컨벤션만 따르면 후처리 0 | ✅ 완료 | rehype-article-figure 플러그인이 빌드 타임에 자동 부착 |
| 운영자 SOP 1장 통합 위치 존재 | ✅ 부분 완료 | P10 통합 문서 미정 → [docs/content/image-sop.md](../content/image-sop.md) 단독 발행 |

### 생성/수정 파일

**신규 (코드)**
- [src/lib/markdown/rehype-article-figure.ts](../../src/lib/markdown/rehype-article-figure.ts) — image-only paragraph를 figure로 치환, alt 마커 → 워터마크 칩, markdown title → figcaption(조건부).

**수정 (코드)**
- [src/lib/articles.ts](../../src/lib/articles.ts) — remark 파이프라인에 plugin 연결 + sanitize 스키마 확장(`<img title>` 허용).
- [src/app/globals.css](../../src/app/globals.css) — `.article-figure`, `__media`, `__chip`, `__caption` 4개 셀렉터 추가.

**수정 (콘텐츠)**
- [src/content/articles/weekly-prenatal-checklist.md](../../src/content/articles/weekly-prenatal-checklist.md), [src/content/articles/prenatal-insurance-preparation-guide.md](../../src/content/articles/prenatal-insurance-preparation-guide.md) — alt 끝에 ` (AI 생성 이미지)` 후행 추가.

**신규 (문서)**
- [docs/content/image-sop.md](../content/image-sop.md) — 운영자 SOP (트리거 룰, 캡션 컨벤션, 도구별 분류표, IPTC 검증 절차, 발행 체크리스트).

**테스트**
- [e2e/p14-ai-image-label.spec.ts](../../e2e/p14-ai-image-label.spec.ts) — 11개 시나리오.

### 주요 결정 사항

1. **plugin 위치는 sanitize 뒤** — 기본 sanitize 스키마가 figure/figcaption·custom className을 strip하므로 정화된 hast 받아서 figure 추가.
2. **next/image·ArticleFigure 컴포넌트 미사용** — article 본문이 `dangerouslySetInnerHTML` 구조라 빌드 타임 React 컴포넌트 호출 불가. plain `<img>` + plugin emit HTML로 대응. dead code 회피.
3. **figcaption 조건부 렌더** (2026-05-08 절충안) — review.md §5 결정의 figcaption `· AI 생성` 단독 표기를 운영자 시각 검수 후 절충. 캡션 있으면 `<원본 캡션> · AI 생성`, 없으면 figcaption 자체 미렌더 (워터마크 칩 + alt 두 채널로 표시 의무 충족). p14 review.md §5.2에 절충안 정식 기록.
4. **캡션 컨벤션 = markdown image title 슬롯** — `![alt](src "캡션")` 표준 문법 활용. plugin이 title을 figcaption으로 옮긴 후 img에서 제거(브라우저 tooltip 중복 방지). sanitize 스키마에 `img.title` 1줄 추가 확장.
5. **CSS는 plain CSS in globals.css** — Tailwind v4 source scan 변수 회피, design.md 시각 사양 1:1 재현.
6. **fade-in 애니메이션 / `prefers-reduced-motion` 분기 미적용** — plain `<img>` `onLoadingComplete` 콜백 없음 + 칩 즉시 노출이 design.md §3 loading 의도와 부합.
7. **strict 모드 옵션은 구현하되 기본 비활성** — alt 누락·외부 URL 이미지에 `console.warn`만. 빌드 실패는 추후 검토.

### 가정 사항 및 미구현 항목

**가정**
- alt 트리거 토큰은 정확히 ` (AI 생성 이미지)` (앞 공백 + 괄호 포함). 부분 일치 false positive 회피.
- 외부 절대 URL 이미지는 경고만, 빌드 실패 안 함.
- markdown image의 surrounding text가 같은 단락에 섞여 있으면 figure 변환 안 함 (`p > img only` 규칙).

**미구현**
- next/image 결합 / ArticleFigure React 컴포넌트 / fade-in 애니메이션 — 본 프로젝트 렌더 구조와 불일치 또는 dead code 회피.
- strict 모드 활성화 (alt 누락 빌드 실패) — 옵션 구현됨, 호출 측 비활성.
- P10 운영자 가이드 통합 문서 — phase-4.5 §3.1 P10 본체 미해결로 SOP만 단독 발행.
- 광고 슬롯 충돌 자동 검사 — 운영자 SOP 수동 항목으로 대체. P11/P12 이후 재논의.

---

## 코드 리뷰 결과

### Critical 이슈

**0건.** 즉시 수정 필요한 이슈 없음.

### Warning (수정 권장 / 일부 적용)

| # | 항목 | 처리 |
|---|------|------|
| 1 | articles.ts — sanitizeSchema 정의가 import 그룹을 가름 | refactor에서 적용 |
| 2 | rehype-article-figure.ts — 외부 URL 이미지 경고-only, 빌드 통과 | 동작 변경이라 refactor 범위 밖, 별도 의사결정 대기 |
| 3 | rehype-article-figure.ts — 입력 AST 직접 mutation | refactor에서 immutable shallow-copy로 전환 |

### Suggestion

- plugin 단위 테스트 부재 (vitest 셋업 없음) — E2E로만 검증.
- 마커 상수 `(AI 생성 이미지)`가 코드·SOP·발행 글에 듀얼 source.
- 광고 슬롯 충돌 자동 검사 미구현.
- spec.md §3 should "alt-칩 cross-check"는 칩이 alt에서만 derive되는 현재 구조에서 redundant.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 (2건 refactor 적용, 1건 동작 변경 보류) |
| Suggestion | 4건 (모두 보류) |

---

## 리팩토링 내용

### 작업 목록

1. **articles.ts — 모듈 상수 위치 정리**: `sanitizeSchema` 정의를 import 블록 사이에서 빼내 `ARTICLES_DIR` 옆으로 이동. 향후 import 정렬 도구 도입 시 자동 정렬 안정성 확보.
2. **rehype-article-figure.ts — 입력 AST mutation 제거**: `delete img.properties.title` → destructure로 title 제외한 새 properties + 새 cleanImg 노드. `node.children = transformChildren(...)` (입력 노드 직접 변형) → `{ ...node, children: ... }` shallow copy 후 push. 동일 hast 트리 재사용 시 사이드이펙트 방지 + 함수형 스타일로 단위 테스트 작성 용이.

### 스킵

- Warning #2 외부 URL 경고-only → strict throw: 동작 변경(빌드 통과/실패 변동)이라 refactor 범위 밖.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 2개 | 2개 (변동 없음) |
| 입력 AST mutation | 2곳 (delete + assignment) | 0곳 (immutable shallow copy) |
| 모듈 상수 import 블록 가름 | 1곳 | 0곳 |
| 동작 변경 | — | 없음 (빌드 산출 HTML + figure 구조 동일) |

빌드: 1회 시도, 성공.

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 6개 passed |
| Error/Validation | ✅ 3개 passed |
| 권한/인증 | — N/A (public 정적 페이지, 의도적 생략) |
| 반응형 (375px) | ✅ 2개 passed |
| **전체** | **11 passed / 0 failed** |

리팩토링 직후 재실행에서도 11/11 그대로 통과 (6.9s). 동작 보존 확인.

📊 상세 리포트: [playwright-report/index.html](../../playwright-report/index.html)
