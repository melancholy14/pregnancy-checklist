# Phase 4: 체크리스트 허브 확장 + 정보 탭 통합 — Development Plan

> Phase 3 기록: [../phase-3/plan.md](../phase-3/plan.md)
> Date: 2026-04-27
> 목표 완료: 2026-05-18
> Status: 🚧 진행 중 (Step 1·2 완료, Step 3·4·5 대기)
> Last Updated: 2026-05-02

## 진행 현황

| Step | 상태 | 산출물 |
| ---- | ---- | -------- |
| Step 1. 체크리스트 허브 확장 | ✅ 완료 (2026-05-01) | [../implementation/phase-4-step-1-checklist-hub-impl.md](../implementation/phase-4-step-1-checklist-hub-impl.md), [../review/phase-4-step-1-checklist-hub-review.md](../review/phase-4-step-1-checklist-hub-review.md), [e2e/phase-4-step-1-checklist-hub.spec.ts](../../e2e/phase-4-step-1-checklist-hub.spec.ts) |
| Step 2. 정보 탭 통합 | ✅ 완료 (2026-05-02) | [../info-tab-integration/README.md](../info-tab-integration/README.md), [../plan/info-tab-integration-plan.md](../plan/info-tab-integration-plan.md), [e2e/info-tab-integration.spec.ts](../../e2e/info-tab-integration.spec.ts) |
| Step 3. 관련 콘텐츠 추천 | ⏳ 대기 | — |
| Step 4. 공유 기능 | ⏳ 대기 | — |
| Step 5. 크로스링크 스크립트 | ⏳ 대기 | — |

### Step 2 완료 시 함께 정리된 사항

- BottomNav 5탭 → 4탭으로 축소(`홈/체크리스트/베이비페어/정보`). 5탭 확장(체중·더보기)은 Phase 5 이월
- 영상 채널 보기 모드·sub-category 필터는 `/info`에서 의도적으로 제외 (Phase 5 채널 디렉토리로 부활)
- 통합 태그 13종(동의어 흡수 매핑 포함) 도입. 옵션 B(2단계 계층)·옵션 D(큐레이션 컬렉션)·front matter 일괄 마이그레이션은 Phase 5 이월
- 내부 링크 5곳 + sitemap.xml + 검색 인덱스를 `/info` 경로로 일괄 갱신해 리다이렉트 깜빡임 제거
- `/info` 페이지의 헤더·`PageDescription`을 Suspense 밖으로 이동 — JS 비활성 환경(SEO 봇)에서도 노출
- 기존 e2e 11개 스펙 마이그레이션(URL/탭 갱신) + 폐기된 기능 테스트 2개 파일 삭제 (`videos.spec.ts`, `video-channel-links.spec.ts`)
- `scripts/lighthouse-check.sh` PAGES 배열을 현재 라우트로 교체

---

## Overview

Phase 3에서 AdSense 인프라 + 누락 기능을 보완했으나,
**"체크리스트 사이트"라는 정체성이 약하고, 콘텐츠 간 탐색 흐름이 파편화**되어 있다.

Phase 4는 **체크리스트 허브 확장(사이트 정체성 강화) + 정보 탭 통합(콘텐츠 깊이) + 콘텐츠 네트워크(추천·공유·자동화)**에 집중한다.

### 전략 전환 배경

기존 Phase 4 계획은 "체중 차트 고도화 + 크로스링크 확장"에 집중했다.
그러나 3대 핵심(타임라인, 체중관리, 정보전달)을 재검토한 결과,
**도구 고도화보다 사이트 정체성 확립과 콘텐츠 양 확보**가 AdSense 승인에 직결된다는 판단으로 전략을 전환한다.

| 변경 전 | 변경 후 | 이유 |
|---------|---------|------|
| Step 1: 체중 차트 BMI 강화 | → **Phase 5로 이동** | 법적 리스크 HIGH + 구현 비용 HIGH. 승인과 직접 무관 |
| Step 4: 크로스링크 영역 확장 | → **Phase 5로 이동** | Step 5 스크립트 완성 후 자동화로 해결. 독립 Step 불필요 |
| (없음) | → **Step 1: 체크리스트 허브 확장** | 사이트 정체성 강화 + SEO 키워드 + 도구형 콘텐츠 양 증가 |
| (없음) | → **Step 2: 정보 탭 통합** | 콘텐츠 깊이 인식 + 탐색 시너지 + 네비게이션 단순화 |

### 왜 지금 해야 하는가

| 이유 | 설명 |
|------|------|
| **사이트 정체성 약함** | "pregnancy-checklist" 도메인인데 인터랙티브 체크리스트가 타임라인 1종뿐. 구글이 "위젯 사이트"로 분류할 위험 |
| **도구 페이지 콘텐츠 부족** | 도구 위주 페이지에 텍스트 콘텐츠가 거의 없어 "thin content" 판정 가능 |
| **콘텐츠 탐색 파편화** | 영상 57개, 블로그 5개가 별도 탭 → 블로그가 빈약해 보이고, 콘텐츠 간 탐색 시너지 없음 |
| **고가치 SEO 키워드 미진입** | "출산가방 체크리스트", "남편 출산 준비" 등 월 검색량 수천~만 단위 키워드를 잡지 못함 |
| **세션 체류 시간 부족** | 단일 페이지 방문 후 이탈. 콘텐츠 간 연결이 약해 추가 탐색이 일어나지 않음 |
| **바이럴 채널 없음** | 공유 기능이 전무하여 맘카페/단톡방 등 임산부 커뮤니티로의 자연 확산 불가 |

### 현재 상태 (AS-IS) vs 목표 (TO-BE)

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| 체크리스트 | 타임라인 내장 체크리스트 1종 | 독립 체크리스트 3종 추가 (출산가방, 남편준비, 임신준비) + 체크리스트 허브 페이지 |
| 정보 탐색 | 영상 탭 + 블로그 탭 분리 | "정보" 탭 하나로 통합. 블로그 + 영상 혼합 탐색 |
| 관련 콘텐츠 추천 | 아티클 상세 하단에 추천 없음 | 태그 기반 관련 아티클 3개 + 타임라인/영상 크로스 추천 |
| 공유 기능 | 없음 | URL 복사 + Web Share API + 카카오톡 (fallback) |
| 크로스링크 관리 | 수동 (JSON/front matter 직접 편집) | 자동 생성 스크립트 (주 1회) + 수동 오버라이드 보호 |

### 3대 핵심과의 정렬

| 핵심 | Phase 4 기여 |
|------|-------------|
| **1. 타임라인 기능** | 체크리스트 허브 확장으로 타임라인이 "여러 체크리스트 중 하나"가 아니라 "허브의 메인 기둥"으로 위상 강화. 신규 체크리스트들이 타임라인의 특정 주차와 자연 연결 |
| **2. 체중 관리** | Phase 4에서는 직접 건드리지 않음 (BMI 강화는 Phase 5). 정보 탭 통합으로 체중 관련 블로그/영상 발견성 증가 |
| **3. 정보 전달** | 정보 탭 통합 + 관련 콘텐츠 추천 + 공유 기능으로 정보 전달의 도달 범위와 깊이 모두 강화 |

---

## Scope

**In scope:**

- 체크리스트 허브 페이지 + 독립 체크리스트 3종 (출산가방, 남편/파트너 준비, 임신 준비)
- 정보 탭 통합 (블로그 + 영상을 하나의 탐색 경험으로)
- 아티클 상세 하단 관련 콘텐츠 추천 (글 + 타임라인 + 영상)
- 공유 기능 (Clipboard API + Web Share API + 카카오톡 SDK)
- 크로스링크 자동 생성 스크립트

**Out of scope (Phase 5로 이동):**

- 체중 차트 BMI별 권장 범위 시각화 (법적 리스크 높음, 승인 후 진행)
- 크로스링크 영역 확장 — 영상↔타임라인/블로그, 베이비페어↔타임라인/블로그 (스크립트 완성 후 자동화)
- 서버 사이드 추천 엔진 (AI/ML 기반)
- 사용자 행동 기반 개인화 추천
- 회원가입 / 로그인
- PWA / 푸시 알림

---

