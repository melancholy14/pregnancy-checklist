# P14: AI 생성 이미지 표시 의무 — Implementation

> 작성일: 2026-05-07
> 관련 스펙: [docs/features/p14-ai-image-label/spec.md](../features/p14-ai-image-label/spec.md)
> 관련 디자인: [docs/features/p14-ai-image-label/design.md](../features/p14-ai-image-label/design.md)
> 관련 리뷰: [docs/features/p14-ai-image-label/review.md](../features/p14-ai-image-label/review.md)

## 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 발행된 글 2건 인포그래픽이 figure + 워터마크 칩(우하단) + figcaption(`· AI 생성`) + alt(`(AI 생성 이미지)`)로 렌더 | ✅ 완료 | [weekly-prenatal-checklist.md:41](../../src/content/articles/weekly-prenatal-checklist.md#L41), [prenatal-insurance-preparation-guide.md:20](../../src/content/articles/prenatal-insurance-preparation-guide.md#L20) — 빌드 출력 HTML에서 figure 구조 확인 |
| 신규 글 작성 시 alt 컨벤션만 따르면 후처리 0 | ✅ 완료 | rehype-article-figure 플러그인이 빌드 타임에 alt 마커 감지 후 자동 부착 |
| 운영자 SOP 1장이 P10 운영자 가이드 통합 위치에 존재 | ✅ 부분 완료 | P10 통합 문서 자체는 미정. 본 SOP는 [docs/content/image-sop.md](../content/image-sop.md) 단독 문서로 작성, P10 통합 시 흡수 예정 |

## 생성/수정 파일 목록

### 신규 생성
- [src/lib/markdown/rehype-article-figure.ts](../../src/lib/markdown/rehype-article-figure.ts) — rehype 플러그인. hast 트리에서 image-only 단락(`<p><img></p>`)을 찾아 `<figure class="article-figure">` 구조로 치환. alt에 `(AI 생성 이미지)` 마커가 있으면 워터마크 칩 + figcaption 자동 부착. alt 누락 시 콘솔 경고, 외부 절대 URL 이미지도 경고.
- [docs/content/image-sop.md](../content/image-sop.md) — 운영자 이미지 SOP. 표시 트리거 1줄 룰, 도구별 분류 표(빈 칸 락인 회피), 신규 도구 도입 시 IPTC 검증 절차, 광고 슬롯 충돌 회피, 발행 체크리스트.
- [docs/implementation/p14-ai-image-label-impl.md](./p14-ai-image-label-impl.md) — 본 문서.

### 수정
- [src/lib/articles.ts](../../src/lib/articles.ts) — `getArticleBySlug` remark 파이프라인에 `rehypeArticleFigure`를 추가. `rehypeSanitize` **뒤**에 위치(이유: §주요 결정 사항 1).
- [src/app/globals.css](../../src/app/globals.css) — `.article-prose` 하위에 `.article-figure`, `.article-figure__media`, `.article-figure__chip`, `.article-figure__caption` 4개 셀렉터 추가. 기존 prose 토큰(`--prose-muted`)과 root 토큰(`#3D4447` foreground 60% alpha)만 사용, 새 hex 인라인 없음.
- [src/content/articles/weekly-prenatal-checklist.md](../../src/content/articles/weekly-prenatal-checklist.md) — 41번 줄 인포그래픽 alt 끝에 ` (AI 생성 이미지)` 후행 추가.
- [src/content/articles/prenatal-insurance-preparation-guide.md](../../src/content/articles/prenatal-insurance-preparation-guide.md) — 20번 줄 이미지 alt 끝에 ` (AI 생성 이미지)` 후행 추가.

## 주요 결정 사항

