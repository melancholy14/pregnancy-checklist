# checklist-data-model-bundle 디자인 문서

> 작성일: 2026-06-05
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)
> 참조: [DESIGN.md](../../../DESIGN.md), [docs/design/persona.md](../../design/persona.md), [src/app/globals.css](../../../src/app/globals.css)

## review.md 결정사항 참조

- **4.1 = B (§2.3 C1 미채택)** — priority 시각 표현 현 상태 유지. 본 문서는 기존 priority 색 토큰을 그대로 사용. designer 페어 ① §2 "신체 변화·민감 시기" 우려와 N4 변형 우려는 4.3=A 채택의 "기본 항목 편집 버튼 비노출"로 완화.
- **4.2 = A + 4.6 = A (편집 둘 다 한 폼)** — 편집 모드에 title + priority + note 동시. designer §3 원칙 5 "한 화면 결정 1개" 위반 의식적 감수 (review.md §5 명시). 본 문서는 인지 부하를 라벨·여백·시각 위계로 최대한 완화하는 패턴 제시.
- **4.3 = A (custom만)** — 편집 버튼 자체가 custom 항목에만 노출. "편집 가능 신호 = 편집 버튼 존재 = 편집 가능" 일관성 확보.
- **4.5 = B (toast 알림)** — sonner toast 카피·톤은 임산부 사용자 불안 자극 안 함 (planner §7.7 정렬).

## 1. 화면 목록·플로우

### 화면 A: ChecklistItemRow (체크리스트 행)
- **역할**: 항목 1개 표시 (체크박스 + title + priority + 편집 버튼). custom 항목은 편집 버튼 노출, 기본 항목은 비노출.
- **위치**: [src/components/checklist/ChecklistItemRow.tsx](../../../src/components/checklist/ChecklistItemRow.tsx) (현재 title만 편집 가능 구조에서 확장)

### 화면 B: ChecklistItemRow 편집 모드 (확장)
- **역할**: 편집 버튼 클릭 시 같은 행이 한 폼으로 전환. title input + priority select + note textarea 동시 노출.
- **트리거**: ChecklistItemRow의 편집 버튼 클릭 (custom 항목 한정)
- **종료 트리거**: 저장 버튼 → 변경분 store 반영 + GA4 이벤트 / 취소 버튼 → 변경분 폐기

### 화면 C: ChecklistAddForm (항목 추가 폼)
- **역할**: 신규 custom 항목 추가. priority 셀렉터 신규 노출 (기본값 medium).
- **위치**: [src/components/checklist/ChecklistAddForm.tsx](../../../src/components/checklist/ChecklistAddForm.tsx)

### 화면 D: Schema Migration Toast
- **역할**: P5 migrate 실패 시 sonner toast 1회 노출 + `schema_migration_failed` 이벤트 발사.
- **트리거**: 페이지 hydration 직후 migrate 함수가 모르는 버전을 만남
- **위치**: sonner Toaster (기존 셋업 활용)

### 플로우
```
[A] 행 (custom)
  ↓ 편집 버튼 클릭
[B] 편집 모드 폼 (title + priority + note)
  ↓ 저장 클릭
[A] 행 (custom, 갱신된 값) + GA4 이벤트 발사
  ↓ 취소 클릭 (대안)
[A] 행 (변경분 폐기)
```

## 2. 컴포넌트

### 신규
- **EditItemForm** (또는 ChecklistItemRow 내부 편집 모드 분기) — title input + priority select + note textarea + 저장/취소 버튼. 모바일 320px 폭 인지 부하 완화 책임.
  - **사유**: 4.6=A 한 폼 결정으로 3개 컨트롤 동시 필요. 기존 ChecklistItemRow 인라인 편집(title만) 구조를 확장하거나 별도 컴포넌트로 분리. 분리 권장 — 행 컴포넌트 복잡도 폭증 회피.
- **PrioritySelect** — `'high'|'medium'|'low'` 셀렉터. ChecklistAddForm·EditItemForm 둘 다에서 재사용.
  - **사유**: dev §6.6 정합성 — 두 폼이 같은 priority 셀렉터 컴포넌트 사용. 향후 §2.3 C1 결정 시 (시각 다운그레이드 채택) 이 컴포넌트 한 곳만 갱신.

