# Feature Plan: phase-4-step-1-checklist-hub

> 출처: [docs/phase-4/plan.md](../phase-4/plan.md) Step 1
> 작성일: 2026-04-29

## 기능 목표
"pregnancy-checklist.com" 도메인의 정체성을 강화하기 위해 인터랙티브 체크리스트를 4종으로 확장한다.
`/checklist` 허브 페이지를 신설하고 그 아래에 출산가방·남편준비·임신준비 3종 독립 체크리스트를 추가하며,
기존 `useChecklistStore`를 팩토리 함수로 추출하여 데이터만 교체해 재사용한다.

## 완료 조건 (AC)

| # | 조건 | 비고 |
|---|------|------|
| 1 | `/checklist` 허브 페이지가 4종 카드(타임라인 + 신규 3종)를 표시 | 명시 |
| 2 | `/checklist/hospital-bag` 출산가방 체크리스트 인터랙션 정상 | 명시 |
| 3 | `/checklist/partner-prep` 남편/파트너 준비 체크리스트 인터랙션 정상 | 명시 |
| 4 | `/checklist/pregnancy-prep` 임신 준비 체크리스트 인터랙션 정상 | 명시 |
| 5 | 각 체크리스트 체크 상태가 `*-storage` 키로 localStorage에 독립 저장 | 명시 |
| 6 | 커스텀 아이템 추가/삭제 가능 (기존 동작 유지) | 명시 |
| 7 | 진행률(%) 실시간 표시 + 서브카테고리별 진행률 | 명시 |
| 8 | 각 페이지 상단 200~300자 설명 텍스트 + 하단 관련 콘텐츠 CTA | 명시 |
| 9 | 기존 `/checklist` → `/timeline` 리다이렉트 제거 | 명시 |
| 10 | BottomNav에 "체크리스트" 탭 추가 (타임라인 탭 자리 교체) | 추론 |
| 11 | 모바일 반응형 + 페이지별 SEO 메타 | 명시 |
| 12 | sitemap.ts에 신규 4개 URL 추가 | 추론 |

## 기술 스택
- 라우터: App Router, Next.js 16.2 정적 export (`output: "export"`)
- 상태관리: Zustand 5 + persist
- CSS: Tailwind 4 + Radix UI + 파스텔 토큰
- TypeScript: Yes
- 패스 alias: `@/`

## 레퍼런스 패턴
- `src/store/useChecklistStore.ts` — 팩토리화 대상
- `src/components/timeline/WeekChecklistSection.tsx` — 체크 상호작용 + 진행률 패턴
- `src/components/timeline/UnifiedAddForm.tsx` — 커스텀 아이템 추가 폼
- `src/components/articles/ArticlesContainer.tsx` — 페이지 컨테이너 + PageDescription
- `src/app/timeline/page.tsx` — Server Component + Metadata 패턴

## 구현 순서

1. Types — `ChecklistCategory` 유니온 확장 + `ChecklistMeta` 타입 신설
2. Store 팩토리 — `createChecklistStore(storageKey)` 추출, 기존 store는 팩토리 사용으로 내부만 리팩토링
3. Data — JSON 3종 (hospital_bag/partner_prep/pregnancy_prep)
4. 공통 UI 컴포넌트 — ChecklistProgress / ChecklistRelatedContent / ChecklistPage / ChecklistHub / ChecklistAddForm
5. 라우팅 — 허브 + 신규 3개 페이지
6. BottomNav 최소 변경 — 타임라인 탭 → 체크리스트 탭 교체 (Step 2가 나머지 처리)
7. SEO — sitemap.ts + 페이지별 metadata

## 생성/수정 파일 목록

| 구분 | 경로 | 역할 |
|------|------|------|
| 수정 | `src/types/checklist.ts` | 카테고리 유니온 확장 + `ChecklistMeta` |
| 신규 | `src/store/createChecklistStore.ts` | 팩토리 + 신규 3종 store |
| 수정 | `src/store/useChecklistStore.ts` | 팩토리 사용으로 내부 리팩토링 |
| 신규 | `src/data/hospital_bag_checklist.json` | meta + items |
| 신규 | `src/data/partner_prep_checklist.json` | meta + items |
| 신규 | `src/data/pregnancy_prep_checklist.json` | meta + items |
| 신규 | `src/components/checklist/ChecklistHub.tsx` | 허브 카드 리스트 |
| 신규 | `src/components/checklist/ChecklistPage.tsx` | 범용 체크리스트 페이지 |
| 신규 | `src/components/checklist/ChecklistProgress.tsx` | 진행률 바 |
| 신규 | `src/components/checklist/ChecklistRelatedContent.tsx` | 관련 콘텐츠 CTA |
| 신규 | `src/components/checklist/ChecklistAddForm.tsx` | 커스텀 아이템 추가 폼 |
| 수정 | `src/app/checklist/page.tsx` | redirect 제거 → 허브 |
| 신규 | `src/app/checklist/hospital-bag/page.tsx` | 출산가방 라우트 |
| 신규 | `src/app/checklist/partner-prep/page.tsx` | 남편/파트너 준비 라우트 |
| 신규 | `src/app/checklist/pregnancy-prep/page.tsx` | 임신 준비 라우트 |
| 수정 | `src/components/layout/BottomNav.tsx` | 타임라인 → 체크리스트 탭 교체 |
| 수정 | `src/app/sitemap.ts` | 신규 4개 URL 추가 |

## 가정 사항

- BottomNav는 Step 1에서는 최소 변경(타임라인 → 체크리스트). 영상/정보/체중/더보기 재구성은 Step 2.
- 신규 체크리스트 아이템 `recommendedWeek = 0` (주차 미할당). 신규 store는 별도 키이므로 기존 unassigned 처리와 충돌 없음.
- `ChecklistItem.category` 유니온을 11개 서브카테고리로 확장. 기존 `CATEGORY_OPTIONS` 5종은 타임라인 컨텍스트 전용으로 유지.
- 공유 버튼은 Step 4 영역. Step 1에서는 추가하지 않음.
- 출산가방 아이템은 `src/content/draft/hospital-bag-draft.md`의 최종 체크리스트 씨드 활용.
- `/checklist` redirect 제거 후 정적 export로 빌드.

## Out of Scope

- 태그 기반 동적 관련 콘텐츠 추천 (Step 3)
- 정보 탭 통합 + 나머지 BottomNav 재구성 (Step 2)
- 공유 기능 (Step 4)
- 크로스링크 자동 생성 스크립트 (Step 5)
- 체중 차트 BMI (Phase 5)
- 회원가입·서버 동기화

## 예상 리스크

- **기존 코드와 충돌**: `useChecklistStore` 팩토리 리팩토링 시 호출부 4곳(HomeContent/TimelineContainer/WeekChecklistSection/UnifiedAddForm)의 시그니처 보존 + localStorage 키 `checklist-storage` 보존 필수.
- **공유 타입 사이드이펙트**: `ChecklistCategory` 유니온 확장이 기존 `CATEGORY_COLORS`/`CATEGORY_OPTIONS` 매핑에 누락을 만들지 않는지 검증.
- **AC 모호성**: "관련 콘텐츠 CTA" 형태(카드 vs 링크)와 영상 ID 매핑 방식은 PRD에 미명시 — JSON 메타에 선언된 항목만 카드/링크로 표시하는 정적 구현으로 추정.
