# timeline-to-weight 기획서

> 작성일: 2026-05-31  size: L
> 관련 리뷰: [review.md](./review.md)
> 상위 plan: [docs/plan/phase-4.6.md §2](../../plan/phase-4.6.md) (T1=A 확정 2026-05-26)

## review.md 결정사항 참조

- **결정 1 (B)**: zustand `persist.migrate` 를 `src/store/migrations/timeline-to-weight.ts` 별도 pure 함수로 추출. unit test 4~6 case + E2E `timeline-migrate.spec.ts` 1개.
- **결정 2 (B)**: GA4 namespace 마이그레이션 4주 grace 신/구 병행 발사. `weight_*` 즉시 발사 + `timeline_*` deprecated 유지, 4주 후(~2026-07-06) cleanup PR.
- **결정 3 (C 변형)**: timeline_items.json → `weight_context_items.json` rename, /weight 상단 클릭 가능한 텍스트 1줄. `linked_checklist_ids` 있으면 /checklist?slug=… 진입, 없으면 /weight 안 expand. /checklist 허브 별도 블록 추가 없음.

## 1. 배경·목적

- **운영자**: 4축 정보 구조(체크/페어/블로그/체중) 정돈 직전 단계. /timeline 라우트 폐기로 BottomNav 4탭 + AdSense 신청 정책 검사(2026-06-15 목표) 통과 마진 확보.
- **사용자**: 시계열 도구(체중 + 임신 주차 컨텍스트)가 한 화면. /weight 진입 시 "내가 지금 몇 주차, 이번 주 행정 항목 + 권장 체중 + 입력 폼" 흐름이 한 번에.
- **측정**: timeline_* deprecated grace 4주 후 weight_* primary 로 cohort retention 신호 단일화.

## 2. 사용자 시나리오

- **시나리오 1 — 기존 사용자 진입 (migration)**: localStorage 에 `useTimelineStore` v0 데이터 잔존 사용자가 흡수 머지 후 /timeline 직접 접근 → meta-refresh redirect `/weight` → `useWeightStore` migrate 발동 (v0 → v1) → 기존 timeline 사용자 상태(읽음·메모 등) 무손실 이전 → /weight 상단에 24주차 컨텍스트 1줄 표시
- **시나리오 2 — 신규 사용자 진입**: localStorage 비어 있는 사용자가 /weight 진입 → migrate 함수가 빈 state 인식 → 기본 v1 schema 생성 → /weight 상단 "주차 미설정 — 출산예정일 입력" CTA (dueDate 미입력 시) 또는 24주차 컨텍스트 1줄 (입력 시)
- **시나리오 3 — /weight 상단 컨텍스트 1줄 클릭 (linked 있음)**: 사용자가 "24주차 · 임신성 당뇨 검사 및 유모차 구매 →" 클릭 → linked_checklist_slugs 첫 항목 (예: `hospital-bag`) 로 `/checklist?slug=hospital-bag` 진입
- **시나리오 4 — /weight 상단 컨텍스트 1줄 클릭 (linked 없음)**: 사용자가 클릭 → /weight 안에서 description expand (accordion 1단계). 추가 진입 동선 없음
- **시나리오 5 — GA4 funnel 발사 (4주 grace 기간)**: /weight 진입 시 `weight_week_view` 발사 + `timeline_week_view` dual-fire. 2026-07-06 이후 cleanup PR 머지로 timeline_* 발사 중단
- **시나리오 6 — 외부 링크 진입 (`/timeline?week=24`)**: 외부 검색·과거 인덱스에서 진입 → meta-refresh redirect `/weight?week=24` → URL 쿼리 보존 → /weight 상단 컨텍스트가 해당 주차로 표시 (현재 주차 != 24 여도)

## 3. 기능 요구사항

### 3.1 must (반드시 충족)

