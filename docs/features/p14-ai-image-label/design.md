# P14: AI 생성 이미지 표시 의무 — 디자인 문서

> 작성일: 2026-05-06
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- **표시 형태(4.1)**: 우하단 DOM 오버레이 워터마크 칩 + alt 속성 + (캡션 있을 때만) figcaption (§5.2 절충안). 워터마크는 이미지 본체에 합성 금지 — figure 컴포넌트의 CSS absolute로만 렌더.
- **표시 문구(4.2)**: 워터마크 칩 영문 `Imagined with AI`(Meta 라벨 차용 / C2PA 표준 호환). figcaption은 캡션 있을 때만 `<원본 캡션> · AI 생성`(AI 마커) 또는 `<원본 캡션>` 단독.
- **메타데이터(4.3)**: alt 속성 끝에 `(AI 생성 이미지)` 후행. IPTC `DigitalSourceType`은 이미지 본체 메타라 디자인 표면에 영향 없음.
- **적용 범위(4.4)**: 100% AI 생성 이미지 전체.
- **캡션 컨벤션(§5.2)**: markdown image title 슬롯 `![alt](src "원본 캡션")`. plugin이 빌드 타임에 title을 추출해 figcaption으로 옮기고 img에서 title 제거.

## 1. 화면 목록·플로우

본 기능은 단일 영역(아티클 본문 `.article-prose` 내 figure)만 다룬다. 신규 화면·플로우 전환 없음.

- **화면 A (아티클 상세)**: `/articles/[slug]` 본문 영역. 모든 이미지가 figure 패턴으로 래핑됨. 페이지 전환 없음.
- **화면 B (모바일 320px·375px·414px)**: figure 폭은 article-prose 내부 폭 100%. 워터마크 칩은 폭 변화에도 우하단 8px 안쪽 고정.

본 기능에 화면 간 전환 트리거 없음 — 정적 표시.

## 2. 컴포넌트

- **신규**:
  - `components/articles/ArticleFigure.tsx` — figure + next/image + 워터마크 칩 + figcaption 합성 컴포넌트. `ai_generated: true` prop 받으면 칩·figcaption 라벨 자동 부착.
  - `lib/markdown/rehype-article-figure.ts` — rehype 플러그인. MD 본문의 image-only 단락(`<p><img></p>`)을 `<figure>` 구조로 치환. alt 텍스트 끝에 `(AI 생성 이미지)`가 있으면 워터마크 칩 부착. `img.title`(markdown image title 슬롯)이 있으면 figcaption으로 옮긴 뒤 img에서 title 속성 제거(브라우저 기본 tooltip 중복 방지). figcaption은 캡션이 있을 때만 렌더(§5.2 절충안). sanitize 기본 스키마가 `<img title>`을 strip하므로 articles.ts에서 `defaultSchema` spread + `attributes.img`에 `'title'` 1줄 추가한 확장 스키마를 `rehypeSanitize`에 전달.
