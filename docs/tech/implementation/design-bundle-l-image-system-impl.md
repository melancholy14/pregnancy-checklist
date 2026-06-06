# design-bundle-l-image-system Implementation

> 구현일: 2026-05-10
> 관련 spec: [docs/features/design-bundle-l-image-system/spec.md](../../features/design-bundle-l-image-system/spec.md)
> 관련 design: [docs/features/design-bundle-l-image-system/design.md](../../features/design-bundle-l-image-system/design.md)

## 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| M1. `globals.css .article-prose` 이미지 토큰 (rounded-2xl + shadow-sm + my-6 + max-w-full) | ✅ | `.article-prose .article-figure__media img`에 `border-radius: 1rem` + `box-shadow: var(--shadow-sm)` 적용. figure max-width: 100%, margin 1.5em |
| M2. `rehype-article-figure` 확장 — width/height 자동 추출 + anchor 래핑 + figcaption suffix + 우상단 ExternalLink 분기 + focus-visible ring | ✅ | PNG·JPEG 헤더 인라인 파서로 width/height 추출 (image-size 라이브러리 대체 — 결정 사항 참조). anchor `target="_blank" rel="noopener noreferrer" aria-label="원본 이미지 새 창에서 보기"` |
| M3. `loading="lazy"` 일괄 적용 | ✅ | rehype 플러그인이 cleanImg에 `loading: "lazy"` 부착. LCP eager 분기는 should — 미구현 |
| M4. 발행 글 2건 빌드 검증 | ✅ | `npm run build` 성공, `weekly-prenatal-checklist.html` 출력에서 figure + img(width=1536, height=1024) + a(aria-label, target=_blank) + figcaption("... · AI 생성 · 원본 보기") 구조 확인 |
| M5. phase-4.5.md §2.11.2 IM-3 정의 정정 + §2.11.3 상태 갱신 | ✅ | IM-3 행을 plain `<img width=N height=N loading="lazy">` 다운스코프로 갱신, 묶음 L 상태를 ✅ 완료(2026-05-09)로 갱신 |
| M6. infra.md §3.2 연결 메모 | ✅ | `images.unoptimized` 제거 라인 옆에 design-bundle-l-image-system 라운드 다운스코프 메모 추가 |
| M7. `docs/content/image-sop.md` SOP 메모 (인포그래픽 우상단 회피 + markdown title 슬롯 권장) | ✅ | §4.1, §4.2 신규 섹션으로 추가 |

## 생성/수정 파일 목록

### 신규 생성

- 없음 — 기존 파일 확장만

### 수정

- `src/lib/markdown/rehype-article-figure.ts` — PNG/JPEG 헤더 파서(`readImageDimensions`) 추가, `<img>`를 `<a class="article-figure__link" target="_blank" rel="noopener noreferrer" aria-label>`로 래핑, `loading="lazy"` + width/height attribute 부착, figcaption suffix `· 원본 보기` 추가, figcaption 부재 시 `<span class="article-figure__external"><svg>...</svg></span>` 우상단 마커 분기, `createExternalLinkSvg` lucide ExternalLink 인라인 SVG hast 노드 생성
- `src/app/globals.css` — `.article-prose .article-figure` 블록 확장: `max-width: 100%`, `.article-figure__link { border-radius: 1rem; outline: none }` + `:focus-visible { box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--pastel-lavender) }`, `.article-figure__media img { border-radius: 1rem; box-shadow: var(--shadow-sm) }` (기존 0.5rem → 1rem 갱신), `.article-figure__external` 우상단 마커 스타일(`top: 8px; right: 8px; bg-foreground/60; padding: 4px; pointer-events: none`) 추가
- `docs/plan/phase-4.5.md` — §2.11.2 IM-3 행을 plain `<img>` width/height + `loading="lazy"` 다운스코프 정의로 갱신 + infra.md §3.2 링크 추가, §2.11.3 묶음 L 상태를 ✅ 완료(2026-05-09)로 갱신 + IM-1·IM-3·IM-5 결과 요약 + IM-6 별도 묶음 표시
- `docs/tech/infra.md` — §3.2 전환 체크리스트 `images.unoptimized` 제거 라인 옆에 next/image 마이그레이션 다운스코프(2026-05-09 design-bundle-l-image-system 라운드) + standalone 전환 시 일괄 처리 메모 추가
- `docs/content/image-sop.md` — §4.1 인포그래픽 우상단 영역 회피 SOP, §4.2 markdown title 슬롯 권장 메모 추가

## 주요 결정 사항

