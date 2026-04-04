# Phase 1.75: Google AdSense 승인 준비 — Development Plan

> Generated from: AdSense 승인 요건 분석 + 현재 사이트 상태 점검
> Phase 1.5 기록: [plan.md](../phase-1.5/plan.md)
> Date: 2026-04-03
> Updated: 2026-04-04
> Status: 📋 기획 완료

---

## Overview

Phase 1.5 완료 후, Google AdSense 승인을 받기 위해 필요한 **SEO 기반 작업 + 콘텐츠 보완 + 신뢰성 페이지 추가**를 수행한다.

### 왜 별도 Phase인가

| 이유 | 설명 |
|------|------|
| **Phase 1과 분리** | Phase 1은 핵심 기능 구현, 이 Phase는 수익화 준비에 집중 |
| **Phase 2 전에 완료** | PoC 기간(~6월 말) 내에 AdSense 승인 신청 → 트래픽 + 수익 동시 검증 |
| **AdSense 심사 리드타임** | 승인까지 1~4주 소요 → 빨리 신청해야 PoC 기간 내 결과 확인 가능 |

### 현재 상태 (AS-IS)

| 항목 | 상태 | 비고 |
|------|------|------|
| 오리지널 콘텐츠 | 176+ 항목 | 체크리스트 114 + 타임라인 22 + 베이비페어 40 |
| 개인정보처리방침 | ✅ 있음 | GA4, AdSense 언급 포함 |
| 서비스 이용약관 | ✅ 있음 | 의료 면책 포함 |
| GA4 | ✅ 연동 완료 | 이벤트 추적 동작 |
| AdSense 메타태그 | ✅ 있음 | `layout.tsx` head에 삽입 |
| 커스텀 도메인 | ✅ 완료 | `pregnancy-checklist.com` — CNAME + DNS + HTTPS 모두 설정 완료 |
| About/Contact 페이지 | ✅ 완료 | `/about` 서비스 소개 + 연락처 + 의료 면책 고지 |
| basePath 제거 | ✅ 완료 | `next.config.ts`에서 제거, 에셋 경로 정상 동작 확인 |
| sitemap.xml | ❌ 없음 | 크롤링/색인 불가 |
| robots.txt | ❌ 없음 | 크롤링 지시 없음 |
| 페이지별 메타데이터 | ❌ 루트만 | 개별 페이지 title/description + OG 태그 없음 |
| canonical URL | ❌ 없음 | 중복 콘텐츠 방지 설정 없음 |
| 영상 데이터 | ❌ 빈 배열 | 빈 페이지 = 저품질 사유 |
| 가이드 콘텐츠 | ❌ 없음 | 구조화 데이터만 존재, 설명형 글 없음 |

---

## Scope

**In scope:**

- `public/sitemap.xml` 정적 사이트맵 생성
- `public/robots.txt` 크롤링 설정
- 각 페이지별 고유 메타데이터 (`metadata` export) + Open Graph + canonical URL
- 영상 데이터 초기 큐레이션 (최소 6~9개) — YouTube API 기반 썸네일 노출
- 가이드 콘텐츠 2~3개 작성 (SEO 랜딩 + 콘텐츠 깊이) — **필수**
- Google Search Console 등록 + sitemap 제출
- AdSense 승인 신청

**Out of scope:**

- AdUnit 슬롯 페이지 배치 (승인 후 진행)
- 광고 위치 A/B 테스트 (Phase 3)
- 자동 광고 최적화 (승인 후)

---

## Implementation Steps

### Step 1. 커스텀 도메인 연결 ✅ 완료

> AdSense 승인의 **전제 조건**. `github.io`는 공유 도메인이라 승인 불가.

**완료 항목:**

- [x] 도메인 구매: `pregnancy-checklist.com`
- [x] GitHub Pages 커스텀 도메인 설정 (repo Settings → Pages → Custom domain)
- [x] DNS A 레코드 설정 (GitHub Pages IP: `185.199.108-111.153`)
- [x] DNS CNAME 레코드 설정 (`www` → `melancholy14.github.io`)
- [x] HTTPS 자동 활성화 확인 (Enforce HTTPS 체크)
- [x] `public/CNAME` 파일 생성 (`pregnancy-checklist.com`)
- [x] `next.config.ts`에서 `basePath` 제거
- [x] GitHub Actions 배포 스크립트 CNAME 설정 완료
- [x] 사이트 전체 링크/에셋 경로 정상 동작 확인

### Step 2. sitemap.ts + robots.ts (`force-static`) ✅ 완료

