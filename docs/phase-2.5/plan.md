# Phase 2.5: UX 개선 + 리텐션 강화 — Development Plan

> Phase 2 기록: [phase-2/plan.md](../phase-2/plan.md)
> Date: 2026-04-05
> 목표 완료: 2026-05-15
> Status: ✅ 완료 (구현 + QA 통과)

---

## Overview

Phase 2에서 콘텐츠 볼륨(블로그 8개, 영상 세분화)과 AdSense 기초 요건을 갖췄으나,
**유입된 유저가 타임라인을 중심으로 반복 방문하고 각 기능을 깊게 활용하는 구조**가 부족하다.

Phase 2.5는 **리텐션과 기능 활용도**에 집중한다.

### 왜 지금 해야 하는가

| 이유 | 설명 |
|------|------|
| **PoC KPI 달성** | 7일 리텐션 20%, 세션 3분+ 목표 — 현재 구조로는 달성 어려움 |
| **유저 이탈 지점** | 홈 → 타임라인 전환율, 재방문 시 "데이터 남아있나?" 불안 해소 필요 |
| **기능 사일로** | 체중/영상/블로그가 타임라인과 분리되어 상호 연결 없음 |
| **첫인상** | 온보딩 플로우 없이 바로 홈 → 예정일 입력 유도력 약함 |

### 현재 상태 (AS-IS) vs 목표 (TO-BE)

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| 홈 대시보드 | 기능 그리드(아이콘+라벨 메뉴판) | 각 기능의 미니 대시보드 (스냅샷) |
| 데이터 보존 안내 | 최초 1회 토스트 (3초 후 소멸) | 첫 체크 시 인라인 배너 + 온보딩 |
| 온보딩 | 없음 (plan에만 명시) | 3단계 경량 온보딩 플로우 |
| 타임라인 ↔ 블로그 | 상호 링크 없음 | 주차별 관련 콘텐츠 딥링크 |
| 베이비페어 분류 | 2탭 (예정/지난) | 3탭 (진행중/예정/지난) |
| 베이비페어 연도 | 단일 연도 시 필터 미노출 | 연도 라벨 상시 표시 |
| 체중관리 | 독립 페이지, BottomNav 미포함 | 홈 미니 카드로 접근성 개선 |
| Sticky 헤더 | 없음 | 최소 높이 헤더 (로고+페이지명) |
| 할일 추가 버그 | 존재하지 않는 주차에 추가 시 무반응 | 알럿 + 주차 자동 생성 유도 |

---

## Scope

**In scope:**

- 온보딩 플로우 (3단계)
- 홈 대시보드 개편 (미니 대시보드 카드)
- 타임라인 유도 강화 + 데이터 보존 가이드
- Sticky 헤더 (로고 + 페이지명)
- 베이비페어 3분류 (진행중/예정/지난) + 연도 표시
- 타임라인 ↔ 블로그 크로스 링크
- 체중관리 접근성 개선
- 버그 수정 (존재하지 않는 주차 할일 추가)
- 유저 체류시간 증대 기능 (달성감, 검색 등)

**Out of scope:**

- 체중관리 타임라인 통합 (Phase 3에서 검토)
- 카카오톡 공유 연동
- PWA / 푸시 알림
- 서버 사이드 데이터 동기화

---

## Step 1. 온보딩 플로우

### 1-1. 문제 분석

Phase 1 plan에 "Onboarding flow (due date banner)" ✅ 완료로 표시되어 있으나,
실제 구현은 홈의 DueDateInput 카드 + 1회 토스트뿐이다.

**독립적인 온보딩 플로우가 없는 상태:**
- 첫 방문 시 "이 앱이 뭔지" 설명하는 화면 없음
- 주요 기능 소개 없음
- 예정일 입력의 중요성을 강조하는 전용 화면 없음
- 데이터 저장 방식 안내 부재 → 유저 불안

### 1-2. 설계: 3단계 경량 온보딩

**트리거 조건:** `localStorage.getItem('onboarding-completed')` 가 없을 때만 표시

#### Step 1 — 웰컴 (풀스크린)

```
┌──────────────────────────────────┐
│                                  │
│         [home.png 아이콘]         │
│                                  │
│    출산 준비, 빠짐없이 챙기세요     │
│                                  │
│  ✓ 주차별 맞춤 체크리스트          │
│  ✓ 전국 베이비페어 일정            │
│  ✓ 임신·출산 정보 한곳에           │
│                                  │
│        [ 시작하기 ]               │
│                                  │
└──────────────────────────────────┘
```

#### Step 2 — 예정일 입력 (전용 화면)

```
┌──────────────────────────────────┐
│                                  │
│      예정일을 알려주세요           │
│                                  │
│  예정일을 기준으로 주차별 맞춤     │
│  체크리스트를 만들어드려요         │
│                                  │
│      [ 📅 날짜 선택 ]            │
│                                  │
│  [ 나중에 입력할게요 ]  [ 다음 ]   │
│                                  │
└──────────────────────────────────┘
```

- "나중에 입력할게요" → Step 3으로 건너뜀 (예정일 없이 진행)
- "다음" → 예정일 저장 후 Step 3

#### Step 3 — 데이터 안내 + CTA

```
┌──────────────────────────────────┐
│                                  │
│          준비 완료!               │
│                                  │
│  🔒 입력한 정보는 이 브라우저에    │
│     만 저장돼요                   │
│  ✅ 회원가입 없이 바로 시작!       │
│  💾 다시 와도 기록이 남아있어요    │
│                                  │
│    [ 체크리스트 보러가기 → ]       │
│                                  │
└──────────────────────────────────┘
```

- "체크리스트 보러가기" → `localStorage.setItem('onboarding-completed', 'true')` 후 `/timeline` 이동

### 1-3. 구현 계획

| 파일 | 역할 |
|------|------|
| `src/components/onboarding/OnboardingFlow.tsx` | 3단계 스텝 컨테이너 |
| `src/components/onboarding/WelcomeStep.tsx` | Step 1 웰컴 |
| `src/components/onboarding/DueDateStep.tsx` | Step 2 예정일 |
| `src/components/onboarding/ReadyStep.tsx` | Step 3 데이터 안내 |
| `src/app/page.tsx` 또는 `HomeContent.tsx` | 온보딩 미완료 시 OnboardingFlow 렌더 |

**핵심 로직:**
```tsx
// HomeContent.tsx 상단
const [showOnboarding, setShowOnboarding] = useState(false);

useEffect(() => {
  const completed = localStorage.getItem('onboarding-completed');
  if (!completed) setShowOnboarding(true);
}, []);

if (showOnboarding) {
  return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />;
}
```

---

## Step 2. 타임라인 유도 강화 + 데이터 보존 가이드

### 2-1. 문제 분석

- 홈 → 타임라인 CTA가 "이번 주 할 일" 카드의 텍스트 링크뿐 → 클릭 동기 약함
- 최초 1회 토스트("데이터는 이 브라우저에만 저장됩니다")는 3~4초 후 사라져 인지율 극저
- 유저가 체크리스트를 체크해도 "다음에 와도 남아있을까?" 불안 해소 장치 없음

### 2-2. 개선 사항

#### A. 홈 → 타임라인 CTA 강화

현재 "이번 주 할 일" 카드를 **액션 중심**으로 변경:

```
AS-IS:
┌─────────────────────────────┐
│ 이번 주 할 일          [>]  │
│ · 산부인과 확정...    8주   │
│ · 보건소 등록...      8주   │
└─────────────────────────────┘

TO-BE:
┌─────────────────────────────────┐
│ 🗓️ 17주차에 3가지 할 일이 남았어요 │
│                                 │
│ · 태아보험 가입          ☐      │
│ · 산후도우미 신청        ☐      │
│ · 2차 기형아 검사 준비   ☑      │
│                                 │
│     [ 타임라인에서 확인하기 → ]  │
└─────────────────────────────────┘
```

변경 포인트:
- 타이틀에 **현재 주차 + 미완료 수** 명시 → 긴급성/구체성 전달
- 체크 상태 미리보기 → "내 데이터가 있다"는 인식
- 풀너비 CTA 버튼

#### B. 첫 체크 시 인라인 배너 (1회성)

타임라인 페이지에서 **첫 번째 체크리스트 항목을 체크**했을 때:

```
┌─────────────────────────────────┐
│ 💾 체크한 내용은 자동 저장돼요!   │
│ 다시 방문해도 기록이 남아있어요   │
│                          [ 확인 ]│
└─────────────────────────────────┘
```

- 트리거: `checkedIds.length` 가 0 → 1로 변경될 때
- 1회만 표시: `localStorage.setItem('first-check-guide-shown', 'true')`
- 위치: 체크한 항목 바로 아래 or 페이지 하단 인라인 배너

#### C. 재방문 유저 웰컴 메시지

홈 대시보드에 재방문 유저용 메시지 추가:

```
조건: dueDate 존재 + checkedIds.length > 0 + 이전 방문 기록 있음
표시: "돌아오셨군요! 지난번에 N개 체크하셨어요 ✨"
위치: 현재 주차 / D-day 카드 상단
```

구현: `localStorage`에 마지막 방문 날짜 저장, 당일이 아닌 경우에만 표시

### 2-3. 수정 파일

| 파일 | 변경 |
|------|------|
| `src/components/home/HomeContent.tsx` | CTA 강화, 재방문 메시지 |
| `src/components/timeline/TimelineContainer.tsx` | 첫 체크 인라인 배너 |
| `src/components/timeline/WeekChecklistSection.tsx` | 첫 체크 이벤트 전파 |

---

## Step 3. 홈 대시보드 개편 — 메뉴판 → 미니 대시보드

### 3-1. 문제 분석

현재 홈 하단의 Feature Grid는 **아이콘 + 라벨**만 있는 단순 메뉴판이다.
BottomNav와 기능이 중복되며, 유저에게 클릭 동기를 주지 못한다.

