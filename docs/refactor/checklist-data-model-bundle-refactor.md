# checklist-data-model-bundle 리팩토링

> 작성일: 2026-06-06
> 관련 review: [docs/review/checklist-data-model-bundle-review.md](../review/checklist-data-model-bundle-review.md)

## 리팩토링한 파일 목록

- `src/lib/migration-events.ts` — `subscribeMigration` API 추가, `recordMigration` 이 listener 알림
- `src/components/providers/MigrationFlushClient.tsx` — mount 1회 + retry 폴링 → mount + subscribe + retry 폴링
- `src/store/createChecklistStore.ts` — `normalizeCustomItems` 가 id/title/category 손상 시 그 행을 drop
- `src/lib/__tests__/migration-events.test.ts` — subscribe/unsubscribe 시나리오 4개 추가
- `src/store/__tests__/createChecklistStore.test.ts` — 손상 item drop 매트릭스 + 혼합 보존 케이스 추가

---

## 작업별 내용

### 1. migration-events.ts — subscription 패턴 도입 (Warning 1)

- **출처**: review.md Warning 1
- **무엇을**: 모듈 레벨 `listeners: Array<() => void>` 와 `subscribeMigration(cb): () => void` API 신설. `recordMigration` 이 push 후 모든 listener 호출. 테스트용 reset 헬퍼에서 listener 도 같이 비움.
- **왜**: 기존 `MigrationFlushClient` 는 mount 시 useEffect 1회 + gtag 폴링 retry 만 사용. 클라이언트 네비게이션 후 import 된 store 의 migrate (예: `/` → `/checklist/pregnancy-prep` 이동 시 `usePregnancyPrepStore` 의 첫 hydrate) 가 큐에 record 를 추가해도 그 시점에 useEffect 는 이미 실행 완료라 flush 가 안 됨. subscription 으로 늦은 record 도 즉시 잡힘.

### 2. MigrationFlushClient — subscribe 적용 (Warning 1 후속)

- **출처**: Warning 1 의 호출부
- **무엇을**: useEffect 안에서 (a) mount 즉시 `tryFlush` 1회 호출 + (b) `subscribeMigration` 으로 listener 등록 — record 추가 시 같은 `tryFlush` 재호출. unmount 시 unsubscribe + 진행 중 setTimeout 정리. `cancelled` 플래그로 unmount 후 비동기 retry 차단.
- **왜**: 1번 변경의 소비자 측 결합. 동작 변경 X — 기존 flush 가 작동하던 시나리오 (첫 페이지 진입 시 큐 1건) 는 immediate 호출에서 그대로 처리됨. 늦게 들어오는 record 도 listener 트리거로 잡힘.

### 3. createChecklistStore — `normalizeCustomItems` 손상 item drop (Warning 2)

- **출처**: review.md Warning 2
- **무엇을**:
  - `VALID_CATEGORIES` ReadonlySet<ChecklistCategory> 신설 — 15개 카테고리 enum 명시.
  - `isNonEmptyString` 가드 helper 신설.
  - `normalizeCustomItems` 가 각 item 에 대해 (a) `id` 가 비어있지 않은 문자열인지 (b) `title` 동일 (c) `category` 가 valid enum 인지 검증. 위반 시 그 item 자체를 drop (`.map` → `.for-of + .push` 로 패턴 변경). priority enum 외 값 정규화는 기존 그대로 유지.
- **왜**: 기존 구현은 priority 만 검증. 손상된 localStorage (외부 수동 편집 또는 향후 schema 변경 시 부분 손실) 가 `customItems: [{ id: 'x' }]` 같은 부분 객체를 갖고 있으면 그대로 store 에 들어가 행이 빈 텍스트로 렌더되거나 카테고리 매핑 누락으로 어디에도 안 보이는 사일런트 손실. 그 행을 통째로 drop 하는 게 silent corruption 보다 안전.

### 4. unit 테스트 갱신

- **출처**: 위 1·3 동작 검증
- **무엇을**:
  - `migration-events.test.ts`: `subscribeMigration` describe 블록 + 4 케이스 (단일 listener, 다중 listener, unsubscribe, 적재 시점 분리).
  - `createChecklistStore.test.ts`: 손상 item drop 매트릭스 (`it.each` 로 10건 변종 — title 빈/공백/null/누락/숫자, id 빈/누락, category 미지/null/누락) + 혼합 보존 순서 케이스.
- **왜**: 신규 동작에 회귀 가드. 새로 박은 invariant 가 향후 변경 시 깨지면 unit 단계에서 즉시 잡힘.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| migration-events API | record/flush/has | + subscribe |
| MigrationFlushClient | mount 1회 + gtag retry | mount + subscribe + gtag retry + cancelled flag |
| normalizeCustomItems | priority enum 만 검증 | priority + id + title + category 검증, 손상 drop |
| 신규 test 케이스 | — | subscribeMigration 4개 + 손상 drop 11개 |
| Unit 총 테스트 수 | 141 | 156 (+15) |

---

## public interface 보존

- `recordMigration(record)`, `flushPendingMigrationEvents()`, `hasPendingMigrations()` — 시그니처 동일
- `subscribeMigration(cb): () => void` 만 신규 추가
- `MigrationFlushClient` 컴포넌트 export — props 없음, 동일
- `migrateChecklistStorage(persistedState, version)` — 시그니처 동일. 입력이 동일하면 출력도 동일 (정상 데이터는 영향 없고 손상 데이터는 더 안전하게 drop). 단위 테스트 회귀 0.

---

## 빌드 결과
✅ 성공 (1회 시도)
✅ Unit 156/156 통과 (기존 141 + 신규 15)
