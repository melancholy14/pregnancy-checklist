# checklist-data-model-bundle 테스트 전략

> 작성일: 2026-06-05  size: L
> 관련 리뷰: [review.md](./review.md)
> 관련 기획: [spec.md](./spec.md)
> 페르소나 SoT: [docs/qa/persona.md](../../qa/persona.md)

> **이 문서는 `/feature-pipeline` 안의 `write-unit-tests` · `write-e2e-tests` 스킬이 입력으로 읽습니다.**

## review.md 결정사항 참조

- **4.4 = A (묶음 도입)** — P5 인프라(4개 store version + migrate) + P1 폼 노출이 한 묶음. 테스트도 두 영역을 같은 PR에서 작성.
- **4.5 = B (toast 알림)** — migrate 실패 시 toast 노출 + `schema_migration_failed` 발사. E2E 시나리오로 검증 (UI 흐름).
- **4.7 = A (시드 헬퍼 신설)** — `e2e/helpers/seedStorage.ts` 신규 + 기존 customItems 시드 박힌 spec 일괄 이관. **§1.1 표 + §4.2 항목으로 박힘**.

## 1. 기존 테스트 영향 분석

### 1.1 스캔 결과

본 묶음이 수정/추가하는 파일 (페이즈 8-A 스캔 + spec.md "기능 요구사항" 종합):

**수정 대상**
- [src/types/checklist.ts](../../../src/types/checklist.ts) — `ChecklistItem.priority`·`note` 필드는 **이미 존재**. type 변경 없음 (대신 사용 패턴 변경)
- [src/store/createChecklistStore.ts](../../../src/store/createChecklistStore.ts) — `version: 1` + `migrate` 추가. `migrationLostFlag` 기존 메커니즘 유지 + 4.5=B에 따라 `schema_migration_failed` 이벤트 트리거 연결
- [src/store/useTimelineStore.ts](../../../src/store/useTimelineStore.ts) — `version: 1` + identity `migrate` 추가
- [src/store/useWeightStore.ts](../../../src/store/useWeightStore.ts) — `version: 1` + identity `migrate` 추가
- [src/store/useDueDateStore.ts](../../../src/store/useDueDateStore.ts) — 이미 v1. 정합성 점검만 (`schema_migration_run` 발사 동반)
- [src/components/checklist/ChecklistItemRow.tsx](../../../src/components/checklist/ChecklistItemRow.tsx) — 편집 모드에 PrioritySelect + note textarea 추가. `item.isCustom === true` 분기로 편집 버튼 노출
- [src/components/checklist/ChecklistAddForm.tsx](../../../src/components/checklist/ChecklistAddForm.tsx) — `priority: "medium"` 하드코딩(L44) → PrioritySelect 셀렉터로 교체
- [src/lib/analytics.ts](../../../src/lib/analytics.ts) — 신규 이벤트 4종 type wrapper 추가

**신규 대상**
- `src/components/checklist/PrioritySelect.tsx` — priority 셀렉터 (재사용)
- `src/components/checklist/EditItemForm.tsx` — 편집 모드 폼 (선택, 인라인 분기 가능)
- `e2e/helpers/seedStorage.ts` — 4개 store 시드 헬퍼 (4.7=A)

**그 파일을 import 하거나 라우트를 방문하는 기존 테스트**:

