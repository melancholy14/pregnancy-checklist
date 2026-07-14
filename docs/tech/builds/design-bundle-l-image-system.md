# design-bundle-l-image-system

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-05-10
> plan: [spec](../../features/design-bundle-l-image-system/spec.md) · [design](../../features/design-bundle-l-image-system/design.md)

<!-- STEP:impl -->
## 구현

> 구현일: 2026-05-10
> 관련 spec: [docs/features/design-bundle-l-image-system/spec.md](../../features/design-bundle-l-image-system/spec.md)
> 관련 design: [docs/features/design-bundle-l-image-system/design.md](../../features/design-bundle-l-image-system/design.md)

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| M1. `globals.css .article-prose` 이미지 토큰 (rounded-2xl + shadow-sm + my-6 + max-w-full) | ✅ | `.article-prose .article-figure__media img`에 `border-radius: 1rem` + `box-shadow: var(--shadow-sm)` 적용. figure max-width: 100%, margin 1.5em |
| M2. `rehype-article-figure` 확장 — width/height 자동 추출 + anchor 래핑 + figcaption suffix + 우상단 ExternalLink 분기 + focus-visible ring | ✅ | PNG·JPEG 헤더 인라인 파서로 width/height 추출 (image-size 라이브러리 대체 — 결정 사항 참조). anchor `target="_blank" rel="noopener noreferrer" aria-label="원본 이미지 새 창에서 보기"` |
| M3. `loading="lazy"` 일괄 적용 | ✅ | rehype 플러그인이 cleanImg에 `loading: "lazy"` 부착. LCP eager 분기는 should — 미구현 |
| M4. 발행 글 2건 빌드 검증 | ✅ | `npm run build` 성공, `weekly-prenatal-checklist.html` 출력에서 figure + img(width=1536, height=1024) + a(aria-label, target=_blank) + figcaption("... · AI 생성 · 원본 보기") 구조 확인 |
| M5. phase-4.5.md §2.11.2 IM-3 정의 정정 + §2.11.3 상태 갱신 | ✅ | IM-3 행을 plain `<img width=N height=N loading="lazy">` 다운스코프로 갱신, 묶음 L 상태를 ✅ 완료(2026-05-09)로 갱신 |
| M6. infra.md §3.2 연결 메모 | ✅ | `images.unoptimized` 제거 라인 옆에 design-bundle-l-image-system 라운드 다운스코프 메모 추가 |
| M7. `docs/content/image-sop.md` SOP 메모 (인포그래픽 우상단 회피 + markdown title 슬롯 권장) | ✅ | §4.1, §4.2 신규 섹션으로 추가 |

### 생성/수정 파일 목록

#### 신규 생성

- 없음 — 기존 파일 확장만

#### 수정

- `src/lib/markdown/rehype-article-figure.ts` — PNG/JPEG 헤더 파서(`readImageDimensions`) 추가, `<img>`를 `<a class="article-figure__link" target="_blank" rel="noopener noreferrer" aria-label>`로 래핑, `loading="lazy"` + width/height attribute 부착, figcaption suffix `· 원본 보기` 추가, figcaption 부재 시 `<span class="article-figure__external"><svg>...</svg></span>` 우상단 마커 분기, `createExternalLinkSvg` lucide ExternalLink 인라인 SVG hast 노드 생성
- `src/app/globals.css` — `.article-prose .article-figure` 블록 확장: `max-width: 100%`, `.article-figure__link { border-radius: 1rem; outline: none }` + `:focus-visible { box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--pastel-lavender) }`, `.article-figure__media img { border-radius: 1rem; box-shadow: var(--shadow-sm) }` (기존 0.5rem → 1rem 갱신), `.article-figure__external` 우상단 마커 스타일(`top: 8px; right: 8px; bg-foreground/60; padding: 4px; pointer-events: none`) 추가
- `docs/plan/phase-4.5.md` — §2.11.2 IM-3 행을 plain `<img>` width/height + `loading="lazy"` 다운스코프 정의로 갱신 + infra.md §3.2 링크 추가, §2.11.3 묶음 L 상태를 ✅ 완료(2026-05-09)로 갱신 + IM-1·IM-3·IM-5 결과 요약 + IM-6 별도 묶음 표시
- `docs/tech/infra.md` — §3.2 전환 체크리스트 `images.unoptimized` 제거 라인 옆에 next/image 마이그레이션 다운스코프(2026-05-09 design-bundle-l-image-system 라운드) + standalone 전환 시 일괄 처리 메모 추가
- `docs/content/image-sop.md` — §4.1 인포그래픽 우상단 영역 회피 SOP, §4.2 markdown title 슬롯 권장 메모 추가

### 주요 결정 사항

