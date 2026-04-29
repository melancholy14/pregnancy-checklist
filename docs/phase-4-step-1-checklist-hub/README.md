# Phase 4 Step 1 — 체크리스트 허브 확장

> 작성일: 2026-04-29 | 작성자: Claude Code
> 출처 PRD: [docs/phase-4/plan.md](../phase-4/plan.md) Step 1

## 개요

"pregnancy-checklist.com" 도메인의 정체성을 강화하기 위해 인터랙티브 체크리스트를 4종으로 확장한다.
`/checklist` 허브 페이지를 신설하고 그 아래에 출산가방·남편준비·임신준비 3종 독립 체크리스트를 추가하며,
기존 `useChecklistStore`를 팩토리 함수로 추출하여 데이터만 교체해 재사용한다. 각 체크리스트는 자체 localStorage 키로 데이터가 격리되며, 상단 설명 + 인터랙티브 도구 + 하단 관련 콘텐츠 CTA로 구성된 도구·콘텐츠 하이브리드 구조를 채택한다.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `/checklist` 허브 4종 카드 표시 | ✅ | 타임라인 + 출산가방 + 남편준비 + 임신준비 |
| `/checklist/hospital-bag` 인터랙티브 동작 | ✅ | 체크/언체크, 커스텀 추가/삭제 |
| `/checklist/partner-prep` 인터랙티브 동작 | ✅ | 동일 |
| `/checklist/pregnancy-prep` 인터랙티브 동작 | ✅ | 동일 |
| 각 체크리스트 localStorage 독립 저장 | ✅ | `hospital-bag-storage`, `partner-prep-storage`, `pregnancy-prep-storage` |
| 커스텀 아이템 추가/삭제 | ✅ | `ChecklistAddForm` + `DeleteConfirmDialog` |
| 진행률(%) 실시간 표시 + 서브카테고리별 진행률 | ✅ | `ChecklistProgress` |
| 상단 200~300자 설명 + 하단 관련 콘텐츠 CTA | ✅ | `meta.description` + `ChecklistRelatedContent` |
| `/checklist` redirect 제거 | ✅ | 허브 페이지로 교체 |
| BottomNav 체크리스트 탭 추가 | ✅ | 타임라인 → 체크리스트, prefix 매칭 |
| 페이지별 SEO 메타 (title/description/OG/canonical) | ✅ | 4개 라우트 |
| sitemap.ts 신규 4개 URL 추가 | ✅ | `/checklist`, `/checklist/hospital-bag`, `/checklist/partner-prep`, `/checklist/pregnancy-prep` |
| 모바일 반응형 | ✅ | `max-w-2xl` + Tailwind 반응형 |

### 생성/수정 파일

#### 신규 (13)
- `src/store/createChecklistStore.ts` — Zustand persist 팩토리 + 3종 store + `CHECKLIST_STORE_BY_SLUG` 매핑
- `src/data/hospital_bag_checklist.json` — 32개 아이템 (엄마/아기/서류 3 서브카테고리)
- `src/data/partner_prep_checklist.json` — 25개 아이템 (출산 전/당일/산후 3 서브카테고리)
- `src/data/pregnancy_prep_checklist.json` — 24개 아이템 (건강/영양/검사/재무 4 서브카테고리)
- `src/components/checklist/ChecklistHub.tsx` — 허브 페이지 (타임라인 + 3종 카드 + 미니 진행률)
- `src/components/checklist/ChecklistPage.tsx` — 범용 체크리스트 페이지 컨테이너
- `src/components/checklist/ChecklistItemRow.tsx` — 카드 한 줄 (체크/편집/삭제) [리팩토링 단계에서 추가]
- `src/components/checklist/ChecklistProgress.tsx` — 전체/서브카테고리 진행률 바
- `src/components/checklist/ChecklistRelatedContent.tsx` — 메타 기반 관련 콘텐츠 CTA
- `src/components/checklist/ChecklistAddForm.tsx` — 단일 컨텍스트 커스텀 아이템 추가 폼
- `src/app/checklist/hospital-bag/page.tsx` — 출산가방 라우트 + 메타
- `src/app/checklist/partner-prep/page.tsx` — 남편/파트너 준비 라우트 + 메타
- `src/app/checklist/pregnancy-prep/page.tsx` — 임신 준비 라우트 + 메타

