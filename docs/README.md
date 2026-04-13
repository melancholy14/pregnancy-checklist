# Docs Index

## 폴더 구조

```text
docs/
├── plan/
│   └── plan.md              전체 개발 계획 + PRD + Phase별 완료 실적
├── phase-2.5/
│   └── plan.md              Phase 2.5 UX 개선 + 리텐션 강화 기획
├── specs/
│   ├── babyfair_crawler_spec.md   베이비페어 크롤러 스펙
│   ├── babyfair_data_pipeline.md  베이비페어 데이터 파이프라인
│   └── technical-debt.md          기술적 보완 사항
├── infra/
│   ├── architecture.md      시스템 아키텍처
│   └── gcp-deployment.md    GCP 배포 가이드
└── README.md                전체 개발 기록 (Phase 1~2.5)
```

## 핵심 문서

| 파일 | 내용 |
| ---- | ---- |
| `plan/plan.md` | **마스터 문서**. 전체 Phase 0~5 개발 계획, PRD(페르소나/KPI/SEO), Phase별 완료 실적 |
| `phase-2.5/plan.md` | Phase 2.5 상세 기획 (온보딩, 대시보드 개편, 크로스링크 등) |

## 참고 문서

| 폴더 | 내용 |
| ---- | ---- |
| `specs/` | 베이비페어 크롤러 스펙, 데이터 파이프라인, 기술 부채 목록 |
| `infra/` | GCP 아키텍처 다이어그램, Cloud Run 배포 가이드 |

---
---

# Phase 1: 기본 기능 구현

## 구현 기록

### 완료 조건

| # | 조건 | 상태 |
|---|------|------|
| 1 | 체크리스트 CRUD + localStorage 저장 | ✅ |
| 2 | 타임라인 주차별 카드 | ✅ |
| 3 | 베이비페어 일정 | ✅ |
| 4 | 체중 기록 차트 | ✅ |
| 5 | 영상 큐레이션 | ✅ |
| 6 | 반응형 UI | ✅ |

## 코드 리뷰

### Critical (수정 완료)

1. **page.tsx** — 토스트가 매 페이지 로드마다 반복 표시. `prevDueDateRef` 기반 → `localStorage` 플래그 방식으로 수정.

### Warning (5건)

1. **ChecklistItem.tsx** — Tailwind 동적 hover 클래스 미동작 → 정적 className 맵으로 리팩토링
2. **ChecklistContainer.tsx** — 필터/진행률 매 렌더 재계산 → `useMemo` 캐시로 리팩토링
3. **TimelineContainer.tsx** — 다수 current ref 중복 → 첫 번째만 ref 부여로 리팩토링
4. **BabyfairContainer.tsx** — `today` 매 렌더 재계산 → `useState` 초기화로 리팩토링
5. **ChecklistAddForm.tsx** — `as` 타입 단언 → 런타임 검증 + fallback으로 리팩토링

## 리팩토링

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| ChecklistContainer 필터 | 일반 함수 (매 렌더) | useMemo 캐시 |
| ChecklistItem hover | 동적 Tailwind (미동작) | 정적 className (동작) |
| Timeline 스크롤 대상 | 마지막 current | 첫 번째 current |
| Babyfair today 계산 | 매 렌더 | 마운트 1회 |
| ChecklistAddForm 타입 | 무검증 단언 | 검증 + fallback |

---
---

# Phase 1.5: 타임라인 + 체크리스트 통합

## 구현 기록

### 완료 조건

| # | 조건 | 상태 |
|---|------|------|
| 1 | `/timeline`에서 주차별 타임라인 + 체크리스트 아코디언 | ✅ |
| 2 | 현재 주차 카드 자동 펼침 + 스크롤 | ✅ |
| 3 | 체크리스트 체크/해제 동작 | ✅ |
| 4 | 전체/주차별 진행률 표시 | ✅ |
| 5 | 카테고리 필터 | ✅ |
| 6 | 통합 추가 폼 (일정/할 일) | ✅ |
| 7 | 체크리스트 추가 시 주차 필수 | ✅ |
| 8 | 커스텀 항목 수정 | ✅ |
| 9 | 커스텀 항목 삭제 | ✅ |
| 10 | `/checklist` → `/timeline` 리다이렉트 | ✅ |
| 11 | 네비게이션 4탭 | ✅ |
| 12 | localStorage 데이터 호환 | ✅ |

### 주요 결정 사항

