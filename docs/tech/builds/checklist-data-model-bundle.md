# checklist-data-model-bundle

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-06-06
> plan: [spec](../../features/checklist-data-model-bundle/spec.md) · [qa](../../features/checklist-data-model-bundle/qa.md) · [design](../../features/checklist-data-model-bundle/design.md) · [ga4](../../features/checklist-data-model-bundle/ga4.md)

<!-- STEP:impl -->
## 구현

> 작성일: 2026-06-05
> 기획서: [docs/features/checklist-data-model-bundle/spec.md](../../features/checklist-data-model-bundle/spec.md)
> 디자인: [docs/features/checklist-data-model-bundle/design.md](../../features/checklist-data-model-bundle/design.md)
> 측정: [docs/features/checklist-data-model-bundle/ga4.md](../../features/checklist-data-model-bundle/ga4.md)
> QA 전략: [docs/features/checklist-data-model-bundle/qa.md](../../features/checklist-data-model-bundle/qa.md)

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 4개 store(`useDueDateStore`·`createChecklistStore`·`useTimelineStore`·`useWeightStore`) 모두 `version: 1` + `migrate` 부착 | ✅ | identity migrate (v0→v1), 미지 버전은 throw |
| `ChecklistItem.priority`/`note` 필드 활용 — 타입은 이미 존재, 사용 패턴만 변경 | ✅ | 타입 변경 없음 |
| ChecklistItemRow 편집 모드 = title + priority + note 한 폼 | ✅ | EditItemForm.tsx로 분리 |
| 기본 항목 행에 편집 버튼 비노출 | ✅ | `ChecklistRow` 의 `isCustom` 가드 — 기존 코드 유지 |
| ChecklistAddForm에 PrioritySelect 추가 + `custom_item_add` 에 `priority` 파라미터 동봉 | ✅ | 기본값 `medium` |
| 변경된 필드별로 `custom_item_priority_set` / `custom_item_note_set` 발사 | ✅ | 두 필드 모두 변경 시 두 이벤트 동시 발사 |
| `schema_migration_run` / `schema_migration_failed` 신설 + 미지 버전 시 toast | ✅ | `MigrationFlushClient` 가 gtag 준비 후 큐 flush |
| `e2e/helpers/seedStorage.ts` 신규 헬퍼 | ✅ | 4개 store 모두 시드 가능 + version 옵션 |
| 빌드(`npm run build`) 성공 | ✅ | turbopack + tsc 통과 |

### 생성/수정 파일 목록

#### 신규
- `src/lib/migration-events.ts` — migration 이벤트 큐 + flush 헬퍼. migrate 함수가 side-effect 없이 record만 하고, MigrationFlushClient 가 mount 시점에 GA4 발사
- `src/components/providers/MigrationFlushClient.tsx` — gtag 준비를 폴링한 뒤 큐 flush + 실패 케이스에 sonner toast 1회 노출
- `src/components/checklist/PrioritySelect.tsx` — priority enum 셀렉터. ChecklistAddForm·EditItemForm 둘 다 재사용
- `src/components/checklist/EditItemForm.tsx` — 한 폼 안에 title + PrioritySelect + note textarea + 저장/취소. `Escape` 키 = 취소

#### 수정
- `src/store/createChecklistStore.ts` — `version: 1` + `migrate` (v0 identity / 미지 버전 throw + record_failed) + 손상된 customItems priority 값 normalize
- `src/store/useTimelineStore.ts` — `version: 1` + identity `migrate` + 미지 버전 throw
- `src/store/useWeightStore.ts` — `version: 1` + identity `migrate` + 미지 버전 throw
- `src/store/useDueDateStore.ts` — 기존 v0→v1 분기에 `recordMigration` 부착 + 미지 버전 throw 분기 추가
- `src/components/checklist/ChecklistAddForm.tsx` — `priority` state 추가, PrioritySelect 슬롯, `custom_item_add` 페이로드에 `priority` 동봉
- `src/components/checklist/ChecklistItemRow.tsx` — 편집 분기를 EditItemForm으로 위임. props 시그니처: `isEditing` + `onSaveEdit(next)` + `onCancelEdit`. 기존 `editTitle`/`onChangeEditTitle` 제거
- `src/components/checklist/ChecklistPage.tsx` — `editingId` 만 유지(편집 폼 자체 상태), `saveEdit(original, next)` 가 변경 필드 diff 후 `custom_item_priority_set`/`custom_item_note_set` 발사
- `src/app/layout.tsx` — `<MigrationFlushClient />` 마운트