## 실행 순서 및 의존성

```
Phase 4 실행 흐름 (의존성 기반)

[독립 — 즉시 착수 가능]
├── Step 1. 체크리스트 허브 확장
├── Step 2. 정보 탭 통합 (블로그 + 영상)
└── Step 4. 공유 기능

[Step 1·2 완료 후]
├── Step 3. 관련 콘텐츠 추천 (통합된 콘텐츠 풀 기반 매칭)
└── Step 5. 크로스링크 자동 생성 스크립트 (체크리스트 3종 포함 매핑)
```

### 추천 실행 순서

| 순위 | Step | 이유 |
|------|------|------|
| 1 | Step 1. 체크리스트 허브 확장 | 사이트 정체성 + SEO 키워드 + 도구형 콘텐츠 양. 기존 인프라 재사용 가능 |
| 2 | Step 2. 정보 탭 통합 | 콘텐츠 깊이 인식 + 탐색 시너지. Step 1과 병렬 작업 가능 |
| 3 | Step 3. 관련 콘텐츠 추천 | AdSense 페이지뷰 직접 영향. 체크리스트 확장 후 연결 콘텐츠 풍부 |
| 4 | Step 4. 공유 기능 | 바이럴 성장 채널. 체크리스트 공유가 핵심 시나리오 |
| 5 | Step 5. 크로스링크 스크립트 | 콘텐츠 15개+ 시점 자동화 기반 |

---

## Step 1. 체크리스트 허브 확장

### 1-1. 문제 분석

"pregnancy-checklist.com"이라는 도메인에 인터랙티브 체크리스트가 타임라인 내장 1종뿐이다.
임산부가 가장 많이 검색하는 체크리스트 키워드에 대응하는 독립 도구가 없다.

**검색 수요가 높은 체크리스트 키워드:**
- "출산가방 체크리스트" / "입원 가방 리스트" — 월 검색량 매우 높음
- "남편 출산 준비" / "예비 아빠 준비물" — 월 검색량 중간
- "임신 준비 체크리스트" / "임신 전 준비" — 월 검색량 높음

**현재 구현:**
- `useChecklistStore`: `checkedIds[]` + `customItems[]` + `toggle()` → 재사용 가능
- `checklist_items.json`: 150+ 아이템, 카테고리: `hospital`, `hospital_bag`, `baby_items`, `postpartum`, `admin`, `health`
- `ChecklistItem` 타입: `id`, `title`, `category`, `categoryName`, `recommendedWeek`, `priority`
- 기존 체크리스트 로직이 범용적으로 설계되어 데이터만 교체하면 동작

### 1-2. 설계

#### 체크리스트 허브 구조

```
/checklist                     ← 허브 페이지 (모든 체크리스트 진입점)
  ├── /checklist/hospital-bag  ← 출산가방 체크리스트
  ├── /checklist/partner-prep  ← 남편/파트너 준비 체크리스트
  └── /checklist/pregnancy-prep ← 임신 준비 체크리스트

기존 유지:
/timeline                      ← 주차별 타임라인 (기존, URL 변경 없음)
```

> **설계 결정**: 타임라인은 `/timeline`에 그대로 유지한다.
> 타임라인은 "주차별 시간축" 성격이 강해서 체크리스트 허브의 "목적별 체크리스트"와 성격이 다르다.
> 허브 페이지에서 타임라인으로의 CTA 링크를 배치하여 연결한다.

#### 허브 페이지 UI

```
┌─────────────────────────────────────────────┐
│  ✅ 체크리스트                                │
│                                             │
│  임신부터 출산까지, 빠뜨리지 않고 준비하세요.    │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  📅 주차별 타임라인                     │  │
│  │  임신 4주부터 40주까지 주차별로          │  │
│  │  해야 할 일을 알려드려요.               │  │
│  │  [37주 · 체크 항목 150개]     →        │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  🧳 출산가방 체크리스트                  │  │
│  │  입원할 때 꼭 챙겨야 할 물품을           │  │
│  │  하나씩 체크하세요.                     │  │
│  │  [엄마 가방 · 아기 가방 · 서류]  →      │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  👨‍👩‍👧 남편/파트너 준비 체크리스트         │  │
│  │  출산 전후로 파트너가 준비해야 할        │  │
│  │  일을 정리했어요.                       │  │
│  │  [출산 전 · 출산 당일 · 산후]    →      │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  🌱 임신 준비 체크리스트                 │  │
│  │  임신을 계획 중이라면 이것부터           │  │
│  │  확인하세요.                            │  │
│  │  [건강 · 영양 · 검사 · 재무]    →      │  │
│  └───────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

#### 개별 체크리스트 페이지 UI

```
┌─────────────────────────────────────────────┐
│  🧳 출산가방 체크리스트                       │
│                                             │
│  출산 예정일이 가까워지면 입원 가방을 미리      │
│  싸두세요. 보통 임신 32~36주 사이에 준비하는   │
│  것을 권장합니다.                             │
│                                             │
│  진행률: ████████░░░░ 67% (20/30)            │
│                                             │
│  ── 엄마 가방 (12/18) ──────────────────     │
│  ☑ 산모용 패드 (대형)                        │
│  ☑ 수유 브라 2~3개                           │
│  ☐ 산후 복대                                 │
│  ☐ 세면도구 (치약, 칫솔, 수건)                │
│  ...                                        │
│                                             │
│  ── 아기 가방 (6/8) ────────────────────     │
│  ☑ 배냇저고리 2벌                            │
│  ☑ 기저귀 (신생아용, 1팩)                     │
│  ☐ 아기 물티슈                               │
│  ...                                        │
│                                             │
│  ── 서류/기타 (2/4) ────────────────────     │
│  ☑ 산모수첩                                  │
│  ☐ 보험 서류                                 │
│  ...                                        │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ 💡 관련 콘텐츠                          │  │
│  │ 📰 출산 가방 준비물 총정리 →             │  │
│  │ 📅 타임라인 32주: 입원 가방 준비 →       │  │
│  │ 🎬 출산 가방 꼭 필요한 것만 →            │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  + 항목 추가 (커스텀)                         │
│                                             │
└─────────────────────────────────────────────┘
```

#### 데이터 구조

각 체크리스트는 독립 JSON 파일로 관리한다. 타입은 기존 `ChecklistItem`을 확장한다.

```ts
// src/types/checklist.ts — 확장
type ChecklistCategory =
  | 'hospital' | 'hospital_bag' | 'baby_items' | 'postpartum' | 'admin' | 'health'
  // 신규 체크리스트용 서브카테고리
  | 'bag_mom' | 'bag_baby' | 'bag_docs'
  | 'partner_before' | 'partner_day' | 'partner_after'
  | 'prep_health' | 'prep_nutrition' | 'prep_checkup' | 'prep_finance';

type ChecklistMeta = {
  slug: string;                    // "hospital-bag" | "partner-prep" | "pregnancy-prep"
  title: string;                   // 페이지 타이틀
  description: string;             // SEO 메타 + 페이지 상단 설명
  icon: string;                    // 허브 카드 아이콘
  subcategories: {
    key: string;
    label: string;
  }[];
  linked_timeline_weeks?: number[];  // 관련 타임라인 주차
  linked_article_slugs?: string[];   // 관련 블로그 글
  linked_video_ids?: string[];       // 관련 영상
};
```

```json
// src/data/hospital_bag_checklist.json (예시)
{
  "meta": {
    "slug": "hospital-bag",
    "title": "출산가방 체크리스트",
    "description": "출산 예정일이 가까워지면 입원 가방을 미리 싸두세요. 보통 임신 32~36주 사이에 준비하는 것을 권장합니다.",
    "icon": "🧳",
    "subcategories": [
      { "key": "bag_mom", "label": "엄마 가방" },
      { "key": "bag_baby", "label": "아기 가방" },
      { "key": "bag_docs", "label": "서류/기타" }
    ],
    "linked_timeline_weeks": [32, 34, 36],
    "linked_article_slugs": ["hospital-bag"],
    "linked_video_ids": []
  },
  "items": [
    {
      "id": "hb_001",
      "title": "산모용 패드 (대형)",
      "category": "bag_mom",
      "categoryName": "엄마 가방",
      "priority": "high",
      "note": "산후 출혈량이 많으므로 대형 사이즈 권장"
    }
  ]
}
```

#### 스토어 설계

기존 `useChecklistStore`는 `checklist-storage`라는 단일 키로 localStorage에 저장한다.
신규 체크리스트는 **각각 독립 스토어 인스턴스**로 운영하여 데이터 격리를 보장한다.

```ts
// src/store/createChecklistStore.ts — 팩토리 함수
export function createChecklistStore(storageKey: string) {
  return create<ChecklistState>()(
    persist(
      (set) => ({
        checkedIds: [],
        customItems: [],
        toggle: (id) => set((state) => ({
          checkedIds: state.checkedIds.includes(id)
            ? state.checkedIds.filter((i) => i !== id)
            : [...state.checkedIds, id],
        })),
        addCustomItem: (item) => set((state) => ({
          customItems: [...state.customItems, { ...item, isCustom: true }],
        })),
        removeCustomItem: (id) => set((state) => ({
          customItems: state.customItems.filter((item) => item.id !== id),
          checkedIds: state.checkedIds.filter((i) => i !== id),
        })),
      }),
      { name: storageKey }
    )
  );
}