### 3-2. 개선: 각 기능의 스냅샷 카드

각 기능 카드를 **현재 상태를 반영하는 미니 대시보드**로 변경한다.

```
┌─────────────────┐  ┌─────────────────┐
│ 🗓️ 타임라인      │  │ 👶 베이비페어     │
│                 │  │                 │
│ 17주차          │  │ 다가오는 행사     │
│ 3/8 완료        │  │ 2건             │
│ ████░░░░ 38%   │  │ 코엑스 4/12~    │
│                 │  │                 │
│ [자세히 보기 →] │  │ [자세히 보기 →] │
└─────────────────┘  └─────────────────┘
┌─────────────────┐  ┌─────────────────┐
│ ⚖️ 체중 기록     │  │ 🎬 영상          │
│                 │  │                 │
│ 최근: 62.5kg    │  │ 추천 영상        │
│ (+2.1 from 시작)│  │ 9건             │
│                 │  │ 운동·출산·케어   │
│                 │  │                 │
│ [기록하기 →]    │  │ [보러가기 →]    │
└─────────────────┘  └─────────────────┘
┌─────────────────────────────────────┐
│ 📝 정보 & 가이드                     │
│                                     │
│ 새 글: 산후조리원 선택 가이드         │
│ 총 8개 아티클                        │
│                                     │
│ [읽으러 가기 →]                      │
└─────────────────────────────────────┘
```

### 3-3. 데이터 소스

| 카드 | 필요 데이터 | 소스 |
|------|------------|------|
| 타임라인 | 현재 주차, 해당 주차 체크리스트 완료/전체, 진행률 | `useDueDateStore`, `useChecklistStore`, `checklist-week-map` |
| 베이비페어 | 다가오는 행사 수, 가장 가까운 행사명 | `babyfair_events.json` → 클라이언트 필터 |
| 체중 | 최근 기록 체중, 시작 대비 변화량 | `useWeightStore` |
| 영상 | 영상 총 수, 카테고리 수 | `videos.json` (정적) |
| 정보 | 최신 글 제목, 총 글 수 | `getAllArticles()` → 정적 props |

### 3-4. 수정 파일

| 파일 | 변경 |
|------|------|
| `src/components/home/HomeContent.tsx` | Feature Grid → 미니 대시보드 카드 |
| `src/components/home/DashboardCard.tsx` | **신규** — 재사용 가능한 대시보드 카드 컴포넌트 |
| `src/app/page.tsx` | babyfair/articles 데이터를 props로 전달 |

---

## Step 4. Sticky 헤더

### 4-1. 문제 분석

- 현재 **헤더 컴포넌트가 없음**. 유저가 어떤 서비스인지 인지할 장치가 페이지 내 타이틀에만 의존.
- 모바일에서 BottomNav(하단) + Sticky 헤더(상단) 조합 시 콘텐츠 영역 축소 우려.

### 4-2. 설계

**최소한의 Sticky 헤더** (높이 44px):

```
┌──────────────────────────────────────┐
│ [로고] 출산 준비 체크리스트           │
└──────────────────────────────────────┘
```

- 높이: `h-11` (44px), `sticky top-0 z-40`
- 배경: `bg-white/90 backdrop-blur-xl` (BottomNav와 동일 스타일)
- 로고: 16x16 or 20x20 아이콘 (home.png 축소 또는 별도 로고)
- 텍스트: "출산 준비 체크리스트" (14px, font-medium)
- **홈 페이지에서는 숨김** (히어로 영역이 있으므로)
- 스크롤 다운 시 `border-b border-black/6` 추가 (구분선)

### 4-3. 스크롤 인식 (선택)

사용자 경험을 위해 스크롤 다운 시 헤더를 숨기고, 스크롤 업 시 다시 표시하는 패턴 적용 가능:

```tsx
const [visible, setVisible] = useState(true);
const lastScrollY = useRef(0);

useEffect(() => {
  const handleScroll = () => {
    const current = window.scrollY;
    setVisible(current < lastScrollY.current || current < 44);
    lastScrollY.current = current;
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

### 4-4. 구현 파일

| 파일 | 역할 |
|------|------|
| `src/components/layout/StickyHeader.tsx` | **신규** — Sticky 헤더 컴포넌트 |
| `src/app/layout.tsx` | StickyHeader 삽입 (홈 제외 조건부 렌더) |

---

## Step 5. 타임라인 ↔ 블로그 크로스 링크

### 5-1. 현재 상태: 콘텐츠 일치 여부 분석

| 주제 | 타임라인 항목 | 블로그 기사 | 일치 여부 |
|------|-------------|------------|-----------|
| 임신 초기 검사 | Week 4, 8, 10 | `early-pregnancy-tests.md` | **대체로 일치** — 블로그가 더 상세 |
| 출산 가방 | Week 32, 36 | `hospital-bag.md` | **일치** — 체크리스트 22개 항목과 매칭 |
| 산후조리원 | Week 12 | `postpartum-care.md` | **일치** — 타임라인은 시점, 블로그는 방법론 |
| 출산 준비물 비용 | Week 18 (베이비페어 방문) | `baby-items-cost.md` | **부분 일치** — 연결 불명시 |
| 주차별 가이드 | 전체 타임라인 | `weekly-prep.md` | **상호 보완적** |
| 신생아 목욕 | 타임라인에 없음 | `newborn-bath-tips.md` | **블로그만 존재** (출산 후 콘텐츠) |
| 예방접종 | 타임라인에 없음 | `infant-vaccination-schedule.md` | **블로그만 존재** (출산 후 콘텐츠) |
| 산후 식단 | 타임라인에 없음 | `postpartum-diet.md` | **블로그만 존재** (출산 후 콘텐츠) |
| 체중 관리 | 별도 항목 없음 | 블로그 없음 | **양쪽 모두 없음** → 갭 |

### 5-2. 개선: 주차별 관련 콘텐츠 매핑

`timeline_items.json`의 `seo_slug` 필드를 활용하여 블로그와 연결한다.

#### 매핑 테이블

| 타임라인 주차 | 연결 블로그 slug | 연결 이유 |
|-------------|-----------------|----------|
| Week 4, 8, 10 | `early-pregnancy-tests` | 초기 검사 관련 |
| Week 12 | `postpartum-care` | 산후조리원 예약 시점 |
| Week 18 | `baby-items-cost` | 베이비페어/쇼핑 시점 |
| Week 28 | `infant-vaccination-schedule` | 백일해 접종 + 출산 후 예방접종 안내 |
| Week 30 | `newborn-bath-tips` | 신생아 준비 시점 |
| Week 32, 36 | `hospital-bag` | 입원 가방 준비 |
| Week 37-40 | `postpartum-diet` | 출산 직전 산후 식단 미리 파악 |
| Week 전체 | `weekly-prep` | 종합 가이드 |

#### 구현 방식

**A. 타임라인 → 블로그:**
각 주차 아코디언 카드 하단에 "관련 글 읽기" 링크 추가

```
┌──────────────────────────────────┐
│ ● 32주  입원 가방 준비 시작       │
│         ...                      │
│   ☐ 산모 수면 가운               │
│   ☐ 슬리퍼                       │
│   ☑ 세면도구                     │
│                                  │
│   📝 관련 글: 출산 가방 필수 준비물│
│              총정리 →            │
└──────────────────────────────────┘
```

**B. 블로그 → 타임라인:**
각 블로그 기사 하단에 "타임라인에서 확인하기" CTA 추가

```
... (기사 본문) ...