- **라우트 폐기 + redirect**: `src/app/timeline/page.tsx` 를 meta-refresh redirect 페이지로 재작성 (phase-4.6 §1 의 `/info`·`/videos` 패턴 따라, 정적 export 제약). `robots: noindex` 페이지 + `<meta http-equiv="refresh" content="0;url=/weight">`. URL 쿼리 보존
- **zustand store 흡수**: `useWeightStore` schema 에 `weekContext: { items: WeightContextItem[], userStateById: Record<string, TimelineUserState> }` slice 추가. `useTimelineStore` 폐기 (파일 자체 삭제). `persist.version: 0 → 1` + `migrate: (s, v) => migrateTimelineToWeight(s, v)` 위임
- **Migration 함수 추출**: `src/store/migrations/timeline-to-weight.ts` 신규. 시그니처 `migrateTimelineToWeight(persistedState: unknown, version: number, today?: Date): WeightStoreV1State`. localStorage 기존 timeline key (`useTimelineStore` 이름 기반) 도 읽어와 흡수 — 두 store 의 데이터 통합 보장
- **데이터 rename**: `src/data/timeline_items.json` → `src/data/weight_context_items.json`. 항목 ID·linked_checklist_ids·linked_checklist_slugs·linked_article_slugs·title·description·type·priority·week·seo_slug **모두 보존** (phase-4.6 §2.3 항목 ID 재사용 금지 룰)
- **타입 통합**: `src/types/timeline.ts` 폐기. `WeightContextItem` 타입 신규 `src/types/weight.ts` (또는 신규 `src/types/weight-context.ts`) 에 박음. `linked_video_ids?` 필드는 phase-4.6 §1 에서 이미 제거됨 — 잔재 없는지 확인
- **/weight 상단 컨텍스트 1줄 UI**: 현재 주차 (dueDate 기반 계산) → 해당 주의 `WeightContextItem` 1개 → 클릭 가능한 줄. linked_checklist_ids 있으면 `/checklist?slug={linked_checklist_slugs[0]}`, 없으면 accordion expand. 시각 디자인은 design.md 에서 결정
- **GA4 dual-fire**: `weight_week_view` 발사 신규 추가 + `timeline_week_view` 발사 코드 유지 (4주 grace). cleanup PR 은 별도 (2026-07-06 ± 머지일 + 4주)
- **내부 링크 갱신**: phase-4.6 §2.2 표는 5개로 명시되어 있으나 2026-05-31 실측 결과 **17개 파일**에 `/timeline` 참조. qa.md §1.1 표 인용:
  - `src/app/sitemap.ts`, `src/app/timeline/page.tsx` (redirect 재작성)
  - `src/lib/search.ts`, `src/lib/checklist-week-map.ts`, `src/lib/__tests__/checklist-week-map.test.ts`
  - `src/components/home/HomeContent.tsx`, `src/components/search/SearchModal.tsx`
  - `src/components/articles/TimelineCTA.tsx`, `src/components/onboarding/OnboardingFlow.tsx`
  - `src/components/providers/OnboardingBannerProvider.tsx`
  - `src/components/checklist/ChecklistHub.tsx`, `src/components/checklist/ChecklistRelatedContent.tsx`
  - `src/components/timeline/TimelineContainer.tsx`·`TimelineAccordionCard.tsx`·`UnifiedAddForm.tsx` (폐기·이동)
  - `src/store/useTimelineStore.ts` (폐기)
  - `src/content/articles/weekly-prenatal-checklist.md` (본문 링크 갱신)
- **scripts 갱신**: `scripts/generate-crosslinks.ts` 의 `TIMELINE_PATH` → 새 path. `scripts/lighthouse-check.sh` PAGES 배열의 `/timeline.html` → `/weight.html` (이미 있으면 중복 제거). `scripts/weekly-report/ga4-queries.ts` 의 timeline 이벤트 dimension 갱신
- **migration unit test 4~6 case** + **E2E `timeline-migrate.spec.ts` 1개**: review §5 항목 1 결정

### 3.2 should (가능하면 충족)

- WeightContextItem `type` 필드 (admin·prep·wellbeing·shopping·education) 별 시각 분류 — 디자인 design.md 에서 결정. 미결정 시 단일 톤으로 출시
- /weight 상단 컨텍스트 1줄의 hover/focus 시 description preview tooltip (mobile 우선이라 long-press fallback)
- redirect 페이지 (`src/app/timeline/page.tsx`) 에 사용자 안내 텍스트 1줄 ("/timeline 이 /weight 로 통합되었습니다") 동시 표시 — 기존 북마크 사용자 인지

### 3.3 won't (이번 범위 밖)