#### 수정 (5)
- `src/types/checklist.ts` — `ChecklistCategory` 유니온에 11개 서브카테고리 추가, `ChecklistMeta`/`ChecklistSubcategory`/`ChecklistData`/`ChecklistItem.note?` 추가
- `src/store/useChecklistStore.ts` — 팩토리 호출로 내부 리팩토링(`createChecklistStore('checklist-storage')`). export 시그니처/storage key 보존
- `src/app/checklist/page.tsx` — `redirect("/timeline")` 제거 → 허브 렌더링 + Metadata
- `src/components/layout/BottomNav.tsx` — 타임라인 탭 → 체크리스트 탭(`ListChecks`), 활성 매칭에 prefix 옵션 도입
- `src/app/sitemap.ts` — 신규 4개 URL 추가

### 주요 결정 사항

- **Server→Client prop 직렬화 제약**: 첫 설계에서 `ChecklistPage`에 `useStore` 훅을 prop으로 전달하려 했으나 Next.js 정적 export에서 함수 prop 직렬화 불가로 빌드 실패. `storeSlug` 식별자를 받아 `CHECKLIST_STORE_BY_SLUG` 매핑으로 훅을 선택하도록 변경.
- **BottomNav prefix 매칭**: 체크리스트 허브 + 하위 3개 페이지 모두에서 "체크리스트" 탭이 활성으로 보이도록 `match: "prefix"` 옵션 도입. 기존 `==` 매칭은 보존하면서 모드만 옵션화.
- **`recommendedWeek = 0`**: 신규 3종은 주차 매핑 대상이 아니므로 0 사용. 신규 store는 별도 키이므로 기존 `getUnassignedChecklist`(타임라인 customItems만 처리)와 충돌 없음.
- **타입 확장 vs 분리**: `ChecklistItem.category`를 11개 서브카테고리까지 포함하는 단일 유니온으로 확장. 기존 `CATEGORY_OPTIONS`(타임라인 5종) 그대로 유지. 신규 페이지는 `ChecklistMeta.subcategories`로 컨텍스트별 카테고리를 자체 선언.
- **출산가방 시드 데이터 출처**: 운영자 작성 [hospital-bag-draft.md](../../src/content/draft/hospital-bag-draft.md)의 산모/아기/보호자/서류 체크리스트를 직접 참조. 분만 방식별 차이(자연분만 회음부 방석 vs 제왕절개 압박스타킹) 반영.
- **`note` 필드 도입**: 일부 아이템(병원 제공 여부 확인, 카시트 법적 의무 등)에 짧은 부연 설명 표시. 체크되지 않은 상태에서만 노출.
- **편집 폼 단순화**: `ChecklistAddForm`은 기존 `UnifiedAddForm`(타임라인+체크리스트 결합)과 달리 단일 컨텍스트의 분류·제목만 받음. 우선순위는 "보통" 자동 부여.

### 가정 사항 및 미구현 항목

**가정 사항**:
- BottomNav 최소 변경(타임라인 → 체크리스트). 영상/정보 통합 + 더보기 메뉴는 Step 2.
- 공유 버튼은 Step 4 영역.
- 태그 기반 동적 추천은 Step 3 영역.

**미구현 (다음 Step에서)**:
- 동적 관련 콘텐츠 추천 (Step 3)
- 정보 탭 통합 + BottomNav 5탭 최종 형태(체중/더보기) (Step 2)
- 공유 버튼 (Step 4)
- 크로스링크 자동 생성 스크립트 (Step 5)
- 영상 매핑: 신규 3종의 `linked_video_ids`는 빈 배열 — Step 5 자동 매핑 또는 수동 큐레이션에서 채울 예정

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

**없음.** 런타임 에러·보안 취약점·접근성 차단·핵심 버그 없음.

### Warning (수정 권장 → 리팩토링 단계에서 모두 해소)

