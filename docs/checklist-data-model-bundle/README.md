# checklist-data-model-bundle

> 작성일: 2026-06-06 | 작성자: Claude Code

## 개요

Phase 4.5 잔여 의사결정 1건(P1 custom 항목 priority·note 편집 허용) 해소 + P5 schema versioning 인프라를 한 묶음으로 도입. 4개 zustand store (`useDueDateStore`·`useChecklistStore`·`useTimelineStore`·`useWeightStore`) 모두에 `version: 1` + `migrate` 부착해 다음 schema 변경 시 회복 비용 절감. ChecklistItemRow 편집 모드에 title + priority + note 한 폼을 노출하고, 변경된 필드별로 `custom_item_priority_set`·`custom_item_note_set` GA4 이벤트 발사.

관련 문서:
- [기획서](../features/checklist-data-model-bundle/spec.md)
- [디자인](../features/checklist-data-model-bundle/design.md)
- [측정](../features/checklist-data-model-bundle/ga4.md)
- [QA 전략](../features/checklist-data-model-bundle/qa.md)
- [구현 기록](../implementation/checklist-data-model-bundle-impl.md)
- [코드 리뷰](../review/checklist-data-model-bundle-review.md)
- [리팩토링](../refactor/checklist-data-model-bundle-refactor.md)

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 4개 store 모두 `version: 1` + `migrate` 부착 | ✅ | identity migrate (v0→v1), 미지 버전은 throw |
| ChecklistItem `priority`/`note` 필드 활용 | ✅ | 타입 변경 없음 — 사용 패턴만 변경 |
| ChecklistItemRow 편집 모드 = title + priority + note 한 폼 | ✅ | EditItemForm.tsx로 분리 |
| 기본 항목 행에 편집 버튼 비노출 | ✅ | ChecklistRow의 `isCustom` 가드 |
| ChecklistAddForm에 PrioritySelect 추가 + `custom_item_add`에 `priority` 동봉 | ✅ | 기본값 medium |
| 변경 필드별 GA4 이벤트 발사 (`custom_item_priority_set` / `custom_item_note_set`) | ✅ | 두 필드 변경 시 두 이벤트 동시 발사 |
| `schema_migration_run` / `schema_migration_failed` 신설 + 미지 버전 toast | ✅ | MigrationFlushClient가 gtag 준비 후 flush |
| `e2e/helpers/seedStorage.ts` 신규 헬퍼 | ✅ | 4개 store 모두 시드 가능 + version 옵션 |
| qa.md §4.2 기존 spec 이관 (6건) + 가드 강화 1건 | ✅ | 본 PR에서 모두 처리 |

### 생성/수정 파일

**신규 (5)**:
- `src/lib/migration-events.ts` — migration 이벤트 큐 + flush + subscribe
- `src/components/providers/MigrationFlushClient.tsx` — gtag 폴링 + subscribe 후 큐 flush + 실패 toast 1회
- `src/components/checklist/PrioritySelect.tsx` — 우선순위 셀렉터 (재사용)
- `src/components/checklist/EditItemForm.tsx` — title + priority + note 한 폼
- `e2e/helpers/seedStorage.ts` — 4개 store 시드 헬퍼

**수정 (구현 8 + 테스트·이관 7)**:
- `src/store/createChecklistStore.ts` — `version: 1`, migrate, normalizeCustomItems (priority + id + title + category 검증)
- `src/store/useTimelineStore.ts` — `version: 1` + identity migrate
- `src/store/useWeightStore.ts` — `version: 1` + identity migrate
- `src/store/useDueDateStore.ts` — recordMigration 부착 + 미지 버전 throw
- `src/components/checklist/ChecklistItemRow.tsx` — 편집 분기를 EditItemForm으로 위임
- `src/components/checklist/ChecklistAddForm.tsx` — PrioritySelect + priority 파라미터
- `src/components/checklist/ChecklistPage.tsx` — `saveEdit(original, next)` diff → 변경 필드별 GA4 이벤트
- `src/app/layout.tsx` — `<MigrationFlushClient />` 마운트
- `e2e/{p9-empty-state, gamification, timeline-retention, design-bundle-d/k/b-i-row-tokens}.spec.ts` — 인라인 시드 → `seedStorage` 헬퍼 이관 + design-bundle-b-i에 fs-level 가드 강화 1건 추가

**Unit 테스트 (5)**:
- `src/lib/__tests__/migration-events.test.ts` (13 케이스)
- `src/store/__tests__/createChecklistStore.test.ts` (28 케이스 — 원본 17 + 손상 drop 매트릭스 11)
- `src/store/__tests__/useTimelineStore.test.ts` (7)
- `src/store/__tests__/useWeightStore.test.ts` (5)
- `src/store/__tests__/useDueDateStore.test.ts` (7)

### 주요 결정 사항

- **migrate 의 "pure" 원칙 + GA4 이벤트 분리**: migrate 내부에서는 `recordMigration()` 으로 큐만 적재. 실제 GA4 발사 + toast는 `MigrationFlushClient` 가 mount 시점 + subscribe listener 로 처리. gtag 가용 시점이 hydration 보다 늦을 수 있어 200ms 폴링 최대 5초.
- **미지 버전 = throw**: failure record 적재 후 throw. zustand persist 의 `onRehydrateStorage` error 분기로 전파. checklist store 는 `migrationLostFlag: true` + inline alert, 그 외 3개 store 는 default state. 어느 쪽이든 toast 1회.
- **단일 toast invariant**: 4개 store 중 N개가 동시 실패해도 toast 1회만 노출 (`anyFailed` 플래그 + 큐 일괄 drain). 임산부 사용자 불안 자극 회피 (planner §7.7 정렬).
- **note 500자 한도, 카운터는 450자 초과 시 노출**: design.md §3 권장값 그대로. textarea `maxLength` + onChange slice 이중 가드.
- **EditItemForm 폼 자체 상태**: ChecklistPage는 `editingId` 만 보유. 편집 취소 시 폼 unmount → 자동 폐기.
- **priority enum 외 값 silent normalize**: `'urgent'` 같은 미지의 priority → `medium` 으로 정규화 (`schema_migration_failed` 발사 안 함 — 사용자 알림 가치 낮음).
- **note 변경 비교는 trim 후 비교**: 공백만 추가/삭제는 이벤트 발사 안 함. 빈 note 저장 = `note: undefined` 반영.

