# design-bundle-a-page-shell 기획서 (간단판)

> 작성일: 2026-05-10  size: S
> 출처: [docs/plan/phase-4.5.md §2.10 묶음 A](../../plan/phase-4.5.md), §2.3 C1·C2·C3, §2.8.2 T-1·T-6·T-7, §2.8.4 W-3, §2.9 Cross-3
> 라운드: [design-bundle-cleanup-round](../../design-bundle-cleanup-round/README.md)

## 0. 사전 확정 결정 (사용자 입력, 2026-05-10)

- **페어 리뷰**: 디자이너 단독 + 개발자 보조(가벼운 형식). 결정 0건 cleanup.
- **C1(우선순위 색 재매핑)은 본 묶음에서 다루지 않는다 — 이미 적용 완료.** [ChecklistItemRow.tsx:12-16](../../../src/components/checklist/ChecklistItemRow.tsx#L12-L16) `PRIORITY_DOT`이 `accent-red/accent-olive/accent-green` 점 다운그레이드로 5-pastel role을 침범하지 않음. SoT 미업데이트로 §2.10 A에 남아 있던 항목.
- **본 묶음 처리 대상 = C2·C3·T-1·T-6·T-7·W-3** (페이지 셸 그라디언트 + radius 통일).

## 1. 사용자 시나리오

체크리스트 허브·체크리스트 상세·타임라인 3개 페이지의 셸 배경이 `bg-linear-to-b from-background to-white`로 끝점이 순백이라 [DESIGN.md §1·§10](../../../DESIGN.md)의 "cream canvas는 브랜드 차별점, pure white는 페이지 배경 금지" 헌법을 깨고 있던 것을, `bg-background` 단색으로 일괄 정정한다. 동시에 체크리스트 서브카테고리 카드·타임라인 주차 카드·타임라인 기타 섹션 카드·체중 로그 카드의 radius가 `rounded-xl`(18px, 버튼용)로 잡혀 있어 페이지-레벨 카드 컨벤션(`rounded-2xl`=16px)을 어기고 있던 것도 같이 정렬한다. 사용자 관점에서는 페이지 하단의 클리니컬한 흰빛이 사라지고, 카드의 둥근 정도가 카드답게 살짝 더 둥글어진다. 기능 변화 0.

## 2. 기능 요구사항

### must

#### 2.1 페이지 셸 그라디언트 → `bg-background` 단색 (3곳)

| 위치 | 파일 | 현재 | → 변경 후 |
|---|---|---|---|
| 체크리스트 허브 셸 | [ChecklistHub.tsx:175](../../../src/components/checklist/ChecklistHub.tsx#L175) | `bg-linear-to-b from-background to-white` | `bg-background` |
| 체크리스트 상세 셸 | [ChecklistPage.tsx:247](../../../src/components/checklist/ChecklistPage.tsx#L247) | `bg-linear-to-b from-background to-white` | `bg-background` |
| 타임라인 셸 | [TimelineContainer.tsx:208](../../../src/components/timeline/TimelineContainer.tsx#L208) | `bg-linear-to-b from-background to-white` | `bg-background` |

- `grep -rn "to-white" src/components/checklist src/components/timeline` 결과 0건이어야 한다.
- `grep -rn "bg-linear-to-b from-background" src/` 결과 0건.

#### 2.2 페이지-레벨 카드 radius `rounded-xl` → `rounded-2xl` (4곳)

| 위치 | 파일 | 현재 | → 변경 후 |
|---|---|---|---|
| 체크리스트 서브카테고리 카드 | [ChecklistPage.tsx:317](../../../src/components/checklist/ChecklistPage.tsx#L317) | `rounded-xl border border-black/4` | `rounded-2xl border border-black/4` |
| 타임라인 주차 카드 | [TimelineAccordionCard.tsx:85](../../../src/components/timeline/TimelineAccordionCard.tsx#L85) | `rounded-xl shadow-sm transition-all border ${...}` | `rounded-2xl shadow-sm transition-all border ${...}` |
| 타임라인 "기타" 섹션 카드 | [TimelineContainer.tsx:358](../../../src/components/timeline/TimelineContainer.tsx#L358) | `rounded-xl border border-black/4` | `rounded-2xl border border-black/4` |
| 체중 로그 카드 | [WeightContainer.tsx:81](../../../src/components/weight/WeightContainer.tsx#L81) | `rounded-xl border border-black/4` | `rounded-2xl border border-black/4` |

- 변경 4곳은 모두 `<Card>` 컨테이너의 페이지-레벨 카드 (rounded-2xl 컨벤션 대상).
- 버튼·input·체크리스트 행(`ChecklistItemRow`/`WeekChecklistSection` 의 `p-3 rounded-xl` row 컨테이너)·`AlertDialogCancel` 등 비-카드 컨텍스트의 `rounded-xl`은 변경 대상 아님 — DESIGN.md 5.1 "buttons use rounded-xl" 컨벤션 의도적 비대칭 유지.

### should

- 변경 직후 화면 수동 확인:
  - `/checklist`·`/checklist/<slug>`·`/timeline`·`/weight` 4페이지에서 페이지 하단 흰빛 소실 + 카드 둥근 정도 시각 확인.
  - 모바일 폭 320·375·414 3개 폭에서 깨짐 0(페이지 셸 변경이 폭 처리에 영향 주지 않음 검증).
- 기존 E2E 회귀 0건 — 본 변경은 className 텍스트 교체만이라 인터랙션·상태·접근성 변화 없음.

### won't

- **C1(우선순위 색 재매핑) 처리 X** — 이미 적용 완료 ([ChecklistItemRow.tsx:12-16](../../../src/components/checklist/ChecklistItemRow.tsx#L12-L16)). SoT 잔재 정정만 통합 README에서 처리.
- **5-pastel 내부 그라디언트(예: [HomeContent.tsx:180](../../../src/components/home/HomeContent.tsx#L180), [TimelineContainer.tsx:309](../../../src/components/timeline/TimelineContainer.tsx#L309), [TimelineContainer.tsx:373](../../../src/components/timeline/TimelineContainer.tsx#L373)) 변경 X** — `to-white`가 아니라 5-pastel 안에서의 그라디언트라 헌법 위반 아님.
- **버튼·input·dialog의 `rounded-xl` 변경 X** — DESIGN.md 5.1 의도된 비대칭(card=2xl, button=xl).
- **shadow / 색 토큰 / red 컬러 / 화살표 처리 X** — 묶음 E.
- **인라인 h2/h3 size override 처리 X** — 묶음 C.
- **GA4 이벤트 변경 없음.**

## 3. 성공 기준

- `grep -rn "bg-linear-to-b from-background to-white" src/` 결과 0건.
- 변경 4곳의 카드 컨테이너 className에 `rounded-2xl` 적용 확인.
- 4페이지 수동 확인 OK + 기존 E2E 통과(회귀 0건).
- `npm run build` 통과.
