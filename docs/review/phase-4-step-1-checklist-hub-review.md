# Phase 4 Step 1 — 체크리스트 허브 코드 리뷰

> 리뷰 대상 PRD: [docs/phase-4/plan.md](../phase-4/plan.md) Step 1
> 구현 문서: [docs/implementation/phase-4-step-1-checklist-hub-impl.md](../implementation/phase-4-step-1-checklist-hub-impl.md)
> 리뷰일: 2026-04-29

## 리뷰 대상 파일 (17개)

신규:
- `src/store/createChecklistStore.ts`
- `src/data/hospital_bag_checklist.json`
- `src/data/partner_prep_checklist.json`
- `src/data/pregnancy_prep_checklist.json`
- `src/components/checklist/ChecklistHub.tsx`
- `src/components/checklist/ChecklistPage.tsx`
- `src/components/checklist/ChecklistProgress.tsx`
- `src/components/checklist/ChecklistRelatedContent.tsx`
- `src/components/checklist/ChecklistAddForm.tsx`
- `src/app/checklist/hospital-bag/page.tsx`
- `src/app/checklist/partner-prep/page.tsx`
- `src/app/checklist/pregnancy-prep/page.tsx`

수정:
- `src/types/checklist.ts`
- `src/store/useChecklistStore.ts`
- `src/app/checklist/page.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/app/sitemap.ts`

---

## Critical 이슈

**없음.** 런타임 에러·보안 취약점·접근성 차단·핵심 버그 없음.

---

## Warning (수정 권장)

