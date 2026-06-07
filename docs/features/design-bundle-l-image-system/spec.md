# design-bundle-l-image-system 기획서

> 작성일: 2026-05-09  size: M
> 관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- **IM-5 (사전)**: 본문 이미지 탭/클릭 시 원본 새 탭 열기. 모달 lightbox 도입 X. `target="_blank"` + `rel="noopener noreferrer"` 의무.
- **항목 1 결정 (옵션 A)**: 본 라운드 spec/scope에 phase-4.5.md §2.11.2 갱신 + infra.md §3.2 연결 메모 PR 포함. SoT 무결성 우선.
- **항목 2 결정 (옵션 A)**: figcaption 부재 시 AI 칩=우하단 고정, 새 탭 아이콘=우상단. `docs/content/image-sop.md`에 인포그래픽 우상단 회피 SOP 메모 의무.
- **항목 3 결정 (옵션 B)**: anchor `aria-label = "원본 이미지 새 창에서 보기"` (content persona §5.5/§6 + WCAG N1 정합).
- **페어 1 결과**: IM-3는 phase-4.5.md 명시 정의("`<img>` → `next/image` 전환")가 아니라 **plain `<img width=N height=N loading="lazy">` 다운스코프**. next/image 전환은 standalone 라운드(infra.md §3.2)와 함께 — infra.md L81 "PoC KPI Go 후 결정" 트리거 종속.

## 1. 배경·목적

- **운영자**: phase-4.5.md §2.11 article-prose 이미지 시스템의 잔여(IM-1·IM-3·IM-5) 마감으로 디자인 §2 라운드의 콘텐츠 표면 정리 종료. 신규 글 작성 시 markdown 표기(`![alt](src "caption")`) 그대로 유지하면 빌드가 width/height·새 탭 anchor·figcaption을 자동 처리해 운영자 SOP 학습은 1회(우상단 회피 룰)만 추가.
- **사용자**: 본문 이미지에 radius·shadow·간격 토큰이 입혀져 카드/blockquote 톤과 시각 일관성 회복. 이미지 클릭 시 새 창에서 원본 확대 가능 — 모바일에서 인포그래픽 텍스트 가독성 확보. 키보드/스크린리더 사용자에게 "원본 이미지 새 창에서 보기" 라벨로 동작 예측 가능.
- **측정**: GA4 신규 이벤트 0건. 기존 측정 모델 동일.

## 2. 사용자 시나리오

- **시나리오 1 (모바일 인포그래픽 가독성)**: 사용자 A가 [/articles/weekly-prenatal-checklist](src/content/articles/weekly-prenatal-checklist.md) 본문에서 주차별 검사 인포그래픽을 본다 → 텍스트가 작아 핵심 수치를 놓침 → 이미지를 탭한다 → 새 창에서 원본 이미지(`/articles/weekly-prenatal-checklist.webp`)가 열려 핀치 줌 가능 → 원하는 정보 확인 후 새 창 닫고 본문 흐름으로 복귀.
- **시나리오 2 (키보드 사용자 접근성)**: 사용자 B가 본문 이미지를 키보드 Tab으로 도달 → focus-visible ring(`ring-pastel-lavender`)이 표시 → Enter/Space 입력 → 새 탭에서 원본 열림. 스크린리더는 "원본 이미지 새 창에서 보기" 라벨 음성 출력으로 동작 예측.
- **시나리오 3 (figcaption 분기)**: 발행 글 2건 — markdown title 슬롯 보유 → figcaption 끝 "· 원본 보기" 텍스트 추가 분기로 동작. 신규 글 운영자가 title 슬롯 비우면 → 우상단 ExternalLink 아이콘 분기로 동작.
- **시나리오 4 (CLS·LCP)**: 사용자 C가 article 페이지에 진입 → 이미지가 width/height attribute로 사전 공간 확보 → layout shift 0 → LCP 이미지가 `loading="lazy"` 미적용(첫 이미지) 또는 `loading="lazy"` 적용(이후 이미지)으로 의도된 우선순위 로딩.

## 3. 기능 요구사항

### must

#### M1. `globals.css .article-prose` 이미지 토큰 (IM-1)

- [src/app/globals.css](src/app/globals.css)의 `.article-prose` 블록 안에 `figure.article-figure` 또는 `.article-prose img` 셀렉터로 다음 토큰 적용:
  - `border-radius`: `var(--radius)` 또는 `1rem` (DESIGN.md `rounded-2xl` 정합)
  - `box-shadow`: `var(--shadow-sm)` 또는 `0 1px 2px rgba(0,0,0,0.05)` (DESIGN.md `shadow-sm` 정합)
  - `margin-block`: `1.5rem` (`my-6` 정합)
  - `max-width`: `100%` (`max-w-full` 정합)
