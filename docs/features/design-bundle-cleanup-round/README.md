# design-bundle-cleanup-round

> 작성일: 2026-05-10 · 작성자: Claude Code (feature-pipeline)
> 라운드 plan/conflict 분석: [docs/design-bundle-cleanup-round/README.md](../../design-bundle-cleanup-round/README.md)
> 묶음별 spec/design: [A](../design-bundle-a-page-shell/) · [C](../design-bundle-c-heading-size/) · [E](../design-bundle-e-finishing/) · [F](../design-bundle-f-hub-icon/) · [O](../design-bundle-o-external-link/)

## 개요

phase-4.5 §2.10 디자인 잔여 묶음 5건(A·C·E·F·O)을 한 라운드 PR로 통합 구현한 cleanup 라운드. 5묶음 합쳐 23 파일·약 50여 className/마크업 교체 + BabyfairCard 외부 링크 메커니즘 정렬 (window.open → anchor 표준). 인터랙션·상태·GA 이벤트 변경 0.

| 묶음 | 성격 |
|---|---|
| A | 페이지 셸 그라디언트 + 페이지-레벨 카드 radius (3+4 사이트) |
| C | 인라인 heading size override 제거 (9 사이트) |
| E | shadow-md 정보 카드·"→" 화살표·토큰 외 red·토큰 외 hex (25 사이트) |
| F | ChecklistHub 타임라인 카드 아이콘 슬롯 정렬 (1 사이트) |
| O | BabyfairCard 외부 링크 anchor + rel 표준 (1 사이트) |

> ⓘ **운영자 옵션**: 본 라운드 산출 README를 통합 README([docs/design-bundle-cleanup-round/README.md](../../design-bundle-cleanup-round/README.md))에 append하는 편이 인덱스 응집도가 더 좋다고 판단되면 본 파일을 §6 등으로 옮겨도 좋다. 본 위치(`docs/features/design-bundle-cleanup-round/`)는 라운드 내 다른 5묶음과 동일한 `docs/features/design-bundle-*` 구조를 따른 것.

---

## 구현 내용

### 완료 조건 충족 여부

| 묶음 | 조건 | 상태 |
|---|---|---|
| **A** | `bg-linear-to-b from-background to-white` 0건 (checklist·timeline·weight) | ✅ |
| **A** | 페이지-레벨 카드 4곳 `rounded-2xl` 적용 | ✅ |
| **C** | `<h[123].*text-[15px]>` 영향 8곳 0건 | ✅ |
| **C** | ArticleDetail h1 `text-xl` 0건 | ✅ |
| **E** | 정보 카드 6곳 `shadow-md` → `shadow-sm` (form 카드 / `hover:shadow-md` 보존) | ✅ |
| **E** | 텍스트 `→` 12곳 → `<ChevronRight aria-hidden>` (`grep` 0건) | ✅ |
| **E** | 토큰 외 red 5곳 → `--destructive` 토큰 (`text-red-/bg-red-/border-red-` 0건) | ✅ |
| **E** | `#F0EBE6` / `#3D4447` 0건 | ✅ |
| **F** | ChecklistHub `<Calendar>` import/사용 0건 + 타임라인 카드 = 다른 3장 동일 패턴 | ✅ |
| **O** | `window.open` BabyfairCard 0건 + `rel="noopener noreferrer"` 1건 이상 | ✅ |
| 공통 | `npm run build` 통과 | ✅ |

### 생성/수정 파일 (23개, 신규 0)

**Bundle A — page shell + radius**
- `ChecklistHub.tsx`·`ChecklistPage.tsx`·`TimelineContainer.tsx` 셸 → `bg-background`
- `ChecklistPage.tsx`·`TimelineAccordionCard.tsx`·`TimelineContainer.tsx`·`WeightContainer.tsx` 카드 → `rounded-2xl`

**Bundle C — inline heading size override 제거**
- `ChecklistHub.tsx`(2곳)·`ChecklistPage.tsx`·`ChecklistAddForm.tsx`·`TimelineContainer.tsx`·`TimelineAccordionCard.tsx`·`UnifiedAddForm.tsx`·`ArticleCard.tsx`·`ArticleDetail.tsx`

