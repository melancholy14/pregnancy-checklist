# phase-4-step-1-checklist-hub

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-04-29

<!-- STEP:impl -->
## 구현

> 출처 PRD: [docs/plan/phase-4.md](../../plan/phase-4.md) Step 1
> 구현일: 2026-04-29

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `/checklist` 허브 4종 카드 표시 | ✅ | 타임라인 + 출산가방 + 남편준비 + 임신준비 카드 + 미니 진행률 |
| `/checklist/hospital-bag` 인터랙티브 동작 | ✅ | 체크/언체크, 커스텀 추가/삭제 |
| `/checklist/partner-prep` 인터랙티브 동작 | ✅ | 체크/언체크, 커스텀 추가/삭제 |
| `/checklist/pregnancy-prep` 인터랙티브 동작 | ✅ | 체크/언체크, 커스텀 추가/삭제 |
| 각 체크리스트 localStorage 독립 저장 | ✅ | `hospital-bag-storage`, `partner-prep-storage`, `pregnancy-prep-storage` 키 |
| 커스텀 아이템 추가/삭제 | ✅ | `ChecklistAddForm` + `DeleteConfirmDialog` |
| 진행률(%) 실시간 표시 + 서브카테고리별 진행률 | ✅ | `ChecklistProgress` 컴포넌트 |
| 상단 200~300자 설명 + 하단 관련 콘텐츠 CTA | ✅ | `meta.description` + `ChecklistRelatedContent` |
| `/checklist` redirect 제거 | ✅ | 허브 페이지로 교체 |
| BottomNav 체크리스트 탭 추가 | ✅ | 타임라인 → 체크리스트로 교체, prefix 매칭 |
| 페이지별 SEO 메타 (title/description/OG/canonical) | ✅ | 4개 라우트 모두 |
| sitemap.ts 신규 4개 URL 추가 | ✅ | `/checklist`, `/checklist/hospital-bag`, `/checklist/partner-prep`, `/checklist/pregnancy-prep` |
| 모바일 반응형 | ✅ | 기존 `max-w-2xl` 컨테이너 + Tailwind 반응형 패턴 |

### 생성/수정 파일 목록

#### 신규 생성
- `src/store/createChecklistStore.ts` — Zustand persist 팩토리. `useHospitalBagStore`/`usePartnerPrepStore`/`usePregnancyPrepStore` export
- `src/data/hospital_bag_checklist.json` — 32개 아이템 (엄마/아기/서류 3 서브카테고리)
- `src/data/partner_prep_checklist.json` — 25개 아이템 (출산 전/당일/산후 3 서브카테고리)
- `src/data/pregnancy_prep_checklist.json` — 24개 아이템 (건강/영양/검사/재무 4 서브카테고리)
- `src/components/checklist/ChecklistHub.tsx` — 허브 페이지(타임라인 + 3종 카드 + 미니 진행률)
- `src/components/checklist/ChecklistPage.tsx` — 범용 체크리스트 페이지(서브카테고리별 그룹 + 체크 + 진행률 + 관련 콘텐츠 + FAB)
- `src/components/checklist/ChecklistProgress.tsx` — 전체/서브카테고리 진행률 바
- `src/components/checklist/ChecklistRelatedContent.tsx` — meta 기반 관련 글/타임라인/영상 CTA
- `src/components/checklist/ChecklistAddForm.tsx` — 단일 컨텍스트 커스텀 아이템 추가 폼
- `src/app/checklist/hospital-bag/page.tsx` — 출산가방 라우트 + 메타
- `src/app/checklist/partner-prep/page.tsx` — 남편/파트너 준비 라우트 + 메타
- `src/app/checklist/pregnancy-prep/page.tsx` — 임신 준비 라우트 + 메타

