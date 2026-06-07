# checklist-data-model-bundle 기획서

> 작성일: 2026-06-05  size: L
> 관련 리뷰: [review.md](./review.md)
> 출처: [phase-4.5.md §3.1 P1·P5](../../plan/phase-4.5.md), [p1-priority-note-edit/review.md](../p1-priority-note-edit/review.md) (P1 단독 컨텍스트 참조)

## review.md 결정사항 참조

- **4.1 = B (§2.3 C1 미채택)** — priority 시각 표현은 현 상태 유지(색 강조). C1 다운그레이드는 본 묶음에서 제외, 본 페이즈 종료 후 별도 결정.
- **4.2 = A (편집 둘 다 허용)** — customItems의 `priority`·`note` 모두 편집 모드에서 수정 가능. GA4 이벤트 2개 신설 의무 (`custom_item_priority_set`·`custom_item_note_set`).
- **4.3 = A (custom 한정)** — 기본 항목(`src/data/checklist_items.json`) priority/note override 거부. 운영자 SoT 보호. ChecklistItemRow는 `item.isCustom`에서만 편집 버튼 노출 (designer N4 변형 우려 완화).
- **4.4 = A (묶음 도입)** — P5 + P1 한 묶음 (4.1=B로 C1 제외). PR은 분리 가능 (P5 인프라 → P1 폼 노출 순).
- **4.5 = B (toast 알림)** — migrate 실패 시 sonner toast + `schema_migration_failed` 이벤트.
- **4.6 = A (한 폼)** — 편집 모드 진입 시 title + priority + note 한 폼에 동시 노출. designer §3 원칙 5 위반 감수 (review.md §5 명시).
- **4.7 = A (헬퍼 신설)** — `e2e/helpers/seedStorage.ts` 신규 + 기존 customItems 시드 박힌 spec 일괄 이관.

## 1. 배경·목적

- **운영자 관점**: phase-4.5 §3.1 P1 deferred 묶음을 해소해 phase-4.5 종료를 가로막는 잔여 결정 1건을 제거한다. P5 schema versioning 인프라가 같이 박혀 phase-5 통합 검색·공유 기능 등 후속 schema 변경 트리거 시 회복 비용이 낮아진다.
- **사용자 관점**: 사용자가 추가한 custom 항목의 우선순위와 메모를 직접 수정 가능. "내가 추가한 항목인데 왜 못 고치지?" 비대칭 좌절 제거. 본질 도구의 핵심 가치(누적된 진행 상태) 보존.
- **측정 관점**: `custom_item_priority_set`·`custom_item_note_set` 신설로 편집 사용률 측정 시작. 인프라 측에서 `schema_migration_run`·`schema_migration_failed`로 migrate 동작 모니터링.

## 2. 사용자 시나리오

- **시나리오 1 (custom 항목 편집 happy path)**: 사용자가 ChecklistAddForm으로 추가한 custom 항목을 ChecklistItemRow에서 편집 버튼 클릭 → 한 폼 안에 title input + priority select(high/medium/low) + note textarea 노출 → 변경 후 저장 → store 갱신 + `custom_item_priority_set`(priority 변경 시) / `custom_item_note_set`(note 변경 시) 이벤트 발사.
- **시나리오 2 (기본 항목 편집 차단)**: 기본 항목(`src/data/checklist_items.json` 출처) 행에는 편집 버튼 자체가 노출되지 않음. 행 클릭은 체크 토글만.
- **시나리오 3 (신규 추가 시 priority 선택)**: ChecklistAddForm에서 항목 추가 시 priority 셀렉터 노출 (기본값 `medium`, 사용자가 high/low로 변경 가능). 추가 시 `custom_item_add` 이벤트(기존)에 `priority` 파라미터 동반.
- **시나리오 4 (priority만 변경)**: 편집 폼에서 priority만 바꾸고 저장 → `custom_item_priority_set` 1회만 발사, `custom_item_note_set`은 발사 안 함.
- **시나리오 5 (note만 변경)**: 편집 폼에서 note만 바꾸고 저장 → `custom_item_note_set` 1회만 발사.
- **시나리오 6 (편집 취소)**: 편집 폼에서 변경 후 취소 → store 변경 없음, GA4 이벤트 발사 없음.
- **시나리오 7 (schema migrate 성공)**: 기존 사용자가 새 버전 배포 후 처음 방문 → 4개 store(useDueDateStore는 이미 v1) 의 hydration 시 v0 → v1 identity migrate (ChecklistItem.priority·note 필드는 이미 type에 존재하므로 값 변환 없이 통과) → `schema_migration_run` 이벤트(store_name·from_version·to_version 파라미터).
- **시나리오 8 (schema migrate 실패 — 미지 버전)**: 미래 버전(v999) 데이터가 localStorage에 있는 상태에서 구버전 코드 로드 → migrate가 모르는 버전 만남 → 기존 `createChecklistStore::onRehydrateStorage` error 분기 + `migrationLostFlag: true` 메커니즘 활용 → default state로 fallback + sonner toast "체크리스트 데이터를 정리했어요. 일부 설정이 초기값으로 돌아갔을 수 있어요." + `schema_migration_failed` 이벤트(store_name·persisted_version·current_version 파라미터).
- **시나리오 9 (title 빈 값 저장 시도)**: 편집 모드에서 title을 모두 지운 상태로 저장 시도 → 저장 버튼 disabled + title input 아래 "제목을 입력하세요" 안내 (design.md §3 EditItemForm 에러 상태). store·GA4 이벤트 변경 없음. 사용자가 title을 채우면 저장 버튼 활성화.