**Bundle E — shadow / arrow / red / hex**
- shadow-sm 6곳: `ChecklistProgress.tsx`·`ChecklistRelatedContent.tsx`·`WeightChart.tsx`·`BabyfairContainer.tsx`·`TimelineContainer.tsx`(2곳)
- ChevronRight 12곳: `HomeContent.tsx`·`TimelineCTA.tsx`·`RelatedContent.tsx`(2곳)·`RelatedArticlesLink.tsx`·`RelatedChecklistsLink.tsx`·`RelatedVideosLink.tsx`·`ChecklistRelatedContent.tsx`(3곳)·`WeightContainer.tsx`·`ReadyStep.tsx`
- `--destructive` 토큰 6곳: `UnifiedAddForm.tsx`(2곳)·`ChecklistAddForm.tsx`·`DeleteConfirmDialog.tsx`(2곳)·`WeightContainer.tsx`
- hex 정정 2곳: `ArticleDetail.tsx`(via-black/5)·`WeekChecklistSection.tsx`(text-foreground)

**Bundle F — hub timeline card icon**
- `ChecklistHub.tsx` Calendar import 제거 + 타임라인 카드 아이콘 슬롯을 `<span className="text-3xl shrink-0" aria-hidden>🗓️</span>`로 정렬

**Bundle O — BabyfairCard external-link anchor**
- `BabyfairCard.tsx` `toast` import 제거, `window.open` 메커니즘을 `<AlertDialogAction asChild><a target="_blank" rel="noopener noreferrer">`로 정렬, fallback toast 제거

자세한 라인 단위 매핑: [docs/implementation/design-bundle-cleanup-round-impl.md](../../implementation/design-bundle-cleanup-round-impl.md)

### 주요 결정 사항

- **`<ChevronRight>` 마크업 패턴 통일**: 기존 `block` + 텍스트 끝 "→" 패턴을 `flex items-center gap-1` + `<span className="flex-1 min-w-0">{title}</span>` + `<ChevronRight ... aria-hidden ... shrink-0 />` 로 재구성. 긴 타이틀이 줄바꿈될 때 화살표가 끝줄에 고립되지 않고 일관된 우측 정렬을 유지하기 위함.
- **ChevronRight 크기**: 16px(`text-sm` 14px 옆 인라인 목록)·18px(버튼 컨텍스트). 시각 정합성에 따라 분리.
- **WeekChecklistSection Badge `text-foreground` 위치**: spec §2.4 가이드대로 className 끝에 추가하고 `style.color`만 제거. `style.backgroundColor`(`${catColor}40`)는 Cross-4 묶음 I 영역으로 보존.
- **BabyfairCard `handleConfirmClick`**: 기존 `handleConfirm`을 anchor `onClick`으로 옮기되, GA 이벤트 발사 + `setOpen(false)`만 남기고 `window.open`/`opener=null`/팝업 차단 toast 모두 제거. anchor `target="_blank"`가 브라우저 navigation을 직접 처리하므로 fallback 불필요.

### 가정 사항 및 미구현