// 개별 스토어
export const useHospitalBagStore = createChecklistStore('hospital-bag-storage');
export const usePartnerPrepStore = createChecklistStore('partner-prep-storage');
export const usePregnancyPrepStore = createChecklistStore('pregnancy-prep-storage');
```

#### 설명 텍스트 전략 (AdSense 대응)

각 체크리스트 페이지에 **도구 + 콘텐츠 하이브리드** 구조를 적용한다:

- 상단: 200~300자 설명 텍스트 (왜 이 체크리스트가 필요한지, 언제 준비해야 하는지)
- 중단: 인터랙티브 체크리스트 (도구)
- 하단: 관련 콘텐츠 CTA (블로그/영상/타임라인)

이렇게 하면 구글 심사봇이 "도구 + 정보성 텍스트"를 함께 인식하여 thin content 판정을 회피한다.

### 1-3. 체크리스트별 아이템 설계

#### 출산가방 체크리스트 (~30 아이템)

| 서브카테고리 | 예시 아이템 |
|------------|-----------|
| 엄마 가방 | 산모용 패드, 수유 브라, 산후 복대, 세면도구, 수유 쿠션, 산모용 속옷, 간식, 보온병, 핸드폰 충전기, 슬리퍼, 퇴원복 |
| 아기 가방 | 배냇저고리 2벌, 신생아 기저귀, 물티슈, 속싸개, 겉싸개, 아기 모자, 카시트 |
| 서류/기타 | 산모수첩, 신분증, 보험 서류, 출생신고용 서류, 진통 타이머 앱 |

#### 남편/파트너 준비 체크리스트 (~25 아이템)

| 서브카테고리 | 예시 아이템 |
|------------|-----------|
| 출산 전 | 출산 휴가 신청, 병원 주차/교통편 확인, 비상 연락망 정리, 집 대청소, 산후도우미 예약, 배우자 출산휴가 신청 |
| 출산 당일 | 입원 가방 차에 싣기, 진통 간격 기록, 병원 이동, 가족 연락, 산모 응원 |
| 산후 | 출생신고, 건강보험 등록, 산후조리 식단 준비, 야간 수유 교대, 산모 정서 케어 |

#### 임신 준비 체크리스트 (~25 아이템)

| 서브카테고리 | 예시 아이템 |
|------------|-----------|
| 건강 | 산전 건강검진, 풍진 항체 확인, 치과 검진, 금주/금연, 적정 체중 관리 |
| 영양 | 엽산 복용 시작 (임신 3개월 전~), 철분 수치 확인, 카페인 줄이기 |
| 검사 | 자궁경부암 검사, 갑상선 검사, 성병 검사, 유전자 검사 상담 |
| 재무/행정 | 태아 보험 알아보기, 출산 비용 예산 세우기, 육아휴직 제도 확인, 정부 지원금 확인 |

### 1-4. 장단점 분석

#### 장점

| 관점 | 내용 |
|------|------|
| 사이트 정체성 | "pregnancy-checklist.com" 도메인에 체크리스트가 4종. 이름과 실체가 일치 |
| SEO 키워드 | "출산가방 체크리스트", "남편 출산 준비", "임신 준비 체크리스트" 진입. 각각 독립 랜딩 페이지 |
| 도구 + 콘텐츠 결합 | 각 페이지에 설명 텍스트가 자연스럽게 붙음 → thin content 회피 |
| 개발 비용 낮음 | `useChecklistStore` 로직을 팩토리 함수로 추출하여 재사용. 데이터만 새 JSON |
| 내부 링크 밀도 | 체크리스트 → 블로그 글 → 관련 영상 → 타임라인 주차. 자연스러운 탐색 흐름 |
| E-E-A-T Experience | 체크리스트 자체가 "실제 경험에서 나온 큐레이션"이라는 신호 |
| 차별화 | 대부분의 경쟁 사이트는 블로그 글로만 체크리스트를 다룸. 인터랙티브 도구는 사실상 없음 |
| 공유 시나리오 | "출산가방 체크리스트 같이 쓰자" — 맘카페/단톡방 공유의 핵심 킬러 콘텐츠 |

#### 단점 / 리스크

| 관점 | 내용 | 대응 |
|------|------|------|
| 아이템 큐레이션 비용 | 3종 × 25~30개 = 75~90개 아이템 직접 작성 필요 | 드래프트 블로그(hospital-bag-draft 등)의 아이템 목록을 씨드 데이터로 활용 |
| 스토어 분기 | 체크리스트 4종의 localStorage가 별도 → 기기 간 동기화 이슈 (기존과 동일) | Phase 4에서는 localStorage 유지. GCP 전환(Phase 6+)에서 서버 동기화 |
| 네비게이션 복잡도 | BottomNav에 새 탭 추가 시 5→6개로 과밀 | BottomNav 재구성: 홈 / 체크리스트(허브) / 정보(통합) / 체중 / 더보기 |
| 기존 /checklist URL 충돌 | 현재 `/checklist` → `/timeline` 리다이렉트 존재 | 허브 페이지로 전환하며 리다이렉트 제거 |

### 1-5. 법제/보안 이슈

| 이슈 | 심각도 | 상세 | 대응 |
|------|--------|------|------|
| **의료 정보 정확성** | MEDIUM | 출산가방 아이템 중 의료용품 추천은 YMYL 영역 | "병원마다 준비물이 다를 수 있습니다. 분만 병원의 안내를 우선하세요" 면책 문구 |
| **개인 데이터** | LOW | 체크 상태만 localStorage에 저장. 개인 식별 정보 없음 | 기존과 동일한 수준 |

### 1-6. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/types/checklist.ts` | `ChecklistCategory` 확장, `ChecklistMeta` 타입 추가 |
| `src/store/createChecklistStore.ts` | 체크리스트 스토어 팩토리 함수 (신규) |
| `src/data/hospital_bag_checklist.json` | 출산가방 체크리스트 데이터 (~30 아이템) (신규) |
| `src/data/partner_prep_checklist.json` | 남편/파트너 준비 체크리스트 데이터 (~25 아이템) (신규) |
| `src/data/pregnancy_prep_checklist.json` | 임신 준비 체크리스트 데이터 (~25 아이템) (신규) |
| `src/components/checklist/ChecklistHub.tsx` | 허브 페이지 컴포넌트 (신규) |
| `src/components/checklist/ChecklistPage.tsx` | 범용 체크리스트 페이지 컴포넌트 — 데이터 주입으로 재사용 (신규) |
| `src/components/checklist/ChecklistProgress.tsx` | 진행률 프로그레스 바 (신규) |
| `src/components/checklist/ChecklistRelatedContent.tsx` | 하단 관련 콘텐츠 CTA (신규) |
| `src/app/checklist/page.tsx` | 허브 페이지 라우트 (기존 리다이렉트 → 허브로 전환) |
| `src/app/checklist/hospital-bag/page.tsx` | 출산가방 체크리스트 라우트 (신규) |
| `src/app/checklist/partner-prep/page.tsx` | 남편/파트너 준비 라우트 (신규) |
| `src/app/checklist/pregnancy-prep/page.tsx` | 임신 준비 라우트 (신규) |
| `src/components/layout/BottomNav.tsx` | 네비게이션 재구성 |

