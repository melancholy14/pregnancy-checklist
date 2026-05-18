# checklist-recommendation-semantics

> 작성일: 2026-05-09 | 작성자: Claude Code
> 관련 산출물: [spec](../features/checklist-recommendation-semantics/spec.md) · [design](../features/checklist-recommendation-semantics/design.md) · [ga4](../features/checklist-recommendation-semantics/ga4.md) · [review (의사결정)](../features/checklist-recommendation-semantics/review.md) · [impl](../implementation/checklist-recommendation-semantics-impl.md) · [code-review](../review/checklist-recommendation-semantics-review.md) · [refactor](../refactor/checklist-recommendation-semantics-refactor.md)

## 개요

phase-4.5 P2/P6/P7 결정 묶음. (P2) `isHighlighted` "이번 주 추천" 마이크로 라벨 부활, (P6) `recommendedWeek: 0` 시맨틱 명문화 ("미정/주차 무관"), (P7) `note` 필드의 `legal` 분류 시각 분기 (텍스트 패턴 기반)를 한 PR 에 묶었다. M3 ChecklistItemRow 행 정리 + GA4 신규 이벤트 2종 + `checklist_check.note_type` 파라미터 + 페어 합의 (A) 결과 timeline surface 까지 wiring 완료. 본질 도구(체크리스트) 강화 + 추천 가치 검증 깔때기 인프라 + WCAG AA 정합 동시 달성.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 24주차 사용자 → /timeline 매칭 항목에 마이크로 라벨 노출 | ✅ 완료 | item_012/_057/_090/_109 (recommendedWeek=24) WeekChecklistSection 행에 "이번 주 추천" + CalendarCheck |
| 신규 3종 슬러그 진입 시 마이크로 라벨 0개 | ✅ 완료 | 데이터 일괄 `recommendedWeek: 0` + 매칭 가드(`recommendedWeek !== 0`) |
| `legal` 노트 항목에서 분기 시각 노출, 체크 후 노트 보존 | ✅ 완료 | `Scale` 아이콘 + italic. 노트는 line-through 로 보존 (M4 합의) |
| M3 행이 모바일 320px 에서 1~2줄로 차분 | ✅ 완료 | 우선순위 배지 → 6px 점(인라인 leading) |
| `recommended_item_view` 발사 (페이지뷰 1회, count/week/slug) | ✅ 완료 | `/checklist/*` slug=meta.slug, `/timeline` slug="main". `recommendedViewSentRef` 가드 |
| `recommended_item_check` 발사 (추천 항목 ON 토글) | ✅ 완료 | `willCheck && currentPregnancyWeek 매칭` 가드 |
| `checklist_check` 에 `note_type` 파라미터 추가 (시그니처 보존) | ✅ 완료 | 노트 없으면 `null`, legal 패턴이면 `"legal"`, 아니면 `"default"` |
| `current_pregnancy_week` 없으면 추천 이벤트 미발사 | ✅ 완료 | view/check 양쪽 `currentPregnancyWeek !== null` 가드 |

### 생성/수정 파일

**신규 (코드)**
- [src/lib/note-classifier.ts](../../src/lib/note-classifier.ts) — `classifyNote(text)` 단일 함수. `[법령]` 접두 / `「...」` / `〈...〉` / `○○법 제N조` 4 패턴 기반 분류. phase-5 `note_type` 필드 도입 시 필드 우선 + 패턴 폴백으로 확장 가능.

**수정 (코드)**
- [src/types/checklist.ts](../../src/types/checklist.ts) — `ChecklistItem.recommendedWeek` 에 P6 시맨틱 JSDoc.
- [src/components/checklist/ChecklistItemRow.tsx](../../src/components/checklist/ChecklistItemRow.tsx) — M3 정리(우선순위 배지 → 6px 점), `isHighlighted` prop 이식, 마이크로 라벨, 노트 영역 `Scale`/`Info` 분기, 노트 체크 후 보존, 우측 슬롯 isCustom 한정.
- [src/components/checklist/ChecklistPage.tsx](../../src/components/checklist/ChecklistPage.tsx) — `useDueDateStore.currentPregnancyWeek` 구독, GA4 3종 wiring (view 1회 effect / check ON / note_type).
- [src/components/timeline/TimelineContainer.tsx](../../src/components/timeline/TimelineContainer.tsx) — (a) 자동 스크롤 정확 매칭 정정 (currentWeek=26 → 25 점프 버그), (b) `recommended_item_view` slug="main" 1회 effect.
- [src/components/timeline/TimelineAccordionCard.tsx](../../src/components/timeline/TimelineAccordionCard.tsx) — `currentPregnancyWeek` prop 통과.
- [src/components/timeline/WeekChecklistSection.tsx](../../src/components/timeline/WeekChecklistSection.tsx) — 페어 합의 (A) — surface 확장. `currentPregnancyWeek`/`slug` props, 행에 `aria-pressed`/`aria-label`, 마이크로 라벨, 토글 시 `note_type` + 추천 ON 시 `recommended_item_check`.