- figcaption(`.article-figure__caption`) 텍스트는 `text-sm text-muted-foreground text-center mt-2` 정합 — P14 결정 유지.

#### M2. `rehype-article-figure` 플러그인 확장 (IM-3 + IM-5)

- [src/lib/markdown/rehype-article-figure.ts](src/lib/markdown/rehype-article-figure.ts) 확장. 기존 P14 figure 변환 로직은 보존.
- **width/height 자동 추출**: 빌드 타임에 자체 헤더 파서(image-size 라이브러리 대체 — runtime dep 회피)로 `public/articles/<slug>.webp` 등 `src` 경로의 실제 이미지 크기를 읽어 `<img width=N height=N>` attribute 추가. 외부 URL(http/https로 시작)은 width/height 미설정 — 운영자 SOP에 외부 이미지 비권장이 이미 명시.
- **`<img>`를 `<a>` 래핑**: 변환된 figure의 `cleanImg`를 `<a href={src} target="_blank" rel="noopener noreferrer" aria-label="원본 이미지 새 창에서 보기" class="article-figure__link">`로 감쌈. anchor는 img만 — figcaption은 anchor 외.
- **figcaption 보유 케이스**: 기존 P14 로직 유지(title 슬롯 → figcaption 텍스트). figcaption 끝에 "· 원본 보기" 텍스트 suffix 추가 (AI 칩 케이스에서는 "· AI 생성 · 원본 보기"가 되도록 P14 `AI_CAPTION_SUFFIX`와 순서 조합).
- **figcaption 부재 케이스**: figure media 슬롯(`.article-figure__media`) 내부에 우상단 ExternalLink 아이콘을 추가 — `<span class="article-figure__external" aria-hidden="true">`(시각 마커 전용, anchor 라벨이 음성 채널 담당). lucide-react `ExternalLink` 또는 동등한 인라인 SVG. 위치: media 슬롯에 `position: relative` + 마커에 `position: absolute; top: 0.5rem; right: 0.5rem`.
- **focus-visible ring**: `.article-figure__link:focus-visible`에 `ring-2 ring-pastel-lavender ring-offset-2` 정합 CSS 추가 (`globals.css` 또는 `.article-figure` 전용 블록).

#### M3. `loading="lazy"` 추가

- `rehype-article-figure` 확장에서 `<img>`에 `loading="lazy"`를 일괄 추가. 단 article 페이지의 LCP 후보(첫 번째 본문 이미지)는 추후 검증 후 `loading="eager"`로 분기 — 본 라운드는 "lazy 일괄 적용 + LCP 분기는 should"로 처리.

#### M4. 발행 글 2건 빌드 검증

- [src/content/articles/weekly-prenatal-checklist.md](src/content/articles/weekly-prenatal-checklist.md), [src/content/articles/prenatal-insurance-preparation-guide.md](src/content/articles/prenatal-insurance-preparation-guide.md) 두 글의 markdown 본문 변경 0(자동 변환). 빌드 후 HTML이 figure + img(width/height) + a(aria-label, target=_blank) + figcaption(suffix 포함) 구조로 변환되는지 e2e 검증.

#### M5. phase-4.5.md §2.11.2 IM-3 정의 정정 (항목 1-A)

- [docs/plan/phase-4.5.md](docs/plan/phase-4.5.md) §2.11.2 IM-3 행을 다음으로 갱신:
  - 변경 전: "`<img>` → `next/image` 전환 — fill 모드 + `sizes`..."
  - 변경 후: "`<img>` width/height attribute 자동 추출 (image-size 라이브러리) + `loading="lazy"` 적용. **next/image 전환은 본 라운드 범위 외 — standalone 모드 전환 라운드와 함께 진행** ([infra.md §3.2](../tech/infra.md#L94-L102))."
- §2.11.3 묶음 L 권장 작업 묶음 표의 "상태 (2026-05-09)" 행을 본 라운드 결과로 갱신.

#### M6. infra.md §3.2 연결 메모 (항목 1-A)

- [docs/tech/infra.md](docs/tech/infra.md) §3.2 전환 체크리스트의 `images.unoptimized` 제거 라인 옆에 메모 추가:
  - "→ next/image 마이그레이션은 design-bundle-l-image-system 라운드(2026-05-09)에서 plain img + width/height로 다운스코프됨. standalone 전환 시 `<img>`를 `<Image>`로 일괄 치환 + `images.unoptimized` 제거 + 도메인 등록 한 묶음 처리."

