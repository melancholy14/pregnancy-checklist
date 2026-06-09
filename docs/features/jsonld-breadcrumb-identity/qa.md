# jsonld-breadcrumb-identity 테스트 전략

> 작성일: 2026-06-08  size: M
> 관련 리뷰: [review.md](./review.md)
> 관련 기획: [spec.md](./spec.md)
> 페르소나 SoT: [docs/qa/persona.md](../../qa/persona.md)

> **이 문서는 `/feature-pipeline` 안의 `write-unit-tests` · `write-e2e-tests` 스킬이 입력으로 읽습니다.**
> 여기서 모호한 결정은 그대로 테스트 코드의 모호함으로 박힙니다.

## review.md 결정사항 참조

- **결정 4 (E2E 가드 옵션 B)**: unit (`getBreadcrumbForPath`) + 샘플 4 페이지 E2E + fs-level grep 가드 1 개. fs-level 가드는 next build 결과의 모든 indexable `.html` 에 `@type":"BreadcrumbList"` 1 회 이상 등장 검증.
- **결정 3 (라벨 SoT 옵션 B)**: 라벨 SoT 는 `src/lib/breadcrumb-labels.ts` 의 정적 객체. `getBreadcrumbForPath` 시그니처는 pathname + articleMeta 주입형 → mock 0 으로 unit testable.
- **결정 2 (SearchAction 자동)**: WebSite 는 박되 SearchAction 은 박지 않음. E2E 단언 시 WebSite 의 SearchAction 필드 부재를 가드.
- **결정 1 (Person 최소판 옵션 A)**: Person 은 `name + url` 만. sameAs · image · description 부재 가드 (cargo cult markup 영구화 방지를 위한 명시 단언 — sameAs 가 부지불식간에 추가되어 측정 효과 분리가 어려워지는 회귀 방지).

## 1. 기존 테스트 영향 분석

### 1.1 스캔 결과

이 기능이 수정/추가하는 파일은 spec.md §7 기준. 그 파일·라우트를 import / 방문하는 기존 테스트:

| 영향받는 테스트 파일 | 어떤 부분이 영향받나 | 깨질 가능성 | 수정 방향 |
|---|---|---|---|
| `e2e/seo-sitemap-article-jsonld.spec.ts:29` | `page.locator('script[type="application/ld+json"]').first()` 가 layout 의 WebSite 를 가리키게 되어 Article 단언 실패 | **확실히 깨짐** | `.first()` 제거 → 모든 ld+json 파싱 후 `@type === "Article"` filter 로 강화. spec.md §3.must 1 의 article 페이지 통합 시 함께 갱신. |
| `e2e/seo-faq-jsonld.spec.ts:142-151` | "첫 번째 ld+json script 는 Article 타입 유지 (주입 순서 가드)" 단언이 layout 의 WebSite 가 먼저 박혀 실패 | **확실히 깨짐** | 가드 의도 자체를 갱신: "Article 과 FAQPage 가 둘 다 등장" 단언으로 약화 X — 대신 `@type === "Article"` filter 후 `.length === 1` 단언. 주입 순서 가정 제거. |
| `e2e/seo-faq-jsonld.spec.ts:49-91` (FAQPage 본문 단언) | `script[type="application/ld+json"]` 전체 array 에서 `@type === "FAQPage"` filter 후 단언 — 이미 filter 패턴이므로 영향 없음 | 낮음 | 변경 불필요 |
| `e2e/lighthouse-seo.spec.ts` | structured data 검증 항목이 layout 의 신규 WebSite/Person 을 어떻게 처리하나 확인 필요 | 중간 | grep 으로 ld+json 패턴 확인 — Lighthouse 자체는 schema validity 만 보므로 새 schema 도 통과 예상. fail 시 보강. |
| `src/lib/__tests__/*.test.ts` | breadcrumb-labels 신규 모듈 import 없음 | 영향 없음 | - |
| `src/store/__tests__/*.test.ts` | store 변경 없음 | 영향 없음 | - |

### 1.2 데이터·schema 변경 점검

- localStorage schema 변경: **N**
- Zustand store 모양 변경: **N**
- `src/data/*.json` 구조 변경: **N**

→ migration 핸들러 불필요. 기존 E2E 시드 데이터 호환성 영향 없음.

### 1.3 회귀 가드와 충돌 점검