- **Store 분리 유지**: useChecklistStore와 useTimelineStore를 병합하지 않음. 뷰 레이어에서만 합산.
- **Collapsible 사용**: shadcn/ui Collapsible 컴포넌트 (접근성 내장)
- **recommendedWeek 기반 매핑**: linked_checklist_ids 우선 + recommendedWeek 보충
- **인라인 편집**: 커스텀 항목 수정 시 카드 내 인라인 편집

## 코드 리뷰

### Warning (3건)

1. **WeekChecklistSection.tsx** — `<div onClick>` 접근성 부재 → 리팩토링에서 role/tabIndex/onKeyDown 추가
2. **TimelineContainer.tsx** — `getFilteredChecklist` 매 렌더 재생성 → useCallback 안정화
3. **TimelineContainer.tsx** — `getStatus`/`hasFilteredChecklist` 매 렌더 재생성 → useCallback 안정화

## 리팩토링

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| CATEGORY_OPTIONS 정의 위치 | 3개 파일 각각 | `src/lib/constants.ts` 1곳 |
| 접근성 키보드 지원 | div onClick만 | role + tabIndex + onKeyDown |
| 렌더 함수 재생성 | 3개 함수 매 렌더 | useCallback 안정화 |

---
---

# Phase 2: 콘텐츠 강화 + AdSense 승인

## 구현 기록

### 완료 조건

| # | 조건 | 상태 |
|---|------|------|
| 1 | `/articles` 목록 페이지 글 5개+ | ✅ |
| 2 | `/articles/[slug]` 상세 페이지 | ✅ |
| 3 | 태그 필터 | ✅ |
| 4 | 각 정보글 1,000자+ | ✅ |
| 5 | `/guides/*` → `/articles/*` 리다이렉트 | ✅ |
| 6 | 네비게이션 "정보" 탭 | ✅ |
| 7 | 홈 대시보드 정보글 진입점 | ✅ |
| 8 | `videos.json` subcategory | ✅ |
| 9 | `channels.json` + 채널 썸네일 | ✅ |
| 10 | 영상 세부 카테고리 필터 | ✅ |
| 11 | 영상 채널 뷰 전환 | ✅ |
| 12 | sitemap 정보글 URL | ✅ |
| 13 | 빌드 성공 (21개 정적 페이지) | ✅ |

### 주요 결정 사항

- **gray-matter + remark**: contentlayer 유지보수 중단, next-mdx-remote 과도한 의존성 → 가장 경량 선택
- **네비 체중→정보 교체**: 정보글이 AdSense/SEO에 더 중요
- **가이드 리다이렉트 유지**: 기존 TSX 가이드 → redirect() 처리 (북마크 호환)

## 코드 리뷰

### Warning (3건)

1. **articles.ts** — frontmatter 타입 단언 미검증 → `parseArticleMeta` 검증 함수로 리팩토링
2. **ArticleDetail.tsx** — dangerouslySetInnerHTML 사용 → 리스크 낮아 건너뜀 (테이블 HTML 깨짐 방지)
3. **articles.ts** — `getAllTags()` 파일 중복 읽기 → 파라미터 방식으로 리팩토링

## 리팩토링

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 타입 단언 (`as`) | 2곳 | 0곳 (`parseArticleMeta`) |
| MD 파일 읽기 | 2회 | 1회 |
| frontmatter 필드 누락 대응 | TypeError | 기본값 할당 |

---
---

# Phase 2.5: UX 개선 + 리텐션 강화

## Step 1: 온보딩 플로우

> 작성일: 2026-04-06

### 개요

첫 방문 유저에게 3단계 경량 온보딩 플로우 제공. 앱 소개(웰컴) → 출산 예정일 입력 → 데이터 저장 방식 안내. 완료 시 `localStorage` 플래그 설정 후 타임라인 이동.

### 완료 조건

| 조건 | 상태 |
|------|------|
| `onboarding-completed` localStorage 키 없을 때만 표시 | ✅ |
| Step 1→2→3 순서 진행 | ✅ |
| "나중에 입력할게요" 건너뛰기 | ✅ |
| Step 3 CTA → localStorage 플래그 + `/timeline` 이동 | ✅ |

### 생성/수정 파일

- `src/components/onboarding/WelcomeStep.tsx` (신규)
- `src/components/onboarding/DueDateStep.tsx` (신규)
- `src/components/onboarding/ReadyStep.tsx` (신규)
- `src/components/onboarding/OnboardingFlow.tsx` (신규)
- `src/components/home/HomeContent.tsx` (수정)

