# design-bundle-e-finishing 기획서 (간단판)

> 작성일: 2026-05-10  size: S (영향 면적 큰 cleanup)
> 출처: [docs/plan/phase-4.5.md §2.10 묶음 E](../../plan/phase-4.5.md), §2.5 Minor, §2.8.x M3·M4 제외, §2.9 Cross-7·Cross-8·Cross-9
> 라운드: [design-bundle-cleanup-round](../../design-bundle-cleanup-round/README.md)

## 0. 사전 확정 결정 (사용자 입력, 2026-05-10)

- **페어 리뷰**: 디자이너 단독 + 개발자 보조. 결정 0건 cleanup.
- **본 묶음 = 4개 패턴 일괄 정정**: shadow-md 정보 카드(Cross-8) / "→" 텍스트 화살표(Cross-7) / 토큰 외 red(Cross-9) / 토큰 외 hex(부분).
- **마크업 설계 변경(M3 우선순위 시각 축소·M4 노트 항상 노출)은 본 묶음 제외** — §2.7 E 원안에 포함되어 있었으나, 본 라운드는 §2.10 SoT의 정의("shadow/화살표/토큰 외 red/토큰 외 hex")를 따라 cleanup 4종에만 한정.

## 1. 사용자 시나리오

전 영역(체크리스트·타임라인·홈·아티클·체중·베이비페어·온보딩) 25곳에 산재한 4가지 토큰·마크업 위반을 일괄 정정한다.
- (1) 정보 카드의 `shadow-md` rest 상태 → `shadow-sm`으로 — DESIGN.md §6.1·§6.2 "정보 카드는 shadow-sm, shadow-md는 input-bearing 카드용".
- (2) "→" 텍스트 화살표 → `<ChevronRight aria-hidden>` 아이콘으로 — 페르소나 AP8 + 스크린리더 "오른쪽 화살표" 잡음 제거.
- (3) `text-red-400` / `bg-red-500` / `bg-red-50` 등 Tailwind 기본 red → `--destructive` 토큰 — 페르소나 §3 N5(의료 안전 경계) 컨텍스트와 정합.
- (4) 토큰 외 hex `via-[#F0EBE6]` / 인라인 `color: "#3D4447"` → 토큰 alpha shorthand / `text-foreground` className.

사용자 관점에서는 **카드 elevation이 더 차분해지고**(rest shadow가 1단계 가벼워짐), **링크 끝의 화살표가 시각적으로 작아지고**(텍스트 → lucide 18px 정도), **삭제·필수 표시 색이 살짝 더 따뜻한 핑크-레드**(`#F07088`)로 바뀐다. 기능 변화 0.

## 2. 기능 요구사항

### must

#### 2.1 정보 카드 rest `shadow-md` → `shadow-sm` (Cross-8, 6곳)

