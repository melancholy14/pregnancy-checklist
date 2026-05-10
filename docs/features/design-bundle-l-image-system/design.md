# design-bundle-l-image-system 디자인 문서

> 작성일: 2026-05-09
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- **IM-5**: 본문 이미지 클릭 시 원본 새 탭 열기. 모달 lightbox 도입 X.
- **항목 2-A**: figcaption 부재 시 AI 칩 우하단 고정 + 새 탭 아이콘 우상단. 인포그래픽 우상단 회피 SOP는 `docs/content/image-sop.md`.
- **항목 3-B**: anchor `aria-label = "원본 이미지 새 창에서 보기"`.
- **페어 1**: IM-3는 plain `<img width=N height=N loading="lazy">` 다운스코프. next/image 컴포넌트 미사용.
- **페어 2 (designer)**: focus-visible ring = `ring-pastel-lavender` (lavender=secondary editorial role 정합). figure 마크업 = `<figure><span.media><a><img/></a></span><figcaption/></figure>` (anchor=img만, figcaption은 anchor 외).

## 1. 화면 목록·플로우

본 라운드는 article 본문 영역(`.article-prose` 안 figure) 단일 표면. 화면 자체는 신규 없음.

- **article 페이지** (`/articles/<slug>`): 본문 figure 렌더 변화. radius·shadow·간격 토큰 입혀짐. 이미지에 anchor 래핑(target=_blank).
- **figure 인터랙션 분기**:
  - 분기 A (figcaption 보유): figcaption 끝 "· 원본 보기" 텍스트 → 사용자가 시각으로 새 창 열기 가능 인지 → 이미지 또는 figcaption 영역 (anchor 영역=img만) 탭 → 새 탭 열림
  - 분기 B (figcaption 부재): figure media 슬롯 우상단 ExternalLink 아이콘 → 사용자가 시각으로 인지 → 이미지 탭 → 새 탭 열림
- **외부 링크 보안**: `target="_blank"` + `rel="noopener noreferrer"` 의무. 새 창 opener 차단.

## 2. 컴포넌트

### 신규
- 없음 — `rehype-article-figure` 플러그인 확장으로 빌드 타임 마크업 변환만. React 컴포넌트 추가 없음.

### 재사용·확장
- [src/lib/markdown/rehype-article-figure.ts](src/lib/markdown/rehype-article-figure.ts) — P14 산출물. width/height attribute 자동 추출 + anchor 래핑 + figcaption suffix + 우상단 ExternalLink 아이콘 분기 추가.
- [src/app/globals.css](src/app/globals.css) `.article-prose` — `figure.article-figure`, `.article-figure__media`, `.article-figure__link`, `.article-figure__caption`, `.article-figure__chip`, `.article-figure__external` 셀렉터 CSS 블록 확장.

### 마크업 구조 (변환 결과)

```html
<!-- 분기 A: figcaption 보유 -->
<figure class="article-figure">
  <span class="article-figure__media">
    <a href="/articles/x.png" target="_blank" rel="noopener noreferrer"
       class="article-figure__link"
       aria-label="원본 이미지 새 창에서 보기">
      <img src="/articles/x.png" alt="..." width="720" height="480" loading="lazy" />
    </a>
    <!-- AI 마커 alt 보유 시 추가 -->
    <span class="article-figure__chip" aria-hidden="true">Imagined with AI</span>
  </span>
  <figcaption class="article-figure__caption">
    주차별 핵심 검사 타임라인 · 원본 보기
    <!-- AI 마커 보유 시: ... · AI 생성 · 원본 보기 -->
  </figcaption>
</figure>

<!-- 분기 B: figcaption 부재 -->
<figure class="article-figure">
  <span class="article-figure__media">
    <a href="/articles/x.png" target="_blank" rel="noopener noreferrer"
       class="article-figure__link"
       aria-label="원본 이미지 새 창에서 보기">
      <img src="/articles/x.png" alt="..." width="720" height="480" loading="lazy" />
    </a>
    <span class="article-figure__external" aria-hidden="true">
      <!-- lucide ExternalLink 인라인 SVG -->
    </span>
    <!-- AI 마커 alt 보유 시 추가 -->
    <span class="article-figure__chip" aria-hidden="true">Imagined with AI</span>
  </span>
</figure>
```

## 3. 상태별 시안

### default
- figure 본체: `border-radius: 1rem (rounded-2xl)`, `box-shadow: var(--shadow-sm)`, `margin-block: 1.5rem (my-6)`, `max-width: 100%`.
- img: width/height attribute로 layout reservation. CLS 0.
- figcaption: `text-sm text-muted-foreground text-center mt-2` (P14 정합 유지).
- AI 칩: 우하단 고정 (`position: absolute; bottom: 0.5rem; right: 0.5rem`, `bg-foreground/60 text-white text-xs rounded-md px-1.5 py-0.5`).
- 새 탭 아이콘 (분기 B만): 우상단 (`position: absolute; top: 0.5rem; right: 0.5rem`, lucide ExternalLink 16x16, `bg-foreground/60 text-white rounded-md p-1`).

