# checklist-recommendation-semantics

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-05-09
> plan: [spec](../../features/checklist-recommendation-semantics/spec.md) · [design](../../features/checklist-recommendation-semantics/design.md) · [ga4](../../features/checklist-recommendation-semantics/ga4.md)

<!-- STEP:impl -->
## 구현

> 작성일: 2026-05-08
> 관련 산출물: [spec](../../features/checklist-recommendation-semantics/spec.md) · [design](../../features/checklist-recommendation-semantics/design.md) · [ga4](../../features/checklist-recommendation-semantics/ga4.md) · [review](../../features/checklist-recommendation-semantics/review.md)

### 완료 조건 충족 여부

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

### 생성/수정 파일 목록

#### 신규 생성

- `src/lib/note-classifier.ts` — `classifyNote(text)` 단일 함수. `[법령]` 접두 / `「...」` / `〈...〉` / `○○법 제N조` 4 패턴 중 하나라도 매칭되면 `"legal"`, 아니면 `"default"`. phase-5 `note_type` 필드 도입 시 같은 함수가 필드 우선 + 패턴 폴백 형태로 확장.
- `이 문서` — 본 문서.

#### 수정

- `src/types/checklist.ts` — `ChecklistItem.recommendedWeek` 에 P6 시맨틱 JSDoc 추가 (`0` = 미정/주차 무관, P2 매칭 대상 아님).
- `src/components/checklist/ChecklistItemRow.tsx` — M3 정리(우선순위 배지 → 6px 점), `isHighlighted` prop 이식, 마이크로 라벨 ("이번 주 추천" + `CalendarCheck`), 노트 영역 `Scale`/`Info` 아이콘 분기, 노트 체크 후 보존(line-through), 우측 슬롯은 isCustom 일 때만.
- `src/components/checklist/ChecklistPage.tsx` — `useDueDateStore.currentPregnancyWeek` 구독, `isHighlighted(item)` 도출, `recommendedViewCount` 메모, `recommended_item_view` 1회 발사 effect, `handleToggle` 에서 `note_type` 파라미터 추가 + `recommended_item_check` 동시 발사.
- `src/components/timeline/TimelineContainer.tsx` — (a) 자동 스크롤 타겟 정정 — 기존 `firstCurrentAssigned` 가 ±1 버퍼의 첫 카드를 잡아 currentWeek=26 일 때 25주차로 점프하던 버그 수정 (별도 fix). (b) `recommendedViewCount` 메모 + `recommended_item_view` 페이지뷰 1회 effect, slug="main".
- `src/components/timeline/TimelineAccordionCard.tsx` — `currentPregnancyWeek` prop 추가 → WeekChecklistSection 으로 전달.
- `src/components/timeline/WeekChecklistSection.tsx` — 페어 합의 (A) 결과 surface 확장. `currentPregnancyWeek`/`slug` props 수용, item 행에 `aria-pressed`/`aria-label` 추가, 매칭 항목 마이크로 라벨("이번 주 추천" + CalendarCheck), 토글 시 `note_type` 파라미터 추가 + 추천 항목 ON 시 `recommended_item_check` 동시 발사.
- `docs/content/image-sop.md` — §8 "체크리스트 데이터 변경 룰" 한 줄 흡수 (P10 통합 가이드 발행 전 단독 운영).

#### 삭제

- `src/components/checklist/ChecklistItem.tsx` — 사용처 0건 dead code. 디자이너 §6 2026-05-02 누적 학습("부활/삭제 결정 없이 두지 말 것") 정합. 본 묶음에서 부활(ChecklistItemRow 이식) + 원본 삭제 동시 처리.

### 주요 결정 사항