- `e2e/design-bundle-cleanup-round.spec.ts` (fs-level grep) 가 잡는 패턴(`shadow-md` · `→` 화살표 · raw hex 등): **N**
  - 신규 컴포넌트 `BreadcrumbJsonLd` 는 시각 컴포넌트 아니라 JSON-LD script 만 렌더 → 디자인 가드와 충돌 없음.
- `e2e/seo-faq-jsonld.spec.ts` 의 "주입 순서 가드" 약화 트리거: **Y** (§1.1 표 2번째 줄). 그러나 약화 X — 가드 의도를 "Article 1 개 정확히 존재" 로 갱신해 강화 방향으로 처리. QA 페르소나 §7.4 "가드 우회 금지" 정신 유지.

### 1.4 영향 요약

- 갱신 필요한 기존 테스트: **2 개** (`seo-sitemap-article-jsonld.spec.ts`, `seo-faq-jsonld.spec.ts`) — 둘 다 `.first()` / 주입 순서 가정 제거하고 `@type` filter 강화.
- 신규 테스트 작성 대상:
  - unit 1 개: `src/lib/__tests__/breadcrumb-labels.test.ts`
  - e2e 1 개: `e2e/seo-breadcrumb-jsonld.spec.ts` (샘플 4 페이지 + fs-level grep 가드)
- 합계 (`/feature-pipeline` 의 write 단계 작업량): **4 개** (갱신 2 + 신규 2)

## 2. 테스트 레이어 분류

| 시나리오 (spec §2) | 레이어 | 근거 |
|---|---|---|
| 시나리오 1: 글 페이지 SERP breadcrumb 노출 | **e2e (article 샘플)** + **unit (`getBreadcrumbForPath('/articles/foo', {title, slug})`)** | unit: 라벨 매핑 + article meta 합성 검증. e2e: layout 의 WebSite/Person 과 article 의 BreadcrumbList 가 같은 페이지에 공존 + 순서 검증. |
| 시나리오 2: 체크리스트 SERP breadcrumb 노출 | **e2e (checklist 샘플)** + **unit (`getBreadcrumbForPath('/checklist/hospital-bag')`)** | unit: 3-level breadcrumb 매핑 검증. e2e: 실제 빌드 페이지에서 JSON-LD 추출·단언. |
| 시나리오 3: 13 라우트 일관성 (전수) | **fs-level grep 가드** | E2E 13 개 작성은 §3.4 mock 룰 위반 + 1 인 운영자 ROI 위반. fs-level grep 1 개로 갈음. |
| 시나리오 4: 루트 WebSite + Person | **e2e (루트 1 페이지)** | unit 으로 단언할 입력·출력 없음 — layout 정적 렌더이므로 e2e 1 회 단언이 정답. |

## 3. Unit 테스트 대상

### 3.1 대상 함수

- `src/lib/breadcrumb-labels.ts::getBreadcrumbForPath` — pathname + 선택적 articleMeta 입력 → BreadcrumbItem 배열 출력. — (신규)
- `src/lib/breadcrumb-labels.ts::BREADCRUMB_LABELS` — 정적 객체 자체는 테스트 안 함 (상수). 함수 동작 통해 간접 검증.

### 3.2 케이스 매트릭스

| 유형 | 케이스 |
|---|---|
| Happy Path | (1) `/` → `[{position:1, name:"홈", item:BASE_URL+"/"}]` (2) `/checklist/hospital-bag` → 3-level: 홈 > 체크리스트 > 출산가방 체크리스트 (3) `/articles/foo` + `{title:"테스트 글", slug:"foo"}` → 3-level: 홈 > 정보 & 가이드 > 테스트 글 |
| Boundary | (4) `/articles/unknown` + articleMeta 미주입 → 빈 배열 (article 라우트인데 meta 없으면 BreadcrumbList JSON-LD 자체 생성 X) (5) `/unknown-route` → 빈 배열 (6) `/articles/[slug]` 동적 패턴이 `/articles` 정적과 충돌하지 않음 (priority 검증) |
| Priority | (7) 같은 prefix 가진 두 라우트(`/checklist` vs `/checklist/hospital-bag`) 가 각자 다른 breadcrumb 반환 — 정확 매치 우선 |
| Invariant | (8) 반환 배열의 position 필드는 1 부터 N 까지 연속, 중복 없음. item URL 은 모두 `BASE_URL` 로 시작 |

### 3.3 시간 의존 함수 점검

- `new Date()` 호출 없음. **N**
- → 시간 주입 리팩토링 불필요.