> Google이 사이트를 크롤링하고 색인할 수 있도록 필수 파일 생성.
> `output: 'export'` 환경에서 `export const dynamic = "force-static"` 설정으로 빌드 시 정적 파일로 생성됨.
> `.ts` 방식은 페이지 추가 시 코드에서 관리되므로 수동 XML 편집이 불필요.

**`src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pregnancy-checklist.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/timeline`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/baby-fair`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/weight`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/videos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/guides/hospital-bag`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides/weekly-prep`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
```

**`src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pregnancy-checklist.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
```

> **참고**: 페이지 추가 시 `sitemap.ts`에 URL 항목을 추가하면 빌드 시 자동 반영됨.

### Step 3. About 페이지 ✅ 완료

> `/about` 페이지 이미 구현 완료. 서비스 소개 + 연락처 + 의료 면책 고지 포함.

- [x] 경로: `src/app/about/page.tsx`
- [x] 푸터에 About 링크 추가

### Step 4. 페이지별 메타데이터 + Open Graph + Canonical URL

> 각 페이지가 고유한 title + description + OG 태그를 가져야 Google 색인 품질이 올라감.
> canonical URL로 중복 콘텐츠 방지 + 커스텀 도메인 전환 시 정규화 보장.

| 페이지 | title | description |
|--------|-------|-------------|
| `/` | 출산 준비 체크리스트 - 임신 주차별 준비 가이드 | 임신 주차에 맞춘 출산 준비 체크리스트, 타임라인, 베이비페어 일정을 한눈에 확인하세요. |
| `/timeline` | 임신 주차별 타임라인 & 체크리스트 | 4주부터 40주까지, 주차별로 준비해야 할 항목을 체크리스트와 함께 확인하세요. |
| `/baby-fair` | 베이비페어 일정 모음 | 전국 베이비페어 일정, 장소, 공식 링크를 한곳에서 확인하세요. |
| `/weight` | 임신 체중 기록 & 변화 그래프 | 임신 중 체중 변화를 기록하고 그래프로 한눈에 확인하세요. |
| `/videos` | 임산부 추천 영상 모음 | 임산부 운동, 출산 준비, 신생아 케어 관련 추천 영상을 모아봤습니다. |
| `/about` | 서비스 소개 - 출산 준비 체크리스트 | 출산 준비 체크리스트 서비스의 소개와 연락처입니다. |
| `/guides/hospital-bag` | 출산 가방 필수 준비물 총정리 | 출산 가방에 꼭 넣어야 할 준비물을 카테고리별로 정리했습니다. |
| `/guides/weekly-prep` | 임신 주차별 검사 & 준비 가이드 | 임신 초기부터 출산까지, 주차별로 해야 할 검사와 준비 사항을 안내합니다. |

**각 페이지 공통 메타데이터 구조:**

```ts
export const metadata: Metadata = {
  title: "페이지 제목",
  description: "페이지 설명",
  alternates: {
    canonical: "https://pregnancy-checklist.com/경로",
  },
  openGraph: {
    title: "페이지 제목",
    description: "페이지 설명",
    url: "https://pregnancy-checklist.com/경로",
    siteName: "출산 준비 체크리스트",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://pregnancy-checklist.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "출산 준비 체크리스트",
      },
    ],
  },
};
```

**추가 작업:**

- `public/og-image.png` — OG 공유용 대표 이미지 제작 (1200x630)
- 루트 `layout.tsx`의 `metadata`에 기본 OG + canonical 설정 추가

### Step 5. 영상 데이터 채우기

> 빈 페이지는 "저품질/불충분한 콘텐츠" 거절 사유. 최소 콘텐츠 확보 필요.

**큐레이션 기준:**

| 기준 | 조건 |
|------|------|
| 조회수 | 1만회 이상 |
| 업로드 시점 | 최근 2년 이내 (2024~2026) |
| 길이 | 5분~30분 (너무 짧거나 긴 영상 제외) |
| 콘텐츠 품질 | 전문가(산부인과 의사, 간호사, 공인 트레이너) 또는 검증된 채널 |
| 광고성 | 특정 제품 홍보 목적 영상 제외 |

**카테고리별 최소 수량:**

- 임산부 운동: 2~3개
- 출산 준비: 2~3개
- 신생아 케어: 2~3개

**썸네일 노출 방식 — YouTube API 핫링크 (저작권 안전)**

YouTube 썸네일은 **다운로드하여 자체 서버에 재호스팅하면 안 됨** (저작권 침해 + API 정책 위반).
대신 아래 방식으로 YouTube 서버의 이미지를 직접 참조:

| 방식 | 설명 | 권장도 |
|------|------|--------|
| **YouTube Data API v3** | API 응답의 `snippet.thumbnails` URL을 `<img>`로 표시 | **권장** (공식 경로) |
| **img.youtube.com 패턴** | `https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg` 직접 참조 | 허용 (비공식이나 차단 사례 없음) |
| 자체 서버 재호스팅 | 썸네일 다운로드 후 `public/`에 저장 | **금지** (저작권 침해) |

**준수 사항:**

- 썸네일 클릭 시 반드시 해당 YouTube 영상으로 이동해야 함
- API 응답 데이터 캐싱은 최대 30일, 이후 갱신 필요
- 삭제/비공개 전환된 영상은 즉시 제거해야 함
- YouTube 브랜딩 가이드라인 준수

**구현 방식 (PoC 단계):**

`videos.json`에 `videoId`를 저장하고, 썸네일 URL은 `img.youtube.com` 패턴으로 런타임 생성:

```ts
// 썸네일 URL 생성 (재호스팅 없이 YouTube 서버 직접 참조)
const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
```

**`src/data/videos.json` 스키마:**

```json
[
  {
    "id": "video-001",
    "videoId": "YouTube_VIDEO_ID",
    "title": "영상 제목",
    "category": "exercise | preparation | newborn-care",
    "description": "영상 설명 (1~2줄)",
    "channelName": "채널명",
    "durationMinutes": 15
  }
]
```

### Step 6. 가이드 콘텐츠 (필수)

> 구조화 데이터(리스트)만으로는 "사용자에게 가치 있는 콘텐츠"로 인정받기 어려움.
> AdSense 거절 최다 사유인 "저품질/불충분한 콘텐츠" 대응을 위해 **필수 작성**.
> 각 가이드는 최소 1,000자 이상의 설명형 글로 작성.

**필수 가이드 (2개):**

| 경로 | 주제 | 데이터 소스 |
|------|------|-------------|
| `/guides/hospital-bag` | 출산 가방 꼭 필요한 것만 정리 | 체크리스트 hospital/bag 카테고리 |
| `/guides/weekly-prep` | 임신 주차별 검사 & 준비 가이드 | 타임라인 데이터 (4~40주) |

**선택 가이드 (1개 이상 권장):**

| 경로 | 주제 | 데이터 소스 |
|------|------|-------------|
| `/guides/early-pregnancy` | 임신 초기 필수 검사 총정리 | 타임라인 4~12주 데이터 |
| `/guides/postpartum` | 산후조리원 선택 가이드 | 체크리스트 postpartum 카테고리 |
| `/guides/cost-estimate` | 출산 준비물 비용 총정리 | 체크리스트 데이터 + 가격대 정보 |

**작성 원칙:**

- 기존 데이터를 활용하되 **설명형 글**로 재구성 (단순 리스트 복사 X)
- 실질적 팁, 경험담, 주의사항 등 부가 가치 포함
- 체크리스트/타임라인 페이지로의 내부 링크 포함 (상호 연결)
- 각 가이드 페이지에 고유 메타데이터 + OG 태그 설정

**일정:** 4월 중순 ~ 5월 초 (2주간)

### Step 7. AdSense 승인 신청

> Step 2~6 완료 후 신청.

- Google Search Console에 사이트 등록 + sitemap 제출
- 색인 요청 → 색인된 페이지 수 ≥ 5개 확인
- Lighthouse SEO 점수 90+ 달성 확인
- AdSense 계정에서 사이트 추가 + 소유권 확인 (메타태그 이미 있음)
- 심사 제출 (1~4주 소요)

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/app/sitemap.ts` | 사이트맵 (`force-static`으로 빌드 시 정적 생성) |
| `src/app/robots.ts` | 크롤링 설정 (`force-static`으로 빌드 시 정적 생성) |
| `public/og-image.png` | OG 공유용 대표 이미지 (1200x630) |
| `src/app/guides/hospital-bag/page.tsx` | 출산 가방 가이드 |
| `src/app/guides/weekly-prep/page.tsx` | 주차별 준비 가이드 |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/layout.tsx` | 루트 메타데이터 보강 (OG 태그 + canonical 기본값) |
| `src/app/page.tsx` | 홈 `metadata` export 보강 (OG + canonical) |
| `src/app/timeline/page.tsx` | 페이지 고유 `metadata` + OG + canonical 추가 |
| `src/app/baby-fair/page.tsx` | 페이지 고유 `metadata` + OG + canonical 추가 |
| `src/app/weight/page.tsx` | 페이지 고유 `metadata` + OG + canonical 추가 |
| `src/app/videos/page.tsx` | 페이지 고유 `metadata` + OG + canonical 추가 |
| `src/app/about/page.tsx` | 페이지 고유 `metadata` + OG + canonical 추가 |
| `src/data/videos.json` | 영상 6~9개 초기 데이터 추가 |

---

## 일정 (Timeline)

> PoC 기간: ~2026년 6월 말

| 기간 | 작업 | 상태 |
|------|------|------|
| ~4/3 | Step 1: 커스텀 도메인 연결 | ✅ 완료 |
| ~4/3 | Step 3: About 페이지 | ✅ 완료 |
| 4월 1주 | Step 2: sitemap.xml + robots.txt | 📋 예정 |
| 4월 1~2주 | Step 4: 페이지별 메타데이터 + OG + canonical | 📋 예정 |
| 4월 1~2주 | Step 5: 영상 데이터 큐레이션 + 구현 | 📋 예정 |
| 4월 중순~5월 초 | Step 6: 가이드 콘텐츠 2~3개 작성 | 📋 예정 |
| 5월 초 | GSC 등록 + sitemap 제출 + Lighthouse 검증 | 📋 예정 |
| 5월 중순 | Step 7: AdSense 승인 신청 | 📋 예정 |
| 5월 중순~6월 | 심사 대기 (1~4주) + 트래픽 확보 | 📋 예정 |
| 6월 말 | PoC 결과 확인 (승인 + 수익 검증) | 📋 예정 |

---

## 완료 조건

| # | 조건 | 검증 방법 |
|---|------|----------|
| 1 | 커스텀 도메인으로 사이트 접속 + HTTPS 동작 | ✅ 완료 |
| 2 | `/sitemap.xml` 접속 시 모든 페이지 URL 표시 | 브라우저 확인 |
| 3 | `/robots.txt` 접속 시 sitemap URL 포함 | 브라우저 확인 |
| 4 | `/about` 페이지에 서비스 소개 + 연락처 표시 | ✅ 완료 |
| 5 | 각 페이지 `<title>`, `<meta description>`, OG 태그, canonical URL 확인 | 개발자 도구 |
| 6 | `/videos` 페이지에 영상 6개 이상 표시 (YouTube 썸네일 핫링크) | 브라우저 확인 |
| 7 | 가이드 콘텐츠 2개 이상 게시 (각 1,000자+) | 브라우저 확인 |
| 8 | Google Search Console 등록 + sitemap 제출 + 색인 페이지 ≥ 5개 | GSC 대시보드 |
| 9 | Lighthouse SEO 점수 90 이상 | Lighthouse 감사 |
| 10 | AdSense에서 사이트 추가 + 소유권 확인 통과 | AdSense 대시보드 |
| 11 | 빌드 성공 (`next build`) | CI |
| 12 | Playwright E2E 테스트 통과 (메타태그 + 페이지 렌더링 검증) | CI |

---

## 의존성 & 순서

```
Step 1 (커스텀 도메인) ✅ 완료
Step 3 (About 페이지) ✅ 완료
    ↓