- 글로벌 hN 사이즈 정의(`globals.css @layer base`)는 본 라운드 미변경. 인라인 override 제거만으로 시각 위계가 또렷해지는 효과는 글로벌 h2(`text-xl` 20px) / h3(`text-lg` 18px)에 의존.
- 별도 라운드로 트리거되는 잔여 (본 라운드 won't 명시):
  - 묶음 B(WeekChecklistSection label 기반 마크업) / I(데이터→토큰 매핑 헬퍼) / J(ShareButton 위치) / K(undo 토스트) / N(차트 색)
  - 글로벌 hN 헌법 갱신 / chrome용 soft-divider 토큰 / VideoCard backdrop-blur / WeightChart Tooltip rounded / BabyfairCard `role="button"` Card wrapper

---

## 코드 리뷰 결과

### Critical 이슈
**0건**. 변경 성격(className·텍스트 정렬 cleanup + BabyfairCard 메커니즘 정렬)이라 런타임 위험 표면 없음.

### Warning (수정 권장 → refactor 단계에서 정정 완료)
| # | 위치 | 내용 |
|---|---|---|
| 1 | `ChecklistHub.tsx:71,132` | 데코 ChevronRight `aria-hidden` 누락 (pre-existing 잔재) |
| 2 | `HomeContent.tsx:237` | 같은 결 |

### Suggestion (별도 라운드 트리거)
- `WeekChecklistSection` 인라인 hex `${catColor}40` — 묶음 I (데이터→토큰 헬퍼)
- `ChecklistHub` weekLabel 배지 `bg-pastel-pink/40` — pink CTA 침범 audit 별도 라운드
- `BabyfairCard` `role="button"` Card wrapper — 묶음 B 같은 결

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 2건 (refactor 단계에서 일괄 정정 완료) |
| Suggestion | 3건 (모두 라운드 won't 명시 후속 영역) |

자세한 분석: [docs/review/design-bundle-cleanup-round-review.md](../../review/design-bundle-cleanup-round-review.md)

---

## 리팩토링 내용

review Warning 2건만 정리. Suggestion 3건은 가이드대로 별도 라운드 영역이라 제외.

### 작업 목록
- `ChecklistHub.tsx:71,132` ChevronRight 데코에 `aria-hidden="true"` 추가
- `HomeContent.tsx:237` 동일

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 라운드 + review 영향 영역 ChevronRight `aria-hidden` 누락 | 3/13 | 0/13 |
| 라운드 SoT 외 잔재 | DashboardCard.tsx:43 (1곳) | 동일 — 별도 cleanup 후속 트리거 |
| public interface | 변경 없음 | 변경 없음 |

자세한 내용: [docs/refactor/design-bundle-cleanup-round-refactor.md](../../refactor/design-bundle-cleanup-round-refactor.md)

---

## E2E 테스트 결과

### 라운드 가드 (`e2e/design-bundle-cleanup-round.spec.ts`)

| # | 가드 | 영역 | 결과 |
|---|---|---|---|
| 1 | 페이지 셸 단색 회귀 | A | ✅ |
| 2 | 헤딩 위계 회귀 (인라인 size override 0) | C | ✅ |
| 3 | cleanup grep 가드 (fs walk: 화살표·red·hex·shadow-md) | A·C·E | ✅ |
| 4 | 허브 카드 4장 시각 정합 (text-3xl 이모지 단독) | F | ✅ |
| 5 | BabyfairCard outbound + rel 표준 + GA outbound_click | O | ✅ |
| **전체** | | | **5 passed / 0 failed** (12.6초, post-refactor 재실행) |

### 전체 회귀 (post-impl, 552 tests)

| 분류 | 건수 |
|---|---|
| Pass | 464 |
| Fail | 86 |
| Skip | 2 |

86 fail 트리아지:
- **라운드 직접 영향 1건**: `baby-fair.spec.ts:84` button → link role 변경 (Bundle O), 정정 완료.
- **나머지 85건은 모두 pre-existing stale**: article 파일 삭제·페이지 카피 변경(예: `weight.spec.ts:13` 텍스트는 `45ea7b7` 2026-04-19 이후 stale)·cookie consent timing flake. 라운드 책임 외.

post-refactor 검증 (라운드 가드 5 + 베이비페어 13 + 체크리스트 1 = 19 tests): **19/19 통과**.

📊 상세 리포트: `playwright-report/index.html` (`npx playwright show-report`로 열람)

---

## 라운드 가드 grep 결과 (구현 후 baseline)

```
$ grep -rEn "to-white" src/components/checklist src/components/timeline src/components/weight   # 0건
$ grep -rn "→" src/components/                                                                   # 0건
$ grep -rEn "text-red-|bg-red-|border-red-" src/components/                                      # 0건
$ grep -rEn "<h[123][^>]*text-\[15px\]" src/components/                                          # 0건
$ grep -n "Calendar" src/components/checklist/ChecklistHub.tsx                                   # 0건
$ grep -n "window.open" src/components/babyfair/BabyfairCard.tsx                                 # 0건
$ grep -n 'rel="noopener noreferrer"' src/components/babyfair/BabyfairCard.tsx                   # 1건
```

`npm run build` 통과 (Next.js 16.2.0 Turbopack, 32 페이지 정적 생성).
