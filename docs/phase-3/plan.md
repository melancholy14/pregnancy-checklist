# Phase 3: 누락 기능 보완 + AdSense 승인 준비 — Development Plan

> Phase 2.5 기록: [../phase-2.5/plan.md](../phase-2.5/plan.md)
> AdSense 감사 리포트: [../plan/adsense-audit.md](../plan/adsense-audit.md)
> Date: 2026-04-17
> 목표 완료: 2026-05-01
> Status: ✅ 개발 완료 (2026-04-20) — 운영자 콘텐츠 작업 진행 중

---

## Overview

Phase 2.5에서 UX 개선 + 리텐션 강화를 완료했으나,
**AdSense 승인에 필요한 광고 인프라와 누락된 기능**이 남아있다.

Phase 3은 **AdSense 승인 통과 + 도구/콘텐츠 품질 보강 + 누락 기능 구현**에 집중한다.

### 왜 지금 해야 하는가

| 이유 | 설명 |
|------|------|
| **AdSense 승인 불가 상태** | 스크립트 미로드, AdUnit 미배치, ads.txt 없음 — 신청해도 심사 자체가 진행되지 않음 |
| **YMYL 신뢰도 결여** | 참고자료 URL 30개+ 미삽입, reviewed_by 빈 필드, 의료 디스클레이머 미구현 |
| **개인정보 정책 불일치** | 개인정보처리방침에 "쿠키 동의 배너 제공"이라 명시했으나 실제 구현 없음 |
| **도구 페이지 텍스트 부재** | 심사 봇이 텍스트를 파싱하는데, 도구 페이지에 설명이 없어 "가치 낮은 콘텐츠"로 판정 위험 |
| **GA4 이벤트 누락** | PRD 정의 이벤트 3종(`category_tab_switch`, `timeline_scroll_depth`, `onboarding_banner_click`)이 미구현 |
| **검색 기능 부재** | Phase 2.5에서 선택사항으로 빠졌으나, 콘텐츠 15개+ 시 탐색성 필수 |

### 현재 상태 (AS-IS) vs 목표 (TO-BE)

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| AdSense 스크립트 | `<meta>` 태그만 존재 | `adsbygoogle.js` 로드 + AdUnit 3곳+ 배치 |
| ads.txt | 미존재 | `public/ads.txt` 생성 |
| 쿠키 동의 배너 | 미구현 (방침에만 명시) | CookieConsentBanner 구현, 거부 시 GA4/AdSense 비활성화 |
| canonical URL | `{{SITE_URL}}` 플레이스홀더 잔존 | 실제 도메인으로 일괄 치환 |
| 도구 페이지 설명 | 위젯만 존재, 텍스트 없음 | 5개 페이지 200~300자 설명 추가 |
| reviewed_by | 9개 아티클 전부 `""` (빈 문자열) | 빈 필드 제거 + 의료 디스클레이머 공통 컴포넌트 |
| GA4 커스텀 이벤트 | 3종 미전송 | 3종 sendGAEvent 호출 구현 |
| 검색 | 없음 | fuse.js 기반 클라이언트 사이드 검색 |
| 영상 크로스링크 | 타임라인 → 영상 연결 없음 | `linked_video_ids` 필드 + 관련 영상 링크 |
| 채널 썸네일 | 수동 URL | YouTube API 기반 자동 수집 스크립트 |
| Lighthouse SEO | 수동 확인 | 자동 검증 스크립트 + CI 연동 |
| 체중 ↔ 블로그 | 상호 링크 없음 | 양방향 크로스 링크 |

### AdSense 감사 결과 매핑

adsense-audit.md에서 발견된 이슈를 Phase 3 Step으로 매핑한다.

| 감사 항목 | 심각도 | Phase 3 Step |
|-----------|--------|-------------|
| #1 AdSense 스크립트 미로드 | CRITICAL | Step 0a |
| #2 AdUnit 미사용 | CRITICAL | Step 0a |
| #3 URL-NEEDED 30개+ | CRITICAL | 병렬 운영자 작업 |
| #4 PERSONAL EXPERIENCE 플레이스홀더 | CRITICAL | 병렬 운영자 작업 |
| #5 콘텐츠 양 부족 (9개) | HIGH | 병렬 운영자 작업 |
| #6 도구 페이지 텍스트 빈약 | HIGH | Step 0d |
| #7 reviewed_by 빈 필드 | HIGH | Step 0e |
| #8 쿠키 동의 배너 없음 | HIGH | Step 0b |
| #9 canonical URL 플레이스홀더 | HIGH | Step 0c |
| #10 사이트 내 네비게이션 부족 | MEDIUM | Step 3, Step 6 |
| #11 About 운영자 정보 부족 | MEDIUM | 병렬 운영자 작업 |
| #12 ads.txt 없음 | MEDIUM | Step 0a |

---

## Scope

**In scope:**

- AdSense 인프라 구성 (스크립트 로드, AdUnit 배치, ads.txt)
- 쿠키 동의 배너 구현 (거부 시 GA4/AdSense 비활성화)
- canonical URL 플레이스홀더 수정
- 도구 페이지별 설명 텍스트 추가 (5개)
- reviewed_by 빈 필드 정리 + 의료 디스클레이머 추가
- GA4 커스텀 이벤트 3종 전송 보완
- 클라이언트 사이드 검색 (fuse.js)
- 영상 ↔ 타임라인 크로스 링크 (linked_video_ids)
- 채널 썸네일 수집 스크립트
- Lighthouse SEO 자동 검증
- 체중 페이지 ↔ 블로그 크로스 링크

**Out of scope:**

- 콘텐츠 작성 (URL-NEEDED, PERSONAL EXPERIENCE, 신규 아티클) — 운영자 병렬 진행
- About 페이지 운영자 정보 보강 — 운영자 병렬 진행
- PWA / 푸시 알림
- 서버 사이드 데이터 동기화
- 회원가입 / 로그인

---

## 실행 순서 및 의존성

```
Phase 3 실행 흐름 (의존성 기반)

[독립 — 즉시 착수 가능]
├── Step 0a. AdSense 스크립트 + AdUnit + ads.txt
├── Step 0b. 쿠키 동의 배너
├── Step 0c. canonical URL 수정
├── Step 0d. 도구 페이지 설명 텍스트
├── Step 0e. reviewed_by 정리 + 의료 디스클레이머
├── Step 1. GA4 커스텀 이벤트 3종
└── Step 4. 채널 썸네일 수집 스크립트

[Step 0a 완료 후]
└── Step 0b. 쿠키 동의 배너 (AdSense 비활성화 로직은 스크립트 존재 전제)

[독립 — 별도 착수]
├── Step 2. 클라이언트 사이드 검색 (fuse.js)
├── Step 3. 영상 ↔ 타임라인 크로스 링크
├── Step 5. Lighthouse SEO 자동 검증
└── Step 6. 체중 ↔ 블로그 크로스 링크
```

---

## Step 0a. AdSense 스크립트 로드 + AdUnit 배치 + ads.txt

### 0a-1. 문제 분석

adsense-audit.md #1, #2, #12 해당.

- `src/app/layout.tsx:43-45`에 `<meta name="google-adsense-account">` 태그만 존재
- 실제 `adsbygoogle.js` 스크립트가 `<head>`에 없어 **심사 자체가 불가능**
- `AdUnit` 컴포넌트(`src/components/ads/AdUnit.tsx`)가 존재하지만 어떤 페이지에서도 import 안 됨
- `public/ads.txt` 파일이 없어 프로그래매틱 광고 인증 불가

### 0a-2. 설계

#### `layout.tsx` 스크립트 추가

```html
<!-- 기존 (meta만 있음) -->
<meta name="google-adsense-account" content="ca-pub-6022771079735605" />

<!-- 추가 필요 -->
<script async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6022771079735605"
  crossorigin="anonymous"></script>
```

**주의**: Next.js의 `<Script>` 컴포넌트를 사용하되, `strategy="afterInteractive"`로 설정하여 페이지 로드 성능에 영향을 최소화한다.

```tsx
// src/app/layout.tsx
import Script from 'next/script';

<Script
  async
  src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
  crossOrigin="anonymous"
  strategy="afterInteractive"
/>
```

#### `ads.txt` 생성