Step 2 (sitemap + robots) ← 도메인 확정 완료, 바로 진행 가능
Step 4 (메타데이터 + OG) ← 독립 작업, 병렬 진행 가능
Step 5 (영상 데이터) ← 독립 작업, 병렬 진행 가능
    ↓
Step 6 (가이드 콘텐츠) ← 4월 중순~5월 초
    ↓
Step 7 (AdSense 신청) ← 전체 완료 + GSC 색인 확인 후
```

Step 2, 4, 5는 **병렬 진행** 가능.

---

## 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| AdSense 심사 거절 | 수익화 지연 | 거절 사유 확인 → 보완 → 재신청 (횟수 제한 없음) |
| "저품질 콘텐츠" 거절 | 가장 흔한 사유 | 가이드 콘텐츠 2~3개 필수 작성 + 영상 데이터 확보 |
| "트래픽 부족" 거절 | PoC 초기에 발생 가능 | GSC 색인 확인 + SNS/커뮤니티 공유로 초기 트래픽 확보 |
| static export에서 동적 sitemap 미동작 | sitemap.xml 미생성 | `force-static` 설정으로 해결 완료. 페이지 추가 시 `sitemap.ts` 코드만 수정 |
| YouTube 썸네일 정책 변경 | 썸네일 미노출 | `img.youtube.com` 패턴 → YouTube Data API v3로 전환 (API 키 필요) |
| OG 이미지 미제작 | SNS 공유 시 미리보기 없음 → 초기 트래픽 확보 어려움 | 간단한 OG 이미지라도 제작 (Figma/Canva 활용) |
| 가이드 콘텐츠 작성 지연 | AdSense 신청 시기 지연 | 필수 2개에 집중, 선택 가이드는 승인 후 추가 |