- timeline_items.json 의 type 별 시각 분류 정교화 (admin 빨강·prep 노랑 등) — design.md 에서 단일 톤 확정 시 Phase 5 P11 콘텐츠 매트릭스 1차 sketch 에서 다룸
- /weight 화면의 전체 디자인 재구성 (체중 그래프·입력 폼 영역 재배치) — phase-4.6 §3.2 H1 결정 따라 H1 작업에 위임
- /checklist 허브에 "이번 주" 블록 추가 — review §5 항목 3 결정 C 변형으로 명시 거부
- timeline 사용자 메모·읽음 표시 등 사용자 상태 확장 (현재 useTimelineStore 가 가진 만큼만 보존)
- weight_context_items.json type 별 GA4 이벤트 분리 발사 — `weight_week_view` 단일로 발사, type 은 param 으로
- /timeline?week=N 쿼리의 정밀 매핑 — `?week=` 만 지원, 다른 쿼리(`?day=`·`?item=`)는 무시
- 4주 grace 종료 후 cleanup PR — 본 phase 의 spec.md 에서 작업 명세까지만 박고, 실제 머지는 별도 PR

## 4. 예외·엣지 케이스

- **localStorage 손실 (시크릿 모드·캐시 삭제)**: migrate 함수가 빈 state 로 인식 → 기본 v1 schema 생성. 데이터 보존 의무 없음 (사용자 동의 없는 손실은 브라우저 정책)
- **localStorage 손상 (JSON parse 실패)**: migrate 함수 fallback → 사용자 알림 X, 기본 v1 schema 자동 적용. qa.md §4.1.d e2e case 로 검증. fallback 정책 변경 시(예: 사용자 알림 추가) qa §5 skip 해제 트리거
- **dueDate 미입력 사용자**: 주차 계산 불가 → /weight 상단 컨텍스트 자리에 "출산예정일 입력 →" CTA. `weight_week_view` 발사 X (week=undefined 면 noise)
- **dueDate 가 미래 (week < 4) 또는 출산 후 (week > 40)**: weight_context_items.json 의 week 4~40 범위 밖 → 컨텍스트 1줄 자리에 "임신 준비 중" (week < 4) 또는 "출산 후" (week > 40) 메시지. 클릭 동선 없음
- **`useTimelineStore` 잔존 localStorage 키 충돌**: 사용자가 매우 오래된 버전(예: phase 1) 데이터 보유 시 → migrate 함수가 version 분기로 모두 처리. 시그니처 `version: number` 받음
- **항목 ID 충돌 (weight_context_items vs 기존 useWeightStore 데이터)**: weight 기록 ID 는 timestamp 기반 (`2026-05-31T10:00`), weight_context_items ID 는 `week_NN_xxx` 기반 — 충돌 없음. 그러나 unit test 에 명시
- **`/timeline?week=` 쿼리 보존 실패**: meta-refresh 가 정적이라 client-side router 가 쿼리 받아 처리. /weight 페이지가 mount 시 searchParams 읽어 컨텍스트 표시 주차로 사용
- **GA4 dual-fire double-count**: 4주 grace 기간 funnel 보고서에서 weight_* 만 카운트. 운영자가 weekly report 해석 시 timeline_* 무시 룰 ga4.md §7 에 명시 (페이즈 6)
- **scripts/seed-vault-media-notes.py 잔재** (phase-4.6 §1 V1=A 에서 폐기) 와 동일 패턴 — timeline 데이터 vault MOC 노트는 운영자 수동 정리

## 5. 성공 기준

### 5.1 기능 동작

- `/timeline?week=24` 직접 접근 → /weight?week=24 redirect → 상단에 "24주차 · 임신성 당뇨 검사 및 유모차 구매 →" 표시 (linked: `hospital-bag`)
- 기존 사용자 localStorage 에 useTimelineStore v0 데이터 잔존 시, /weight 첫 진입 후 새로 갱신된 useWeightStore v1 데이터에 `weekContext` slice 포함 + 기존 timeline 사용자 상태 보존
- /weight 상단 컨텍스트 1줄 클릭 시 linked 있으면 `/checklist?slug={slug}` 이동, 없으면 description expand
- /timeline·/timeline?week=N 외부 검색 진입이 /weight 로 redirect 후 인덱스 큐 유지 (301 영구)

### 5.2 측정 지표 ([ga4.md](./ga4.md) 와 일치)

- `weight_week_view` 즉시 발사 시작 (흡수 머지 시점). 발사 0건 → 발사율 ≥ /weight 도달률 90% (이전 timeline_* 발사율 baseline + 5%)
- `timeline_week_view` 4주간 발사 유지, 2026-07-06 cleanup PR 머지 후 발사 0건
- funnel `axis_enter(weight)` → `weight_week_view` → `weight_log_submit` 연결률 측정 (마케터 §2.1 3층 지표 트리)
- DebugView 캡처 첨부 PR 의무 (marketer §5.1)

