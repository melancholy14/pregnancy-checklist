# checklist-recommendation-semantics 기획서

> 작성일: 2026-05-08  size: L
> 관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- 결정 1 — P6 시맨틱: `recommendedWeek: 0` = "**미정/주차 무관 (P2 매칭 대상 아님)**". 데이터·필드 변경 없음, 시맨틱만 명문화.
- 결정 2 — P7 분류: action / context / legal 텍스트 정의 + **`legal`만 시각 분기** (필드 없이 텍스트 패턴 기반). 다른 두 분류는 phase-5(P5와 묶음).
- 결정 3 — P2 isHighlighted **부활** — phase-4.5에서 진행. P3([pregnancy-week-onboarding](../pregnancy-week-onboarding/spec.md)) 완료로 unblock.
- 결정 4 — 부활 시 시각: **색 없이 마이크로 라벨 + lucide 아이콘**. 기존 yellow 시각 제거.
- 결정 5 — **ChecklistItemRow M3 정리 선행** (본 묶음 첫 작업).
- 결정 6 — `recommended_item_view` + `recommended_item_check` 신규 이벤트 + 기존 `checklist_check` 에 `note_type` 파라미터 **추가만**. user_property `current_pregnancy_week` 없으면 미발사 가드.

## 1. 배경·목적

- **운영자 관점**: P3 완료로 사용자 주차 데이터가 흐르기 시작. 이 데이터를 본질 도구(체크리스트) 강화로 환원하는 첫 결정.
- **사용자 관점**: 입력한 주차에 맞춰 "지금 챙길 것"이 행에서 작게 표시. 노트 중 법령 인용은 따로 보임 — 신뢰·맥락 신호.
- **측정 관점**: 추천 항목의 노출·체크 전환을 데이터로 검증. 다음 단계(D-day 컨텍스트, P11 콘텐츠 매트릭스)의 우선순위 결정 근거 확보.

## 2. 사용자 시나리오

