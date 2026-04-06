# Phase 2.5: UX 개선 + 리텐션 강화 — Development Plan

> Phase 2 기록: [phase-2/plan.md](../phase-2/plan.md)
> Date: 2026-04-05
> 목표 완료: 2026-05-15
> Status: 🚧 구현 진행 중

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

## Step 10. 종합: 수정 파일 목록

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

| File | Changes |
|------|---------|
| `src/components/home/HomeContent.tsx` | 온보딩 분기, 미니 대시보드, CTA 강화, 재방문 메시지 |
| `src/app/page.tsx` | babyfair/articles 데이터 props 전달 |
| `src/app/layout.tsx` | StickyHeader 삽입 |
| `src/components/timeline/TimelineContainer.tsx` | 첫 체크 배너, 마일스톤, UnifiedAddForm props |
| `src/components/timeline/TimelineAccordionCard.tsx` | 관련 글 링크, 주차 완료 아이콘 |
| `src/components/timeline/UnifiedAddForm.tsx` | 주차 존재 검증 + AlertDialog |
| `src/components/timeline/WeekChecklistSection.tsx` | 첫 체크 이벤트 |
| `src/components/babyfair/BabyfairContainer.tsx` | 3탭 분리, 기본 탭 로직, 연도 라벨 |
| `src/components/babyfair/BabyfairCard.tsx` | "D-N일 남음" 배지 |
| `src/components/articles/ArticleDetail.tsx` | 타임라인 CTA 링크 |
| `src/data/timeline_items.json` | `linked_article_slugs` 필드 추가 |
| `src/content/articles/*.md` | `linked_timeline_weeks` frontmatter 추가 |
| `src/types/timeline.ts` | `linked_article_slugs?: string[]` |
| `src/types/article.ts` | `linked_timeline_weeks?: number[]` |
| `src/lib/articles.ts` | linked_timeline_weeks 파싱 |

---

## Implementation Steps & 우선순위

| 순위 | Step | 내용 | 임팩트 | 난이도 | 의존성 | 상태 |
|------|------|------|--------|--------|--------|------|
| 1 | Step 1 | 온보딩 플로우 | 🔴 높음 | 중 | 없음 | ✅ 완료 (4/6) |
| 2 | Step 3 | 홈 대시보드 개편 | 🔴 높음 | 중 | 없음 | ✅ 완료 (4/6) |
| 3 | Step 2 | 타임라인 유도 + 보존 가이드 | 🔴 높음 | 낮 | 없음 | ✅ 완료 (4/6) |
| 4 | Step 8 | 버그 수정 (주차 미존재 할일) | 🟡 중간 | 낮 | 없음 | |
| 5 | Step 6 | 베이비페어 3분류 + 연도 | 🟡 중간 | 낮 | 없음 | |
| 6 | Step 5 | 크로스 링크 | 🟡 중간 | 중 | 없음 | |
| 7 | Step 4 | Sticky 헤더 | 🟢 낮음 | 낮 | 없음 | ✅ 완료 (4/6) |
| 8 | Step 7 | 체중관리 접근성 | 🟡 중간 | 낮 | Step 3 | |
| 9 | Step 9 | 달성감/검색/영상연결 | 🟡 중간 | 중 | Step 5 | |

**병렬 가능:** Step 1/2/3(홈+온보딩), Step 4(헤더), Step 6(베이비페어), Step 8(버그)는 독립 작업

---

## 일정 (Timeline)

| 기간 | 작업 | 비고 |
|------|------|------|
| Week 1 (4/7~4/11) | Step 8: 버그 수정 | 빠른 수정 |
| Week 1 | Step 6: 베이비페어 3분류 + 연도 | 병렬 |
| Week 1 | Step 4: Sticky 헤더 | 병렬 |
| Week 2 (4/14~4/18) | Step 1: 온보딩 플로우 | 핵심 |
| Week 2 | Step 2: 타임라인 유도 + 보존 가이드 | 병렬 |
| Week 3 (4/21~4/25) | Step 3: 홈 대시보드 개편 | 핵심 |
| Week 3 | Step 7: 체중관리 접근성 | Step 3 완료 후 |
| Week 4 (4/28~5/2) | Step 5: 크로스 링크 | 데이터 변경 포함 |
| Week 5 (5/5~5/9) | Step 9: 달성감/마일스톤 | 선택 사항 포함 |
| Week 5 | E2E 테스트 업데이트 | 전체 변경분 |
| 5/12~5/15 | QA + 배포 | |

---

## 완료 조건

| # | 조건 | 검증 방법 |
|---|------|----------|
| 1 | 첫 방문 시 3단계 온보딩 플로우 표시 | E2E |
| 2 | 온보딩 완료 후 `/timeline` 이동 | E2E |
| 3 | 온보딩 완료 후 재방문 시 온보딩 미표시 | E2E |
| 4 | 홈 대시보드 Feature Grid가 미니 대시보드 카드로 변경 | E2E |
| 5 | 홈 타임라인 CTA에 현재 주차 + 미완료 수 표시 | E2E |
| 6 | 첫 체크리스트 체크 시 데이터 보존 안내 배너 1회 표시 | E2E |
| 7 | 재방문 유저에게 "돌아오셨군요" 메시지 표시 | E2E |
| 8 | Sticky 헤더가 홈 제외 모든 페이지에 표시 | E2E |
| 9 | 베이비페어가 3탭(진행중/예정/지난)으로 분리 | E2E |
| 10 | 베이비페어 서브타이틀에 연도 표시 | E2E |
| 11 | 진행 중 행사에 "D-N일 남음" 배지 표시 | E2E |
| 12 | 타임라인 주차 카드에 관련 블로그 링크 표시 | E2E |
| 13 | 블로그 상세에 타임라인 CTA 표시 | E2E |
| 14 | 존재하지 않는 주차에 할일 추가 시 알럿 표시 | E2E |
| 15 | 알럿에서 "주차 추가" 선택 시 타임라인+체크리스트 동시 생성 | E2E |
| 16 | 주차 전체 완료 시 ✅ 아이콘 표시 | E2E |
| 17 | 빌드 성공 (`next build`) | CI |
| 18 | 기존 + 신규 E2E 테스트 통과 | CI |

---

## 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 온보딩이 오히려 이탈 유발 | 첫 전환율 하락 | "나중에 입력할게요" 스킵 옵션 필수. A/B 테스트(GA4 이벤트)로 측정 |
| 홈 대시보드 데이터 로딩 지연 | 초기 로딩 느림 | babyfair/articles는 빌드 시 정적 props, store 데이터는 hydration 후 표시 |
| Sticky 헤더 + BottomNav 동시 고정 | 모바일 콘텐츠 영역 축소 | 헤더 44px + 네비 64px = 108px. 스크롤 시 헤더 숨김으로 완화 |
| 크로스 링크 매핑 유지보수 | 블로그 추가 시 매핑 누락 | linked_article_slugs가 없는 주차는 링크 미표시 (graceful degradation) |
| 버그 수정(Step 8)에서 timelineItems props 전달 | UnifiedAddForm 인터페이스 변경 | TimelineContainer에서 기존 데이터 전달, 타입 안전하게 처리 |