1. **rehype 플러그인 위치는 sanitize 뒤** — `hast-util-sanitize` 기본(GitHub) 스키마는 `figure`/`figcaption`를 허용 태그 목록에 포함하지 **않으며** 대부분의 className도 화이트리스트(code/h2/li/ol/ul 일부)만 통과시킨다. sanitize 앞에 두면 figure·figcaption·내가 부여한 className이 모두 제거되므로 sanitize 뒤로 이동. sanitize는 입력 markdown의 raw HTML을 정화하는 용도로 그대로 두고, 우리 플러그인은 정화된 hast를 받아 figure 구조를 추가한다.

   - 보조: 캡션 컨벤션이 markdown image title 슬롯이라 sanitize 기본 스키마가 `<img title>`를 strip한다. `defaultSchema`를 spread해 `attributes.img`에 `'title'`만 추가하는 최소 확장 스키마를 articles.ts에 정의해 `rehypeSanitize(schema)`로 전달.

2. **next/image 미사용 — plain `<img>` 유지** — design.md §2는 ArticleFigure 컴포넌트가 next/image를 사용한다고 기술했으나, 본 프로젝트의 article 본문은 `dangerouslySetInnerHTML`로 HTML 문자열을 주입하는 구조다. rehype 플러그인은 빌드 타임에 HTML을 emit하므로 React 컴포넌트(`next/image`)를 호출할 수 없다. 따라서 현 단계는 plain `<img>` + `loading="lazy"` 기본값 + CSS `border-radius: 0.5rem`로 대응. 향후 article 본문을 react-markdown/MDX로 전환할 경우 ArticleFigure 컴포넌트를 도입해 next/image와 결합 가능 — 그때 본 결정 재검토.

3. **ArticleFigure.tsx 컴포넌트 미생성** — design.md는 평행 React 컴포넌트를 신규로 명시했으나, ① 위 #2와 동일하게 article 본문에서 사용 경로가 없고 ② 다른 화면에서 figure를 직접 렌더하는 케이스가 현재 0건이라 dead code가 된다. 컨벤션 위반 대신 rehype 플러그인이 단일 진입점이 되도록 구조화. 별도 React 컴포넌트가 필요해지는 시점(MDX 도입, 직접 JSX figure 렌더 화면 등)에 plugin 출력 구조와 동일하게 컴포넌트화한다.

4. **dev 안전망: alt 누락 → 빌드 경고만, 빌드 실패 X** — spec.md §3 won't 외 §3 should "alt 누락 시 빌드 실패"는 매력적이나 strict 모드를 옵션으로만 제공하고 기본은 `console.warn`. 이유: ① 본 변경이 발행된 글 2건만 이미지를 사용하므로 운영 리스크 낮음, ② Next.js Turbopack 빌드 흐름에서 plugin throw가 빌드 결과에 어떻게 반영될지 추가 검증 필요 — 후속 변경에서 strict 옵션을 활성화 가능하도록 설계 유지.

5. **CSS는 plain CSS in globals.css (Tailwind 클래스 미사용)** — design.md는 `bg-foreground/60 text-white text-xs px-2 py-1 rounded` 같은 Tailwind 클래스를 명세했으나, rehype 플러그인 출력은 .ts 파일 안의 className 문자열이라 Tailwind v4 source scan이 정확히 잡을지 확실치 않다. plain CSS로 `.article-prose .article-figure__chip { ... }` 작성해 design.md 시각 사양(`bottom: 8px; right: 8px; background: rgb(61 68 71 / 0.6); color: #FFFFFF; font-size: 0.75rem; padding: 4px 8px; border-radius: 0.25rem;`)을 1:1 재현. 토큰 인용은 `var(--prose-muted)`만 사용.

6. **fade-in 애니메이션 미구현** — design.md §4는 `opacity 0 → 1` 200ms ease-out + `prefers-reduced-motion` 분기를 제안했으나, ① plain `<img>`는 `onLoadingComplete` 콜백이 없고 ② 칩이 즉시 노출되어도 의도한 "AI 표시는 이미지보다 먼저 인지"와 부합 — design.md §3 loading 상태 설명과 일치. 따라서 transition 미적용. 운영자 시각 점검에서 거슬리면 재검토.

