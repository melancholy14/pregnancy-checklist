# design-bundle-c-heading-size 기획서 (간단판)

> 작성일: 2026-05-10  size: S
> 출처: [docs/plan/phase-4.5.md §2.10 묶음 C](../../plan/phase-4.5.md), §2.3 C4, §2.8.2 T-9, §2.8.3 I-5·I-6, §2.9 Cross-6
> 라운드: [design-bundle-cleanup-round](../../design-bundle-cleanup-round/README.md)

## 0. 사전 확정 결정 (사용자 입력, 2026-05-10)

- **페어 리뷰**: 디자이너 단독 + 개발자 보조. 결정 0건 cleanup.
- **방향 = 인라인 size override 제거**(시맨틱·시각 정렬을 글로벌 hN 그대로 살리는 쪽). DESIGN.md §3.2 "Don't restate them with inline classes." 위반의 직접 정정.
- **글로벌 hN 사이즈 자체 조정(헌법 갱신)은 won't** — 별도 라운드에서 검토. Cross-6의 "글로벌 h3·h4 자체를 카드용으로 조정" 옵션은 영향 면적이 본 라운드(인라인 정정)보다 훨씬 크므로 분리.

## 1. 사용자 시나리오

체크리스트 허브의 카드 타이틀, 체크리스트 상세의 서브섹션 헤더, 타임라인 주차 카드의 항목 헤딩, "기타 (주차 미지정)" 섹션 헤더, 항목 추가 폼 타이틀, 아티클 카드 제목, 아티클 상세 페이지 h1까지 — 9곳에서 `<h2>`·`<h3>`·`<h1>`이 인라인 className(`text-[15px] font-medium`, `text-xl`)로 글로벌 위계를 덮어쓰며 시맨틱과 시각이 어긋나 있던 것을, 글로벌 `h1`/`h2`/`h3` 사이즈로 정렬한다. 사용자 관점에서는 카드 타이틀과 섹션 헤더 글자 크기가 1.3~1.5배 살짝 커져 위계가 시각적으로 더 또렷해진다. 시맨틱·접근성 변화 없음.

## 2. 기능 요구사항

### must

#### 2.1 인라인 size override 제거 (8곳)