### 재사용
- [src/components/ui/Input](../../../src/components/ui/) (또는 동등 shadcn input) — title input
- [src/components/ui/Textarea](../../../src/components/ui/) (또는 동등) — note textarea
- [src/components/ui/Select](../../../src/components/ui/) (또는 동등 shadcn select) — PrioritySelect 내부
- [src/components/ui/Button](../../../src/components/ui/) — 저장·취소·편집 버튼
- **sonner Toaster** — 기존 셋업. 신규 toast 1종 추가
- 기존 priority 색 토큰 (4.1=B로 유지) — DESIGN.md 5-pastel role에 맞게 활용. 현재 사용 토큰 확인 후 유지.

### 컴포넌트 위치 권장
- `src/components/checklist/EditItemForm.tsx` — 신규
- `src/components/checklist/PrioritySelect.tsx` — 신규
- 또는 기존 ChecklistItemRow 안에 inline 분기 (편집 모드 = 별도 JSX 트리)

## 3. 상태별 시안

### ChecklistItemRow (custom 항목)
- **default**: 체크박스 + title + priority 색 배지(현 상태 유지, 4.1=B) + 편집 버튼(우측, ghost variant). 모바일 320px에서 한 줄.
- **편집 모드 진입 후**: 같은 영역이 EditItemForm으로 교체. 행 전체가 카드 형태로 확장 (높이 증가).
- **체크 완료**: 기존 체크 상태 시각 유지 (mint role). 편집 버튼은 여전히 클릭 가능 (체크 완료 항목도 편집 가능).

### ChecklistItemRow (기본 항목)
- **default**: 체크박스 + title + priority 색 배지 (현 상태 유지). **편집 버튼 비노출**.
- **상태 변화**: 체크/언체크만 가능.

### EditItemForm (편집 모드 폼)
- **default**: title input (placeholder 현재값) + PrioritySelect (현재값) + note textarea (placeholder "메모를 입력하세요", 현재 note가 있으면 그 값) + 저장 버튼 (primary) + 취소 버튼 (ghost). 세로 스택, 라벨은 시각 우선순위 낮게 (text-sm muted) 또는 placeholder로 대체해 인지 부하 완화.
- **textarea 권장값** (spec §4 위임 → 본 문서 확정):
  - `rows={3}` (초기 높이, 약 80px)
  - `maxLength={500}` — 500자 한도. 사용자 작성 note는 P7 분류 제외(review §5)이지만 무제한 허용 시 GA4 `note_length` 파라미터 분포 왜곡 + localStorage 비대 가능성. 500자는 일반 메모 사용 패턴 커버.
  - 한도 도달 임박 시 표시: 450자 초과 시 textarea 하단 우측 `text-xs text-muted-foreground` 로 `<현재>/500` 표시. 그 이전에는 카운터 비노출 (인지 부하 회피).
- **저장 중**: 저장 버튼 disabled + 짧은 spinner (필요 시 — Phase 1.5 hydration 패턴 정합). 정적 사이트라 거의 즉시 완료, spinner 생략 가능.
- **에러 (title 빈 값)**: 저장 버튼 disabled + title input 아래 작은 텍스트 "제목을 입력하세요" (text-destructive 또는 muted-foreground). designer N4 "빨간 경고색 지양" 정렬 — destructive보다 muted 권장.

### ChecklistAddForm
- **default**: title input + PrioritySelect (기본값 medium 표시) + 추가 버튼. 기존 폼 레이아웃 유지하면서 PrioritySelect만 신규 슬롯 추가.

### Schema Migration Toast (sonner)
- **default**: sonner default toast 스타일. 카피: **"체크리스트 데이터를 정리했어요. 일부 설정이 초기값으로 돌아갔을 수 있어요."**
- **톤 기준**: planner §7.7 공포 마케팅 거부 + designer §2 빨간 경고색 지양. "데이터 손상"·"오류"·"실패" 같은 무거운 단어 회피. "정리했어요"·"초기값으로 돌아갔어요" 정도의 중립 톤.
- **duration**: sonner default (4초 안팎). 사용자 액션 차단 안 함.