```
// public/ads.txt
google.com, pub-6022771079735605, DIRECT, f08c47fec0942fa0
```

#### AdUnit 배치 위치 (최소 3곳)

| 위치 | 파일 | 배치 전략 |
|------|------|-----------|
| 아티클 상세 — 본문 중간 | `src/app/articles/[slug]/page.tsx` | 본문 50% 지점 이후 자연스러운 단락 사이 |
| 아티클 상세 — 하단 | `src/app/articles/[slug]/page.tsx` | 본문 끝 + 관련 글 섹션 사이 |
| 홈 대시보드 | `src/components/home/HomeContent.tsx` | 미니 대시보드 카드 사이 |
| 타임라인 | `src/components/timeline/TimelineContainer.tsx` | 주차 카드 5~10개마다 삽입 |

**배치 원칙:**
- 콘텐츠 몰입을 방해하지 않는 자연스러운 위치
- 모바일에서 스크롤 흐름을 끊지 않는 간격
- AdSense 정책 준수: 클릭 유도 문구 없음, 광고임을 명확히

### 0a-3. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/app/layout.tsx` | `<Script>` 태그 추가 (adsbygoogle.js 로드) |
| `public/ads.txt` | 신규 생성 |
| `src/components/ads/AdUnit.tsx` | 쿠키 동의 상태 체크 로직 추가 (Step 0b와 연동) |
| `src/app/articles/[slug]/page.tsx` | AdUnit 2곳 배치 (본문 중간 + 하단) |
| `src/components/home/HomeContent.tsx` | AdUnit 1곳 배치 |
| `src/components/timeline/TimelineContainer.tsx` | AdUnit 1곳 배치 (조건부 삽입) |

### 0a-4. 완료 조건

- [ ] `adsbygoogle.js` 스크립트가 `<head>`에서 로드됨 (브라우저 DevTools Network 탭 확인)
- [ ] `public/ads.txt`가 `https://pregnancy-checklist.com/ads.txt`로 접근 가능
- [ ] AdUnit이 최소 3개 페이지에 배치되고 DOM에 렌더링됨
- [ ] AdSense 콘솔에서 사이트 크롤링 가능 상태 확인
- [ ] 환경변수(`NEXT_PUBLIC_ADSENSE_CLIENT_ID`) 미설정 시 스크립트·슬롯 모두 미렌더링

---

## Step 0b. 쿠키 동의 배너 구현

### 0b-1. 문제 분석

adsense-audit.md #8 해당.

- `src/app/privacy/page.tsx`에서 "서비스 첫 방문 시 쿠키 사용에 대한 안내를 제공합니다" 명시
- 실제 쿠키 동의 배너가 구현되어 있지 않음
- **개인정보처리방침에 쓴 내용과 실제 구현이 다르면 정책 위반** — AdSense 거절 사유

### 0b-2. 설계

#### 동의 상태 모델

```ts
type CookieConsent = 'pending' | 'accepted' | 'rejected';
```

- `pending`: 첫 방문, 배너 노출
- `accepted`: 동의 → GA4 + AdSense 스크립트 활성화
- `rejected`: 거부 → GA4 + AdSense 스크립트 비활성화

#### 저장 방식

- `localStorage.setItem('cookie-consent', 'accepted' | 'rejected')`
- 배너는 `cookie-consent` 키가 없을 때만 노출

#### UI 레이아웃 (하단 고정 배너)

```
┌─────────────────────────────────────────────────┐
│ 🍪 이 사이트는 서비스 개선과 광고를 위해          │
│    쿠키를 사용합니다. [개인정보처리방침]           │
│                                                 │
│           [ 거부 ]    [ 동의 ]                   │
└─────────────────────────────────────────────────┘
```

- "개인정보처리방침" → `/privacy` 링크
- "동의" → `cookie-consent: accepted` 저장, 배너 닫기
- "거부" → `cookie-consent: rejected` 저장, 배너 닫기, GA4/AdSense 비활성화

#### GA4/AdSense 비활성화 처리

```tsx
// layout.tsx에서 조건부 스크립트 로드
// cookie-consent가 'rejected'이면 GA4/AdSense 스크립트를 로드하지 않음

// 주의: localStorage는 클라이언트에서만 접근 가능
// → 스크립트 로드를 클라이언트 컴포넌트에서 제어하거나,
//   layout.tsx의 Script 태그를 조건부 렌더링하는 래퍼 컴포넌트 필요
```

**구현 접근**: `ConsentGatedScripts` 래퍼 컴포넌트를 만들어 GA4/AdSense 스크립트를 감싼다.

```tsx
// src/components/consent/ConsentGatedScripts.tsx
'use client';

export function ConsentGatedScripts() {
  const consent = useLocalStorage('cookie-consent');
  
  if (consent === 'rejected') return null;
  
  return (
    <>
      <GoogleAnalytics gaId={...} />
      <Script src="adsbygoogle.js" ... />
    </>
  );
}
```

### 0b-3. 구현 계획

| 파일 | 역할 |
|------|------|
| `src/components/consent/CookieConsentBanner.tsx` | 하단 고정 배너 UI + 동의/거부 로직 |
| `src/components/consent/ConsentGatedScripts.tsx` | GA4/AdSense 스크립트 조건부 로드 |
| `src/lib/consent.ts` | 동의 상태 읽기/쓰기 유틸 |
| `src/app/layout.tsx` | 기존 GA4/AdSense 스크립트를 `ConsentGatedScripts`로 교체, `CookieConsentBanner` 추가 |
| `src/components/ads/AdUnit.tsx` | 동의 상태 미확인 시 미렌더링 로직 추가 |

### 0b-4. 완료 조건

- [x] 첫 방문 시 하단에 쿠키 동의 배너가 노출됨
- [x] "동의" 클릭 시 배너 닫히고, GA4/AdSense 정상 로드
- [x] "거부" 클릭 시 배너 닫히고, GA4/AdSense 스크립트 비활성화
- [x] 재방문 시 이전 선택이 유지되어 배너 미노출
- [x] 개인정보처리방침 페이지의 내용과 실제 동작이 일치

### 0b-5. 구현 결과 (2026-04-19)

**생성 파일:**
- `src/lib/consent.ts` — `getConsent()` / `setConsent()` 유틸
- `src/lib/use-consent.ts` — `useConsentAccepted()` 훅 (`useSyncExternalStore` 기반, React 19 대응)
- `src/components/consent/CookieConsentBanner.tsx` — 하단 배너 (`role="dialog"`, BottomNav 위 배치)
- `src/components/consent/ConsentGatedScripts.tsx` — accepted일 때만 GA4 + AdSense 스크립트 로드

**수정 파일:**
- `src/app/layout.tsx` — `GoogleAnalytics` 제거 → `ConsentGatedScripts` + `CookieConsentBanner` 배치
- `src/components/ads/AdUnit.tsx` — `useConsentAccepted()` 체크 추가
- `.gitignore` — `test-results` 추가

**설계 변경점:**
- 배너 문구: "더 나은 서비스 경험을 위해 쿠키를 사용합니다." (광고 직접 언급 제외)
- pending 상태에서 스크립트 미로드 (plan 초안의 `!== "rejected"` → `=== "accepted"` 로 변경)

**E2E:** `e2e/cookie-consent.spec.ts` 7케이스, 전체 254 passed

---

## Step 0c. canonical URL 플레이스홀더 수정

### 0c-1. 문제 분석

adsense-audit.md #9 해당.

- `src/content/articles/infant-vaccination-schedule.md:4`에서 `canonical: "https://{{SITE_URL}}/articles/infant-vaccination-schedule"` 발견
- `{{SITE_URL}}`이 실제 도메인으로 치환되지 않은 상태
- 다른 아티클에도 동일 패턴 존재 가능

### 0c-2. 설계

#### 치환 전략

**방안 A — 일괄 치환 (즉시)**
- 모든 `.md` 파일에서 `{{SITE_URL}}`을 `https://pregnancy-checklist.com`으로 치환
- 장점: 즉시 해결, 단순
- 단점: 새 아티클 추가 시 실수 반복 가능