### 코드 리뷰

- Warning 1건: Step indicator 접근성 → 리팩토링에서 `role="group"` + `aria-label` 추가

### E2E 테스트: 8/8 passed

---

## Step 2: 타임라인 유도 강화 + 데이터 보존 가이드

> 작성일: 2026-04-06

### 개요

홈→타임라인 전환율 향상과 데이터 보존 불안 해소. 홈 CTA 카드 강화, 첫 체크 시 안내 배너, 재방문 유저 웰컴 메시지.

### 완료 조건

| 조건 | 상태 |
|------|------|
| 홈 CTA 카드에 주차 + 미완료 수 + 체크 미리보기 | ✅ |
| 타임라인 첫 체크 시 인라인 배너 1회 표시 | ✅ |
| 재방문 유저 웰컴 메시지 | ✅ |

### 생성/수정 파일

- `src/components/home/HomeContent.tsx` (수정)
- `src/components/timeline/TimelineContainer.tsx` (수정)

### 코드 리뷰: Critical 0건, Warning 0건

### E2E 테스트: 9/9 passed

---

## Step 3: 홈 대시보드 개편

> 작성일: 2026-04-06

### 개요

홈 하단 Feature Grid(아이콘+라벨)를 미니 대시보드 카드로 교체. 베이비페어/체중/영상/정보 4개 카드에 실시간 스냅샷 표시.

### 완료 조건

| 조건 | 상태 |
|------|------|
| 4개 미니 대시보드 카드 | ✅ |
| 실시간 데이터 연동 | ✅ |

### 생성/수정 파일

- `src/components/home/DashboardCard.tsx` (신규)
- `src/components/home/HomeContent.tsx` (수정)
- `src/app/page.tsx` (수정)

### 코드 리뷰

- Critical 2건 수정: dead code `fullWidth` prop 제거, JSX `&amp;` 리터럴 수정

### E2E 테스트: 15/15 passed

---

## Step 4: Sticky 헤더

> 작성일: 2026-04-06

### 개요

44px Sticky 헤더 추가. 홈 페이지 숨김, 스크롤 다운 시 숨김/업 시 표시.

### 설계 결정

| 항목 | 결정 |
|------|------|
| 높이 | 44px (`h-11`) |
| 배경 | `bg-white/90 backdrop-blur-xl` |
| 홈 페이지 | 숨김 |
| 스크롤 | 다운 숨김, 업 표시 |

### 생성/수정 파일

- `src/components/layout/StickyHeader.tsx` (신규)
- `src/app/layout.tsx` (수정)

### 코드 리뷰

- Warning 1건: 홈에서 불필요한 scroll 리스너 → effect 내 early return 추가

### E2E 테스트: 5/5 passed

---

## Step 5: 타임라인 ↔ 블로그 크로스 링크

### 개요

타임라인 주차별 카드와 블로그 아티클 간 양방향 크로스 링크.

### 매핑 테이블

| 타임라인 주차 | 연결 블로그 slug |
|-------------|-----------------|
| Week 4, 8, 10 | `early-pregnancy-tests` |
| Week 12 | `postpartum-care` |
| Week 18 | `baby-items-cost` |
| Week 28 | `infant-vaccination-schedule` |
| Week 30 | `newborn-bath-tips` |
| Week 32, 36 | `hospital-bag` |
| Week 37 | `postpartum-diet` |
| Week 6, 24 | `pregnancy-weight-management` |

### 생성/수정 파일

- `src/components/timeline/RelatedArticlesLink.tsx` (신규)
- `src/components/articles/TimelineCTA.tsx` (신규)
- 타입/데이터/기존 컴포넌트 수정 다수

### 코드 리뷰

- Warning 1건: `getArticlesBySlugs` 미사용 export → 리팩토링에서 제거

### E2E 테스트: 10/10 passed

---

## Step 6: 베이비페어 개선

### 개요

2분류→3분류 탭 (진행 중/예정/지난 행사), D-day 배지, 연도 라벨, CITY_COLORS 18개 도시 확장.

### 3분류 카테고리 탭

| 카테고리 | 조건 |
|----------|------|
| 진행 중 | `start_date <= today && end_date >= today` |
| 예정 | `start_date > today` |
| 지난 행사 | `end_date < today` |

### 코드 리뷰

- Warning 1건: `BabyfairTab` 타입 함수 내부 선언 → 모듈 레벨로 이동

### E2E 테스트: 20/20 passed (기존 13 + 신규 7)

---