**수정 (문서)**
- [docs/content/image-sop.md](../content/image-sop.md) — §8 "체크리스트 데이터 변경 룰" 한 줄 흡수 (P10 통합 가이드 발행 전 단독 운영).

**삭제 (코드)**
- `src/components/checklist/ChecklistItem.tsx` — 사용처 0건 dead code. 부활은 ChecklistItemRow 로 이식 완료.

**테스트**
- [e2e/checklist-recommendation-semantics.spec.ts](../../e2e/checklist-recommendation-semantics.spec.ts) — 13개 시나리오.

### 주요 결정 사항

1. **우선순위 시각 = 6px 점 (인라인 leading)**: design §3 표가 "작은 점 또는 호버/포커스 슬롯" 둘 중 택1. 점은 항상 보이는 형태가 스캔 효율 ↑. 색은 `accent-red`/`accent-olive`/`accent-green` (5-pastel role 토큰 아님 — 교차 0건).
2. **마이크로 라벨 텍스트 색 = `text-foreground` + `font-medium`**: design §5 가 `text-muted-foreground` 권장하되 대비 4.5:1 미달 시 격상 권장. 처음부터 격상안 적용 (WCAG AA 안전장치).
3. **마이크로 라벨 아이콘 = `CalendarCheck`** ("이번 주" 의미 직관 전달). aria-hidden, 텍스트가 의미 주체.
4. **legal 노트 차별 = 아이콘 교체(`Scale`) + italic**: design §5 letter-spacing 또는 italic 한 가지로 한정 — italic 이 한국어 본문에서 시각 차이 명확.
5. **노트 표시 가드 제거(`!isChecked &&`)**: M4 합의 — 체크 후에도 노트 보존 (line-through 로 시각 일관성).
6. **`recommended_item_view` count = 미체크 매칭 항목 수**: 페이지뷰 당 1회 + count=0 이면 미발사. 이미 모두 체크된 추천 항목은 시각 강조 0이라 view 의미 없음.
7. **`note_type` 파라미터 시그니처**: 노트 없으면 `null` (GA4 `(not set)` 대응). 있으면 `"legal"`/`"default"`. ga4.md `"action"`/`"context"` 는 phase-5 `note_type` 필드 도입 시 자동 채워짐 (락인 §6).
8. **ChecklistItem.tsx 즉시 삭제**: 사용처 0건. 부활 surface 는 ChecklistItemRow + WeekChecklistSection. dead code 잔존 회피.
9. **(추가, 페어 합의 A) WeekChecklistSection 까지 surface 확장**: spec/design 의 surface 가정과 코드 현실의 정합. ChecklistPage 만 wire 한 상태에서는 가시 surface 0 → 락인 자해. timeline 으로 surface 확장 + slug="main" 통합.
10. **(추가, 별도 fix) 타임라인 자동 스크롤 정확 매칭**: 기존 `firstCurrentAssigned` ±1 버퍼 첫 카드 픽 → currentWeek=26 일 때 25 카드로 점프하던 버그 수정. 정확 일치 카드(`item.week === currentWeek`) 우선, 데이터에 없을 때만 첫 "current" 카드 폴백.

### 가정 사항 및 미구현 항목

**가정**
- 신규 3종 슬러그 base 항목은 모두 `recommendedWeek: 0` (데이터 분포 확인됨).
- `currentPregnancyWeek` 셀렉터는 SSR 시점 `null` 하이드레이션. 첫 렌더 → 추천 이벤트 미발사 후 hydration 직후 1회 발사.
- `legal` 패턴 false positive 위험은 운영자가 발행 글 노트 100+ 검수로 클렌징.
- GA4 `gtag` 미로딩 환경에서는 `sendGAEvent` 가 noop.

