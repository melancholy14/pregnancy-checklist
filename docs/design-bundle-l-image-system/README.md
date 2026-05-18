# design-bundle-l-image-system

> 작성일: 2026-05-10 | 작성자: Claude Code

## 개요

phase-4.5 §2.11 article-prose 이미지 시스템의 잔여 항목(IM-1·IM-3·IM-5)을 한 라운드에 마감하는 디자인 묶음 L. `rehype-article-figure` 빌드 타임 변환을 확장해 figure 이미지에 (1) `rounded-2xl + shadow-sm` 토큰, (2) plain `<img width=N height=N loading="lazy">` 다운스코프(image-size 자동 추출), (3) 원본 새 탭 열기 anchor(`target="_blank" rel="noopener noreferrer" aria-label`) + figcaption suffix 또는 우상단 ExternalLink 아이콘 분기를 일괄 적용한다. next/image 전환은 standalone 라운드와 함께 진행하도록 SoT(phase-4.5.md, infra.md, image-sop.md)에 박아 무결성을 회복했다.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| M1. `globals.css .article-prose` 이미지 토큰 (rounded-2xl + shadow-sm + my-6 + max-w-full) | ✅ | `.article-figure__media img`에 `border-radius: 1rem` + `box-shadow: var(--shadow-sm)` 적용 |
| M2. `rehype-article-figure` 확장 — width/height + anchor 래핑 + suffix + 우상단 ExternalLink + focus ring | ✅ | PNG·JPEG 헤더 인라인 파서, anchor `aria-label="원본 이미지 새 창에서 보기"`, lavender focus ring |
| M3. `loading="lazy"` 일괄 적용 | ✅ | rehype 플러그인이 cleanImg에 `loading: "lazy"` 부착 (LCP eager 분기는 should — 미구현) |
| M4. 발행 글 2건 빌드 검증 | ✅ | `weekly-prenatal-checklist.html`에서 figure + img(width=1536, height=1024) + a + figcaption 구조 확인 |
| M5. phase-4.5.md §2.11.2 IM-3 정정 + §2.11.3 갱신 | ✅ | plain `<img>` 다운스코프 + 묶음 L 상태 ✅ 완료 |
| M6. infra.md §3.2 연결 메모 | ✅ | `images.unoptimized` 라인 옆에 design-bundle-l-image-system 라운드 다운스코프 메모 |
| M7. `image-sop.md` SOP 메모 | ✅ | §4.1 우상단 회피, §4.2 markdown title 슬롯 권장 |

### 생성/수정 파일

**신규 생성**: 없음

**수정**:
- `src/lib/markdown/rehype-article-figure.ts` — PNG/JPEG 헤더 파서(`readImageDimensions`), anchor 래핑, lazy + width/height, `createExternalLinkSvg` lucide 인라인 SVG, figcaption suffix
- `src/app/globals.css` — `.article-figure__link/__media img/__external` 토큰·focus-visible ring CSS
- `docs/plan/phase-4.5.md` — §2.11.2 IM-3 행 + §2.11.3 묶음 L 상태 갱신
- `docs/tech/infra.md` — §3.2 next/image 다운스코프 메모
- `docs/content/image-sop.md` — §4.1·§4.2 SOP 메모 추가

### 주요 결정 사항

- **`image-size` 라이브러리 대신 인라인 PNG/JPEG 헤더 파서 사용** — implement-feature 규칙(새 패키지 설치 금지)을 지키면서 spec의 결과(width/height attribute 자동 부착)를 동일 달성. 발행 글 2건이 모두 PNG라 빌드 검증에서 정확 추출 확인.
- **focus-visible ring을 `box-shadow` 더블 stroke로 구현** — anchor가 `border-radius: 1rem`이라 `outline`이 둥근 모서리를 따라가지 않는 환경에 대응. inner shadow가 background 색으로 ring offset 역할.
- **figure 내 `<svg>`를 hast 노드로 직접 생성** — rehype는 빌드 타임 hast 변환이라 lucide-react React 컴포넌트 사용 불가. ExternalLink 24x24 viewBox path 3개를 hast `<svg><path>` 노드로 인라인.
- **figcaption suffix를 항상 `· 원본 보기`로 부착** — spec M2 일괄 적용. AI 마커 보유 시 ` · AI 생성 · 원본 보기` 순서로 합쳐짐.
- **anchor `rel`을 배열(`["noopener", "noreferrer"]`)로 표현** — hast property-information이 space-separated tokens 타입을 자동 합쳐 직렬화.