### 1-7. BottomNav 재구성

```
현재 (5탭):
홈 | 타임라인 | 베이비페어 | 영상 | 정보

변경 후 (5탭):
홈 | 체크리스트 | 정보 | 체중 | 더보기
                              └── 베이비페어, 서비스소개, 연락처
```

- **체크리스트**: `/checklist` 허브 진입 → 타임라인/출산가방/남편준비/임신준비 선택
- **정보**: `/info` 통합 탭 (Step 2에서 구현)
- **체중**: `/weight` 기존 유지
- **더보기**: 베이비페어, 서비스소개, 연락처 등 보조 메뉴

### 1-8. 완료 조건

- [ ] `/checklist` 허브 페이지에서 4종 체크리스트 카드 표시 (타임라인 포함)
- [ ] `/checklist/hospital-bag` 출산가방 체크리스트 인터랙티브 동작
- [ ] `/checklist/partner-prep` 남편/파트너 준비 체크리스트 인터랙티브 동작
- [ ] `/checklist/pregnancy-prep` 임신 준비 체크리스트 인터랙티브 동작
- [ ] 각 체크리스트 체크 상태가 localStorage에 독립 저장
- [ ] 커스텀 아이템 추가/삭제 동작
- [ ] 진행률(%) 실시간 표시
- [ ] 각 페이지 상단에 200~300자 설명 텍스트 배치
- [ ] 하단에 관련 콘텐츠 CTA (블로그/타임라인/영상) 배치
- [ ] BottomNav 재구성 (5탭)
- [ ] 기존 `/checklist` → `/timeline` 리다이렉트 제거
- [ ] 모바일 반응형 정상 동작
- [ ] SEO 메타 태그 (title, description, OG) 각 페이지별 설정

---

## Step 2. 정보 탭 통합 (블로그 + 영상)

### 2-1. 문제 분석

블로그(발행 5개)와 영상(57개)이 별도 탭으로 분리되어 있다.
블로그 탭만 보면 콘텐츠가 빈약해 보이고, 영상과 블로그 간 탐색 시너지가 없다.
사용자가 "임신 체중 관리"에 대해 알고 싶을 때 블로그와 영상을 각각 따로 찾아야 한다.

**현재 구현:**
- `/articles` — `ArticlesContainer.tsx`: 블로그 리스트 + 태그 필터
- `/videos` — `VideosContainer.tsx`: 카테고리별 영상 리스트 + 채널 정보
- BottomNav에서 "영상"과 "정보"가 별도 탭
- 영상 카테고리: `exercise`, `birth_prep`, `newborn_care`, `pregnancy_health`, `prenatal_checkup`, `nutrition`, `policy`
- 블로그 태그: `임신초기`, `출산준비`, `검사`, `보험`, `영양`, `체중관리` 등

### 2-2. 설계

#### 통합 정보 페이지 구조

```
/info                         ← 통합 정보 허브 (신규)
  ├── 상단: 통합 태그 필터
  ├── 탭: 전체 / 블로그 / 영상
  └── 카드 리스트: 블로그 카드 + 영상 카드 혼합

/info/articles/[slug]         ← 블로그 상세 (기존 URL 유지를 위한 리다이렉트 설정)
/articles/[slug]              ← 기존 URL 유지 (SEO 보호)
```

> **URL 전략**: 기존 `/articles/[slug]` URL은 구글에 인덱싱되어 있으므로 변경하지 않는다.
> `/info`는 새 진입점이고, 블로그 상세 URL은 `/articles/[slug]` 그대로 유지한다.

#### UI 레이아웃

```
┌──────────────────────────────────────────────┐
│  📚 정보                                      │
│                                              │
│  임신·출산에 필요한 블로그 글과 영상을           │
│  한곳에 모았어요.                              │
│                                              │
│  ┌──────┬──────┬──────┐                      │
│  │ 전체 │블로그│ 영상 │ ← 콘텐츠 타입 탭       │
│  └──────┴──────┴──────┘                      │
│                                              │
│  [임신초기] [출산준비] [영양] [운동] [검사]      │
│  [산후관리] [신생아] [정책/제도] [보험]          │
│  ← 통합 태그 필터 (블로그 태그 + 영상 카테고리)  │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ 📰  임신 중 체중관리 완전 정리          │    │
│  │     체중이 너무 늘면 임신성 당뇨...      │    │
│  │     #체중관리 #영양                     │    │
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ 🎬  임산부 요가 - 허리 통증 완화        │    │
│  │     [YouTube 썸네일]                   │    │
│  │     #운동                              │    │
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ 📰  임신 초기 검사 총정리              │    │
│  │     임신 확인 후 처음 받는 검사는...     │    │
│  │     #임신초기 #검사                    │    │
│  └──────────────────────────────────────┘    │
│  ...                                        │
│                                              │
└──────────────────────────────────────────────┘
```

#### 통합 태그 매핑 (옵션 A: 단일층 통합 태그)

블로그 태그·영상 카테고리·동의어를 하나의 통합 태그 시스템으로 정규화한다.
런타임 매핑(`unified-tags.ts`)으로 처리하므로 블로그 front matter는 변경하지 않는다.

| 통합 태그 | 블로그 태그 (정규화 흡수) | 영상 카테고리 |
| ---------- | -------------------------- | ------------- |
| 임신초기 | `임신초기`, `임신초기증상`, `임신피로`, `프로게스테론` | — |
| 임신중기 | `임신중기` | — |
| 출산준비 | `출산준비` | `birth_prep` |
| 영양 | `영양`, `임산부영양` | `nutrition` |
| 운동 | `임산부운동` | `exercise` |
| 검사 | `검사`, `산전검사`, `NIPT`, `정밀초음파`, `기형아검사` | `prenatal_checkup` |
| 건강 | `임산부건강`, `임산부빈혈`, `임신성당뇨`, `임신중독증`, `건강` | `pregnancy_health` |
| 신생아 | `신생아` | `newborn_care` |
| 산후관리 | `산후관리` | — |
| 정책/제도 | `정책`, `제도`, `정부지원`, `국민행복카드`, `부모급여`, `첫만남이용권`, `임신지원금` | `policy` |
| 보험 | `보험`, `태아보험`, `임신보험`, `태아보험가입시기`, `태아보험특약` | — |
| 체중관리 | `체중관리` | — |
| 임신준비 | `임신준비` | — |

> **분류 결정 사유**: 콘텐츠 규모(블로그 7개·영상 57개)에서는 옵션 A(단일층) 입도가 가장 적합.
> 옵션 B(2단계 계층 필터), 옵션 D(큐레이션 컬렉션)는 콘텐츠 20개+ 시점에 도입 → Phase 5 이월.

```ts
// src/lib/unified-tags.ts
type UnifiedTag = {
  key: string;
  label: string;
  articleTags: string[];       // 매칭되는 블로그 태그들 (동의어 포함)
  videoCategories: string[];   // 매칭되는 영상 카테고리들
};
```

#### 채널 처리 결정

기존 `/videos`의 "영상/채널" 보기 토글은 `/info`에서 **제외**한다.

| 항목 | 결정 |
|------|------|
| `/info`에 채널 카드 노출 | ❌ 제외 |
| `/videos` 페이지 | 폐기 → `/info?tab=videos` 리다이렉트 |
| 채널 보기 모드 (`VideosContainer`의 토글) | 제거 |
| 영상 카드 내부 채널명 | 표기는 유지 (Phase 5에서 채널 상세 페이지 연결) |

> **사유**: ① "정보 허브"의 콘텐츠 정체성 보호 — 채널은 발행자 메타로 위계가 다름.
> ② 통합 태그 필터가 채널에 적용되는 의미가 약함.
> ③ 채널 리스트가 외부 유튜브 링크 모음으로 비춰져 AdSense thin content 위험 증가.
> 채널 디렉토리는 Phase 5에서 `/info/channels` 또는 `/channels` 별도 페이지로 부활.