| # | 위치 | 파일 | 현재 className (해당 부분) | → 변경 |
|---|---|---|---|---|
| 1 | 체크리스트 허브 카드 타이틀(일반 3장) | [ChecklistHub.tsx:70](../../../src/components/checklist/ChecklistHub.tsx#L70) | `<h2 className="text-[15px] font-medium text-foreground">` | `<h2 className="text-foreground">` |
| 2 | 체크리스트 허브 카드 타이틀(타임라인) | [ChecklistHub.tsx:131](../../../src/components/checklist/ChecklistHub.tsx#L131) | `<h2 className="text-[15px] font-medium text-foreground">` | `<h2 className="text-foreground">` |
| 3 | 체크리스트 상세 서브카테고리 헤더 | [ChecklistPage.tsx:312](../../../src/components/checklist/ChecklistPage.tsx#L312) | `<h2 className="text-[15px] font-medium">` | `<h2>` |
| 4 | 체크리스트 항목 추가 폼 타이틀 | [ChecklistAddForm.tsx:54](../../../src/components/checklist/ChecklistAddForm.tsx#L54) | `<h3 className="text-[15px] font-medium mb-4">` | `<h3 className="mb-4">` |
| 5 | 타임라인 "기타 (주차 미지정)" 섹션 헤더 | [TimelineContainer.tsx:356](../../../src/components/timeline/TimelineContainer.tsx#L356) | `<h2 className="text-[15px] font-medium text-muted-foreground">` | `<h2 className="text-muted-foreground">` |
| 6 | 타임라인 주차 카드 항목 헤딩 | [TimelineAccordionCard.tsx:153](../../../src/components/timeline/TimelineAccordionCard.tsx#L153) | `<h3 className="text-[15px] font-medium">` | `<h3>` |
| 7 | 타임라인 항목 추가 폼 타이틀 | [UnifiedAddForm.tsx:105](../../../src/components/timeline/UnifiedAddForm.tsx#L105) | `<h3 className="text-[15px] font-medium mb-4">` | `<h3 className="mb-4">` |
| 8 | 아티클 카드 제목 | [ArticleCard.tsx:16](../../../src/components/articles/ArticleCard.tsx#L16) | `<h3 className="text-[15px] leading-snug mb-2">` | `<h3 className="leading-snug mb-2">` |

#### 2.2 ArticleDetail h1 인라인 사이즈 제거 (I-6)

| 위치 | 파일 | 현재 | → 변경 |
|---|---|---|---|
| 아티클 상세 페이지 h1 | [ArticleDetail.tsx:39](../../../src/components/articles/ArticleDetail.tsx#L39) | `<h1 className="text-xl mb-2">` | `<h1 className="mb-2">` |

글로벌 `h1` = `text-2xl` (24px). 매거진 헤드라인 톤 회복. `text-xl` 인라인 축소(20px)를 제거.

### should

- 변경 후 시각 검증 (디자이너 페르소나 §4 always-run 체크리스트):
  - **시맨틱·시각 일치 회복** — h2 헤더는 글로벌 `text-xl/600` (20px), h3 헤더는 `text-lg/600` (18px)로 시각적으로 한 단계 더 큼. 카드/섹션 위계가 또렷해짐.
  - **모바일 320px 깨짐 0** — 한 단계 큰 헤딩이 "엄마 가방·남편 준비" 등 긴 카드 타이틀에서 줄바꿈 양상을 바꿀 수 있음. 320px에서 라벨이 한 줄 → 두 줄 변경되더라도 cream canvas 위 word-break: keep-all 패턴 유지 검증.
  - **`.article-prose` 내부 헤딩은 영향 없음** — `.article-prose h2` (1.125rem) / `.article-prose h3` (1rem)는 자체 selector라 글로벌 hN과 분리. 본 라운드 미변경.

### won't

- **글로벌 `h2`·`h3` 사이즈 자체 조정 X** ([globals.css @layer base](../../../src/app/globals.css)) — DESIGN.md 헌법 갱신이 동반되어야 하므로 별도 라운드. Cross-6의 "글로벌 h3·h4 자체를 카드용으로 조정" 옵션 보류.
- **`.article-prose` 내부 selector 변경 X** — 별도 헌법 영역.
- **VideoCard / VideoCardCompact / ChannelCard 의 `text-[15px]` 인라인 X** ([VideoCard.tsx:41](../../../src/components/videos/VideoCard.tsx#L41), [VideoCardCompact.tsx](../../../src/components/videos/VideoCardCompact.tsx), [ChannelCard.tsx:37](../../../src/components/videos/ChannelCard.tsx#L37)) — `<h4>` 인라인이고, 글로벌 h4(`text-base`=16px)와 차이 1px이라 위계 왜곡 영향 미미. §2.10 C 묶음 SoT(C4·T-9·I-5·I-6) 범위 외.
- **micro-label `text-[11px]` / `text-[10px]` 인라인 X** — 헤딩이 아니라 캡션/배지 사이즈. DESIGN.md §3.2 "non-semantic display size"라 인라인 허용.
- **GA4 이벤트 변경 없음.**

## 3. 성공 기준

- `grep -rn "<h[123].*text-\[15px\]" src/components/` 결과 §2.1 영향 8곳에서 0건.
- `grep -rn "<h1.*text-xl" src/components/articles/ArticleDetail.tsx` 결과 0건.
- 4개 페이지(`/checklist`, `/checklist/<slug>`, `/timeline`, `/articles/<slug>`) 수동 확인:
  - 시맨틱 (DOM h2/h3) 동일.
  - 시각 위계가 한 단계 또렷해짐.
  - 320·375·414 모바일 폭에서 줄바꿈/잘림 없음.
- `npm run build` 통과 + 기존 E2E 회귀 0건.
