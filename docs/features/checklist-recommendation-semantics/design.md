# checklist-recommendation-semantics 디자인 문서

> 작성일: 2026-05-08
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- 결정 4 — **색 없이 마이크로 라벨 + lucide 아이콘**. 5-pastel role 교차 회피. 기존 [ChecklistItem.tsx:30](../../../src/components/checklist/ChecklistItem.tsx#L30) 의 `bg-pastel-yellow/20 border-pastel-yellow/40` 시각 제거.
- 결정 5 — **ChecklistItemRow M3 정리 선행**. P2/P7 시각 추가 전 행을 차분하게.
- 결정 2 — `legal` 분기 시각만 phase-4.5. 텍스트 패턴 기반 식별.
- 결정 3 — phase-4.5 부활.

## 1. 화면 목록·플로우

### 영향 받는 화면

- **메인 체크리스트 슬러그** ([ChecklistPage.tsx](../../../src/components/checklist/ChecklistPage.tsx) 통한 `/checklist` 등) — 추천 매칭 항목에 마이크로 라벨 노출. 본 기능의 주 표면.
- **신규 3종 슬러그** (hospital_bag/partner_prep/pregnancy_prep) — 항목 전부 `recommendedWeek: 0` 이라 마이크로 라벨 0개. 시각 변화는 M3 정리분과 `legal` 분기뿐.
- **체크리스트 허브** ([ChecklistHub.tsx](../../../src/components/checklist/ChecklistHub.tsx)) — ItemRow 미사용. 시각 변화 없음.

### 사용자 플로우

1. 사용자 메인 체크리스트 진입 → 행 정렬은 기존(linked → recommendedWeek) 유지 → 매칭된 추천 항목들에 마이크로 라벨 노출 → 사용자가 선택해 체크 → mint(success) 전이 + 라벨 제거.
2. `legal` 패턴 노트 항목 진입 → 노트 영역에 분기 시각(아이콘 + 톤) 노출 → 체크 시에도 노트 보존.

## 2. 컴포넌트

### 신규

- **`RecommendedHint`** (가칭) — ChecklistItemRow 내부의 마이크로 라벨 슬롯. 텍스트 + lucide 아이콘 + `aria-label`. Stateless.
- **`LegalNoteHint`** (가칭) — 노트 영역의 `legal` 분기 표시. lucide 아이콘 + 톤 변화 (색은 도입하지 않음, 디테일 §5).
- 둘 다 [src/components/checklist/](../../../src/components/checklist/) 하위 별도 파일이 아니라 ChecklistItemRow 내부 인라인 JSX 로 충분 (3번째 중복 등장 시 추출 — dev §1).

### 재사용

- [src/components/checklist/ChecklistItemRow.tsx](../../../src/components/checklist/ChecklistItemRow.tsx) — M3 정리 + `isHighlighted` 처리 이식 + `legal` 분기 추가.
- [src/components/checklist/ChecklistItem.tsx](../../../src/components/checklist/ChecklistItem.tsx) — **삭제 또는 dead code 정리**. 사용처 없음 (phase-4.5 §3 P2 본문 확인). 본 묶음에서 한 번에 정리.
- [src/lib/checklist-week-map.ts](../../../src/lib/checklist-week-map.ts) — 그대로. 0 매칭 제외 로직이 시맨틱 결정과 일치.
- [src/store/useDueDateStore.ts](../../../src/store/useDueDateStore.ts) — 그대로. `currentPregnancyWeek` 셀렉터 그대로 사용.
- [`useDueDateStore.currentWeek`](../../../src/store/useDueDateStore.ts) (또는 동등 셀렉터) — 부모 ChecklistPage 에서 읽어 ItemRow 에 `isHighlighted` prop 전달.

## 3. 상태별 시안

### 행(ItemRow) 상태 (M3 정리 후 기준)

| 상태 | 시각 |
|---|---|
| **default (미체크)** | 행 hover: `hover:bg-muted/50`. 타이틀 `text-sm leading-relaxed`. 우선순위는 작은 점(아이콘) 또는 호버/포커스 슬롯. |
| **default + highlighted** (이번 주 추천) | default 시각 + 타이틀 아래 라인에 마이크로 라벨 ("이번 주 추천" + `Sparkles` 또는 `CalendarCheck` lucide 아이콘 11px). 색 추가 없음 — `text-muted-foreground` 톤. |
| **default + legal note** | 노트 영역에서 `Info` 아이콘 → `Scale` 또는 `BookOpen` lucide 아이콘 (legal 의미). `text-muted-foreground` 톤은 그대로, 텍스트 weight 또는 letter-spacing 으로 미세 차별. |
| **default + highlighted + legal note** | 위 두 시각 동시. 마이크로 라벨은 타이틀 아래, 노트 분기는 노트 영역 — 영역 분리되어 시각 충돌 없음. |
| **checked** | `bg-pastel-mint/20`. 타이틀 line-through + `text-muted-foreground`. 마이크로 라벨 **제거**. 노트는 보존(M4 합의 — 본 묶음에 포함) line-through. legal 아이콘은 유지. |
| **editing (custom 항목)** | 기존 `bg-pastel-lavender/10` 시안 그대로. |

### 빈 상태 / 에러 / 로딩

- **주차 미입력자**: 행 자체는 default. 마이크로 라벨 0개, 측정 이벤트 미발사. 기존 [OnboardingBannerProvider.tsx](../../../src/components/providers/OnboardingBannerProvider.tsx) 의 입력 유도 배너가 별도 표면에서 처리하므로 본 기능에서 추가 카피 없음.
- **추천 매칭 0건 (예: 39주차)**: 마이크로 라벨 0개. 빈 강조 상태에 별도 메시지 없음 (정보 노이즈 회피).
- **localStorage 손실**: P3 의 자동 매주 갱신 흐름이 다음 페이지뷰에 정상화. 본 기능에서 별도 fallback UI 없음.

## 4. 인터랙션·애니메이션

| 인터랙션 | 트리거 | 피드백 | duration |
|---|---|---|---|
| 추천 항목 진입 | 페이지 마운트 + 매칭 결과 | 마이크로 라벨 fade-in (0 → 100% opacity) | 200ms ease-out |
| 추천 항목 체크 | 행 클릭 또는 체크박스 토글 | 마이크로 라벨 fade-out + 행 mint 전이 | 200ms ease-out |
| 노트 legal 분기 | 마운트 시 노트 텍스트 패턴 검사 | 정적 시각 (애니메이션 없음) | — |

추가 애니메이션 도입 안 함 — designer §3.6 "시각적 화려함은 마지막" 정합. 마이크로 라벨의 fade는 행 mint 전이가 이미 transition 으로 처리되는 구간에 자연스럽게 묶임.

## 5. 토큰·접근성

### 사용 토큰 (모두 [globals.css](../../../src/app/globals.css) 기존 변수)

- **마이크로 라벨**: `text-muted-foreground` (#9CA0A4) + `text-xs` (12px). 5-pastel 색 미사용. 아이콘은 lucide `Sparkles` 또는 `CalendarCheck` (디자인 검토 시 결정), `aria-hidden="true"`. 텍스트 "이번 주 추천" 자체가 의미 전달.
- **legal 노트 분기**: 기존 노트와 동일하게 `text-muted-foreground` + `text-xs`. 아이콘만 `Info` → `Scale` (lucide) 로 교체. 톤 차별은 letter-spacing 또는 italic 한 가지로 한정 (인지 부하 최소화).
- **행 hover**: 기존 `hover:bg-muted/50` 그대로.
- **체크 후**: 기존 `bg-pastel-mint/20` 그대로.

### 텍스트 패턴 (P7 `legal` 식별)

- **권장 패턴**: 노트 본문 첫 토큰이 한국어 법령 명칭 패턴(`「...」` 인용부호 또는 `〈법령명〉 제N조`) 또는 운영자 명시 접두 토큰 `[법령]`.
- **운영자 가이드**: 신규 작성 시 `[법령]` 접두 토큰 사용 권장. 기존 노트는 패턴 매칭으로 자동 식별 (false positive 위험은 운영자 100+ 노트 검토로 한 번 클렌징).
- 패턴 함수는 [src/lib/](../../../src/lib/) 하위 `note-classifier.ts` (가칭) 신규 — 단일 함수 `classifyNote(text: string): "legal" | "default"`. phase-5 `note_type` 필드 도입 시 같은 함수가 필드를 우선 읽고 폴백으로 패턴 사용.

### 접근성 (WCAG 2.1 AA — designer N1 준수)

- 마이크로 라벨 텍스트 "이번 주 추천": 본문 텍스트 `text-muted-foreground` (#9CA0A4) 위에 흰색/cream 배경 — 대비 4.5:1 미달 위험. **대비 검증 필수** (axe-core). 미달 시 `text-foreground` 로 격상 + weight `font-medium`.
- 아이콘은 `aria-hidden="true"` — 텍스트가 의미 전달 주체.
- legal 분기 시 추가 정보를 색·톤만으로 전달하지 않음 (색맹 사용자 보호) — 아이콘 변화 + 위치 일관성으로 식별.
- 키보드 흐름: 마이크로 라벨은 인터랙티브 X. 행 자체의 키보드 포커스(현 `tabIndex={0}` + Enter/Space 핸들러)는 그대로. **M1(nested interactive) 정정은 본 묶음 won't** — 별도 작업.

### 5-pastel role 정합 검증 (designer §3.2)

- pink (CTA) — 미사용 ✓
- lavender (secondary) — 미사용 ✓
- mint (success) — 체크 상태에서만 사용 (기존 그대로) ✓
- peach (data) — 미사용 ✓
- yellow (info) — **기존 `bg-pastel-yellow/20` 강조 시각 제거** ✓ — 결정 4 정합

### designer §3 우선순위 정합

- §3.1 접근성 — 마이크로 라벨 대비 검증 필수
- §3.2 토큰 디시플린 — 5-pastel role 교차 0 ✓
- §3.3 시맨틱 = 시각 — 마이크로 라벨은 `<span>` 텍스트, 인터랙티브 아님. legal 분기는 `<span>` 노트 안 인라인
- §3.4 모바일 320px — 마이크로 라벨 1줄 이내 ("이번 주 추천" 한국어 7자 + 아이콘 11px = 약 70px). 기존 행 폭 충분
- §3.5 한 화면 한 결정 — M3 정리로 빈 캔버스 확보 후 마이크로 라벨 1개·legal 아이콘 1개만 추가. 정보 위계 명확
- §3.6 시각 화려함 마지막 — 색·그림자 추가 0, fade transition 1개 ✓

## 6. 운영 / 사후 검증 체크리스트

PR 머지 전 시각 검증 (designer §4 always-run + N1):

- [ ] DESIGN.md 토큰명 정확 인용 (`text-muted-foreground` 등)
- [ ] [globals.css](../../../src/app/globals.css) 실제 토큰 값 확인
- [ ] 5-pastel role 교차 0건 (yellow 시각 제거 확인)
- [ ] 인터랙티브 요소 중첩 X (마이크로 라벨은 텍스트만)
- [ ] 모바일 320px / 375px / 414px 마이크로 라벨 1줄 유지
- [ ] 상태 4종 (default / highlighted / legal / checked) 모두 그림
- [ ] 색 대비 axe-core 통과 또는 수동 검증
- [ ] 체크리스트 영역 [docs/design/checklist/](../../design/checklist/) 와 충돌 시 해당 문서 갱신