#### 수정
- `src/types/checklist.ts` — `ChecklistCategory` 유니온에 11개 서브카테고리 추가, `ChecklistMeta`/`ChecklistSubcategory`/`ChecklistData` 타입 신설, `ChecklistItem.note?` 추가
- `src/store/useChecklistStore.ts` — 팩토리 호출로 내부 리팩토링(`createChecklistStore('checklist-storage')`). 기존 export 시그니처와 storage key 그대로 보존하여 호출부·기존 사용자 데이터 영향 없음
- `src/app/checklist/page.tsx` — `redirect("/timeline")` 제거 → 허브 렌더링 + Metadata
- `src/components/layout/BottomNav.tsx` — 타임라인 탭 → 체크리스트 탭(`ListChecks` 아이콘)으로 교체, 활성 매칭에 prefix 옵션 도입(`/checklist/*` 하위에서도 활성 표시)
- `src/app/sitemap.ts` — 신규 4개 URL 추가

### 주요 결정 사항

- **Server→Client 컴포넌트 prop 직렬화 제약**: 처음에는 ChecklistPage에 `useStore` 훅 자체를 prop으로 넘기는 설계였으나, Next.js 정적 export에서는 Server Component가 Client Component에 함수 prop을 전달할 수 없어 빌드 에러가 발생. 대신 `storeSlug: 'hospital-bag' | 'partner-prep' | 'pregnancy-prep'` 식별자를 prop으로 받고 ChecklistPage 내부의 `STORE_BY_SLUG` 매핑으로 훅을 선택하도록 변경. ChecklistHub는 자체적으로 client component이므로 훅 직접 사용 가능.
- **BottomNav prefix 매칭**: 체크리스트 허브 + 하위 3개 페이지 모두에서 "체크리스트" 탭이 활성 상태로 보이도록 `match: "prefix"` 옵션을 추가. 기존 `==` 매칭 로직은 보존하면서 매칭 모드만 옵션화.
- **새 체크리스트 아이템 `recommendedWeek = 0`**: 신규 3종은 주차 매핑 대상이 아니므로 0 사용. 신규 store는 별도 키이므로 기존 `getUnassignedChecklist`(타임라인용 customItems만 처리)와 충돌하지 않음.
- **타입 확장 vs 분리**: `ChecklistItem.category`를 11개 서브카테고리까지 포함하는 단일 유니온으로 확장. 기존 `CATEGORY_OPTIONS`/`CATEGORY_FILTER_OPTIONS`(타임라인 컨텍스트용 5종)는 그대로 유지. 신규 페이지는 `ChecklistMeta.subcategories`로 컨텍스트별 카테고리를 자체 선언.
- **출산가방 시드 데이터 출처**: 운영자가 작성한 `src/content/draft/hospital-bag-draft.md`의 산모/아기/보호자/서류 체크리스트를 직접 참조. 분만 방식별 차이(자연분만 회음부 방석 vs 제왕절개 압박스타킹)를 그대로 반영.
- **`note` 필드 도입**: 일부 아이템(병원 제공 여부 확인, 카시트 법적 의무 등)은 짧은 부연 설명이 필요해 `ChecklistItem.note?: string`을 추가. 체크되지 않은 상태에서만 표시(`Info` 아이콘과 함께).
- **카드 미니 진행률**: 허브 카드에 `Progress` + `checked/total` 표시. 사용자가 어디까지 진행했는지 한눈에 파악하도록 함. 미하이드레이트 시 0/total로 표시(SSR 가시성).
- **편집 폼 단순화**: `ChecklistAddForm`은 기존 `UnifiedAddForm`(타임라인+체크리스트 결합)과 달리 단일 컨텍스트의 분류·제목만 받음. 주차·우선순위는 사용자 부담을 줄이기 위해 생략(우선순위는 "보통" 자동 부여, 주차는 0).

### 가정 사항