| 영향받는 테스트 파일 | 어떤 부분이 영향받나 | 깨질 가능성 | 수정 방향 |
|---|---|---|---|
| `src/lib/__tests__/analytics.test.ts` | 신규 이벤트 4종 type wrapper 추가 시 import·시그니처 변경 가능성 | 중간 | 신규 이벤트 4종 unit 케이스 추가, 기존 케이스 유지 |
| `src/lib/__tests__/note-classifier.test.ts` | 본 묶음 4.2=A 결정으로 "사용자 작성 note는 P7 분류 제외" 룰 확정. note-classifier가 customItems의 note에 호출되지 않는지 점검 의무 | 낮음 | 호출 경계 unit으로 검증. customItem note는 분류 함수에 들어가지 않아야 함 |
| `e2e/checklist-week-bug.spec.ts` | checklist-storage 키 시드 패턴. version 부여 후 시드 형태가 호환되어야 함 | 중간 | 4.7=A 시드 헬퍼로 이관 (version 1 형태로 시드) |
| `e2e/gamification.spec.ts` | checklist-storage 시드 + customItems 시드 박혀 있음 | 중간 | 시드 헬퍼로 이관 |
| `e2e/timeline-retention.spec.ts` | checklist-storage + timeline-storage 시드. timeline도 version 1 부여됨 | 중간 | 시드 헬퍼로 이관 |
| `e2e/p9-empty-state.spec.ts` | customItems 시드 (빈 상태 검증) | 낮음 | 시드 헬퍼로 이관, 빈 customItems 시드 형태 검증 |
| `e2e/design-bundle-d-uncheck-toggle-dday.spec.ts` | customItems 시드 + uncheck 흐름 | 중간 | 시드 헬퍼로 이관 |
| `e2e/design-bundle-k-delete-pattern.spec.ts` | customItems 시드 + 삭제 패턴 | 중간 | 시드 헬퍼로 이관 |
| `e2e/design-bundle-b-i-row-tokens.spec.ts` | ChecklistItemRow 토큰 가드. **편집 버튼·EditItemForm 신규 추가**로 가드 트리거 가능성 | **높음** | 신규 컴포넌트가 행 토큰 룰 위반 안 하는지 검증, 가드 갱신 시 약화 X (qa §7.4) |
| `e2e/checklist-recommendation-semantics.spec.ts` | localStorage seed 사용. customItems 직접 시드는 미식별. checklist store 키 시드 가능성 | 낮음 | 점검 — 헬퍼 이관 대상 또는 영향 없음 |

기타 localStorage 시드만 박힌 spec (consent, dueDate, weight 등) — checklist store 키 사용 안 하면 영향 없음. 페이즈 8-A 추가 검증 시 spec.md 갱신 의무.

### 1.2 데이터·schema 변경 점검

- localStorage schema 변경: **Y (부분)**
  - `checklist-storage` (slug별 storage key) — `version: 0` → `version: 1`. zustand persist `version` 필드 신설. customItems 구조 자체는 `ChecklistItem` type이 이미 priority·note 보유하므로 **identity migrate** (값 변환 없음).
  - `timeline-storage` — version 0 → 1, identity migrate
  - `weight-storage` — version 0 → 1, identity migrate
  - `due-date-storage` — 이미 v1, 변경 없음
- 기존 E2E가 `localStorage.setItem` 으로 시드하는 키 형태와 호환되나?
  - 호환됨 — zustand persist는 version 필드가 없는 기존 JSON에 대해 `version: 0` 으로 해석. v0→v1 identity migrate가 그대로 통과.
  - 단 시드 시 `{ state: {...}, version: 0 }` 형태로 명시하는 spec이 있다면 그대로 호환 (v0). 새 시드는 v1 형태로 작성 권장.
- migration 핸들러 unit 테스트 필수 → §2·§3 에 박힘 (createChecklistStore + 3개 store).

### 1.3 회귀 가드와 충돌 점검

- `e2e/design-bundle-cleanup-round.spec.ts` — 일반 fs-level grep 가드. 본 묶음 변경(편집 모드 폼 추가)이 어떤 패턴을 들이는지 점검 의무:
  - "→" 텍스트 화살표 → 본 묶음 카피·UI에 사용 안 함 (design.md §5 회피 확정)
  - `text-red-N` / 토큰 외 hex → design.md §5 회피 확정
  - raw `bg-gray-*` → 회피 확정
  - **트리거 가능성 낮음** — design.md 토큰만 사용 시 통과.
- `e2e/design-bundle-b-i-row-tokens.spec.ts` — ChecklistItemRow 토큰 가드. **편집 모드 PrioritySelect·textarea 추가로 새 토큰 사용 시 가드 영향 가능**. 가드 약화하지 말고 design.md §5 토큰 표 그대로 사용. 필요 시 가드에 **편집 모드 슬롯 추가 검증**으로 강화 (qa §7.4 정렬).
- 다른 design-bundle-*.spec.ts — 본 묶음 직접 충돌 없음.

### 1.4 영향 요약

- **갱신 필요한 기존 테스트**: 9개 (unit 2, E2E 7)
- **신규 테스트 작성 대상**: 10개 (unit 4 + E2E 6)
- **합계 (`/feature-pipeline` write 단계 작업량)**: 19개
- 시드 헬퍼 신설(1개) + 기존 spec 7개 이관이 작업의 큰 덩어리. 헬퍼 도입으로 다음 schema 변경 시 산재 갱신 회피.

## 2. 테스트 레이어 분류 (피라미드 결정)

spec.md §2 시나리오 8개를 unit / e2e 둘 중 하나로 명시 분류:

| 시나리오 (spec §2 참조) | 레이어 | 근거 |
|---|---|---|
| 1. custom 항목 편집 happy path | **e2e** | UI 흐름 + store 갱신 + GA4 이벤트 발사까지 풀스택. Playwright |
| 2. 기본 항목 편집 차단 | **e2e** | 셀렉터 부재 검증 (편집 버튼 비노출). DOM 검증 |
| 3. 신규 추가 시 priority 선택 | **e2e** | UI 흐름 (ChecklistAddForm 셀렉터 → 추가 → 행 노출). 단 priority default 값 검증 부분은 **unit** 분리 가능 (`addCustomItem` store action 직접) — 중복 회피 위해 e2e만 |
| 4. priority만 변경 → 이벤트 1개만 | **e2e** | 사용자 흐름 + GA4 이벤트 발사 패턴. 분기 검증 |
| 5. note만 변경 → 이벤트 1개만 | **e2e** | 위와 동일. 4·5는 한 describe 안에 묶음 |
| 6. 편집 취소 | **e2e** | UI 흐름 + store 미반영 검증 |
| 7. schema migrate 성공 | **unit** | migrate 함수는 pure function. mock 0개. `it.each` 매트릭스. E2E 중복 불요 |
| 8. schema migrate 실패 → toast + 이벤트 | **e2e** | UI 흐름 (toast 노출) + `schema_migration_failed` 발사. E2E |

> ⚠️ 시나리오 7 (migrate 성공)은 store별 migrate 함수의 happy path를 unit으로. **사용자가 새 버전 첫 방문 시 실제 발사되는지**는 E2E로 검증할 수도 있지만, migrate 자체의 정확성은 unit으로 충분. E2E는 시나리오 8(실패 → toast)에 집중. 중복 금지 룰 (qa §3.3) 정렬.

## 3. Unit 테스트 대상

### 3.1 대상 함수·store

**신규 작성 (`src/store/__tests__/` 디렉토리 신설 필요)**:
- `src/store/createChecklistStore.ts::migrate` — v0→v1 identity migrate + 미지 버전 fallback. (신규)
- `src/store/useTimelineStore.ts::migrate` — v0→v1 identity migrate. (신규)
- `src/store/useWeightStore.ts::migrate` — v0→v1 identity migrate. (신규)

**갱신**:
- `src/lib/__tests__/analytics.test.ts` — 신규 이벤트 4종(`custom_item_priority_set`·`custom_item_note_set`·`schema_migration_run`·`schema_migration_failed`) wrapper 타입 검증 케이스 추가. (갱신)
- `src/lib/__tests__/note-classifier.test.ts` — 본 묶음 4.2=A 결정으로 "사용자 작성 note는 분류 제외" 보장. customItem note가 classifier 함수에 들어가지 않는 호출 경계 검증 케이스 추가 가능. 단 classifier 자체 로직은 변경 없음. (갱신, 미세)

### 3.2 케이스 매트릭스

QA §4.4 4가지 유형 중 적용되는 것만:

#### `createChecklistStore::migrate`

| 유형 | 케이스 |
|---|---|
| Happy Path | v0 `{ checkedIds: ['a','b'], customItems: [{id, title, priority, recommendedWeek, ...}] }` → v1 동일 형태 반환 (identity) |
| Boundary | 빈 `{ checkedIds: [], customItems: [] }` → v1 동일 빈 상태 / `null` 또는 `undefined` persistedState → default state 반환 |
| Priority/Tie-breaking | (해당 없음 — 우선순위 분기 로직 없음) |
| Invariant | round-trip: migrate(v0_data) → JSON 직렬화 → parse → `ChecklistState` 호환 / 미지 버전 v999 → default state + `migrationLostFlag: true` 세팅 또는 `schema_migration_failed` 트리거 메커니즘 |

`it.each` 권장 — v0/v1/v999/empty/null 매트릭스.

#### `useTimelineStore::migrate` · `useWeightStore::migrate`

| 유형 | 케이스 |
|---|---|
| Happy Path | v0 기존 데이터 형태 → v1 identity |
| Boundary | empty / null persistedState → default |

#### `analytics.ts` 신규 이벤트 wrapper (해당 시)

| 유형 | 케이스 |
|---|---|
| Happy Path | 신규 이벤트 4종 호출 시 `sendGAEvent` 가 올바른 event_name + 파라미터 형태로 호출되는지 (existing analytics.test.ts 패턴 답습) |
| Invariant | PII 금지 — `custom_item_note_set` 호출 시 note 원문 파라미터 동봉 안 함 (ga4.md §2 N3 점검) |