### 주요 결정 사항

- **migrate 함수의 "pure"성과 GA4 이벤트 발사 분리**: spec §3 의 "migrate = pure function" 원칙을 지키기 위해, migrate 안에서는 `recordMigration()` 으로 큐에만 적재하고 실제 GA4 발사는 `MigrationFlushClient` 가 담당. zustand persist 의 hydration이 분석 스크립트 로드보다 빠를 수 있어, gtag 가용해질 때까지 200ms 간격으로 최대 5초 폴링한다.
- **미지 버전 처리 = throw**: spec §3 의 "fallback to default state + toast + 이벤트" 를 충족하기 위해 미지 버전을 만나면 (a) failure record 적재 (b) throw 한다. throw 는 zustand persist 의 `onRehydrateStorage` error 분기로 전파 → `migrationLostFlag: true` 세팅 (checklist) 또는 default state (timeline/weight/duedate). MigrationFlushClient 가 큐의 failure record 를 보고 toast 1회 노출.
- **`schema_migration_failed` 단일 toast**: 4개 store 중 N개가 동시에 실패해도 토스트는 1회만 노출(`anyFailed` 플래그 + 큐를 일괄 drain). 임산부 사용자 불안 자극 회피 (planner §7.7 정렬).
- **note 길이 제한 = 500자, 카운터는 450자 초과 시 노출**: design.md §3 권장값을 그대로 채택. textarea `maxLength={500}` + onChange 측에서도 slice 로 이중 가드 (IME 입력 안정).
- **EditItemForm 폼 자체 상태**: ChecklistPage 는 `editingId` 만 보유하고 폼 입력값은 EditItemForm 내부 useState 가 가짐. 행 단위로 마운트/언마운트되므로 편집 취소 시 자동 폐기 (designer §N8 회피 동선 단순화).
- **priority enum 외부 값 silent normalize**: spec §4 edge case — migrate 시 `"urgent"` 등 미지 priority 값은 `medium` 으로 정규화. `schema_migration_failed` 발사 안 함 (값 손상이 미미해 사용자 알림 가치 낮음).
- **note 변경 비교는 trim 후 비교**: 사용자가 공백만 추가/삭제하면 이벤트 발사 안 함. 빈 note 저장 = `note: undefined` 로 store 반영하여 row 노출에서 사라짐.

### 가정 사항

- 4개 store 모두 기존 사용자 데이터는 zustand persist 기본 동작에 의해 `version: 0` 으로 해석된다 (storage JSON 에 version 필드가 없으면 0 처리). 따라서 본 묶음 배포 후 첫 방문에서 v0 → v1 identity migrate가 1회 실행되며, `schema_migration_run` 4회(또는 미진입 store는 그보다 적음) 발사 후 모두 v1로 영속화.
- `MigrationFlushClient` 의 5초 폴링 한계는 일반 브라우저 환경에서 충분 (gtag.js 로드 < 2초가 95퍼센타일). 한도 초과 시 큐 잔존 → 다음 페이지 이동 시 새 mount로 재시도.
- `sonner` Toaster 는 이미 layout 에 마운트되어 있어 본 묶음에서 추가 셋업 불필요.
- 시드 헬퍼(`seedStorage.ts`) 적용은 본 묶음 PR과 함께 진행되며, 기존 인라인 `localStorage.setItem` 시드는 후속 spec 일괄 이관 PR에서 처리한다 (qa.md §4.2 갱신 대상 7건). 본 PR에서는 헬퍼 신설만.