**방안 B — 빌드 타임 치환 (방지)**
- MD 파싱 로직(`lib/articles.ts`)에서 canonical 필드를 자동 생성
- front matter에 `canonical`이 없으면 `${SITE_URL}/articles/${slug}`로 자동 설정
- 장점: 향후 실수 방지
- 단점: 파싱 로직 수정 필요

**결정: A + B 병행** — 기존 파일은 일괄 치환하고, 파싱 로직에 fallback 자동 생성을 추가한다.

### 0c-3. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/content/articles/*.md` | `{{SITE_URL}}` → `https://pregnancy-checklist.com` 일괄 치환 |
| `src/lib/articles.ts` | canonical 필드 없을 때 자동 생성 fallback 추가 |

### 0c-4. 완료 조건

- [x] 모든 아티클의 canonical URL이 `https://pregnancy-checklist.com/articles/[slug]` 형식으로 정상 출력
- [x] `{{SITE_URL}}` 플레이스홀더가 전체 코드베이스에서 0건
- [x] 새 아티클 추가 시 canonical 미입력해도 자동 생성 동작 확인

### 0c-5. 구현 결과 (2026-04-19)

- 방안 A: front matter 일괄 치환 완료 + TODO 주석 2건 삭제 (`hospital-bag.md`, `baby-items-cost.md`)
- 방안 B: `ArticleMeta`에 `canonical: string` 추가, `parseArticleMeta`에서 front matter 파싱 + `BASE_URL/articles/${slug}` fallback
- `[slug]/page.tsx`에서 하드코딩 canonical → `article.canonical` 사용으로 변경 (단일 진실 원천)
- E2E: `e2e/canonical-url.spec.ts` 16개 테스트 전체 통과

---

## Step 0d. 도구 페이지별 설명 텍스트 추가

### 0d-1. 문제 분석

adsense-audit.md #6 해당.

- 체중 관리, 영상, 베이비페어 등 도구 페이지가 위젯/UI 위주로 **텍스트 콘텐츠가 거의 없음**
- AdSense 심사 봇은 텍스트를 파싱하여 사이트 가치를 판단
- "Low-value content" 거절 사유의 직접적 원인

### 0d-2. 설계

각 도구 페이지 상단에 `PageDescription` 컴포넌트를 배치한다.

| 페이지 | 설명 내용 | 분량 |
|--------|----------|------|
| 타임라인 (`/timeline`) | 임신 주차별 준비 흐름을 한눈에 보는 방법, 현재 주차 자동 하이라이트, 체크리스트 연동 안내 | 200~300자 |
| 체중 관리 (`/weight`) | 임신 중 적정 체중 증가 범위(BMI별), 기록의 중요성, 담당 의료진 상담 권장 | 200~300자 |
| 베이비페어 (`/baby-fair`) | 전국 베이비페어 일정을 놓치지 않는 방법, 진행중/예정/종료 분류 안내 | 200~300자 |
| 영상 (`/videos`) | 검증된 채널의 큐레이션 영상 활용법, 카테고리별 추천 영상 소개 | 200~300자 |
| 정보글 (`/articles`) | 임신·출산·육아 정보글 아카이브, 태그 필터링 안내, 경험 기반 작성 원칙 | 200~300자 |

#### UI 패턴

```
┌─────────────────────────────────────────┐
│  📋 임신 주차별 준비 타임라인            │
│                                         │
│  임신 주차에 맞춰 준비해야 할 항목을      │
│  한눈에 확인하세요. 출산 예정일을 입력     │
│  하면 현재 주차가 자동으로 하이라이트      │
│  됩니다. 각 주차를 펼치면 연결된 체크      │
│  리스트를 바로 관리할 수 있어요.          │
│                                         │
└─────────────────────────────────────────┘
[기존 도구 UI 시작]
```

- 접을 수 있는 UI가 아닌, **항상 노출**되는 고정 텍스트
- 심사 봇이 크롤링할 수 있도록 서버 렌더링(SSG) 시 포함되어야 함

### 0d-3. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/common/PageDescription.tsx` | 공통 설명 텍스트 컴포넌트 (title + description props) |
| `src/components/timeline/TimelineContainer.tsx` | 상단에 PageDescription 추가 |
| `src/app/weight/page.tsx` | 상단에 PageDescription 추가 |
| `src/app/baby-fair/page.tsx` | 상단에 PageDescription 추가 |
| `src/app/videos/page.tsx` | 상단에 PageDescription 추가 |
| `src/app/articles/page.tsx` | 상단에 PageDescription 추가 |

### 0d-4. 완료 조건

- [x] 5개 도구 페이지 모두 설명 텍스트가 렌더링됨
- [x] 빌드된 HTML에 텍스트가 포함됨 (SSG 확인 — `curl` 또는 View Source)
- [x] 모바일에서 텍스트가 도구 UI를 과도하게 밀어내지 않음

### 0d-5. 구현 결과 (2026-04-19)

**생성 파일:**
- `src/components/common/PageDescription.tsx` — 공통 설명 텍스트 컴포넌트 (`children` prop, `text-sm leading-relaxed`)

**수정 파일:**
- `src/components/timeline/TimelineContainer.tsx` — 기존 짧은 p → PageDescription
- `src/components/weight/WeightContainer.tsx` — 기존 짧은 p → PageDescription
- `src/components/babyfair/BabyfairContainer.tsx` — 기존 짧은 p → PageDescription
- `src/components/videos/VideosContainer.tsx` — 기존 짧은 p → PageDescription
- `src/components/articles/ArticlesContainer.tsx` — 기존 짧은 p → PageDescription

**설계 변경점:**
- plan 초안은 `title + description` props였으나, 기존 h1이 이미 제목 역할을 하므로 `children` prop만 사용하는 심플한 구조로 변경
- 5개 페이지 `mb-6`으로 간격 통일 (기존 Weight·Articles는 mb-8)

**E2E:** `e2e/page-description.spec.ts` 7케이스, 전체 261 passed

---

## Step 0e. reviewed_by 필드 정리 + 의료 디스클레이머 추가

### 0e-1. 문제 분석

adsense-audit.md #7 해당.

- 9개 아티클 모두 `reviewed_by: ""` — 빈 값 노출은 "전문가 리뷰를 받지 않았다"를 명시하는 것과 동일
- YMYL(Your Money Your Life) 카테고리에서 의료 정보 신뢰도에 직접 영향
- 의료 디스클레이머가 아티클 상세 페이지에 없음

### 0e-2. 설계

#### reviewed_by 처리

- 9개 아티클의 `reviewed_by: ""` 필드를 **front matter에서 제거**
- 아티클 상세 페이지 렌더링에서 `reviewed_by` 관련 UI 요소가 있다면 빈 값일 때 미노출 처리
- 향후 실제 전문가 리뷰 시 다시 추가

#### 의료 디스클레이머 공통 컴포넌트

```
┌─────────────────────────────────────────┐
│  ℹ️ 본 글은 일반 정보 제공 목적이며,     │
│     의학적 조언을 대체하지 않습니다.       │
│     정확한 진단과 치료는 담당 의료진과     │
│     상담하세요.                          │
└─────────────────────────────────────────┘
```

- 모든 아티클 상세 페이지 **본문 상단**에 일괄 노출
- 시각적으로 본문과 구분되는 경고성 카드 (shadcn Alert 또는 커스텀)
- 아티클 front matter에 `medical: true/false` 같은 분기 없이 **모든 아티클에 무조건 적용**
  - 이유: 임신·출산·육아 콘텐츠는 모두 YMYL에 해당

### 0e-3. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/content/articles/*.md` (9개) | `reviewed_by: ""` 줄 제거 |
| `src/components/articles/MedicalDisclaimer.tsx` | 의료 디스클레이머 카드 컴포넌트 신규 |
| `src/app/articles/[slug]/page.tsx` | 본문 상단에 `MedicalDisclaimer` 삽입 |

### 0e-4. 완료 조건

- [x] 모든 아티클 front matter에서 `reviewed_by: ""` 제거됨 (grep 0건)
- [x] 모든 아티클 상세 페이지 본문 상단에 의료 디스클레이머 노출
- [x] 디스클레이머 텍스트가 SSG HTML에 포함됨

### 0e-5. 구현 결과 (2026-04-19)

**생성 파일:**
- `src/components/articles/MedicalDisclaimer.tsx` — `text` prop으로 아티클별 면책 문구 표시 (pastel-mint 카드)