## 4. 인터랙션·애니메이션

### 핵심 인터랙션

1. **편집 버튼 → 편집 모드 진입**
   - 트리거: 편집 버튼 탭
   - 피드백: 행이 EditItemForm으로 교체. 행 높이 자연스러운 증가 (애니메이션은 transition-all duration-150 정도, 과도한 motion 회피 — designer §3 6번 항목)
   - 포커스: title input에 자동 포커스 (스크린리더 흐름 — designer N1 정렬)

2. **저장 → 행 복귀**
   - 트리거: 저장 버튼 탭
   - 피드백: store 갱신 즉시 + 행이 default 상태로 복귀 + 변경 후 priority/note 반영. 추가 toast 없음 (성공은 무음 — designer §N8 사용자 시간 도둑질 회피).
   - **변경된 필드만 GA4 이벤트 발사** (spec §3 must): 폼 진입 시 초기값(`initialPriority`, `initialNote`) 보존 → 저장 시 변경된 필드 비교. priority 변경 → `custom_item_priority_set` 1회 / note 변경 → `custom_item_note_set` 1회. 두 필드 모두 변경 시 두 이벤트 동시 발사. 둘 다 미변경이면 store 갱신만 (변경 없음 = no-op + 이벤트 0). 사용자 인지 무관 — 행 복귀는 동일.

3. **취소 → 행 복귀 (변경분 폐기)**
   - 트리거: 취소 버튼 탭 또는 Escape 키 (§5 키보드 흐름 참조)
   - 피드백: 편집 폼이 사라지고 ChecklistItemRow default 상태로 즉시 복귀. store·GA4 이벤트 변경 없음.
   - 미저장 변경 알림 없음 — designer §N8 회색지대 의식적 감수 (사용자 시간 도둑질 회피 우선). 카피 "변경사항을 저장하지 않고 닫을까요?" 류 confirm 모달 도입 X.

4. **schema_migration_failed → toast**
   - 트리거: hydration 직후 migrate 실패 (자동, 사용자 인지 없음). 기존 `createChecklistStore::onRehydrateStorage` error 분기 + `migrationLostFlag` 메커니즘 활용. 본 묶음은 그 분기에 `schema_migration_failed` GA4 이벤트 발사 + sonner toast 트리거를 연결.
   - 피드백: sonner toast 1회. 사용자가 닫지 않아도 4초 후 자동 사라짐.
   - 부수효과: store는 default state. 사용자가 이전 데이터로 돌아갈 방법 없음 (정적 사이트 한계). 본 문서 §3 카피로 톤 완화.

### 회피할 애니메이션

- 편집 모드 진입 시 슬라이드·페이드 등 화려한 motion (designer §3 6번 — 컨페티·그라디언트·애니메이션 조건). 단순 height transition만.
- toast가 흔들리거나 강조 색을 띠는 표현 — 임산부 사용자 불안 자극.

## 5. 토큰·접근성

### 사용 토큰 ([src/app/globals.css](../../../src/app/globals.css))

| 영역 | 토큰 | 비고 |
|---|---|---|
| 편집 버튼 배경 | `transparent` (ghost) | hover 시 `bg-muted`. pink/lavender 배경 X (CTA 아님) |
| 저장 버튼 | `bg-pastel-pink` + `text-foreground` | primary CTA — DESIGN.md 5-pastel role pink |
| 취소 버튼 | `bg-pastel-lavender` + `text-foreground` 또는 ghost | secondary role — DESIGN.md lavender |
| priority high 배지 | 기존 토큰 유지 (4.1=B) — 확인 후 명시 | 현재 ChecklistItem priority 색 사용. 변경 X |
| priority medium 배지 | 기존 토큰 유지 | 변경 X |
| priority low 배지 | 기존 토큰 유지 | 변경 X |
| input·textarea border | `border-black/4` (whisper border, `--border`) | designer §5 AP7 — `border-gray-200` 금지 |
| input·textarea bg | `bg-background` (cream canvas) | designer §2 정렬 |
| 편집 모드 카드 | `bg-card` + `rounded-2xl` + `shadow-sm` | page-level 카드 권장 |
| EditItemForm 에러 메시지 | `text-muted-foreground` | designer N4 빨간 경고색 지양 — destructive 사용 자제 |
| toast | sonner 기본 토큰 | 기존 셋업 유지 |