## 3. 기능 요구사항

### must (반드시 충족)

#### P5 인프라
- 4개 zustand store(`useDueDateStore`·`createChecklistStore`·`useTimelineStore`·`useWeightStore`)에 `persist` 옵션의 `version` 필드 부여. `useDueDateStore`는 v1 이미 적용 — 정합성 점검만, 나머지 3개는 v0→v1 마이그레이션 함수 신규 (identity migrate라도 명시).
- **타입 변경 없음** — `ChecklistItem.priority`(required), `note?`(optional), `isCustom?` 필드는 [src/types/checklist.ts](../../../src/types/checklist.ts)에 이미 정의됨. P5 createChecklistStore migrate는 customItems 값 변환 없이 통과하는 **identity migrate**. 본 묶음의 P5 인프라 의의는 향후 schema 변경 트리거 시 회복 비용을 낮추는 것 (review §6 우선순위 영향 참조).
- migrate 함수는 `(persistedState: unknown, version: number) => CurrentState` 시그니처를 따르는 pure function. store 파일 안에 inline (별도 helper 분리 X — dev §6.6 임의 결정 X와 페어 ② dev 주장 정렬).
- **`migrationLostFlag` 기존 인프라 활용** — [src/store/createChecklistStore.ts](../../../src/store/createChecklistStore.ts) 의 `onRehydrateStorage` error 분기 + `migrationLostFlag: true` 메커니즘이 이미 존재. 본 묶음은 그 분기에 (a) `schema_migration_failed` GA4 이벤트 발사 (b) sonner toast 트리거 두 부착만 추가. 메커니즘 자체는 재발명 안 함.
- 미지의 버전을 만나면 fallback to default state + sonner toast + `schema_migration_failed` 이벤트 발사 (4.5=B). 미지 버전 = migrate 함수가 case 처리 안 한 version 값 (예: persisted v999 vs current v1).

#### P1 편집 기능
- `ChecklistItem` 타입(`src/types/checklist.ts` 또는 store 내부 정의)에 `priority?: 'high'|'medium'|'low'`, `note?: string` 필드 optional 추가. 기본 항목은 `src/data/checklist_items.json` 그대로 (이미 priority·note 있음).
- ChecklistItemRow: `item.isCustom === true`(또는 동등 식별자)일 때만 편집 버튼 노출. 기본 항목 행에는 편집 버튼 렌더링 자체 X (designer N4 변형 우려 완화).
- ChecklistItemRow 편집 모드: title input + priority select(high/medium/low) + note textarea 한 폼에 동시 노출. 저장 시 변경된 필드별로 이벤트 발사 (priority 변경 → `custom_item_priority_set`, note 변경 → `custom_item_note_set`).
- ChecklistAddForm: priority 셀렉터 추가 (기본값 `medium`). 추가 시 기존 `custom_item_add` 이벤트에 `priority` 파라미터 동반.

#### GA4 이벤트 (must 영역에 박는 이유: planner §7.6)
- `custom_item_priority_set` — 파라미터: `item_id`, `from_priority`, `to_priority`, `slug` (체크리스트 slug)
- `custom_item_note_set` — 파라미터: `item_id`, `note_changed: true`, `slug` (note 원문은 PII 보호상 보내지 않음 — marketer N3·§3.1)
- `schema_migration_run` — 파라미터: `store_name`, `from_version`, `to_version`
- `schema_migration_failed` — 파라미터: `store_name`, `persisted_version`, `current_version`

#### E2E 시드 헬퍼
- `e2e/helpers/seedStorage.ts` 신규 — schema version + customItems 형태를 옵션으로 받아 `page.addInitScript`로 localStorage 시드. 기존 customItems 시드 박힌 E2E spec 일괄 이관 (페이즈 8-A 스캔 결과로 정확한 spec 목록 확정).

#### review.md §5 잔존 우려 완화
- ChecklistItemRow에서 기본 항목 편집 버튼 자체 비노출 (4.1=B + 4.3=A 결합으로 발생하는 "priority 색 강조되는데 사용자는 못 바꿈" 비대칭 신호 차단).

### should (가능하면 충족)

- migrate 함수 unit test (qa.md §2에서 시나리오 매트릭스화) — happy v0→v1 + 미지 버전 fallback + 손상 JSON fallback `it.each`.
- ChecklistAddForm의 priority 셀렉터 디자인은 ChecklistItemRow 편집 모드의 priority 셀렉터와 동일 컴포넌트 재사용 (dev §6.6 정합성).
- toast 카피는 [DESIGN.md](../../../DESIGN.md) 토큰 유지. designer §7 답변 톤 정렬.