**수정 파일:**
- `src/content/articles/*.md` (6개) — `reviewed_by: ""` 제거
- `src/types/article.ts` — `Article`에 `disclaimer?: string` 추가
- `src/lib/articles.ts` — `⚠️` blockquote를 `disclaimer`로 추출, 본문에서 제거
- `src/components/articles/ArticleDetail.tsx` — MedicalDisclaimer 삽입 (본문 상단)

**설계 변경점:**
- plan 초안은 동일 문구를 모든 아티클에 적용하는 방식이었으나, 기존 MD 본문의 주제별 면책 문구를 파싱하여 아티클마다 다른 전문가를 안내하도록 변경
  - 임신·검사 글 → 산부인과 전문의
  - 보험·재무 글 → 보험설계사 또는 재무설계 전문가
  - 육아 글 → 소아청소년과 전문의
- blockquote 중복 제거: MD 본문의 `⚠️` blockquote를 추출하여 컴포넌트로 이동

**E2E:** `e2e/medical-disclaimer.spec.ts` 8케이스, 전체 통과

---

## Step 1. GA4 커스텀 이벤트 3종 전송 보완

### 1-1. 문제 분석

PRD에 정의된 GA4 커스텀 이벤트 중 3종이 실제 `sendGAEvent` 호출 코드 없이 누락되어 있다.

| 이벤트 | 설명 | 현재 상태 |
|--------|------|-----------|
| `category_tab_switch` | 카테고리 필터 변경 | ❌ 미구현 |
| `timeline_scroll_depth` | 타임라인 스크롤 도달 주차 | ❌ 미구현 |
| `onboarding_banner_click` | 예정일 유도 배너 클릭 | ❌ 미구현 |

### 1-2. 설계

#### `category_tab_switch`

- **위치**: `src/components/timeline/TimelineContainer.tsx` — 카테고리 필터 칩 클릭 핸들러
- **파라미터**: `{ category: string }`
- **트리거**: 사용자가 카테고리 필터를 변경할 때마다 전송

```tsx
const handleCategoryChange = (category: string) => {
  setSelectedCategory(category);
  sendGAEvent('category_tab_switch', { category });
};
```

#### `timeline_scroll_depth`

- **위치**: `src/components/timeline/TimelineContainer.tsx`
- **파라미터**: `{ max_week_visible: number }`
- **트리거**: IntersectionObserver로 현재 화면에 보이는 최대 주차 추적
- **전송 빈도**: 디바운스 — 스크롤 멈춘 후 1초 뒤 전송 (과다 전송 방지)

```tsx
// IntersectionObserver로 각 주차 카드의 가시성 추적
// 가시성 변경 시 maxVisibleWeek 업데이트
// debounce 1초 후 sendGAEvent('timeline_scroll_depth', { max_week_visible })
```

#### `onboarding_banner_click`

- **위치**: 타임라인·블로그 페이지의 예정일 유도 배너
- **파라미터**: `{ source_page: string }`
- **트리거**: 유도 배너의 CTA 버튼 클릭 시

```tsx
const handleBannerClick = () => {
  sendGAEvent('onboarding_banner_click', { source_page: 'timeline' });
  // 기존 네비게이션 로직
};
```

### 1-3. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/timeline/TimelineContainer.tsx` | `category_tab_switch` + `timeline_scroll_depth` 이벤트 추가 |
| 타임라인 예정일 배너 컴포넌트 | `onboarding_banner_click` 이벤트 추가 |
| 블로그 상단 유도 배너 컴포넌트 | `onboarding_banner_click` 이벤트 추가 |

### 1-4. 완료 조건

- [x] GA4 DebugView에서 `category_tab_switch` 이벤트 전송 확인 (카테고리 파라미터 포함)
- [x] GA4 DebugView에서 `timeline_scroll_depth` 이벤트 전송 확인 (max_week_visible 파라미터 포함)
- [x] GA4 DebugView에서 `onboarding_banner_click` 이벤트 전송 확인 (source_page 파라미터 포함)
- [x] 스크롤 이벤트가 과다 전송되지 않음 (디바운스 동작 확인)

### 1-5. 구현 결과 (2026-04-19)

plan 초안의 3종에 추가로 3종을 더 구현하여 총 6종 이벤트 추가.

**생성 파일:**
- `src/components/analytics/PageviewTracker.tsx` — 수동 페이지뷰 트래킹 (usePathname 기반)

**수정 파일:**
- `src/components/consent/ConsentGatedScripts.tsx` — `send_page_view:false` 추가 (중복 방지)
- `src/app/layout.tsx` — PageviewTracker 배치
- `src/components/timeline/CategoryFilter.tsx` — `category_tab_switch` 이벤트
- `src/components/timeline/TimelineContainer.tsx` — `timeline_scroll_depth` (IntersectionObserver + 디바운스 1초)
- `src/components/timeline/TimelineAccordionCard.tsx` — `timeline_week_view` 이벤트
- `src/components/home/DueDateBanner.tsx` — `onboarding_banner_click` 이벤트
- `src/components/videos/VideoCard.tsx` — `content_click` (type: video)
- `src/components/videos/ChannelCard.tsx` — `content_click` (type: channel)
- `src/components/articles/ArticleCard.tsx` — `content_click` (type: article)

**E2E:** `e2e/ga4-events.spec.ts` 6케이스, 전체 통과

---

## Step 2. 클라이언트 사이드 검색 (fuse.js)

### 2-1. 문제 분석

Phase 2.5에서 선택사항으로 언급되었으나 미구현.
콘텐츠가 15개+로 늘어나면 탐색성이 떨어지므로 검색 기능이 필수.

### 2-2. 설계

#### 검색 대상

| 데이터 소스 | 검색 필드 | 결과 유형 |
|------------|----------|-----------|
| `timeline_items.json` | `title`, `description` | 타임라인 |
| 블로그 아티클 메타 | `title`, `tags`, `description` | 블로그 |

#### 검색 인덱스 구조

```ts
type SearchItem = {
  type: 'timeline' | 'article';
  title: string;
  description: string;
  url: string;  // 클릭 시 이동할 경로
  tags?: string[];
  week?: number;  // 타임라인 항목일 때
};
```

#### fuse.js 설정

```ts
const fuse = new Fuse(searchItems, {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'description', weight: 1 },
    { name: 'tags', weight: 1.5 },
  ],
  threshold: 0.4,        // 유사도 허용 범위
  minMatchCharLength: 2, // 최소 2자
});
```

#### UI 플로우

1. Sticky 헤더의 검색 아이콘(🔍) 클릭
2. **풀스크린 검색 모달** 열림
3. 검색어 입력 (디바운스 300ms)
4. 결과 리스트: 타임라인 / 블로그 섹션 분리

```
┌─────────────────────────────────────────┐
│  🔍 [검색어 입력                    ] ✕ │
│─────────────────────────────────────────│
│                                         │
│  📋 타임라인                             │
│  ├─ 임신 12주: 초기 검사 완료하기        │
│  ├─ 임신 28주: 입원 가방 준비 시작       │
│  └─ 임신 36주: 출산 호흡법 연습          │
│                                         │
│  📰 정보글                               │
│  ├─ 출산 가방 필수 준비물 총정리          │
│  └─ 임신 주차별 검사 & 준비 가이드        │
│                                         │
└─────────────────────────────────────────┘
```

- 결과 없을 때: "검색 결과가 없습니다" 안내
- 결과 클릭 시 모달 닫히고 해당 페이지로 이동
- 타임라인 결과 클릭 시 `/timeline`으로 이동 + 해당 주차 스크롤
- 블로그 결과 클릭 시 `/articles/[slug]`으로 이동

### 2-3. 구현 계획

| 파일 | 역할 |
|------|------|
| `src/components/search/SearchModal.tsx` | 풀스크린 검색 모달 UI |
| `src/components/search/SearchResult.tsx` | 검색 결과 아이템 컴포넌트 |
| `src/lib/search.ts` | fuse.js 인스턴스 생성 + 검색 인덱스 구축 |
| `src/components/layout/StickyHeader.tsx` | 검색 아이콘 추가 + 모달 트리거 |

**의존성 추가:**

```bash
npm install fuse.js
```

### 2-4. 완료 조건

