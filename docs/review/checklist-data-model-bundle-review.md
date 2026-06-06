# checklist-data-model-bundle 코드 리뷰

> 작성일: 2026-06-06
> 관련 spec: [docs/features/checklist-data-model-bundle/spec.md](../features/checklist-data-model-bundle/spec.md)
> 관련 impl: [docs/implementation/checklist-data-model-bundle-impl.md](../implementation/checklist-data-model-bundle-impl.md)

## 리뷰 대상 파일

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

## 4가지 관점 점검 결과 요약

| 관점 | Critical | Warning | Suggestion |
|------|----------|---------|------------|
| 타입 안전성 | 0 | 1 | 1 |
| 성능 | 0 | 0 | 0 |
| 보안 | 0 | 0 | 0 |
| 접근성 | 0 | 0 | 1 |
| 아키텍처 | 0 | 1 | 1 |

---

## Critical 이슈 (즉시 수정 완료)

**없음.**

이번 묶음은 도메인이 잘 한정돼 있어 (P5 인프라 + P1 편집 폼) 런타임 크래시·보안 취약점·접근성 결정적 위반은 발견되지 않았습니다.

- `any` 타입 미사용 (`unknown` 으로 좁힌 후 type-guarded 변환)
- `dangerouslySetInnerHTML` 미사용
- env var 노출 없음 (가공 데이터만 GA4 로 전송, PII enum/boolean/number 검증)
- 모든 인터랙티브 요소 `aria-label` 부여 (편집 버튼·우선순위 셀렉터·메모 textarea·저장/취소 버튼·toast `role=status` 보존)
- 빌드·typecheck·unit·E2E 모두 통과 (141/141 unit, 신규 spec 10/10 + 이관 4건 50/50 + gamification 5/5)

---

## Warning (수정 권장 — 코드 미변경, 문서로만 기록)

### 1. MigrationFlushClient — 늦게 마운트되는 store 의 migrate 이벤트/토스트 누락 가능성

- **위치**: `src/components/providers/MigrationFlushClient.tsx:9-39`
- **문제**: `useEffect` 가 mount 시 1회 + gtag 폴링 retry 로만 작동. 페이지 첫 진입 후 클라이언트 네비게이션으로 새 store 모듈이 import 되면(예: `/` → `/checklist/pregnancy-prep` 이동 시 `usePregnancyPrepStore` 모듈 첫 로드), 그 시점의 migrate 가 `recordMigration` 으로 큐에 적재되지만 MigrationFlushClient 의 useEffect 는 이미 실행 완료라 flush 가 안 됨.
- **영향**: 분석 신호 누락(주로 `schema_migration_run`). 슬러그별 checklist store 의 migrate **실패** 케이스도 toast 누락 가능 — 단, `migrationLostFlag` 메커니즘이 살아 있어 inline alert ("체크 기록을 새로 시작해요") 는 노출됨. timeline/weight/due-date store 는 inline alert 가 없어 toast 누락 시 사용자 신호 0.
- **확률 평가**: schema migration 자체가 1인당 1회 (v0→v1) 이벤트. 첫 진입이 슬러그별 페이지가 아닌 경우만 영향. 실제 누락 비율 추정 < 5%.
- **권장 수정 (refactor 단계 후보)**: subscription 패턴 도입 — `recordMigration` 호출 시 등록된 listener 알림 → MigrationFlushClient 가 listener 로 등록해 늦은 record 도 즉시 flush. 또는 store 모듈 load 시점에 직접 sendGAEvent + toast 호출 (pure migrate 원칙 완화).

### 2. createChecklistStore — `normalizeCustomItems` 가 title/category 검증 미수행

- **위치**: `src/store/createChecklistStore.ts:21-30`
- **문제**: `normalizeCustomItems` 는 `priority` enum 만 정규화하고 `title`·`category` 등 다른 필수 필드 누락 시 그대로 통과. 손상된 localStorage(예: 외부 수동 편집) 가 `customItems: [{ id: 'x' }]` 같은 부분 객체를 갖고 있으면 그대로 store 에 들어가 행이 빈 텍스트로 렌더되거나 카테고리 없는 행이 어떤 subcategory 아래에도 안 보이는 사일런트 손실.
- **영향**: 런타임 크래시는 없음. UX 품질 저하.
- **권장 수정**: title 빈 문자열이거나 category 가 valid enum 외이면 그 item 을 drop (또는 fallback 카테고리). 단, 본 PR 범위는 P5 schema versioning 도입이라 손상 데이터 normalization 은 별도 결정. spec §4 edge 가 priority 만 명시한 점도 정렬.

---

## Suggestion (개선 아이디어 — 문서만)

### 1. EditItemForm + ChecklistPage saveEdit — note trim 중복

- `EditItemForm.tsx:46` 에서 `onSave({ note: note.trim() })` 로 이미 trim 후 전달. `ChecklistPage.tsx:271` 에서 `next.note.trim()` 다시 호출. 두 번째 trim 은 no-op. 한 곳으로 단일화 권장 — 호출 경계에서 한 번만 (현 위치는 ChecklistPage). EditItemForm 은 raw 값 그대로 넘기는 게 인자 책임 분리에 더 가까움.

### 2. PrioritySelect — `id` prop 사용 미흡

- `PrioritySelect.tsx:14` 의 `id?: string` prop 이 정의돼 있지만 EditItemForm·ChecklistAddForm 어디에서도 안 넘김. `<label htmlFor={...}>` 연결 시점에 쓸 수 있도록 남겨둠. 향후 form 라이브러리 도입 시 유용. 본 PR 에서는 사용 안 함 — 제거할지 유지할지 판단 보류.

### 3. MigrationFlushClient — `MAX_WAIT_MS=5000` magic constant

- gtag 로드 대기 한도 5초. 환경 변수나 const 한 곳에서 관리하면 조정 가능. 지금은 단일 사용처라 magic number 라도 가독성 충분 — Suggestion 수준.

---

## 아키텍처 점검

- **P5 인프라 — store version + migrate**: 4개 store 모두 일관된 패턴. 명시적 version 1 + identity migrate (v0→v1) + 미지 버전 throw. 다음 schema 변경 시 회복 비용 낮음. ✓
- **P1 편집 폼 — 한 폼 결정 (4.6=A)**: title + priority + note 동시 노출. EditItemForm 분리로 ChecklistItemRow 복잡도 폭증 회피. designer §3 원칙 5 위반 의식적 감수 (review.md §5 명시). ✓
- **변경 필드별 GA4 이벤트 — diff 후 발사**: ChecklistPage.saveEdit 에서 original vs next 비교 후 변경 필드만 이벤트 발사. spec §3 must 정렬. ✓
- **PII 가드**: `custom_item_note_set` 페이로드에 note 원문 부재 + E2E + unit 모두 명시 검증. ✓
- **toast 단일 발사 invariant**: migration-events unit 테스트로 다발성 실패에도 toast 1회만 호출 보장 (planner §7.7 정렬). ✓

---

## 빌드 검증

Critical 이슈 0 → 빌드 재실행 생략. 이전 단계에서 이미 통과 확인 (5단계 run-e2e 직전 typecheck + unit + E2E).

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견 |
| Warning | 2건 (수정 권장) |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 없음 — 직전 단계 통과 확인분 그대로 신뢰) |

Warning 2건은 `/refactor` 단계에서 다룰 후보. 1번(MigrationFlushClient 늦은 mount)은 subscription 패턴 도입이라 변경 범위가 있어 별도 결정 권장. 2번(normalizeCustomItems title/category)은 small fix.