- **재사용**:
  - `next/image` ([Next.js 빌트인]) — 기존 이미지 최적화 파이프라인 그대로.
  - `.article-prose` 토큰 ([src/app/globals.css:164-180](../../../src/app/globals.css#L164-L180)) — figure는 `.article-prose` 내부에 들어가므로 line-height·color 상속.
  - 토큰: `--foreground`, `--prose-muted`, `--prose-divider` (인라인 hex 금지).

## 3. 상태별 시안

| 상태 | UI 텍스트·동작 |
|---|---|
| **default (이미지 정상 로딩)** | figure 안에 plain `<img>` 렌더. 우하단 워터마크 칩 `Imagined with AI`(검은 반투명 배경 + 흰 텍스트 + 둥근 모서리). figcaption은 markdown image title로 원본 캡션을 입력했을 때만 노출 — AI 마커 있으면 `<원본 캡션> · AI 생성`, 없으면 `<원본 캡션>` 단독. 캡션 없으면 figcaption 자체 미렌더(§5.2 절충안 — 칩 + alt 두 채널로 표시 의무 충족). 텍스트 색 `var(--prose-muted)` (#7A7F83). |
| **loading (이미지 점진 로딩)** | 브라우저 기본 progressive load. 워터마크 칩은 이미지 영역에 absolute로 박혀 있어 placeholder 위에 미리 노출됨 — 의도적 동작(AI 표시는 이미지보다 먼저 인지 가능). figcaption은 캡션 있을 때만 즉시 렌더(정적 텍스트). |
| **empty (이미지 src 없음)** | figure 자체 미렌더 — rehype 플러그인이 src 없는 이미지는 변환 안 함. figcaption도 노출 안 됨. |
| **error (이미지 로딩 실패 / 404)** | 브라우저 기본 깨진 이미지 아이콘 위에 워터마크 칩이 absolute로 그대로 노출됨. alt 텍스트 `<원본 alt> (AI 생성 이미지)`가 폴백 텍스트로 표시 — AI 표시 의도 일부 보존. figcaption은 캡션 있을 때만 그대로 노출(없으면 칩 + alt 폴백만으로 의도 유지). |

## 4. 인터랙션·애니메이션

본 기능은 정적 표시 위주라 인터랙션 최소.

- **이미지 진입 시 chip fade-in**: `opacity 0 → 1` 200ms ease-out. next/image의 `onLoadingComplete` 콜백에서 트리거. `prefers-reduced-motion` 사용자에게는 즉시 표시(no transition).
- **figcaption 등장**: 정적 — 애니메이션 없음. 본문 흐름 일부.
- **호버·탭 인터랙션**: 없음. 워터마크 칩은 정보 표시 전용 — 클릭 영역 아님(`pointer-events: none`).

## 5. 토큰·접근성

### 5.1 사용 토큰 ([src/app/globals.css](../../../src/app/globals.css))

| 용도 | 토큰 | 값 |
|---|---|---|
| 워터마크 칩 배경 | `bg-foreground/60` | `var(--foreground)` (#3D4447) at 60% alpha |
| 워터마크 칩 텍스트 | `text-white` | #FFFFFF |
| 칩 모서리 | `rounded` | Tailwind 기본 `0.25rem` |
| 칩 폰트 | `text-xs` | `0.75rem` (12px) |
| 칩 패딩 | `px-2 py-1` | `8px 4px` |
| 칩 위치 | `absolute bottom-2 right-2` | 8px 안쪽 |
| figcaption 색 | `var(--prose-muted)` | #7A7F83 |
| figcaption 폰트 | `text-sm` | `0.875rem` (14px) |
| figure 본문 간격 | `.article-prose > * + *` 상속 | `margin-top: 1.25em` |

새 hex 인라인 금지 — 위 토큰만 사용.

### 5.2 접근성 (WCAG 2.1 AA)

- **색 대비**:
  - 워터마크 칩: 흑(60% alpha) + 흰 텍스트. 60% 알파 위 흰색은 합성 배경(이미지) 평균 명도에 따라 변동 — 모든 인포그래픽 우하단 영역에서 4.5:1 이상 통과 여부를 마이그레이션 시 axe-core / 수동 검증.
  - figcaption: `--prose-muted` (#7A7F83) on `--background` (#FFFAF7). 명도 대비 약 4.65:1 — AA 본문 4.5:1 통과.
- **시맨틱**:
  - `<figure>` + `<img>` (+ 캡션 있을 때만 `<figcaption>`) 구조. 워터마크 칩은 `<span aria-hidden>`(인터랙티브 X). figcaption이 있을 때 figure에 묶여 스크린리더가 "그림: …, 캡션: …" 컨텍스트로 낭독.
  - `role="button"` 등 가짜 인터랙티브 부착 금지(N2 정직성).
- **스크린리더 라벨**:
  - alt 텍스트 = `<원본 alt> (AI 생성 이미지)`. 원본 의미 우선, AI 표시 후행. 캡션 없는 글에서는 alt가 AI 표시 단독 음성 채널 — 마커가 alt 끝에 박혀 있어 누락 방지.
  - 워터마크 칩 텍스트는 `aria-hidden="true"` — alt가 이미 AI 표시를 낭독하므로 중복 방지(figcaption은 캡션 있을 때만 보조 낭독).
- **키보드 흐름**: 이미지·figure는 인터랙티브 아님 → 탭 순서 변화 없음. 키보드 도달 N/A.
- **`prefers-reduced-motion`**: chip fade-in transition 제거.
- **모바일 320px**: 칩 폭 = `Imagined with AI` 텍스트(약 92px) + padding 16px ≈ 108px. 인포그래픽 우하단 8px 안쪽 → 320px 화면에서도 이미지 정보 영역 침범 최소.
- **한국어 본문 keep-all**: figcaption은 `.article-prose` 내부라 `word-break: keep-all` 자동 상속.

### 5.3 다크 패턴·정직성 점검

- 워터마크 칩은 정보 표시 전용 — 광고·CTA로 위장 금지.
- figcaption이 렌더되는 경우 `· AI 생성` 후행 텍스트는 시각적으로 약화하지 않음(원본 캡션과 동일 weight·color). "AI 표시를 작은 글씨로 숨기는" 안티패턴 거부.
- 이미지 본체에 워터마크를 합성하지 않는 결정은 **운영 부담 회피**가 1차 이유 — 워터마크 칩 + alt + IPTC 메타 3중 보완으로 정직성 유지(figcaption은 캡션 있을 때 4중). 만약 외부 공유 시 워터마크 손실이 정책 문제로 부각되면 재논의(spec.md §3 won't 갱신 + 빌드 자동화 c) 옵션으로 업그레이드).
