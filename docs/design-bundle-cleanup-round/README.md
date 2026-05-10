# design-bundle-cleanup-round

> 작성일: 2026-05-10 | 라운드 size: M (5묶음) | next_phase: complete (impl은 별도 라운드)
> phase-4.5 §2 디자인 잔여 묶음 중 cleanup 성격 5건을 한 라운드의 plan 단계로 정리.

## 0. 라운드 요약

| 묶음 | 슬러그 | 성격 | spec/design | 영향 영역 | size |
|---|---|---|---|---|---|
| **A** | [design-bundle-a-page-shell](../features/design-bundle-a-page-shell/) | 페이지 셸 그라디언트 + radius (C2·C3·T-1·T-6·T-7·W-3) — C1은 적용 완료 | [spec](../features/design-bundle-a-page-shell/spec.md) · [design](../features/design-bundle-a-page-shell/design.md) | checklist + timeline + weight | S |
| **C** | [design-bundle-c-heading-size](../features/design-bundle-c-heading-size/) | h1/h2/h3 인라인 size override 정리 (C4·T-9·I-5·I-6, Cross-6) | [spec](../features/design-bundle-c-heading-size/spec.md) · [design](../features/design-bundle-c-heading-size/design.md) | 전 영역 (checklist·timeline·articles) | S |
| **E** | [design-bundle-e-finishing](../features/design-bundle-e-finishing/) | shadow-md 정보 카드 / "→" 화살표 / 토큰 외 red / 토큰 외 hex (Cross-7·8·9) | [spec](../features/design-bundle-e-finishing/spec.md) · [design](../features/design-bundle-e-finishing/design.md) | 전 영역 7개 + onboarding | S (영향 면적 큼) |
| **F** | [design-bundle-f-hub-icon](../features/design-bundle-f-hub-icon/) | 허브 카드 아이콘 패턴 통일 잔여 (M5만 — M6는 P3 산출로 완료) | [spec](../features/design-bundle-f-hub-icon/spec.md) · [design](../features/design-bundle-f-hub-icon/design.md) | checklist | S |
| **O** | [design-bundle-o-external-link](../features/design-bundle-o-external-link/) | 외부 링크 보안 패턴 (B-5) — `rel="noopener noreferrer"` 표준 정렬 | [spec](../features/design-bundle-o-external-link/spec.md) · [design](../features/design-bundle-o-external-link/design.md) | baby-fair | S |

총 영향: 약 23 파일, 변경 라인 약 50여 곳 (대부분 className·문자열 교체).

페어 리뷰: 디자이너 단독 + 개발자 보조(가벼운 형식). 결정 0건 — 토큰·마크업 일괄 정정 라운드.

---

## 1. SoT 잔재 정정 보고

본 라운드 plan 작성 중 [docs/plan/phase-4.5.md §2.10 묶음 A](../plan/phase-4.5.md)의 **C1(우선순위 색 재매핑)이 이미 코드에 적용된 상태**를 발견.