- **`image-size` 라이브러리 대신 인라인 PNG/JPEG 헤더 파서 사용**: 이유 — `package.json`에 없는 패키지를 새로 설치하지 않는 implement-feature 규칙. PNG는 IHDR 청크의 16~23바이트에 width/height가 big-endian uint32로 박혀 있고, JPEG는 SOF 마커(0xC0~0xCF, 단 0xC4·0xC8·0xCC 제외)에서 height(2B), width(2B)를 추출하면 충분. 발행 글 2건 모두 PNG, 외부 URL은 spec대로 width/height 미설정 fallback. 빌드 검증에서 `width="1536" height="1024"`로 정확 추출 확인. spec의 "image-size 라이브러리"는 **추출 결과(width/height attribute 부착)**를 의미하는 구현 수단이고 라이브러리 자체가 요구사항이 아님으로 해석.
- **focus-visible ring을 `box-shadow` 더블 stroke로 구현**: 이유 — anchor 자체는 `border-radius: 1rem`로 둥근 모서리이고, `outline`은 둥근 모서리를 따라가지 않는 브라우저가 있어 `box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--pastel-lavender)` 더블 그림자로 ring 표현. inner shadow가 background 색으로 ring offset 역할, outer가 lavender ring. design.md L85 토큰 정합.
- **figure 내 `<svg>`를 hast 노드로 직접 생성 (lucide-react import 없이)**: 이유 — rehype 플러그인은 빌드 타임 hast 변환 단계에서 동작하고 React 런타임이 아님. lucide-react는 React 컴포넌트 라이브러리이므로 hast 트리에 삽입 불가. lucide ExternalLink 아이콘의 24x24 viewBox path 3개를 hast `<svg><path>` 노드로 인라인. `xmlns`·`stroke-width`·`stroke-linecap` 등 SVG attribute는 property-information이 자동 케이스 매핑.
- **figcaption suffix를 항상 `· 원본 보기`로 부착 (분기 A)**: 이유 — spec M2 "figcaption 끝에 '· 원본 보기' 텍스트 suffix 추가"가 모든 figcaption-보유 케이스에 일괄 적용 명시. AI 마커 보유 시 P14의 ` · AI 생성` 다음에 ` · 원본 보기`가 붙어 "원본 캡션 · AI 생성 · 원본 보기" 형식. spec §4 엣지 케이스의 예시 ("주차별 핵심 검사 타임라인 · AI 생성 · 원본 보기")와 정합.
- **anchor `rel`을 배열(`["noopener", "noreferrer"]`)로 표현**: 이유 — hast property-information에서 `rel` 속성은 space-separated tokens 타입이라 배열로 받으면 직렬화 시 `rel="noopener noreferrer"`로 자동 합쳐짐. 문자열로 박으면 토큰 분리가 안 되어 일부 sanitizer가 거부할 가능성. 빌드 출력에서 `rel="noopener noreferrer"` 정확 직렬화 확인.

### 가정 사항

- **발행 글 2건 모두 markdown title 슬롯 보유** (분기 A 케이스): `weekly-prenatal-checklist.md`와 `prenatal-insurance-preparation-guide.md` 둘 다 `![alt](src "caption")` 형식으로 캡션 보유. 분기 B(figcaption 부재 + 우상단 ExternalLink) 케이스는 신규 글에서 발현 가능 — 빌드 검증은 분기 A만 자동 통과, 분기 B는 운영자가 신규 글 작성 시 검증 필요.
- **`public/articles/<slug>.webp` 파일 경로 매핑**: rehype 플러그인이 `process.cwd() + '/public' + src`로 파일 시스템 접근. Next.js 빌드는 프로젝트 루트에서 실행되므로 안전. 다른 프레임워크/스크립트에서 호출 시 cwd 가정 깨질 수 있음.
- **rehype-sanitize 단계가 article-figure 이전 실행**: `articles.ts:97-99` 파이프라인 순서가 sanitize → article-figure → stringify. 따라서 article-figure가 출력하는 anchor·SVG·className·aria-label 등은 sanitize 영향 없음.
- **PNG·JPEG 외 포맷 미지원**: WebP, AVIF, GIF 등은 width/height 미설정 fallback + 콘솔 경고. 발행 글 정책상 PNG만 사용하므로 현 시점 영향 없음.

### 미구현 항목