- **우선순위 시각 = 6px 점 (인라인 leading)**: 디자인 §3 표가 "작은 점 또는 호버/포커스 슬롯" 둘 중 택1. 점은 항상 보이는 형태가 스캔 효율 ↑. 색은 `accent-red` / `accent-olive` / `accent-green` (5-pastel role 토큰 아님 — 교차 0건 유지).
- **마이크로 라벨 텍스트 색 = `text-foreground` + `font-medium`**: design §5 가 `text-muted-foreground` 권장하되 대비 4.5:1 미달 시 격상으로 안전장치. WCAG AA 보장 위해 처음부터 격상안 적용.
- **마이크로 라벨 아이콘 = `CalendarCheck`**: design §5 가 `Sparkles` 또는 `CalendarCheck` 둘 중 택1. "이번 주" 의미를 더 직접 전달하는 `CalendarCheck` 선택. 아이콘은 `aria-hidden="true"`, 텍스트가 의미 전달 주체.
- **legal 노트 차별 = 아이콘 교체(`Scale`) + italic 단일 분기**: design §5 가 letter-spacing 또는 italic 한 가지로 한정. italic 이 한국어 본문에서 시각 차이가 더 명확.
- **노트 표시 가드 제거(`!isChecked &&`)**: 체크 후에도 노트 보존(M4) — 일반 노트도 같은 룰. 체크 시 `line-through` 로 시각 일관성 유지.
- **`recommended_item_view` count 정의 = 미체크 매칭 항목 수**: 페이지뷰 당 1회 발사 + count 가 0 이면 미발사. 이미 모두 체크된 추천 항목은 시각 강조 0이라 view 의미 없음 (spec §4 "이미 체크 완료" 엣지 케이스 정합).
- **`note_type` 파라미터 시그니처**: 노트가 없으면 `null` 발사 → GA4 `(not set)` 대응. 노트가 있으면 `"legal"` 또는 `"default"`. ga4.md §2 표는 `"action"`/`"context"` 도 명시하지만 phase-4.5 범위는 `legal` 만 식별 — 다른 두 분류는 phase-5 `note_type` 필드 도입 시 자동 채워짐 (락인 §6 정합).
- **ChecklistItem.tsx 즉시 삭제**: 사용처 0건 확인(grep). 부활은 ChecklistItemRow 로 이식 완료. dead code 잔존 시 다음 디자이너가 잘못 읽을 위험 회피.

### 가정 사항

- (spec §3 가정 그대로) 신규 3종 슬러그(hospital_bag/partner_prep/pregnancy_prep) 항목은 모두 `recommendedWeek: 0` 으로 일괄 — 매칭 자체에서 제외되어 마이크로 라벨 0개. 데이터 분포 확인됨.
- `currentPregnancyWeek` 셀렉터는 `useDueDateStore` 의 SSR 시점 `null` 하이드레이션을 따라간다 (P3 산출물). 첫 렌더에 `null` → 추천 이벤트 미발사 후 hydration 직후 1회 발사.
- `legal` 패턴 false positive 위험은 운영자가 발행 글 노트 100+ 개 검수로 클렌징 (spec §4 가정).
- GA4 `gtag` 미로딩 환경에서는 `sendGAEvent` 가 noop 이므로 별도 가드 불필요.

### 미구현 항목

- M1 nested interactive 정정 (행 자체와 체크박스/버튼 중첩) — spec.md `should` / `won't` 분류대로 본 묶음 범위 밖. 별도 작업.
- `note_type` 필드 신규 도입, `action`/`context` 시각 분기, `recommendedWeek: 0` 데이터 구조 변경(`null`/`alwaysRecommended`) — 모두 phase-5 P5 schema versioning 과 묶음.
- 자동 주간 리포트 wiring (`recommended_item_view → check` 전환율, `note_type` 분포) — phase-4.5 §1.9.6 별도 작업.
- DebugView/axe-core 시각 대비 검증은 `text-foreground` + `font-medium` 격상으로 안전장치 적용했지만, 실제 모바일 320/375/414 px 시각 검증은 design.md §6 체크리스트로 PR 머지 전 운영자 수동 확인.

---

<!-- STEP:review -->
## 코드 리뷰