### 3.4 mock 점검

- 필요한 mock 개수: **0** (pathname + articleMeta 모두 unit 입력으로 직접 주입).
- → unit 후보 확정.

## 4. E2E 테스트 대상

### 4.1 describe 블록

`e2e/seo-breadcrumb-jsonld.spec.ts` 신규 작성:

- **Happy Path — 샘플 4 페이지**: 각 페이지 진입 시 BreadcrumbList JSON-LD 1 개 존재, position 1~N 연속, item URL 절대값 검증.
  1. `/` (루트, position 1 단일)
  2. `/articles/early-pregnancy-tests` (article 샘플, 3-level)
  3. `/checklist/hospital-bag` (checklist sub, 3-level)
  4. `/about` (정적 페이지, 2-level)
- **Layout 주입 검증 (시나리오 4)**: `/` 진입 시 `@type === "WebSite"` JSON-LD 1 개 + `@type === "Person"` JSON-LD 1 개 존재. WebSite 는 `name + url + alternateName` 3 필드만, SearchAction 부재. Person 은 `name + url` 만, sameAs · image · description 부재 (결정 1·2 가드).
- **Layout 상속 검증**: article 페이지 1 개 (`/articles/early-pregnancy-tests`) 에서 layout 의 WebSite/Person + 페이지의 Article/FAQPage/BreadcrumbList 가 모두 동시에 존재.
- **fs-level grep 가드**: `next build` 결과의 indexable `.html` 13 개(spec.md §3.must 3 목록) 각각에 `@type":"BreadcrumbList"` 가 1 회 이상 등장. redirect 4 개 페이지에는 등장하지 않음.

### 4.2 갱신 대상 기존 spec

- `e2e/seo-sitemap-article-jsonld.spec.ts:29`: `const handle = await page.locator('script[type="application/ld+json"]').first();` → 전체 array 파싱 후 `@type === "Article"` filter 로 변경. line 53 의 `expect(jsonLd["@type"]).toBe("Article")` 단언은 filter 결과의 단일 element 대상으로 유지.
- `e2e/seo-faq-jsonld.spec.ts:142-151`: "5개 글 모두 첫 번째 ld+json script 는 Article 타입 유지 (주입 순서 가드)" 가드의 의도 갱신 — 주입 순서 검증 → "Article 타입의 ld+json script 가 정확히 1 개 존재" 검증으로 변경. 약화 X (오히려 strict 강화).

### 4.3 회귀 가드

이 feature 가 깨뜨릴 수 있는 기존 회귀:
- `seo-faq-jsonld` 의 "Article + FAQPage 동시 존재" 가드 — `e2e/seo-breadcrumb-jsonld.spec.ts` 의 "Layout 상속 검증" 케이스에서 동일 페이지의 5 종 JSON-LD(WebSite/Person/Article/FAQPage/BreadcrumbList) 공존을 단언함으로써 보강.

### 4.4 시드 데이터·초기 상태

- localStorage 시드 필요 없음 — JSON-LD 는 동의 게이트와 무관.
- 쿠키 동의 상태 무관 (테스트는 default `denied` 로 진행 가능).
- 라우트 진입 경로: `page.goto(BASE_URL + '<route>')` 로 직접 진입.

### 4.5 GA4 이벤트 검증

해당 없음 — 이 PR 은 GA4 이벤트 변경 0.

## 5. Skip / Defer

| 항목 | 보류 이유 | 제거 조건 | 제거 deadline |
|---|---|---|---|
| (없음) | - | - | - |

> 결정 1 옵션 A 의 cargo cult markup 컨텍스트는 skip 으로 다루지 않음. sameAs 부재를 명시 단언함으로써 회귀 가드로 처리 (§4.1 "Layout 주입 검증").

## 6. 성공 기준

- Unit: 8 개 케이스 (§3.2) 모두 통과. 소요 < 500ms.
- E2E: 3 개 describe + 1 개 fs-level 가드 (§4.1) 모두 통과. flaky retry 0 회.
- §1.1 갱신 대상 기존 e2e 2 개 (`seo-sitemap-article-jsonld`, `seo-faq-jsonld`) 갱신 후 통과 (회귀 0).
- spec.md §2 시나리오 4 개 전수가 §2 매트릭스에 매핑됨 (cross-check 통과).
- `next build` 결과 fs-level grep: indexable 13 개 페이지에 BreadcrumbList 등장, redirect 4 개 페이지에 등장하지 않음.