### 5.3 사용자 경험 ([design.md](./design.md) 와 일치)

- /weight 상단 컨텍스트 1줄이 디자인 토큰 (lavender secondary, peach data) 안에서 시각 분류 결정 — design.md
- 클릭 영역이 mobile 320px 에서 한 줄 안에 끊김 없음 (designer §4 체크리스트)
- accordion expand 시 description 이 `word-break: keep-all` (designer §3 N6) 한국어 본문 규칙 적용

### 5.4 검증 ([qa.md](./qa.md) 와 일치)

- Unit test `src/store/migrations/__tests__/timeline-to-weight.test.ts` 4~6 case (happy / 빈 state / 부분 누락 / 항목 ID 충돌 / undefined dueDate / today 주입) 통과
- E2E `e2e/timeline-migrate.spec.ts` (기존 사용자 localStorage 시드 → /weight 진입 → 사용자 상태 무손실 검증) 통과
- 기존 timeline 3종 spec 폐기·마이그레이션 + `cross-links-video-weight.spec.ts` 잔여 부분 흡수 (phase-4.6 §8.3 순서 2)
- 회귀 가드: `grep -rn "useTimelineStore\|/timeline" src/` 0건 (deprecated 표기·redirect 페이지 제외)
- AdSense 인프라 미회귀 (`grep -rn "ads.txt\|adsbygoogle" src/ scripts/` 변경 0건)

## 6. Addendum: 흡수 후 UX gap 보강 (2026-06-01)

> 추가 작성일: 2026-06-01
> 트리거: 흡수 머지(65a11aa, 2026-06-01) 후 운영자 실측 — `/checklist` → "주차별 타임라인" 카드 → `/weight` 도착 시 카드 약속과 도착 화면 불일치 ("쌩뚱맞다")
> 관련 review.md 결정: 결정 4·5 (Addendum 섹션)

### 6.1 발견된 gap

- **카드 약속 ≠ 도착 화면**: `ChecklistHub` 의 "주차별 타임라인 · 임신 4주~40주, 해야 할 검사·준비" 카드 → 도착 `/weight` H1 "체중 기록", 본문 BMI/체중 증가 범위. timeline 컨텍스트는 lavender row 1줄로 압축. 사용자의 "타임라인 = 여러 주차의 리스트" 멘탈 모델과 실제 도착 화면의 정보 위계가 불일치
- **콘텐츠 가치 squash**: 흡수 시 `weight_context_items.json` 36개 (주차당 1개, **6주차 데이터 누락**) 가 보존되었으나, 노출은 "현재 주차 1개" 에 한정. 다른 주차 콘텐츠는 UI 상 검색·우연 발견 외 동선 없음
- **결정 3 (C 변형) 의 운영적 한계**: review §5 결정 3 "1줄 컨텍스트" 가 흡수 의도 (4축 정돈 + 행동 도구 단일 정체성) 와 정합이지만, 진입점 카드 카피가 그 결정을 따라가지 못한 상태로 출시됨
- **linked 비율 실측 정정**: review §5 결정 3 본문이 "linked_checklist_ids 있는 17개" 로 박혀 있으나 2026-06-01 실측 `weight_context_items.json` 결과 **linked 4개 (4·32·35·36주차) / 비-linked 32개**. 즉 mini row 의 89% 는 expand 동선, 11% 만 `/checklist` 점프. axis_cross_link 발사 가능 row 비중이 작음 — 측정 가치는 정성 분석 위주로 다룸

### 6.2 신규 기능 요구사항

#### 6.2.1 must (반드시 충족)