#### 정렬 전략

"전체" 탭에서 블로그와 영상을 혼합 정렬할 기준:

1. **블로그**: front matter `date` 기준 최신순
2. **영상**: `videos.json` 등장 순서(파일 인덱스) 기준 — 영상에는 등록일 필드가 없음
3. **혼합**: 블로그 그룹 → 영상 그룹 순서로 이어붙이고, 그룹 내부는 위 기준으로 정렬
4. **태그/탭 필터 적용 시**: 매칭된 항목만 동일 규칙으로 노출

> 엄격한 시간 기준 혼합 정렬은 영상 데이터에 `registered_date` 필드 백필 후 가능 → Phase 5 이월.

### 2-3. 장단점 분석

#### 장점

| 관점 | 내용 |
|------|------|
| 콘텐츠 깊이 인식 | 블로그 5개 + 영상 57개 = "62개 콘텐츠"가 한 눈에. 빈약해 보이지 않음 |
| 탐색 시너지 | "출산준비" 태그 → 관련 블로그 + 영상 동시 발견 |
| 네비게이션 단순화 | BottomNav 탭 수 감소. 사용자 인지 부하 낮춤 |
| AdSense 관점 | "정보 허브" 페이지 자체가 텍스트 + 멀티미디어 혼합 → 고가치 |
| SEO | `/info` 허브 페이지가 블로그·영상 전체의 인덱스 역할 → 크롤 효율 향상 |

#### 단점 / 리스크

| 관점 | 내용 | 대응 |
|------|------|------|
| 기존 URL 보호 | `/articles/*` 이미 인덱싱됨 | URL 변경 없이 진입점만 `/info`로. `/articles`→`/info` 리다이렉트 (정적 export에서는 `redirect()` from `next/navigation` 사용) |
| `/videos` URL | `/videos` 페이지 사라짐 | `/videos`→`/info?tab=videos` 리다이렉트. 정적 export에서 쿼리 보존이 안 되면 클라이언트 리다이렉트로 폴백 |
| 혼합 정렬 품질 | 블로그·영상의 날짜 기준이 다름 (영상에 등록일 없음) | Phase 4에서는 "블로그 그룹 → 영상 그룹" 순서. 엄격 최신순은 Phase 5(영상 `registered_date` 백필)로 이월 |
| UI 복잡도 | 두 종류 카드를 한 리스트에 혼합 | 카드 타입별 시각적 구분 (📰/🎬 아이콘 + 카드 디자인 미세 차이). 기존 `ArticleCard`/`VideoCard` 재사용 |
| 채널 진입점 손실 | `/videos`의 채널 보기 토글 폐기 | Phase 5에서 채널 디렉토리(`/info/channels` 또는 `/channels`) 별도 페이지로 부활 |
| 영상 sub-category 손실 | `VideosContainer`의 sub-category 필터가 `/info`에서 빠짐 | 통합 태그 필터로 단순화. 세부 토픽은 검색(`fuse.js`)으로 도달 |
| 검색 인덱스 URL | `lib/search.ts`의 영상 URL이 `/videos#<id>` | `/info?tab=videos#<id>`로 일괄 변경. 라우터 변경과 동시에 반영 |
| 블로그 태그 동의어 분산 | front matter에 정규화 미적용 | Phase 4에서는 `unified-tags.ts`의 런타임 매핑으로 흡수. front matter 일괄 마이그레이션은 Phase 5 이월 |

### 2-4. 법제/보안 이슈

| 이슈 | 심각도 | 상세 | 대응 |
|------|--------|------|------|
| **유튜브 썸네일** | LOW | 기존과 동일. `img.youtube.com` 직접 참조 | 변경 없음 |
| **콘텐츠 혼합 책임** | LOW | 자사 콘텐츠 + 큐레이션 영상. 영상은 유튜브 임베드 | 변경 없음 |

### 2-5. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/unified-tags.ts` | 통합 태그 정의 + 동의어 흡수 매핑 + 콘텐츠↔통합 태그 매칭 유틸 (신규) |
| `src/types/info.ts` | `InfoItem` discriminated union (블로그/영상 공통) (신규) |
| `src/components/info/InfoContainer.tsx` | 통합 허브 — 탭(전체/블로그/영상) + 통합 태그 필터 + 혼합 리스트 + 영상 hash-scroll (신규) |
| `src/components/info/InfoCard.tsx` | `InfoItem` 분기 렌더 — 기존 `ArticleCard`/`VideoCard` 래핑 재사용 (신규) |
| `src/app/info/page.tsx` | 통합 정보 허브 라우트 + 메타데이터 (신규) |
| `src/app/articles/page.tsx` | `/info`로 리다이렉트 (목록 페이지만 변경 — `[slug]`는 그대로 유지) |
| `src/app/videos/page.tsx` | `/info?tab=videos`로 리다이렉트 |
| `src/components/layout/BottomNav.tsx` | "영상" 탭 제거, "정보" → `/info` 변경. `/info`·`/articles/`·`/videos` prefix 모두에서 활성화 |
| `src/lib/search.ts` | 영상 검색 결과 URL을 `/info?tab=videos#<id>`로 변경 |

### 2-6. 완료 조건

- [ ] `/info` 허브 페이지에서 블로그 + 영상 혼합 리스트 표시
- [ ] 탭 전환 (전체/블로그/영상) 정상 동작
- [ ] 통합 태그 필터 정상 동작 (블로그 태그 + 영상 카테고리 매핑, 동의어 흡수 적용)
- [ ] `?tab=videos` 쿼리 진입 시 영상 탭이 선택된 상태로 시작
- [ ] `/info?tab=videos#<video_id>` 진입 시 해당 영상 카드로 스크롤 + 하이라이트
- [ ] 블로그 카드 클릭 시 `/articles/[slug]`로 정상 이동 (기존 URL 유지)
- [ ] 영상 카드 클릭 시 유튜브 외부 링크 정상 동작
- [ ] `/articles` → `/info` 리다이렉트 정상 동작
- [ ] `/videos` → `/info?tab=videos` 리다이렉트 정상 동작 (쿼리 보존 검증 필수)
- [ ] BottomNav 5탭 구성 적용, `/articles/[slug]` 진입 시 "정보" 탭 활성화
- [ ] 검색 결과에서 영상 클릭 시 `/info?tab=videos#<id>`로 정상 이동
- [ ] 영상 sub-category 필터·채널 보기 모드는 `/info`에 노출되지 않음 (의도적 제거)
- [ ] 모바일 반응형 정상 동작
- [ ] SEO 메타 태그 (title, description, canonical, OG) 설정

---

## Step 3. 아티클 하단 관련 콘텐츠 추천

### 3-1. 문제 분석

아티클 상세 페이지(`/articles/[slug]`) 하단이 이탈 지점이다.
관련 콘텐츠 추천이 없어 사용자가 글을 다 읽은 후 서비스를 떠난다.

**현재 구현:**
- `ArticleDetail.tsx`: 본문 + MedicalDisclaimer + TimelineCTA만 존재
- 아티클 메타에 `tags: string[]` 필드 존재 → 태그 기반 매칭 가능
- `getAllArticles()`로 전체 아티클 접근 가능
- 현재 발행 5개 + Phase 4에서 체크리스트 3종 추가 → 연결 가능 콘텐츠 풍부

### 3-2. 설계

#### 추천 알고리즘

```ts
function getRelatedContent(currentArticle: ArticleMeta, allArticles: ArticleMeta[]): RelatedItem[] {
  // 1. 태그 겹침 기반 점수 계산 (Jaccard 유사도)
  const scored = allArticles
    .filter(a => a.slug !== currentArticle.slug)
    .map(a => ({
      article: a,
      score: intersect(currentArticle.tags, a.tags).length / union(currentArticle.tags, a.tags).length,
    }))
    .sort((a, b) => b.score - a.score);

  // 2. 태그 겹침 1개 이상인 글 우선
  const related = scored.filter(s => s.score > 0).slice(0, 3);

  // 3. 부족하면 최신 글로 보충
  if (related.length < 3) {
    const remaining = allArticles
      .filter(a => a.slug !== currentArticle.slug && !related.find(r => r.article.slug === a.slug))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    related.push(...remaining.slice(0, 3 - related.length).map(a => ({ article: a, score: 0 })));
  }

  return related.map(r => r.article);
}
```