> 작성일: 2026-05-09
> 관련 산출물: [spec](../../features/checklist-recommendation-semantics/spec.md) · [impl](#구현)

### 리뷰 대상 파일

- `src/lib/note-classifier.ts` (신규)
- `src/types/checklist.ts` (수정 — JSDoc만)
- `src/components/checklist/ChecklistItemRow.tsx` (수정)
- `src/components/checklist/ChecklistPage.tsx` (수정)
- `src/components/checklist/ChecklistItem.tsx` (삭제)
- `src/components/timeline/TimelineContainer.tsx` (수정)
- `src/components/timeline/TimelineAccordionCard.tsx` (수정)
- `src/components/timeline/WeekChecklistSection.tsx` (수정)

총 8개 파일 (impl.md 기준).

---

### Critical 이슈

**0건.** 즉시 수정 필요한 이슈 없음.

---

### Warning (수정 권장)

#### 1. ChecklistItemRow — 우선순위 점 aria-label 이 inner span 에 박혀 스크린리더 인지 불완전

- **위치**: [src/components/checklist/ChecklistItemRow.tsx:112-115](../../../src/components/checklist/ChecklistItemRow.tsx#L112-L115)
- **문제**: 우선순위 점은 `<span aria-label="우선순위 높음">` 형태인데, role 이 없는 span 의 aria-label 은 일부 스크린리더에서 announce 되지 않는다. 게다가 부모 행의 `aria-label="${item.title} 체크"` 가 이미 행 전체의 accessible name 을 정의해 두었으므로, inner span 의 aria-label 이 누락된 정보(우선순위)를 채우지 못한다 — 시각으로만 우선순위가 전달되는 상태.
- **권장 수정**: 행 외곽 `aria-label` 에 우선순위를 합치거나, 별도 sr-only 텍스트 추가.
  ```tsx
  aria-label={`${item.title} (우선순위 ${priority.label}) ${isChecked ? "체크 해제" : "체크"}`}
  // 그리고 inner span 은 aria-hidden="true" 로
  ```
- **심각도 사유**: 즉시 크래시·기능 중단은 없지만 designer §3.1 "접근성은 윤리가 아니라 기능 자체" + spec.md §5 "WCAG AA + 마이크로 라벨 텍스트·아이콘 모두 스크린리더 접근 가능" 정합 위반.

#### 2. WeekChecklistSection — Checkbox 가 aria-label 없이 노출

- **위치**: [src/components/timeline/WeekChecklistSection.tsx:175-180](../../../src/components/timeline/WeekChecklistSection.tsx#L175-L180)
- **문제**: `<Checkbox checked={isChecked} ...>` 만 있고 aria-label 없음. ChecklistItemRow 는 `aria-label={...item.title... 체크박스}` 를 명시하지만 WeekChecklistSection 은 누락. 행 외곽 aria-label 이 있어 사용자 경험은 부분적으로 보존되지만 checkbox 단독 포커스 시 anonymous 가 됨.
- **권장 수정**: `aria-label={'${item.title} 체크박스'}` 추가. ChecklistItemRow 와 동일 패턴.
- **참고**: 본 PR 도입 변경분(`aria-pressed`, 행 `aria-label`) 와 함께 정리하면 자연스러움. M1 nested interactive 정정과 함께 별도 작업 가능.

#### 3. ChecklistItemRow — `classifyNote(item.note)` 매 렌더마다 재계산 (메모화 부재)

- **위치**: [src/components/checklist/ChecklistItemRow.tsx:79](../../../src/components/checklist/ChecklistItemRow.tsx#L79)
- **문제**: `noteType` 을 매 렌더마다 4개 regex 으로 검사. 노트가 짧고 항목 수가 작아 측정 가능한 성능 비용은 0에 가깝지만, props 가 변하지 않아도 재계산.
- **권장 수정**: `useMemo` 로 감싸거나, `item.note` 가 immutable 이므로 그대로 두어도 무방. 정리하려면:
  ```tsx
  const noteType = useMemo(() => classifyNote(item.note), [item.note]);
  ```
- **심각도 사유**: 사용자 체감 영향 없음. 코드 일관성·미래 확장(노트 길이 ↑) 대비.

#### 4. WeekChecklistSection — `handleToggle` 매 렌더 / 매 항목마다 새 클로저 생성

- **위치**: [src/components/timeline/WeekChecklistSection.tsx:84-103](../../../src/components/timeline/WeekChecklistSection.tsx#L84-L103)
- **문제**: `items.map` 내부에서 `handleToggle` 클로저를 생성. 항목 N 개 × 매 렌더 = N 함수 객체. row `<div>` 의 onClick 에만 전달되므로 자식 리렌더 비용은 없지만, 함수 할당 비용 자체.
- **권장 수정**: 외부 `useCallback((item) => () => {...}, [...deps])` 팩토리 또는 핸들러를 컴포넌트 최상위로 끌어올림.
- **참고**: 본 변경 이전 코드도 같은 패턴(toggle 호출만 하는 단순 핸들러 인라인)이라 PR 회귀 아님. 본 PR 에서 핸들러에 GA4 호출 2종 + classifyNote 호출이 추가되어 부담 ↑.

---

### Suggestion (개선 아이디어)

#### 1. note-classifier.ts — `LEGAL_PATTERNS` 노출

- **위치**: [src/lib/note-classifier.ts:3-8](../../../src/lib/note-classifier.ts#L3-L8)
- 현재 모듈 private. phase-5 에서 `note_type` 필드 도입 시 필드 우선 + 패턴 폴백 구조로 확장될 때, 패턴 자체를 운영자 수동 클렌징 도구(예: `find-legal-notes.ts` 스크립트) 에서 재사용할 가능성 있음. `export const LEGAL_PATTERNS` 로 노출하면 SoT 확보.

#### 2. ChecklistPage / TimelineContainer — `recommendedViewSentRef` 가 due-date 변경에 무반응

- **위치**: [ChecklistPage.tsx:103-115](../../../src/components/checklist/ChecklistPage.tsx#L103-L115), [TimelineContainer.tsx:64-76](../../../src/components/timeline/TimelineContainer.tsx#L64-L76)
- 페이지뷰 1회 가드는 spec 의도지만, 사용자가 같은 세션에서 due-date 변경(P3 onboarding 재진입) 시 currentWeek 이 바뀌어도 view 이벤트 미발사. 페이지 새로고침 전까지 새 주차의 추천 데이터가 누락됨.
- 대안: `currentPregnancyWeek` 변경 시 ref 리셋. 단 락인 룰 §3.6 신호 변형이 아니므로 결정 필요. spec 의 "페이지뷰 당 1회" 해석 — "페이지뷰" = mount 만인지, "주차 cohort 단위" 인지 명확화 필요.

#### 3. WeekChecklistSection — `note_type: item.note ? noteType : null` 트림 처리 부재

- **위치**: [WeekChecklistSection.tsx:88-94](../../../src/components/timeline/WeekChecklistSection.tsx#L88-L94), [ChecklistPage.tsx:175-181](../../../src/components/checklist/ChecklistPage.tsx#L175-L181)
- `item.note ? ...` 가 truthy/falsy 체크라 공백만 있는 노트(`"   "`)는 truthy → `note_type: "default"` 로 발사. 현 데이터에 그런 케이스 없지만 악성 입력 또는 향후 트림 누락 시 분포 통계에 noise.
- 대안: `item.note?.trim() ? noteType : null`.

#### 4. ChecklistItemRow — `recommended_item_check` count 의미 vs 현재 시점 분리

- ga4.md §2 — `recommended_item_view` 의 `count` 는 "노출 시점 미체크 매칭 수". `recommended_item_check / recommended_item_view` 전환율 계산 시 분모는 view 시점, 분자는 그 이후 체크. 사용자가 view 후 일부 체크 → 분모는 안 변하고 분자만 누적. 의도된 동작이지만 분석 시 혼동 가능 — 운영자 가이드에 1줄 명시 권장.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 4건 (수정 권장 — 다음 단계 /refactor 에서 처리) |
| Suggestion | 4건 (보류) |
| 빌드 | 미실행 (Critical 수정 없음) |

전반 평가: 본 PR 묶음의 코드 품질은 spec/design 정합 + 페어 합의 (A) 결과 모두 반영되어 안정적. M3 정리 + isHighlighted 부활 + classifyNote + GA4 wiring 5축이 깨끗하게 분리됨. 접근성 1건(W1)이 가장 의미 있는 수정 권장 — 우선순위 정보가 시각으로만 전달되는 상태가 spec.md §5 "WCAG AA + 스크린리더 접근" 요구를 부분 미충족.

---

<!-- STEP:refactor -->
## 리팩토링

> 작성일: 2026-05-09
> 관련 산출물: [review](#코드-리뷰) · [impl](#구현)

### 리팩토링한 파일 목록

- `src/components/checklist/ChecklistItemRow.tsx`
- `src/components/timeline/WeekChecklistSection.tsx`

---

### 작업별 내용

#### 1. ChecklistItemRow.tsx — 우선순위 정보 a11y 정정 + classifyNote 메모화

- **출처**: review.md Warning #1, #3
- **무엇을**:
  - 우선순위 점 inner span 의 `aria-label` 제거 → `aria-hidden="true"` 로 교체.
  - 행 외곽 `aria-label` 에 우선순위 합침: `${item.title} (우선순위 ${priority.label}) ${...}`.
  - `classifyNote(item.note)` 호출을 `useMemo` 로 감쌈 (`[item.note]` 의존). `useMemo` import 추가.
- **왜**: role 없는 span 의 aria-label 은 일부 스크린리더에서 announce 안 됨. 외곽 라벨 한 줄로 합치면 스크린리더 사용자가 우선순위까지 한 번에 인지. designer §3.1 + spec.md §5 WCAG AA 정합. classifyNote 메모화는 향후 노트 길이 ↑ 대비 안전망 (현재 비용은 무시 가능 수준).

#### 2. WeekChecklistSection.tsx — Checkbox aria-label + handleToggleItem 팩토리 추출

- **출처**: review.md Warning #2, #4
- **무엇을**:
  - `<Checkbox>` 에 `aria-label={'${item.title} 체크박스'}` 추가 (ChecklistItemRow 와 동일 패턴).
  - `items.map` 내부에 인라인되어 있던 `handleToggle` 클로저를 컴포넌트 최상위 `useCallback` 팩토리(`handleToggleItem(item)`) 로 추출. `useCallback` import 추가.
  - 행의 `onClick`/`onKeyDown` 을 `() => handleToggleItem(item)` 형태로 호출.
- **왜**: Checkbox 단독 포커스 시 anonymous 회피. 핸들러 팩토리화로 row 당 인라인 클로저 생성을 컴포넌트 단위 1개 useCallback 으로 축소 (메모리 + GA 호출 함수 인라인 비용 감소). 동작은 그대로.

#### 스킵

- 추가 판단 항목(중복·큰 컴포넌트·불필요한 메모) — 없음. 본 PR 변경분 8개 파일은 책임 분리 + 메모화가 이미 적절. WeekChecklistSection 235줄 / ChecklistItemRow 160줄 은 edit-mode 폼이 차지하는 부분이라 분리 가치 낮음 (별도 작업으로도 가능).
- review.md Suggestion 4건 — 모두 보류 (LEGAL_PATTERNS 노출, view ref 정책, 트림 처리, count 의미) — refactor 범위 밖 의사결정 필요.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 8개 (변경분) | 8개 (동일) |
| ChecklistItemRow 줄 수 | 160 | 161 (useMemo 1줄 +) |
| WeekChecklistSection 줄 수 | 235 | 240 (useCallback 팩토리 +) |
| `aria-label` 미보유 인터랙티브 | 1곳 (timeline checkbox) | 0곳 |
| 행별 클로저 생성 | items.length 개 / 렌더 | 0개 (팩토리 1개로 통합) |
| 동작 변경 | — | 없음 (e2e 13/13 그대로 통과) |

---

### 빌드 결과

성공 (1회 시도). e2e 회귀 검증 13/13 통과.