### won't (이번 범위 밖)

- **§2.3 C1 priority 시각 다운그레이드** — 4.1=B로 본 묶음 제외. 별도 결정 항목으로 phase-4.5 잔여에 남김 (review.md §6 우선순위 영향 참조).
- **P7 note_type 분류** — 사용자 작성 note는 4.2=A 채택과 함께 P7 분류 대상에서 명시 제외 ([docs/content/persona.md §5.1](../../content/persona.md) 보강 의무는 별도 작업).
- **기본 항목 priority/note override 레이어** — 4.3=A로 제외. 향후 사용자 피드백 시 재오픈.
- **편집 UI 별도 칩/sheet 분리** — 4.6=A로 한 폼 채택, designer §3 원칙 5 위반 감수. 별도 UI 패턴은 다음 페이즈 재검토.
- **다른 3개 store의 데이터 모델 변경** — 본 묶음은 schema version 부여만 (identity migrate). 실제 필드 변경은 phase-5 트리거 시.

## 4. 예외·엣지 케이스

- **빈 상태**: customItems 0개 + 기본 항목만 있는 상태에서 편집 모드 시도 → 편집 버튼이 기본 항목에 노출 안 됨. 사용자 액션 부재.
- **편집 중 페이지 이탈**: 사용자가 편집 폼 미저장 상태로 페이지 떠남 → 변경분 폐기, GA4 이벤트 발사 안 함 (zustand state 미반영). 미저장 변경 알림은 본 범위 밖 (designer §N8 회색지대 — 사용자 시간 도둑질 피함).
- **title 빈 값 저장 시도** (시나리오 9): 저장 버튼 disabled + title input 아래 "제목을 입력하세요" 안내 (design.md §3 EditItemForm 에러 상태). text-muted-foreground 사용 (designer N4 빨간 경고색 지양).
- **localStorage 손실 (시크릿 모드·캐시 삭제)**: migrate가 빈 state 만남 → 정상 default 초기화. `schema_migration_*` 이벤트 발사 안 함 (정상 동작).
- **schema_migration_failed 후 재방문**: toast 1회 노출 후 fallback state 유지. 사용자가 다시 진입 시 store는 이미 default 상태이므로 추가 toast 없음.
- **priority 값 enum 외부 값**: 미지의 priority 값(`"urgent"` 등) migrate 시 만남 → `medium`으로 정규화. `schema_migration_failed` 아닌 silent normalize (값 손상 정도 미미 + 사용자에게 알릴 가치 낮음).
- **note 길이 한도**: textarea max length는 본 페이즈에서 결정 안 함 (designer.md 컴포넌트 디자인에서 권장값 결정). 일단 기능 동작에는 영향 없음.

## 5. 성공 기준

### 기능 동작
- 사용자가 custom 항목 편집 모드에서 priority·note 변경 후 저장 → ChecklistItemRow에 변경 즉시 반영 + localStorage 영속화 + 재로드 후에도 유지 (Phase 1.5 hydration 패턴 정합).
- 기본 항목 행에 편집 버튼이 노출되지 않음 (디자인 회귀 가드 spec으로 검증 — qa.md §2).
- 4개 store에 schema version 1 부여 후 기존 사용자 데이터 100% 보존 (migrate happy path).
- 미지 버전 localStorage 시드 후 페이지 로드 → fallback + toast + `schema_migration_failed` 이벤트 발사 (E2E 검증).

### 측정 지표 (ga4.md와 일치)
- 본 묶음 배포 후 4주: 신규 이벤트 4종 모두 GA4 DebugView에서 발사 확인.
- `custom_item_priority_set` 발사 횟수 > 0 (planner 페어 ① 숨은 가정 검증 — "사용자가 priority 편집을 실제로 원하는가").
- `schema_migration_run` 발사 횟수 ≈ 활성 사용자 수 (1인당 1회, store 4개라 ≤4회).
- `schema_migration_failed` 발사 횟수 ≈ 0 (이상 신호).

### 사용자 경험 (design.md와 일치)
- 편집 모드 한 폼이 모바일 320px에서 세로 스크롤 없이 노출 또는 자연스러운 스크롤 (디자인 결정 따름).
- toast 카피는 임산부 사용자에게 불안 자극 안 함 (planner §7.7 공포 마케팅 거부 정렬 — "복구 중", "초기화됐어요" 톤 무겁지 않게).

### 검증 (qa.md의 unit/e2e 매트릭스와 일치)
- migrate 함수 unit test ≥3개 (v0→v1 happy / 미지 버전 fallback / 손상 JSON fallback) — `it.each` 매트릭스.
- E2E happy path ≥1개 (custom 항목 편집 → 저장 → 재로드 후 유지).
- E2E 회귀 가드: 기본 항목 행에 편집 버튼 없음 selector 검증.
- E2E migrate 실패 시나리오: 미지 버전 시드 → toast 노출 + `schema_migration_failed` 이벤트 검증.
- 페이즈 8-A 스캔에서 식별된 영향 E2E spec 전부 갱신 + 신규 시드 헬퍼로 이관.