- **`image-size` 라이브러리 대신 인라인 PNG/JPEG 헤더 파서 사용**: 이유 — `package.json`에 없는 패키지를 새로 설치하지 않는 implement-feature 규칙. PNG는 IHDR 청크의 16~23바이트에 width/height가 big-endian uint32로 박혀 있고, JPEG는 SOF 마커(0xC0~0xCF, 단 0xC4·0xC8·0xCC 제외)에서 height(2B), width(2B)를 추출하면 충분. 발행 글 2건 모두 PNG, 외부 URL은 spec대로 width/height 미설정 fallback. 빌드 검증에서 `width="1536" height="1024"`로 정확 추출 확인. spec의 "image-size 라이브러리"는 **추출 결과(width/height attribute 부착)**를 의미하는 구현 수단이고 라이브러리 자체가 요구사항이 아님으로 해석.
- **focus-visible ring을 `box-shadow` 더블 stroke로 구현**: 이유 — anchor 자체는 `border-radius: 1rem`로 둥근 모서리이고, `outline`은 둥근 모서리를 따라가지 않는 브라우저가 있어 `box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--pastel-lavender)` 더블 그림자로 ring 표현. inner shadow가 background 색으로 ring offset 역할, outer가 lavender ring. design.md L85 토큰 정합.
- **figure 내 `<svg>`를 hast 노드로 직접 생성 (lucide-react import 없이)**: 이유 — rehype 플러그인은 빌드 타임 hast 변환 단계에서 동작하고 React 런타임이 아님. lucide-react는 React 컴포넌트 라이브러리이므로 hast 트리에 삽입 불가. lucide ExternalLink 아이콘의 24x24 viewBox path 3개를 hast `<svg><path>` 노드로 인라인. `xmlns`·`stroke-width`·`stroke-linecap` 등 SVG attribute는 property-information이 자동 케이스 매핑.
- **figcaption suffix를 항상 `· 원본 보기`로 부착 (분기 A)**: 이유 — spec M2 "figcaption 끝에 '· 원본 보기' 텍스트 suffix 추가"가 모든 figcaption-보유 케이스에 일괄 적용 명시. AI 마커 보유 시 P14의 ` · AI 생성` 다음에 ` · 원본 보기`가 붙어 "원본 캡션 · AI 생성 · 원본 보기" 형식. spec §4 엣지 케이스의 예시 ("주차별 핵심 검사 타임라인 · AI 생성 · 원본 보기")와 정합.
- **anchor `rel`을 배열(`["noopener", "noreferrer"]`)로 표현**: 이유 — hast property-information에서 `rel` 속성은 space-separated tokens 타입이라 배열로 받으면 직렬화 시 `rel="noopener noreferrer"`로 자동 합쳐짐. 문자열로 박으면 토큰 분리가 안 되어 일부 sanitizer가 거부할 가능성. 빌드 출력에서 `rel="noopener noreferrer"` 정확 직렬화 확인.

## 가정 사항

- **발행 글 2건 모두 markdown title 슬롯 보유** (분기 A 케이스): `weekly-prenatal-checklist.md`와 `prenatal-insurance-preparation-guide.md` 둘 다 `![alt](src "caption")` 형식으로 캡션 보유. 분기 B(figcaption 부재 + 우상단 ExternalLink) 케이스는 신규 글에서 발현 가능 — 빌드 검증은 분기 A만 자동 통과, 분기 B는 운영자가 신규 글 작성 시 검증 필요.
- **`public/articles/<slug>.webp` 파일 경로 매핑**: rehype 플러그인이 `process.cwd() + '/public' + src`로 파일 시스템 접근. Next.js 빌드는 프로젝트 루트에서 실행되므로 안전. 다른 프레임워크/스크립트에서 호출 시 cwd 가정 깨질 수 있음.
- **rehype-sanitize 단계가 article-figure 이전 실행**: `articles.ts:97-99` 파이프라인 순서가 sanitize → article-figure → stringify. 따라서 article-figure가 출력하는 anchor·SVG·className·aria-label 등은 sanitize 영향 없음.
- **PNG·JPEG 외 포맷 미지원**: WebP, AVIF, GIF 등은 width/height 미설정 fallback + 콘솔 경고. 발행 글 정책상 PNG만 사용하므로 현 시점 영향 없음.

## 미구현 항목

- **LCP 이미지 eager 분기** (should): article 페이지 첫 번째 본문 이미지를 `loading="eager"`로 분기하는 작업. spec.md §3 should — 본 라운드는 lazy 일괄 적용으로 마감, Lighthouse 검증 후 별도 라운드에서 도입.
- **분기 B (figcaption 부재) 빌드 검증**: 발행 글 2건이 모두 caption 보유라 분기 B의 우상단 ExternalLink 아이콘 표시는 unit/e2e 테스트 없이 코드 경로만 검증. 향후 e2e 테스트 추가 시 caption 없는 fixture 필요.
- **외부 이미지(http/https) 빌드 차단**: spec §4 엣지 케이스에서 "빌드는 차단하지 않음(P14 패턴 정합 — strict 옵션 false 유지)"으로 박힘. 경고 로그만 동작.