#### 크로스 모듈 추천

체크리스트 확장(Step 1) 이후 추천 범위가 넓어진다:

- 아티클의 `linked_timeline_weeks` → 해당 주차 타임라인 카드 추천
- 아티클 태그 ↔ 체크리스트 `linked_article_slugs` → 관련 체크리스트 추천
- 아티클 태그 ↔ 통합 태그(Step 2) → 관련 영상 추천

#### UI 레이아웃

```
┌─────────────────────────────────────────┐
│  📰 관련 콘텐츠                          │
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ 출산 가방 │ │ 산후조리 │ │ 임신 검사 │ │
│  │ 준비물   │ │ 가이드   │ │ 일정     │ │
│  │ 총정리   │ │          │ │          │ │
│  │          │ │          │ │          │ │
│  │ #출산준비│ │ #산후조리│ │ #검사    │ │
│  └──────────┘ └──────────┘ └──────────┘ │
│                                         │
│  ✅ 관련 체크리스트                       │
│  ├─ 🧳 출산가방 체크리스트 →              │
│                                         │
│  📅 관련 타임라인                        │
│  ├─ 32주: 입원 가방 준비 시작 →          │
│                                         │
│  🎬 관련 영상                            │
│  ├─ [영상 제목] →                        │
└─────────────────────────────────────────┘
```

### 3-3. 장단점 분석

#### 장점

| 관점 | 내용 |
|------|------|
| 페이지뷰 증가 | 글 하단 이탈 지점에 관련 콘텐츠 → 평균 2~3 추가 페이지뷰. AdSense 수익 직결 |
| 체크리스트 연결 | "출산가방" 글 → 출산가방 체크리스트 CTA. Step 1의 가치를 극대화 |
| 크로스 모듈 연결 | 글 → 영상 → 타임라인 → 체크리스트. 자연스러운 여정 |
| AdSense 품질 신호 | 내부 링크 밀도 ↑ = 심사봇이 "잘 구조화된 사이트"로 판단 |
| 구현 단순성 | `getAllArticles()`로 전체 접근 가능, 태그 겹침 계산은 순수 연산. 별도 API/DB 불필요 |

#### 단점 / 리스크

| 관점 | 내용 | 대응 |
|------|------|------|
| 콘텐츠 양 제한 | 발행 5개. 같은 태그 공유 글이 2개 이하인 경우 → 최신 글 fallback | 체크리스트 페이지도 추천 대상에 포함 |
| UX 잡음 | 관련도 낮은 콘텐츠 추천 시 신뢰도 저하 | score 0인 fallback은 "최신 글"로 라벨링 |

### 3-4. 법제/보안 이슈

| 이슈 | 심각도 | 상세 |
|------|--------|------|
| 추적 우려 | LOW | 추천 로직이 태그 기반(정적). 사용자 행동 데이터 미사용 |
| 콘텐츠 책임 | LOW | 자사 콘텐츠 간 연결. 외부 링크 문제 없음 |

### 3-5. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/related-content.ts` | 태그 기반 관련 콘텐츠 추천 로직 (신규) |
| `src/components/articles/RelatedArticles.tsx` | 관련 글 카드 3개 리스트 (신규) |
| `src/components/articles/RelatedContent.tsx` | 관련 체크리스트 + 타임라인 + 영상 링크 (신규) |
| `src/components/articles/ArticleDetail.tsx` | 하단에 RelatedArticles + RelatedContent 배치 |
| `src/app/articles/[slug]/page.tsx` | `allArticles` 전달 |

### 3-6. 완료 조건

- [ ] 아티클 상세 하단에 관련 글 최대 3개 표시
- [ ] 태그 겹침 1개+ 글 우선, 부족 시 최신 글 보충
- [ ] 현재 글은 추천 목록에서 제외
- [ ] 관련 체크리스트 링크 표시 (해당 시)
- [ ] 관련 타임라인/영상 링크 표시
- [ ] 카드 클릭 시 해당 콘텐츠로 정상 이동
- [ ] 아티클이 1개일 때도 에러 없이 빈 상태 처리

---

## Step 4. 공유 기능

### 4-1. 문제 분석

공유 기능이 전무하다. `navigator.share`, `navigator.clipboard` 사용 흔적 없음.
임산부 커뮤니티(맘카페, 단톡방)에서의 링크 공유가 핵심 성장 채널인데, 공유 버튼 없이 URL 직접 복사는 마찰이 크다.

**Step 1의 체크리스트 확장이 공유의 핵심 킬러 콘텐츠가 된다:**
- "출산가방 체크리스트 이거 좋더라" → 맘카페 공유
- "남편한테 이거 보내줘" → 카톡 공유
- "임신 준비 체크리스트 같이 쓰자" → 단톡방 공유

### 4-2. 설계

#### 공유 전략: 디바이스별 분기

```ts
function handleShare(data: ShareData) {
  // 1순위: Web Share API (모바일 네이티브 시트)
  if (navigator.share) {
    navigator.share(data);
    return;
  }
  // 2순위: 커스텀 공유 모달 (데스크톱 fallback)
  openShareModal(data);
}
```

#### Web Share API (모바일 우선)

- iOS Safari, Android Chrome 완전 지원
- OS 네이티브 공유 시트 → 카카오톡, 메시지, AirDrop 등 모든 채널 자동 커버
- 추가 SDK 없이 동작

```ts
await navigator.share({
  title: '출산가방 체크리스트 — 출산 준비 체크리스트',
  text: '입원할 때 꼭 챙겨야 할 물품을 하나씩 체크하세요.',
  url: 'https://pregnancy-checklist.com/checklist/hospital-bag',
});
```

#### 커스텀 공유 모달 (데스크톱 fallback)

```
┌──────────────────────────────┐
│  공유하기                 ✕  │
│                              │
│  🔗 링크 복사                │
│  💬 카카오톡으로 공유         │
│                              │
└──────────────────────────────┘
```

#### 공유 버튼 배치 위치

| 페이지 | 위치 | 공유 데이터 |
|--------|------|-----------|
| 체크리스트 (신규) | 페이지 상단 | 체크리스트 제목 + 설명 + URL |
| 아티클 상세 | 본문 상단 + 하단 | 아티클 제목 + 설명 + URL |
| 타임라인 | 개별 주차 카드 (옵션) | "임신 N주 준비 체크리스트" + URL |

#### GA4 이벤트

```ts
sendGAEvent('share', {
  method: 'web_share_api' | 'clipboard' | 'kakao',
  content_type: 'checklist' | 'article' | 'timeline',
  item_id: slug,
});
```

### 4-3. 장단점 분석

#### 장점

| 관점 | 내용 |
|------|------|
| 바이럴 성장 | 맘카페/단톡방 링크 공유 = 핵심 성장 채널. 체크리스트가 공유 킬러 콘텐츠 |
| 트래픽 소스 다변화 | 카카오톡 공유 → 리퍼럴 트래픽 → AdSense 노출 증가 |
| 신뢰도 | "친구가 보내준 링크"는 검색 유입 대비 전환/체류 2~3배 |
| 구현 난이도 | Web Share API + Clipboard API 조합으로 비교적 단순 |

#### 단점 / 리스크

| 관점 | 내용 | 대응 |
|------|------|------|
| 카카오 SDK 의존성 | ~100KB, 성능 영향 + 카카오 개발자 등록 필요 | 모바일 80%+ 사용자는 Web Share API로 커버. 카카오 SDK는 Phase 4.2 후순위 |
| OG 태그 정비 | 공유 프리뷰가 제대로 나오려면 각 페이지별 OG 메타 설정 필요 | Step 1·2에서 OG 메타 설정 시 함께 처리 |

### 4-4. 법제/보안 이슈