**미구현 (모두 phase-5 P5 schema versioning 묶음)**
- `note_type` 필드 신규 도입.
- `action`/`context` 시각 분기 — phase-5.
- `recommendedWeek: 0` 데이터 구조 변경(`null`/`alwaysRecommended`) — phase-5.
- M1 nested interactive 정정 — 별도 작업.
- 자동 주간 리포트 wiring (`recommended_item_view → check` 전환율, `note_type` 분포) — phase-4.5 §1.9.6 별도.

---

## 코드 리뷰 결과

### Critical 이슈

**0건.** 즉시 수정 필요한 이슈 없음.

### Warning (수정 권장 → 모두 refactor 단계에서 처리)

| # | 항목 | 처리 |
|---|------|------|
| 1 | ChecklistItemRow 우선순위 점 aria-label 이 inner span 에 박혀 SR 인지 불완전 (WCAG AA 부분 미충족) | refactor 적용 (외곽 aria-label 합침 + 내부 aria-hidden) |
| 2 | WeekChecklistSection Checkbox aria-label 누락 | refactor 적용 |
| 3 | ChecklistItemRow `classifyNote` 매 렌더 재계산 | refactor 적용 (useMemo) |
| 4 | WeekChecklistSection `handleToggle` 매 항목 인라인 클로저 | refactor 적용 (useCallback 팩토리) |

### Suggestion (보류)

- LEGAL_PATTERNS 모듈 상수 export (운영자 클렌징 도구 SoT 확보).
- `recommendedViewSentRef` 가 due-date 변경에 무반응 — 같은 세션 cohort 변경 시 view 누락 (정책 결정 필요).
- `note_type: item.note ? ... : null` 트림 처리 부재 — 공백 노트가 `"default"` 로 발사될 가능성.
- `recommended_item_view.count` vs `recommended_item_check` 의미 분리 운영자 가이드 1줄 권장.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 4건 (모두 refactor 적용) |
| Suggestion | 4건 (모두 보류) |

---

## 리팩토링 내용

### 작업 목록

1. **ChecklistItemRow — 우선순위 a11y 정정 + classifyNote 메모화** (W1, W3): inner span 의 `aria-label` 제거 → `aria-hidden="true"`. 외곽 aria-label 에 우선순위 합침 (`${item.title} (우선순위 ${priority.label}) ${...}`). `classifyNote(item.note)` 를 `useMemo([item.note])` 로 감쌈. designer §3.1 + spec §5 WCAG AA 정합.
2. **WeekChecklistSection — Checkbox aria-label + handleToggleItem 팩토리** (W2, W4): Checkbox 에 `aria-label={'${item.title} 체크박스'}` 추가. `items.map` 인라인 클로저를 컴포넌트 최상위 `useCallback` 팩토리로 추출 → row 당 클로저 생성을 1개로 축소.

### 스킵

- 추가 판단 항목(중복·큰 컴포넌트·불필요한 메모) — 없음. 본 PR 범위 변경분 8개 파일 모두 책임 분리 + 메모화 적절.
- review.md Suggestion 4건 — refactor 범위 밖 의사결정 필요로 보류.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 8개 (변경분) | 8개 (동일) |
| ChecklistItemRow 줄 수 | 160 | 161 |
| WeekChecklistSection 줄 수 | 235 | 240 |
| `aria-label` 미보유 인터랙티브 | 1곳 | 0곳 |
| 행별 클로저 생성 | items.length 개 / 렌더 | 0개 (팩토리 1개로 통합) |
| 동작 변경 | — | 없음 (e2e 13/13 그대로 통과) |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path — /timeline 매칭 노출 | ✅ 4개 passed |
| Happy Path — legal 노트 시각 (/checklist/hospital-bag) | ✅ 3개 passed |
| Error/Negative | ✅ 4개 passed |
| 권한/인증 | — N/A (public 정적 export, p14 와 동일) |
| 반응형 (Mobile 375px) | ✅ 2개 passed |
| **전체** | **13 passed / 0 failed** (11.7s) |

리팩토링 직후 재실행에서도 13/13 그대로 통과. 동작 보존 확인.

📊 상세 리포트: [playwright-report/index.html](../../playwright-report/index.html)