- **LCP 이미지 eager 분기** (should): article 페이지 첫 번째 본문 이미지를 `loading="eager"`로 분기하는 작업. spec.md §3 should — 본 라운드는 lazy 일괄 적용으로 마감, Lighthouse 검증 후 별도 라운드에서 도입.
- **분기 B (figcaption 부재) 빌드 검증**: 발행 글 2건이 모두 caption 보유라 분기 B의 우상단 ExternalLink 아이콘 표시는 unit/e2e 테스트 없이 코드 경로만 검증. 향후 e2e 테스트 추가 시 caption 없는 fixture 필요.
- **외부 이미지(http/https) 빌드 차단**: spec §4 엣지 케이스에서 "빌드는 차단하지 않음(P14 패턴 정합 — strict 옵션 false 유지)"으로 박힘. 경고 로그만 동작.

---

<!-- STEP:review -->
## 코드 리뷰

> 리뷰일: 2026-05-10
> 관련 spec: [docs/features/design-bundle-l-image-system/spec.md](../../features/design-bundle-l-image-system/spec.md)
> 관련 impl: [docs/implementation/design-bundle-l-image-system-impl.md](#구현)

### 리뷰 대상 파일

- `src/lib/markdown/rehype-article-figure.ts` — PNG/JPEG 헤더 파서 + figure 변환 확장 (anchor 래핑, lazy, ExternalLink 분기, suffix)
- `src/app/globals.css` — `.article-figure*` 토큰 + focus-visible ring CSS

(docs/plan/phase-4.5.md, docs/tech/infra.md, docs/content/image-sop.md 는 문서 갱신이라 코드 리뷰 범위 밖)

---

### Critical 이슈 (즉시 수정 완료)

**없음.** 4가지 관점(타입 안전성·성능·보안·접근성) 모두 사용자 피해 또는 런타임 크래시로 이어지는 결함 발견되지 않음.

---

### Warning (수정 권장)

#### 1. `rehype-article-figure.ts` — `path.join` 정규화로 인한 빌드 타임 path traversal 가능성

- **위치**: [src/lib/markdown/rehype-article-figure.ts:21](../../../src/lib/markdown/rehype-article-figure.ts#L21)
- **문제**: `src` 값이 `"/../../etc/passwd"` 같은 형식이면 `path.join(PUBLIC_DIR, src)`가 `..`를 정규화하여 PUBLIC_DIR 바깥 파일을 읽을 수 있음. 결과가 PNG/JPEG 헤더 검사를 통과하지 않으면 `undefined`를 반환하므로 실제 정보 누설은 0이지만, 빌드 머신에서 임의 파일 read syscall이 발생.
- **권장 수정**: `fs.readFileSync` 호출 직전에 정규화된 절대 경로가 `PUBLIC_DIR`로 시작하는지 검증.
  ```ts
  const filePath = path.normalize(path.join(PUBLIC_DIR, src));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    console.warn(`[rehype-article-figure] image path escape blocked: ${src}`);
    return undefined;
  }
  ```
- **신뢰 경계**: 빌드 타임 입력은 운영자 1인이 작성하는 markdown이므로 신뢰 경계 안. 실 위험 매우 낮음 — 방어적 코딩 차원의 권장.

#### 2. `globals.css` — `outline: none` + focus-visible box-shadow가 focus-visible 미지원 환경에서 키보드 포커스 미표시

- **위치**: [src/app/globals.css:396](../../../src/app/globals.css#L396)
- **문제**: `.article-figure__link { outline: none }`로 기본 outline을 제거하고 `:focus-visible` 의사 클래스에서만 box-shadow ring으로 대체. focus-visible를 미지원하는 브라우저(예: IE 11, 일부 구버전 모바일 브라우저)에서는 키보드 사용자가 anchor에 포커스되었는지 시각적으로 인식 불가.
- **권장 수정**: focus-visible 미지원 폴백으로 일반 `:focus`에도 ring 적용 후, `:focus:not(:focus-visible)`로 마우스 클릭 시 ring 제거 (modern 패턴).
  ```css
  .article-figure__link:focus { box-shadow: ...; }
  .article-figure__link:focus:not(:focus-visible) { box-shadow: none; }
  .article-figure__link:focus-visible { box-shadow: ...; }
  ```
- **타겟 브라우저**: 본 프로젝트는 modern 브라우저만 지원하면 acceptable. Chrome 86+ / Safari 15.4+ / Firefox 85+ 모두 focus-visible 지원.

---

### Suggestion (개선 아이디어)

#### 1. `rehype-article-figure.ts` — 이미지 dimension 캐싱

같은 이미지가 여러 글에 등장할 때 빌드 타임마다 `fs.readFileSync` 반복. `Map<src, ImageDimensions>` 모듈 스코프 캐시로 disk I/O 절감 가능. 현재 발행 글 2건 + figure 1개씩이라 영향 미미하지만 콘텐츠 증가 시 빌드 시간 단축에 기여.

#### 2. `rehype-article-figure.ts` — PNG/JPEG 헤더만 부분 읽기

PNG는 첫 24바이트, JPEG는 SOF 마커까지만 필요. `fs.readFileSync`로 전체 파일을 메모리에 로딩하는 대신 `fs.openSync` + `fs.readSync(buffer, 0, N, 0)`로 부분 읽기 시 빌드 타임 메모리 사용량 감소. 1MB 이미지 2건 환경에서는 무의미한 최적화이고, 코드 복잡도 증가만 초래할 수 있음.

#### 3. `rehype-article-figure.ts` — `createExternalLinkSvg()`를 모듈 상수로 추출

매 호출마다 동일한 hast 노드 객체를 새로 생성. 다만 hast tree는 노드 mutation을 허용하므로 동일 인스턴스 공유 시 다른 plugin이 변경할 위험. 안전을 위해 매번 새로 생성하는 현 패턴이 합리적 — 변경 권장하지 않음.

#### 4. `rehype-article-figure.ts` — 외부 URL 이미지에도 width/height 운영자 수기 입력 옵션

현재 외부 URL은 width/height 미설정이라 CLS 0 보장 불가. spec §3 should의 외부 이미지 처리 항목과 정합. markdown title 슬롯 외 별도 메타 (예: 확장 syntax `![alt](src "caption" 720x480)`)로 운영자가 명시할 수 있으면 외부 이미지도 CLS 0 달성. 단 운영자 SOP에 외부 이미지 비권장이 이미 박혀 있어 우선순위 낮음.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 완료 |
| Warning | 2건 |
| Suggestion | 4건 |
| 빌드 | 미실행 (Critical 없음) |

---

<!-- STEP:refactor -->
## 리팩토링

> 리팩토링일: 2026-05-10
> 관련 review: [docs/review/design-bundle-l-image-system-review.md](#코드-리뷰)

### 리팩토링한 파일 목록

- `src/lib/markdown/rehype-article-figure.ts` — path traversal 방어 추가
- `src/app/globals.css` — focus / focus-visible 폴백 패턴 적용

(추가 판단 항목 없음 — 중복·큰 컴포넌트·커스텀 훅·과다 메모이제이션 모두 해당 없음)

---

### 작업별 내용

#### 1. `rehype-article-figure.ts` — path traversal 방어

- **출처**: Warning 1
- **무엇을**: `readImageDimensions()` 내부에서 `fs.readFileSync` 호출 직전에 정규화된 절대 경로가 `PUBLIC_DIR + path.sep`로 시작하는지 검증. 검증 실패 시 경고 로그 + `undefined` 반환으로 fallback 분기. `path.join`을 `path.normalize(path.join(...))`로 감싸 `..` 정규화 결과를 명시적으로 검사.
- **왜**: `src` 값이 `"/../../etc/passwd"` 형식이면 빌드 머신에서 PUBLIC_DIR 바깥 파일에 read syscall이 발생할 가능성. 결과가 PNG/JPEG 헤더 검사를 통과하지 않으면 width/height attribute에 실 정보 누설은 0이지만, 방어적 코딩으로 외부 파일 접근 자체를 차단. 신뢰 경계는 운영자 1인이라 실 위험 매우 낮지만 보안 경계 명확화에 기여.

#### 2. `globals.css` — focus / focus-visible 폴백 패턴

- **출처**: Warning 2
- **무엇을**: 기존 `.article-figure__link { outline: none }` + `:focus-visible { box-shadow: ... }` 조합을 다음 3단 패턴으로 확장:
  1. `:focus` — outline 제거 + box-shadow ring (focus-visible 미지원 환경 대상 폴백)
  2. `:focus:not(:focus-visible)` — box-shadow 제거 (focus-visible 지원 + 마우스 클릭 시 ring 안 보이게)
  3. `:focus-visible` — outline 제거 + box-shadow ring (focus-visible 지원 + 키보드 포커스)
- **왜**: focus-visible를 미지원하는 브라우저에서도 키보드 사용자가 anchor 포커스를 시각적으로 인식. 동시에 modern 브라우저의 focus-visible 동작(키보드만 ring 표시, 마우스 클릭은 ring 미표시)도 보존. WCAG 2.1 AA 키보드 도달 가시성을 더 넓은 환경에서 충족.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 2개 | 2개 (변동 없음) |
| `rehype-article-figure.ts` 줄 수 | 270줄 | 275줄 (+5: path 검증 분기) |
| `globals.css` `.article-figure__link` 블록 줄 수 | 11줄 | 22줄 (+11: 3단 focus 폴백) |
| Warning 처리 | 0/2 | 2/2 ✅ |
| 동작 변경 | 없음 (구조·폴백만 추가) |

---

### 빌드 결과

성공 (1회 시도). TypeScript 타입 검사 통과, static export 32 페이지 생성 완료.
