# checklist-data-model-bundle Implementation

> 작성일: 2026-06-05
> 기획서: [docs/features/checklist-data-model-bundle/spec.md](../../features/checklist-data-model-bundle/spec.md)
> 디자인: [docs/features/checklist-data-model-bundle/design.md](../../features/checklist-data-model-bundle/design.md)
> 측정: [docs/features/checklist-data-model-bundle/ga4.md](../../features/checklist-data-model-bundle/ga4.md)
> QA 전략: [docs/features/checklist-data-model-bundle/qa.md](../../features/checklist-data-model-bundle/qa.md)

## 완료 조건 충족 여부

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

## 생성/수정 파일 목록

### 신규
- `src/lib/migration-events.ts` — migration 이벤트 큐 + flush 헬퍼. migrate 함수가 side-effect 없이 record만 하고, MigrationFlushClient 가 mount 시점에 GA4 발사
- `src/components/providers/MigrationFlushClient.tsx` — gtag 준비를 폴링한 뒤 큐 flush + 실패 케이스에 sonner toast 1회 노출
- `src/components/checklist/PrioritySelect.tsx` — priority enum 셀렉터. ChecklistAddForm·EditItemForm 둘 다 재사용
- `src/components/checklist/EditItemForm.tsx` — 한 폼 안에 title + PrioritySelect + note textarea + 저장/취소. `Escape` 키 = 취소

### 수정
- `src/store/createChecklistStore.ts` — `version: 1` + `migrate` (v0 identity / 미지 버전 throw + record_failed) + 손상된 customItems priority 값 normalize
- `src/store/useTimelineStore.ts` — `version: 1` + identity `migrate` + 미지 버전 throw
- `src/store/useWeightStore.ts` — `version: 1` + identity `migrate` + 미지 버전 throw
- `src/store/useDueDateStore.ts` — 기존 v0→v1 분기에 `recordMigration` 부착 + 미지 버전 throw 분기 추가
- `src/components/checklist/ChecklistAddForm.tsx` — `priority` state 추가, PrioritySelect 슬롯, `custom_item_add` 페이로드에 `priority` 동봉
- `src/components/checklist/ChecklistItemRow.tsx` — 편집 분기를 EditItemForm으로 위임. props 시그니처: `isEditing` + `onSaveEdit(next)` + `onCancelEdit`. 기존 `editTitle`/`onChangeEditTitle` 제거
- `src/components/checklist/ChecklistPage.tsx` — `editingId` 만 유지(편집 폼 자체 상태), `saveEdit(original, next)` 가 변경 필드 diff 후 `custom_item_priority_set`/`custom_item_note_set` 발사
- `src/app/layout.tsx` — `<MigrationFlushClient />` 마운트

## 주요 결정 사항

- **migrate 함수의 "pure"성과 GA4 이벤트 발사 분리**: spec §3 의 "migrate = pure function" 원칙을 지키기 위해, migrate 안에서는 `recordMigration()` 으로 큐에만 적재하고 실제 GA4 발사는 `MigrationFlushClient` 가 담당. zustand persist 의 hydration이 분석 스크립트 로드보다 빠를 수 있어, gtag 가용해질 때까지 200ms 간격으로 최대 5초 폴링한다.
- **미지 버전 처리 = throw**: spec §3 의 "fallback to default state + toast + 이벤트" 를 충족하기 위해 미지 버전을 만나면 (a) failure record 적재 (b) throw 한다. throw 는 zustand persist 의 `onRehydrateStorage` error 분기로 전파 → `migrationLostFlag: true` 세팅 (checklist) 또는 default state (timeline/weight/duedate). MigrationFlushClient 가 큐의 failure record 를 보고 toast 1회 노출.
- **`schema_migration_failed` 단일 toast**: 4개 store 중 N개가 동시에 실패해도 토스트는 1회만 노출(`anyFailed` 플래그 + 큐를 일괄 drain). 임산부 사용자 불안 자극 회피 (planner §7.7 정렬).
- **note 길이 제한 = 500자, 카운터는 450자 초과 시 노출**: design.md §3 권장값을 그대로 채택. textarea `maxLength={500}` + onChange 측에서도 slice 로 이중 가드 (IME 입력 안정).
- **EditItemForm 폼 자체 상태**: ChecklistPage 는 `editingId` 만 보유하고 폼 입력값은 EditItemForm 내부 useState 가 가짐. 행 단위로 마운트/언마운트되므로 편집 취소 시 자동 폐기 (designer §N8 회피 동선 단순화).
- **priority enum 외부 값 silent normalize**: spec §4 edge case — migrate 시 `"urgent"` 등 미지 priority 값은 `medium` 으로 정규화. `schema_migration_failed` 발사 안 함 (값 손상이 미미해 사용자 알림 가치 낮음).
- **note 변경 비교는 trim 후 비교**: 사용자가 공백만 추가/삭제하면 이벤트 발사 안 함. 빈 note 저장 = `note: undefined` 로 store 반영하여 row 노출에서 사라짐.

## 가정 사항

- 4개 store 모두 기존 사용자 데이터는 zustand persist 기본 동작에 의해 `version: 0` 으로 해석된다 (storage JSON 에 version 필드가 없으면 0 처리). 따라서 본 묶음 배포 후 첫 방문에서 v0 → v1 identity migrate가 1회 실행되며, `schema_migration_run` 4회(또는 미진입 store는 그보다 적음) 발사 후 모두 v1로 영속화.
- `MigrationFlushClient` 의 5초 폴링 한계는 일반 브라우저 환경에서 충분 (gtag.js 로드 < 2초가 95퍼센타일). 한도 초과 시 큐 잔존 → 다음 페이지 이동 시 새 mount로 재시도.
- `sonner` Toaster 는 이미 layout 에 마운트되어 있어 본 묶음에서 추가 셋업 불필요.
- 시드 헬퍼(`seedStorage.ts`) 적용은 본 묶음 PR과 함께 진행되며, 기존 인라인 `localStorage.setItem` 시드는 후속 spec 일괄 이관 PR에서 처리한다 (qa.md §4.2 갱신 대상 7건). 본 PR에서는 헬퍼 신설만.

## 미구현 항목

- **§2.3 C1 priority 시각 다운그레이드** — 4.1=B로 본 묶음 제외 (spec §3 won't 명시).
- **편집 중 페이지 이탈 미저장 알림** — 4.6=A + designer §N8 의식적 미구현 (spec §4 edge).
- **textarea 자동 높이 증가** — 현재 `rows={3}` 고정. shadcn Textarea 의 `field-sizing-content` 가 자연 증가 처리 (브라우저 지원 한정). spec §4 본 묶음 영향 없음.

## 시드 헬퍼 이관 (qa.md §4.2)

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