- **A — `ChecklistHub` "주차별 타임라인" 카드 카피·메트릭 정정** ([src/components/checklist/ChecklistHub.tsx:122-156](../../../src/components/checklist/ChecklistHub.tsx#L122-L156)):
  - 카드 제목: `"주차별 타임라인"` → `"체중과 주차별 가이드"` (한국어 자연어 + 형제 카드 명사구 톤 정합 + 도착 `/weight` H1 "체중 기록" 첫 단어 일치)
  - 설명: `"임신 4주부터 40주까지 주차별로 해야 할 검사·준비를 알려드려요."` → `"이번 주 행정 일정과 체중 변화를 함께 확인하세요."` ("행정 일정" 으로 timeline 콘텐츠의 진짜 가치 묘사, "함께" 가 흡수의 본질)
  - 진행률 메트릭 (현재 `체크 항목 N개` + Progress bar): 체중 기록 건수 + 최근 기록 날짜로 교체. 체크리스트 진행률은 다른 카드 (출산 가방·남편 준비·임신 준비)와 의미 중복 — 카드 정체성을 weight 축에 맞춤
  - 메트릭 0건 분기: 체중 기록 0건 시 `"기록 시작하기"` (peach 톤) 로 CTA 톤 변경. Progress bar 자리는 비움
  - 아이콘 🗓️ 유지 (주차 의미 보존)
  - `href="/weight"` 그대로
- **B — `/weight` 내부 "전체 주차 보기" expand 도입**:
  - 위치: **`WeightChart` 아래, 체중 리스트 위** (사용자 진입 의도 1순위 = 체중 도구 보존. 체중 컨텍스트 1줄 → 차트 → 전체 주차 보기 → 체중 리스트 순)
  - 닫힌 상태 default — clutter 회피
  - 토글 텍스트: `"전체 40주 미리 보기 (1·2·3기)"` (콘텐츠 양 + 구조 명시, 발견율 ↑)
  - 펼친 상태: `weight_context_items.json` 36개를 **트라이메스터 3그룹** (1기 4~13주 9개 / 2기 14~27주 14개 / 3기 28~40주 13개. 6주차 데이터 누락) 으로 묶어 표시
  - 각 그룹 헤더 1줄 + 그 안에 mini row 형태 (현재 `WeekContextRow` 의 축소판 — `bg-pastel-lavender/20`, 텍스트 `text-xs`, **`rounded-xl` 일관** — radius 사다리 제거, 위계는 size·tone·left-border 로 충분)
  - 현재 주차 row 강조: **`border-l-4 border-l-pastel-pink/60`** (list-selection 패턴 — Notion·Linear·VSCode 사이드바 익숙한 패턴. AP1 의도 "5종 type 을 pink shade 로 줄세우기 금지" 침범 안 함. `border` 전체 둘러싸기 대신 좌측 thick 만)
  - row 클릭 동작:
    - linked 있음 (실측 4개: 4·32·35·36주차) → 기존 패턴 그대로 (`/checklist?slug=…`, `axis_cross_link` 발사, `source="browse_all"`)
    - linked 없음 (실측 32개) → 같은 row 아래 inline expand (description 노출, 기존 `WeekContextExpanded` 재사용) — 주된 동선
- **C — 신규 GA4 이벤트**:
  - `week_context_browse_all_toggle` (open/close 토글) — ga4.md §8 참조
  - 기존 `axis_cross_link`·`week_context_expand` 는 `source` 파라미터로 `"current_week"` (WeekContextRow 직진) vs `"browse_all"` (전체 보기 안 클릭) 구분
- **D — 카드 카피 정정 회귀 가드**:
  - `grep -rn "주차별 타임라인" src/` 0건 (단, weekly-prenatal-checklist.md 본문은 의미 보존 — frontmatter title 만 검사)
- **E — `ChecklistHub` 페이지 본문 `PageDescription` 갱신** ([src/components/checklist/ChecklistHub.tsx:179-182](../../../src/components/checklist/ChecklistHub.tsx#L179-L182)):
  - 현재: `"임신부터 출산까지, 빠뜨리지 않고 준비하세요. 주차별 타임라인부터 출산가방·남편준비·임신준비까지 목적에 맞는 체크리스트를 골라 사용할 수 있어요. 체크 상태는 기기에 자동 저장되어 다시 방문해도 그대로 남아 있어요."`
  - 정정: `"임신부터 출산까지, 빠뜨리지 않고 준비하세요. 체중·주차 가이드부터 출산가방·남편준비·임신준비까지 목적에 맞는 체크리스트를 골라 사용할 수 있어요. 체크 상태는 기기에 자동 저장되어 다시 방문해도 그대로 남아 있어요."`
  - 사유: 카드만 정정하면 본문 카피가 카드 제목과 어긋남. §6.2.1 D 의 fs-level 가드도 본문 문구 잡음

#### 6.2.2 should (가능하면 충족)

- 트라이메스터 그룹 헤더에 임신 분기별 색 힌트 (1기 peach·2기 lavender·3기 yellow 등) — 단일 톤 유지 결정 시 미적용
- 전체 주차 보기가 열린 상태에서 현재 주차 row 로 스크롤 (`scrollIntoView({ block: "center" })`)
- 그룹 헤더 1줄에 트라이메스터별 핵심 행정 요약 (예: "1기 · 초기 검진 · 입덧 관리") — 미결정 시 그룹 라벨만

#### 6.2.3 won't (이번 범위 밖)

- `/timeline` 라우트 부활 — 흡수 의도 (4축 + AdSense) 유지, 본 Addendum 의 명시적 거부 항목 (review §5 결정 4 근거 참조)
- `weight_context_items.json` 의 항목 추가·편집 — 본 Addendum 은 노출 UX 만 다룸
- `/checklist` 허브에 별도 "이번 주" 블록 추가 — review §5 결정 3 의 거부 유지 (카피만 정정)
- WeekContextRow 의 "현재 주차" 가 전체 보기 안 다른 주차 클릭 시 swap 되는 동작 — 현재 주차 정보 손실 위험 (사용자가 자기 주차를 놓침)
- 트라이메스터 그룹 안 `type` 별 시각 분류 — Phase 5 P11 콘텐츠 매트릭스 sketch 와 함께 처리

### 6.3 추가 사용자 시나리오

- **시나리오 7 — `/checklist` 진입 사용자 카드 신뢰**: 사용자가 `/checklist` 진입 → "체중과 주차별 가이드" 카드의 새 카피·메트릭 보고 클릭 → `/weight` 도착 → H1 "체중 기록" + WeekContextRow + 전체 주차 보기 토글이 카드 약속과 정합 (불일치 0건)
- **시나리오 8 — 전체 주차 미리 보기 (linked 있음 — 실측 4개 중 32주차)**: 24주차 사용자가 32주차 항목(입원 가방)을 미리 확인 → /weight 진입 → "전체 40주 미리 보기 (1·2·3기)" 토글 클릭 → 트라이메스터 그룹 펼침 (1기 9·2기 14·3기 13) → 3기 그룹 안 32주차 row 클릭 (linked 4개 중 하나) → `/checklist?slug=hospital-bag` 이동 (`axis_cross_link` 발사, `source="browse_all"`)
- **시나리오 9 — 전체 주차 보기 안 linked 없는 row 클릭 (실측 32개의 주된 동선)**: 사용자가 전체 보기 펼친 상태에서 12주차 row 클릭 (linked 없음) → 같은 화면 inline expand → `week_context_expand` 발사, `source="browse_all"`, `state="open"`

### 6.4 신규 예외·엣지 케이스

- **dueDate 미입력 상태에서 전체 주차 보기 토글**: WeekContextRow 는 CTA 모드여도 토글 자체는 노출. 펼치면 트라이메스터 그룹 표시되나 현재 주차 강조 없음 (모두 평등)
- **현재 주차 < 4 또는 > 40 사용자**: WeekContextRow 는 회색 메시지, 전체 보기 토글은 노출. 펼치면 트라이메스터 그룹은 정상 (현재 주차 강조만 없음)
- **트라이메스터 경계 (13/14주, 27/28주)**: 4-13주는 1기, 14-27주는 2기, 28-40주는 3기로 박음. 의학적 분기는 약간 다를 수 있으나 사용자 인지 단순성 우선
- **카드 메트릭 (체중 기록 건수) 가 0건일 때**: 카드에 `"기록 시작하기 →"` CTA 톤으로 변경. Progress bar 자리는 비움 (얇은 회색 라인 X)

### 6.5 신규 검증 항목 ([qa.md §7](./qa.md) 와 일치)

- E2E `e2e/weight-week-context.spec.ts` (신규 또는 기존 weight spec 확장):
  - 전체 주차 보기 토글 open/close
  - 트라이메스터 그룹 3개 렌더 + 각 그룹의 row 개수 (10·14·13)
  - 현재 주차 row 강조 (`border-pastel-pink/40`)
  - 전체 보기 안 linked row 클릭 → `/checklist?slug=…` 이동
  - 전체 보기 안 linked 없는 row 클릭 → inline expand
  - GA4 `week_context_browse_all_toggle` 발사 검증
- E2E `e2e/checklist-hub.spec.ts` 갱신 (기존):
  - 카드 제목 "주차별 가이드 & 체중" 노출
  - 진행률 자리에 "체중 기록 N건" 노출
- 회귀 가드: `grep -rn "주차별 타임라인" src/` 0건 (markdown 본문 제외)