1. **TimelineCard `checked/total` 분모 초과 가능** — 사용자가 커스텀 항목을 체크하면 분수 표시(155/150) 깨짐 → 리팩토링에서 `customItems.length`를 분모에 합산.
2. **`effectiveCheckedIds` 매 렌더 새 배열** — 향후 자식 메모이제이션 추가 시 캐시 미스 함정 → `EMPTY_CHECKED_IDS` 상수 + `useMemo`로 안정 참조 확보.
3. **ChecklistPage 80줄 인라인 카드 렌더링** — 가독성·테스트성·이벤트 핸들러 재생성 → `ChecklistItemRow.tsx`로 추출.
4. **ChecklistAddForm 빈 subcategories fallback이 무의미한 "hospital"** — JSON 오류 시 데이터 오염 → dev 경고 + 폼 미렌더링 가드.
5. **`STORE_BY_SLUG` 4곳 동기화 의존** — 신규 체크리스트 추가 시 누락 위험 → `createChecklistStore` 모듈로 일원화.
6. **`PRIORITY_STYLES` 타입 약함** — 키 오타 컴파일 검증 부재 → `Record<ChecklistItem['priority'], ...>`로 좁힘.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 6건 (모두 리팩토링 단계에서 해소) |
| Suggestion | 6건 (다음 단계 참고용) |

---

## 리팩토링 내용

### 작업 목록

1. **createChecklistStore.ts — 슬러그→스토어 매핑 일원화**: `CHECKLIST_STORE_BY_SLUG`/`ChecklistStoreSlug` export. 신규 체크리스트 추가 시 한 파일에서 일괄 관리.
2. **ChecklistItemRow.tsx 추출**: 80줄 인라인 카드 렌더링을 독립 컴포넌트로 분리. `PRIORITY_STYLES` 타입 좁힘 동시 적용.
3. **ChecklistPage 메모이제이션 + 콜백 안정화**: `EMPTY_CHECKED_IDS` 상수 + `useMemo`(effectiveCheckedIds), `useCallback`(handleToggle).
4. **TimelineCard 진행률 분모 정확화**: prop을 `total` → `baseTotal`로 변경, store의 `customItems.length`를 분모에 합산. "체크 항목 N개" 칩은 정적 설명이라 `baseTotal` 그대로 유지.
5. **ChecklistAddForm 빈 subcategories 도메인 가드**: dev `console.error` + 폼 미렌더링. `?? "hospital"` fallback 제거. Hooks Rules 준수 위해 `useState` 후 가드 배치.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 체크리스트 컴포넌트 파일 수 | 5개 | 6개 (ChecklistItemRow 추가) |
| ChecklistPage.tsx 줄 수 | 264 줄 | 159 줄 (40% ↓) |
| 슬러그→스토어 매핑 위치 | 2곳 | 1곳 (createChecklistStore) |
| TimelineCard 진행률 분모 | 베이스만 | 베이스 + 사용자 커스텀 |
| `effectiveCheckedIds` 참조 | 매 렌더 새 배열 | `useMemo` + 상수 sentinel |
| `PRIORITY_STYLES` 타입 | `Record<string, ...>` | `Record<ChecklistItem['priority'], ...>` |
| `ChecklistAddForm` 빈 subcategories | "hospital"로 fallback | dev 경고 + 폼 미렌더링 |

빌드 결과: 성공 (1회).

---

## E2E 테스트 결과

테스트 파일: [`e2e/phase-4-step-1-checklist-hub.spec.ts`](../../e2e/phase-4-step-1-checklist-hub.spec.ts)

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 7개 passed |
| Error / Validation | ✅ 3개 passed |
| SEO 메타 | ✅ 1개 passed |
| 반응형 (Mobile 375px) | ✅ 2개 passed |
| **전체** | **13 passed / 0 failed** (16.3s, 리팩토링 후 재실행 결과) |

📊 상세 리포트: `playwright-report/index.html`

부수적 갱신:
- `e2e/checklist.spec.ts` — 리다이렉트 테스트 → 허브 검증으로 변경
- `e2e/navigation.spec.ts` — 탭 명칭 갱신(타임라인 → 체크리스트)

---

## 관련 문서

- [구현 상세](../implementation/phase-4-step-1-checklist-hub-impl.md)
- [코드 리뷰](../review/phase-4-step-1-checklist-hub-review.md)
- [리팩토링 상세](../refactor/phase-4-step-1-checklist-hub-refactor.md)
- [원본 PRD (Phase 4 plan)](../phase-4/plan.md)