- [x] Sticky 헤더에 검색 아이콘이 노출됨
- [x] 검색 모달에서 타임라인·정보글·영상 결과가 정상 노출
- [x] 최소 2자 이상 입력 시 검색 동작 (1자는 무시)
- [x] 결과 클릭 시 해당 페이지로 정상 이동
- [x] 모달 외부 클릭 또는 ✕ 버튼으로 닫기 동작
- [x] 검색어 없을 때 "검색어를 입력하세요" 안내 표시
- [x] 타임라인 결과 클릭 시 `/timeline#timeline-week-N`으로 이동+스크롤
- [x] 영상 결과 클릭 시 `/videos#video_id`로 이동+스크롤+하이라이트

### 2-5. 구현 결과 (2026-04-19)

**생성 파일:**
- `src/lib/search.ts` — `SearchItem` 타입 + `buildSearchIndex()` + `createSearcher()` (fuse.js 래퍼)
- `src/store/useSearchStore.ts` — 모달 open/close Zustand store
- `src/components/search/SearchModal.tsx` — Dialog + 순수 리스트 기반 검색 모달 (fuse.js 검색)

**수정 파일:**
- `src/components/layout/StickyHeader.tsx` — Search 아이콘 버튼 추가 (ml-auto 우측 배치)
- `src/app/layout.tsx` — `getAllArticles()` 호출 + `<SearchModal>` 배치
- `src/components/videos/VideoCard.tsx` — 루트 `<a>`에 `id={video.id}` 추가
- `src/components/videos/VideosContainer.tsx` — hash 감지 → `scrollIntoView` + 2초 하이라이트
- `src/components/timeline/TimelineContainer.tsx` — hash 존재 시 자동 스크롤 생략 가드 + 타이머 cleanup

**설계 변경점:**
- plan 초안은 타임라인+블로그 2그룹이었으나, 영상(30개) 추가로 3그룹(타임라인/정보글/영상) 구성
- plan 초안은 cmdk `CommandDialog`를 사용했으나, `shouldFilter={false}` 전달 불가 + render 중 setState 문제로 cmdk 완전 제거 → Radix Dialog + 순수 리스트(`role="listbox"` + `role="option"`) + 화살표 키 네비게이션 직접 구현
- 타임라인 자동 스크롤이 hash 스크롤을 덮어쓰는 버그 발견 → `window.location.hash` 가드 추가

**E2E:** `e2e/client-search.spec.ts` 13케이스, 전체 통과

---

## Step 3. 영상 ↔ 타임라인 크로스 링크 (linked_video_ids)

### 3-1. 문제 분석

타임라인에서 관련 영상으로 연결하는 크로스 링크가 없어,
영상 콘텐츠의 발견성이 낮고 기능 간 사일로가 존재한다.

### 3-2. 설계

#### 데이터 모델 변경

```ts
// src/types/timeline.ts
export type TimelineItem = {
  // ... 기존 필드
  linked_video_ids?: string[];  // 신규 — videos.json의 id 참조
};
```

#### 매핑 예시 (timeline_items.json)

| 타임라인 항목 | 연결 영상 카테고리 |
|--------------|-------------------|
| 임산부 운동 관련 주차 | 임산부 운동 영상 |
| 출산 호흡법 연습 | 출산 준비 영상 |
| 신생아 케어 준비 | 신생아 케어 영상 |

#### UI: TimelineAccordionCard 하단

```
┌─────────────────────────────────────────┐
│  📅 32주: 입원 가방 준비 시작             │
│  ───────────────────────────────────────│
│  ☐ 산모 수첩 확인                        │
│  ☐ 출산 가방 체크리스트 확인              │
│  ───────────────────────────────────────│
│  📰 관련 글: 출산 가방 필수 준비물 →      │  ← 기존 (Phase 2.5)
│  🎬 관련 영상: 출산 준비 필수 영상 →      │  ← 신규
└─────────────────────────────────────────┘
```

- 기존 `RelatedArticlesLink`와 동일한 패턴으로 `RelatedVideosLink` 추가
- 클릭 시 `/videos` 페이지로 이동 (해당 영상/카테고리 하이라이트)

### 3-3. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/types/timeline.ts` | `linked_video_ids?: string[]` 필드 추가 |
| `src/data/timeline_items.json` | 주요 항목에 영상 ID 매핑 (5~10개) |
| `src/components/timeline/RelatedVideosLink.tsx` | 관련 영상 링크 컴포넌트 신규 |
| `src/components/timeline/TimelineAccordionCard.tsx` | `RelatedVideosLink` 배치 |

### 3-4. 완료 조건

- [x] `linked_video_ids`가 있는 타임라인 카드에서 "관련 영상" 링크 노출
- [x] 링크 클릭 시 `/videos` 페이지로 정상 이동
- [x] `linked_video_ids`가 없는 카드에서는 링크 미노출
- [x] 타입 정의가 정상 업데이트됨 (빌드 에러 없음)

### 3-5. 구현 결과 (2026-04-19)

**생성 파일:**
- `src/components/timeline/RelatedVideosLink.tsx` — Play 아이콘 + `/videos#video_id` 링크 리스트 (RelatedArticlesLink 미러링)

**수정 파일:**
- `src/types/timeline.ts` — `linked_video_ids?: string[]` 추가
- `src/data/timeline_items.json` — 8개 항목에 영상 ID 매핑 (12, 21, 22, 25, 30, 31, 32, 34주)
- `src/components/timeline/TimelineAccordionCard.tsx` — `relatedVideos` prop + 렌더링
- `src/components/timeline/TimelineContainer.tsx` — `videos` prop, `videoMap` 구축
- `src/app/timeline/page.tsx` — `videos.json` 로드 + 전달

**E2E:** `e2e/cross-links-video-weight.spec.ts` 13케이스 (Step 3: 8개 + Step 6: 5개), 전체 310 passed

---

## Step 4. 채널 썸네일 수집 스크립트

### 4-1. 문제 분석

현재 `channels.json`의 채널 썸네일 URL이 수동 입력 방식.
YouTube Data API v3를 활용한 자동 수집 스크립트가 필요.

### 4-2. 설계

#### 스크립트 동작 흐름

```
channels.json 읽기
→ channel_id 추출
→ YouTube Data API v3 channels.list 호출
→ snippet.thumbnails.default.url 획득
→ channels.json의 thumbnailUrl 필드 갱신
→ 파일 저장
```

#### API 호출

```ts
// GET https://www.googleapis.com/youtube/v3/channels
// ?part=snippet
// &id={channel_id_1},{channel_id_2},...
// &key={YOUTUBE_API_KEY}
```

- **배치 처리**: API 호출 1회에 최대 50개 채널 조회 가능
- **API 키 없을 때**: 수동 URL 입력 방식 유지 (fallback)

### 4-3. 구현 계획

| 파일 | 역할 |
|------|------|
| `scripts/fetch-channel-thumbs.ts` | 메인 스크립트 |
| `.env.local` | `YOUTUBE_API_KEY` 추가 (커밋 안 함) |
| `.env.example` | `YOUTUBE_API_KEY=` 항목 추가 (커밋) |

### 4-4. 완료 조건

- [x] `npx tsx scripts/fetch-channel-thumbs.ts` 실행 시 `channels.json` 썸네일 URL 업데이트
- [x] API 키 미설정 시 에러 메시지 + 수동 입력 안내 출력
- [x] 기존 수동 URL이 있는 채널은 덮어쓰지 않음 (옵션: `--force` 플래그로 강제 갱신)

### 4-5. 구현 결과 (2026-04-20)

**생성 파일:**
- `scripts/fetch-channel-thumbs.ts` — YouTube Data API v3 배치 호출, `--force` 옵션, 에러 핸들링
- `e2e/fetch-channel-thumbs.spec.ts` — 9개 E2E 테스트 (인프라 3 + 에러 2 + 보존 1 + 무결성 3)

**수정 파일:**
- `package.json` — `tsx` ^4.21.0 devDependency + `fetch-channel-thumbs` npm script
- `.env.example` — `YOUTUBE_API_KEY` 항목 추가

**코드 리뷰:** Critical 0건, Warning 1건 수정 (catch 블록 API 키 노출 방지)
**E2E:** 9/9 passed (1.8s)