| # | 파일 | 컨텍스트 | 현재 (rest 부분) | → 변경 |
|---|---|---|---|---|
| 1 | [ChecklistProgress.tsx:17](../../../src/components/checklist/ChecklistProgress.tsx#L17) | 진행률 정보 카드 | `rounded-2xl shadow-md ...` | `rounded-2xl shadow-sm ...` |
| 2 | [ChecklistRelatedContent.tsx:25](../../../src/components/checklist/ChecklistRelatedContent.tsx#L25) | 관련 콘텐츠 정보 카드 | `rounded-2xl shadow-md ...` | `rounded-2xl shadow-sm ...` |
| 3 | [WeightChart.tsx:32](../../../src/components/weight/WeightChart.tsx#L32) | 차트 컨테이너 (정보 카드) | `rounded-2xl shadow-md ...` | `rounded-2xl shadow-sm ...` |
| 4 | [BabyfairContainer.tsx:201](../../../src/components/babyfair/BabyfairContainer.tsx#L201) | 참관 팁 정보 카드 | `mt-8 rounded-2xl shadow-md ...` | `mt-8 rounded-2xl shadow-sm ...` |
| 5 | [TimelineContainer.tsx:230](../../../src/components/timeline/TimelineContainer.tsx#L230) | 현재 주차 정보 카드 | `rounded-2xl shadow-md mb-4 ...` | `rounded-2xl shadow-sm mb-4 ...` |
| 6 | [TimelineContainer.tsx:242](../../../src/components/timeline/TimelineContainer.tsx#L242) | 전체 진행률 정보 카드 | `rounded-2xl shadow-md mb-6 ...` | `rounded-2xl shadow-sm mb-6 ...` |

- input-bearing 카드(`WeightForm.tsx:35`, `UnifiedAddForm.tsx:103`, `ChecklistAddForm.tsx:52`)의 `shadow-md`는 DESIGN.md §6.2 "Form / data card: shadow-md at rest" 컨벤션 — **변경 X**.
- `hover:shadow-md` 인터랙션 lift는 DESIGN.md §6.2 "Hovered card: Add hover:shadow-md" 컨벤션 — **변경 X**.

#### 2.2 "→" 텍스트 화살표 → `<ChevronRight>` 아이콘 (Cross-7, 12곳)

| # | 파일·라인 | 현재 (텍스트 끝부분) |
|---|---|---|
| 1 | [HomeContent.tsx:275](../../../src/components/home/HomeContent.tsx#L275) | `타임라인에서 확인하기 →` |
| 2 | [TimelineCTA.tsx:32](../../../src/components/articles/TimelineCTA.tsx#L32) | `타임라인 보기 →` |
| 3 | [RelatedContent.tsx:33](../../../src/components/articles/RelatedContent.tsx#L33) | `{c.icon} {c.title} →` |
| 4 | [RelatedContent.tsx:55](../../../src/components/articles/RelatedContent.tsx#L55) | `{v.title} →` |
| 5 | [RelatedArticlesLink.tsx:27](../../../src/components/timeline/RelatedArticlesLink.tsx#L27) | `{article.title} →` |
| 6 | [RelatedChecklistsLink.tsx:35](../../../src/components/timeline/RelatedChecklistsLink.tsx#L35) | `<span aria-hidden="true">{meta.icon}</span> {meta.title} →` |
| 7 | [RelatedVideosLink.tsx:28](../../../src/components/timeline/RelatedVideosLink.tsx#L28) | `{video.title} →` |
| 8 | [ChecklistRelatedContent.tsx:42](../../../src/components/checklist/ChecklistRelatedContent.tsx#L42) | `{article.title} →` |
| 9 | [ChecklistRelatedContent.tsx:62](../../../src/components/checklist/ChecklistRelatedContent.tsx#L62) | `{week}주차 보기 →` |
| 10 | [ChecklistRelatedContent.tsx:82](../../../src/components/checklist/ChecklistRelatedContent.tsx#L82) | `{video.title} →` |
| 11 | [WeightContainer.tsx:120](../../../src/components/weight/WeightContainer.tsx#L120) | `<span ...>→</span>` |
| 12 | [ReadyStep.tsx:51](../../../src/components/onboarding/ReadyStep.tsx#L51) | `체크리스트 보러가기 →` |

- 변경 패턴: 텍스트 `→` 제거 + `<ChevronRight size={16} aria-hidden="true" className="inline-block ml-1 align-middle" />` 추가 (또는 기존 컨테이너에 `inline-flex items-center gap-1` 적용 후 ChevronRight 자식으로). 정확한 마크업은 design.md §2 참조.
- import: `import { ChevronRight } from "lucide-react";` (이미 import된 파일은 추가 안 함).
- `grep -rn "→" src/components/` 결과 0건 (블로그 콘텐츠 `src/content/`는 본 라운드 범위 외).

#### 2.3 토큰 외 red → `--destructive` 토큰 (Cross-9, 5곳)

| # | 파일·라인 | 현재 | → 변경 |
|---|---|---|---|
| 1 | [UnifiedAddForm.tsx:139](../../../src/components/timeline/UnifiedAddForm.tsx#L139) | `<span className="text-red-400">*</span>` | `<span className="text-destructive">*</span>` |
| 2 | [UnifiedAddForm.tsx:170](../../../src/components/timeline/UnifiedAddForm.tsx#L170) | `<span className="text-red-400">*</span>` | `<span className="text-destructive">*</span>` |
| 3 | [ChecklistAddForm.tsx:72](../../../src/components/checklist/ChecklistAddForm.tsx#L72) | `<span className="text-red-400">*</span>` | `<span className="text-destructive">*</span>` |
| 4 | [DeleteConfirmDialog.tsx:26](../../../src/components/timeline/DeleteConfirmDialog.tsx#L26) | `... hover:text-red-400 hover:bg-red-50 ...` | `... hover:text-destructive hover:bg-destructive/10 ...` |
| 5 | [DeleteConfirmDialog.tsx:41](../../../src/components/timeline/DeleteConfirmDialog.tsx#L41) | `... bg-red-500 hover:bg-red-600 text-white` | `... bg-destructive hover:bg-destructive/90 text-destructive-foreground` |
| 6 | [WeightContainer.tsx:97](../../../src/components/weight/WeightContainer.tsx#L97) | `... bg-red-50 text-red-500 ... hover:bg-red-100` | `... bg-destructive/10 text-destructive ... hover:bg-destructive/20` |

- `--destructive` = `#F07088`(globals.css L43), `--destructive-foreground` = `#FFFFFF`(L44).
- `grep -rn "text-red-\\|bg-red-\\|hover:bg-red-\\|hover:text-red-\\|border-red-" src/components/` 결과 0건.
- 페르소나 §3 N1·N5와 정합: `text-destructive`는 시각 강도가 `text-red-500`보다 살짝 더 따뜻(pink-leaning red), 의료 안전 컨텍스트의 "경고하지만 위협하지 않음" 톤에 맞음.

#### 2.4 토큰 외 hex → 토큰 alpha shorthand / className (2곳)

| # | 파일·라인 | 현재 | → 변경 |
|---|---|---|---|
| 1 | [ArticleDetail.tsx:68](../../../src/components/articles/ArticleDetail.tsx#L68) | `bg-gradient-to-r from-transparent via-[#F0EBE6] to-transparent` | `bg-gradient-to-r from-transparent via-black/5 to-transparent` |
| 2 | [WeekChecklistSection.tsx:206](../../../src/components/timeline/WeekChecklistSection.tsx#L206) | `style={{ backgroundColor: \`${catColor}40\`, color: "#3D4447" }}` | `className="... text-foreground"` + `style={{ backgroundColor: \`${catColor}40\` }}` |

- ArticleDetail divider — `--prose-divider`는 `.article-prose` 스코프 토큰이라 chrome에서 직접 호출 X. 가장 가까운 chrome 토큰은 `--border` (`rgba(0,0,0,0.05)`)로, Tailwind alpha shorthand `via-black/5` = 동일값. 시각적으로 현재 `#F0EBE6` 베이지보다 살짝 차가운 회색 5%로 변하므로 should §3에서 시각 검증 필수.
- WeekChecklistSection — `backgroundColor`의 `${catColor}40`은 인라인 hex 매핑(Cross-4)이라 본 라운드 won't. `color: "#3D4447"` 한 부분만 정정 — 값이 `--foreground` 토큰과 일치하므로 className `text-foreground`로 이동.

### should

- 변경 후 페이지 수동 확인:
  - **shadow 6곳**: 카드가 거의 평평해 보이는 정도(`shadow-sm`은 `0 1px 2px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)`)에서 위계가 어색해지지 않는지. hover 시 `hover:shadow-md`로 lift되는 컨벤션은 그대로.
  - **화살표 12곳**: ChevronRight 18px 안팎으로 텍스트와 시각 정합. mobile 320px에서 줄바꿈에 영향 주는지.
  - **red 5곳**: `--destructive` (#F07088)가 기존 `text-red-500`(#EF4444)·`bg-red-50`(#FEF2F2) 대비 시각 차이 — 필수 표시(*) 색은 거의 동일 인상, 삭제 버튼은 살짝 더 따뜻한 핑크-레드.
  - **divider 1곳 (ArticleDetail.tsx:68)**: `via-black/5` 정정 후 베이지→회색 변화가 cream canvas 위에서 너무 차갑게 보이면 should-trigger로 헌법에 chrome용 soft-divider 토큰 도입 검토(별도 라운드).
- 모바일 320·375·414 폭에서 화살표 정정으로 인한 줄바꿈 변화 0 검증.
- 기존 E2E 회귀 0건. ChevronRight 추가 import는 트리쉐이킹 영향 미미.

### won't

- **차트 색 변경 X** ([WeightChart.tsx:39,84-86](../../../src/components/weight/WeightChart.tsx#L39) `#FFD4DE` 라인) — 묶음 N(차트 색 결정).
- **인라인 hex 데이터 매핑 X** — WeekChecklistSection `${catColor}40`, BabyfairCard `CITY_COLORS`/`SCALE_CONFIG`, TimelineAccordionCard `TIMELINE_TYPE_CONFIG` color는 Cross-4 묶음 I (헬퍼 도입) 영역.
- **VideoCard `backdrop-blur-sm` (I-3) 처리 X** — DESIGN.md 6.3 위반이지만 본 라운드 SoT(shadow/화살표/red/hex)에 명시 없음. 별도 라운드.
- **WeightChart Tooltip `rounded-[12px]` (W-6) 처리 X** — radius 토큰 위반이지만 본 라운드 SoT에 명시 없음. 묶음 A radius 정정과 합치는 후속 라운드 검토.
- **M3·M4 마크업 변경 X** — §2.7 E 원안에 있었으나 §2.10 E SoT는 cleanup 4종만. 별도 묶음(B 또는 P-decision).
- **블로그 콘텐츠 `src/content/` 마크다운 안의 "→" 화살표 변경 X** — chrome 컴포넌트만 대상.
- **GA4 이벤트 변경 없음.**

## 3. 성공 기준

- `grep -rn "shadow-md" src/components/checklist src/components/timeline src/components/weight src/components/babyfair` 결과: rest `shadow-md`는 form 카드(WeightForm·UnifiedAddForm·ChecklistAddForm)에만 남고, 정보 카드에는 0건. `hover:shadow-md`는 보존.
- `grep -rn "→" src/components/` 결과 0건 (콘텐츠 .md 제외).
- `grep -rEn "text-red-|bg-red-|border-red-" src/components/` 결과 0건.
- `grep -rn "#F0EBE6\\|#3D4447" src/components/articles/ArticleDetail.tsx src/components/timeline/WeekChecklistSection.tsx` 결과 0건.
- 6개 영향 영역(checklist·timeline·home·articles·weight·babyfair·onboarding) 수동 확인 OK + 기존 E2E 통과(회귀 0건).
- `npm run build` 통과.
