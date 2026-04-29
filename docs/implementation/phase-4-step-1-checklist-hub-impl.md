# phase-4-step-1-checklist-hub Implementation

> 출처 PRD: [docs/phase-4/plan.md](../phase-4/plan.md) Step 1
> Plan: [docs/plan/phase-4-step-1-checklist-hub-plan.md](../plan/phase-4-step-1-checklist-hub-plan.md)
> 구현일: 2026-04-29

## 완료 조건 충족 여부

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

## 생성/수정 파일 목록

### 신규 생성
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

### 수정
- `src/types/checklist.ts` — `ChecklistCategory` 유니온에 11개 서브카테고리 추가, `ChecklistMeta`/`ChecklistSubcategory`/`ChecklistData` 타입 신설, `ChecklistItem.note?` 추가
- `src/store/useChecklistStore.ts` — 팩토리 호출로 내부 리팩토링(`createChecklistStore('checklist-storage')`). 기존 export 시그니처와 storage key 그대로 보존하여 호출부·기존 사용자 데이터 영향 없음
- `src/app/checklist/page.tsx` — `redirect("/timeline")` 제거 → 허브 렌더링 + Metadata
- `src/components/layout/BottomNav.tsx` — 타임라인 탭 → 체크리스트 탭(`ListChecks` 아이콘)으로 교체, 활성 매칭에 prefix 옵션 도입(`/checklist/*` 하위에서도 활성 표시)
- `src/app/sitemap.ts` — 신규 4개 URL 추가

## 주요 결정 사항

- **Server→Client 컴포넌트 prop 직렬화 제약**: 처음에는 ChecklistPage에 `useStore` 훅 자체를 prop으로 넘기는 설계였으나, Next.js 정적 export에서는 Server Component가 Client Component에 함수 prop을 전달할 수 없어 빌드 에러가 발생. 대신 `storeSlug: 'hospital-bag' | 'partner-prep' | 'pregnancy-prep'` 식별자를 prop으로 받고 ChecklistPage 내부의 `STORE_BY_SLUG` 매핑으로 훅을 선택하도록 변경. ChecklistHub는 자체적으로 client component이므로 훅 직접 사용 가능.
- **BottomNav prefix 매칭**: 체크리스트 허브 + 하위 3개 페이지 모두에서 "체크리스트" 탭이 활성 상태로 보이도록 `match: "prefix"` 옵션을 추가. 기존 `==` 매칭 로직은 보존하면서 매칭 모드만 옵션화.
- **새 체크리스트 아이템 `recommendedWeek = 0`**: 신규 3종은 주차 매핑 대상이 아니므로 0 사용. 신규 store는 별도 키이므로 기존 `getUnassignedChecklist`(타임라인용 customItems만 처리)와 충돌하지 않음.
- **타입 확장 vs 분리**: `ChecklistItem.category`를 11개 서브카테고리까지 포함하는 단일 유니온으로 확장. 기존 `CATEGORY_OPTIONS`/`CATEGORY_FILTER_OPTIONS`(타임라인 컨텍스트용 5종)는 그대로 유지. 신규 페이지는 `ChecklistMeta.subcategories`로 컨텍스트별 카테고리를 자체 선언.
- **출산가방 시드 데이터 출처**: 운영자가 작성한 `src/content/draft/hospital-bag-draft.md`의 산모/아기/보호자/서류 체크리스트를 직접 참조. 분만 방식별 차이(자연분만 회음부 방석 vs 제왕절개 압박스타킹)를 그대로 반영.
- **`note` 필드 도입**: 일부 아이템(병원 제공 여부 확인, 카시트 법적 의무 등)은 짧은 부연 설명이 필요해 `ChecklistItem.note?: string`을 추가. 체크되지 않은 상태에서만 표시(`Info` 아이콘과 함께).
- **카드 미니 진행률**: 허브 카드에 `Progress` + `checked/total` 표시. 사용자가 어디까지 진행했는지 한눈에 파악하도록 함. 미하이드레이트 시 0/total로 표시(SSR 가시성).
- **편집 폼 단순화**: `ChecklistAddForm`은 기존 `UnifiedAddForm`(타임라인+체크리스트 결합)과 달리 단일 컨텍스트의 분류·제목만 받음. 주차·우선순위는 사용자 부담을 줄이기 위해 생략(우선순위는 "보통" 자동 부여, 주차는 0).

## 가정 사항

- BottomNav는 Step 1에서 최소 변경(타임라인 → 체크리스트). 영상/정보 통합 + 더보기 메뉴는 Step 2에서 처리.
- 공유 버튼은 Step 4 영역이므로 Step 1에서는 추가하지 않음.
- 태그 기반 동적 관련 콘텐츠 추천은 Step 3 영역. Step 1에서는 JSON `meta.linked_*`에 명시된 것만 정적으로 표시.

## 미구현 항목

- 동적 관련 콘텐츠 추천(태그 기반): Step 3에서 구현
- 정보 탭(블로그+영상) 통합 및 BottomNav 5탭 최종 형태(체중/더보기 추가): Step 2에서 구현
- 공유 버튼: Step 4
- 크로스링크 자동 생성 스크립트: Step 5
- 영상 매핑: 신규 체크리스트 3종의 `linked_video_ids`는 빈 배열로 두고, Step 5의 자동 매핑 또는 수동 큐레이션 단계에서 채울 예정