---

## Step 5. Lighthouse SEO 자동 검증

### 5-1. 문제 분석

배포 후 SEO 품질을 수동으로 확인하고 있어, 퇴행(regression)을 감지하기 어렵다.

### 5-2. 설계

#### 검증 대상 페이지 (5개)

| 페이지 | URL |
|--------|-----|
| 홈 | `/` |
| 타임라인 | `/timeline` |
| 베이비페어 | `/baby-fair` |
| 블로그 목록 | `/articles` |
| 블로그 상세 (샘플) | `/articles/hospital-bag` |

#### 통과 기준

- SEO 카테고리: **90점 이상**
- Accessibility 카테고리: 참고 수집 (pass/fail 판정은 하지 않음)

#### 스크립트 동작

```bash
# scripts/lighthouse-check.sh

#!/bin/bash
set -e

PAGES=("/" "/timeline" "/baby-fair" "/articles" "/articles/hospital-bag")
BASE_URL="${1:-http://localhost:3000}"
PASS=true

for page in "${PAGES[@]}"; do
  score=$(lighthouse "$BASE_URL$page" --output=json --only-categories=seo \
    | jq '.categories.seo.score * 100')
  echo "$page: SEO $score"
  if (( $(echo "$score < 90" | bc -l) )); then
    PASS=false
  fi
done

if [ "$PASS" = false ]; then
  echo "FAIL: Some pages scored below 90"
  exit 1
fi
echo "PASS: All pages scored 90+"
```

#### CI 연동 (선택)

```yaml
# .github/workflows/deploy.yml (optional step)
- name: Lighthouse SEO Check
  run: |
    npm install -g lighthouse
    bash scripts/lighthouse-check.sh https://pregnancy-checklist.com
  continue-on-error: true  # 실패해도 배포는 진행
```

### 5-3. 구현 계획

| 파일 | 역할 |
|------|------|
| `scripts/lighthouse-check.sh` | Lighthouse CLI 기반 SEO 검증 스크립트 |
| `.github/workflows/deploy.yml` | optional step 추가 (continue-on-error) |

### 5-4. 완료 조건

- [x] `bash scripts/lighthouse-check.sh` 실행 시 7개 페이지 SEO 점수 출력
- [x] 90점 미만 페이지 있으면 exit 1 반환
- [x] GitHub Actions에서 optional step으로 실행 가능

### 5-5. 구현 결과 (2026-04-20)

**생성 파일:**
- `scripts/lighthouse-check.sh` — 7개 페이지 SEO 90+ 자동 검증 (개별 에러 핸들링, node JSON 파싱)
- `e2e/lighthouse-seo.spec.ts` — 45개 E2E 테스트 (SEO 필수 요소 42 + 인프라 3)

**수정 파일:**
- `package.json` — `lighthouse` ^12.8.2 devDependency + `lighthouse-check` npm script
- `.github/workflows/deploy-gh-pages.yml` — Build→Deploy 사이 optional Lighthouse step

**검증 결과:** 7개 페이지 SEO 100점, A11y 90~95점, E2E 45/45 passed

---

## Step 6. 체중 페이지 ↔ 블로그 크로스 링크

### 6-1. 문제 분석

`pregnancy-weight-management.md` 아티클과 체중 관리 페이지(`/weight`)가 상호 연결되어 있지 않아,
콘텐츠 간 시너지가 낮고 사용자 탐색 경로가 끊긴다.

### 6-2. 설계

#### 체중 페이지 → 블로그

`WeightContainer` 하단에 링크 카드 추가:

```
┌─────────────────────────────────────────┐
│  📰 임신 중 체중 관리 가이드              │
│  BMI별 적정 체중 증가 범위, 주차별       │
│  체중 변화 패턴을 자세히 알아보세요.       │
│                        [자세히 보기 →]    │
└─────────────────────────────────────────┘
```

#### 블로그 → 체중 페이지

`pregnancy-weight-management.md` 본문 하단에 CTA 추가:

```markdown
> 💡 **내 체중을 직접 기록해보세요!**
> [체중 기록 도구](/weight)에서 주차별 체중 변화를 그래프로 확인할 수 있습니다.
```

### 6-3. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/app/weight/page.tsx` 또는 `WeightContainer` | 하단에 블로그 링크 카드 추가 |
| `src/content/articles/pregnancy-weight-management.md` | 본문 하단에 체중 기록 CTA 추가 |

### 6-4. 완료 조건

- [x] 체중 페이지 하단에 "임신 중 체중 관리 가이드" 링크 카드 노출
- [x] 링크 클릭 시 `/articles/pregnancy-weight-management`로 이동
- [x] 블로그 글 하단에 "체중 기록 도구" CTA 노출
- [x] CTA 클릭 시 `/weight`로 이동

### 6-5. 구현 결과 (2026-04-19)

**이미 완료:**
- 체중 → 블로그: `WeightContainer.tsx`에 하드코딩된 링크 카드 기존 존재

**수정 파일:**
- `src/content/articles/pregnancy-weight-management.md` — 참고 자료 섹션 위에 `💡` 블록쿼트 CTA 추가 (`[체중 기록 도구](/weight)`)

**설계 변경점:**
- plan 초안은 컴포넌트 방식이었으나, 마크다운 블록쿼트가 기존 렌더링 파이프라인에 자연스럽게 통합되므로 마크다운 내 CTA로 변경

**E2E:** Step 3과 공유 (`e2e/cross-links-video-weight.spec.ts`)

---

## 병렬 진행: 콘텐츠 품질 보강 (운영자 작업)

> 아래 항목은 개발 작업과 병렬로 운영자가 진행한다.
> 2~3일 간격으로 콘텐츠를 추가/보강.

### 운영자 작업 목록

| 작업 | 심각도 | 예상 기간 | 비고 |
|------|--------|----------|------|
| `<!-- URL-NEEDED -->` 참고자료 링크 전수 삽입 (~30개) | CRITICAL | 1~2일 | 9개 아티클 전체 |
| `<!-- PERSONAL EXPERIENCE -->` 실제 경험담 교체 | CRITICAL | 2~3일 | 9개 아티클 전체 |
| 신규 아티클 추가 (최소 6개, 15개 목표) | HIGH | 2~3주 | 2~3일 간격 |
| About 페이지 운영자 정보 보강 (필명, 프로필 이미지) | MEDIUM | 1일 | |
| `infant-vaccination-schedule.md` 1,000단어+ 보강 | HIGH | 1일 | 현재 611단어 |

### 신규 아티클 기획 (9개) — 2026-04-28 확정

> 24주차까지 직접 경험한 주제만 선정. 입덧은 경험하지 않아 제외.
> 기존 발행 5개 + 신규 9개 = 14개 (AdSense 심사 최소 기준 도달).

| 순번 | 제목 (안) | 타겟 키워드 | 경험 근거 | 영상 크로스링크 |
|------|----------|-----------|----------|--------------|
| 1 | 임산부 영양제 복용 가이드 — 엽산·철분·오메가3 주차별 정리 | 임산부 영양제, 엽산 언제까지 | 6주부터 현재까지 복용 중 | video_049~051 |
| 2 | 임신 중 금지 음식·주의 음식 정리 | 임산부 금지 음식, 임신 중 커피 | 일상에서 계속 체크 | video_052~054 |
| 3 | 기형아 검사 종류와 일정 — NIPT·통합선별·쿼드·정밀초음파 경험기 | 기형아 검사, NIPT 검사 | 9~20주 검사 완료 | video_040~045 |
| 4 | 임산부 운동 시작 가이드 — 뭘 하면 되고 뭘 하면 안 되나 | 임산부 운동, 임산부 요가 | 21주부터 운동 시작 | video_001~010 |
| 5 | 국민행복카드·정부 지원 혜택 총정리 (2026) | 국민행복카드, 임산부 혜택 2026 | 10주에 발급 | video_058 |
| 6 | 임신성 당뇨 검사 후기 — 검사 과정과 결과 대처법 | 임신성 당뇨 검사, GDM | 24주 전후 검사 | video_037~039 |
| 7 | 산후조리원 선택 가이드 — 비교 기준과 예약 타이밍 | 산후조리원 선택, 산후조리원 비용 | 12주에 예약 완료 | — |
| 8 | 임산부 수면 자세와 숙면 팁 | 임산부 수면, 임산부 잠자는 자세 | 중기부터 수면 불편 경험 중 | — |
| 9 | 베이비페어 200% 활용법 — 가기 전 준비부터 현장 팁까지 | 베이비페어 꿀팁, 베이비페어 준비 | 18주에 방문 | 베이비페어 페이지 연동 |