### 미구현 항목

- **§2.3 C1 priority 시각 다운그레이드** — 4.1=B로 본 묶음 제외 (spec §3 won't 명시).
- **편집 중 페이지 이탈 미저장 알림** — 4.6=A + designer §N8 의식적 미구현 (spec §4 edge).
- **textarea 자동 높이 증가** — 현재 `rows={3}` 고정. shadcn Textarea 의 `field-sizing-content` 가 자연 증가 처리 (브라우저 지원 한정). spec §4 본 묶음 영향 없음.

### 시드 헬퍼 이관 (qa.md §4.2)

본 PR에 포함됨. 6건 spec 의 인라인 `localStorage.setItem` 시드를 `seedStorage` 헬퍼로 치환:

**슬러그 키드 store (hospital-bag-storage 등):**
- `e2e/p9-empty-state.spec.ts` — `seedStore()` 내부 교체
- `e2e/design-bundle-d-uncheck-toggle-dday.spec.ts` — `seedHbStore()` 내부 교체
- `e2e/design-bundle-k-delete-pattern.spec.ts` — weight·checklist·timeline 3개 헬퍼 모두 교체
- `e2e/design-bundle-b-i-row-tokens.spec.ts` — 인라인 시드 + fs-level 가드 강화 1건 (qa.md §1.3)

**통합 store (`useChecklistStore`, 키 = `checklist-storage`):**
- `e2e/gamification.spec.ts` — 마일스톤 테스트 인라인 시드를 `seedStorage({checklist: {checklist: ...}})` 로
- `e2e/timeline-retention.spec.ts` — `.skip` 안 시드도 정리 (재활성화 시 즉시 헬퍼 활용)

**제외 1건:**
- `e2e/checklist-week-bug.spec.ts` — `removeItem` defensive cleanup만 있고 실제 seed 없음. clean slate 패턴 유지.

---

<!-- STEP:review -->
## 코드 리뷰

> 작성일: 2026-06-06
> 관련 spec: [docs/features/checklist-data-model-bundle/spec.md](../../features/checklist-data-model-bundle/spec.md)
> 관련 impl: [docs/implementation/checklist-data-model-bundle-impl.md](#구현)

### 리뷰 대상 파일

**신규 (5)**:
- `src/lib/migration-events.ts`
- `src/components/providers/MigrationFlushClient.tsx`
- `src/components/checklist/PrioritySelect.tsx`
- `src/components/checklist/EditItemForm.tsx`
- `e2e/helpers/seedStorage.ts` (테스트 인프라 — 가벼운 점검)

**수정 (8)**:
- `src/store/createChecklistStore.ts`
- `src/store/useTimelineStore.ts`
- `src/store/useWeightStore.ts`
- `src/store/useDueDateStore.ts`
- `src/components/checklist/ChecklistItemRow.tsx`
- `src/components/checklist/ChecklistAddForm.tsx`
- `src/components/checklist/ChecklistPage.tsx`
- `src/app/layout.tsx`

### 4가지 관점 점검 결과 요약

| 관점 | Critical | Warning | Suggestion |
|------|----------|---------|------------|
| 타입 안전성 | 0 | 1 | 1 |
| 성능 | 0 | 0 | 0 |
| 보안 | 0 | 0 | 0 |
| 접근성 | 0 | 0 | 1 |
| 아키텍처 | 0 | 1 | 1 |

---

### Critical 이슈 (즉시 수정 완료)

**없음.**

이번 묶음은 도메인이 잘 한정돼 있어 (P5 인프라 + P1 편집 폼) 런타임 크래시·보안 취약점·접근성 결정적 위반은 발견되지 않았습니다.

- `any` 타입 미사용 (`unknown` 으로 좁힌 후 type-guarded 변환)
- `dangerouslySetInnerHTML` 미사용
- env var 노출 없음 (가공 데이터만 GA4 로 전송, PII enum/boolean/number 검증)
- 모든 인터랙티브 요소 `aria-label` 부여 (편집 버튼·우선순위 셀렉터·메모 textarea·저장/취소 버튼·toast `role=status` 보존)
- 빌드·typecheck·unit·E2E 모두 통과 (141/141 unit, 신규 spec 10/10 + 이관 4건 50/50 + gamification 5/5)

---

### Warning (수정 권장 — 코드 미변경, 문서로만 기록)

#### 1. MigrationFlushClient — 늦게 마운트되는 store 의 migrate 이벤트/토스트 누락 가능성

- **위치**: `src/components/providers/MigrationFlushClient.tsx:9-39`
- **문제**: `useEffect` 가 mount 시 1회 + gtag 폴링 retry 로만 작동. 페이지 첫 진입 후 클라이언트 네비게이션으로 새 store 모듈이 import 되면(예: `/` → `/checklist/pregnancy-prep` 이동 시 `usePregnancyPrepStore` 모듈 첫 로드), 그 시점의 migrate 가 `recordMigration` 으로 큐에 적재되지만 MigrationFlushClient 의 useEffect 는 이미 실행 완료라 flush 가 안 됨.
- **영향**: 분석 신호 누락(주로 `schema_migration_run`). 슬러그별 checklist store 의 migrate **실패** 케이스도 toast 누락 가능 — 단, `migrationLostFlag` 메커니즘이 살아 있어 inline alert ("체크 기록을 새로 시작해요") 는 노출됨. timeline/weight/due-date store 는 inline alert 가 없어 toast 누락 시 사용자 신호 0.
- **확률 평가**: schema migration 자체가 1인당 1회 (v0→v1) 이벤트. 첫 진입이 슬러그별 페이지가 아닌 경우만 영향. 실제 누락 비율 추정 < 5%.
- **권장 수정 (refactor 단계 후보)**: subscription 패턴 도입 — `recordMigration` 호출 시 등록된 listener 알림 → MigrationFlushClient 가 listener 로 등록해 늦은 record 도 즉시 flush. 또는 store 모듈 load 시점에 직접 sendGAEvent + toast 호출 (pure migrate 원칙 완화).

#### 2. createChecklistStore — `normalizeCustomItems` 가 title/category 검증 미수행

- **위치**: `src/store/createChecklistStore.ts:21-30`
- **문제**: `normalizeCustomItems` 는 `priority` enum 만 정규화하고 `title`·`category` 등 다른 필수 필드 누락 시 그대로 통과. 손상된 localStorage(예: 외부 수동 편집) 가 `customItems: [{ id: 'x' }]` 같은 부분 객체를 갖고 있으면 그대로 store 에 들어가 행이 빈 텍스트로 렌더되거나 카테고리 없는 행이 어떤 subcategory 아래에도 안 보이는 사일런트 손실.
- **영향**: 런타임 크래시는 없음. UX 품질 저하.
- **권장 수정**: title 빈 문자열이거나 category 가 valid enum 외이면 그 item 을 drop (또는 fallback 카테고리). 단, 본 PR 범위는 P5 schema versioning 도입이라 손상 데이터 normalization 은 별도 결정. spec §4 edge 가 priority 만 명시한 점도 정렬.

---

### Suggestion (개선 아이디어 — 문서만)

#### 1. EditItemForm + ChecklistPage saveEdit — note trim 중복

- `EditItemForm.tsx:46` 에서 `onSave({ note: note.trim() })` 로 이미 trim 후 전달. `ChecklistPage.tsx:271` 에서 `next.note.trim()` 다시 호출. 두 번째 trim 은 no-op. 한 곳으로 단일화 권장 — 호출 경계에서 한 번만 (현 위치는 ChecklistPage). EditItemForm 은 raw 값 그대로 넘기는 게 인자 책임 분리에 더 가까움.

#### 2. PrioritySelect — `id` prop 사용 미흡

- `PrioritySelect.tsx:14` 의 `id?: string` prop 이 정의돼 있지만 EditItemForm·ChecklistAddForm 어디에서도 안 넘김. `<label htmlFor={...}>` 연결 시점에 쓸 수 있도록 남겨둠. 향후 form 라이브러리 도입 시 유용. 본 PR 에서는 사용 안 함 — 제거할지 유지할지 판단 보류.

#### 3. MigrationFlushClient — `MAX_WAIT_MS=5000` magic constant

- gtag 로드 대기 한도 5초. 환경 변수나 const 한 곳에서 관리하면 조정 가능. 지금은 단일 사용처라 magic number 라도 가독성 충분 — Suggestion 수준.

---

### 아키텍처 점검

- **P5 인프라 — store version + migrate**: 4개 store 모두 일관된 패턴. 명시적 version 1 + identity migrate (v0→v1) + 미지 버전 throw. 다음 schema 변경 시 회복 비용 낮음. ✓
- **P1 편집 폼 — 한 폼 결정 (4.6=A)**: title + priority + note 동시 노출. EditItemForm 분리로 ChecklistItemRow 복잡도 폭증 회피. designer §3 원칙 5 위반 의식적 감수 (review.md §5 명시). ✓
- **변경 필드별 GA4 이벤트 — diff 후 발사**: ChecklistPage.saveEdit 에서 original vs next 비교 후 변경 필드만 이벤트 발사. spec §3 must 정렬. ✓
- **PII 가드**: `custom_item_note_set` 페이로드에 note 원문 부재 + E2E + unit 모두 명시 검증. ✓
- **toast 단일 발사 invariant**: migration-events unit 테스트로 다발성 실패에도 toast 1회만 호출 보장 (planner §7.7 정렬). ✓

---

### 빌드 검증

Critical 이슈 0 → 빌드 재실행 생략. 이전 단계에서 이미 통과 확인 (5단계 run-e2e 직전 typecheck + unit + E2E).

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견 |
| Warning | 2건 (수정 권장) |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 없음 — 직전 단계 통과 확인분 그대로 신뢰) |

Warning 2건은 `/refactor` 단계에서 다룰 후보. 1번(MigrationFlushClient 늦은 mount)은 subscription 패턴 도입이라 변경 범위가 있어 별도 결정 권장. 2번(normalizeCustomItems title/category)은 small fix.

---

<!-- STEP:refactor -->
## 리팩토링

> 작성일: 2026-06-06
> 관련 review: [docs/review/checklist-data-model-bundle-review.md](#코드-리뷰)

### 리팩토링한 파일 목록

- `src/lib/migration-events.ts` — `subscribeMigration` API 추가, `recordMigration` 이 listener 알림
- `src/components/providers/MigrationFlushClient.tsx` — mount 1회 + retry 폴링 → mount + subscribe + retry 폴링
- `src/store/createChecklistStore.ts` — `normalizeCustomItems` 가 id/title/category 손상 시 그 행을 drop
- `src/lib/__tests__/migration-events.test.ts` — subscribe/unsubscribe 시나리오 4개 추가
- `src/store/__tests__/createChecklistStore.test.ts` — 손상 item drop 매트릭스 + 혼합 보존 케이스 추가

---

### 작업별 내용

#### 1. migration-events.ts — subscription 패턴 도입 (Warning 1)

- **출처**: review.md Warning 1
- **무엇을**: 모듈 레벨 `listeners: Array<() => void>` 와 `subscribeMigration(cb): () => void` API 신설. `recordMigration` 이 push 후 모든 listener 호출. 테스트용 reset 헬퍼에서 listener 도 같이 비움.
- **왜**: 기존 `MigrationFlushClient` 는 mount 시 useEffect 1회 + gtag 폴링 retry 만 사용. 클라이언트 네비게이션 후 import 된 store 의 migrate (예: `/` → `/checklist/pregnancy-prep` 이동 시 `usePregnancyPrepStore` 의 첫 hydrate) 가 큐에 record 를 추가해도 그 시점에 useEffect 는 이미 실행 완료라 flush 가 안 됨. subscription 으로 늦은 record 도 즉시 잡힘.

#### 2. MigrationFlushClient — subscribe 적용 (Warning 1 후속)

- **출처**: Warning 1 의 호출부
- **무엇을**: useEffect 안에서 (a) mount 즉시 `tryFlush` 1회 호출 + (b) `subscribeMigration` 으로 listener 등록 — record 추가 시 같은 `tryFlush` 재호출. unmount 시 unsubscribe + 진행 중 setTimeout 정리. `cancelled` 플래그로 unmount 후 비동기 retry 차단.
- **왜**: 1번 변경의 소비자 측 결합. 동작 변경 X — 기존 flush 가 작동하던 시나리오 (첫 페이지 진입 시 큐 1건) 는 immediate 호출에서 그대로 처리됨. 늦게 들어오는 record 도 listener 트리거로 잡힘.

#### 3. createChecklistStore — `normalizeCustomItems` 손상 item drop (Warning 2)

- **출처**: review.md Warning 2
- **무엇을**:
  - `VALID_CATEGORIES` ReadonlySet<ChecklistCategory> 신설 — 15개 카테고리 enum 명시.
  - `isNonEmptyString` 가드 helper 신설.
  - `normalizeCustomItems` 가 각 item 에 대해 (a) `id` 가 비어있지 않은 문자열인지 (b) `title` 동일 (c) `category` 가 valid enum 인지 검증. 위반 시 그 item 자체를 drop (`.map` → `.for-of + .push` 로 패턴 변경). priority enum 외 값 정규화는 기존 그대로 유지.
- **왜**: 기존 구현은 priority 만 검증. 손상된 localStorage (외부 수동 편집 또는 향후 schema 변경 시 부분 손실) 가 `customItems: [{ id: 'x' }]` 같은 부분 객체를 갖고 있으면 그대로 store 에 들어가 행이 빈 텍스트로 렌더되거나 카테고리 매핑 누락으로 어디에도 안 보이는 사일런트 손실. 그 행을 통째로 drop 하는 게 silent corruption 보다 안전.

#### 4. unit 테스트 갱신

- **출처**: 위 1·3 동작 검증
- **무엇을**:
  - `migration-events.test.ts`: `subscribeMigration` describe 블록 + 4 케이스 (단일 listener, 다중 listener, unsubscribe, 적재 시점 분리).
  - `createChecklistStore.test.ts`: 손상 item drop 매트릭스 (`it.each` 로 10건 변종 — title 빈/공백/null/누락/숫자, id 빈/누락, category 미지/null/누락) + 혼합 보존 순서 케이스.
- **왜**: 신규 동작에 회귀 가드. 새로 박은 invariant 가 향후 변경 시 깨지면 unit 단계에서 즉시 잡힘.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| migration-events API | record/flush/has | + subscribe |
| MigrationFlushClient | mount 1회 + gtag retry | mount + subscribe + gtag retry + cancelled flag |
| normalizeCustomItems | priority enum 만 검증 | priority + id + title + category 검증, 손상 drop |
| 신규 test 케이스 | — | subscribeMigration 4개 + 손상 drop 11개 |
| Unit 총 테스트 수 | 141 | 156 (+15) |

---

### public interface 보존

- `recordMigration(record)`, `flushPendingMigrationEvents()`, `hasPendingMigrations()` — 시그니처 동일
- `subscribeMigration(cb): () => void` 만 신규 추가
- `MigrationFlushClient` 컴포넌트 export — props 없음, 동일
- `migrateChecklistStorage(persistedState, version)` — 시그니처 동일. 입력이 동일하면 출력도 동일 (정상 데이터는 영향 없고 손상 데이터는 더 안전하게 drop). 단위 테스트 회귀 0.

---

### 빌드 결과
✅ 성공 (1회 시도)
✅ Unit 156/156 통과 (기존 141 + 신규 15)
