# checklist-recommendation-semantics Implementation

> 작성일: 2026-05-08
> 관련 산출물: [spec](../features/checklist-recommendation-semantics/spec.md) · [design](../features/checklist-recommendation-semantics/design.md) · [ga4](../features/checklist-recommendation-semantics/ga4.md) · [review](../features/checklist-recommendation-semantics/review.md)

## 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 주차 24 사용자가 메인 체크리스트 진입 시 `recommendedWeek === 24` 항목들에서 마이크로 라벨 노출 | ✅ 완료 | `isHighlighted` prop을 `ChecklistPage` → `ChecklistItemRow` 로 전달, 라벨은 `CalendarCheck` 아이콘 + "이번 주 추천" 텍스트 |
| 신규 3종 슬러그 진입 시 마이크로 라벨 0개 | ✅ 완료 | 3종 슬러그 데이터는 `recommendedWeek: 0` 일괄 + 매칭 가드(`recommendedWeek !== 0`) 동시 적용 |
| `legal` 노트 항목에서 분기 시각 노출, 체크 후에도 노트 보존 | ✅ 완료 | `classifyNote` 결과로 `Scale` 아이콘 + italic. 노트는 체크 후 line-through 로 보존 (M4 합의) |
| M3 행이 모바일 320px 에서 1줄 또는 2줄로 차분 | ✅ 완료 | 우선순위 배지 → 6px 점(인라인 leading) 으로 교체. 우측 슬롯은 isCustom 일 때만 노출 |
| `recommended_item_view` 발사 (주차 입력자, 매칭 ≥1) | ✅ 완료 | 페이지뷰 당 1회, `count`/`week`/`slug` 파라미터 |
| `recommended_item_check` 발사 (추천 항목 체크 ON) | ✅ 완료 | `willCheck && currentPregnancyWeek 매칭` 가드, `item_id`/`category`/`week`/`slug` |
| `checklist_check` 에 `note_type` 파라미터 추가 (시그니처 보존) | ✅ 완료 | 노트 없으면 `null`, 있으면 `"legal"` 또는 `"default"` |
| `current_pregnancy_week` 없으면 추천 이벤트 미발사 | ✅ 완료 | view/check 양쪽 모두 `currentPregnancyWeek !== null` 가드 |

## 생성/수정 파일 목록

### 신규 생성

- `src/lib/note-classifier.ts` — `classifyNote(text)` 단일 함수. `[법령]` 접두 / `「...」` / `〈...〉` / `○○법 제N조` 4 패턴 중 하나라도 매칭되면 `"legal"`, 아니면 `"default"`. phase-5 `note_type` 필드 도입 시 같은 함수가 필드 우선 + 패턴 폴백 형태로 확장.
- `docs/implementation/checklist-recommendation-semantics-impl.md` — 본 문서.

### 수정

- `src/types/checklist.ts` — `ChecklistItem.recommendedWeek` 에 P6 시맨틱 JSDoc 추가 (`0` = 미정/주차 무관, P2 매칭 대상 아님).
- `src/components/checklist/ChecklistItemRow.tsx` — M3 정리(우선순위 배지 → 6px 점), `isHighlighted` prop 이식, 마이크로 라벨 ("이번 주 추천" + `CalendarCheck`), 노트 영역 `Scale`/`Info` 아이콘 분기, 노트 체크 후 보존(line-through), 우측 슬롯은 isCustom 일 때만.
- `src/components/checklist/ChecklistPage.tsx` — `useDueDateStore.currentPregnancyWeek` 구독, `isHighlighted(item)` 도출, `recommendedViewCount` 메모, `recommended_item_view` 1회 발사 effect, `handleToggle` 에서 `note_type` 파라미터 추가 + `recommended_item_check` 동시 발사.
- `src/components/timeline/TimelineContainer.tsx` — (a) 자동 스크롤 타겟 정정 — 기존 `firstCurrentAssigned` 가 ±1 버퍼의 첫 카드를 잡아 currentWeek=26 일 때 25주차로 점프하던 버그 수정 (별도 fix). (b) `recommendedViewCount` 메모 + `recommended_item_view` 페이지뷰 1회 effect, slug="main".
- `src/components/timeline/TimelineAccordionCard.tsx` — `currentPregnancyWeek` prop 추가 → WeekChecklistSection 으로 전달.
- `src/components/timeline/WeekChecklistSection.tsx` — 페어 합의 (A) 결과 surface 확장. `currentPregnancyWeek`/`slug` props 수용, item 행에 `aria-pressed`/`aria-label` 추가, 매칭 항목 마이크로 라벨("이번 주 추천" + CalendarCheck), 토글 시 `note_type` 파라미터 추가 + 추천 항목 ON 시 `recommended_item_check` 동시 발사.
- `docs/content/image-sop.md` — §8 "체크리스트 데이터 변경 룰" 한 줄 흡수 (P10 통합 가이드 발행 전 단독 운영).