### 가정 사항 및 미구현 항목

- 기존 사용자 데이터는 zustand persist 기본 동작에 의해 `version: 0` 으로 해석 → 본 묶음 배포 후 첫 방문에서 v0→v1 identity migrate 1회 실행 + `schema_migration_run` 발사 후 v1 영속화.
- MigrationFlushClient 5초 폴링 한계는 일반 환경 충분 (gtag.js 로드 < 2초 95p). 초과 시 큐 잔존 → 다음 페이지 이동 시 새 mount 로 재시도.
- `§2.3 C1 priority 시각 다운그레이드` — 4.1=B로 본 묶음 제외 (spec won't).
- 편집 중 페이지 이탈 미저장 알림 — 4.6=A + designer §N8 의식적 미구현.

---

## 코드 리뷰 결과

### Critical 이슈
**0건**. 런타임 크래시·보안 취약점·접근성 결정적 위반 없음.

### Warning (모두 refactor 단계에서 수정 완료)

| # | 파일 | 문제 | 수정 |
|---|------|------|------|
| 1 | `MigrationFlushClient.tsx` | useEffect 1회 + gtag retry 만으로는 클라이언트 네비게이션 후 import된 store의 migrate 이벤트/토스트 누락 가능 | subscribe 패턴 도입 — `recordMigration` 호출 시 listener 알림 |
| 2 | `createChecklistStore.ts::normalizeCustomItems` | priority만 검증. title/category 손상 시 사일런트 (빈 행/고아 행) | id/title/category 손상 시 해당 행 drop |

### Suggestion (문서만)

1. EditItemForm + ChecklistPage saveEdit — note `.trim()` 중복 호출 (한 곳으로 단일화 권장)
2. PrioritySelect `id` prop 미사용 (form 라이브러리 도입 시 활용 여지)
3. MigrationFlushClient `MAX_WAIT_MS=5000` magic number → 환경변수화 후보

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 2건 발견, 2건 수정 완료 (refactor 단계) |
| Suggestion | 3건 |

---

## 리팩토링 내용

### 작업 목록

1. **migration-events.ts — subscription 패턴 도입** (Warning 1): `subscribeMigration(cb): () => void` API 신설. `recordMigration` 이 push 후 모든 listener 호출. 늦게 마운트된 client component 도 새 record 즉시 잡음.
2. **MigrationFlushClient — subscribe 적용** (Warning 1 호출부): useEffect 에서 mount 즉시 + `subscribeMigration` 등록 + unmount 시 unsubscribe/clearTimeout/cancelled 플래그. 동작 변경 X — 기존 시나리오는 immediate 호출에서 처리.
3. **normalizeCustomItems — 손상 item drop** (Warning 2): `VALID_CATEGORIES` 15개 enum Set + `isNonEmptyString` 가드 신설. id·title·category 손상 시 그 행 drop. priority enum 외 정규화는 기존 유지.
4. **Unit 테스트 갱신**: migration-events.test.ts에 subscribe describe (4 케이스) + createChecklistStore.test.ts에 손상 drop 매트릭스 (11 케이스). 회귀 가드.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| migration-events API | record/flush/has | + subscribe |
| MigrationFlushClient | mount 1회 + gtag retry | mount + subscribe + gtag retry + cancelled flag |
| normalizeCustomItems | priority enum 만 검증 | priority + id + title + category 검증, 손상 drop |
| Unit 총 테스트 수 | 141 | 156 (+15) |

public interface 보존: `migrateChecklistStorage` 시그니처 동일, MigrationFlushClient props 없음 동일, 신규 export 만 추가.

---

## E2E 테스트 결과

신규 spec `e2e/checklist-data-model-bundle.spec.ts` 10 케이스 + 시드 헬퍼 이관 5건의 회귀 검증 55 케이스 = **65/65 통과**.

| 시나리오 | 결과 |
|----------|------|
| Happy Path (custom 편집·AddForm priority·priority만·note만) | ✅ 4 passed |
| Error/Validation (편집 취소·title 빈 값) | ✅ 2 passed |
| 권한/인증 (기본 항목 비노출·미지 버전 toast·v0 happy migrate) | ✅ 3 passed |
| 반응형 Mobile 375px (편집 폼 진입) | ✅ 1 passed |
| **신규 spec 전체** | **10 passed / 0 failed** |
| 이관 spec 회귀 검증 (p9-empty-state · design-bundle-d/k/b-i · gamification) | ✅ 55 passed |
| **합계** | **65 passed / 0 failed** |

📊 상세 리포트: `playwright-report/index.html`

### 사전 flaky (별개)
- `e2e/timeline-retention.spec.ts:46` — 본 묶음과 무관한 사전 부채. 단독·배치 모두 재현. retry/skip-mask 안 함, 별도 작업으로 다뤄야 함 (QA persona §7.1 정렬).

---

## 누락된 문서
없음.