## Step 7: 체중관리 접근성 개선

### 개요

홈 체중 카드 미니 대시보드 개선 (0건/1건/2건+ 3단계 분기), 체중 페이지 블로그 크로스 링크 추가.

### 생성/수정 파일

- `src/components/home/HomeContent.tsx` (수정)
- `src/components/weight/WeightContainer.tsx` (수정)

### 코드 리뷰: Critical 0건, Warning 0건

### E2E 테스트: 14/14 passed (신규 6 + 기존 8)

---

## Step 8: 버그 수정 — 존재하지 않는 주차에 할일 추가 시 무반응

### 문제

체크리스트 항목을 기본 항목이 없는 주차에 추가 시 데이터는 저장되지만 UI 미표시.

### 해결

AlertDialog로 피드백 제공 + "주차 추가하고 할일 넣기" 자동 생성 옵션.

### 변경 파일

- `src/components/timeline/UnifiedAddForm.tsx` (수정)
- `src/components/timeline/TimelineContainer.tsx` (수정)

### 코드 리뷰 & 리팩토링

- Warning 2건 수정: 체크리스트 생성 로직 중복 → `submitChecklist()` 통합, `allTimelineWeeks` → useMemo

### E2E 테스트: 6/6 passed

---

## Step 9: 달성감/게이미피케이션

### 개요

1. **주차 완료 축하**: 모든 체크리스트 완료 시 ✅ 아이콘 + 완료 메시지
2. **마일스톤 배지**: 진행률 25%/50%/75%/100% 달성 시 축하 메시지

### 마일스톤 메시지

| 진행률 | 메시지 |
|--------|--------|
| 25%+ | 순조로운 출발! |
| 50%+ | 절반 완료! |
| 75%+ | 거의 다 왔어요! |
| 100% | 완벽한 준비 완료! |

### 변경 파일

- `src/components/timeline/TimelineAccordionCard.tsx` (수정)
- `src/components/timeline/TimelineContainer.tsx` (수정)

### 코드 리뷰: Critical 0건, Warning 0건

### E2E 테스트: 5/5 passed

---

## Step 10: 히어로 카피 & 톤 리뉴얼

### 변경 사항

| 위치 | AS-IS | TO-BE |
|------|-------|-------|
| 히어로 서브 | "소중한 아기를 위한 완벽한 준비" | "답답해서 직접 만들었습니다" |
| 히어로 캡션 | (없음) | "초산 임신 중인 개발자의 출산 준비 기록" |
| 하단 모티베이션 | "출산은 인생에서 가장 특별한 순간입니다" | "같이 준비하면 덜 막막하니까요" |

### Phase 분기 구조

`BRAND_PHASE` 값 변경만으로 히어로/About/온보딩 카피 일괄 전환.

### 변경 파일

- `src/lib/constants.ts` (수정)
- `src/components/home/HomeContent.tsx` (수정)

### E2E 테스트: 5/5 passed

---

## Step 11: SEO 메타 태그 브랜딩

### 변경 사항

| 페이지 | TO-BE description |
|--------|-------------------|
| 홈 | 답답해서 직접 만들었습니다. 임신 주차별 체크리스트, 입원가방, 베이비페어, 체중관리까지. |
| `/about` | 초산 임신 중인 개발자가 답답해서 만든 출산 준비 체크리스트입니다. |
| `/contact` | 혼자 만들다 보니 놓치는 것도 많아요. 의견을 들려주세요. |
| `/timeline` | 주차별로 뭘 해야 하는지 한눈에. 직접 써보며 만든 체크리스트. |
| `/baby-fair` | 전국 베이비페어 일정을 한곳에 모았습니다. 날짜 장소 링크까지. |

### E2E 테스트: 7/7 passed

---

## Step 12: 온보딩 톤 변경

### 변경 사항

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| h1 | "출산 준비, 빠짐없이 챙기세요" | "안녕하세요!" |
| 서브 텍스트 | (없음) | "저도 초산이라 뭐부터 해야 할지 몰라서 이 체크리스트를 만들었어요." |
| ReadyStep h1 | "준비 완료!" | "준비 완료! 같이 챙겨봐요" |

### 변경 파일

- `src/lib/constants.ts` (수정)
- `src/components/onboarding/WelcomeStep.tsx` (수정)
- `src/components/onboarding/ReadyStep.tsx` (수정)

### E2E 테스트: 5/5 + 기존 8/8 passed

---

## 타임라인 정보 구체화

> 작성일: 2026-04-09