**추천 작성 순서** (검색량 + 작성 난이도):
금지 음식 → 영양제 → 기형아 검사 → 국민행복카드 → 임신성 당뇨 → 운동 → 산후조리원 → 수면 → 베이비페어

---

## 일정 계획

| 주차 | 기간 | 개발 작업 | 운영자 작업 |
|------|------|----------|------------|
| W1 | 4/17~4/23 | Step 0a~0e (AdSense 인프라 + YMYL 보완) | URL-NEEDED 링크 삽입 시작 |
| W2 | 4/24~5/01 | Step 1~6 (GA4 + 검색 + 크로스링크 + SEO 검증) | PERSONAL EXPERIENCE 교체 + 신규 아티클 |

### 마일스톤

| 마일스톤 | 완료 기준 | 목표일 | 상태 |
|---------|----------|--------|------|
| M3-A: AdSense 인프라 | 스크립트 로드 + AdUnit + ads.txt + 쿠키 배너 | 4/20 | ✅ 완료 (4/19) |
| M3-B: YMYL 보완 | canonical + reviewed_by + 디스클레이머 + 도구 설명 | 4/23 | ✅ 완료 (4/19) |
| M3-C: 누락 기능 | GA4 + 검색 + 크로스링크 + Lighthouse | 5/01 | ✅ 완료 (4/20) |
| M3-D: 콘텐츠 (운영자) | URL-NEEDED + PERSONAL EXPERIENCE + 신규 6개+ | 5/01 | 🟡 진행 중 |

---

## QA 체크리스트

> 최종 점검일: 2026-04-20

### AdSense 인프라

- [x] `adsbygoogle.js` 스크립트가 페이지 소스에 포함됨
- [x] `ads.txt`가 루트 URL에서 접근 가능
- [x] AdUnit이 아티클 상세, 홈, 타임라인에 렌더링됨
- [x] 환경변수 미설정 시 광고 관련 요소 미렌더링

### 쿠키 동의

- [x] 첫 방문 시 배너 노출
- [x] 동의 후 GA4/AdSense 정상 동작
- [x] 거부 후 GA4/AdSense 비활성화
- [x] 재방문 시 이전 선택 유지

### SEO

- [x] 모든 아티클 canonical URL 정상
- [x] `{{SITE_URL}}` 플레이스홀더 전체 코드베이스에서 0건
- [x] Lighthouse SEO 7개 페이지 90+ (실측 100점)

### GA4

- [x] `category_tab_switch` 구현 완료 (+ 3종 추가, 총 6종)
- [x] `timeline_scroll_depth` 구현 완료 (IntersectionObserver + 디바운스 1s)
- [x] `onboarding_banner_click` 구현 완료

### 검색

- [x] 검색 모달 열림/닫힘 정상
- [x] 타임라인 + 블로그 + 영상 3그룹 결과 노출
- [x] 결과 클릭 시 해당 페이지 이동

### 크로스링크

- [x] 타임라인 → 관련 영상 링크 정상 (8개 주차 매핑)
- [x] 체중 → 블로그 링크 정상
- [x] 블로그 → 체중 CTA 정상

### 빌드 & 배포

- [x] `npm run build` 성공
- [x] 기존 E2E 테스트 전체 통과
- [x] 신규 기능 E2E 테스트 추가 및 통과 (Phase-3: 124개, 전체: 310개)

---

## 콘텐츠 현황 점검 (2026-04-20)

> 개발 완료 후 마케터 관점에서 전 콘텐츠 영역을 점검한 결과.
> 블로그 외 데이터 콘텐츠도 신선도(freshness) 유지가 필요하다.

### 블로그 아티클 — 2026-04-26 업데이트

| 구분 | 수량 | 상태 |
|------|------|------|
| 발행 완료 | 5개 | URL-NEEDED 0건, PERSONAL EXPERIENCE 0건 ✅ |
| 초안 (draft/) | 9개 | PERSONAL EXPERIENCE 11건, URL-NEEDED 19건 잔존 |

**발행 아티클 (5):**

- `early-pregnancy-tests.md` — 임신 초기 필수 검사 총정리 ✅
- `early-pregnancy-fatigue-reasons.md` — 임신 초기에 유난히 피곤한 이유 ✅
- `prenatal-insurance-preparation-guide.md` — 태아보험 비교 ✅
- `weekly-prenatal-checklist.md` — 임신 주차별 검사 & 준비 총정리 ✅
- `pregnancy-weight-management.md` — 임신 중 체중관리 ✅

**초안 아티클 (9):**

| 파일 | 주제 | PERSONAL EXP | URL-NEEDED |
|------|------| :---: | :---: |
| `hospital-bag-draft.md` | 입원 가방 | 2 | 4 |
| `baby-items-cost-draft.md` | 출산 용품 비용 | 2 | 4 |
| `postpartum-care-draft.md` | 산후조리 | 1 | 2 |
| `postpartum-diet.md` | 산후 식단 | 1 | 4 |
| `newborn-bath-tips.md` | 신생아 목욕 | 2 | 4 |
| `infant-vaccination-schedule.md` | 예방접종 | 0 | 0 (611단어, 1000+ 필요) |
| `2026-parenting-subsidy-guide-draft.md` | 2026 육아 지원금 | 1 | 0 |
| `husband-postpartum-checklist-draft.md` | 남편 출산 준비 | 1 | 0 |
| `2026-parental-leave-guide-draft.md` | 2026 육아휴직 | 1 | 1 |

**타임라인 → 아티클 깨진 참조 (6건):** draft로 이동된 아티클 slug이 `timeline_items.json`에 잔존
- week 12: `postpartum-care` → draft
- week 18: `baby-items-cost` → draft
- week 28: `infant-vaccination-schedule` → draft
- week 30: `newborn-bath-tips` → draft
- week 32, 36: `hospital-bag` → draft
- week 37: `postpartum-diet` → draft

**잔여 작업:**
- [x] 발행 아티클 URL-NEEDED 전수 해소 (5개 글 모두 0건)
- [x] 발행 아티클 PERSONAL EXPERIENCE 전수 해소
- [x] 참고자료 포맷 통일 (c2b9bd0)
- [x] 경험하지 못한 글 draft 분리 (e80b320)
- [ ] draft 9개 PERSONAL EXPERIENCE 교체 (11건) + URL-NEEDED 링크 삽입 (19건)
- [ ] `infant-vaccination-schedule.md` 1,000단어+ 보강 (현재 611단어)
- [x] 타임라인 → draft 아티클 깨진 참조 6건 제거 완료
- [ ] 초안 중 우선 3~4개 발행 (5/1 전 목표)

### 베이비페어 (babyfair_events.json) — 2026-04-26 업데이트

| 항목 | 현황 |
|------|------|
| 등록 이벤트 | 41건 (2026-01~12) |
| 상반기 (1~6월) | 27건 ✅ (맘앤베이비엑스포 53회 추가) |
| 하반기 (7~12월) | 14건 (코베 중심, 일부 브랜드 미공개) |
| 지난 이벤트 처리 | ✅ 날짜 경과 시 "지난행사" 카테고리로 자동 분류 |

**하반기 등록 현황 (14건):**

| 월 | 이벤트 |
| ---- | -------- |
| 7월 | 코베 수원 광교 2차 |
| 8월 | 코베 킨텍스 2차, 서울베이비키즈페어 Summer, 코베 대전, 코베 대구 3차 |
| 9월 | 코베 청주 2차, 베페 50회, 코베 수원 3차, 창원 KNN |
| 10월 | 코베 부산 2차, 코베 킨텍스 3차, 코베 서울 하반기 |
| 11월 | 코베 수원 4차 |
| 12월 | 코베 대구 4차 |

**하반기 미공개 — 모니터링 필요 (2026-04-26 웹서치 확인):**