| 이슈 | 심각도 | 상세 | 대응 |
|------|--------|------|------|
| **카카오 SDK 개인정보** | MEDIUM | 카카오 SDK가 기기 정보를 수집할 수 있음 | Phase 4에서는 Web Share API + Clipboard만. 카카오 SDK는 Phase 4.2 |
| **Clipboard API 권한** | LOW | 사용자 제스처(클릭) 컨텍스트에서만 동작 | 클릭 핸들러 내에서만 호출 |

### 4-5. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/share/ShareButton.tsx` | 공유 버튼 (Web Share API → Clipboard fallback) (신규) |
| `src/components/share/ShareModal.tsx` | 데스크톱용 공유 모달 (링크 복사) (신규) |
| `src/lib/share.ts` | 공유 유틸 함수 + GA4 이벤트 (신규) |
| `src/components/articles/ArticleDetail.tsx` | ShareButton 배치 |
| `src/app/checklist/*/page.tsx` | ShareButton 배치 |
| `src/app/articles/[slug]/page.tsx` | OG 메타 태그 보강 (generateMetadata) |
| `src/app/checklist/*/page.tsx` | OG 메타 태그 설정 |

### 4-6. 완료 조건

- [ ] 아티클 상세 페이지에 공유 버튼 노출
- [ ] 체크리스트 페이지에 공유 버튼 노출
- [ ] 모바일: Web Share API로 OS 네이티브 공유 시트 표시
- [ ] 데스크톱: 커스텀 모달 (링크 복사)
- [ ] 링크 복사 시 토스트 알림 "링크가 복사되었습니다"
- [ ] GA4 `share` 이벤트 전송 (method, content_type, item_id)
- [ ] OG 메타 태그로 공유 프리뷰 정상 표시

---

## Step 5. 크로스링크 자동 생성 스크립트

### 5-1. 문제 분석

모든 크로스링크가 수동 관리 상태:
- `timeline_items.json`의 `linked_article_slugs`, `linked_video_ids`
- 아티클 front matter의 `linked_timeline_weeks`
- 체크리스트 JSON의 `linked_article_slugs`, `linked_video_ids` (Step 1에서 추가)

콘텐츠가 15개+로 증가하고 체크리스트가 4종으로 확장되면 N×M 조합의 수동 매핑은 유지 불가능.

### 5-2. 설계

#### 스크립트 구조

```
scripts/generate-crosslinks.ts

입력:
  - src/data/timeline_items.json
  - src/data/videos.json
  - src/data/hospital_bag_checklist.json     (Phase 4 신규)
  - src/data/partner_prep_checklist.json     (Phase 4 신규)
  - src/data/pregnancy_prep_checklist.json   (Phase 4 신규)
  - src/data/babyfair_events.json
  - src/content/articles/*.md (front matter)

처리:
  1. 모든 콘텐츠의 메타데이터 수집 (제목, 태그, 키워드)
  2. 통합 태그(Step 2) 기반 관련도 계산
  3. 임계값 이상인 쌍에 대해 양방향 링크 생성
  4. 기존 수동 매핑(manual: true) 보호
  5. 변경 사항 출력 또는 적용

출력:
  - timeline_items.json 갱신 (linked_article_slugs, linked_video_ids)
  - *_checklist.json 갱신 (linked_article_slugs, linked_video_ids)
  - articles/*.md front matter 갱신 (linked_timeline_weeks, linked_video_ids)
```

#### 매칭 알고리즘

```ts
// 1단계: 태그 기반 Jaccard 유사도
function jaccardSimilarity(tagsA: string[], tagsB: string[]): number {
  const intersection = tagsA.filter(t => tagsB.includes(t)).length;
  const union = new Set([...tagsA, ...tagsB]).size;
  return union === 0 ? 0 : intersection / union;
}

// 2단계: 키워드 매칭 (제목 + 설명에서 추출)
function keywordOverlap(textA: string, textB: string): number {
  const wordsA = extractKeywords(textA);
  const wordsB = extractKeywords(textB);
  return jaccardSimilarity(wordsA, wordsB);
}

// 3단계: 복합 점수
function relevanceScore(itemA, itemB): number {
  return jaccardSimilarity(itemA.tags, itemB.tags) * 0.6
       + keywordOverlap(itemA.title + itemA.description, itemB.title + itemB.description) * 0.4;
}

// 임계값: 0.2 이상이면 연결
const THRESHOLD = 0.2;
```

#### 수동 매핑 보호

```json
{
  "week": 32,
  "linked_article_slugs": ["hospital-bag"],
  "linked_article_slugs_manual": true,
  "linked_video_ids": ["video_017"]
}
```

- `*_manual: true` 플래그가 있는 필드는 스크립트가 덮어쓰지 않음
- 스크립트가 생성한 매핑에는 `*_manual` 플래그 없음 (다음 실행 시 재계산)

#### 실행 모드

```bash
# 드라이런: 변경 사항만 출력, 파일 수정 없음
npx tsx scripts/generate-crosslinks.ts --dry-run

# 적용: 파일에 실제 반영
npx tsx scripts/generate-crosslinks.ts --apply

# 리포트: 현재 크로스링크 상태 요약
npx tsx scripts/generate-crosslinks.ts --report
```

### 5-3. 장단점 분석

#### 장점

| 관점 | 내용 |
|------|------|
| 운영 효율 | 콘텐츠 추가 → 스크립트 실행 → 관련 링크 자동 생성 |
| 일관성 | 누락/불일치 방지. 양방향 대칭성 보장 |
| 확장성 | 체크리스트 4종 + 블로그 15개 + 영상 57개에서도 O(1) 운영 비용 |

#### 단점 / 리스크

| 관점 | 내용 | 대응 |
|------|------|------|
| 매칭 품질 | "임신" 공통 태그로 모든 글 연결 문제 | "임신" 같은 범용 태그는 가중치 감소. TF-IDF 적용 |
| Git diff 노이즈 | JSON 변경 → 코드 리뷰 diff 증가 | `--dry-run` 프리뷰 필수 |

### 5-4. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `scripts/generate-crosslinks.ts` | 메인 스크립트 (신규) |
| `src/lib/crosslink-utils.ts` | 매칭 알고리즘 공유 유틸 (빌드 타임 + 스크립트 공용) (신규) |
| `package.json` | `"crosslinks": "tsx scripts/generate-crosslinks.ts"` 스크립트 추가 |

### 5-5. 완료 조건

- [ ] `--dry-run` 모드에서 변경 예정 사항이 정상 출력
- [ ] `--apply` 모드에서 JSON/front matter 파일 정상 갱신
- [ ] `--report` 모드에서 현재 크로스링크 통계 출력
- [ ] `*_manual: true` 매핑이 보호됨 (덮어쓰기 안 됨)
- [ ] 존재하지 않는 콘텐츠에 대한 링크가 생성되지 않음
- [ ] 실행 후 `npm run build` 성공
- [ ] 변경된 크로스링크가 UI에 정상 반영

---

## Phase 5로 이동된 항목

### 체중 차트 BMI별 권장 범위 시각화 (구 Phase 4 Step 1)

- **이동 이유**: 법적 리스크 HIGH (YMYL 의료정보, 의료기기법 저촉 가능), 구현 비용 HIGH, AdSense 승인과 직접 무관
- **선행 조건**: 의료 면책 프레임워크 확립, 개인정보처리방침 업데이트, IOM 2009 데이터 정리
- **Phase 5 계획**: AdSense 승인 후 도구 고도화 단계에서 진행

### 크로스링크 영역 확장 (구 Phase 4 Step 4)

- **이동 이유**: Step 5 크로스링크 스크립트 완성 후 자동화로 해결. 독립 Step으로 관리할 필요 낮음
- **Phase 5 계획**: 스크립트 기반으로 영상↔타임라인/블로그, 베이비페어↔타임라인/블로그 매핑 자동 생성

### 영상 채널 디렉토리 페이지 (Step 2 결정에서 분리)