┌──────────────────────────────────┐
│ 🗓️ 타임라인에서 체크하기           │
│ 이 내용은 32주차 할일에 있어요     │
│ [ 타임라인 보기 → ]              │
└──────────────────────────────────┘
```

### 5-3. 데이터 구조 변경

```json
// timeline_items.json — linked_article_slugs 필드 추가
{
  "id": "timeline_032",
  "week": 32,
  "title": "입원 가방 준비 시작",
  "linked_article_slugs": ["hospital-bag"]
}
```

```yaml
# articles frontmatter — linked_timeline_weeks 필드 추가
---
title: "출산 가방 필수 준비물 총정리"
slug: "hospital-bag"
linked_timeline_weeks: [32, 36]
---
```

### 5-4. 누락 콘텐츠 (향후 작성 필요)

| 주제 | 현재 | 제안 |
|------|------|------|
| 임신 중 체중 관리 가이드 | 체중 기능은 있으나 관련 블로그 없음 | `pregnancy-weight-guide.md` 작성 필요 |

### 5-5. 수정 파일

| 파일 | 변경 |
|------|------|
| `src/data/timeline_items.json` | `linked_article_slugs` 필드 추가 |
| `src/content/articles/*.md` frontmatter | `linked_timeline_weeks` 필드 추가 |
| `src/types/timeline.ts` | `linked_article_slugs?: string[]` 추가 |
| `src/types/article.ts` | `linked_timeline_weeks?: number[]` 추가 |
| `src/components/timeline/TimelineAccordionCard.tsx` | 관련 글 링크 UI |
| `src/components/articles/ArticleDetail.tsx` | 타임라인 CTA UI |
| `src/lib/articles.ts` | frontmatter에서 linked_timeline_weeks 파싱 |

---

## Step 6. 베이비페어 개선

### 6-1. 3분류 카테고리

현재 2개 탭을 3개로 분리한다.

| 카테고리 | 조건 | 유저 니즈 |
|----------|------|-----------|
| **진행 중** | `start_date <= today && end_date >= today` | "지금 갈 수 있는 곳" |
| **예정** | `start_date > today` | "미리 일정 잡아야 할 곳" |
| **지난 행사** | `end_date < today` | "후기 참고용" |

**기본 선택 탭:** 진행 중 행사가 1건 이상이면 "진행 중", 없으면 "예정"

**"진행 중" 탭 추가 UI:**
- 카드에 "D-N일 남음" 배지 추가 (end_date 기준 남은 일수)
- 탭 옆에 진행 중 행사 수 배지: `진행 중 (2)`

#### 구현 변경 (BabyfairContainer.tsx)

```tsx
// AS-IS
const [tab, setTab] = useState<"upcoming" | "ended">("upcoming");

// TO-BE
type BabyfairTab = "ongoing" | "upcoming" | "ended";

const ongoingEvents = events.filter(
  (e) => e.start_date <= today && e.end_date >= today
);
const [tab, setTab] = useState<BabyfairTab>(
  ongoingEvents.length > 0 ? "ongoing" : "upcoming"
);

// 필터 로직
const filtered = events.filter((e) => {
  if (selectedCity !== "전체" && e.city !== selectedCity) return false;
  if (selectedYear !== "전체" && !e.start_date.startsWith(selectedYear)) return false;
  if (tab === "ongoing" && !(e.start_date <= today && e.end_date >= today)) return false;
  if (tab === "upcoming" && !(e.start_date > today)) return false;
  if (tab === "ended" && !(e.end_date < today)) return false;
  return true;
});
```

### 6-2. 연도 표시

현재 연도 필터 드롭다운은 `years.length > 2` 조건으로 2개 이상 실제 연도가 있어야 표시된다.
현재 데이터가 2026년뿐이라 드롭다운이 노출되지 않는다.

**개선 방안:**

1. 연도 필터 조건을 `years.length > 1` (실제 연도 1개 이상)로 변경하여 **항상 표시**
2. 연도 필터 대신 **페이지 상단에 연도 라벨** 상시 표시: 예) "2026년 베이비페어 일정"
3. 카드 내 날짜에 이미 `yyyy년 M월 d일` 포맷으로 연도가 포함되어 있으므로 중복 회피 필요

**선택:** **방안 2** 채택 — 페이지 타이틀/서브타이틀에 연도 반영

```
AS-IS:
  "베이비페어 일정"
  "전국 베이비페어 행사 안내"

TO-BE:
  "베이비페어 일정"
  "2026년 전국 베이비페어 행사 안내"   ← 현재 연도 자동 반영
```

다수 연도 데이터 시 연도 필터 드롭다운도 함께 표시 (기존 로직 유지).

### 6-3. 수정 파일

| 파일 | 변경 |
|------|------|
| `src/components/babyfair/BabyfairContainer.tsx` | 3탭 분리, 기본 탭 로직, 연도 라벨 |
| `src/components/babyfair/BabyfairCard.tsx` | "D-N일 남음" 배지 (진행 중 탭) |
| `src/types/babyfair.ts` | 변경 없음 (기존 타입 충분) |

---

## Step 7. 체중관리 접근성 개선

### 7-1. 현재 상태

- `/weight` 독립 페이지 존재
- BottomNav에서 제거됨 (Phase 2에서 정보 탭으로 교체)
- 홈 Feature Grid에서만 접근 가능
- 기능: 날짜+체중 입력 → 꺾은선 차트 + 권장 범위 참고선

### 7-2. 문제점

1. **접근성 낮음**: 홈 → 체중으로만 진입 가능. 주 1회 기록 패턴에 반복 접근 불편
2. **동기부여 부족**: 차트만 보여주고, 주차별 가이드나 피드백 없음
3. **홈과의 연결 약함**: Feature Grid의 체중 카드가 단순 아이콘+라벨

### 7-3. 개선 사항

Step 3(홈 대시보드 개편)에서 체중 카드를 미니 대시보드로 변경하여 해결:

```
┌─────────────────┐
│ ⚖️ 체중 기록     │
│                 │
│ 최근: 62.5kg    │
│ +2.1kg (시작比) │
│                 │
│ [기록하기 →]    │
└─────────────────┘
```

- 기록이 없을 때: "아직 기록이 없어요" + [시작하기 →]
- 기록이 1건일 때: "62.5kg" + [추가 기록 →]
- 기록이 2건+일 때: 최근 체중 + 시작 대비 변화량

**추가 개선 (체중 페이지 내):**
- 체중 관련 블로그 연결 (Step 5 크로스 링크와 연동)
- `pregnancy-weight-guide.md` 작성 후 체중 페이지 하단에 "임신 중 체중 관리 가이드 →" 링크

---

## Step 8. 버그 수정 — 존재하지 않는 주차에 할일 추가 시 무반응

### 8-1. 문제 상세

`UnifiedAddForm.tsx`에서 체크리스트 항목 추가 시:

1. 유저가 주차(1-40) 입력 + 제목 입력 → "추가하기" 클릭
2. 항목은 `useChecklistStore`에 `recommendedWeek: N`으로 저장됨
3. `checklist-week-map.ts`의 `getChecklistByWeek()`가 해당 주차에 타임라인 항목이 있을 때만 매핑
4. **타임라인에 기본 항목이 없는 주차**(예: Week 1, 2, 3, 5, 7, 9, 11, 13, 15 등)에 추가 시:
   - 항목은 store에 저장되지만
   - 해당 주차의 아코디언 카드가 없어 **UI에 표시되지 않음**
   - 유저에게 아무 피드백 없음 → **데이터 유실처럼 보임**

### 8-2. 수정 방안 (방안 1 채택)

**알럿 표시 + 주차 자동 생성 유도**

체크리스트 항목 추가 시, 해당 주차에 타임라인 항목이 없으면:

1. AlertDialog 표시:
   > "**{N}주차에 타임라인 항목이 없습니다.**
   > 주차를 먼저 추가해야 할일이 표시됩니다.
   > {N}주차를 추가하시겠어요?"
   >
   > [취소] [주차 추가하고 할일 넣기]

2. "주차 추가하고 할일 넣기" 클릭 시:
   - `useTimelineStore.addCustomItem()`으로 빈 타임라인 항목 자동 생성:
     ```ts
     {
       id: `auto-week-${week}-${Date.now()}`,
       week: week,
       title: `${week}주차`,
       description: '',
       type: 'prep',
       priority: 'medium',
       isCustom: true,
     }
     ```
   - 이어서 체크리스트 항목 추가
   - 성공 토스트: "{N}주차가 추가되었습니다"

3. "취소" 클릭 시: 폼으로 돌아감 (주차 변경 유도)

### 8-3. 존재 주차 판별 로직

```tsx
// UnifiedAddForm.tsx handleSubmit 내부
const allTimelineWeeks = new Set(
  [...timelineItems, ...customTimelineItems].map(item => item.week)
);

if (itemType === 'checklist' && !allTimelineWeeks.has(week)) {
  // AlertDialog 표시
  setShowWeekAlert(true);
  return;
}
```

**주의:** `timelineItems` (기본 데이터)는 현재 UnifiedAddForm의 props로 전달되지 않으므로,
props 추가 또는 context/store를 통해 접근 필요.

### 8-4. 수정 파일

| 파일 | 변경 |
|------|------|
| `src/components/timeline/UnifiedAddForm.tsx` | 주차 존재 여부 확인 + AlertDialog 연동 |
| `src/components/timeline/TimelineContainer.tsx` | UnifiedAddForm에 timelineItems props 전달 |

---

## Step 9. 유저 체류시간 및 기능 활용도 증대

### 9-1. 달성감 / 게이미피케이션

현재 체크리스트 완료율은 숫자(12/85)와 프로그레스 바로만 표시된다.

**개선:**

#### A. 주차 완료 축하
해당 주차의 모든 체크리스트를 완료하면:
```
🎉 17주차 할일을 모두 완료했어요!
```
- 아코디언 카드 헤더에 ✅ 아이콘 추가
- confetti 애니메이션은 과하므로 생략, 텍스트 + 아이콘으로 충분

#### B. 마일스톤 배지
전체 진행률 기준 마일스톤:
- 25% → "순조로운 출발!"
- 50% → "절반 완료!"
- 75% → "거의 다 왔어요!"
- 100% → "완벽한 준비 완료! 🎊"

타임라인 페이지 상단 진행률 카드에 마일스톤 메시지 표시.

### 9-2. 검색 기능

현재 114개 체크리스트 + 8개 블로그 + 100개 베이비페어 → **검색이 필요한 규모**.

**구현 방안:**
- Sticky 헤더 우측에 검색 아이콘 (돋보기)
- 클릭 시 검색 오버레이 or 검색 페이지
- 검색 대상: 체크리스트 제목, 블로그 제목/태그, 베이비페어 행사명
- 정적 사이트이므로 **클라이언트 사이드 전문 검색** (빌드 시 인덱스 생성)
- 라이브러리: `fuse.js` (경량, 클라이언트 사이드 fuzzy search)

**우선순위:** Phase 2.5 선택 사항. 검색보다 크로스 링크가 우선.

### 9-3. 영상 콘텐츠 타임라인 연결

현재 9개 영상이 독립 탭에만 있다.
타임라인 주차와 연결하면 활용도 상승.

예시:
- Week 28 "백일해 접종" → 관련 영상 "임신 중 예방접종 가이드" 링크
- Week 32 "입원 가방 준비" → 관련 영상 "출산 가방 싸기" 링크

**구현:** Step 5의 크로스 링크 패턴과 동일하게 `linked_video_ids` 필드 추가.
단, 영상 수가 적으므로 Phase 3에서 영상 확충 후 진행하는 것이 효율적.

→ **Phase 3으로 이관**

### 9-4. 수정 파일

| 파일 | 변경 |
|------|------|
| `src/components/timeline/TimelineAccordionCard.tsx` | 주차 완료 ✅ 아이콘 |
| `src/components/timeline/TimelineContainer.tsx` | 마일스톤 메시지 |

---

---

# 🎨 브랜딩: "초산 개발자" 아이덴티티 구축

> **전략 A — 시간축 진화**: "초산 임신 중인 개발자"로 시작해, 출산 후에는 자연스럽게 "초산 개발자의 임신·출산·육아 기록"으로 확장한다.
> 핵심 훅은 **"답답해서 직접 만들었습니다"** — 이것만으로 병원/기업 콘텐츠와 즉시 차별화된다.

---

## Step 10. 히어로 카피 & 톤 리뉴얼

### 10-1. 문제 분석

현재 홈 히어로 영역의 카피가 브랜드 정체성을 전달하지 못한다:

```
AS-IS:
- 타이틀: "출산 준비 체크리스트"
- 서브: "소중한 아기를 위한 완벽한 준비"     ← 병원 브로셔 톤. 누가 만들었는지 알 수 없음
- 하단: "출산은 인생에서 가장 특별한 순간입니다" ← 클리셰
```

**문제점:**
- 어떤 서비스든 쓸 수 있는 범용 카피 → 브랜드 기억에 남지 않음
- "당사자가 만든 도구"라는 핵심 강점이 전혀 노출되지 않음
- 재방문 유저에게도 새로운 인상을 주지 못함

### 10-2. 변경 사항

| 위치 | AS-IS | TO-BE |
|------|-------|-------|
| 히어로 타이틀 | "출산 준비 체크리스트" | 유지 (SEO 앵커 역할) |
| 히어로 서브 `<p>` | "소중한 아기를 위한 완벽한 준비" | **"답답해서 직접 만들었습니다"** |
| 히어로 하단 (신규) | — | **"초산 임신 중인 개발자의 출산 준비 기록"** (작은 텍스트, `text-xs text-muted-foreground`) |
| 하단 모티베이션 `<p>` | "출산은 인생에서 가장 특별한 순간입니다" | **"같이 준비하면 덜 막막하니까요"** |

#### 히어로 영역 와이어프레임 (TO-BE)

```
┌──────────────────────────────────┐
│         [home.png 아이콘]         │
│                                  │
│      출산 준비 체크리스트          │  ← h1 (SEO)
│      답답해서 직접 만들었습니다     │  ← 서브 카피 (브랜딩 훅)
│      ─── gradient line ───       │
│  초산 임신 중인 개발자의 출산 준비 기록  │  ← text-xs (당사자성)
│                                  │
└──────────────────────────────────┘
```

### 10-3. Phase 분기를 위한 설계

`constants.ts`에 **브랜딩 phase 상수**를 추가한다. 지금은 하드코딩하되, 출산 후 한 줄만 바꾸면 전체 카피가 전환되는 구조:

```ts
// src/lib/constants.ts

export type BrandPhase = "pregnancy" | "postpartum" | "parenting";

export const BRAND_PHASE: BrandPhase = "pregnancy"; // 출산 후 "postpartum"으로 변경

export const BRAND_COPY = {
  pregnancy: {
    heroSub: "답답해서 직접 만들었습니다",
    heroCaption: "초산 임신 중인 개발자의 출산 준비 기록",
    motivation: "같이 준비하면 덜 막막하니까요",
  },
  postpartum: {
    heroSub: "답답해서 직접 만들었습니다",
    heroCaption: "초산 개발자의 출산 준비 & 산후조리 기록",
    motivation: "같이 준비하면 덜 막막하니까요",
  },
  parenting: {
    heroSub: "답답해서 직접 만들었습니다",
    heroCaption: "초산 개발자의 임신·출산·육아 기록",
    motivation: "같이 준비하면 덜 막막하니까요",
  },
} as const;
```

→ `HomeContent.tsx`에서 `BRAND_COPY[BRAND_PHASE]`로 참조. 
→ 향후 Phase 전환 시 `BRAND_PHASE` 값만 바꾸면 히어로, About, 온보딩 카피가 모두 전환됨.

### 10-4. 수정 파일

| 파일 | 변경 |
|------|------|
| `src/lib/constants.ts` | `BRAND_PHASE`, `BRAND_COPY` 상수 추가 |
| `src/components/home/HomeContent.tsx` | 히어로 서브 카피, 하단 모티베이션 교체, 히어로 캡션 추가 |

### 10-5. 주의사항

- 타이틀 "출산 준비 체크리스트"는 절대 변경하지 않음 (SEO 메인 키워드)
- "답답해서 직접 만들었습니다"는 서브 카피로, 검색엔진보다 **방문자에게** 말하는 문장
- gradient underline은 유지하되, 캡션 텍스트를 그 아래에 배치

---

## Step 11. SEO 메타 태그 브랜딩

### 11-1. 문제 분석

현재 메타 태그가 기능 설명만 하고 있어, 검색 결과에서 다른 출산 준비 사이트와 차별화되지 않음:

```
AS-IS:
title: "출산 준비 체크리스트 - 임신 주차별 준비 가이드"
description: "임신 주차에 맞춘 출산 준비 체크리스트, 타임라인, 베이비페어 일정을 한눈에 확인하세요."
```

검색 결과 상에서 다른 출산 정보 사이트(맘스다이어리, 베이비뉴스 등)와 동일한 톤 → CTR 낮음.

### 11-2. 변경 사항

```
TO-BE:
title: "출산 준비 체크리스트 - 초산 개발자가 직접 만든 임신 주차별 가이드"
description: "답답해서 직접 만들었습니다. 임신 주차별 체크리스트, 입원가방, 베이비페어, 체중관리까지."
og:title: (title과 동일)
og:description: (description과 동일)
```

#### 서브 페이지 description도 톤 통일

| 페이지 | AS-IS description | TO-BE description |
|--------|-------------------|-------------------|
| `/about` | "출산 준비 체크리스트 서비스를 소개합니다." | "초산 임신 중인 개발자가 답답해서 만든 출산 준비 체크리스트입니다." |
| `/contact` | "출산 준비 체크리스트 서비스 문의 및 연락처입니다." | "혼자 만들다 보니 놓치는 것도 많아요. 의견을 들려주세요." |
| `/timeline` | (기존 유지) | "주차별로 뭘 해야 하는지 한눈에. 직접 써보며 만든 체크리스트." |
| `/baby-fair` | (기존 유지) | "전국 베이비페어 일정을 한곳에 모았습니다. 날짜·장소·링크까지." |

### 11-3. 수정 파일

| 파일 | 변경 |
|------|------|
| `src/app/layout.tsx` | 루트 metadata title, description, og 태그 |
| `src/app/about/page.tsx` | metadata description |
| `src/app/contact/page.tsx` | metadata description |
| `src/app/timeline/page.tsx` | metadata description (선택) |
| `src/app/baby-fair/page.tsx` | metadata description (선택) |

---

## Step 12. 온보딩 톤 변경

### 12-1. 문제 분석

현재 온보딩 WelcomeStep의 톤이 **3인칭 서비스 안내**:

```tsx
// AS-IS (WelcomeStep.tsx)
<h1>"출산 준비, 빠짐없이 챙기세요"</h1>
<ul>
  "주차별 맞춤 체크리스트"
  "전국 베이비페어 일정"
  "임신·출산 정보 한곳에"
</ul>
```

→ 서비스가 유저에게 말하는 톤. 브랜딩 포인트인 "당사자성"이 없음.

### 12-2. 변경 사항

#### WelcomeStep 카피 변경

```
TO-BE:
┌──────────────────────────────────┐
│         [home.png 아이콘]         │
│                                  │
│  안녕하세요!                      │
│  저도 초산이라 뭐부터 해야 할지    │
│  몰라서 이 체크리스트를 만들었어요. │
│                                  │
│  ✓ 주차별로 뭘 해야 하는지 정리    │
│  ✓ 전국 베이비페어 일정 모음       │
│  ✓ 체중 기록 & 출산 정보까지      │
│                                  │
│        [ 시작하기 ]               │
│                                  │
└──────────────────────────────────┘
```

**변경 포인트:**
- h1: "출산 준비, 빠짐없이 챙기세요" → **"안녕하세요!"** (1인칭 인사)
- h1 아래 서브 텍스트 추가: "저도 초산이라 뭐부터 해야 할지 몰라서 이 체크리스트를 만들었어요."
- highlights 배열: 기능 나열 → **유저 관점의 혜택** 표현

```tsx
// TO-BE
const highlights = [
  "주차별로 뭘 해야 하는지 정리",
  "전국 베이비페어 일정 모음",
  "체중 기록 & 출산 정보까지",
];
```

#### ReadyStep 카피도 브랜딩 반영

```
AS-IS: "준비 완료!"
TO-BE: "준비 완료! 같이 챙겨봐요"
```

### 12-3. Phase 전환 대응

`BRAND_COPY`에 온보딩 카피도 추가:

```ts
export const BRAND_COPY = {
  pregnancy: {
    // ...기존
    onboardingGreeting: "저도 초산이라 뭐부터 해야 할지 몰라서 이 체크리스트를 만들었어요.",
  },
  postpartum: {
    onboardingGreeting: "초산 출산을 겪으며 만든 체크리스트예요. 같이 준비해봐요.",
  },
  parenting: {
    onboardingGreeting: "임신부터 육아까지, 직접 겪으며 정리한 체크리스트예요.",
  },
};
```

### 12-4. 수정 파일

| 파일 | 변경 |
|------|------|
| `src/lib/constants.ts` | `BRAND_COPY`에 `onboardingGreeting` 추가 |
| `src/components/onboarding/WelcomeStep.tsx` | h1, 서브 텍스트, highlights 배열 변경 |
| `src/components/onboarding/ReadyStep.tsx` | 타이틀 카피 변경 |

---

## Step 13. About 페이지 → "만든 사람" 스토리텔링

### 13-1. 문제 분석

현재 `/about` 페이지가 **기능 나열 + 면책 공지** 형태:

```
AS-IS 구조:
  "서비스 소개"
  → 출산 준비 체크리스트란?  (기능 설명)
  → 주요 기능              (리스트)
  → 데이터 저장 안내        (기술 설명)
  → 의료 면책 안내          (법적 면책)
```

→ 어떤 SaaS 서비스든 쓸 수 있는 구조. **왜 만들었는지, 누가 만들었는지** 전혀 없음.

### 13-2. 리뉴얼 설계

**타이틀 변경:** "서비스 소개" → **"만든 사람"**

```
TO-BE 구조:

┌──────────────────────────────────┐
│           만든 사람               │
│                                  │
│  ── 왜 만들었나 ──               │
│                                  │
│  "첫 아이를 준비하면서 검색해보니  │
│  광고 블로그, 맘카페, 병원 안내지  │
│  다 흩어져 있고, 뭘 언제 해야     │
│  하는지 한눈에 보이는 게          │
│  없었습니다.                     │
│                                  │
│  개발자라 직접 만들기로 했어요.    │
│  주차별로 정리하고, 실제로        │
│  쓰면서 계속 고치고 있습니다."    │
│                                  │
│  ── 현재 상태 ──                 │
│                                  │
│  🤰 임신 N주차  ← 자동 계산      │
│  (CREATOR_DUE_DATE 기반)         │
│                                  │
│  ── 앞으로의 계획 ──               │
│                                  │
│  "출산하면 산후조리, 신생아 케어,  │
│  예방접종 트래커까지 확장          │
│  예정입니다."                    │
│                                  │
│  ── 데이터 안내 ──               │
│  (기존 내용 유지)                 │
│                                  │
│  ── 의료 면책 ──                 │
│  (기존 내용 유지)                 │
│                                  │
│  ── 의견 보내기 ──               │
│  "혼자 만들다 보니 놓치는 것도    │
│  많아요."                        │
│  [ 의견 보내기 → /contact ]      │
│                                  │
└──────────────────────────────────┘
```

### 13-3. 만든이 주차 자동 계산

`constants.ts`에 만든이의 출산예정일을 설정:

```ts
// src/lib/constants.ts
export const CREATOR_DUE_DATE = "2026-08-XX"; // 실제 예정일로 교체
```

About 페이지에서 `calcPregnancyWeek()`로 현재 주차를 자동 계산:

```tsx
// about/page.tsx → Client Component로 전환 필요
const creatorWeek = calcPregnancyWeek(new Date(CREATOR_DUE_DATE));
```

**Phase 전환 시:**
- `BRAND_PHASE === "pregnancy"` → "임신 N주차" 표시
- `BRAND_PHASE === "postpartum"` → "출산 D+N일" 표시 (출산일 상수 추가)
- `BRAND_PHASE === "parenting"` → "육아 N개월차" 표시

### 13-4. 수정 파일

| 파일 | 변경 |
|------|------|
| `src/lib/constants.ts` | `CREATOR_DUE_DATE` 상수 추가 |
| `src/app/about/page.tsx` | 전면 리뉴얼 — 스토리텔링 구조, Client Component 전환, 주차 자동 계산 |

### 13-5. 주의사항

- `about/page.tsx`는 현재 Server Component (metadata export). Client Component 전환 시 metadata는 별도 `layout.tsx` 또는 `generateMetadata`로 분리
- 만든이 출산예정일은 개인정보이므로, 주차 숫자만 노출하고 날짜 자체는 노출하지 않음
- "왜 만들었나" 섹션은 **prose 스타일** 유지하되 배경색 카드(`bg-[#FFF4D4]/10`)로 감싸 강조

---

## Step 14. 아티클 authorNote 필드 추가

### 14-1. 목적

모든 아티클이 동일한 "정보 전달" 톤인데, 선택적으로 **만든이의 한마디**를 추가하여 당사자성을 부여한다.

### 14-2. 데이터 구조 변경

#### ArticleInfo 타입 확장

```ts
// src/types/article.ts
export interface ArticleInfo {
  title: string;
  slug: string;
  tags: string[];
  date: string;
  description: string;
  linked_timeline_weeks?: number[];
  authorNote?: string; // 신규 — 만든이의 한마디
}
```

#### Frontmatter 예시

```yaml
# src/content/articles/hospital-bag.md
---
title: "출산 가방 필수 준비물 총정리"
slug: "hospital-bag"
tags: ["출산준비", "입원가방"]
date: "2026-03-15"
description: "..."
authorNote: "실제로 입원가방 쌌을 때, 블로그마다 리스트가 달라서 짜증났어요. 3개 이상 블로그에서 겹치는 것만 추렸습니다."
---
```

#### 적용 대상 아티클과 authorNote 초안

| slug | authorNote |
|------|-----------|
| `hospital-bag` | "실제로 입원가방 쌌을 때, 블로그마다 리스트가 달라서 짜증났어요. 3개 이상 블로그에서 겹치는 것만 추렸습니다." |
| `baby-items-cost` | "스프레드시트로 정리했던 걸 그대로 옮겼어요. 가격은 2026년 기준입니다." |
| `early-pregnancy-tests` | "임신 초기에 어떤 검사를 언제 받아야 하는지 너무 헷갈렸어요. 병원마다 다른 것도 정리했습니다." |
| `postpartum-care` | "산후조리원 고를 때 뭘 기준으로 비교해야 하는지 몰라서 한참 헤맸어요." |
| `pregnancy-weight-management` | "체중계 올라갈 때마다 불안해서, 정상 범위가 어디까지인지 정리해봤습니다." |

→ 나머지 아티클(`weekly-prep`, `newborn-bath-tips`, `infant-vaccination-schedule`, `postpartum-diet`)은 직접 경험 기반이 약하면 authorNote 없이 유지.

### 14-3. UI 표현

`ArticleDetail.tsx`의 제목과 본문 사이에 authorNote 카드를 삽입:

```
┌──────────────────────────────────┐
│  출산 가방 필수 준비물 총정리       │  ← h1
│  2026.03.15  #출산준비 #입원가방    │  ← 메타
│                                  │
│  ┌────────────────────────────┐  │
│  │ 💬 만든이의 한마디           │  │
│  │                            │  │
│  │ "실제로 입원가방 쌌을 때,    │  │
│  │  블로그마다 리스트가 달라서   │  │
│  │  짜증났어요. 3개 이상        │  │
│  │  블로그에서 겹치는 것만      │  │
│  │  추렸습니다."               │  │
│  └────────────────────────────┘  │
│                                  │
│  ... (본문) ...                   │
└──────────────────────────────────┘
```

**스타일:**
- 배경: `bg-[#FFF4D4]/15` (따뜻한 톤)
- 보더: `border border-[#FFF4D4]/40`
- 라운드: `rounded-xl`
- 텍스트: `text-sm text-[#8B7520] italic`
- authorNote가 없는 아티클에서는 렌더링하지 않음

### 14-4. 수정 파일

| 파일 | 변경 |
|------|------|
| `src/types/article.ts` | `authorNote?: string` 추가 |
| `src/lib/articles.ts` | frontmatter에서 `authorNote` 파싱 |
| `src/content/articles/hospital-bag.md` | frontmatter에 authorNote 추가 |
| `src/content/articles/baby-items-cost.md` | frontmatter에 authorNote 추가 |
| `src/content/articles/early-pregnancy-tests.md` | frontmatter에 authorNote 추가 |
| `src/content/articles/postpartum-care.md` | frontmatter에 authorNote 추가 |
| `src/content/articles/pregnancy-weight-management.md` | frontmatter에 authorNote 추가 |
| `src/components/articles/ArticleDetail.tsx` | authorNote 카드 UI 추가 |

---

## Step 15. Contact 페이지 톤 변경

### 15-1. 문제 분석

현재 Contact 페이지가 **기업 고객센터 톤**:

```
AS-IS:
  "연락처"
  "더 나은 서비스를 위해 여러분의 소중한 의견을 기다립니다."
  [의견을 들려주세요]
  "서비스 이용 중 문의사항이 있으시면 아래 이메일로 연락해 주세요."
```

→ 1인 개발 프로젝트에 "서비스", "여러분의 소중한 의견" 같은 기업 화법은 어색함.

### 15-2. 변경 사항

```
TO-BE:

┌──────────────────────────────────┐
│          의견 보내기               │  ← "연락처" → "의견 보내기"
│                                  │
│  혼자 만들다 보니                  │
│  놓치는 것도 많아요.               │
│                                  │
│  "이것도 넣어주세요",             │
│  "이건 좀 아닌데요"               │
│  다 환영합니다.                   │
│                                  │
│  [ 의견 보내기 → ]               │  ← 피드백 폼 링크
│                                  │
│  ── 이메일 ──                    │
│                                  │
│  직접 연락 주셔도 돼요.            │
│  melancholy8914@gmail.com        │
│                                  │
└──────────────────────────────────┘
```

### 15-3. 수정 파일

| 파일 | 변경 |
|------|------|
| `src/app/contact/page.tsx` | 타이틀, 카피, metadata 전체 변경 |

---

# 📦 콘텐츠 강화: 타임라인 & 베이비페어 정보 구체화

> 브랜딩으로 "누가 만들었는지"를 전달했다면, 콘텐츠 강화는 "실제로 쓸 만한 도구인지"를 결정한다.
> 현재 타임라인 항목은 주차별 1개씩 단일 이벤트로만 구성되어 있고,
> 베이비페어 데이터는 날짜/장소만 있어 의사결정에 필요한 정보가 부족하다.

---

## Step 16. 타임라인 정보 구체화

### 16-1. 현재 상태 분석

`timeline_items.json`에 **20개 항목** (Week 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 35, 36, 37, 38, 39, 40).

**문제점:**

| 문제 | 예시 | 영향 |
|------|------|------|
| **빈 주차가 많음** | Week 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33 (15개 주차 비어있음) | 유저가 해당 주차에 진입하면 "이번 주는 할 일이 없어요" → 이탈 |
| **초기(1~3주) 없음** | Week 1~3 타임라인 항목 없음 | 극초기 임신 확인 전 유입 유저 대응 불가 |
| **description이 밀도 높은 단일 문단** | Week 34: "이슬, 진통, 파수 등 입원 신호를 숙지한다. 병원 이동 경로, 야간 응급실 위치를 확인하고..." (한 문장에 6가지 할일) | 읽기 어렵고, 체크리스트 항목과 중복 |
| **type 분류가 UI에 미반영** | `prep`, `shopping`, `admin`, `education`, `wellbeing` 5개 타입 존재 | 데이터는 있지만 타임라인 카드에서 시각적 구분 없음 |

### 16-2. 개선 사항

#### A. 빈 주차 채우기 — 간단한 안내 항목 추가

모든 빈 주차에 대형 타임라인 이벤트를 만들 필요는 없음. **주차별 한 줄 안내**로 빈 주차를 채운다:

| 추가할 주차 | title | description | type |
|------------|-------|-------------|------|
| Week 5 | 임신 초기 생활 습관 점검 | 카페인 줄이기, 엽산 복용 확인, 음주·흡연 완전 중단. | wellbeing |
| Week 7 | 첫 초음파 검사 준비 | 6~8주 사이 첫 초음파로 태아 심박 확인. 검사 일정을 산부인과에 확인한다. | admin |
| Week 9 | NIPT/융모막 검사 상담 | 비침습적 산전검사(NIPT) 시행 여부를 의사와 상담한다. 10주 이후 가능. | admin |
| Week 11 | 1차 통합선별검사 시기 | 11~13주 사이 1차 기형아 검사(NT 초음파 + 혈액검사)를 받는다. | admin |
| Week 13 | 임신 초기 → 중기 전환 | 입덧이 줄어들기 시작하는 시기. 체중 변화를 기록하기 시작한다. | wellbeing |
| Week 15 | 2차 기형아 검사 준비 | 15~20주 사이 쿼드 검사(모체 혈청 선별검사)를 받는다. | admin |
| Week 17 | 태동 느끼기 시작 | 초산모는 18~20주경 첫 태동을 느낄 수 있다. 태동일지를 시작해본다. | wellbeing |
| Week 19 | 정밀 초음파 예약 확인 | 20~22주 정밀 초음파(anomaly scan)를 위해 일정을 확인한다. | admin |
| Week 21 | 임산부 운동 시작 | 의사 상담 후 임산부 요가, 수영, 걷기 등 안전한 운동을 시작한다. | wellbeing |
| Week 23 | 임신성 당뇨 검사 준비 | 24~28주 GDM 선별검사를 위해 일정을 확인한다. 검사 전 금식 필요 여부 확인. | admin |
| Week 25 | 출산 교육 탐색 | 병원 또는 보건소의 출산 준비 교육(라마즈, 모유수유 등) 일정을 확인한다. | education |
| Week 27 | 3차 기초검사 및 Rh 확인 | 빈혈, 소변, 혈당 등 정기 검사. Rh- 산모는 Anti-D 투여 시기 확인. | admin |
| Week 29 | 산후도우미 신청 확인 | 정부 산후도우미 바우처 신청이 완료되었는지 확인한다. 대기 기간이 길 수 있으므로 일찍 확인. | admin |
| Week 31 | 분만 방법 상담 | 자연분만 vs 제왕절개 등 분만 계획을 담당의와 상담한다. 분만실 투어가 가능한지도 확인. | education |
| Week 33 | 신생아 용품 최종 점검 | 배냇옷, 속싸개, 기저귀, 물티슈 등 신생아 소모품이 충분한지 확인한다. | prep |

→ 기존 20개 + 신규 15개 = **35개 항목으로 Week 5~40 커버리지 95%+**

#### B. description 포맷 개선

긴 description을 **핵심 1문장 + 체크리스트 연동 안내**로 정비:

```json
// AS-IS
{
  "description": "산모용, 아기용, 보호자용 물품을 나눠 정리한다. 젖병, 소독기, 수유쿠션, 속싸개 등 신생아 용품도 이때까지 준비를 마친다. 출산전후휴가도 신청한다."
}

// TO-BE
{
  "description": "산모용·아기용·보호자용으로 나눠 입원 가방을 정리한다. 아래 체크리스트에서 하나씩 확인하세요."
}
```

→ 상세 항목은 이미 `linked_checklist_ids`로 연결된 체크리스트에 있으므로, description에서 중복 나열하지 않음.

#### C. 타임라인 카드에 type 아이콘 표시

현재 `type` 필드가 UI에 반영되지 않음. 타임라인 아코디언 카드 헤더에 type별 아이콘/라벨 추가:

| type | 아이콘 | 라벨 | 색상 |
|------|--------|------|------|
| `prep` | 📦 | 준비 | `#FFD4DE` |
| `shopping` | 🛒 | 쇼핑 | `#FFF4D4` |
| `admin` | 📋 | 행정 | `#E0F0FF` |
| `education` | 📚 | 교육 | `#E4D6F0` |
| `wellbeing` | 💚 | 건강 | `#D0EDE2` |

```
┌──────────────────────────────────┐
│ ● 32주  📦 준비  입원 가방 준비 시작 │
│         ~~~~ ← type 배지          │
└──────────────────────────────────┘
```

### 16-3. 수정 파일

| 파일 | 변경 |
|------|------|
| `src/data/timeline_items.json` | 15개 빈 주차 항목 추가, 기존 description 정비 |
| `src/components/timeline/TimelineAccordionCard.tsx` | type 아이콘/배지 UI 추가 |
| `src/lib/constants.ts` | `TIMELINE_TYPE_CONFIG` (아이콘/라벨/색상 매핑) 추가 |

### 16-4. 주의사항

- 새 항목의 `id`는 기존 패턴(`week_NN_slug`) 따름
- 새 항목의 `linked_checklist_ids`는 빈 배열 `[]`로 시작 — 체크리스트 매핑은 별도 작업
- `seo_slug`도 기존 패턴(`week-NN`) 따름
- description 정비 시 기존 SEO 인덱싱된 텍스트를 완전 삭제하지 않도록 핵심 키워드 유지

---

## Step 17. 베이비페어 정보 구체화 & 업데이트

### 17-1. 현재 상태 분석

`babyfair_events.json`에 **30+개 행사** (2026년 1월~12월).

**현재 데이터 필드:**
```json
{
  "slug": "cobe-coex-2026-04",
  "name": "코베 서울 베이비페어 1차",
  "venue_name": "코엑스(COEX)",
  "city": "서울",
  "start_date": "2026-04-09",
  "end_date": "2026-04-12",
  "official_url": "https://www.cobe.co.kr",
  "review_status": "approved"
}
```

**문제점:**

| 문제 | 설명 | 유저 영향 |
|------|------|----------|
| **정보가 너무 최소** | 날짜·장소·링크만 있음 | "이 페어 가볼 만한가?"를 판단할 수 없음 |
| **규모/특징 정보 없음** | 코베(대형)와 지역 소형 페어가 동일하게 표시됨 | 우선순위 판단 불가 |
| **입장료 정보 없음** | 대부분 사전등록 무료인데 명시 안 됨 | 유저가 공식 URL 가서 직접 확인해야 함 |
| **주차/교통 정보 없음** | 대형 페어는 주차가 핵심 의사결정 요소 | — |
| **사전등록 링크 없음** | `official_url`은 메인 페이지, 사전등록은 별도 페이지인 경우 많음 | 유저가 직접 찾아야 함 |
| **과거 행사에 후기 정보 없음** | 지난 행사 탭이 있지만 참고할 정보가 없음 | "지난 행사" 탭 존재 의미 약함 |

### 17-2. 데이터 구조 확장

```ts
// src/types/babyfair.ts — 필드 추가

export interface BabyfairEvent {
  // 기존 필드
  slug: string;
  name: string;
  venue_name: string;
  city: string;
  start_date: string;
  end_date: string;
  official_url: string;
  review_status: string;

  // 신규 필드 (모두 optional — 점진적으로 채움)
  scale?: "large" | "medium" | "small";     // 규모
  admission?: string;                       // 입장 안내 (예: "사전등록 무료 / 현장 5,000원")
  pre_register_url?: string;                // 사전등록 링크 (official_url과 다를 수 있음)
  parking?: string;                         // 주차 안내 (예: "코엑스 주차장 이용, 3시간 무료")
  highlights?: string[];                    // 주요 특징/브랜드 (예: ["보보보", "엘라바", "스토케"])
  tip?: string;                             // 만든이의 팁 (브랜딩 연계)
  operating_hours?: string;                 // 운영 시간 (예: "10:00~18:00 (마지막날 17:00)")
}
```

### 17-3. 데이터 채우기 — 우선순위 기반

**1차 (즉시):** 2026년 4월 이후 예정 행사에 `scale`, `admission`, `operating_hours` 추가
**2차 (점진적):** 대형 행사(코베, 베페, 맘스홀릭)에 `highlights`, `parking`, `pre_register_url` 추가
**3차 (경험 후):** 직접 방문한 행사에 `tip` 추가 (브랜딩 연계)

#### 주요 행사 데이터 보강 예시

```json
{
  "slug": "cobe-coex-2026-04",
  "name": "코베 서울 베이비페어 1차",
  "venue_name": "코엑스(COEX)",
  "city": "서울",
  "start_date": "2026-04-09",
  "end_date": "2026-04-12",
  "official_url": "https://www.cobe.co.kr",
  "review_status": "approved",
  "scale": "large",
  "admission": "사전등록 무료 / 현장 5,000원",
  "pre_register_url": "https://www.cobe.co.kr/register",
  "parking": "코엑스 지하주차장 (3시간 무료, 이후 10분당 1,000원)",
  "operating_hours": "10:00~18:00 (마지막날 17:00 마감)",
  "highlights": ["200+ 브랜드 참여", "체험존", "사은품 증정"]
}
```

```json
{
  "slug": "befe-49th-2026-04",
  "name": "제49회 베페(BeFe) 베이비페어",
  "venue_name": "코엑스(COEX)",
  "city": "서울",
  "start_date": "2026-04-23",
  "end_date": "2026-04-26",
  "official_url": "https://www.befe.co.kr/",
  "review_status": "approved",
  "scale": "large",
  "admission": "사전등록 무료",
  "operating_hours": "10:00~18:00",
  "highlights": ["국내 최대 규모", "신제품 런칭", "육아 세미나"]
}
```

### 17-4. UI 변경 — BabyfairCard 확장

현재 카드가 이름·날짜·장소만 표시. 확장 필드가 있을 때 추가 정보를 노출:

```
┌──────────────────────────────────┐
│ 🏷 대형  코베 서울 베이비페어 1차   │  ← scale 배지 + 이름
│                                  │
│ 📅 2026.04.09 (목) ~ 04.12 (일)  │
│ 📍 코엑스(COEX)                  │
│ 🕐 10:00~18:00                   │  ← operating_hours (있을 때만)
│ 🎟️ 사전등록 무료 / 현장 5,000원   │  ← admission (있을 때만)
│ 🅿️ 코엑스 지하주차장 3시간 무료   │  ← parking (있을 때만)
│                                  │
│ · 200+ 브랜드 참여                │  ← highlights (있을 때만)
│ · 체험존                         │
│ · 사은품 증정                    │
│                                  │
│ 💬 "첫 베이비페어라면 코베부터    │  ← tip (있을 때만, 브랜딩)
│     추천. 규모가 커서 비교하기    │
│     좋아요."                     │
│                                  │
│ [사전등록 →]  [공식 사이트 →]    │  ← pre_register_url + official_url
│                                  │
│                      D-3일 남음   │  ← 진행중/예정 탭에서만 (Step 6)
└──────────────────────────────────┘
```

**scale 배지 스타일:**
| scale | 라벨 | 배경색 |
|-------|------|--------|
| `large` | 대형 | `bg-[#FFD4DE]` |
| `medium` | 중형 | `bg-[#FFF4D4]` |
| `small` | 소형 | `bg-[#E0F0FF]` |
| 없음 | 표시 안 함 | — |

**조건부 렌더링 원칙:**
- 모든 신규 필드는 optional → 값이 없으면 해당 줄 자체를 렌더하지 않음
- 기존 데이터(날짜·장소·공식링크)만 있는 카드도 정상 작동해야 함 (하위 호환)

### 17-5. 데이터 최신화 프로세스

베이비페어 일정은 **주최사 사정으로 변경/취소될 수 있음**. 정기 업데이트 프로세스 필요:

1. **월 1회** 주요 주최사 사이트 확인 (코베, 베페, 맘스홀릭, 서울베이비키즈페어)
2. 신규 행사 추가 / 날짜 변경 반영 / 취소 행사 삭제
3. 지난 행사에 `tip` 추가 (직접 방문 시)

→ 이 프로세스는 코드 변경이 아닌 **데이터 운영** 문제. CLAUDE.md나 별도 가이드에 프로세스 명시하는 것을 권장.

### 17-6. 수정 파일

| 파일 | 변경 |
|------|------|
| `src/types/babyfair.ts` | 신규 optional 필드 6개 추가 |
| `src/data/babyfair_events.json` | 주요 행사에 확장 필드 데이터 추가 (1차: 4월 이후 행사) |
| `src/components/babyfair/BabyfairCard.tsx` | 확장 필드 조건부 렌더링, scale 배지, 사전등록 버튼 |
| `src/components/babyfair/BabyfairContainer.tsx` | scale 필터 추가 (선택사항 — 행사 수가 많아지면) |

### 17-7. 주의사항

- `pre_register_url`은 시기에 따라 유효하지 않을 수 있음 → 링크 깨짐 시 `official_url`로 fallback
- `highlights`가 너무 많으면 카드가 길어짐 → 최대 3개까지만 표시, 나머지는 "외 N개"
- `tip` 필드는 만든이 브랜딩과 직결 → 직접 경험하지 않은 행사에는 넣지 않음
- 데이터 출처를 명시하지 않으면 신뢰도 문제 → `admission`, `parking` 등은 공식 사이트 기준으로만 기재

---

## Step 18. 종합: 수정 파일 목록

### New Files

| File | Purpose |
|------|---------|
| `src/components/onboarding/OnboardingFlow.tsx` | 온보딩 3단계 컨테이너 |
| `src/components/onboarding/WelcomeStep.tsx` | Step 1 웰컴 |
| `src/components/onboarding/DueDateStep.tsx` | Step 2 예정일 |
| `src/components/onboarding/ReadyStep.tsx` | Step 3 데이터 안내 |
| `src/components/home/DashboardCard.tsx` | 미니 대시보드 카드 컴포넌트 |
| `src/components/layout/StickyHeader.tsx` | Sticky 헤더 |

### Modified Files

| File | Changes | Step |
|------|---------|------|
| `src/lib/constants.ts` | `BRAND_PHASE`, `BRAND_COPY`, `CREATOR_DUE_DATE`, `TIMELINE_TYPE_CONFIG` 추가 | 10, 12, 13, 16 |
| `src/components/home/HomeContent.tsx` | 온보딩 분기, 미니 대시보드, CTA 강화, 재방문 메시지, 히어로 카피 변경 | 2, 3, 10 |
| `src/app/page.tsx` | babyfair/articles 데이터 props 전달 | 3 |
| `src/app/layout.tsx` | StickyHeader 삽입, SEO 메타 태그 브랜딩 | 4, 11 |
| `src/app/about/page.tsx` | 전면 리뉴얼 — 스토리텔링 구조, Client Component, 주차 자동 계산 | 13 |
| `src/app/contact/page.tsx` | 타이틀/카피/metadata 톤 변경 | 15 |
| `src/app/timeline/page.tsx` | metadata description 변경 (선택) | 11 |
| `src/app/baby-fair/page.tsx` | metadata description 변경 (선택) | 11 |
| `src/components/onboarding/WelcomeStep.tsx` | h1, 서브텍스트, highlights 배열 브랜딩 톤 변경 | 12 |
| `src/components/onboarding/ReadyStep.tsx` | 타이틀 카피 변경 | 12 |
| `src/components/timeline/TimelineContainer.tsx` | 첫 체크 배너, 마일스톤, UnifiedAddForm props | 2, 9 |
| `src/components/timeline/TimelineAccordionCard.tsx` | 관련 글 링크, 주차 완료 아이콘, type 아이콘/배지 | 5, 9, 16 |
| `src/components/timeline/UnifiedAddForm.tsx` | 주차 존재 검증 + AlertDialog | 8 |
| `src/components/timeline/WeekChecklistSection.tsx` | 첫 체크 이벤트 | 2 |
| `src/components/babyfair/BabyfairContainer.tsx` | 3탭 분리, 기본 탭 로직, 연도 라벨, scale 필터 (선택) | 6, 17 |
| `src/components/babyfair/BabyfairCard.tsx` | "D-N일 남음" 배지, 확장 필드 UI (scale/입장료/주차/highlights/tip) | 6, 17 |
| `src/components/articles/ArticleDetail.tsx` | 타임라인 CTA 링크, authorNote 카드 UI | 5, 14 |
| `src/data/timeline_items.json` | `linked_article_slugs` 필드 추가, 15개 빈 주차 항목 추가, description 정비 | 5, 16 |
| `src/data/babyfair_events.json` | 주요 행사에 확장 필드 데이터 추가 (scale/admission/parking/highlights/tip) | 17 |
| `src/content/articles/*.md` | `linked_timeline_weeks`, `authorNote` frontmatter 추가 | 5, 14 |
| `src/types/timeline.ts` | `linked_article_slugs?: string[]` | 5 |
| `src/types/article.ts` | `linked_timeline_weeks?: number[]`, `authorNote?: string` | 5, 14 |
| `src/types/babyfair.ts` | 신규 optional 필드 6개 (scale, admission, pre_register_url, parking, highlights, tip) | 17 |
| `src/lib/articles.ts` | linked_timeline_weeks, authorNote 파싱 | 5, 14 |

---

## Implementation Steps & 우선순위

### UX 개선 + 리텐션 (Step 1~9)

| 순위 | Step | 내용 | 임팩트 | 난이도 | 의존성 | 상태 |
|------|------|------|--------|--------|--------|------|
| 1 | Step 1 | 온보딩 플로우 | 🔴 높음 | 중 | 없음 | ✅ 완료 (4/6) |
| 2 | Step 3 | 홈 대시보드 개편 | 🔴 높음 | 중 | 없음 | ✅ 완료 (4/6) |
| 3 | Step 2 | 타임라인 유도 + 보존 가이드 | 🔴 높음 | 낮 | 없음 | ✅ 완료 (4/6) |
| 4 | Step 8 | 버그 수정 (주차 미존재 할일) | 🟡 중간 | 낮 | 없음 | ✅ 완료 (4/8) |
| 5 | Step 6 | 베이비페어 3분류 + 연도 | 🟡 중간 | 낮 | 없음 | ✅ 완료 (4/8) |
| 6 | Step 5 | 크로스 링크 | 🟡 중간 | 중 | 없음 | ✅ 완료 (4/7) |
| 7 | Step 4 | Sticky 헤더 | 🟢 낮음 | 낮 | 없음 | ✅ 완료 (4/6) |
| 8 | Step 7 | 체중관리 접근성 | 🟡 중간 | 낮 | Step 3 | ✅ 완료 (4/8) |
| 9 | Step 9 | 달성감/검색/영상연결 | 🟡 중간 | 중 | Step 5 | ✅ 완료 (4/8, 9-1만. 9-2/9-3은 Phase 3) |

### 브랜딩: "초산 개발자" 아이덴티티 (Step 10~15)

| 순위 | Step | 내용 | 임팩트 | 난이도 | 의존성 | 상태 |
|------|------|------|--------|--------|--------|------|
| 10 | Step 10 | 히어로 카피 & 톤 리뉴얼 | 🔴 높음 | 낮 | 없음 | ✅ 완료 (4/8) |
| 11 | Step 11 | SEO 메타 태그 브랜딩 | 🔴 높음 | 낮 | 없음 | ✅ 완료 (4/8) |
| 12 | Step 12 | 온보딩 톤 변경 | 🟡 중간 | 낮 | Step 1 완료 필요 | ✅ 완료 (4/8) |
| 13 | Step 13 | About → "만든 사람" 스토리텔링 | 🟡 중간 | 중 | Step 10 (BRAND_COPY 필요) | ✅ 완료 (4/9) |
| 14 | Step 14 | 아티클 authorNote | 🟡 중간 | 중 | 없음 | ✅ 완료 (4/12) |
| 15 | Step 15 | Contact 톤 변경 | 🟢 낮음 | 낮 | 없음 | ✅ 완료 (4/9) |

### 콘텐츠 강화: 타임라인 & 베이비페어 (Step 16~17)

| 순위 | Step | 내용 | 임팩트 | 난이도 | 의존성 | 상태 |
|------|------|------|--------|--------|--------|------|
| 16 | Step 16 | 타임라인 정보 구체화 (빈 주차 채우기, type 배지) | 🔴 높음 | 중 | 없음 | ✅ 완료 (4/9) |
| 17 | Step 17 | 베이비페어 정보 구체화 (확장 필드, UI 보강) | 🟡 중간 | 중 | Step 6 완료 권장 | ✅ 완료 (4/10) |

**병렬 가능:**
- Step 10/11/15 (카피 변경) — 모두 독립, 동시 작업 가능
- Step 14 (authorNote) — 다른 브랜딩 스텝과 독립
- Step 16 (타임라인 구체화) — 브랜딩과 독립, UX 스텝과도 독립
- Step 12/13 — Step 10의 `BRAND_COPY` 상수 정의 후 진행

---

## 일정 (Timeline)

| 기간 | 작업 | 비고 |
|------|------|------|
| **Week 1 (4/7~4/11)** | ~~Step 5: 크로스 링크~~ | ✅ 완료 (4/7) |
| Week 1 | ~~Step 6: 베이비페어 3분류 + 연도~~ | ✅ 완료 (4/8) |
| Week 1 | ~~Step 7: 체중관리 접근성~~ | ✅ 완료 (4/8) |
| Week 1 | ~~Step 8: 버그 수정~~ | ✅ 완료 (4/8) |
| Week 1 | ~~Step 9: 달성감/마일스톤~~ | ✅ 완료 (4/8, 9-1만) |
| Week 1 | ~~Step 10: 히어로 카피 변경 + BRAND_COPY 상수~~ | ✅ 완료 (4/8) |
| Week 1 | ~~Step 11: SEO 메타 태그~~ | ✅ 완료 (4/8) |
| Week 1 | ~~Step 12: 온보딩 톤 변경~~ | ✅ 완료 (4/8) |
| Week 1 | ~~Step 15: Contact 톤 변경~~ | ✅ 완료 (4/9) |
| Week 1 | ~~Step 13: About 스토리텔링 리뉴얼~~ | ✅ 완료 (4/9) |
| Week 1 | ~~Step 16: 타임라인 빈 주차 채우기 + type 배지~~ | ✅ 완료 (4/9) |
| **Week 2 (4/14~4/18)** | ~~Step 17: 베이비페어 정보 구체화~~ | ✅ 완료 (4/10) |
| Week 2 | ~~Step 14: 아티클 authorNote~~ | ✅ 완료 (4/12) |
| **Week 2 (4/13)** | QA: 284 E2E 전체 통과, 레거시 테스트 27개 수정 | ✅ 완료 |
| **Week 3 (4/21~4/25)** | 배포 | |

---

## 완료 조건

> 검증일: 2026-04-12

### UX 개선 (기존)

| # | 조건 | 검증 방법 | 상태 |
|---|------|----------|------|
| 1 | 첫 방문 시 3단계 온보딩 플로우 표시 | E2E | ✅ |
| 2 | 온보딩 완료 후 `/timeline` 이동 | E2E | ✅ |
| 3 | 온보딩 완료 후 재방문 시 온보딩 미표시 | E2E | ✅ |
| 4 | 홈 대시보드 Feature Grid가 미니 대시보드 카드로 변경 | E2E | ✅ |
| 5 | 홈 타임라인 CTA에 현재 주차 + 미완료 수 표시 | E2E | ✅ |
| 6 | 첫 체크리스트 체크 시 데이터 보존 안내 배너 1회 표시 | E2E | ✅ |
| 7 | 재방문 유저에게 "돌아오셨군요" 메시지 표시 | E2E | ✅ |
| 8 | Sticky 헤더가 홈 제외 모든 페이지에 표시 | E2E | ✅ |
| 9 | 베이비페어가 3탭(진행중/예정/지난)으로 분리 | E2E | ✅ |
| 10 | 베이비페어 서브타이틀에 연도 표시 | E2E | ✅ |
| 11 | 진행 중 행사에 "D-N일 남음" 배지 표시 | E2E | ✅ |
| 12 | 타임라인 주차 카드에 관련 블로그 링크 표시 | E2E | ✅ |
| 13 | 블로그 상세에 타임라인 CTA 표시 | E2E | ✅ |
| 14 | 존재하지 않는 주차에 할일 추가 시 알럿 표시 | E2E | ✅ |
| 15 | 알럿에서 "주차 추가" 선택 시 타임라인+체크리스트 동시 생성 | E2E | ✅ |
| 16 | 주차 전체 완료 시 ✅ 아이콘 표시 | E2E | ✅ |

### 브랜딩

| # | 조건 | 검증 방법 | 상태 |
|---|------|----------|------|
| 17 | 히어로 서브 카피가 "답답해서 직접 만들었습니다"로 변경 | E2E | ✅ |
| 18 | 히어로 하단에 "초산 임신 중인 개발자의 출산 준비 기록" 캡션 표시 | E2E | ✅ |
| 19 | 하단 모티베이션 "같이 준비하면 덜 막막하니까요"로 변경 | E2E | ✅ |
| 20 | 루트 `<title>` 에 "초산 개발자가 직접 만든" 포함 | E2E | ✅ |
| 21 | 온보딩 WelcomeStep에 "저도 초산이라..." 서브 텍스트 표시 | E2E | ✅ |
| 22 | About 페이지 타이틀 "만든 사람", 스토리텔링 섹션 존재 | E2E | ✅ |
| 23 | About 페이지에 만든이 현재 임신 주차 자동 표시 | E2E | ✅ |
| 24 | Contact 페이지 톤 변경 ("혼자 만들다 보니...") | E2E | ✅ |
| 25 | authorNote가 있는 아티클에 "만든이의 한마디" 카드 표시 | E2E | ✅ |
| 26 | authorNote가 없는 아티클에는 카드 미표시 | E2E | ✅ |
| 27 | `BRAND_PHASE` 변경 시 히어로/온보딩/About 카피 자동 전환 | 수동 검증 | ✅ |

### 콘텐츠 강화

| # | 조건 | 검증 방법 | 상태 |
|---|------|----------|------|
| 28 | 타임라인 빈 주차 15개에 항목 추가 (Week 5~33 홀수 주차) | 데이터 검증 | ✅ |
| 29 | 타임라인 카드에 type 아이콘/배지 표시 | E2E | ✅ |
| 30 | 베이비페어 카드에 scale 배지 (대형/중형/소형) 조건부 표시 | E2E | ✅ |
| 31 | 베이비페어 카드에 입장료/운영시간/주차 정보 조건부 표시 | E2E | ✅ |
| 32 | 베이비페어 사전등록 버튼이 `pre_register_url` 있을 때만 표시 | E2E | ✅ |
| 33 | 확장 필드 없는 기존 베이비페어 카드가 정상 렌더링 (하위 호환) | E2E | ✅ |

### 공통

| # | 조건 | 검증 방법 | 상태 |
|---|------|----------|------|
| 34 | 빌드 성공 (`next build`) | CI | ✅ |
| 35 | 기존 + 신규 E2E 테스트 통과 | CI | ✅ |

> **35/35 완료 조건 충족 (2026-04-13 QA 통과)**
> 284 E2E 테스트 전체 통과, 레거시 테스트 27개 Phase 2.5 변경사항에 맞게 수정

---

## 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 온보딩이 오히려 이탈 유발 | 첫 전환율 하락 | "나중에 입력할게요" 스킵 옵션 필수. A/B 테스트(GA4 이벤트)로 측정 |
| 홈 대시보드 데이터 로딩 지연 | 초기 로딩 느림 | babyfair/articles는 빌드 시 정적 props, store 데이터는 hydration 후 표시 |
| Sticky 헤더 + BottomNav 동시 고정 | 모바일 콘텐츠 영역 축소 | 헤더 44px + 네비 64px = 108px. 스크롤 시 헤더 숨김으로 완화 |
| 크로스 링크 매핑 유지보수 | 블로그 추가 시 매핑 누락 | linked_article_slugs가 없는 주차는 링크 미표시 (graceful degradation) |
| 버그 수정(Step 8)에서 timelineItems props 전달 | UnifiedAddForm 인터페이스 변경 | TimelineContainer에서 기존 데이터 전달, 타입 안전하게 처리 |
| 브랜딩 카피 "임신 중" 유통기한 | 출산 후 카피가 과거형 | `BRAND_PHASE` 상수 전환 구조로 1분 내 대응 가능 |
| About 페이지 Client Component 전환 | metadata export 불가 | `generateMetadata` 또는 별도 layout.tsx로 분리 |
| 베이비페어 확장 필드 데이터 수집 비용 | 주최사별 확인 필요 | 1차로 대형 행사만 채우고, 나머지는 점진적 보강 |
| 타임라인 항목 35개로 증가 | 스크롤 길이 증가 | 이미 아코디언 접힘 구조이므로 UX 영향 미미. 현재 주차 자동 펼침으로 대응 |
| `pre_register_url` 링크 깨짐 | 사전등록 기간 종료 시 404 | `official_url`로 fallback 처리, 데이터 운영 시 정기 확인 |