### hover
- figure 자체에는 hover 효과 없음(과한 어텐션 회피).
- anchor 호버 시 cursor: pointer (브라우저 기본).
- (옵션, should) 분기 B의 우상단 아이콘은 anchor hover 시 `bg-foreground/80`로 미세 강조. 본 라운드는 기본만.

### focus-visible (키보드)
- `.article-figure__link:focus-visible`: `outline: none; box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--pastel-lavender);` 또는 Tailwind: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-lavender focus-visible:ring-offset-2`.
- ring 색은 lavender (secondary editorial role) — DESIGN.md L68 정합. pink(=CTA)·mint(=success)·peach(=data) 모두 부적합.

### loading (이미지 lazy 로드 중)
- width/height attribute로 placeholder 공간 확보. 콘텐츠 레이아웃 0 shift.
- lazy 로딩 중 img는 빈 영역으로 표시 (브라우저 기본). 추가 placeholder 시안 없음 — `images.unoptimized: true` 환경에서 next/image의 blur placeholder는 미작동.

### error (이미지 src 무효 또는 파일 누락)
- 빌드 타임 image-size 추출 실패: 경고 로그 + width/height 미설정. 런타임에는 브라우저 기본 broken image 아이콘.
- 의도적인 fallback UI 도입 안 함 — 빌드 단계에서 차단되어야 할 운영자 실수이고, 런타임 fallback은 운영자에게 잘못된 안전감 줄 위험.

### empty (figcaption 부재)
- 분기 B 시안. 새 탭 아이콘이 시각 표시 담당. 디자인 자체에 "비어 있음" 표시 없음 — 인포그래픽 자체가 시각 콘텐츠.

## 4. 인터랙션·애니메이션

- **본문 이미지 클릭 → 새 탭 열림** (트리거: 클릭/탭/Enter/Space, 피드백: 새 탭 열림 — 브라우저 기본, duration: 즉시)
- **focus-visible ring 표시** (트리거: 키보드 Tab, 피드백: ring 색 변화, duration: 0ms — 즉시 표시)
- **figure 자체 애니메이션 없음** — 본 라운드는 정적 마크업·토큰만. 호버 줌·페이드 등 추가 애니메이션은 won't.

## 5. 토큰·접근성

### 사용 토큰

- `--radius` 또는 직접 값 `1rem` (rounded-2xl) — figure 본체 border-radius
- `--shadow-sm` — figure box-shadow
- `--pastel-lavender` (`#E4D6F0`) — focus-visible ring 색
- `--muted-foreground` — figcaption 텍스트 색 (P14 정합)
- `--background` — focus ring offset

### 신규 토큰
- 없음. 기존 토큰 조합만.

### 접근성 (WCAG 2.1 AA)

- **키보드 도달**: anchor가 native `<a>`라 Tab으로 도달. Enter/Space로 활성화 — 브라우저 기본 동작.
- **focus-visible ring**: 색 대비 검증 — `--pastel-lavender (#E4D6F0)` vs `--background (cream)` 대비비. ring offset 2px로 ring 자체가 background와 4px 분리되어 시각 인식 보장.
- **ARIA 정합성**: `aria-label="원본 이미지 새 창에서 보기"` (anchor 음성 라벨). figure 내 `<span class="article-figure__chip" aria-hidden="true">`·`<span class="article-figure__external" aria-hidden="true">` 둘 다 시각 마커 전용으로 스크린리더 무시.
- **시맨틱 HTML**: `<figure>` + `<figcaption>` 시맨틱 정합. anchor가 img만 감싸므로 figcaption은 anchor 외부에 위치 — figcaption이 anchor와 분리되어 스크린리더가 figcaption을 figure description으로 정직히 인식.
- **스크린리더 흐름**: figure 진입 → alt 음성 출력 → anchor 라벨 음성 출력 → figcaption 음성 출력. AI 칩·ExternalLink 아이콘은 `aria-hidden`로 음성 누락 (라벨 채널은 anchor 단일).
- **색에 의존하지 않는 정보 표시**: 새 탭 가능 시각 표시(figcaption suffix 또는 우상단 아이콘) + anchor aria-label 둘 다 제공 — 색맹·시각 손실 사용자 모두 인식 가능.
- **모바일 320px**: figure max-width: 100% + img width/height의 intrinsic ratio 유지. 모바일에서 가로 폭 초과 0.
- **`word-break: keep-all`**: figcaption은 `.article-prose` 자식이라 기본 정합. P14 정합 유지.

### 다크 패턴 검증 (designer N4)

- 새 탭 열기는 사용자 의도(클릭) 후에만 발동 — 자동 옵트인·인터스티셜 X. 통과.
- AI 칩은 운영자 투명성 표시 — 위장 X. 통과 (P14 결정 유지).
- 우상단 ExternalLink 아이콘은 anchor 영역의 시각 마커 — 가짜 버튼·가짜 토글 X. 통과.
- focus-visible ring은 시각 위계 왜곡 없음 — 인터랙티브 요소를 명확히 표시. 통과.