- BottomNav는 Step 1에서 최소 변경(타임라인 → 체크리스트). 영상/정보 통합 + 더보기 메뉴는 Step 2에서 처리.
- 공유 버튼은 Step 4 영역이므로 Step 1에서는 추가하지 않음.
- 태그 기반 동적 관련 콘텐츠 추천은 Step 3 영역. Step 1에서는 JSON `meta.linked_*`에 명시된 것만 정적으로 표시.

### 미구현 항목

- 동적 관련 콘텐츠 추천(태그 기반): Step 3에서 구현
- 정보 탭(블로그+영상) 통합 및 BottomNav 5탭 최종 형태(체중/더보기 추가): Step 2에서 구현
- 공유 버튼: Step 4
- 크로스링크 자동 생성 스크립트: Step 5
- 영상 매핑: 신규 체크리스트 3종의 `linked_video_ids`는 빈 배열로 두고, Step 5의 자동 매핑 또는 수동 큐레이션 단계에서 채울 예정

---

<!-- STEP:review -->
## 코드 리뷰

> 리뷰 대상 PRD: [docs/plan/phase-4.md](../../plan/phase-4.md) Step 1
> 구현 문서: [이 문서 ## 구현 섹션](#구현)
> 리뷰일: 2026-04-29

### 리뷰 대상 파일 (17개)

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

### Critical 이슈

**없음.** 런타임 에러·보안 취약점·접근성 차단·핵심 버그 없음.

---

### Warning (수정 권장)

#### 1. ChecklistHub TimelineCard — `checked/total` 표시값이 100을 초과할 수 있음
- **위치**: [src/components/checklist/ChecklistHub.tsx:99-145](../../../src/components/checklist/ChecklistHub.tsx#L99-L145)
- **문제**: `TimelineCard`는 `useChecklistStore` (타임라인 store)에서 `checkedIds.length`만 카운트하고 `total`에는 `checklist_items.json`의 길이만 전달한다. 사용자가 타임라인에서 커스텀 항목을 체크하면 `checkedIds`에 포함되지만 `total`에는 더해지지 않아 표시값이 `155/150`처럼 분모를 초과할 수 있다. 진행률 바는 `Math.min`으로 클램프되지만 텍스트 카운터는 그대로 노출된다.
- **권장 수정**: TimelineCard에 `customTimelineChecklist` 또는 store 전체 `customItems`도 전달해서 `total = base + customCount`로 계산하거나, 텍스트 카운터를 "체크한 항목 N개" 형태로 분모 없는 표현으로 바꾼다.

#### 2. ChecklistPage — `effectiveCheckedIds` 배열을 매 렌더 새로 생성
- **위치**: [src/components/checklist/ChecklistPage.tsx:63](../../../src/components/checklist/ChecklistPage.tsx#L63)
- **문제**: `const effectiveCheckedIds = hydrated ? checkedIds : []` 가 매 렌더 새 배열 참조를 만든다(미하이드레이트 시점). `ChecklistProgress`에 `checkedIds`로 전달되어 자식에서 `useMemo` 의존성으로 사용한다면 캐시 미스가 일어난다. 현 시점 `ChecklistProgress`에는 메모이제이션이 없어 영향이 없지만, 향후 자식 메모이제이션 추가 시 함정이 된다.
- **권장 수정**: `useMemo(() => hydrated ? checkedIds : EMPTY_ARRAY, [hydrated, checkedIds])` + 모듈 상수 `EMPTY_ARRAY: string[] = []` 로 안정 참조 유지.

#### 3. ChecklistPage — 렌더 함수 내부에 80줄 인라인 카드 렌더링
- **위치**: [src/components/checklist/ChecklistPage.tsx:107-230](../../../src/components/checklist/ChecklistPage.tsx#L107-L230)
- **문제**: 서브카테고리 루프 내부에 체크박스/우선순위 뱃지/노트/편집 모드/삭제 버튼이 한 덩어리로 80여 줄 인라인 작성. 가독성·테스트성·성능(이벤트 핸들러를 매 렌더 재생성) 저하. Off-by-one이나 UX 회귀가 들어와도 발견이 어렵다.
- **권장 수정**: `ChecklistItemRow.tsx`로 추출, props에 `item`, `isChecked`, `onToggle`, `onEdit`, `onRemove`, `priorityStyle`. `WeekChecklistSection`이 이미 비슷한 구조를 갖고 있어 그 패턴을 따르면 자연스럽다. (Step 1의 refactor 단계 후보)

#### 4. ChecklistAddForm — `subcategories` 빈 배열 시 fallback 카테고리가 의미 없는 값
- **위치**: [src/components/checklist/ChecklistAddForm.tsx:18](../../../src/components/checklist/ChecklistAddForm.tsx#L18)
- **문제**: `subcategories[0]?.key ?? "hospital"` — JSON 데이터가 빈 `subcategories`로 잘못 작성되면 카테고리가 "hospital"(타임라인 컨텍스트의 카테고리)로 주입되어 데이터 오염 발생. 현재 3개 JSON은 모두 `subcategories`를 채우고 있어 실제 트리거 가능성은 낮음.
- **권장 수정**: `subcategories.length === 0`이면 폼 자체를 disabled 처리하거나 dev 환경에서 `console.error` 로깅. 또는 Zod·런타임 검증으로 빈 배열 방지.

#### 5. ChecklistPage — `STORE_BY_SLUG` 매핑이 타입은 안전하지만 신규 체크리스트 추가 시 동기화 누락 위험
- **위치**: [src/components/checklist/ChecklistPage.tsx:24-30](../../../src/components/checklist/ChecklistPage.tsx#L24-L30)
- **문제**: 신규 체크리스트(예: Phase 4 후속의 "베이비 첫 만남 준비") 추가 시 `createChecklistStore` 인스턴스, JSON, 라우트, 그리고 이 매핑 4곳을 모두 수정해야 한다. 한 곳을 빠뜨리면 `STORE_BY_SLUG[slug]`가 `undefined`가 되어 런타임 크래시.
- **권장 수정**: `createChecklistStore` 모듈에서 `STORE_BY_SLUG`를 export하거나, slug → store registry를 한 곳에서 일원화. 또는 ChecklistPage가 store hook을 prop으로 받되, 인접 client wrapper 컴포넌트가 매핑을 담당하도록 분리.

#### 6. ChecklistPage — 우선순위 매핑 객체가 모듈 스코프에 단순 객체로 선언
- **위치**: [src/components/checklist/ChecklistPage.tsx:32-36](../../../src/components/checklist/ChecklistPage.tsx#L32-L36)
- **문제**: `Record<string, ...>`이라 `priority` 키 오타에 대한 컴파일 타임 검증이 약하다. `PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.medium` 라인이 fallback으로 가려준다.
- **권장 수정**: `Record<ChecklistItem['priority'], ...>`로 좁혀서 타입 안전성 확보. fallback `?? PRIORITY_STYLES.medium`은 그대로 두되 `priority`가 실제로 정확히 매칭됨이 타입으로 보장된다.

---

### Suggestion (개선 아이디어)

#### 1. ChecklistRelatedContent에 영상 링크 hash가 `/videos#${id}` 패턴
- 현재 `/videos` 페이지가 hash 앵커 스크롤을 지원하는지 확인 필요. 미지원이면 사용자가 영상을 못 찾을 수 있음. Step 2의 `/info` 통합 시 함께 처리하면 자연스럽다.

#### 2. JSON 시드 데이터의 "병원 제공 여부 전화 확인" 같은 note 운영
- 운영자(고미솔)가 24주차 임산부로 직접 출산가방을 준비하고 있어, 향후 경험에 따라 note 내용이 자주 갱신될 수 있다. note만 따로 빼서 i18n-style 메시지 카탈로그로 두면 큐레이션이 편해진다. 현재 규모에서는 불필요.

#### 3. ChecklistHub의 카드 컴포넌트 두 종류(`TimelineCard`, `ChecklistCard`) 통합
- 두 카드가 거의 같은 구조(아이콘 + 제목 + 설명 + 칩 + 진행률). `TimelineCard`만 아이콘 영역이 컬러 박스인데, 이는 prop으로 처리 가능. 통합 시 코드 중복 제거 + 향후 카드 변형 추가 용이.

#### 4. ChecklistProgress의 "완벽하게 준비되었어요!" 라인은 100% 정확히 도달했을 때만 보여주기
- 현재 `>= 100` 조건이라 customItems를 추가해도 100% 도달 가능하지만, "완벽" 표현을 base 항목 100% 시점에 한정하는 것이 의도와 더 일치할 수 있음. UX 정책 결정 필요.

#### 5. Hub 카드 진행률 — SSR 시 0% 표시 → 하이드레이션 후 깜빡임
- `hydrated` 플래그로 미하이드레이트 시 `checked = 0`을 그리고, 하이드레이트 후 실제 값으로 점프. 사용자가 진행률을 "초기화됐다"고 오해할 수 있다. Skeleton/`opacity-0`으로 가렸다 보여주는 패턴도 고려 가능. 다만 정적 export + 빠른 하이드레이션 환경에서는 체감 영향 작음.

#### 6. ChecklistAddForm — 우선순위·노트 입력 미지원
- 현재 추가는 분류·제목만 받음. 사용자 자유도를 위해 Step 2 또는 후속 개선에서 우선순위 선택과 노트 입력 추가 고려.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 6건 |
| Suggestion | 6건 |
| 빌드 | 미실행 (Critical 없음) |

E2E 13개 시나리오는 이미 통과 완료(`run-e2e` 단계). Warning 항목은 `/refactor` 단계에서 일괄 정리 가능.

---

<!-- STEP:refactor -->
## 리팩토링

> 리뷰 문서: [이 문서 ## 코드 리뷰 섹션](#코드-리뷰)
> 리팩토링일: 2026-04-29

### 리팩토링한 파일 목록

수정:
- `src/store/createChecklistStore.ts` — `CHECKLIST_STORE_BY_SLUG` 매핑 + `ChecklistStoreSlug` 타입 export
- `src/components/checklist/ChecklistPage.tsx` — 264 줄 → 159 줄 (40% 축소). 카드 행 추출, `EMPTY_CHECKED_IDS` 상수 + `useMemo`, `useCallback(handleToggle)`, store 매핑은 store 모듈에서 import
- `src/components/checklist/ChecklistHub.tsx` — `TimelineCard.baseTotal` 명명 + `customItems.length` 합산
- `src/components/checklist/ChecklistAddForm.tsx` — 빈 `subcategories` 가드 + dev 경고

신규:
- `src/components/checklist/ChecklistItemRow.tsx` (142 줄) — 카드 한 줄 표시·체크·편집·삭제 로직 캡슐화 + `PRIORITY_STYLES` 타입 좁힘

---

### 작업별 내용

#### 1. createChecklistStore.ts — 슬러그→스토어 매핑 일원화 (Warning 5)
- **출처**: 리뷰 Warning 5
- **무엇을**: `STORE_BY_SLUG`/`ChecklistStoreSlug`를 스토어 모듈로 이동하고 export. 신규 체크리스트를 추가할 때 store 인스턴스, 매핑, 타입을 한 파일에서 일괄 관리하게 함
- **왜**: 이전에는 같은 매핑이 ChecklistPage.tsx에 별도로 존재해서 신규 체크리스트 추가 시 두 곳을 동시에 수정해야 했고, 빠뜨리면 `STORE_BY_SLUG[slug]`가 `undefined`가 되어 런타임 크래시 위험이 있었음

#### 2. ChecklistItemRow.tsx — 카드 행 추출 (Warning 3, 6)
- **출처**: 리뷰 Warning 3, 6
- **무엇을**: ChecklistPage 안의 80여 줄 인라인 카드 렌더링을 독립 컴포넌트로 추출. 동시에 `PRIORITY_STYLES` 타입을 `Record<ChecklistItem['priority'], ...>`로 좁힘. props는 표준 콜백 시그니처(`onToggle`, `onStartEdit`, `onSaveEdit`, `onCancelEdit`, `onChangeEditTitle`, `onRemove`)로 정리
- **왜**: 부모 컴포넌트 가독성·테스트성·재사용성 향상. 체크/편집/삭제 흐름이 한 파일에 모여 있어 향후 수정이 명확해짐. 우선순위 키는 enum 좁힘으로 컴파일 타임 검증 보장

#### 3. ChecklistPage.tsx — 효과적인 메모이제이션 + 콜백 안정화 (Warning 2)
- **출처**: 리뷰 Warning 2
- **무엇을**: 모듈 상수 `EMPTY_CHECKED_IDS: string[] = []` + `useMemo`로 `effectiveCheckedIds`의 참조를 안정화. 토글 핸들러를 `useCallback(handleToggle, [checkedIds, toggle, meta.slug])`로 안정화
- **왜**: 향후 `ChecklistProgress`나 `ChecklistItemRow`에 메모이제이션을 추가할 때 부모 prop 참조 변동으로 발생하는 캐시 미스를 사전에 방지

#### 4. ChecklistHub.tsx — TimelineCard 진행률 분모 정확화 (Warning 1)
- **출처**: 리뷰 Warning 1
- **무엇을**: `TimelineCard`의 prop을 `total` → `baseTotal`로 명명 변경. 사용자의 커스텀 항목 수를 store에서 읽어 분모에 포함. "체크 항목 N개" 칩은 정적 설명이므로 `baseTotal` 그대로 표시
- **왜**: 사용자가 커스텀 항목을 체크했을 때 `checked > total`이 되어 분수 표시(`155/150`)가 깨지던 표시 버그 수정. 분모가 정확해지면서 진행률 % 의미가 회복됨

#### 5. ChecklistAddForm.tsx — 빈 subcategories 도메인 가드 (Warning 4)
- **출처**: 리뷰 Warning 4
- **무엇을**: `subcategories.length === 0`이면 폼을 렌더링하지 않고 dev 환경에서 `console.error`. 이전의 `?? "hospital"` fallback(타임라인 컨텍스트 카테고리로의 잘못된 매핑) 제거
- **왜**: JSON 데이터 작성 오류로 빈 배열이 들어왔을 때 의미 없는 fallback 카테고리로 데이터가 오염되는 것을 차단. dev 경고로 운영 단계에서 발견 가능. Hooks Rules를 지키기 위해 `useState` 호출 후에 가드를 배치(`subcategories[0]?.key ?? ""` 초기값)

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 체크리스트 컴포넌트 파일 수 | 5개 | 6개 (ChecklistItemRow 추가) |
| ChecklistPage.tsx 줄 수 | 264 줄 | 159 줄 (40% ↓) |
| 슬러그→스토어 매핑 위치 | 2곳 (createChecklistStore + ChecklistPage) | 1곳 (createChecklistStore) |
| TimelineCard 진행률 분모 | 베이스만 | 베이스 + 사용자 커스텀 |
| `effectiveCheckedIds` 참조 | 매 렌더 새 배열 | `useMemo` + 상수 sentinel |
| `PRIORITY_STYLES` 타입 | `Record<string, ...>` | `Record<ChecklistItem['priority'], ...>` |
| `ChecklistAddForm` 빈 subcategories | "hospital"로 fallback | dev 경고 + 폼 미렌더링 |

---

### 빌드 결과

성공 (1회). TypeScript 타입 검사 + 26개 정적 페이지 생성 모두 통과.