### 3.3 시간 의존 함수 점검

- 본 묶음에 `new Date()` 호출 있나? **N** (migrate 함수는 시간 무관, 편집 폼도 시간 무관)
- → 시간 의존 리팩토링 불필요.

### 3.4 mock 점검

- migrate 함수 unit 테스트에 필요한 mock 개수: **0** (pure function, persistedState 객체만 입력)
- analytics wrapper unit 테스트: **1** (`sendGAEvent` mock — 기존 `analytics.test.ts` 패턴 답습)
- 모든 unit 테스트 mock 개수 < 3 → unit 자격 충족 (qa §1)

## 4. E2E 테스트 대상

신규 spec 파일: `e2e/checklist-data-model-bundle.spec.ts`

### 4.1 4가지 describe 블록

- **Happy Path**:
  - 시나리오 1: custom 항목 편집 (시드 → 행 클릭 → 편집 모드 → priority high + note 변경 → 저장 → 행에 반영 + `custom_item_priority_set` + `custom_item_note_set` 이벤트 발사 확인 + 재로드 후 유지)
  - 시나리오 3: 신규 추가 시 priority 선택 (ChecklistAddForm에서 priority `high` 선택 → 추가 → 행에 high 표시 + `custom_item_add` 이벤트의 `priority` 파라미터 = `"high"` 검증)
  - 시나리오 4·5: priority만 변경 / note만 변경 → 해당 이벤트만 발사 (한 describe `'편집 시 변경된 필드만 이벤트 발사'` 안에 두 case)
- **Error / Validation**:
  - 시나리오 6: 편집 취소 → store 변경 없음, 이벤트 발사 없음, 행 원래대로
  - 시나리오 (추가): title 빈 값으로 저장 시도 → 저장 버튼 disabled, 폼 유지
- **권한 / 인증 (localStorage 분기)**:
  - 시나리오 2: 기본 항목에 편집 버튼 비노출 검증 (시드 + custom 0개 상태에서 기본 항목 행에 `[aria-label*="편집"]` 존재 안 함)
  - 시나리오 8: schema migrate 실패 → toast + `schema_migration_failed` 이벤트 (미지 버전 시드 → 페이지 진입 → sonner toast 텍스트 매치 + GA4 이벤트 발사 확인)
- **반응형 (Mobile 375px)**:
  - 시나리오 1 mobile variant — 편집 모드 폼이 375px에서 세로 스크롤 자연 처리, 저장·취소 버튼 접근 가능 확인 (designer §3 원칙 5 위반 의식적 감수의 회귀 가드 — 폼이 화면을 벗어나도 사용자가 저장 가능해야 함)

### 4.2 갱신 대상 기존 spec (§1.1에서 이관)

- `e2e/checklist-week-bug.spec.ts`: 인라인 `localStorage.setItem("checklist-storage-*", ...)` 를 `seedChecklistStore({ slug, customItems, checkedIds, version: 1 })` 헬퍼 호출로 교체
- `e2e/gamification.spec.ts`: customItems 시드 헬퍼로 이관
- `e2e/timeline-retention.spec.ts`: checklist-storage + timeline-storage 시드 모두 헬퍼로 이관 (timeline도 v1 부여됨)
- `e2e/p9-empty-state.spec.ts`: 빈 customItems 시드 헬퍼 이관 + 기본 항목 편집 버튼 비노출 검증 추가 가능
- `e2e/design-bundle-d-uncheck-toggle-dday.spec.ts`: customItems 시드 헬퍼 이관
- `e2e/design-bundle-k-delete-pattern.spec.ts`: customItems 시드 헬퍼 이관
- `e2e/design-bundle-b-i-row-tokens.spec.ts`: 행 토큰 가드 + 편집 모드 슬롯에 새 토큰 룰 적용 검증 추가 (가드 강화, 약화 X)

### 4.3 회귀 가드

이번 기능과 직접 관련 없지만 본 묶음이 깨뜨릴 수 있는 회귀:

- **기본 항목 편집 버튼 비노출 가드** — `e2e/checklist-data-model-bundle.spec.ts` 안에 `'기본 항목 행에는 편집 버튼이 존재하지 않는다'` describe. 향후 ChecklistItemRow 리팩토링 시 가드 작동.
- **PII 보호 가드** — `custom_item_note_set` 발사 시 note 원문이 파라미터에 동봉 안 됨 (marketer N3 정렬). E2E에서 `page.on('console')` 또는 dataLayer 검사로 검증.
- **schema_migration_failed 알람 가드** — 정상 흐름(v0→v1 happy)에서 `schema_migration_failed`가 발사되지 **않음**을 검증 (false positive 회귀 막기).
- **fs-level grep 가드 보강** — design-bundle-b-i-row-tokens.spec.ts 패턴 답습해 EditItemForm·PrioritySelect 컴포넌트에 토큰 외 hex 사용 0건 가드 신설 (qa §7.4 정렬).

### 4.4 시드 데이터·초기 상태

**시드 헬퍼 API (신규)**:
```ts
// e2e/helpers/seedStorage.ts
type SeedStorageInput = {
  consent?: 'accepted' | 'rejected';
  dueDate?: { dueDate: string; lastCalcDate?: string };
  checklist?: Record<string, {
    checkedIds: string[];
    customItems: ChecklistItem[];
    version?: number; // default 1
  }>;
  timeline?: { entries: TimelineEntry[]; version?: number };
  weight?: { entries: WeightEntry[]; version?: number };
};
async function seedStorage(page: Page, input: SeedStorageInput): Promise<void>;
```

기존 spec에서 인라인 `page.addInitScript` 호출 시:
```ts
// Before
await page.addInitScript(() => {
  localStorage.setItem('cookie-consent', 'accepted');
  localStorage.setItem('checklist-storage-pregnancy-prep', JSON.stringify({
    state: { checkedIds: [], customItems: [{ id: '...', title: '...', priority: 'medium', ... }] },
    version: 0,
  }));
});

// After
await seedStorage(page, {
  consent: 'accepted',
  checklist: {
    'pregnancy-prep': { checkedIds: [], customItems: [{ id: '...', title: '...', priority: 'medium', ... }] },
  },
});
```

**시나리오 8 (migrate 실패) 시드**:
```ts
await seedStorage(page, {
  consent: 'accepted',
  checklist: {
    'pregnancy-prep': { checkedIds: [], customItems: [...], version: 999 }, // 미지 버전
  },
});
```

### 4.5 GA4 이벤트 검증

- `custom_item_priority_set` — 시나리오 1·4 트리거. 파라미터 `item_id`·`from_priority`·`to_priority`·`slug` 검증.
- `custom_item_note_set` — 시나리오 1·5 트리거. 파라미터 `item_id`·`note_changed: true`·`note_length` (number) 검증. **note 원문 파라미터 부재 검증 의무**.
- `custom_item_add` (변경) — 시나리오 3. 파라미터 `priority` 추가 검증.
- `schema_migration_run` — 헬퍼 v0 시드 + 페이지 로드 후 발사 확인 (Happy Path describe 안 보조 검증).
- `schema_migration_failed` — 시나리오 8 트리거. 파라미터 `store_name`·`persisted_version: 999`·`current_version: 1` 검증.

검증 방법: 기존 `e2e/ga4-events.spec.ts` 또는 `e2e/marketing-events-wiring.spec.ts` 패턴 답습 (dataLayer 또는 `page.on('console')`).

## 5. Skip / Defer (보류 항목)

| 항목 | 보류 이유 | 제거 조건 | 제거 deadline |
|---|---|---|---|
| (없음) | — | — | — |

본 묶음에 skip 대상 없음. 모든 신규/갱신 테스트는 본 묶음 PR과 동시 머지.

## 6. 성공 기준

- **Unit**: 4개 케이스 묶음(`createChecklistStore::migrate` + `useTimelineStore::migrate` + `useWeightStore::migrate` + `analytics` 신규 이벤트) 모두 통과. 소요 < 500ms.
- **E2E**: 신규 spec `e2e/checklist-data-model-bundle.spec.ts` 4개 describe 블록 모두 통과. flaky retry 0회.
- **§1.1 갱신 대상 기존 테스트** 9개 모두 통과 (회귀 0). 특히 design-bundle-b-i-row-tokens 가드 강화 후 통과.
- **spec.md §2 시나리오 8개 전수가 §2 매트릭스에 매핑됨** (cross-check 통과).
- **시드 헬퍼 도입 부산물**: 다음 schema 변경 시 산재 갱신 폭 감소 (운영자 추가 작업 측정 불가지만 정성 평가).
- **PII 가드 통과**: `custom_item_note_set` 발사 시 note 원문 파라미터 동봉 0건 검증.