[ChecklistItemRow.tsx:12-16](../../src/components/checklist/ChecklistItemRow.tsx#L12-L16):

```tsx
const PRIORITY_DOT: Record<ChecklistItem["priority"], { className: string; label: string }> = {
  high: { className: "bg-accent-red", label: "높음" },
  medium: { className: "bg-accent-olive", label: "보통" },
  low: { className: "bg-accent-green", label: "낮음" },
};
```

`accent-*` 토큰 점(dot)으로 다운그레이드되어 5-pastel role(pink=CTA / yellow=info / mint=success)을 침범하지 않음. §2.3 C1 권장 옵션 "아이콘+텍스트 다운그레이드"의 적용 결과. **본 라운드 묶음 A는 C1 제외**, 잔여(C2·C3·T-1·T-6·T-7·W-3)만 다룸.

후속: phase-4.5.md §2.10 묶음 A의 "C1·C2·C3·T-1·T-6·T-7·W-3" 항목을 "C2·C3·T-1·T-6·T-7·W-3 (C1 적용 완료)"로 갱신 권장 — 단순 텍스트 정정.

---

## 2. 5건 영향 파일 충돌 분석

### 2.1 파일·묶음 매트릭스

| 파일 | A | C | E | F | O |
|---|---|---|---|---|---|
| [ChecklistHub.tsx](../../src/components/checklist/ChecklistHub.tsx) | ✓ (175) | ✓ (70, 131) | — | ✓ (121-156) | — |
| [ChecklistPage.tsx](../../src/components/checklist/ChecklistPage.tsx) | ✓ (247, 317) | ✓ (312) | — | — | — |
| [ChecklistProgress.tsx](../../src/components/checklist/ChecklistProgress.tsx) | — | — | ✓ (17) | — | — |
| [ChecklistRelatedContent.tsx](../../src/components/checklist/ChecklistRelatedContent.tsx) | — | — | ✓ (25, 42, 62, 82) | — | — |
| [ChecklistAddForm.tsx](../../src/components/checklist/ChecklistAddForm.tsx) | — | ✓ (54) | ✓ (72) | — | — |
| [TimelineContainer.tsx](../../src/components/timeline/TimelineContainer.tsx) | ✓ (208, 358) | ✓ (356) | ✓ (230, 242) | — | — |
| [TimelineAccordionCard.tsx](../../src/components/timeline/TimelineAccordionCard.tsx) | ✓ (85) | ✓ (153) | — | — | — |
| [UnifiedAddForm.tsx](../../src/components/timeline/UnifiedAddForm.tsx) | — | ✓ (105) | ✓ (139, 170) | — | — |
| [DeleteConfirmDialog.tsx](../../src/components/timeline/DeleteConfirmDialog.tsx) | — | — | ✓ (26, 41) | — | — |
| [WeekChecklistSection.tsx](../../src/components/timeline/WeekChecklistSection.tsx) | — | — | ✓ (206) | — | — |
| [Related{Articles,Checklists,Videos}Link.tsx](../../src/components/timeline/) | — | — | ✓ (각 1곳) | — | — |
| [HomeContent.tsx](../../src/components/home/HomeContent.tsx) | — | — | ✓ (275) | — | — |
| [ArticleCard.tsx](../../src/components/articles/ArticleCard.tsx) | — | ✓ (16) | — | — | — |
| [ArticleDetail.tsx](../../src/components/articles/ArticleDetail.tsx) | — | ✓ (39) | ✓ (68) | — | — |
| [TimelineCTA.tsx](../../src/components/articles/TimelineCTA.tsx) | — | — | ✓ (32) | — | — |
| [RelatedContent.tsx](../../src/components/articles/RelatedContent.tsx) | — | — | ✓ (33, 55) | — | — |
| [WeightContainer.tsx](../../src/components/weight/WeightContainer.tsx) | ✓ (81) | — | ✓ (97, 120) | — | — |
| [WeightChart.tsx](../../src/components/weight/WeightChart.tsx) | — | — | ✓ (32) | — | — |
| [BabyfairContainer.tsx](../../src/components/babyfair/BabyfairContainer.tsx) | — | — | ✓ (201) | — | — |
| [BabyfairCard.tsx](../../src/components/babyfair/BabyfairCard.tsx) | — | — | — | — | ✓ (72-83, 208-213) |
| [ReadyStep.tsx](../../src/components/onboarding/ReadyStep.tsx) | — | — | ✓ (51) | — | — |

### 2.2 충돌 지점 (같은 파일이 여러 묶음에 등장)

같은 파일을 여러 묶음이 만지지만 **모든 충돌은 다른 라인의 변경**이라 머지 충돌은 직렬 진행 시 0이다. 다만 묶음을 **병렬 PR로 올리면** 같은 파일에 대한 동시 className 수정이 자동 머지에서 충돌 표면화될 수 있으므로 순차 권장.

| 파일 | 겹치는 묶음 | 충돌 성격 |
|---|---|---|
| ChecklistHub.tsx | A·C·F (3개) | A=라인 175(셸), C=라인 70·131(헤딩), F=라인 121-156(타임라인 카드 마크업). **세 묶음이 한 파일을 만지지만 다른 영역**. F가 마크업 블록 단위 변경이라 한 묶음으로 끝낸 뒤 진행이 가장 안전. |
| ChecklistPage.tsx | A·C (2개) | A=라인 247(셸)·317(radius), C=라인 312(헤딩). 다른 라인. |
| TimelineContainer.tsx | A·C·E (3개) | A=라인 208(셸)·358(radius), C=라인 356(헤딩), E=라인 230·242(shadow). 모두 다른 라인이지만 한 파일에 3개 묶음이 모이는 hot spot. |
| TimelineAccordionCard.tsx | A·C (2개) | A=라인 85(radius), C=라인 153(헤딩). |
| WeightContainer.tsx | A·E (2개) | A=라인 81(radius), E=라인 97(red)·120(화살표). |
| UnifiedAddForm.tsx | C·E (2개) | C=라인 105(헤딩), E=라인 139·170(red). |
| ChecklistAddForm.tsx | C·E (2개) | C=라인 54(헤딩), E=라인 72(red). |
| ArticleDetail.tsx | C·E (2개) | C=라인 39(h1), E=라인 68(divider). |
| ChecklistRelatedContent.tsx | E 단독 (E의 여러 곳) | E 안에서 4곳(shadow + 화살표 3곳) — 단일 묶음 안 멀티라인이라 직렬 충돌 없음. |

### 2.3 토큰·시각 충돌 (한 영역에 두 묶음의 결과가 동시 등장)

| 충돌 후보 | 분석 | 결정 |
|---|---|---|
| **A 우선순위 색(`accent-red`) ↔ E 토큰 외 red(`destructive`)** | A는 `--accent-red`(`#B04060`) 이미 적용된 우선순위 점 — 편집적 강조. E는 `--destructive`(`#F07088`) — 실제 destructive 액션. 같은 페이지에 두 토큰 공존 가능. DESIGN.md §2.3 명시: "`--destructive`는 actual destructive actions, `--accent-red`는 editorial emphasis only". 의미 분리가 의도된 것. 충돌 아님. | 두 토큰 그대로 사용 |
| **A 페이지 셸 단색 ↔ E 정보 카드 shadow-sm** | A로 페이지 배경이 단색 cream이 되고, E로 카드가 1단계 평평해진다. 카드와 배경 contrast가 살짝 줄어들 가능성. 단 cream(`#FFFAF7`)과 카드 white(`#FFFFFF`)는 색 자체로 elevation cue가 있고(DESIGN.md §1: "card's whiteness against the cream canvas IS the elevation cue"), border `rgba(0,0,0,0.05)`도 보조. | 충돌 아님. shadow-sm + 카드 white로 elevation 충분 |
| **C 헤딩 사이즈 증가 ↔ A 셸 변경** | C로 카드 타이틀이 시각적으로 커지고 A로 배경이 단색이 된다. 두 변경 모두 "위계가 또렷해짐" 방향이라 같은 라운드에서 합치면 시너지. | 충돌 아님 |
| **F 이모지 정렬 ↔ A 셸 변경** | F가 ChecklistHub의 타임라인 카드 컨테이너(`bg-pastel-pink/40`)를 제거하고 A가 같은 페이지의 셸을 변경. 둘 다 "pink CTA 침범 해소" 방향과 정합. | 충돌 아님 |
| **E divider `via-black/5` ↔ ArticleDetail 페이지 톤** | `#F0EBE6`(베이지 5%) → `rgba(0,0,0,0.05)`(회색 5%) 변경. cream canvas 위에서 살짝 더 차가워질 가능성. spec E §3 should에 시각 검증 노트. 시각 차이가 너무 크면 헌법에 chrome용 soft-divider 토큰 도입(별도 라운드 트리거). | 시각 검증 후 결정 — 잠재 후속 |

총 충돌 단락: 5건의 영향 파일이 8개 hot spot에서 겹치지만 **모든 변경이 다른 라인·다른 토큰 슬롯**이고, 토큰 의미(`accent-red` ≠ `destructive`)도 헌법상 분리되어 있어 실질 충돌 0. 단 E의 ArticleDetail divider 톤 변경 1건은 **시각 검증 트리거** — 차가워 보이면 chrome용 soft-divider 토큰 도입 헌법 라운드를 후속으로 분리.

---

## 3. 권장 실행 순서

**A → C → E → F → O**

| 순서 | 묶음 | 이유 |
|---|---|---|
| 1 | **A** | 페이지 셸·radius — 시스템 기반 토큰 정렬. 다른 묶음의 마크업 변경이 정렬된 시스템 위에 올라간다. ChecklistHub·ChecklistPage·TimelineContainer·TimelineAccordionCard·WeightContainer 5파일이 다음 묶음에서 다시 등장하므로 첫 패스가 토큰 정렬이 되도록. |
| 2 | **C** | 인라인 헤딩 size override 제거. ChecklistHub·ChecklistPage·TimelineContainer·TimelineAccordionCard·UnifiedAddForm·ChecklistAddForm·ArticleCard·ArticleDetail 8파일. A 끝낸 위에서 같은 파일 다시 만지는 것이 가장 자연스러움. |
| 3 | **E** | 마감 cleanup 25곳. A·C 끝난 위에서 잔재만 정정. ArticleDetail divider 시각 검증이 가장 안전한 시점. |
| 4 | **F** | ChecklistHub의 한 곳(타임라인 카드 마크업 블록). A·C·E 끝낸 후 ChecklistHub 마지막 패스. |
| 5 | **O** | BabyfairCard 단독, 다른 묶음과 충돌 없음. 마지막에 두는 이유는 "외부 링크 보안 검증 + E2E 회귀 가드"가 다른 묶음과 분리되어 보이도록. 언제 해도 OK이지만 라운드 마지막 검증 단계로 자연스러움. |

각 묶음은 **독립 PR + 독립 E2E 가드**로 진행 권장. 직전 라운드(g·h·d·l)와 같은 톤. 묶음별 spec.md "§3 성공 기준"이 PR description의 acceptance criteria가 됨.

---

## 4. 본 라운드 산출물

### 4.1 묶음별 plan/spec/design

```
docs/features/design-bundle-a-page-shell/
├── meta.md
├── spec.md
└── design.md
docs/features/design-bundle-c-heading-size/
├── meta.md
├── spec.md
└── design.md
docs/features/design-bundle-e-finishing/
├── meta.md
├── spec.md
└── design.md
docs/features/design-bundle-f-hub-icon/
├── meta.md
├── spec.md
└── design.md
docs/features/design-bundle-o-external-link/
├── meta.md
├── spec.md
└── design.md
```

### 4.2 라운드 통합 (이 파일)

```
docs/design-bundle-cleanup-round/
└── README.md  (충돌 분석 + 실행 순서 + 인덱스)
```

각 묶음 산출물 6개 파일(meta + spec + design × 5묶음 = 15) + 통합 README 1 = **총 16 파일**. 코드 수정 0.

---

## 5. 다음 단계 (별도 라운드)

본 라운드 완료 후 phase-4.5 §2.10의 잔여:

| 묶음 | 상태 | 비고 |
|---|---|---|
| **B** | ⚠️ 미착수 | WeekChecklistSection을 label 기반 마크업으로 (M1·T-5, Cross-5) — 마크업 리팩터, 본 라운드 cleanup 범위 외 |
| **I** | ⚠️ 미착수 | 데이터→토큰 매핑 헬퍼 도입 (Cross-4) — WeekChecklistSection `${catColor}40`, BabyfairCard CITY_COLORS / SCALE_CONFIG, TimelineAccordionCard `TIMELINE_TYPE_CONFIG` |
| **J** | ⚠️ 미착수 | ShareButton 위치 컨벤션 결정 + 일괄 정렬 (Cross-10) |
| **K** | ⚠️ 미착수 | 삭제 패턴 통일 — undo 토스트 도입 (Cross-11) |
| **N** | ⚠️ 미착수 | 차트 색 결정 (W-1) — peach 라인 + 권장 범위 톤 재배치 |

추가로 본 라운드에서 식별된 잠재 후속:
- 글로벌 hN 사이즈 자체 조정 (Cross-6 옵션 B) — DESIGN.md 헌법 갱신 필요
- chrome용 soft-divider 토큰 도입 — E의 ArticleDetail divider 시각 검증 결과에 따라
- VideoCard `backdrop-blur-sm` (I-3) 정정 — 본 라운드 SoT 외, 단독 라운드 또는 후속 cleanup 라운드
- WeightChart Tooltip `rounded-[12px]` (W-6) → `rounded-xl`
- BabyfairCard `role="button"` Card wrapper 마크업 (Cross-5와 같은 결)

phase-4.5.md §2.10 잔여 권장 순서(2026-05-10 기준): **A → C → E → F → B → I → J → K → N → O** — 본 라운드는 cleanup 5건(A·C·E·F·O)을 한 묶음으로 끌어냄. B·I·J·K·N은 결정 또는 마크업 리팩터가 동반되는 별개 라운드.