### 개요

빈 주차 15개 채움 (21개→36개), description 간결화, type 배지 추가 (준비/쇼핑/행정/교육/건강).

### 완료 조건

| 조건 | 상태 |
|------|------|
| 빈 주차 15개 추가 | ✅ |
| 기존 description 정비 | ✅ |
| type 배지 표시 | ✅ |
| TIMELINE_TYPE_CONFIG 상수 | ✅ |

### 생성/수정 파일

- `src/data/timeline_items.json` (수정)
- `src/components/timeline/TimelineAccordionCard.tsx` (수정)
- `src/lib/constants.ts` (수정)

### 코드 리뷰

- Warning 1건: TYPE_COLORS와 TIMELINE_TYPE_CONFIG 색상 불일치 → 로컬 TYPE_COLORS 제거, 단일 소스 통일

### E2E 테스트: 11/11 passed

---

## 베이비페어 정보 구체화

> 작성일: 2026-04-10

### 개요

베이비페어 카드에 scale 배지, 운영시간, 입장/주차 안내, highlights, 만든이 팁 등 확장 정보 추가. 모든 필드 optional.

### 완료 조건

| 조건 | 상태 |
|------|------|
| BabyfairEvent 7개 optional 필드 | ✅ |
| 주요 행사 8개 데이터 보강 | ✅ |
| scale 배지 UI | ✅ |
| 조건부 렌더링 | ✅ |
| 하위 호환 | ✅ |

### 생성/수정 파일

- `src/types/babyfair.ts` (수정)
- `src/data/babyfair_events.json` (수정)
- `src/components/babyfair/BabyfairCard.tsx` (수정)

### 코드 리뷰: Critical 0건, Warning 0건

### E2E 테스트: 10/10 passed

---

## About 페이지 "만든 사람" 스토리텔링

> 작성일: 2026-04-09

### 개요

About 페이지를 "서비스 소개"에서 "만든 사람" 스토리텔링으로 전면 리뉴얼. 왜 만들었는지, 만든이 임신 주차, 앞으로의 계획 전달.

### 완료 조건

| 조건 | 상태 |
|------|------|
| 타이틀 "만든 사람" | ✅ |
| "왜 만들었나" 스토리 섹션 | ✅ |
| 만든이 주차 자동 계산 | ✅ |
| 의료 면책 섹션 유지 | ✅ |
| "의견 보내기" → /contact 링크 | ✅ |

### 생성/수정 파일

- `src/app/about/CreatorWeekBadge.tsx` (신규)
- `src/lib/constants.ts` (수정)
- `src/app/about/page.tsx` (수정)

### 코드 리뷰: Critical 0건, Warning 0건

### E2E 테스트: 12/12 passed

---

## Contact 페이지 톤 변경

> 작성일: 2026-04-09

### 개요

기업 고객센터 톤 → 1인 개발자 당사자 톤 전환. "연락처"→"의견 보내기", "소중한 의견"→"혼자 만들다 보니 놓치는 것도 많아요".

### 생성/수정 파일

- `src/app/contact/page.tsx` (수정)

### 코드 리뷰: Critical 0건, Warning 0건

### E2E 테스트: 7/7 passed

---

## 아티클 authorNote 필드 추가

> 작성일: 2026-04-11

### 개요

선택적으로 "만든이의 한마디"(authorNote) 추가. authorNote가 있는 아티클에서 제목과 본문 사이에 따뜻한 톤의 카드 표시.

### authorNote 적용 아티클

| slug | authorNote |
|------|-----------|
| `hospital-bag` | "실제로 입원가방 쌌을 때, 블로그마다 리스트가 달라서 짜증났어요..." |
| `baby-items-cost` | "스프레드시트로 정리했던 걸 그대로 옮겼어요..." |
| `early-pregnancy-tests` | "임신 초기에 어떤 검사를 언제 받아야 하는지 너무 헷갈렸어요..." |
| `postpartum-care` | "산후조리원 고를 때 뭘 기준으로 비교해야 하는지 몰라서..." |
| `pregnancy-weight-management` | "체중계 올라갈 때마다 불안해서..." |

### 생성/수정 파일

- `src/types/article.ts` (수정)
- `src/lib/articles.ts` (수정)
- `src/components/articles/ArticleDetail.tsx` (수정)
- 5개 아티클 MD (수정)
- `e2e/article-author-note.spec.ts` (신규)

### 코드 리뷰: Critical 0건, Warning 0건

### E2E 테스트: 11/11 passed