| 브랜드 | 예상 시기 | 예상 장소 | 비고 |
| -------- | ---------- | ---------- | ------ |
| ~~맘스홀릭 코엑스 하반기~~ | ~~11~12월~~ | — | ✅ 확인 완료: 2026 두 번째 행사는 6/11~14 마곡 (기존 등록) |
| ~~맘앤베이비엑스포 53회~~ | ~~8~9월~~ | — | ✅ 확인 완료: 6/18~21 킨텍스 (신규 등록) |
| 서울베이비키즈페어 Autumn | 10~11월 | SETEC | 공식 사이트에 Spring/Summer만 게재 |
| 베베페어 하반기 지역 순회 | 7~12월 | 각 지역 | 상반기 6개 지역 개최, 하반기 일정 미공개 |
| 마이비베(MAEB) 하반기 | 9~10월 | 코엑스마곡 | 상반기 3월 개최, 하반기 미공개 |

**잔여 작업:**

- [x] 2026 하반기 베이비페어 정보 확인 (코베·베페 등 14건 등록 완료)
- [x] 맘스홀릭 하반기 확인 → 6/11~14 마곡 (기존 등록 건과 동일)
- [x] 맘앤베이비엑스포 53회 추가 → 6/18~21 킨텍스 (babyfair_events.json 등록 완료)
- [ ] 미공개 3개 브랜드 하반기 일정 공개 시 추가 (7~8월경 재확인 권장)

### 타임라인 (timeline_items.json) — 2026-04-26 업데이트

| 항목 | 현황 |
|------|------|
| 전체 항목 | 37개 (4~40주) |
| 영상 매핑 완료 | 18개 주차 ✅ (기존 8 → 18) |
| 영상 매핑 없음 | 19개 주차 |

**영상 매핑 현황:**

| 주차 | 카테고리 | 매핑 영상 | 비고 |
| ------ | ---------- | ---------- | ------ |
| 4주 | 임신 초기 증상 | video_031, 032 | 신규 |
| 5주 | 생활 습관/금지 음식 | video_033, 052 | 신규 |
| 6주 | 영양제 | video_049, 050 | 신규 |
| 7주 | 산전 검사 일정 | video_046, 048 | 신규 |
| 8주 | 주기별 변화 | video_047 | 신규 |
| 12주 | 육아 정책 | video_058 | 수정 (video_017 → 058, 깨진 참조 수정) |
| 21주 | 임산부 운동 | video_001, 008, 006 | 수정 (video_003 → 008, 깨진 참조 수정) |
| 22주 | 배우자 준비 | video_016 | 기존 |
| 25주 | 산전 교육 | video_019 | 기존 |
| 30주 | 신생아 케어 | video_021, 027 | 기존 |
| 31주 | 분만 방법 | video_012, 013 | 기존 |
| 32주 | 출산 준비물 | video_018 | 기존 |
| 34주 | 출산 징후/호흡 | video_014, 020 | 기존 |
| 36주 | 분만 호흡법 | video_007 | 신규 |
| 37주 | 모유수유/트림 | video_022, 023 | 신규 |
| 38주 | 막달 운동 | video_002, 005 | 신규 |
| 39주 | 분만 호흡 | video_020 | 신규 |
| 40주 | 신생아 케어 | video_021, 025 | 신규 |

**잔여 작업:**

- [x] 핵심 주차 영상 매핑 확대 — 초기 4~8주 (5개 주차), 출산 직전 36~40주 (5개 주차) 완료
- [x] 깨진 영상 참조 수정 — video_017(미존재→video_058), video_003(미존재→video_008)
- [x] 중기 주차 추가 매핑 완료 (2026-04-28) — 19개 주차 신규 매핑, **37/37 전체 주차 100% 매핑**

### 동영상 (videos.json) — 2026-04-24 업데이트

| 항목 | 현황 |
|------|------|
| 등록 영상 | 57개 (7개 카테고리) |

| 카테고리 | 영상 수 | 상태 |
|----------|---------|------|
| exercise (임산부 운동) | 9 | ✅ 안정 |
| birth_prep (출산 준비) | 9 | ✅ 안정 |
| newborn_care (신생아 케어) | 9 | ✅ 안정 |
| pregnancy_health (임신 건강 관리) | 9 | ✅ 신규 추가 (초기 증상 3, 입덧 3, 합병증 3) |
| prenatal_checkup (산전 검사) | 9 | ✅ 신규 추가 (기형아 검사 3, 정밀 초음파 3, 검사 일정 3) |
| nutrition (임산부 영양) | 9 | ✅ 신규 추가 (영양제 3, 금지 음식 3, 식단 3) |
| policy (육아 정책) | 3 | ✅ 신규 추가 (정책 총정리 2, 육아휴직 1) |

**수행 작업 (2026-04-24):**
- [x] 오분류 수정 2건 (video_011: hospital_bag→exercise, video_030: newborn_care→birth_prep)
- [x] 중복 채널 참조 수정 5건 (channel_020~026 → 기존 채널로 정리)
- [x] 비출산/육아 채널 영상 삭제 3건 (현대해상, THE HYUNDAI CULTURE, 오키부부)
- [x] 신규 카테고리 4개 + 영상 30개 추가 (pregnancy_health, prenatal_checkup, nutrition, policy)
- [x] VideosContainer.tsx, ChannelCard.tsx 카테고리 맵 업데이트 (7개 카테고리)

**잔여 작업:**
- [x] 유튜브 영상 삭제/비공개 전환 여부 일괄 검증 — 57개 전부 정상 (2026-04-27, oEmbed 스크립트)
- [ ] policy 카테고리 영상 보강 (출산 지원금, 출생신고 등 3~6개 추가 검토)
- [ ] postpartum_recovery(산후 회복), mental_health(정신 건강) 카테고리 추가 검토

### 채널 (channels.json) — 2026-04-27 업데이트

| 항목 | 현황 |
|------|------|
| 등록 채널 | 37개 |
| 썸네일 완비 | **37개** ✅ (전체 수집 완료) |
| 썸네일 미수집 | 0개 |

| 채널 유형 | 수 | 주요 채널 |
|-----------|-----|----------|
| 산부인과/여성병원 | 13 | 우리동산, 호산병원, 서울대병원TV, 아주대병원TV 등 |
| 소아과/육아 전문 | 6 | 하정훈 삐뽀삐뽀, 다울아이TV, 하이담 등 |
| 임산부 운동 | 3 | 모나요가, 안녕 한빛, 하이담 |
| 영양/식단 | 4 | 닥터 조혜진, 김소형채널H, 닥터라이블리, 둘라 로지아 |
| 정책/정보 | 3 | 이민주육아상담소, 보똑TV, 미즈톡톡TV |
| 기타 (육아용품/교육) | 6 | 마이리틀타이거, 맘스클래스 등 |

**수행 작업 (2026-04-24):**
- [x] 신규 채널 18개 추가 (channel_023~043, 중복·비관련 제외)
- [x] 비출산/육아 채널 3개 삭제 (현대해상, THE HYUNDAI CULTURE, 오키부부)
- [x] 중복 채널 참조 5건 정리 (channel_020→012, 021→013, 024→014, 025→015, 026→016)

**수행 작업 (2026-04-27):**
- [x] 채널 썸네일 37개 전체 수집 완료 (`npm run fetch-channel-thumbs`)
- [x] 보롯TV → 보똑TV 채널명 수정, handle `@baby_insure` 추가, youtube_channel_id `UCYQTi1s2t73WrZV5Qx6N2fw` 확인
- [x] 영상 검증 스크립트 생성 (`scripts/verify-videos.ts`) — oEmbed 기반, API 키 불필요

**잔여 작업:** 없음 ✅

### About 페이지 — 2026-04-28 업데이트

- [x] 운영자 필명 "뿌까뽀까" 추가 (프로필 이미지 없음)
- [x] E-E-A-T "콘텐츠 작성 원칙" 섹션 추가 (경험 기반 작성, 공신력 자료 근거, 면책 안내 원칙 3가지)
- [x] JSON-LD 구조화 데이터 추가 (Person + WebSite 스키마)
- [x] 아티클 상세 페이지 author 바이라인 ("뿌까뽀까" → /about 링크)
- [x] 아티클 상세 페이지 Article JSON-LD 스키마 추가 (author, datePublished, dateModified)