> **Raw hex 금지** (designer §5 AP5). 새 priority 토큰 도입 시 `--priority-high` 등으로 globals.css에 추가. 현재 단계는 4.1=B로 신규 토큰 도입 없음.

### 접근성 (WCAG 2.1 AA — designer N1)

#### 색 대비
- 저장 버튼 (`bg-pastel-pink` + `text-foreground`) — DESIGN.md 기존 검증. 별도 점검 불필요.
- toast 카피 — sonner 기본 토큰 유지. 별도 점검 불필요.
- priority 배지 — 4.1=B 기존 유지. 본 묶음에서 추가 점검 불필요 (별도 결정 시 검토).
- EditItemForm 에러 메시지 (`text-muted-foreground`) — 대비 4.5:1 이상 확인 의무 (axe-core PR 머지 전).

#### 키보드 흐름
- 편집 버튼 → Enter → 편집 모드 진입 → title input 자동 포커스
- Tab 순서: title → PrioritySelect → note textarea → 저장 → 취소
- Escape → 편집 취소 (designer §N8 회피 동선 명확화 — 추가 결정)
- PrioritySelect — shadcn Select 기본 키보드 동작 (Arrow keys + Enter)

#### 스크린리더
- 편집 버튼 `aria-label="<title> 편집"` (custom 항목 한정 — 기본 항목은 버튼 자체 없음)
- title input `aria-label="항목 이름"`
- PrioritySelect `aria-label="우선순위"` + 옵션 텍스트 ("높음", "보통", "낮음")
- note textarea `aria-label="메모"`
- 저장 버튼 `aria-label="저장"` / 취소 버튼 `aria-label="취소"`
- toast — sonner 기본 `role="status"` `aria-live="polite"` 유지

#### 시맨틱
- 편집 모드 폼은 `<form>` 시맨틱으로 감쌈. 저장 = `<button type="submit">`, 취소 = `<button type="button">`.
- PrioritySelect 내부는 shadcn Select 컴포넌트 그대로 (Radix Select 기반, ARIA 정합).
- ChecklistItemRow — 기존 `<label>` + checkbox 패턴 유지. 편집 버튼은 별도 `<button>` (designer §AP4 — row-as-button 회피 패턴 답습).

### 모바일 320px 검증 의무

- **단일 화면 결정 1개 위반 감수** (4.6=A) — 편집 모드 폼이 320px에서 세로 스크롤이 자연스럽게 발생할 수 있음. 폼 컨테이너에 max-h 제한 없이 자연 스크롤 허용. 사용자가 폼 위/아래로 자유 이동.
- title input·PrioritySelect·textarea 모두 `w-full` 보장.
- note textarea는 `rows={3}` 또는 `min-h-[80px]` 정도로 시작. 사용자 입력에 따라 자연 증가 가능.

### 한국어 본문 처리

- toast 카피, EditItemForm 라벨·placeholder, 에러 메시지 모두 `word-break: keep-all` 보장 (designer N6 의무). `.article-prose` 외부라도 한국어 문장 줄바꿈 처리 동일 적용.

### 회피 안티패턴 (designer §5 점검)

- ❌ AP1: priority 배지에 pink 사용 — 4.1=B로 기존 토큰 유지하므로 신규 위반 없음
- ❌ AP6: 편집 모드 카드에 `shadow-md` 이상 → 본 문서는 `shadow-sm` 명시
- ❌ AP7: `border-gray-200` → `--border` (= `border-black/4`) 명시
- ❌ AP8: "→" 텍스트 화살표 → 본 묶음에서 사용 안 함
- ❌ AP9: `rounded-xl` 카드 → 편집 모드 카드는 `rounded-2xl` 명시