### 가정 사항 및 미구현 항목

**가정**:
- 발행 글 2건 모두 markdown title 슬롯 보유(분기 A) — 분기 B(figcaption 부재 + 우상단 ExternalLink)는 신규 글에서 발현 가능
- `public/articles/<slug>.png` 경로 매핑 — Next.js 빌드는 프로젝트 루트 cwd 가정
- rehype-sanitize가 article-figure 이전 실행되어 figure 출력 마크업이 sanitize 영향 없음
- PNG·JPEG 외 포맷 미지원 (현재 콘텐츠 정책상 PNG만)

**미구현**:
- LCP 이미지 eager 분기 (should) — Lighthouse 검증 후 별도 라운드
- 분기 B(figcaption 부재) e2e fixture 검증 — 코드 경로만 검증
- 외부 이미지(http/https) 빌드 차단 — spec대로 경고만 동작

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

없음. 4가지 관점(타입 안전성·성능·보안·접근성) 모두 사용자 피해 또는 런타임 크래시로 이어지는 결함 발견되지 않음.

### Warning (수정 권장)

1. **path traversal 방어** (`rehype-article-figure.ts:21`) — `src` 값이 `"/../../etc/passwd"` 형식이면 `path.join`이 정규화하여 PUBLIC_DIR 바깥 파일 read 가능. → 리팩토링에서 처리 완료.
2. **`outline: none` + focus-visible 폴백** (`globals.css:396`) — focus-visible 미지원 환경에서 키보드 포커스 미표시. → 리팩토링에서 처리 완료.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 완료 |
| Warning | 2건 (모두 리팩토링에서 처리) |
| Suggestion | 4건 (캐싱·부분 읽기·SVG 인스턴스·외부 URL width/height) |

---

## 리팩토링 내용

### 작업 목록

1. **`rehype-article-figure.ts` — path traversal 방어**
   - **무엇을**: `fs.readFileSync` 호출 직전 정규화된 절대 경로가 `PUBLIC_DIR + path.sep`로 시작하는지 검증, 실패 시 경고 + `undefined` fallback
   - **왜**: 빌드 머신에서 PUBLIC_DIR 바깥 파일 read syscall 차단 (실제 정보 누설은 0이지만 보안 경계 명확화)

2. **`globals.css` — focus / focus-visible 폴백 패턴**
   - **무엇을**: 기존 `outline: none` + `:focus-visible` 단일 분기를 `:focus` + `:focus:not(:focus-visible)` + `:focus-visible` 3단 패턴으로 확장
   - **왜**: focus-visible 미지원 브라우저에서도 키보드 포커스 ring 표시. modern 브라우저의 마우스 클릭 ring 미표시 동작도 보존. WCAG 2.1 AA 키보드 가시성 더 넓은 환경 지원

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 2개 | 2개 (변동 없음) |
| `rehype-article-figure.ts` 줄 수 | 270줄 | 275줄 (+5: path 검증 분기) |
| `globals.css` `.article-figure__link` 블록 | 11줄 | 22줄 (+11: 3단 focus 폴백) |
| Warning 처리 | 0/2 | 2/2 ✅ |
| 동작 변경 | 없음 (구조·폴백만 추가) |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 9개 passed (figure 구조, anchor 속성, href, lazy/width/height, suffix, 두 번째 글, border-radius, focus ring, JS-off SSG) |
| Error/Validation | ✅ 3개 passed (이미지 없는 글, title 제거, 분기 A에선 ExternalLink 마커 0) |
| 권한/인증 | N/A (정적 SSG 콘텐츠 — 본 기능에 인증 분기 없음) |
| 반응형 (Mobile 375px) | ✅ 2개 passed (figure/anchor/caption 정상, viewport 폭 초과 0) |
| **전체** | **14 passed / 0 failed** (9.0s, 리팩토링 후 재실행) |

📊 상세 리포트: `playwright-report/index.html`