7. **이미지 라운드 모서리(`border-radius: 0.5rem`) 추가** — design.md에 명시되지 않았으나 시각 일관성을 위해 추가. `.article-prose img` 단독 셀렉터가 globals.css에 없었기에 figure 컨텍스트에서만 적용해 다른 inline img(미래)에 영향 없음.

## 가정 사항

- **figcaption은 캡션이 있을 때만 렌더 (조건부)** — 2026-05-07 결정. review.md §5는 figcaption 단독 표기(`· AI 생성`)를 옵션 C로 채택했으나 실제 렌더 결과 leading `·`가 단독으로 떠 있는 모양이 어색해 절충안 채택. 표시 의무 이중 안전망 중 figcaption 축은 캡션 사용 시점부터 살아나고, 캡션 없는 글은 워터마크 칩(우하단 `Imagined with AI`) + alt(`(AI 생성 이미지)`) 두 채널로 충족. 운영자 시각 점검에서 캡션 미독자 커버 약화가 문제로 부각되면 재논의.
- **캡션 컨벤션은 markdown image title 슬롯** — 2026-05-07 결정. `![alt](src "캡션 텍스트")` 표준 문법 활용. plugin이 `img.properties.title`을 추출해 figcaption으로 옮기고 img에서 title 속성을 제거(브라우저 기본 tooltip 중복 방지). title을 sanitize가 strip하므로 `defaultSchema`를 spread해 `img: [...img, 'title']` 1줄 확장. review.md §5.1 후속 결정의 "frontmatter로 이전" 옵션은 향후 라이선스·C2PA 자격증명 등 메타가 추가될 때 재검토.
- **alt 트리거 토큰은 정확히 ` (AI 생성 이미지)`** (앞 공백 + 괄호 포함). 부분 일치(`AI 생성`만 등)는 false positive 위험으로 채택 안 함. 운영자 SOP에서 동일 토큰 사용을 강제.
- **외부 절대 URL 이미지는 경고로 충분, 빌드 실패 안 함** — 발행 글에 외부 이미지 0건 기준. 이후 외부 이미지가 발생하면 SOP 위반으로 운영자 직접 조치.
- **alt가 비어 있으면 (alt="") 마커 검사를 건너뛰고 경고만 출력** — alt 누락은 a11y 위반이지만 본 plugin이 강제하는 책임은 AI 표시 1건. 일반 a11y는 추후 별도 lint 단계에서 처리.
- **markdown image의 surrounding text가 같은 단락에 섞여 있으면 figure로 변환하지 않음** (`p > img only` 규칙). 본 사이트 컨벤션상 이미지는 단독 단락으로만 사용 — 발행 글 2건 모두 이 패턴 충족.
- **rehype-stringify는 figure/figcaption을 자체적으로 sanitize하지 않음** — 검증: 빌드 산출 HTML에서 두 태그 모두 그대로 출력 확인.

## 미구현 항목

- **next/image 결합** — §주요 결정 #2.
- **ArticleFigure.tsx React 컴포넌트** — §주요 결정 #3.
- **fade-in 애니메이션 / `prefers-reduced-motion` 분기** — §주요 결정 #6. design.md §4 명세이지만 dead code 회피 목적으로 미적용.
- **strict 모드 활성화 (alt 누락 빌드 실패)** — §주요 결정 #4. 옵션은 구현됨, 호출 측에서 비활성.
- **P10 운영자 가이드 통합 문서** — phase-4.5.md §3.1 P10 본체 결정 사항(가이드 문서 위치, 체크리스트 데이터 변경 룰)이 미해결이라 본 SOP만 단독 발행. P10 본체 작성 시 흡수.
- **광고 슬롯 충돌 자동 검사** — spec.md §3 should. 운영자 SOP 체크리스트에 수동 항목으로 박아두고, 자동 검사는 광고 슬롯 위치가 동적으로 결정되는 시점(P11/P12 이후)에 재검토.
- **빌드 산출 HTML axe-core 자동 검증** — design.md §5.2 색 대비 검증. 운영자 시각 점검 + 도구별 검증으로 대체.