1. **주차 입력자 + 메인 체크리스트 진입**: 사용자 24주차 → [checklist-week-map.ts:39](../../../src/lib/checklist-week-map.ts#L39) 매칭으로 `recommendedWeek === 24` 항목들이 행에 마이크로 라벨("이번 주 추천" + 아이콘) 표시. `recommended_item_view` 발사. 사용자가 그 중 하나를 체크 → `recommended_item_check` 발사 (기존 `checklist_check` 와 함께).
2. **주차 입력자 + 신규 3종 슬러그 진입** (hospital_bag/partner_prep/pregnancy_prep): 항목 전부 `recommendedWeek: 0` 이라 매칭 제외 → 마이크로 라벨 0개. 슬러그 자체가 컨텍스트라 강조 불필요.
3. **주차 미입력자 진입**: `current_pregnancy_week` user_property 없음 → 매칭 자체를 건너뜀(`isHighlighted` 항상 false). `recommended_item_view`·`recommended_item_check` 미발사. 행은 차분한 default 시각.
4. **`legal` 노트 항목 진입**: 노트 텍스트가 `legal` 패턴(예: 정해진 접두어 토큰)으로 시작하면 노트 영역에 분기 시각 적용. action·context는 평탄. 체크 시에도 노트 보존(M4 합의 반영).
5. **추천 항목 체크 직후**: 행은 mint(success) 상태로 전이 + 마이크로 라벨 제거. 노트는 `legal` 포함 모두 line-through로 보존.

## 3. 기능 요구사항

### must

- M3 정리: [ChecklistItemRow.tsx:117-138](../../../src/components/checklist/ChecklistItemRow.tsx#L117-L138) 행에서 우선순위 배지·노트·액션 버튼 정리. 모바일 320px에서 타이틀이 2~3줄로 꺾이지 않도록 우선순위는 시각적으로 더 작게(예: 점 1개) 또는 호버/포커스 슬롯으로 분리. 정확한 레이아웃은 design.md.
- P6 시맨틱 명문화:
  - [src/types/checklist.ts](../../../src/types/checklist.ts) 의 `ChecklistItem.recommendedWeek` 필드에 JSDoc 추가 — "0 = 미정/주차 무관, P2 매칭 대상 아님".
  - 운영자 가이드 문서(P10 phase-4.5 잔여분 — AI 이미지 SOP와 같은 문서)에 "0번 항목은 P2 강조 대상이 아님" 한 줄 명시.
  - 데이터·코드 변경 없음. `getChecklistByWeek` / `getUnassignedChecklist` 그대로.
- P2 isHighlighted 부활:
  - 사용처 변경: [ChecklistItemRow.tsx](../../../src/components/checklist/ChecklistItemRow.tsx) 가 실사용 컴포넌트이므로 **ChecklistItemRow 에 `isHighlighted` 처리를 이식** (현 [ChecklistItem.tsx:21-72](../../../src/components/checklist/ChecklistItem.tsx#L21-L72) 의 yellow 시각은 제거).
  - **ChecklistItem.tsx 정리**: 사용처 0건이므로 본 묶음에서 파일 자체 삭제 또는 dead code 마킹. 살아있는 코드와 죽은 코드 경계를 흐리지 않음(designer §6 2026-05-02 누적 학습 정합).
  - 매칭 로직: 부모 컴포넌트에서 `useDueDateStore` 의 `currentPregnancyWeek` 와 항목의 `recommendedWeek` 를 비교해 `isHighlighted` prop 전달. 0 항목·미입력자는 false.
  - 시각: 색 없이 마이크로 라벨 + lucide 아이콘. 기존 `bg-pastel-yellow/20` 토큰 사용 금지.
- P7 `legal` 시각 분기:
  - **노트 분류 함수 신규**: `src/lib/note-classifier.ts` 단일 함수 `classifyNote(text: string): "legal" | "default"`. 텍스트 패턴 기반 식별(필드 추가 없음). 정확한 패턴은 [design.md §5](./design.md). phase-5 `note_type` 필드 도입 시 같은 함수가 필드 우선 + 패턴 폴백 형태로 확장.
  - `legal` 노트는 체크 후에도 보존 (M4 결정 반영) — 일반 노트도 같은 룰.
- 측정 wiring:
  - 신규: `recommended_item_view`, `recommended_item_check` (이벤트 명세는 ga4.md).
  - 추가: `checklist_check` 에 `note_type` 파라미터 — 기존 시그니처 보존(락인 룰 §3.6).
  - 가드: `current_pregnancy_week` user_property 없으면 추천 이벤트 2개 미발사.

### should

- M3 정리 시 [ChecklistItemRow.tsx:80-94](../../../src/components/checklist/ChecklistItemRow.tsx#L80-L94) 의 nested interactive(M1) 도 같이 정정 권장 — `<label>` 으로 감싸 native 동작 회복. 단 본 묶음 범위는 M3 행 정리까지로 한정하고 M1 별도 작업이 자연스러움.
- 운영자 가이드(P10 잔여분)는 P14 AI 이미지 SOP와 같은 문서에 "체크리스트 데이터 변경 룰 — 시맨틱 한 줄"만 흡수. 본격 룰은 P5 도입 시 phase-5 에서 작성.

### won't (이번 범위 밖)

- `note_type` 필드 신규 도입 — phase-5 P5 schema versioning 과 함께.
- `action` / `context` 시각 분기 — phase-5.
- `recommendedWeek: 0` 항목의 데이터 구조 변경(`null` 변환·`alwaysRecommended` 필드 추가) — phase-5.
- 디자이너 §6 AP-Cross-1·2·3·4·5·6 등 다른 횡단 패턴 정정 — 별도 작업.
- M1 nested interactive 정정 — 별도 작업.

## 4. 예외·엣지 케이스

- **주차 미입력**: 추천 매칭 자체 미수행. 마이크로 라벨 0개. 측정 이벤트 미발사.
- **주차 = 임신 후기(예: 39주차) + 매칭 0건**: 마이크로 라벨 0개. 빈 강조는 자연스러운 default 시각으로 흐름.
- **체크 직후**: mint(success) 전이 + 마이크로 라벨 제거. `recommended_item_check` 발사 후 view 이벤트는 재발사하지 않음.
- **localStorage 손실 → 주차 재계산**: P3 가 자동 매주 갱신이라 다음 페이지뷰부터 정상화. 손실 직후엔 주차 미입력자와 동일 처리.
- **`legal` 패턴이 노트 본문 중간에 등장**: 노트 전체를 `legal` 로 분류 (단순 패턴 매칭 1회). false positive 가능성 — design.md 에서 패턴 결정 시 운영자 노트 100+ 개 빠르게 확인.
- **추천 항목인데 사용자가 이미 체크 완료**: mint default 시각 + 마이크로 라벨 미표시 (체크 후엔 강조 의미 없음). `recommended_item_view` 미발사.

## 5. 성공 기준

- **기능 동작**:
  - 주차 24 사용자가 메인 체크리스트 진입 시 `recommendedWeek === 24` 항목들에서 마이크로 라벨 노출.
  - 신규 3종 슬러그 진입 시 마이크로 라벨 0개.
  - `legal` 노트 항목에서 분기 시각 노출, 체크 후에도 노트 보존.
  - M3 행이 모바일 320px 에서 1줄 또는 2줄로 차분.
- **측정 지표** (ga4.md 일치):
  - `recommended_item_view` 발사율 > 0 (주차 입력자 대상).
  - `recommended_item_check / recommended_item_view` 전환율 — 추천 가치 검증 지표.
  - `checklist_check.note_type` 분포 — `legal` 비중 추적.
- **사용자 경험** (design.md 일치):
  - 5-pastel role 교차 0건.
  - 행 정보 위계: 타이틀 > 우선순위 시각 > 마이크로 라벨 > 노트 (legal 분기 포함).
  - WCAG AA 색 대비 통과, 마이크로 라벨은 텍스트 + 아이콘 모두 스크린리더 접근 가능.