#### M7. `docs/content/image-sop.md` 운영자 SOP 메모 (항목 2-A)

- [docs/content/image-sop.md](docs/content/image-sop.md)에 다음 두 메모 추가:
  - "**인포그래픽 우상단 영역 회피**: 본문 이미지에 figcaption(markdown title 슬롯)을 비우면 figure 우상단(이미지 폭 720 기준 약 100×100px)에 ExternalLink 아이콘이 표시됨. 인포그래픽 핵심 텍스트·수치를 우상단에 배치하지 말 것. figcaption을 채우면 아이콘은 figcaption 텍스트로 대체되어 우상단 회피 불필요."
  - "**markdown title 슬롯 권장**: 신규 글 작성 시 `![alt](src "caption")` 형식으로 title 슬롯에 캡션을 채우는 것을 권장 — 시각 캡션 + 우상단 아이콘 회피 둘 다 충족."

### should

- **LCP 이미지 분기**: article 페이지의 첫 번째 본문 이미지를 `loading="eager"`로 분기 (rehype 플러그인에서 첫 figure만 eager). 본 라운드 should — Lighthouse 검증 후 도입.
- **외부 이미지(http/https) 처리**: 외부 URL은 width/height 추출 불가. rehype에서 경고 로그(이미 P14 산출물에 박힘) + 신규 글 운영자에게 외부 이미지 비권장. 본 라운드는 빌드 차단 없이 경고만.

### won't (이번 범위 밖)

- **next/image 컴포넌트 전환**: standalone 모드 전환과 함께 (infra.md §3.2). [페어 1 결정]
- **IM-5 lightbox/zoom (Radix Dialog 등 모달)**: 사전 결정 — 원본 새 탭 열기로 대체.
- **IM-6 alt 가이드라인**: P10 운영자 가이드와 통합되어 별도 묶음/라운드.
- **figcaption 부재 케이스 옵션 B/C/D**: 우상단(옵션 A)으로 결정 — B(좌하단)·C(표시 안 함)·D(alt→figcaption 자동 승격)·E(SOP 의무화) 모두 미선택.
- **PoC KPI 임계값 명문화**: 본 라운드 범위 외(인프라·로드맵 운영자 결정). 단 페어 1 숨은 가정으로 review.md에 박힘.
- **GA4 이벤트 신규**: 0건. 기존 측정 모델 동일.

## 4. 예외·엣지 케이스

- **이미지 파일 누락 (src 경로 무효)**: 빌드 타임 image-size 추출 실패 → 경고 로그 + width/height 미설정으로 fallback. 빌드는 차단하지 않음(P14 패턴 정합 — strict 옵션 false 유지).
- **외부 이미지 URL (http/https)**: width/height 추출 불가. rehype에서 P14 산출 경고 로그 발생. anchor 래핑·loading="lazy"·figcaption suffix는 정상 동작.
- **markdown title 슬롯 비움 (figcaption 부재)**: figure media 우상단 ExternalLink 아이콘으로 새 탭 시각 표시. anchor는 그대로 동작.
- **AI 마커 alt + figcaption 동시 보유**: P14 캡션 suffix(" · AI 생성") + 본 라운드 caption suffix(" · 원본 보기") 둘 다 적용. 결과 figcaption 예: "주차별 핵심 검사 타임라인 · AI 생성 · 원본 보기".
- **localStorage·예정일 영향**: 무관 — 본 라운드는 빌드 타임 마크업 변경만.

## 5. 성공 기준

- **기능 동작**:
  - `pnpm build` 성공 + 발행 글 2건 변환된 HTML이 figure + img(width/height) + a(target=_blank, rel=noopener noreferrer, aria-label="원본 이미지 새 창에서 보기") + figcaption(suffix) 구조 보유. 기존 e2e 11/11 통과 + figure/anchor 추가 e2e 1~2건 통과.
  - 키보드 Tab으로 본문 이미지 도달 → focus-visible ring 표시 → Enter로 새 탭 열림.
  - 스크린리더(VoiceOver/NVDA)로 "원본 이미지 새 창에서 보기" 음성 출력 확인.
- **측정 지표**: 신규 GA4 이벤트 0건. 기존 측정 모델 동일.
- **사용자 경험**: design.md 와 일치 — 토큰(rounded-2xl + shadow-sm + my-6 + max-w-full) + focus ring(ring-pastel-lavender) + 우상단 ExternalLink 아이콘 분기 정합.
- **SoT 정합**: phase-4.5.md §2.11.2 갱신 + infra.md §3.2 메모 + image-sop.md SOP 두 줄 모두 머지. SoT 무결성 회복.