### 1. ChecklistHub TimelineCard — `checked/total` 표시값이 100을 초과할 수 있음
- **위치**: [src/components/checklist/ChecklistHub.tsx:99-145](../../src/components/checklist/ChecklistHub.tsx#L99-L145)
- **문제**: `TimelineCard`는 `useChecklistStore` (타임라인 store)에서 `checkedIds.length`만 카운트하고 `total`에는 `checklist_items.json`의 길이만 전달한다. 사용자가 타임라인에서 커스텀 항목을 체크하면 `checkedIds`에 포함되지만 `total`에는 더해지지 않아 표시값이 `155/150`처럼 분모를 초과할 수 있다. 진행률 바는 `Math.min`으로 클램프되지만 텍스트 카운터는 그대로 노출된다.
- **권장 수정**: TimelineCard에 `customTimelineChecklist` 또는 store 전체 `customItems`도 전달해서 `total = base + customCount`로 계산하거나, 텍스트 카운터를 "체크한 항목 N개" 형태로 분모 없는 표현으로 바꾼다.

### 2. ChecklistPage — `effectiveCheckedIds` 배열을 매 렌더 새로 생성
- **위치**: [src/components/checklist/ChecklistPage.tsx:63](../../src/components/checklist/ChecklistPage.tsx#L63)
- **문제**: `const effectiveCheckedIds = hydrated ? checkedIds : []` 가 매 렌더 새 배열 참조를 만든다(미하이드레이트 시점). `ChecklistProgress`에 `checkedIds`로 전달되어 자식에서 `useMemo` 의존성으로 사용한다면 캐시 미스가 일어난다. 현 시점 `ChecklistProgress`에는 메모이제이션이 없어 영향이 없지만, 향후 자식 메모이제이션 추가 시 함정이 된다.
- **권장 수정**: `useMemo(() => hydrated ? checkedIds : EMPTY_ARRAY, [hydrated, checkedIds])` + 모듈 상수 `EMPTY_ARRAY: string[] = []` 로 안정 참조 유지.

### 3. ChecklistPage — 렌더 함수 내부에 80줄 인라인 카드 렌더링
- **위치**: [src/components/checklist/ChecklistPage.tsx:107-230](../../src/components/checklist/ChecklistPage.tsx#L107-L230)
- **문제**: 서브카테고리 루프 내부에 체크박스/우선순위 뱃지/노트/편집 모드/삭제 버튼이 한 덩어리로 80여 줄 인라인 작성. 가독성·테스트성·성능(이벤트 핸들러를 매 렌더 재생성) 저하. Off-by-one이나 UX 회귀가 들어와도 발견이 어렵다.
- **권장 수정**: `ChecklistItemRow.tsx`로 추출, props에 `item`, `isChecked`, `onToggle`, `onEdit`, `onRemove`, `priorityStyle`. `WeekChecklistSection`이 이미 비슷한 구조를 갖고 있어 그 패턴을 따르면 자연스럽다. (Step 1의 refactor 단계 후보)

### 4. ChecklistAddForm — `subcategories` 빈 배열 시 fallback 카테고리가 의미 없는 값
- **위치**: [src/components/checklist/ChecklistAddForm.tsx:18](../../src/components/checklist/ChecklistAddForm.tsx#L18)
- **문제**: `subcategories[0]?.key ?? "hospital"` — JSON 데이터가 빈 `subcategories`로 잘못 작성되면 카테고리가 "hospital"(타임라인 컨텍스트의 카테고리)로 주입되어 데이터 오염 발생. 현재 3개 JSON은 모두 `subcategories`를 채우고 있어 실제 트리거 가능성은 낮음.
- **권장 수정**: `subcategories.length === 0`이면 폼 자체를 disabled 처리하거나 dev 환경에서 `console.error` 로깅. 또는 Zod·런타임 검증으로 빈 배열 방지.

### 5. ChecklistPage — `STORE_BY_SLUG` 매핑이 타입은 안전하지만 신규 체크리스트 추가 시 동기화 누락 위험
- **위치**: [src/components/checklist/ChecklistPage.tsx:24-30](../../src/components/checklist/ChecklistPage.tsx#L24-L30)
- **문제**: 신규 체크리스트(예: Phase 4 후속의 "베이비 첫 만남 준비") 추가 시 `createChecklistStore` 인스턴스, JSON, 라우트, 그리고 이 매핑 4곳을 모두 수정해야 한다. 한 곳을 빠뜨리면 `STORE_BY_SLUG[slug]`가 `undefined`가 되어 런타임 크래시.
- **권장 수정**: `createChecklistStore` 모듈에서 `STORE_BY_SLUG`를 export하거나, slug → store registry를 한 곳에서 일원화. 또는 ChecklistPage가 store hook을 prop으로 받되, 인접 client wrapper 컴포넌트가 매핑을 담당하도록 분리.

### 6. ChecklistPage — 우선순위 매핑 객체가 모듈 스코프에 단순 객체로 선언
- **위치**: [src/components/checklist/ChecklistPage.tsx:32-36](../../src/components/checklist/ChecklistPage.tsx#L32-L36)
- **문제**: `Record<string, ...>`이라 `priority` 키 오타에 대한 컴파일 타임 검증이 약하다. `PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.medium` 라인이 fallback으로 가려준다.
- **권장 수정**: `Record<ChecklistItem['priority'], ...>`로 좁혀서 타입 안전성 확보. fallback `?? PRIORITY_STYLES.medium`은 그대로 두되 `priority`가 실제로 정확히 매칭됨이 타입으로 보장된다.

---

## Suggestion (개선 아이디어)

### 1. ChecklistRelatedContent에 영상 링크 hash가 `/videos#${id}` 패턴
- 현재 `/videos` 페이지가 hash 앵커 스크롤을 지원하는지 확인 필요. 미지원이면 사용자가 영상을 못 찾을 수 있음. Step 2의 `/info` 통합 시 함께 처리하면 자연스럽다.

### 2. JSON 시드 데이터의 "병원 제공 여부 전화 확인" 같은 note 운영
- 운영자(고미솔)가 24주차 임산부로 직접 출산가방을 준비하고 있어, 향후 경험에 따라 note 내용이 자주 갱신될 수 있다. note만 따로 빼서 i18n-style 메시지 카탈로그로 두면 큐레이션이 편해진다. 현재 규모에서는 불필요.

### 3. ChecklistHub의 카드 컴포넌트 두 종류(`TimelineCard`, `ChecklistCard`) 통합
- 두 카드가 거의 같은 구조(아이콘 + 제목 + 설명 + 칩 + 진행률). `TimelineCard`만 아이콘 영역이 컬러 박스인데, 이는 prop으로 처리 가능. 통합 시 코드 중복 제거 + 향후 카드 변형 추가 용이.

### 4. ChecklistProgress의 "완벽하게 준비되었어요!" 라인은 100% 정확히 도달했을 때만 보여주기
- 현재 `>= 100` 조건이라 customItems를 추가해도 100% 도달 가능하지만, "완벽" 표현을 base 항목 100% 시점에 한정하는 것이 의도와 더 일치할 수 있음. UX 정책 결정 필요.

### 5. Hub 카드 진행률 — SSR 시 0% 표시 → 하이드레이션 후 깜빡임
- `hydrated` 플래그로 미하이드레이트 시 `checked = 0`을 그리고, 하이드레이트 후 실제 값으로 점프. 사용자가 진행률을 "초기화됐다"고 오해할 수 있다. Skeleton/`opacity-0`으로 가렸다 보여주는 패턴도 고려 가능. 다만 정적 export + 빠른 하이드레이션 환경에서는 체감 영향 작음.

### 6. ChecklistAddForm — 우선순위·노트 입력 미지원
- 현재 추가는 분류·제목만 받음. 사용자 자유도를 위해 Step 2 또는 후속 개선에서 우선순위 선택과 노트 입력 추가 고려.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 6건 |
| Suggestion | 6건 |
| 빌드 | 미실행 (Critical 없음) |

E2E 13개 시나리오는 이미 통과 완료(`run-e2e` 단계). Warning 항목은 `/refactor` 단계에서 일괄 정리 가능.