- **이동 이유**: `/info` 통합 시 채널 카드를 콘텐츠 카드와 같은 리스트에 섞으면 정체성·필터·AdSense 관점 모두 약화. Phase 4에서는 채널 보기 모드를 제거하고 콘텐츠(블로그+영상)에만 집중
- **선행 조건**: Step 2 통합 안착, 채널 큐레이션 정책 정리(검증 기준·분류)
- **Phase 5 계획**: `/info/channels` 또는 `/channels` 별도 라우트로 부활. 영상 카드 내부 채널명을 클릭하면 해당 채널 상세(채널 메타 + 큐레이션 영상 리스트)로 이동
- **AC**: 채널 디렉토리에서 카테고리 필터 + 채널 카드 클릭 → 채널 상세 + 해당 채널 영상 리스트, 영상 카드의 채널명이 채널 상세로 deep link

### 통합 태그 2단계 계층 필터 (옵션 B)

- **이동 이유**: 콘텐츠 규모(블로그 7개·영상 57개)에서는 단일층(옵션 A)이 적합. 디테일 태그(NIPT·프로게스테론·태아보험가입시기 등)는 정규화 매핑으로 흡수. 콘텐츠 20개+ 시점에 디테일 필터 가치 발생
- **선행 조건**: 블로그 콘텐츠 20개+ 또는 영상 큐레이션 100개+
- **Phase 5 계획**: 1차 필터(통합 태그) 선택 시 펼쳐지는 2차 sub-tag(블로그 디테일 태그 + 영상 sub-category) 도입. 모바일에서 펼침/접힘 UX 검증 필수

### 큐레이션 컬렉션 카드 (옵션 D)

- **이동 이유**: "출산 전 한 달 필독 10선" 같은 편집자형 컬렉션은 운영 리듬이 잡혀야 가치 발생. Phase 4 단계에서는 운영 비용 대비 ROI 낮음
- **선행 조건**: 콘텐츠 추가 빈도 안정화, 컬렉션 정의 스키마 마련(`collections.json` 등)
- **Phase 5 계획**: `/info` 상단에 컬렉션 카드 2~3개 노출 + `/info/collections/[slug]` 컬렉션 상세 라우트
- **AdSense 효과**: "편집자가 큐레이션한 페이지"라는 신호로 thin content 회피 + 신뢰도 향상

### 블로그 front matter 태그 정규화 마이그레이션

- **이동 이유**: Phase 4 Step 2에서는 `unified-tags.ts`의 런타임 동의어 매핑으로 흡수하여 발행된 글의 front matter는 건드리지 않음 (인덱싱·운영 안정성 보호)
- **선행 조건**: 통합 태그 정의 안착, 태그 변경이 SEO·검색에 미치는 영향 모니터링
- **Phase 5 계획**: 모든 블로그 front matter `tags`를 통합 태그 키로 일괄 정규화. 일괄 마이그레이션 스크립트 + 본문 태그 사용 흔적(`#태그` 등) 동시 정리. 마이그레이션 후 `unified-tags.ts`의 동의어 매핑은 안전망으로 유지

### 영상 데이터 `registered_date` 백필

- **이동 이유**: Phase 4 Step 2에서는 영상에 등록일 필드가 없어 "블로그 그룹 → 영상 그룹" 순서로 노출. 엄격한 시간 혼합 정렬은 데이터 백필 후 가능
- **선행 조건**: 채널 API 또는 운영자 수기 데이터로 등록일 확보
- **Phase 5 계획**: `videos.json`에 `registered_date` 필드 추가, `VideoItem` 타입 갱신, `/info` 정렬 로직을 단일 시간축 최신순으로 통합

### 영상 sub-category 진입점 (필요 시)

- **이동 이유**: Step 2에서 sub-category 필터를 `/info`에서 제거. 세부 토픽은 검색(`fuse.js`)으로 도달 가능하므로 우선순위 낮음
- **Phase 5 계획**: 위 옵션 B(2단계 계층 필터)에 sub-category를 흡수하거나, 채널 상세 페이지 내부 필터로 흡수

---

## 종합 우선순위 매트릭스

| 기능 | 사이트 정체성 | AdSense 영향 | SEO 가치 | 구현 비용 | 법적 리스크 | 추천 순위 |
|------|-------------|-------------|---------|----------|-----------|----------|
| **Step 1. 체크리스트 허브** | ★★★★★ | ★★★★ | ★★★★★ | ★★★ (Med) | ★☆ (Low) | **1순위** |
| **Step 2. 정보 탭 통합** | ★★★★ | ★★★★ | ★★★★ | ★★☆ (Low) | ★☆ (Low) | **2순위** |
| **Step 3. 관련 콘텐츠 추천** | ★★★ | ★★★★★ | ★★★ | ★★☆ (Low) | ★☆ (Low) | **3순위** |
| **Step 4. 공유 기능** | ★★★ | ★★★ | ★★ | ★★☆ (Low) | ★★ (Med) | **4순위** |
| **Step 5. 크로스링크 스크립트** | ★★ | ★★★★ | ★★★ | ★★★ (Med) | ★☆ (Low) | **5순위** |

---

## 일정 계획

| 주차 | 기간 | 개발 작업 | 비고 |
|------|------|----------|------|
| W1 | 4/28~5/04 | Step 1 (체크리스트 허브 + 데이터 3종) + Step 2 (정보 탭 통합) | 병렬 작업. BottomNav 재구성 포함 |
| W2 | 5/05~5/11 | Step 3 (관련 콘텐츠 추천) + Step 4 (공유 기능) | 독립 작업, 병렬 가능 |
| W3 | 5/12~5/18 | Step 5 (크로스링크 스크립트) + QA + 리그레션 테스트 | |

### 마일스톤

| 마일스톤 | 완료 기준 | 목표일 |
|---------|----------|--------|
| M4-A: 사이트 정체성 확립 | 체크리스트 허브 4종 + 정보 탭 통합 + BottomNav 재구성 | 5/04 |
| M4-B: 콘텐츠 네트워크 | 관련 콘텐츠 추천 + 공유 기능 | 5/11 |
| M4-C: 자동화 기반 | 크로스링크 스크립트 + QA | 5/18 |

---

## QA 체크리스트

### 체크리스트 허브

- [ ] 허브 페이지에서 4종 체크리스트 카드 표시
- [ ] 각 체크리스트 체크/언체크 인터랙션 정상
- [ ] localStorage 독립 저장 (체크리스트 간 데이터 격리)
- [ ] 커스텀 아이템 추가/삭제 동작
- [ ] 진행률(%) 실시간 표시
- [ ] 관련 콘텐츠 CTA 정상 이동
- [ ] 모바일 터치 인터랙션 정상

### 정보 탭 통합

- [ ] 블로그 + 영상 혼합 리스트 표시
- [ ] 탭 전환 (전체/블로그/영상) 정상
- [ ] 통합 태그 필터 정상 (블로그 + 영상 동시 필터링)
- [ ] 기존 URL 리다이렉트 정상 (/articles → /info, /videos → /info?tab=videos)
- [ ] 블로그 상세 URL `/articles/[slug]` 유지

### 관련 콘텐츠 추천

- [ ] 아티클 하단에 관련 글 3개 표시
- [ ] 태그 겹침 우선 + 최신 글 보충 정상
- [ ] 관련 체크리스트/타임라인/영상 링크 표시
- [ ] 아티클 1개일 때 에러 없음

### 공유 기능

- [ ] 모바일: Web Share API 네이티브 시트 표시
- [ ] 데스크톱: 링크 복사 + 토스트 알림
- [ ] 체크리스트 페이지 공유 정상
- [ ] OG 메타 태그 프리뷰 정상
- [ ] GA4 `share` 이벤트 전송

### 크로스링크 스크립트

- [ ] `--dry-run` 변경 예정 사항 출력
- [ ] `--apply` 파일 정상 갱신
- [ ] `manual` 매핑 보호 확인
- [ ] 실행 후 `npm run build` 성공

### BottomNav & 네비게이션

- [ ] 5탭 구성: 홈 / 체크리스트 / 정보 / 체중 / 더보기
- [ ] 각 탭 이동 정상
- [ ] 더보기 메뉴에서 베이비페어/서비스소개/연락처 접근 가능
- [ ] 활성 탭 하이라이트 정상

### 빌드 & 배포

- [ ] `npm run build` 성공
- [ ] 기존 E2E 테스트 전체 통과
- [ ] 신규 기능 E2E 테스트 추가 및 통과
- [ ] Lighthouse SEO 90+ 유지
