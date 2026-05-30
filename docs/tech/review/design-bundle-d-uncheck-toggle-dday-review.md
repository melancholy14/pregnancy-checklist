# design-bundle-d-uncheck-toggle-dday 코드 리뷰

> 리뷰일: 2026-05-10
> 관련 스펙: [docs/features/design-bundle-d-uncheck-toggle-dday/spec.md](../features/design-bundle-d-uncheck-toggle-dday/spec.md)
> 관련 구현: [docs/implementation/design-bundle-d-uncheck-toggle-dday-impl.md](../implementation/design-bundle-d-uncheck-toggle-dday-impl.md)

## 리뷰 대상 파일
- `src/components/checklist/ChecklistItemRow.tsx`
- `src/components/checklist/ChecklistPage.tsx`

총 2개 파일.

---

## Critical 이슈 (즉시 수정 완료)

없음.

---

## Warning (수정 권장)

없음.

---

## Suggestion (개선 아이디어)

### 1. ChecklistPage — `subVisibleItems` 계산을 useMemo로 격상 가능
- **위치**: [src/components/checklist/ChecklistPage.tsx:300-307](../../src/components/checklist/ChecklistPage.tsx#L300-L307)
- **현재**: 카테고리 매핑(`meta.subcategories.map`) 안에서 매 렌더마다 `subItems.filter` + `subVisibleItems = subItems.filter(...)` 두 번의 필터링. 카테고리 3개 × 항목 ~32개 수준이라 실측 영향은 무시할 수준.
- **개선 시나리오**: hospital-bag 32개 + 사용자가 customItems를 ~50건 더 추가하는 케이스에서, 토글 토글 시 매 렌더 100~150건 필터링이 3회 반복. 리스트가 커지면 useMemo로 한 번에 카테고리별 visible map을 만드는 편이 명확함.
- **본 라운드 결정**: 데이터 규모가 작아 본 작업 범위에서 보류.

### 2. ChecklistPage — `style={{ wordBreak: "keep-all" }}` 인라인을 Tailwind utility로 통일 가능
- **위치**: [src/components/checklist/ChecklistPage.tsx:347](../../src/components/checklist/ChecklistPage.tsx#L347)
- **현재**: 빈 상태 메시지에 `style={{ wordBreak: "keep-all" }}` 인라인 적용.
- **개선**: Tailwind 4의 `break-keep` utility로 대체하면 토큰화·일관성 향상. 단, 본 코드베이스에서 다른 한국어 메시지에 인라인 패턴이 존재하면 일관성 우선이 정답일 수 있음 — 별도 라운드에서 일괄 정리.

### 3. ChecklistItemRow — currentPregnancyWeek 변경 시 view 이벤트 재발사 정책 검토
- **위치**: [src/components/checklist/ChecklistItemRow.tsx:58-69](../../src/components/checklist/ChecklistItemRow.tsx#L58-L69)
- **현재**: `upcomingViewSentRef` 가 한번 true 가 되면 `currentPregnancyWeek` 가 바뀌어도 다시 발사하지 않음. spec §3 M6 "마운트 시 1회"와 정합.
- **검토**: 사용자가 due-date 를 재설정해 `currentPregnancyWeek` 가 변하면 weeks_ahead 가 바뀌므로 새 view 가 의미 있는 신호일 수 있음. 다만 현재 spec/ga4.md 결정은 "1회"라 변경 시 ga4.md §변경 정책에 따라 별도 라운드에서 검토.

### 4. ChecklistPage — `visibleItemCount` 의 사용 범위 단순화 가능
- **위치**: [src/components/checklist/ChecklistPage.tsx:227-233](../../src/components/checklist/ChecklistPage.tsx#L227-L233)
- **현재**: `showUncheckedOnly === false` 분기에서도 `allItems.length` 를 반환하지만 `showFilterEmptyState` 에서만 사용. 그 분기에서는 항상 false 라 실제로는 의미 없는 계산.
- **개선**: `visibleItemCount` 를 제거하고 `showFilterEmptyState` 에서 `allItems.filter(...).length === 0` 인라인 평가 가능. 가독성 트레이드오프(현재 변수명이 의도를 잘 드러냄). 본 라운드 보류.

---

## 4가지 관점 요약

| 관점 | 평가 | 비고 |
|------|------|------|
| 타입 안전성 | ✅ 통과 | `any` 사용 0. 모든 props·hook deps 정확. `currentPregnancyWeek: number \| null` null 가드 적절. |
| 성능 | ✅ 통과 | `useMemo`/`useCallback` 적절. `visibleItemCount` `useMemo` 캐시. 항목 규모 작아 매 렌더 필터링 영향 미미. |
| 보안 | ✅ 통과 | `dangerouslySetInnerHTML` 0. 사용자 입력은 React 자동 escape. `sendGAEvent` PII 0 (item_id enum + integer만). |
| 접근성 | ✅ 통과 | 토글 `<label htmlFor>` + Switch `id` 연결 + `aria-label` 중복 안전. 빈 상태 `role="status" aria-live="polite"`. D-day 라벨 텍스트 노출 + 아이콘 `aria-hidden`. 키보드 Tab/Space 정상. |

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 완료 |
| Warning | 0건 |
| Suggestion | 4건 |
| 빌드 | 미실행 (Critical 없음) |