### 삭제

- `src/components/checklist/ChecklistItem.tsx` — 사용처 0건 dead code. 디자이너 §6 2026-05-02 누적 학습("부활/삭제 결정 없이 두지 말 것") 정합. 본 묶음에서 부활(ChecklistItemRow 이식) + 원본 삭제 동시 처리.

## 주요 결정 사항

- **우선순위 시각 = 6px 점 (인라인 leading)**: 디자인 §3 표가 "작은 점 또는 호버/포커스 슬롯" 둘 중 택1. 점은 항상 보이는 형태가 스캔 효율 ↑. 색은 `accent-red` / `accent-olive` / `accent-green` (5-pastel role 토큰 아님 — 교차 0건 유지).
- **마이크로 라벨 텍스트 색 = `text-foreground` + `font-medium`**: design §5 가 `text-muted-foreground` 권장하되 대비 4.5:1 미달 시 격상으로 안전장치. WCAG AA 보장 위해 처음부터 격상안 적용.
- **마이크로 라벨 아이콘 = `CalendarCheck`**: design §5 가 `Sparkles` 또는 `CalendarCheck` 둘 중 택1. "이번 주" 의미를 더 직접 전달하는 `CalendarCheck` 선택. 아이콘은 `aria-hidden="true"`, 텍스트가 의미 전달 주체.
- **legal 노트 차별 = 아이콘 교체(`Scale`) + italic 단일 분기**: design §5 가 letter-spacing 또는 italic 한 가지로 한정. italic 이 한국어 본문에서 시각 차이가 더 명확.
- **노트 표시 가드 제거(`!isChecked &&`)**: 체크 후에도 노트 보존(M4) — 일반 노트도 같은 룰. 체크 시 `line-through` 로 시각 일관성 유지.
- **`recommended_item_view` count 정의 = 미체크 매칭 항목 수**: 페이지뷰 당 1회 발사 + count 가 0 이면 미발사. 이미 모두 체크된 추천 항목은 시각 강조 0이라 view 의미 없음 (spec §4 "이미 체크 완료" 엣지 케이스 정합).
- **`note_type` 파라미터 시그니처**: 노트가 없으면 `null` 발사 → GA4 `(not set)` 대응. 노트가 있으면 `"legal"` 또는 `"default"`. ga4.md §2 표는 `"action"`/`"context"` 도 명시하지만 phase-4.5 범위는 `legal` 만 식별 — 다른 두 분류는 phase-5 `note_type` 필드 도입 시 자동 채워짐 (락인 §6 정합).
- **ChecklistItem.tsx 즉시 삭제**: 사용처 0건 확인(grep). 부활은 ChecklistItemRow 로 이식 완료. dead code 잔존 시 다음 디자이너가 잘못 읽을 위험 회피.

## 가정 사항

- (spec §3 가정 그대로) 신규 3종 슬러그(hospital_bag/partner_prep/pregnancy_prep) 항목은 모두 `recommendedWeek: 0` 으로 일괄 — 매칭 자체에서 제외되어 마이크로 라벨 0개. 데이터 분포 확인됨.
- `currentPregnancyWeek` 셀렉터는 `useDueDateStore` 의 SSR 시점 `null` 하이드레이션을 따라간다 (P3 산출물). 첫 렌더에 `null` → 추천 이벤트 미발사 후 hydration 직후 1회 발사.
- `legal` 패턴 false positive 위험은 운영자가 발행 글 노트 100+ 개 검수로 클렌징 (spec §4 가정).
- GA4 `gtag` 미로딩 환경에서는 `sendGAEvent` 가 noop 이므로 별도 가드 불필요.

## 미구현 항목

- M1 nested interactive 정정 (행 자체와 체크박스/버튼 중첩) — spec.md `should` / `won't` 분류대로 본 묶음 범위 밖. 별도 작업.
- `note_type` 필드 신규 도입, `action`/`context` 시각 분기, `recommendedWeek: 0` 데이터 구조 변경(`null`/`alwaysRecommended`) — 모두 phase-5 P5 schema versioning 과 묶음.
- 자동 주간 리포트 wiring (`recommended_item_view → check` 전환율, `note_type` 분포) — phase-4.5 §1.9.6 별도 작업.
- DebugView/axe-core 시각 대비 검증은 `text-foreground` + `font-medium` 격상으로 안전장치 적용했지만, 실제 모바일 320/375/414 px 시각 검증은 design.md §6 체크리스트로 PR 머지 전 운영자 수동 확인.
